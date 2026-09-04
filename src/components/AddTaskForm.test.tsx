import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AddTaskForm } from "@/components/AddTaskForm";

describe("AddTaskForm", () => {
  it("入力した内容を onAdd に渡す", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockReturnValue(true);
    render(<AddTaskForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("タイトル"), "設計する");
    await user.type(screen.getByLabelText("説明"), "画面構成を決める");
    await user.type(screen.getByLabelText("担当者"), "田中");
    await user.selectOptions(screen.getByLabelText("優先度"), "high");
    await user.type(screen.getByLabelText("期限"), "2026-08-25");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(onAdd).toHaveBeenCalledWith({
      title: "設計する",
      description: "画面構成を決める",
      assignee: "田中",
      priority: "high",
      dueDate: "2026-08-25",
    });
  });

  it("担当者と期限は任意で、優先度の初期値は 中", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockReturnValue(true);
    render(<AddTaskForm onAdd={onAdd} />);

    expect(screen.getByLabelText("優先度")).toHaveValue("medium");

    await user.type(screen.getByLabelText("タイトル"), "設計する");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(onAdd).toHaveBeenCalledWith({
      title: "設計する",
      description: "",
      assignee: "",
      priority: "medium",
      dueDate: "",
    });
  });

  it("追加に成功したら入力欄を初期状態に戻す", async () => {
    const user = userEvent.setup();
    render(<AddTaskForm onAdd={() => true} />);

    await user.type(screen.getByLabelText("タイトル"), "設計する");
    await user.type(screen.getByLabelText("説明"), "画面構成を決める");
    await user.type(screen.getByLabelText("担当者"), "田中");
    await user.selectOptions(screen.getByLabelText("優先度"), "high");
    await user.type(screen.getByLabelText("期限"), "2026-08-25");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.getByLabelText("タイトル")).toHaveValue("");
    expect(screen.getByLabelText("説明")).toHaveValue("");
    expect(screen.getByLabelText("担当者")).toHaveValue("");
    expect(screen.getByLabelText("優先度")).toHaveValue("medium");
    expect(screen.getByLabelText("期限")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("onAdd が false を返したらエラーを出し、入力内容を保持する", async () => {
    const user = userEvent.setup();
    render(<AddTaskForm onAdd={() => false} />);

    await user.type(screen.getByLabelText("説明"), "説明だけ入力");
    await user.type(screen.getByLabelText("担当者"), "田中");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "タイトルを入力してください",
    );
    expect(screen.getByLabelText("説明")).toHaveValue("説明だけ入力");
    expect(screen.getByLabelText("担当者")).toHaveValue("田中");
  });
});
