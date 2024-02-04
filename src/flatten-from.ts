import type { ReadonlyVal, UnwrapVal, ValConfig, ValDisposer } from "./typings";

import { ReadonlyValImpl } from "./readonly-val";
import type { ValVersion } from "./subscribers";
import { Subscribers } from "./subscribers";
import { INIT_VALUE, isVal, strictEqual } from "./utils";

class FlattenFromImpl<
  TValOrValue = any,
  TValue = UnwrapVal<TValOrValue>
> extends ReadonlyValImpl<TValue> {
  public constructor(
    getValue: () => TValOrValue,
    listen: (handler: () => void) => ValDisposer | void | undefined,
    config?: ValConfig<TValue>
  ) {
    const initialEqual = config?.equal;

    let currentValue = INIT_VALUE as TValue;
    let dirty = false;
    let notified = false;

    let innerMaybeVal: TValOrValue | undefined;
    let innerVal: ReadonlyValImpl<TValue> | undefined | null;
    let innerDisposer: ValDisposer | undefined | null;

    const computeValue = (): TValue => {
      if (subs.size_ <= 0) {
        updateInnerVal();
      }
      return innerVal ? innerVal.value : (innerMaybeVal as TValue);
    };

    const get = () => {
      if (currentValue === INIT_VALUE || subs.size_ <= 0) {
        currentValue = computeValue();
        subs.version_ = currentValue;
      } else if (dirty) {
        const value = computeValue();
        if (!this.$equal?.(value, currentValue)) {
          subs.newVersion_(value, currentValue);
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
        innerVal = isVal(maybeVal)
          ? (maybeVal as unknown as ReadonlyValImpl<TValue>)
          : null;
        innerDisposer?.();
        innerDisposer = innerVal && innerVal.$valCompute(notify);
        this.$equal =
          initialEqual ||
          (initialEqual === false
            ? void 0
            : innerVal
            ? innerVal.$equal
            : strictEqual);
      }
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
  config?: ValConfig<UnwrapVal<TValOrValue>>
): ReadonlyVal<UnwrapVal<TValOrValue>> =>
  new FlattenFromImpl(getValue, listen, config);
