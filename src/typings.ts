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
   * A function that is called when the number of subscribers goes from zero to one (but not from one to two, etc).
   * That function will be passed a set function which changes the value of the val.
   * It may optionally return a disposer function that is called when the subscriber count goes from one to zero.
   */
  beforeSubscribe?: ValOnStart<TValue>;
  /**
   * Compare two values. Default `===`.
   */
  compare?: ValCompare<TValue>;
}
