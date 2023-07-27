import type { ReadonlyVal, ValConfig, ValInputsValueTuple } from "./typings";

import { from } from "./from";
import { getValues, identity, invoke } from "./utils";

export type CombineValTransform<
  TDerivedValue = any,
  TValues extends readonly any[] = any[],
  TMeta = any
> = (newValues: TValues, oldValues?: TValues, meta?: TMeta) => TDerivedValue;

/**
 * Combines an array of vals into a single val with the array of values.
 * @param valInputs An array of vals to combine.
 * @returns A readonly val with the combined values.
 */
export function combine<
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[]
>(
  valInputs: readonly [...TValInputs]
): ReadonlyVal<[...ValInputsValueTuple<TValInputs>]>;
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
  transform: CombineValTransform<TValue, [...ValInputsValueTuple<TValInputs>]>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue>;
export function combine<
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[],
  TValue = any
>(
  valInputs: readonly [...TValInputs],
  transform: CombineValTransform<
    TValue,
    [...ValInputsValueTuple<TValInputs>]
  > = identity as CombineValTransform<
    TValue,
    [...ValInputsValueTuple<TValInputs>]
  >,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> {
  return from(
    () => transform(getValues(valInputs)),
    notify => {
      const disposers = valInputs.map(val => val.$valCompute(notify));
      return () => disposers.forEach(invoke);
    },
    config
  );
}
