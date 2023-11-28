import { val, type ReadonlyVal } from "../../src";

import { describe, expect, it, jest } from "@jest/globals";
import {
  ReactiveList,
  ReactiveMap,
  ReactiveSet,
  flattenFromCollection,
} from "../../src/collections";

describe("flattenFromCollection", () => {
  it("should create a Val subscribing to a key from a ReactiveMap", async () => {
    const reactiveMap = new ReactiveMap<string, ReadonlyVal<string> | string>([
      ["key", "value1"],
    ]);
    const item$ = flattenFromCollection(reactiveMap, "key");

    expect(item$.value).toBe("value1");

    reactiveMap.set("key", "value2");
    expect(item$.value).toBe("value2");

    const val3 = val("value3");
    reactiveMap.set("key", val3);
    expect(item$.value).toBe("value3");

    val3.set("value3-1");
    expect(item$.value).toBe("value3-1");

    reactiveMap.delete("key");
    expect(item$.value).toBe(undefined);

    const spy = jest.fn();
    item$.reaction(spy);

    expect(spy).not.toHaveBeenCalled();

    const val4 = val("value4");
    reactiveMap.set("key", val4);
    expect(spy).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith("value4");

    spy.mockClear();

    val4.set("value4-1");
    expect(spy).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith("value4-1");

    reactiveMap.clear();
    await Promise.resolve();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(undefined);
  });

  it("should create a Val subscribing to a key from a ReactiveSet", async () => {
    const reactiveSet = new ReactiveSet([1, 2, 3]);
    const has$ = flattenFromCollection(reactiveSet, 2);

    expect(has$.value).toBe(true);

    reactiveSet.delete(2);
    expect(has$.value).toBe(false);

    reactiveSet.add(2);

    const spy = jest.fn();
    has$.reaction(spy);

    reactiveSet.add(2);
    expect(spy).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(spy).not.toHaveBeenCalled();

    reactiveSet.delete(2);
    expect(spy).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(false);

    reactiveSet.replace([2, 3, 4, 5, 6]);
    await Promise.resolve();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(true);
  });

  it("should create a Val subscribing to a key from a ReactiveList", async () => {
    const reactiveList = new ReactiveList(["a", "b", val("c")]);
    const item$ = flattenFromCollection(reactiveList, 2);

    expect(item$.value).toBe("c");

    reactiveList.delete(2);
    expect(item$.value).toBe(undefined);

    reactiveList.insert(2, "c");
    expect(item$.value).toBe("c");

    const spy = jest.fn();
    item$.reaction(spy);

    reactiveList.set(2, val("c"));
    expect(spy).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(spy).not.toHaveBeenCalled();

    spy.mockClear();

    reactiveList.insert(0, "A");
    expect(spy).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith("b");

    spy.mockClear();

    reactiveList.replace(["A", "B", val("C")]);
    await Promise.resolve();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith("C");
  });
});
