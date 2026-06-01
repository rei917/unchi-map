
"use client";
import { useEffect, useState } from "react";
import { Group } from "@/types";
import { createGroup as dbCreateGroup, joinGroupByInviteCode, getUserGroups } from "@/lib/storage";

const personal: Group = {
  id: "my-records",
  name: "マイ記録",
  inviteCode: "",
  isPersonal: true,
};

export function useGroups(currentUserId?: string) {
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
      const g = await dbCreateGroup(name, currentUserId);
      setGroups((prev) => [...prev, g]);
    } catch (e) {
      console.error("グループ作成に失敗しました:", e);
    }
  };

  const joinGroup = async (inviteCode: string): Promise<boolean> => {
    if (!currentUserId) return false;
    try {
      const ok = await joinGroupByInviteCode(inviteCode, currentUserId);
      if (ok) {
        const userGroups = await getUserGroups(currentUserId);
        setGroups([personal, ...userGroups]);
      }
      return ok;
    } catch (e) {
      console.error("招待コード参加に失敗しました:", e);
      return false;
    }
  };

  return { groups, createGroup, joinGroup };
}
