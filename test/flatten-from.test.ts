import { describe, expect, it, jest } from "@jest/globals";
import type { ReadonlyVal } from "../src";
import { flattenFrom, nextTick, val } from "../src";

const noop = () => void 0;

describe("flattenFrom", () => {
  it("should flatten inner val", () => {
    const startSpy = jest.fn(noop);
    let currentVal = val(1);

    const val$ = flattenFrom(() => currentVal, startSpy);

    expect(startSpy).toBeCalledTimes(0);
    expect(val$.value).toBe(1);

    currentVal = val(2);

    expect(startSpy).toBeCalledTimes(0);
    expect(val$.value).toEqual(2);

    expect(startSpy).toBeCalledTimes(0);
  });

  it("should resolve correct version", () => {
    let currentVal = val(1);

    const val$ = flattenFrom(() => currentVal, noop);

    const version = val$.$version;

    currentVal = val(1);

    expect(val$.$version).toBe(version);

    currentVal = val(2);
    expect(val$.$version).not.toBe(version);
  });

  it("should flatten inner normal value", () => {
    const startSpy = jest.fn(noop);
    let currentValue: ReadonlyVal<number> | number = 1;

    const val$ = flattenFrom(() => currentValue, startSpy);

    expect(startSpy).toBeCalledTimes(0);
    expect(val$.value).toBe(1);

    currentValue = 2;

    expect(val$.value).toEqual(2);

    currentValue = val(3);
    expect(val$.value).toEqual(3);

    expect(startSpy).toBeCalledTimes(0);
  });

  it("should subscribe", async () => {
    const sub = jest.fn();
    const startSpy = jest.fn();

    let currentValue: ReadonlyVal<number> | number = val(1);
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = flattenFrom(
      () => currentValue,
      notify => {
        startSpy();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      }
    );

    expect(startSpy).toBeCalledTimes(0);

    val$.subscribe(sub);

    expect(startSpy).toBeCalledTimes(1);
    expect(sub).toHaveBeenCalledTimes(1);
    expect(sub).lastCalledWith(1);

    sub.mockClear();
    startSpy.mockClear();

    set(val(1));

    expect(sub).toHaveBeenCalledTimes(0);

    set(2);

    expect(sub).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(sub).toHaveBeenCalledTimes(1);
    expect(sub).lastCalledWith(2);

    sub.mockClear();

    set(val(3));

    expect(sub).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(sub).toHaveBeenCalledTimes(1);
    expect(sub).lastCalledWith(3);

    expect(startSpy).toBeCalledTimes(0);

    val$.unsubscribe();
  });

  it("should trigger subscription synchronously by default if eager is true", async () => {
    const sub = jest.fn();
    const startSpy = jest.fn();

    let currentValue: ReadonlyVal<number> | number = val(1);
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = flattenFrom(
      () => currentValue,
      notify => {
        startSpy();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      { eager: true }
    );

    expect(startSpy).toBeCalledTimes(0);

    val$.subscribe(sub);

    expect(startSpy).toBeCalledTimes(1);
    expect(sub).toHaveBeenCalledTimes(1);
    expect(sub).lastCalledWith(1);

    sub.mockClear();
    startSpy.mockClear();

    set(val(1));

    expect(sub).toHaveBeenCalledTimes(0);

    set(2);

    expect(sub).toHaveBeenCalledTimes(1);
    expect(sub).lastCalledWith(2);

    sub.mockClear();

    set(val(3));

    expect(sub).toHaveBeenCalledTimes(1);
    expect(sub).lastCalledWith(3);

    expect(startSpy).toBeCalledTimes(0);

    val$.unsubscribe();
  });

  it("should not trigger reaction if value not changed", async () => {
    const sub = jest.fn();

    let currentValue: ReadonlyVal<string> | string = "c";
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = flattenFrom(
      () => currentValue,
      notify => {
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      }
    );

    expect(val$.value).toBe("c");

    // triggers equal check
    set("f");
    expect(val$.value).toBe("f");

    // set it back to c
    set(val("c"));
    expect(val$.value).toBe("c");

    val$.reaction(sub);

    expect(sub).not.toHaveBeenCalled();
    await nextTick();
    expect(sub).not.toHaveBeenCalled();

    set("c");

    expect(sub).not.toHaveBeenCalled();
    await nextTick();
    expect(sub).not.toHaveBeenCalled();

    val$.unsubscribe();
  });

  it("should perform custom equal", async () => {
    const sub = jest.fn();
    const startSpy = jest.fn();

    let currentValue = val({ content: 1 });
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = flattenFrom(
      () => currentValue,
      notify => {
        startSpy();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      {
        equal: (a, b) => a.content === b.content,
      }
    );

    expect(startSpy).toBeCalledTimes(0);

    val$.subscribe(sub);

    expect(startSpy).toBeCalledTimes(1);
    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ content: 1 });

    sub.mockClear();
    startSpy.mockClear();

    set(val({ content: 1 }));
    expect(sub).toBeCalledTimes(0);

    await nextTick();

    expect(sub).toBeCalledTimes(0);

    sub.mockClear();

    set(val({ content: 2 }));
    expect(sub).toBeCalledTimes(0);

    await nextTick();

    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ content: 2 });
    expect(startSpy).toBeCalledTimes(0);

    val$.unsubscribe();
  });

  it("should disable equality check if equal is false", async () => {
    const sub = jest.fn();
    const startSpy = jest.fn();

    const source$ = val({ content: 1 });
    let onChange: (() => void) | undefined;
    const notify = () => {
      onChange?.();
    };

    const val$ = flattenFrom(
      () => source$,
      notify => {
        startSpy();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      {
        equal: false,
      }
    );

    expect(startSpy).toBeCalledTimes(0);

    val$.subscribe(sub);

    expect(startSpy).toBeCalledTimes(1);
    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith(source$.value);

    sub.mockClear();
    startSpy.mockClear();

    notify();
    expect(sub).toBeCalledTimes(0);

    await nextTick();

    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith(source$.value);

    sub.mockClear();

    notify();
    expect(sub).toBeCalledTimes(0);

    await nextTick();

    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith(source$.value);
    expect(startSpy).toBeCalledTimes(0);

    val$.unsubscribe();
  });

  it("should not trigger async subscribers if not changed", async () => {
    const startSpy = jest.fn();

    let currentValue = val({ content: 1 });
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = flattenFrom(
      () => currentValue,
      notify => {
        startSpy();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      {
        equal: (a, b) => a.content === b.content,
      }
    );

    const spySub = jest.fn();
    expect(startSpy).toBeCalledTimes(0);

    val$.subscribe(spySub);

    expect(startSpy).toBeCalledTimes(1);
    expect(spySub).toBeCalledTimes(1);
    expect(spySub).lastCalledWith({ content: 1 });

    spySub.mockClear();
    startSpy.mockClear();

    set(val({ content: 2 }));

    expect(spySub).toBeCalledTimes(0);

    await nextTick();

    expect(spySub).toBeCalledTimes(1);
    expect(spySub).lastCalledWith({ content: 2 });

    spySub.mockClear();

    set(val({ content: 3 }));

    expect(spySub).toBeCalledTimes(0);

    await nextTick();

    expect(spySub).toBeCalledTimes(1);
    expect(spySub).lastCalledWith({ content: 3 });
    expect(startSpy).toBeCalledTimes(0);

    val$.unsubscribe();
  });

  it("should not trigger eager subscribers if not changed", async () => {
    const startSpy = jest.fn();

    let currentValue = val({ content: 1 });
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = flattenFrom(
      () => currentValue,
      notify => {
        startSpy();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      {
        equal: (a, b) => a.content === b.content,
      }
    );

    set(val({ content: 2 }));

    expect(startSpy).toBeCalledTimes(0);

    const sub = jest.fn();
    val$.subscribe(sub, true);

    expect(startSpy).toBeCalledTimes(1);
    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ content: 2 });

    sub.mockClear();
    startSpy.mockClear();

    set(val({ content: 2 }));

    expect(sub).toBeCalledTimes(0);

    set(val({ content: 3 }));

    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ content: 3 });

    expect(startSpy).toBeCalledTimes(0);

    val$.unsubscribe();
  });

  it("should invoke start on first subscriber and dispose after last subscriber unsubscribes", () => {
    const disposeSpy = jest.fn();
    const startSpy = jest.fn(() => disposeSpy);

    const val$ = flattenFrom(() => val(1), startSpy);

    expect(startSpy).toBeCalledTimes(0);

    const sub1 = jest.fn();
    val$.subscribe(sub1);

    expect(startSpy).toBeCalledTimes(1);
    expect(disposeSpy).toBeCalledTimes(0);
    expect(sub1).toBeCalledTimes(1);

    startSpy.mockClear();
    disposeSpy.mockClear();
    sub1.mockClear();

    const sub2 = jest.fn();
    val$.subscribe(sub2);

    expect(startSpy).toBeCalledTimes(0);
    expect(disposeSpy).toBeCalledTimes(0);
    expect(sub1).toBeCalledTimes(0);
    expect(sub2).toBeCalledTimes(1);

    startSpy.mockClear();
    disposeSpy.mockClear();
    sub1.mockClear();
    sub2.mockClear();

    val$.unsubscribe(sub1);

    expect(startSpy).toBeCalledTimes(0);
    expect(disposeSpy).toBeCalledTimes(0);
    expect(sub1).toBeCalledTimes(0);
    expect(sub2).toBeCalledTimes(0);

    val$.unsubscribe(sub2);

    expect(startSpy).toBeCalledTimes(0);
    expect(disposeSpy).toBeCalledTimes(1);
    expect(sub1).toBeCalledTimes(0);
    expect(sub2).toBeCalledTimes(0);

    startSpy.mockClear();
    disposeSpy.mockClear();
    sub1.mockClear();
    sub2.mockClear();

    val$.reaction(sub1);

    expect(startSpy).toBeCalledTimes(1);
    expect(disposeSpy).toBeCalledTimes(0);
    expect(sub1).toBeCalledTimes(0);
    expect(sub2).toBeCalledTimes(0);

    startSpy.mockClear();
    disposeSpy.mockClear();
    sub1.mockClear();
    sub2.mockClear();

    val$.reaction(sub2);

    expect(startSpy).toBeCalledTimes(0);
    expect(disposeSpy).toBeCalledTimes(0);
    expect(sub1).toBeCalledTimes(0);
    expect(sub2).toBeCalledTimes(0);

    val$.unsubscribe();

    expect(startSpy).toBeCalledTimes(0);
    expect(disposeSpy).toBeCalledTimes(1);
    expect(sub1).toBeCalledTimes(0);
    expect(sub2).toBeCalledTimes(0);
  });

  it("should getValue only once for async subscribers", async () => {
    let currentValue = val(1);
    let onChange: (() => void) | undefined;

    const startSpy = jest.fn(noop);
    const getValueSpy = jest.fn(() => currentValue);

    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = flattenFrom(getValueSpy, notify => {
      startSpy();
      onChange = notify;
      return () => {
        onChange = undefined;
      };
    });

    expect(getValueSpy).toBeCalledTimes(0);
    expect(startSpy).toBeCalledTimes(0);

    expect(val$.value).toBe(1);
    expect(getValueSpy).toBeCalledTimes(1);

    getValueSpy.mockClear();
    startSpy.mockClear();

    set(val(2));

    expect(getValueSpy).toBeCalledTimes(0);
    expect(startSpy).toBeCalledTimes(0);

    const spy1 = jest.fn();
    val$.subscribe(spy1);

    expect(getValueSpy).toBeCalledTimes(1);
    expect(startSpy).toBeCalledTimes(1);
    expect(spy1).toBeCalledTimes(1);
    expect(spy1).lastCalledWith(2);

    getValueSpy.mockClear();
    startSpy.mockClear();
    spy1.mockClear();

    set(val(3));

    expect(getValueSpy).toBeCalledTimes(0);
    expect(startSpy).toBeCalledTimes(0);
    expect(spy1).toBeCalledTimes(0);

    getValueSpy.mockClear();
    startSpy.mockClear();
    spy1.mockClear();

    await nextTick();

    expect(getValueSpy).toBeCalledTimes(1);
    expect(startSpy).toBeCalledTimes(0);
    expect(spy1).toBeCalledTimes(1);
    expect(spy1).lastCalledWith(3);

    val$.unsubscribe();
  });

  it("should getValue only once for eager subscribers", async () => {
    let currentValue = val(1);
    let onChange: (() => void) | undefined;

    const startSpy = jest.fn(noop);
    const getValueSpy = jest.fn(() => currentValue);

    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = flattenFrom(getValueSpy, notify => {
      startSpy();
      onChange = notify;
      return () => {
        onChange = undefined;
      };
    });

    expect(getValueSpy).toBeCalledTimes(0);
    expect(startSpy).toBeCalledTimes(0);

    expect(val$.value).toBe(1);
    expect(getValueSpy).toBeCalledTimes(1);

    getValueSpy.mockClear();
    startSpy.mockClear();

    set(val(2));

    expect(getValueSpy).toBeCalledTimes(0);
    expect(startSpy).toBeCalledTimes(0);

    const spy1 = jest.fn();
    val$.subscribe(spy1, true);

    expect(getValueSpy).toBeCalledTimes(1);
    expect(startSpy).toBeCalledTimes(1);
    expect(spy1).toBeCalledTimes(1);
    expect(spy1).lastCalledWith(2);

    getValueSpy.mockClear();
    startSpy.mockClear();
    spy1.mockClear();

    set(val(3));

    expect(getValueSpy).toBeCalledTimes(1);
    expect(startSpy).toBeCalledTimes(0);
    expect(spy1).toBeCalledTimes(1);
    expect(spy1).lastCalledWith(3);

    getValueSpy.mockClear();
    startSpy.mockClear();
    spy1.mockClear();

    await nextTick();

    expect(getValueSpy).toBeCalledTimes(0);
    expect(startSpy).toBeCalledTimes(0);
    expect(spy1).toBeCalledTimes(0);

    val$.unsubscribe();
  });
});
