import { ReadonlyValImpl } from "./readonly-val";
import type { Val, ValConfig } from "./typings";

export class ValImpl<TValue = any>
  extends ReadonlyValImpl<TValue>
  implements Val<TValue>
{
  public constructor(value: TValue, config?: ValConfig<TValue>) {
    super(value, config);
  }

  public override get value(): TValue {
    return this._value_;
  }

  public override set value(value: TValue) {
    this._set_(value);
  }

  /** Set new value */
  public set: (value: TValue) => void = this._set_;
}

export interface CreateVal {
  /**
   * Creates a writable val.
   * @returns A val with undefined value.
   */
  (): Val<undefined>;
  /**
   * Creates a writable val.
   * @param value Initial value.
   * @param config Custom config.
   */
  <TValue = any>(value: TValue, config?: ValConfig<TValue>): Val<TValue>;
}
