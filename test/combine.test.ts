import { combine, Val } from "../src/value-enhancer";

describe("combine", () => {
  it("should combine a val list into a single val", () => {
    const val1 = new Val(1);
    const val2 = new Val({ code: 2 });
    const val3 = new Val<boolean, boolean>(false);
    const val4 = new Val<string, number>("4");
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      }
    );

    const spy = jest.fn();
    combined.subscribe(spy);

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual({
      val1: 1,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });
  });

  it("should perform custom compare", () => {
    const val1 = new Val(1);
    const val2 = new Val({ code: 2 });
    const val3 = new Val<boolean, boolean>(false);
    const val4 = new Val<string, number>("4");
    const combined = combine(
      [val1, val2, val3, val4],
      ([val1, val2, val3, val4]) => {
        return { val1, val2, val3, val4 };
      },
      (a, b) => a.val2.code === b.val2.code
    );

    const spy = jest.fn();
    combined.subscribe(spy);

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual({
      val1: 1,
      val2: { code: 2 },
      val3: false,
      val4: "4",
    });

    const spy2 = jest.fn();
    val2.reaction(spy2);
    expect(spy2).toBeCalledTimes(0);

    val2.setValue({ code: 2 });
    expect(spy2).toBeCalledTimes(1);
    expect(spy).toBeCalledTimes(1);
  });
});
