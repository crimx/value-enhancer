import type { ReadonlyVal, Val, ValConfig } from "./typings";

import { ReadonlyValImpl, ReadonlyValRefImpl } from "./readonly-val";
import { Subscribers } from "./subscribers";

export type { ValImpl };

class ValImpl<TValue = any> extends ReadonlyValImpl<TValue> {
  #config?: ValConfig<TValue>;

  public constructor(currentValue: TValue, config?: ValConfig<TValue>) {
    const get = () => currentValue;

    const subs = new Subscribers(get);

    super(subs, config);

    this.#config = config;
    this.set = (value: TValue) => {
      if (!this.$equal?.(value, currentValue)) {
        subs.dirty_ = true;
        subs.newVersion_(config, value, currentValue);
        currentValue = value;
        subs.notify_();
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

  public override ref(): ReadonlyVal<TValue>;
  public override ref(writable?: false): ReadonlyVal<TValue>;
  public override ref(writable: true): Val<TValue>;
  public override ref(writable?: boolean): ReadonlyVal<TValue> | Val<TValue>;
  public override ref(writable?: boolean): ReadonlyVal<TValue> | Val<TValue> {
    return writable
      ? new ValRefImpl(this, this.#config)
      : new ReadonlyValRefImpl(this, this.#config);
  }
}

export class ValRefImpl<TValue = any> extends ReadonlyValRefImpl<TValue> {
  readonly #source$: ValImpl<TValue>;
  readonly #config?: ValConfig<TValue>;

  public constructor(source$: ValImpl<TValue>, config?: ValConfig<TValue>) {
    super(source$);
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

  public override ref(): ReadonlyVal<TValue>;
  public override ref(writable?: false): ReadonlyVal<TValue>;
  public override ref(writable: true): ReadonlyVal<TValue>;
  public override ref(writable?: boolean): ReadonlyVal<TValue> | Val<TValue>;
  public override ref(writable?: boolean): ReadonlyVal<TValue> | Val<TValue> {
    return writable
      ? new ValRefImpl(this.#source$, this.#config)
      : new ReadonlyValRefImpl(this.#source$, this.#config);
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
