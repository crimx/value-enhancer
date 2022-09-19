import type { Subscribers } from "./subscribers";

export type Task<TValue = any> = (value: TValue) => void;

const nextTick = /*#__PURE__*/ Promise.resolve();
const subsSet = new Set<Subscribers>();
let pending: Promise<void> | false;

export function schedule<TValue>(subs: Subscribers<TValue>): void {
  subsSet.add(subs);
  pending = pending || nextTick.then(flush);
}

export function cancelTask(subs: Subscribers): void {
  subsSet.delete(subs);
}

function flush() {
  for (const subs of subsSet) {
    subs.exec_("s0");
  }
  pending = false;
  subsSet.clear();
}
