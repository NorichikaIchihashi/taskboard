import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  // 永続化のテストが互いに影響しないよう、保存内容も毎回捨てる。
  localStorage.clear();
});
