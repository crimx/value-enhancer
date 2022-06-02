/* eslint-disable @typescript-eslint/ban-types */

import type { ExtractValValue } from "./combine";
import type { ReadonlyVal } from "./readonly-val";

type IntersectionFromUnion<TUnion> = (
  TUnion extends any ? (arg: TUnion) => void : never
) extends (arg: infer TArg) => void
  ? TArg
  : never;

type ExtractReadonlyValKeys<
  TInstance,
  TKey = keyof TInstance
> = TKey extends Extract<keyof TInstance, string>
  ? TInstance[TKey] extends ReadonlyVal
    ? TKey
    : never
  : never;

export type ReadonlyValEnhancer<TVal, TKey extends string> = Readonly<
  Record<TKey, ExtractValValue<TVal>> & Record<`_${TKey}$`, TVal>
>;

export type ReadonlyValEnhancerConfig = Record<string, ReadonlyVal>;

type ToReadonlyValUnion<
  TConfig,
  TKey = ExtractReadonlyValKeys<TConfig>
> = TKey extends ExtractReadonlyValKeys<TConfig>
  ? ReadonlyValEnhancer<TConfig[TKey], TKey>
  : never;

export type ReadonlyValEnhancedResult<TConfig> = IntersectionFromUnion<
  ToReadonlyValUnion<TConfig>
>;

/**
 * Loop through a config object and `bindInstance` each val to the instance.
 */
export function withReadonlyValueEnhancer<
  TInstance,
  TConfig extends ReadonlyValEnhancerConfig
>(instance: TInstance, config: TConfig): void {
  Object.keys(config).forEach(key => {
    bindInstance(instance, key, config[key]);
  });
}

/**
 * Bind a Val to a property of an instance.
 * `bindInstance(Obj, "aKey", val)` results in:
 * - `Obj.aKey`, value of `val.value`
 * - `Obj.setAKey(value)`
 * - `Obj._aKey$`, the `val`
 * @returns Same instance with bound properties
 */
function bindInstance<TInstance, TKey extends string, TValue, TMeta>(
  instance: TInstance,
  key: TKey,
  val: ReadonlyVal<TValue, TMeta>
): ReadonlyValEnhancer<TValue, TKey> & TInstance {
  Object.defineProperties(instance, {
    [key]: {
      get() {
        return val.value;
      },
    },
    [`_${key}$`]: {
      value: val,
    },
  });
  return instance as ReadonlyValEnhancer<TValue, TKey> & TInstance;
}
