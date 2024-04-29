import type {
  ReadonlyVal,
  UnwrapVal,
  ValConfig,
  ValDisposer,
  ValVersion,
} from "./typings";

import { AgentStatus, ValAgent } from "./agent";
import { INIT_VALUE, isVal, strictEqual } from "./utils";
import { ValImpl } from "./val";

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
  let innerDisposer: ValDisposer | undefined | void;
  let currentValVersion: ValVersion = INIT_VALUE;
  let currentMaybeVal: TValOrValue = INIT_VALUE;
  let dirty = true;
  const useDefaultEqual = config?.equal == null;

  const subs = new ValAgent(
    () => {
      if (dirty) {
        if (subs.subs_.size) {
          dirty = false;
        }

        const lastMaybeVal = currentMaybeVal;
        currentMaybeVal = getValue();

        if (isVal(currentMaybeVal)) {
          if (!strictEqual(currentMaybeVal, lastMaybeVal)) {
            innerDisposer &&= innerDisposer();
            if (subs.subs_.size) {
              innerDisposer = currentMaybeVal.$valCompute(subs.notify_);
            }
          }
        } else {
          innerDisposer &&= innerDisposer();
        }
      }

      if (isVal(currentMaybeVal)) {
        const lastValVersion = currentValVersion;
        currentValVersion = currentMaybeVal.$version;
        if (
          useDefaultEqual &&
          !strictEqual(currentValVersion, lastValVersion)
        ) {
          subs.status_ |= AgentStatus.ShouldInvoke;
        }
        return currentMaybeVal.value;
      } else {
        currentValVersion = INIT_VALUE;
        return currentMaybeVal;
      }
    },
    config,
    notify => {
      const outerDisposer = listen(() => {
        dirty = true;
        notify();
      });
      if (!innerDisposer && isVal(currentMaybeVal)) {
        innerDisposer = currentMaybeVal.$valCompute(notify);
      }
      return () => {
        dirty = true;
        innerDisposer &&= innerDisposer();
        outerDisposer?.();
      };
    }
  );

  return new ValImpl(subs);
};
