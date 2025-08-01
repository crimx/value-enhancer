import { describe, expect, it, jest } from "@jest/globals";
import type { ComputeGet } from "../src";
import { compute, nextTick, val, watch, type WatchGet } from "../src";

describe("watch", () => {
  it("should run the callback immediately", () => {
    const s = val(123);
    const spy = jest.fn((get: WatchGet) => {
      get(s);
    });
    watch(spy);
    expect(spy).toBeCalled();
  });

  it("should get non-readable", async () => {
    const s = val(123);
    const spy = jest.fn();
    watch(get => {
      spy(get(s) + get(321));
    });
    expect(spy).toBeCalledTimes(1);
    expect(spy).lastCalledWith(444);

    s.value = 42;
    await nextTick();
    expect(spy).toBeCalledTimes(2);
    expect(spy).lastCalledWith(363);
  });

  it("should dispose", async () => {
    const s = val(123);
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    watch(get => {
      spy1(get(s) + get(321));
    });
    watch((get, dispose) => {
      spy2(get(s) + get(321));
      dispose();
    });

    expect(spy1).toBeCalledTimes(1);
    expect(spy1).lastCalledWith(444);
    expect(spy2).toBeCalledTimes(1);
    expect(spy2).lastCalledWith(444);

    spy1.mockClear();
    spy2.mockClear();

    s.value = 42;
    await nextTick();

    expect(spy1).toBeCalledTimes(1);
    expect(spy1).lastCalledWith(363);
    expect(spy2).toBeCalledTimes(0);
  });

  it("should subscribe to vals async", async () => {
    const s = val(123);
    const spy = jest.fn((get: WatchGet) => {
      get(s);
    });
    watch(spy);
    spy.mockClear();

    s.value = 42;

    expect(spy).toBeCalledTimes(0);

    await nextTick();

    expect(spy).toBeCalledTimes(1);
  });

  it("should subscribe to vals sync", async () => {
    const s = val(123);
    const spy = jest.fn((get: WatchGet) => {
      get(s);
    });
    watch(spy, { eager: true });
    spy.mockClear();

    s.value = 42;

    expect(spy).toBeCalledTimes(1);

    await nextTick();

    expect(spy).toBeCalledTimes(1);
  });

  it("should subscribe to multiple vals", () => {
    const a = val("a");
    const b = val("b");
    const spy = jest.fn((get: WatchGet) => {
      get(a);
      get(b);
    });
    watch(spy, { eager: true });
    spy.mockClear();

    a.value = "aa";
    b.value = "bb";
    expect(spy).toBeCalledTimes(2);
  });

  it("should dispose of subscriptions", () => {
    const a = val("a");
    const b = val("b");
    const spy = jest.fn((get: WatchGet) => {
      get(a);
      get(b);
    });
    const dispose = watch(spy, { eager: true });
    spy.mockClear();

    dispose();
    expect(spy).toBeCalledTimes(0);

    a.value = "aa";
    b.value = "bb";
    expect(spy).toBeCalledTimes(0);
  });

  it("should unsubscribe from val", () => {
    const s = val(123);
    const spy = jest.fn(() => {
      s.value;
    });
    const unsubscribe = watch(spy, { eager: true });
    spy.mockClear();

    unsubscribe();
    s.value = 42;
    expect(spy).toBeCalledTimes(0);
  });

  it("should conditionally unsubscribe from vals", () => {
    const a = val("a");
    const b = val("b");
    const cond = val(true);

    const spy = jest.fn((get: WatchGet) => {
      get(cond) ? get(a) : get(b);
    });

    watch(spy, { eager: true });
    expect(spy).toBeCalledTimes(1);

    b.value = "bb";
    expect(spy).toBeCalledTimes(1);

    cond.value = false;
    expect(spy).toBeCalledTimes(2);

    spy.mockClear();

    a.value = "aaa";
    expect(spy).toBeCalledTimes(0);
  });

  it("should batch writes", async () => {
    const a = val("a");
    const spy = jest.fn((get: WatchGet) => {
      get(a);
    });
    watch(spy);
    spy.mockClear();

    watch(() => {
      a.value = "aa";
      a.value = "aaa";
    });

    await nextTick();

    expect(spy).toBeCalledTimes(1);
  });

  it("should call the cleanup callback before the next run", async () => {
    const a = val(0);
    const spy = jest.fn();

    watch((get: WatchGet) => {
      get(a);
      return spy;
    });
    expect(spy).toBeCalledTimes(0);
    a.value = 1;
    await nextTick();
    expect(spy).toBeCalledTimes(1);
    a.value = 2;
    await nextTick();
    expect(spy).toBeCalledTimes(2);
  });

  it("should call only the callback from the previous run", async () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();
    const a = val(spy1);

    watch((get: WatchGet) => {
      return get(a);
    });

    expect(spy1).toBeCalledTimes(0);
    expect(spy2).toBeCalledTimes(0);
    expect(spy3).toBeCalledTimes(0);

    a.value = spy2;
    await nextTick();
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(0);
    expect(spy3).toBeCalledTimes(0);

    a.value = spy3;
    await nextTick();
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(0);
  });

  it("should call the cleanup callback function when disposed", () => {
    const spy = jest.fn();

    const dispose = watch(() => {
      return spy;
    });
    expect(spy).toBeCalledTimes(0);
    dispose();
    expect(spy).toBeCalledTimes(1);
  });

  it("should not recompute if the effect has been notified about changes, but no direct dependency has actually changed", async () => {
    const s = val(0);
    const c = compute((get: ComputeGet) => {
      get(s);
      return 0;
    });
    const spy = jest.fn((get: WatchGet) => {
      get(c);
    });
    watch(spy);
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    s.value = 1;
    await nextTick();
    expect(spy).toBeCalledTimes(0);
  });

  it("should not recompute dependencies unnecessarily", async () => {
    const spy = jest.fn();
    const a = val(0);
    const b = val(0);
    const c = compute(() => {
      b.value;
      spy();
    });
    watch(() => {
      if (a.value === 0) {
        c.value;
      }
    });
    expect(spy).toBeCalledTimes(1);

    b.value = 1;
    a.value = 1;
    await nextTick();
    expect(spy).toBeCalledTimes(1);
  });

  it("should not recompute dependencies out of order", async () => {
    const a = val(1, { name: "a" });
    const b = val(1, { name: "b" });
    const c = val(1, { name: "c" });

    const spy = jest.fn((get: ComputeGet) => get(c));
    const d = compute(spy, { name: "d" });

    watch((get: WatchGet) => {
      if (get(a) > 0) {
        get(b);
        get(d);
      } else {
        get(b);
      }
    });
    spy.mockClear();

    a.value = 2;
    b.value = 2;
    c.value = 2;
    await nextTick();
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    a.value = -1;
    b.value = -1;
    c.value = -1;
    await nextTick();
    expect(spy).toBeCalledTimes(0);
    spy.mockClear();
  });

  it("should recompute if a dependency changes during computation after becoming a dependency", async () => {
    const a = val(0);
    const spy = jest.fn((get: WatchGet) => {
      if (get(a) === 0) {
        a.value++;
      }
    });
    watch(spy);
    await nextTick();
    expect(spy).toBeCalledTimes(2);
  });

  it("should run the cleanup in an implicit batch", async () => {
    const a = val(0);
    const b = val("a");
    const c = val("b");
    const spy = jest.fn();

    watch((get: WatchGet) => {
      get(b);
      get(c);
      spy(get(b) + get(c));
    });

    watch((get: WatchGet) => {
      get(a);
      return () => {
        b.value = "x";
        c.value = "y";
      };
    });

    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    a.value = 1;
    await nextTick();
    await nextTick();
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith("xy");
  });

  it("should not retrigger the effect if the cleanup modifies one of the dependencies", async () => {
    const a = val(0);
    const spy = jest.fn();

    watch((get: WatchGet) => {
      spy(get(a));
      return () => {
        a.value = 2;
      };
    });
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    a.value = 1;
    await nextTick();
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(2);
  });

  it("should run the cleanup if the effect disposes itself", async () => {
    const a = val(0);
    const spy = jest.fn();

    const dispose = watch((get: WatchGet) => {
      if (get(a) > 0) {
        dispose();
        return spy;
      }
    });
    expect(spy).toBeCalledTimes(0);
    a.value = 1;
    await nextTick();
    expect(spy).toBeCalledTimes(1);
    a.value = 2;
    await nextTick();
    expect(spy).toBeCalledTimes(1);
  });

  it("should not run the effect if the cleanup function disposes it", async () => {
    const a = val(0);
    const spy = jest.fn();

    const dispose = watch((get: WatchGet) => {
      get(a);
      spy();
      return () => {
        dispose();
      };
    });
    expect(spy).toBeCalledTimes(1);
    a.value = 1;
    await nextTick();
    expect(spy).toBeCalledTimes(1);
  });

  it("should reset the cleanup if the effect throws", async () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => void 0);

    const a = val(0);
    const spy = jest.fn();
    const error = new Error("hello");

    watch((get: WatchGet) => {
      if (get(a) === 0) {
        return spy;
      } else {
        throw error;
      }
    });
    expect(spy).toBeCalledTimes(0);
    expect(consoleErrorMock).toBeCalledTimes(0);
    a.value = 1;
    await nextTick();
    expect(consoleErrorMock).toBeCalledTimes(1);
    expect(spy).toBeCalledTimes(1);
    a.value = 0;
    await nextTick();
    expect(spy).toBeCalledTimes(1);
    consoleErrorMock.mockClear();
  });

  it("should run cleanups outside any evaluation context", async () => {
    const spy = jest.fn();
    const a = val(0);
    const b = val(0);
    const c = compute((get: ComputeGet) => {
      if (get(a) === 0) {
        watch(() => {
          return () => {
            get(b);
          };
        });
      }
      return get(a);
    });

    watch((get: WatchGet) => {
      spy();
      get(c);
    });
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    a.value = 1;
    await nextTick();
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    b.value = 1;
    await nextTick();
    expect(spy).toBeCalledTimes(0);
  });

  it("should allow disposing the effect multiple times", () => {
    const dispose = watch(() => undefined);
    dispose();
    expect(() => dispose()).not.toThrow();
  });

  it("should allow disposing a running effect", async () => {
    const a = val(0);
    const spy = jest.fn();
    const dispose = watch((get: WatchGet) => {
      if (get(a) === 1) {
        dispose();
        spy();
      }
    });
    expect(spy).toBeCalledTimes(0);
    a.value = 1;
    await nextTick();
    expect(spy).toBeCalledTimes(1);
    a.value = 2;
    await nextTick();
    expect(spy).toBeCalledTimes(1);
  });

  it("should not run if it's first been triggered and then disposed in a batch", async () => {
    const a = val(0);
    const spy = jest.fn((get: WatchGet) => {
      get(a);
    });
    const dispose = watch(spy);
    spy.mockClear();

    a.value = 1;
    dispose();

    await nextTick();
    expect(spy).toBeCalledTimes(0);
  });

  it("should not run if it's been triggered, disposed and then triggered again in a batch", async () => {
    const a = val(0);
    const spy = jest.fn((get: WatchGet) => {
      get(a);
    });
    const dispose = watch(spy);
    spy.mockClear();

    a.value = 1;
    dispose();
    a.value = 2;

    await nextTick();
    expect(spy).toBeCalledTimes(0);
  });

  it("should not rerun parent effect if a nested child effect's signal's value changes", async () => {
    const parentSignal = val(0);
    const childSignal = val(0);

    const parentEffect = jest.fn((get: WatchGet) => {
      get(parentSignal);
    });
    const childEffect = jest.fn((get: WatchGet) => {
      get(childSignal);
    });

    watch(get => {
      parentEffect(get);
      watch(childEffect);
    });

    expect(parentEffect).toBeCalledTimes(1);
    expect(childEffect).toBeCalledTimes(1);

    childSignal.value = 1;
    await nextTick();

    expect(parentEffect).toBeCalledTimes(1);
    expect(childEffect).toBeCalledTimes(2);

    parentSignal.value = 1;
    await nextTick();

    expect(parentEffect).toBeCalledTimes(2);
    expect(childEffect).toBeCalledTimes(3);
  });
});
