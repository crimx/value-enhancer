/**
 * @internal
 * @ignore
 */
export type ExtractValValue<TVal> = TVal extends ReadonlyVal<infer TValue> ? TValue : never;

export type FlattenVal<T> = ReadonlyVal<UnwrapVal<UnwrapVal<T>>>;

export interface Get {
  <T = any>(val$: ReadonlyVal<T>): T;
  <T = any>(val$?: ReadonlyVal<T>): T | undefined;
  <T = any>(val$: { $: ReadonlyVal<T> }): T;
  <T = any>(val$?: { $: ReadonlyVal<T> }): T | undefined;
  <T = any>(val$: T): UnwrapVal<T>;
  <T = any>(val$?: T): undefined | UnwrapVal<T>;
}

/**
 * A ReadonlyVal contains a readonly `value` and does not have a `set` method.
 */
export interface ReadonlyVal<TValue = any> {
  /**
   * A version representation of the value.
   * If two versions of a val is not equal(`Object.is`), it means the `value` has changed (event if the `value` is equal).
   */
  readonly $version: ValVersion;
  readonly brand: symbol;
  /**
   * Current value of the val.
   */
  readonly value: TValue;
  /**
   * Remove all subscribers.
   */
  dispose(): void;
  /**
   * Get current value of the val.
   */
  get: () => TValue;
  /** @internal */
  onReaction_(subscriber: ValSubscriber<TValue>): void;
  /**
   * Create a new ReadonlyVal referencing the value of the current ReadonlyVal as source.
   * (It is just like `derive` a val without `transform`. It is simpler hence more efficient.)
   * All ref ReadonlyVals share the same value from the source ReadonlyVal.
   *
   * With this pattern you can pass a ref ReadonlyVal to downstream.
   * The ref ReadonlyVals can be safely disposed without affecting the source ReadonlyVal and other ref ReadonlyVals.
   */
  // ref(): ReadonlyVal<TValue>;
  /**
   * Subscribe to value changes without immediate emission.
   * @param subscriber
   * @returns a disposer function that cancels the subscription
   */
  reaction(subscriber: ValSubscriber<TValue>): ValDisposer;
  /**
   * Subscribe to value changes with immediate emission.
   * @param subscriber
   * @returns a disposer function that cancels the subscription
   */
  subscribe(subscriber: ValSubscriber<TValue>): ValDisposer;
  /**
   * Subscribe to value changes without immediate emission.
   * The subscribers will be called before sync and async subscribers from [[reaction]] and [[subscribe]].
   * It is mainly used for chaining Vals.
   * @param subscriber
   * @returns a disposer function that cancels the subscription
   */
  // $valCompute(subscriber: ValSubscriber<void>): ValDisposer;
  /**
   * Remove the given subscriber.
   * Remove all if no subscriber provided.
   * @param subscriber
   */
  unsubscribe(subscriber?: (...args: any[]) => any): void;
}

export type UnwrapVal<T> = T extends ReadonlyVal<infer TValue> ? TValue : T;

/**
 * A Val contains a writable `value` property and a `set` method.
 */
export interface Val<TValue = any> extends ReadonlyVal<TValue> {
  /** Current value of the val */
  value: TValue;
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
  /**
   * Create a new ReadonlyVal referencing the value of the current ReadonlyVal as source.
   * (It is just like `derive` a val without `transform`. It is simpler hence more efficient.)
   * All ref ReadonlyVals share the same value from the source ReadonlyVal.
   *
   * With this pattern you can pass a ref ReadonlyVal to downstream.
   * The ref ReadonlyVals can be safely disposed without affecting the source ReadonlyVal and other ref ReadonlyVals.
   */
  ref(writable?: false): ReadonlyVal<TValue>;
  /** Set new value */
  set: (value: TValue) => void;
}

/**
 * Custom config for the val.
 */
export interface ValConfig<TValue = any> {
  /**
   * Compare two values. Default `Object.is`.
   * `false` to disable equality check.
   */
  readonly equal?: false | ValEqual<TValue>;
  /**
   * Name for debugging.
   */
  readonly name?: string;
}

export type ValDisposer = () => void;

export type ValEqual<TValue = any> = (newValue: TValue, oldValue: TValue) => boolean;

/**
 * @internal
 * @ignore
 */
export type ValInputsValueTuple<TValInputs extends readonly ReadonlyVal[]> = Readonly<{
  [K in keyof TValInputs]: ExtractValValue<TValInputs[K]>;
}>;

export type ValSetValue<TValue = any> = (value: TValue) => void;

export type ValSubscriber<TValue = any> = (newValue: TValue) => void;

export type ValVersion = unknown;
