import type { ValDisposer, ValSubscriber } from "./typings";

import { cancelTask, schedule } from "./scheduler";
import { invoke, strictEqual } from "./utils";

export type ValVersion = any;

export enum SubscriberMode {
  Async = 1,
  Eager = 2,
  Computed = 3,
}

/**
 * A function that is called when a val get its first subscriber.
 * The returned disposer will be called when the last subscriber unsubscribed from the val.
 */
export type ValOnStart = (subs: Subscribers) => void | ValDisposer | undefined;

/**
 * Manage subscribers for a val.
 */
export class Subscribers<TValue = any> implements Subscribers {
  public constructor(getValue: () => TValue, start?: ValOnStart | null) {
    this.getValue_ = getValue;
    this.#start = start;
  }

  public version_: ValVersion = Symbol();

  public dirty_ = false;

  public get size_(): number {
    return this.#subs.size;
  }

  #shouldUseSymbolVersion?: boolean;
  public newVersion_(newValue?: TValue, oldValue?: TValue): void {
    // This happens if `equal` is `false` or it returns `false` when comparing same values.
    // Use the value itself otherwise so that when setting back the same value, it will not trigger a new version.
    if (!this.#shouldUseSymbolVersion && strictEqual(newValue, oldValue)) {
      this.#shouldUseSymbolVersion = true;
    }
    this.version_ = this.#shouldUseSymbolVersion ? Symbol() : newValue;
    this.dirty_ = true;
  }

  public getValue_: () => TValue;

  public notify_(): void {
    this.#notReadySubscribers.clear();
    if (this.size_ > 0) {
      this.exec_(SubscriberMode.Computed);
      this.exec_(SubscriberMode.Eager);
      if (this[SubscriberMode.Async] > 0) {
        schedule(this);
      }
    } else {
      this.dirty_ = false;
    }
  }

  public add_(subscriber: ValSubscriber, mode: SubscriberMode): () => void {
    if (this.#start && this.size_ <= 0) {
      // Subscribe added, clear notified state
      this.#startDisposer = this.#start(this);
    }

    const currentMode = this.#subs.get(subscriber);
    if (currentMode) {
      this[currentMode]--;
    }
    this.#notReadySubscribers.add(subscriber);
    this.#subs.set(subscriber, mode);
    this[mode]++;

    return (): void => this.remove_(subscriber);
  }

  public remove_(subscriber: ValSubscriber): void {
    this.#notReadySubscribers.delete(subscriber);
    const mode = this.#subs.get(subscriber);
    if (mode) {
      this.#subs.delete(subscriber);
      this[mode]--;
      if (this.size_ <= 0) {
        this.#stop();
      }
    }
  }

  public clear_(): void {
    this.#subs.clear();
    this.#notReadySubscribers.clear();
    this[SubscriberMode.Async] =
      this[SubscriberMode.Eager] =
      this[SubscriberMode.Computed] =
        0;
    cancelTask(this);
    this.#stop();
  }

  public exec_(mode: SubscriberMode): void {
    if (this[mode] > 0) {
      let value: TValue | undefined;
      if (mode === SubscriberMode.Computed) {
        if (this[SubscriberMode.Async] + this[SubscriberMode.Eager] <= 0) {
          this.dirty_ = false;
        }
      } else {
        value = this.getValue_();
        if (!this.dirty_) {
          return;
        }
        if (
          mode === SubscriberMode.Async ||
          /* mode === SubscriberMode.Eager && */ this[SubscriberMode.Async] <= 0
        ) {
          this.dirty_ = false;
        }
      }
      for (const [sub, subMode] of this.#subs) {
        if (subMode === mode && !this.#notReadySubscribers.has(sub)) {
          invoke(sub, value as TValue);
        }
      }
    }
  }

  #subs = new Map<ValSubscriber<TValue>, SubscriberMode>();

  #stop(): void {
    this.#startDisposer && (this.#startDisposer = this.#startDisposer());
  }

  private [SubscriberMode.Async] = 0;
  private [SubscriberMode.Eager] = 0;
  private [SubscriberMode.Computed] = 0;

  readonly #notReadySubscribers = new Set<ValSubscriber<TValue>>();

  #start?: ValOnStart | null;
  #startDisposer?: ValDisposer | void | null;
}
