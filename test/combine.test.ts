import { describe, it, expect, vi } from "vitest";
import { combine, CombinedVal, Val } from "../src/value-enhancer";

describe("combine", () => {
  it("should get value without subscribe", () => {
    const val1 = new Val(1);
    const val2 = new Val(1);
    const val3 = new Val(1);
    const val4 = new Val(2);
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return val1 + val2 + val3 + val4;
      }
    );

    expect(combined).instanceOf(CombinedVal);

    expect(combined.value).toBe(5);

    val1.set(1);

    expect(combined.value).toEqual(5);

    val1.set(2);

    expect(combined.value).toEqual(6);

    combined.subscribe(vi.fn());

    expect(combined.value).toEqual(6);

    combined.destroy();
  });

  it("should combine a val list into a single val", () => {
    const val1 = new Val(1);
    const val2 = new Val({ code: 2 });
    const val3 = new Val<boolean>(false);
    const val4 = new Val<string>("4");
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      }
    );

    const spy = vi.fn();
    combined.subscribe(spy);

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual({
      val1: 1,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });

    combined.destroy();
  });

  it("should have meta from deps", () => {
    const val1 = new Val(1);
    const val2 = new Val({ code: 2 });
    const val3 = new Val<boolean>(false);
    const val4 = new Val<string>("4");
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      }
    );

    const spy = vi.fn();
    combined.subscribe(spy);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(
      expect.objectContaining({
        val1: 1,
        val2: { code: 2 },
        val3: false,
        val4: "4",
      })
    );

    val1.set(88);
    expect(spy).toBeCalledTimes(2);
    expect(spy).toBeCalledWith(
      expect.objectContaining({
        val1: 88,
        val2: { code: 2 },
        val3: false,
        val4: "4",
      })
    );

    combined.destroy();
  });

  it("should perform custom compare", () => {
    const val1 = new Val(1);
    const val2 = new Val({ code: 2 });
    const val3 = new Val<boolean>(false);
    const val4 = new Val<string>("4");
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      },
      { compare: (a, b) => a.val2.code === b.val2.code }
    );

    const spy = vi.fn();
    combined.subscribe(spy);

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual({
      val1: 1,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });

    const spy2 = vi.fn();
    val2.reaction(spy2);
    expect(spy2).toBeCalledTimes(0);

    val2.set({ code: 2 });
    expect(spy2).toBeCalledTimes(1);
    expect(spy).toBeCalledTimes(1);

    combined.destroy();
  });

  it("should work with beforeSubscribe", () => {
    const beforeSubscribe = vi.fn();
    const val1 = new Val(1);
    const val2 = new Val({ code: 2 });
    const val3 = new Val<boolean>(false);
    const val4 = new Val<string>("4");
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      },
      { beforeSubscribe }
    );

    expect(beforeSubscribe).toBeCalledTimes(0);

    combined.subscribe(vi.fn());

    expect(beforeSubscribe).toBeCalledTimes(1);

    combined.destroy();
  });

  it("should work with beforeSubscribe disposer", () => {
    const beforeSubscribeDisposer = vi.fn();
    const beforeSubscribe = vi.fn(() => beforeSubscribeDisposer);
    const val1 = new Val(1);
    const val2 = new Val({ code: 2 });
    const val3 = new Val<boolean>(false);
    const val4 = new Val<string>("4");
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      },
      { beforeSubscribe }
    );

    expect(beforeSubscribe).toBeCalledTimes(0);
    expect(beforeSubscribeDisposer).toBeCalledTimes(0);

    const disposer = combined.subscribe(vi.fn());

    expect(beforeSubscribe).toBeCalledTimes(1);
    expect(beforeSubscribeDisposer).toBeCalledTimes(0);

    disposer();

    expect(beforeSubscribe).toBeCalledTimes(1);
    expect(beforeSubscribeDisposer).toBeCalledTimes(1);

    combined.destroy();
  });

  it("should work without transform", () => {
    const val1 = new Val(1);
    const val2 = new Val(1);
    const val3 = new Val(1);
    const val4 = new Val(2);
    const combined = combine([val1, val2, val3, val4]);

    expect(combined.value).toEqual([1, 1, 1, 2]);

    val1.set(1);

    expect(combined.value).toEqual([1, 1, 1, 2]);

    val1.set(2);

    expect(combined.value).toEqual([2, 1, 1, 2]);

    combined.destroy();
  });
});
