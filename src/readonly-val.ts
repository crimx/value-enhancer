import { SubscriberMode, Subscribers } from "./subscribers";
import type {
  ValDisposer,
  ValSubscriber,
  ValConfig,
  ValOnStart,
  ReadonlyVal,
} from "./typings";
import { invoke } from "./utils";

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
    return this._subs_.add_(
      subscriber,
      eager ? SubscriberMode.Eager : SubscriberMode.Async
    );
  }

  public subscribe(
    subscriber: ValSubscriber<TValue>,
    eager?: boolean
  ): ValDisposer {
    const disposer = this.reaction(subscriber, eager);
    invoke(subscriber, this.value);
    return disposer;
  }

  /**
   * @internal
   * For computed vals
   */
  public _compute_(subscriber: ValSubscriber<void>): ValDisposer {
    return this._subs_.add_(subscriber, SubscriberMode.Computed);
  }

  public unsubscribe(subscriber?: (...args: any[]) => any): void {
    if (subscriber) {
      this._subs_.remove_(subscriber);
    } else {
      this._subs_.clear_();
    }
  }

  /**
   * @returns the string representation of `this.value`.
   *
   * @example
   * ```js
   * const v$ = val(val(val(1)));
   * console.log(`${v$}`); // "1"
   * ```
   */
  public toString(): string {
    return String(this.value);
  }

  /**
   * @returns the JSON representation of `this.value`.
   *
   * @example
   * ```js
   * const v$ = val(val(val({ a: 1 })));
   * JSON.stringify(v$); // '{"a":1}'
   * ```
   */
  public toJSON(key: string): unknown {
    const value = this.value as
      | undefined
      | null
      | { toJSON?: (key: string) => unknown };
    return value && value.toJSON ? value.toJSON(key) : value;
  }
}
