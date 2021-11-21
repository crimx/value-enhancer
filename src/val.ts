import type {
  ValCompare,
  ValDisposer,
  ValSubscriber,
  ValTransform,
  ValReactionSubscriber,
} from "./typings";

export class Val<TValue = any, TMeta = any> {
  protected _value: TValue;

  public constructor(value: TValue, compare?: ValCompare<TValue>) {
    this._value = value;
    if (compare) {
      this.compare = compare;
    }
  }

  public get value(): TValue {
    return this._value;
  }

  public setValue(value: TValue, meta?: TMeta): void {
    if (!this.compare(value, this._value)) {
      const oldValue = this._value;
      this._value = value;
      if (this._subscribers) {
        this._subscribers.forEach(subscriber =>
          subscriber(value, oldValue, meta)
        );
      }
    }
  }

  /**
   * Subscribe to value changes without immediate emission.
   */
  public reaction(
    subscriber: ValReactionSubscriber<TValue, TMeta>
  ): ValDisposer {
    if (!this._subscribers) {
      this._subscribers = new Set();
    }

    this._subscribers.add(subscriber);

    return (): void => {
      /* istanbul ignore else: guard code  */
      if (this._subscribers) {
        this._subscribers.delete(subscriber);
      }
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
    subscriber(this._value, void 0, meta);
    return disposer;
  }

  public derive<TDerivedValue = any>(
    transform: ValTransform<TValue, TDerivedValue, TMeta>,
    compare?: ValCompare<TDerivedValue>,
    meta?: TMeta
  ): Val<TDerivedValue, TMeta> {
    const derivedVal = new Val<TDerivedValue, TMeta>(
      transform(this.value, undefined, meta),
      compare
    );
    const disposer = this.reaction((newValue, oldValue, meta) => {
      derivedVal.setValue(transform(newValue, oldValue, meta));
    });
    derivedVal.addBeforeDestroy(disposer);
    return derivedVal;
  }

  public destroy(): void {
    if (this._beforeDestroys) {
      this._beforeDestroys.forEach(beforeDestroy => beforeDestroy());
      this._beforeDestroys.clear();
    }
    if (this._subscribers) {
      this._subscribers.clear();
    }
  }

  /**
   * Add a callback which will be run before destroy
   * @param beforeDestroy
   * @returns Cancel the callback
   */
  public addBeforeDestroy(beforeDestroy: () => void): ValDisposer {
    if (!this._beforeDestroys) {
      this._beforeDestroys = new Set();
    }
    this._beforeDestroys.add(beforeDestroy);
    return (): void => {
      /* istanbul ignore else: guard code  */
      if (this._beforeDestroys) {
        this._beforeDestroys.delete(beforeDestroy);
      }
    };
  }

  /**
   * Compare two values. Default `===`.
   */
  public compare(newValue: TValue, oldValue: TValue): boolean {
    return newValue === oldValue;
  }

  protected _beforeDestroys?: Set<() => void>;

  protected _subscribers?: Set<
    ValSubscriber<TValue, TMeta> | ValReactionSubscriber<TValue, TMeta>
  >;
}
