import { Subscribers } from "./subscribers";
import type { ValDisposer, ValSubscriber, ValConfig } from "./typings";

export class ReadonlyVal<TValue = any, TMeta = any> {
  protected _subscribers: Subscribers<TValue, TMeta>;

  protected _value: TValue;

  protected _setValue(value: TValue, meta?: TMeta): void {
    if (!this.compare(value, this._value)) {
      this._value = value;
      this._subscribers.invoke(value, meta);
    }
  }

  public constructor(value: TValue, config?: ValConfig<TValue, TMeta>) {
    this._value = value;

    let beforeSubscribe: undefined | (() => void | ValDisposer | undefined);
    let afterSubscribe: undefined | (() => void | ValDisposer | undefined);

    if (config) {
      if (config.compare) {
        this.compare = config.compare;
      }
      if (config.beforeSubscribe) {
        const _beforeSubscribe = config.beforeSubscribe;
        const _setValue = this._setValue.bind(this);
        beforeSubscribe = () => _beforeSubscribe(_setValue);
      }
      if (config.afterSubscribe) {
        const _afterSubscribe = config.afterSubscribe;
        const _setValue = this._setValue.bind(this);
        afterSubscribe = () => _afterSubscribe(_setValue);
      }
    }

    this._subscribers = new Subscribers<TValue, TMeta>({
      beforeSubscribe,
      afterSubscribe,
    });
  }

  public get value(): TValue {
    return this._value;
  }

  /**
   * Subscribe to value changes without immediate emission.
   */
  public reaction(subscriber: ValSubscriber<TValue, TMeta>): ValDisposer {
    this._subscribers.add(subscriber);

    return (): void => {
      this._subscribers.remove(subscriber);
    };
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
    this._subscribers.destroy();
  }

  /**
   * Compare two values. Default `===`.
   */
  public compare(newValue: TValue, oldValue: TValue): boolean {
    return newValue === oldValue;
  }
}
