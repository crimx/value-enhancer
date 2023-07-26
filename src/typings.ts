export interface ReadonlyVal<TValue = any> {
  /** Current value of the val */
  readonly value: TValue;
  /** Get current value of the val */
  get(this: void): TValue;
  /** Compare two values. Default `===`. */
  compare(this: void, newValue: TValue, oldValue: TValue): boolean;
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
   * Subscribe to value changes and get invoked before {@link ReadonlyVal#subscribe} and {@link ReadonlyVal#reaction}.
   * @param subscriber
   * @returns a disposer function that cancels the subscription
   */
  $valCompute(subscriber: ValSubscriber<void>): ValDisposer;
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

export interface Val<TValue = any> extends ReadonlyVal<TValue> {
  /** Current value of the val */
  value: TValue;
  /** Set new value */
  set(this: void, value: TValue): void;
}

export type ValSetValue<TValue = any> = (value: TValue) => void;

export type ValCompare<TValue = any> = (
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
   * Compare two values. Default `===`.
   */
  compare?: ValCompare<TValue>;
  /**
   * Set the default behavior of subscription and reaction.
   * Emission triggers synchronously if `true`. Default `false`.
   */
  eager?: boolean;
}

export type UnwrapVal<T> = T extends ReadonlyVal<infer TValue> ? TValue : T;

/** @ignore */
export type ValInputsValueTuple<TValInputs extends readonly ReadonlyVal[]> =
  Readonly<{
    [K in keyof TValInputs]: ExtractValValue<TValInputs[K]>;
  }>;

/** @ignore */
export type ExtractValValue<TVal> = TVal extends ReadonlyVal<infer TValue>
  ? TValue
  : never;
