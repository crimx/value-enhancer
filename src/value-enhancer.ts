import type { CreateVal } from "./val";
import { ValImpl } from "./val";
import type { DerivedValTransform, CreateDerive } from "./derived-val";
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
  transform: DerivedValTransform<
    TSrcValue,
    TValue
  > = identity as DerivedValTransform<TSrcValue, TValue>,
  config?: ValConfig<TValue>
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
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> => new CombinedValImpl(valInputs, transform, config);

/**
 * Subscribe to value changes with immediate emission.
 * @param val
 * @param subscriber
 * @param eager by default subscribers will be notified on next tick. set `true` to notify subscribers of value changes synchronously.
 * @returns a disposer function that cancels the subscription
 */
export const subscribe = <TValue>(
  val: ReadonlyVal<TValue>,
  subscriber: ValSubscriber<TValue>,
  eager?: boolean
): ValDisposer => val.subscribe(subscriber, eager);

/**
 * Subscribe to value changes without immediate emission.
 * @param val
 * @param subscriber
 * @param eager by default subscribers will be notified on next tick. set `true` to notify subscribers of value changes synchronously.
 * @returns a disposer function that cancels the subscription
 */
export const reaction = <TValue>(
  val: ReadonlyVal<TValue>,
  subscriber: ValSubscriber<TValue>,
  eager?: boolean
): ValDisposer => val.reaction(subscriber, eager);

/**
 * Remove the given subscriber.
 * Remove all if no subscriber provided.
 * @param val
 * @param subscriber
 */
export const unsubscribe = <TValue>(
  val: ReadonlyVal<TValue>,
  subscriber?: (...args: any[]) => any
): void => val.unsubscribe(subscriber);
