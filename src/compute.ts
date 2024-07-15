import { ValAgent } from "./agent";
import type { ReadonlyVal, UnwrapVal, ValConfig, ValDisposer } from "./typings";
import { invoke, isVal } from "./utils";
import { ValImpl } from "./val";

export interface ComputeGet {
  <T = any>(val$: ReadonlyVal<T>): T;
  <T = any>(val$?: ReadonlyVal<T>): T | undefined;
  <T = any>(val$: { $: ReadonlyVal<T> }): T;
  <T = any>(val$?: { $: ReadonlyVal<T> }): T | undefined;
  <T = any>(val$: T): UnwrapVal<T>;
  <T = any>(val$?: T): UnwrapVal<T> | undefined;
}

/**
 * Create a computed val that subscribes to other vals dynamically.
 *
 * The `get` function passed to the effect callback can be used to get the current value of a Val and subscribe to it.
 * The effect callback will be re-evaluated whenever the dependencies change.
 * Stale dependencies are unsubscribed automatically.
 *
 * @param effect - The effect function which will be called immediately and whenever the dependencies change.
 * @param config - Optional val config.
 * @returns A computed val.
 *
 * @example
 * ```ts
 * import { compute, val } from "value-enhancer";
 *
 * const a$ = val(1);
 * const b$ = val("b");
 * const c$ = val("c");
 * const s$ = compute(get => (get(a$) % 2 === 0 ? get(b$) : get(c$)));
 * ```
 */
export const compute = <TValue = any>(
  effect: (get: ComputeGet) => TValue,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> => {
  let scopeLevel = 0;

  let currentDisposers = new Map<ReadonlyVal, ValDisposer>();
  let oldDisposers = new Map<ReadonlyVal, ValDisposer>();

  const get = <T = any>(
    maybeVal$?: T | ReadonlyVal<T> | { $: ReadonlyVal<T> }
  ): T | undefined => {
    const val$ = isVal(maybeVal$)
      ? maybeVal$
      : isVal((maybeVal$ as { $: ReadonlyVal<T> } | undefined)?.$)
      ? (maybeVal$ as { $: ReadonlyVal<T> }).$
      : (maybeVal$ as T | undefined);

    if (isVal(val$)) {
      if (!currentDisposers.has(val$)) {
        let disposer = oldDisposers.get(val$);
        if (disposer) {
          oldDisposers.delete(val$);
        } else {
          disposer = val$.$valCompute(agent.notify_);
        }
        currentDisposers.set(val$, disposer);
      }
      return val$.value;
    }
    return val$;
  };

  const agent = new ValAgent(
    () => {
      if (++scopeLevel === 1) {
        const tmp = currentDisposers;
        currentDisposers = oldDisposers;
        oldDisposers = tmp;
      }

      const value = effect(get);

      if (--scopeLevel === 0 && oldDisposers.size) {
        oldDisposers.forEach(invoke);
        oldDisposers.clear();
      }

      return value;
    },
    config,
    () => () => {
      if (currentDisposers.size) {
        currentDisposers.forEach(invoke);
        currentDisposers.clear();
      }
    }
  );

  return new ValImpl(agent);
};
