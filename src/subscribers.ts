import type { ValDisposer, ValSubscriber } from "./typings";

import { cancelTask, schedule } from "./scheduler";
import { invoke } from "./utils";

export enum SubscriberMode {
  Async = 1,
  Eager = 2,
  Computed = 3,
}

/**
 * Manage subscribers for a val.
 */
export interface Subscribers {
  /**
   * Whether subscribers should be notified after next value check.
   */
  dirty: boolean;
  /**
   * Notify Subscribers Manager that the value may have changed.
   * A task will be scheduled to check the value.
   */
  notify(): void;
}

/**
 * A function that is called when a val get its first subscriber.
 * The returned disposer will be called when the last subscriber unsubscribed from the val.
 */
export type ValOnStart = (subs: Subscribers) => void | ValDisposer | undefined;

/**
 * Manage subscribers for a val.
 */
export class SubscribersImpl<TValue = any> implements Subscribers {
  public constructor(getValue: () => TValue, start?: ValOnStart | null) {
    this._getValue_ = getValue;
    this._start_ = start;
  }

  public dirty = false;

  public notify(): void {
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
      this.dirty = false;
    }
  }

  public add_(subscriber: ValSubscriber, mode: SubscriberMode): () => void {
    if (this._start_ && this.subscribers_.size <= 0) {
      this._startDisposer_ = this._start_(this);
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
          this.dirty = false;
        }
      } else {
        value = this._getValue_();
        if (!this.dirty) {
          return;
        }
        if (
          mode === SubscriberMode.Async ||
          /* mode === SubscriberMode.Computed */ this[SubscriberMode.Async] <= 0
        ) {
          this.dirty = false;
        }
      }
      for (const [sub, subMode] of this.subscribers_) {
        if (subMode === mode && !this._notReadySubscribers_.has(sub)) {
          invoke(sub, value as TValue);
        }
      }
    }
  }

  public readonly subscribers_ = new Map<
    ValSubscriber<TValue>,
    SubscriberMode
  >();

  private _stop_(): void {
    this._startDisposer_ && (this._startDisposer_ = this._startDisposer_());
  }

  private _getValue_: () => TValue;

  private [SubscriberMode.Async] = 0;
  private [SubscriberMode.Eager] = 0;
  private [SubscriberMode.Computed] = 0;

  private readonly _notReadySubscribers_ = new Set<ValSubscriber<TValue>>();

  private _start_?: ValOnStart | null;
  private _startDisposer_?: ValDisposer | void | null;
}
