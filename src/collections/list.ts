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
  private _data_: TValue[];

  public constructor(arrayLike?: ArrayLike<TValue>) {
    this._data_ = arrayLike ? Array.from(arrayLike) : [];
  }

  private _watchers_ = new Set<(key?: number) => void>();

  public watch(watcher: (key?: number) => void): () => void {
    this._watchers_.add(watcher);
    return () => this.unwatch(watcher);
  }

  public unwatch(watcher: (...args: any[]) => any): void {
    this._watchers_.delete(watcher);
  }

  public notify(key?: number): void {
    for (const sub of this._watchers_) {
      invoke(sub, key);
    }
  }

  /**
   * Get the internal array. Use it as a read-only array.
   * Should not modify the array in place directly. Use methods on the list instead.
   */
  public get array(): ReadonlyArray<TValue> {
    return this._data_;
  }

  /**
   * Gets or sets the length of the array. This is a number one higher than the highest index in the array.
   */
  public get length(): number {
    return this._data_.length;
  }

  public set length(len: number) {
    this._data_.length = len;
  }

  public [Symbol.iterator](): IterableIterator<TValue> {
    return this._data_[Symbol.iterator]();
  }

  /**
   * @see Array#entries
   * Returns an iterable of key, value pairs for every entry in the list.
   */
  public entries(): IterableIterator<[number, TValue]> {
    return this._data_.entries();
  }

  /**
   * @see Array#values
   * Returns an iterable of values in the list.
   */
  public values(): IterableIterator<TValue> {
    return this._data_.values();
  }

  /**
   * @see Array#keys
   * Returns an iterable of keys in the list.
   */
  public keys(): IterableIterator<number> {
    return this._data_.keys();
  }

  /**
   * Same as array[index].
   * Returns the item located at the specified index.
   * @param index The zero-based index of the desired code unit.
   *        A negative index will be ignored.
   */
  public get(index: number): TValue | undefined {
    if (index >= 0) {
      return this._data_[index];
    }
  }

  /**
   * @returns The first element of the list.
   */
  public first(): TValue | undefined {
    if (this._data_.length) {
      return this._data_[0];
    }
  }

  /**
   * @returns The last element of the list.
   */
  public last(): TValue | undefined {
    if (this._data_.length) {
      return this._data_[this.length - 1];
    }
  }

  /**
   * @see Array#push
   * Appends new elements to the end of the list, and returns the new length of the list.
   * @param items New elements to add to the list.
   */
  public push(...items: TValue[]): void {
    this._data_.push(...items);
    if (items.length == 1) {
      this.notify(this._data_.length - 1);
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
    if (this._data_.length > 0) {
      const result = this._data_.pop();
      this.notify(this._data_.length);
      return result;
    }
  }

  /**
   * Inserts new elements at the start of the list, and returns the new length of the list.
   * @param items Elements to insert at the start of the list.
   * @see Array#unshift
   */
  public pushHead(...items: TValue[]): void {
    this._data_.unshift(...items);
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
    if (this._data_.length > 0) {
      const result = this._data_.shift();
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
      this._data_[index] = item;
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
      this._data_.splice(index, 0, ...items);
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
      const result = this._data_.splice(index, count);
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
      this._data_.length = 0;
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
    this._data_.length = 0;
    let isDirty = false;
    for (const value of Array.from(arrayLike)) {
      isDirty = isDirty || cached.delete(value);
      this._data_.push(value);
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
    if (this._data_.length > 1) {
      this._data_.reverse();
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
    if (this._data_.length > 1) {
      this._data_.sort(compareFn);
      this.notify();
    }
    return this;
  }

  /**
   * @see Array#toString
   * Returns a string representation of the list.
   */
  public toString(): string {
    return this._data_.toString();
  }

  /**
   * @see Array#toLocaleString
   * Returns a string representation of the list. The elements are converted to string using their toLocaleString methods.
   */
  public toLocaleString(): string {
    return this._data_.toLocaleString();
  }

  public toJSON(): unknown {
    return this._data_;
  }
}
