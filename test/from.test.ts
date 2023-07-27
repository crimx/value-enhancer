import { describe, expect, it, jest } from "@jest/globals";
import { from } from "../src";

const noop = () => void 0;

describe("from", () => {
  it("should get current value", () => {
    const startSpy = jest.fn(noop);
    let currentValue = 1;

    const val$ = from(() => currentValue, startSpy);

    expect(startSpy).toBeCalledTimes(0);
    expect(val$.value).toBe(1);

    currentValue = 2;

    expect(startSpy).toBeCalledTimes(0);
    expect(val$.value).toEqual(2);

    expect(startSpy).toBeCalledTimes(0);
  });

  it("should subscribe", async () => {
    const sub = jest.fn();
    const startSpy = jest.fn();

    let currentValue = 1;
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = from(
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

    set(1);

    expect(sub).toHaveBeenCalledTimes(0);

    set(2);

    expect(sub).toHaveBeenCalledTimes(0);

    await Promise.resolve();

    expect(sub).toHaveBeenCalledTimes(1);
    expect(sub).lastCalledWith(2);

    sub.mockClear();

    set(3);

    expect(sub).toHaveBeenCalledTimes(0);

    await Promise.resolve();

    expect(sub).toHaveBeenCalledTimes(1);
    expect(sub).lastCalledWith(3);

    expect(startSpy).toBeCalledTimes(0);

    val$.unsubscribe();
  });

  it("should not trigger reaction if value not changed", async () => {
    const sub = jest.fn();

    let currentValue = "c";
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = from(
      () => currentValue,
      notify => {
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      }
    );

    expect(val$.value).toBe("c");

    // triggers compare
    set("f");
    expect(val$.value).toBe("f");

    // set it back to c
    set("c");
    expect(val$.value).toBe("c");

    val$.reaction(sub);

    expect(sub).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(sub).not.toHaveBeenCalled();

    set("c");

    expect(sub).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(sub).not.toHaveBeenCalled();

    val$.unsubscribe();
  });

  it("should perform custom compare", async () => {
    const sub = jest.fn();
    const startSpy = jest.fn();

    let currentValue = { content: 1 };
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = from(
      () => currentValue,
      notify => {
        startSpy();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      {
        compare: (a, b) => a.content === b.content,
      }
    );

    expect(startSpy).toBeCalledTimes(0);

    val$.subscribe(sub);

    expect(startSpy).toBeCalledTimes(1);
    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ content: 1 });

    sub.mockClear();
    startSpy.mockClear();

    set({ content: 1 });
    expect(sub).toBeCalledTimes(0);

    await Promise.resolve();

    expect(sub).toBeCalledTimes(0);

    sub.mockClear();

    set({ content: 2 });
    expect(sub).toBeCalledTimes(0);

    await Promise.resolve();

    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ content: 2 });
    expect(startSpy).toBeCalledTimes(0);

    val$.unsubscribe();
  });

  it("should not trigger async subscribers if not changed", async () => {
    const startSpy = jest.fn();

    let currentValue = { content: 1 };
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = from(
      () => currentValue,
      notify => {
        startSpy();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      {
        compare: (a, b) => a.content === b.content,
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

    set({ content: 2 });

    expect(spySub).toBeCalledTimes(0);

    await Promise.resolve();

    expect(spySub).toBeCalledTimes(1);
    expect(spySub).lastCalledWith({ content: 2 });

    spySub.mockClear();

    set({ content: 3 });

    expect(spySub).toBeCalledTimes(0);

    await Promise.resolve();

    expect(spySub).toBeCalledTimes(1);
    expect(spySub).lastCalledWith({ content: 3 });
    expect(startSpy).toBeCalledTimes(0);

    val$.unsubscribe();
  });

  it("should not trigger eager subscribers if not changed", async () => {
    const startSpy = jest.fn();

    let currentValue = { content: 1 };
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = from(
      () => currentValue,
      notify => {
        startSpy();
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      },
      {
        compare: (a, b) => a.content === b.content,
      }
    );

    set({ content: 2 });

    expect(startSpy).toBeCalledTimes(0);

    const sub = jest.fn();
    val$.subscribe(sub, true);

    expect(startSpy).toBeCalledTimes(1);
    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ content: 2 });

    sub.mockClear();
    startSpy.mockClear();

    set({ content: 2 });

    expect(sub).toBeCalledTimes(0);

    set({ content: 3 });

    expect(sub).toBeCalledTimes(1);
    expect(sub).lastCalledWith({ content: 3 });

    expect(startSpy).toBeCalledTimes(0);

    val$.unsubscribe();
  });

  it("should invoke start on first subscriber and dispose after last subscriber unsubscribes", () => {
    const disposeSpy = jest.fn();
    const startSpy = jest.fn(() => disposeSpy);

    const val$ = from(() => 1, startSpy);

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
    let currentValue = 1;
    let onChange: (() => void) | undefined;

    const startSpy = jest.fn(noop);
    const getValueSpy = jest.fn(() => currentValue);

    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = from(getValueSpy, notify => {
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

    set(2);

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

    set(3);

    expect(getValueSpy).toBeCalledTimes(0);
    expect(startSpy).toBeCalledTimes(0);
    expect(spy1).toBeCalledTimes(0);

    await Promise.resolve();

    expect(getValueSpy).toBeCalledTimes(1);
    expect(startSpy).toBeCalledTimes(0);
    expect(spy1).toBeCalledTimes(1);
    expect(spy1).lastCalledWith(3);

    val$.unsubscribe();
  });

  it("should getValue only once for eager subscribers", async () => {
    let currentValue = 1;
    let onChange: (() => void) | undefined;

    const startSpy = jest.fn(noop);
    const getValueSpy = jest.fn(() => currentValue);

    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const val$ = from(getValueSpy, notify => {
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

    set(2);

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

    set(3);

    expect(getValueSpy).toBeCalledTimes(1);
    expect(startSpy).toBeCalledTimes(0);
    expect(spy1).toBeCalledTimes(1);
    expect(spy1).lastCalledWith(3);

    getValueSpy.mockClear();
    startSpy.mockClear();
    spy1.mockClear();

    await Promise.resolve();

    expect(getValueSpy).toBeCalledTimes(0);
    expect(startSpy).toBeCalledTimes(0);
    expect(spy1).toBeCalledTimes(0);

    val$.unsubscribe();
  });
});
