import { invoke } from "../utils";
import type { ReactiveCollection } from "./typings";

/**
 * A reactive list. Similar to an Array except bracket-notation(e.g. `arr[0]`) is not allowed to get/set elements.
 * Changes to the map will be notified to subscribers of `watch`.
 *
 * @example
 * ```ts
 * import { ReactiveList, fromCollection } from "value-enhancer/collections"
 *
 * const list = new ReactiveList(["a", "b", "c"]);
 *
 * const item$ = fromCollection(list, 2); // watch the item at index 2
 *
 * console.log(item$.value); // "c"
 *
 * list.set(2, "d");
 *
 * console.log(item$.value); // "d"
 * ```
 */
export class ReactiveList<TValue>
  implements ReactiveCollection<number, TValue>
{
  #data: TValue[];

  public constructor(arrayLike?: ArrayLike<TValue>) {
    this.#data = arrayLike ? Array.from(arrayLike) : [];
  }

  #watchers = new Set<(key?: number) => void>();

  public watch(watcher: (key?: number) => void): () => void {
    this.#watchers.add(watcher);
    return () => this.unwatch(watcher);
  }

  public unwatch(watcher: (...args: any[]) => any): void {
    this.#watchers.delete(watcher);
  }

  public notify(key?: number): void {
    for (const sub of this.#watchers) {
      invoke(sub, key);
    }
  }

  /**
   * Get the internal array. Use it as a read-only array.
   * Should not modify the array in place directly. Use methods on the list instead.
   */
  public get array(): ReadonlyArray<TValue> {
    return this.#data;
  }

  /**
   * Gets or sets the length of the array. This is a number one higher than the highest index in the array.
   */
  public get length(): number {
    return this.#data.length;
  }

  public set length(len: number) {
    this.#data.length = len;
  }

  public [Symbol.iterator](): IterableIterator<TValue> {
    return this.#data[Symbol.iterator]();
  }

  /**
   * @see Array#entries
   * Returns an iterable of key, value pairs for every entry in the list.
   */
  public entries(): IterableIterator<[number, TValue]> {
    return this.#data.entries();
  }

  /**
   * @see Array#values
   * Returns an iterable of values in the list.
   */
  public values(): IterableIterator<TValue> {
    return this.#data.values();
  }

  /**
   * @see Array#keys
   * Returns an iterable of keys in the list.
   */
  public keys(): IterableIterator<number> {
    return this.#data.keys();
  }

  /**
   * Same as array[index].
   * Returns the item located at the specified index.
   * @param index The zero-based index of the desired code unit.
   *        A negative index will be ignored.
   */
  public get(index: number): TValue | undefined {
    if (index >= 0) {
      return this.#data[index];
    }
  }

  /**
   * @returns The first element of the list.
   */
  public first(): TValue | undefined {
    if (this.#data.length) {
      return this.#data[0];
    }
  }

  /**
   * @returns The last element of the list.
   */
  public last(): TValue | undefined {
    if (this.#data.length) {
      return this.#data[this.length - 1];
    }
  }

  /**
   * @see Array#push
   * Appends new elements to the end of the list, and returns the new length of the list.
   * @param items New elements to add to the list.
   */
  public push(...items: TValue[]): void {
    this.#data.push(...items);
    if (items.length == 1) {
      this.notify(this.#data.length - 1);
    } else if (items.length > 1) {
      this.notify();
    }
  }

  /**
   * @see Array#pop
   * Removes the last element from the list and returns it.
   * If the list is empty, undefined is returned and the list is not modified.
   */
  public pop(): TValue | undefined {
    if (this.#data.length > 0) {
      const result = this.#data.pop();
      this.notify(this.#data.length);
      return result;
    }
  }

  /**
   * Inserts new elements at the start of the list, and returns the new length of the list.
   * @param items Elements to insert at the start of the list.
   * @see Array#unshift
   */
  public pushHead(...items: TValue[]): void {
    this.#data.unshift(...items);
    if (items.length > 0) {
      this.notify();
    }
  }

  /**
   * Removes the first element from the list and returns it.
   * If the list is empty, undefined is returned and the list is not modified.
   * @see Array#shift
   */
  public popHead(): TValue | undefined {
    if (this.#data.length > 0) {
      const result = this.#data.shift();
      this.notify();
      return result;
    }
  }

  /**
   * Sets new element to the list at specific index in place of the existing element.
   * @param index The zero-based location in the list at which to insert element.
   *        A negative index will be ignored.
   * @param item Element to insert into the list.
   */
  public set(index: number, item: TValue): void {
    if (index >= 0) {
      this.#data[index] = item;
      this.notify(index);
    }
  }

  /**
   * Inserts new elements to the list. Pushes existing elements to the right.
   * @param index The zero-based location in the list from which to start inserting elements.
   *        A negative index will be ignored.
   * @param items Elements to insert into the list.
   */
  public insert(index: number, ...items: TValue[]): void {
    if (index >= 0 && items.length > 0) {
      this.#data.splice(index, 0, ...items);
      this.notify();
    }
  }

  /**
   * Removes elements from the list starting from the specified index.
   * @param index The zero-based location in the list from which to start deleting elements.
   *        A negative index will be ignored.
   * @param count The number of elements to remove. Default 1.
   * @returns An array containing the elements that were deleted.
   */
  public delete(index: number, count = 1): void {
    if (index >= 0 && count >= 1) {
      const result = this.#data.splice(index, count);
      if (result.length === 1) {
        this.notify(index);
      } else if (result.length > 1) {
        this.notify();
      }
    }
  }

  /**
   * Removes all elements from the list.
   */
  public clear(): this {
    if (this.length) {
      this.#data.length = 0;
      this.notify();
    }
    return this;
  }

  /**
   * Replace all elements in the list.
   * @param arrayLike An array-like object to replace the elements in the list.
   * @returns deleted values
   */
  public replace(arrayLike: ArrayLike<TValue>): TValue[] {
    const cached = new Set(this);
    this.#data.length = 0;
    let isDirty = false;
    for (const value of Array.from(arrayLike)) {
      isDirty = isDirty || cached.delete(value);
      this.#data.push(value);
    }
    if (isDirty || cached.size > 0) {
      this.notify();
    }
    return [...cached];
  }

  /**
   * @see Array#reverse
   * Reverses the elements in the list in place.
   */
  public reverse(): this {
    if (this.#data.length > 1) {
      this.#data.reverse();
      this.notify();
    }
    return this;
  }

  /**
   * @see Array#sort
   * Sorts the list in place.
   * @param compareFn Function used to determine the order of the elements. It is expected to return
   * a negative value if the first argument is less than the second argument, zero if they're equal, and a positive
   * value otherwise. If omitted, the elements are sorted in ascending, ASCII character order.
   * ```ts
   * [11,2,22,1].sort((a, b) => a - b)
   * ```
   */
  public sort(compareFn?: (a: TValue, b: TValue) => number): this {
    if (this.#data.length > 1) {
      this.#data.sort(compareFn);
      this.notify();
    }
    return this;
  }

  /**
   * @see Array#toString
   * Returns a string representation of the list.
   */
  public toString(): string {
    return this.#data.toString();
  }

  /**
   * @see Array#toLocaleString
   * Returns a string representation of the list. The elements are converted to string using their toLocaleString methods.
   */
  public toLocaleString(): string {
    return this.#data.toLocaleString();
  }

  public toJSON(): unknown {
    return this.#data;
  }
}
