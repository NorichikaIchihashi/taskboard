import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ホームディレクトリの package-lock.json をワークスペース候補にしない。
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
