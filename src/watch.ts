import { type AdaptiveSet, add, clear, has, size } from "adaptive-set";

import { batch, batchFlush, batchStart, dirtyVals } from "./batch";
import { type Get, type ReadonlyVal, type ValDisposer } from "./typings";
import { identity, isVal, unsubscribe } from "./utils";

export interface WatchEffect {
  (get: Get, dispose: ValDisposer): (() => void) | undefined | void;
}

export const watch = (effect: WatchEffect): ValDisposer => {
  let running: boolean | undefined;
  let disposed: boolean | undefined;
  let collectedDeps: AdaptiveSet<ReadonlyVal>;

  let cleanupEffect: null | undefined | ValDisposer | void;

  const get = <T = any>(val$?: null | ReadonlyVal<T> | undefined | { $: ReadonlyVal<T> }): T | undefined => {
    if (!isVal(val$)) {
      if (!isVal((val$ as undefined | { $: ReadonlyVal<T> })?.$)) {
        return val$ as T | undefined;
      }
      val$ = (val$ as { $: ReadonlyVal<T> }).$;
    }

    if (!has(collectedDeps, val$)) {
      collectedDeps = add(collectedDeps, val$);
      val$.onReaction_(subscription);
    }

    return val$.get();
  };

  const subscription = () => {
    if (!running && size(collectedDeps) > 0) {
      unsubscribe(collectedDeps, subscription);
      collectedDeps = clear(collectedDeps);
    }
    dirtyVals.add(runner);
  };

  const dispose = () => {
    disposed = true;
    dirtyVals.delete(runner);
    effect = identity;
    unsubscribe(collectedDeps, subscription);
    collectedDeps = null;
    if (cleanupEffect) {
      const cleanup = cleanupEffect;
      cleanupEffect = null;
      batch(cleanup);
    }
  };

  const runner = () => {
    if (disposed) {
      return;
    }

    if (cleanupEffect) {
      const cleanup = cleanupEffect;
      cleanupEffect = null;
      batch(cleanup);
    }

    if (disposed) {
      return;
    }

    const isTopRunner = !running;
    running = true;

    const isBatchTop = batchStart();

    try {
      cleanupEffect = effect(get, dispose);
    } catch (e) {
      unsubscribe(collectedDeps, subscription);
      collectedDeps = clear(collectedDeps);
      throw e;
    } finally {
      if (disposed) {
        dispose();
      }

      if (isTopRunner) {
        running = false;
      }

      isBatchTop && batchFlush();
    }
  };

  runner();

  return dispose;
};
