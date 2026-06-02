// ============================================================
// app/login/page.tsx
// ログインページ
// サイト招待コード + Googleログイン + ゲスト参加
// ============================================================

"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GUEST_USER_KEY } from "@/hooks/useCurrentUser";

const SITE_INVITE_APPROVED_KEY = "unchi-map-site-invite-approved";
const SITE_INVITE_CODE = process.env.NEXT_PUBLIC_SITE_INVITE_CODE ?? "UNCHI-7Q2M";

function createGuestUser(displayName: string) {
  const id = `guest_${crypto.randomUUID()}`;
  const guestUser = {
    id,
    displayName,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser));
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const error = searchParams.get("error");

  const [inviteApproved, setInviteApproved] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setInviteApproved(localStorage.getItem(SITE_INVITE_APPROVED_KEY) === "true");
  }, []);

  const handleInviteSubmit = () => {
    const input = inviteInput.trim().toUpperCase();
    const expected = SITE_INVITE_CODE.trim().toUpperCase();

    if (input !== expected) {
      setInviteError("招待コードが違います");
      return;
    }

    localStorage.setItem(SITE_INVITE_APPROVED_KEY, "true");
    setInviteApproved(true);
    setInviteError("");
  };

  const handleGuestJoin = () => {
    const name = guestName.trim();
    if (!name) {
      setInviteError("ゲスト名を入力してください");
      return;
    }

    createGuestUser(name);
    router.replace(callbackUrl);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* ロゴ */}
        <div className="login-logo">🚽</div>
        <h1 className="login-title">うんちマップ</h1>
        <p className="login-subtitle">
          友達とトイレ体験を共有しよう
          <span className="beta-badge" style={{ marginLeft: 6 }}>β</span>
        </p>

        {/* エラーメッセージ */}
        {error && (
          <div className="login-error">
            ⚠️ ログインに失敗しました。もう一度お試しください。
          </div>
        )}

        {!inviteApproved ? (
          <div className="invite-gate">
            <p className="invite-gate-label">サイト招待コード</p>
            <input
              className="invite-gate-input"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInviteSubmit();
              }}
              placeholder="例: UNCHI-7Q2M"
              autoCapitalize="characters"
            />
            {inviteError && <p className="invite-gate-error">{inviteError}</p>}
            <button className="invite-gate-btn" onClick={handleInviteSubmit}>
              参加する
            </button>
          </div>
        ) : (
          <>
            {/* Google ログインボタン */}
            <button
              className="google-signin-btn"
              onClick={() => signIn("google", { callbackUrl })}
            >
              <GoogleIcon />
              Google でログイン
            </button>

            <div className="guest-join-box">
              <div className="guest-divider">または</div>
              <input
                className="guest-name-input"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGuestJoin();
                }}
                placeholder="ゲスト名"
                maxLength={20}
              />
              <button className="guest-join-btn" onClick={handleGuestJoin}>
                ゲストで参加
              </button>
              {inviteError && <p className="invite-gate-error">{inviteError}</p>}
            </div>
          </>
        )}

        <p className="login-note">
          招待コードを持つ友達のみ参加できます
        </p>
      </div>
    </div>
  );
}

/** Google のロゴSVG */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
