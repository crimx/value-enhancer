import type { Subscribers } from "./subscribers";

export type Task<TValue = any> = (value: TValue) => void;

const nextTick = /*#__PURE__*/ Promise.resolve();
const subsSet = new Set<Subscribers>();
let pending: Promise<void> | false | undefined;

export async function schedule<TValue>(
  subs: Subscribers<TValue>
): Promise<void> {
  subsSet.add(subs);
  if (!pending) {
    await (pending = nextTick);
    for (const subs of subsSet) {
      subs.exec_("s0");
    }
    subsSet.clear();
    pending = false;
  }
}

export function cancelTask(subs: Subscribers): void {
  subsSet.delete(subs);
}
