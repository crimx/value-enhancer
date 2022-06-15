import type { ReadonlyVal } from "./readonly-val";
import type { ValDisposer, ValSubscriber } from "./typings";

type ValueFromVal<V> = V extends ReadonlyVal<infer TValue> ? TValue : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type MetaFromVal<V> = V extends ReadonlyVal<infer _TValue, infer TMeta>
  ? TMeta
  : never;

export type WithOnValChanged<TConfig, TEnhancedResult> = TEnhancedResult & {
  onValChanged: <
    K extends Extract<keyof TConfig, string> = Extract<keyof TConfig, string>
  >(
    key: K,
    listener: ValSubscriber<
      ValueFromVal<TEnhancedResult[Extract<`_${K}$`, keyof TEnhancedResult>]>,
      MetaFromVal<TEnhancedResult[Extract<`_${K}$`, keyof TEnhancedResult>]>
    >
  ) => ValDisposer;
};

export function withOnValChanged<TInstance>(instance: TInstance): void {
  if (!(instance as any).onValChanged) {
    (instance as any).onValChanged = onValChanged;
  }
}

function onValChanged<TConfig, K extends Extract<keyof TConfig, string>, O>(
  this: O,
  key: K,
  listener: ValSubscriber<
    ValueFromVal<O[Extract<`_${K}$`, keyof O>]>,
    MetaFromVal<O[Extract<`_${K}$`, keyof O>]>
  >
): ValDisposer {
  const val = (this as any)[`_${key}$`] || (this as any)[key];
  if (!val?.reaction) {
    throw new TypeError(`"${key}" is not related to a Val in this instance`);
  }
  return val.reaction(listener);
}
