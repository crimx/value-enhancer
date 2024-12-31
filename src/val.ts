import { type AdaptiveSet, add, remove, size } from "adaptive-set";

import { batchFlush, batchStart, dirtyVals } from "./batch";
import {
  type ReadonlyVal,
  type Val,
  type ValConfig,
  type ValDisposer,
  type ValSetValue,
  type ValSubscriber,
  type ValVersion,
} from "./typings";
import { attachSetter, INIT_VALUE as DIRTY_VALUE, INIT_VALUE, invoke, strictEqual } from "./utils";
import { getVersion } from "./version";

export type Deps = Map<ValImpl, ValVersion>;

const registry = /* @__PURE__ */ new FinalizationRegistry<{
  d: Deps;
  r: WeakRef<ValImpl>;
}>(({ d, r }) => {
  for (const dep of d.keys()) {
    dep.dependents_ = remove(dep.dependents_, r);
  }
});

const BRAND: symbol = Symbol.for("value-enhancer");

interface CreateReadonlyVal {
  /**
   * Creates a readonly val with the given value.
   *
   * @returns A tuple with the readonly val and a function to set the value.
   */
  <TValue = any>(): [ReadonlyVal<NoInfer<TValue> | undefined>, ValSetValue<NoInfer<TValue> | undefined>];
  /**
   * Creates a readonly val with the given value.
   *
   * @param value Value for the val
   * @param config Optional custom config for the val.
   * @returns A tuple with the readonly val and a function to set the value.
   */
  (value: [], config?: ValConfig<any[]>): [ReadonlyVal<any[]>, ValSetValue<any[]>];
  /**
   * Creates a readonly val with the given value.
   *
   * @param value Value for the val
   * @param config Optional custom config for the val.
   * @returns A tuple with the readonly val and a function to set the value.
   */
  <TValue = any>(
    value: TValue,
    config?: ValConfig<TValue>,
  ): [ReadonlyVal<NoInfer<TValue>>, ValSetValue<NoInfer<TValue>>];
  /**
   * Creates a readonly val with the given value.
   *
   * @param value Optional value for the val
   * @param config Optional custom config for the val.
   * @returns A tuple with the readonly val and a function to set the value.
   */
  <TValue = any>(
    value?: TValue,
    config?: ValConfig<TValue>,
  ): [ReadonlyVal<NoInfer<TValue | undefined>>, ValSetValue<NoInfer<TValue | undefined>>];
}

export class ValImpl<TValue = any> {
  public readonly brand: symbol = BRAND;

  /**
   * @internal
   */
  public dependents_?: AdaptiveSet<WeakRef<ValImpl>>;

  /**
   * @internal
   */
  public deps_?: Map<ValImpl, ValVersion>;

  /**
   * @internal
   */
  public eager_?: boolean;

  /**
   * @internal
   */
  public equal_?: (newValue: TValue, oldValue: TValue) => boolean;

  /**
   * @internal
   */
  public lastSubInvokeVersion_: DIRTY_VALUE | ValVersion = DIRTY_VALUE;

  public readonly name?: string;

  public set?: (value: TValue) => void;

  /**
   * @internal
   */
  public subs_?: AdaptiveSet<ValSubscriber<TValue>>;

  public get $version(): ValVersion {
    this.get();
    return this._version_;
  }

  public get value(): TValue {
    return this.get();
  }

  public set value(value: TValue) {
    this.set?.(value);
  }

  /**
   * @internal
   */
  private _DEV_ValDisposed_?: Error;

  /**
   * @internal
   */
  private _resolveValue_: (self: ValImpl<TValue>) => TValue;

  /**
   * @internal
   */
  private _resolveValueError_: any;

  /**
   * @internal
   */
  private _value_: TValue = INIT_VALUE as TValue;

  /**
   * @internal
   */
  private _valueMaybeDirty_ = true;

  /**
   * @internal
   */
  private _version_: ValVersion = INIT_VALUE;

  /**
   * @internal
   */
  private _weakRefSelf_?: WeakRef<ValImpl<TValue>>;

  public constructor(
    resolveValue: (self: ValImpl<TValue>) => TValue,
    config?: ValConfig<TValue>,
    deps?: Map<ValImpl, ValVersion>,
  ) {
    this._resolveValue_ = resolveValue;
    this.equal_ = (config?.equal ?? strictEqual) || undefined;
    this.eager_ = config?.eager;
    this.name = config?.name;
    this.deps_ = deps;
  }

  public addDep_(dep: ValImpl): void {
    if (strictEqual(this.deps_?.get(dep), dep.$version)) return;

    (this.deps_ ||= new Map()).set(dep, dep.$version);

    if (!this._weakRefSelf_) {
      registry.register(this, { d: this.deps_, r: (this._weakRefSelf_ = new WeakRef(this)) }, this.deps_);
    }

    dep.dependents_ = add(dep.dependents_, this._weakRefSelf_);
  }

  public dispose(): void {
    if (process.env.NODE_ENV !== "production") {
      this._DEV_ValDisposed_ = new Error("[val-dev] Val disposed at:");
    }
    dirtyVals.delete(this);
    this.dependents_ = undefined;
    if (this.deps_) {
      registry.unregister(this.deps_);
      if (this._weakRefSelf_) {
        for (const dep of this.deps_.keys()) {
          dep.dependents_ = remove(dep.dependents_, this._weakRefSelf_);
        }
      }
      this.deps_.clear();
    }
  }

  public get(): TValue {
    if (this._valueMaybeDirty_) {
      // reset state immediately so that recursive notify_ calls can mark this as dirty again
      this._valueMaybeDirty_ = false;
      let changed = !this.deps_;
      if (this.deps_) {
        for (const [dep, version] of this.deps_) {
          if (!strictEqual(dep.$version, version)) {
            changed = true;
            break;
          }
        }
      }
      if (changed) {
        this._resolveValueError_ = INIT_VALUE;
        try {
          const value = this._resolveValue_(this);
          if (!this.equal_?.(value, this._value_)) {
            this._value_ = value;
            this._version_ = this.equal_ ? getVersion(this._value_) : Symbol();
          }
        } catch (e) {
          this._valueMaybeDirty_ = true;
          this._resolveValueError_ = e;
          throw e;
        }
      }
    }
    if (!strictEqual(this._resolveValueError_, INIT_VALUE)) {
      throw this._resolveValueError_;
    }
    if (process.env.NODE_ENV !== "production") {
      if (strictEqual(INIT_VALUE, this._value_)) {
        throw new Error("Cycle detected");
      }
    }
    return this._value_;
  }

  /**
   * @internal
   */
  public notify_ = (): void => {
    this._valueMaybeDirty_ = true;

    const isFirst = batchStart();

    dirtyVals.add(this);

    if (this.dependents_) {
      for (const ref of this.dependents_) {
        const dependent = ref.deref();
        if (dependent && !dirtyVals.has(dependent)) {
          dependent.notify_();
        }
      }
    }

    isFirst && batchFlush();
  };

  public reaction(subscriber: ValSubscriber<TValue>, _eager = this.eager_): ValDisposer {
    if (size(this.subs_) <= 0) {
      // start tracking last first on first subscription
      this.lastSubInvokeVersion_ = this.$version;
    }
    this.subs_ = add(this.subs_, subscriber);
    return this.unsubscribe.bind(this, subscriber);
  }

  public removeDep_(dep: ValImpl): void {
    this.deps_?.delete(dep);
    if (this._weakRefSelf_) {
      dep.dependents_ = remove(dep.dependents_, this._weakRefSelf_);
    }
  }

  public subscribe(subscriber: ValSubscriber<TValue>, eager = this.eager_): ValDisposer {
    const disposer = this.reaction(subscriber, eager);
    invoke(subscriber, this.get());
    return disposer;
  }

  /**
   * @returns the JSON representation of `this.value`.
   *
   * @example
   * ```js
   * const v$ = val(val(val({ a: 1 })));
   * JSON.stringify(v$); // '{"a":1}'
   * ```
   */
  public toJSON(key: string): unknown {
    const value = this.get() as null | undefined | { toJSON?: (key: string) => unknown };
    return value?.toJSON ? value.toJSON(key) : value;
  }

  /**
   * @returns the string representation of `this.value`.
   *
   * @example
   * ```js
   * const v$ = val(val(val(1)));
   * console.log(`${v$}`); // "1"
   * ```
   */
  public toString(): string {
    return this.get() + "";
  }

  public unsubscribe(subscriber?: (...args: any[]) => any): void {
    this.subs_ = subscriber ? remove(this.subs_, subscriber, true) : null;
  }

  public valueOf(): TValue {
    return this.get();
  }
}

export const readonlyVal: CreateReadonlyVal = <TValue = any>(
  value?: TValue,
  config?: ValConfig<TValue | undefined>,
): [ReadonlyVal<NoInfer<TValue> | undefined>, ValSetValue<NoInfer<TValue> | undefined>] => {
  let currentValue = value;

  const get = () => currentValue;

  const v = new ValImpl(get, config);

  const set = (value: TValue | undefined): void => {
    if (!v.equal_?.(value, currentValue)) {
      currentValue = value;
      v.notify_();
    }
  };

  return [v, set];
};

interface CreateVal {
  /**
   * Creates a writable val.
   * @returns A val with undefined value.
   */
  <TValue = any>(): Val<TValue | undefined>;
  /**
   * Creates a writable val.
   * @param value Initial value.
   * @param config Optional custom config.
   */
  (value: [], config?: ValConfig<any[]>): Val<any[]>;
  /**
   * Creates a writable val.
   * @param value Initial value.
   * @param config Optional custom config.
   */
  <TValue = any>(value: TValue, config?: ValConfig<TValue>): Val<NoInfer<TValue>>;
  /**
   * Creates a writable val.
   * @param value Initial value.
   * @param config Optional custom config.
   */
  <TValue = any>(value?: TValue, config?: ValConfig<TValue | undefined>): Val<NoInfer<TValue>>;
}

export const val: CreateVal = <TValue = any>(
  value?: TValue,
  config?: ValConfig<TValue>,
): Val<NoInfer<TValue | undefined>> => attachSetter(...readonlyVal(value, config));
