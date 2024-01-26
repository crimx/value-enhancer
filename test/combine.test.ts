import { describe, expect, it, jest } from "@jest/globals";
import { combine, nextTick, val } from "../src";

describe("combine", () => {
  it("should lazy-calculate value", () => {
    const spy = jest.fn(value => value);
    const val1 = val(1);
    const val2 = val(1);
    const val3 = val(1);
    const val4 = val(1);
    const combined = combine([val1, val2, val3, val4], spy);

    expect(spy).toBeCalledTimes(0);

    val1.set(2);
    val2.set(3);
    val3.set(4);
    val4.set(5);

    expect(spy).toBeCalledTimes(0);

    expect(combined.value).toEqual([2, 3, 4, 5]);

    expect(spy).toBeCalledTimes(1);
  });

  it("should not trigger transform if upstream not changed", () => {
    const spy = jest.fn(([value1, value2]) => value1 + value2);
    const val1 = val(1);
    const val2 = val(1);
    const combined = combine([val1, val2], spy);

    expect(spy).toBeCalledTimes(0);

    expect(val1.value).toBe(1);
    expect(val2.value).toBe(1);
    expect(combined.value).toBe(2);
    expect(spy).toBeCalledTimes(1);

    expect(val1.value).toBe(1);
    expect(val2.value).toBe(1);
    expect(combined.value).toBe(2);
    expect(spy).toBeCalledTimes(1);

    val1.set(1);

    expect(val1.value).toBe(1);
    expect(val2.value).toBe(1);
    expect(combined.value).toBe(2);
    expect(spy).toBeCalledTimes(1);

    expect(val1.value).toBe(1);
    expect(val2.value).toBe(1);
    expect(combined.value).toBe(2);
    expect(spy).toBeCalledTimes(1);

    val1.set(2);

    expect(val1.value).toBe(2);
    expect(val2.value).toBe(1);
    expect(combined.value).toEqual(3);
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

    await nextTick();

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

    await nextTick();

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(1);
    expect(spy4).toHaveBeenCalledTimes(1);

    expect(spy1).lastCalledWith(3);
    expect(spy2).lastCalledWith(4);
    expect(spy3).lastCalledWith(7);
    expect(spy4).lastCalledWith(14);
  });

  it("should combine a val list into a single val", async () => {
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

    val1.set(2);
    await nextTick();
    expect(spy).toBeCalledTimes(2);
    expect(spy.mock.calls[1][0]).toEqual({
      val1: 2,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });

    val1.set(3);
    await nextTick();
    expect(spy).toBeCalledTimes(3);
    expect(spy.mock.calls[2][0]).toEqual({
      val1: 3,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });

    combined.unsubscribe();
  });

  it("should perform custom equal", async () => {
    const val1 = val(1);
    const val2 = val({ code: 2 });
    const val3 = val<boolean>(false);
    const val4 = val<string>("4");
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      },
      { equal: (a, b) => a.val2.code === b.val2.code }
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

    await nextTick();

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
    const spy2 = jest.fn(([value]) => value);
    const spy3 = jest.fn(([value1, value2]) => value1 + value2);
    const spy4 = jest.fn(
      ([value1, value2, value3]) => value1 + value2 + value3
    );
    const val1 = val(1);
    const val2 = combine([val1], spy2);
    const val3 = combine([val1, val2], spy3);
    const val4 = combine([val1, val2, val3], spy4);

    expect(spy2).toBeCalledTimes(0);
    expect(spy3).toBeCalledTimes(0);
    expect(spy4).toBeCalledTimes(0);

    const spy5 = jest.fn();
    val4.reaction(spy5);

    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(1);
    expect(spy4).toBeCalledTimes(1);

    spy2.mockClear();
    spy3.mockClear();
    spy4.mockClear();

    val1.set(2);

    expect(spy2).toBeCalledTimes(0);
    expect(spy3).toBeCalledTimes(0);
    expect(spy4).toBeCalledTimes(0);
    expect(spy5).toBeCalledTimes(0);

    await nextTick();

    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(1);
    expect(spy4).toBeCalledTimes(1);
    expect(spy5).toBeCalledTimes(1);
    expect(spy5).lastCalledWith(8);

    val4.unsubscribe();
  });

  it("should not trigger async subscribers if not changed", async () => {
    const val1 = val({ v: 0 });
    const spyOdd = jest.fn();
    const odd = combine(
      [val1],
      ([value]) => {
        spyOdd(value);
        return { odd: Boolean(value.v % 2) };
      },
      { equal: (a, b) => a.odd === b.odd }
    );

    const spyEven = jest.fn();
    const even = combine(
      [odd],
      ([value]) => {
        spyEven(value);
        return { even: !value.odd };
      },
      { equal: (a, b) => a.even === b.even }
    );

    expect(spyOdd).toBeCalledTimes(0);
    expect(spyEven).toBeCalledTimes(0);

    val1.set({ v: 2 });

    expect(spyOdd).toBeCalledTimes(0);
    expect(spyEven).toBeCalledTimes(0);

    const spySub = jest.fn();
    even.subscribe(spySub);

    expect(spyOdd).toBeCalledTimes(1);
    expect(spyOdd).lastCalledWith({ v: 2 });
    expect(spyEven).toBeCalledTimes(1);
    expect(spyEven).lastCalledWith({ odd: false });
    expect(spySub).toBeCalledTimes(1);
    expect(spySub).lastCalledWith({ even: true });

    spyOdd.mockClear();
    spyEven.mockClear();
    spySub.mockClear();

    val1.set({ v: 4 });

    expect(spyOdd).toBeCalledTimes(0);
    expect(spyEven).toBeCalledTimes(0);
    expect(spySub).toBeCalledTimes(0);

    await nextTick();

    expect(spyOdd).toBeCalledTimes(1);
    expect(spyOdd).lastCalledWith({ v: 4 });
    expect(spyEven).toBeCalledTimes(0);
    expect(spySub).toBeCalledTimes(0);

    spyOdd.mockClear();
    spyEven.mockClear();
    spySub.mockClear();

    val1.set({ v: 3 });

    expect(spyOdd).toBeCalledTimes(0);
    expect(spyEven).toBeCalledTimes(0);
    expect(spySub).toBeCalledTimes(0);

    await nextTick();

    expect(spyOdd).toBeCalledTimes(1);
    expect(spyOdd).lastCalledWith({ v: 3 });
    expect(spyEven).toBeCalledTimes(1);
    expect(spyEven).lastCalledWith({ odd: true });
    expect(spySub).toBeCalledTimes(1);
    expect(spySub).lastCalledWith({ even: false });

    even.unsubscribe();
  });

  it("should not trigger eager subscribers if not changed", async () => {
    const val1 = val({ v: 0 });
    const spyOdd = jest.fn();
    const odd = combine(
      [val1],
      ([value]) => {
        spyOdd(value);
        return { odd: Boolean(value.v % 2) };
      },
      { equal: (a, b) => a.odd === b.odd }
    );

    const spyEven = jest.fn();
    const even = combine(
      [odd],
      ([value]) => {
        spyEven(value);
        return { even: !value.odd };
      },
      { equal: (a, b) => a.even === b.even }
    );

    expect(spyOdd).toBeCalledTimes(0);
    expect(spyEven).toBeCalledTimes(0);

    val1.set({ v: 2 });

    expect(spyOdd).toBeCalledTimes(0);
    expect(spyEven).toBeCalledTimes(0);

    const spySub = jest.fn();
    even.subscribe(spySub, true);

    expect(spyOdd).toBeCalledTimes(1);
    expect(spyOdd).lastCalledWith({ v: 2 });
    expect(spyEven).toBeCalledTimes(1);
    expect(spyEven).lastCalledWith({ odd: false });
    expect(spySub).toBeCalledTimes(1);
    expect(spySub).lastCalledWith({ even: true });

    spyOdd.mockClear();
    spyEven.mockClear();
    spySub.mockClear();

    val1.set({ v: 4 });

    expect(spyOdd).toBeCalledTimes(1);
    expect(spyOdd).lastCalledWith({ v: 4 });
    expect(spyEven).toBeCalledTimes(0);
    expect(spySub).toBeCalledTimes(0);

    spyOdd.mockClear();
    spyEven.mockClear();
    spySub.mockClear();

    val1.set({ v: 3 });

    expect(spyOdd).toBeCalledTimes(1);
    expect(spyOdd).lastCalledWith({ v: 3 });
    expect(spyEven).toBeCalledTimes(1);
    expect(spyEven).lastCalledWith({ odd: true });
    expect(spySub).toBeCalledTimes(1);
    expect(spySub).lastCalledWith({ even: false });

    even.unsubscribe();
  });

  it("should update combined value if changed before first subscription", () => {
    const val1 = val(1);
    const val2 = val(1);
    const combined = combine([val1, val2], ([val1, val2]) => val1 + val2);

    expect(combined.value).toBe(2);

    val1.set(2);

    const spy = jest.fn();
    combined.subscribe(spy);

    expect(spy).lastCalledWith(3);
    expect(combined.value).toBe(3);
  });

  it("should react combined value if changed before first subscription", async () => {
    const val1 = val(1);
    const val2 = val(1);
    const combined = combine([val1, val2], ([val1, val2]) => val1 + val2);

    expect(combined.value).toBe(2);

    const spy = jest.fn();
    combined.reaction(spy);

    val1.set(2);

    expect(spy).toBeCalledTimes(0);

    await nextTick();

    expect(spy).lastCalledWith(3);
    expect(combined.value).toBe(3);
  });

  it("should trigger subscribers after dirty value is cleared", async () => {
    const val1 = val(1);
    const odd = combine([val1], ([value]) => Boolean(value % 2));
    const even = combine([odd], ([value]) => !value);

    const spy = jest.fn();
    even.reaction(spy);

    spy.mockClear();

    val1.set(2);
    expect(even.value).toBe(true);
    val1.set(4);
    expect(even.value).toBe(true);

    await nextTick();

    expect(spy).toBeCalledTimes(1);
    expect(spy).lastCalledWith(true);
  });

  it("should trigger combine when emit values during subscribe", async () => {
    const val1 = val(1);
    const val2 = val(2);

    const combined = combine([val1, val2]);

    const spy = jest.fn();
    combined.subscribe(() => {
      val1.set(999);
      spy();
    });

    expect(spy).toBeCalledTimes(1);

    await nextTick();
    expect(spy).toBeCalledTimes(2);

    val1.set(2);
    val2.set(3);

    await nextTick();
    expect(spy).toBeCalledTimes(3);

    val1.set(3);
    val2.set(4);

    await nextTick();
    expect(spy).toBeCalledTimes(4);
  });
});
