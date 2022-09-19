import { describe, it, expect, jest } from "@jest/globals";
import { reaction, val } from "../src";

describe("reaction", () => {
  it("should reaction", async () => {
    const v = val(1);
    const spy1 = jest.fn();
    const disposer = reaction(v, spy1);

    expect(spy1).toBeCalledTimes(0);

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

  it("should reaction eager", async () => {
    const v = val(1);
    const spy1 = jest.fn();
    const disposer = reaction(v, spy1, true);

    expect(spy1).toBeCalledTimes(0);

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
