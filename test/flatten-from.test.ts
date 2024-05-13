import { describe, expect, it, jest } from "@jest/globals";
import type { ReadonlyVal } from "../src";
import { flattenFrom, nextTick, val } from "../src";

const noop = () => void 0;

describe("flattenFrom", () => {
  it("should flatten inner val", () => {
    let notify: (() => void) | undefined;

    const spyOnChange = jest.fn((_notify: () => void) => {
      notify = _notify;
    });
    let currentVal = val(1);

    const v$ = flattenFrom(() => currentVal, spyOnChange);

    expect(spyOnChange).toBeCalledTimes(1);
    expect(v$.value).toBe(1);

    spyOnChange.mockClear();

    currentVal = val(2);

    expect(spyOnChange).toBeCalledTimes(0);
    expect(v$.value).toBe(1);

    notify?.();

    expect(spyOnChange).toBeCalledTimes(0);
    expect(v$.value).toEqual(2);

    expect(spyOnChange).toBeCalledTimes(0);
  });

  it("should resolve correct version", () => {
    let currentVal = val(1);
    let notify: (() => void) | undefined;

    const v$ = flattenFrom(
      () => currentVal,
      _notify => (notify = _notify)
    );

    const version = v$.$version;

    currentVal = val(1);

    expect(v$.$version).toBe(version);

    currentVal = val(2);
    expect(v$.$version).toBe(version);

    notify?.();
    expect(v$.$version).not.toBe(version);
  });

  it("should flatten inner normal value", () => {
    let notify: (() => void) | undefined;

    const spyOnChange = jest.fn((_notify: () => void) => {
      notify = _notify;
    });
    let currentValue: ReadonlyVal<number> | number = 1;

    const v$ = flattenFrom(() => currentValue, spyOnChange);

    expect(spyOnChange).toBeCalledTimes(1);
    expect(v$.value).toBe(1);

    spyOnChange.mockClear();

    currentValue = 2;

    expect(v$.value).toEqual(1);

    currentValue = val(3);
    expect(v$.value).toEqual(1);

    notify?.();
    expect(v$.value).toEqual(3);

    expect(spyOnChange).toBeCalledTimes(0);
  });

  it("should subscribe", async () => {
    const spySubscribe = jest.fn();
    const spyOnChange = jest.fn();

    let currentValue: ReadonlyVal<number> | number = val(1);
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = flattenFrom(
      () => currentValue,
      notify => {
        spyOnChange();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      }
    );

    expect(spyOnChange).toBeCalledTimes(1);

    spyOnChange.mockClear();

    v$.subscribe(spySubscribe);

    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(1);

    spySubscribe.mockClear();
    spyOnChange.mockClear();

    set(val(1));

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    set(2);

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(2);

    spySubscribe.mockClear();

    set(val(3));

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(3);

    expect(spyOnChange).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  it("should trigger subscription synchronously by default if eager is true", async () => {
    const spySubscribe = jest.fn();
    const spyOnChange = jest.fn();

    let currentValue: ReadonlyVal<number> | number = val(1);
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = flattenFrom(
      () => currentValue,
      notify => {
        spyOnChange();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      { eager: true }
    );

    expect(spyOnChange).toBeCalledTimes(1);

    spyOnChange.mockClear();

    v$.subscribe(spySubscribe);

    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(1);

    spySubscribe.mockClear();
    spyOnChange.mockClear();

    set(val(1));

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    set(2);

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(2);

    spySubscribe.mockClear();

    set(val(3));

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(3);

    expect(spyOnChange).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  it("should not trigger reaction if value not changed", async () => {
    const spyReaction = jest.fn();

    let currentValue: ReadonlyVal<string> | string = "c";
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = flattenFrom(
      () => currentValue,
      notify => {
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      }
    );

    expect(v$.value).toBe("c");

    // triggers equal check
    set("f");
    expect(v$.value).toBe("f");

    // set it back to c
    set(val("c"));
    expect(v$.value).toBe("c");

    v$.reaction(spyReaction);

    expect(spyReaction).not.toHaveBeenCalled();
    await nextTick();
    expect(spyReaction).not.toHaveBeenCalled();

    set("c");

    expect(spyReaction).not.toHaveBeenCalled();
    await nextTick();
    expect(spyReaction).not.toHaveBeenCalled();

    v$.unsubscribe();
  });

  it("should perform custom equal", async () => {
    const spySubscribe = jest.fn();
    const spyOnChange = jest.fn();

    let currentValue = val({ content: 1 });
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = flattenFrom(
      () => currentValue,
      notify => {
        spyOnChange();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      {
        equal: (a, b) => a.content === b.content,
      }
    );

    expect(spyOnChange).toBeCalledTimes(1);
    spyOnChange.mockClear();

    v$.subscribe(spySubscribe);

    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 1 });

    spySubscribe.mockClear();
    spyOnChange.mockClear();

    set(val({ content: 1 }));
    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(0);

    spySubscribe.mockClear();

    set(val({ content: 2 }));
    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 2 });
    expect(spyOnChange).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  it("should disable equality check if equal is false", async () => {
    const spySubscribe = jest.fn();
    const spyOnChange = jest.fn();

    const source$ = val({ content: 1 });
    let onChange: (() => void) | undefined;
    const notify = () => {
      onChange?.();
    };

    const v$ = flattenFrom(
      () => source$,
      notify => {
        spyOnChange();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      {
        equal: false,
      }
    );

    expect(spyOnChange).toBeCalledTimes(1);
    spyOnChange.mockClear();

    v$.subscribe(spySubscribe);

    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith(source$.value);

    spySubscribe.mockClear();
    spyOnChange.mockClear();

    notify();
    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith(source$.value);

    spySubscribe.mockClear();

    notify();
    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith(source$.value);
    expect(spyOnChange).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  it("should not trigger async subscribers if not changed", async () => {
    const spyOnChange = jest.fn();

    let currentValue = val({ content: 1 });
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = flattenFrom(
      () => currentValue,
      notify => {
        spyOnChange();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      {
        equal: (a, b) => a.content === b.content,
      }
    );

    const spySubscribe = jest.fn();
    expect(spyOnChange).toBeCalledTimes(1);

    spyOnChange.mockClear();

    v$.subscribe(spySubscribe);

    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 1 });

    spySubscribe.mockClear();
    spyOnChange.mockClear();

    set(val({ content: 2 }));

    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 2 });

    spySubscribe.mockClear();

    set(val({ content: 3 }));

    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 3 });
    expect(spyOnChange).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  it("should not trigger eager subscribers if not changed", async () => {
    const spyOnChange = jest.fn();

    let currentValue = val({ content: 1 });
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = flattenFrom(
      () => currentValue,
      notify => {
        spyOnChange();
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

    expect(spyOnChange).toBeCalledTimes(1);

    spyOnChange.mockClear();

    const spySubscribe = jest.fn();
    v$.subscribe(spySubscribe, true);

    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 2 });

    spySubscribe.mockClear();
    spyOnChange.mockClear();

    set(val({ content: 2 }));

    expect(spySubscribe).toBeCalledTimes(0);

    set(val({ content: 3 }));

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 3 });

    expect(spyOnChange).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  it("should getValue only once for async subscribers", async () => {
    let currentValue = val(1);
    let onChange: (() => void) | undefined;

    const spyOnChange = jest.fn(noop);
    const spyGetValue = jest.fn(() => currentValue);

    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = flattenFrom(spyGetValue, notify => {
      spyOnChange();
      onChange = notify;
      return () => {
        onChange = undefined;
      };
    });

    expect(spyGetValue).toBeCalledTimes(1);
    expect(spyOnChange).toBeCalledTimes(1);

    spyGetValue.mockClear();
    spyOnChange.mockClear();

    expect(v$.value).toBe(1);
    expect(spyGetValue).toBeCalledTimes(0);

    spyGetValue.mockClear();
    spyOnChange.mockClear();

    set(val(2));

    expect(spyGetValue).toBeCalledTimes(0);
    expect(spyOnChange).toBeCalledTimes(0);

    const spySubscribe = jest.fn();
    v$.subscribe(spySubscribe);

    expect(spyGetValue).toBeCalledTimes(1);
    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith(2);

    spyGetValue.mockClear();
    spyOnChange.mockClear();
    spySubscribe.mockClear();

    set(val(3));

    expect(spyGetValue).toBeCalledTimes(0);
    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(0);

    spyGetValue.mockClear();
    spyOnChange.mockClear();
    spySubscribe.mockClear();

    await nextTick();

    expect(spyGetValue).toBeCalledTimes(1);
    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith(3);

    v$.unsubscribe();
  });

  it("should getValue only once for eager subscribers", async () => {
    let currentValue = val(1);
    let onChange: (() => void) | undefined;

    const spyGetValue = jest.fn(() => currentValue);
    const spyOnChange = jest.fn(noop);

    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = flattenFrom(spyGetValue, notify => {
      spyOnChange();
      onChange = notify;
      return () => {
        onChange = undefined;
      };
    });

    expect(spyGetValue).toBeCalledTimes(1);
    expect(spyOnChange).toBeCalledTimes(1);

    spyGetValue.mockClear();
    spyOnChange.mockClear();

    expect(v$.value).toBe(1);
    expect(spyGetValue).toBeCalledTimes(0);

    spyGetValue.mockClear();
    spyOnChange.mockClear();

    set(val(2));

    expect(spyGetValue).toBeCalledTimes(0);
    expect(spyOnChange).toBeCalledTimes(0);

    const spySubscribe = jest.fn();
    v$.subscribe(spySubscribe, true);

    expect(spyGetValue).toBeCalledTimes(1);
    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith(2);

    spyGetValue.mockClear();
    spyOnChange.mockClear();
    spySubscribe.mockClear();

    set(val(3));

    expect(spyGetValue).toBeCalledTimes(1);
    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith(3);

    spyGetValue.mockClear();
    spyOnChange.mockClear();
    spySubscribe.mockClear();

    await nextTick();

    expect(spyGetValue).toBeCalledTimes(0);
    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  it("should follow source equal if equal is not provided", async () => {
    const innerV$ = val(1, { equal: false });

    const v$ = flattenFrom(() => innerV$, noop);

    const spyInnerReaction = jest.fn();
    innerV$.reaction(spyInnerReaction, true);

    const spyOuterReaction = jest.fn();
    v$.reaction(spyOuterReaction, true);

    expect(spyInnerReaction).toBeCalledTimes(0);
    expect(spyOuterReaction).toBeCalledTimes(0);

    innerV$.set(1);

    expect(spyInnerReaction).toBeCalledTimes(1);
    expect(spyInnerReaction).lastCalledWith(1);
    expect(spyOuterReaction).toBeCalledTimes(1);
    expect(spyOuterReaction).lastCalledWith(1);
  });

  it("should dispose", () => {
    let notify: (() => void) | undefined;

    const spyOnChange = jest.fn((_notify: () => void) => {
      notify = _notify;
    });
    let currentVal = val(1);

    const v$ = flattenFrom(() => currentVal, spyOnChange);

    expect(spyOnChange).toBeCalledTimes(1);

    spyOnChange.mockClear();

    v$.dispose();

    expect(spyOnChange).toBeCalledTimes(0);

    currentVal = val(2);

    expect(spyOnChange).toBeCalledTimes(0);

    notify?.();

    expect(spyOnChange).toBeCalledTimes(0);
  });
});
