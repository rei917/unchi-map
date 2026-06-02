"use client";
import { useEffect, useState } from "react";
import { Group } from "@/types";
import {
  createGroup as dbCreateGroup,
  joinGroupByInviteCode,
  getUserGroups,
  leaveGroup as dbLeaveGroup,
} from "@/lib/storage";

const personal: Group = {
  id: "my-records",
  name: "マイ記録",
  inviteCode: "",
  isPersonal: true,
};

export function useGroups(currentUserId?: string, displayName?: string, avatarUrl?: string | null) {
  const [groups, setGroups] = useState<Group[]>([personal]);

  useEffect(() => {
    if (!currentUserId) {
      setGroups([personal]);
      return;
    }

    getUserGroups(currentUserId)
      .then((g) => setGroups([personal, ...g]))
      .catch((e) => {
        console.error("ユーザーグループ取得に失敗しました:", e);
        setGroups([personal]);
      });
  }, [currentUserId]);

  const createGroup = async (name: string) => {
    if (!currentUserId) return;
    try {
      const g = await dbCreateGroup(name, currentUserId, displayName, avatarUrl);
      setGroups((prev) => [...prev, g]);
    } catch (e) {
      console.error("グループ作成に失敗しました:", e);
    }
  };

  /**
   * 招待コードでグループに参加し、グループIDを返す
   * グループ参加に成功すると、参加したグループのIDを返す
   */
  const joinGroup = async (inviteCode: string): Promise<string | null> => {
    if (!currentUserId) return null;
    try {
      const groupId = await joinGroupByInviteCode(inviteCode, currentUserId, displayName, avatarUrl);
      if (groupId) {
        const userGroups = await getUserGroups(currentUserId);
        setGroups([personal, ...userGroups]);
      }
      return groupId;
    } catch (e) {
      console.error("招待コード参加に失敗しました:", e);
      return null;
    }
  };

  const leaveGroup = async (groupId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    try {
      const ok = await dbLeaveGroup(currentUserId, groupId);
      if (ok) {
        const userGroups = await getUserGroups(currentUserId);
        setGroups([personal, ...userGroups]);
      }
      return ok;
    } catch (e) {
      console.error("グループ脱退に失敗しました:", e);
      return false;
    }
  };

  return { groups, createGroup, joinGroup, leaveGroup };
}
