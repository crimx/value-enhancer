import { describe, expect, it, jest } from "@jest/globals";
import { ReactiveSet } from "../../src/collections";

describe("ReactiveSet", () => {
  describe("get", () => {
    it("should return true if the value exists", () => {
      const reactiveSet = new ReactiveSet<number>();
      expect(reactiveSet.get(1)).toBe(false);
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
      const unwatch = reactiveSet.watch(mockNotify);

      reactiveSet.delete(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(1);

      unwatch();
    });

    it("should not notify on delete if the element does not exist.", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();
      const unwatch = reactiveSet.watch(mockNotify);

      reactiveSet.delete(1);
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
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
      const unwatch = reactiveSet.watch(mockNotify);

      reactiveSet.clear();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(undefined);

      unwatch();
    });

    it("should not notify on clear if the set is empty", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();
      const unwatch = reactiveSet.watch(mockNotify);

      reactiveSet.clear();
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
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
      const unwatch = reactiveSet.watch(mockNotify);

      reactiveSet.add(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(1);

      unwatch();
    });

    it("should not notify on add if adding same value", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();
      const unwatch = reactiveSet.watch(mockNotify);

      reactiveSet.add(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(1);

      mockNotify.mockClear();

      reactiveSet.add(1);
      expect(mockNotify).toHaveBeenCalledTimes(0);

      unwatch();
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
      const unwatch = reactiveSet.watch(mockNotify);

      reactiveSet.replace([2, 3]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(undefined);

      unwatch();
    });
  });

  describe("unwatch", () => {
    it("should unwatch a watcher", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();

      reactiveSet.watch(mockNotify);
      reactiveSet.unwatch(mockNotify);

      reactiveSet.add(1);
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("should unwatch a watcher via disposer function", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify = jest.fn();
      const unwatch = reactiveSet.watch(mockNotify);
      unwatch();
      reactiveSet.add(1);
      expect(mockNotify).not.toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("should dispose all watchers", () => {
      const reactiveSet = new ReactiveSet<number>();
      const mockNotify1 = jest.fn();
      const mockNotify2 = jest.fn();
      reactiveSet.watch(mockNotify1);
      reactiveSet.watch(mockNotify2);
      reactiveSet.dispose();
      reactiveSet.add(1);
      expect(mockNotify1).not.toHaveBeenCalled();
      expect(mockNotify2).not.toHaveBeenCalled();
    });
  });
});
