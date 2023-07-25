import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, ValConfig, ValDisposer } from "./typings";
import { INIT_VALUE } from "./utils";

class FromImpl<TValue = any> extends ReadonlyValImpl<TValue> {
  public constructor(
    getValue: () => TValue,
    listen: (notify: () => void) => ValDisposer | void | undefined,
    config?: ValConfig<TValue>
  ) {
    let currentValue = INIT_VALUE as TValue;
    let dirtyLevel = 0;

    const get = () => {
      if (currentValue === INIT_VALUE) {
        currentValue = getValue();
        this._subs.dirty = true;
      } else if (dirtyLevel || this._subs.subscribers_.size <= 0) {
        const value = getValue();
        if (!this.compare(value, currentValue)) {
          this._subs.dirty = true;
          currentValue = value;
        }
      }
      dirtyLevel = 0;
      return currentValue;
    };

    const notify = () => {
      if (dirtyLevel < 2) {
        dirtyLevel = 2;
        this._subs.notify();
      }
    };

    super(get, config, () => {
      if (currentValue === INIT_VALUE) {
        currentValue = getValue();
      } else {
        dirtyLevel = dirtyLevel || 1;
      }
      return listen(notify);
    });
  }
}

/**
 * Creates a readonly val from a getter function and a listener function.
 *
 * @param getValue A function that returns the current value.
 * @param listen A function that takes a notify function and returns a disposer.
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
  listen: (handler: () => void) => ValDisposer | void | undefined,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> => new FromImpl(getValue, listen, config);
