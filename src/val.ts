import type {
  NoInfer,
  ReadonlyVal,
  Val,
  ValConfig,
  ValDisposer,
  ValSetValue,
  ValSubscriber,
  ValVersion,
} from "./typings";

import type { IValAgent } from "./agent";
import { RefValAgent, SubMode, ValAgent } from "./agent";
import { attachSetter, invoke } from "./utils";

/**
 * Bare minimum implementation of a readonly val.
 * Generally, you should use `readonlyVal` and `ReadonlyVal` instead of this class.
 */
export class ValImpl<TValue = any> implements ReadonlyVal<TValue> {
  /**
   * Manage subscribers for a val.
   */
  readonly #agent: IValAgent<TValue>;

  /**
   * @param get A pure function that returns the current value of the val.
   * @param config Custom config for the val.
   * @param start A function that is called when a val get its first subscriber.
   *        The returned disposer will be called when the last subscriber unsubscribed from the val.
   */
  public constructor(agent: IValAgent<TValue>) {
    this.#agent = agent;
    this.get = agent.resolveValue_;
  }

  public get $version(): ValVersion {
    // resolve current value for the latest version
    this.get();
    return this.#agent.version_;
  }

  public get value(): TValue {
    return this.get();
  }

  public set value(value: TValue) {
    this.set(value);
  }

  public set(this: void, _value: TValue): void {
    // do nothing
  }

  public get: (this: void) => TValue;

  public ref(writable?: boolean): ReadonlyVal<TValue> {
    const val$ = new ValImpl(new RefValAgent(this.#agent));
    return writable ? attachSetter(val$, this.set) : val$;
  }

  public reaction(
    subscriber: ValSubscriber<TValue>,
    eager = this.#agent.eager_
  ): ValDisposer {
    return this.#agent.add_(subscriber, eager ? SubMode.Eager : SubMode.Async);
  }

  public subscribe(
    subscriber: ValSubscriber<TValue>,
    eager = this.#agent.eager_
  ): ValDisposer {
    const disposer = this.reaction(subscriber, eager);
    invoke(subscriber, this.get());
    return disposer;
  }

  public $valCompute(subscriber: ValSubscriber<void>): ValDisposer {
    return this.#agent.add_(subscriber, SubMode.Computed);
  }

  public unsubscribe(subscriber?: (...args: any[]) => any): void {
    this.#agent.remove_(subscriber);
  }

  public dispose(): void {
    this.#agent.remove_();
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
    return String(this.get());
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
    const value = this.get() as
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
export function readonlyVal<TValue = any>(): [
  ReadonlyVal<NoInfer<TValue> | undefined>,
  ValSetValue<NoInfer<TValue> | undefined>
];
/**
 * Creates a readonly val with the given value.
 *
 * @param value Value for the val
 * @param config Optional custom config for the val.
 * @returns A tuple with the readonly val and a function to set the value.
 */
export function readonlyVal(
  value: [],
  config?: ValConfig<any[]>
): [ReadonlyVal<any[]>, ValSetValue<any[]>];
/**
 * Creates a readonly val with the given value.
 *
 * @param value Value for the val
 * @param config Optional custom config for the val.
 * @returns A tuple with the readonly val and a function to set the value.
 */
export function readonlyVal<TValue = any>(
  value: TValue,
  config?: ValConfig<TValue>
): [ReadonlyVal<NoInfer<TValue>>, ValSetValue<NoInfer<TValue>>];
/**
 * Creates a readonly val with the given value.
 *
 * @param value Optional value for the val
 * @param config Optional custom config for the val.
 * @returns A tuple with the readonly val and a function to set the value.
 */
export function readonlyVal<TValue = any>(
  value?: TValue,
  config?: ValConfig<TValue>
): [
  ReadonlyVal<NoInfer<TValue | undefined>>,
  ValSetValue<NoInfer<TValue | undefined>>
];
export function readonlyVal<TValue = any>(
  value?: TValue,
  config?: ValConfig<TValue | undefined>
): [
  ReadonlyVal<NoInfer<TValue> | undefined>,
  ValSetValue<NoInfer<TValue> | undefined>
] {
  let currentValue = value;

  const get = () => currentValue;

  const subs = new ValAgent(get, config);

  const set = (value: TValue | undefined): void => {
    if (!subs.equal_?.(value, currentValue)) {
      currentValue = value;
      subs.notify_();
    }
  };

  const val = new ValImpl(subs);

  return [val, set];
}

/**
 * Creates a writable val.
 * @returns A val with undefined value.
 */
export function val<TValue = any>(): Val<NoInfer<TValue> | undefined>;
/**
 * Creates a writable val.
 * @param value Initial value.
 * @param config Optional custom config.
 */
export function val(value: [], config?: ValConfig<any[]>): Val<any[]>;
/**
 * Creates a writable val.
 * @param value Initial value.
 * @param config Optional custom config.
 */
export function val<TValue = any>(
  value: TValue,
  config?: ValConfig<TValue>
): Val<NoInfer<TValue>>;
/**
 * Creates a writable val.
 * @param value Initial value.
 * @param config Optional custom config.
 */
export function val<TValue = any>(
  value?: TValue,
  config?: ValConfig<TValue | undefined>
): Val<NoInfer<TValue>>;
export function val<TValue = any>(
  value?: TValue,
  config?: ValConfig<TValue>
): Val<NoInfer<TValue | undefined>> {
  const [val$, set] = readonlyVal(value, config);
  return attachSetter(val$, set);
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
 *  private setVals: { [K in keyof Foo$]: ValSetValue<UnwrapVal<Foo$[K]>> };
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
