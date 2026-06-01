// ============================================================
// lib/storage.ts
// Supabase への読み書きユーティリティ
// ============================================================

import { ToiletRecord, SupabaseRecord, Group } from "@/types";
import { supabase } from "@/lib/supabase";
import { generateInviteCode } from "@/lib/invite";

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

// ============================================================
// Groups / group_members helpers
// ============================================================

/**
 * Create a group and register the creating user as a member
 */
export async function createGroup(name: string, createdBy: string, displayName?: string): Promise<Group> {
  const id = crypto.randomUUID();
  const inviteCode = generateInviteCode();
  const groupRow = {
    id,
    name,
    invite_code: inviteCode,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };

  const { data: created, error: createErr } = await supabase.from("groups").insert([groupRow]).select("*").single();
  if (createErr || !created) {
    console.error("グループ作成に失敗しました:", createErr);
    throw new Error(createErr?.message || "グループ作成に失敗しました");
  }

  // add creator to group_members
  const memberRow = {
    id: crypto.randomUUID(),
    group_id: created.id,
    user_id: createdBy,
    display_name: displayName ?? "",
    joined_at: new Date().toISOString(),
  };

  const { error: memberErr } = await supabase.from("group_members").insert([memberRow]);
  if (memberErr) {
    console.error("グループメンバー登録に失敗しました:", memberErr);
    // Not throwing here because group was created, but caller may want to handle
  }

  return {
    id: created.id,
    name: created.name,
    inviteCode: created.invite_code,
  } as Group;
}

/**
 * Join a group by invite code (case-insensitive). Returns true if joined or already member.
 */
export async function joinGroupByInviteCode(inviteCode: string, userId: string, displayName?: string): Promise<boolean> {
  const code = inviteCode.trim();
  if (!code) return false;

  // find group (case-insensitive)
  const { data: groupsData, error: gErr } = await supabase.from("groups").select("*").ilike("invite_code", code);
  if (gErr) {
    console.error("招待コード検索に失敗しました:", gErr);
    return false;
  }
  if (!groupsData || groupsData.length === 0) return false;
  const group = groupsData[0];

  // check existing membership
  const { data: existing, error: exErr } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", userId)
    .limit(1);
  if (exErr) console.error("メンバー検索エラー:", exErr);
  if (existing && existing.length > 0) return true;

  const memberRow = {
    id: crypto.randomUUID(),
    group_id: group.id,
    user_id: userId,
    display_name: displayName ?? "",
    joined_at: new Date().toISOString(),
  };

  const { error: insertErr } = await supabase.from("group_members").insert([memberRow]);
  if (insertErr) {
    console.error("メンバー追加に失敗しました:", insertErr);
    return false;
  }
  return true;
}

/**
 * Get groups the user belongs to
 */
export async function getUserGroups(userId: string): Promise<Group[]> {
  // find group_ids for this user
  const { data: members, error: mErr } = await supabase.from("group_members").select("group_id").eq("user_id", userId);
  if (mErr) {
    console.error("group_members 検索に失敗しました:", mErr);
    return [];
  }
  if (!members || members.length === 0) return [];

  const ids = members.map((m: any) => m.group_id);
  const { data: groupsData, error: gErr } = await supabase.from("groups").select("*").in("id", ids);
  if (gErr) {
    console.error("groups 取得に失敗しました:", gErr);
    return [];
  }
  if (!groupsData) return [];

  return groupsData.map((g: any) => ({ id: g.id, name: g.name, inviteCode: g.invite_code } as Group));
}

/**
 * Leave a group (remove membership)
 */
export async function leaveGroup(userId: string, groupId: string): Promise<boolean> {
  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
  if (error) {
    console.error("グループ脱退に失敗しました:", error);
    return false;
  }
  return true;
}
