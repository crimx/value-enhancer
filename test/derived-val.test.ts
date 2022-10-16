import { describe, it, expect, jest } from "@jest/globals";
import { derive, val } from "../src";

describe("derive", () => {
  it("should lazy-calculate value", () => {
    const spy = jest.fn(value => value);
    const val1 = val(1);
    const combined = derive(val1, spy);

    expect(spy).toBeCalledTimes(0);

    val1.set(2);

    expect(spy).toBeCalledTimes(0);

    expect(combined.value).toEqual(2);

    expect(spy).toBeCalledTimes(1);
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

  it("should perform custom compare", async () => {
    const val1 = val({ code: 2 });
    const derived = derive(
      val1,
      value => {
        return { content: String(value.code) };
      },
      { compare: (a, b) => a.content === b.content }
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
});
