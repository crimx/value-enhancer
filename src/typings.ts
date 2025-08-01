/**
 * A ReadonlyVal contains a readonly `value` and does not have a `set` method.
 */
export interface ReadonlyVal<TValue = any> {
  /** Display debug name. */
  readonly name?: string;
  /**
   * Current value of the val.
   */
  readonly value: TValue;
  /**
   * A version representation of the value.
   * If two versions of a val is not equal(`Object.is`), it means the `value` has changed (event if the `value` is equal).
   */
  readonly $version: ValVersion;
  /**
   * Get current value of the val.
   */
  get: () => TValue;
  /**
   * Create a new ReadonlyVal referencing the value of the current ReadonlyVal as source.
   * (It is just like `derive` a val without `transform`. It is simpler hence more efficient.)
   * All ref ReadonlyVals share the same value from the source ReadonlyVal.
   *
   * With this pattern you can pass a ref ReadonlyVal to downstream.
   * The ref ReadonlyVals can be safely disposed without affecting the source ReadonlyVal and other ref ReadonlyVals.
   */
  ref(): ReadonlyVal<TValue>;
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
   * Subscribe to value changes without immediate emission.
   * The subscribers will be called before sync and async subscribers from [[reaction]] and [[subscribe]].
   * It is mainly used for chaining Vals.
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

/**
 * A Val contains a writable `value` property and a `set` method.
 */
export interface Val<TValue = any> extends ReadonlyVal<TValue> {
  /** Current value of the val */
  value: TValue;
  /** Set new value */
  set: (value: TValue) => void;
  /**
   * Create a new ReadonlyVal referencing the value of the current ReadonlyVal as source.
   * (It is just like `derive` a val without `transform`. It is simpler hence more efficient.)
   * All ref ReadonlyVals share the same value from the source ReadonlyVal.
   *
   * With this pattern you can pass a ref ReadonlyVal to downstream.
   * The ref ReadonlyVals can be safely disposed without affecting the source ReadonlyVal and other ref ReadonlyVals.
   */
  ref(): ReadonlyVal<TValue>;
  /**
   * Create a new ReadonlyVal referencing the value of the current ReadonlyVal as source.
   * (It is just like `derive` a val without `transform`. It is simpler hence more efficient.)
   * All ref ReadonlyVals share the same value from the source ReadonlyVal.
   *
   * With this pattern you can pass a ref ReadonlyVal to downstream.
   * The ref ReadonlyVals can be safely disposed without affecting the source ReadonlyVal and other ref ReadonlyVals.
   */
  ref(writable?: false): ReadonlyVal<TValue>;
  /**
   * Create a new Val referencing the value of the current Val as source.
   * All ref Vals share the same value from the source Val.
   * The act of setting a value on the ref Val is essentially setting the value on the source Val.
   *
   * With this pattern you can pass a ref Val as a writable Val to downstream.
   * The ref Vals can be safely disposed without affecting the source Val and other ref Vals.
   */
  ref(writable: true): Val<TValue>;
  /**
   * @param writable If true, creates a new Ref Val referencing the value of the current Val as source.
   *                 If false, creates a new Ref ReadonlyVal referencing the value of the current Val as source.
   */
  ref(writable?: boolean): ReadonlyVal<TValue> | Val<TValue>;
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
  /** Debug name. */
  readonly name?: string;
  /**
   * Compare two values. Default `Object.is`.
   * `false` to disable equality check.
   */
  readonly equal?: ValEqual<TValue> | false;
  /**
   * Set the default behavior of subscription and reaction.
   * Emission triggers synchronously if `true`. Default `false`.
   */
  readonly eager?: boolean;
}

export type ValVersion = any;

export type UnwrapVal<T> = T extends ReadonlyVal<infer TValue> ? TValue : T;

export type FlattenVal<T> = ReadonlyVal<UnwrapVal<UnwrapVal<T>>>;

/**
 * @internal
 * @ignore
 */
export type ValInputsValueTuple<TValInputs extends readonly ReadonlyVal[]> =
  Readonly<{
    [K in keyof TValInputs]: ExtractValValue<TValInputs[K]>;
  }>;

/**
 * @internal
 * @ignore
 */
export type ExtractValValue<TVal> = TVal extends ReadonlyVal<infer TValue>
  ? TValue
  : never;

/**
 * @internal
 * @ignore
 */
export type NoInfer<T> = [T][T extends any ? 0 : never];
