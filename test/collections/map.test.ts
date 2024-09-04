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

  describe("rename", () => {
    it("should rename a key", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      map.rename("foo", "bar");
      expect(map.get("foo")).toBeUndefined();
      expect(map.get("bar")).toBe(1);
    });

    it("should notify on rename", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.rename("foo", "bar");
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(map);

      dispose();
    });

    it("should not notify on rename if the element does not exist.", () => {
      const map = reactiveMap<string, number>();
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.rename("foo", "bar");
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });

    it("should not notify on rename if the key is the same.", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      const mockNotify = jest.fn();
      const dispose = map.$.reaction(mockNotify, true);

      map.rename("foo", "foo");
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });

    it("should overwrite the value if the new key already exists", () => {
      const spy = jest.fn();
      const map = reactiveMap<string, number>(null, { onDeleted: spy });
      map.set("foo", 1);
      map.set("bar", 2);
      map.rename("foo", "bar");
      expect(map.get("foo")).toBeUndefined();
      expect(map.get("bar")).toBe(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).lastCalledWith(2);
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

    it("should return deleted same key entries", () => {
      const map = reactiveMap(Object.entries({ foo: 1, bar: 2 }));
      const deleted = map.replace(Object.entries({ foo: 3, bar: 4 }));
      expect([...deleted]).toHaveLength(2);
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

    it("should clear", () => {
      const map = reactiveMap<string, number>();
      map.set("foo", 1);
      map.dispose();
      expect(map.size).toBe(0);
    });

    it("should trigger onDelete", () => {
      const map = reactiveMap<string, () => void>(null, {
        onDeleted: value => value(),
      });
      const spy = jest.fn();
      map.set("foo", spy);
      expect(spy).toHaveBeenCalledTimes(0);
      map.dispose();
      expect(map.size).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should trigger one onDelete for same value different keys", () => {
      const spy = jest.fn();
      const map = reactiveMap(Object.entries({ foo: 2, bar: 2 }), {
        onDeleted: spy,
      });
      const deleted = map.replace(Object.entries({ foo: 3, bar: 4 }));
      expect([...deleted]).toHaveLength(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(2);
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
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => void 0);

      const map = reactiveMap<string, number>();
      const mockNotify1 = jest.fn();
      const mockNotify2 = jest.fn();
      map.$.reaction(mockNotify1, true);
      map.$.reaction(mockNotify2, true);

      expect(consoleErrorMock).not.toBeCalled();

      map.dispose();
      map.set("foo", 1);
      expect(mockNotify1).not.toHaveBeenCalled();
      expect(mockNotify2).not.toHaveBeenCalled();

      expect(consoleErrorMock).toBeCalled();
      consoleErrorMock.mockRestore();
    });
  });

  describe("config-onDeleted", () => {
    it("should call onDeleted when deleting an entry", () => {
      const map = reactiveMap<string, () => void>(null, {
        onDeleted: value => value(),
      });
      const spy = jest.fn();
      expect(spy).toHaveBeenCalledTimes(0);
      map.set("foo", spy);
      expect(spy).toHaveBeenCalledTimes(0);
      map.delete("foo");
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should not call onDeleted when deleting an non-existing entry", () => {
      const map = reactiveMap<string, () => void>(null, {
        onDeleted: value => value(),
      });
      const spy = jest.fn();
      expect(spy).toHaveBeenCalledTimes(0);
      map.set("foo", spy);
      expect(spy).toHaveBeenCalledTimes(0);
      map.delete("bar");
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it("should call onDeleted when batch deleting entries", () => {
      const spies = Array.from({ length: 5 }).map(() => jest.fn());
      const map = reactiveMap<number, () => void>(
        spies.map((spy, i) => [i, spy] as const),
        {
          onDeleted: value => value(),
        }
      );
      for (const spy of spies) {
        expect(spy).toHaveBeenCalledTimes(0);
      }
      map.batchDelete([0, 1, 2]);
      for (const [i, spy] of spies.entries()) {
        expect(spy).toHaveBeenCalledTimes(i <= 2 ? 1 : 0);
      }
    });

    it("should call onDeleted when clearing the map", () => {
      const spies = Array.from({ length: 5 }).map(() => jest.fn());
      const map = reactiveMap<number, () => void>(
        spies.map((spy, i) => [i, spy] as const),
        {
          onDeleted: value => value(),
        }
      );
      map.clear();
      for (const spy of spies) {
        expect(spy).toHaveBeenCalledTimes(1);
      }
    });

    it("should call onDeleted when replace the map", () => {
      const spies = Array.from({ length: 5 }).map(() => jest.fn());
      const entries = spies.map((spy, i) => [i, spy] as const);
      const map = reactiveMap<number, () => void>(entries, {
        onDeleted: value => value(),
      });
      map.replace(entries.slice(0, 2));
      for (const [i, spy] of spies.entries()) {
        expect(spy).toHaveBeenCalledTimes(i >= 2 ? 1 : 0);
      }
    });

    it("should call onDeleted when setting different value on the same key", () => {
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const map = reactiveMap<string, () => void>([["foo", spy1]], {
        onDeleted: value => value(),
      });
      map.set("foo", spy1);
      expect(spy1).toHaveBeenCalledTimes(0);
      expect(spy2).toHaveBeenCalledTimes(0);
      map.set("foo", spy2);
      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledTimes(0);
    });

    it("should not call onDeleted when setting the same entry", () => {
      const spy = jest.fn();
      const map = reactiveMap<string, () => void>([["foo", spy]], {
        onDeleted: value => value(),
      });
      map.set("foo", spy);
      expect(spy).toHaveBeenCalledTimes(0);
      map.set("foo", spy);
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });
});
