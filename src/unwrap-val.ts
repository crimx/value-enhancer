import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, Val, ValConfig } from "./typings";
import { compute, identity, INIT_VALUE, isVal } from "./utils";

class UnwrapValImpl<TSrcValue = any, TValue = any>
  extends ReadonlyValImpl<TValue>
  implements ReadonlyVal<TValue>
{
  public constructor(
    val: ReadonlyVal<TSrcValue>,
    get: (value: TSrcValue) => ReadonlyVal<TValue> | TValue = identity as any,
    config?: ValConfig<TValue>
  ) {
    let innerValue: ReadonlyVal<TValue> | TValue | undefined;

    super(INIT_VALUE, config, () => {
      innerValue = get(val.value);

      if (this._value_ === INIT_VALUE) {
        this._value_ = isVal(innerValue) ? innerValue.value : innerValue;
      } else {
        this._dirtyLevel_ = this._dirtyLevel_ || 1;
      }

      const markDirty = () => {
        if (this._dirtyLevel_ < 2) {
          this._dirtyLevel_ = 2;
          this._subs_.invoke_();
        }
      };

      let innerDisposer = isVal(innerValue) && compute(innerValue, markDirty);

      const outerDisposer = compute(val, () => {
        innerDisposer && innerDisposer();
        innerValue = get(val.value);
        innerDisposer = isVal(innerValue) && compute(innerValue, markDirty);
        markDirty();
      });
      return () => {
        innerDisposer && innerDisposer();
        outerDisposer();
      };
    });

    this._getValue_ = (): TValue => {
      if (this._subs_.subscribers_.size <= 0 || !innerValue) {
        innerValue = get(val.value);
      }
      return isVal(innerValue) ? innerValue.value : innerValue;
    };
  }

  public override get value(): TValue {
    if (this._value_ === INIT_VALUE) {
      this._value_ = this._getValue_();
      this._subs_.shouldExec_ = true;
    } else if (this._dirtyLevel_ || this._subs_.subscribers_.size <= 0) {
      const value = this._getValue_();
      if (!this.compare(value, this._value_)) {
        this._subs_.shouldExec_ = true;
        this._value_ = value;
      }
    }
    this._dirtyLevel_ = 0;
    return this._value_;
  }

  public override compare(_newValue: TValue, _oldValue: TValue): boolean {
    // follow upstream val by default
    return false;
  }

  private _getValue_: () => TValue;
  private _dirtyLevel_ = 0;
}

/**
 * Unwrap a val of val to a val of the inner val value.
 * @param val Input value.
 * @returns An readonly val with value of inner val.
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
 * @returns An readonly val with value of inner val.
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
 * @returns An readonly val with value of inner val.
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
  get?: (value: TSrcValue) => ReadonlyVal<TValue> | TValue,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> {
  return new UnwrapValImpl(val, get, config);
}
