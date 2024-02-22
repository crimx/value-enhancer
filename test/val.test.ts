import { describe, expect, it, jest } from "@jest/globals";
import type { Val } from "../src";
import { nextTick, val } from "../src";

describe("Val", () => {
  describe("value", () => {
    it("should have a Val with value 1", () => {
      const v = val(1);
      expect(v.value).toBe(1);
    });

    it("should not accept a `Val<string>` as a valid argument for param `Val<string | undefined>`.", () => {
      const fn = (v: Val<string | undefined>) => v.value;
      const v = val<string>("hello");
      // @ts-expect-error - v does not accept `undefined`.
      expect(fn(v)).toBe("hello");
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

      await nextTick();
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

      await nextTick();

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

      await nextTick();

      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      v.set(value2);

      await nextTick();

      expect(v.value).toBe(value2);
      expect(spy).toBeCalledTimes(2);
      expect(spy).lastCalledWith(value2);

      v.unsubscribe();
    });

    it("should perform custom equal", async () => {
      const spy = jest.fn();
      const value1 = { value: 1 };
      const valueClone = { value: 1 };
      const equal = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const v = val(value1, { equal });
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.subscribe(spy);
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value1);

      v.set(value1);

      await nextTick();

      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(1);

      v.set(valueClone);

      await nextTick();

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
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      v.set(2);
      await nextTick();
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
      await nextTick();
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
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(1);
      });

      v.unsubscribe();

      v.set(2);
      await nextTick();
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
      await nextTick();
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

      await nextTick();

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
      await nextTick();
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.set(value2);
      await nextTick();
      expect(v.value).toBe(value2);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(value2);

      v.unsubscribe();
    });

    it("should perform custom equal", async () => {
      const spy = jest.fn();
      const value1 = { value: 1 };
      const value1Clone = { value: 1 };
      const equal = (a: { value: number }, b: { value: number }) =>
        a.value === b.value;

      const v = val(value1, { equal });
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.reaction(spy);
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.set(value1);
      await nextTick();
      expect(v.value).toBe(value1);
      expect(spy).toBeCalledTimes(0);

      v.set(value1Clone);
      await nextTick();
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
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      v.set(2);
      await nextTick();
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
      await nextTick();
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
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      v.unsubscribe();

      v.set(2);
      await nextTick();
      spies.forEach(spy => {
        expect(spy).toBeCalledTimes(0);
      });

      v.unsubscribe();
    });
  });

  describe("ref", () => {
    it("should create a ref val", () => {
      const v = val(1);
      const ref = v.ref(true);
      expect(ref.value).toBe(1);
      expect(ref.value).toBe(v.value);
    });

    it("should create a ref readonly val", () => {
      const v = val(1);
      const readonlyRef = v.ref();
      expect(readonlyRef.value).toBe(1);
      expect(readonlyRef.value).toBe(v.value);
      // @ts-expect-error - not set on readonly val
      expect(readonlyRef.set).toBeUndefined();

      const ref = v.ref(true);
      const readonlyREf2 = ref.ref();
      expect(readonlyREf2.value).toBe(1);
      expect(readonlyREf2.value).toBe(v.value);
      // @ts-expect-error - not set on readonly val
      expect(readonlyREf2.set).toBeUndefined();
    });

    it("should set value on source val", () => {
      const v = val(1);
      const ref = v.ref(true);
      ref.set(2);
      expect(ref.value).toBe(2);
      expect(v.value).toBe(2);
    });

    it("should chain ref val from the same source", () => {
      const v = val(1);
      const ref1 = v.ref(true);
      const ref2 = ref1.ref(true);
      ref1.set(2);
      expect(ref1.value).toBe(2);
      expect(ref2.value).toBe(2);
      expect(v.value).toBe(2);
    });

    it("should not dispose the source val", () => {
      const v = val(0);
      const ref = v.ref(true);

      const spyV = jest.fn();
      const spyRef = jest.fn();

      const mockClear = () => {
        spyV.mockClear();
        spyRef.mockClear();
      };

      v.reaction(spyV, true);
      ref.reaction(spyRef, true);

      expect(spyV).toBeCalledTimes(0);
      expect(spyRef).toBeCalledTimes(0);

      mockClear();

      v.set(1);
      expect(spyV).toBeCalledTimes(1);
      expect(spyRef).toBeCalledTimes(1);
      expect(spyV).lastCalledWith(1);
      expect(spyRef).lastCalledWith(1);

      mockClear();

      ref.set(2);
      expect(spyV).toBeCalledTimes(1);
      expect(spyRef).toBeCalledTimes(1);
      expect(spyV).lastCalledWith(2);
      expect(spyRef).lastCalledWith(2);

      mockClear();

      ref.dispose();

      ref.set(3);
      expect(spyV).toBeCalledTimes(1);
      expect(spyRef).toBeCalledTimes(0);
      expect(spyV).lastCalledWith(3);

      v.dispose();
    });

    it("all ref value should share the value from source val", () => {
      const v = val(0);
      const spyV = jest.fn();

      const refs = Array(10)
        .fill(0)
        .map(() => ({
          ref: v.ref(true),
          spyRef: jest.fn(),
        }));

      v.reaction(spyV, true);
      for (const { ref, spyRef } of refs) {
        ref.reaction(spyRef, true);
      }

      const mockClear = () => {
        spyV.mockClear();
        for (const { spyRef } of refs) {
          spyRef.mockClear();
        }
      };

      expect(spyV).toBeCalledTimes(0);
      for (const { spyRef } of refs) {
        expect(spyRef).toBeCalledTimes(0);
      }

      mockClear();

      v.set(1);
      expect(spyV).toBeCalledTimes(1);
      expect(spyV).lastCalledWith(1);
      for (const { spyRef } of refs) {
        expect(spyRef).toBeCalledTimes(1);
        expect(spyRef).lastCalledWith(1);
      }

      mockClear();

      refs[0].ref.value = 2;
      expect(spyV).toBeCalledTimes(1);
      expect(spyV).lastCalledWith(2);
      for (const { spyRef } of refs) {
        expect(spyRef).toBeCalledTimes(1);
        expect(spyRef).lastCalledWith(2);
      }

      mockClear();

      refs[1].ref.dispose();

      refs[1].ref.set(3);
      expect(spyV).toBeCalledTimes(1);
      expect(spyV).lastCalledWith(3);
      for (let i = 0; i < refs.length; i++) {
        if (i === 1) {
          expect(refs[i].spyRef).toBeCalledTimes(0);
        } else {
          expect(refs[i].spyRef).toBeCalledTimes(1);
          expect(refs[i].spyRef).lastCalledWith(3);
        }
      }

      mockClear();

      refs[0].ref.set(4);
      expect(spyV).toBeCalledTimes(1);
      expect(spyV).lastCalledWith(4);
      for (let i = 0; i < refs.length; i++) {
        if (i === 1) {
          expect(refs[i].spyRef).toBeCalledTimes(0);
        } else {
          expect(refs[i].spyRef).toBeCalledTimes(1);
          expect(refs[i].spyRef).lastCalledWith(4);
        }
      }
    });
  });

  describe("NoInfer", () => {
    it("should not infer type", () => {
      enum E {
        A,
        B,
        C,
      }

      const v1 = val(E.A);
      v1.set(E.B);
      expect(v1.value).toBe(E.B);

      const v2: Val<E> = val(E.A);
      v2.set(E.C);
      expect(v2.value).toBe(E.C);
    });
  });
});
