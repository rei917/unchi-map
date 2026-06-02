// ============================================================
// components/ui/Header.tsx
// アプリ上部のヘッダーコンポーネント
// グループ切替・招待コード表示・ユーザーメニュー・メンバー表示
// ============================================================

"use client";

import { useState } from "react";
import { Group, GroupMember } from "@/types";
import { CurrentUser } from "@/hooks/useCurrentUser";
import UserMenu from "./UserMenu";

type Props = {
  groups: Group[];
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  user: CurrentUser | null;
  members?: GroupMember[];
  membersLoading?: boolean;
  onUpdateName: (name: string) => void;
  onUpdateImage: (imageUrl: string | null) => void;
  onCreateGroup: (name: string)=>void;
  onJoinGroup: (code: string)=>void;
  onLeaveGroup?: (groupId: string)=>void;
};

function getMemberInitial(name: string) {
  return (name || "?").trim().charAt(0) || "?";
}

function getMemberDisplayName(member: GroupMember, currentUser: CurrentUser | null) {
  if (currentUser && member.userId === currentUser.id) {
    return currentUser.displayName;
  }

  const name = (member.displayName || "").trim();
  if (!name || name === member.userId) return "名無しさん";
  return name;
}

function getMemberAvatarUrl(member: GroupMember, currentUser: CurrentUser | null) {
  if (currentUser && member.userId === currentUser.id) {
    return currentUser.image ?? member.avatarUrl ?? null;
  }
  return member.avatarUrl ?? null;
}

export default function Header({
  groups,
  selectedGroupId,
  onGroupChange,
  user,
  members = [],
  membersLoading = false,
  onUpdateName,
  onUpdateImage,
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
}: Props) {
  const [membersOpen, setMembersOpen] = useState(false);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const canShowMembers = selectedGroupId !== "my-records" && !selectedGroup?.isPersonal;

  return (
    <header className="header">
      <div className="header-top">
        <h1 className="header-title">🚽 うんちマップ <span className="beta-badge">β</span></h1>
        {user && <UserMenu user={user} onUpdateName={onUpdateName} onUpdateImage={onUpdateImage} />}
      </div>
      <div className="header-controls">
        <div className="control-group">
          <label className="control-label">グループ</label>
          <select
            className="group-select"
            value={selectedGroupId}
            onChange={(e) => {
              setMembersOpen(false);
              onGroupChange(e.target.value);
            }}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">招待コード</label>
          <span className="invite-code">{selectedGroup?.inviteCode ?? "—"}</span>
        </div>
        <button onClick={() => {
          const n = prompt("グループ名");
          if(n) onCreateGroup(n);
        }}>
          ＋グループ作成
        </button>
        <button onClick={() => {
          const code = prompt("招待コードを入力してください");
          if(code) onJoinGroup(code);
        }}>
          招待コードで参加
        </button>
        {canShowMembers && (
          <div className="members-menu">
            <button onClick={() => setMembersOpen((v) => !v)}>
              👥 メンバー{members.length > 0 ? ` (${members.length})` : ""}
            </button>
            {membersOpen && (
              <div className="members-dropdown">
                <div className="members-dropdown-title">{selectedGroup?.name ?? "グループ"} のメンバー</div>
                {membersLoading ? (
                  <div className="members-empty">読み込み中...</div>
                ) : members.length === 0 ? (
                  <div className="members-empty">メンバーがいません</div>
                ) : (
                  <ul className="members-list">
                    {members.map((member) => {
                      const memberName = getMemberDisplayName(member, user);
                      const memberAvatarUrl = getMemberAvatarUrl(member, user);

                      return (
                        <li key={`${member.groupId}:${member.userId}`} className="member-item">
                          {memberAvatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={memberAvatarUrl} alt="" className="member-avatar" />
                          ) : (
                            <span className="member-avatar-fallback">{getMemberInitial(memberName)}</span>
                          )}
                          <span className="member-name" title={memberName}>{memberName}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
        {selectedGroupId !== "my-records" && !selectedGroup?.isPersonal && onLeaveGroup && (
          <button onClick={() => {
            const ok = confirm("このグループから抜けますか？\n\nマイ記録は残ります。");
            if (!ok) return;
            setMembersOpen(false);
            onLeaveGroup(selectedGroupId);
          }}>
            グループから抜ける
          </button>
        )}
      </div>
    </header>
  );
}
