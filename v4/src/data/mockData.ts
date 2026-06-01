// ============================================================
// data/mockData.ts
// モックデータ（将来 Supabase に移行予定）
// ============================================================

import { Group, User } from "@/types";

/** ダミーグループ一覧 */
export const GROUPS: Group[] = [
  {
    id: "group_001",
    name: "うんち部",
    inviteCode: "ABC123",
  },
  {
    id: "group_002",
    name: "旅行班",
    inviteCode: "XYZ789",
  },
];

/** ダミーカレントユーザー */
export const CURRENT_USER: User = {
  id: "user_001",
  name: "けーたつ",
};

/** 東京駅のデフォルト座標 (位置情報取得失敗時に使用) */
export const DEFAULT_CENTER = {
  lat: 35.6812,
  lng: 139.7671,
};

/** デフォルトズームレベル */
export const DEFAULT_ZOOM = 15;

/** localStorage のキー */
export const STORAGE_KEY = "unchi-map-records";
