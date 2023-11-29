import type { ReadonlyVal, ValConfig } from "./typings";

import { from } from "./from";
import { INIT_VALUE, identity } from "./utils";

export type DerivedValTransform<TValue = any, TDerivedValue = any> = (
  newValue: TValue
) => TDerivedValue;

/**
 * Derive a new val with same value from the given val.
 * @param val Input value.
 * @returns A readonly val with same value as the input val.
 */
export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>
): ReadonlyVal<TValue>;
/**
 * Derive a new val with transformed value from the given val.
 * @param val Input value.
 * @param transform A pure function that takes an input value and returns a new value.
 * @param config custom config for the combined val.
 * @returns A readonly val with transformed value from the input val.
 */
export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  transform: DerivedValTransform<TSrcValue, TValue>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue>;
export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  transform: DerivedValTransform<
    TSrcValue,
    TValue
  > = identity as DerivedValTransform<TSrcValue, TValue>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> {
  let cachedValue: TValue;
  let cachedSrcValue: TSrcValue = INIT_VALUE;

  return from(
    () =>
      val.equal(val.value, cachedSrcValue)
        ? cachedValue
        : (cachedValue = transform((cachedSrcValue = val.value))),
    notify => val.$valCompute(notify),
    config
  );
}
