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

export type ValTransform<TValue = any, TDerivedValue = any> = (
  newValue: TValue
) => TDerivedValue;

export type ValDisposer = () => void;

export type ValOnStart<TValue = any> = (
  set: ValSetValue<TValue>
) => void | ValDisposer | undefined;

export interface ValConfig<TValue = any> {
  /**
   * Compare two values. Default `===`.
   */
  compare?: ValCompare<TValue>;
}

export interface ReadonlyValConfig<TValue = any> extends ValConfig<TValue> {
  /**
   * A function that is called when the number of subscribers goes from zero to one (but not from one to two, etc).
   * That function will be passed a set function which changes the value of the val.
   * It may optionally return a disposer function that is called when the subscriber count goes from one to zero.
   */
  start?: ValOnStart<TValue>;
}
