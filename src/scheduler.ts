export interface Task {
  runTask_(): void;
}

const tick = /*#__PURE__*/ Promise.resolve();
const pendingTasks1 = new Set<Task>();
const pendingTasks2 = new Set<Task>();
let pendingTasks = pendingTasks1;
let pending: Promise<void> | false;

const flush = () => {
  const currentPendingTasks = pendingTasks;
  pendingTasks = pendingTasks === pendingTasks1 ? pendingTasks2 : pendingTasks1;

  pending = false;

  for (const subs of currentPendingTasks) {
    subs.runTask_();
  }
  currentPendingTasks.clear();
};

export const schedule = (task: Task): void => {
  pendingTasks.add(task);
  pending = pending || tick.then(flush);
};

export const cancelTask = (task: Task): boolean => pendingTasks.delete(task);

export const nextTick = (): Promise<void> => tick;
