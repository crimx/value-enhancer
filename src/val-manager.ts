import type { ReadonlyVal } from "./readonly-val";

/**
 * Manage life-cycles of a list of Vals (e.g. auto cleanup).
 *
 * @example
 * ```ts
 * const valManager = new ValManager();
 * const val1 = valManager.attach(new Val("12345"));
 * const val2 = valManager.attach(new Val(""));
 *
 * valManager.destroy(); // val1.destroy() and val2.destroy() are called
 * ```
 */
export class ValManager {
  public readonly vals = new Set<ReadonlyVal>();

  /** Attach a val to manager */
  public attach<V extends ReadonlyVal>(val: V): V {
    this.vals.add(val);
    return val;
  }

  /** Detach a val from manager */
  public detach<V extends ReadonlyVal>(val: V): V {
    this.vals.delete(val);
    return val;
  }

  public destroy(): void {
    this.vals.forEach(destroyVal);
    this.vals.clear();
  }
}

function destroyVal(val: ReadonlyVal): void {
  val.destroy();
}
