// ============================================================
// components/map/RecordPopup.tsx
// ピン押下時に表示されるポップアップのコンテンツ
// ============================================================

import { ToiletRecord } from "@/types";
import StarRating from "@/components/ui/StarRating";

type Props = {
  record: ToiletRecord;
};

/**
 * 日時を読みやすい形式にフォーマット
 */
function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecordPopup({ record }: Props) {
  return (
    <div className="record-popup">
      <p className="popup-title">🚽 うんち記録</p>
      <div className="popup-row">
        <span className="popup-label">投稿者</span>
        <span className="popup-value">{record.userName}</span>
      </div>
      <div className="popup-row">
        <span className="popup-label">快適度</span>
        <StarRating value={record.rating} />
      </div>
      {record.comment && (
        <div className="popup-row">
          <span className="popup-label">コメント</span>
          <span className="popup-value">{record.comment}</span>
        </div>
      )}
      <div className="popup-row">
        <span className="popup-label">投稿日時</span>
        <span className="popup-value popup-date">{formatDate(record.createdAt)}</span>
      </div>
    </div>
  );
}
