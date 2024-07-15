import { describe, expect, it, jest } from "@jest/globals";
import { compute, nextTick, val } from "../src";
import { reactiveMap } from "../src/collections";

describe("compute", () => {
  it("should collect effect dynamically", async () => {
    const a$ = val(1);
    const b$ = val("b");
    const c$ = val("c");
    const s$ = compute(get => (get(a$) % 2 === 0 ? get(b$) : get(c$)));

    expect(s$.value).toBe("c");

    a$.set(2);

    expect(s$.value).toBe("b");

    const spySubscribe = jest.fn();
    s$.subscribe(spySubscribe);

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith("b");

    spySubscribe.mockClear();

    b$.set("bb");

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith("bb");

    spySubscribe.mockClear();

    c$.set("cc");

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(0);

    a$.set(3);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith("cc");

    s$.dispose();
  });

  it("should return the same value if the effect returns the same value", async () => {
    const a$ = val(1);
    const b$ = val("b");
    const c$ = val("c");
    const s$ = compute(get => (get(a$) % 2 === 0 ? get(b$) : get(c$)));

    expect(s$.value).toBe("c");

    a$.set(2);

    expect(s$.value).toBe("b");

    a$.set(4);

    expect(s$.value).toBe("b");

    s$.dispose();
  });

  it("should be able to get non-val value", async () => {
    const a$ = val(1);
    const m = reactiveMap(Object.entries({ a: a$, b: 2, c: 3 }));

    const s$ = compute(get => {
      const a$ = get(m).get("a");
      const a = get(a$);
      const b = get(2);
      return (a || 0) + b;
    });

    expect(s$.value).toBe(3);

    a$.set(2);

    expect(s$.value).toBe(4);

    m.set("a", val(3));

    expect(s$.value).toBe(5);

    const spySubscribe = jest.fn();
    s$.reaction(spySubscribe);

    m.set("a", val(4));

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).lastCalledWith(6);

    s$.dispose();
  });
});
