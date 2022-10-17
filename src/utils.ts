import type { ReadonlyVal, TValInputsValueTuple } from "./typings";

export const identity = <TValue>(value: TValue): TValue => value;

const getValue = <TValue>(val: ReadonlyVal<TValue>): TValue => val.value;

export const getValues = <TValInputs extends readonly ReadonlyVal[]>(
  valInputs: TValInputs
): [...TValInputsValueTuple<TValInputs>] =>
  valInputs.map(getValue) as [...TValInputsValueTuple<TValInputs>];

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
