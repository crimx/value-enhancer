import type {
  FlattenVal,
  ReadonlyVal,
  ValConfig,
  ValDisposer,
} from "./typings";

import { ReadonlyValImpl } from "./readonly-val";
import { INIT_VALUE, defaultEqual, isVal } from "./utils";

class FlattenFromImpl<
  TValOrValue = any,
  TValue = FlattenVal<TValOrValue>
> extends ReadonlyValImpl<TValue> {
  public constructor(
    getValue: () => TValOrValue,
    listen: (handler: () => void) => ValDisposer | void | undefined,
    config?: ValConfig<TValue>
  ) {
    const initialEqual = config && config.equal;

    let currentValue = INIT_VALUE as TValue;
    let dirty = false;
    let notified = false;

    let innerMaybeVal: TValOrValue | undefined;
    let innerVal: ReadonlyVal<TValue> | undefined | null;
    let innerDisposer: ValDisposer | undefined | null;

    const computeValue = (): TValue => {
      if (this._subs.subs.size <= 0) {
        updateInnerVal();
      }
      return innerVal ? innerVal.value : (innerMaybeVal as TValue);
    };

    const get = () => {
      if (currentValue === INIT_VALUE || this._subs.subs.size <= 0) {
        currentValue = computeValue();
      } else if (dirty) {
        const value = computeValue();
        if (!this.equal(value, currentValue)) {
          this._subs.dirty = true;
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
        currentEqual =
          initialEqual || (innerVal ? innerVal.equal : defaultEqual);
      }
    };

    const notify = () => {
      dirty = true;
      if (!notified) {
        notified = true;
        this._subs.notify();
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

    let currentEqual = this.equal;
    this.equal = (newValue: TValue, oldValue: TValue) =>
      currentEqual(newValue, oldValue);
  }
}

/**
 * Creates a readonly val from a getter function and a listener function.
 * If the value is a val, it will be auto-flattened.
 *
 * @param getValue A function that returns the current value.
 *        If the value is a val, it will be auto-flattened.
 * @param listen A function that takes a notify function and returns a disposer.
 *        The notify function should be called when the value changes.
 * @param config custom config for the val.
 * @returns A readonly val with value of inner val.
 */
export const flattenFrom = <TValOrValue = any>(
  getValue: () => TValOrValue,
  listen: (notify: () => void) => ValDisposer | void | undefined,
  config?: ValConfig<FlattenVal<TValOrValue>>
): ReadonlyVal<FlattenVal<TValOrValue>> =>
  new FlattenFromImpl(getValue, listen, config);
