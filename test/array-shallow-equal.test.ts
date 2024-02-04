import { describe, expect, it } from "@jest/globals";
import { arrayShallowEqual } from "../src";

describe("arrayShallowEqual", () => {
  it("should return false if one of arr1 or arr2 is not an array", () => {
    expect(arrayShallowEqual(null, [1, 2])).toBe(false);
    expect(arrayShallowEqual([1, 2], {})).toBe(false);
  });

  it("should return true if arr1 and arr2 are the same object or array", () => {
    const arr = [1, 2];
    expect(arrayShallowEqual(arr, arr)).toBe(true);

    expect(arrayShallowEqual(1, 1)).toBe(true);

    const obj = {};
    expect(arrayShallowEqual(obj, obj)).toBe(true);
  });

  it("should return true if arr1 and arr2 have the same values", () => {
    expect(arrayShallowEqual([1, 2], [1, 2])).toBe(true);

    const a1 = {};
    const a2 = {};
    expect(arrayShallowEqual([a1, a2], [a1, a2])).toBe(true);
  });

  it("should return true if both arr1 and arr2 are both empty array", () => {
    expect(arrayShallowEqual([], [])).toBe(true);
  });

  it("should return false if arr1 and arr2 have different length", () => {
    expect(arrayShallowEqual([1, 2, 3], [1, 2])).toBe(false);
  });
});
