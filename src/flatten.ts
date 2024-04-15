import type { ReadonlyVal, UnwrapVal, ValConfig } from "./typings";
import type { ValImpl } from "./val";

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
): ReadonlyVal<UnwrapVal<TValOrValue>>;
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
  config?: ValConfig<UnwrapVal<TValOrValue>>
): ReadonlyVal<UnwrapVal<TValOrValue>>;
export function flatten<
  TSrcValue = any,
  TValOrValue = any,
  TSrcVal extends ValImpl = ValImpl<TSrcValue>
>(
  val: TSrcVal,
  get: (value: TSrcValue) => TValOrValue = identity as any,
  config?: ValConfig<UnwrapVal<TValOrValue>>
): ReadonlyVal<UnwrapVal<TValOrValue>> {
  return flattenFrom(
    () => get(val.value),
    notify => val.$valCompute(notify),
    config
  );
}
