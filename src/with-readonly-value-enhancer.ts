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
 * Bind ReadonlyVals/Vals `value` and itself to properties of an instance.
 *
 * @example
 * ```ts
 * import type { ReadonlyValEnhancedResult } from "value-enhancer";
 * import { Val, withReadonlyValueEnhancer } from "value-enhancer";
 *
 * type ReadonlyValConfig = {
 *   apple: Val<string>
 *   isApple: ReadonlyVal<boolean>
 * };
 *
 * interface Obj extends ReadonlyValEnhancedResult<ReadonlyValConfig> {}
 *
 * class Obj {
 *   constructor() {
 *     const apple$ = new Val("apple");
 *     const isApple$ = derive(apple$, (apple) => apple === "apple");
 *
 *     withReadonlyValueEnhancer(this, {
 *       apple: apple$,
 *       isApple: isApple$,
 *     })
 *   }
 * }
 * ```
 *
 * `const obj = new Obj()` results in:
 * - `obj.apple`, a getter that returns `apple$.value`
 * - `obj._apple$`, the `apple$`
 * - `obj.isApple`, a getter that returns `isApple$.value`
 * - `obj._isApple$`, the `isApple$`
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
 * Bind a ReadonlyVal/Val to a property of an instance.
 *
 * @example
 * `bindInstance(Obj, "aKey", val)` results in:
 * - `Obj.aKey`, value of `val.value`
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
