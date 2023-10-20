import { describe, expect, it, jest } from "@jest/globals";
import { ReactiveList } from "../../src/collections";

describe("ReactiveList", () => {
  describe("constructor", () => {
    it("should create an empty list if no argument is passed", () => {
      const emptyList = new ReactiveList();
      expect(emptyList.array).toEqual([]);
    });
  });

  describe("array", () => {
    it("should create a list with the same elements as the array-like object passed as argument", () => {
      const list = new ReactiveList([1, 2, 3]);
      expect(list.array).toEqual([1, 2, 3]);
    });
  });

  describe("length", () => {
    it("should return the number of elements in the list", () => {
      const list1 = new ReactiveList();
      expect(list1.length).toBe(0);

      const list2 = new ReactiveList([1, 2, 3]);
      expect(list2.length).toBe(3);
    });

    it("should set the length of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.length = 2;
      expect(list.array).toEqual([1, 2]);
    });
  });

  describe("Symbol.iterator", () => {
    it("should return an iterator over the elements of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      const iterator = list[Symbol.iterator]();
      expect(iterator.next()).toEqual({ value: 1, done: false });
      expect(iterator.next()).toEqual({ value: 2, done: false });
      expect(iterator.next()).toEqual({ value: 3, done: false });
      expect(iterator.next()).toEqual({ value: undefined, done: true });
    });

    it("should be able to clone as array via spreading", () => {
      const list = new ReactiveList([1, 2, 3]);
      expect([...list]).toEqual([1, 2, 3]);
    });
  });

  describe("entries", () => {
    it("should return an iterator over the key-value pairs of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      const iterator = list.entries();
      expect(iterator.next()).toEqual({ value: [0, 1], done: false });
      expect(iterator.next()).toEqual({ value: [1, 2], done: false });
      expect(iterator.next()).toEqual({ value: [2, 3], done: false });
      expect(iterator.next()).toEqual({ value: undefined, done: true });
    });
  });

  describe("values", () => {
    it("should return an iterator over the values of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      const iterator = list.values();
      expect(iterator.next()).toEqual({ value: 1, done: false });
      expect(iterator.next()).toEqual({ value: 2, done: false });
      expect(iterator.next()).toEqual({ value: 3, done: false });
      expect(iterator.next()).toEqual({ value: undefined, done: true });
    });
  });

  describe("keys", () => {
    it("should return an iterator over the keys of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      const iterator = list.keys();
      expect(iterator.next()).toEqual({ value: 0, done: false });
      expect(iterator.next()).toEqual({ value: 1, done: false });
      expect(iterator.next()).toEqual({ value: 2, done: false });
      expect(iterator.next()).toEqual({ value: undefined, done: true });
    });
  });

  describe("get", () => {
    it("should return the element at the specified index", () => {
      const list = new ReactiveList([1, 2, 3]);
      expect(list.get(0)).toBe(1);
    });

    it("should ignore negative index", () => {
      const list = new ReactiveList([1, 2, 3]);
      expect(list.get(-1)).toBe(undefined);
    });
  });

  describe("first", () => {
    it("should return the first element of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      expect(list.first()).toBe(1);
    });

    it("should return undefined if the list is empty", () => {
      const list = new ReactiveList();
      expect(list.first()).toBe(undefined);
    });
  });

  describe("last", () => {
    it("should return the last element of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      expect(list.last()).toBe(3);
    });

    it("should return undefined if the list is empty", () => {
      const list = new ReactiveList();
      expect(list.last()).toBe(undefined);
    });
  });

  describe("push", () => {
    it("should add an element to the end of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.push(4);
      expect(list.array).toEqual([1, 2, 3, 4]);
    });

    it("should add multiple elements to the end of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.push(4, 5);
      expect(list.array).toEqual([1, 2, 3, 4, 5]);
    });

    it("should notify on push", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.push("d");
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(3);

      list.push("e");
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(4);

      list.push("f", "g");
      expect(mockNotify).toHaveBeenCalledTimes(3);
      expect(mockNotify).lastCalledWith(undefined);

      unwatch();
    });

    it("should not notify on push if pushing empty item", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.push();
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("pop", () => {
    it("should remove the last element of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.pop();
      expect(list.array).toEqual([1, 2]);
    });

    it("should return the removed element", () => {
      const list = new ReactiveList([1, 2, 3]);
      expect(list.pop()).toBe(3);
    });

    it("should notify on pop", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.pop();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(2);

      list.pop();
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(1);

      list.pop();
      expect(mockNotify).toHaveBeenCalledTimes(3);
      expect(mockNotify).lastCalledWith(0);

      unwatch();
    });

    it("should not notify on pop if the list is empty.", () => {
      const list = new ReactiveList();
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.pop();
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("pushHead", () => {
    it("should add an element to the beginning of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.pushHead(0);
      expect(list.array).toEqual([0, 1, 2, 3]);
    });

    it("should add multiple elements to the beginning of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.pushHead(-1, 0);
      expect(list.array).toEqual([-1, 0, 1, 2, 3]);
    });

    it("should notify on pushHead", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.pushHead("z");
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(undefined);

      list.pushHead("y");
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(undefined);

      list.pushHead("x", "w");
      expect(mockNotify).toHaveBeenCalledTimes(3);
      expect(mockNotify).lastCalledWith(undefined);

      unwatch();
    });

    it("should not notify on pushHead if pushing empty item", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.pushHead();
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("popHead", () => {
    it("should remove the first element of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.popHead();
      expect(list.array).toEqual([2, 3]);
    });

    it("should return the removed element", () => {
      const list = new ReactiveList([1, 2, 3]);
      expect(list.popHead()).toBe(1);
    });

    it("should notify on popHead", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.popHead();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(undefined);

      list.popHead();
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(undefined);

      list.popHead();
      expect(mockNotify).toHaveBeenCalledTimes(3);
      expect(mockNotify).lastCalledWith(undefined);

      unwatch();
    });

    it("should not notify on popHead if the list is empty.", () => {
      const list = new ReactiveList();
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.popHead();
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("set", () => {
    it("should set the element at the specified index", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.set(1, 4);
      expect(list.array).toEqual([1, 4, 3]);
    });

    it("should ignore negative index", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.set(-1, 4);
      expect(list.array).toEqual([1, 2, 3]);
    });

    it("should notify on set", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.set(1, "x");
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(1);

      list.set(0, "y");
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(0);

      unwatch();
    });

    it("should not notify on set for negative index", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.set(-2, "x");
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("insert", () => {
    it("should insert an element at the specified index", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.insert(1, 4);
      expect(list.array).toEqual([1, 4, 2, 3]);
    });

    it("should insert multiple elements at the specified index", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.insert(1, 4, 5);
      expect(list.array).toEqual([1, 4, 5, 2, 3]);
    });

    it("should ignore negative index", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.insert(-2, 4, 5);
      expect(list.array).toEqual([1, 2, 3]);
    });

    it("should notify on insert", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.insert(1, "x");
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(undefined);

      list.insert(0, "y");
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(undefined);

      unwatch();
    });

    it("should not notify on insert for negative index", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.insert(-3, "x");
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("delete", () => {
    it("should delete one element at the specified index", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.delete(1);
      expect(list.array).toEqual([1, 3]);
    });

    it("should delete the rest elements from the specified index", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.delete(1, list.length - 1);
      expect(list.array).toEqual([1]);
    });

    it("should ignore negative index", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.delete(-1);
      expect(list.array).toEqual([1, 2, 3]);
    });

    it("should notify on delete", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.delete(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(1);

      list.delete(0);
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(0);

      unwatch();
    });

    it("should not notify on delete for negative index", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.delete(-2);
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });

    it("should not notify if delete count is 0", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.delete(0, 0);
      expect(mockNotify).not.toHaveBeenCalled();

      list.delete(1, 0);
      expect(mockNotify).not.toHaveBeenCalled();

      list.delete(10, 0);
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });

    it("should not notify if list is empty", () => {
      const list = new ReactiveList([]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.delete(0, 10);
      expect(mockNotify).not.toHaveBeenCalled();

      list.delete(1, 10);
      expect(mockNotify).not.toHaveBeenCalled();

      list.delete(10, 10);
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("clear", () => {
    it("should clear the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.clear();
      expect(list.array).toEqual([]);
    });

    it("should notify on clear", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.clear();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(undefined);

      unwatch();
    });

    it("should not notify if list is empty", () => {
      const list = new ReactiveList([]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.clear();
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("replace", () => {
    it("should replace the list with the specified elements", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.replace([4, 5, 6]);
      expect(list.array).toEqual([4, 5, 6]);
    });

    it("should notify on replace", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.replace(["x", "y", "z"]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(undefined);

      unwatch();
    });

    it("should not notify if not changed", () => {
      const reactiveSet = new ReactiveList([1]);
      const mockNotify = jest.fn();
      const unwatch = reactiveSet.watch(mockNotify);

      reactiveSet.replace([2, 3]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(undefined);

      unwatch();
    });

    it("should notify if some keys are removed", () => {
      const reactiveSet = new ReactiveList([1, 2, 3]);
      const mockNotify = jest.fn();
      const unwatch = reactiveSet.watch(mockNotify);

      expect([...reactiveSet]).toEqual([1, 2, 3]);

      reactiveSet.replace([1, 2]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect([...reactiveSet]).toEqual([1, 2]);

      unwatch();
    });

    it("should return deleted entries", () => {
      const reactiveMap = new ReactiveList([1, 2, 3]);
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);

      const deleted = reactiveMap.replace([3, 4]);
      expect([...deleted]).toEqual([1, 2]);

      unwatch();
    });
  });

  describe("reverse", () => {
    it("should reverse the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      list.reverse();
      expect(list.array).toEqual([3, 2, 1]);
    });

    it("should notify on reverse", () => {
      const list = new ReactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.reverse();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(undefined);

      unwatch();
    });

    it("should not notify if list is empty", () => {
      const list = new ReactiveList([]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.reverse();
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });

    it("should not notify if list has only one element", () => {
      const list = new ReactiveList(["a"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.reverse();
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("sort", () => {
    it("should sort the list", () => {
      const list = new ReactiveList([3, 1, 2]);
      list.sort();
      expect(list.array).toEqual([1, 2, 3]);
    });

    it("should sort the list with a custom compare function", () => {
      const list = new ReactiveList([3, 1, 2]);
      list.sort((a, b) => b - a);
      expect(list.array).toEqual([3, 2, 1]);
    });

    it("should notify on sort", () => {
      const list = new ReactiveList(["c", "b", "a"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.sort();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(undefined);

      unwatch();
    });

    it("should not notify if list is empty", () => {
      const list = new ReactiveList([]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.sort();
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });

    it("should not notify if list has only one element", () => {
      const list = new ReactiveList(["a"]);
      const mockNotify = jest.fn();
      const unwatch = list.watch(mockNotify);

      list.sort();
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("toString", () => {
    it("should return a string representation of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      expect(list.toString()).toBe(list.array.toString());
    });
  });

  describe("toLocaleString", () => {
    it("should return a locale string representation of the list", () => {
      const list = new ReactiveList([1, 2, 3]);
      expect(list.toLocaleString()).toBe(list.array.toLocaleString());
    });
  });

  describe("toJSON", () => {
    it("should return the internal array", () => {
      const list = new ReactiveList([1, 2, 3]);
      expect(list.toJSON()).toBe(list.array);
    });
  });
});
