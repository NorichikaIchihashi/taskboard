import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BoardColumn } from "@/components/BoardColumn";
import { setDragTaskId } from "@/lib/dnd";
import { createDataTransfer } from "@/test/dnd";
import { createTestTask } from "@/test/task";
import type { Task } from "@/types/task";

const TODAY = "2026-08-23";

const tasks: Task[] = [
  createTestTask({ id: "t1", title: "設計する" }),
  createTestTask({ id: "t2", title: "実装する" }),
];

describe("BoardColumn", () => {
  it("列名とタスク件数を表示する", () => {
    render(
      <BoardColumn
        status="todo"
        tasks={tasks}
        today={TODAY}
        isFiltering={false}
        onMoveTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    );

    const column = screen.getByRole("region", { name: "未着手" });
    expect(within(column).getByRole("heading", { level: 2 })).toHaveTextContent(
      "未着手",
    );
    expect(screen.getByLabelText("未着手のタスク数")).toHaveTextContent("2");
  });

  it("タスクが無いときは空の案内を出す", () => {
    render(
      <BoardColumn
        status="done"
        tasks={[]}
        today={TODAY}
        isFiltering={false}
        onMoveTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    );

    expect(screen.getByText("ここにタスクをドロップ")).toBeInTheDocument();
  });

  it("絞り込み中に空なら、ドロップの案内ではなく該当なしと伝える", () => {
    render(
      <BoardColumn
        status="done"
        tasks={[]}
        today={TODAY}
        isFiltering
        onMoveTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    );

    expect(screen.getByText("該当するタスクはありません")).toBeInTheDocument();
    expect(screen.queryByText("ここにタスクをドロップ")).not.toBeInTheDocument();
  });

  it("カードの削除をそのまま親へ伝える", async () => {
    const user = userEvent.setup();
    const onDeleteTask = vi.fn();
    render(
      <BoardColumn
        status="todo"
        tasks={tasks}
        today={TODAY}
        isFiltering={false}
        onMoveTask={vi.fn()}
        onDeleteTask={onDeleteTask}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "「設計する」を削除" }),
    );

    expect(onDeleteTask).toHaveBeenCalledWith("t1");
  });

  it("受け取った今日を各カードに渡す", () => {
    render(
      <BoardColumn
        status="todo"
        tasks={[createTestTask({ id: "t1", dueDate: "2026-08-20" })]}
        today={TODAY}
        isFiltering={false}
        onMoveTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("期限: 2026-08-20（期限切れ）")).toHaveAttribute(
      "data-due-tone",
      "overdue",
    );
  });

  it("ドロップされたタスクをこの列の status で通知する", () => {
    const onMoveTask = vi.fn();
    render(
      <BoardColumn
        status="done"
        tasks={[]}
        today={TODAY}
        isFiltering={false}
        onMoveTask={onMoveTask}
        onDeleteTask={vi.fn()}
      />,
    );

    const dataTransfer = createDataTransfer();
    setDragTaskId(dataTransfer, "t1");
    fireEvent.drop(screen.getByTestId("column-done"), { dataTransfer });

    expect(onMoveTask).toHaveBeenCalledWith("t1", "done");
  });

  it("タスク以外がドロップされても通知しない", () => {
    const onMoveTask = vi.fn();
    render(
      <BoardColumn
        status="done"
        tasks={[]}
        today={TODAY}
        isFiltering={false}
        onMoveTask={onMoveTask}
        onDeleteTask={vi.fn()}
      />,
    );

    fireEvent.drop(screen.getByTestId("column-done"), {
      dataTransfer: createDataTransfer(),
    });

    expect(onMoveTask).not.toHaveBeenCalled();
  });

  it("タスクを持つ dragover のときだけドロップ先として強調する", () => {
    render(
      <BoardColumn
        status="done"
        tasks={[]}
        today={TODAY}
        isFiltering={false}
        onMoveTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    );
    const column = screen.getByTestId("column-done");

    const unrelated = createDataTransfer();
    unrelated.setData("text/plain", "ただのテキスト");
    fireEvent.dragOver(column, { dataTransfer: unrelated });
    expect(column).toHaveAttribute("data-drop-active", "false");

    const dragged = createDataTransfer();
    setDragTaskId(dragged, "t1");
    fireEvent.dragOver(column, { dataTransfer: dragged });
    expect(column).toHaveAttribute("data-drop-active", "true");

    fireEvent.dragLeave(column, { relatedTarget: document.body });
    expect(column).toHaveAttribute("data-drop-active", "false");
  });
});
