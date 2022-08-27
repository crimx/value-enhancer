import type { Subscribers } from "./subscribers";

export type Task<TValue = any> = (value: TValue) => void;

const nextTick = /*#__PURE__*/ Promise.resolve();
const subsSet = new Set<Subscribers>();
let pending: Promise<void> | null = null;

export function schedule<TValue>(subs: Subscribers<TValue>): void {
  subsSet.add(subs);
  if (!pending) {
    pending = nextTick.then(flush);
  }
}

export function cancelTask(subs: Subscribers): void {
  subsSet.delete(subs);
}

async function flush() {
  for (const subs of subsSet) {
    subs.exec("sub0");
  }
  pending = null;
  subsSet.clear();
}
