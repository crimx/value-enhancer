import { readonlyVal } from "../readonly-val";
import type { ReadonlyVal } from "../typings";

/**
 * A reactive list. Similar to an Array except bracket-notation(e.g. `arr[0]`) is not allowed to get/set elements.
 * Changes to the list will be notified to subscribers of `list.$`.
 *
 * @example
 * ```ts
 * import { derive } from "value-enhancer";
 * import { ReactiveList } from "value-enhancer/collections";
 *
 * const list = new ReactiveList(["a", "b", "c"]);
 * const item$ = derive(list.$, list => list.get(2)); // watch the item at index 2
 *
 * console.log(item$.value); // "c"
 * list.set(2, "d");
 * console.log(item$.value); // "d"
 * ```
 */
export class ReactiveList<TValue> {
  public constructor(items?: Iterable<TValue> | null) {
    const [$, set$] = readonlyVal<ReadonlyArray<TValue>>(
      items ? [...items] : [],
      { equal: false }
    );
    this.$ = $;
    this.#notify = () => set$(this.$.value);
  }

  /**
   * A readonly val with value of the internal readonly array.
   *
   * To update the entire array in place, use `list.replace()`.
   */
  public readonly $: ReadonlyVal<ReadonlyArray<TValue>>;

  #notify: () => void;

  /**
   * Get the internal array. Use it as a read-only array.
   * Should not modify the array in place directly. Use methods on the list instead.
   */
  public get array(): ReadonlyArray<TValue> {
    return this.$.value;
  }

  /**
   * Gets or sets the length of the array. This is a number one higher than the highest index in the array.
   */
  public get length(): number {
    return this.array.length;
  }

  /**
   * Gets or sets the length of the array. This is a number one higher than the highest index in the array.
   */
  public set length(len: number) {
    (this.array as TValue[]).length = len;
  }

  public [Symbol.iterator](): IterableIterator<TValue> {
    return this.array[Symbol.iterator]();
  }

  /**
   * @see Array#entries
   * Returns an iterable of key, value pairs for every entry in the list.
   */
  public entries(): IterableIterator<[number, TValue]> {
    return this.array.entries();
  }

  /**
   * @see Array#values
   * Returns an iterable of values in the list.
   */
  public values(): IterableIterator<TValue> {
    return this.array.values();
  }

  /**
   * @see Array#keys
   * Returns an iterable of keys in the list.
   */
  public keys(): IterableIterator<number> {
    return this.array.keys();
  }

  /**
   * Same as array[index].
   * Returns the item located at the specified index.
   * @param index The zero-based index of the desired code unit.
   *        A negative index will be ignored.
   */
  public get(index: number): TValue | undefined {
    if (index >= 0) {
      return this.array[index];
    }
  }

  /**
   * @returns The first element of the list.
   */
  public first(): TValue | undefined {
    if (this.array.length > 0) {
      return this.array[0];
    }
  }

  /**
   * @returns The last element of the list.
   */
  public last(): TValue | undefined {
    if (this.array.length > 0) {
      return this.array[this.length - 1];
    }
  }

  /**
   * @see Array#push
   * Appends new elements to the end of the list, and returns the new length of the list.
   * @param items New elements to add to the list.
   */
  public push(...items: TValue[]): void {
    if (items.length > 0) {
      (this.array as TValue[]).push(...items);
      this.#notify();
    }
  }

  /**
   * @see Array#pop
   * Removes the last element from the list and returns it.
   * If the list is empty, undefined is returned and the list is not modified.
   */
  public pop(): TValue | undefined {
    if (this.array.length > 0) {
      const result = (this.array as TValue[]).pop();
      this.#notify();
      return result;
    }
  }

  /**
   * Inserts new elements at the start of the list, and returns the new length of the list.
   * @param items Elements to insert at the start of the list.
   * @see Array#unshift
   */
  public pushHead(...items: TValue[]): void {
    if (items.length > 0) {
      (this.array as TValue[]).unshift(...items);
      this.#notify();
    }
  }

  /**
   * Removes the first element from the list and returns it.
   * If the list is empty, undefined is returned and the list is not modified.
   * @see Array#shift
   */
  public popHead(): TValue | undefined {
    if (this.array.length > 0) {
      const result = (this.array as TValue[]).shift();
      this.#notify();
      return result;
    }
  }

  /**
   * Same as `Array.prototype.splice`.
   * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
   * @param start The zero-based location in the array from which to start removing elements.
   *        A negative index will be ignored.
   * @param deleteCount The number of elements to remove.
   * @returns An array containing the elements that were deleted.
   */
  public splice(start: number, deleteCount?: number): TValue[];
  /**
   * Same as `Array.prototype.splice`.
   * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
   * @param start The zero-based location in the array from which to start removing elements.
   *        A negative index will be ignored.
   * @param deleteCount The number of elements to remove.
   * @param items Elements to insert into the array in place of the deleted elements.
   * @returns An array containing the elements that were deleted.
   */
  public splice(
    start: number,
    deleteCount: number,
    ...items: TValue[]
  ): TValue[];
  public splice(
    start: number,
    deleteCount?: number,
    ...rest: TValue[]
  ): TValue[] {
    const result = (this.array as TValue[]).splice(
      start as number,
      deleteCount as number,
      ...(rest as TValue[])
    );
    if (result.length > 0 || rest.length > 0) {
      this.#notify();
    }
    return result;
  }

  /**
   * Sets new item to the list at specific index in place of the existing item.
   * @param index The zero-based location in the list at which to insert item.
   *        A negative index will be ignored.
   * @param item Item to set to the list.
   * @returns this
   */
  public set(index: number, item: TValue): this {
    if (index >= 0 && this.array[index] !== item) {
      (this.array as TValue[])[index] = item;
      this.#notify();
    }
    return this;
  }

  /**
   * Sets new items to the list at specific index in place of the existing items.
   * @param entries An iterable object that contains key-value pairs.
   * @returns this
   */
  public batchSet(entries: Iterable<readonly [number, TValue]>): this {
    let isDirty = false;
    for (const [index, item] of entries) {
      if (index >= 0 && this.array[index] !== item) {
        isDirty = true;
        (this.array as TValue[])[index] = item;
      }
    }
    if (isDirty) {
      this.#notify();
    }
    return this;
  }

  /**
   * Inserts new elements to the list. Pushes existing elements to the right.
   * @param index The zero-based location in the list from which to start inserting elements.
   *        A negative index will be ignored.
   * @param items Elements to insert into the list.
   */
  public insert(index: number, ...items: TValue[]): void {
    if (index >= 0 && items.length > 0) {
      this.splice(index, 0, ...items);
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
      this.splice(index, count);
    }
  }

  /**
   * Removes all elements from the list.
   */
  public clear(): this {
    if (this.length > 0) {
      (this.array as TValue[]).length = 0;
      this.#notify();
    }
    return this;
  }

  /**
   * Replace all items in the list.
   *
   * @returns deleted items
   */
  public replace(items: Iterable<TValue>): Iterable<TValue> {
    const deleted = new Set(this.array);
    const oldLen = this.array.length;
    let isDirty = false;
    let i = 0;
    for (const item of items) {
      isDirty = isDirty || !Object.is(item, this.array[i]);
      (this.array as TValue[])[i++] = item;
      deleted.delete(item);
    }
    (this.array as TValue[]).length = i;

    if (isDirty || oldLen !== i) {
      this.#notify();
    }
    return deleted.values();
  }

  /**
   * @see Array#reverse
   * Reverses the elements in the list in place.
   */
  public reverse(): this {
    if (this.array.length > 1) {
      (this.array as TValue[]).reverse();
      this.#notify();
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
    if (this.array.length > 1) {
      (this.array as TValue[]).sort(compareFn);
      this.#notify();
    }
    return this;
  }

  /**
   * @see Array#toString
   * Returns a string representation of the list.
   */
  public toString(): string {
    return this.array.toString();
  }

  /**
   * @see Array#toLocaleString
   * Returns a string representation of the list. The elements are converted to string using their toLocaleString methods.
   */
  public toLocaleString(): string {
    return this.array.toLocaleString();
  }

  public toJSON(): unknown {
    return this.array;
  }

  public dispose(): void {
    this.$.dispose();
  }
}

/**
 * A readonly reactive list. Similar to an Array except bracket-notation(e.g. `arr[0]`) is not allowed to get elements.
 * Changes to the list will be notified to subscribers of `list.$`.
 */
export type ReadonlyReactiveList<TValue> = Omit<
  ReactiveList<TValue>,
  | "length"
  | "push"
  | "pop"
  | "pushHead"
  | "popHead"
  | "set"
  | "insert"
  | "delete"
  | "clear"
  | "replace"
  | "reverse"
  | "sort"
> & {
  /**
   * Gets the length of the array. This is a number one higher than the highest index in the array.
   */
  readonly length: number;
};
