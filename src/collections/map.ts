import { readonlyVal } from "../readonly-val";
import type { ReadonlyVal } from "../typings";

/**
 * A reactive map inherited from `Map`.
 * Changes to the map will be notified to subscribers of `map.$`.
 */
export interface ReactiveMap<TKey, TValue> extends Map<TKey, TValue> {
  /**
   * A readonly val with value of `this`.
   *
   * To update the entire reactive map in place, use `map.replace()`.
   */
  readonly $: ReadonlyVal<this>;

  /**
   * Delete multiple entries from the Map.
   */
  batchDelete(keys: Iterable<TKey>): boolean;

  /**
   * Set multiple entries in the Map.
   */
  batchSet(entries: Iterable<readonly [TKey, TValue]>): this;

  /**
   * Replace all entries in the Map.
   *
   * @returns Deleted values.
   */
  replace(entries: Iterable<readonly [TKey, TValue]>): Iterable<TValue>;

  toJSON(): object;

  /**
   * Dispose the map.
   */
  dispose(): void;
}

/**
 * A readonly reactive map inherited from `Map`.
 * Changes to the map will be notified to subscribers of `map.$`.
 */
export type ReadonlyReactiveMap<TKey, TValue> = Pick<
  ReactiveMap<TKey, TValue>,
  | typeof Symbol.iterator
  | typeof Symbol.toStringTag
  | "toJSON"
  | "dispose"
  | "forEach"
  | "get"
  | "has"
  | "size"
  | "entries"
  | "keys"
  | "values"
> & {
  readonly $: ReadonlyVal<ReadonlyReactiveMap<TKey, TValue>>;
};

export interface ReactiveMapConfig<TKey, TValue> {
  /**
   * A callback function that will be called when an entry is deleted.
   */
  onDeleted?: (value: TValue, key: TKey) => void;
}

class ReactiveMapImpl<TKey, TValue>
  extends Map<TKey, TValue>
  implements ReactiveMap<TKey, TValue>
{
  public constructor(
    entries?: Iterable<readonly [TKey, TValue]> | null,
    config?: ReactiveMapConfig<TKey, TValue>
  ) {
    super();

    if (config) {
      this.#onDeleted = config.onDeleted;
    }

    const [$, set$] = readonlyVal(this, { equal: false });
    this.$ = $;
    this.#notify = () => set$(this);

    if (entries) {
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    }
  }

  public readonly $: ReadonlyVal<this>;

  #notify: () => void;

  #onDeleted?: (value: TValue, key: TKey) => void;

  #delete(key: TKey): boolean {
    if (this.#onDeleted) {
      if (super.has(key)) {
        const value = super.get(key)!;
        super.delete(key);
        this.#onDeleted(value, key);
        return true;
      }
      return false;
    }
    return super.delete(key);
  }

  public override delete(key: TKey): boolean {
    const deleted = this.#delete(key);
    if (deleted) {
      this.#notify();
    }
    return deleted;
  }

  public batchDelete(keys: Iterable<TKey>): boolean {
    let deleted = false;
    for (const key of keys) {
      deleted = this.#delete(key) || deleted;
    }
    if (deleted) {
      this.#notify();
    }
    return deleted;
  }

  public override clear(): void {
    if (this.size > 0) {
      if (this.#onDeleted) {
        for (const [key, value] of this) {
          super.delete(key);
          this.#onDeleted(value, key);
        }
      } else {
        super.clear();
      }
      this.#notify();
    }
  }

  public override set(key: TKey, value: TValue): this {
    const isDirty = !this.has(key) || this.get(key) !== value;
    super.set(key, value);
    if (isDirty) {
      this.#notify();
    }
    return this;
  }

  public batchSet(entries: Iterable<readonly [TKey, TValue]>): this {
    let isDirty = false;
    for (const [key, value] of entries) {
      isDirty = isDirty || !this.has(key) || this.get(key) !== value;
      super.set(key, value);
    }
    if (isDirty) {
      this.#notify();
    }
    return this;
  }

  public replace(entries: Iterable<readonly [TKey, TValue]>): Iterable<TValue> {
    const oldMap = new Map(this);
    const deleted = new Map<TKey, TValue>(this);
    let isDirty = false;
    super.clear();

    for (const [key, value] of entries) {
      isDirty =
        isDirty || !oldMap.has(key) || !Object.is(oldMap.get(key), value);
      super.set(key, value);
      deleted.delete(key);
    }

    if (isDirty || oldMap.size !== this.size) {
      if (this.#onDeleted) {
        for (const [key, value] of deleted) {
          this.#onDeleted(value, key);
        }
      }
      this.#notify();
    }

    return deleted.values();
  }

  public toJSON(): object {
    const result: Record<any, any> = {};
    for (const [key, value] of this) {
      if (key != null) {
        const k = String(key);
        const v = value as
          | undefined
          | null
          | { toJSON?: (key: string) => object };
        result[k] = v && v.toJSON ? v.toJSON(k) : v;
      }
    }
    return result;
  }

  public dispose(): void {
    this.$.dispose();
    this.clear();
  }
}

/**
 * Create a new ReactiveMap.
 *
 * @example
 * ```ts
 * import { val, flatten } from "value-enhancer";
 * import { reactiveMap } from "value-enhancer/collections";
 *
 * const map = reactiveMap();
 * const v = val("someValue");
 * const item$ = flatten(map.$, map => map.get("someKey")); // watch the item at "someKey"
 *
 * console.log(item$.value); // undefined
 * map.set("someKey", v);
 * console.log(item$.value); // "someValue"
 * v.set("someValue2");
 * console.log(item$.value); // "someValue2"
 * ```
 */
export const reactiveMap = <TKey, TValue>(
  entries?: Iterable<readonly [TKey, TValue]> | null,
  config?: ReactiveMapConfig<TKey, TValue>
): ReactiveMap<TKey, TValue> => new ReactiveMapImpl(entries, config);
