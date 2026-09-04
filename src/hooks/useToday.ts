"use client";

import { useSyncExternalStore } from "react";

import { todayString } from "@/lib/due-date";

/** 「今日」は開いている間変わらない前提なので、購読するものは無い。 */
const subscribe = () => () => {};

const getSnapshot = () => todayString();

/**
 * サーバー側の描画とハイドレーション時に使われるスナップショット。
 * Board はサーバー側でもプリレンダリングされるため、ここで現在時刻を読むと
 * サーバーとクライアントで日付がずれてハイドレーション不一致になる。
 * "" を返しておけば期限の強調が出ないだけで、マークアップは必ず一致する。
 */
const getServerSnapshot = () => "";

/** 期限の判定に使う「今日」を "YYYY-MM-DD" で返す。マウント前は ""。 */
export function useToday(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
