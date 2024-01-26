import { describe, expect, it, jest } from "@jest/globals";
import { nextTick, unsubscribe, val } from "../src";

describe("unsubscribe", () => {
  it("should unsubscribe a subscribe callback", async () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const val1 = val<number>(1);

    val1.subscribe(function sub1(...args) {
      unsubscribe(val1, sub1);
      spy1(...args);
    });
    val1.subscribe(spy2);

    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);

    expect(spy1).lastCalledWith(1);
    expect(spy2).lastCalledWith(1);

    val1.set(2);
    await nextTick();
    expect(val1.value).toBe(2);
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(2);
    expect(spy1).lastCalledWith(1);
    expect(spy2).lastCalledWith(2);

    unsubscribe(val1);
  });

  it("should unsubscribe a reaction callback", async () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const val1 = val<number>(1);

    val1.reaction(function sub1(...args) {
      unsubscribe(val1, sub1);
      spy1(...args);
    });
    val1.reaction(spy2);

    expect(spy1).toBeCalledTimes(0);
    expect(spy2).toBeCalledTimes(0);

    val1.set(2);
    await nextTick();
    expect(val1.value).toBe(2);
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy1).lastCalledWith(2);
    expect(spy2).lastCalledWith(2);

    val1.set(3);
    await nextTick();
    expect(val1.value).toBe(3);
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(2);
    expect(spy1).lastCalledWith(2);
    expect(spy2).lastCalledWith(3);

    unsubscribe(val1);
  });

  it("should unsubscribe all callbacks", async () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const val1 = val<number>(1);

    val1.reaction(function sub1(...args) {
      unsubscribe(val1, sub1);
      spy1(...args);
    });
    val1.reaction(spy2);

    expect(spy1).toBeCalledTimes(0);
    expect(spy2).toBeCalledTimes(0);

    val1.set(2);
    await nextTick();
    expect(val1.value).toBe(2);
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy1).lastCalledWith(2);
    expect(spy2).lastCalledWith(2);

    unsubscribe(val1);

    val1.set(3);
    await nextTick();
    expect(val1.value).toBe(3);
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy1).lastCalledWith(2);
    expect(spy2).lastCalledWith(2);
  });
});
