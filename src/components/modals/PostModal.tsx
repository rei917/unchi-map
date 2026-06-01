// ============================================================
// components/modals/PostModal.tsx
// 記録投稿モーダル
// ============================================================

"use client";

import { useState } from "react";
import StarRating from "@/components/ui/StarRating";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
};

export default function PostModal({ isOpen, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState<number>(3);
  const [comment, setComment] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(rating, comment);
    // フォームリセット
    setRating(3);
    setComment("");
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="うんち記録を投稿">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">🚽 ここで記録する</h2>
          <button className="modal-close" onClick={onClose} aria-label="閉じる">✕</button>
        </div>

        <div className="modal-body">
          {/* 快適度 */}
          <div className="form-group">
            <label className="form-label">快適度</label>
            <StarRating value={rating} editable onChange={setRating} />
          </div>

          {/* コメント */}
          <div className="form-group">
            <label className="form-label" htmlFor="comment">コメント</label>
            <textarea
              id="comment"
              className="form-textarea"
              placeholder="どんな感じでしたか？（任意）"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleSubmit}>📌 記録する</button>
        </div>
      </div>
    </div>
  );
}
