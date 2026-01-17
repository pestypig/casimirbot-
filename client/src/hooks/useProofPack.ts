import { useQuery } from "@tanstack/react-query";
import { fetchProofPack } from "@/lib/proof-pack";
import type { ProofPack } from "@shared/schema";

export type UseProofPackOptions = {
  refetchInterval?: number;
  staleTime?: number;
  enabled?: boolean;
};

export function useProofPack(options: UseProofPackOptions = {}) {
  return useQuery<ProofPack>({
    queryKey: ["/api/helix/pipeline/proofs"],
    queryFn: ({ signal }) => fetchProofPack(signal),
    refetchInterval: options.refetchInterval ?? 5_000,
    staleTime: options.staleTime ?? 10_000,
    enabled: options.enabled ?? true,
  });
}
