import { ValAgent } from "./agent";
import type { ReadonlyVal, ValConfig, ValDisposer } from "./typings";
import { ValImpl } from "./val";

/**
 * Creates a readonly val from a getter function and a listener function.
 *
 * @param getValue A function that returns the current value.
 * @param onChange A function that takes a notify function and returns a disposer.
 *        The notify function should be called when the value changes.
 * @param config custom config for the val.
 * @returns A readonly val.
 *
 * @example
 * ```ts
 * const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
 * const isDarkMode$ = from(
 *   () => prefersDark.matches,
 *   notify => {
 *     prefersDark.addEventListener("change", notify);
 *     return () => prefersDark.removeEventListener("change", notify);
 *   },
 * );
 * ```
 *
 * @example An implementation of the `derive` function:
 * ```ts
 * const derive = (val, transform, config) => from(
 *   () => transform(val.value),
 *   notify => val.subscribe(notify),
 *   config,
 * );
 * ```
 */
export const from = <TValue = any>(
  getValue: () => TValue,
  onChange: (notify: () => void) => ValDisposer | void | undefined,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> => new ValImpl(new ValAgent(getValue, config, onChange));
