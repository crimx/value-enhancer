import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, ValConfig } from "./typings";
import { identity, INIT_VALUE } from "./utils";

type DerivedValTransform<TValue = any, TDerivedValue = any> = (
  newValue: TValue
) => TDerivedValue;

class DerivedValImpl<TSrcValue = any, TValue = any>
  extends ReadonlyValImpl<TValue>
  implements ReadonlyVal
{
  public constructor(
    val: ReadonlyVal<TSrcValue>,
    transform: DerivedValTransform<TSrcValue, TValue>,
    config?: ValConfig<TValue>
  ) {
    super(INIT_VALUE, config, () => {
      if (this._value_ === INIT_VALUE) {
        this._value_ = this._transform_(this._sVal_.value);
      } else {
        this._dirtyLevel_ = this._dirtyLevel_ || 1;
      }
      return (val as ReadonlyValImpl)._compute_(() => {
        if (this._dirtyLevel_ < 2) {
          this._dirtyLevel_ = 2;
          this._subs_.invoke_();
        }
      });
    });

    this._sVal_ = val;
    this._transform_ = transform;
  }

  public override get value(): TValue {
    if (this._value_ === INIT_VALUE) {
      this._value_ = this._transform_(this._sVal_.value);
      this._subs_.shouldExec_ = true;
    } else if (this._dirtyLevel_ || this._subs_.subscribers_.size <= 0) {
      const value = this._transform_(this._sVal_.value);
      if (!this._compare_(value, this._value_)) {
        this._subs_.shouldExec_ = true;
        this._value_ = value;
      }
    }
    this._dirtyLevel_ = 0;
    return this._value_;
  }

  private _sVal_: ReadonlyVal<TSrcValue>;
  private _transform_: DerivedValTransform<TSrcValue, TValue>;
  private _dirtyLevel_ = 0;
}

/**
 * Derive a new val with same value from the given val.
 * @param val Input value.
 * @returns An readonly val with same value as the input val.
 */
export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>
): ReadonlyVal<TValue>;
/**
 * Derive a new val with transformed value from the given val.
 * @param val Input value.
 * @param transform A pure function that takes an input value and returns a new value.
 * @param config custom config for the combined val.
 * @returns An readonly val with transformed value from the input val.
 */
export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  transform: DerivedValTransform<TSrcValue, TValue>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue>;
export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  transform: DerivedValTransform<
    TSrcValue,
    TValue
  > = identity as DerivedValTransform<TSrcValue, TValue>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue> {
  return new DerivedValImpl(val, transform, config);
}
