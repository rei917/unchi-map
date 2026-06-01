// ============================================================
// types/index.ts
// アプリ全体で使用する型定義
// ============================================================

/**
 * トイレ記録の型
 */
export type ToiletRecord = {
  /** UUID */
  id: string;
  /** 所属グループID */
  groupId: string;
  /** 投稿ユーザーID */
  userId: string;
  /** 投稿ユーザー名 */
  userName: string;
  /** 緯度 */
  lat: number;
  /** 経度 */
  lng: number;
  /** 快適度 1〜5 */
  rating: number;
  /** コメント */
  comment: string;
  /** 作成日時 ISO文字列 */
  createdAt: string;
};

export type SupabaseRecord = {
  id: string;
  user_id: string;
  user_name: string;
  group_id: string;
  lat: number;
  lng: number;
  rating: number;
  memo: string;
  created_at: string;
};

/**
 * グループの型
 */
export type Group = {
  id: string;
  name: string;
  inviteCode: string;
  isPersonal?: boolean;
};

/**
 * ユーザーの型
 */
export type User = {
  id: string;
  name: string;
};

/**
 * 地理座標の型
 */
export type LatLng = {
  lat: number;
  lng: number;
};
