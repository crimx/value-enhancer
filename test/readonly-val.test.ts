import type { ReadonlyVal, ValSetValue } from "../src";

import { describe, expect, it, jest } from "@jest/globals";
import { groupVals, nextTick, readonlyVal } from "../src";
import { Subscribers } from "../src/subscribers";
import { ValImpl } from "../src/val";

describe("ReadonlyVal", () => {
  describe("value", () => {
    it("should have a Val with value 1", () => {
      const [val] = readonlyVal(1);
      expect(val.value).toBe(1);
    });

    it("should create an ReadonlyVal of undefined", () => {
      const [val, setValue] = readonlyVal();
      expect(val.value).toBeUndefined();

      setValue(undefined);
      expect(val.value).toBeUndefined();
    });

    it("should accept a `ReadonlyVal<string>` as a valid argument for param `ReadonlyVal<string | undefined>`.", () => {
      const fn = (v: ReadonlyVal<string | undefined>) => v.value;
      const [val] = readonlyVal<string>("hello");
      expect(fn(val)).toBe("hello");
    });
  });

  describe("config", () => {
    it("should perform custom equal", () => {
      const spy = jest.fn();
      const value1 = { value: 1 };
      const value1Clone = { value: 1 };
      const equal = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const [val, set] = readonlyVal(value1, { equal });
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy, true);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      set(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      set(value1Clone);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.unsubscribe();
    });

    it("should disable equality check if equal is false", async () => {
      const spy = jest.fn();
      const value1 = {};
      const value2 = {};

      const [val, set] = readonlyVal(value1, { equal: false });
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy, true);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      set(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      set(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(2);

      set(value2);
      expect(val.value).toBe(value2);
      expect(spy).toBeCalledTimes(3);

      val.unsubscribe();
    });

    it("should trigger subscription synchronously by default if eager is true", async () => {
      const spy = jest.fn();
      const [val, set] = readonlyVal(1, {
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
      const [val, set] = readonlyVal(1, {
        eager: false,
      });
      expect(val.value).toBe(1);
      expect(spyAsync).toBeCalledTimes(0);

      val.reaction(spyAsync);
      expect(val.value).toBe(1);
      expect(spyAsync).toBeCalledTimes(0);

      const spySync = jest.fn();
      val.reaction(spySync, true);
      expect(val.value).toBe(1);
      expect(spySync).toBeCalledTimes(0);

      set(1);
      expect(val.value).toBe(1);
      expect(spySync).toBeCalledTimes(0);
      expect(spyAsync).toBeCalledTimes(0);

      set(2);
      expect(val.value).toBe(2);
      expect(spySync).toBeCalledTimes(1);
      expect(spyAsync).toBeCalledTimes(0);

      await nextTick();

      expect(spySync).toBeCalledTimes(1);
      expect(spyAsync).toBeCalledTimes(1);

      val.unsubscribe();
    });
  });

  describe("subscribe", () => {
    it("should trigger immediate emission on subscribe", () => {
      const spy = jest.fn();
      const [val] = readonlyVal(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(1);

      val.unsubscribe();
    });

    it("should trigger async emission on set", async () => {
      const spy = jest.fn();
      const [val, set] = readonlyVal(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBe(1);

      set(2);
      expect(spy).toBeCalledTimes(1);

      await nextTick();

      expect(spy).toBeCalledTimes(2);
      expect(spy.mock.calls[1][0]).toBe(2);
      expect(val.value).toBe(2);

      val.unsubscribe();
    });

    it("should trigger sync emission on set", () => {
      const spy = jest.fn();
      const [val, set] = readonlyVal(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy, true);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBe(1);

      set(2);
      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(2);
      expect(spy.mock.calls[1][0]).toBe(2);

      val.unsubscribe();
    });

    it("should not trigger emission on set with same value", async () => {
      const spy = jest.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const [val, set] = readonlyVal(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value1);

      set(value1);
      await nextTick();
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      set(value2);
      await nextTick();
      expect(val.value).toBe(value2);
      expect(spy).toBeCalledTimes(2);
      expect(spy).lastCalledWith(value2);

      val.unsubscribe();
    });

    it("should perform custom equal", async () => {
      const spy = jest.fn();
      const value1 = { value: 1 };
      const valueClone = { value: 1 };
      const equal = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const [val, set] = readonlyVal(value1, { equal });
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      await nextTick();
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value1);

      set(value1);
      await nextTick();
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      set(valueClone);
      await nextTick();
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value1);

      val.unsubscribe();
    });

    it("should support multiple subscribers", async () => {
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const [val, set] = readonlyVal(1);

      spies.forEach(spy => {
        val.subscribe(spy);
      });

      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(1);
      });

      set(1);
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      set(2);
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(2);
        expect(spy).lastCalledWith(2);
      });

      val.unsubscribe();
    });

    it("should remove subscriber if disposed", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const [val, set] = readonlyVal<number>(1);

      const spy1Disposer = val.subscribe(spy1);
      val.subscribe(spy2);

      expect(spy1).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy2).lastCalledWith(1);

      spy1Disposer();

      set(2);
      await nextTick();
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(2);
      expect(spy2).lastCalledWith(2);

      val.unsubscribe();
    });

    it("should remove all subscribers on unsubscribe", async () => {
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const [val, set] = readonlyVal(1);

      spies.forEach(spy => {
        val.subscribe(spy);
      });

      set(1);
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      val.unsubscribe();

      set(2);
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });
    });

    it("should remove original if adding two same subscribes", async () => {
      const spy = jest.fn();
      const [val, set] = readonlyVal(1);

      val.subscribe(spy);
      val.subscribe(spy);

      expect(spy).toBeCalledTimes(2);
      expect(spy).lastCalledWith(1);

      set(2);

      expect(spy).toBeCalledTimes(2);
      expect(spy).lastCalledWith(1);

      await nextTick();

      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(3);
      expect(spy).lastCalledWith(2);

      val.subscribe(spy, true);

      expect(spy).toBeCalledTimes(4);
      expect(spy).lastCalledWith(2);

      set(3);

      expect(spy).toBeCalledTimes(5);
      expect(spy).lastCalledWith(3);

      val.unsubscribe();
    });

    it("should log subscriber error", async () => {
      const [val, set] = readonlyVal(1);

      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => void 0);

      expect(consoleErrorMock).toBeCalledTimes(0);

      const error = new Error("Hello");
      val.subscribe(() => {
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
      const spy = jest.fn();
      const [val, set] = readonlyVal(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      set(2);
      expect(spy).toBeCalledTimes(0);

      await nextTick();

      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(2);

      val.unsubscribe();
    });

    it("should trigger sync emission on set", async () => {
      const spy = jest.fn();
      const [val, set] = readonlyVal(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy, true);
      expect(spy).toBeCalledTimes(0);
      expect(val.value).toBe(1);

      set(2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(2);
      expect(val.value).toBe(2);

      val.unsubscribe();
    });

    it("should trigger emission on set", async () => {
      const spy = jest.fn();
      const [val, set] = readonlyVal(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      set(2);
      await nextTick();

      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(2);

      val.unsubscribe();
    });

    it("should not trigger emission on set with same value", async () => {
      const spy = jest.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const [val, set] = readonlyVal(value1);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.reaction(spy);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      set(value1);
      await nextTick();
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      set(value2);
      await nextTick();
      expect(val.value).toBe(value2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value2);

      val.unsubscribe();
    });

    it("should support multiple subscribers", async () => {
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const [val, set] = readonlyVal(1);

      spies.forEach(spy => {
        val.reaction(spy);
      });

      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      set(1);
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      set(2);
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(2);
      });

      val.unsubscribe();
    });

    it("should remove subscriber if disposed", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const [val, set] = readonlyVal<number>(1);

      const spy1Disposer = val.reaction(spy1);
      val.reaction(spy2);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);

      spy1Disposer();

      set(2);
      await nextTick();
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(1);
      expect(spy2).lastCalledWith(2);

      val.unsubscribe();
    });

    it("should remove all subscribers on unsubscribe", async () => {
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const [val, set] = readonlyVal(1);

      spies.forEach(spy => {
        val.reaction(spy);
      });

      set(1);
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      val.unsubscribe();

      set(2);
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      val.unsubscribe();
    });
  });

  describe("unsubscribe", () => {
    it("should unsubscribe a subscribe callback", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const [val, set] = readonlyVal<number>(1);

      val.subscribe(function sub1(...args) {
        val.unsubscribe(sub1);
        spy1(...args);
      });
      val.subscribe(spy2);

      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(1);

      expect(spy1).lastCalledWith(1);
      expect(spy2).lastCalledWith(1);

      set(2);
      await nextTick();
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(2);
      expect(spy1).lastCalledWith(1);
      expect(spy2).lastCalledWith(2);

      val.unsubscribe();
    });

    it("should unsubscribe a reaction callback", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const [val, set] = readonlyVal<number>(1);

      val.reaction(function sub1(...args) {
        val.unsubscribe(sub1);
        spy1(...args);
      });
      val.reaction(spy2);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);

      set(2);
      await nextTick();
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(2);
      expect(spy2).lastCalledWith(2);

      set(3);
      await nextTick();
      expect(val.value).toBe(3);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(2);
      expect(spy1).lastCalledWith(2);
      expect(spy2).lastCalledWith(3);

      val.unsubscribe();
    });

    it("should unsubscribe all callbacks", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const [val, set] = readonlyVal<number>(1);

      val.subscribe(spy1);
      val.reaction(spy2);

      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(0);

      spy1.mockClear();
      spy2.mockClear();

      set(2);
      await nextTick();
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(2);
      expect(spy2).lastCalledWith(2);

      val.unsubscribe();

      spy1.mockClear();
      spy2.mockClear();

      set(3);
      await nextTick();
      expect(val.value).toBe(3);
      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);
    });
  });

  describe("ref", () => {
    it("should create a ref ReadonlyVal", async () => {
      const [val, setValue] = readonlyVal(1);
      const ref = val.ref();
      expect(ref.value).toBe(1);

      setValue(2);
      expect(val.value).toBe(2);
      expect(ref.value).toBe(2);

      const spy = jest.fn();
      ref.subscribe(spy);

      expect(spy).toBeCalledTimes(1);

      setValue(3);

      await nextTick();

      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(3);
      expect(ref.value).toBe(3);

      ref.dispose();

      setValue(4);

      await nextTick();

      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(4);
      expect(ref.value).toBe(4);
    });

    it("should chain ref from the same source", async () => {
      const [val, setValue] = readonlyVal(1);
      const ref = val.ref();
      const refRef = ref.ref();

      expect(refRef.value).toBe(1);

      setValue(2);
      expect(val.value).toBe(2);
      expect(ref.value).toBe(2);
      expect(refRef.value).toBe(2);

      const spy = jest.fn();
      refRef.subscribe(spy);

      expect(spy).toBeCalledTimes(1);

      setValue(3);

      await nextTick();

      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(3);
      expect(ref.value).toBe(3);
      expect(refRef.value).toBe(3);

      refRef.dispose();

      setValue(4);

      await nextTick();

      expect(spy).toBeCalledTimes(2);
      expect(val.value).toBe(4);
      expect(ref.value).toBe(4);
      expect(refRef.value).toBe(4);
    });
  });

  describe("dispose", () => {
    it("should unsubscribe all callbacks", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const [val, set] = readonlyVal<number>(1);

      val.subscribe(spy1);
      val.reaction(spy2);

      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(0);

      spy1.mockClear();
      spy2.mockClear();

      set(2);
      await nextTick();
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(2);
      expect(spy2).lastCalledWith(2);

      val.dispose();

      spy1.mockClear();
      spy2.mockClear();

      set(3);
      await nextTick();
      expect(val.value).toBe(3);
      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);
    });
  });

  describe("toJSON", () => {
    it("should convert val value into JSON", () => {
      const value = 1;
      const [val] = readonlyVal(value);
      expect(JSON.stringify(val)).toBe(JSON.stringify(value));
    });

    it("should support nested vals", () => {
      const value = { a: 2 };
      const [val1] = readonlyVal(value);
      const [val2] = readonlyVal(val1);
      const [val3] = readonlyVal(val2);
      const [val] = readonlyVal(val3);
      expect(JSON.stringify(val)).toBe(JSON.stringify(value));
    });
  });

  describe("toString", () => {
    it("should convert val value into string", () => {
      const value = 1;
      const [val] = readonlyVal(value);
      expect(String(val)).toBe(String(value));
    });

    it("should support nested vals", () => {
      const value = "222223";
      const [val1] = readonlyVal(value);
      const [val2] = readonlyVal(val1);
      const [val3] = readonlyVal(val2);
      const [val] = readonlyVal(val3);
      expect(String(val)).toBe(String(value));
    });
  });
});

describe("ValImpl", () => {
  describe("start", () => {
    it("should be called before first subscription", () => {
      const start = jest.fn(() => void 0);
      const subs = new Subscribers(() => 1, start);
      const val = new ValImpl(subs);
      expect(start).toHaveBeenCalledTimes(0);

      const sub1 = jest.fn();
      const dispose1 = val.subscribe(sub1);
      expect(start).toBeCalledTimes(1);
      expect(sub1).toBeCalledTimes(1);

      const sub2 = jest.fn();
      const dispose2 = val.subscribe(sub2);
      expect(start).toBeCalledTimes(1);
      expect(sub1).toBeCalledTimes(1);
      expect(sub2).toBeCalledTimes(1);

      dispose1();
      expect(start).toBeCalledTimes(1);
      expect(sub1).toBeCalledTimes(1);
      expect(sub2).toBeCalledTimes(1);

      dispose2();
      expect(start).toBeCalledTimes(1);
      expect(sub1).toBeCalledTimes(1);
      expect(sub2).toBeCalledTimes(1);

      const sub3 = jest.fn();
      val.subscribe(sub3);
      expect(start).toBeCalledTimes(2);
      expect(sub1).toBeCalledTimes(1);
      expect(sub2).toBeCalledTimes(1);
      expect(sub3).toBeCalledTimes(1);

      val.unsubscribe();
    });

    it("should trigger disposer after last un-subscription", () => {
      const startDisposer = jest.fn();
      const start = jest.fn(() => startDisposer);
      const subs = new Subscribers(() => 1, start);
      const val = new ValImpl(subs);
      expect(startDisposer).toHaveBeenCalledTimes(0);

      const sub1 = jest.fn();
      const dispose1 = val.subscribe(sub1);
      expect(startDisposer).toHaveBeenCalledTimes(0);

      const sub2 = jest.fn();
      const dispose2 = val.subscribe(sub2);
      expect(startDisposer).toHaveBeenCalledTimes(0);

      dispose1();
      expect(startDisposer).toHaveBeenCalledTimes(0);

      dispose2();
      expect(startDisposer).toHaveBeenCalledTimes(1);

      const sub3 = jest.fn();
      const dispose3 = val.subscribe(sub3);
      expect(startDisposer).toHaveBeenCalledTimes(1);

      dispose3();
      expect(startDisposer).toHaveBeenCalledTimes(2);

      val.unsubscribe();
    });

    it("should not trigger extra emissions on sync set", () => {
      const [val, set] = readonlyVal(1);

      set(1);
      set(2);
      set(3);
      set(4);

      const sub1 = jest.fn();
      const dispose1 = val.subscribe(sub1);
      expect(sub1).toHaveBeenCalledTimes(1);
      expect(sub1).toBeCalledWith(4);

      const sub2 = jest.fn();
      const dispose2 = val.subscribe(sub2);
      expect(sub2).toHaveBeenCalledTimes(1);
      expect(sub2).toBeCalledWith(4);

      sub1.mockClear();
      sub2.mockClear();

      dispose1();
      expect(sub1).toHaveBeenCalledTimes(0);
      expect(sub2).toHaveBeenCalledTimes(0);

      dispose2();
      expect(sub1).toHaveBeenCalledTimes(0);
      expect(sub2).toHaveBeenCalledTimes(0);

      const sub3 = jest.fn();
      const dispose3 = val.subscribe(sub3);
      expect(sub3).toHaveBeenCalledTimes(1);
      expect(sub3).toBeCalledWith(4);

      sub3.mockClear();

      dispose3();
      expect(sub3).toHaveBeenCalledTimes(0);

      val.unsubscribe();
    });

    it("should not trigger extra emission on async set", async () => {
      const [val, set] = readonlyVal(1);
      setTimeout(() => {
        set(1);
        set(2);
        set(3);
        set(4);
      }, 0);

      const sub1 = jest.fn();
      const dispose1 = val.subscribe(sub1);
      expect(sub1).toHaveBeenCalledTimes(1);
      expect(sub1).toBeCalledWith(1);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sub1).toHaveBeenCalledTimes(2);
      expect(sub1).toBeCalledWith(4);

      const sub2 = jest.fn();
      const dispose2 = val.subscribe(sub2);
      expect(sub2).toHaveBeenCalledTimes(1);
      expect(sub2).toBeCalledWith(4);

      sub1.mockClear();
      sub2.mockClear();

      dispose1();
      expect(sub1).toHaveBeenCalledTimes(0);
      expect(sub2).toHaveBeenCalledTimes(0);

      dispose2();
      expect(sub1).toHaveBeenCalledTimes(0);
      expect(sub2).toHaveBeenCalledTimes(0);

      val.unsubscribe();
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

  describe("NoInfer", () => {
    it("should not infer type", () => {
      enum E {
        A,
        B,
        C,
      }

      const [v1, set1] = readonlyVal(E.A);
      set1(E.B);
      expect(v1.value).toBe(E.B);

      const [v2, set2]: [ReadonlyVal<E>, ValSetValue<E>] = readonlyVal(E.A);
      set2(E.C);
      expect(v2.value).toBe(E.C);
    });

    it("should not infer [] as never[]", () => {
      const [a, setA]: [ReadonlyVal<number[]>, ValSetValue<number[]>] =
        readonlyVal([]);

      setA([1]);
      expect(a.value).toEqual([1]);
    });
  });
});
