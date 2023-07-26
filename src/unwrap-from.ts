import type { ReadonlyVal, ValConfig, ValDisposer } from "./typings";

import { ReadonlyValImpl } from "./readonly-val";
import { INIT_VALUE, defaultCompare, isVal } from "./utils";

class UnwrapFromImpl<TValue = any> extends ReadonlyValImpl<TValue> {
  public constructor(
    getValue: () => ReadonlyVal<TValue> | TValue,
    listen: (handler: () => void) => ValDisposer | void | undefined,
    config?: ValConfig<TValue>
  ) {
    const initialCompare = config?.compare;

    let currentValue = INIT_VALUE as TValue;
    let dirtyLevel = 0;

    let innerMaybeVal: ReadonlyVal<TValue> | TValue | undefined;
    let innerVal: ReadonlyVal<TValue> | undefined | null;
    let innerDisposer: ValDisposer | undefined | null;

    const computeValue = (): TValue => {
      if (this._subs.subscribers_.size <= 0) {
        updateInnerVal();
      }
      return innerVal ? innerVal.value : (innerMaybeVal as TValue);
    };

    const get = () => {
      if (currentValue === INIT_VALUE) {
        currentValue = computeValue();
        this._subs.dirty = true;
      } else if (dirtyLevel || this._subs.subscribers_.size <= 0) {
        const value = computeValue();
        if (!this.compare(value, currentValue)) {
          this._subs.dirty = true;
          currentValue = value;
        }
      }
      dirtyLevel = 0;
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
      if (dirtyLevel < 2) {
        dirtyLevel = 2;
        this._subs.notify();
      }
    };

    super(get, config, () => {
      updateInnerVal();

      if (currentValue === INIT_VALUE) {
        currentValue = innerVal ? innerVal.value : (innerMaybeVal as TValue);
      } else {
        dirtyLevel = dirtyLevel || 1;
      }

      const outerDisposer = listen(() => {
        updateInnerVal();
        notify();
      });

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
export const unwrapFrom = <TValue = any>(
  getValue: () => ReadonlyVal<TValue> | TValue,
  listen: (notify: () => void) => ValDisposer | void | undefined,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> => new UnwrapFromImpl(getValue, listen, config);
