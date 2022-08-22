import type { ValDisposer, ValSubscriber } from "./typings";

export class Subscribers<TValue = any, TMeta = any> {
  public get size(): number {
    return (this._sub ? 1 : this._subs?.size) || 0;
  }

  public constructor(
    beforeSubscribe?: (() => void | ValDisposer | undefined) | null
  ) {
    this._bs = beforeSubscribe;
  }

  public invoke(newValue: TValue, meta?: TMeta): void {
    if (this._sub) {
      this._sub(newValue, meta);
    } else if (this._subs) {
      this._subs.forEach(subscriber => subscriber(newValue, meta));
    }
  }

  public add(subscribe: ValSubscriber): void {
    if (this._bs && this.size <= 0) {
      this._bsd = this._bs();
    }

    if (!this._subs) {
      if (!this._sub) {
        this._sub = subscribe;
        return;
      }
      this._subs = new Set<ValSubscriber<TValue, TMeta>>().add(this._sub);
      this._sub = null;
    }

    this._subs.add(subscribe);
  }

  public remove(subscriber: ValSubscriber): void {
    if (this._subs) {
      this._subs.delete(subscriber);
    } else if (this._sub === subscriber) {
      this._sub = null;
    }
    if (this.size <= 0 && this._bsd) {
      const _bSubDisposer = this._bsd;
      this._bsd = null;
      _bSubDisposer();
    }
  }

  public clear(): void {
    this._sub = null;
    this._subs?.clear();
    if (this._bsd) {
      const _bSubDisposer = this._bsd;
      this._bsd = null;
      _bSubDisposer();
    }
  }

  private _sub?: ValSubscriber<TValue, TMeta> | null;
  private _subs?: Set<ValSubscriber<TValue, TMeta>>;

  private _bs?: (() => void | ValDisposer | undefined) | null;
  private _bsd?: ValDisposer | void | null;
}
