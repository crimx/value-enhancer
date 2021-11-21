import { SideEffectManager } from "side-effect-manager";
import { createSideEffectBinder, Val } from "../src/value-enhancer";

describe("SideEffectBinder", () => {
  it("should create sideEffectBinder", () => {
    const sideEffect = new SideEffectManager();
    const bindSideEffect = createSideEffectBinder(sideEffect);

    const val = bindSideEffect(new Val(2));
    expect(val.value).toBe(2);

    const spy = jest.fn();
    val.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    val.setValue(3);
    expect(spy).toBeCalledTimes(2);
  });

  it("should remove subscribers on side effect flushing", () => {
    const sideEffect = new SideEffectManager();
    const bindSideEffect = createSideEffectBinder(sideEffect);

    const val = bindSideEffect(new Val(2));
    expect(val.value).toBe(2);

    const spy = jest.fn();
    val.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    val.setValue(3);
    expect(spy).toBeCalledTimes(2);

    sideEffect.flushAll();

    val.setValue(4);
    expect(spy).toBeCalledTimes(2);
  });

  it("should remove side effect when removing subscribers", () => {
    const sideEffect = new SideEffectManager();
    const bindSideEffect = createSideEffectBinder(sideEffect);

    const val = bindSideEffect(new Val(2));
    expect(val.value).toBe(2);
    expect(sideEffect.disposers.size).toBe(1);

    const spy = jest.fn();
    val.subscribe(spy);
    expect(spy).toBeCalledTimes(1);

    val.setValue(3);
    expect(spy).toBeCalledTimes(2);

    val.destroy();

    val.setValue(4);
    expect(spy).toBeCalledTimes(2);
    expect(sideEffect.disposers.size).toBe(0);
  });
});
