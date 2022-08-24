import { ReadonlyVal } from "./readonly-val";
import type { ValConfig } from "./typings";

export type TValInputsValueTuple<TValInputs extends readonly ReadonlyVal[]> =
  Readonly<{
    [K in keyof TValInputs]: ExtractValValue<TValInputs[K]>;
  }>;

export type ExtractValValue<TVal> = TVal extends ReadonlyVal<infer TValue>
  ? TValue
  : never;

export type CombineValTransform<
  TDerivedValue = any,
  TValues extends readonly any[] = any[],
  TMeta = any
> = (newValues: TValues, oldValues?: TValues, meta?: TMeta) => TDerivedValue;

export class CombinedVal<
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[],
  TValue = any
> extends ReadonlyVal<TValue> {
  public constructor(
    valInputs: TValInputs,
    transform: CombineValTransform<
      TValue,
      [...TValInputsValueTuple<TValInputs>]
    >,
    config: ValConfig<TValue> = {}
  ) {
    super(transform(getValues(valInputs)), {
      ...config,
      beforeSubscribe: set => {
        let lastValueInputs = getValues(valInputs);
        set(transform(lastValueInputs));
        const disposers = valInputs.map((val, i) =>
          val.reaction(value => {
            lastValueInputs = lastValueInputs.slice() as [
              ...TValInputsValueTuple<TValInputs>
            ];
            lastValueInputs[i] = value;
            set(transform(lastValueInputs));
          })
        );
        const disposer = () => disposers.forEach(disposer => disposer());

        if (config.beforeSubscribe) {
          const beforeSubscribeDisposer = config.beforeSubscribe(set);
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
    if (this.size <= 0) {
      const value = this._srcValue();
      return this._cp(value, this._value) ? this._value : value;
    }
    return this._value;
  }

  private _srcValue: () => TValue;
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
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[]
>(
  valInputs: readonly [...TValInputs]
): ReadonlyVal<[...TValInputsValueTuple<TValInputs>]>;
export function combine<
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[],
  TValue = any
>(
  valInputs: readonly [...TValInputs],
  transform: CombineValTransform<TValue, [...TValInputsValueTuple<TValInputs>]>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue>;
export function combine<
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[],
  TValue = any
>(
  valInputs: readonly [...TValInputs],
  transform: CombineValTransform<
    TValue,
    [...TValInputsValueTuple<TValInputs>]
  > = value => value as TValue,
  config: ValConfig<TValue> = {}
): ReadonlyVal<TValue> {
  return new CombinedVal(valInputs, transform, config);
}
