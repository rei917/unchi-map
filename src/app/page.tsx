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
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { shareRecordsToGroup, updateUserMembershipProfile } from "@/lib/storage";

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
  const { user, isLoading: authLoading, updateDisplayName, updateImage } 
  = useCurrentUser();
  const toast = useToast();

  // 未ログインならログインページへ
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const { groups, createGroup, joinGroup, leaveGroup } = useGroups(user?.id, user?.displayName, user?.image);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("my-records");
  const [memberProfileVersion, setMemberProfileVersion] = useState(0);
  const { members, isLoading: membersLoading, refetch: refetchMembers } = useGroupMembers(selectedGroupId);

  // 投稿モーダルの開閉
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 位置情報
  const { center, position: currentPosition, error: geoError } = useGeolocation();

  // 記録データ
  const { records, postRecord, removeRecord } = useRecords(user?.id, selectedGroupId);

  // 現在のグループの記録
  const groupRecords = records;

  /**
   * 記録を保存する
   */
  const handleSubmit = useCallback(
    (rating: number, comment: string) => {
      if (!user) return;
      postRecord({
        groupId: selectedGroupId === "my-records" ? undefined : selectedGroupId,
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

  const handleUpdateName = (name: string) => {
    updateDisplayName(name);
    void updateUserMembershipProfile(user.id, name, user.image).then(() => {
      void refetchMembers();
    });
  };

  const handleUpdateImage = (imageUrl: string | null) => {
    // まずヘッダーの自分アイコンを即時更新
    updateImage(imageUrl);

    // 次に、全所属グループのメンバー情報へ画像URLを反映し、
    // 表示中のメンバー一覧を再取得する。
    void (async () => {
      const ok = await updateUserMembershipProfile(user.id, user.displayName, imageUrl);
      if (!ok) {
        toast.showToast("メンバー画像の更新に失敗しました", "error");
        return;
      }

      await refetchMembers();
      // Header内の「現在ユーザーは user.image を優先する」ロジックを確実に再評価させる
      setMemberProfileVersion((v) => v + 1);
      toast.showToast(imageUrl ? "画像を更新しました" : "画像をリセットしました", "success");
    })();
  };

  return (
    <div className="app-container">
      {/* ヘッダー */}
      <Header
        key={`header-${user.id}-${user.image ?? "none"}-${memberProfileVersion}`}
        groups={groups}
        selectedGroupId={selectedGroupId}
        onGroupChange={setSelectedGroupId}
        user={user}
        members={members}
        membersLoading={membersLoading}
        onUpdateName={handleUpdateName}
        onUpdateImage={handleUpdateImage}
        onCreateGroup={(name) => { void createGroup(name).then(() => refetchMembers()); }}
        onJoinGroup={(code) => {
          // joinGroup is async; handle result and notify user
          (async () => {
            const groupId = await joinGroup(code);
            if (!groupId) {
              toast.showToast("招待コードが見つかりませんでした", "error");
            } else {
              toast.showToast("グループに参加しました", "success");
              
              // グループ参加後、過去のマイ記録を共有するか確認
              await refetchMembers();
              if (user && window.confirm("これまでのマイ記録もこのグループに共有しますか？")) {
                const shared = await shareRecordsToGroup(user.id, groupId);
                if (shared) {
                  toast.showToast("マイ記録をグループに共有しました", "success");
                } else {
                  toast.showToast("マイ記録の共有に失敗しました", "error");
                }
              }
            }
          })();
        }}
        onLeaveGroup={(groupId) => {
          (async () => {
            const ok = await leaveGroup(groupId);
            if (ok) {
              setSelectedGroupId("my-records");
              await refetchMembers();
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
