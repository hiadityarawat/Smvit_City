import type { ApiEnvelope } from "@socialverse/shared";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { demoBuildings } from "./demoWorld";
import type { WorldBuilding } from "./types";
import { useWorldStore } from "./worldStore";

export function useWorldBuildings() {
  const chunkX=useWorldStore((state)=>Math.floor(state.player.x/128));const chunkZ=useWorldStore((state)=>Math.floor(state.player.z/128));
  const query = useQuery({ queryKey: ["world-buildings", chunkX, chunkZ], queryFn: async () => (await apiClient.get<ApiEnvelope<WorldBuilding[]>>("/world/buildings", { params: { x: chunkX*128+64, z: chunkZ*128+64, radius: 300, limit: 500 } })).data.data, staleTime: 20_000, placeholderData:(previous)=>previous });
  return { ...query, buildings: query.data?.length ? query.data : demoBuildings, demoMode: query.isError || query.data?.length === 0 };
}
