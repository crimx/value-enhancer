import { describe, it, expect } from "@jest/globals";
import type { ReadonlyVal } from "../src";
import { setValue, val, derive } from "../src";

describe("setValue", () => {
  it("should setValue to Val", async () => {
    const v = val(1);
    setValue(v, 2);
    expect(v.value).toBe(2);
  });

  it("should setValue to Val with type of ReadonlyVal", async () => {
    const v = val(1) as ReadonlyVal<number>;

    // @ts-expect-error - type ReadonlyVal does not have set method
    v.set(2);
    expect(v.value).toBe(2);

    setValue(v, 3);
    expect(v.value).toBe(3);
  });

  it("should do nothing to actual ReadonlyVal", async () => {
    const v = derive(val(1));

    setValue(v, 2);
    expect(v.value).toBe(1);
  });
});
