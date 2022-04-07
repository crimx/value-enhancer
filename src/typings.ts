export type ValSetValue<TValue = any, TMeta = any> = (
  value: TValue,
  meta?: TMeta
) => void;

export type ValCompare<TValue = any> = (
  newValue: TValue,
  oldValue: TValue
) => boolean;

export type ValSubscriber<TValue = any, TMeta = any> = (
  newValue: TValue,
  meta?: TMeta
) => void;

export type ValTransform<TValue = any, TDerivedValue = any> = (
  newValue: TValue
) => TDerivedValue;

export type ValDisposer = () => void;

export type ValOnStart<TValue = any, TMeta = any> = (
  setValue: ValSetValue<TValue, TMeta>
) => void | ValDisposer | undefined;

export interface ValConfig<TValue = any, TMeta = any> {
  /**
   * A function that is called when the number of subscribers goes from zero to one (but not from one to two, etc).
   * That function will be passed a setValue function which changes the value of the val.
   * It may optionally return a disposer function that is called when the subscriber count goes from one to zero.
   */
  beforeSubscribe?: ValOnStart<TValue, TMeta>;
  /**
   * Compare two values. Default `===`.
   */
  compare?: ValCompare<TValue>;
}
