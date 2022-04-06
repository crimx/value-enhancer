import { ReadonlyVal } from "./readonly-val";

export class Val<TValue = any, TMeta = any> extends ReadonlyVal<TValue, TMeta> {
  public setValue: (value: TValue, meta?: TMeta) => void = this._setValue;
}
