import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, Val, ValConfig } from "./typings";
import { identity, INIT_VALUE } from "./utils";

class UnwrapValImpl<TSrcValue = any, TValue = any>
  extends ReadonlyValImpl<TValue>
  implements ReadonlyVal<TValue>
{
  public constructor(
    val: ReadonlyVal<TSrcValue>,
    get: (value: TSrcValue) => ReadonlyVal<TValue> = identity as any,
    config?: ValConfig<TValue>
  ) {
    let innerVal: ReadonlyVal<TValue> | undefined;
    const getValue = () => {
      if (!innerVal || this._subs_.subscribers_.size <= 0) {
        innerVal = get(val.value);
      }
      return innerVal.value;
    };

    super(INIT_VALUE, config, () => {
      innerVal = get(val.value);

      if (this._value_ === INIT_VALUE) {
        this._value_ = innerVal.value;
      } else {
        this._dirtyLevel_ = this._dirtyLevel_ || 1;
      }

      const markDirty = () => {
        if (this._dirtyLevel_ < 2) {
          this._dirtyLevel_ = 2;
          this._subs_.invoke_();
        }
      };
      let innerDisposer = (innerVal as ReadonlyValImpl)._compute_(markDirty);
      const outerDisposer = (val as ReadonlyValImpl)._compute_(() => {
        innerDisposer();
        innerVal = get(val.value);
        innerDisposer = (innerVal as ReadonlyValImpl)._compute_(markDirty);
        markDirty();
      });
      return () => {
        innerDisposer();
        outerDisposer();
      };
    });

    this._getValue_ = getValue;
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
  val: ReadonlyVal<Val<TValue> | ReadonlyVal<TValue>>
): ReadonlyVal<TValue>;
/**
 * Unwrap an inner val extracted from a source val to a val of the inner val value.
 * @param val Input value.
 * @param get extract inner val from source val.
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
  get: (value: TSrcValue) => ReadonlyVal<TValue>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue>;
export function unwrap<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  get?: (value: TSrcValue) => ReadonlyVal<TValue>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> {
  return new UnwrapValImpl(val, get, config);
}
