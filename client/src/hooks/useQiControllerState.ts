import { useQuery } from "@tanstack/react-query";
import type { QiControllerState } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type UseQiControllerStateOptions = {
  enabled?: boolean;
  refetchInterval?: number | false;
};

async function fetchQiControllerState(): Promise<QiControllerState> {
  const response = await apiRequest("GET", "/api/qi/controller-state");
  return (await response.json()) as QiControllerState;
}

export function useQiControllerState(options?: UseQiControllerStateOptions) {
  return useQuery({
    queryKey: ["qi-controller-state"],
    queryFn: fetchQiControllerState,
    refetchInterval: options?.refetchInterval ?? 1500,
    enabled: options?.enabled ?? true,
  });
}
