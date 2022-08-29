import { cancelTask, schedule } from "./scheduler";
import type { ReadonlyVal, ValDisposer, ValSubscriber } from "./typings";

export type SubscriberMode =
  /** Async */
  | "sub0"
  /** Eager */
  | "sub1"
  /** Computed */
  | "sub2";

export class Subscribers<TValue = any> {
  public size = 0;

  public constructor(
    val: ReadonlyVal<TValue>,
    initialValue: TValue,
    start?: (() => void | ValDisposer | undefined) | null
  ) {
    this.val = val;
    this.oldValue = initialValue;
    this.start = start;
  }

  public invoke(): void {
    if (this.sub2?.size) {
      this.exec("sub2");
    }
    if (this.sub1?.size) {
      this.exec("sub1");
    }
    if (this.sub0?.size) {
      schedule(this);
    }
  }

  public add(subscribe: ValSubscriber, mode: SubscriberMode): void {
    if (this.start && this.size <= 0) {
      this.stop = this.start();
    }

    let subs = this[mode];
    if (!subs) {
      subs = this[mode] = new Set<ValSubscriber<TValue>>();
    }

    subs.add(subscribe);
    this.size += 1;
  }

  public remove(subscriber: ValSubscriber): void {
    this.sub0?.delete(subscriber);
    this.sub1?.delete(subscriber);
    this.sub2?.delete(subscriber);
    this.size =
      (this.sub0?.size || 0) + (this.sub1?.size || 0) + (this.sub2?.size || 0);
    if (this.size <= 0 && this.stop) {
      const _bSubDisposer = this.stop;
      this.stop = null;
      _bSubDisposer();
    }
  }

  public clear(): void {
    this.sub0?.clear();
    this.sub1?.clear();
    this.sub2?.clear();
    this.size = 0;
    cancelTask(this);
    if (this.stop) {
      const disposer = this.stop;
      this.stop = null;
      disposer();
    }
  }

  public exec(mode: SubscriberMode): void {
    const subs = this[mode];
    if (subs) {
      if (subs === this.sub0) {
        const newValue = this.val.value;
        if (this.oldValue === newValue) {
          return;
        }
        this.oldValue = newValue;
      }
      const value = this.val.value;
      for (const sub of subs) {
        try {
          sub(value);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  private val: ReadonlyVal<TValue>;

  /** Async */
  private sub0?: Set<ValSubscriber<TValue>>;
  /** Eager */
  private sub1?: Set<ValSubscriber<TValue>>;
  /** Computed */
  private sub2?: Set<ValSubscriber<TValue>>;

  private oldValue: TValue;

  private start?: (() => void | ValDisposer | undefined) | null;
  private stop?: ValDisposer | void | null;
}
