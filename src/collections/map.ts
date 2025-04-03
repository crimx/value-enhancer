import type { ReadonlyVal } from "value-enhancer";
import { readonlyVal, strictEqual } from "value-enhancer";

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
   * Rename a key in the Map. Will not trigger `onDeleted` callback for the old key.
   *
   * If the oldKey does not exist, this method does nothing. If the newKey already exists, it will be overwritten.
   *
   * @returns `true` if oldKey exists.
   */
  rename(oldKey: TKey, newKey: TKey): boolean;

  /**
   * Replace all entries in the Map. Will not trigger `onDeleted` callback for values that stay in the map.
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

export interface ReactiveMapConfig<TValue> {
  /**
   * A callback function that will be called when an entry is deleted.
   *
   * Entries are considered deleted from the map when:
   * - `map.delete()` or `map.batchDelete()` entries.
   * - `map.set()`, `map.batchSet()` or `map.replace()` causing old entries being deleted.
   * - `map.clear()` is called.
   * - `map.dispose()` is called.
   */
  onDeleted?: (value: TValue) => void;
}

class ReactiveMapImpl<TKey, TValue>
  extends Map<TKey, TValue>
  implements ReactiveMap<TKey, TValue>
{
  public constructor(
    entries?: Iterable<readonly [TKey, TValue]> | null,
    config?: ReactiveMapConfig<TValue>
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

  #onDeleted?: (value: TValue) => void;

  #delete(key: TKey): boolean {
    if (this.#onDeleted) {
      if (super.has(key)) {
        const value = super.get(key)!;
        super.delete(key);
        this.#onDeleted(value);
        return true;
      }
      return false;
    }
    return super.delete(key);
  }

  #clear(): void {
    if (this.#onDeleted) {
      const deleted = new Set(this.values());
      super.clear();
      for (const value of deleted) {
        this.#onDeleted(value);
      }
    } else {
      super.clear();
    }
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
      this.#clear();
      this.#notify();
    }
  }

  #set(key: TKey, value: TValue): boolean {
    if (this.has(key)) {
      const oldValue = this.get(key)!;
      if (strictEqual(oldValue, value)) {
        return false;
      }
      super.set(key, value);
      if (this.#onDeleted) {
        this.#onDeleted(oldValue);
      }
    } else {
      super.set(key, value);
    }
    return true;
  }

  public override set(key: TKey, value: TValue): this {
    if (this.#set(key, value)) {
      this.#notify();
    }
    return this;
  }

  public batchSet(entries: Iterable<readonly [TKey, TValue]>): this {
    let isDirty = false;
    for (const [key, value] of entries) {
      isDirty = this.#set(key, value) || isDirty;
    }
    if (isDirty) {
      this.#notify();
    }
    return this;
  }

  public rename(oldKey: TKey, newKey: TKey): boolean {
    if (!strictEqual(oldKey, newKey)) {
      const value = this.get(oldKey);
      if (super.delete(oldKey)) {
        this.set(newKey, value!);
        return true;
      }
    }
    return false;
  }

  public replace(entries: Iterable<readonly [TKey, TValue]>): Iterable<TValue> {
    const oldMap = new Map(this);
    const deletedValues = new Set<TValue>(this.values());
    let hasNewValue = false;
    super.clear();

    for (const [key, value] of entries) {
      super.set(key, value);
      deletedValues.delete(value);
      hasNewValue =
        hasNewValue || !oldMap.has(key) || !Object.is(oldMap.get(key), value);
      oldMap.delete(key);
    }

    if (hasNewValue || oldMap.size > 0 || deletedValues.size > 0) {
      if (this.#onDeleted) {
        for (const value of deletedValues) {
          this.#onDeleted(value);
        }
      }
      this.#notify();
    }

    return deletedValues.values();
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
    if (this.size > 0) {
      this.#clear();
    }
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
  config?: ReactiveMapConfig<TValue>
): ReactiveMap<TKey, TValue> => new ReactiveMapImpl(entries, config);
