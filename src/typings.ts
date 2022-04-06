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
  beforeSubscribe?: ValOnStart<TValue, TMeta>;
  afterSubscribe?: ValOnStart<TValue, TMeta>;
  compare?: ValCompare<TValue>;
}
