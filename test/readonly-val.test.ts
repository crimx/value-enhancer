import { describe, it, expect, jest } from "@jest/globals";
import type { ValSetValue } from "../src/typings";
import { readonlyVal } from "../src/value-enhancer";

const noop = () => void 0;

describe("ReadonlyVal", () => {
  describe("value", () => {
    it("should have a Val with value 1", () => {
      const val = readonlyVal(1);
      expect(val.value).toBe(1);
    });
  });

  describe("start", () => {
    it("should be called before first subscription", () => {
      const start = jest.fn(() => void 0);
      const val = readonlyVal(1, { start });
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
      const val = readonlyVal(1, { start });
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
      const val = readonlyVal(1, {
        start: set => {
          set(1);
          set(2);
          set(3);
          set(4);
        },
      });

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
      const val = readonlyVal(1, {
        start: set => {
          setTimeout(() => {
            set(1);
            set(2);
            set(3);
            set(4);
          }, 0);
        },
      });

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

  describe("subscribe", () => {
    it("should trigger immediate emission on subscribe", () => {
      const spy = jest.fn();
      const val = readonlyVal(1);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(1);

      val.unsubscribe();
    });

    it("should trigger async emission on set", async () => {
      let set = noop as ValSetValue<number>;
      const spy = jest.fn();
      const val = readonlyVal(1, {
        start: _setValue => {
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
      expect(spy).toBeCalledTimes(1);

      await Promise.resolve();

      expect(spy).toBeCalledTimes(2);
      expect(spy.mock.calls[1][0]).toBe(2);
      expect(val.value).toBe(2);

      val.unsubscribe();
    });

    it("should trigger sync emission on set", () => {
      let set = noop as ValSetValue<number>;
      const spy = jest.fn();
      const val = readonlyVal(1, {
        start: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
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
      let set = noop as ValSetValue<{ value: number }>;
      const spy = jest.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const val = readonlyVal(value1, {
        start: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value1);

      set(value1);
      await Promise.resolve();
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      set(value2);
      await Promise.resolve();
      expect(val.value).toBe(value2);
      expect(spy).toBeCalledTimes(2);
      expect(spy).lastCalledWith(value2);

      val.unsubscribe();
    });

    it("should perform custom compare", async () => {
      let set = noop as ValSetValue<{ value: number }>;
      const spy = jest.fn();
      const value1 = { value: 1 };
      const valueClone = { value: 1 };
      const compare = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const val = readonlyVal(value1, {
        compare,
        start: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      val.subscribe(spy);
      await Promise.resolve();
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value1);

      set(value1);
      await Promise.resolve();
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      set(valueClone);
      await Promise.resolve();
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value1);

      val.unsubscribe();
    });

    it("should support multiple subscribers", async () => {
      let set = noop as ValSetValue<number>;
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const val = readonlyVal(1, {
        start: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      spies.forEach(spy => {
        val.subscribe(spy);
      });

      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(1);
      });

      set(1);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      set(2);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(2);
        expect(spy).lastCalledWith(2);
      });

      val.unsubscribe();
    });

    it("should remove subscriber if disposed", async () => {
      let set = noop as ValSetValue<number>;
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const val = readonlyVal<number>(1, {
        start: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      const spy1Disposer = val.subscribe(spy1);
      val.subscribe(spy2);

      expect(spy1).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy2).lastCalledWith(1);

      spy1Disposer();

      set(2);
      await Promise.resolve();
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(2);
      expect(spy2).lastCalledWith(2);

      val.unsubscribe();
    });

    it("should remove all subscribers on unsubscribe", async () => {
      let set = noop as ValSetValue<number>;
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const val = readonlyVal(1, {
        start: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      spies.forEach(spy => {
        val.subscribe(spy);
      });

      set(1);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      val.unsubscribe();

      set(2);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });
    });
  });

  describe("reaction", () => {
    it("should not trigger immediate emission on reaction", async () => {
      let set = noop as ValSetValue<number>;
      const spy = jest.fn();
      const val = readonlyVal(1, {
        start: _setValue => {
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
      expect(spy).toBeCalledTimes(0);

      await Promise.resolve();

      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(2);

      val.unsubscribe();
    });

    it("should trigger sync emission on set", async () => {
      let set = noop as ValSetValue<number>;
      const spy = jest.fn();
      const val = readonlyVal(1, {
        start: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
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
      let set = noop as ValSetValue<number>;
      const spy = jest.fn();
      const val = readonlyVal(1, {
        start: _setValue => {
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
      await Promise.resolve();

      expect(val.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(2);

      val.unsubscribe();
    });

    it("should not trigger emission on set with same value", async () => {
      let set = noop as ValSetValue<{ value: number }>;
      const spy = jest.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const val = readonlyVal(value1, {
        start: _setValue => {
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
      await Promise.resolve();
      expect(val.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      set(value2);
      await Promise.resolve();
      expect(val.value).toBe(value2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value2);

      val.unsubscribe();
    });

    it("should perform custom compare", () => {
      let set = noop as ValSetValue<{ value: number }>;
      const spy = jest.fn();
      const value1 = { value: 1 };
      const value1Clone = { value: 1 };
      const compare = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const val = readonlyVal(value1, {
        compare,
        start: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });
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

    it("should support multiple subscribers", async () => {
      let set = noop as ValSetValue<number>;
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const val = readonlyVal(1, {
        start: _setValue => {
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
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      set(2);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(2);
      });

      val.unsubscribe();
    });

    it("should remove subscriber if disposed", async () => {
      let set = noop as ValSetValue<number>;
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const val = readonlyVal<number>(1, {
        start: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      const spy1Disposer = val.reaction(spy1);
      val.reaction(spy2);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);

      spy1Disposer();

      set(2);
      await Promise.resolve();
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(1);
      expect(spy2).lastCalledWith(2);

      val.unsubscribe();
    });

    it("should remove all subscribers on unsubscribe", async () => {
      let set = noop as ValSetValue<number>;
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const val = readonlyVal(1, {
        start: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

      spies.forEach(spy => {
        val.reaction(spy);
      });

      set(1);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      val.unsubscribe();

      set(2);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      val.unsubscribe();
    });
  });

  describe("unsubscribe", () => {
    it("should unsubscribe a subscribe callback", async () => {
      let set = noop as ValSetValue<number>;
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const val = readonlyVal<number>(1, {
        start: _setValue => {
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

      expect(spy1).lastCalledWith(1);
      expect(spy2).lastCalledWith(1);

      set(2);
      await Promise.resolve();
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(2);
      expect(spy1).lastCalledWith(1);
      expect(spy2).lastCalledWith(2);

      val.unsubscribe();
    });

    it("should unsubscribe a reaction callback", async () => {
      let set = noop as ValSetValue<number>;
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const val = readonlyVal<number>(1, {
        start: _setValue => {
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

      set(2);
      await Promise.resolve();
      expect(val.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(2);
      expect(spy2).lastCalledWith(2);

      set(3);
      await Promise.resolve();
      expect(val.value).toBe(3);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(2);
      expect(spy1).lastCalledWith(2);
      expect(spy2).lastCalledWith(3);

      val.unsubscribe();
    });

    it("should log subscriber error", async () => {
      let set = noop as ValSetValue<number>;
      const val = readonlyVal(1, {
        start: _setValue => {
          set = _setValue;
          return () => (set = noop);
        },
      });

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

      await Promise.resolve();

      expect(consoleErrorMock).toBeCalledTimes(1);
      expect(consoleErrorMock).toBeCalledWith(error);

      consoleErrorMock.mockRestore();
    });
  });
});
