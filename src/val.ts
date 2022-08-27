import { ReadonlyValImpl } from "./readonly-val";
import type { Val, ValConfig } from "./typings";

class ValImpl<TValue = any>
  extends ReadonlyValImpl<TValue>
  implements Val<TValue>
{
  public override get value(): TValue {
    return this._value;
  }
  public override set value(value: TValue) {
    this._set(value);
  }
  public set: (value: TValue) => void = this._set;
  /** @alias set */
  public setValue: (value: TValue) => void = this._set;
}

export function val(): Val<undefined>;
export function val<TValue = any>(
  value: TValue,
  config?: ValConfig<TValue>
): Val<TValue>;
export function val<TValue = any>(
  value?: TValue,
  config?: ValConfig<TValue>
): Val<TValue> {
  return new ValImpl(value as TValue, config);
}
