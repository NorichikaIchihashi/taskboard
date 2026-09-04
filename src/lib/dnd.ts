/**
 * HTML5 ドラッグ＆ドロップの受け渡しをこのモジュールに閉じ込める。
 * コンポーネントは DataTransfer のキー名やフォールバックを意識しなくてよい。
 */

/** タスク移動であることを他のドラッグ操作と区別するための独自 MIME タイプ。 */
export const TASK_DND_MIME = "application/x-taskboard-task";

/** DataTransfer は仕様上 null になり得るため、扱える形だけを受け付ける。 */
type DragPayload = Pick<DataTransfer, "getData" | "setData"> & {
  types?: DataTransfer["types"];
  effectAllowed?: DataTransfer["effectAllowed"];
  dropEffect?: DataTransfer["dropEffect"];
};

export function setDragTaskId(
  dataTransfer: DragPayload | null | undefined,
  taskId: string,
): void {
  if (!dataTransfer) return;
  dataTransfer.setData(TASK_DND_MIME, taskId);
  // 独自 MIME を読めない環境向けの保険。
  dataTransfer.setData("text/plain", taskId);
  dataTransfer.effectAllowed = "move";
}

export function getDragTaskId(
  dataTransfer: DragPayload | null | undefined,
): string | null {
  if (!dataTransfer) return null;
  const taskId =
    dataTransfer.getData(TASK_DND_MIME) || dataTransfer.getData("text/plain");
  return taskId ? taskId : null;
}

/**
 * dragover の時点でタスクのドラッグかどうかを判定する。
 * ドラッグ中は getData が読めない（保護モード）ため、types だけで判断する。
 */
export function hasTaskPayload(
  dataTransfer: DragPayload | null | undefined,
): boolean {
  const types = dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes(TASK_DND_MIME);
}
