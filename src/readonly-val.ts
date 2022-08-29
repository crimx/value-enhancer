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
  protected _subs: Subscribers<TValue>;

  protected _value: TValue;

  protected _compare(newValue: TValue, oldValue: TValue): boolean {
    return newValue === oldValue;
  }

  protected _set = (value: TValue): void => {
    if (!this._compare(value, this._value)) {
      this._value = value;
      this._subs.invoke();
    }
  };

  public constructor(
    value: TValue,
    { compare }: ValConfig<TValue> = {},
    start?: ValOnStart<TValue>
  ) {
    this._value = value;

    if (compare) {
      this._compare = compare;
    }

    this._subs = new Subscribers<TValue>(
      this,
      value,
      start ? () => start(this._set) : null
    );
  }

  public get value(): TValue {
    return this._value;
  }

  public reaction(
    subscriber: ValSubscriber<TValue>,
    eager = false
  ): ValDisposer {
    this._subs.add(subscriber, eager ? "sub1" : "sub0");
    return (): void => this._subs.remove(subscriber);
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
  public _compute(subscriber: ValSubscriber<TValue>): ValDisposer {
    this._subs.add(subscriber, "sub2");
    return (): void => this._subs.remove(subscriber);
  }

  public unsubscribe(): void;
  public unsubscribe<T extends (...args: any[]) => any>(subscriber: T): void;
  public unsubscribe<T extends (...args: any[]) => any>(subscriber?: T): void {
    if (subscriber) {
      this._subs.remove(subscriber);
    } else {
      this._subs.clear();
    }
  }
}

/**
 * Creates a readonly val with the given value.
 * @param value The value of the readonly val.
 * @param config Custom config.
 * @returns A readonly val with the given value.
 */
export function readonlyVal<TValue = any>(
  value: TValue,
  config: ReadonlyValConfig<TValue> = {}
): ReadonlyVal<TValue> {
  return new ReadonlyValImpl(value, config, config.start);
}
