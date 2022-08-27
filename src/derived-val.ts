import { ReadonlyValImpl } from "./readonly-val";
import type { ReadonlyVal, ValConfig, ValTransform } from "./typings";

export class DerivedValImpl<TSrcValue = any, TValue = any>
  extends ReadonlyValImpl<TValue>
  implements ReadonlyVal
{
  public constructor(
    val: ReadonlyVal<TSrcValue>,
    transform: ValTransform<TSrcValue, TValue>,
    config: ValConfig<TValue>
  ) {
    super(transform(val.value), config, () =>
      (val as ReadonlyValImpl)._compute(() => {
        if (!this._dirty) {
          this._dirty = true;
          this._subs.invoke();
        }
      })
    );

    this._sVal = val;
    this._sOldValue = val.value;
    this._transform = transform;
  }

  public override get value(): TValue {
    if (this._dirty || this._subs.size <= 0) {
      this._dirty = false;
      const newValue = this._sVal.value;
      if (this._sOldValue !== newValue) {
        this._sOldValue = newValue;
        const value = this._transform(newValue);
        if (!this._compare(value, this._value)) {
          this._value = value;
        }
      }
    }
    return this._value;
  }

  private _sVal: ReadonlyVal<TSrcValue>;
  private _sOldValue: TSrcValue;
  private _transform: ValTransform<TSrcValue, TValue>;

  private _dirty = false;
}

export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>
): ReadonlyVal<TValue>;
export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  transform: ValTransform<TSrcValue, TValue>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue>;
export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  transform: ValTransform<TSrcValue, TValue> = value =>
    value as unknown as TValue,
  config: ValConfig<TValue> = {}
): ReadonlyVal<TValue> {
  return new DerivedValImpl(val, transform, config);
}
