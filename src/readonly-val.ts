import { Subscribers } from "./subscribers";
import type { ValDisposer, ValSubscriber, ValConfig } from "./typings";

export class ReadonlyVal<TValue = any> {
  private _subs: Subscribers<TValue>;

  protected _value: TValue;

  protected _cp(newValue: TValue, oldValue: TValue): boolean {
    return newValue === oldValue;
  }

  protected _set = (value: TValue): void => {
    if (!this._cp(value, this._value)) {
      this._value = value;
      this._subs.invoke(value);
    }
  };

  public constructor(
    value: TValue,
    { compare, beforeSubscribe }: ValConfig<TValue> = {}
  ) {
    this._value = value;

    if (compare) {
      this._cp = compare;
    }

    this._subs = new Subscribers<TValue>(
      beforeSubscribe ? () => beforeSubscribe(this._set) : null
    );
  }

  public get value(): TValue {
    return this._value;
  }

  /**
   * Subscribe to value changes without immediate emission.
   */
  public reaction(subscriber: ValSubscriber<TValue>): ValDisposer {
    this._subs.add(subscriber);
    return (): void => this._subs.remove(subscriber);
  }

  /**
   * Subscribe to value changes with immediate emission.
   * @param subscriber
   */
  public subscribe(subscriber: ValSubscriber<TValue>): ValDisposer {
    const disposer = this.reaction(subscriber);
    subscriber(this._value);
    return disposer;
  }

  public destroy(): void {
    this._subs.clear();
  }

  public unsubscribe<T extends (...args: any[]) => any>(subscriber: T): void {
    this._subs.remove(subscriber);
  }

  public get size(): number {
    return this._subs.size;
  }
}
