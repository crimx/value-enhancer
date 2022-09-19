import { cancelTask, schedule } from "./scheduler";
import type { ReadonlyVal, ValDisposer, ValSubscriber } from "./typings";

const sSize = (s: Set<ValSubscriber> | undefined): number => (s ? s.size : 0);
const sDelete = (
  s: Set<ValSubscriber> | undefined,
  sub: ValSubscriber
): 0 | 1 => (s && s.delete(sub) ? 1 : 0);
const sClear = (s: Set<ValSubscriber> | undefined): unknown => s && s.clear();

export type SubscriberMode =
  /** Async */
  | "s0"
  /** Eager */
  | "s1"
  /** Computed */
  | "s2";

export class Subscribers<TValue = any> {
  public size_ = 0;

  public constructor(
    val: ReadonlyVal<TValue>,
    initialValue: TValue,
    start?: (() => void | ValDisposer | undefined) | null
  ) {
    this._val_ = val;
    this._oldValue_ = initialValue;
    this._start_ = start;
  }

  public invoke_(): void {
    this.exec_("s2");
    this.exec_("s1");
    if (sSize(this.s0)) {
      schedule(this);
    }
  }

  public add_(subscriber: ValSubscriber, mode: SubscriberMode): () => void {
    if (this._start_ && this.size_ <= 0) {
      this._startDisposer_ = this._start_();
    }

    (this[mode] || (this[mode] = new Set())).add(subscriber);

    this.size_ += 1;

    return (): void => this.remove_(subscriber);
  }

  public remove_(subscriber: ValSubscriber): void {
    this.size_ -=
      sDelete(this.s0, subscriber) +
      sDelete(this.s1, subscriber) +
      sDelete(this.s2, subscriber);
    if (this.size_ <= 0) {
      this._stop_();
    }
  }

  public clear_(): void {
    sClear(this.s0);
    sClear(this.s1);
    sClear(this.s2);
    this.size_ = 0;
    cancelTask(this);
    this._stop_();
  }

  public exec_(mode: SubscriberMode): void {
    if (sSize(this[mode])) {
      const value = this._val_.value;
      if (mode === "s0") {
        if (this._oldValue_ === value) {
          return;
        }
        this._oldValue_ = value;
      }
      for (const sub of this[mode]!) {
        try {
          sub(value);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  private _stop_(): void {
    if (this._startDisposer_) {
      this._startDisposer_();
      this._startDisposer_ = null;
    }
  }

  private _val_: ReadonlyVal<TValue>;

  /** Async */
  private s0?: Set<ValSubscriber<TValue>>;
  /** Eager */
  private s1?: Set<ValSubscriber<TValue>>;
  /** Computed */
  private s2?: Set<ValSubscriber<TValue>>;

  private _oldValue_: TValue;

  private _start_?: (() => void | ValDisposer | undefined) | null;
  private _startDisposer_?: ValDisposer | void | null;
}
