import type { FlattenVal, ReadonlyVal, ValConfig } from "./typings";

import { flattenFrom } from "./flatten-from";
import { identity } from "./utils";

/**
 * Flatten a val of val to a val of the inner val value.
 * @param val Input value.
 * @returns A readonly val with value of inner val.
 *
 * @example
 * ```js
 * import { flatten, val } from "value-enhancer";
 *
 * const inner$ = val(12);
 * const outer$ = val(inner$);
 *
 * const flattened$ = flatten(outer$);
 *
 * inner$.value === flattened$.value; // true
 * ```
 */
export function flatten<TValOrValue = any>(
  val: ReadonlyVal<TValOrValue>
): ReadonlyVal<FlattenVal<TValOrValue>>;
/**
 * Flatten an inner val extracted from a source val to a val of the inner val value.
 * @param val Input value.
 * @param get extract inner val or value from source val.
 * @returns A readonly val with value of inner val.
 *
 * @example
 * ```js
 * import { flatten, val } from "value-enhancer";
 *
 * const inner$ = val(12);
 * const outer$ = val({ inner$ });
 *
 * const flattened$ = flatten(outer$, ({ inner$ }) => inner$);
 *
 * inner$.value === flattened$.value; // true
 * ```
 */
export function flatten<TSrcValue = any, TValOrValue = any>(
  val: ReadonlyVal<TSrcValue>,
  get: (value: TSrcValue) => TValOrValue,
  config?: ValConfig<FlattenVal<TValOrValue>>
): ReadonlyVal<FlattenVal<TValOrValue>>;
export function flatten<TSrcValue = any, TValOrValue = any>(
  val: ReadonlyVal<TSrcValue>,
  get: (value: TSrcValue) => TValOrValue = identity as any,
  config?: ValConfig<FlattenVal<TValOrValue>>
): ReadonlyVal<FlattenVal<TValOrValue>> {
  return flattenFrom(
    () => get(val.value),
    notify => val.$valCompute(notify),
    config
  );
}

/**
 * @ignore
 * @deprecated
 * Renamed to `flatten`.
 */
export const unwrap = flatten;
