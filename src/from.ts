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
    let dirty = false;
    let notified = false;

    const get = () => {
      if (currentValue === INIT_VALUE || this._subs_.subscribers_.size <= 0) {
        currentValue = getValue();
      } else if (dirty) {
        const value = getValue();
        if (!this.compare(value, currentValue)) {
          this._subs_.dirty_ = true;
          currentValue = value;
        }
      }
      dirty = notified = false;
      return currentValue;
    };

    const notify = () => {
      dirty = true;
      if (!notified) {
        notified = true;
        this._subs_.notify_();
      }
    };

    super(get, config, () => {
      // attach listener first so that upstream value is resolved
      const disposer = listen(notify);
      currentValue = getValue();
      dirty = notified = false;
      return disposer;
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
