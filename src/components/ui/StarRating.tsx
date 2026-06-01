// ============================================================
// components/ui/StarRating.tsx
// 快適度入力・表示用の星コンポーネント
// ============================================================

"use client";

type Props = {
  /** 現在の評価値 1〜5 */
  value: number;
  /** 編集モード (false なら表示のみ) */
  editable?: boolean;
  onChange?: (value: number) => void;
};

export default function StarRating({ value, editable = false, onChange }: Props) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="star-rating" role={editable ? "group" : undefined} aria-label="快適度">
      {stars.map((star) => (
        <span
          key={star}
          className={`star ${star <= value ? "star--filled" : "star--empty"} ${editable ? "star--clickable" : ""}`}
          onClick={editable && onChange ? () => onChange(star) : undefined}
          role={editable ? "button" : undefined}
          aria-label={editable ? `${star}星` : undefined}
        >
          {star <= value ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}
