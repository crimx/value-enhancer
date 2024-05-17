import type { Task } from "./scheduler";
import { cancelTask, schedule } from "./scheduler";
import type {
  ValConfig,
  ValDisposer,
  ValSubscriber,
  ValVersion,
} from "./typings";
import { INIT_VALUE, invoke, strictEqual } from "./utils";

const registry = /* @__PURE__ */ new FinalizationRegistry<() => void>(invoke);

export enum SubMode {
  Async = 1,
  Eager = 2,
  Computed = 3,
}

export enum AgentStatus {
  Notifying = 1 << 0,
  ValueChanged = 1 << 1,
  NeedResolveValue = 1 << 2,
}

export interface IValAgent<TValue = any> {
  subs_: Map<ValSubscriber<TValue>, SubMode>;
  version_: ValVersion;
  eager_?: boolean;
  resolveValue_: () => TValue;
  notify_: () => void;
  add_(subscriber: ValSubscriber, mode: SubMode): () => void;
  remove_(subscriber?: (...args: any[]) => any): void;
  dispose_(): void;
}

export class ValAgent<TValue = any> implements IValAgent<TValue>, Task {
  public constructor(
    getValue: () => TValue,
    config?: ValConfig<TValue>,
    onChange?: (notify: () => void) => ValDisposer | void | undefined
  ) {
    this.#getValue = getValue;
    this.equal_ = (config?.equal ?? strictEqual) || void 0;
    this.eager_ = config?.eager;

    if (onChange) {
      const ref = new WeakRef(this);
      const disposeEffect = () => {
        if (disposeListen) {
          // prevent infinite recursion if user returns the notify function
          const dispose = disposeListen;
          disposeListen = void 0;
          dispose();
        }
      };
      let disposeListen = onChange(() => {
        const agent = ref.deref();
        if (agent) {
          agent.notify_();
        } else {
          disposeEffect();
        }
      });
      if (disposeListen) {
        registry.register(this, (this.#disposeEffect = disposeEffect));
      }
    }
  }

  public readonly subs_ = new Map<ValSubscriber<TValue>, SubMode>();
  public status_ = AgentStatus.NeedResolveValue;
  public version_: ValVersion;
  public value_: TValue = INIT_VALUE;
  public equal_?: (newValue: TValue, oldValue: TValue) => boolean;
  public eager_?: boolean;

  public resolveValue_ = (): TValue => {
    if (this.status_ & AgentStatus.NeedResolveValue) {
      this.status_ &= ~AgentStatus.NeedResolveValue;
      const newValue = this.#getValue();
      if (this.value_ === INIT_VALUE) {
        this._bumpVersion_(newValue);
      } else if (!this.equal_?.(newValue, this.value_)) {
        this._bumpVersion_(newValue);
        if (this.status_ & AgentStatus.Notifying) {
          this.status_ |= AgentStatus.ValueChanged;
        }
      }
    }
    return this.value_;
  };

  public notify_ = (): void => {
    if (process.env.NODE_ENV !== "production") {
      if ((this as any)._valDisposed_) {
        console.error(new Error("[val-dev] Updating a disposed val."));
        console.error((this as any)._valDisposed_);
      }
    }
    this.status_ |= AgentStatus.NeedResolveValue;
    if (this.subs_.size) {
      this.status_ |= AgentStatus.Notifying;
      if (this[SubMode.Computed]) {
        this.#invoke(SubMode.Computed);
      }
      if (this[SubMode.Eager]) {
        this.resolveValue_();
        if (this.status_ & AgentStatus.ValueChanged) {
          this.#invoke(SubMode.Eager);
        }
      }
      // always schedule an async task for cleaning the Notifying status
      schedule(this);
    }
  };

  public add_(subscriber: ValSubscriber, mode: SubMode): () => void {
    const currentMode = this.subs_.get(subscriber);
    if (currentMode) {
      this[currentMode]--;
    }
    this.subs_.set(subscriber, mode);
    this[mode]++;

    return () => this.remove_(subscriber);
  }

  public remove_(subscriber?: (...args: any[]) => any): void {
    if (subscriber) {
      const mode = this.subs_.get(subscriber);
      if (mode) {
        this.subs_.delete(subscriber);
        this[mode]--;
      }
    } else {
      this.subs_.clear();
      this[SubMode.Async] = this[SubMode.Eager] = this[SubMode.Computed] = 0;
      cancelTask(this);
    }
  }

  public runTask_(): void {
    if (this[SubMode.Async]) {
      this.resolveValue_();
      if (this.status_ & AgentStatus.ValueChanged) {
        this.#invoke(SubMode.Async);
      }
    }
    this.status_ &= ~(AgentStatus.Notifying | AgentStatus.ValueChanged);
  }

  public dispose_(): void {
    this.remove_();
    registry.unregister(this);
    this.#disposeEffect?.();
    if (process.env.NODE_ENV !== "production") {
      (this as any)._valDisposed_ = new Error("[val-dev] Val disposed at:");
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

  #numberVersion = 0;
  #disposeEffect?: () => void;

  readonly #getValue: () => TValue;

  #invoke(mode: SubMode): void {
    for (const [sub, subMode] of this.subs_) {
      if (subMode === mode) {
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

  public dispose_(): void {
    this.remove_();
  }
}
