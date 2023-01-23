import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, Val, ValConfig } from "./typings";

class UnwrapValImpl<TValue = any>
  extends ReadonlyValImpl<TValue>
  implements ReadonlyVal
{
  public constructor(
    val: ReadonlyVal<ReadonlyVal<TValue>>,
    config?: ValConfig<TValue>
  ) {
    super(val.value.value, config, () => {
      this._value_ = this._sVal_.value.value;
      const markDirty = () => {
        if (!this._dirty_) {
          this._dirty_ = true;
          this._subs_.invoke_();
        }
      };
      let innerDisposer = (val.value as ReadonlyValImpl)._compute_(markDirty);
      const outerDisposer = (val as ReadonlyValImpl)._compute_(() => {
        innerDisposer && innerDisposer();
        innerDisposer = (val.value as ReadonlyValImpl)._compute_(markDirty);
        markDirty();
      });
      return () => {
        innerDisposer && innerDisposer();
        outerDisposer();
      };
    });

    this._sVal_ = val;
    this._dirty_ = false;
  }

  public override get value(): TValue {
    if (this._dirty_ || this._subs_.subscribers_.size <= 0) {
      this._dirty_ = false;
      const value = this._sVal_.value.value;
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

  private _sVal_: ReadonlyVal<ReadonlyVal<TValue>>;
  private _dirty_: boolean;
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
  val: ReadonlyVal<Val<TValue> | ReadonlyVal<TValue>>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> {
  return new UnwrapValImpl(val, config);
}
