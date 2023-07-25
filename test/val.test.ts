import { describe, expect, it, jest } from "@jest/globals";
import { val } from "../src";

describe("Val", () => {
  describe("value", () => {
    it("should have a Val with value 1", () => {
      const v = val(1);
      expect(v.value).toBe(1);
    });
  });

  describe("setter", () => {
    it("should update value from 1 to 2 when set(2)", () => {
      const v = val(1);
      expect(v.value).toBe(1);
      v.value = 2;
      expect(v.value).toBe(2);
    });
  });

  describe("set", () => {
    it("should update value from 1 to 2 when set(2)", () => {
      const v = val(1);
      expect(v.value).toBe(1);
      v.set(2);
      expect(v.value).toBe(2);
    });
  });

  describe("subscribe", () => {
    it("should trigger immediate emission on subscribe", async () => {
      const spy = jest.fn();
      const v = val(1);
      expect(v.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      v.subscribe(spy);
      expect(v.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(1);

      v.set(2);
      expect(spy).toBeCalledTimes(1);

      await Promise.resolve();
      expect(v.value).toBe(2);
      expect(spy).toBeCalledTimes(2);
      expect(spy).lastCalledWith(2);

      v.unsubscribe();
    });

    it("should trigger emission on set", async () => {
      const spy = jest.fn();
      const v = val(1);
      expect(v.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      v.subscribe(spy);
      expect(v.value).toBe(1);
      expect(spy).toBeCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBe(1);

      v.set(2);

      await Promise.resolve();

      expect(v.value).toBe(2);
      expect(spy).toBeCalledTimes(2);
      expect(spy.mock.calls[1][0]).toBe(2);

      v.unsubscribe();
    });

    it("should not trigger emission on set with same value", async () => {
      const spy = jest.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const v = val(value1);
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.subscribe(spy);
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value1);

      v.set(value1);

      await Promise.resolve();

      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      v.set(value2);

      await Promise.resolve();

      expect(v.value).toBe(value2);
      expect(spy).toBeCalledTimes(2);
      expect(spy).lastCalledWith(value2);

      v.unsubscribe();
    });

    it("should perform custom compare", async () => {
      const spy = jest.fn();
      const value1 = { value: 1 };
      const valueClone = { value: 1 };
      const compare = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const v = val(value1, { compare });
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.subscribe(spy);
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value1);

      v.set(value1);

      await Promise.resolve();

      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      v.set(valueClone);

      await Promise.resolve();

      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value1);

      v.unsubscribe();
    });

    it("should support multiple subscribers", async () => {
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const v = val(1);

      spies.forEach(spy => {
        v.subscribe(spy);
      });

      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(1);
      });

      v.set(1);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      v.set(2);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(2);
        expect(spy).lastCalledWith(2);
      });

      v.unsubscribe();
    });

    it("should remove subscriber if disposed", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const v = val(1);

      const spy1Disposer = v.subscribe(spy1);
      v.subscribe(spy2);

      expect(spy1).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy2).lastCalledWith(1);

      spy1Disposer();

      v.set(2);
      await Promise.resolve();
      expect(v.value).toBe(2);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(2);
      expect(spy2).lastCalledWith(2);

      v.unsubscribe();
    });

    it("should remove all subscribers on destroy", async () => {
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const v = val(1);

      spies.forEach(spy => {
        v.subscribe(spy);
      });

      v.set(1);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      v.unsubscribe();

      v.set(2);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      v.unsubscribe();
    });
  });

  describe("reaction", () => {
    it("should not trigger immediate emission on reaction", async () => {
      const spy = jest.fn();
      const v = val(1);
      expect(v.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      v.reaction(spy);
      expect(v.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      v.set(2);
      await Promise.resolve();
      expect(v.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(2);

      v.unsubscribe();
    });

    it("should trigger async emission on set", async () => {
      const spy = jest.fn();
      const v = val(1);
      expect(v.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      v.reaction(spy);
      expect(v.value).toBe(1);
      expect(spy).toBeCalledTimes(0);

      v.set(2);
      expect(spy).toBeCalledTimes(0);

      await Promise.resolve();

      expect(v.value).toBe(2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(2);

      v.unsubscribe();
    });

    it("should not trigger emission on set with same value", async () => {
      const spy = jest.fn();
      const value1 = { value: 1 };
      const value2 = { value: 2 };

      const v = val(value1);
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.reaction(spy);
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.set(value1);
      await Promise.resolve();
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.set(value2);
      await Promise.resolve();
      expect(v.value).toBe(value2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value2);

      v.unsubscribe();
    });

    it("should perform custom compare", async () => {
      const spy = jest.fn();
      const value1 = { value: 1 };
      const value1Clone = { value: 1 };
      const compare = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const v = val(value1, { compare });
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.reaction(spy);
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.set(value1);
      await Promise.resolve();
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.set(value1Clone);
      await Promise.resolve();
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.unsubscribe();
    });

    it("should support multiple subscribers", async () => {
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const v = val(1);

      spies.forEach(spy => {
        v.reaction(spy);
      });

      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      v.set(1);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      v.set(2);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).lastCalledWith(2);
      });

      v.unsubscribe();
    });

    it("should remove subscriber if disposed", async () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const v = val(1);

      const spy1Disposer = v.reaction(spy1);
      v.reaction(spy2);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);

      spy1Disposer();

      v.set(2);
      await Promise.resolve();
      expect(v.value).toBe(2);
      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(1);
      expect(spy2).lastCalledWith(2);

      v.unsubscribe();
    });

    it("should remove all subscribers on destroy", async () => {
      const spies = Array(20)
        .fill(0)
        .map(() => jest.fn());
      const v = val(1);

      spies.forEach(spy => {
        v.reaction(spy);
      });

      v.set(1);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      v.unsubscribe();

      v.set(2);
      await Promise.resolve();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      v.unsubscribe();
    });
  });
});
