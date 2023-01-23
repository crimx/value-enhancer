import { describe, it, expect, jest } from "@jest/globals";
import { derive, unwrap, val } from "../src";

describe("unwrap", () => {
  it("should unwrap value", () => {
    const inner$ = val(1);
    const outer$ = val(inner$);
    const unwrapped$ = unwrap(outer$);

    expect(inner$.value).toBe(1);
    expect(unwrapped$.value).toBe(1);

    inner$.set(2);

    expect(inner$.value).toBe(2);
    expect(unwrapped$.value).toBe(2);

    outer$.set(val(3));

    expect(inner$.value).toBe(2);
    expect(unwrapped$.value).toBe(3);
  });

  it("should subscribe", async () => {
    const spy = jest.fn();
    const val1 = val(1);
    const val2 = val(val1);
    const val3 = val(val2);
    const val4 = val(val3);

    const unwrapped = unwrap(unwrap(unwrap(val4)));

    unwrapped.subscribe(spy);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).lastCalledWith(1);

    spy.mockClear();

    val1.set(1);

    expect(spy).toHaveBeenCalledTimes(0);

    await Promise.resolve();

    expect(spy).toHaveBeenCalledTimes(0);

    val1.set(2);

    expect(spy).toHaveBeenCalledTimes(0);

    await Promise.resolve();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).lastCalledWith(2);

    spy.mockClear();

    val1.set(3);

    expect(spy).toHaveBeenCalledTimes(0);

    await Promise.resolve();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).lastCalledWith(3);

    spy.mockClear();

    val4.set(val(val(val(9))));

    expect(spy).toHaveBeenCalledTimes(0);

    await Promise.resolve();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).lastCalledWith(9);

    unwrapped.unsubscribe();
  });

  it("should perform custom compare", async () => {
    const val1 = val({ code: 2 });
    const val2 = val(val1);
    const unwrapped = unwrap(val2, { compare: (a, b) => a.code === b.code });

    const sub = jest.fn();
    unwrapped.subscribe(sub);

    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ code: 2 });

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
    expect(sub).lastCalledWith({ code: 3 });
    expect(sub1).lastCalledWith({ code: 3 });

    unwrapped.unsubscribe();
  });

  it("should update value if changed before first subscription", () => {
    const val1 = val(1);
    const val2 = val(val1);
    const unwrapped = unwrap(val2);

    expect(unwrapped.value).toBe(1);

    val1.set(2);

    const spy = jest.fn();
    unwrapped.subscribe(spy);

    expect(spy).lastCalledWith(2);
    expect(unwrapped.value).toEqual(2);

    unwrapped.unsubscribe();
  });

  it("should reaction derived value if changed before first subscription", async () => {
    const val1 = val(1);
    const val2 = val(val1);
    const unwrapped = unwrap(val2);

    expect(unwrapped.value).toBe(1);

    const spy = jest.fn();
    unwrapped.reaction(spy);

    val1.set(2);

    expect(spy).toBeCalledTimes(0);

    await Promise.resolve();

    expect(spy).lastCalledWith(2);
    expect(unwrapped.value).toEqual(2);

    unwrapped.unsubscribe();
  });

  it("should trigger subscribers after dirty value is cleared", async () => {
    const val1 = val(1);
    const val2 = derive(val1, v => val(v + 1));
    const val3 = derive(val2, v => val(v));
    const unwrapped = unwrap(unwrap(val3));

    const spy = jest.fn();
    unwrapped.reaction(spy);

    spy.mockClear();

    val1.set(2);
    expect(unwrapped.value).toBe(3);
    val1.set(4);
    expect(unwrapped.value).toBe(5);

    await Promise.resolve();

    expect(spy).toBeCalledTimes(1);
    expect(spy).lastCalledWith(5);
  });
});
