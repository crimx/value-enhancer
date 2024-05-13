import { describe, expect, it, jest } from "@jest/globals";
import { nextTick, subscribe, val } from "../src";

describe("subscribe", () => {
  it("should subscribe", async () => {
    const v$ = val(1);
    const spySubscribe = jest.fn();
    const disposer = subscribe(v$, spySubscribe);

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).toBeCalledWith(1);

    spySubscribe.mockClear();

    v$.set(2);

    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).toBeCalledWith(2);

    spySubscribe.mockClear();

    disposer();

    expect(spySubscribe).toBeCalledTimes(0);

    v$.set(2);

    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(0);
  });

  it("should subscribe eager", async () => {
    const v$ = val(1);
    const spySubscribe = jest.fn();
    const disposer = subscribe(v$, spySubscribe, true);

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).toBeCalledWith(1);

    spySubscribe.mockClear();

    v$.set(2);

    expect(spySubscribe).toBeCalledTimes(1);
    expect(spySubscribe).toBeCalledWith(2);

    spySubscribe.mockClear();

    disposer();

    expect(spySubscribe).toBeCalledTimes(0);

    v$.set(2);

    expect(spySubscribe).toBeCalledTimes(0);

    await nextTick();

    expect(spySubscribe).toBeCalledTimes(0);
  });
});
