// ============================================================
// app/page.tsx
// アプリのメインページ
// ============================================================

"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import { useToast } from "@/components/ui/ToastProvider";
import PostButton from "@/components/ui/PostButton";
import PostModal from "@/components/modals/PostModal";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRecords } from "@/hooks/useRecords";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGroups } from "@/hooks/useGroups";

// Leaflet は SSR 非対応なので動的インポートで回避
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <span>🗺️ 地図を読み込み中...</span>
    </div>
  ),
});

export default function HomePage() {
  const router = useRouter();

  // 認証状態
  const { user, isLoading: authLoading, updateDisplayName } 
  = useCurrentUser();
  const toast = useToast();

  // 未ログインならログインページへ
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const { groups, createGroup, joinGroup, leaveGroup } = useGroups(user?.id);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("my-records");

  // 投稿モーダルの開閉
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 位置情報
  const { center, position: currentPosition, error: geoError } = useGeolocation();

  // 記録データ
  const { postRecord, getGroupRecords, removeRecord } = useRecords(user?.id ?? undefined, selectedGroupId);

  // 現在のグループの記録
  const groupRecords = getGroupRecords(selectedGroupId);

  /**
   * 記録を保存する
   */
  const handleSubmit = useCallback(
    (rating: number, comment: string) => {
      if (!user) return;
      postRecord({
        // Convert my-records to empty string to store as personal record
        groupId: selectedGroupId === "my-records" ? "" : selectedGroupId,
        userId: user.id,
        userName: user.displayName,
        lat: currentPosition?.lat ?? center.lat,
        lng: currentPosition?.lng ?? center.lng,
        rating,
        comment,
      });
      setIsModalOpen(false);
    },
    [postRecord, selectedGroupId, currentPosition, center, user]
  );

  // ロード中 or 未ログインは何も表示しない
  if (authLoading || !user) {
    return (
      <div className="map-loading">
        <span>🚽 読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* ヘッダー */}
      <Header
        groups={groups}
        selectedGroupId={selectedGroupId}
        onGroupChange={setSelectedGroupId}
        user={user}
        onUpdateName={updateDisplayName}
        onCreateGroup={(name) => { void createGroup(name); }}
        onJoinGroup={(code) => {
          // joinGroup is async; handle result and notify user
          (async () => {
            const ok = await joinGroup(code);
            if (!ok) {
              toast.showToast("招待コードが見つかりませんでした", "error");
            } else {
              toast.showToast("グループに参加しました", "success");
            }
          })();
        }}
        onLeaveGroup={(groupId) => {
          (async () => {
            const ok = await leaveGroup(groupId);
            if (ok) {
              setSelectedGroupId("my-records");
              toast.showToast("グループを脱退しました", "success");
            } else {
              toast.showToast("グループ脱退に失敗しました", "error");
            }
          })();
        }}
      />

      {/* 位置情報エラー通知 */}
      {geoError && (
        <div className="geo-error-banner">
          📍 位置情報を取得できませんでした。東京駅付近を表示中。
        </div>
      )}

      {/* 地図 */}
      <main className="map-area">
        <MapView
          center={center}
          currentPosition={currentPosition}
          records={groupRecords}
          currentUserId={user.id}
          onDeleteRecord={(recordId) => {
            removeRecord(recordId);
          }}
        />
      </main>

      {/* 記録ボタン */}
      <PostButton onClick={() => setIsModalOpen(true)} />

      {/* 投稿モーダル */}
      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
