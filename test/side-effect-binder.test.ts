import { SideEffectManager } from "side-effect-manager";
import { createSideEffectBinder, Val } from "../src/value-enhancer";

describe("SideEffectBinder", () => {
  describe("bindSideEffect", () => {
    it("should create sideEffectBinder", () => {
      const sideEffect = new SideEffectManager();
      const { bindSideEffect } = createSideEffectBinder(sideEffect);

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
      const { bindSideEffect } = createSideEffectBinder(sideEffect);

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
      const { bindSideEffect } = createSideEffectBinder(sideEffect);

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

  describe("combine", () => {
    it("should have bound combine", () => {
      const val1 = new Val(1);
      const val2 = new Val(2);

      const sideEffect = new SideEffectManager();
      const { combine } = createSideEffectBinder(sideEffect);

      const val = combine([val1, val2], ([val1, val2]) => {
        return val1 + val2;
      });
      expect(val.value).toBe(3);

      const spy = jest.fn();
      val.subscribe(spy);
      expect(spy).toBeCalledTimes(1);

      val1.setValue(3);
      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(5);
    });

    it("should remove subscribers on side effect flushing", () => {
      const val1 = new Val(1);
      const val2 = new Val(2);

      const sideEffect = new SideEffectManager();
      const { combine } = createSideEffectBinder(sideEffect);

      const val = combine([val1, val2], ([val1, val2]) => {
        return val1 + val2;
      });
      expect(val.value).toBe(3);

      const spy = jest.fn();
      val.subscribe(spy);
      expect(spy).toBeCalledTimes(1);

      val1.setValue(3);
      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(5);

      sideEffect.flushAll();

      val1.setValue(4);
      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(5);
    });

    it("should remove side effect when removing subscribers", () => {
      const val1 = new Val(1);
      const val2 = new Val(2);

      const sideEffect = new SideEffectManager();
      const { combine } = createSideEffectBinder(sideEffect);

      const val = combine([val1, val2], ([val1, val2]) => {
        return val1 + val2;
      });
      expect(val.value).toBe(3);
      expect(sideEffect.disposers.size).toBe(1);

      const spy = jest.fn();
      val.subscribe(spy);
      expect(spy).toBeCalledTimes(1);

      val1.setValue(3);
      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(5);

      val.destroy();

      val1.setValue(4);
      expect(spy).toBeCalledTimes(2);
      expect(sideEffect.disposers.size).toBe(0);
      expect(val.value).toBe(5);
    });
  });

  describe("createVal", () => {
    it("should create a val", () => {
      const sideEffect = new SideEffectManager();
      const { createVal } = createSideEffectBinder(sideEffect);

      const val = createVal(1);
      expect(val.value).toBe(1);

      const spy = jest.fn();
      val.subscribe(spy);
      expect(spy).toBeCalledTimes(1);

      val.setValue(3);
      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(3);
    });

    it("should should perform custom compare", () => {
      const sideEffect = new SideEffectManager();
      const { createVal } = createSideEffectBinder(sideEffect);

      const val = createVal(
        { v: 1 },
        (a: { v: number }, b: { v: number }) => a.v === b.v
      );
      expect(val.value).toEqual({ v: 1 });

      const spy = jest.fn();
      val.subscribe(spy);
      expect(spy).toBeCalledTimes(1);

      val.setValue({ v: 1 });
      expect(spy).toBeCalledTimes(1);
      expect(val.value).toEqual({ v: 1 });

      val.setValue({ v: 3 });
      expect(spy).toBeCalledTimes(2);
      expect(val.value).toEqual({ v: 3 });
    });

    it("should remove subscribers on side effect flushing", () => {
      const sideEffect = new SideEffectManager();
      const { createVal } = createSideEffectBinder(sideEffect);

      const val = createVal(1);
      expect(val.value).toBe(1);

      const spy = jest.fn();
      val.subscribe(spy);
      expect(spy).toBeCalledTimes(1);

      val.setValue(3);
      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(3);

      sideEffect.flushAll();

      val.setValue(4);
      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(4);
    });

    it("should remove side effect when removing subscribers", () => {
      const sideEffect = new SideEffectManager();
      const { createVal } = createSideEffectBinder(sideEffect);

      const val = createVal(1);
      expect(val.value).toBe(1);
      expect(sideEffect.disposers.size).toBe(1);

      const spy = jest.fn();
      val.subscribe(spy);
      expect(spy).toBeCalledTimes(1);

      val.setValue(3);
      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(3);

      val.destroy();

      val.setValue(4);
      expect(spy).toBeCalledTimes(2);
      expect(sideEffect.disposers.size).toBe(0);
      expect(val.value).toBe(4);
    });
  });
});
