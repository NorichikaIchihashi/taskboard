import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Board } from "@/components/Board";
import { createDataTransfer } from "@/test/dnd";
import { createTestTask } from "@/test/task";
import type { Task } from "@/types/task";

const TODAY = "2026-08-23";

const initialTasks: Task[] = [
  createTestTask({
    id: "t1",
    title: "設計する",
    description: "画面構成を決める",
  }),
];

/** ドラッグ元のカードを掴んで、目的の列へ落とす。 */
function dragTaskTo(taskId: string, columnStatus: string) {
  const dataTransfer = createDataTransfer();
  fireEvent.dragStart(screen.getByTestId(`task-${taskId}`), { dataTransfer });
  fireEvent.dragOver(screen.getByTestId(`column-${columnStatus}`), {
    dataTransfer,
  });
  fireEvent.drop(screen.getByTestId(`column-${columnStatus}`), { dataTransfer });
}

/** 列に並んでいるカードのタイトルを、表示順のまま取り出す。 */
function cardTitlesIn(status: string): string[] {
  return within(screen.getByTestId(`column-${status}`))
    .getAllByRole("article")
    .map((card) => within(card).getByRole("heading", { level: 3 }).textContent ?? "");
}

describe("Board", () => {
  it("4 つの列を並び順どおりに表示する", () => {
    render(<Board />);

    expect(
      screen.getAllByRole("region").map((column) => column.getAttribute("aria-label")),
    ).toEqual(["未着手", "進行中", "保留", "完了"]);
  });

  it("追加したタスクが未着手の列に現れる", async () => {
    const user = userEvent.setup();
    render(<Board />);

    await user.type(screen.getByLabelText("タイトル"), "テストを書く");
    await user.type(screen.getByLabelText("説明"), "Vitest で");
    await user.click(screen.getByRole("button", { name: "追加" }));

    const todo = screen.getByTestId("column-todo");
    expect(within(todo).getByText("テストを書く")).toBeInTheDocument();
    expect(within(todo).getByText("Vitest で")).toBeInTheDocument();
    expect(screen.getByLabelText("未着手のタスク数")).toHaveTextContent("1");
  });

  it("担当者・優先度・期限を入力して追加できる", async () => {
    const user = userEvent.setup();
    render(<Board today={TODAY} />);

    await user.type(screen.getByLabelText("タイトル"), "テストを書く");
    await user.type(screen.getByLabelText("担当者"), "田中");
    await user.selectOptions(screen.getByLabelText("優先度"), "high");
    await user.type(screen.getByLabelText("期限"), "2026-08-25");
    await user.click(screen.getByRole("button", { name: "追加" }));

    const todo = screen.getByTestId("column-todo");
    expect(within(todo).getByLabelText("担当者: 田中")).toBeInTheDocument();
    expect(within(todo).getByLabelText("優先度: 高")).toBeInTheDocument();
    expect(
      within(todo).getByLabelText("期限: 2026-08-25（まもなく）"),
    ).toHaveTextContent("08/25");
  });

  it("優先度の高いタスクが列の先頭に並ぶ", async () => {
    const user = userEvent.setup();
    render(
      <Board
        today={TODAY}
        initialTasks={[
          createTestTask({ id: "t1", title: "あとで", priority: "low" }),
        ]}
      />,
    );

    await user.type(screen.getByLabelText("タイトル"), "急ぎ");
    await user.selectOptions(screen.getByLabelText("優先度"), "high");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(cardTitlesIn("todo")).toEqual(["急ぎ", "あとで"]);
  });

  it("期限を過ぎたタスクを強調する", () => {
    render(
      <Board
        today={TODAY}
        initialTasks={[createTestTask({ id: "t1", dueDate: "2026-08-20" })]}
      />,
    );

    expect(screen.getByLabelText("期限: 2026-08-20（期限切れ）")).toHaveAttribute(
      "data-due-tone",
      "overdue",
    );
  });

  it("today を渡さなければマウント後に実際の今日で判定する", () => {
    render(
      <Board initialTasks={[createTestTask({ id: "t1", dueDate: "2020-01-01" })]} />,
    );

    expect(screen.getByLabelText(/^期限: 2020-01-01/)).toHaveAttribute(
      "data-due-tone",
      "overdue",
    );
  });

  it("タイトルが空のままでは追加されない", async () => {
    const user = userEvent.setup();
    render(<Board />);

    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText("未着手のタスク数")).toHaveTextContent("0");
  });

  it("ドラッグ＆ドロップでタスクが列をまたいで移動する", () => {
    render(<Board initialTasks={initialTasks} />);

    dragTaskTo("t1", "done");

    expect(
      within(screen.getByTestId("column-done")).getByText("設計する"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("column-todo")).queryByText("設計する"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("完了のタスク数")).toHaveTextContent("1");
    expect(screen.getByLabelText("未着手のタスク数")).toHaveTextContent("0");
  });

  it("移動先の列でも優先度順の位置に入る", () => {
    render(
      <Board
        today={TODAY}
        initialTasks={[
          createTestTask({ id: "t1", title: "急ぎ", priority: "high" }),
          createTestTask({
            id: "t2",
            title: "先客",
            status: "done",
            priority: "medium",
          }),
        ]}
      />,
    );

    dragTaskTo("t1", "done");

    expect(cardTitlesIn("done")).toEqual(["急ぎ", "先客"]);
  });

  it("追加したタスクもドラッグ＆ドロップで移動できる", async () => {
    const user = userEvent.setup();
    render(<Board />);

    await user.type(screen.getByLabelText("タイトル"), "テストを書く");
    await user.click(screen.getByRole("button", { name: "追加" }));

    const card = within(screen.getByTestId("column-todo")).getByRole("article");
    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(screen.getByTestId("column-in-progress"), { dataTransfer });

    expect(
      within(screen.getByTestId("column-in-progress")).getByText("テストを書く"),
    ).toBeInTheDocument();
  });

  it("保留の列へもドラッグ＆ドロップで移動できる", () => {
    render(<Board initialTasks={initialTasks} />);

    dragTaskTo("t1", "on-hold");

    expect(
      within(screen.getByTestId("column-on-hold")).getByText("設計する"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("保留のタスク数")).toHaveTextContent("1");
    expect(screen.getByLabelText("未着手のタスク数")).toHaveTextContent("0");
  });

  it("同じ列に落としても件数は変わらない", () => {
    render(<Board initialTasks={initialTasks} />);

    dragTaskTo("t1", "todo");

    expect(screen.getByLabelText("未着手のタスク数")).toHaveTextContent("1");
  });
});

describe("Board の絞り込み", () => {
  const searchable: Task[] = [
    createTestTask({
      id: "t1",
      title: "ログイン画面",
      description: "Google 認証に対応",
      assignee: "田中",
      priority: "high",
    }),
    createTestTask({
      id: "t2",
      title: "設定画面",
      description: "",
      assignee: "佐藤",
      priority: "low",
      status: "in-progress",
    }),
  ];

  it("キーワードでタイトルを絞り込める", async () => {
    const user = userEvent.setup();
    render(<Board today={TODAY} initialTasks={searchable} />);

    await user.type(screen.getByLabelText("検索"), "ログイン");

    expect(screen.getByText("ログイン画面")).toBeInTheDocument();
    expect(screen.queryByText("設定画面")).not.toBeInTheDocument();
  });

  it("説明に含まれるキーワードでも絞り込める", async () => {
    const user = userEvent.setup();
    render(<Board today={TODAY} initialTasks={searchable} />);

    await user.type(screen.getByLabelText("検索"), "認証");

    expect(screen.getByText("ログイン画面")).toBeInTheDocument();
    expect(screen.queryByText("設定画面")).not.toBeInTheDocument();
  });

  it("絞り込むと列の件数も表示中の件数になる", async () => {
    const user = userEvent.setup();
    render(<Board today={TODAY} initialTasks={searchable} />);

    await user.type(screen.getByLabelText("検索"), "ログイン");

    expect(screen.getByLabelText("未着手のタスク数")).toHaveTextContent("1");
    expect(screen.getByLabelText("進行中のタスク数")).toHaveTextContent("0");
  });

  it("担当者で絞り込める", async () => {
    const user = userEvent.setup();
    render(<Board today={TODAY} initialTasks={searchable} />);

    await user.selectOptions(screen.getByLabelText("担当者で絞り込む"), "佐藤");

    expect(screen.getByText("設定画面")).toBeInTheDocument();
    expect(screen.queryByText("ログイン画面")).not.toBeInTheDocument();
  });

  it("優先度で絞り込める", async () => {
    const user = userEvent.setup();
    render(<Board today={TODAY} initialTasks={searchable} />);

    await user.selectOptions(screen.getByLabelText("優先度で絞り込む"), "high");

    expect(screen.getByText("ログイン画面")).toBeInTheDocument();
    expect(screen.queryByText("設定画面")).not.toBeInTheDocument();
  });

  it("該当が無い列には絞り込み中だと分かる文言を出す", async () => {
    const user = userEvent.setup();
    render(<Board today={TODAY} initialTasks={searchable} />);

    await user.type(screen.getByLabelText("検索"), "存在しない語");

    expect(
      within(screen.getByTestId("column-todo")).getByText(
        "該当するタスクはありません",
      ),
    ).toBeInTheDocument();
  });

  it("絞り込みを解除すると全件に戻る", async () => {
    const user = userEvent.setup();
    render(<Board today={TODAY} initialTasks={searchable} />);

    await user.type(screen.getByLabelText("検索"), "ログイン");
    await user.click(screen.getByRole("button", { name: "絞り込みを解除" }));

    expect(screen.getByText("ログイン画面")).toBeInTheDocument();
    expect(screen.getByText("設定画面")).toBeInTheDocument();
    expect(screen.getByLabelText<HTMLInputElement>("検索").value).toBe("");
  });

  it("担当者の選択肢は追加したタスクからも増える", async () => {
    const user = userEvent.setup();
    render(<Board today={TODAY} initialTasks={searchable} />);

    await user.type(screen.getByLabelText("タイトル"), "新規");
    await user.type(screen.getByLabelText("担当者"), "鈴木");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(
      Array.from(
        screen.getByLabelText<HTMLSelectElement>("担当者で絞り込む").options,
      ).map((option) => option.textContent),
    ).toEqual(["すべて", "佐藤", "田中", "鈴木"]);
  });

  it("絞り込み中でもドラッグ＆ドロップで移動できる", async () => {
    const user = userEvent.setup();
    render(<Board today={TODAY} initialTasks={searchable} />);

    await user.type(screen.getByLabelText("検索"), "ログイン");
    dragTaskTo("t1", "done");

    expect(
      within(screen.getByTestId("column-done")).getByText("ログイン画面"),
    ).toBeInTheDocument();
  });
});

describe("Board の削除", () => {
  it("カードの削除ボタンでタスクが消える", async () => {
    const user = userEvent.setup();
    render(<Board initialTasks={initialTasks} />);

    await user.click(screen.getByRole("button", { name: "「設計する」を削除" }));

    expect(screen.queryByText("設計する")).not.toBeInTheDocument();
    expect(screen.getByLabelText("未着手のタスク数")).toHaveTextContent("0");
  });
});

describe("Board の永続化", () => {
  it("追加したタスクはリロードしても残る", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Board initialTasks={initialTasks} />);

    await user.type(screen.getByLabelText("タイトル"), "残るタスク");
    await user.click(screen.getByRole("button", { name: "追加" }));
    unmount();

    render(<Board initialTasks={initialTasks} />);

    expect(
      within(screen.getByTestId("column-todo")).getByText("残るタスク"),
    ).toBeInTheDocument();
  });

  it("移動した先の列もリロード後に保たれる", () => {
    const { unmount } = render(<Board initialTasks={initialTasks} />);

    dragTaskTo("t1", "on-hold");
    unmount();

    render(<Board initialTasks={initialTasks} />);

    expect(
      within(screen.getByTestId("column-on-hold")).getByText("設計する"),
    ).toBeInTheDocument();
  });

  it("削除したタスクはリロードしても戻ってこない", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Board initialTasks={initialTasks} />);

    await user.click(screen.getByRole("button", { name: "「設計する」を削除" }));
    unmount();

    render(<Board initialTasks={initialTasks} />);

    expect(screen.queryByText("設計する")).not.toBeInTheDocument();
  });

  it("絞り込みの条件はリロード後に持ち越さない", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Board initialTasks={initialTasks} />);

    await user.type(screen.getByLabelText("検索"), "存在しない語");
    unmount();

    render(<Board initialTasks={initialTasks} />);

    expect(screen.getByLabelText<HTMLInputElement>("検索").value).toBe("");
    expect(screen.getByText("設計する")).toBeInTheDocument();
  });
});
