export interface ReadonlyVal<TValue = any> {
  /** value */
  readonly value: TValue;
  /**
   * Subscribe to value changes without immediate emission.
   * @param subscriber
   * @param eager notify subscribers of value changes synchronously. otherwise subscribers will be notified next tick.
   * @returns a disposer function that cancels the subscription
   */
  reaction(subscriber: ValSubscriber<TValue>, eager?: boolean): ValDisposer;
  /**
   * Subscribe to value changes with immediate emission.
   * @param subscriber
   * @param eager notify subscribers of value changes synchronously. otherwise subscribers will be notified next tick.
   * @returns a disposer function that cancels the subscription
   */
  subscribe(subscriber: ValSubscriber<TValue>, eager?: boolean): ValDisposer;
  /** remove all subscribers */
  unsubscribe(): void;
  /** remove the given subscriber */
  unsubscribe<T extends (...args: any[]) => any>(subscriber: T): void;
}

export interface Val<TValue = any> extends ReadonlyVal<TValue> {
  value: TValue;
  /** set new value */
  set(value: TValue): void;
}

export type ValSetValue<TValue = any> = (value: TValue) => void;

export type ValCompare<TValue = any> = (
  newValue: TValue,
  oldValue: TValue
) => boolean;

export type ValSubscriber<TValue = any> = (newValue: TValue) => void;

export type ValDisposer = () => void;

export type ValOnStart = () => void | ValDisposer | undefined;

export interface ValConfig<TValue = any> {
  /**
   * Compare two values. Default `===`.
   */
  compare?: ValCompare<TValue>;
}

export type TValInputsValueTuple<TValInputs extends readonly ReadonlyVal[]> =
  Readonly<{
    [K in keyof TValInputs]: ExtractValValue<TValInputs[K]>;
  }>;

export type ExtractValValue<TVal> = TVal extends ReadonlyVal<infer TValue>
  ? TValue
  : never;
