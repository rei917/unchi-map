// ============================================================
// hooks/useCurrentUser.ts
// 現在のユーザー情報を管理するフック
// Google セッション + localStorage の表示名を統合
// ============================================================

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";

const DISPLAY_NAME_KEY = "unchi-map-display-name";

export type CurrentUser = {
  /** Google の sub (一意ID) */
  id: string;
  /** 表示名（ユーザーが変更可能） */
  displayName: string;
  /** Google アカウントの本名 */
  googleName: string | null;
  /** アバター画像URL */
  image: string | null;
  /** メールアドレス */
  email: string | null;
};

type UseCurrentUserReturn = {
  user: CurrentUser | null;
  isLoading: boolean;
  /** 表示名を変更して localStorage に保存 */
  updateDisplayName: (name: string) => void;
};

/**
 * 現在のログインユーザーを返すフック
 * 表示名は localStorage で上書き可能
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const { data: session, status } = useSession();
  const [displayName, setDisplayName] = useState<string>("");

  // localStorage から保存済みの表示名を読み込む
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(DISPLAY_NAME_KEY);
    if (saved) setDisplayName(saved);
  }, []);

  // Google ログイン後、表示名がまだ未設定なら Google 名を初期値にセット
  useEffect(() => {
    if (!session?.user?.name) return;
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(DISPLAY_NAME_KEY);
    if (!saved) {
      setDisplayName(session.user.name);
      localStorage.setItem(DISPLAY_NAME_KEY, session.user.name);
    }
  }, [session?.user?.name]);

  const updateDisplayName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDisplayName(trimmed);
    localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
  }, []);

  if (status === "loading") {
    return { user: null, isLoading: true, updateDisplayName };
  }

  if (!session?.user) {
    return { user: null, isLoading: false, updateDisplayName };
  }

  const user: CurrentUser = {
    id: session.user.id ?? session.user.email ?? "unknown",
    displayName: displayName || session.user.name || "名無しさん",
    googleName: session.user.name ?? null,
    image: session.user.image ?? null,
    email: session.user.email ?? null,
  };

  return { user, isLoading: false, updateDisplayName };
}
