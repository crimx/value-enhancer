import type { ValDisposer, ValSubscriber } from "./typings";

export interface SubscribersConfig {
  beforeSubscribe?: () => void | ValDisposer | undefined;
  afterSubscribe?: () => void | ValDisposer | undefined;
}

export class Subscribers<TValue = any, TMeta = any> {
  public get size(): number {
    return this._subscribers ? this._subscribers.size : 0;
  }

  public constructor(config: SubscribersConfig) {
    this._bSub = config.beforeSubscribe;
    this._aSub = config.afterSubscribe;
  }

  public invoke(newValue: TValue, meta?: TMeta): void {
    if (this._subscribers) {
      this._subscribers.forEach(subscriber => subscriber(newValue, meta));
    }
  }

  public add(subscribe: ValSubscriber): void {
    if (this._bSub && (!this._subscribers || this._subscribers.size <= 0)) {
      if (this._bSubDisposer) {
        const _bSubDisposer = this._bSubDisposer;
        _bSubDisposer();
      }
      this._bSubDisposer = this._bSub();
    }

    if (!this._subscribers) {
      this._subscribers = new Set();
    }

    this._subscribers.add(subscribe);

    if (this._aSub && this._subscribers.size === 1) {
      if (this._aSubDisposer) {
        const _aSubDisposer = this._aSubDisposer;
        _aSubDisposer();
      }
      this._aSubDisposer = this._aSub();
    }
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
      if (this._aSubDisposer) {
        const _aSubDisposer = this._aSubDisposer;
        this._aSubDisposer = null;
        _aSubDisposer();
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
    if (this._aSubDisposer) {
      const _aSubDisposer = this._aSubDisposer;
      this._aSubDisposer = null;
      _aSubDisposer();
    }
  }

  public destroy(): void {
    this.clear();
  }

  private _subscribers?: Set<ValSubscriber<TValue, TMeta>>;

  private _bSub?: () => void | ValDisposer | undefined;
  private _bSubDisposer?: ValDisposer | void | null;

  private _aSub?: () => void | ValDisposer | undefined;
  private _aSubDisposer?: ValDisposer | void | null;
}
