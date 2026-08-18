import type { ApiEnvelope } from "@socialverse/shared";
import { useQuery } from "@tanstack/react-query";
import { Search, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import type { WorldBuilding } from "./types";
import { useWorldStore } from "./worldStore";

interface SearchResult { id: string; username: string; displayName: string; avatarUrl: string | null; district: string; followerCount: number | null; buildingId: string }
export function WorldSearch({ buildings }: { buildings: WorldBuilding[] }) {
  const [input,setInput]=useState("");const [query,setQuery]=useState("");const teleportTo=useWorldStore((s)=>s.teleportTo);const select=useWorldStore((s)=>s.select);
  useEffect(()=>{const timer=setTimeout(()=>setQuery(input.trim()),300);return()=>clearTimeout(timer);},[input]);
  const results=useQuery({queryKey:["search",query],enabled:query.length>=2,queryFn:async()=> (await apiClient.get<ApiEnvelope<SearchResult[]>>("/users/search",{params:{q:query,limit:8}})).data.data});
  function locate(result:SearchResult){const building=buildings.find((item)=>item.id===result.buildingId);if(building){select(building);teleportTo(building.x,building.z);}setInput("");}
  return <div className="world-search"><Search size={16}/><input aria-label="Search SocialVerse users" placeholder="Search citizens…" value={input} onChange={(e)=>setInput(e.target.value)}/>{query.length>=2&&<div className="search-results">{results.isLoading&&<span>Searching the city…</span>}{results.data?.map((result)=><button key={result.id} onClick={()=>locate(result)}><span><strong>{result.displayName}</strong><small>@{result.username} · {result.district}</small></span><Zap size={14}/></button>)}{results.data?.length===0&&<span>No citizens found.</span>}</div>}</div>;
}
