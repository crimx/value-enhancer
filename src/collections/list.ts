import { readonlyVal } from "../readonly-val";
import type { ReadonlyVal, ValSetValue } from "../typings";

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
  #data: TValue[];

  public constructor(arrayLike?: ArrayLike<TValue>) {
    this.#data = arrayLike ? Array.from(arrayLike) : [];
    const [val, setVal] = readonlyVal(this, { equal: false });
    this.$ = val;
    this.#set$ = setVal;
  }

  public $: ReadonlyVal<this>;

  #set$: ValSetValue<this>;

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
    if (this.#data.length > 0) {
      return this.#data[0];
    }
  }

  /**
   * @returns The last element of the list.
   */
  public last(): TValue | undefined {
    if (this.#data.length > 0) {
      return this.#data[this.length - 1];
    }
  }

  /**
   * @see Array#push
   * Appends new elements to the end of the list, and returns the new length of the list.
   * @param items New elements to add to the list.
   */
  public push(...items: TValue[]): void {
    if (items.length > 0) {
      this.#data.push(...items);
      this.#set$(this);
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
      this.#set$(this);
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
      this.#data.unshift(...items);
      this.#set$(this);
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
      this.#set$(this);
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
      this.#set$(this);
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
      this.#set$(this);
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
      if (result.length > 0) {
        this.#set$(this);
      }
    }
  }

  /**
   * Removes all elements from the list.
   */
  public clear(): this {
    if (this.length > 0) {
      this.#data.length = 0;
      this.#set$(this);
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
      this.#set$(this);
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
      this.#set$(this);
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
      this.#set$(this);
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
>;
