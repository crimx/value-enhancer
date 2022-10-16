import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, ValConfig } from "./typings";
import { INIT_VALUE } from "./utils";

export type DeriveValTransform<TValue = any, TDerivedValue = any> = (
  newValue: TValue
) => TDerivedValue;

export class DerivedValImpl<TSrcValue = any, TValue = any>
  extends ReadonlyValImpl<TValue>
  implements ReadonlyVal
{
  public constructor(
    val: ReadonlyVal<TSrcValue>,
    transform: DeriveValTransform<TSrcValue, TValue>,
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
    if (
      this._dirtyLevel_ ||
      this._value_ === INIT_VALUE ||
      !this._subs_.subscribers_.size
    ) {
      const value = this._transform_(this._sVal_.value);
      this._subs_.shouldExec_ =
        this._dirtyLevel_ > 0 && !this._compare_(value, this._value_);
      this._value_ = value;
      this._dirtyLevel_ = 0;
    }
    return this._value_;
  }

  private _sVal_: ReadonlyVal<TSrcValue>;
  private _transform_: DeriveValTransform<TSrcValue, TValue>;
  private _dirtyLevel_ = 0;
}

export interface CreateDerive {
  /**
   * Derive a new val with same value from the given val.
   * @param val Input value.
   * @returns An readonly val with same value as the input val.
   */
  <TSrcValue = any, TValue = any>(
    val: ReadonlyVal<TSrcValue>
  ): ReadonlyVal<TValue>;
  /**
   * Derive a new val with transformed value from the given val.
   * @param val Input value.
   * @param transform A pure function that takes an input value and returns a new value.
   * @param config custom config for the combined val.
   * @returns An readonly val with transformed value from the input val.
   */
  <TSrcValue = any, TValue = any>(
    val: ReadonlyVal<TSrcValue>,
    transform: DeriveValTransform<TSrcValue, TValue>,
    config?: ValConfig<TValue>
  ): ReadonlyVal<TValue>;
}
