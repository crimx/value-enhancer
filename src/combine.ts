import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, TValInputsValueTuple, ValConfig } from "./typings";
import { invoke, getValues, INIT_VALUE, identity } from "./utils";

type CombineValTransform<
  TDerivedValue = any,
  TValues extends readonly any[] = any[],
  TMeta = any
> = (newValues: TValues, oldValues?: TValues, meta?: TMeta) => TDerivedValue;

class CombinedValImpl<
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
    config?: ValConfig<TValue>
  ) {
    super(INIT_VALUE, config, () => {
      if (this._value_ === INIT_VALUE) {
        this._value_ = transform(getValues(this._sVal_));
      } else {
        this._dirtyLevel_ = this._dirtyLevel_ || 1;
      }
      const disposers = valInputs.map(val =>
        (val as ReadonlyValImpl)._compute_(() => {
          if (this._dirtyLevel_ < 2) {
            this._dirtyLevel_ = 2;
            this._subs_.invoke_();
          }
        })
      );
      return () => disposers.forEach(invoke);
    });

    this._sVal_ = valInputs;
    this._transform_ = transform;
  }

  public override get value(): TValue {
    if (this._value_ === INIT_VALUE) {
      this._value_ = this._transform_(getValues(this._sVal_));
      this._subs_.shouldExec_ = true;
    } else if (this._dirtyLevel_ || this._subs_.subscribers_.size <= 0) {
      const value = this._transform_(getValues(this._sVal_));
      if (!this._compare_(value, this._value_)) {
        this._subs_.shouldExec_ = true;
        this._value_ = value;
      }
    }
    this._dirtyLevel_ = 0;
    return this._value_;
  }

  private _sVal_: TValInputs;
  private _transform_: CombineValTransform<
    TValue,
    [...TValInputsValueTuple<TValInputs>]
  >;
  private _dirtyLevel_ = 0;
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
  > = identity as CombineValTransform<
    TValue,
    [...TValInputsValueTuple<TValInputs>]
  >,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> {
  return new CombinedValImpl(valInputs, transform, config);
}
