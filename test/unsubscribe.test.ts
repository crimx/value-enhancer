import { describe, expect, it, jest } from "@jest/globals";
import { nextTick, unsubscribe, val } from "../src";

describe("unsubscribe", () => {
  it("should unsubscribe a subscribe callback", async () => {
    const spySubscribe1 = jest.fn();
    const spySubscribe2 = jest.fn();
    const v$ = val<number>(1);

    v$.subscribe(function sub1(...args) {
      unsubscribe(v$, sub1);
      spySubscribe1(...args);
    });
    v$.subscribe(spySubscribe2);

    expect(spySubscribe1).toBeCalledTimes(1);
    expect(spySubscribe2).toBeCalledTimes(1);

    expect(spySubscribe1).lastCalledWith(1);
    expect(spySubscribe2).lastCalledWith(1);

    v$.set(2);
    await nextTick();
    expect(v$.value).toBe(2);
    expect(spySubscribe1).toBeCalledTimes(1);
    expect(spySubscribe2).toBeCalledTimes(2);
    expect(spySubscribe1).lastCalledWith(1);
    expect(spySubscribe2).lastCalledWith(2);

    unsubscribe(v$);
  });

  it("should unsubscribe a reaction callback", async () => {
    const spySubscribe1 = jest.fn();
    const spySubscribe2 = jest.fn();
    const v$ = val<number>(1);

    v$.reaction(function sub1(...args) {
      unsubscribe(v$, sub1);
      spySubscribe1(...args);
    });
    v$.reaction(spySubscribe2);

    expect(spySubscribe1).toBeCalledTimes(0);
    expect(spySubscribe2).toBeCalledTimes(0);

    v$.set(2);
    await nextTick();
    expect(v$.value).toBe(2);
    expect(spySubscribe1).toBeCalledTimes(1);
    expect(spySubscribe2).toBeCalledTimes(1);
    expect(spySubscribe1).lastCalledWith(2);
    expect(spySubscribe2).lastCalledWith(2);

    v$.set(3);
    await nextTick();
    expect(v$.value).toBe(3);
    expect(spySubscribe1).toBeCalledTimes(1);
    expect(spySubscribe2).toBeCalledTimes(2);
    expect(spySubscribe1).lastCalledWith(2);
    expect(spySubscribe2).lastCalledWith(3);

    unsubscribe(v$);
  });

  it("should unsubscribe all callbacks", async () => {
    const spySubscribe1 = jest.fn();
    const spySubscribe2 = jest.fn();
    const v$ = val<number>(1);

    v$.reaction(function sub1(...args) {
      unsubscribe(v$, sub1);
      spySubscribe1(...args);
    });
    v$.reaction(spySubscribe2);

    expect(spySubscribe1).toBeCalledTimes(0);
    expect(spySubscribe2).toBeCalledTimes(0);

    v$.set(2);
    await nextTick();
    expect(v$.value).toBe(2);
    expect(spySubscribe1).toBeCalledTimes(1);
    expect(spySubscribe2).toBeCalledTimes(1);
    expect(spySubscribe1).lastCalledWith(2);
    expect(spySubscribe2).lastCalledWith(2);

    unsubscribe(v$);

    v$.set(3);
    await nextTick();
    expect(v$.value).toBe(3);
    expect(spySubscribe1).toBeCalledTimes(1);
    expect(spySubscribe2).toBeCalledTimes(1);
    expect(spySubscribe1).lastCalledWith(2);
    expect(spySubscribe2).lastCalledWith(2);
  });
});
