import { ValAgent } from "./agent";
import type { ReadonlyVal, ValConfig, ValDisposer } from "./typings";
import { invoke } from "./utils";
import { ValImpl } from "./val";

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
  effect: (get: <T = any>(val$: ReadonlyVal<T>) => T) => TValue,
  config?: ValConfig<TValue>
) => {
  let scopeLevel = 0;

  let currentDisposers = new Map<ReadonlyVal, ValDisposer>();
  let oldDisposers = new Map<ReadonlyVal, ValDisposer>();

  const get = <T>(val$: ReadonlyVal<T>): T => {
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
