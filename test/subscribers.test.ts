import { describe, it, expect, vi } from "vitest";
import { Subscribers } from "../src/subscribers";

describe("Subscribers", () => {
  it("should be able to add and remove subscribers", () => {
    const subscribers = new Subscribers();
    expect(subscribers.size).toBe(0);

    const sub1 = vi.fn();
    subscribers.add(sub1);
    expect(subscribers.size).toBe(1);
    expect(sub1).toHaveBeenCalledTimes(0);

    const sub2 = vi.fn();
    subscribers.add(sub2);
    expect(subscribers.size).toBe(2);
    expect(sub1).toHaveBeenCalledTimes(0);
    expect(sub2).toHaveBeenCalledTimes(0);

    const sub3 = vi.fn();
    subscribers.add(sub3);
    expect(subscribers.size).toBe(3);
    expect(sub1).toHaveBeenCalledTimes(0);
    expect(sub2).toHaveBeenCalledTimes(0);
    expect(sub3).toHaveBeenCalledTimes(0);

    const sub4 = vi.fn();
    subscribers.remove(sub4);
    expect(subscribers.size).toBe(3);
    expect(sub1).toHaveBeenCalledTimes(0);
    expect(sub2).toHaveBeenCalledTimes(0);
    expect(sub3).toHaveBeenCalledTimes(0);
    expect(sub4).toHaveBeenCalledTimes(0);

    subscribers.remove(sub1);
    expect(subscribers.size).toBe(2);
    expect(sub1).toHaveBeenCalledTimes(0);
    expect(sub2).toHaveBeenCalledTimes(0);
    expect(sub3).toHaveBeenCalledTimes(0);
    expect(sub4).toHaveBeenCalledTimes(0);

    subscribers.clear();
    expect(subscribers.size).toBe(0);
    expect(sub1).toHaveBeenCalledTimes(0);
    expect(sub2).toHaveBeenCalledTimes(0);
    expect(sub3).toHaveBeenCalledTimes(0);
    expect(sub4).toHaveBeenCalledTimes(0);
  });

  it("should be able to invoke subscribers", () => {
    const subscribers = new Subscribers();
    expect(subscribers.size).toBe(0);

    const sub1 = vi.fn();
    subscribers.add(sub1);
    expect(sub1).toHaveBeenCalledTimes(0);

    subscribers.invoke(1);
    expect(sub1).toHaveReturnedTimes(1);
    expect(sub1).lastCalledWith(1);

    sub1.mockClear();

    const sub2 = vi.fn();
    subscribers.add(sub2);
    expect(sub1).toHaveBeenCalledTimes(0);
    expect(sub2).toHaveBeenCalledTimes(0);

    subscribers.invoke(1);
    expect(sub1).toHaveReturnedTimes(1);
    expect(sub1).lastCalledWith(1);
    expect(sub2).toHaveReturnedTimes(1);
    expect(sub2).lastCalledWith(1);
  });

  describe("beforeSubscribe", () => {
    it("should add beforeSubscribe", () => {
      const spy = vi.fn();
      const subscribers = new Subscribers(spy);
      expect(spy).toHaveBeenCalledTimes(0);

      subscribers.add(vi.fn());
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should dispose beforeSubscribe", () => {
      const disposer = vi.fn();
      const beforeSubscribe = vi.fn(() => disposer);
      const subscribers = new Subscribers(beforeSubscribe);
      expect(beforeSubscribe).toHaveBeenCalledTimes(0);
      expect(disposer).toHaveBeenCalledTimes(0);

      const sub1 = vi.fn();
      subscribers.add(sub1);
      expect(beforeSubscribe).toHaveBeenCalledTimes(1);
      expect(disposer).toHaveBeenCalledTimes(0);

      subscribers.remove(sub1);
      expect(beforeSubscribe).toHaveBeenCalledTimes(1);
      expect(disposer).toHaveBeenCalledTimes(1);

      beforeSubscribe.mockClear();
      disposer.mockClear();

      subscribers.add(vi.fn());
      subscribers.add(vi.fn());
      subscribers.add(vi.fn());
      expect(beforeSubscribe).toHaveBeenCalledTimes(1);
      expect(disposer).toHaveBeenCalledTimes(0);

      subscribers.clear();
      expect(beforeSubscribe).toHaveBeenCalledTimes(1);
      expect(disposer).toHaveBeenCalledTimes(1);
    });

    it("should be triggered before adding subscribers", () => {
      const subscribers = new Subscribers(() => {
        subscribers.invoke(1);
        subscribers.invoke(2);
        subscribers.invoke(3);
      });

      const sub1 = vi.fn();
      subscribers.add(sub1);
      expect(sub1).toBeCalledTimes(0);
    });
  });
});
