import { cancelTask, schedule } from "./scheduler";
import type { ReadonlyVal, ValDisposer, ValSubscriber } from "./typings";

export enum SubscriberMode {
  Async = 1,
  Eager = 2,
  Computed = 3,
}

export class Subscribers<TValue = any> {
  public constructor(
    val: ReadonlyVal<TValue>,
    start?: (() => void | ValDisposer | undefined) | null
  ) {
    this._val_ = val;
    this._start_ = start;
  }

  public invoke_(): void {
    if (this._notReadySubscribers_.size > 0) {
      this._notReadySubscribers_.clear();
    }
    if (this.subscribers_.size > 0) {
      this.exec_(SubscriberMode.Computed);
      this.exec_(SubscriberMode.Eager);
      if (this[SubscriberMode.Async] > 0) {
        schedule(this);
      }
    } else {
      this.shouldExec_ = false;
    }
  }

  public add_(subscriber: ValSubscriber, mode: SubscriberMode): () => void {
    if (this._start_ && this.subscribers_.size <= 0) {
      this._startDisposer_ = this._start_();
    }

    const currentMode = this.subscribers_.get(subscriber);
    if (currentMode) {
      this[currentMode]--;
    }
    this._notReadySubscribers_.add(subscriber);
    this.subscribers_.set(subscriber, mode);
    this[mode]++;

    return (): void => this.remove_(subscriber);
  }

  public remove_(subscriber: ValSubscriber): void {
    this._notReadySubscribers_.delete(subscriber);
    const mode = this.subscribers_.get(subscriber);
    if (mode) {
      this.subscribers_.delete(subscriber);
      this[mode]--;
      if (this.subscribers_.size <= 0) {
        this._stop_();
      }
    }
  }

  public clear_(): void {
    this.subscribers_.clear();
    this._notReadySubscribers_.clear();
    this[SubscriberMode.Async] =
      this[SubscriberMode.Eager] =
      this[SubscriberMode.Computed] =
        0;
    cancelTask(this);
    this._stop_();
  }

  public exec_(mode: SubscriberMode): void {
    if (this[mode] > 0) {
      let value: TValue | undefined;
      if (mode === SubscriberMode.Computed) {
        if (this[SubscriberMode.Async] + this[SubscriberMode.Eager] <= 0) {
          this.shouldExec_ = false;
        }
      } else {
        value = this._val_.value;
        if (!this.shouldExec_) {
          return;
        }
        if (
          mode === SubscriberMode.Async ||
          /* mode === SubscriberMode.Computed */ this[SubscriberMode.Async] <= 0
        ) {
          this.shouldExec_ = false;
        }
      }
      for (const [sub, subMode] of this.subscribers_) {
        if (subMode === mode && !this._notReadySubscribers_.has(sub)) {
          try {
            sub(value as TValue);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }

  public shouldExec_ = false;

  public readonly subscribers_ = new Map<
    ValSubscriber<TValue>,
    SubscriberMode
  >();

  private _stop_(): void {
    this._startDisposer_ && (this._startDisposer_ = this._startDisposer_());
  }

  private readonly _val_: ReadonlyVal<TValue>;

  private [SubscriberMode.Async] = 0;
  private [SubscriberMode.Eager] = 0;
  private [SubscriberMode.Computed] = 0;

  private readonly _notReadySubscribers_ = new Set<ValSubscriber<TValue>>();

  private _start_?: (() => void | ValDisposer | undefined) | null;
  private _startDisposer_?: ValDisposer | void | null;
}
