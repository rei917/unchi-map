// ============================================================
// hooks/useRecords.ts
// 記録データの状態管理フック
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ToiletRecord } from "@/types";
import { loadRecords, addRecord, deleteRecord } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

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
 */
export function useRecords(currentUserId?: string, selectedGroupId?: string) {
  const [records, setRecords] = useState<ToiletRecord[]>([]);

  const fetchRecords = useCallback(async () => {
    try {
      const loaded = await loadRecords();
      setRecords(loaded);
    } catch (error) {
      console.error("記録の読み込みに失敗しました:", error);
      setRecords([]);
    }
  }, []);

  // マウント時と selectedGroupId/currentUserId 変更時の読み込み
  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords, selectedGroupId, currentUserId]);

  // Realtime subscription: refetch when records table changes for the current subscription filter
  useEffect(() => {
    let filter: string | null = null;
    if (selectedGroupId === "my-records") {
      if (!currentUserId) return;
      filter = `user_id=eq.${currentUserId}`;
    } else {
      if (!selectedGroupId) return;
      filter = `group_id=eq.${selectedGroupId}`;
    }

    const channel = supabase.channel(`records:${filter}`);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "records", filter },
      async () => {
        await fetchRecords();
      }
    );

    void channel.subscribe();

    return () => {
      void channel.unsubscribe();
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // ignore
      }
    };
  }, [selectedGroupId, currentUserId, fetchRecords]);

  /**
   * 新規記録を追加する
   */
  const postRecord = useCallback(
    async (input: NewRecordInput): Promise<ToiletRecord | null> => {
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

      try {
        const inserted = await addRecord(newRecord);
        setRecords((prev) => [...prev, inserted]);
        return inserted;
      } catch (error) {
        console.error("記録の追加に失敗しました:", error);
        return null;
      }
    },
    []
  );

  const removeRecord = useCallback(async (recordId: string) => {
    try {
      await deleteRecord(recordId);
      setRecords((prev) => prev.filter((record) => record.id !== recordId));
    } catch (error) {
      console.error("記録の削除に失敗しました:", error);
    }
  }, []);

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

  return { records, postRecord, getGroupRecords, removeRecord };
}
