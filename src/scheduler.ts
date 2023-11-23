import type { Subscribers } from "./subscribers";
import { SubscriberMode } from "./subscribers";

export type Task<TValue = any> = (value: TValue) => void;

const nextTick = /*#__PURE__*/ Promise.resolve();
const pendingSubs = [new Set<Subscribers>(), new Set<Subscribers>()];
let pendingSubsIndex = 0;
let pending: Promise<void> | false;

const flush = () => {
  const curPendingSubs = pendingSubs[pendingSubsIndex];
  pendingSubsIndex = 1 - pendingSubsIndex;

  pending = false;

  for (const subs of curPendingSubs) {
    subs.exec(SubscriberMode.Async);
  }
  curPendingSubs.clear();
};

export const schedule = <TValue>(subs: Subscribers<TValue>): void => {
  pendingSubs[pendingSubsIndex].add(subs);
  pending = pending || nextTick.then(flush);
};

export const cancelTask = (subs: Subscribers): boolean =>
  pendingSubs[pendingSubsIndex].delete(subs);
