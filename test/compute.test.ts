import { describe, expect, it, jest } from "@jest/globals";
import { compute, nextTick, val } from "../src";

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
});
