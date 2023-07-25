import type { SubscribersImpl } from "./subscribers";
import { SubscriberMode } from "./subscribers";

export type Task<TValue = any> = (value: TValue) => void;

const nextTick = /*#__PURE__*/ Promise.resolve();
const subsSet = new Set<SubscribersImpl>();
let pending: Promise<void> | false;

const flush = () => {
  for (const subs of subsSet) {
    subs.exec_(SubscriberMode.Async);
  }
  pending = false;
  subsSet.clear();
};

export const schedule = <TValue>(subs: SubscribersImpl<TValue>): void => {
  subsSet.add(subs);
  pending = pending || nextTick.then(flush);
};

export const cancelTask = (subs: SubscribersImpl): boolean =>
  subsSet.delete(subs);
