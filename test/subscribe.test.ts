import { describe, expect, it, jest } from "@jest/globals";
import { nextTick, subscribe, val } from "../src";

describe("subscribe", () => {
  it("should subscribe", async () => {
    const v = val(1);
    const spy1 = jest.fn();
    const disposer = subscribe(v, spy1);

    expect(spy1).toBeCalledTimes(1);
    expect(spy1).toBeCalledWith(1);

    spy1.mockClear();

    v.set(2);

    expect(spy1).toBeCalledTimes(0);

    await nextTick();

    expect(spy1).toBeCalledTimes(1);
    expect(spy1).toBeCalledWith(2);

    spy1.mockClear();

    disposer();

    expect(spy1).toBeCalledTimes(0);

    v.set(2);

    expect(spy1).toBeCalledTimes(0);

    await nextTick();

    expect(spy1).toBeCalledTimes(0);
  });

  it("should subscribe eager", async () => {
    const v = val(1);
    const spy1 = jest.fn();
    const disposer = subscribe(v, spy1, true);

    expect(spy1).toBeCalledTimes(1);
    expect(spy1).toBeCalledWith(1);

    spy1.mockClear();

    v.set(2);

    expect(spy1).toBeCalledTimes(1);
    expect(spy1).toBeCalledWith(2);

    spy1.mockClear();

    disposer();

    expect(spy1).toBeCalledTimes(0);

    v.set(2);

    expect(spy1).toBeCalledTimes(0);

    await nextTick();

    expect(spy1).toBeCalledTimes(0);
  });
});
