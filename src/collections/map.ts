import type { ReactiveCollection } from "./typings";

import { invoke } from "../utils";

/**
 * A reactive map inherited from `Map`.
 * Changes to the map will be notified to subscribers of `watch`.
 *
 * @example
 * ```ts
 * import { ReactiveMap, fromCollection } from "value-enhancer/collections"
 *
 * const map = new ReactiveMap();
 *
 * const item$ = fromCollection(map, "someKey"); // watch the item at "someKey"
 *
 * console.log(item$.value); // undefined
 *
 * map.set("someKey", "someValue");
 *
 * console.log(item$.value); // "someValue"
 * ```
 */
export class ReactiveMap<TKey, TValue>
  extends Map<TKey, TValue>
  implements ReactiveCollection<TKey, TValue>
{
  public constructor(entries?: readonly (readonly [TKey, TValue])[] | null) {
    super(entries);
  }

  private _watchers_ = new Set<(key?: TKey) => void>();

  public watch(watcher: (key?: TKey) => void): () => void {
    this._watchers_.add(watcher);
    return () => this.unwatch(watcher);
  }

  public unwatch(watcher: (...args: any[]) => any): void {
    this._watchers_.delete(watcher);
  }

  public notify(key?: TKey): void {
    // watchers may not exist during super constructor call
    if (this._watchers_) {
      for (const sub of this._watchers_) {
        invoke(sub, key);
      }
    }
  }

  public override delete(key: TKey): boolean {
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

  public override set(key: TKey, value: TValue): this {
    const isDirty = !this.has(key) || this.get(key) !== value;
    super.set(key, value);
    if (isDirty) {
      this.notify(key);
    }
    return this;
  }

  public dispose(): void {
    this._watchers_.clear();
  }

  /**
   * Replace all entries in the Map.
   *
   * @returns Deleted entries.
   */
  public replace(
    entries: Iterable<readonly [TKey, TValue]>
  ): Map<TKey, TValue> {
    const cached = new Map(this);
    super.clear();
    let isDirty = false;
    for (const [key, value] of entries) {
      isDirty = isDirty || !cached.has(key) || cached.get(key) !== value;
      super.set(key, value);
      cached.delete(key);
    }
    if (isDirty || cached.size > 0) {
      this.notify();
    }
    return cached;
  }
}
