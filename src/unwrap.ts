import type { ReadonlyVal, UnwrapVal, ValConfig } from "./typings";

import { unwrapFrom } from "./unwrap-from";
import { identity } from "./utils";

/**
 * Unwrap a val of val to a val of the inner val value.
 * @param val Input value.
 * @returns A readonly val with value of inner val.
 *
 * @example
 * ```js
 * import { unwrap, val } from "value-enhancer";
 *
 * const inner$ = val(12);
 * const outer$ = val(inner$);
 *
 * const unwrapped$ = unwrap(outer$);
 *
 * inner$.value === unwrapped$.value; // true
 * ```
 */
export function unwrap<TValOrValue = any>(
  val: ReadonlyVal<TValOrValue>
): ReadonlyVal<UnwrapVal<TValOrValue>>;
/**
 * Unwrap an inner val extracted from a source val to a val of the inner val value.
 * @param val Input value.
 * @param get extract inner val or value from source val.
 * @returns A readonly val with value of inner val.
 *
 * @example
 * ```js
 * import { unwrap, val } from "value-enhancer";
 *
 * const inner$ = val(12);
 * const outer$ = val({ inner$ });
 *
 * const unwrapped$ = unwrap(outer$, ({ inner$ }) => inner$);
 *
 * inner$.value === unwrapped$.value; // true
 * ```
 */
export function unwrap<TSrcValue = any, TValOrValue = any>(
  val: ReadonlyVal<TSrcValue>,
  get: (value: TSrcValue) => TValOrValue,
  config?: ValConfig<UnwrapVal<TValOrValue>>
): ReadonlyVal<UnwrapVal<TValOrValue>>;
export function unwrap<TSrcValue = any, TValOrValue = any>(
  val: ReadonlyVal<TSrcValue>,
  get: (value: TSrcValue) => TValOrValue = identity as any,
  config?: ValConfig<UnwrapVal<TValOrValue>>
): ReadonlyVal<UnwrapVal<TValOrValue>> {
  return unwrapFrom(
    () => get(val.value),
    notify => val.$valCompute(notify),
    config
  );
}
