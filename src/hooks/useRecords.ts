// ============================================================
// hooks/useRecords.ts
// 記録データの状態管理フック
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ToiletRecord } from "@/types";
import { loadRecords, addRecord } from "@/lib/storage";

type NewRecordInput = {
  groupId: string;
  userId: string;
  userName: string;
  lat: number;
  lng: number;
  rating: number;
  comment: string;
};

/**
 * 記録データを管理するカスタムフック
 * localStorage との同期も担う
 */
export function useRecords(currentUserId?: string) {
  const [records, setRecords] = useState<ToiletRecord[]>([]);

  // マウント時に localStorage から読み込む
  useEffect(() => {
    const loaded = loadRecords();
    setRecords(loaded);
  }, []);

  /**
   * 新規記録を追加する
   */
  const postRecord = useCallback(
    (input: NewRecordInput): ToiletRecord => {
      const newRecord: ToiletRecord = {
        id: uuidv4(),
        groupId: input.groupId,
        userId: input.userId,
        userName: input.userName,
        lat: input.lat,
        lng: input.lng,
        rating: input.rating,
        comment: input.comment,
        createdAt: new Date().toISOString(),
      };
      const updated = addRecord(newRecord);
      setRecords(updated);
      return newRecord;
    },
    []
  );

  /**
   * 指定グループの記録のみ返す
   */
  const getGroupRecords = useCallback(
    (groupId: string): ToiletRecord[] => {
      // `my-records` は仮想グループとして扱い、現在のユーザーの投稿を返す
      if (groupId === "my-records") {
        if (!currentUserId) return [];
        return records.filter((r) => r.userId === currentUserId);
      }
      return records.filter((r) => r.groupId === groupId);
    },
    [records, currentUserId]
  );

  return { records, postRecord, getGroupRecords };
}
