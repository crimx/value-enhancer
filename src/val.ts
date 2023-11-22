import type { Val, ValConfig } from "./typings";

import { ReadonlyValImpl } from "./readonly-val";

class ValImpl<TValue = any> extends ReadonlyValImpl<TValue> {
  public constructor(currentValue: TValue, config?: ValConfig<TValue>) {
    const get = () => currentValue;

    super(get, config);

    this.set = (value: TValue) => {
      if (!this.equal(value, currentValue)) {
        this._subs.dirty = true;
        currentValue = value;
        this._subs.notify();
      }
    };
  }

  public set: (this: void, value: TValue) => void;

  public override get value() {
    return this.get();
  }

  public override set value(value: TValue) {
    this.set(value);
  }
}

/**
 * Creates a writable val.
 * @returns A val with undefined value.
 */
export function val<TValue>(): Val<TValue | undefined>;
/**
 * Creates a writable val.
 * @param value Initial value.
 * @param config Custom config.
 */
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
