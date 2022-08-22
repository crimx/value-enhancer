import { ReadonlyVal } from "./readonly-val";

export class Val<TValue = any, TMeta = any> extends ReadonlyVal<TValue, TMeta> {
  public override get value(): TValue {
    return this._value;
  }
  public override set value(value: TValue) {
    this._set(value);
  }
  public set: (value: TValue, meta?: TMeta) => void = this._set;
  /** @alias set */
  public setValue: (value: TValue, meta?: TMeta) => void = this._set;
}
