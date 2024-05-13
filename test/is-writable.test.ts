import { describe, expect, it } from "@jest/globals";
import type { ReadonlyVal } from "../src";
import { combine, flatten, isWritable, readonlyVal, val } from "../src";

describe("isWritable", () => {
  it("should return true for val", () => {
    const v$ = val(1);
    expect(isWritable(v$)).toBe(true);
  });

  it("should return false for readonly val", () => {
    const [v$] = readonlyVal(1);
    expect(isWritable(v$)).toBe(false);
  });

  it("should return false for combined val", () => {
    const v$ = combine([val(1)]);
    expect(isWritable(v$)).toBe(false);
  });

  it("should return false for flatten val", () => {
    const v$ = flatten(val(val(1)));
    expect(isWritable(v$)).toBe(false);
  });

  it("should type error if param is not val", () => {
    const value = 1;
    // @ts-expect-error value not val
    expect(isWritable(value)).toBe(false);
  });

  it("should narrow types", () => {
    const createVal = (): ReadonlyVal<number> => val(1);
    const v$ = createVal();
    // @ts-expect-error ReadonlyVal does not have `set`
    v$.set;
    if (isWritable(v$)) {
      v$.set(2);
    }
    expect(v$.value).toBe(2);
  });
});
