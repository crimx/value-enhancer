import { ReadonlyVal } from "./readonly-val";
import type { ValConfig, ValTransform } from "./typings";

export class DerivedVal<
  TSrcValue = any,
  TValue = any
> extends ReadonlyVal<TValue> {
  public constructor(
    val: ReadonlyVal<TSrcValue>,
    transform: ValTransform<TSrcValue, TValue>,
    config: ValConfig<TValue> = {}
  ) {
    super(transform(val.value), {
      ...config,
      beforeSubscribe: set => {
        const disposer = val.subscribe(newValue => set(transform(newValue)));
        if (config.beforeSubscribe) {
          const beforeSubscribeDisposer = config.beforeSubscribe(set);
          if (beforeSubscribeDisposer) {
            return () => {
              disposer();
              beforeSubscribeDisposer();
            };
          }
        }
        return disposer;
      },
    });

    this._srcValue = () => transform(val.value);
  }

  public override get value(): TValue {
    if (this.size <= 0) {
      const value = this._srcValue();
      return this._cp(value, this._value) ? this._value : value;
    }
    return this._value;
  }

  private _srcValue: () => TValue;
}

export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>
): ReadonlyVal<TValue>;
export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  transform: ValTransform<TSrcValue, TValue>,
  config?: ValConfig<TValue>
): ReadonlyVal<TValue>;
export function derive<TSrcValue = any, TValue = any>(
  val: ReadonlyVal<TSrcValue>,
  transform: ValTransform<TSrcValue, TValue> = value =>
    value as unknown as TValue,
  config: ValConfig<TValue> = {}
): ReadonlyVal<TValue> {
  return new DerivedVal(val, transform, config);
}
