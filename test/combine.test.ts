import { describe, expect, it, jest } from "@jest/globals";
import { combine, nextTick, val } from "../src";

describe("combine", () => {
  it("should not trigger transform if upstream not changed", () => {
    const spyTransform = jest.fn(([value1, value2]) => value1 + value2);
    const v1$ = val(1);
    const v2$ = val(1);
    const combined$ = combine([v1$, v2$], spyTransform);

    expect(spyTransform).toBeCalledTimes(1);

    spyTransform.mockClear();

    expect(v1$.value).toBe(1);
    expect(v2$.value).toBe(1);
    expect(combined$.value).toBe(2);
    expect(spyTransform).toBeCalledTimes(0);

    expect(v1$.value).toBe(1);
    expect(v2$.value).toBe(1);
    expect(combined$.value).toBe(2);
    expect(spyTransform).toBeCalledTimes(0);

    v1$.set(1);

    expect(v1$.value).toBe(1);
    expect(v2$.value).toBe(1);
    expect(combined$.value).toBe(2);
    expect(spyTransform).toBeCalledTimes(0);

    expect(v1$.value).toBe(1);
    expect(v2$.value).toBe(1);
    expect(combined$.value).toBe(2);
    expect(spyTransform).toBeCalledTimes(0);

    v1$.set(2);

    expect(v1$.value).toBe(2);
    expect(v2$.value).toBe(1);
    expect(combined$.value).toEqual(3);
    expect(spyTransform).toBeCalledTimes(1);
  });

  it("should get value without subscribe", () => {
    const v1$ = val(1);
    const v2$ = val(1);
    const v3$ = val(1);
    const v4$ = val(2);
    const combined$ = combine(
      [v1$, v2$, v3$, v4$],
      ([val1, val2, val3, val4]) => {
        return val1 + val2 + val3 + val4;
      }
    );

    expect(combined$.value).toBe(5);

    v1$.set(1);

    expect(combined$.value).toEqual(5);

    v1$.set(2);

    expect(combined$.value).toEqual(6);

    combined$.subscribe(jest.fn());

    expect(combined$.value).toEqual(6);

    combined$.unsubscribe();
  });

  it("should subscribe", async () => {
    const spy1Subscribe = jest.fn();
    const spy2Subscribe = jest.fn();
    const spy3Subscribe = jest.fn();
    const spy4Subscribe = jest.fn();
    const val1$ = val(1);
    const val2$ = combine([val1$], ([v1]) => v1 + 1);
    const val3$ = combine([val1$, val2$], ([v1, v2]) => v1 + v2);
    const val4$ = combine(
      [val1$, val2$, val3$],
      ([v1, v2, v3]) => v1 + v2 + v3
    );

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
    expect(spy4Subscribe).lastCalledWith(6);

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
    expect(spy3Subscribe).lastCalledWith(5);
    expect(spy4Subscribe).lastCalledWith(10);

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
    expect(spy3Subscribe).lastCalledWith(7);
    expect(spy4Subscribe).lastCalledWith(14);
  });

  it("should combine a val list into a single val", async () => {
    const v1$ = val(1);
    const v2$ = val({ code: 2 });
    const v3$ = val<boolean>(false);
    const v4$ = val<string>("4");
    const combined$ = combine(
      [v1$, v2$, v3$, v4$],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      }
    );

    const spySubscribe = jest.fn();
    combined$.subscribe(spySubscribe);

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe.mock.calls[0][0]).toEqual({
      val1: 1,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });

    v1$.set(2);
    await nextTick();
    expect(spySubscribe).toBeCalledTimes(2);
    expect(spySubscribe.mock.calls[1][0]).toEqual({
      val1: 2,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });

    v1$.set(3);
    await nextTick();
    expect(spySubscribe).toBeCalledTimes(3);
    expect(spySubscribe.mock.calls[2][0]).toEqual({
      val1: 3,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });

    combined$.unsubscribe();
  });

  it("should perform custom equal", async () => {
    const v1$ = val(1);
    const v2$ = val({ code: 2 });
    const v3$ = val<boolean>(false);
    const v4$ = val<string>("4");
    const combined$ = combine(
      [v1$, v2$, v3$, v4$],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      },
      { equal: (a, b) => a.val2.code === b.val2.code }
    );

    const spySubscribe = jest.fn();
    combined$.subscribe(spySubscribe);

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({
      val1: 1,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });

    const spyReaction = jest.fn();
    v2$.reaction(spyReaction);
    expect(spyReaction).toBeCalledTimes(0);

    v2$.set({ code: 2 });
    expect(spyReaction).toBeCalledTimes(0);

    await nextTick();

    expect(spyReaction).toBeCalledTimes(1);
    expect(spySubscribe).toBeCalledTimes(1);

    combined$.unsubscribe();
  });

  it("should work without transform", () => {
    const v1$ = val(1);
    const v2$ = val(1);
    const v3$ = val(1);
    const v4$ = val(2);
    const combined$ = combine([v1$, v2$, v3$, v4$]);

    expect(combined$.value).toEqual([1, 1, 1, 2]);

    v1$.set(1);

    expect(combined$.value).toEqual([1, 1, 1, 2]);

    v1$.set(2);

    expect(combined$.value).toEqual([2, 1, 1, 2]);

    combined$.unsubscribe();
  });

  it("should trigger transform only once", async () => {
    const spy2Transform = jest.fn(([value]) => value);
    const spy3Transform = jest.fn(([value1, value2]) => value1 + value2);
    const spy4Transform = jest.fn(
      ([value1, value2, value3]) => value1 + value2 + value3
    );
    const v1$ = val(1);
    const v2$ = combine([v1$], spy2Transform);
    const v3$ = combine([v1$, v2$], spy3Transform);
    const v4$ = combine([v1$, v2$, v3$], spy4Transform);

    expect(spy2Transform).toBeCalledTimes(1);
    expect(spy3Transform).toBeCalledTimes(1);
    expect(spy4Transform).toBeCalledTimes(1);

    spy2Transform.mockClear();
    spy3Transform.mockClear();
    spy4Transform.mockClear();

    const spy4Reaction = jest.fn();
    v4$.reaction(spy4Reaction);

    expect(spy2Transform).toBeCalledTimes(0);
    expect(spy3Transform).toBeCalledTimes(0);
    expect(spy4Transform).toBeCalledTimes(0);

    v1$.set(2);

    expect(spy2Transform).toBeCalledTimes(0);
    expect(spy3Transform).toBeCalledTimes(0);
    expect(spy4Transform).toBeCalledTimes(0);
    expect(spy4Reaction).toBeCalledTimes(0);

    await nextTick();

    expect(spy2Transform).toBeCalledTimes(1);
    expect(spy3Transform).toBeCalledTimes(1);
    expect(spy4Transform).toBeCalledTimes(1);
    expect(spy4Reaction).toBeCalledTimes(1);
    expect(spy4Reaction).lastCalledWith(8);

    v4$.unsubscribe();
  });

  it("should not trigger async subscribers if not changed", async () => {
    const v$ = val({ v: 0 });
    const spyOddTransform = jest.fn();
    const odd$ = combine(
      [v$],
      ([value]) => {
        spyOddTransform(value);
        return { odd: Boolean(value.v % 2) };
      },
      { equal: (a, b) => a.odd === b.odd }
    );

    const spyEvenTransform = jest.fn();
    const even$ = combine(
      [odd$],
      ([value]) => {
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
    const odd$ = combine(
      [v$],
      ([value]) => {
        spyOddTransform(value);
        return { odd: Boolean(value.v % 2) };
      },
      { equal: (a, b) => a.odd === b.odd }
    );

    const spyEvenTransform = jest.fn();
    const even$ = combine(
      [odd$],
      ([value]) => {
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

    const spySub = jest.fn();
    even$.subscribe(spySub, true);

    expect(spyOddTransform).toBeCalledTimes(1);
    expect(spyOddTransform).lastCalledWith({ v: 2 });
    expect(spyEvenTransform).toBeCalledTimes(0);
    expect(spySub).toBeCalledTimes(1);
    expect(spySub).lastCalledWith({ even: true });

    spyOddTransform.mockClear();
    spyEvenTransform.mockClear();
    spySub.mockClear();

    v$.set({ v: 4 });

    expect(spyOddTransform).toBeCalledTimes(1);
    expect(spyOddTransform).lastCalledWith({ v: 4 });
    expect(spyEvenTransform).toBeCalledTimes(0);
    expect(spySub).toBeCalledTimes(0);

    spyOddTransform.mockClear();
    spyEvenTransform.mockClear();
    spySub.mockClear();

    v$.set({ v: 3 });

    expect(spyOddTransform).toBeCalledTimes(1);
    expect(spyOddTransform).lastCalledWith({ v: 3 });
    expect(spyEvenTransform).toBeCalledTimes(1);
    expect(spyEvenTransform).lastCalledWith({ odd: true });
    expect(spySub).toBeCalledTimes(1);
    expect(spySub).lastCalledWith({ even: false });

    even$.unsubscribe();
  });

  it("should update combined value if changed before first subscription", () => {
    const v1$ = val(1);
    const v2$ = val(1);
    const combined$ = combine([v1$, v2$], ([val1, val2]) => val1 + val2);

    expect(combined$.value).toBe(2);

    v1$.set(2);

    const spyTransform = jest.fn();
    combined$.subscribe(spyTransform);

    expect(spyTransform).lastCalledWith(3);
    expect(combined$.value).toBe(3);
  });

  it("should react combined value if changed before first subscription", async () => {
    const v1$ = val(1);
    const v2$ = val(1);
    const combined$ = combine([v1$, v2$], ([val1, val2]) => val1 + val2);

    expect(combined$.value).toBe(2);

    const spyReaction = jest.fn();
    combined$.reaction(spyReaction);

    v1$.set(2);

    expect(spyReaction).toBeCalledTimes(0);

    await nextTick();

    expect(spyReaction).lastCalledWith(3);
    expect(combined$.value).toBe(3);
  });

  it("should trigger subscribers after dirty value is cleared", async () => {
    const v$ = val(1);
    const odd$ = combine([v$], ([value]) => Boolean(value % 2));
    const even$ = combine([odd$], ([value]) => !value);

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

  it("should trigger combine when emit values during subscribe", async () => {
    const v1$ = val(1);
    const v2$ = val(2);

    const combined$ = combine([v1$, v2$]);

    const spySubscribe = jest.fn();
    combined$.subscribe(v => {
      v1$.set(999);
      spySubscribe(v);
    });

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith([1, 2]);

    await nextTick();
    expect(spySubscribe).toBeCalledTimes(2);
    expect(spySubscribe).lastCalledWith([999, 2]);

    v1$.set(2);
    v2$.set(3);

    await nextTick();
    expect(spySubscribe).toBeCalledTimes(3);
    expect(spySubscribe).lastCalledWith([2, 3]);

    v1$.set(3);
    v2$.set(4);

    await nextTick();
    expect(spySubscribe).toBeCalledTimes(4);
    expect(spySubscribe).lastCalledWith([3, 4]);
  });

  it("should dispose onChange disposer", () => {
    const v1$ = val(1);
    const v2$ = val(2);
    const combined$ = combine([v1$, v2$]);

    const spySubscribe = jest.fn();
    combined$.subscribe(spySubscribe);
    expect(spySubscribe).toBeCalledTimes(1);

    spySubscribe.mockClear();

    combined$.dispose();

    v1$.set(999);

    expect(spySubscribe).toBeCalledTimes(0);
  });
});
