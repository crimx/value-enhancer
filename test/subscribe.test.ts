import { describe, it, expect, jest } from "@jest/globals";
import { subscribe, val } from "../src";

describe("combine", () => {
  it("should subscribe", async () => {
    const v = val(1);
    const spy1 = jest.fn();
    const disposer = subscribe(v, spy1);

    expect(spy1).toBeCalledTimes(1);
    expect(spy1).toBeCalledWith(1);

    spy1.mockReset();

    v.set(2);

    expect(spy1).toBeCalledTimes(0);

    await Promise.resolve();

    expect(spy1).toBeCalledTimes(1);
    expect(spy1).toBeCalledWith(2);

    spy1.mockReset();

    disposer();

    expect(spy1).toBeCalledTimes(0);

    v.set(2);

    expect(spy1).toBeCalledTimes(0);

    await Promise.resolve();

    expect(spy1).toBeCalledTimes(0);
  });

  it("should subscribe eager", async () => {
    const v = val(1);
    const spy1 = jest.fn();
    const disposer = subscribe(v, spy1, true);

    expect(spy1).toBeCalledTimes(1);
    expect(spy1).toBeCalledWith(1);

    spy1.mockReset();

    v.set(2);

    expect(spy1).toBeCalledTimes(1);
    expect(spy1).toBeCalledWith(2);

    spy1.mockReset();

    disposer();

    expect(spy1).toBeCalledTimes(0);

    v.set(2);

    expect(spy1).toBeCalledTimes(0);

    await Promise.resolve();

    expect(spy1).toBeCalledTimes(0);
  });
});
