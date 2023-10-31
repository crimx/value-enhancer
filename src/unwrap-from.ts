import type { ReadonlyVal, UnwrapVal, ValConfig, ValDisposer } from "./typings";

import { ReadonlyValImpl } from "./readonly-val";
import { INIT_VALUE, defaultCompare, isVal } from "./utils";

class UnwrapFromImpl<
  TValOrValue = any,
  TValue = UnwrapVal<TValOrValue>
> extends ReadonlyValImpl<TValue> {
  public constructor(
    getValue: () => TValOrValue,
    listen: (handler: () => void) => ValDisposer | void | undefined,
    config?: ValConfig<TValue>
  ) {
    const initialCompare = config?.compare;

    let currentValue = INIT_VALUE as TValue;
    let dirty = false;
    let notified = false;

    let innerMaybeVal: TValOrValue | undefined;
    let innerVal: ReadonlyVal<TValue> | undefined | null;
    let innerDisposer: ValDisposer | undefined | null;

    const computeValue = (): TValue => {
      if (this._subs_.subscribers_.size <= 0) {
        updateInnerVal();
      }
      return innerVal ? innerVal.value : (innerMaybeVal as TValue);
    };

    const get = () => {
      if (currentValue === INIT_VALUE || this._subs_.subscribers_.size <= 0) {
        currentValue = computeValue();
      } else if (dirty) {
        const value = computeValue();
        if (!this.compare(value, currentValue)) {
          this._subs_.dirty_ = true;
          currentValue = value;
        }
      }
      dirty = notified = false;
      return currentValue;
    };

    const updateInnerVal = () => {
      const maybeVal = getValue();
      if (maybeVal !== innerMaybeVal) {
        innerMaybeVal = maybeVal;
        innerVal = isVal(maybeVal) ? maybeVal : null;
        innerDisposer?.();
        innerDisposer = innerVal && innerVal.$valCompute(notify);
        currentCompare =
          initialCompare || (innerVal ? innerVal.compare : defaultCompare);
      }
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
      const outerDisposer = listen(() => {
        updateInnerVal();
        notify();
      });

      updateInnerVal();
      currentValue = innerVal ? innerVal.value : (innerMaybeVal as TValue);
      dirty = notified = false;

      return () => {
        innerDisposer?.();
        outerDisposer?.();
      };
    });

    let currentCompare = this.compare;
    this.compare = (newValue: TValue, oldValue: TValue) =>
      currentCompare(newValue, oldValue);
  }
}

/**
 * Creates a readonly val from a getter function and a listener function.
 * If the value is a val, it will be auto-unwrapped.
 *
 * @param getValue A function that returns the current value.
 *        If the value is a val, it will be auto-unwrapped.
 * @param listen A function that takes a notify function and returns a disposer.
 *        The notify function should be called when the value changes.
 * @param config custom config for the val.
 * @returns A readonly val with value of inner val.
 */
export const unwrapFrom = <TValOrValue = any>(
  getValue: () => TValOrValue,
  listen: (notify: () => void) => ValDisposer | void | undefined,
  config?: ValConfig<UnwrapVal<TValOrValue>>
): ReadonlyVal<UnwrapVal<TValOrValue>> =>
  new UnwrapFromImpl(getValue, listen, config);
