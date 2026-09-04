import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BoardFilterBar } from "@/components/BoardFilterBar";
import { EMPTY_BOARD_FILTER, type BoardFilter } from "@/lib/board";

function renderBar(overrides: Partial<Parameters<typeof BoardFilterBar>[0]> = {}) {
  const onFilterChange = vi.fn();
  const onClear = vi.fn();

  render(
    <BoardFilterBar
      filter={EMPTY_BOARD_FILTER}
      assignees={["佐藤", "田中"]}
      totalCount={5}
      visibleCount={5}
      onFilterChange={onFilterChange}
      onClear={onClear}
      {...overrides}
    />,
  );

  return { onFilterChange, onClear };
}

describe("BoardFilterBar", () => {
  it("入力したキーワードを親に渡す", async () => {
    const user = userEvent.setup();
    const { onFilterChange } = renderBar();

    await user.type(screen.getByLabelText("検索"), "設");

    expect(onFilterChange).toHaveBeenCalledWith({ query: "設" });
  });

  it("担当者の選択肢は渡された一覧に「すべて」を足したもの", () => {
    renderBar();

    expect(
      Array.from(
        screen.getByLabelText<HTMLSelectElement>("担当者で絞り込む").options,
      ).map((option) => option.textContent),
    ).toEqual(["すべて", "佐藤", "田中"]);
  });

  it("優先度の選択肢は高い順に並ぶ", () => {
    renderBar();

    expect(
      Array.from(
        screen.getByLabelText<HTMLSelectElement>("優先度で絞り込む").options,
      ).map((option) => option.textContent),
    ).toEqual(["すべて", "高", "中", "低"]);
  });

  it("選んだ担当者と優先度を親に渡す", async () => {
    const user = userEvent.setup();
    const { onFilterChange } = renderBar();

    await user.selectOptions(screen.getByLabelText("担当者で絞り込む"), "田中");
    expect(onFilterChange).toHaveBeenCalledWith({ assignee: "田中" });

    await user.selectOptions(screen.getByLabelText("優先度で絞り込む"), "high");
    expect(onFilterChange).toHaveBeenCalledWith({ priority: "high" });
  });

  it("絞り込んでいないときは解除ボタンも件数も出さない", () => {
    renderBar();

    expect(
      screen.queryByRole("button", { name: "絞り込みを解除" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("filter-summary")).not.toBeInTheDocument();
  });

  it("絞り込んでいるときは表示件数を知らせる", () => {
    const filter: BoardFilter = { ...EMPTY_BOARD_FILTER, query: "設計" };
    renderBar({ filter, visibleCount: 2 });

    expect(screen.getByTestId("filter-summary")).toHaveTextContent(
      "5 件中 2 件を表示",
    );
  });

  it("解除ボタンを押すと親に伝える", async () => {
    const user = userEvent.setup();
    const filter: BoardFilter = { ...EMPTY_BOARD_FILTER, assignee: "田中" };
    const { onClear } = renderBar({ filter, visibleCount: 1 });

    await user.click(screen.getByRole("button", { name: "絞り込みを解除" }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
