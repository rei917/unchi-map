
"use client";
import { useEffect, useState } from "react";
import { Group } from "@/types";
import { generateInviteCode } from "@/lib/invite";
import { GROUPS as AVAILABLE_GROUPS } from "@/data/mockData";

const KEY="unchi-map-groups";

const personal: Group = {
 id:"my-records",
 name:"マイ記録",
 inviteCode:"",
 isPersonal:true
};

export function useGroups(){
 const [groups,setGroups]=useState<Group[]>([]);

 useEffect(()=>{
   const raw=localStorage.getItem(KEY);
   if(raw){
     setGroups(JSON.parse(raw));
   }else{
     localStorage.setItem(KEY,JSON.stringify([personal]));
     setGroups([personal]);
   }
 },[]);

 const persist=(g:Group[])=>{
   setGroups(g);
   localStorage.setItem(KEY,JSON.stringify(g));
 };

 const createGroup=(name:string)=>{
   const g:Group={
     id:crypto.randomUUID(),
     name,
     inviteCode:generateInviteCode()
   };
   persist([...groups,g]);
 };

  /** 招待コードで既存の公開グループに参加する */
  const joinGroup = (inviteCode: string): boolean => {
    const code = inviteCode.trim();
    if(!code) return false;
    // 既に参加済みなら何もしない
    if(groups.some((g)=>g.inviteCode === code)) return true;
    // モックの公開グループ一覧から探す
    const found = AVAILABLE_GROUPS.find((g)=>g.inviteCode.toUpperCase() === code.toUpperCase());
    if(!found) return false;
    persist([...groups, found]);
    return true;
  };

 return {groups,createGroup,joinGroup};
}
