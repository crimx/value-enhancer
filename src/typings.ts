export type ValCompare<TValue = any> = (
  newValue: TValue,
  oldValue: TValue
) => boolean;

export type ValReactionSubscriber<TValue = any, TMeta = any> = (
  newValue: TValue,
  oldValue: TValue,
  meta?: TMeta
) => void;

export type ValSubscriber<TValue = any, TMeta = any> = (
  newValue: TValue,
  oldValue: TValue | undefined,
  meta?: TMeta
) => void;

export type ValTransform<TValue = any, TDerivedValue = any, TMeta = any> = (
  newValue: TValue,
  oldValue: TValue | undefined,
  meta?: TMeta
) => TDerivedValue;

export type ValDisposer = () => void;
