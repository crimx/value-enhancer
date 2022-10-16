import type { ReadonlyVal, TValInputsValueTuple } from "./typings";

export const identity = <TValue>(value: TValue): TValue => value;

const getValue = <TValue>(val: ReadonlyVal<TValue>): TValue => val.value;

export const getValues = <TValInputs extends readonly ReadonlyVal[]>(
  valInputs: TValInputs
): [...TValInputsValueTuple<TValInputs>] =>
  valInputs.map(getValue) as [...TValInputsValueTuple<TValInputs>];

export const dispose = (disposer: () => void): void => disposer();

export const INIT_VALUE: any = {};
