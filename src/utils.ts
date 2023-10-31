import type { ReadonlyVal, ValInputsValueTuple } from "./typings";

/** Returns the value passed in. */
export const identity = <TValue>(value: TValue): TValue => value;

export const defaultCompare = Object.is;

const getValue = <TValue>(val: ReadonlyVal<TValue>): TValue => val.value;

export const getValues = <TValInputs extends readonly ReadonlyVal[]>(
  valInputs: TValInputs
): [...ValInputsValueTuple<TValInputs>] =>
  valInputs.map(getValue) as [...ValInputsValueTuple<TValInputs>];

export const invoke = <TValue>(
  fn: (value: TValue) => void,
  value: TValue
): void => {
  try {
    fn(value);
  } catch (e) {
    console.error(e);
  }
};

export const INIT_VALUE: any = {};

/**
 * Checks if `val` is `ReadonlyVal` or `Val`.
 *
 * @returns `true` if `val` is `ReadonlyVal` or `Val`.
 */
export const isVal = <T>(val: T): val is T extends ReadonlyVal ? T : never =>
  !!(val as ReadonlyVal | undefined)?.$valCompute;

/**
 * @ignore
 * @deprecated No longer needed. `isVal` works without `markVal` now.
 */
export const markVal: <T extends ReadonlyVal>(val: T) => T = identity;
