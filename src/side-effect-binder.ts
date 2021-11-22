import type { SideEffectManager } from "side-effect-manager";
import { combine as combineOrigin } from "./combine";
import type { Combine } from "./combine";
import { Val } from "./val";
import type { ValCompare } from "./typings";

export type BindSideEffect = <TVal extends Val>(val: TVal) => TVal;

export type CreateVal = <TValue = any, TMeta = any>(
  value: TValue,
  compare?: ValCompare<TValue>
) => Val<TValue, TMeta>;

export type ValSideEffectBinder = {
  bindSideEffect: BindSideEffect;
  combine: Combine;
  createVal: CreateVal;
};

export function createSideEffectBinder(
  sideEffect: SideEffectManager
): ValSideEffectBinder {
  const bindSideEffect: BindSideEffect = val => {
    const disposerID = sideEffect.addDisposer(() => {
      val.destroy();
    });
    val.addBeforeDestroy(() => {
      sideEffect.remove(disposerID);
    });
    return val;
  };

  const combine: Combine = (valInputs, transform, compare, meta) => {
    return bindSideEffect(combineOrigin(valInputs, transform, compare, meta));
  };

  const createVal: CreateVal = (value, compare) => {
    return bindSideEffect(new Val(value, compare));
  };

  return {
    bindSideEffect,
    combine,
    createVal,
  };
}
