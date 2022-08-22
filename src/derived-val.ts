import { ReadonlyVal } from "./readonly-val";
import type { ValConfig, ValTransform } from "./typings";

export class DerivedVal<
  TSrcValue = any,
  TValue = any,
  TMeta = any
> extends ReadonlyVal<TValue, TMeta> {
  public constructor(
    val: ReadonlyVal<TSrcValue>,
    transform: ValTransform<TSrcValue, TValue>,
    config: ValConfig<TValue, TMeta> = {}
  ) {
    super(transform(val.value), {
      ...config,
      beforeSubscribe: set => {
        const disposer = val.subscribe((newValue, meta) =>
          set(transform(newValue), meta)
        );
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

export function derive<TSrcValue = any, TValue = any, TMeta = any>(
  val: ReadonlyVal<TSrcValue>
): ReadonlyVal<TValue, TMeta>;
export function derive<TSrcValue = any, TValue = any, TMeta = any>(
  val: ReadonlyVal<TSrcValue>,
  transform: ValTransform<TSrcValue, TValue>,
  config?: ValConfig<TValue, TMeta>
): ReadonlyVal<TValue, TMeta>;
export function derive<TSrcValue = any, TValue = any, TMeta = any>(
  val: ReadonlyVal<TSrcValue>,
  transform: ValTransform<TSrcValue, TValue> = value =>
    value as unknown as TValue,
  config: ValConfig<TValue, TMeta> = {}
): ReadonlyVal<TValue, TMeta> {
  return new DerivedVal(val, transform, config);
}
