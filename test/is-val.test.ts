import { describe, expect, it } from "@jest/globals";
import { combine, derive, flatten, identity, isVal, val } from "../src";

describe("combine", () => {
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
});
