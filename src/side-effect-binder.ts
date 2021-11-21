import type { SideEffectManager } from "side-effect-manager";
import type { Val } from "./val";

export type BindSideEffect = <TVal extends Val>(val: TVal) => TVal;

export function createSideEffectBinder(
  sideEffect: SideEffectManager
): BindSideEffect {
  return function bindSideEffect<TVal extends Val>(val: TVal): TVal {
    const disposerID = sideEffect.addDisposer(() => {
      val.destroy();
    });
    val.addBeforeDestroy(() => {
      sideEffect.remove(disposerID);
    });
    return val;
  };
}
