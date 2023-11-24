import type { Subscribers } from "./subscribers";
import { SubscriberMode } from "./subscribers";

export type Task<TValue = any> = (value: TValue) => void;

const nextTick = /*#__PURE__*/ Promise.resolve();
const pendingSubs1 = new Set<Subscribers>();
const pendingSubs2 = new Set<Subscribers>();
let pendingSubs = pendingSubs1;
let pending: Promise<void> | false;

const flush = () => {
  const curPendingSubs = pendingSubs;
  pendingSubs = pendingSubs === pendingSubs1 ? pendingSubs2 : pendingSubs1;

  pending = false;

  for (const subs of curPendingSubs) {
    subs.exec(SubscriberMode.Async);
  }
  curPendingSubs.clear();
};

export const schedule = <TValue>(subs: Subscribers<TValue>): void => {
  pendingSubs.add(subs);
  pending = pending || nextTick.then(flush);
};

export const cancelTask = (subs: Subscribers): boolean =>
  pendingSubs.delete(subs);
