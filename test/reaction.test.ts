import { describe, expect, it, jest } from "@jest/globals";
import { nextTick, reaction, val } from "../src";

describe("reaction", () => {
  it("should reaction", async () => {
    const v$ = val(1);
    const spyReaction = jest.fn();
    const disposer = reaction(v$, spyReaction);

    expect(spyReaction).toBeCalledTimes(0);

    v$.set(2);

    expect(spyReaction).toBeCalledTimes(0);

    await nextTick();

    expect(spyReaction).toBeCalledTimes(1);
    expect(spyReaction).toBeCalledWith(2);

    spyReaction.mockClear();

    disposer();

    expect(spyReaction).toBeCalledTimes(0);

    v$.set(2);

    expect(spyReaction).toBeCalledTimes(0);

    await nextTick();

    expect(spyReaction).toBeCalledTimes(0);
  });

  it("should reaction eager", async () => {
    const v$ = val(1);
    const spyReaction = jest.fn();
    const disposer = reaction(v$, spyReaction, true);

    expect(spyReaction).toBeCalledTimes(0);

    v$.set(2);

    expect(spyReaction).toBeCalledTimes(1);
    expect(spyReaction).toBeCalledWith(2);

    spyReaction.mockClear();

    disposer();

    expect(spyReaction).toBeCalledTimes(0);

    v$.set(2);

    expect(spyReaction).toBeCalledTimes(0);

    await nextTick();

    expect(spyReaction).toBeCalledTimes(0);
  });
});
