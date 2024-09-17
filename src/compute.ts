import type {
  ReadonlyVal,
  UnwrapVal,
  ValConfig,
  ValSubscriber,
} from "./typings";
import { isVal } from "./utils";
import { RootV } from "./v";
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

  let currentDisposers = new Set<ReadonlyVal>();
  let oldDisposers = new Set<ReadonlyVal>();

  const get = <T = any>(
    val$?: T | ReadonlyVal<T> | { $: ReadonlyVal<T> }
  ): T | undefined => {
    if (!isVal(val$)) {
      if (!isVal((val$ as { $: ReadonlyVal<T> } | undefined)?.$)) {
        return val$ as T | undefined;
      }
      val$ = (val$ as { $: ReadonlyVal<T> }).$;
    }

    if (!currentDisposers.has(val$)) {
      if (oldDisposers.has(val$)) {
        oldDisposers.delete(val$);
      } else {
        val$.$valCompute(v.notify_);
      }
      currentDisposers.add(val$);
    }

    return val$.value;
  };

  const v: RootV<TValue> = new RootV(
    () => {
      if (!scopeLevel++) {
        const tmp = currentDisposers;
        currentDisposers = oldDisposers;
        oldDisposers = tmp;
      }

      const value = effect(get);

      if (!--scopeLevel) {
        clear(oldDisposers, v.notify_);
      }

      return value;
    },
    config,
    () => () => clear(currentDisposers, v.notify_)
  );

  return new ValImpl(v);
};

const clear = (vals: Set<ReadonlyVal>, fn: ValSubscriber<void>) => {
  for (const $ of vals) {
    $.unsubscribe(fn);
  }
  vals.clear();
};
