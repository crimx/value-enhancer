import type { SpyInstanceFn } from "vitest";
import { describe, it, expect, vi } from "vitest";
import { Val } from "../src/value-enhancer";

describe("Val", () => {
  describe("value", () => {
    it("should have a Val with value 1", () => {
      const val = new Val(1);
      expect(val.value).toBe(1);
    });
  });

  describe("setter", () => {
    it("should update value from 1 to 2 when set(2)", () => {
      const val = new Val(1);
      expect(val.value).toBe(1);
      val.value = 2;
      expect(val.value).toBe(2);
    });
  });

  describe("set", () => {
    it("should update value from 1 to 2 when set(2)", () => {
      const val = new Val(1);
      expect(val.value).toBe(1);
      val.set(2);
      expect(val.value).toBe(2);
    });
  });

  describe("subscribe", () => {
    it("should trigger immediate emission on subscribe", () => {
      const spy = vi.fn();
      const val = new Val(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(1);

      val.set(2);
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(2);
      expect(firstParamOfLastCall(spy)).toBe(2);

      val.destroy();
    });

    it("should trigger emission on set", () => {
      const spy = vi.fn();
      const val = new Val(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBe(1);

      val.set(2);
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(2);
      expect(spy.mock.calls[1][0]).toBe(2);

      val.destroy();
    });

    it("should emit meta on subscribe", () => {
      const spy = vi.fn();
      const val = new Val<number, string>(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy, "meta");
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(1, "meta");

      val.set(2, "meta2");
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(2);
      expect(spy).lastCalledWith(2, "meta2");

      val.destroy();
    });

    it("should not trigger emission on set with same value", () => {
      const spy = vi.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const val = new Val(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(value1);

      val.set(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      val.set(value2);
      expect(val.value).toBe(value2);
      expect(spy).toBeCalledTimes(2);
      expect(firstParamOfLastCall(spy)).toBe(value2);

      val.destroy();
    });

    it("should perform custom compare", () => {
      const spy = vi.fn();
      const value1 = { value: 1 };
      const valueClone = { value: 1 };
      const compare = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const val = new Val(value1, { compare });
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(value1);

      val.set(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      val.set(valueClone);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(value1);

      val.destroy();
    });

    it("should support multiple subscribers", () => {
      const spies = Array(20)
        .fill(0)
        .map(() => vi.fn());
      const val = new Val(1);

      spies.forEach(spy => {
        val.subscribe(spy);
      });

      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(1, undefined);
      });

      val.set(1);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      val.set(2);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(2);
        expect(spy).lastCalledWith(2, undefined);
      });

      val.destroy();
    });

    it("should remove subscriber if disposed", () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const val = new Val<number, string>(1);

      const spy1Disposer = val.subscribe(spy1);
      val.subscribe(spy2);

      expect(spy1).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(1, undefined);
      expect(spy2).toBeCalledTimes(1);
      expect(spy2).lastCalledWith(1, undefined);

      spy1Disposer();

      val.set(2, "meta2");
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(2);
      expect(spy2).lastCalledWith(2, "meta2");

      val.destroy();
    });

    it("should remove all subscribers on destroy", () => {
      const spies = Array(20)
        .fill(0)
        .map(() => vi.fn());
      const val = new Val(1);

      spies.forEach(spy => {
        val.subscribe(spy);
      });

      val.set(1);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      val.destroy();

      val.set(2);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      val.destroy();
    });
  });

  describe("reaction", () => {
    it("should not trigger immediate emission on reaction", () => {
      const spy = vi.fn();
      const val = new Val(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.set(2);
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(2);

      val.destroy();
    });

    it("should trigger emission on set", () => {
      const spy = vi.fn();
      const val = new Val(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.set(2);
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(2);

      val.destroy();
    });

    it("should have old value", () => {
      const spy = vi.fn();
      const val = new Val(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.set(2);
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(2, undefined);

      val.destroy();
    });

    it("should emit meta on reaction", () => {
      const spy = vi.fn();
      const val = new Val<number, string>(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.set(2, "meta2");
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(2, "meta2");

      val.destroy();
    });

    it("should not trigger emission on set with same value", () => {
      const spy = vi.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const val = new Val(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.set(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.set(value2);
      expect(val.value).toBe(value2);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(value2);

      val.destroy();
    });

    it("should perform custom compare", () => {
      const spy = vi.fn();
      const value1 = { value: 1 };
      const value1Clone = { value: 1 };
      const compare = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const val = new Val(value1, { compare });
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.set(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.set(value1Clone);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.destroy();
    });

    it("should support multiple subscribers", () => {
      const spies = Array(20)
        .fill(0)
        .map(() => vi.fn());
      const val = new Val(1);

      spies.forEach(spy => {
        val.reaction(spy);
      });

      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      val.set(1);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      val.set(2);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(2, undefined);
      });

      val.destroy();
    });

    it("should remove subscriber if disposed", () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const val = new Val<number, string>(1);

      const spy1Disposer = val.reaction(spy1);
      val.reaction(spy2);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);

      spy1Disposer();

      val.set(2, "meta2");
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(1);
      expect(spy2).lastCalledWith(2, "meta2");

      val.destroy();
    });

    it("should remove all subscribers on destroy", () => {
      const spies = Array(20)
        .fill(0)
        .map(() => vi.fn());
      const val = new Val(1);

      spies.forEach(spy => {
        val.reaction(spy);
      });

      val.set(1);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      val.destroy();

      val.set(2);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      val.destroy();
    });
  });
});

function firstParamOfLastCall<T extends any[] = any[], P extends any[] = any>(
  spy: SpyInstanceFn<T, P>
): any {
  return spy.mock.calls[spy.mock.calls.length - 1][0];
}
