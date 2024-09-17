import { cancelTask, schedule, Task } from "./scheduler";
import { ValConfig, ValDisposer, ValSubscriber, ValVersion } from "./typings";
import { INIT_VALUE, invoke, strictEqual } from "./utils";
import { getVersion, uniqueVersion } from "./version";

const registry = /* @__PURE__ */ new FinalizationRegistry<() => void>(invoke);

export enum SubMode {
  Async = 1,
  Eager = 3,
  Computed = 5,
}

enum LastVersion {
  Async = 2,
  Eager = 4,
}

export interface V<TValue = any> {
  readonly subs_: Map<ValSubscriber<TValue>, SubMode>;
  version_: ValVersion;
  readonly eager_?: boolean;
  readonly rootV_: RootV<TValue>;
  readonly resolveValue_: () => TValue;
  readonly notify_: () => void;
  add_(subscriber: ValSubscriber, mode: SubMode): () => void;
  remove_(subscriber?: (...args: any[]) => any): void;
  dispose_(): void;
}

interface VDev<TValue = any> extends V<TValue> {
  _valDisposed_?: Error;
}

export class RootV<TValue = any> implements V<TValue>, Task {
  public readonly equal_?: (newValue: TValue, oldValue: TValue) => boolean;
  public readonly eager_?: boolean;
  public readonly subs_ = new Map<ValSubscriber<TValue>, SubMode>();

  public readonly rootV_: RootV<TValue> = this;
  public value_: TValue = INIT_VALUE;
  public version_: ValVersion;

  private [SubMode.Async] = 0;
  private [SubMode.Eager] = 0;
  private [SubMode.Computed] = 0;
  private [LastVersion.Async]: ValVersion;
  private [LastVersion.Eager]: ValVersion;

  readonly #getValue: () => TValue;
  #disposeDep?: ValDisposer | void;

  #dirty = true;

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
      if ((this.#disposeDep = onChange(() => ref.deref()?.notify_()))) {
        registry.register(this, this.#disposeDep, this.#disposeDep);
      }
    }
  }

  public readonly resolveValue_ = (): TValue => {
    if (this.#dirty) {
      this.#dirty = false;
      const newValue = this.#getValue();
      if (!this.equal_?.(newValue, this.value_)) {
        this.value_ = newValue;
        this.version_ = this._getVersion_(newValue);
      }
    }
    return this.value_;
  };

  public readonly notify_ = (): void => {
    if (process.env.NODE_ENV !== "production") {
      if ((this as VDev<TValue>)._valDisposed_) {
        console.error(new Error("[val-dev] Updating a disposed val."));
        console.error((this as VDev<TValue>)._valDisposed_);
      }
    }
    this.#dirty = true;
    if (this[SubMode.Computed]) {
      this._invoke_(SubMode.Computed);
    }
    if (this[SubMode.Eager]) {
      this.runTask_(SubMode.Eager);
    }
    if (this[SubMode.Async]) {
      schedule(this);
    }
  };

  public add_(subscriber: ValSubscriber, mode: SubMode): () => void {
    const currentMode = this.subs_.get(subscriber);
    if (currentMode) {
      this[currentMode]--;
    }
    this.subs_.set(subscriber, mode);
    if (!this[mode]++) {
      this.resolveValue_();
      this[(mode + 1) as LastVersion] = this.version_;
    }

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

  public runTask_(mode: SubMode.Async | SubMode.Eager = SubMode.Async): void {
    if (this[mode]) {
      this.resolveValue_();
      if (!strictEqual(this[(mode + 1) as LastVersion], this.version_)) {
        this[(mode + 1) as LastVersion] = this.version_;
        this._invoke_(mode);
      }
    }
  }

  public dispose_(): void {
    if (process.env.NODE_ENV !== "production") {
      (this as VDev<TValue>)._valDisposed_ = new Error(
        "[val-dev] Val disposed at:"
      );
    }
    this.remove_();
    if (this.#disposeDep) {
      registry.unregister(this.#disposeDep);
      this.#disposeDep = invoke(this.#disposeDep);
    }
  }

  private _invoke_(mode: SubMode): void {
    for (const [sub, subMode] of this.subs_) {
      if (subMode === mode) {
        invoke(sub, this.value_);
      }
    }
  }

  private _getVersion_(value: TValue): ValVersion {
    return (this._getVersion_ = this.equal_?.(value, value)
      ? getVersion
      : uniqueVersion)(value);
  }
}

export class RefV<TValue = any> implements V<TValue> {
  readonly #subs = new WeakSet<ValSubscriber<TValue>>();

  public readonly rootV_: RootV<TValue>;
  public readonly subs_: Map<ValSubscriber<TValue>, SubMode>;
  public readonly eager_?: boolean | undefined;
  public readonly resolveValue_: () => TValue;
  public readonly notify_: () => void;

  public constructor(rootV: RootV<TValue>) {
    this.rootV_ = rootV;
    this.eager_ = rootV.eager_;
    this.resolveValue_ = rootV.resolveValue_;
    this.notify_ = rootV.notify_;
    this.subs_ = rootV.subs_;
  }

  public get version_(): ValVersion {
    return this.rootV_.version_;
  }

  public add_(subscriber: ValSubscriber<any>, mode: SubMode): () => void {
    this.#subs.add(subscriber);
    return this.rootV_.add_(subscriber, mode);
  }

  public remove_(subscriber?: ((...args: any[]) => any) | undefined): void {
    if (subscriber) {
      if (this.#subs.has(subscriber)) {
        this.#subs.delete(subscriber);
        this.rootV_.remove_(subscriber);
      }
    } else {
      for (const sub of this.rootV_.subs_.keys()) {
        this.remove_(sub);
      }
    }
  }

  public dispose_(): void {
    this.remove_();
  }
}
