import type {
  NoInfer,
  ReadonlyVal,
  ValConfig,
  ValDisposer,
  ValSetValue,
  ValSubscriber,
  ValVersion,
} from "./typings";

import { SubscriberMode, Subscribers } from "./subscribers";
import { invoke, strictEqual } from "./utils";

/**
 * Bare minimum implementation of a readonly val.
 * Generally, you should use `readonlyVal` and `ReadonlyVal` instead of this class.
 */
export class ReadonlyValImpl<TValue = any> implements ReadonlyVal<TValue> {
  /**
   * Manage subscribers for a val.
   */
  readonly #subs: Subscribers<TValue>;

  readonly #config?: ValConfig;

  readonly #eager?: boolean;

  /**
   * @param get A pure function that returns the current value of the val.
   * @param config Custom config for the val.
   * @param start A function that is called when a val get its first subscriber.
   *        The returned disposer will be called when the last subscriber unsubscribed from the val.
   */
  public constructor(subs: Subscribers<TValue>, config?: ValConfig<TValue>) {
    this.#subs = subs;
    this.get = subs.getValue_;
    this.#config = config;
    this.$equal = (config?.equal ?? strictEqual) || void 0;
    this.#eager = config?.eager;
  }

  public get $version(): ValVersion {
    return this.#subs.version_;
  }

  public get value(): TValue {
    return this.get();
  }

  public get: (this: void) => TValue;

  public $equal?: (this: void, newValue: TValue, oldValue: TValue) => boolean;

  public ref(): ReadonlyVal<TValue> {
    return new ReadonlyValRefImpl(this, this.#config);
  }

  public reaction(
    subscriber: ValSubscriber<TValue>,
    eager = this.#eager
  ): ValDisposer {
    return this.#subs.add_(
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
    this.#subs.dirty_ = false;
    return disposer;
  }

  public $valCompute(subscriber: ValSubscriber<void>): ValDisposer {
    return this.#subs.add_(subscriber, SubscriberMode.Computed);
  }

  public unsubscribe(subscriber?: (...args: any[]) => any): void {
    if (subscriber) {
      this.#subs.remove_(subscriber);
    } else {
      this.#subs.clear_();
    }
  }

  public dispose(): void {
    this.#subs.clear_();
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

export class ReadonlyValRefImpl<TValue = any> extends ReadonlyValImpl<TValue> {
  readonly #source$: ReadonlyValImpl<TValue>;
  readonly #config?: ValConfig<TValue>;

  public constructor(
    source$: ReadonlyValImpl<TValue>,
    config?: ValConfig<TValue>
  ) {
    const subs = new Subscribers(source$.get, () =>
      source$.$valCompute(() => {
        subs.dirty_ = true;
        subs.newVersion_(config);
        subs.notify_();
      })
    );
    super(subs, config);

    this.#source$ = source$;
    this.#config = config;
  }

  public override ref(): ReadonlyVal<TValue> {
    return new ReadonlyValRefImpl(this.#source$, this.#config);
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
 * @param config Custom config for the val.
 * @returns A tuple with the readonly val and a function to set the value.
 */
export function readonlyVal<TValue = any>(
  value: TValue,
  config?: ValConfig<TValue>
): [ReadonlyVal<NoInfer<TValue>>, ValSetValue<NoInfer<TValue>>];
export function readonlyVal<TValue = any>(
  value?: TValue,
  config?: ValConfig<TValue | undefined>
): [
  ReadonlyVal<NoInfer<TValue> | undefined>,
  ValSetValue<NoInfer<TValue> | undefined>
] {
  let currentValue = value;

  const get = () => currentValue;

  const subs = new Subscribers(get);

  const set = (value: TValue | undefined): void => {
    if (!val.$equal?.(value, currentValue)) {
      subs.dirty_ = true;
      subs.newVersion_(config, value, currentValue);
      currentValue = value;
      subs.notify_();
    }
  };

  const val = new ReadonlyValImpl(subs, config);

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
