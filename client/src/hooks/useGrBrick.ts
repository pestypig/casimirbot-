import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CurvatureQuality } from "@/lib/curvature-brick";
import {
  fetchGrEvolveBrick,
  type GrEvolveBrickDecoded,
  type GrEvolveBrickRequest,
} from "@/lib/gr-evolve-brick";
import type { EnergyPipelineState } from "./use-energy-pipeline";

export interface UseGrBrickOptions {
  quality?: CurvatureQuality;
  dims?: [number, number, number];
  time_s?: number;
  dt_s?: number;
  steps?: number;
  iterations?: number;
  tolerance?: number;
  lapseKappa?: number;
  shiftEta?: number;
  shiftGamma?: number;
  advect?: boolean;
  order?: 2 | 4;
  boundary?: "clamp" | "periodic";
  includeExtra?: boolean;
  includeMatter?: boolean;
  includeKij?: boolean;
  refetchMs?: number;
  enabled?: boolean;
}

export function useGrBrick(options: UseGrBrickOptions = {}) {
  const {
    quality = "low",
    dims,
    time_s,
    dt_s,
    steps,
    iterations,
    tolerance,
    lapseKappa,
    shiftEta,
    shiftGamma,
    advect,
    order,
    boundary,
    includeExtra,
    includeMatter,
    includeKij,
    refetchMs = 2000,
    enabled,
  } = options;
  const queryClient = useQueryClient();
  const pipeline = queryClient.getQueryData<EnergyPipelineState>(["/api/helix/pipeline"]);

  const request = useMemo<GrEvolveBrickRequest>(
    () => ({
      quality,
      dims,
      time_s,
      dt_s,
      steps,
      iterations,
      tolerance,
      lapseKappa,
      shiftEta,
      shiftGamma,
      advect,
      order,
      boundary,
      includeExtra,
      includeMatter,
      includeKij,
    }),
    [
      quality,
      dims,
      time_s,
      dt_s,
      steps,
      iterations,
      tolerance,
      lapseKappa,
      shiftEta,
      shiftGamma,
      advect,
      order,
      boundary,
      includeExtra,
      includeMatter,
      includeKij,
    ],
  );

  const queryKey = useMemo(() => ["helix:gr-evolve-brick", request] as const, [request]);
  const enabledResolved = (enabled ?? true) && pipeline?.grEnabled !== false;
  const refetchInterval =
    Number.isFinite(refetchMs) && (refetchMs as number) > 0 ? refetchMs : false;
  const staleTime =
    Number.isFinite(refetchMs) && (refetchMs as number) > 0 ? refetchMs : 0;

  return useQuery<GrEvolveBrickDecoded>({
    queryKey,
    queryFn: ({ signal }) => fetchGrEvolveBrick(request, signal),
    enabled: enabledResolved,
    refetchInterval,
    staleTime,
  });
}
