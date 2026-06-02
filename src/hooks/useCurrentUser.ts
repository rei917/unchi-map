// ============================================================
// hooks/useCurrentUser.ts
// 現在のユーザー情報を管理するフック
// Google セッション + ゲストユーザー + 表示名を統合
// ============================================================

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useMemo } from "react";

const DISPLAY_NAME_KEY_PREFIX = "unchi-map-display-name";
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

function getDisplayNameKey(userId: string) {
  return `${DISPLAY_NAME_KEY_PREFIX}:${userId}`;
}

function readDisplayName(userId: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(getDisplayNameKey(userId)) ?? "";
}

function writeDisplayName(userId: string, name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getDisplayNameKey(userId), name);
}

/**
 * 現在のログインユーザーを返すフック。
 * GoogleログインがあればGoogleを優先し、未ログインならゲストユーザーを返す。
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const { data: session, status } = useSession();
  const [displayName, setDisplayName] = useState<string>("");
  const [guestUser, setGuestUser] = useState<StoredGuestUser | null>(null);
  const [localLoaded, setLocalLoaded] = useState(false);

  const googleUserId = useMemo(() => {
    if (!session?.user) return null;
    return session.user.id ?? session.user.email ?? "unknown";
  }, [session?.user]);

  // localStorage からゲストユーザーを読み込む。
  // これが終わる前に「未ログイン」と判定すると、ゲスト参加直後に /login へ戻される。
  useEffect(() => {
    if (typeof window === "undefined") return;
    setGuestUser(readGuestUser());
    setLocalLoaded(true);
  }, []);

  // Googleログイン時はGoogleユーザー専用の表示名を読む。
  // ゲスト名がGoogleログイン後に流用されないよう、ユーザーID別キーに保存する。
  useEffect(() => {
    if (!googleUserId) return;
    const saved = readDisplayName(googleUserId);
    setDisplayName(saved);
  }, [googleUserId]);

  const currentUserId = googleUserId ?? guestUser?.id ?? null;

  const updateDisplayName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !currentUserId) return;

    setDisplayName(trimmed);
    writeDisplayName(currentUserId, trimmed);

    // ゲスト利用中はゲスト情報にも反映する
    if (!googleUserId) {
      const guest = readGuestUser();
      if (guest) {
        const updated = { ...guest, displayName: trimmed };
        localStorage.setItem(GUEST_USER_KEY, JSON.stringify(updated));
        setGuestUser(updated);
      }
    }
  }, [currentUserId, googleUserId]);

  if (status === "loading" || !localLoaded) {
    return { user: null, isLoading: true, updateDisplayName };
  }

  if (session?.user && googleUserId) {
    const user: CurrentUser = {
      id: googleUserId,
      displayName: displayName || session.user.name || "名無しさん",
      googleName: session.user.name ?? null,
      image: session.user.image ?? null,
      email: session.user.email ?? null,
      isGuest: false,
    };

    return { user, isLoading: false, updateDisplayName };
  }

  if (guestUser) {
    const guestDisplayName = displayName || readDisplayName(guestUser.id) || guestUser.displayName;
    const user: CurrentUser = {
      id: guestUser.id,
      displayName: guestDisplayName,
      googleName: null,
      image: null,
      email: null,
      isGuest: true,
    };

    return { user, isLoading: false, updateDisplayName };
  }

  return { user: null, isLoading: false, updateDisplayName };
}
