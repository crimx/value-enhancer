import { Subscribers } from "./subscribers";
import type {
  ValDisposer,
  ValSubscriber,
  ValConfig,
  ValOnStart,
  ReadonlyVal,
  ReadonlyValConfig,
} from "./typings";

export class ReadonlyValImpl<TValue = any> implements ReadonlyVal<TValue> {
  protected _subs_: Subscribers<TValue>;

  protected _value_: TValue;

  protected _compare_(newValue: TValue, oldValue: TValue): boolean {
    return newValue === oldValue;
  }

  protected _set_(value: TValue): void {
    if (!this._compare_(value, this._value_)) {
      this._value_ = value;
      this._subs_.invoke_();
    }
  }

  public constructor(
    value: TValue,
    { compare }: ValConfig<TValue> = {},
    start?: ValOnStart
  ) {
    this._value_ = value;

    if (compare) {
      this._compare_ = compare;
    }

    this._subs_ = new Subscribers<TValue>(this, value, start);
  }

  public get value(): TValue {
    return this._value_;
  }

  public reaction(
    subscriber: ValSubscriber<TValue>,
    eager = false
  ): ValDisposer {
    return this._subs_.add_(subscriber, eager ? "s1" : "s0");
  }

  public subscribe(
    subscriber: ValSubscriber<TValue>,
    eager = false
  ): ValDisposer {
    const disposer = this.reaction(subscriber, eager);
    try {
      subscriber(this.value);
    } catch (e) {
      console.error(e);
    }
    return disposer;
  }

  /**
   * @internal
   * For computed vals
   */
  public _compute_(subscriber: ValSubscriber<TValue>): ValDisposer {
    return this._subs_.add_(subscriber, "s2");
  }

  public unsubscribe(): void;
  public unsubscribe<T extends (...args: any[]) => any>(subscriber: T): void;
  public unsubscribe<T extends (...args: any[]) => any>(subscriber?: T): void {
    if (subscriber) {
      this._subs_.remove_(subscriber);
    } else {
      this._subs_.clear_();
    }
  }
}

/**
 * Creates a readonly val with the given value.
 * @param value The value of the readonly val.
 * @param config Custom config.
 * @returns A readonly val with the given value.
 */
export const readonlyVal = <TValue = any>(
  value: TValue,
  config: ReadonlyValConfig<TValue> = {}
): ReadonlyVal<TValue> => new ReadonlyValImpl(value, config, config.start);
