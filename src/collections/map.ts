import type { ReactiveCollection } from "./typings";

import { invoke } from "../utils";

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
   */
  public replace(entries: Iterable<readonly [TKey, TValue]>): this {
    super.clear();
    for (const [key, value] of entries) {
      super.set(key, value);
    }
    this.notify();
    return this;
  }
}
