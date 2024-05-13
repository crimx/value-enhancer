import { describe, expect, it, jest } from "@jest/globals";
import { from, nextTick } from "../src";

const noop = () => void 0;

describe("from", () => {
  it("should get current value", () => {
    let notify: () => void;
    const spyOnChange = jest.fn((_notify: () => void) => (notify = _notify));
    let currentValue = 1;

    const v$ = from(() => currentValue, spyOnChange);

    expect(spyOnChange).toBeCalledTimes(1);
    spyOnChange.mockClear();
    expect(v$.value).toBe(1);

    currentValue = 2;

    expect(spyOnChange).toBeCalledTimes(0);
    expect(v$.value).toEqual(1);

    notify!();

    expect(spyOnChange).toBeCalledTimes(0);
    expect(v$.value).toEqual(2);

    expect(spyOnChange).toBeCalledTimes(0);
  });

  it("should subscribe", async () => {
    const spySubscribe = jest.fn();
    const spyOnChange = jest.fn();

    let currentValue = 1;
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = from(
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

    set(1);

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    set(2);

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(2);

    spySubscribe.mockClear();

    set(3);

    expect(spySubscribe).toHaveBeenCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toHaveBeenCalledTimes(1);
    expect(spySubscribe).lastCalledWith(3);

    expect(spyOnChange).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  it("should not trigger reaction if value not changed", async () => {
    const spyReaction = jest.fn();

    let currentValue = "c";
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = from(
      () => currentValue,
      notify => {
        onChange = notify;
        return () => {
          onChange = undefined;
        };
      }
    );

    expect(v$.value).toBe("c");

    // triggers equal
    set("f");
    expect(v$.value).toBe("f");

    // set it back to c
    set("c");
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

    let currentValue = { content: 1 };
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = from(
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

    set({ content: 1 });
    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(0);

    spySubscribe.mockClear();

    set({ content: 2 });
    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 2 });
    expect(spyOnChange).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  it("should not trigger async subscribers if not changed", async () => {
    const spyOnChange = jest.fn();

    let currentValue = { content: 1 };
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = from(
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

    set({ content: 2 });

    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 2 });

    spySubscribe.mockClear();

    set({ content: 3 });

    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 3 });
    expect(spyOnChange).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  it("should not trigger eager subscribers if not changed", async () => {
    const spyOnChange = jest.fn();

    let currentValue = { content: 1 };
    let onChange: (() => void) | undefined;
    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = from(
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

    set({ content: 2 });

    expect(spyOnChange).toBeCalledTimes(1);

    spyOnChange.mockClear();

    const spySubscribe = jest.fn();
    v$.subscribe(spySubscribe, true);

    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 2 });

    spySubscribe.mockClear();
    spyOnChange.mockClear();

    set({ content: 2 });

    expect(spySubscribe).toBeCalledTimes(0);

    set({ content: 3 });

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith({ content: 3 });

    expect(spyOnChange).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  it("should getValue only once for async subscribers", async () => {
    let currentValue = 1;
    let onChange: (() => void) | undefined;

    const spyOnChange = jest.fn(noop);
    const spyGetValue = jest.fn(() => currentValue);

    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = from(spyGetValue, notify => {
      spyOnChange();
      onChange = notify;
      return () => {
        onChange = undefined;
      };
    });

    expect(spyGetValue).toBeCalledTimes(1);
    expect(spyOnChange).toBeCalledTimes(1);

    expect(v$.value).toBe(1);
    expect(spyGetValue).toBeCalledTimes(1);

    spyGetValue.mockClear();
    spyOnChange.mockClear();

    set(2);

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

    set(3);

    expect(spyGetValue).toBeCalledTimes(0);
    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spyGetValue).toBeCalledTimes(1);
    expect(spyOnChange).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith(3);

    v$.unsubscribe();
  });

  it("should getValue only once for eager subscribers", async () => {
    let currentValue = 1;
    let onChange: (() => void) | undefined;

    const spyListen = jest.fn(noop);
    const spyGetValue = jest.fn(() => currentValue);

    const set = (value: typeof currentValue) => {
      currentValue = value;
      onChange?.();
    };

    const v$ = from(spyGetValue, notify => {
      spyListen();
      onChange = notify;
      return () => {
        onChange = undefined;
      };
    });

    expect(spyGetValue).toBeCalledTimes(1);
    expect(spyListen).toBeCalledTimes(1);

    spyGetValue.mockClear();
    spyListen.mockClear();

    expect(v$.value).toBe(1);
    expect(spyGetValue).toBeCalledTimes(0);

    set(2);

    expect(spyGetValue).toBeCalledTimes(0);
    expect(spyListen).toBeCalledTimes(0);

    const spySubscribe = jest.fn();
    v$.subscribe(spySubscribe, true);

    expect(spyGetValue).toBeCalledTimes(1);
    expect(spyListen).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith(2);

    spyGetValue.mockClear();
    spyListen.mockClear();
    spySubscribe.mockClear();

    set(3);

    expect(spyGetValue).toBeCalledTimes(1);
    expect(spyListen).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith(3);

    spyGetValue.mockClear();
    spyListen.mockClear();
    spySubscribe.mockClear();

    await nextTick();

    expect(spyGetValue).toBeCalledTimes(0);
    expect(spyListen).toBeCalledTimes(0);
    expect(spySubscribe).toBeCalledTimes(0);

    v$.unsubscribe();
  });

  describe("dispose", () => {
    it("should dispose onChange side-effects on dispose", () => {
      const spyDispose = jest.fn();
      const v$ = from(
        () => 1,
        () => spyDispose
      );

      v$.dispose();

      expect(spyDispose).toBeCalledTimes(1);
    });

    it("should dispose onChange side-effects after gc", async () => {
      const spyDispose = jest.fn();
      from(
        () => 1,
        () => spyDispose
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      gc!();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(spyDispose).toBeCalledTimes(1);
    });

    it("should dispose onChange side-effects when notify after gc", async () => {
      const spyDispose = jest.fn();
      let notify: any;

      from(
        () => 1,
        _notify => {
          notify = _notify;
          return spyDispose;
        }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      gc!();

      notify();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(spyDispose).toBeCalledTimes(1);
    });
  });
});
