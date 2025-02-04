import { type Get, type ReadonlyVal, type ValConfig } from "./typings";
import { isVal } from "./utils";
import { ValImpl } from "./val";

export interface ComputeFn<TValue> {
  (get: Get): TValue;
}

export const compute = <TValue>(fn: ComputeFn<TValue>, config?: ValConfig<TValue>): ReadonlyVal<TValue> => {
  let running: boolean | undefined;

  let self: ValImpl<TValue>;

  const get = <T = any>(val$?: ReadonlyVal<T> | T | { $: ReadonlyVal<T> }): T | undefined => {
    if (!isVal(val$)) {
      return val$ as T | undefined;
    }

    self.addDep_(val$ as ValImpl);

    return val$.get();
  };

  return new ValImpl(v => {
    self = v;

    const isFirst = !running;
    running = true;

    if (isFirst && self.deps_?.size) {
      for (const dep of self.deps_.keys()) {
        self.removeDep_(dep);
      }
    }

    try {
      return fn(get);
    } finally {
      if (isFirst) {
        running = false;
      }
    }
  }, config);
};
