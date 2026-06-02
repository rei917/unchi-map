// ============================================================
// hooks/useCurrentUser.ts
// 現在のユーザー情報を管理するフック
// Google セッション + ゲストユーザー + localStorage 表示名を統合
// ============================================================

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";

const DISPLAY_NAME_KEY = "unchi-map-display-name";
export const GUEST_USER_KEY = "unchi-map-guest-user";

export type CurrentUser = {
  /** Google の sub / ゲストID */
  id: string;
  /** 表示名（ユーザーが変更可能） */
  displayName: string;
  /** Google アカウントの本名 */
  googleName: string | null;
  /** アバター画像URL */
  image: string | null;
  /** メールアドレス */
  email: string | null;
  /** ゲストユーザーかどうか */
  isGuest?: boolean;
};

type StoredGuestUser = {
  id: string;
  displayName: string;
  createdAt: string;
};

type UseCurrentUserReturn = {
  user: CurrentUser | null;
  isLoading: boolean;
  /** 表示名を変更して localStorage に保存 */
  updateDisplayName: (name: string) => void;
};

function readGuestUser(): StoredGuestUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(GUEST_USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredGuestUser;
    if (!parsed.id || !parsed.displayName) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 現在のログインユーザーを返すフック。
 * GoogleログインがあればGoogleを優先し、未ログインならゲストユーザーを返す。
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const { data: session, status } = useSession();
  const [displayName, setDisplayName] = useState<string>("");
  const [guestUser, setGuestUser] = useState<StoredGuestUser | null>(null);

  // localStorage から保存済みの表示名・ゲストユーザーを読み込む
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(DISPLAY_NAME_KEY);
    if (saved) setDisplayName(saved);
    setGuestUser(readGuestUser());
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

    // ゲスト利用中はゲスト情報にも反映する
    const guest = readGuestUser();
    if (guest) {
      const updated = { ...guest, displayName: trimmed };
      localStorage.setItem(GUEST_USER_KEY, JSON.stringify(updated));
      setGuestUser(updated);
    }
  }, []);

  if (status === "loading") {
    return { user: null, isLoading: true, updateDisplayName };
  }

  if (session?.user) {
    const user: CurrentUser = {
      id: session.user.id ?? session.user.email ?? "unknown",
      displayName: displayName || session.user.name || "名無しさん",
      googleName: session.user.name ?? null,
      image: session.user.image ?? null,
      email: session.user.email ?? null,
      isGuest: false,
    };

    return { user, isLoading: false, updateDisplayName };
  }

  if (guestUser) {
    const user: CurrentUser = {
      id: guestUser.id,
      displayName: displayName || guestUser.displayName,
      googleName: null,
      image: null,
      email: null,
      isGuest: true,
    };

    return { user, isLoading: false, updateDisplayName };
  }

  return { user: null, isLoading: false, updateDisplayName };
}
