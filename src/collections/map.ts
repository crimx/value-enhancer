import { readonlyVal } from "../readonly-val";
import type { ReadonlyVal } from "../typings";

/**
 * A reactive map inherited from `Map`.
 * Changes to the map will be notified to subscribers of `map.$`.
 *
 * @example
 * ```ts
 * import { val, flatten } from "value-enhancer";
 * import { ReactiveMap } from "value-enhancer/collections";
 *
 * const map = new ReactiveMap();
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

  /**
   * Dispose the map.
   */
  dispose(): void;
}

/**
 * A readonly reactive map inherited from `Map`.
 * Changes to the map will be notified to subscribers of `map.$`.
 */
export type ReadonlyReactiveMap<TKey, TValue> = Omit<
  ReactiveMap<TKey, TValue>,
  "$" | "delete" | "clear" | "set" | "batchSet" | "replace"
> & {
  readonly $: ReadonlyVal<ReadonlyReactiveMap<TKey, TValue>>;
};

class ReactiveMapImpl<TKey, TValue>
  extends Map<TKey, TValue>
  implements ReactiveMap<TKey, TValue>
{
  public constructor(entries?: Iterable<readonly [TKey, TValue]> | null) {
    super();

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

  public override delete(key: TKey): boolean {
    const deleted = super.delete(key);
    if (deleted) {
      this.#notify();
    }
    return deleted;
  }

  public batchDelete(keys: Iterable<TKey>): boolean {
    let deleted = false;
    for (const key of keys) {
      deleted = super.delete(key) || deleted;
    }
    if (deleted) {
      this.#notify();
    }
    return deleted;
  }

  public override clear(): void {
    if (this.size > 0) {
      super.clear();
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
    const deleted = new Set<TValue>(this.values());
    let isDirty = false;
    super.clear();

    for (const [key, value] of entries) {
      isDirty =
        isDirty || !oldMap.has(key) || !Object.is(oldMap.get(key), value);
      super.set(key, value);
      deleted.delete(value);
    }

    if (isDirty || oldMap.size !== this.size) {
      this.#notify();
    }
    return deleted.values();
  }

  public dispose(): void {
    this.$.dispose();
  }
}

export const reactiveMap = <TKey, TValue>(
  entries?: Iterable<readonly [TKey, TValue]> | null
): ReactiveMap<TKey, TValue> => new ReactiveMapImpl(entries);
