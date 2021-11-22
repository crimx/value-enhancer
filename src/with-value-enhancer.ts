/* eslint-disable @typescript-eslint/ban-types */

import type { ExtractValMeta, ExtractValValue } from "./combine";
import type { Val } from "./val";

type IntersectionFromUnion<TUnion> = (
  TUnion extends any ? (arg: TUnion) => void : never
) extends (arg: infer TArg) => void
  ? TArg
  : never;

type ExtractValKeys<TInstance, TKey = keyof TInstance> = TKey extends Extract<
  keyof TInstance,
  string
>
  ? TInstance[TKey] extends Val
    ? TKey
    : never
  : never;

export type ValEnhancer<TVal, TKey extends string> = Readonly<
  Record<TKey, ExtractValValue<TVal>> &
    Record<`_${TKey}$`, TVal> &
    Record<
      `set${Capitalize<TKey>}`,
      (value: ExtractValValue<TVal>, meta?: ExtractValMeta<TVal>) => void
    >
>;

export type ValEnhancerConfig = Record<string, Val>;

type ToValUnion<
  TConfig,
  TKey = ExtractValKeys<TConfig>
> = TKey extends ExtractValKeys<TConfig>
  ? ValEnhancer<TConfig[TKey], TKey>
  : never;

export type ValEnhancedResult<TConfig> = IntersectionFromUnion<
  ToValUnion<TConfig>
>;

export function withValueEnhancer<TInstance, TConfig extends ValEnhancerConfig>(
  instance: TInstance,
  config: TConfig
): void {
  Object.keys(config).forEach(key => {
    bindInstance(instance, key, config[key]);
  });
}

export type BindVal = <TKey extends string, TValue, TMeta>(
  key: TKey,
  val: Val<TValue, TMeta>
) => Val<TValue, TMeta>;

export function createInstanceBinder<TInstance>(instance: TInstance): BindVal {
  const bindVal: BindVal = (key, val) => {
    bindInstance(instance, key, val);
    return val;
  };
  return bindVal;
}

export function bindInstance<TInstance, TKey extends string, TValue, TMeta>(
  instance: TInstance,
  key: TKey,
  val: Val<TValue, TMeta>
): ValEnhancer<TValue, TKey> & TInstance {
  Object.defineProperties(instance, {
    [key]: {
      get() {
        return val.value;
      },
    },
    [`_${key}$`]: {
      value: val,
    },
    [`set${capitalize(key)}`]: {
      value: (value: TValue, meta?: TMeta): void => val.setValue(value, meta),
    },
  });
  return instance as ValEnhancer<TValue, TKey> & TInstance;
}

function capitalize<TStr extends string>(str: TStr): Capitalize<TStr> {
  return (str[0].toUpperCase() + str.slice(1)) as Capitalize<TStr>;
}
