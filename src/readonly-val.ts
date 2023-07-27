import type { ValOnStart } from "./subscribers";
import type {
  ReadonlyVal,
  ValConfig,
  ValDisposer,
  ValSetValue,
  ValSubscriber,
} from "./typings";

import { SubscriberMode, Subscribers } from "./subscribers";
import { defaultCompare, invoke } from "./utils";

/**
 * Bare minimum implementation of a readonly val.
 */
export class ReadonlyValImpl<TValue = any> implements ReadonlyVal<TValue> {
  /**
   * Manage subscribers for a val.
   */
  protected _subs_: Subscribers<TValue>;

  private _eager_?: boolean;

  /**
   * @param get A pure function that returns the current value of the val.
   * @param config Custom config for the val.
   * @param start A function that is called when a val get its first subscriber.
   *        The returned disposer will be called when the last subscriber unsubscribed from the val.
   */
  public constructor(
    get: () => TValue,
    { compare = defaultCompare, eager }: ValConfig<TValue> = {},
    start?: ValOnStart
  ) {
    this.get = get;
    this.compare = compare;
    this._eager_ = eager;
    this._subs_ = new Subscribers<TValue>(get, start);
  }

  public get value(): TValue {
    return this.get();
  }

  public get: (this: void) => TValue;

  public compare: (this: void, newValue: TValue, oldValue: TValue) => boolean;

  public reaction(
    subscriber: ValSubscriber<TValue>,
    eager = this._eager_
  ): ValDisposer {
    return this._subs_.add_(
      subscriber,
      eager ? SubscriberMode.Eager : SubscriberMode.Async
    );
  }

  public subscribe(
    subscriber: ValSubscriber<TValue>,
    eager = this._eager_
  ): ValDisposer {
    const disposer = this.reaction(subscriber, eager);
    invoke(subscriber, this.value);
    this._subs_.dirty_ = false;
    return disposer;
  }

  public $valCompute(subscriber: ValSubscriber<void>): ValDisposer {
    return this._subs_.add_(subscriber, SubscriberMode.Computed);
  }

  public unsubscribe(subscriber?: (...args: any[]) => any): void {
    if (subscriber) {
      this._subs_.remove_(subscriber);
    } else {
      this._subs_.clear_();
    }
  }

  public dispose(): void {
    this._subs_.clear_();
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

/**
 * Creates a readonly val with the given value.
 *
 * @param value Value for the val
 * @param config Custom config for the val.
 * @returns A tuple with the readonly val and a function to set the value.
 */
export const readonlyVal = <TValue = any>(
  value: TValue,
  config?: ValConfig<TValue>
): [ReadonlyVal<TValue>, ValSetValue<TValue>] => {
  let currentValue = value;

  let subs: Subscribers;

  const set = (value: TValue): void => {
    if (!val.compare(value, currentValue)) {
      currentValue = value;
      if (subs) {
        subs.dirty_ = true;
        subs.notify_();
      }
    }
  };

  const val = new ReadonlyValImpl(
    () => currentValue,
    config,
    s => {
      subs = s;
    }
  );

  return [val, set];
};
