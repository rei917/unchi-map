// ============================================================
// components/ui/Header.tsx
// アプリ上部のヘッダーコンポーネント
// グループ切替・招待コード表示・ユーザーメニュー
// ============================================================

"use client";

import { Group } from "@/types";
import { CurrentUser } from "@/hooks/useCurrentUser";
import UserMenu from "./UserMenu";

type Props = {
  groups: Group[];
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  user: CurrentUser | null;
  onUpdateName: (name: string) => void;
  onCreateGroup: (name: string)=>void;
  onJoinGroup: (code: string)=>void;
  onLeaveGroup?: (groupId: string)=>void;
};

export default function Header({ groups, selectedGroupId, onGroupChange, user, onUpdateName, onCreateGroup, onJoinGroup, onLeaveGroup }: Props) {
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <header className="header">
      <div className="header-top">
        <h1 className="header-title">🚽 うんちマップ <span className="beta-badge">β</span></h1>
        {user && <UserMenu user={user} onUpdateName={onUpdateName} />}
      </div>
      <div className="header-controls">
        <div className="control-group">
          <label className="control-label">グループ</label>
          <select
            className="group-select"
            value={selectedGroupId}
            onChange={(e) => onGroupChange(e.target.value)}
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
        {selectedGroupId !== "my-records" && !selectedGroup?.isPersonal && onLeaveGroup && (
          <button onClick={() => {
            const ok = confirm("このグループから抜けますか？\n\nマイ記録は残ります。");
            if (!ok) return;
            onLeaveGroup(selectedGroupId);
          }}>
            グループから抜ける
          </button>
        )}
      </div>
    </header>
  );
}
