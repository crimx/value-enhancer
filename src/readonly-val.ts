import { Subscribers } from "./subscribers";
import type {
  ValDisposer,
  ValSubscriber,
  ValConfig,
  ValOnStart,
  ReadonlyVal,
} from "./typings";

export class ReadonlyValImpl<TValue = any> implements ReadonlyVal<TValue> {
  protected _subs_: Subscribers<TValue>;

  protected _value_: TValue;

  protected _compare_(newValue: TValue, oldValue: TValue): boolean {
    return newValue === oldValue;
  }

  protected _set_(value: TValue): void {
    if (!this._compare_(value, this._value_)) {
      this._subs_.shouldExec_ = true;
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

    this._subs_ = new Subscribers<TValue>(this, start);
  }

  public get value(): TValue {
    return this._value_;
  }

  public reaction(
    subscriber: ValSubscriber<TValue>,
    eager?: boolean
  ): ValDisposer {
    return this._subs_.add_(subscriber, eager ? 2 /* Eager */ : 1 /* Async */);
  }

  public subscribe(
    subscriber: ValSubscriber<TValue>,
    eager?: boolean
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
  public _compute_(subscriber: ValSubscriber<void>): ValDisposer {
    return this._subs_.add_(subscriber, 3 /* Computed */);
  }

  public unsubscribe(subscriber?: (...args: any[]) => any): void {
    if (subscriber) {
      this._subs_.remove_(subscriber);
    } else {
      this._subs_.clear_();
    }
  }
}
