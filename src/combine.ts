import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, ValConfig } from "./typings";

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
        (val as ReadonlyValImpl)._compute(() => {
          if (!this._dirty) {
            this._dirty = true;
            this._subs.invoke();
          }
        })
      );
      return () => disposers.forEach(dispose);
    });

    this._sVals = valInputs;
    this._sOldValues = sOldValues;
    this._transform = transform;
  }

  public override get value(): TValue {
    if (this._dirty || this._subs.size <= 0) {
      this._dirty = false;
      const sNewValues = this._newValues();
      if (sNewValues !== this._sOldValues) {
        this._sOldValues = sNewValues;
        const value = this._transform(sNewValues);
        if (!this._compare(value, this._value)) {
          this._value = value;
        }
      }
    }
    return this._value;
  }

  private _sVals: TValInputs;
  private _sOldValues: [...TValInputsValueTuple<TValInputs>];
  private _transform: CombineValTransform<
    TValue,
    [...TValInputsValueTuple<TValInputs>]
  >;
  private _dirty = false;

  private _newValues(): [...TValInputsValueTuple<TValInputs>] {
    for (let i = 0; i < this._sVals.length; i++) {
      if (this._sVals[i].value !== this._sOldValues[i]) {
        return getValues(this._sVals);
      }
    }
    return this._sOldValues;
  }
}

function getValues<TValInputs extends readonly ReadonlyVal[]>(
  valInputs: TValInputs
): [...TValInputsValueTuple<TValInputs>] {
  return valInputs.map(getValue) as [...TValInputsValueTuple<TValInputs>];
}

function getValue<TValue>(val: ReadonlyVal<TValue>): TValue {
  return val.value;
}

function dispose(disposer: () => void) {
  disposer();
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
