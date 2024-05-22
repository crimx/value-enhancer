import type { ReadonlyVal, ValConfig } from "./typings";

import { from } from "./from";
import { identity, INIT_VALUE, strictEqual } from "./utils";

export type DerivedValTransform<TValue = any, TDerivedValue = any> = (
  newValue: TValue
) => TDerivedValue;

interface Derive {
  /**
   * Derive a new val with same value from the given val.
   * @param val Input value.
   * @returns A readonly val with same value as the input val.
   */
  <TSrcValue = any, TValue = any>(
    val: ReadonlyVal<TSrcValue>
  ): ReadonlyVal<TValue>;
  /**
   * Derive a new val with transformed value from the given val.
   * @param val Input value.
   * @param transform A pure function that takes an input value and returns a new value.
   * @param config custom config for the combined val.
   * @returns A readonly val with transformed value from the input val.
   */
  <TSrcValue = any, TValue = any>(
    val: ReadonlyVal<TSrcValue>,
    transform: DerivedValTransform<TSrcValue, TValue>,
    config?: ValConfig<TValue>
  ): ReadonlyVal<TValue>;
}

export const derive: Derive = <
  TSrcValue = any,
  TValue = any,
  TSrcVal extends ReadonlyVal<TSrcValue> = ReadonlyVal
>(
  val: TSrcVal,
  transform: DerivedValTransform<
    TSrcValue,
    TValue
  > = identity as DerivedValTransform<TSrcValue, TValue>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> => {
  let cachedValue: TValue;
  let cachedSrcVersion: TSrcValue = INIT_VALUE;

  return from(
    () => {
      const version = val.$version;
      if (!strictEqual(version, cachedSrcVersion)) {
        cachedSrcVersion = version;
        cachedValue = transform(val.value);
      }
      return cachedValue;
    },
    notify => val.$valCompute(notify),
    config
  );
};
