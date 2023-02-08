import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, Val, ValConfig } from "./typings";
import { identity } from "./utils";

class UnwrapValImpl<TSrcValue = any, TValue = any>
  extends ReadonlyValImpl<TValue>
  implements ReadonlyVal<TValue>
{
  public constructor(
    val: ReadonlyVal<TSrcValue>,
    get: (value: TSrcValue) => ReadonlyVal<TValue> = identity as any,
    config?: ValConfig<TValue>
  ) {
    const getValue = () => get(val.value).value;
    super(getValue(), config, () => {
      this._value_ = getValue();
      const markDirty = () => {
        if (!this._dirty_) {
          this._dirty_ = true;
          this._subs_.invoke_();
        }
      };
      let innerDisposer = (get(val.value) as ReadonlyValImpl)._compute_(
        markDirty
      );
      const outerDisposer = (val as ReadonlyValImpl)._compute_(() => {
        innerDisposer && innerDisposer();
        innerDisposer = (get(val.value) as ReadonlyValImpl)._compute_(
          markDirty
        );
        markDirty();
      });
      return () => {
        innerDisposer && innerDisposer();
        outerDisposer();
      };
    });

    this._dirty_ = false;
    this._getValue_ = getValue;
  }

  public override get value(): TValue {
    if (this._dirty_ || this._subs_.subscribers_.size <= 0) {
      this._dirty_ = false;
      const value = this._getValue_();
      if (!this._compare_(value, this._value_)) {
        this._subs_.shouldExec_ = true;
        this._value_ = value;
      }
    }
    return this._value_;
  }

  protected override _compare_(_newValue: TValue, _oldValue: TValue): boolean {
    // follow upstream val by default
    return false;
  }

  private _dirty_: boolean;
  private _getValue_: () => TValue;
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
