/**
 * A ReadonlyVal contains a readonly `value` and does not have a `set` method.
 */
export interface ReadonlyVal<TValue = any> {
  /** Current value of the val */
  readonly value: TValue;
  /** Get current value of the val */
  get(this: void): TValue;
  /**
   * Subscribe to value changes without immediate emission.
   * @param subscriber
   * @param eager by default subscribers will be notified on next tick. set `true` to notify subscribers of value changes synchronously.
   * @returns a disposer function that cancels the subscription
   */
  reaction(subscriber: ValSubscriber<TValue>, eager?: boolean): ValDisposer;
  /**
   * Subscribe to value changes with immediate emission.
   * @param subscriber
   * @param eager by default subscribers will be notified on next tick. set `true` to notify subscribers of value changes synchronously.
   * @returns a disposer function that cancels the subscription
   */
  subscribe(subscriber: ValSubscriber<TValue>, eager?: boolean): ValDisposer;
  /**
   * Remove the given subscriber.
   * Remove all if no subscriber provided.
   * @param subscriber
   */
  unsubscribe(subscriber?: (...args: any[]) => any): void;
  /**
   * Remove all subscribers.
   */
  dispose(): void;
}

/**
 * A Val contains a writable `value` property and a `set` method.
 */
export interface Val<TValue = any> extends ReadonlyVal<TValue> {
  /** Current value of the val */
  value: TValue;
  /** Set new value */
  set(this: void, value: TValue): void;
  /**
   * Create a new Val referencing the value of the current Val as source.
   * All ref Vals share the same value from the source Val.
   * The act of setting a value on the ref Val is essentially setting the value on the source Val.
   *
   * With this pattern you can pass a ref Val as a writable Val to downstream.
   * The ref Vals can be safely disposed without affecting the source Val and other ref Vals.
   */
  ref(): Val<TValue>;
}

export type ValSetValue<TValue = any> = (value: TValue) => void;

export type ValEqual<TValue = any> = (
  newValue: TValue,
  oldValue: TValue
) => boolean;

export type ValSubscriber<TValue = any> = (newValue: TValue) => void;

export type ValDisposer = () => void;

/**
 * Custom config for the val.
 */
export interface ValConfig<TValue = any> {
  /**
   * Compare two values. Default `Object.is`.
   * `false` to disable equality check.
   */
  equal?: ValEqual<TValue> | false;
  /**
   * Set the default behavior of subscription and reaction.
   * Emission triggers synchronously if `true`. Default `false`.
   */
  eager?: boolean;
}

export type UnwrapVal<T> = T extends ReadonlyVal<infer TValue> ? TValue : T;

export type FlattenVal<T> = ReadonlyVal<UnwrapVal<UnwrapVal<T>>>;

/** @internal */
export type ValInputsValueTuple<TValInputs extends readonly ReadonlyVal[]> =
  Readonly<{
    [K in keyof TValInputs]: ExtractValValue<TValInputs[K]>;
  }>;

/** @internal */
export type ExtractValValue<TVal> = TVal extends ReadonlyVal<infer TValue>
  ? TValue
  : never;
