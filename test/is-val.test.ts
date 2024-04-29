import { describe, expect, it } from "@jest/globals";
import type { Val } from "../src";
import { combine, derive, flatten, identity, isVal, val } from "../src";

describe("isVal", () => {
  it("should check Val", () => {
    const val$ = val(1);
    expect(isVal(val$)).toBe(true);
  });

  it("should check DerivedVal", () => {
    const val$ = derive(val(1), identity);
    expect(isVal(val$)).toBe(true);
  });

  it("should check CombinedVal", () => {
    const val$ = combine([val(1)]);
    expect(isVal(val$)).toBe(true);
  });

  it("should check FlattenedVal", () => {
    const val$ = flatten(val(val(1)));
    expect(isVal(val$)).toBe(true);
  });

  it("should return false if not val", () => {
    const value = 1;
    expect(isVal(value)).toBe(false);
  });

  it("should narrow types", () => {
    const createVal = (): Val<number> | Val<string> | undefined => val(1);
    const val$: Val<number> | Val<string> | undefined = createVal();
    expect(isVal(val$)).toBe(true);
    if (isVal(val$)) {
      // @ts-expect-error string and number
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _value: string = val$.value;
      const value: number | string = val$.value;
      expect(value).toBe(1);
    }
  });
});
