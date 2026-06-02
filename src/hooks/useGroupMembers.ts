"use client";

import { useCallback, useEffect, useState } from "react";
import { GroupMember } from "@/types";
import { getGroupMembers } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

export function useGroupMembers(groupId?: string) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!groupId || groupId === "my-records") {
      setMembers([]);
      return;
    }

    setIsLoading(true);
    try {
      const loaded = await getGroupMembers(groupId);
      setMembers(loaded);
    } catch (error) {
      console.error("グループメンバー読み込みに失敗しました:", error);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!groupId || groupId === "my-records") return;

    const channel = supabase
      .channel(`group-members:${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` },
        async () => {
          await fetchMembers();
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [groupId, fetchMembers]);

  return { members, isLoading, refetch: fetchMembers };
}
