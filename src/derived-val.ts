import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, ValConfig } from "./typings";

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
    super(transform(val.value), config, () =>
      (val as ReadonlyValImpl)._compute_(() => {
        if (!this._dirty_) {
          this._dirty_ = true;
          this._subs_.invoke_();
        }
      })
    );

    this._sVal_ = val;
    this._sOldValue_ = val.value;
    this._transform_ = transform;
  }

  public override get value(): TValue {
    if (this._dirty_ || this._subs_.size_ <= 0) {
      this._dirty_ = false;
      const newValue = this._sVal_.value;
      if (this._sOldValue_ !== newValue) {
        this._sOldValue_ = newValue;
        const value = this._transform_(newValue);
        if (!this._compare_(value, this._value_)) {
          this._value_ = value;
        }
      }
    }
    return this._value_;
  }

  private _sVal_: ReadonlyVal<TSrcValue>;
  private _sOldValue_: TSrcValue;
  private _transform_: DeriveValTransform<TSrcValue, TValue>;

  private _dirty_ = false;
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
