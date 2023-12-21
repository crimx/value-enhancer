import { readonlyVal } from "../readonly-val";
import type { ReadonlyVal, ValSetValue } from "../typings";
import { SET$ } from "./utils";

/**
 * A reactive set inherited from `Set`.
 * Changes to the set will be notified to subscribers of `watch`.
 *
 * @example
 * ```ts
 * import { ReactiveSet, fromCollection } from "value-enhancer/collections"
 *
 * const set = new ReactiveSet();
 *
 * const item$ = fromCollection(map, "someValue"); // watch the existence of "someValue"
 *
 * console.log(item$.value); // false
 *
 * map.add("someValue");
 *
 * console.log(item$.value); // true
 * ```
 */
export class ReactiveSet<TValue> extends Set<TValue> {
  public constructor(entries?: readonly TValue[] | null) {
    super(entries);

    const [val, setVal] = readonlyVal(this, { equal: false });
    this.$ = val;
    this[SET$] = setVal;
  }

  public readonly $: ReadonlyVal<this>;

  private [SET$]?: ValSetValue<this>;

  public override delete(key: TValue): boolean {
    const deleted = super.delete(key);
    if (deleted) {
      this[SET$]?.(this);
    }
    return deleted;
  }

  public override clear(): void {
    if (this.size > 0) {
      super.clear();
      this[SET$]?.(this);
    }
  }

  public override add(value: TValue): this {
    const isDirty = !this.has(value);
    super.add(value);
    if (isDirty) {
      this[SET$]?.(this);
    }
    return this;
  }

  public dispose(): void {
    this.$.dispose();
  }

  /**
   * Replace all entries in the Set.
   *
   * @returns Deleted entries.
   */
  public replace(entries: Iterable<TValue>): Set<TValue> {
    const cached = new Set(this);
    super.clear();
    let isDirty = false;
    for (const value of entries) {
      isDirty = isDirty || cached.delete(value);
      super.add(value);
    }
    if (isDirty || cached.size > 0) {
      this[SET$]?.(this);
    }
    return cached;
  }
}
