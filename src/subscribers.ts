import { cancelTask, schedule } from "./scheduler";
import type { ReadonlyVal, ValDisposer, ValSubscriber } from "./typings";

type SubscriberMode = 1 /* Async */ | 2 /* Eager */ | 3; /* Computed */

export class Subscribers<TValue = any> {
  public constructor(
    val: ReadonlyVal<TValue>,
    start?: (() => void | ValDisposer | undefined) | null
  ) {
    this._val_ = val;
    this._start_ = start;
  }

  public invoke_(): void {
    if (this._notReadySubscribers_.size) {
      this._notReadySubscribers_.clear();
    }
    this.exec_(3 /* Computed */);
    this.exec_(2 /* Eager */);
    if (this[1 /* Async */]) {
      schedule(this);
    } else {
      this.shouldExec_ = false;
    }
  }

  public add_(subscriber: ValSubscriber, mode: SubscriberMode): () => void {
    if (this._start_ && !this.subscribers_.size) {
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
    const mode = this.subscribers_.get(subscriber);
    if (mode) {
      this.subscribers_.delete(subscriber);
      this[mode]--;
      if (!this.subscribers_.size) {
        this._stop_();
      }
    }
  }

  public clear_(): void {
    this.subscribers_.clear();
    this._notReadySubscribers_.clear();
    this[1 /* Async */] = this[2 /* Eager */] = this[3 /* Computed */] = 0;
    cancelTask(this);
    this._stop_();
  }

  public exec_(mode: SubscriberMode): void {
    if (this[mode]) {
      let value: TValue | undefined;
      if (mode !== 3 /* Computed */) {
        value = this._val_.value;
      }
      if (mode === 1 /* Async */) {
        if (!this.shouldExec_) {
          return;
        }
        this.shouldExec_ = false;
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

  private [1 /* Async */] = 0;
  private [2 /* Eager */] = 0;
  private [3 /* Computed */] = 0;

  private readonly _notReadySubscribers_ = new Set<ValSubscriber<TValue>>();

  private _start_?: (() => void | ValDisposer | undefined) | null;
  private _startDisposer_?: ValDisposer | void | null;
}
