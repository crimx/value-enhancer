import { readonlyVal } from "../readonly-val";
import type { ReadonlyVal } from "../typings";

/**
 * A reactive set inherited from `Set`.
 * Changes to the set will be notified to subscribers of `set.$`.
 */
export interface ReactiveSet<TValue> extends Set<TValue> {
  /**
   * A readonly val with value of `this`.
   *
   * To update the entire reactive set in place, use `set.replace()`.
   */
  readonly $: ReadonlyVal<this>;

  /**
   * Delete multiple values from the Set.
   */
  batchDelete(values: Iterable<TValue>): boolean;

  /**
   * Add multiple values to the Set.
   */
  batchAdd(values: Iterable<TValue>): this;

  /**
   * Replace all items in the Set.
   *
   * @returns Deleted items.
   */
  replace(items: Iterable<TValue>): Iterable<TValue>;

  toJSON(): object[];

  /**
   * Dispose the reactive set.
   */
  dispose(): void;
}

/**
 * A readonly reactive set inherited from `Set`.
 * Changes to the set will be notified to subscribers of `set.$`.
 */
export type ReadonlyReactiveSet<TValue> = Pick<
  ReactiveSet<TValue>,
  | typeof Symbol.iterator
  | typeof Symbol.toStringTag
  | "toJSON"
  | "dispose"
  | "forEach"
  | "has"
  | "size"
  | "entries"
  | "keys"
  | "values"
> & {
  readonly $: ReadonlyVal<ReadonlyReactiveSet<TValue>>;
};

export interface ReactiveSetConfig<TValue> {
  /**
   * A callback function that will be called when an entry is deleted.
   */
  onDeleted?: (value: TValue) => void;
}

class ReactiveSetImpl<TValue>
  extends Set<TValue>
  implements ReactiveSet<TValue>
{
  public constructor(
    values?: Iterable<TValue> | null,
    config?: ReactiveSetConfig<TValue>
  ) {
    super();

    if (config) {
      this.#onDeleted = config.onDeleted;
    }

    const [$, set$] = readonlyVal(this, { equal: false });
    this.$ = $;
    this.#notify = () => set$(this);

    if (values) {
      this.batchAdd(values);
    }
  }

  public readonly $: ReadonlyVal<this>;

  #notify: () => void;

  #onDeleted?: (value: TValue) => void;

  #delete(value: TValue): boolean {
    const deleted = super.delete(value);
    if (deleted) {
      this.#onDeleted?.(value);
    }
    return deleted;
  }

  public override delete(value: TValue): boolean {
    const deleted = this.#delete(value);
    if (deleted) {
      this.#notify();
    }
    return deleted;
  }

  public batchDelete(values: Iterable<TValue>): boolean {
    let deleted = false;
    for (const value of values) {
      deleted = this.#delete(value) || deleted;
    }
    if (deleted) {
      this.#notify();
    }
    return deleted;
  }

  public override clear(): void {
    if (this.size > 0) {
      if (this.#onDeleted) {
        for (const value of this) {
          super.delete(value);
          this.#onDeleted(value);
        }
      } else {
        super.clear();
      }
      this.#notify();
    }
  }

  public override add(value: TValue): this {
    const isDirty = !this.has(value);
    super.add(value);
    if (isDirty) {
      this.#notify();
    }
    return this;
  }

  public batchAdd(values: Iterable<TValue>): this {
    const prevSize = this.size;
    for (const value of values) {
      super.add(value);
    }
    if (prevSize !== this.size) {
      this.#notify();
    }
    return this;
  }

  public dispose(): void {
    this.$.dispose();
  }

  public replace(items: Iterable<TValue>): Iterable<TValue> {
    const deleted = new Set(this);
    super.clear();
    let isDirty = false;
    for (const item of items) {
      isDirty = deleted.delete(item) || isDirty;
      super.add(item);
    }

    if (isDirty || deleted.size > 0) {
      if (this.#onDeleted) {
        for (const item of deleted) {
          this.#onDeleted(item);
        }
      }
      this.#notify();
    }
    return deleted.values();
  }

  public toJSON(): object[] {
    return [...this].map((value: any, i) =>
      value && value.toJSON ? value.toJSON(i) : value
    );
  }
}

/**
 * Create a new ReactiveSet.
 *
 * @example
 * ```ts
 * import { derive } from "value-enhancer";
 * import { reactiveSet } from "value-enhancer/collections"
 *
 * const set = reactiveSet();
 * const item$ = derive(set.$, set => set.has("someValue")); // watch the existence of "someValue"
 *
 * console.log(item$.value); // false
 * set.add("someValue");
 * console.log(item$.value); // true
 * ```
 */
export const reactiveSet = <TValue>(
  values?: Iterable<TValue> | null,
  config?: ReactiveSetConfig<TValue>
): ReactiveSet<TValue> => new ReactiveSetImpl(values, config);
