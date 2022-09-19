import type { CreateVal } from "./val";
import { ValImpl } from "./val";
import type { DeriveValTransform, CreateDerive } from "./derived-val";
import { DerivedValImpl } from "./derived-val";
import type { CombineValTransform, CreateCombine } from "./combine";
import { CombinedValImpl } from "./combine";

import type {
  ReadonlyVal,
  Val,
  TValInputsValueTuple,
  ValConfig,
  ValSubscriber,
  ValDisposer,
} from "./typings";

import { identity } from "./utils";

/**
 * Creates a writable val.
 * @param value Initial value.
 * @param config Custom config.
 */
export const val: CreateVal = <TValue = any>(
  value?: TValue,
  config?: ValConfig<TValue>
): Val<TValue> => new ValImpl(value as TValue, config);

/**
 * Derive a new val with transformed value from the given val.
 * @param val Input value.
 * @param transform A pure function that takes an input value and returns a new value. Default identity.
 * @param config custom config for the combined val.
 * @returns An readonly val with transformed value from the input val.
 */
export const derive: CreateDerive = <TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  transform: DeriveValTransform<
    TSrcValue,
    TValue
  > = identity as DeriveValTransform<TSrcValue, TValue>,
  config: ValConfig<TValue> = {}
): ReadonlyVal<TValue> => new DerivedValImpl(val, transform, config);

/**
 * Combines an array of vals into a single val with transformed value.
 * @param valInputs An array of vals to combine.
 * @param transform A pure function that takes an array of values and returns a new value. Default identity.
 * @param config custom config for the combined val.
 * @returns A readonly val with the transformed values.
 */
export const combine: CreateCombine = <
  TValInputs extends readonly ReadonlyVal[] = ReadonlyVal[],
  TValue = any
>(
  valInputs: readonly [...TValInputs],
  transform: CombineValTransform<
    TValue,
    [...TValInputsValueTuple<TValInputs>]
  > = identity as CombineValTransform<
    TValue,
    [...TValInputsValueTuple<TValInputs>]
  >,
  config: ValConfig<TValue> = {}
): ReadonlyVal<TValue> => new CombinedValImpl(valInputs, transform, config);

export const subscribe = <TValue>(
  val: ReadonlyVal<TValue>,
  subscriber: ValSubscriber<TValue>,
  eager?: boolean
): ValDisposer => val.subscribe(subscriber, eager);

export const reaction = <TValue>(
  val: ReadonlyVal<TValue>,
  subscriber: ValSubscriber<TValue>,
  eager?: boolean
): ValDisposer => val.reaction(subscriber, eager);
