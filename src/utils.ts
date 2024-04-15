import type {
  ReadonlyVal,
  Val,
  ValInputsValueTuple,
  ValVersion,
} from "./typings";

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
  valInputs: TValInputs
): [...ValInputsValueTuple<TValInputs>] =>
  valInputs.map(getValue) as [...ValInputsValueTuple<TValInputs>];

export const getValVersion = (val$: ReadonlyVal): ValVersion => val$.$version;

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

/**
 * Make a readonly Val writable by providing a set method
 * @param val$ a readonly Val
 * @param set a function that sets the value of val$
 * @returns The same val$ but writable
 */
export const makeWritable = <TValue>(
  val$: ReadonlyVal<TValue>,
  set: (this: void, value: TValue) => void
): Val<TValue> => (((val$ as Val<TValue>).set = set), val$ as Val<TValue>);

export const INIT_VALUE: any = {};

/**
 * Checks if `val` is `ReadonlyVal` or `Val`.
 *
 * @returns `true` if `val` is `ReadonlyVal` or `Val`.
 */
export function isVal<T extends ReadonlyVal>(
  val: T
): val is T extends ReadonlyVal ? T : never;
/**
 * Checks if `val` is `ReadonlyVal` or `Val`.
 *
 * @returns `true` if `val` is `ReadonlyVal` or `Val`.
 */
export function isVal(val: unknown): val is ReadonlyVal;
export function isVal(val: unknown): val is ReadonlyVal {
  return !!(val && (val as any).$valCompute);
}
