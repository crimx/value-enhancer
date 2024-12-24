import { ValAgent } from "./agent";
import type { ReadonlyVal, UnwrapVal, ValConfig, ValVersion } from "./typings";
import { INIT_VALUE, isVal, strictEqual } from "./utils";
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

  let currentDeps = new Map<ReadonlyVal, ValVersion>();
  let oldDeps = new Map<ReadonlyVal, ValVersion>();

  const get = <T = any>(
    val$?: T | ReadonlyVal<T> | { $: ReadonlyVal<T> }
  ): T | undefined => {
    if (!isVal(val$)) {
      if (!isVal((val$ as { $: ReadonlyVal<T> } | undefined)?.$)) {
        return val$ as T | undefined;
      }
      val$ = (val$ as { $: ReadonlyVal<T> }).$;
    }

    if (currentDeps.has(val$)) {
      if (!strictEqual(val$.$version, currentDeps.get(val$))) {
        // depends on multiple versions of the same val
        // so we set a unique version here
        currentDeps.set(val$, INIT_VALUE);
      }
    } else {
      if (!oldDeps.delete(val$)) {
        val$.$valCompute(agent.notify_);
      }
      currentDeps.set(val$, val$.$version);
    }

    return val$.value;
  };

  let currentValue: TValue;
  const agent = new ValAgent(
    () => {
      if (!scopeLevel) {
        if (currentDeps.size) {
          x: {
            for (const [dep, version] of currentDeps) {
              if (!strictEqual(dep.$version, version)) {
                break x;
              }
            }
            return currentValue;
          }
        }

        const tmp = currentDeps;
        currentDeps = oldDeps;
        oldDeps = tmp;
        scopeLevel++;
      }

      currentValue = effect(get);

      if (!--scopeLevel && oldDeps.size) {
        for (const dep of oldDeps.keys()) {
          dep.unsubscribe(agent.notify_);
        }
        oldDeps.clear();
      }

      return currentValue;
    },
    config,
    () => () => {
      if (currentDeps.size) {
        for (const dep of currentDeps.keys()) {
          dep.unsubscribe(agent.notify_);
        }
        currentDeps.clear();
      }
    }
  );

  return new ValImpl(agent);
};
