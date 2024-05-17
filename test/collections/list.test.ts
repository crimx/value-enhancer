import { describe, expect, it, jest } from "@jest/globals";
import { nextTick } from "../../src";
import { reactiveList } from "../../src/collections";

describe("ReactiveList", () => {
  describe("constructor", () => {
    it("should create an empty list if no argument is passed", () => {
      const emptyList = reactiveList();
      expect(emptyList.array).toEqual([]);
    });
  });

  describe("array", () => {
    it("should create a list with the same elements as the array-like object passed as argument", () => {
      const list = reactiveList([1, 2, 3]);
      expect(list.array).toEqual([1, 2, 3]);
    });
  });

  describe("length", () => {
    it("should return the number of elements in the list", () => {
      const list1 = reactiveList();
      expect(list1.length).toBe(0);

      const list2 = reactiveList([1, 2, 3]);
      expect(list2.length).toBe(3);
    });

    it("should set the length of the list", () => {
      const list = reactiveList([1, 2, 3]);
      list.setLength(2);
      expect(list.array).toEqual([1, 2]);
    });
  });

  describe("Symbol.iterator", () => {
    it("should return an iterator over the elements of the list", () => {
      const list = reactiveList([1, 2, 3]);
      const iterator = list[Symbol.iterator]();
      expect(iterator.next()).toEqual({ value: 1, done: false });
      expect(iterator.next()).toEqual({ value: 2, done: false });
      expect(iterator.next()).toEqual({ value: 3, done: false });
      expect(iterator.next()).toEqual({ value: undefined, done: true });
    });

    it("should be able to clone as array via spreading", () => {
      const list = reactiveList([1, 2, 3]);
      expect([...list]).toEqual([1, 2, 3]);
    });
  });

  describe("entries", () => {
    it("should return an iterator over the key-value pairs of the list", () => {
      const list = reactiveList([1, 2, 3]);
      const iterator = list.entries();
      expect(iterator.next()).toEqual({ value: [0, 1], done: false });
      expect(iterator.next()).toEqual({ value: [1, 2], done: false });
      expect(iterator.next()).toEqual({ value: [2, 3], done: false });
      expect(iterator.next()).toEqual({ value: undefined, done: true });
    });
  });

  describe("values", () => {
    it("should return an iterator over the values of the list", () => {
      const list = reactiveList([1, 2, 3]);
      const iterator = list.values();
      expect(iterator.next()).toEqual({ value: 1, done: false });
      expect(iterator.next()).toEqual({ value: 2, done: false });
      expect(iterator.next()).toEqual({ value: 3, done: false });
      expect(iterator.next()).toEqual({ value: undefined, done: true });
    });
  });

  describe("keys", () => {
    it("should return an iterator over the keys of the list", () => {
      const list = reactiveList([1, 2, 3]);
      const iterator = list.keys();
      expect(iterator.next()).toEqual({ value: 0, done: false });
      expect(iterator.next()).toEqual({ value: 1, done: false });
      expect(iterator.next()).toEqual({ value: 2, done: false });
      expect(iterator.next()).toEqual({ value: undefined, done: true });
    });
  });

  describe("get", () => {
    it("should return the element at the specified index", () => {
      const list = reactiveList([1, 2, 3]);
      expect(list.get(0)).toBe(1);
    });

    it("should ignore negative index", () => {
      const list = reactiveList([1, 2, 3]);
      expect(list.get(-1)).toBe(undefined);
    });
  });

  describe("first", () => {
    it("should return the first element of the list", () => {
      const list = reactiveList([1, 2, 3]);
      expect(list.first()).toBe(1);
    });

    it("should return undefined if the list is empty", () => {
      const list = reactiveList();
      expect(list.first()).toBe(undefined);
    });
  });

  describe("last", () => {
    it("should return the last element of the list", () => {
      const list = reactiveList([1, 2, 3]);
      expect(list.last()).toBe(3);
    });

    it("should return undefined if the list is empty", () => {
      const list = reactiveList();
      expect(list.last()).toBe(undefined);
    });
  });

  describe("push", () => {
    it("should add an element to the end of the list", () => {
      const list = reactiveList([1, 2, 3]);
      list.push(4);
      expect(list.array).toEqual([1, 2, 3, 4]);
    });

    it("should add multiple elements to the end of the list", () => {
      const list = reactiveList([1, 2, 3]);
      list.push(4, 5);
      expect(list.array).toEqual([1, 2, 3, 4, 5]);
    });

    it("should notify on push", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.push("d");
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      list.push("e");
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(list.array);

      list.push("f", "g");
      expect(mockNotify).toHaveBeenCalledTimes(3);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify on push if pushing empty item", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.push();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("pop", () => {
    it("should remove the last element of the list", () => {
      const list = reactiveList([1, 2, 3]);
      list.pop();
      expect(list.array).toEqual([1, 2]);
    });

    it("should return the removed element", () => {
      const list = reactiveList([1, 2, 3]);
      expect(list.pop()).toBe(3);
    });

    it("should notify on pop", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.pop();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      list.pop();
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(list.array);

      list.pop();
      expect(mockNotify).toHaveBeenCalledTimes(3);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify on pop if the list is empty.", () => {
      const list = reactiveList();
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.pop();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("pushHead", () => {
    it("should add an element to the beginning of the list", () => {
      const list = reactiveList([1, 2, 3]);
      list.pushHead(0);
      expect(list.array).toEqual([0, 1, 2, 3]);
    });

    it("should add multiple elements to the beginning of the list", () => {
      const list = reactiveList([1, 2, 3]);
      list.pushHead(-1, 0);
      expect(list.array).toEqual([-1, 0, 1, 2, 3]);
    });

    it("should notify on pushHead", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.pushHead("z");
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      list.pushHead("y");
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(list.array);

      list.pushHead("x", "w");
      expect(mockNotify).toHaveBeenCalledTimes(3);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify on pushHead if pushing empty item", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.pushHead();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("popHead", () => {
    it("should remove the first element of the list", () => {
      const list = reactiveList([1, 2, 3]);
      list.popHead();
      expect(list.array).toEqual([2, 3]);
    });

    it("should return the removed element", () => {
      const list = reactiveList([1, 2, 3]);
      expect(list.popHead()).toBe(1);
    });

    it("should notify on popHead", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.popHead();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      list.popHead();
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(list.array);

      list.popHead();
      expect(mockNotify).toHaveBeenCalledTimes(3);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify on popHead if the list is empty.", () => {
      const list = reactiveList();
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.popHead();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("set", () => {
    it("should set the element at the specified index", () => {
      const list = reactiveList([1, 2, 3]);
      list.set(1, 4);
      expect(list.array).toEqual([1, 4, 3]);
    });

    it("should ignore negative index", () => {
      const list = reactiveList([1, 2, 3]);
      list.set(-1, 4);
      expect(list.array).toEqual([1, 2, 3]);
    });

    it("should notify on set", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.set(1, "x");
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      list.set(0, "y");
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify on set for negative index", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.set(-2, "x");
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("splice", () => {
    it("should remove the specified elements from the list", () => {
      const list = reactiveList([1, 2, 3]);
      list.splice(1, 2);
      expect(list.array).toEqual([1]);
    });

    it("should remove the specified elements from the list and insert new elements", () => {
      const list = reactiveList([1, 2, 3]);
      list.splice(1, 2, 4, 5);
      expect(list.array).toEqual([1, 4, 5]);
    });

    it("should count backward on negative index", () => {
      const list = reactiveList([1, 2, 3]);
      list.splice(-1, 2);
      expect(list.array).toEqual([1, 2]);
    });

    it("should notify on splice", () => {
      const list = reactiveList(["a", "b", "c", "d", "e"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.splice(1, 2);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      list.splice(0, 0, "x", "y");
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(list.array);

      list.splice(2, 1, "z");
      expect(mockNotify).toHaveBeenCalledTimes(3);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify on splice if the list is empty.", () => {
      const list = reactiveList();
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.splice(0, 0);
      expect(mockNotify).not.toHaveBeenCalled();

      list.splice(0, 0, "x", "y");
      expect(mockNotify).lastCalledWith(["x", "y"]);

      dispose();
    });
  });

  describe("batchSet", () => {
    it("should set the elements at the specified indices", () => {
      const list = reactiveList([1, 2, 3]);
      list.batchSet([
        [0, 4],
        [2, 5],
      ]);
      expect(list.array).toEqual([4, 2, 5]);
    });

    it("should ignore negative index", () => {
      const list = reactiveList([1, 2, 3]);
      list.batchSet([
        [-1, 4],
        [-2, 5],
      ]);
      expect(list.array).toEqual([1, 2, 3]);
    });

    it("should notify on batchSet", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.batchSet([
        [1, "x"],
        [2, "y"],
      ]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      list.batchSet([
        [0, "z"],
        [1, "w"],
      ]);
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify on batchSet for negative index", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.batchSet([
        [-2, "x"],
        [-1, "y"],
      ]);
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("insert", () => {
    it("should insert an element at the specified index", () => {
      const list = reactiveList([1, 2, 3]);
      list.insert(1, 4);
      expect(list.array).toEqual([1, 4, 2, 3]);
    });

    it("should insert multiple elements at the specified index", () => {
      const list = reactiveList([1, 2, 3]);
      list.insert(1, 4, 5);
      expect(list.array).toEqual([1, 4, 5, 2, 3]);
    });

    it("should ignore negative index", () => {
      const list = reactiveList([1, 2, 3]);
      list.insert(-2, 4, 5);
      expect(list.array).toEqual([1, 2, 3]);
    });

    it("should notify on insert", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.insert(1, "x");
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      list.insert(0, "y");
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify on insert for negative index", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.insert(-3, "x");
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("delete", () => {
    it("should delete one element at the specified index", () => {
      const list = reactiveList([1, 2, 3]);
      list.delete(1);
      expect(list.array).toEqual([1, 3]);
    });

    it("should delete the rest elements from the specified index", () => {
      const list = reactiveList([1, 2, 3]);
      list.delete(1, list.length - 1);
      expect(list.array).toEqual([1]);
    });

    it("should ignore negative index", () => {
      const list = reactiveList([1, 2, 3]);
      list.delete(-1);
      expect(list.array).toEqual([1, 2, 3]);
    });

    it("should notify on delete", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.delete(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      list.delete(0);
      expect(mockNotify).toHaveBeenCalledTimes(2);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify on delete for negative index", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.delete(-2);
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });

    it("should not notify if delete count is 0", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.delete(0, 0);
      expect(mockNotify).not.toHaveBeenCalled();

      list.delete(1, 0);
      expect(mockNotify).not.toHaveBeenCalled();

      list.delete(10, 0);
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });

    it("should not notify if list is empty", () => {
      const list = reactiveList([]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.delete(0, 10);
      expect(mockNotify).not.toHaveBeenCalled();

      list.delete(1, 10);
      expect(mockNotify).not.toHaveBeenCalled();

      list.delete(10, 10);
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("clear", () => {
    it("should clear the list", () => {
      const list = reactiveList([1, 2, 3]);
      list.clear();
      expect(list.array).toEqual([]);
    });

    it("should notify on clear", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.clear();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify if list is empty", () => {
      const list = reactiveList([]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.clear();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("replace", () => {
    it("should replace the list with the specified elements", async () => {
      const list = reactiveList([1, 2, 3]);
      const spy = jest.fn();
      list.$.reaction(spy);

      expect(spy).toHaveBeenCalledTimes(0);

      list.replace([4, 5, 6]);
      await nextTick();

      expect(spy).toHaveBeenCalledTimes(1);

      expect(list.array).toEqual([4, 5, 6]);
    });

    it("should replace the list with less elements", async () => {
      const list = reactiveList([1, 2, 3]);
      const spy = jest.fn();
      list.$.reaction(spy);

      expect(spy).toHaveBeenCalledTimes(0);

      list.replace([1]);
      await nextTick();

      expect(spy).toHaveBeenCalledTimes(1);

      expect(list.array).toEqual([1]);
    });

    it("should replace the list with different order", async () => {
      const list = reactiveList([1, 2, 3]);
      const spy = jest.fn();
      list.$.reaction(spy);

      expect(spy).toHaveBeenCalledTimes(0);

      list.replace([3, 2, 1]);
      await nextTick();

      expect(spy).toHaveBeenCalledTimes(1);

      expect(list.array).toEqual([3, 2, 1]);
    });

    it("should replace an empty list with the specified elements", async () => {
      const list = reactiveList<number>([]);

      const spy = jest.fn();
      list.$.reaction(spy);

      expect(spy).toHaveBeenCalledTimes(0);

      list.replace([1, 2, 3]);
      await nextTick();

      expect(spy).toHaveBeenCalledTimes(1);

      expect(list.array).toEqual([1, 2, 3]);
    });

    it("should notify on replace", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.replace(["x", "y", "z"]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify if not changed", () => {
      const list = reactiveList([1]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.replace([2, 3]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should notify if some keys are removed", () => {
      const reactiveSet = reactiveList([1, 2, 3]);
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      expect([...reactiveSet]).toEqual([1, 2, 3]);

      reactiveSet.replace([1, 2]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect([...reactiveSet]).toEqual([1, 2]);

      dispose();
    });

    it("should return deleted entries", () => {
      const reactiveMap = reactiveList([1, 2, 3]);
      const mockNotify = jest.fn();
      const dispose = reactiveMap.$.reaction(mockNotify, true);

      const deleted = reactiveMap.replace([3, 4]);
      expect([...deleted]).toEqual([1, 2]);

      dispose();
    });
  });

  describe("reverse", () => {
    it("should reverse the list", () => {
      const list = reactiveList([1, 2, 3]);
      list.reverse();
      expect(list.array).toEqual([3, 2, 1]);
    });

    it("should notify on reverse", () => {
      const list = reactiveList(["a", "b", "c"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.reverse();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify if list is empty", () => {
      const list = reactiveList([]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.reverse();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });

    it("should not notify if list has only one element", () => {
      const list = reactiveList(["a"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.reverse();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("sort", () => {
    it("should sort the list", () => {
      const list = reactiveList([3, 1, 2]);
      list.sort();
      expect(list.array).toEqual([1, 2, 3]);
    });

    it("should sort the list with a custom compare function", () => {
      const list = reactiveList([3, 1, 2]);
      list.sort((a, b) => b - a);
      expect(list.array).toEqual([3, 2, 1]);
    });

    it("should notify on sort", () => {
      const list = reactiveList(["c", "b", "a"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.sort();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).lastCalledWith(list.array);

      dispose();
    });

    it("should not notify if list is empty", () => {
      const list = reactiveList([]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.sort();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });

    it("should not notify if list has only one element", () => {
      const list = reactiveList(["a"]);
      const mockNotify = jest.fn();
      const dispose = list.$.reaction(mockNotify, true);

      list.sort();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("toString", () => {
    it("should return a string representation of the list", () => {
      const list = reactiveList([1, 2, 3]);
      expect(list.toString()).toBe(list.array.toString());
    });
  });

  describe("toLocaleString", () => {
    it("should return a locale string representation of the list", () => {
      const list = reactiveList([1, 2, 3]);
      expect(list.toLocaleString()).toBe(list.array.toLocaleString());
    });
  });

  describe("toJSON", () => {
    it("should return the internal array", () => {
      const list = reactiveList([1, 2, 3]);
      expect(list.toJSON()).toBe(list.array);
    });
  });

  describe("dispose", () => {
    it("should dispose all watchers", () => {
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => void 0);

      const list = reactiveList<number>();
      const mockNotify1 = jest.fn();
      const mockNotify2 = jest.fn();
      list.$.reaction(mockNotify1, true);
      list.$.reaction(mockNotify2, true);

      expect(consoleErrorMock).not.toBeCalled();

      list.dispose();
      list.push(1);
      expect(mockNotify1).not.toHaveBeenCalled();
      expect(mockNotify2).not.toHaveBeenCalled();

      expect(consoleErrorMock).toBeCalled();
      consoleErrorMock.mockClear();
    });

    it("should clear", () => {
      const list = reactiveList([1, 2, 3]);
      list.dispose();
      expect(list.array).toEqual([]);
    });
  });
});
