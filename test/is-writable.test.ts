import { describe, expect, it } from "@jest/globals";
import type { ReadonlyVal } from "../src";
import { combine, flatten, isWritable, readonlyVal, val } from "../src";

describe("isWritable", () => {
  it("should return true for val", () => {
    const val$ = val(1);
    expect(isWritable(val$)).toBe(true);
  });

  it("should return false for readonly val", () => {
    const [val$] = readonlyVal(1);
    expect(isWritable(val$)).toBe(false);
  });

  it("should return false for combined val", () => {
    const val$ = combine([val(1)]);
    expect(isWritable(val$)).toBe(false);
  });

  it("should return false for flatten val", () => {
    const val$ = flatten(val(val(1)));
    expect(isWritable(val$)).toBe(false);
  });

  it("should type error if param is not val", () => {
    const value = 1;
    // @ts-expect-error value not val
    expect(isWritable(value)).toBe(false);
  });

  it("should narrow types", () => {
    const createVal = (): ReadonlyVal<number> => val(1);
    const val$ = createVal();
    // @ts-expect-error ReadonlyVal does not have `set`
    val$.set;
    if (isWritable(val$)) {
      val$.set(2);
    }
    expect(val$.value).toBe(2);
  });
});
