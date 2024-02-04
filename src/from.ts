import { ReadonlyValImpl } from "./readonly-val";
import { Subscribers } from "./subscribers";
import type {
  ReadonlyVal,
  ValConfig,
  ValDisposer,
  ValVersion,
} from "./typings";
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
      if (currentValue === INIT_VALUE || subs.size_ <= 0) {
        currentValue = getValue();
        subs.version_ = currentValue;
      } else if (dirty) {
        const value = getValue();
        if (!this.$equal?.(value, currentValue)) {
          subs.newVersion_(value, currentValue);
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
        subs.notify_();
      }
    };

    const subs = new Subscribers(get, () => {
      // attach listener first so that upstream value is resolved
      const disposer = listen(notify);
      currentValue = getValue();
      dirty = notified = false;
      return disposer;
    });

    super(subs, config);
  }

  override get $version(): ValVersion {
    // resolve current value for the latest version
    this.get();
    return super.$version;
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
