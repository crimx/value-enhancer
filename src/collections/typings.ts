export interface ReactiveCollection<TKey = any, TValue = any> {
  /**
   * Watch collection value changes.
   * @param watcher Watcher to add.
   *        The Watcher will receive an optional key whose value may have changed.
   *        If the key is not provided, the collection do not know which values have changed.
   * @returns Disposer to remove the watcher.
   */
  watch(watcher: (key?: TKey) => void): () => void;
  /**
   * Remove a watcher.
   * @param watcher Watcher to remove. If not provided, all watchers are removed.
   */
  unwatch(watcher?: (...args: any[]) => any): void;
  /**
   * Notify watchers that some values may have changed.
   * @param key Optional key whose value may have changed.
   *        If not provided, the collection do not know which values have changed.
   */
  notify(key?: TKey): void;
  /**
   * Get the value associated with the given key.
   * @param key Key to get the value for.
   * @returns The value associated with the given key, or undefined if the key is not in the collection.
   */
  get(key: TKey): TValue | undefined;
}
