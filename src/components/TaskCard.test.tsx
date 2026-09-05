import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TaskCard } from "@/components/TaskCard";
import { getDragTaskId } from "@/lib/dnd";
import { createDataTransfer } from "@/test/dnd";
import { createTestTask } from "@/test/task";

const TODAY = "2026-08-23";

const task = createTestTask({
  id: "t1",
  title: "設計する",
  description: "画面構成を決める",
  status: "in-progress",
});

describe("TaskCard", () => {
  it("タイトルと説明を表示する", () => {
    render(
      <TaskCard task={task} today={TODAY} onMove={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(
      screen.getByRole("heading", { name: "設計する", level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByText("画面構成を決める")).toBeInTheDocument();
  });

  it("説明が空なら説明の段落を描画しない", () => {
    render(
      <TaskCard
        task={{ ...task, description: "" }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByText("画面構成を決める")).not.toBeInTheDocument();
  });

  it("優先度のバッジを常に表示する", () => {
    const { rerender } = render(
      <TaskCard
        task={{ ...task, priority: "high" }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const badge = screen.getByLabelText("優先度: 高");
    expect(badge).toHaveTextContent("高");
    expect(badge).toHaveAttribute("data-priority", "high");

    rerender(
      <TaskCard
        task={{ ...task, priority: "low" }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("優先度: 低")).toHaveAttribute(
      "data-priority",
      "low",
    );
  });

  it("担当者は設定されているときだけ表示する", () => {
    const { rerender } = render(
      <TaskCard
        task={{ ...task, assignee: "田中" }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("担当者: 田中")).toHaveTextContent("田中");

    rerender(
      <TaskCard
        task={{ ...task, assignee: "" }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText(/^担当者:/)).not.toBeInTheDocument();
  });

  it("期限切れの期限を強調する", () => {
    render(
      <TaskCard
        task={{ ...task, dueDate: "2026-08-20" }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const due = screen.getByLabelText("期限: 2026-08-20（期限切れ）");
    expect(due).toHaveAttribute("data-due-tone", "overdue");
    expect(due).toHaveAttribute("datetime", "2026-08-20");
    expect(due).toHaveTextContent("08/20");
    expect(due).toHaveTextContent("期限切れ");
  });

  it("今日が期限なら今日として強調する", () => {
    render(
      <TaskCard
        task={{ ...task, dueDate: TODAY }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const due = screen.getByLabelText(`期限: ${TODAY}（今日）`);
    expect(due).toHaveAttribute("data-due-tone", "today");
    expect(due).toHaveTextContent("今日");
  });

  it("期限が近ければ「まもなく」を添える", () => {
    render(
      <TaskCard
        task={{ ...task, dueDate: "2026-08-25" }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const due = screen.getByLabelText("期限: 2026-08-25（まもなく）");
    expect(due).toHaveAttribute("data-due-tone", "soon");
    expect(due).toHaveTextContent("08/25");
    expect(due).toHaveTextContent("まもなく");
  });

  it("まだ先の期限は強調しない", () => {
    render(
      <TaskCard
        task={{ ...task, dueDate: "2027-01-05" }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const due = screen.getByLabelText("期限: 2027-01-05");
    expect(due).toHaveAttribute("data-due-tone", "upcoming");
    // 年が違うので年から表示する。
    expect(due).toHaveTextContent("2027/01/05");
  });

  it("今日が分からないうちは期限を強調しない", () => {
    render(
      <TaskCard
        task={{ ...task, dueDate: "2026-08-20" }}
        today=""
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("期限: 2026-08-20")).toHaveAttribute(
      "data-due-tone",
      "none",
    );
  });

  it("期限が無ければ期限を描画しない", () => {
    render(
      <TaskCard
        task={{ ...task, dueDate: "" }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/^期限:/)).not.toBeInTheDocument();
  });

  it("ドラッグ可能で、dragStart で自分の id を dataTransfer に載せる", () => {
    render(
      <TaskCard task={task} today={TODAY} onMove={vi.fn()} onDelete={vi.fn()} />,
    );
    const card = screen.getByTestId("task-t1");
    const dataTransfer = createDataTransfer();

    expect(card).toHaveAttribute("draggable", "true");

    fireEvent.dragStart(card, { dataTransfer });

    expect(getDragTaskId(dataTransfer)).toBe("t1");
  });

  it("移動ボタンで隣の列へ移せる", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <TaskCard task={task} today={TODAY} onMove={onMove} onDelete={vi.fn()} />,
    );

    await user.click(
      screen.getByRole("button", { name: "「設計する」を未着手へ移動" }),
    );
    await user.click(
      screen.getByRole("button", { name: "「設計する」を保留へ移動" }),
    );

    expect(onMove).toHaveBeenNthCalledWith(1, "t1", "todo");
    expect(onMove).toHaveBeenNthCalledWith(2, "t1", "on-hold");
  });

  it("保留の列では 進行中 と 完了 が隣になる", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <TaskCard
        task={{ ...task, status: "on-hold" }}
        today={TODAY}
        onMove={onMove}
        onDelete={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "「設計する」を進行中へ移動" }),
    );
    await user.click(
      screen.getByRole("button", { name: "「設計する」を完了へ移動" }),
    );

    expect(onMove).toHaveBeenNthCalledWith(1, "t1", "in-progress");
    expect(onMove).toHaveBeenNthCalledWith(2, "t1", "done");
  });

  it("削除ボタンで自分の id を通知する", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <TaskCard task={task} today={TODAY} onMove={vi.fn()} onDelete={onDelete} />,
    );

    await user.click(
      screen.getByRole("button", { name: "「設計する」を削除" }),
    );

    expect(onDelete).toHaveBeenCalledWith("t1");
  });

  it("両端の列では、その先へ向かうボタンを無効にする", () => {
    const { rerender } = render(
      <TaskCard
        task={{ ...task, status: "todo" }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "これ以上左へは移動できません" }),
    ).toBeDisabled();

    rerender(
      <TaskCard
        task={{ ...task, status: "done" }}
        today={TODAY}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "これ以上右へは移動できません" }),
    ).toBeDisabled();
  });
});
