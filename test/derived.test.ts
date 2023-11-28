import { describe, expect, it, jest } from "@jest/globals";
import { derive, val } from "../src";

describe("derive", () => {
  it("should lazy-calculate value", () => {
    const spy = jest.fn(value => value);
    const val1 = val(1);
    const derived = derive(val1, spy);

    expect(spy).toBeCalledTimes(0);

    val1.set(2);

    expect(spy).toBeCalledTimes(0);

    expect(derived.value).toEqual(2);

    expect(spy).toBeCalledTimes(1);
  });

  it("should not trigger transform if upstream not changed", () => {
    const spy = jest.fn(value => value);
    const val1 = val(1);
    const derived = derive(val1, spy);

    expect(spy).toBeCalledTimes(0);

    expect(val1.value).toBe(1);
    expect(derived.value).toBe(1);
    expect(spy).toBeCalledTimes(1);

    expect(val1.value).toBe(1);
    expect(derived.value).toBe(1);
    expect(spy).toBeCalledTimes(1);

    val1.set(1);

    expect(val1.value).toBe(1);
    expect(derived.value).toBe(1);
    expect(spy).toBeCalledTimes(1);

    expect(val1.value).toBe(1);
    expect(derived.value).toBe(1);
    expect(spy).toBeCalledTimes(1);

    val1.set(2);

    expect(val1.value).toBe(2);
    expect(derived.value).toEqual(2);
    expect(spy).toBeCalledTimes(2);
  });

  it("should subscribe", async () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();
    const spy4 = jest.fn();
    const val1 = val(1);
    const val2 = derive(val1, v1 => v1 + 1);
    const val3 = derive(val2, v2 => v2 + 1);
    const val4 = derive(val3, v3 => v3 + 1);

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
    expect(spy4).lastCalledWith(4);

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
    expect(spy3).lastCalledWith(4);
    expect(spy4).lastCalledWith(5);

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
    expect(spy3).lastCalledWith(5);
    expect(spy4).lastCalledWith(6);
  });

  it("should get value without subscribe", () => {
    const val1 = val(1);
    const derived = derive(val1, value => value + 1);

    expect(derived.value).toBe(2);

    val1.set(1);

    expect(derived.value).toEqual(2);

    val1.set(2);

    expect(derived.value).toEqual(3);

    derived.subscribe(jest.fn());

    expect(derived.value).toEqual(3);

    derived.unsubscribe();
  });

  it("should derive a val into a derived val", () => {
    const val1 = val(1);
    const derived = derive(val1, value => value + 1);

    const spy = jest.fn();
    derived.subscribe(spy);

    expect(spy).toBeCalledTimes(1);
    expect(spy).lastCalledWith(2);

    derived.unsubscribe();
  });

  it("should have meta from deps", async () => {
    const val1 = val(1);
    const derived = derive(val1, value => value + 1);

    const spy = jest.fn();
    derived.subscribe(spy);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(2);

    val1.set(88);
    expect(spy).toBeCalledTimes(1);

    await Promise.resolve();

    expect(spy).toBeCalledTimes(2);
    expect(spy).toBeCalledWith(89);

    derived.unsubscribe();
  });

  it("should perform custom equal", async () => {
    const val1 = val({ code: 2 });
    const derived = derive(
      val1,
      value => {
        return { content: String(value.code) };
      },
      { equal: (a, b) => a.content === b.content }
    );

    const sub = jest.fn();
    derived.subscribe(sub);

    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ content: "2" });

    sub.mockClear();

    const sub1 = jest.fn();
    val1.reaction(sub1);
    expect(sub1).toBeCalledTimes(0);

    val1.set({ code: 2 });
    expect(sub1).toBeCalledTimes(0);
    expect(sub).toBeCalledTimes(0);

    await Promise.resolve();

    expect(sub).toBeCalledTimes(0);
    expect(sub1).toBeCalledTimes(1);
    expect(sub1).lastCalledWith({ code: 2 });

    sub.mockClear();
    sub1.mockClear();

    val1.set({ code: 3 });
    await Promise.resolve();
    expect(sub).toBeCalledTimes(1);
    expect(sub1).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ content: "3" });
    expect(sub1).lastCalledWith({ code: 3 });

    derived.unsubscribe();
  });

  it("should work without transform", () => {
    const val1 = val(1);
    const derived = derive(val1);

    expect(derived.value).toBe(1);

    val1.set(1);

    expect(derived.value).toEqual(1);

    val1.set(2);

    expect(derived.value).toEqual(2);

    derived.unsubscribe();
  });

  it("should not trigger async subscribers if not changed", async () => {
    const val1 = val({ v: 0 });
    const spyOdd = jest.fn();
    const odd = derive(
      val1,
      value => {
        spyOdd(value);
        return { odd: Boolean(value.v % 2) };
      },
      { equal: (a, b) => a.odd === b.odd }
    );

    const spyEven = jest.fn();
    const even = derive(
      odd,
      value => {
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

    await Promise.resolve();

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

    await Promise.resolve();

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
    const odd = derive(
      val1,
      value => {
        spyOdd(value);
        return { odd: Boolean(value.v % 2) };
      },
      { equal: (a, b) => a.odd === b.odd }
    );

    const spyEven = jest.fn();
    const even = derive(
      odd,
      value => {
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

  it("should update derived value if changed before first subscription", () => {
    const val1 = val(1);
    const derived = derive(val1, value => value + 1);

    expect(derived.value).toBe(2);

    val1.set(2);

    const spy = jest.fn();
    derived.subscribe(spy);

    expect(spy).lastCalledWith(3);
    expect(derived.value).toEqual(3);

    derived.unsubscribe();
  });

  it("should reaction derived value if changed before first subscription", async () => {
    const val1 = val(1);
    const derived = derive(val1, value => value + 1);

    expect(derived.value).toBe(2);

    const spy = jest.fn();
    derived.reaction(spy);

    val1.set(2);

    expect(spy).toBeCalledTimes(0);

    await Promise.resolve();

    expect(spy).lastCalledWith(3);
    expect(derived.value).toEqual(3);

    derived.unsubscribe();
  });

  it("should trigger transform only once for async subscribers", async () => {
    const val1 = val(1);
    const spy = jest.fn();
    const derived = derive(val1, value => {
      spy(value);
      return value + 1;
    });

    const spy2 = jest.fn();
    const derived2 = derive(derived, value => {
      spy2(value);
      return value + 1;
    });

    expect(spy).toBeCalledTimes(0);
    expect(spy2).toBeCalledTimes(0);

    val1.set(2);

    expect(spy).toBeCalledTimes(0);
    expect(spy2).toBeCalledTimes(0);

    const spy3 = jest.fn();
    derived2.subscribe(spy3);

    expect(spy3).toBeCalledTimes(1);
    expect(spy3).lastCalledWith(4);

    expect(spy).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy).lastCalledWith(2);
    expect(spy2).lastCalledWith(3);

    spy.mockClear();
    spy2.mockClear();
    spy3.mockClear();

    val1.set(3);

    expect(spy3).toBeCalledTimes(0);

    expect(spy).toBeCalledTimes(0);
    expect(spy2).toBeCalledTimes(0);

    await Promise.resolve();

    expect(spy3).toBeCalledTimes(1);
    expect(spy3).lastCalledWith(5);

    expect(spy).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy).lastCalledWith(3);
    expect(spy2).lastCalledWith(4);

    derived2.unsubscribe();
  });

  it("should trigger transform only once for eager subscribers", async () => {
    const val1 = val(1);
    const spy = jest.fn();
    const derived = derive(val1, value => {
      spy(value);
      return value + 1;
    });

    const spy2 = jest.fn();
    const derived2 = derive(derived, value => {
      spy2(value);
      return value + 1;
    });

    expect(spy).toBeCalledTimes(0);
    expect(spy2).toBeCalledTimes(0);

    val1.set(2);

    expect(spy).toBeCalledTimes(0);
    expect(spy2).toBeCalledTimes(0);

    const spy3 = jest.fn();
    derived2.subscribe(spy3, true);

    expect(spy3).toBeCalledTimes(1);
    expect(spy3).lastCalledWith(4);

    expect(spy).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy).lastCalledWith(2);
    expect(spy2).lastCalledWith(3);

    spy.mockClear();
    spy2.mockClear();
    spy3.mockClear();

    val1.set(3);

    expect(spy3).toBeCalledTimes(1);
    expect(spy3).lastCalledWith(5);

    expect(spy).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy).lastCalledWith(3);
    expect(spy2).lastCalledWith(4);

    derived2.unsubscribe();
  });

  it("should trigger subscribers after dirty value is cleared", async () => {
    const val1 = val(1);
    const odd = derive(val1, value => Boolean(value % 2));
    const even = derive(odd, value => !value);

    const spy = jest.fn();
    even.reaction(spy);

    spy.mockClear();

    val1.set(2);
    expect(even.value).toBe(true);
    val1.set(4);
    expect(even.value).toBe(true);

    await Promise.resolve();

    expect(spy).toBeCalledTimes(1);
    expect(spy).lastCalledWith(true);
  });
});
