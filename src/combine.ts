import { ReadonlyVal } from "./readonly-val";
import type { ValConfig } from "./typings";

export type TValInputsValueTuple<TValInputs extends readonly ReadonlyVal[]> =
  Readonly<{
    [K in keyof TValInputs]: ExtractValValue<TValInputs[K]>;
  }>;

export type ExtractValValue<TVal> = TVal extends ReadonlyVal<infer TValue, any>
  ? TValue
  : never;

export type ExtractValMeta<TVal> = TVal extends ReadonlyVal<any, infer TMeta>
  ? TMeta
  : never;

export type CombineValTransform<
  TDerivedValue = any,
  TValues extends readonly any[] = any[],
  TMeta = any
> = (newValues: TValues, oldValues?: TValues, meta?: TMeta) => TDerivedValue;

export class CombinedVal<
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[],
  TValue = any,
  TMeta = ExtractValMeta<TValInputs[number]>
> extends ReadonlyVal<TValue, TMeta> {
  public constructor(
    valInputs: TValInputs,
    transform: CombineValTransform<
      TValue,
      [...TValInputsValueTuple<TValInputs>],
      TMeta
    >,
    config: ValConfig<TValue, TMeta> = {}
  ) {
    super(transform(getValues(valInputs)), {
      ...config,
      beforeSubscribe: setValue => {
        let lastValueInputs = getValues(valInputs);
        setValue(transform(lastValueInputs));
        const disposers = valInputs.map((val, i) =>
          val.reaction((value, meta) => {
            lastValueInputs = lastValueInputs.slice() as [
              ...TValInputsValueTuple<TValInputs>
            ];
            lastValueInputs[i] = value;
            setValue(transform(lastValueInputs), meta);
          })
        );
        const disposer = () => disposers.forEach(disposer => disposer());

        if (config.beforeSubscribe) {
          const beforeSubscribeDisposer = config.beforeSubscribe(setValue);
          if (beforeSubscribeDisposer) {
            return () => {
              disposer();
              beforeSubscribeDisposer();
            };
          }
        }

        return disposer;
      },
    });

    this._srcValue = () => transform(getValues(valInputs));
  }

  public override get value(): TValue {
    if (this._subscribers.size <= 0) {
      const value = this._srcValue();
      return this.compare(value, this._value) ? this._value : value;
    }
    return this._value;
  }

  protected _srcValue: () => TValue;
}

function getValues<TValInputs extends readonly ReadonlyVal[]>(
  valInputs: TValInputs
): [...TValInputsValueTuple<TValInputs>] {
  return valInputs.map(getValue) as [...TValInputsValueTuple<TValInputs>];
}

function getValue<TValue>(val: ReadonlyVal<TValue>): TValue {
  return val.value;
}

export function combine<
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[],
  TValue = [...TValInputsValueTuple<TValInputs>],
  TMeta = ExtractValMeta<TValInputs[number]>
>(valInputs: readonly [...TValInputs]): CombinedVal<TValInputs, TValue, TMeta>;
export function combine<
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[],
  TValue = any,
  TMeta = ExtractValMeta<TValInputs[number]>
>(
  valInputs: readonly [...TValInputs],
  transform: CombineValTransform<
    TValue,
    [...TValInputsValueTuple<TValInputs>],
    TMeta
  >,
  config?: ValConfig<TValue, TMeta>
): CombinedVal<TValInputs, TValue, TMeta>;
export function combine<
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[],
  TValue = any,
  TMeta = ExtractValMeta<TValInputs[number]>
>(
  valInputs: readonly [...TValInputs],
  transform: CombineValTransform<
    TValue,
    [...TValInputsValueTuple<TValInputs>],
    TMeta
  > = value => value as TValue,
  config: ValConfig<TValue, TMeta> = {}
): CombinedVal<TValInputs, TValue, TMeta> {
  return new CombinedVal(valInputs, transform, config);
}
