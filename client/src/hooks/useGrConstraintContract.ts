import { useQuery } from "@tanstack/react-query";
import type { GrConstraintContract } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type UseGrConstraintContractOptions = {
  enabled?: boolean;
  refetchInterval?: number | false;
};

let grConstraintContractUnavailable = false;

const isNotFoundError = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : String(err);
  if (!message) return false;
  return message.includes("404") || message.toLowerCase().includes("api_not_found");
};

async function fetchGrConstraintContract(): Promise<GrConstraintContract | null> {
  if (grConstraintContractUnavailable) return null;
  try {
    const response = await apiRequest("GET", "/api/helix/gr-constraint-contract");
    return (await response.json()) as GrConstraintContract;
  } catch (err) {
    if (isNotFoundError(err)) {
      grConstraintContractUnavailable = true;
      return null;
    }
    throw err;
  }
}

export function useGrConstraintContract(options?: UseGrConstraintContractOptions) {
  return useQuery({
    queryKey: ["helix:gr-constraint-contract"],
    queryFn: fetchGrConstraintContract,
    refetchInterval: grConstraintContractUnavailable
      ? false
      : options?.refetchInterval ?? 2000,
    enabled: options?.enabled ?? true,
  });
}

