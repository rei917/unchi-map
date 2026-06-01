// ============================================================
// lib/storage.ts
// Supabase への読み書きユーティリティ
// ============================================================

import { ToiletRecord, SupabaseRecord } from "@/types";
import { supabase } from "@/lib/supabase";

function fromSupabaseRecord(record: SupabaseRecord): ToiletRecord {
  return {
    id: record.id,
    userId: record.user_id,
    groupId: record.group_id,
    lat: record.lat,
    lng: record.lng,
    rating: record.rating,
    comment: record.memo,
    createdAt: record.created_at,
    userName: record.user_name,
  };
}

function toSupabaseRecord(record: ToiletRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    user_name: record.userName,
    group_id: record.groupId,
    lat: record.lat,
    lng: record.lng,
    rating: record.rating,
    memo: record.comment,
    created_at: record.createdAt,
  };
}

/**
 * 全記録を Supabase から読み込む
 */
export async function loadRecords(): Promise<ToiletRecord[]> {
  const { data, error } = await supabase.from("records").select("*");
  if (error) {
    console.error("Supabase からの記録読み込みに失敗しました:", error);
    return [];
  }
  if (!data) return [];
  return (data as SupabaseRecord[]).map(fromSupabaseRecord);
}

/**
 * 新しい記録を Supabase に追加する
 */
export async function addRecord(record: ToiletRecord): Promise<ToiletRecord> {
  const { data, error } = await supabase
    .from("records")
    .insert([toSupabaseRecord(record)])
    .select("*")
    .single();

  if (error || !data) {
    console.error("Supabase への記録追加に失敗しました:", error);
    throw new Error(error?.message || "記録の追加に失敗しました");
  }

  return fromSupabaseRecord(data);
}

/**
 * 指定IDの記録を Supabase から削除する
 */
export async function deleteRecord(recordId: string): Promise<void> {
  const { error } = await supabase.from("records").delete().eq("id", recordId);
  if (error) {
    console.error("Supabase からの記録削除に失敗しました:", error);
    throw new Error(error.message);
  }
}
