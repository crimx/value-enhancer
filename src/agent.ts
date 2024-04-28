import type { Task } from "./scheduler";
import { cancelTask, schedule } from "./scheduler";
import type {
  ValConfig,
  ValDisposer,
  ValSubscriber,
  ValVersion,
} from "./typings";
import { INIT_VALUE, invoke, strictEqual } from "./utils";

export enum SubMode {
  Async = 1,
  Eager = 2,
  Computed = 3,
}

export enum AgentStatus {
  Notified = 1 << 0,
  ValueDirty = 1 << 1,
  ShouldInvokeEager = 1 << 2,
  ShouldInvokeAsync = 1 << 3,
  ShouldInvoke = AgentStatus.ShouldInvokeEager | AgentStatus.ShouldInvokeAsync,
}

export interface IValAgent<TValue = any> {
  subs_: Map<ValSubscriber<TValue>, SubMode>;
  version_: ValVersion;
  eager_?: boolean;
  resolveValue_: () => TValue;
  notify_: () => void;
  add_(subscriber: ValSubscriber, mode: SubMode): () => void;
  remove_(subscriber?: (...args: any[]) => any): void;
}

export class ValAgent<TValue = any> implements IValAgent<TValue>, Task {
  public constructor(
    getValue: () => TValue,
    config?: ValConfig<TValue>,
    onStart?: (notify: () => void) => ValDisposer | void | undefined
  ) {
    this.#onStart = onStart;
    this.#getValue = getValue;
    this.equal_ = (config?.equal ?? strictEqual) || void 0;
    this.eager_ = config?.eager;
  }

  public readonly subs_ = new Map<ValSubscriber<TValue>, SubMode>();
  public status_: number = AgentStatus.ValueDirty;
  public version_: ValVersion = INIT_VALUE;
  public value_: TValue = INIT_VALUE;
  public equal_?: (newValue: TValue, oldValue: TValue) => boolean;
  public eager_?: boolean;

  public resolveValue_ = (): TValue => {
    if (this.status_ & AgentStatus.ValueDirty) {
      const newValue = this.#getValue();
      if (this.value_ === INIT_VALUE) {
        this._bumpVersion_(newValue);
      } else if (!this.equal_?.(newValue, this.value_)) {
        this._bumpVersion_(newValue);
        this.status_ |= AgentStatus.ShouldInvoke;
      }
      if (this.subs_.size) {
        this.status_ &= ~AgentStatus.ValueDirty;
      }
    }
    this.status_ &= ~AgentStatus.Notified;
    return this.value_;
  };

  public notify_ = (): void => {
    this.status_ |= AgentStatus.ValueDirty;
    if (!(this.status_ & AgentStatus.Notified)) {
      this.status_ |= AgentStatus.Notified;
      this.#notReadySubscribers.clear();
      if (this[SubMode.Computed]) {
        this.#invoke(SubMode.Computed);
      }
      if (this[SubMode.Eager]) {
        this.resolveValue_();
        if (this.status_ & AgentStatus.ShouldInvokeEager) {
          this.status_ &= ~AgentStatus.ShouldInvokeEager;
          this.#invoke(SubMode.Eager);
        } else {
          this.status_ &= ~AgentStatus.ShouldInvoke;
          return;
        }
      } else {
        this.status_ &= ~AgentStatus.ShouldInvokeEager;
      }
      if (this[SubMode.Async]) {
        schedule(this);
      } else {
        this.status_ &= ~AgentStatus.ShouldInvokeAsync;
      }
    }
  };

  public add_(subscriber: ValSubscriber, mode: SubMode): () => void {
    const oldSize = this.subs_.size;
    const currentMode = this.subs_.get(subscriber);
    if (currentMode) {
      this[currentMode]--;
    }
    this.#notReadySubscribers.add(subscriber);
    this.subs_.set(subscriber, mode);
    this[mode]++;

    if (!oldSize) {
      this.resolveValue_();
      this.status_ &= ~AgentStatus.ShouldInvoke;
      this.#onStartDisposer?.();
      this.#onStartDisposer = this.#onStart?.(this.notify_);
    }

    return () => this.remove_(subscriber);
  }

  public remove_(subscriber?: (...args: any[]) => any): void {
    if (subscriber) {
      this.#notReadySubscribers.delete(subscriber);
      const mode = this.subs_.get(subscriber);
      if (mode) {
        this.subs_.delete(subscriber);
        this[mode]--;
      }
    } else {
      this.subs_.clear();
      this.#notReadySubscribers.clear();
      this[SubMode.Async] = this[SubMode.Eager] = this[SubMode.Computed] = 0;
      cancelTask(this);
    }
    if (!this.subs_.size) {
      this.status_ |= AgentStatus.ValueDirty;
      if (this.#onStartDisposer) {
        this.#onStartDisposer();
        this.#onStartDisposer = null;
      }
    }
  }

  public runTask_(): void {
    if (this[SubMode.Async]) {
      this.resolveValue_();
      if (this.status_ & AgentStatus.ShouldInvokeAsync) {
        this.status_ &= ~AgentStatus.ShouldInvokeAsync;
        this.#invoke(SubMode.Async);
      }
    } else {
      this.status_ &= ~AgentStatus.ShouldInvokeAsync;
    }
  }

  private _bumpVersion_(value: TValue): void {
    this._bumpVersion_ = this.equal_?.(value, value)
      ? this._bumpVersionByValue_
      : this._bumpVersionByNumber_;
    this._bumpVersion_(value);
  }

  private _bumpVersionByNumber_(value: TValue): void {
    this.value_ = value;
    this.version_ = this.#numberVersion++ | 0;
  }

  private _bumpVersionByValue_(value: TValue): void {
    this.value_ = this.version_ = value;
  }

  private [SubMode.Async] = 0;
  private [SubMode.Eager] = 0;
  private [SubMode.Computed] = 0;

  readonly #notReadySubscribers = new Set<ValSubscriber<TValue>>();

  #numberVersion = 0;

  readonly #getValue: () => TValue;
  readonly #onStart?: (notify: () => void) => ValDisposer | void | undefined;
  #onStartDisposer?: ValDisposer | void | null;

  #invoke(mode: SubMode): void {
    for (const [sub, subMode] of this.subs_) {
      if (subMode === mode && !this.#notReadySubscribers.has(sub)) {
        invoke(sub, this.value_);
      }
    }
  }
}

export class RefValAgent<TValue = any> implements IValAgent {
  readonly #agent: IValAgent<TValue>;
  readonly #subs = new WeakSet<ValSubscriber<TValue>>();

  public constructor(subs: IValAgent<TValue>) {
    this.#agent = subs;
    this.eager_ = subs.eager_;
    this.resolveValue_ = subs.resolveValue_;
    this.notify_ = subs.notify_;
    this.subs_ = subs.subs_;
  }

  public get version_(): ValVersion {
    return this.#agent.version_;
  }

  public readonly subs_: Map<ValSubscriber<TValue>, SubMode>;
  public eager_?: boolean | undefined;
  public resolveValue_: () => any;
  public notify_: () => void;

  public add_(subscriber: ValSubscriber<any>, mode: SubMode): () => void {
    this.#subs.add(subscriber);
    return this.#agent.add_(subscriber, mode);
  }

  public remove_(subscriber?: ((...args: any[]) => any) | undefined): void {
    if (subscriber) {
      if (this.#subs.has(subscriber)) {
        this.#subs.delete(subscriber);
        this.#agent.remove_(subscriber);
      }
    } else {
      for (const sub of this.#agent.subs_.keys()) {
        this.remove_(sub);
      }
    }
  }
}
