// ============================================================
// hooks/useRecords.ts
// 記録データの状態管理フック
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ToiletRecord } from "@/types";
import {
  loadGroupRecords,
  loadMyRecords,
  addRecord,
  assignRecordToGroup,
  deleteRecord,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase";

type NewRecordInput = {
  groupId?: string;
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
    if (!selectedGroupId) {
      setRecords([]);
      return;
    }

    try {
      let loaded: ToiletRecord[] = [];

      if (selectedGroupId === "my-records") {
        if (!currentUserId) {
          setRecords([]);
          return;
        }
        loaded = await loadMyRecords(currentUserId);
      } else {
        loaded = await loadGroupRecords(selectedGroupId);
      }

      setRecords(loaded);
    } catch (error) {
      console.error("記録の読み込みに失敗しました:", error);
      setRecords([]);
    }
  }, [currentUserId, selectedGroupId]);

  // マウント時と selectedGroupId/currentUserId 変更時の読み込み
  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  // Realtime subscription: refetch when relevant records or record_groups change
  useEffect(() => {
    if (!selectedGroupId) return;

    const channel = supabase.channel(`records:${selectedGroupId}`);

    if (selectedGroupId === "my-records") {
      if (!currentUserId) return;
      const filter = `user_id=eq.${currentUserId}`;
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "records", filter },
        async () => {
          await fetchRecords();
        }
      );
    } else {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "records" },
        async () => {
          await fetchRecords();
        }
      );
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "record_groups", filter: `group_id=eq.${selectedGroupId}` },
        async () => {
          await fetchRecords();
        }
      );
    }

    void channel.subscribe();

    return () => {
      void channel.unsubscribe();
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // ignore
      }
    };
  }, [currentUserId, selectedGroupId, fetchRecords]);

  /**
   * 新規記録を追加する
   */
  const postRecord = useCallback(
    async (input: NewRecordInput): Promise<ToiletRecord | null> => {
      const newRecord: ToiletRecord = {
        id: uuidv4(),
        groupId: "",
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

        if (input.groupId && input.groupId !== "my-records") {
          const assigned = await assignRecordToGroup(inserted.id, input.groupId);
          if (!assigned) {
            try {
              await deleteRecord(inserted.id);
            } catch (rollbackError) {
              console.error("レコードのロールバックに失敗しました:", rollbackError);
            }
            throw new Error("グループへのレコード共有に失敗しました");
          }
        }

        const isCurrentView =
          selectedGroupId === "my-records"
            ? !input.groupId || input.groupId === "my-records"
            : input.groupId === selectedGroupId;

        if (isCurrentView) {
          setRecords((prev) => [...prev, inserted]);
        }

        return inserted;
      } catch (error) {
        console.error("記録の追加に失敗しました:", error);
        return null;
      }
    },
    [selectedGroupId]
  );

  const removeRecord = useCallback(async (recordId: string) => {
    try {
      await deleteRecord(recordId);
      setRecords((prev) => prev.filter((record) => record.id !== recordId));
    } catch (error) {
      console.error("記録の削除に失敗しました:", error);
    }
  }, []);

  const getGroupRecords = useCallback(
    (groupId: string): ToiletRecord[] => {
      return records;
    },
    [records]
  );

  return { records, postRecord, getGroupRecords, removeRecord };
}
