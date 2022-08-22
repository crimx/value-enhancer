/* eslint-disable @typescript-eslint/ban-types */

import type { ExtractValMeta, ExtractValValue } from "./combine";
import type { Val } from "./val";
import type { ValManager } from "./val-manager";
import type { WithOnValChanged } from "./with-on-val-changed";
import { withOnValChanged } from "./with-on-val-changed";

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

type ValEnhancedProps<TVal, TKey extends string> = Readonly<
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
  ? ValEnhancedProps<TConfig[TKey], TKey>
  : never;

export type ValEnhancedResult<TConfig> = WithOnValChanged<
  TConfig,
  IntersectionFromUnion<ToValUnion<TConfig>>
>;

/**
 * Bind Vals `value`, `set` and itself to properties of an instance.
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
 * - `obj.apple`, a getter that returns `apple$.value`, setter same as `apple$.set(value)`
 * - `obj._apple$`, the `apple$`
 * - `obj.setApple(value)`, same as `apple$.set(value)`
 * - `obj.banana`, a getter that returns `banana$.value`, setter same as `banana$.set(value)`
 * - `obj.setBanana(value)`, same as `banana$.set(value)`
 * - `obj._banana$`, the `banana$`
 * - `obj.onValChanged(key: "apple" | "isApple", listener)`, equals to calling <code>obj[\`_${key}$\`].reaction</code>
 */
export function withValueEnhancer<
  TInstance extends ValEnhancedResult<TConfig>,
  TConfig extends ValEnhancerConfig
>(instance: TInstance, config: TConfig, valManager?: ValManager): void {
  Object.keys(config).forEach(key => {
    bindInstance(instance, key, config[key]);
    if (valManager) {
      valManager.attach(config[key]);
    }
  });
  withOnValChanged(instance);
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
 * - `obj.aKey`, getter that returns `val.value`, setter same as `val.set(value)`
 * - `obj.setAKey(value)`, same as `val.set(value)`
 * - `obj._aKey$`, the `val`
 * @returns Same instance with bound properties
 */
export function bindInstance<TInstance, TKey extends string, TValue, TMeta>(
  instance: TInstance,
  key: TKey,
  val: Val<TValue, TMeta>
): ValEnhancedProps<TValue, TKey> & TInstance {
  Object.defineProperties(instance, {
    [key]: {
      get() {
        return val.value;
      },
      set(value) {
        val.set(value);
      },
    },
    [`_${key}$`]: {
      value: val,
    },
    [`set${capitalize(key)}`]: {
      value: (value: TValue, meta?: TMeta): void => val.set(value, meta),
    },
  });
  return instance as ValEnhancedProps<TValue, TKey> & TInstance;
}

function capitalize<TStr extends string>(str: TStr): Capitalize<TStr> {
  return (str[0].toUpperCase() + str.slice(1)) as Capitalize<TStr>;
}
