import type { Val, ValConfig } from "./typings";

import { ReadonlyValImpl } from "./readonly-val";

class ValImpl<TValue = any> extends ReadonlyValImpl<TValue> {
  #config?: ValConfig<TValue>;

  public constructor(currentValue: TValue, config?: ValConfig<TValue>) {
    const get = () => currentValue;

    super(get, config);

    this.#config = config;
    this.set = (value: TValue) => {
      if (!this.$equal?.(value, currentValue)) {
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

  public ref(): Val<TValue> {
    return new RefValImpl(this, this.#config);
  }
}

class RefValImpl<TValue = any> extends ReadonlyValImpl<TValue> {
  #config?: ValConfig<TValue>;
  #source$: ValImpl<TValue>;

  public constructor(source$: ValImpl<TValue>, config?: ValConfig<TValue>) {
    super(source$.get, config, () =>
      source$.$valCompute(() => {
        this._subs.dirty = true;
        this._subs.notify();
      })
    );

    this.#source$ = source$;
    this.#config = config;
    this.set = source$.set;
  }

  public set: (this: void, value: TValue) => void;

  public override get value() {
    return this.get();
  }

  public override set value(value: TValue) {
    this.set(value);
  }

  public ref(): Val<TValue> {
    return new RefValImpl(this.#source$, this.#config);
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
