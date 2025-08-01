import { compute } from "./compute";
import type { ReadonlyVal, UnwrapVal, ValConfig, ValDisposer } from "./typings";
import { identity, invoke } from "./utils";

export interface WatchGet {
  <T = any>(val$: ReadonlyVal<T>): T;
  <T = any>(val$?: ReadonlyVal<T>): T | undefined;
  <T = any>(val$: { $: ReadonlyVal<T> }): T;
  <T = any>(val$?: { $: ReadonlyVal<T> }): T | undefined;
  <T = any>(val$: T): UnwrapVal<T>;
  <T = any>(val$?: T): UnwrapVal<T> | undefined;
}

/**
 * Create a watch that runs an effect whenever the dependencies change.
 * @param get - The get function which can be used to get the current value of a Val and subscribe to it.
 * @param dispose - The dispose function which can be used to stop the watch.
 * @returns `undefined` or a function that can be called to clean up the last watch effect.
 */
export type WatchEffect = (
  get: WatchGet,
  dispose: ValDisposer
) => (() => void) | undefined | void;

export type WatchConfig = Pick<ValConfig<never>, "eager">;

/**
 * Create a watch that runs an effect whenever the dependencies change.
 * @param effect - The effect function which will be called immediately and whenever the dependencies change.
 * @param config - Optional watch config.
 * @returns A disposer function that can be called to stop the watch.
 */
export const watch = (
  effect: WatchEffect,
  config?: WatchConfig
): ValDisposer => {
  // eslint-disable-next-line prefer-const
  let v: ReadonlyVal<(() => void) | undefined | void> | undefined;
  let disposed: boolean | undefined;
  const disposer: ValDisposer = () => {
    if (!disposed) {
      disposed = true;
      if (v?.value) {
        invoke(v.value);
      }
      v?.dispose();
    }
  };
  v = compute(
    get => {
      try {
        v?.value?.();
        if (!disposed) {
          const d = effect(get, disposer);
          if (disposed) {
            d?.();
          } else {
            return d;
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
    { ...config, equal: false }
  );
  v.subscribe(identity);
  return disposer;
};
