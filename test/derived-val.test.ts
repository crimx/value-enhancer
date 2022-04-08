import { describe, it, expect, vi } from "vitest";
import { derive, DerivedVal, Val } from "../src/value-enhancer";

describe("derive", () => {
  it("should get value without subscribe", () => {
    const val1 = new Val(1);
    const derived = derive(val1, value => value + 1);

    expect(derived).instanceOf(DerivedVal);

    expect(derived.value).toBe(2);

    val1.setValue(1);

    expect(derived.value).toEqual(2);

    val1.setValue(2);

    expect(derived.value).toEqual(3);

    derived.subscribe(vi.fn());

    expect(derived.value).toEqual(3);

    derived.destroy();
  });

  it("should derive a val into a derived val", () => {
    const val1 = new Val(1);
    const derived = derive(val1, value => value + 1);

    const spy = vi.fn();
    derived.subscribe(spy);

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual(2);

    derived.destroy();
  });

  it("should have meta from deps", () => {
    const val1 = new Val(1);
    const derived = derive(val1, value => value + 1);

    const spy = vi.fn();
    derived.subscribe(spy, 44);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(2, 44);

    val1.setValue(88, "meta");
    expect(spy).toBeCalledTimes(2);
    expect(spy).toBeCalledWith(89, "meta");

    derived.destroy();
  });

  it("should perform custom compare", () => {
    const val1 = new Val({ code: 2 });
    const derived = derive(
      val1,
      value => {
        return { content: String(value.code) };
      },
      { compare: (a, b) => a.content === b.content }
    );

    const sub = vi.fn();
    derived.subscribe(sub);

    expect(sub).toBeCalledTimes(1);
    expect(sub.mock.calls[0][0]).toEqual({ content: "2" });

    sub.mockClear();

    const sub1 = vi.fn();
    val1.reaction(sub1);
    expect(sub1).toBeCalledTimes(0);

    val1.setValue({ code: 2 });
    expect(sub).toBeCalledTimes(0);
    expect(sub1).toBeCalledTimes(1);
    expect(sub1.mock.calls[0][0]).toEqual({ code: 2 });

    sub.mockClear();
    sub1.mockClear();

    val1.setValue({ code: 3 });
    expect(sub).toBeCalledTimes(1);
    expect(sub1).toBeCalledTimes(1);
    expect(sub.mock.calls[0][0]).toEqual({ content: "3" });
    expect(sub1.mock.calls[0][0]).toEqual({ code: 3 });

    derived.destroy();
  });

  it("should work with beforeSubscribe", () => {
    const beforeSubscribe = vi.fn();
    const val1 = new Val(1);
    const derived = derive(val1, value => value + 1, { beforeSubscribe });

    expect(beforeSubscribe).toBeCalledTimes(0);

    derived.subscribe(vi.fn());

    expect(beforeSubscribe).toBeCalledTimes(1);

    derived.destroy();
  });

  it("should work with beforeSubscribe disposer", () => {
    const beforeSubscribeDisposer = vi.fn();
    const beforeSubscribe = vi.fn(() => beforeSubscribeDisposer);
    const val1 = new Val(1);
    const derived = derive(val1, value => value + 1, { beforeSubscribe });

    expect(beforeSubscribe).toBeCalledTimes(0);
    expect(beforeSubscribeDisposer).toBeCalledTimes(0);

    const disposer = derived.subscribe(vi.fn());

    expect(beforeSubscribe).toBeCalledTimes(1);
    expect(beforeSubscribeDisposer).toBeCalledTimes(0);

    disposer();

    expect(beforeSubscribe).toBeCalledTimes(1);
    expect(beforeSubscribeDisposer).toBeCalledTimes(1);

    derived.destroy();
  });

  it("should work without transform", () => {
    const val1 = new Val(1);
    const derived = derive(val1);

    expect(derived.value).toBe(1);

    val1.setValue(1);

    expect(derived.value).toEqual(1);

    val1.setValue(2);

    expect(derived.value).toEqual(2);

    derived.destroy();
  });
});
