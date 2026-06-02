// ============================================================
// lib/storage.ts
// Supabase への読み書きユーティリティ
// ============================================================

import { ToiletRecord, SupabaseRecord, Group, GroupMember } from "@/types";
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
 * ローカル画像ファイルを Supabase Storage の avatars バケットへアップロードする。
 * バケットは Public bucket として作成しておくこと。
 */
export async function uploadAvatarFile(userId: string, file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイルを選択してください");
  }

  // 身内向けでも巨大画像は避ける。必要なら上限は調整可。
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("画像サイズは5MB以下にしてください");
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const ext = rawExt.replace(/[^a-z0-9]/g, "") || "jpg";
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filePath = `${safeUserId}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    console.error("アバター画像アップロードに失敗しました:", error);
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return data.publicUrl;
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
 * 現在のユーザーのマイ記録を Supabase から読み込む
 */
export async function loadMyRecords(userId: string): Promise<ToiletRecord[]> {
  const { data, error } = await supabase.from("records").select("*").eq("user_id", userId);
  if (error) {
    console.error("マイ記録の読み込みに失敗しました:", error);
    return [];
  }
  if (!data) return [];
  return (data as SupabaseRecord[]).map(fromSupabaseRecord);
}

/**
 * グループに紐づく記録を Supabase から読み込む
 */
export async function loadGroupRecords(groupId: string): Promise<ToiletRecord[]> {
  const { data: recordGroups, error: rgErr } = await supabase
    .from("record_groups")
    .select("record_id")
    .eq("group_id", groupId);

  if (rgErr) {
    console.error("record_groups の読み込みに失敗しました:", rgErr);
    return [];
  }

  const legacy = await supabase.from("records").select("id").eq("group_id", groupId);
  if (legacy.error) {
    console.error("レガシー group_id の読み込みに失敗しました:", legacy.error);
    return [];
  }

  const recordIds = [
    ...(recordGroups?.map((item: any) => item.record_id) ?? []),
    ...(legacy.data?.map((item: any) => item.id) ?? []),
  ];

  const uniqueIds = Array.from(new Set(recordIds));
  if (uniqueIds.length === 0) return [];

  const { data, error } = await supabase.from("records").select("*").in("id", uniqueIds);
  if (error) {
    console.error("グループ記録の読み込みに失敗しました:", error);
    return [];
  }
  if (!data) return [];

  return (data as SupabaseRecord[]).map(fromSupabaseRecord);
}

/**
 * 新しい記録を Supabase に追加する
 */
export async function addRecord(record: ToiletRecord): Promise<ToiletRecord> {
  const insertRecord = {
    id: record.id,
    user_id: record.userId,
    user_name: record.userName,
    group_id: "",
    lat: record.lat,
    lng: record.lng,
    rating: record.rating,
    memo: record.comment,
    created_at: record.createdAt,
  };

  const { data, error } = await supabase
    .from("records")
    .insert([insertRecord])
    .select("*")
    .single();

  if (error || !data) {
    console.error("Supabase への記録追加に失敗しました:", error);
    throw new Error(error?.message || "記録の追加に失敗しました");
  }

  return fromSupabaseRecord(data);
}

/**
 * record_groups に record_id と group_id を追加する
 */
export async function assignRecordToGroup(recordId: string, groupId: string): Promise<boolean> {
  const payload = {
    id: crypto.randomUUID(),
    record_id: recordId,
    group_id: groupId,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("record_groups")
    .upsert([payload], {
      onConflict: "record_id,group_id",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error("record_groups への追加に失敗しました:", error);
    return false;
  }

  return true;
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
export async function createGroup(name: string, createdBy: string, displayName?: string, avatarUrl?: string | null): Promise<Group> {
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
    avatar_url: avatarUrl ?? null,
    joined_at: new Date().toISOString(),
  };

  const { error: memberErr } = await supabase.from("group_members").insert([memberRow]);
  if (memberErr) {
    // avatar_url カラム未追加の環境でも壊れないようにフォールバック
    const fallbackRow = { ...memberRow } as any;
    delete fallbackRow.avatar_url;
    const { error: fallbackErr } = await supabase.from("group_members").insert([fallbackRow]);
    if (fallbackErr) {
      console.error("グループメンバー登録に失敗しました:", fallbackErr);
    }
  }

  return {
    id: created.id,
    name: created.name,
    inviteCode: created.invite_code,
  } as Group;
}

/**
 * Join a group by invite code (case-insensitive). Returns group ID if joined or already member, null if failed.
 */
export async function joinGroupByInviteCode(inviteCode: string, userId: string, displayName?: string, avatarUrl?: string | null): Promise<string | null> {
  const code = inviteCode.trim();
  if (!code) return null;

  // find group (case-insensitive)
  const { data: groupsData, error: gErr } = await supabase.from("groups").select("*").ilike("invite_code", code);
  if (gErr) {
    console.error("招待コード検索に失敗しました:", gErr);
    return null;
  }
  if (!groupsData || groupsData.length === 0) return null;
  const group = groupsData[0];

  // check existing membership
  const { data: existing, error: exErr } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", userId)
    .limit(1);
  if (exErr) console.error("メンバー検索エラー:", exErr);
  if (existing && existing.length > 0) return group.id; // 既に参加済みの場合もグループIDを返す

  const memberRow = {
    id: crypto.randomUUID(),
    group_id: group.id,
    user_id: userId,
    display_name: displayName ?? "",
    avatar_url: avatarUrl ?? null,
    joined_at: new Date().toISOString(),
  };

  const { error: insertErr } = await supabase.from("group_members").insert([memberRow]);
  if (insertErr) {
    // avatar_url カラム未追加の環境でも壊れないようにフォールバック
    const fallbackRow = { ...memberRow } as any;
    delete fallbackRow.avatar_url;
    const { error: fallbackErr } = await supabase.from("group_members").insert([fallbackRow]);
    if (fallbackErr) {
      console.error("メンバー追加に失敗しました:", fallbackErr);
      return null;
    }
  }
  return group.id; // グループIDを返す
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
  console.log("グループ脱退処理開始", { userId, groupId });
  const { data, error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .select("id");
  
  if (error) {
    console.error("グループ脱退DELETE失敗", {
      error: error.message,
      code: (error as any).code,
      details: (error as any).details,
      userId,
      groupId,
    });
    return false;
  }
  
  console.log("削除結果", { data, deletedCount: data?.length ?? 0 });
  if (!data || data.length === 0) {
    console.error("グループ脱退に失敗: 削除対象が見つかりませんでした", { userId, groupId });
    return false;
  }
  
  console.log("グループ脱退完了", { userId, groupId });
  return true;
}

/**
 * ユーザーの既存マイ記録をグループに共有する（record_groups テーブルに追加）
 * 新規投稿時は record_groups テーブルを使わず、既存マイ記録の共有のみに使用
 */
export async function shareRecordsToGroup(userId: string, groupId: string): Promise<boolean> {
  try {
    // ユーザーの全記録を取得（マイ記録は user_id ベースの仮想ビューとして扱う）
    const { data: myRecords, error: fetchErr } = await supabase
      .from("records")
      .select("id")
      .eq("user_id", userId);

    if (fetchErr) {
      console.error("マイ記録の取得に失敗しました:", fetchErr);
      return false;
    }

    if (!myRecords || myRecords.length === 0) {
      console.log("共有するマイ記録がありません");
      return true; // 記録がない場合は成功とする
    }

    // record_groups テーブルに追加する。
    // insert だと既存共有が1件でもある場合に全体が失敗する可能性があるため、
    // record_id + group_id の重複は無視する upsert にする。
    const recordGroupEntries = myRecords.map((r) => ({
      id: crypto.randomUUID(),
      record_id: r.id,
      group_id: groupId,
      created_at: new Date().toISOString(),
    }));

    const { error: insertErr } = await supabase
      .from("record_groups")
      .upsert(recordGroupEntries, {
        onConflict: "record_id,group_id",
        ignoreDuplicates: true,
      });

    if (insertErr) {
      console.error("記録の共有に失敗しました:", insertErr);
      return false;
    }

    console.log("マイ記録をグループに共有しました", { userId, groupId, count: myRecords.length });
    return true;
  } catch (error) {
    console.error("マイ記録共有処理でエラーが発生しました:", error);
    return false;
  }
}


/**
 * グループメンバー一覧を取得する
 * display_name が未保存/ID表示になっている古いメンバーは、
 * records.user_name から表示名を補完する。
 */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const selectWithAvatar = "id, group_id, user_id, display_name, avatar_url, joined_at";
  const selectFallback = "id, group_id, user_id, display_name, joined_at";

  const normalizeName = (displayName: string | null | undefined, userId: string) => {
    const name = (displayName ?? "").trim();
    if (!name) return "";
    // 過去データで display_name に user_id が入っている場合は補完対象にする
    if (name === userId) return "";
    return name;
  };

  const mapRows = async (rows: any[], hasAvatar: boolean): Promise<GroupMember[]> => {
    const members = rows.map((row: any) => ({
      id: row.id,
      groupId: row.group_id,
      userId: row.user_id,
      displayName: normalizeName(row.display_name, row.user_id),
      avatarUrl: hasAvatar ? (row.avatar_url ?? null) : null,
      joinedAt: row.joined_at,
    }));

    const needsNameUserIds = members
      .filter((member) => !member.displayName)
      .map((member) => member.userId);

    if (needsNameUserIds.length > 0) {
      const uniqueUserIds = Array.from(new Set(needsNameUserIds));
      const { data: recordNames, error: recordNameError } = await supabase
        .from("records")
        .select("user_id, user_name, created_at")
        .in("user_id", uniqueUserIds)
        .order("created_at", { ascending: false });

      if (!recordNameError && recordNames) {
        const nameMap = new Map<string, string>();
        for (const row of recordNames as any[]) {
          const userName = (row.user_name ?? "").trim();
          if (userName && !nameMap.has(row.user_id)) {
            nameMap.set(row.user_id, userName);
          }
        }

        for (const member of members) {
          if (!member.displayName) {
            member.displayName = nameMap.get(member.userId) ?? "名無しさん";
          }
        }
      }
    }

    return members.map((member) => ({
      ...member,
      displayName: member.displayName || "名無しさん",
    }));
  };

  const { data, error } = await supabase
    .from("group_members")
    .select(selectWithAvatar)
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (!error && data) return mapRows(data, true);

  // avatar_url カラムをまだ追加していない場合のフォールバック
  const { data: fallbackData, error: fallbackError } = await supabase
    .from("group_members")
    .select(selectFallback)
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (fallbackError) {
    console.error("グループメンバー取得に失敗しました:", fallbackError);
    return [];
  }

  return mapRows(fallbackData ?? [], false);
}

/**
 * 現在ユーザーの全所属グループに、表示名・画像URLを反映する
 */
export async function updateUserMembershipProfile(userId: string, displayName: string, avatarUrl?: string | null): Promise<boolean> {
  const updatePayload = {
    display_name: displayName,
    avatar_url: avatarUrl ?? null,
  };

  const { data, error } = await supabase
    .from("group_members")
    .update(updatePayload)
    .eq("user_id", userId)
    .select("id");

  if (!error) {
    console.log("メンバープロフィール更新完了", {
      userId,
      updatedCount: data?.length ?? 0,
      avatarUrl,
    });
    return true;
  }

  // avatar_url カラム未追加の環境でも表示名更新だけは成功させる
  const { data: fallbackData, error: fallbackError } = await supabase
    .from("group_members")
    .update({ display_name: displayName })
    .eq("user_id", userId)
    .select("id");

  if (fallbackError) {
    console.error("メンバープロフィール更新に失敗しました:", fallbackError);
    return false;
  }

  console.warn("avatar_urlなしでメンバープロフィールを更新しました。avatar_urlカラム追加を確認してください。", {
    userId,
    updatedCount: fallbackData?.length ?? 0,
  });
  return true;
}
