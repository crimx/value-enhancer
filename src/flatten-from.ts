import type { ReadonlyVal, UnwrapVal, ValConfig, ValDisposer } from "./typings";

import { from } from "./from";
import { isVal, strictEqual } from "./utils";
import type { ValImpl } from "./val";

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
// export const flattenFrom2 = <TValOrValue = any>(
//   getValue: () => TValOrValue,
//   listen: (notify: () => void) => ValDisposer | void | undefined,
//   config?: ValConfig<UnwrapVal<TValOrValue>>
// ): ReadonlyVal<UnwrapVal<TValOrValue>> =>
//   new FlattenFromImpl(getValue, listen, config);

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
): ReadonlyVal<UnwrapVal<TValOrValue>> => {
  const initialEqual = config?.equal;
  let innerMaybeVal: TValOrValue | undefined;
  let innerVal: ValImpl<UnwrapVal<TValOrValue>> | undefined | null;
  let innerDisposer: ValDisposer | undefined | null;
  let withSubscriber = false;

  const computeValue = (): UnwrapVal<TValOrValue> => {
    if (!withSubscriber) {
      updateInnerVal();
    }
    return innerVal
      ? innerVal.value
      : (innerMaybeVal as UnwrapVal<TValOrValue>);
  };

  const updateInnerVal = () => {
    const maybeVal = getValue();
    if (!strictEqual(maybeVal, innerMaybeVal)) {
      innerMaybeVal = maybeVal;
      innerVal = isVal(maybeVal)
        ? (maybeVal as unknown as ValImpl<UnwrapVal<TValOrValue>>)
        : null;
      (val$ as ValImpl).$equal =
        initialEqual ||
        (initialEqual === false
          ? void 0
          : innerVal
          ? innerVal.$equal
          : strictEqual);
    }
  };

  const updateInnerValCompute = (notify: () => void) => {
    innerDisposer?.();
    innerDisposer = innerVal && innerVal.$valCompute(notify);
  };

  const val$ = from(
    computeValue,
    notify => {
      withSubscriber = true;
      updateInnerVal();
      updateInnerValCompute(notify);

      const outerDisposer = listen(() => {
        updateInnerVal();
        updateInnerValCompute(notify);
        notify();
      });

      return () => {
        withSubscriber = false;
        innerDisposer?.();
        outerDisposer?.();
      };
    },
    config
  );

  return val$;
};
