import { Subscribers } from "./subscribers";
import type {
  ValDisposer,
  ValSubscriber,
  ValConfig,
  ValOnStart,
  ReadonlyVal,
} from "./typings";

export interface ReadonlyValConfig<TValue = any> extends ValConfig<TValue> {
  /**
   * A function that is called when the number of subscribers goes from zero to one (but not from one to two, etc).
   * That function will be passed a set function which changes the value of the val.
   * It may optionally return a disposer function that is called when the subscriber count goes from one to zero.
   */
  start?: ValOnStart;
}

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
