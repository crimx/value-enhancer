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
    // flatten transform returns null last time so inner value is not subscribed
    expect(flattened$.value).toBe(null);

    outer$.set({ inner: val(3) });

    expect(inner$.value).toBe(2);
    expect(flattened$.value).toBe(null);

    outer$.set({ inner: val(4) });

    expect(inner$.value).toBe(2);
    expect(flattened$.value).toBe(4);
  });

  it("should subscribe", async () => {
    const spySubscribe = jest.fn();
    const v1$ = val(1);
    const v2$ = val(v1$);
    const v3$ = val(v2$);
    const v4$ = val(v3$);

    const flattened$ = flatten(flatten(flatten(v4$)));

    flattened$.subscribe(spySubscribe);

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(1);

    spySubscribe.mockClear();

    v1$.set(1);

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    v1$.set(2);

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(2);

    spySubscribe.mockClear();

    v1$.set(3);

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(3);

    spySubscribe.mockClear();

    v4$.set(val(val(val(9))));

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(9);

    flattened$.unsubscribe();
  });

  it("should subscribe if first emitted value is normal value", async () => {
    const spySubscribe = jest.fn();
    const inner$ = val("inner");
    const outer$ = val(1);
    const flattened$ = flatten(outer$, outer =>
      outer % 2 === 0 ? inner$ : null
    );

    flattened$.subscribe(spySubscribe);

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(null);

    spySubscribe.mockClear();

    outer$.set(1);

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    outer$.set(3);

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    outer$.set(2);

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith("inner");

    flattened$.unsubscribe();
  });

  it("should perform custom equal", async () => {
    const v1$ = val({ code: 2 });
    const v2$ = val(v1$);
    const flattened$ = flatten(v2$, identity, {
      equal: (a, b) => a.code === b.code,
    });

    const spySubscribe = jest.fn();
    flattened$.subscribe(spySubscribe);

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ code: 2 });

    spySubscribe.mockClear();

    const spyReaction = jest.fn();
    v1$.reaction(spyReaction);
    expect(spyReaction).toBeCalledTimes(0);

    v1$.set({ code: 2 });
    expect(spyReaction).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(0);
    expect(spyReaction).toBeCalledTimes(1);
    expect(spyReaction).lastCalledWith({ code: 2 });

    spySubscribe.mockClear();
    spyReaction.mockClear();

    v1$.set({ code: 3 });
    await nextTick();
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spyReaction).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ code: 3 });
    expect(spyReaction).lastCalledWith({ code: 3 });

    flattened$.unsubscribe();
  });

  it("should update value if changed before first subscription", () => {
    const v1$ = val(1);
    const v2$ = val(v1$);
    const flattened$ = flatten(v2$);

    expect(flattened$.value).toBe(1);

    v1$.set(2);

    const spySubscribe = jest.fn();
    flattened$.subscribe(spySubscribe);

    expect(spySubscribe).lastCalledWith(2);
    expect(flattened$.value).toEqual(2);

    flattened$.unsubscribe();
  });

  it("should reaction derived value if changed before first subscription", async () => {
    const v1$ = val(1);
    const v2$ = val(v1$);
    const flattened$ = flatten(v2$);

    expect(flattened$.value).toBe(1);

    const spyReaction = jest.fn();
    flattened$.reaction(spyReaction);

    v1$.set(2);

    expect(spyReaction).toBeCalledTimes(0);

    await nextTick();

    expect(spyReaction).lastCalledWith(2);
    expect(flattened$.value).toEqual(2);

    flattened$.unsubscribe();
  });

  it("should trigger subscribers after dirty value is cleared", async () => {
    const v1$ = val(1);
    const v2$ = derive(v1$, v => val(v + 1));
    const v3$ = derive(v2$, v => val(v));
    const flattened$ = flatten(flatten(v3$));

    const spyReaction = jest.fn();
    flattened$.reaction(spyReaction);

    spyReaction.mockClear();

    v1$.set(2);
    expect(flattened$.value).toBe(3);
    v1$.set(4);
    expect(flattened$.value).toBe(5);

    await nextTick();

    expect(spyReaction).toBeCalledTimes(1);
    expect(spyReaction).lastCalledWith(5);
  });

  it("should flatten combined val", async () => {
    const vals = [val(1), val(2), val(3)];
    const signal$ = val(null, { equal: () => false });
    const spyTransform = jest.fn();
    const flattened$ = flatten(signal$, () => {
      spyTransform();
      return combine([...vals]);
    });

    expect(spyTransform).toHaveBeenCalledTimes(1);

    spyTransform.mockClear();

    const spySubscribe = jest.fn();
    flattened$.subscribe(spySubscribe, true);
    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spyTransform).toHaveBeenCalledTimes(0);

    vals[0].set(4);
    expect(spySubscribe).toHaveBeenCalledTimes(2);

    vals[0].set(5);
    expect(spySubscribe).toHaveBeenCalledTimes(3);

    expect(spyTransform).toHaveBeenCalledTimes(0);
  });
});
