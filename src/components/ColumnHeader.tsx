import { TASK_STATUS_LABELS, type TaskStatus } from "@/types/task";

type ColumnHeaderProps = {
  status: TaskStatus;
  count: number;
};

export function ColumnHeader({ status, count }: ColumnHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-sm font-semibold tracking-wide">
        {TASK_STATUS_LABELS[status]}
      </h2>
      <span
        aria-label={`${TASK_STATUS_LABELS[status]}のタスク数`}
        className="rounded-full bg-black/5 px-2 py-0.5 text-xs tabular-nums text-black/60 dark:bg-white/10 dark:text-white/60"
      >
        {count}
      </span>
    </div>
  );
}
