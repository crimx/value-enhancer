import { describe, expect, it, jest } from "@jest/globals";
import type { ReadonlyVal, Val, ValSetValue } from "../src";
import { groupVals, nextTick, readonlyVal, val } from "../src";

interface EachItem {
  name: string;
  createVal: typeof readonlyVal;
}

const eachItem: EachItem[] = [
  {
    name: "val",
    createVal: ((value: any, config: any) => {
      const v = val(value, config);
      return [v, v.set];
    }) as typeof readonlyVal,
  },
  {
    name: "readonlyVal",
    createVal: readonlyVal,
  },
];

describe.each(eachItem)("$name", ({ createVal }) => {
  describe("value", () => {
    it("should have a Val with value 1", () => {
      const [v$] = createVal(1);
      expect(v$.value).toBe(1);
    });

    it("should create an Val of undefined", () => {
      const [v$, setValue] = createVal();
      expect(v$.value).toBeUndefined();

      setValue(undefined);
      expect(v$.value).toBeUndefined();
    });
  });

  describe("config", () => {
    it("should perform custom equal", () => {
      const spyReaction = jest.fn();
      const value1 = { value: 1 };
      const value1Clone = { value: 1 };
      const equal = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const [v$, set] = createVal(value1, { equal });
      expect(v$.value).toBe(value1);
      expect(spyReaction).toBeCalledTimes(0);

      v$.reaction(spyReaction, true);
      expect(v$.value).toBe(value1);
      expect(spyReaction).toBeCalledTimes(0);

      set(value1);
      expect(v$.value).toBe(value1);
      expect(spyReaction).toBeCalledTimes(0);

      set(value1Clone);
      expect(v$.value).toBe(value1);
      expect(spyReaction).toBeCalledTimes(0);

      v$.dispose();
    });

    it("should disable equality check if equal is false", async () => {
      const spyReaction = jest.fn();
      const value1 = {};
      const value2 = {};

      const [v$, set] = createVal(value1, { equal: false });
      expect(v$.value).toBe(value1);
      expect(spyReaction).toBeCalledTimes(0);

      v$.reaction(spyReaction, true);
      expect(v$.value).toBe(value1);
      expect(spyReaction).toBeCalledTimes(0);

      set(value1);
      expect(v$.value).toBe(value1);
      expect(spyReaction).toBeCalledTimes(1);

      set(value1);
      expect(v$.value).toBe(value1);
      expect(spyReaction).toBeCalledTimes(2);

      set(value2);
      expect(v$.value).toBe(value2);
      expect(spyReaction).toBeCalledTimes(3);

      v$.dispose();
    });

    it("should not bump version on every get value if equal is false", async () => {
      const spyReaction = jest.fn();
      const value: Record<string, number> = {};

      const [v$, set] = createVal(value, { equal: false });
      expect(v$.value).toBe(value);
      expect(spyReaction).toBeCalledTimes(0);

      let version = v$.$version;

      expect(v$.value).toBe(value);
      expect(v$.$version).toBe(version);

      expect(v$.value).toBe(value);
      expect(v$.$version).toBe(version);

      expect(v$.value).toBe(value);
      expect(v$.$version).toBe(version);

      v$.reaction(spyReaction, true);

      value.a = 1;
      set(value);

      expect(spyReaction).toBeCalledTimes(1);

      expect(v$.$version).not.toBe(version);

      version = v$.$version;

      expect(v$.value).toBe(value);
      expect(v$.$version).toBe(version);

      expect(v$.value).toBe(value);
      expect(v$.$version).toBe(version);

      expect(v$.value).toBe(value);
      expect(v$.$version).toBe(version);

      v$.dispose();
    });

    it("should trigger subscription synchronously by default if eager is true", async () => {
      const spy = jest.fn();
      const [val, set] = createVal(1, {
        eager: true,
      });
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      const spyAsync = jest.fn();
      val.reaction(spyAsync, false);
      expect(val.value).toBe(1);
      expect(spyAsync).toBeCalledTimes(0);

      set(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);
      expect(spyAsync).toBeCalledTimes(0);

      set(2);
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(spyAsync).toBeCalledTimes(0);

      await nextTick();

      expect(spy).toBeCalledTimes(1);
      expect(spyAsync).toBeCalledTimes(1);

      val.unsubscribe();
    });

    it("should trigger subscription asynchronously by default if eager is false", async () => {
      const spyAsync = jest.fn();
      const [v$, set] = createVal(1, {
        eager: false,
      });
      expect(v$.value).toBe(1);
      expect(spyAsync).toBeCalledTimes(0);

      v$.reaction(spyAsync);
      expect(v$.value).toBe(1);
      expect(spyAsync).toBeCalledTimes(0);

      const spySync = jest.fn();
      v$.reaction(spySync, true);
      expect(v$.value).toBe(1);
      expect(spySync).toBeCalledTimes(0);

      set(1);
      expect(v$.value).toBe(1);
      expect(spySync).toBeCalledTimes(0);
      expect(spyAsync).toBeCalledTimes(0);

      set(2);
      expect(v$.value).toBe(2);
      expect(spySync).toBeCalledTimes(1);
      expect(spyAsync).toBeCalledTimes(0);

      await nextTick();

      expect(spySync).toBeCalledTimes(1);
      expect(spyAsync).toBeCalledTimes(1);

      v$.dispose();
    });

    it("should get debug name", () => {
      const [v$] = createVal(1, { name: "testVal" });
      expect(v$.name).toBe("testVal");
      v$.dispose();
    });

    it("should call onDisposeValue when value changes", async () => {
      const onDisposeValue = jest.fn();
      const obj1 = { a: 1 };
      const obj2 = { a: 2 };
      const obj3 = { a: 3 };

      const [v$, set] = createVal(obj1, { onDisposeValue });
      expect(v$.value).toBe(obj1);
      expect(onDisposeValue).toBeCalledTimes(0);

      set(obj1);
      expect(v$.value).toBe(obj1);
      expect(onDisposeValue).toBeCalledTimes(0);

      set(obj2);
      expect(v$.value).toBe(obj2);
      expect(onDisposeValue).toBeCalledTimes(1);
      expect(onDisposeValue).lastCalledWith(obj1);

      set(obj2);
      expect(v$.value).toBe(obj2);
      expect(onDisposeValue).toBeCalledTimes(1);

      set(obj3);
      expect(v$.value).toBe(obj3);
      expect(onDisposeValue).toBeCalledTimes(2);
      expect(onDisposeValue).lastCalledWith(obj2);

      v$.dispose();
      expect(onDisposeValue).toBeCalledTimes(3);
      expect(onDisposeValue).lastCalledWith(obj3);
    });

    it("should call onDisposeValue when value changes (equal: false)", async () => {
      const onDisposeValue = jest.fn();
      const obj1 = { a: 1 };
      const obj2 = { a: 2 };
      const obj3 = { a: 3 };

      const [v$, set] = createVal(obj1, { onDisposeValue, equal: false });
      expect(v$.value).toBe(obj1);
      expect(onDisposeValue).toBeCalledTimes(0);

      set(obj1);
      expect(v$.value).toBe(obj1);
      expect(onDisposeValue).toBeCalledTimes(0);

      set(obj2);
      expect(v$.value).toBe(obj2);
      expect(onDisposeValue).toBeCalledTimes(1);
      expect(onDisposeValue).lastCalledWith(obj1);

      set(obj2);
      expect(v$.value).toBe(obj2);
      expect(onDisposeValue).toBeCalledTimes(1);

      set(obj3);
      expect(v$.value).toBe(obj3);
      expect(onDisposeValue).toBeCalledTimes(2);
      expect(onDisposeValue).lastCalledWith(obj2);

      v$.dispose();
      expect(onDisposeValue).toBeCalledTimes(3);
      expect(onDisposeValue).lastCalledWith(obj3);
    });
  });

  describe("subscribe", () => {
    it("should trigger immediate emission on subscribe", () => {
      const spySubscribe = jest.fn();
      const [v$] = createVal(1);
      expect(v$.value).toBe(1);
      expect(spySubscribe).toBeCalledTimes(0);

      v$.subscribe(spySubscribe);
      expect(v$.value).toBe(1);
      expect(spySubscribe).toBeCalledTimes(1);
      expect(spySubscribe).lastCalledWith(1);

      v$.dispose();
    });

    it("should trigger async emission on set", async () => {
      const spySubscribe = jest.fn();
      const [v$, set] = createVal(1);
      expect(v$.value).toBe(1);
      expect(spySubscribe).toBeCalledTimes(0);

      v$.subscribe(spySubscribe);
      expect(v$.value).toBe(1);
      expect(spySubscribe).toBeCalledTimes(1);
      expect(spySubscribe).lastCalledWith(1);

      set(2);
      expect(spySubscribe).toBeCalledTimes(1);

      await nextTick();

      expect(spySubscribe).toBeCalledTimes(2);
      expect(spySubscribe).lastCalledWith(2);
      expect(v$.value).toBe(2);

      v$.dispose();
    });

    it("should trigger sync emission on set", () => {
      const spySubscribe = jest.fn();
      const [v$, set] = createVal(1);
      expect(v$.value).toBe(1);
      expect(spySubscribe).toBeCalledTimes(0);

      v$.subscribe(spySubscribe, true);
      expect(v$.value).toBe(1);
      expect(spySubscribe).toBeCalledTimes(1);
      expect(spySubscribe).lastCalledWith(1);

      set(2);
      expect(v$.value).toBe(2);
      expect(spySubscribe).toBeCalledTimes(2);
      expect(spySubscribe).lastCalledWith(2);

      v$.dispose();
    });

    it("should not trigger emission on set with same value", async () => {
      const spySubscribe = jest.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const [v$, set] = createVal(value1);
      expect(v$.value).toBe(value1);
      expect(spySubscribe).toBeCalledTimes(0);

      v$.subscribe(spySubscribe);
      expect(v$.value).toBe(value1);
      expect(spySubscribe).toBeCalledTimes(1);
      expect(spySubscribe).lastCalledWith(value1);

      set(value1);
      await nextTick();
      expect(v$.value).toBe(value1);
      expect(spySubscribe).toBeCalledTimes(1);

      set(value2);
      await nextTick();
      expect(v$.value).toBe(value2);
      expect(spySubscribe).toBeCalledTimes(2);
      expect(spySubscribe).lastCalledWith(value2);

      v$.dispose();
    });

    it("should perform custom equal", async () => {
      const spySubscribe = jest.fn();
      const value1 = { value: 1 };
      const valueClone = { value: 1 };
      const equal = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const [v$, set] = createVal(value1, { equal });
      expect(v$.value).toBe(value1);
      expect(spySubscribe).toBeCalledTimes(0);

      v$.subscribe(spySubscribe);
      await nextTick();
      expect(v$.value).toBe(value1);
      expect(spySubscribe).toBeCalledTimes(1);
      expect(spySubscribe).lastCalledWith(value1);

      set(value1);
      await nextTick();
      expect(v$.value).toBe(value1);
      expect(spySubscribe).toBeCalledTimes(1);

      set(valueClone);
      await nextTick();
      expect(v$.value).toBe(value1);
      expect(spySubscribe).toBeCalledTimes(1);
      expect(spySubscribe).lastCalledWith(value1);

      v$.dispose();
    });

    it("should support multiple subscribers", async () => {
      const spySubscribes = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const [v$, set] = createVal(1);

      spySubscribes.forEach(spy => {
        v$.subscribe(spy);
      });

      spySubscribes.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(1);
      });

      set(1);
      await nextTick();
      spySubscribes.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      set(2);
      await nextTick();
      spySubscribes.forEach(spy => {
        expect(spy).toBeCalledTimes(2);
        expect(spy).lastCalledWith(2);
      });

      v$.dispose();
    });

    it("should remove subscriber if disposed", async () => {
      const spySubscribe1 = jest.fn();
      const spySubscribe2 = jest.fn();
      const [v$, set] = createVal<number>(1);

      const spy1Disposer = v$.subscribe(spySubscribe1);
      v$.subscribe(spySubscribe2);

      expect(spySubscribe1).toBeCalledTimes(1);
      expect(spySubscribe1).lastCalledWith(1);
      expect(spySubscribe2).toBeCalledTimes(1);
      expect(spySubscribe2).lastCalledWith(1);

      spy1Disposer();

      set(2);
      await nextTick();
      expect(v$.value).toBe(2);
      expect(spySubscribe1).toBeCalledTimes(1);
      expect(spySubscribe2).toBeCalledTimes(2);
      expect(spySubscribe2).lastCalledWith(2);

      v$.dispose();
    });

    it("should remove all subscribers on unsubscribe", async () => {
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => void 0);

      const spySubscribes = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const [v$, set] = createVal(1);

      spySubscribes.forEach(spy => {
        v$.subscribe(spy);
      });

      set(1);
      await nextTick();
      spySubscribes.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      expect(consoleErrorMock).not.toBeCalled();

      v$.dispose();

      set(2);
      await nextTick();
      spySubscribes.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      expect(consoleErrorMock).toBeCalled();

      consoleErrorMock.mockRestore();
    });

    it("should remove original if adding two same subscribes", async () => {
      const spySubscribe = jest.fn();
      const [v$, set] = createVal(1);

      v$.subscribe(spySubscribe);
      v$.subscribe(spySubscribe);

      expect(spySubscribe).toBeCalledTimes(2);
      expect(spySubscribe).lastCalledWith(1);

      set(2);

      expect(spySubscribe).toBeCalledTimes(2);
      expect(spySubscribe).lastCalledWith(1);

      await nextTick();

      expect(v$.value).toBe(2);
      expect(spySubscribe).toBeCalledTimes(3);
      expect(spySubscribe).lastCalledWith(2);

      v$.subscribe(spySubscribe, true);

      expect(spySubscribe).toBeCalledTimes(4);
      expect(spySubscribe).lastCalledWith(2);

      set(3);

      expect(spySubscribe).toBeCalledTimes(5);
      expect(spySubscribe).lastCalledWith(3);

      v$.dispose();
    });

    it("should log subscriber error", async () => {
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => void 0);
      expect(consoleErrorMock).toBeCalledTimes(0);

      const [v$, set] = createVal(1);

      const error = new Error("Hello");
      v$.subscribe(() => {
        throw error;
      });

      expect(consoleErrorMock).toBeCalledTimes(1);
      expect(consoleErrorMock).toBeCalledWith(error);

      consoleErrorMock.mockClear();

      set(2);

      expect(consoleErrorMock).toBeCalledTimes(0);

      await nextTick();

      expect(consoleErrorMock).toBeCalledTimes(1);
      expect(consoleErrorMock).toBeCalledWith(error);

      consoleErrorMock.mockRestore();
    });
  });

  describe("reaction", () => {
    it("should not trigger immediate emission on reaction", async () => {
      const spyReaction = jest.fn();
      const [v$, set] = createVal(1);
      expect(v$.value).toBe(1);
      expect(spyReaction).toBeCalledTimes(0);

      v$.reaction(spyReaction);
      expect(v$.value).toBe(1);
      expect(spyReaction).toBeCalledTimes(0);

      set(2);
      expect(spyReaction).toBeCalledTimes(0);

      await nextTick();

      expect(v$.value).toBe(2);
      expect(spyReaction).toBeCalledTimes(1);
      expect(spyReaction).lastCalledWith(2);

      v$.dispose();
    });

    it("should trigger sync emission on set", async () => {
      const spyReaction = jest.fn();
      const [v$, set] = createVal(1);
      expect(v$.value).toBe(1);
      expect(spyReaction).toBeCalledTimes(0);

      v$.reaction(spyReaction, true);
      expect(spyReaction).toBeCalledTimes(0);
      expect(v$.value).toBe(1);

      set(2);
      expect(spyReaction).toBeCalledTimes(1);
      expect(spyReaction).lastCalledWith(2);
      expect(v$.value).toBe(2);

      v$.dispose();
    });

    it("should trigger emission on set", async () => {
      const spyReaction = jest.fn();
      const [v$, set] = createVal(1);
      expect(v$.value).toBe(1);
      expect(spyReaction).toBeCalledTimes(0);

      v$.reaction(spyReaction);
      expect(v$.value).toBe(1);
      expect(spyReaction).toBeCalledTimes(0);

      set(2);
      await nextTick();

      expect(v$.value).toBe(2);
      expect(spyReaction).toBeCalledTimes(1);
      expect(spyReaction).lastCalledWith(2);

      v$.dispose();
    });

    it("should not trigger emission on set with same value", async () => {
      const spyReaction = jest.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const [v$, set] = createVal(value1);
      expect(v$.value).toBe(value1);
      expect(spyReaction).toBeCalledTimes(0);

      v$.reaction(spyReaction);
      expect(v$.value).toBe(value1);
      expect(spyReaction).toBeCalledTimes(0);

      set(value1);
      await nextTick();
      expect(v$.value).toBe(value1);
      expect(spyReaction).toBeCalledTimes(0);

      set(value2);
      await nextTick();
      expect(v$.value).toBe(value2);
      expect(spyReaction).toBeCalledTimes(1);
      expect(spyReaction).lastCalledWith(value2);

      v$.dispose();
    });

    it("should not trigger emission if subscriber is disposed on next tick", async () => {
      const spyReaction = jest.fn();

      const [v$, set] = createVal(1);

      let disposer = v$.reaction(spyReaction);

      set(2);
      set(1);

      expect(spyReaction).toBeCalledTimes(0);
      await nextTick();
      expect(spyReaction).toBeCalledTimes(0);

      set(2);

      expect(spyReaction).toBeCalledTimes(0);
      await nextTick();
      expect(spyReaction).toBeCalledTimes(1);
      expect(spyReaction).lastCalledWith(2);

      spyReaction.mockClear();

      set(3);
      disposer();

      expect(spyReaction).toBeCalledTimes(0);
      await nextTick();
      expect(spyReaction).toBeCalledTimes(0);

      disposer = v$.reaction(spyReaction);
      set(3);

      expect(spyReaction).toBeCalledTimes(0);
      await nextTick();
      expect(spyReaction).toBeCalledTimes(0);

      disposer();
    });

    it("should support multiple subscribers", async () => {
      const spyReactions = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const [v$, set] = createVal(1);

      spyReactions.forEach(spy => {
        v$.reaction(spy);
      });

      spyReactions.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      set(1);
      await nextTick();
      spyReactions.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      set(2);
      await nextTick();
      spyReactions.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(2);
      });

      v$.dispose();
    });

    it("should remove subscriber if disposed", async () => {
      const spyReaction1 = jest.fn();
      const spyReaction2 = jest.fn();
      const [v$, set] = createVal<number>(1);

      const spy1Disposer = v$.reaction(spyReaction1);
      v$.reaction(spyReaction2);

      expect(spyReaction1).toBeCalledTimes(0);
      expect(spyReaction2).toBeCalledTimes(0);

      spy1Disposer();

      set(2);
      await nextTick();
      expect(v$.value).toBe(2);
      expect(spyReaction1).toBeCalledTimes(0);
      expect(spyReaction2).toBeCalledTimes(1);
      expect(spyReaction2).lastCalledWith(2);

      v$.dispose();
    });

    it("should remove all subscribers on unsubscribe", async () => {
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => void 0);

      const spyReactions = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const [v$, set] = createVal(1);

      spyReactions.forEach(spy => {
        v$.reaction(spy);
      });

      set(1);
      await nextTick();
      spyReactions.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      expect(consoleErrorMock).not.toBeCalled();

      v$.dispose();

      set(2);
      await nextTick();
      spyReactions.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      v$.dispose();

      expect(consoleErrorMock).toBeCalled();

      consoleErrorMock.mockRestore();
    });
  });

  describe("unsubscribe", () => {
    it("should unsubscribe a subscribe callback", async () => {
      const spySubscribeOnce = jest.fn();
      const spySubscribe = jest.fn();
      const [v$, set] = createVal<number>(1);

      v$.subscribe(function sub1(...args) {
        v$.unsubscribe(sub1);
        spySubscribeOnce(...args);
      });
      v$.subscribe(spySubscribe);

      expect(spySubscribeOnce).toBeCalledTimes(1);
      expect(spySubscribe).toBeCalledTimes(1);

      expect(spySubscribeOnce).lastCalledWith(1);
      expect(spySubscribe).lastCalledWith(1);

      set(2);
      await nextTick();
      expect(v$.value).toBe(2);
      expect(spySubscribeOnce).toBeCalledTimes(1);
      expect(spySubscribe).toBeCalledTimes(2);
      expect(spySubscribeOnce).lastCalledWith(1);
      expect(spySubscribe).lastCalledWith(2);

      v$.dispose();
    });

    it("should unsubscribe a reaction callback", async () => {
      const spySubscribeOnce = jest.fn();
      const spySubscribe = jest.fn();
      const [v$, set] = createVal<number>(1);

      v$.reaction(function sub1(...args) {
        v$.unsubscribe(sub1);
        spySubscribeOnce(...args);
      });
      v$.reaction(spySubscribe);

      expect(spySubscribeOnce).toBeCalledTimes(0);
      expect(spySubscribe).toBeCalledTimes(0);

      set(2);
      await nextTick();
      expect(v$.value).toBe(2);
      expect(spySubscribeOnce).toBeCalledTimes(1);
      expect(spySubscribe).toBeCalledTimes(1);
      expect(spySubscribeOnce).lastCalledWith(2);
      expect(spySubscribe).lastCalledWith(2);

      set(3);
      await nextTick();
      expect(v$.value).toBe(3);
      expect(spySubscribeOnce).toBeCalledTimes(1);
      expect(spySubscribe).toBeCalledTimes(2);
      expect(spySubscribeOnce).lastCalledWith(2);
      expect(spySubscribe).lastCalledWith(3);

      v$.dispose();
    });

    it("should unsubscribe all callbacks", async () => {
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => void 0);

      const spySubscribe = jest.fn();
      const spyReaction = jest.fn();
      const [v$, set] = createVal<number>(1);

      v$.subscribe(spySubscribe);
      v$.reaction(spyReaction);

      expect(spySubscribe).toBeCalledTimes(1);
      expect(spyReaction).toBeCalledTimes(0);

      spySubscribe.mockClear();
      spyReaction.mockClear();

      set(2);
      await nextTick();
      expect(v$.value).toBe(2);
      expect(spySubscribe).toBeCalledTimes(1);
      expect(spyReaction).toBeCalledTimes(1);
      expect(spySubscribe).lastCalledWith(2);
      expect(spyReaction).lastCalledWith(2);

      v$.dispose();

      spySubscribe.mockClear();
      spyReaction.mockClear();

      expect(consoleErrorMock).not.toBeCalled();

      set(3);
      await nextTick();
      expect(v$.value).toBe(3);
      expect(spySubscribe).toBeCalledTimes(0);
      expect(spyReaction).toBeCalledTimes(0);

      expect(consoleErrorMock).toBeCalled();
      consoleErrorMock.mockRestore();
    });
  });

  describe("ref", () => {
    it("should create a ref ReadonlyVal", async () => {
      const [v$, setValue] = createVal(1);
      const ref$ = v$.ref();
      expect(ref$.value).toBe(1);

      setValue(2);
      expect(v$.value).toBe(2);
      expect(ref$.value).toBe(2);

      const spyRefSubscribe = jest.fn();
      ref$.subscribe(spyRefSubscribe);

      expect(spyRefSubscribe).toBeCalledTimes(1);

      setValue(3);

      await nextTick();

      expect(spyRefSubscribe).toBeCalledTimes(2);
      expect(v$.value).toBe(3);
      expect(ref$.value).toBe(3);

      ref$.dispose();

      setValue(4);

      await nextTick();

      expect(spyRefSubscribe).toBeCalledTimes(2);
      expect(v$.value).toBe(4);
      expect(ref$.value).toBe(4);
    });

    it("should chain ref from the same source", async () => {
      const [v$, setValue] = createVal(1);
      const ref$ = v$.ref();
      const refRef$ = ref$.ref();

      expect(refRef$.value).toBe(1);

      setValue(2);
      expect(v$.value).toBe(2);
      expect(ref$.value).toBe(2);
      expect(refRef$.value).toBe(2);

      const spyRefRefSubscribe = jest.fn();
      refRef$.subscribe(spyRefRefSubscribe);

      expect(spyRefRefSubscribe).toBeCalledTimes(1);

      setValue(3);

      await nextTick();

      expect(spyRefRefSubscribe).toBeCalledTimes(2);
      expect(v$.value).toBe(3);
      expect(ref$.value).toBe(3);
      expect(refRef$.value).toBe(3);

      refRef$.dispose();

      setValue(4);

      await nextTick();

      expect(spyRefRefSubscribe).toBeCalledTimes(2);
      expect(v$.value).toBe(4);
      expect(ref$.value).toBe(4);
      expect(refRef$.value).toBe(4);
    });

    it("should not dispose the source val", () => {
      const [v$, set] = createVal(0);
      const ref$ = v$.ref();

      const spyVReaction = jest.fn();
      const spyRefReaction = jest.fn();

      const mockClear = () => {
        spyVReaction.mockClear();
        spyRefReaction.mockClear();
      };

      v$.reaction(spyVReaction, true);
      ref$.reaction(spyRefReaction, true);

      expect(spyVReaction).toBeCalledTimes(0);
      expect(spyRefReaction).toBeCalledTimes(0);

      mockClear();

      set(1);
      expect(spyVReaction).toBeCalledTimes(1);
      expect(spyRefReaction).toBeCalledTimes(1);
      expect(spyVReaction).lastCalledWith(1);
      expect(spyRefReaction).lastCalledWith(1);

      mockClear();

      set(2);
      expect(spyVReaction).toBeCalledTimes(1);
      expect(spyRefReaction).toBeCalledTimes(1);
      expect(spyVReaction).lastCalledWith(2);
      expect(spyRefReaction).lastCalledWith(2);

      mockClear();

      ref$.dispose();

      set(3);
      expect(spyVReaction).toBeCalledTimes(1);
      expect(spyRefReaction).toBeCalledTimes(0);
      expect(spyVReaction).lastCalledWith(3);

      v$.dispose();
    });

    it("all ref value should share the value from source val", () => {
      const v$ = val(0);
      const spyReaction = jest.fn();

      const refSpies = Array(10)
        .fill(0)
        .map(() => ({
          ref$: v$.ref(true),
          spyRefReaction: jest.fn(),
        }));

      v$.reaction(spyReaction, true);
      for (const { ref$, spyRefReaction } of refSpies) {
        ref$.reaction(spyRefReaction, true);
      }

      const mockClear = () => {
        spyReaction.mockClear();
        for (const { spyRefReaction } of refSpies) {
          spyRefReaction.mockClear();
        }
      };

      expect(spyReaction).toBeCalledTimes(0);
      for (const { spyRefReaction } of refSpies) {
        expect(spyRefReaction).toBeCalledTimes(0);
      }

      mockClear();

      v$.set(1);
      expect(spyReaction).toBeCalledTimes(1);
      expect(spyReaction).lastCalledWith(1);
      for (const { spyRefReaction } of refSpies) {
        expect(spyRefReaction).toBeCalledTimes(1);
        expect(spyRefReaction).lastCalledWith(1);
      }

      mockClear();

      refSpies[0].ref$.value = 2;
      expect(spyReaction).toBeCalledTimes(1);
      expect(spyReaction).lastCalledWith(2);
      for (const { spyRefReaction } of refSpies) {
        expect(spyRefReaction).toBeCalledTimes(1);
        expect(spyRefReaction).lastCalledWith(2);
      }

      mockClear();

      refSpies[1].ref$.dispose();

      refSpies[1].ref$.set(3);
      expect(spyReaction).toBeCalledTimes(1);
      expect(spyReaction).lastCalledWith(3);
      for (let i = 0; i < refSpies.length; i++) {
        if (i === 1) {
          expect(refSpies[i].spyRefReaction).toBeCalledTimes(0);
        } else {
          expect(refSpies[i].spyRefReaction).toBeCalledTimes(1);
          expect(refSpies[i].spyRefReaction).lastCalledWith(3);
        }
      }

      mockClear();

      refSpies[0].ref$.set(4);
      expect(spyReaction).toBeCalledTimes(1);
      expect(spyReaction).lastCalledWith(4);
      for (let i = 0; i < refSpies.length; i++) {
        if (i === 1) {
          expect(refSpies[i].spyRefReaction).toBeCalledTimes(0);
        } else {
          expect(refSpies[i].spyRefReaction).toBeCalledTimes(1);
          expect(refSpies[i].spyRefReaction).lastCalledWith(4);
        }
      }
    });
  });

  describe("dispose", () => {
    it("should unsubscribe all callbacks", async () => {
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => void 0);

      const spySubscribe = jest.fn();
      const spyReaction = jest.fn();
      const [v$, set] = createVal<number>(1);

      v$.subscribe(spySubscribe);
      v$.reaction(spyReaction);

      expect(spySubscribe).toBeCalledTimes(1);
      expect(spyReaction).toBeCalledTimes(0);

      spySubscribe.mockClear();
      spyReaction.mockClear();

      set(2);
      await nextTick();
      expect(v$.value).toBe(2);
      expect(spySubscribe).toBeCalledTimes(1);
      expect(spyReaction).toBeCalledTimes(1);
      expect(spySubscribe).lastCalledWith(2);
      expect(spyReaction).lastCalledWith(2);

      expect(consoleErrorMock).not.toBeCalled();

      v$.dispose();

      spySubscribe.mockClear();
      spyReaction.mockClear();

      set(3);
      await nextTick();
      expect(v$.value).toBe(3);
      expect(spySubscribe).toBeCalledTimes(0);
      expect(spyReaction).toBeCalledTimes(0);

      expect(consoleErrorMock).toBeCalled();

      consoleErrorMock.mockRestore();
    });

    it("should unsubscribe all callbacks in production mode", async () => {
      const NODE_ENV = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => void 0);

      const spySubscribe = jest.fn();
      const spyReaction = jest.fn();
      const [v$, set] = createVal<number>(1);

      v$.subscribe(spySubscribe);
      v$.reaction(spyReaction);

      expect(spySubscribe).toBeCalledTimes(1);
      expect(spyReaction).toBeCalledTimes(0);

      spySubscribe.mockClear();
      spyReaction.mockClear();

      set(2);
      await nextTick();
      expect(v$.value).toBe(2);
      expect(spySubscribe).toBeCalledTimes(1);
      expect(spyReaction).toBeCalledTimes(1);
      expect(spySubscribe).lastCalledWith(2);
      expect(spyReaction).lastCalledWith(2);

      expect(consoleErrorMock).not.toBeCalled();

      v$.dispose();

      spySubscribe.mockClear();
      spyReaction.mockClear();

      set(3);
      await nextTick();
      expect(v$.value).toBe(3);
      expect(spySubscribe).toBeCalledTimes(0);
      expect(spyReaction).toBeCalledTimes(0);

      expect(consoleErrorMock).toBeCalled();

      consoleErrorMock.mockRestore();

      process.env.NODE_ENV = NODE_ENV;
    });
  });

  describe("toJSON", () => {
    it("should convert val value into JSON", () => {
      const value = 1;
      const [v$] = createVal(value);
      expect(JSON.stringify(v$)).toBe(JSON.stringify(value));
    });

    it("should support nested vals", () => {
      const value = { a: 2 };
      const [v1$] = createVal(value);
      const [v2$] = createVal(v1$);
      const [v3$] = createVal(v2$);
      const [v$] = createVal(v3$);
      expect(JSON.stringify(v$)).toBe(JSON.stringify(value));
    });
  });

  describe("toString", () => {
    it("should convert val value into string", () => {
      const value = 1;
      const [v$] = createVal(value);
      expect(String(v$)).toBe(String(value));
    });

    it("should support nested vals", () => {
      const value = "222223";
      const [v1$] = createVal(value);
      const [v2$] = createVal(v1$);
      const [v3$] = createVal(v2$);
      const [v$] = createVal(v3$);
      expect(String(v$)).toBe(String(value));
    });
  });
});

describe("readonlyVal", () => {
  it("should accept a `ReadonlyVal<string>` as a valid argument for param `ReadonlyVal<string | undefined>`.", () => {
    const fn = (v$: ReadonlyVal<string | undefined>) => v$.value;
    const [v$] = readonlyVal<string>("hello");
    expect(fn(v$)).toBe("hello");
  });

  describe("NoInfer", () => {
    it("should not infer type", () => {
      enum E {
        A,
        B,
        C,
      }

      const [v1$, set1] = readonlyVal(E.A);
      set1(E.B);
      expect(v1$.value).toBe(E.B);

      const [v2$, set2]: [ReadonlyVal<E>, ValSetValue<E>] = readonlyVal(E.A);
      set2(E.C);
      expect(v2$.value).toBe(E.C);
    });

    it("should not infer [] as never[]", () => {
      const [a$, setA]: [ReadonlyVal<number[]>, ValSetValue<number[]>] =
        readonlyVal([]);

      setA([1]);
      expect(a$.value).toEqual([1]);
    });
  });
});

describe("val", () => {
  it("should not accept a `Val<string>` as a valid argument for param `Val<string | undefined>`.", () => {
    const fn = (v$: Val<string | undefined>) => v$.value;
    const v$ = val<string>("hello");
    // @ts-expect-error - v$ does not accept `undefined`.
    expect(fn(v$)).toBe("hello");
  });

  describe("setter", () => {
    it("should update value from 1 to 2 when set(2)", () => {
      const v$ = val(1);
      expect(v$.value).toBe(1);
      v$.value = 2;
      expect(v$.value).toBe(2);
    });
  });

  describe("set", () => {
    it("should update value from 1 to 2 when set(2)", () => {
      const v$ = val(1);
      expect(v$.value).toBe(1);
      v$.set(2);
      expect(v$.value).toBe(2);
    });
  });

  describe("ref", () => {
    it("should create a ref val", () => {
      const v$ = val(1);
      const ref$ = v$.ref(true);
      expect(ref$.value).toBe(1);
      expect(ref$.value).toBe(v$.value);
      expect(ref$.$version).toBe(v$.$version);
      expect(ref$.set).toBeDefined();
    });

    it("should set value on source val", () => {
      const v$ = val(1);
      const ref$ = v$.ref(true);
      ref$.set(2);
      expect(ref$.value).toBe(2);
      expect(v$.value).toBe(2);
    });
  });

  describe("NoInfer", () => {
    it("should not infer type", () => {
      enum E {
        A,
        B,
        C,
      }

      const v1$ = val(E.A);
      v1$.set(E.B);
      expect(v1$.value).toBe(E.B);

      const v2$: Val<E> = val(E.A);
      v2$.set(E.C);
      expect(v2$.value).toBe(E.C);
    });

    it("should not infer [] as never[]", () => {
      const a$: Val<number[]> = val([]);

      expect(a$.value).toEqual([]);
    });
  });
});

describe("groupVals", () => {
  it("should split readonly vals and setters", () => {
    const [vals, setVals] = groupVals({
      a: readonlyVal(1),
      b: readonlyVal(2),
      c: readonlyVal(3),
    });

    expect(vals.a.value).toBe(1);
    expect(vals.b.value).toBe(2);
    expect(vals.c.value).toBe(3);

    setVals.a(2);
    setVals.b(3);
    setVals.c(4);

    expect(vals.a.value).toBe(2);
    expect(vals.b.value).toBe(3);
    expect(vals.c.value).toBe(4);
  });

  it("should not infer type", () => {
    enum E {
      A,
      B,
      C,
      D,
    }

    const [vals, setVals]: [
      {
        a: ReadonlyVal<E>;
        b: ReadonlyVal<E>;
        c: ReadonlyVal<E>;
      },
      {
        a: ValSetValue<E>;
        b: ValSetValue<E>;
        c: ValSetValue<E>;
      }
    ] = groupVals({
      a: readonlyVal(E.A),
      b: readonlyVal(E.B),
      c: readonlyVal(E.C),
    });

    expect(vals.a.value).toBe(E.A);
    expect(vals.b.value).toBe(E.B);
    expect(vals.c.value).toBe(E.C);

    setVals.a(E.D);
    setVals.b(E.D);
    setVals.c(E.D);

    expect(vals.a.value).toBe(E.D);
    expect(vals.b.value).toBe(E.D);
    expect(vals.c.value).toBe(E.D);
  });
});
