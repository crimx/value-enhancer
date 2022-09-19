import { describe, it, expect, jest } from "@jest/globals";
import { combine, val } from "../src";

describe("combine", () => {
  it("should lazy-calculate value", () => {
    const spy = jest.fn(value => value);
    const val1 = val(1);
    const val2 = val(1);
    const val3 = val(1);
    const val4 = val(1);
    const combined = combine([val1, val2, val3, val4], spy);

    expect(spy).toBeCalledTimes(1);

    val1.set(2);
    val2.set(3);
    val3.set(4);
    val4.set(5);

    expect(spy).toBeCalledTimes(1);

    expect(combined.value).toEqual([2, 3, 4, 5]);

    expect(spy).toBeCalledTimes(2);
  });

  it("should get value without subscribe", () => {
    const val1 = val(1);
    const val2 = val(1);
    const val3 = val(1);
    const val4 = val(2);
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return val1 + val2 + val3 + val4;
      }
    );

    expect(combined.value).toBe(5);

    val1.set(1);

    expect(combined.value).toEqual(5);

    val1.set(2);

    expect(combined.value).toEqual(6);

    combined.subscribe(jest.fn());

    expect(combined.value).toEqual(6);

    combined.unsubscribe();
  });

  it("should subscribe", async () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();
    const spy4 = jest.fn();
    const val1 = val(1);
    const val2 = combine([val1], ([v1]) => v1 + 1);
    const val3 = combine([val1, val2], ([v1, v2]) => v1 + v2);
    const val4 = combine([val1, val2, val3], ([v1, v2, v3]) => v1 + v2 + v3);

    val1.subscribe(spy1);
    val2.subscribe(spy2);
    val3.subscribe(spy3);
    val4.subscribe(spy4);

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(1);
    expect(spy4).toHaveBeenCalledTimes(1);

    expect(spy1).lastCalledWith(1);
    expect(spy2).lastCalledWith(2);
    expect(spy3).lastCalledWith(3);
    expect(spy4).lastCalledWith(6);

    spy1.mockClear();
    spy2.mockClear();
    spy3.mockClear();
    spy4.mockClear();

    val1.set(1);

    expect(spy1).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    expect(spy3).toHaveBeenCalledTimes(0);
    expect(spy4).toHaveBeenCalledTimes(0);

    val1.set(2);

    expect(spy1).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    expect(spy3).toHaveBeenCalledTimes(0);
    expect(spy4).toHaveBeenCalledTimes(0);

    await Promise.resolve();

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(1);
    expect(spy4).toHaveBeenCalledTimes(1);

    expect(spy1).lastCalledWith(2);
    expect(spy2).lastCalledWith(3);
    expect(spy3).lastCalledWith(5);
    expect(spy4).lastCalledWith(10);

    spy1.mockClear();
    spy2.mockClear();
    spy3.mockClear();
    spy4.mockClear();

    val1.set(3);

    expect(spy1).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    expect(spy3).toHaveBeenCalledTimes(0);
    expect(spy4).toHaveBeenCalledTimes(0);

    await Promise.resolve();

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(1);
    expect(spy4).toHaveBeenCalledTimes(1);

    expect(spy1).lastCalledWith(3);
    expect(spy2).lastCalledWith(4);
    expect(spy3).lastCalledWith(7);
    expect(spy4).lastCalledWith(14);
  });

  it("should combine a val list into a single val", () => {
    const val1 = val(1);
    const val2 = val({ code: 2 });
    const val3 = val<boolean>(false);
    const val4 = val<string>("4");
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      }
    );

    const spy = jest.fn();
    combined.subscribe(spy);

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual({
      val1: 1,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });

    combined.unsubscribe();
  });

  it("should perform custom compare", async () => {
    const val1 = val(1);
    const val2 = val({ code: 2 });
    const val3 = val<boolean>(false);
    const val4 = val<string>("4");
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      },
      { compare: (a, b) => a.val2.code === b.val2.code }
    );

    const spy = jest.fn();
    combined.subscribe(spy);

    expect(spy).toBeCalledTimes(1);
    expect(spy).lastCalledWith({
      val1: 1,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });

    const spy2 = jest.fn();
    val2.reaction(spy2);
    expect(spy2).toBeCalledTimes(0);

    val2.set({ code: 2 });
    expect(spy2).toBeCalledTimes(0);

    await Promise.resolve();

    expect(spy2).toBeCalledTimes(1);
    expect(spy).toBeCalledTimes(1);

    combined.unsubscribe();
  });

  it("should work without transform", () => {
    const val1 = val(1);
    const val2 = val(1);
    const val3 = val(1);
    const val4 = val(2);
    const combined = combine([val1, val2, val3, val4]);

    expect(combined.value).toEqual([1, 1, 1, 2]);

    val1.set(1);

    expect(combined.value).toEqual([1, 1, 1, 2]);

    val1.set(2);

    expect(combined.value).toEqual([2, 1, 1, 2]);

    combined.unsubscribe();
  });

  it("should trigger transform only once", async () => {
    const spy2 = jest.fn(value => value);
    const spy3 = jest.fn(value => value);
    const spy4 = jest.fn(value => value);
    const val1 = val(1);
    const val2 = combine([val1], spy2);
    const val3 = combine([val1, val2], spy3);
    const val4 = combine([val1, val2, val3], spy4);

    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(1);
    expect(spy4).toBeCalledTimes(1);

    const spy5 = jest.fn();
    val4.reaction(spy5);

    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(1);
    expect(spy4).toBeCalledTimes(1);

    val1.set(2);

    expect(spy2).toBeCalledTimes(2);
    expect(spy3).toBeCalledTimes(2);
    expect(spy4).toBeCalledTimes(1);
    expect(spy5).toBeCalledTimes(0);

    await Promise.resolve();

    expect(spy5).toBeCalledTimes(1);

    val4.unsubscribe();
  });
});
