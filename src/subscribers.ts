import type { ValDisposer, ValSubscriber } from "./typings";

import { cancelTask, schedule } from "./scheduler";
import { invoke } from "./utils";

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
    this.#getValue = getValue;
    this.#start = start;
  }

  public dirty = false;

  public notify(): void {
    this.#notReadySubscribers.clear();
    if (this.subs.size > 0) {
      this.exec(SubscriberMode.Computed);
      this.exec(SubscriberMode.Eager);
      if (this[SubscriberMode.Async] > 0) {
        schedule(this);
      }
    } else {
      this.dirty = false;
    }
  }

  public add(subscriber: ValSubscriber, mode: SubscriberMode): () => void {
    if (this.#start && this.subs.size <= 0) {
      // Subscribe added, clear notified state
      this.#startDisposer = this.#start(this);
    }

    const currentMode = this.subs.get(subscriber);
    if (currentMode) {
      this[currentMode]--;
    }
    this.#notReadySubscribers.add(subscriber);
    this.subs.set(subscriber, mode);
    this[mode]++;

    return (): void => this.remove(subscriber);
  }

  public remove(subscriber: ValSubscriber): void {
    this.#notReadySubscribers.delete(subscriber);
    const mode = this.subs.get(subscriber);
    if (mode) {
      this.subs.delete(subscriber);
      this[mode]--;
      if (this.subs.size <= 0) {
        this.#stop();
      }
    }
  }

  public clear(): void {
    this.subs.clear();
    this.#notReadySubscribers.clear();
    this[SubscriberMode.Async] =
      this[SubscriberMode.Eager] =
      this[SubscriberMode.Computed] =
        0;
    cancelTask(this);
    this.#stop();
  }

  public exec(mode: SubscriberMode): void {
    if (this[mode] > 0) {
      let value: TValue | undefined;
      if (mode === SubscriberMode.Computed) {
        if (this[SubscriberMode.Async] + this[SubscriberMode.Eager] <= 0) {
          this.dirty = false;
        }
      } else {
        value = this.#getValue();
        if (!this.dirty) {
          return;
        }
        if (
          mode === SubscriberMode.Async ||
          /* mode === SubscriberMode.Eager && */ this[SubscriberMode.Async] <= 0
        ) {
          this.dirty = false;
        }
      }
      for (const [sub, subMode] of this.subs) {
        if (subMode === mode && !this.#notReadySubscribers.has(sub)) {
          invoke(sub, value as TValue);
        }
      }
    }
  }

  public readonly subs = new Map<ValSubscriber<TValue>, SubscriberMode>();

  #stop(): void {
    this.#startDisposer && (this.#startDisposer = this.#startDisposer());
  }

  #getValue: () => TValue;

  private [SubscriberMode.Async] = 0;
  private [SubscriberMode.Eager] = 0;
  private [SubscriberMode.Computed] = 0;

  readonly #notReadySubscribers = new Set<ValSubscriber<TValue>>();

  #start?: ValOnStart | null;
  #startDisposer?: ValDisposer | void | null;
}
