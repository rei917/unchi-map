// ============================================================
// components/ui/UserMenu.tsx
// ヘッダー右上のユーザーメニュー
// アバター → ドロップダウン → 表示名変更 / 画像変更 / ログアウト
// ============================================================

"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { CurrentUser, GUEST_USER_KEY } from "@/hooks/useCurrentUser";

type Props = {
  user: CurrentUser;
  onUpdateName: (name: string) => void;
  onUpdateImage: (imageUrl: string | null) => void;
};

function getInitial(name: string) {
  return name.trim().charAt(0) || "?";
}

export default function UserMenu({ user, onUpdateName, onUpdateImage }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingImage, setEditingImage] = useState(false);
  const [nameInput, setNameInput] = useState(user.displayName);
  const [imageInput, setImageInput] = useState(user.image ?? "");
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
        setEditingImage(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 編集モードになったらフォーカス
  useEffect(() => {
    if (editing) {
      setNameInput(user.displayName);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, user.displayName]);

  useEffect(() => {
    if (editingImage) {
      setImageInput(user.image ?? "");
    }
  }, [editingImage, user.image]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdateName(nameInput.trim());
    }
    setEditing(false);
  };

  const handleSaveImage = () => {
    const trimmed = imageInput.trim();
    onUpdateImage(trimmed || null);
    setEditingImage(false);
  };

  const handleResetImage = () => {
    setImageInput("");
    onUpdateImage(null);
    setEditingImage(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveName();
    if (e.key === "Escape") setEditing(false);
  };

  const handleImageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveImage();
    if (e.key === "Escape") setEditingImage(false);
  };

  const handleSignOut = () => {
    if (user.isGuest) {
      localStorage.removeItem(GUEST_USER_KEY);
      localStorage.removeItem(`unchi-map-display-name:${user.id}`);
      localStorage.removeItem(`unchi-map-custom-image:${user.id}`);
      localStorage.removeItem("unchi-map-display-name");
      window.location.href = "/login";
      return;
    }

    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="user-menu" ref={menuRef}>
      {/* アバターボタン */}
      <button
        className="avatar-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="ユーザーメニューを開く"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={user.displayName} className="avatar-img" />
        ) : (
          <span className="avatar-fallback">
            {getInitial(user.displayName)}
          </span>
        )}
      </button>

      {/* ドロップダウン */}
      {open && (
        <div className="user-dropdown">
          {/* ユーザー情報ヘッダー */}
          <div className="dropdown-header">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="dropdown-avatar" />
            ) : (
              <div className="dropdown-avatar-fallback">
                {getInitial(user.displayName)}
              </div>
            )}
            <div className="dropdown-user-info">
              <p className="dropdown-display-name">{user.displayName}</p>
              {user.email ? (
                <p className="dropdown-email">{user.email}</p>
              ) : (
                <p className="dropdown-email">ゲスト</p>
              )}
            </div>
          </div>

          <div className="dropdown-divider" />

          {/* 表示名変更 */}
          <div className="dropdown-section">
            <p className="dropdown-section-label">表示名</p>
            {editing ? (
              <div className="name-edit-row">
                <input
                  ref={inputRef}
                  className="name-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={20}
                  placeholder="表示名を入力"
                />
                <button className="name-save-btn" onClick={handleSaveName}>
                  保存
                </button>
              </div>
            ) : (
              <button
                className="name-edit-trigger"
                onClick={() => setEditing(true)}
              >
                <span>{user.displayName}</span>
                <span className="edit-icon">✏️</span>
              </button>
            )}
          </div>

          <div className="dropdown-divider" />

          {/* 画像変更 */}
          <div className="dropdown-section">
            <p className="dropdown-section-label">画像</p>
            {editingImage ? (
              <div className="name-edit-row">
                <input
                  className="name-input"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={handleImageKeyDown}
                  placeholder="画像URLを入力"
                />
                <button className="name-save-btn" onClick={handleSaveImage}>
                  画像を保存
                </button>
                <button className="image-reset-btn" onClick={handleResetImage}>
                  画像をリセット
                </button>
              </div>
            ) : (
              <button
                className="name-edit-trigger"
                onClick={() => setEditingImage(true)}
              >
                <span>{user.image ? "画像を変更" : "画像を設定"}</span>
                <span className="edit-icon">🖼️</span>
              </button>
            )}
          </div>

          <div className="dropdown-divider" />

          {/* ログアウト */}
          <button
            className="signout-btn"
            onClick={handleSignOut}
          >
            {user.isGuest ? "🚪 ゲスト退出" : "🚪 ログアウト"}
          </button>
        </div>
      )}
    </div>
  );
}
