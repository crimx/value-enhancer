/* eslint-disable @typescript-eslint/ban-types */

import type { ExtractValMeta, ExtractValValue } from "./combine";
import type { Val } from "./val";
import type { ValManager } from "./val-manager";

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
  Record<`_${TKey}$`, TVal> &
    Record<
      `set${Capitalize<TKey>}`,
      (value: ExtractValValue<TVal>, meta?: ExtractValMeta<TVal>) => void
    >
> &
  Record<TKey, ExtractValValue<TVal>>;

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

/**
 * Bind Vals `value`, `setValue` and itself to properties of an instance.
 *
 * @example
 * ```ts
 * import type { ValEnhancedResult } from "value-enhancer";
 * import { Val, withValueEnhancer } from "value-enhancer";
 *
 * type ValConfig = {
 *   apple: Val<string>
 *   banana: Val<string>
 * };
 *
 * interface Obj extends ValEnhancedResult<ValConfig> {}
 *
 * class Obj {
 *   constructor() {
 *     const apple$ = new Val("apple");
 *     const banana$ = new Val("banana");
 *
 *     withValueEnhancer(this, {
 *       apple: apple$,
 *       banana: banana$,
 *     })
 *   }
 * }
 * ```
 *
 * `const obj = new Obj()` results in:
 * - `obj.apple`, a getter that returns `apple$.value`, setter same as `apple$.setValue(value)`
 * - `obj._apple$`, the `apple$`
 * - `obj.setApple(value)`, same as `apple$.setValue(value)`
 * - `obj.banana`, a getter that returns `banana$.value`, setter same as `banana$.setValue(value)`
 * - `obj.setBanana(value)`, same as `banana$.setValue(value)`
 * - `obj._banana$`, the `banana$`
 */
export function withValueEnhancer<TInstance, TConfig extends ValEnhancerConfig>(
  instance: TInstance,
  config: TConfig,
  valManager?: ValManager
): void {
  Object.keys(config).forEach(key => {
    bindInstance(instance, key, config[key]);
    if (valManager) {
      valManager.attach(config[key]);
    }
  });
}

export type BindVal = <TKey extends string, TValue, TMeta>(
  key: TKey,
  val: Val<TValue, TMeta>
) => Val<TValue, TMeta>;

/**
 * Bind a Val to a property of an instance.
 *
 * @example
 * `bindInstance(obj, "aKey", val)` results in:
 * - `obj.aKey`, getter that returns `val.value`, setter same as `val.setValue(value)`
 * - `obj.setAKey(value)`, same as `val.setValue(value)`
 * - `obj._aKey$`, the `val`
 * @returns Same instance with bound properties
 */
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
      set(value) {
        val.setValue(value);
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
