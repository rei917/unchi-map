// ============================================================
// lib/storage.ts
// localStorage への読み書きユーティリティ
// ============================================================

import { ToiletRecord } from "@/types";
import { STORAGE_KEY } from "@/data/mockData";

/**
 * 全記録を localStorage から読み込む
 */
export function loadRecords(): ToiletRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ToiletRecord[];
  } catch (e) {
    console.error("記録の読み込みに失敗しました:", e);
    return [];
  }
}

/**
 * 全記録を localStorage に保存する
 */
export function saveRecords(records: ToiletRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("記録の保存に失敗しました:", e);
  }
}

/**
 * 新しい記録を追加して保存する
 */
export function addRecord(record: ToiletRecord): ToiletRecord[] {
  const existing = loadRecords();
  const updated = [...existing, record];
  saveRecords(updated);
  return updated;
}
