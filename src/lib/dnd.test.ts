import { describe, expect, it } from "vitest";

import { TASK_DND_MIME, getDragTaskId, hasTaskPayload, setDragTaskId } from "@/lib/dnd";
import { createDataTransfer } from "@/test/dnd";

describe("setDragTaskId / getDragTaskId", () => {
  it("書き込んだ id をそのまま読み戻せる", () => {
    const dataTransfer = createDataTransfer();

    setDragTaskId(dataTransfer, "t1");

    expect(getDragTaskId(dataTransfer)).toBe("t1");
  });

  it("独自 MIME と text/plain の両方に書き、effectAllowed を move にする", () => {
    const dataTransfer = createDataTransfer();

    setDragTaskId(dataTransfer, "t1");

    expect(dataTransfer.getData(TASK_DND_MIME)).toBe("t1");
    expect(dataTransfer.getData("text/plain")).toBe("t1");
    expect(dataTransfer.effectAllowed).toBe("move");
  });

  it("独自 MIME が読めない環境では text/plain にフォールバックする", () => {
    const dataTransfer = createDataTransfer();
    dataTransfer.setData("text/plain", "t9");

    expect(getDragTaskId(dataTransfer)).toBe("t9");
  });

  it("何も入っていなければ null を返す", () => {
    expect(getDragTaskId(createDataTransfer())).toBeNull();
  });

  it("dataTransfer が null でも落ちない", () => {
    expect(() => setDragTaskId(null, "t1")).not.toThrow();
    expect(getDragTaskId(null)).toBeNull();
  });
});

describe("hasTaskPayload", () => {
  it("タスクのドラッグなら true", () => {
    const dataTransfer = createDataTransfer();
    setDragTaskId(dataTransfer, "t1");

    expect(hasTaskPayload(dataTransfer)).toBe(true);
  });

  it("無関係なドラッグ（ファイルなど）なら false", () => {
    const dataTransfer = createDataTransfer();
    dataTransfer.setData("text/plain", "ただのテキスト");

    expect(hasTaskPayload(dataTransfer)).toBe(false);
  });

  it("dataTransfer が null なら false", () => {
    expect(hasTaskPayload(null)).toBe(false);
  });
});
