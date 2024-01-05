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
export class ReactiveMap<TKey, TValue> extends Map<TKey, TValue> {
  public constructor(entries?: readonly (readonly [TKey, TValue])[] | null) {
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

  /**
   * A readonly val with value of `this`.
   *
   * To update the entire reactive map in place, use `map.replace()`.
   */
  public readonly $: ReadonlyVal<this>;

  #notify: () => void;

  public override delete(key: TKey): boolean {
    const deleted = super.delete(key);
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

  /**
   * Replace all entries in the Map.
   *
   * @returns Deleted entries.
   */
  public replace(
    entries: Iterable<readonly [TKey, TValue]>
  ): Iterable<readonly [TKey, TValue]> {
    const cached = new Map(this);
    super.clear();
    let isDirty = false;
    for (const [key, value] of entries) {
      isDirty = isDirty || !cached.has(key) || cached.get(key) !== value;
      super.set(key, value);
      cached.delete(key);
    }
    if (isDirty || cached.size > 0) {
      this.#notify();
    }
    return cached.entries();
  }

  public dispose(): void {
    this.$.dispose();
  }
}

/**
 * A readonly reactive map inherited from `Map`.
 * Changes to the map will be notified to subscribers of `map.$`.
 */
export type ReadonlyReactiveMap<TKey, TValue> = Omit<
  ReactiveMap<TKey, TValue>,
  "$" | "delete" | "clear" | "set" | "replace"
> & {
  readonly: ReadonlyVal<ReadonlyReactiveMap<TKey, TValue>>;
};
