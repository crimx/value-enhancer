import { describe, expect, it, jest } from "@jest/globals";
import { reactiveMap } from "../../src/collections";

describe("ReactiveMap", () => {
  describe("get", () => {
    it("should return the value if it exists", () => {
      const map = reactiveMap<string, number>();
      expect(map.get("foo")).toBeUndefined();
      map.set("foo", 1);
      expect(map.get("foo")).toEqual(1);
    });
  });

  describe("set", () => {
    it("should set a value", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      expect(map.get("foo")).toEqual(1);
    });

    it("should notify on set", () => {
      const map = reactiveMap<string, number>();
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.set("foo", 1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(map);

      dispose();
    });

    it("should not notify on set if setting same value", () => {
      const map = reactiveMap<string, number>();
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.set("foo", 1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(map);

      mockNotify.mockClear();

      map.set("foo", 1);
      expect(mockNotify).toHaveBeenCalledTimes(0);

      dispose();
    });
  });

  describe("batchSet", () => {
    it("should set multiple values", () => {
      const map = reactiveMap<string, number>();
      map.batchSet([
        ["foo", 1],
        ["bar", 2],
      ]);
      expect(map.get("foo")).toEqual(1);
      expect(map.get("bar")).toEqual(2);
    });

    it("should notify on batchSet", () => {
      const map = reactiveMap<string, number>();
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.batchSet([
        ["foo", 1],
        ["bar", 2],
      ]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(map);

      dispose();
    });

    it("should not notify on batchSet if setting same values", () => {
      const map = reactiveMap<string, number>();
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.batchSet([
        ["foo", 1],
        ["bar", 2],
      ]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(map);

      mockNotify.mockClear();

      map.batchSet([
        ["foo", 1],
        ["bar", 2],
      ]);
      expect(mockNotify).toHaveBeenCalledTimes(0);

      dispose();
    });
  });

  describe("delete", () => {
    it("should delete a value", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      map.delete("foo");
      expect(map.get("foo")).toBeUndefined();
    });

    it("should notify on delete", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.delete("foo");
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(map);

      dispose();
    });

    it("should not notify on delete if the element does not exist.", () => {
      const map = reactiveMap<string, number>();
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.delete("foo");
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("batchDelete", () => {
    it("should delete multiple values", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      map.set("bar", 2);
      map.batchDelete(["foo", "bar"]);
      expect(map.get("foo")).toBeUndefined();
      expect(map.get("bar")).toBeUndefined();
    });

    it("should notify on batchDelete", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.batchDelete(["foo"]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(map);

      dispose();
    });

    it("should not notify on batchDelete if the element does not exist.", () => {
      const map = reactiveMap<string, number>();
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.batchDelete(["foo"]);
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("clear", () => {
    it("should clear all values", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      map.set("bar", 2);
      map.clear();
      expect(map.get("foo")).toBeUndefined();
      expect(map.get("bar")).toBeUndefined();
    });

    it("should notify on clear", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.clear();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(map);

      dispose();
    });

    it("should not notify on delete if the map is empty.", () => {
      const map = reactiveMap<string, number>();
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.clear();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("replace", () => {
    it("should replace all entries", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      map.set("bar", 2);
      map.replace([["baz", 3]]);
      expect(map.get("foo")).toBeUndefined();
      expect(map.get("bar")).toBeUndefined();
      expect(map.get("baz")).toEqual(3);
    });

    it("should notify on replace", () => {
      const map = reactiveMap<string, number>();
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.replace([["baz", 3]]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(map);

      dispose();
    });

    it("should replace more entries", () => {
      const map = reactiveMap<string, number>(
        Object.entries({
          foo: 1,
          bar: 2,
        })
      );

      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.replace([
        ["baz", 3],
        ["qux", 4],
        ["quux", 5],
      ]);

      expect(map.get("foo")).toBeUndefined();
      expect(map.get("bar")).toBeUndefined();
      expect(map.get("baz")).toEqual(3);
      expect(map.get("qux")).toEqual(4);
      expect(map.get("quux")).toEqual(5);

      expect(mockNotify).toHaveBeenCalledTimes(1);

      dispose();
    });

    it("should replace less entries", () => {
      const map = reactiveMap<string, number>(
        Object.entries({
          foo: 1,
          bar: 2,
        })
      );

      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.replace([["baz", 3]]);

      expect(map.get("foo")).toBeUndefined();
      expect(map.get("bar")).toBeUndefined();
      expect(map.get("baz")).toEqual(3);

      expect(mockNotify).toHaveBeenCalledTimes(1);

      dispose();
    });

    it("should not replace same entries", () => {
      const map = reactiveMap<string, number>(
        Object.entries({
          foo: 1,
          bar: 2,
        })
      );

      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.replace([
        ["bar", 2],
        ["foo", 1],
      ]);

      expect(map.get("foo")).toBe(1);
      expect(map.get("bar")).toBe(2);

      expect(mockNotify).toHaveBeenCalledTimes(0);

      dispose();
    });

    it("should not notify if not changed", () => {
      const map = reactiveMap<string, number>([["baz", 3]]);
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.replace([["baz", 3]]);
      expect(mockNotify).toHaveBeenCalledTimes(0);

      dispose();
    });

    it("should notify if some keys are removed", () => {
      const map = reactiveMap<string, number>([
        ["baz", 3],
        ["foo", 4],
      ]);
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      expect(map.get("foo")).toBe(4);

      map.replace([["baz", 3]]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(map.get("foo")).toBeUndefined();

      dispose();
    });

    it("should return deleted entries", () => {
      const map = reactiveMap<string, number>([
        ["baz", 3],
        ["foo", 4],
      ]);
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      const deleted = map.replace([["baz", 3]]);
      expect([...deleted]).toEqual([4]);

      dispose();
    });
  });

  describe("dispose", () => {
    it("should dispose a watcher", () => {
      const map = reactiveMap<string, number>();
      const mockNotify = jest.fn();

      map.$.reaction(mockNotify, true);
      map.$.unsubscribe(mockNotify);

      map.set("foo", 1);
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("should dispose a watcher via disposer function", () => {
      const map = reactiveMap<string, number>();
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);
      dispose();
      map.set("foo", 1);
      expect(mockNotify).not.toHaveBeenCalled();
    });
  });

  describe("toJSON", () => {
    it("should return the JSON value as object", () => {
      const map = reactiveMap(
        Object.entries({ a: 1, b: reactiveMap(Object.entries({ c: 2 })) })
      );
      expect(map.toJSON()).toEqual({ a: 1, b: { c: 2 } });
      expect(JSON.stringify(map)).toBe(JSON.stringify({ a: 1, b: { c: 2 } }));
    });
  });

  describe("dispose", () => {
    it("should dispose all watchers", () => {
      const map = reactiveMap<string, number>();
      const mockNotify1 = jest.fn();
      const mockNotify2 = jest.fn();
      map.$.reaction(mockNotify1, true);
      map.$.reaction(mockNotify2, true);
      map.dispose();
      map.set("foo", 1);
      expect(mockNotify1).not.toHaveBeenCalled();
      expect(mockNotify2).not.toHaveBeenCalled();
    });
  });
});
