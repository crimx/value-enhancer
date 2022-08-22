import type { SpyInstanceFn } from "vitest";
import { describe, it, expect, vi } from "vitest";
import type { ValSetValue } from "../src/value-enhancer";
import { ReadonlyVal } from "../src/value-enhancer";

const noop = () => void 0;

describe("ReadonlyVal", () => {
  describe("value", () => {
    it("should have a Val with value 1", () => {
      const val = new ReadonlyVal(1);
      expect(val.value).toBe(1);
    });
  });

  describe("beforeSubscribe", () => {
    it("should be called before first subscription", () => {
      const beforeSubscribe = vi.fn();
      const val = new ReadonlyVal(1, { beforeSubscribe });
      expect(beforeSubscribe).toHaveBeenCalledTimes(0);

      const sub1 = vi.fn();
      const dispose1 = val.subscribe(sub1);
      expect(beforeSubscribe).toBeCalledTimes(1);
      expect(sub1).toBeCalledTimes(1);

      const sub2 = vi.fn();
      const dispose2 = val.subscribe(sub2);
      expect(beforeSubscribe).toBeCalledTimes(1);
      expect(sub1).toBeCalledTimes(1);
      expect(sub2).toBeCalledTimes(1);

      dispose1();
      expect(beforeSubscribe).toBeCalledTimes(1);
      expect(sub1).toBeCalledTimes(1);
      expect(sub2).toBeCalledTimes(1);

      dispose2();
      expect(beforeSubscribe).toBeCalledTimes(1);
      expect(sub1).toBeCalledTimes(1);
      expect(sub2).toBeCalledTimes(1);

      const sub3 = vi.fn();
      val.subscribe(sub3);
      expect(beforeSubscribe).toBeCalledTimes(2);
      expect(sub1).toBeCalledTimes(1);
      expect(sub2).toBeCalledTimes(1);
      expect(sub3).toBeCalledTimes(1);

      val.destroy();
    });

    it("should trigger disposer after last un-subscription", () => {
      const beforeSubscribeDisposer = vi.fn();
      const beforeSubscribe = vi.fn(() => beforeSubscribeDisposer);
      const val = new ReadonlyVal(1, { beforeSubscribe });
      expect(beforeSubscribeDisposer).toHaveBeenCalledTimes(0);

      const sub1 = vi.fn();
      const dispose1 = val.subscribe(sub1);
      expect(beforeSubscribeDisposer).toHaveBeenCalledTimes(0);

      const sub2 = vi.fn();
      const dispose2 = val.subscribe(sub2);
      expect(beforeSubscribeDisposer).toHaveBeenCalledTimes(0);

      dispose1();
      expect(beforeSubscribeDisposer).toHaveBeenCalledTimes(0);

      dispose2();
      expect(beforeSubscribeDisposer).toHaveBeenCalledTimes(1);

      const sub3 = vi.fn();
      const dispose3 = val.subscribe(sub3);
      expect(beforeSubscribeDisposer).toHaveBeenCalledTimes(1);

      dispose3();
      expect(beforeSubscribeDisposer).toHaveBeenCalledTimes(2);

      val.destroy();
    });

    it("should not trigger extra emissions on sync set", () => {
      const val = new ReadonlyVal(1, {
        beforeSubscribe: set => {
          set(1, 1);
          set(2, 2);
          set(3, 3);
          set(4, 4);
        },
      });

      const sub1 = vi.fn();
      const dispose1 = val.subscribe(sub1);
      expect(sub1).toHaveBeenCalledTimes(1);
      expect(sub1).toBeCalledWith(4, undefined);

      const sub2 = vi.fn();
      const dispose2 = val.subscribe(sub2, "meta2");
      expect(sub2).toHaveBeenCalledTimes(1);
      expect(sub2).toBeCalledWith(4, "meta2");

      sub1.mockClear();
      sub2.mockClear();

      dispose1();
      expect(sub1).toHaveBeenCalledTimes(0);
      expect(sub2).toHaveBeenCalledTimes(0);

      dispose2();
      expect(sub1).toHaveBeenCalledTimes(0);
      expect(sub2).toHaveBeenCalledTimes(0);

      const sub3 = vi.fn();
      const dispose3 = val.subscribe(sub3, "meta3");
      expect(sub3).toHaveBeenCalledTimes(1);
      expect(sub3).toBeCalledWith(4, "meta3");

      sub3.mockClear();

      dispose3();
      expect(sub3).toHaveBeenCalledTimes(0);

      val.destroy();
    });

    it("should trigger extra emission on async set", async () => {
      const val = new ReadonlyVal(1, {
        beforeSubscribe: set => {
          setTimeout(() => {
            set(1, 1);
            set(2, 2);
            set(3, 3);
            set(4, 4);
          }, 0);
        },
      });

      const sub1 = vi.fn();
      const dispose1 = val.subscribe(sub1);
      expect(sub1).toHaveBeenCalledTimes(1);
      expect(sub1).toBeCalledWith(1, undefined);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sub1).toHaveBeenCalledTimes(4);
      expect(sub1).toBeCalledWith(4, 4);

      const sub2 = vi.fn();
      const dispose2 = val.subscribe(sub2, "meta2");
      expect(sub2).toHaveBeenCalledTimes(1);
      expect(sub2).toBeCalledWith(4, "meta2");

      sub1.mockClear();
      sub2.mockClear();

      dispose1();
      expect(sub1).toHaveBeenCalledTimes(0);
      expect(sub2).toHaveBeenCalledTimes(0);

      dispose2();
      expect(sub1).toHaveBeenCalledTimes(0);
      expect(sub2).toHaveBeenCalledTimes(0);

      val.destroy();
    });
  });

  describe("subscribe", () => {
    it("should trigger immediate emission on subscribe", () => {
      const spy = vi.fn();
      const val = new ReadonlyVal(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(1);

      val.destroy();
    });

    it("should trigger emission on set", () => {
      let set = noop as ValSetValue<number, any>;
      const spy = vi.fn();
      const val = new ReadonlyVal(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBe(1);

      set(2);
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(2);
      expect(spy.mock.calls[1][0]).toBe(2);

      val.destroy();
    });

    it("should emit meta on subscribe", () => {
      let set = noop as ValSetValue<number, any>;
      const spy = vi.fn();
      const val = new ReadonlyVal<number, string>(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy, "meta");
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(1, "meta");

      set(2, "meta2");
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(2);
      expect(spy).lastCalledWith(2, "meta2");

      val.destroy();
    });

    it("should not trigger emission on set with same value", () => {
      let set = noop as ValSetValue<{ value: number }, any>;
      const spy = vi.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const val = new ReadonlyVal(value1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(value1);

      set(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      set(value2);
      expect(val.value).toBe(value2);
      expect(spy).toBeCalledTimes(2);
      expect(firstParamOfLastCall(spy)).toBe(value2);

      val.destroy();
    });

    it("should perform custom compare", () => {
      let set = noop as ValSetValue<{ value: number }, any>;
      const spy = vi.fn();
      const value1 = { value: 1 };
      const valueClone = { value: 1 };
      const compare = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const val = new ReadonlyVal(value1, {
        compare,
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(value1);

      set(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      set(valueClone);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(value1);

      val.destroy();
    });

    it("should support multiple subscribers", () => {
      let set = noop as ValSetValue<number, any>;
      const spies = Array(20)
        .fill(0)
        .map(() => vi.fn());
      const val = new ReadonlyVal(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      spies.forEach(spy => {
        val.subscribe(spy);
      });

      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(1, undefined);
      });

      set(1);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      set(2);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(2);
        expect(spy).lastCalledWith(2, undefined);
      });

      val.destroy();
    });

    it("should remove subscriber if disposed", () => {
      let set = noop as ValSetValue<number, any>;
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const val = new ReadonlyVal<number, string>(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      const spy1Disposer = val.subscribe(spy1);
      val.subscribe(spy2);

      expect(spy1).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(1, undefined);
      expect(spy2).toBeCalledTimes(1);
      expect(spy2).lastCalledWith(1, undefined);

      spy1Disposer();

      set(2, "meta2");
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(2);
      expect(spy2).lastCalledWith(2, "meta2");

      val.destroy();
    });

    it("should remove all subscribers on destroy", () => {
      let set = noop as ValSetValue<number, any>;
      const spies = Array(20)
        .fill(0)
        .map(() => vi.fn());
      const val = new ReadonlyVal(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      spies.forEach(spy => {
        val.subscribe(spy);
      });

      set(1);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      val.destroy();

      set(2);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      val.destroy();
    });
  });

  describe("reaction", () => {
    it("should not trigger immediate emission on reaction", () => {
      let set = noop as ValSetValue<number, any>;
      const spy = vi.fn();
      const val = new ReadonlyVal(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      set(2);
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(2);

      val.destroy();
    });

    it("should trigger emission on set", () => {
      let set = noop as ValSetValue<number, any>;
      const spy = vi.fn();
      const val = new ReadonlyVal(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      set(2);
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(2);

      val.destroy();
    });

    it("should have old value", () => {
      let set = noop as ValSetValue<number, any>;
      const spy = vi.fn();
      const val = new ReadonlyVal(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      set(2);
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(2, undefined);

      val.destroy();
    });

    it("should emit meta on reaction", () => {
      let set = noop as ValSetValue<number, any>;
      const spy = vi.fn();
      const val = new ReadonlyVal<number, string>(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      set(2, "meta2");
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(2, "meta2");

      val.destroy();
    });

    it("should not trigger emission on set with same value", () => {
      let set = noop as ValSetValue<{ value: number }, any>;
      const spy = vi.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const val = new ReadonlyVal(value1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      set(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      set(value2);
      expect(val.value).toBe(value2);
      expect(spy).toBeCalledTimes(1);
      expect(firstParamOfLastCall(spy)).toBe(value2);

      val.destroy();
    });

    it("should perform custom compare", () => {
      let set = noop as ValSetValue<{ value: number }, any>;
      const spy = vi.fn();
      const value1 = { value: 1 };
      const value1Clone = { value: 1 };
      const compare = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const val = new ReadonlyVal(value1, {
        compare,
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      set(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      set(value1Clone);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.destroy();
    });

    it("should support multiple subscribers", () => {
      let set = noop as ValSetValue<number, any>;
      const spies = Array(20)
        .fill(0)
        .map(() => vi.fn());
      const val = new ReadonlyVal(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      spies.forEach(spy => {
        val.reaction(spy);
      });

      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      set(1);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      set(2);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(2, undefined);
      });

      val.destroy();
    });

    it("should remove subscriber if disposed", () => {
      let set = noop as ValSetValue<number, any>;
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const val = new ReadonlyVal<number, string>(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      const spy1Disposer = val.reaction(spy1);
      val.reaction(spy2);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);

      spy1Disposer();

      set(2, "meta2");
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(1);
      expect(spy2).lastCalledWith(2, "meta2");

      val.destroy();
    });

    it("should remove all subscribers on destroy", () => {
      let set = noop as ValSetValue<number, any>;
      const spies = Array(20)
        .fill(0)
        .map(() => vi.fn());
      const val = new ReadonlyVal(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      spies.forEach(spy => {
        val.reaction(spy);
      });

      set(1);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      val.destroy();

      set(2);
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      val.destroy();
    });
  });

  describe("unsubscribe", () => {
    it("should unsubscribe a subscribe callback", () => {
      let set = noop as ValSetValue<number, any>;
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const val = new ReadonlyVal<number, string>(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      val.subscribe(function sub1(...args) {
        val.unsubscribe(sub1);
        spy1(...args);
      });
      val.subscribe(spy2);

      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(1);

      expect(spy1).lastCalledWith(1, undefined);
      expect(spy2).lastCalledWith(1, undefined);

      set(2, "meta2");
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(2);
      expect(spy1).lastCalledWith(1, undefined);
      expect(spy2).lastCalledWith(2, "meta2");

      val.destroy();
    });

    it("should unsubscribe a reaction callback", () => {
      let set = noop as ValSetValue<number, any>;
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const val = new ReadonlyVal<number, string>(1, {
        beforeSubscribe: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      val.reaction(function sub1(...args) {
        val.unsubscribe(sub1);
        spy1(...args);
      });
      val.reaction(spy2);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);

      set(2, "meta2");
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(2, "meta2");
      expect(spy2).lastCalledWith(2, "meta2");

      set(3, "meta3");
      expect(val.value).toBe(3);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(2);
      expect(spy1).lastCalledWith(2, "meta2");
      expect(spy2).lastCalledWith(3, "meta3");

      val.destroy();
    });
  });
});

function firstParamOfLastCall<T extends any[] = any[], P extends any[] = any>(
  spy: SpyInstanceFn<T, P>
): any {
  return spy.mock.calls[spy.mock.calls.length - 1][0];
}
