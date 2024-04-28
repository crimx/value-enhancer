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
  let lastValVersion: ValVersion = INIT_VALUE;
  let lastMaybeVal: TValOrValue = INIT_VALUE;
  let dirty = true;

  const subs = new ValAgent(
    () => {
      if (dirty) {
        if (subs.subs_.size) {
          dirty = false;
        }

        const maybeVal = getValue();

        if (isVal(maybeVal)) {
          const version = maybeVal.$version;
          if (strictEqual(maybeVal, lastMaybeVal)) {
            if (!subs.equal_ && !strictEqual(version, lastValVersion)) {
              subs.status_ |= AgentStatus.ShouldInvoke;
            }
          } else {
            innerDisposer &&= innerDisposer();
            if (subs.subs_.size) {
              innerDisposer = maybeVal.$valCompute(subs.notify_);
            }
          }
          lastValVersion = version;
        } else {
          innerDisposer &&= innerDisposer();
          lastValVersion = INIT_VALUE;
        }

        lastMaybeVal = maybeVal;
      }

      return isVal(lastMaybeVal) ? lastMaybeVal.value : lastMaybeVal;
    },
    config,
    notify => {
      const outerDisposer = listen(() => {
        dirty = true;
        notify();
      });
      if (!innerDisposer && isVal(lastMaybeVal)) {
        innerDisposer = lastMaybeVal.$valCompute(notify);
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
