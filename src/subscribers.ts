import type { ValDisposer, ValSubscriber } from "./typings";

export class Subscribers<TValue = any, TMeta = any> {
  public get size(): number {
    return this._subscribers ? this._subscribers.size : 0;
  }

  public constructor(beforeSubscribe?: () => void | ValDisposer | undefined) {
    this._bSub = beforeSubscribe;
  }

  public invoke(newValue: TValue, meta?: TMeta): void {
    if (this._subscribers) {
      this._subscribers.forEach(subscriber => subscriber(newValue, meta));
    }
  }

  public add(subscribe: ValSubscriber): void {
    if (this._bSub && (!this._subscribers || this._subscribers.size <= 0)) {
      this._bSubDisposer = this._bSub();
    }

    if (!this._subscribers) {
      this._subscribers = new Set();
    }

    this._subscribers.add(subscribe);
  }

  public remove(subscriber: ValSubscriber): void {
    if (this._subscribers) {
      this._subscribers.delete(subscriber);
    }
    if (this._subscribers && this._subscribers.size <= 0) {
      if (this._bSubDisposer) {
        const _bSubDisposer = this._bSubDisposer;
        this._bSubDisposer = null;
        _bSubDisposer();
      }
    }
  }

  public clear(): void {
    if (this._subscribers) {
      this._subscribers.clear();
    }
    if (this._bSubDisposer) {
      const _bSubDisposer = this._bSubDisposer;
      this._bSubDisposer = null;
      _bSubDisposer();
    }
  }

  public destroy(): void {
    this.clear();
  }

  private _subscribers?: Set<ValSubscriber<TValue, TMeta>>;

  private _bSub?: () => void | ValDisposer | undefined;
  private _bSubDisposer?: ValDisposer | void | null;
}
