// ============================================================
// components/ui/PostButton.tsx
// 画面下部固定の「記録する」ボタン
// ============================================================

"use client";

type Props = {
  onClick: () => void;
};

export default function PostButton({ onClick }: Props) {
  return (
    <div className="post-button-wrapper">
      <button className="post-button" onClick={onClick}>
        🚽 ここで記録する
      </button>
    </div>
  );
}
