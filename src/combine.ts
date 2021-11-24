import type { ValCompare } from "./typings";
import { Val } from "./val";

export type TValInputsValueTuple<TValInputs extends readonly Val[]> = Readonly<{
  [K in keyof TValInputs]: ExtractValValue<TValInputs[K]>;
}>;

export type ExtractValValue<TVal> = TVal extends Val<infer TValue, any>
  ? TValue
  : never;

export type ExtractValMeta<TVal> = TVal extends Val<any, infer TMeta>
  ? TMeta
  : never;

export type CombineValTransform<
  TDerivedValue = any,
  TValues extends readonly any[] = any[],
  TMeta = any
> = (newValues: TValues, oldValues?: TValues, meta?: TMeta) => TDerivedValue;

export type Combine = <
  TDerivedValue = any,
  TValInputs extends readonly Val[] = Val[],
  TMeta = ExtractValMeta<TValInputs[number]>
>(
  valInputs: readonly [...TValInputs],
  transform: CombineValTransform<
    TDerivedValue,
    [...TValInputsValueTuple<TValInputs>],
    TMeta
  >,
  compare?: ValCompare<TDerivedValue>,
  meta?: TMeta
) => Val<TDerivedValue, TMeta>;

export function combine<
  TDerivedValue = any,
  TValInputs extends readonly Val[] = Val[],
  TMeta = ExtractValMeta<TValInputs[number]>
>(
  valInputs: readonly [...TValInputs],
  transform: CombineValTransform<
    TDerivedValue,
    [...TValInputsValueTuple<TValInputs>],
    TMeta
  >,
  compare?: ValCompare<TDerivedValue>,
  meta?: TMeta
): Val<TDerivedValue, TMeta> {
  let lastValue = valInputs.map(val => val.value) as [
    ...TValInputsValueTuple<TValInputs>
  ];
  const combinedVal = new Val(transform(lastValue, void 0, meta), compare);
  valInputs.forEach((val, i) => {
    const disposer = val.reaction((value, _, meta) => {
      const newValue = lastValue.slice() as [
        ...TValInputsValueTuple<TValInputs>
      ];
      newValue[i] = value;
      const oldValue = lastValue;
      lastValue = newValue;
      combinedVal.setValue(transform(newValue, oldValue, meta), meta);
    });
    combinedVal.addBeforeDestroy(disposer);
  });
  return combinedVal;
}
