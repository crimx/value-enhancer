import { describe, expect, it, jest } from "@jest/globals";
import { reactiveSet } from "../../src/collections";

describe("ReactiveSet", () => {
  describe("has", () => {
    it("should return true if the value exists", () => {
      const set = reactiveSet<number>();
      expect(set.has(1)).toBe(false);
      set.add(1);
      expect(set.has(1)).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete a value", () => {
      const set = reactiveSet<number>();
      set.add(1);
      set.delete(1);
      expect(set.has(1)).toBe(false);
    });

    it("should notify on delete", () => {
      const set = reactiveSet<number>();
      set.add(1);
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);

      set.delete(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(set);

      dispose();
    });

    it("should not notify on delete if the element does not exist.", () => {
      const set = reactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);

      set.delete(1);
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("batchDelete", () => {
    it("should delete multiple values", () => {
      const set = reactiveSet<number>();
      set.add(1);
      set.add(2);
      set.batchDelete([1, 2, 3]);
      expect(set.has(1)).toBe(false);
      expect(set.has(2)).toBe(false);
      expect(set.has(3)).toBe(false);
    });

    it("should notify on batchDelete", () => {
      const set = reactiveSet<number>();
      set.add(1);
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);

      set.batchDelete([1]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(set);

      dispose();
    });
  });

  describe("clear", () => {
    it("should clear all values", () => {
      const set = reactiveSet<number>();
      set.add(1);
      set.add(2);
      set.clear();
      expect(set.has(1)).toBe(false);
      expect(set.has(2)).toBe(false);
    });

    it("should notify on clear", () => {
      const set = reactiveSet<number>();
      set.add(1);
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);

      set.clear();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(set);

      dispose();
    });

    it("should not notify on clear if the set is empty", () => {
      const set = reactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);

      set.clear();
      expect(mockNotify).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("add", () => {
    it("should add a value", () => {
      const set = reactiveSet<number>();
      set.add(1);
      expect(set.has(1)).toBe(true);
    });

    it("should notify on add", () => {
      const set = reactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);

      set.add(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(set);

      dispose();
    });

    it("should not notify on add if adding same value", () => {
      const set = reactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);

      set.add(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(set);

      mockNotify.mockClear();

      set.add(1);
      expect(mockNotify).toHaveBeenCalledTimes(0);

      dispose();
    });
  });

  describe("batchAdd", () => {
    it("should add values", () => {
      const set = reactiveSet<number>();
      set.batchAdd([1, 2, 3]);
      expect(set.has(1)).toBe(true);
      expect(set.has(2)).toBe(true);
      expect(set.has(3)).toBe(true);
    });

    it("should notify once on add", () => {
      const set = reactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);

      set.batchAdd([1, 2, 3, 4]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(set);

      dispose();
    });
  });

  describe("replace", () => {
    it("should replace all values", () => {
      const set = reactiveSet<number>();
      set.add(1);
      set.add(2);
      set.replace([3, 4, 5]);
      expect(set.has(1)).toBe(false);
      expect(set.has(2)).toBe(false);
      expect(set.has(3)).toBe(true);
      expect(set.has(4)).toBe(true);
      expect(set.has(5)).toBe(true);
    });

    it("should replace some values", () => {
      const set = reactiveSet<number>([1, 2, 3, 4, 5]);
      set.replace([3, 4, 5]);
      expect(set.has(1)).toBe(false);
      expect(set.has(2)).toBe(false);
      expect(set.has(3)).toBe(true);
      expect(set.has(4)).toBe(true);
      expect(set.has(5)).toBe(true);
    });

    it("should notify on replace", () => {
      const set = reactiveSet<number>();
      set.add(1);
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);

      set.replace([2, 3]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(set);

      dispose();
    });

    it("should not notify if not changed", () => {
      const set = reactiveSet([1]);
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);

      set.replace([2, 3]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(set);

      dispose();
    });

    it("should notify if some keys are removed", () => {
      const set = reactiveSet([1, 2, 3]);
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);

      expect(set.has(3)).toBe(true);

      set.replace([1, 2]);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(set.has(3)).toBe(false);

      dispose();
    });

    it("should return deleted entries", () => {
      const reactiveMap = reactiveSet([1, 2, 3]);
      const mockNotify = jest.fn();
      const dispose = reactiveMap.$.reaction(mockNotify, true);

      const deleted = reactiveMap.replace([3, 4]);
      expect([...deleted]).toEqual([1, 2]);

      dispose();
    });
  });

  describe("dispose", () => {
    it("should dispose a watcher", () => {
      const set = reactiveSet<number>();
      const mockNotify = jest.fn();

      set.$.reaction(mockNotify, true);
      set.$.unsubscribe(mockNotify);

      set.add(1);
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("should dispose a watcher via disposer function", () => {
      const set = reactiveSet<number>();
      const mockNotify = jest.fn();
      const dispose = set.$.reaction(mockNotify, true);
      dispose();
      set.add(1);
      expect(mockNotify).not.toHaveBeenCalled();
    });
  });

  describe("toJSON", () => {
    it("should return the JSON value as array", () => {
      const set = reactiveSet([1, 2, 3, reactiveSet([4, 5, 6])]);
      expect(set.toJSON()).toEqual([1, 2, 3, [4, 5, 6]]);
      expect(JSON.stringify(set)).toBe(JSON.stringify([1, 2, 3, [4, 5, 6]]));
    });
  });

  describe("dispose", () => {
    it("should dispose all watchers", () => {
      const set = reactiveSet<number>();
      const mockNotify1 = jest.fn();
      const mockNotify2 = jest.fn();
      set.$.reaction(mockNotify1, true);
      set.$.reaction(mockNotify2, true);
      set.dispose();
      set.add(1);
      expect(mockNotify1).not.toHaveBeenCalled();
      expect(mockNotify2).not.toHaveBeenCalled();
    });

    it("should clear", () => {
      const set = reactiveSet<number>();
      set.add(1);
      set.dispose();
      expect(set.size).toBe(0);
    });

    it("should trigger onDeleted", () => {
      const set = reactiveSet<() => void>(null, {
        onDeleted: value => value(),
      });
      const spy = jest.fn();
      set.add(spy);
      expect(spy).toHaveBeenCalledTimes(0);
      set.dispose();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(set.size).toBe(0);
    });
  });

  describe("config-onDeleted", () => {
    it("should call onDeleted when deleting an value", () => {
      const set = reactiveSet<() => void>(null, {
        onDeleted: value => value(),
      });
      const spy = jest.fn();
      expect(spy).toHaveBeenCalledTimes(0);
      set.add(spy);
      expect(spy).toHaveBeenCalledTimes(0);
      set.delete(spy);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should not call onDeleted when deleting an non-existing entry", () => {
      const set = reactiveSet<() => void>(null, {
        onDeleted: value => value(),
      });
      const spy = jest.fn();
      expect(spy).toHaveBeenCalledTimes(0);
      set.add(spy);
      expect(spy).toHaveBeenCalledTimes(0);
      set.delete(jest.fn());
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it("should call onDeleted when batch deleting entries", () => {
      const spies = Array.from({ length: 5 }).map(() => jest.fn());
      const set = reactiveSet<() => void>(spies, {
        onDeleted: value => value(),
      });
      for (const spy of spies) {
        expect(spy).toHaveBeenCalledTimes(0);
      }
      set.batchDelete(spies.slice(0, 3));
      for (const [i, spy] of spies.entries()) {
        expect(spy).toHaveBeenCalledTimes(i < 3 ? 1 : 0);
      }
    });

    it("should call onDeleted when clearing the map", () => {
      const spies = Array.from({ length: 5 }).map(() => jest.fn());
      const set = reactiveSet<() => void>(spies, {
        onDeleted: value => value(),
      });
      set.clear();
      for (const spy of spies) {
        expect(spy).toHaveBeenCalledTimes(1);
      }
    });

    it("should call onDeleted when replace the map", () => {
      const spies = Array.from({ length: 5 }).map(() => jest.fn());
      const set = reactiveSet<() => void>(spies, {
        onDeleted: value => value(),
      });
      set.replace(spies.slice(0, 2));
      for (const [i, spy] of spies.entries()) {
        expect(spy).toHaveBeenCalledTimes(i >= 2 ? 1 : 0);
      }
    });
  });
});
