import type { ValOnStart } from "./subscribers";
import type {
  ReadonlyVal,
  ValConfig,
  ValDisposer,
  ValSetValue,
  ValSubscriber,
} from "./typings";

import { SubscriberMode, Subscribers } from "./subscribers";
import { defaultEqual, invoke } from "./utils";

/**
 * Bare minimum implementation of a readonly val.
 */
export class ReadonlyValImpl<TValue = any> implements ReadonlyVal<TValue> {
  /**
   * Manage subscribers for a val.
   */
  protected _subs: Subscribers<TValue>;

  #eager?: boolean;

  /**
   * @param get A pure function that returns the current value of the val.
   * @param config Custom config for the val.
   * @param start A function that is called when a val get its first subscriber.
   *        The returned disposer will be called when the last subscriber unsubscribed from the val.
   */
  public constructor(
    get: () => TValue,
    { equal, eager }: ValConfig<TValue> = {},
    start?: ValOnStart
  ) {
    this.get = get;
    this.equal = equal || defaultEqual;
    this.#eager = eager;
    this._subs = new Subscribers<TValue>(get, start);
  }

  public get value(): TValue {
    return this.get();
  }

  public get: (this: void) => TValue;

  public equal: (this: void, newValue: TValue, oldValue: TValue) => boolean;

  public reaction(
    subscriber: ValSubscriber<TValue>,
    eager = this.#eager
  ): ValDisposer {
    return this._subs.add(
      subscriber,
      eager ? SubscriberMode.Eager : SubscriberMode.Async
    );
  }

  public subscribe(
    subscriber: ValSubscriber<TValue>,
    eager = this.#eager
  ): ValDisposer {
    const disposer = this.reaction(subscriber, eager);
    invoke(subscriber, this.value);
    this._subs.dirty = false;
    return disposer;
  }

  public $valCompute(subscriber: ValSubscriber<void>): ValDisposer {
    return this._subs.add(subscriber, SubscriberMode.Computed);
  }

  public unsubscribe(subscriber?: (...args: any[]) => any): void {
    if (subscriber) {
      this._subs.remove(subscriber);
    } else {
      this._subs.clear();
    }
  }

  public dispose(): void {
    this._subs.clear();
  }

  /**
   * @returns the string representation of `this.value`.
   *
   * @example
   * ```js
   * const v$ = val(val(val(1)));
   * console.log(`${v$}`); // "1"
   * ```
   */
  public toString(): string {
    return String(this.value);
  }

  /**
   * @returns the JSON representation of `this.value`.
   *
   * @example
   * ```js
   * const v$ = val(val(val({ a: 1 })));
   * JSON.stringify(v$); // '{"a":1}'
   * ```
   */
  public toJSON(key: string): unknown {
    const value = this.value as
      | undefined
      | null
      | { toJSON?: (key: string) => unknown };
    return value && value.toJSON ? value.toJSON(key) : value;
  }
}

/**
 * Creates a readonly val with the given value.
 *
 * @returns A tuple with the readonly val and a function to set the value.
 */
export function readonlyVal<TValue = undefined>(): [
  ReadonlyVal<TValue | undefined>,
  ValSetValue<TValue | undefined>
];
/**
 * Creates a readonly val with the given value.
 *
 * @param value Value for the val
 * @param config Custom config for the val.
 * @returns A tuple with the readonly val and a function to set the value.
 */
export function readonlyVal<TValue = any>(
  value: TValue,
  config?: ValConfig<TValue>
): [ReadonlyVal<TValue>, ValSetValue<TValue>];
export function readonlyVal<TValue = any>(
  value?: TValue,
  config?: ValConfig<TValue | undefined>
): [ReadonlyVal<TValue | undefined>, ValSetValue<TValue | undefined>] {
  let currentValue = value;

  let subs: Subscribers;

  const set = (value: TValue | undefined): void => {
    if (!val.equal(value, currentValue)) {
      currentValue = value;
      if (subs) {
        subs.dirty = true;
        subs.notify();
      }
    }
  };

  const val = new ReadonlyValImpl(
    () => currentValue,
    config,
    s => {
      subs = s;
    }
  );

  return [val, set];
}

/**
 * Takes an object of key-value pairs containing `ReadonlyVal` instances and their corresponding `ValSetValue` functions,
 * and returns a tuple containing an array of the `ReadonlyVal` instances and a function to set their values.
 *
 * @example
 * ```ts
 * const [vals, setVals] = groupVals({
 *  a: readonlyVal(1),
 *  b: readonlyVal(2),
 *  c: readonlyVal(3),
 * });
 *
 * vals.a.value; // 1
 *
 * setVals.a(2);
 * ```
 *
 * This is useful for classes that have multiple `ReadonlyVal` instances as properties.
 *
 * ```ts
 * export interface Foo$ {
 *   a: ReadonlyVal<number>;
 *   b: ReadonlyVal<number>;
 *   c: ReadonlyVal<number>;
 * }
 *
 * export class Foo {
 *  public $: Foo$;
 *  private setVals: { [K in keyof Foo$]: ValSetValue<FlattenVal<Foo$[K]>> };
 *
 *  public constructor() {
 *   const [vals, setVals] = groupVals({
 *     a: readonlyVal(1),
 *     b: readonlyVal(2),
 *     c: readonlyVal(3),
 *   });
 *
 *   this.$ = vals;
 *   this.setVals = setVals;
 * }
 * ```
 */
export const groupVals = <TValues extends {}>(valPairs: {
  [K in keyof TValues]: [ReadonlyVal<TValues[K]>, ValSetValue<TValues[K]>];
}): [
  { [K in keyof TValues]: ReadonlyVal<TValues[K]> },
  { [K in keyof TValues]: ValSetValue<TValues[K]> }
] => {
  const vals = {} as { [K in keyof TValues]: ReadonlyVal<TValues[K]> };
  const setters = {} as { [K in keyof TValues]: ValSetValue<TValues[K]> };
  for (const key of Object.keys(valPairs) as (keyof TValues)[]) {
    const [val, set] = valPairs[key];
    vals[key] = val;
    setters[key] = set;
  }
  return [vals, setters];
};
