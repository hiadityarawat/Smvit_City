import type { ApiEnvelope, HealthStatus } from "@socialverse/shared";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await apiClient.get<ApiEnvelope<HealthStatus>>("/health");
      return response.data.data;
    },
    refetchInterval: 30_000,
  });
}
