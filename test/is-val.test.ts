import { describe, expect, it } from "@jest/globals";
import type { Val } from "../src";
import { combine, derive, flatten, identity, isVal, val } from "../src";

describe("isVal", () => {
  it("should check Val", () => {
    const v$ = val(1);
    expect(isVal(v$)).toBe(true);
  });

  it("should check DerivedVal", () => {
    const v$ = derive(val(1), identity);
    expect(isVal(v$)).toBe(true);
  });

  it("should check CombinedVal", () => {
    const v$ = combine([val(1)]);
    expect(isVal(v$)).toBe(true);
  });

  it("should check FlattenedVal", () => {
    const v$ = flatten(val(val(1)));
    expect(isVal(v$)).toBe(true);
  });

  it("should return false if not val", () => {
    const value = 1;
    expect(isVal(value)).toBe(false);
  });

  it("should narrow types", () => {
    const createVal = (): Val<number> | Val<string> | undefined => val(1);
    const v$: Val<number> | Val<string> | undefined = createVal();
    expect(isVal(v$)).toBe(true);
    if (isVal(v$)) {
      // @ts-expect-error string and number
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _value: string = v$.value;
      const value: number | string = v$.value;
      expect(value).toBe(1);
    }
  });
});
