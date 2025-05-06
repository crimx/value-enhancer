import { isVal, UNIQUE_VALUE } from "./utils";
import { type ValImpl } from "./val";

const SCOPE: unique symbol = Symbol.for("[val-batch]");

declare const globalThis: {
  [SCOPE]?: boolean;
};

export const dirtyVals = /* @__PURE__ */ new Set<(() => void) | ValImpl>();

export const batchStart = (): boolean => (globalThis[SCOPE] ? false : (globalThis[SCOPE] = true));

export const batchFlush = (): void => {
  if (globalThis[SCOPE]) {
    let error: unknown = UNIQUE_VALUE;
    for (const v of dirtyVals) {
      dirtyVals.delete(v);

      if (isVal(v)) {
        if (v.subs_ && v.lastSubInvokeVersion_ !== v.$version) {
          v.lastSubInvokeVersion_ = v.$version;
          const value = v.get();
          for (const sub of v.subs_) {
            try {
              sub(value);
            } catch (e) {
              error = e;
            }
          }
        }
      } else {
        try {
          v();
        } catch (e) {
          error = e;
        }
      }
    }

    globalThis[SCOPE] = false;

    if (error !== UNIQUE_VALUE) {
      throw error;
    }
  }
};

export const batch = <T>(fn: () => T, thisArg?: any): T => {
  const isFirst = batchStart();

  try {
    return fn.call(thisArg);
  } finally {
    isFirst && batchFlush();
  }
};

export interface Invoke {
  (fn: () => void): void;
  <TValue>(fn: (value: TValue) => void, value: TValue): void;
}

export const invoke: Invoke = <TValue>(fn: (value?: TValue) => void, value?: TValue): void => {
  try {
    fn(value);
  } catch (e) {
    globalThis[SCOPE] = false;
    throw e;
  }
};
