/**
 * Tests inspired by Preact Signal {@link https://github.com/preactjs/signals/blob/9022d4a770ce53c3e5c6a571f3ac5193ec2011b4/packages/core/test/signal.test.tsx}
 */

import matchers from "jest-extended";
import { describe, expect, it, vi } from "vitest";

import { batch, compute, type Get, type ReadonlyVal, val, type Val, watch } from "../src";
import { isVal } from "../src/utils";

expect.extend(matchers);

describe("signal", () => {
  it("should return value", () => {
    const v = [1, 2];
    const s = val(v);
    expect(s.value).toEqual(v);
  });

  /**
   * @divergence Signal is not a class in Value Enhancer.
   */
  // it("should inherit from Signal", () => {
  //   expect(val(0)).toBeInstanceOf(Signal);
  // });

  it("should support .toString()", () => {
    const s = val(123);
    expect(s.toString()).toEqual("123");
  });

  it("should support .toJSON()", () => {
    const s = val(123);
    expect(JSON.stringify(s)).toEqual("123");
  });

  it("should support JSON.Stringify()", () => {
    const s = val(123);
    expect(JSON.stringify({ s })).toEqual(JSON.stringify({ s: 123 }));
  });

  it("should support .valueOf()", () => {
    const s = val(123);
    expect(s).toHaveProperty("valueOf");
    expect(typeof s.valueOf).toBe("function");
    expect(s.valueOf()).toEqual(123);
    expect(+s).toEqual(123);

    const a = val(1);
    const b = val(2);
    // @ts-expect-error not sure how to do it in TypeScript
    expect(a + b).toEqual(3);
  });

  it("should notify other listeners of changes after one listener is disposed", () => {
    const s = val(0);
    const spy1 = vi.fn((get: Get) => {
      get(s);
    });
    const spy2 = vi.fn((get: Get) => {
      get(s);
    });
    const spy3 = vi.fn((get: Get) => {
      get(s);
    });

    watch(spy1);
    const dispose = watch(spy2);
    watch(spy3);

    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(1);

    spy1.mockClear();
    spy2.mockClear();
    spy3.mockClear();

    dispose();

    s.value = 1;
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(0);
    expect(spy3).toBeCalledTimes(1);
  });

  describe(".peek()", () => {
    it("should get value", () => {
      const s = val(1);
      expect(s.value).toEqual(1);
      expect(s.get()).toEqual(1);
    });

    it("should get the updated value after a value change", () => {
      const s = val(1);
      s.value = 2;
      expect(s.value).toEqual(2);
      expect(s.get()).toEqual(2);
    });

    it("should not make surrounding effect depend on the signal", () => {
      const s = val(1);
      const spy = vi.fn(() => {
        s.value;
      });

      watch(spy);
      expect(spy).toBeCalledTimes(1);

      spy.mockClear();

      s.value = 2;
      expect(spy).toBeCalledTimes(0);
    });

    it("should not make surrounding computed depend on the signal", () => {
      const s = val(1);
      const spy = vi.fn((get: Get) => {
        get(s);
      });
      const d = compute(spy);
      expect(spy).toBeCalledTimes(0);

      d.value;
      expect(spy).toBeCalledTimes(1);

      spy.mockClear();

      s.value = 2;
      expect(spy).toBeCalledTimes(0);

      d.value;
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe(".subscribe()", () => {
    it("should subscribe to a signal", () => {
      const spy = vi.fn();
      const a = val(1);

      a.subscribe(spy);
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(1);
    });

    it("should run the callback when the signal value changes", () => {
      const spy = vi.fn();
      const a = val(1);

      a.subscribe(spy);

      a.value = 2;
      expect(spy).toBeCalledWith(2);
    });

    it("should unsubscribe from a signal", () => {
      const spy = vi.fn();
      const a = val(1);

      const dispose = a.subscribe(spy);
      dispose();
      spy.mockClear();

      a.value = 2;
      expect(spy).toBeCalledTimes(0);
    });

    it("should not start triggering on when a signal accessed in the callback changes", () => {
      const spy = vi.fn();
      const a = val(0);
      const b = val(0);

      a.subscribe(() => {
        b.value;
        spy();
      });
      expect(spy).toBeCalledTimes(1);
      spy.mockClear();

      b.value++;
      expect(spy).toBeCalledTimes(0);
    });

    it("should not cause surrounding effect to subscribe to changes to a signal accessed in the callback", () => {
      const spy = vi.fn();
      const a = val(0);
      const b = val(0);

      watch(() => {
        a.subscribe(() => {
          b.value;
        });
        spy();
      });
      expect(spy).toBeCalledTimes(1);
      spy.mockClear();

      b.value++;
      expect(spy).toBeCalledTimes(0);
    });
  });

  it("signals should be identified with a symbol", () => {
    const a = val(0);
    expect(a.brand).toEqual(Symbol.for("value-enhancer"));
  });

  it("should be identified with a symbol", () => {
    const a = compute(() => {});
    expect(a.brand).toEqual(Symbol.for("value-enhancer"));
  });
});

describe("effect()", () => {
  it("should run the callback immediately", () => {
    const s = val(123);
    const spy = vi.fn((get: Get) => {
      get(s);
    });
    watch(spy);
    expect(spy).toBeCalled();
  });

  it("should subscribe to signals", () => {
    const s = val(123);
    const spy = vi.fn((get: Get) => {
      get(s);
    });
    watch(spy);
    spy.mockClear();

    s.value = 42;
    expect(spy).toBeCalled();
  });

  it("should subscribe to multiple signals", () => {
    const a = val("a");
    const b = val("b");
    const spy = vi.fn((get: Get) => {
      get(a);
      get(b);
    });
    watch(spy);
    spy.mockClear();

    a.value = "aa";
    b.value = "bb";
    expect(spy).toBeCalledTimes(2);
  });

  it("should dispose of subscriptions", () => {
    const a = val("a");
    const b = val("b");
    const spy = vi.fn((get: Get) => {
      get(a) + " " + get(b);
    });
    const dispose = watch(spy);
    spy.mockClear();

    dispose();
    expect(spy).toBeCalledTimes(0);

    a.value = "aa";
    b.value = "bb";
    expect(spy).toBeCalledTimes(0);
  });

  it("should unsubscribe from signal", () => {
    const s = val(123);
    const spy = vi.fn(() => {
      s.value;
    });
    const unsubscribe = watch(spy);
    spy.mockClear();

    unsubscribe();
    s.value = 42;
    expect(spy).toBeCalledTimes(0);
  });

  it("should conditionally unsubscribe from signals", () => {
    const a = val("a");
    const b = val("b");
    const cond = val(true);

    const spy = vi.fn((get: Get) => {
      get(cond) ? get(a) : get(b);
    });

    watch(spy);
    expect(spy).toBeCalledTimes(1);

    b.value = "bb";
    expect(spy).toBeCalledTimes(1);

    cond.value = false;
    expect(spy).toBeCalledTimes(2);

    spy.mockClear();

    a.value = "aaa";
    expect(spy).toBeCalledTimes(0);
  });

  it("should batch writes", () => {
    const a = val("a");
    const spy = vi.fn((get: Get) => {
      get(a);
    });
    watch(spy);
    spy.mockClear();

    watch(() => {
      a.value = "aa";
      a.value = "aaa";
    });

    expect(spy).toBeCalledTimes(1);
  });

  it("should call the cleanup callback before the next run", () => {
    const a = val(0);
    const spy = vi.fn();

    watch((get: Get) => {
      get(a);
      return spy;
    });
    expect(spy).toBeCalledTimes(0);
    a.value = 1;
    expect(spy).toBeCalledTimes(1);
    a.value = 2;
    expect(spy).toBeCalledTimes(2);
  });

  it("should call only the callback from the previous run", () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const spy3 = vi.fn();
    const a = val(spy1);

    watch((get: Get) => {
      return get(a);
    });

    expect(spy1).toBeCalledTimes(0);
    expect(spy2).toBeCalledTimes(0);
    expect(spy3).toBeCalledTimes(0);

    a.value = spy2;
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(0);
    expect(spy3).toBeCalledTimes(0);

    a.value = spy3;
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(0);
  });

  it("should call the cleanup callback function when disposed", () => {
    const spy = vi.fn();

    const dispose = watch(() => {
      return spy;
    });
    expect(spy).toBeCalledTimes(0);
    dispose();
    expect(spy).toBeCalledTimes(1);
  });

  it("should not recompute if the effect has been notified about changes, but no direct dependency has actually changed", () => {
    const s = val(0);
    const c = compute((get: Get) => {
      get(s);
      return 0;
    });
    const spy = vi.fn((get: Get) => {
      get(c);
    });
    watch(spy);
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    s.value = 1;
    expect(spy).toBeCalledTimes(0);
  });

  it("should not recompute dependencies unnecessarily", () => {
    const spy = vi.fn();
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

    batch(() => {
      b.value = 1;
      a.value = 1;
    });
    expect(spy).toBeCalledTimes(1);
  });

  it("should not recompute dependencies out of order", () => {
    const a = val(1);
    const b = val(1);
    const c = val(1);

    const spy = vi.fn((get: Get) => get(c));
    const d = compute(spy);

    watch((get: Get) => {
      if (get(a) > 0) {
        get(b);
        get(d);
      } else {
        get(b);
      }
    });
    spy.mockClear();

    batch(() => {
      a.value = 2;
      b.value = 2;
      c.value = 2;
    });
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    batch(() => {
      a.value = -1;
      b.value = -1;
      c.value = -1;
    });
    expect(spy).toBeCalledTimes(0);
    spy.mockClear();
  });

  it("should recompute if a dependency changes during computation after becoming a dependency", () => {
    const a = val(0);
    const spy = vi.fn((get: Get) => {
      if (get(a) === 0) {
        a.value++;
      }
    });
    watch(spy);
    expect(spy).toBeCalledTimes(2);
  });

  it("should run the cleanup in an implicit batch", () => {
    const a = val(0);
    const b = val("a");
    const c = val("b");
    const spy = vi.fn();

    watch((get: Get) => {
      get(b);
      get(c);
      spy(get(b) + get(c));
    });

    watch((get: Get) => {
      get(a);
      return () => {
        b.value = "x";
        c.value = "y";
      };
    });

    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    a.value = 1;
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith("xy");
  });

  it("should not retrigger the effect if the cleanup modifies one of the dependencies", () => {
    const a = val(0);
    const spy = vi.fn();

    watch((get: Get) => {
      spy(get(a));
      return () => {
        a.value = 2;
      };
    });
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    a.value = 1;
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(2);
  });

  it("should run the cleanup if the effect disposes itself", () => {
    const a = val(0);
    const spy = vi.fn();

    const dispose = watch((get: Get) => {
      if (get(a) > 0) {
        dispose();
        return spy;
      }
    });
    expect(spy).toBeCalledTimes(0);
    a.value = 1;
    expect(spy).toBeCalledTimes(1);
    a.value = 2;
    expect(spy).toBeCalledTimes(1);
  });

  it("should not run the effect if the cleanup function disposes it", () => {
    const a = val(0);
    const spy = vi.fn();

    const dispose = watch((get: Get) => {
      get(a);
      spy();
      return () => {
        dispose();
      };
    });
    expect(spy).toBeCalledTimes(1);
    a.value = 1;
    expect(spy).toBeCalledTimes(1);
  });

  it("should not subscribe to anything if first run throws", () => {
    const error = new Error("test");

    const s = val(0);
    const spy = vi.fn((get: Get) => {
      get(s);
      throw error;
    });
    expect(() => watch(spy)).toThrow("test");
    expect(spy).toBeCalledTimes(1);

    s.value++;
    expect(spy).toBeCalledTimes(1);
  });

  it("should reset the cleanup if the effect throws", () => {
    const a = val(0);
    const spy = vi.fn();
    const error = new Error("hello");

    watch((get: Get) => {
      if (get(a) === 0) {
        return spy;
      } else {
        throw error;
      }
    });
    expect(spy).toBeCalledTimes(0);
    expect(() => (a.value = 1)).toThrow("hello");
    expect(spy).toBeCalledTimes(1);
    a.value = 0;
    expect(spy).toBeCalledTimes(1);
  });

  it("should dispose the effect if the cleanup callback throws", () => {
    const a = val(0);
    const spy = vi.fn();
    const error = new Error("hello");

    watch((get: Get) => {
      if (get(a) === 0) {
        return () => {
          throw error;
        };
      } else {
        spy();
      }
    });
    expect(spy).toBeCalledTimes(0);
    expect(() => a.value++).toThrow("hello");
    expect(spy).toBeCalledTimes(0);
    a.value++;
    expect(spy).toBeCalledTimes(0);
  });

  it("should run cleanups outside any evaluation context", () => {
    const spy = vi.fn();
    const a = val(0);
    const b = val(0);
    const c = compute((get: Get) => {
      if (get(a) === 0) {
        watch(() => {
          return () => {
            get(b);
          };
        });
      }
      return get(a);
    });

    watch((get: Get) => {
      spy();
      get(c);
    });
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    a.value = 1;
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    b.value = 1;
    expect(spy).toBeCalledTimes(0);
  });

  /**
   * @divergence watcher cycle detection not implemented.
   */
  // it.only("should throw on cycles", () => {
  //   const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => void 0);

  //   expect(consoleErrorMock).toHaveBeenCalledTimes(0);

  //   const a = val(0);
  //   let i = 0;

  //   const fn = () =>
  //     watch((get: Get) => {
  //       // Prevent test suite from spinning if limit is not hit
  //       if (i++ > 200) {
  //         throw new Error("test failed");
  //       }
  //       get(a);
  //       a.value = Math.random();
  //     });

  //   // expect(fn).toThrow(/Cycle detected/);

  //   fn();

  //   expect(consoleErrorMock).toHaveBeenCalledTimes(1);
  //   expect(consoleErrorMock).lastCalledWith("Cycle detected");

  //   consoleErrorMock.mockRestore();
  // });

  // it("should throw on indirect cycles", () => {
  // 	const a = val(0);
  // 	let i = 0;

  // 	const c = compute(() => {
  // 		a.value;
  // 		a.value = NaN;
  // 		return NaN;
  // 	});

  // 	const fn = () =>
  // 		watch(() => {
  // 			// Prevent test suite from spinning if limit is not hit
  // 			if (i++ > 200) {
  // 				throw new Error("test failed");
  // 			}
  // 			c.value;
  // 		});

  // 	expect(fn).to.throw(/Cycle detected/);
  // });

  it("should allow disposing the effect multiple times", () => {
    const dispose = watch(() => undefined);
    dispose();
    expect(() => dispose()).not.to.throw();
  });

  it("should allow disposing a running effect", () => {
    const a = val(0);
    const spy = vi.fn();
    const dispose = watch((get: Get) => {
      if (get(a) === 1) {
        dispose();
        spy();
      }
    });
    expect(spy).toBeCalledTimes(0);
    a.value = 1;
    expect(spy).toBeCalledTimes(1);
    a.value = 2;
    expect(spy).toBeCalledTimes(1);
  });

  it("should not run if it's first been triggered and then disposed in a batch", () => {
    const a = val(0);
    const spy = vi.fn((get: Get) => {
      get(a);
    });
    const dispose = watch(spy);
    spy.mockClear();

    batch(() => {
      a.value = 1;
      dispose();
    });

    expect(spy).toBeCalledTimes(0);
  });

  it("should not run if it's been triggered, disposed and then triggered again in a batch", () => {
    const a = val(0);
    const spy = vi.fn((get: Get) => {
      get(a);
    });
    const dispose = watch(spy);
    spy.mockClear();

    batch(() => {
      a.value = 1;
      dispose();
      a.value = 2;
    });

    expect(spy).toBeCalledTimes(0);
  });

  it("should not rerun parent effect if a nested child effect's signal's value changes", () => {
    const parentSignal = val(0);
    const childSignal = val(0);

    const parentEffect = vi.fn((get: Get) => {
      get(parentSignal);
    });
    const childEffect = vi.fn((get: Get) => {
      get(childSignal);
    });

    watch(get => {
      parentEffect(get);
      watch(childEffect);
    });

    expect(parentEffect).toBeCalledTimes(1);
    expect(childEffect).toBeCalledTimes(1);

    childSignal.value = 1;

    expect(parentEffect).toBeCalledTimes(1);
    expect(childEffect).toBeCalledTimes(2);

    parentSignal.value = 1;

    expect(parentEffect).toBeCalledTimes(2);
    expect(childEffect).toBeCalledTimes(3);
  });
});

describe("compute()", () => {
  it("should return value", () => {
    const a = val("a");
    const b = val("b");

    const c = compute((get: Get) => get(a) + get(b));
    expect(c.value).toEqual("ab");
  });

  it("should be val", () => {
    expect(isVal(compute(() => 0))).toBe(true);
  });

  it("should return updated value", () => {
    const a = val("a");
    const b = val("b");

    const c = compute((get: Get) => get(a) + get(b));
    expect(c.value).toEqual("ab");

    a.value = "aa";
    expect(c.value).toEqual("aab");
  });

  it("should be lazily computed on demand", () => {
    const a = val("a");
    const b = val("b");
    const spy = vi.fn((get: Get) => get(a) + get(b));
    const c = compute(spy);
    expect(spy).toBeCalledTimes(0);
    c.value;
    expect(spy).toBeCalledTimes(1);
    a.value = "x";
    b.value = "y";
    expect(spy).toBeCalledTimes(1);
    c.value;
    expect(spy).toBeCalledTimes(2);
  });

  it("should be computed only when a dependency has changed at some point", () => {
    const a = val("a");
    const spy = vi.fn((get: Get) => {
      return get(a);
    });
    const c = compute(spy);
    c.value;
    expect(spy).toBeCalledTimes(1);
    a.value = "a";
    c.value;
    expect(spy).toBeCalledTimes(1);
  });

  it("should recompute if a dependency changes during computation after becoming a dependency", () => {
    const a = val(0);
    const spy = vi.fn((get: Get) => {
      return (a.value = get(a) + 1);
    });
    const c = compute(spy);
    expect(c.value).toEqual(1);
    expect(a.value).toEqual(1);
    expect(spy).toBeCalledTimes(1);
    expect(c.value).toEqual(2);
    expect(a.value).toEqual(2);
    expect(spy).toBeCalledTimes(2);
  });

  it("should detect simple dependency cycles", () => {
    const a: ReadonlyVal = compute((get: Get) => get(a));
    expect(() => a.value).toThrow(/Cycle detected/);
  });

  it("should detect deep dependency cycles", () => {
    const a: ReadonlyVal = compute((get: Get) => get(b));
    const b: ReadonlyVal = compute((get: Get) => get(c));
    const c: ReadonlyVal = compute((get: Get) => get(d));
    const d: ReadonlyVal = compute((get: Get) => get(a));
    expect(() => a.value).toThrow(/Cycle detected/);
  });

  it("should not allow a computed signal to become a direct dependency of itself", () => {
    const spy = vi.fn((get: Get) => {
      try {
        get(a);
      } catch {
        // pass
      }
    });
    const a = compute(spy);
    a.value;
    expect(() => watch(() => a.value)).to.not.throw();
  });

  it("should store thrown errors and recompute only after a dependency changes", () => {
    const a = val(0);
    const spy = vi.fn((get: Get) => {
      get(a);
      throw new Error();
    });
    const c = compute(spy);
    expect(() => c.value).to.throw();
    expect(() => c.value).to.throw();
    expect(spy).toBeCalledTimes(1);
    a.value = 1;
    expect(() => c.value).to.throw();
    expect(spy).toBeCalledTimes(2);
  });

  it("should store thrown non-errors and recompute only after a dependency changes", () => {
    const a = val(0);
    const spy = vi.fn();
    const c = compute((get: Get) => {
      get(a);
      spy();
      throw undefined;
    });

    try {
      c.value;
      expect.fail();
    } catch (err) {
      expect(err).toBeUndefined();
    }
    try {
      c.value;
      expect.fail();
    } catch (err) {
      expect(err).toBeUndefined();
    }
    expect(spy).toBeCalledTimes(1);

    a.value = 1;
    try {
      c.value;
      expect.fail();
    } catch (err) {
      expect(err).toBeUndefined();
    }
    expect(spy).toBeCalledTimes(2);
  });

  it("should conditionally unsubscribe from signals", () => {
    const a = val("a");
    const b = val("b");
    const cond = val(true);

    const spy = vi.fn((get: Get) => {
      return get(cond) ? get(a) : get(b);
    });

    const c = compute(spy);
    expect(c.value).toEqual("a");
    expect(spy).toBeCalledTimes(1);

    b.value = "bb";
    expect(c.value).toEqual("a");
    expect(spy).toBeCalledTimes(1);

    cond.value = false;
    expect(c.value).toEqual("bb");
    expect(spy).toBeCalledTimes(2);

    spy.mockClear();

    a.value = "aaa";
    expect(c.value).toEqual("bb");
    expect(spy).toBeCalledTimes(0);
  });

  it("should consider undefined value separate from uninitialized value", () => {
    const a = val(0);
    const spy = vi.fn(() => undefined);
    const c = compute(spy);

    expect(c.value).toBeUndefined();
    a.value = 1;
    expect(c.value).toBeUndefined();
    expect(spy).toBeCalledTimes(1);
  });

  it("should not leak errors raised by dependencies", () => {
    const a = val(0);
    const b = compute((get: Get) => {
      get(a);
      throw new Error("error");
    });
    const c = compute((get: Get) => {
      try {
        get(b);
      } catch {
        return "ok";
      }
    });
    expect(c.value).toEqual("ok");
    a.value = 1;
    expect(c.value).toEqual("ok");
  });

  it("should propagate notifications even right after first subscription", () => {
    const a = val(0);
    const b = compute((get: Get) => get(a));
    const c = compute((get: Get) => get(b));
    c.value;

    const spy = vi.fn((get: Get) => {
      get(c);
    });

    watch(spy);
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    a.value = 1;
    expect(spy).toBeCalledTimes(1);
  });

  it("should get marked as outdated right after first subscription", () => {
    const s = val(0);
    const c = compute((get: Get) => get(s));
    expect(c.value).toBe(0);

    s.value = 1;
    watch((get: Get) => {
      get(c);
    });
    expect(c.value).toBe(1);
  });

  it("should propagate notification to other listeners after one listener is disposed", () => {
    const s = val(0);
    const c = compute((get: Get) => get(s));

    const spy1 = vi.fn((get: Get) => {
      get(c);
    });
    const spy2 = vi.fn((get: Get) => {
      get(c);
    });
    const spy3 = vi.fn((get: Get) => {
      get(c);
    });

    watch(spy1);
    const dispose = watch(spy2);
    watch(spy3);

    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(1);

    dispose();

    s.value = 1;
    expect(spy1).toBeCalledTimes(2);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(2);
  });

  it("should not recompute dependencies out of order", () => {
    const a = val(1);
    const b = val(1);
    const c = val(1);

    const spy = vi.fn((get: Get) => get(c));
    const d = compute(spy);

    const e = compute((get: Get) => {
      if (get(a) > 0) {
        get(b);
        get(d);
      } else {
        get(b);
      }
    });

    e.value;
    spy.mockClear();

    a.value = 2;
    b.value = 2;
    c.value = 2;
    e.value;
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    a.value = -1;
    b.value = -1;
    c.value = -1;
    e.value;
    expect(spy).toBeCalledTimes(0);
    spy.mockClear();
  });

  it("should not recompute dependencies unnecessarily", () => {
    const spy = vi.fn();
    const a = val(0);
    const b = val(0);
    const c = compute((get: Get) => {
      get(b);
      spy();
    });
    const d = compute((get: Get) => {
      if (get(a) === 0) {
        get(c);
      }
    });
    d.value;
    expect(spy).toBeCalledTimes(1);

    batch(() => {
      b.value = 1;
      a.value = 1;
    });
    d.value;
    expect(spy).toBeCalledTimes(1);
  });
});

describe(".get", () => {
  it("should get value", () => {
    const s = val(1);
    const c = compute(() => s.value);
    expect(c.value).toEqual(1);
    expect(c.get()).toEqual(1);
  });

  it("should throw when evaluation throws", () => {
    const c = compute(() => {
      throw Error("test");
    });
    expect(() => c.get()).to.throw("test");
    expect(() => c.value).to.throw("test");
  });

  it("should throw when previous evaluation threw and dependencies haven't changed", () => {
    const c = compute(() => {
      throw Error("test");
    });
    expect(() => c.value).to.throw("test");
    expect(() => c.get()).to.throw("test");
  });

  it("should refresh value if stale", () => {
    const a = val(1);
    const b = compute((get: Get) => get(a));
    expect(b.value).toEqual(1);

    a.value = 2;
    expect(b.value).toEqual(2);
  });

  it("should detect simple dependency cycles", () => {
    const a: ReadonlyVal = compute((get: Get) => get(a));
    expect(() => a.value).to.throw(/Cycle detected/);
  });

  it("should detect deep dependency cycles", () => {
    const a: ReadonlyVal = compute((get: Get) => get(b));
    const b: ReadonlyVal = compute((get: Get) => get(c));
    const c: ReadonlyVal = compute((get: Get) => get(d));
    const d: ReadonlyVal = compute(() => a.value);
    expect(() => a.value).to.throw(/Cycle detected/);
  });

  it("should not make surrounding effect depend on the computed", () => {
    const s = val(1);
    const c = compute((get: Get) => get(s));
    const spy = vi.fn(() => {
      c.value;
    });

    watch(spy);
    expect(spy).toBeCalledTimes(1);

    s.value = 2;
    expect(spy).toBeCalledTimes(1);
  });

  it("should not make surrounding computed depend on the computed", () => {
    const s = val(1);
    const c = compute((get: Get) => get(s));

    const spy = vi.fn(() => {
      c.value;
    });

    const d = compute(spy);
    d.value;
    expect(spy).toBeCalledTimes(1);

    s.value = 2;
    d.value;
    expect(spy).toBeCalledTimes(1);
  });

  it("should not make surrounding effect depend on the peeked computed's dependencies", () => {
    const a = val(1);
    const b = compute((get: Get) => get(a));
    const spy = vi.fn();
    watch(() => {
      spy();
      b.value;
    });
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    a.value = 1;
    expect(spy).toBeCalledTimes(0);
  });

  it("should not make surrounding computed depend on peeked computed's dependencies", () => {
    const a = val(1);
    const b = compute((get: Get) => get(a));
    const spy = vi.fn();
    const d = compute(() => {
      spy();
      b.value;
    });
    d.value;
    expect(spy).toBeCalledTimes(1);
    spy.mockClear();

    a.value = 1;
    d.value;
    expect(spy).toBeCalledTimes(0);
  });
});

describe("garbage collection", function () {
  // 		// Skip GC tests if window.gc/global.gc is not defined.
  // 		before(function () {
  // 			if (typeof gc === "undefined") {
  // 				this.skip();
  // 			}
  // 		});

  it("should be garbage collectable if nothing is listening to its changes", async () => {
    const s = val(0);
    const ref = new WeakRef(compute((get: Get) => get(s)));

    (gc as () => void)();
    await new Promise(resolve => setTimeout(resolve, 0));
    (gc as () => void)();
    expect(ref.deref()).toBeUndefined();
  });

  it("should be garbage collectable after it has lost all of its listeners", async () => {
    const s = val(0);

    let ref: WeakRef<ReadonlyVal>;
    let dispose: () => void;
    (function () {
      const c = compute((get: Get) => get(s));
      ref = new WeakRef(c);
      dispose = watch((get: Get) => {
        get(c);
      });
    })();

    dispose();
    (gc as () => void)();
    await new Promise(resolve => setTimeout(resolve, 0));
    (gc as () => void)();
    expect(ref.deref()).toBeUndefined();
  });
});

describe("graph updates", () => {
  it("should run computeds once for multiple dep changes", async () => {
    const a = val("a");
    const b = val("b");

    const spy = vi.fn((get: Get) => {
      // debugger;
      return get(a) + get(b);
    });
    const c = compute(spy);

    expect(c.value).toEqual("ab");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockClear();

    a.value = "aa";
    b.value = "bb";
    c.value;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should drop A->B->A updates", async () => {
    //     A
    //   / |
    //  B  | <- Looks like a flag doesn't it? :D
    //   \ |
    //     C
    //     |
    //     D
    const a = val(2);

    const b = compute((get: Get) => get(a) - 1);
    const c = compute((get: Get) => get(a) + get(b));

    const spy = vi.fn((get: Get) => "d: " + get(c));
    const d = compute(spy);

    // Trigger read
    expect(d.value).toEqual("d: 3");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockClear();

    a.value = 4;
    d.value;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should only update every signal once (diamond graph)", () => {
    // In this scenario "D" should only update once when "A" receives
    // an update. This is sometimes referred to as the "diamond" scenario.
    //     A
    //   /   \
    //  B     C
    //   \   /
    //     D
    const a = val("a");
    const b = compute((get: Get) => get(a));
    const c = compute((get: Get) => get(a));

    const spy = vi.fn((get: Get) => get(b) + " " + get(c));
    const d = compute(spy);

    expect(d.value).toEqual("a a");
    expect(spy).toBeCalledTimes(1);

    a.value = "aa";
    expect(d.value).toEqual("aa aa");
    expect(spy).toBeCalledTimes(2);
  });

  it("should only update every signal once (diamond graph + tail)", () => {
    // "E" will be likely updated twice if our mark+sweep logic is buggy.
    //     A
    //   /   \
    //  B     C
    //   \   /
    //     D
    //     |
    //     E
    const a = val("a");
    const b = compute((get: Get) => get(a));
    const c = compute((get: Get) => get(a));

    const d = compute((get: Get) => get(b) + " " + get(c));

    const spy = vi.fn((get: Get) => get(d));
    const e = compute(spy);

    expect(e.value).toEqual("a a");
    expect(spy).toBeCalledTimes(1);

    a.value = "aa";
    expect(e.value).toEqual("aa aa");
    expect(spy).toBeCalledTimes(2);
  });

  it("should bail out if result is the same", () => {
    // Bail out if value of "B" never changes
    // A->B->C
    const a = val("a");
    const b = compute((get: Get) => {
      get(a);
      return "foo";
    });

    const spy = vi.fn((get: Get) => get(b));
    const c = compute(spy);

    expect(c.value).toEqual("foo");
    expect(spy).toBeCalledTimes(1);

    a.value = "aa";
    expect(c.value).toEqual("foo");
    expect(spy).toBeCalledTimes(1);
  });

  it("should only update every signal once (jagged diamond graph + tails)", () => {
    // "F" and "G" will be likely updated twice if our mark+sweep logic is buggy.
    //     A
    //   /   \
    //  B     C
    //  |     |
    //  |     D
    //   \   /
    //     E
    //   /   \
    //  F     G
    const a = val("a");

    const b = compute((get: Get) => get(a));
    const c = compute((get: Get) => get(a));

    const d = compute((get: Get) => get(c));

    const eSpy = vi.fn((get: Get) => get(b) + " " + get(d));
    const e = compute(eSpy);

    const fSpy = vi.fn((get: Get) => get(e));
    const f = compute(fSpy);
    const gSpy = vi.fn((get: Get) => get(e));
    const g = compute(gSpy);

    expect(f.value).toEqual("a a");
    expect(fSpy).toBeCalledTimes(1);

    expect(g.value).toEqual("a a");
    expect(gSpy).toBeCalledTimes(1);

    eSpy.mockClear();
    fSpy.mockClear();
    gSpy.mockClear();

    a.value = "b";

    expect(e.value).toEqual("b b");
    expect(eSpy).toBeCalledTimes(1);

    expect(f.value).toEqual("b b");
    expect(fSpy).toBeCalledTimes(1);

    expect(g.value).toEqual("b b");
    expect(gSpy).toBeCalledTimes(1);

    eSpy.mockClear();
    fSpy.mockClear();
    gSpy.mockClear();

    a.value = "c";

    expect(e.value).toEqual("c c");
    expect(eSpy).toBeCalledTimes(1);

    expect(f.value).toEqual("c c");
    expect(fSpy).toBeCalledTimes(1);

    expect(g.value).toEqual("c c");
    expect(gSpy).toBeCalledTimes(1);

    // top to bottom
    expect(eSpy).toHaveBeenCalledBefore(fSpy);
    // left to right
    expect(fSpy).toHaveBeenCalledBefore(gSpy);
  });

  it("should only subscribe to signals listened to", () => {
    //    *A
    //   /   \
    // *B     C <- we don't listen to C
    const a = val("a");

    const b = compute((get: Get) => get(a));
    const spy = vi.fn((get: Get) => get(a));
    compute(spy);

    expect(b.value).toEqual("a");
    expect(spy).toBeCalledTimes(0);

    a.value = "aa";
    expect(b.value).toEqual("aa");
    expect(spy).toBeCalledTimes(0);
  });

  it("should only subscribe to signals listened to", () => {
    // Here both "B" and "C" are active in the beginning, but
    // "B" becomes inactive later. At that point it should
    // not receive any updates anymore.
    //    *A
    //   /   \
    // *B     D <- we don't listen to C
    //  |
    // *C
    const a = val("a");
    const spyB = vi.fn((get: Get) => get(a));
    const b = compute(spyB);

    const spyC = vi.fn((get: Get) => get(b));
    const c = compute(spyC);

    const d = compute((get: Get) => get(a));

    let result = "";
    const dispose = watch((get: Get) => {
      result = get(c);
    });

    expect(result).toEqual("a");
    expect(d.value).toEqual("a");

    spyB.mockClear();
    spyC.mockClear();
    dispose();

    a.value = "aa";

    expect(spyB).toBeCalledTimes(0);
    expect(spyC).toBeCalledTimes(0);
    expect(d.value).toEqual("aa");
  });

  it("should ensure subs update even if one dep un-marks it", () => {
    // In this scenario "C" always returns the same value. When "A"
    // changes, "B" will update, then "C" at which point its update
    // to "D" will be unmarked. But "D" must still update because
    // "B" marked it. If "D" isn't updated, then we have a bug.
    //     A
    //   /   \
    //  B     *C <- returns same value every time
    //   \   /
    //     D
    const a = val("a");
    const b = compute((get: Get) => get(a));
    const c = compute((get: Get) => {
      get(a);
      return "c";
    });
    const spy = vi.fn((get: Get) => get(b) + " " + get(c));
    const d = compute(spy);
    expect(d.value).toEqual("a c");
    spy.mockClear();

    a.value = "aa";
    d.value;
    expect(spy).toReturnWith("aa c");
  });

  it("should ensure subs update even if two deps un-mark it", () => {
    // In this scenario both "C" and "D" always return the same
    // value. But "E" must still update because "A"  marked it.
    // If "E" isn't updated, then we have a bug.
    //     A
    //   / | \
    //  B *C *D
    //   \ | /
    //     E
    const a = val("a");
    const b = compute((get: Get) => get(a));
    const c = compute((get: Get) => {
      get(a);
      return "c";
    });
    const d = compute((get: Get) => {
      get(a);
      return "d";
    });
    const spy = vi.fn((get: Get) => get(b) + " " + get(c) + " " + get(d));
    const e = compute(spy);
    expect(e.value).toEqual("a c d");
    spy.mockClear();

    a.value = "aa";
    e.value;
    expect(spy).toReturnWith("aa c d");
  });
});

describe("error handling", () => {
  it("should NOT throw when writing to computeds", () => {
    const a = val("a");
    const b = compute((get: Get) => get(a));
    const fn = () => ((b as Val).value = "aa");
    // expect(fn).to.throw(/Cannot set property value/);
    /**
     * @divergence follow the native getter and setter behaviors
     */
    expect(fn).not.to.throw();
    expect(b.value).toBe("a");
  });

  it("should keep graph consistent on errors during activation", () => {
    const a = val(0);
    const b = compute(() => {
      throw new Error("fail");
    });
    const c = compute((get: Get) => get(a));
    expect(() => b.value).to.throw("fail");

    a.value = 1;
    expect(c.value).toEqual(1);
  });

  it("should keep graph consistent on errors in computeds", () => {
    const a = val(0);
    const b = compute((get: Get) => {
      if (get(a) === 1) throw new Error("fail");
      return get(a);
    });
    const c = compute((get: Get) => get(b));
    expect(c.value).toEqual(0);

    a.value = 1;
    expect(() => b.value).to.throw("fail");

    a.value = 2;
    expect(c.value).toEqual(2);
  });

  it("should support lazy branches", () => {
    const a = val(0);
    const b = compute((get: Get) => get(a));
    const c = compute((get: Get) => (get(a) > 0 ? get(a) : get(b)));

    expect(c.value).toEqual(0);
    a.value = 1;
    expect(c.value).toEqual(1);

    a.value = 0;
    expect(c.value).toEqual(0);
  });

  it("should not update a sub if all deps unmark it", () => {
    // In this scenario "B" and "C" always return the same value. When "A"
    // changes, "D" should not update.
    //     A
    //   /   \
    // *B     *C
    //   \   /
    //     D
    const a = val("a");
    const b = compute((get: Get) => {
      get(a);
      return "b";
    });
    const c = compute((get: Get) => {
      get(a);
      return "c";
    });
    const spy = vi.fn((get: Get) => get(b) + " " + get(c));
    const d = compute(spy);
    expect(d.value).toEqual("b c");
    spy.mockClear();

    a.value = "aa";
    expect(spy).toBeCalledTimes(0);
  });
});

describe("batch/transaction", () => {
  it("should return the value from the callback", () => {
    expect(batch(() => 1)).toEqual(1);
  });

  it("should throw errors thrown from the callback", () => {
    expect(() =>
      batch(() => {
        throw Error("hello");
      }),
    ).to.throw("hello");
  });

  it("should throw non-errors thrown from the callback", () => {
    try {
      batch(() => {
        throw undefined;
      });
      expect.fail();
    } catch (err) {
      expect(err).toBeUndefined();
    }
  });

  it("should delay writes", () => {
    const a = val("a");
    const b = val("b");
    const spy = vi.fn((get: Get) => {
      get(a) + " " + get(b);
    });
    watch(spy);
    spy.mockClear();
    batch(() => {
      a.value = "aa";
      b.value = "bb";
    });
    expect(spy).toBeCalledTimes(1);
  });

  it("should delay writes until outermost batch is complete", () => {
    const a = val("a");
    const b = val("b");
    const spy = vi.fn((get: Get) => {
      get(a) + ", " + get(b);
    });
    watch(spy);
    spy.mockClear();
    batch(() => {
      batch(() => {
        a.value += " inner";
        b.value += " inner";
      });
      a.value += " outer";
      b.value += " outer";
    });
    // If the inner batch() would have flushed the update
    // this spy would've been called twice.
    expect(spy).toBeCalledTimes(1);
  });

  it("should read signals written to", () => {
    const a = val("a");
    let result = "";
    batch(() => {
      a.value = "aa";
      result = a.value;
    });
    expect(result).toEqual("aa");
  });

  it("should read computed signals with updated source signals", () => {
    // A->B->C->D->E
    const a = val("a");
    const b = compute((get: Get) => get(a));
    const spyC = vi.fn((get: Get) => get(b));
    const c = compute(spyC);
    const spyD = vi.fn((get: Get) => get(c));
    const d = compute(spyD);
    const spyE = vi.fn((get: Get) => get(d));
    const e = compute(spyE);
    spyC.mockClear();
    spyD.mockClear();
    spyE.mockClear();
    let result = "";
    batch(() => {
      a.value = "aa";
      result = c.value;
      // Since "D" isn't accessed during batching, we should not
      // update it, only after batching has completed
      expect(spyD).toBeCalledTimes(0);
    });
    expect(result).toEqual("aa");
    expect(d.value).toEqual("aa");
    expect(e.value).toEqual("aa");
    expect(spyC).toBeCalledTimes(1);
    expect(spyD).toBeCalledTimes(1);
    expect(spyE).toBeCalledTimes(1);
  });

  it("should not block writes after batching completed", () => {
    // If no further writes after batch() are possible, than we
    // didn't restore state properly. Most likely "pending" still
    // holds elements that are already processed.
    const a = val("a");
    const b = val("b");
    const c = val("c");
    const d = compute((get: Get) => get(a) + " " + get(b) + " " + get(c));
    let result: string | undefined;
    watch((get: Get) => {
      result = get(d);
    });
    batch(() => {
      a.value = "aa";
      b.value = "bb";
    });
    c.value = "cc";
    expect(result).toEqual("aa bb cc");
  });

  it("should not lead to stale signals with .value in batch", () => {
    const invokes: number[][] = [];
    const counter = val(0);
    const double = compute((get: Get) => get(counter) * 2);
    const triple = compute((get: Get) => get(counter) * 3);
    watch(get => {
      invokes.push([get(double), get(triple)]);
    });
    expect(invokes).toEqual([[0, 0]]);
    batch(() => {
      counter.value = 1;
      expect(double.value).toEqual(2);
    });
    expect(invokes[1]).toEqual([2, 3]);
  });

  it("should not lead to stale signals with peek() in batch", () => {
    const invokes: number[][] = [];
    const counter = val(0);
    const double = compute(get => get(counter) * 2);
    const triple = compute(get => get(counter) * 3);
    watch(get => {
      invokes.push([get(double), get(triple)]);
    });
    expect(invokes).toEqual([[0, 0]]);
    batch(() => {
      counter.value = 1;
      expect(double.value).toEqual(2);
    });
    expect(invokes[1]).toEqual([2, 3]);
  });

  it("should run pending effects even if the callback throws", () => {
    const a = val(0);
    const b = val(1);
    const spy1 = vi.fn((get: Get) => {
      get(a);
    });
    const spy2 = vi.fn((get: Get) => {
      get(b);
    });
    watch(spy1);
    watch(spy2);
    spy1.mockClear();
    spy2.mockClear();
    expect(() =>
      batch(() => {
        a.value++;
        b.value++;
        throw Error("hello");
      }),
    ).to.throw("hello");
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
  });

  it("should run pending effects even if some effects throw", () => {
    const a = val(0);
    const spy1 = vi.fn((get: Get) => {
      get(a);
    });
    const spy2 = vi.fn((get: Get) => {
      get(a);
    });
    watch(get => {
      if (get(a) === 1) {
        throw new Error("hello");
      }
    });
    watch(spy1);
    watch(get => {
      if (get(a) === 1) {
        throw new Error("hello");
      }
    });
    watch(spy2);
    watch((get: Get) => {
      if (get(a) === 1) {
        throw new Error("hello");
      }
    });
    spy1.mockClear();
    spy2.mockClear();
    expect(() =>
      batch(() => {
        a.value++;
      }),
    ).to.throw("hello");
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
  });

  it("should run effect's first run immediately even inside a batch", () => {
    let callCount = 0;
    const spy = vi.fn();
    batch(() => {
      watch(spy);
      callCount = spy.mock.calls.length;
    });
    expect(callCount).toEqual(1);
  });
});

/**
 * @divergence No need for untracked
 */
// describe("untracked", () => {
// 	it("should block tracking inside effects", () => {
// 		const a = val(1);
// 		const b = val(2);
// 		const spy = vi.fn(() => {
// 			a.value + b.value;
// 		});
// 		watch(() => untracked(spy));
// 		expect(spy).toBeCalledTimes(1);

// 		a.value = 10;
// 		b.value = 20;
// 		expect(spy).toBeCalledTimes(1);
// 	});

// 	it("should block tracking even when run inside effect run inside untracked", () => {
// 		const s = val(1);
// 		const spy = vi.fn(() => s.value);

// 		untracked(() =>
// 			watch(() => {
// 				untracked(spy);
// 			})
// 		);
// 		expect(spy).toBeCalledTimes(1);

// 		s.value = 2;
// 		expect(spy).toBeCalledTimes(1);
// 	});

// 	it("should not cause signal assignments throw", () => {
// 		const a = val(1);
// 		const aChangedTime = val(0);

// 		const dispose = watch(() => {
// 			a.value;
// 			untracked(() => {
// 				aChangedTime.value = aChangedTime.value + 1;
// 			});
// 		});

// 		expect(() => (a.value = 2)).not.to.throw();
// 		expect(aChangedTime.value).toEqual(2);
// 		a.value = 3;
// 		expect(aChangedTime.value).toEqual(3);

// 		dispose();
// 	});

// 	it("should block tracking inside computed signals", () => {
// 		const a = val(1);
// 		const b = val(2);
// 		const spy = vi.fn(() => a.value + b.value);
// 		const c = compute(() => untracked(spy));

// 		expect(spy).to.not.be.called;
// 		expect(c.value).toEqual(3);
// 		a.value = 10;
// 		c.value;
// 		b.value = 20;
// 		c.value;
// 		expect(spy).toBeCalledTimes(1);
// 		expect(c.value).toEqual(3);
// 	});
// });
