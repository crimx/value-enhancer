import { Subscribers } from "./subscribers";
import type { ValDisposer, ValSubscriber, ValConfig } from "./typings";

export class ReadonlyVal<TValue = any, TMeta = any> {
  private _subs: Subscribers<TValue, TMeta>;

  protected _value: TValue;

  protected _cp(newValue: TValue, oldValue: TValue): boolean {
    return newValue === oldValue;
  }

  protected _set = (value: TValue, meta?: TMeta): void => {
    if (!this._cp(value, this._value)) {
      this._value = value;
      this._subs.invoke(value, meta);
    }
  };

  public constructor(
    value: TValue,
    { compare, beforeSubscribe }: ValConfig<TValue, TMeta> = {}
  ) {
    this._value = value;

    if (compare) {
      this._cp = compare;
    }

    this._subs = new Subscribers<TValue, TMeta>(
      beforeSubscribe ? () => beforeSubscribe(this._set) : null
    );
  }

  public get value(): TValue {
    return this._value;
  }

  /**
   * Subscribe to value changes without immediate emission.
   */
  public reaction(subscriber: ValSubscriber<TValue, TMeta>): ValDisposer {
    this._subs.add(subscriber);
    return (): void => this._subs.remove(subscriber);
  }

  /**
   * Subscribe to value changes with immediate emission.
   * @param subscriber
   * @param meta Meta for the immediate emission
   */
  public subscribe(
    subscriber: ValSubscriber<TValue, TMeta>,
    meta?: TMeta
  ): ValDisposer {
    const disposer = this.reaction(subscriber);
    subscriber(this._value, meta);
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
