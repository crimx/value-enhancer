import type { ReadonlyValImpl } from "./readonly-val";
import type {
  ReadonlyVal,
  ValDisposer,
  ValInputsValueTuple,
  ValSubscriber,
} from "./typings";

/** Returns the value passed in. */
export const identity = <TValue>(value: TValue): TValue => value;

export const defaultCompare = <TValue = any>(
  newValue: TValue,
  oldValue: TValue
): boolean => newValue === oldValue;

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

const VAL_SYMBOL = "$\u2009val\u2009";

/**
 * Checks if `val` is `ReadonlyVal` or `Val`.
 *
 * @returns `true` if `val` is `ReadonlyVal` or `Val`.
 */
export const isVal = <T>(val: T): val is T extends ReadonlyVal ? T : never =>
  !!(val as any)?.[VAL_SYMBOL];

/**
 * Marks an object that implements `ReadonlyVal` interface to be `isVal` detectable.
 */
export const markVal = <T extends ReadonlyVal>(val: T): T => {
  Object.defineProperty(val, VAL_SYMBOL, { value: 1 });
  return val;
};

export const compute = (
  val: ReadonlyVal,
  subscriber: ValSubscriber<void>
): ValDisposer => (val as ReadonlyValImpl)._compute_(subscriber);
