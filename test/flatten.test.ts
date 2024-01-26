import { describe, expect, it, jest } from "@jest/globals";
import { combine, derive, flatten, identity, nextTick, val } from "../src";

describe("flatten", () => {
  it("should flatten value", () => {
    const inner$ = val(1);
    const outer$ = val(inner$);
    const flattened$ = flatten(outer$);

    expect(inner$.value).toBe(1);
    expect(flattened$.value).toBe(1);

    inner$.set(2);

    expect(inner$.value).toBe(2);
    expect(flattened$.value).toBe(2);

    outer$.set(val(3));

    expect(inner$.value).toBe(2);
    expect(flattened$.value).toBe(3);
  });

  it("should flatten value from custom path", () => {
    const inner$ = val(1);
    const outer$ = val({ inner: inner$ });
    const flattened$ = flatten(outer$, ({ inner }) => inner);

    expect(inner$.value).toBe(1);
    expect(flattened$.value).toBe(1);

    inner$.set(2);

    expect(inner$.value).toBe(2);
    expect(flattened$.value).toBe(2);

    outer$.set({ inner: val(3) });

    expect(inner$.value).toBe(2);
    expect(flattened$.value).toBe(3);
  });

  it("should flatten normal value", () => {
    const inner$ = val(1);
    const outer$ = val({ inner: inner$ });
    const flattened$ = flatten(outer$, ({ inner }) =>
      inner.value % 2 === 0 ? inner : null
    );

    expect(inner$.value).toBe(1);
    expect(flattened$.value).toBe(null);

    inner$.set(2);

    expect(inner$.value).toBe(2);
    expect(flattened$.value).toBe(2);

    outer$.set({ inner: val(3) });

    expect(inner$.value).toBe(2);
    expect(flattened$.value).toBe(null);
  });

  it("should subscribe", async () => {
    const spy = jest.fn();
    const val1 = val(1);
    const val2 = val(val1);
    const val3 = val(val2);
    const val4 = val(val3);

    const flattened = flatten(flatten(flatten(val4)));

    flattened.subscribe(spy);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).lastCalledWith(1);

    spy.mockClear();

    val1.set(1);

    expect(spy).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spy).toHaveBeenCalledTimes(0);

    val1.set(2);

    expect(spy).toHaveBeenCalledTimes(0);

    await nextTick();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).lastCalledWith(2);

    spy.mockClear();

    val1.set(3);

    expect(spy).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).lastCalledWith(3);

    spy.mockClear();

    val4.set(val(val(val(9))));

    expect(spy).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).lastCalledWith(9);

    flattened.unsubscribe();
  });

  it("should subscribe if first emitted value is normal value", async () => {
    const spy = jest.fn();
    const inner$ = val("inner");
    const outer$ = val(1);
    const flattened$ = flatten(outer$, outer =>
      outer % 2 === 0 ? inner$ : null
    );

    flattened$.subscribe(spy);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).lastCalledWith(null);

    spy.mockClear();

    outer$.set(1);

    expect(spy).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spy).toHaveBeenCalledTimes(0);

    outer$.set(3);

    expect(spy).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spy).toHaveBeenCalledTimes(0);

    outer$.set(2);

    expect(spy).toHaveBeenCalledTimes(0);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).lastCalledWith("inner");

    flattened$.unsubscribe();
  });

  it("should perform custom equal", async () => {
    const val1 = val({ code: 2 });
    const val2 = val(val1);
    const flattened = flatten(val2, identity, {
      equal: (a, b) => a.code === b.code,
    });

    const sub = jest.fn();
    flattened.subscribe(sub);

    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ code: 2 });

    sub.mockClear();

    const sub1 = jest.fn();
    val1.reaction(sub1);
    expect(sub1).toBeCalledTimes(0);

    val1.set({ code: 2 });
    expect(sub1).toBeCalledTimes(0);
    expect(sub).toBeCalledTimes(0);

    await nextTick();

    expect(sub).toBeCalledTimes(0);
    expect(sub1).toBeCalledTimes(1);
    expect(sub1).lastCalledWith({ code: 2 });

    sub.mockClear();
    sub1.mockClear();

    val1.set({ code: 3 });
    await nextTick();
    expect(sub).toBeCalledTimes(1);
    expect(sub1).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ code: 3 });
    expect(sub1).lastCalledWith({ code: 3 });

    flattened.unsubscribe();
  });

  it("should update value if changed before first subscription", () => {
    const val1 = val(1);
    const val2 = val(val1);
    const flattened = flatten(val2);

    expect(flattened.value).toBe(1);

    val1.set(2);

    const spy = jest.fn();
    flattened.subscribe(spy);

    expect(spy).lastCalledWith(2);
    expect(flattened.value).toEqual(2);

    flattened.unsubscribe();
  });

  it("should reaction derived value if changed before first subscription", async () => {
    const val1 = val(1);
    const val2 = val(val1);
    const flattened = flatten(val2);

    expect(flattened.value).toBe(1);

    const spy = jest.fn();
    flattened.reaction(spy);

    val1.set(2);

    expect(spy).toBeCalledTimes(0);

    await nextTick();

    expect(spy).lastCalledWith(2);
    expect(flattened.value).toEqual(2);

    flattened.unsubscribe();
  });

  it("should trigger subscribers after dirty value is cleared", async () => {
    const val1 = val(1);
    const val2 = derive(val1, v => val(v + 1));
    const val3 = derive(val2, v => val(v));
    const flattened = flatten(flatten(val3));

    const spy = jest.fn();
    flattened.reaction(spy);

    spy.mockClear();

    val1.set(2);
    expect(flattened.value).toBe(3);
    val1.set(4);
    expect(flattened.value).toBe(5);

    await nextTick();

    expect(spy).toBeCalledTimes(1);
    expect(spy).lastCalledWith(5);
  });

  it("should flatten combined val", async () => {
    const vals = [val(1), val(2), val(3)];
    const signal = val(null, { equal: () => false });
    const countSpy = jest.fn();
    const flattened = flatten(signal, () => {
      countSpy();
      return combine([...vals]);
    });

    expect(countSpy).toHaveBeenCalledTimes(0);

    const spy = jest.fn();
    flattened.subscribe(spy, true);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(countSpy).toHaveBeenCalledTimes(1);

    vals[0].set(4);
    expect(spy).toHaveBeenCalledTimes(2);

    vals[0].set(5);
    expect(spy).toHaveBeenCalledTimes(3);

    expect(countSpy).toHaveBeenCalledTimes(1);
  });
});
