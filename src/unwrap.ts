import type { ReadonlyVal, Val, ValConfig } from "./typings";

import { unwrapFrom } from "./unwrap-from";
import { identity } from "./utils";

/**
 * Unwrap a val of val to a val of the inner val value.
 *
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
export function unwrap<TValue = any>(
  val: ReadonlyVal<ReadonlyVal<TValue>>
): ReadonlyVal<TValue>;
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
export function unwrap<TValue = any>(
  val: ReadonlyVal<Val<TValue>>
): ReadonlyVal<TValue>;
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
export function unwrap<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  get: (value: TSrcValue) => ReadonlyVal<TValue> | TValue,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue>;
export function unwrap<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  get: (value: TSrcValue) => ReadonlyVal<TValue> | TValue = identity as any,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> {
  return unwrapFrom(
    () => get(val.value) as TValue,
    notify => val.$valCompute(notify),
    config
  );
}
