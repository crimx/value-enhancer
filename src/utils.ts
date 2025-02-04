import {
  type ReadonlyVal,
  type Val,
  type ValDisposer,
  type ValInputsValueTuple,
  type ValSubscriber,
  type ValVersion,
} from "./typings";

export const BRAND: symbol = /* @__PURE__ */ Symbol.for("value-enhancer");

export const UNIQUE_VALUE: unique symbol = /* @__PURE__ */ Symbol();

export type UNIQUE_VALUE = typeof UNIQUE_VALUE;

/**
 * Set the value of a val.
 * It works for both `Val` and `ReadonlyVal` type (if the `ReadonlyVal` is actually a `Val`).
 * Do nothing if the val is really `ReadonlyVal`.
 */
export const trySetValue = <TValue>(val: ReadonlyVal<TValue>, value: TValue): void => (val as Val<TValue>).set?.(value);

export const setValue = <TValue>(val: Val<TValue>, value: TValue): void => val.set(value);

/**
 * Subscribe to value changes with immediate emission.
 * @param val
 * @param subscriber
 * @returns a disposer function that cancels the subscription
 */
export const subscribe = <TValue>(val: ReadonlyVal<TValue>, subscriber: ValSubscriber<TValue>): ValDisposer =>
  val.subscribe(subscriber);

/**
 * Subscribe to value changes without immediate emission.
 * @param val
 * @param subscriber
 * @returns a disposer function that cancels the subscription
 */
export const reaction = <TValue>(val: ReadonlyVal<TValue>, subscriber: ValSubscriber<TValue>): ValDisposer =>
  val.reaction(subscriber);

/**
 * Remove the given subscriber.
 * Remove all if no subscriber provided.
 * @param val
 * @param subscriber
 */
export const unsubscribe = (
  val: Iterable<ReadonlyVal> | null | ReadonlyVal | undefined,
  subscriber?: (...args: any[]) => any,
): void => {
  if (val) {
    if (isVal(val)) {
      val.unsubscribe(subscriber);
    } else {
      for (const v of val) {
        v.unsubscribe(subscriber);
      }
    }
  }
};

/** Returns the value passed in. */
export const identity = <TValue>(value: TValue): TValue => value;

/**
 * `Object.is`
 */
export const strictEqual = Object.is;

/**
 * Shallow compare two arrays.
 * @param arrA - any value
 * @param arrB - any value
 * @returns `false` if any of:
 *          1. one of arrA or arrB is an array and the other is not
 *          2. arrA and arrB have different lengths
 *          3. arrA and arrB have different values at any index
 */
export const arrayShallowEqual = (arrA: any, arrB: any): boolean => {
  if (strictEqual(arrA, arrB)) {
    return true;
  }
  if (!Array.isArray(arrA) || !Array.isArray(arrB)) {
    return false;
  }
  const len = arrA.length;
  if (arrB.length !== len) {
    return false;
  }
  for (let i = 0; i < len; i++) {
    if (!strictEqual(arrA[i], arrB[i])) {
      return false;
    }
  }
  return true;
};

const getValue = <TValue>(val: ReadonlyVal<TValue>): TValue => val.value;

export const getValues = <TValInputs extends readonly ReadonlyVal[]>(
  valInputs: TValInputs,
): [...ValInputsValueTuple<TValInputs>] => valInputs.map(getValue) as [...ValInputsValueTuple<TValInputs>];

export const getValVersion = (val$: ReadonlyVal): ValVersion => val$.$version;

/**
 * Attach a new setter to a val.
 * @param val$ a readonly Val
 * @param set a function that sets the value of val$
 * @returns The same val$ with the new setter.
 */
export const attachSetter = <TValue>(
  val$: ReadonlyVal<TValue>,
  set: (this: void, value: TValue) => void,
): Val<TValue> => (((val$ as Val<TValue>).set = set), val$ as Val<TValue>);

interface IsVal {
  (val$: unknown): val$ is ReadonlyVal;
  (val$: any): val$ is ReadonlyVal;
  <T extends ReadonlyVal>(val$: T): val$ is T extends ReadonlyVal ? T : never;
}

/**
 * Checks if `val` is `ReadonlyVal` or `Val`.
 *
 * @returns `true` if `val` is `ReadonlyVal` or `Val`.
 */
export const isVal: IsVal = (val$: unknown): val$ is ReadonlyVal => (val$ as ReadonlyVal | undefined)?.brand === BRAND;

/**
 * Checks if `val` is a readonly `Val`.
 * @returns `true` if `val` is a readonly `Val`.
 */
export const isReadonly = <TValue>(val$: ReadonlyVal<TValue>): val$ is Val<TValue> => !(val$ as Val)?.set;
