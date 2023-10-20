import { describe, expect, it, jest } from "@jest/globals";
import { ReactiveMap } from "../../src/collections";

describe("ReactiveMap", () => {
  describe("get", () => {
    it("should return the value if it exists", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      expect(reactiveMap.get("foo")).toBeUndefined();
      reactiveMap.set("foo", 1);
      expect(reactiveMap.get("foo")).toEqual(1);
    });
  });

  describe("set", () => {
    it("should set a value", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      reactiveMap.set("foo", 1);
      expect(reactiveMap.get("foo")).toEqual(1);
    });

    it("should notify on set", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);

      reactiveMap.set("foo", 1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith("foo");

      unwatch();
    });

    it("should not notify on set if setting same value", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);

      reactiveMap.set("foo", 1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith("foo");

      mockNotify.mockClear();

      reactiveMap.set("foo", 1);
      expect(mockNotify).toHaveBeenCalledTimes(0);

      unwatch();
    });
  });

  describe("delete", () => {
    it("should delete a value", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      reactiveMap.set("foo", 1);
      reactiveMap.delete("foo");
      expect(reactiveMap.get("foo")).toBeUndefined();
    });

    it("should notify on delete", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      reactiveMap.set("foo", 1);
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);

      reactiveMap.delete("foo");
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith("foo");

      unwatch();
    });

    it("should not notify on delete if the element does not exist.", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);

      reactiveMap.delete("foo");
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("clear", () => {
    it("should clear all values", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      reactiveMap.set("foo", 1);
      reactiveMap.set("bar", 2);
      reactiveMap.clear();
      expect(reactiveMap.get("foo")).toBeUndefined();
      expect(reactiveMap.get("bar")).toBeUndefined();
    });

    it("should notify on clear", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      reactiveMap.set("foo", 1);
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);

      reactiveMap.clear();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(undefined);

      unwatch();
    });

    it("should not notify on delete if the map is empty.", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);

      reactiveMap.clear();
      expect(mockNotify).not.toHaveBeenCalled();

      unwatch();
    });
  });

  describe("replace", () => {
    it("should replace all entries", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      reactiveMap.set("foo", 1);
      reactiveMap.set("bar", 2);
      reactiveMap.replace([["baz", 3]]);
      expect(reactiveMap.get("foo")).toBeUndefined();
      expect(reactiveMap.get("bar")).toBeUndefined();
      expect(reactiveMap.get("baz")).toEqual(3);
    });

    it("should notify on replace", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);

      reactiveMap.replace([["baz", 3]]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(undefined);

      unwatch();
    });

    it("should not notify if not changed", () => {
      const reactiveMap = new ReactiveMap<string, number>([["baz", 3]]);
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);

      reactiveMap.replace([["baz", 3]]);
      expect(mockNotify).toHaveBeenCalledTimes(0);

      unwatch();
    });

    it("should notify if some keys are removed", () => {
      const reactiveMap = new ReactiveMap<string, number>([
        ["baz", 3],
        ["foo", 4],
      ]);
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);

      expect(reactiveMap.get("foo")).toBe(4);

      reactiveMap.replace([["baz", 3]]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(reactiveMap.get("foo")).toBeUndefined();

      unwatch();
    });

    it("should return deleted entries", () => {
      const reactiveMap = new ReactiveMap<string, number>([
        ["baz", 3],
        ["foo", 4],
      ]);
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);

      const deleted = reactiveMap.replace([["baz", 3]]);
      expect([...deleted]).toEqual([["foo", 4]]);

      unwatch();
    });
  });

  describe("unwatch", () => {
    it("should unwatch a watcher", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      const mockNotify = jest.fn();

      reactiveMap.watch(mockNotify);
      reactiveMap.unwatch(mockNotify);

      reactiveMap.set("foo", 1);
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("should unwatch a watcher via disposer function", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      const mockNotify = jest.fn();
      const unwatch = reactiveMap.watch(mockNotify);
      unwatch();
      reactiveMap.set("foo", 1);
      expect(mockNotify).not.toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("should dispose all watchers", () => {
      const reactiveMap = new ReactiveMap<string, number>();
      const mockNotify1 = jest.fn();
      const mockNotify2 = jest.fn();
      reactiveMap.watch(mockNotify1);
      reactiveMap.watch(mockNotify2);
      reactiveMap.dispose();
      reactiveMap.set("foo", 1);
      expect(mockNotify1).not.toHaveBeenCalled();
      expect(mockNotify2).not.toHaveBeenCalled();
    });
  });
});
