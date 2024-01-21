import { describe, expect, it, jest } from "@jest/globals";
import { ReactiveSet } from "../../src/collections";

describe("ReactiveSet", () => {
  describe("has", () => {
    it("should return true if the value exists", () => {
      const reactiveSet = new ReactiveSet<number>();
      expect(reactiveSet.has(1)).toBe(false);
      reactiveSet.add(1);
      expect(reactiveSet.has(1)).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete a value", () => {
      const reactiveSet = new ReactiveSet<number>();
      reactiveSet.add(1);
      reactiveSet.delete(1);
      expect(reactiveSet.has(1)).toBe(false);
    });

    it("should notify on delete", () => {
      const reactiveSet = new ReactiveSet<number>();
      reactiveSet.add(1);
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      reactiveSet.delete(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(reactiveSet);

      dispose();
    });

    it("should not notify on delete if the element does not exist.", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      reactiveSet.delete(1);
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("batchDelete", () => {
    it("should delete multiple values", () => {
      const reactiveSet = new ReactiveSet<number>();
      reactiveSet.add(1);
      reactiveSet.add(2);
      reactiveSet.batchDelete([1, 2, 3]);
      expect(reactiveSet.has(1)).toBe(false);
      expect(reactiveSet.has(2)).toBe(false);
      expect(reactiveSet.has(3)).toBe(false);
    });

    it("should notify on batchDelete", () => {
      const reactiveSet = new ReactiveSet<number>();
      reactiveSet.add(1);
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      reactiveSet.batchDelete([1]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(reactiveSet);

      dispose();
    });
  });

  describe("clear", () => {
    it("should clear all values", () => {
      const reactiveSet = new ReactiveSet<number>();
      reactiveSet.add(1);
      reactiveSet.add(2);
      reactiveSet.clear();
      expect(reactiveSet.has(1)).toBe(false);
      expect(reactiveSet.has(2)).toBe(false);
    });

    it("should notify on clear", () => {
      const reactiveSet = new ReactiveSet<number>();
      reactiveSet.add(1);
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      reactiveSet.clear();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(reactiveSet);

      dispose();
    });

    it("should not notify on clear if the set is empty", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      reactiveSet.clear();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("add", () => {
    it("should add a value", () => {
      const reactiveSet = new ReactiveSet<number>();
      reactiveSet.add(1);
      expect(reactiveSet.has(1)).toBe(true);
    });

    it("should notify on add", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      reactiveSet.add(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(reactiveSet);

      dispose();
    });

    it("should not notify on add if adding same value", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      reactiveSet.add(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(reactiveSet);

      mockNotify.mockClear();

      reactiveSet.add(1);
      expect(mockNotify).toHaveBeenCalledTimes(0);

      dispose();
    });
  });

  describe("batchAdd", () => {
    it("should add values", () => {
      const reactiveSet = new ReactiveSet<number>();
      reactiveSet.batchAdd([1, 2, 3]);
      expect(reactiveSet.has(1)).toBe(true);
      expect(reactiveSet.has(2)).toBe(true);
      expect(reactiveSet.has(3)).toBe(true);
    });

    it("should notify once on add", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      reactiveSet.batchAdd([1, 2, 3, 4]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(reactiveSet);

      dispose();
    });
  });

  describe("replace", () => {
    it("should replace all values", () => {
      const reactiveSet = new ReactiveSet<number>();
      reactiveSet.add(1);
      reactiveSet.add(2);
      reactiveSet.replace([3, 4, 5]);
      expect(reactiveSet.has(1)).toBe(false);
      expect(reactiveSet.has(2)).toBe(false);
      expect(reactiveSet.has(3)).toBe(true);
      expect(reactiveSet.has(4)).toBe(true);
      expect(reactiveSet.has(5)).toBe(true);
    });

    it("should notify on replace", () => {
      const reactiveSet = new ReactiveSet<number>();
      reactiveSet.add(1);
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      reactiveSet.replace([2, 3]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(reactiveSet);

      dispose();
    });

    it("should not notify if not changed", () => {
      const reactiveSet = new ReactiveSet([1]);
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      reactiveSet.replace([2, 3]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(reactiveSet);

      dispose();
    });

    it("should notify if some keys are removed", () => {
      const reactiveSet = new ReactiveSet([1, 2, 3]);
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);

      expect(reactiveSet.has(3)).toBe(true);

      reactiveSet.replace([1, 2]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(reactiveSet.has(3)).toBe(false);

      dispose();
    });

    it("should return deleted entries", () => {
      const reactiveMap = new ReactiveSet([1, 2, 3]);
      const mockNotify = jest.fn();
      const dispose = reactiveMap.$.reaction(mockNotify, true);

      const deleted = reactiveMap.replace([3, 4]);
      expect([...deleted]).toEqual([1, 2]);

      dispose();
    });
  });

  describe("dispose", () => {
    it("should dispose a watcher", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();

      reactiveSet.$.reaction(mockNotify, true);
      reactiveSet.$.unsubscribe(mockNotify);

      reactiveSet.add(1);
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("should dispose a watcher via disposer function", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = reactiveSet.$.reaction(mockNotify, true);
      dispose();
      reactiveSet.add(1);
      expect(mockNotify).not.toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("should dispose all watchers", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify1 = jest.fn();
      const mockNotify2 = jest.fn();
      reactiveSet.$.reaction(mockNotify1, true);
      reactiveSet.$.reaction(mockNotify2, true);
      reactiveSet.dispose();
      reactiveSet.add(1);
      expect(mockNotify1).not.toHaveBeenCalled();
      expect(mockNotify2).not.toHaveBeenCalled();
    });
  });
});
