import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, ValConfig } from "./typings";

const getValue = <TValue>(val: ReadonlyVal<TValue>): TValue => val.value;
const getValues = <TValInputs extends readonly ReadonlyVal[]>(
  valInputs: TValInputs
): [...TValInputsValueTuple<TValInputs>] =>
  valInputs.map(getValue) as [...TValInputsValueTuple<TValInputs>];
const dispose = (disposer: () => void) => disposer();

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

export class CombinedValImpl<
    TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[],
    TValue = any
  >
  extends ReadonlyValImpl<TValue>
  implements ReadonlyVal<TValue>
{
  public constructor(
    valInputs: TValInputs,
    transform: CombineValTransform<
      TValue,
      [...TValInputsValueTuple<TValInputs>]
    >,
    config: ValConfig<TValue>
  ) {
    const sOldValues = getValues(valInputs);
    super(transform(sOldValues), config, () => {
      const disposers = valInputs.map(val =>
        (val as ReadonlyValImpl)._compute_(() => {
          if (!this._dirty_) {
            this._dirty_ = true;
            this._subs_.invoke_();
          }
        })
      );
      return () => disposers.forEach(dispose);
    });

    this._sVals_ = valInputs;
    this._sOldValues_ = sOldValues;
    this._transform_ = transform;
  }

  public override get value(): TValue {
    if (this._dirty_ || this._subs_.size_ <= 0) {
      this._dirty_ = false;
      const sNewValues = this._newValues_();
      if (sNewValues) {
        const value = this._transform_(sNewValues);
        if (!this._compare_(value, this._value_)) {
          this._value_ = value;
        }
      }
    }
    return this._value_;
  }

  private _sVals_: TValInputs;
  private _sOldValues_: [...TValInputsValueTuple<TValInputs>];
  private _transform_: CombineValTransform<
    TValue,
    [...TValInputsValueTuple<TValInputs>]
  >;
  private _dirty_ = false;

  private _newValues_(): [...TValInputsValueTuple<TValInputs>] | undefined {
    for (let i = 0; i < this._sVals_.length; i++) {
      if (this._sVals_[i].value !== this._sOldValues_[i]) {
        return (this._sOldValues_ = getValues(this._sVals_));
      }
    }
  }
}

/**
 * Combines an array of vals into a single val with the array of values.
 * @param valInputs An array of vals to combine.
 * @returns A readonly val with the combined values.
 */
export function combine<
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[]
>(
  valInputs: readonly [...TValInputs]
): ReadonlyVal<[...TValInputsValueTuple<TValInputs>]>;
/**
 * Combines an array of vals into a single val with transformed value.
 * @param valInputs An array of vals to combine.
 * @param transform A pure function that takes an array of values and returns a new value.
 * @param config custom config for the combined val.
 * @returns A readonly val with the transformed values.
 */
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
  return new CombinedValImpl(valInputs, transform, config);
}
