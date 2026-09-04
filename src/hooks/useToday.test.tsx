import { renderHook } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { useToday } from "@/hooks/useToday";
import { todayString } from "@/lib/due-date";

function Probe() {
  const today = useToday();
  return <span>{today === "" ? "未定" : today}</span>;
}

describe("useToday", () => {
  it("サーバー側の描画では空文字を返す（ハイドレーション不一致を避けるため）", () => {
    expect(renderToStaticMarkup(<Probe />)).toBe("<span>未定</span>");
  });

  it("クライアントでは今日の日付を返す", () => {
    const { result } = renderHook(() => useToday());

    expect(result.current).toBe(todayString());
    expect(result.current).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("再描画しても同じ値を返す", () => {
    const { result, rerender } = renderHook(() => useToday());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
