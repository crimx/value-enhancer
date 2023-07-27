import type { ReactiveCollection } from "./typings";

import { invoke } from "../utils";

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
export class ReactiveSet<TValue>
  extends Set<TValue>
  implements ReactiveCollection<TValue, boolean>
{
  public constructor(entries?: readonly TValue[] | null) {
    super(entries);

    this.get = this.has;
  }

  private _watchers_ = new Set<(value?: TValue) => void>();

  public watch(watcher: (value?: TValue) => void): () => void {
    this._watchers_.add(watcher);
    return () => this.unwatch(watcher);
  }

  public unwatch(watcher: (...args: any[]) => any): void {
    this._watchers_.delete(watcher);
  }

  public notify(value?: TValue): void {
    // watchers may not exist during super constructor call
    if (this._watchers_) {
      for (const sub of this._watchers_) {
        invoke(sub, value);
      }
    }
  }

  /**
   * @alias Set#has
   */
  public get: (value: TValue) => boolean;

  public override delete(key: TValue): boolean {
    const deleted = super.delete(key);
    if (deleted) {
      this.notify(key);
    }
    return deleted;
  }

  public override clear(): void {
    if (this.size > 0) {
      super.clear();
      this.notify();
    }
  }

  public override add(value: TValue): this {
    const isDirty = !this.has(value);
    super.add(value);
    if (isDirty) {
      this.notify(value);
    }
    return this;
  }

  public dispose(): void {
    this._watchers_.clear();
  }

  /**
   * Replace all entries in the Set.
   */
  public replace(entries: Iterable<TValue>): this {
    super.clear();
    for (const value of entries) {
      super.add(value);
    }
    this.notify();
    return this;
  }
}
