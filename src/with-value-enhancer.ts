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
    Record<`$${TKey}`, TVal> &
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
    enhanceVal(instance, key, config[key]);
  });
}

export function enhanceVal<TInstance, TKey extends string, TValue, TMeta>(
  instance: TInstance,
  key: TKey,
  val: Val<TValue>
): void {
  Object.defineProperties(instance, {
    [key]: {
      get() {
        return val.value;
      },
    },
    [`$${key}`]: {
      value: val,
    },
    [`set${capitalize(key)}`]: {
      value: (value: TValue, meta?: TMeta): void => val.setValue(value, meta),
    },
  });
}

function capitalize<TStr extends string>(str: TStr): Capitalize<TStr> {
  return (str[0].toUpperCase() + str.slice(1)) as Capitalize<TStr>;
}
