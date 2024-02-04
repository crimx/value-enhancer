import type {
  ReadonlyVal,
  ValConfig,
  ValInputsValueTuple,
  ValVersion,
} from "./typings";

import { from } from "./from";
import {
  arrayShallowEqual,
  getValVersion,
  getValues,
  identity,
  invoke,
} from "./utils";

export type CombineValTransform<
  TCombinedValue = any,
  TValues extends readonly any[] = any[]
> = (newValues: TValues) => TCombinedValue;

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
  let cachedValue: TValue;
  let cachedSrcVersions: readonly ValVersion[] | undefined;

  return from(
    () => {
      const versions = valInputs.map(getValVersion);
      if (
        !cachedSrcVersions ||
        !arrayShallowEqual(versions, cachedSrcVersions)
      ) {
        cachedSrcVersions = versions;
        cachedValue = transform(getValues(valInputs));
      }
      return cachedValue;
    },
    notify => {
      const disposers = valInputs.map(val => val.$valCompute(notify));
      return () => disposers.forEach(invoke);
    },
    config
  );
}
