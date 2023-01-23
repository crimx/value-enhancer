import type { ReadonlyVal, ValSubscriber, ValDisposer } from "./typings";

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
