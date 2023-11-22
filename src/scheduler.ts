import type { Subscribers } from "./subscribers";
import { SubscriberMode } from "./subscribers";

export type Task<TValue = any> = (value: TValue) => void;

const nextTick = /*#__PURE__*/ Promise.resolve();
const subsSet = new Set<Subscribers>();
let pending: Promise<void> | false;

const flush = () => {
  for (const subs of subsSet) {
    subs.exec(SubscriberMode.Async);
  }
  pending = false;
  subsSet.clear();
};

export const schedule = <TValue>(subs: Subscribers<TValue>): void => {
  subsSet.add(subs);
  pending = pending || nextTick.then(flush);
};

export const cancelTask = (subs: Subscribers): boolean => subsSet.delete(subs);
