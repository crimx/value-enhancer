import { describe, expect, it, jest } from "@jest/globals";
import { derive, nextTick, val } from "../src";

describe("derive", () => {
  it("should not trigger transform if upstream not changed", async () => {
    const spyTransform = jest.fn(value => value);
    const v$ = val(1);
    const derived$ = derive(v$, spyTransform);

    expect(spyTransform).toBeCalledTimes(1);

    spyTransform.mockClear();

    expect(v$.value).toBe(1);
    expect(derived$.value).toBe(1);
    expect(spyTransform).toBeCalledTimes(0);

    spyTransform.mockClear();

    expect(v$.value).toBe(1);
    expect(derived$.value).toBe(1);
    expect(spyTransform).toBeCalledTimes(0);

    spyTransform.mockClear();
    v$.set(1);

    expect(v$.value).toBe(1);
    expect(derived$.value).toBe(1);
    expect(spyTransform).toBeCalledTimes(0);

    spyTransform.mockClear();

    expect(v$.value).toBe(1);
    expect(derived$.value).toBe(1);
    expect(spyTransform).toBeCalledTimes(0);

    spyTransform.mockClear();
    v$.set(2);

    expect(v$.value).toBe(2);
    expect(derived$.value).toEqual(2);
    expect(spyTransform).toBeCalledTimes(1);

    spyTransform.mockClear();

    const subSpy = jest.fn();
    derived$.subscribe(subSpy);

    expect(v$.value).toBe(2);
    expect(derived$.value).toEqual(2);
    expect(spyTransform).toBeCalledTimes(0);
    expect(subSpy).toBeCalledTimes(1);
    expect(subSpy).lastCalledWith(2);

    subSpy.mockClear();
    spyTransform.mockClear();
    v$.set(2);

    expect(v$.value).toBe(2);
    expect(derived$.value).toEqual(2);
    expect(spyTransform).toBeCalledTimes(0);
    expect(subSpy).toBeCalledTimes(0);
  });

  it("should subscribe", async () => {
    const spy1Subscribe = jest.fn();
    const spy2Subscribe = jest.fn();
    const spy3Subscribe = jest.fn();
    const spy4Subscribe = jest.fn();
    const val1$ = val(1);
    const val2$ = derive(val1$, v1 => v1 + 1);
    const val3$ = derive(val2$, v2 => v2 + 1);
    const val4$ = derive(val3$, v3 => v3 + 1);

    val1$.subscribe(spy1Subscribe);
    val2$.subscribe(spy2Subscribe);
    val3$.subscribe(spy3Subscribe);
    val4$.subscribe(spy4Subscribe);

    expect(spy1Subscribe).toHaveBeenCalledTimes(1);
    expect(spy2Subscribe).toHaveBeenCalledTimes(1);
    expect(spy3Subscribe).toHaveBeenCalledTimes(1);
    expect(spy4Subscribe).toHaveBeenCalledTimes(1);

    expect(spy1Subscribe).lastCalledWith(1);
    expect(spy2Subscribe).lastCalledWith(2);
    expect(spy3Subscribe).lastCalledWith(3);
    expect(spy4Subscribe).lastCalledWith(4);

    spy1Subscribe.mockClear();
    spy2Subscribe.mockClear();
    spy3Subscribe.mockClear();
    spy4Subscribe.mockClear();

    val1$.set(1);

    expect(spy1Subscribe).toHaveBeenCalledTimes(0);
    expect(spy2Subscribe).toHaveBeenCalledTimes(0);
    expect(spy3Subscribe).toHaveBeenCalledTimes(0);
    expect(spy4Subscribe).toHaveBeenCalledTimes(0);

    val1$.set(2);

    expect(spy1Subscribe).toHaveBeenCalledTimes(0);
    expect(spy2Subscribe).toHaveBeenCalledTimes(0);
    expect(spy3Subscribe).toHaveBeenCalledTimes(0);
    expect(spy4Subscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spy1Subscribe).toHaveBeenCalledTimes(1);
    expect(spy2Subscribe).toHaveBeenCalledTimes(1);
    expect(spy3Subscribe).toHaveBeenCalledTimes(1);
    expect(spy4Subscribe).toHaveBeenCalledTimes(1);

    expect(spy1Subscribe).lastCalledWith(2);
    expect(spy2Subscribe).lastCalledWith(3);
    expect(spy3Subscribe).lastCalledWith(4);
    expect(spy4Subscribe).lastCalledWith(5);

    spy1Subscribe.mockClear();
    spy2Subscribe.mockClear();
    spy3Subscribe.mockClear();
    spy4Subscribe.mockClear();

    val1$.set(3);

    expect(spy1Subscribe).toHaveBeenCalledTimes(0);
    expect(spy2Subscribe).toHaveBeenCalledTimes(0);
    expect(spy3Subscribe).toHaveBeenCalledTimes(0);
    expect(spy4Subscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spy1Subscribe).toHaveBeenCalledTimes(1);
    expect(spy2Subscribe).toHaveBeenCalledTimes(1);
    expect(spy3Subscribe).toHaveBeenCalledTimes(1);
    expect(spy4Subscribe).toHaveBeenCalledTimes(1);

    expect(spy1Subscribe).lastCalledWith(3);
    expect(spy2Subscribe).lastCalledWith(4);
    expect(spy3Subscribe).lastCalledWith(5);
    expect(spy4Subscribe).lastCalledWith(6);
  });

  it("should get value without subscribe", () => {
    const val1$ = val(1);
    const derived$ = derive(val1$, value => value + 1);

    expect(derived$.value).toBe(2);

    val1$.set(1);

    expect(derived$.value).toEqual(2);

    val1$.set(2);

    expect(derived$.value).toEqual(3);

    derived$.subscribe(jest.fn());

    expect(derived$.value).toEqual(3);

    derived$.unsubscribe();
  });

  it("should derive a val into a derived val", () => {
    const v$ = val(1);
    const derived$ = derive(v$, value => value + 1);

    const spyDerivedSubscribe = jest.fn();
    derived$.subscribe(spyDerivedSubscribe);

    expect(spyDerivedSubscribe).toBeCalledTimes(1);
    expect(spyDerivedSubscribe).lastCalledWith(2);

    derived$.unsubscribe();
  });

  it("should have meta from deps", async () => {
    const v$ = val(1);
    const derived$ = derive(v$, value => value + 1);

    const spyDerivedSubscribe = jest.fn();
    derived$.subscribe(spyDerivedSubscribe);

    expect(spyDerivedSubscribe).toBeCalledTimes(1);
    expect(spyDerivedSubscribe).toBeCalledWith(2);

    v$.set(88);
    expect(spyDerivedSubscribe).toBeCalledTimes(1);

    await nextTick();

    expect(spyDerivedSubscribe).toBeCalledTimes(2);
    expect(spyDerivedSubscribe).toBeCalledWith(89);

    derived$.unsubscribe();
  });

  it("should perform custom equal", async () => {
    const v$ = val({ code: 2 });
    const derived$ = derive(
      v$,
      value => {
        return { content: String(value.code) };
      },
      { equal: (a, b) => a.content === b.content }
    );

    const spyDerivedSubscribe = jest.fn();
    derived$.subscribe(spyDerivedSubscribe);

    expect(spyDerivedSubscribe).toBeCalledTimes(1);
    expect(spyDerivedSubscribe).lastCalledWith({ content: "2" });

    spyDerivedSubscribe.mockClear();

    const spyValReaction = jest.fn();
    v$.reaction(spyValReaction);
    expect(spyValReaction).toBeCalledTimes(0);

    v$.set({ code: 2 });
    expect(spyValReaction).toBeCalledTimes(0);
    expect(spyDerivedSubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spyDerivedSubscribe).toBeCalledTimes(0);
    expect(spyValReaction).toBeCalledTimes(1);
    expect(spyValReaction).lastCalledWith({ code: 2 });

    spyDerivedSubscribe.mockClear();
    spyValReaction.mockClear();

    v$.set({ code: 3 });
    await nextTick();
    expect(spyDerivedSubscribe).toBeCalledTimes(1);
    expect(spyDerivedSubscribe).lastCalledWith({ content: "3" });
    expect(spyValReaction).toBeCalledTimes(1);
    expect(spyValReaction).lastCalledWith({ code: 3 });

    derived$.unsubscribe();
  });

  it("should work without transform", () => {
    const v$ = val(1);
    const derived$ = derive(v$);

    expect(derived$.value).toBe(1);

    v$.set(1);

    expect(derived$.value).toEqual(1);

    v$.set(2);

    expect(derived$.value).toEqual(2);

    derived$.unsubscribe();
  });

  it("should not trigger async subscribers if not changed", async () => {
    const v$ = val({ v: 0 });
    const spyOddTransform = jest.fn();
    const odd$ = derive(
      v$,
      value => {
        spyOddTransform(value);
        return { odd: Boolean(value.v % 2) };
      },
      { equal: (a, b) => a.odd === b.odd }
    );

    const spyEvenTransform = jest.fn();
    const even$ = derive(
      odd$,
      value => {
        spyEvenTransform(value);
        return { even: !value.odd };
      },
      { equal: (a, b) => a.even === b.even }
    );

    expect(spyOddTransform).toBeCalledTimes(1);
    expect(spyEvenTransform).toBeCalledTimes(1);

    spyOddTransform.mockClear();
    spyEvenTransform.mockClear();

    v$.set({ v: 2 });

    expect(spyOddTransform).toBeCalledTimes(0);
    expect(spyEvenTransform).toBeCalledTimes(0);

    const spyEvenSubscribe = jest.fn();
    even$.subscribe(spyEvenSubscribe);

    expect(spyOddTransform).toBeCalledTimes(1);
    expect(spyOddTransform).lastCalledWith({ v: 2 });
    expect(spyEvenTransform).toBeCalledTimes(0);
    expect(spyEvenSubscribe).toBeCalledTimes(1);
    expect(spyEvenSubscribe).lastCalledWith({ even: true });

    spyOddTransform.mockClear();
    spyEvenTransform.mockClear();
    spyEvenSubscribe.mockClear();

    v$.set({ v: 4 });

    expect(spyOddTransform).toBeCalledTimes(0);
    expect(spyEvenTransform).toBeCalledTimes(0);
    expect(spyEvenSubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spyOddTransform).toBeCalledTimes(1);
    expect(spyOddTransform).lastCalledWith({ v: 4 });
    expect(spyEvenTransform).toBeCalledTimes(0);
    expect(spyEvenSubscribe).toBeCalledTimes(0);

    spyOddTransform.mockClear();
    spyEvenTransform.mockClear();
    spyEvenSubscribe.mockClear();

    v$.set({ v: 3 });

    expect(spyOddTransform).toBeCalledTimes(0);
    expect(spyEvenTransform).toBeCalledTimes(0);
    expect(spyEvenSubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spyOddTransform).toBeCalledTimes(1);
    expect(spyOddTransform).lastCalledWith({ v: 3 });
    expect(spyEvenTransform).toBeCalledTimes(1);
    expect(spyEvenTransform).lastCalledWith({ odd: true });
    expect(spyEvenSubscribe).toBeCalledTimes(1);
    expect(spyEvenSubscribe).lastCalledWith({ even: false });

    even$.unsubscribe();
  });

  it("should not trigger eager subscribers if not changed", async () => {
    const v$ = val({ v: 0 });
    const spyOddTransform = jest.fn();
    const odd$ = derive(
      v$,
      value => {
        spyOddTransform(value);
        return { odd: Boolean(value.v % 2) };
      },
      { equal: (a, b) => a.odd === b.odd }
    );

    const spyEvenTransform = jest.fn();
    const even$ = derive(
      odd$,
      value => {
        spyEvenTransform(value);
        return { even: !value.odd };
      },
      { equal: (a, b) => a.even === b.even }
    );

    expect(spyOddTransform).toBeCalledTimes(1);
    expect(spyEvenTransform).toBeCalledTimes(1);

    spyOddTransform.mockClear();
    spyEvenTransform.mockClear();

    v$.set({ v: 2 });

    expect(spyOddTransform).toBeCalledTimes(0);
    expect(spyEvenTransform).toBeCalledTimes(0);

    const spyEvenSubscribe = jest.fn();
    even$.subscribe(spyEvenSubscribe, true);

    expect(spyOddTransform).toBeCalledTimes(1);
    expect(spyOddTransform).lastCalledWith({ v: 2 });
    expect(spyEvenTransform).toBeCalledTimes(0);
    expect(spyEvenSubscribe).toBeCalledTimes(1);
    expect(spyEvenSubscribe).lastCalledWith({ even: true });

    spyOddTransform.mockClear();
    spyEvenTransform.mockClear();
    spyEvenSubscribe.mockClear();

    v$.set({ v: 4 });

    expect(spyOddTransform).toBeCalledTimes(1);
    expect(spyOddTransform).lastCalledWith({ v: 4 });
    expect(spyEvenTransform).toBeCalledTimes(0);
    expect(spyEvenSubscribe).toBeCalledTimes(0);

    spyOddTransform.mockClear();
    spyEvenTransform.mockClear();
    spyEvenSubscribe.mockClear();

    v$.set({ v: 3 });

    expect(spyOddTransform).toBeCalledTimes(1);
    expect(spyOddTransform).lastCalledWith({ v: 3 });
    expect(spyEvenTransform).toBeCalledTimes(1);
    expect(spyEvenTransform).lastCalledWith({ odd: true });
    expect(spyEvenSubscribe).toBeCalledTimes(1);
    expect(spyEvenSubscribe).lastCalledWith({ even: false });

    even$.unsubscribe();
  });

  it("should update derived value if changed before first subscription", () => {
    const v$ = val(1);
    const derived$ = derive(v$, value => value + 1);

    expect(derived$.value).toBe(2);

    v$.set(2);

    const spyDerivedSubscribe = jest.fn();
    derived$.subscribe(spyDerivedSubscribe);

    expect(spyDerivedSubscribe).lastCalledWith(3);
    expect(derived$.value).toEqual(3);

    derived$.unsubscribe();
  });

  it("should reaction derived value if changed before first subscription", async () => {
    const v$ = val(1);
    const derived$ = derive(v$, value => value + 1);

    expect(derived$.value).toBe(2);

    const spyDerivedReaction = jest.fn();
    derived$.reaction(spyDerivedReaction);

    v$.set(2);

    expect(spyDerivedReaction).toBeCalledTimes(0);

    await nextTick();

    expect(spyDerivedReaction).lastCalledWith(3);
    expect(derived$.value).toEqual(3);

    derived$.unsubscribe();
  });

  it("should trigger transform only once for async subscribers", async () => {
    const v$ = val(1);
    const spyDerived1Transform = jest.fn();
    const derived1$ = derive(v$, value => {
      spyDerived1Transform(value);
      return value + 1;
    });

    const spyDerived2Transform = jest.fn();
    const derived2$ = derive(derived1$, value => {
      spyDerived2Transform(value);
      return value + 1;
    });

    expect(spyDerived1Transform).toBeCalledTimes(1);
    expect(spyDerived2Transform).toBeCalledTimes(1);

    spyDerived1Transform.mockClear();
    spyDerived2Transform.mockClear();

    v$.set(2);

    expect(spyDerived1Transform).toBeCalledTimes(0);
    expect(spyDerived2Transform).toBeCalledTimes(0);

    const spyDerived2Subscribe = jest.fn();
    derived2$.subscribe(spyDerived2Subscribe);

    expect(spyDerived2Subscribe).toBeCalledTimes(1);
    expect(spyDerived2Subscribe).lastCalledWith(4);

    expect(spyDerived1Transform).toBeCalledTimes(1);
    expect(spyDerived2Transform).toBeCalledTimes(1);
    expect(spyDerived1Transform).lastCalledWith(2);
    expect(spyDerived2Transform).lastCalledWith(3);

    spyDerived1Transform.mockClear();
    spyDerived2Transform.mockClear();
    spyDerived2Subscribe.mockClear();

    v$.set(3);

    expect(spyDerived2Subscribe).toBeCalledTimes(0);

    expect(spyDerived1Transform).toBeCalledTimes(0);
    expect(spyDerived2Transform).toBeCalledTimes(0);

    await nextTick();

    expect(spyDerived2Subscribe).toBeCalledTimes(1);
    expect(spyDerived2Subscribe).lastCalledWith(5);

    expect(spyDerived1Transform).toBeCalledTimes(1);
    expect(spyDerived2Transform).toBeCalledTimes(1);
    expect(spyDerived1Transform).lastCalledWith(3);
    expect(spyDerived2Transform).lastCalledWith(4);

    derived2$.unsubscribe();
  });

  it("should trigger transform only once for eager subscribers", async () => {
    const v$ = val(1);
    const spyDerived1Transform = jest.fn();
    const derived1$ = derive(v$, value => {
      spyDerived1Transform(value);
      return value + 1;
    });

    const spyDerived2Transform = jest.fn();
    const derived2$ = derive(derived1$, value => {
      spyDerived2Transform(value);
      return value + 1;
    });

    expect(spyDerived1Transform).toBeCalledTimes(1);
    expect(spyDerived2Transform).toBeCalledTimes(1);

    spyDerived1Transform.mockClear();
    spyDerived2Transform.mockClear();

    v$.set(2);

    expect(spyDerived1Transform).toBeCalledTimes(0);
    expect(spyDerived2Transform).toBeCalledTimes(0);

    const spyDerived2Subscribe = jest.fn();
    derived2$.subscribe(spyDerived2Subscribe, true);

    expect(spyDerived2Subscribe).toBeCalledTimes(1);
    expect(spyDerived2Subscribe).lastCalledWith(4);

    expect(spyDerived1Transform).toBeCalledTimes(1);
    expect(spyDerived2Transform).toBeCalledTimes(1);
    expect(spyDerived1Transform).lastCalledWith(2);
    expect(spyDerived2Transform).lastCalledWith(3);

    spyDerived1Transform.mockClear();
    spyDerived2Transform.mockClear();
    spyDerived2Subscribe.mockClear();

    v$.set(3);

    expect(spyDerived2Subscribe).toBeCalledTimes(1);
    expect(spyDerived2Subscribe).lastCalledWith(5);

    expect(spyDerived1Transform).toBeCalledTimes(1);
    expect(spyDerived2Transform).toBeCalledTimes(1);
    expect(spyDerived1Transform).lastCalledWith(3);
    expect(spyDerived2Transform).lastCalledWith(4);

    derived2$.unsubscribe();
  });

  it("should trigger subscribers after dirty value is cleared", async () => {
    const v$ = val(1);
    const odd$ = derive(v$, value => Boolean(value % 2));
    const even$ = derive(odd$, value => !value);

    const spyEvenReaction = jest.fn();
    even$.reaction(spyEvenReaction);

    spyEvenReaction.mockClear();

    v$.set(2);
    expect(even$.value).toBe(true);
    v$.set(4);
    expect(even$.value).toBe(true);

    await nextTick();

    expect(spyEvenReaction).toBeCalledTimes(1);
    expect(spyEvenReaction).lastCalledWith(true);
  });
});
