import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDriveSyncStore } from "@/store/useDriveSyncStore";
import type { EnergyPipelineState } from "./use-energy-pipeline";
import type { CurvatureQuality } from "@/lib/curvature-brick";
import { fetchLapseBrick, type LapseBrickDecoded, type LapseBrickRequest } from "@/lib/lapse-brick";

export interface UseLapseBrickOptions {
  quality?: CurvatureQuality;
  dims?: [number, number, number];
  iterations?: number;
  tolerance?: number;
  refetchMs?: number;
  driveDir?: [number, number, number] | null;
  ampBaseScale?: number;
  dutyFloor?: number;
}

const pickPipelineNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const normalizeDriveDir = (value: unknown): [number, number, number] | undefined => {
  if (!Array.isArray(value) || value.length < 3) return undefined;
  const x = Number(value[0]);
  const y = Number(value[1]);
  const z = Number(value[2]);
  if (![x, y, z].every((entry) => Number.isFinite(entry))) return undefined;
  return [x, y, z];
};

export function useLapseBrick(options: UseLapseBrickOptions = {}) {
  const {
    quality = "low",
    dims,
    iterations,
    tolerance,
    refetchMs = 1500,
    driveDir,
    ampBaseScale = 1,
    dutyFloor = 0,
  } = options;
  const queryClient = useQueryClient();
  const pipeline = queryClient.getQueryData<EnergyPipelineState>(["/api/helix/pipeline"]);

  const sectorCount = pipeline?.sectorCount ?? pipeline?.sectorsTotal ?? 400;
  const dutyFR = pickPipelineNumber(pipeline?.dutyEffectiveFR ?? pipeline?.dutyCycle, 0.0025);
  const gammaGeo = pickPipelineNumber(pipeline?.gammaGeo, 26);
  const gammaVdB =
    pickPipelineNumber(
      pipeline?.gammaVanDenBroeck ??
      (pipeline as any)?.gammaVanDenBroeck_mass ??
      (pipeline as any)?.gammaVanDenBroeck_vis,
      1e11,
    );

  const phase01 = useDriveSyncStore((s) => s.phase01);
  const splitEnabled = useDriveSyncStore((s) => s.splitEnabled);
  const splitFrac = useDriveSyncStore((s) => s.splitFrac);
  const sigmaSectors = useDriveSyncStore((s) => s.sigmaSectors);
  const qSpoil = useDriveSyncStore((s) => s.q);
  const zeta = useDriveSyncStore((s) => s.zeta);
  const ampBase = useDriveSyncStore((s) => s.ampBase);

  const sigmaSector = useMemo(() => {
    const total = Math.max(1, Math.floor(sectorCount));
    return Math.max(1e-3, sigmaSectors / total);
  }, [sigmaSectors, sectorCount]);

  const driveDirResolved = useMemo(
    () => normalizeDriveDir(driveDir ?? pipeline?.driveDir),
    [driveDir, pipeline?.driveDir],
  );

  const request = useMemo<LapseBrickRequest>(() => {
    const ampScale = Number.isFinite(ampBaseScale) ? Math.max(0, ampBaseScale) : 1;
    const dutyFloorResolved = Number.isFinite(dutyFloor) ? Math.max(0, dutyFloor) : 0;
    return {
      quality,
      dims,
      phase01,
      sigmaSector,
      splitEnabled,
      splitFrac,
      dutyFR: Math.max(dutyFR, dutyFloorResolved, 1e-8),
      q: Math.max(qSpoil, 0),
      gammaGeo: Math.max(gammaGeo, 1e-3),
      gammaVdB: Math.max(gammaVdB, 1e-6),
      ampBase: Math.max(ampBase, 0) * ampScale,
      zeta,
      driveDir: driveDirResolved,
      iterations,
      tolerance,
    };
  }, [
    quality,
    dims,
    phase01,
    sigmaSector,
    splitEnabled,
    splitFrac,
    dutyFR,
    dutyFloor,
    qSpoil,
    gammaGeo,
    gammaVdB,
    ampBase,
    ampBaseScale,
    zeta,
    driveDirResolved,
    iterations,
    tolerance,
  ]);

  const queryKey = useMemo(() => ["helix:lapse-brick", request] as const, [request]);

  return useQuery<LapseBrickDecoded>({
    queryKey,
    queryFn: ({ signal }) => fetchLapseBrick(request, signal),
    enabled: Boolean(pipeline),
    refetchInterval: refetchMs,
    staleTime: refetchMs,
  });
}
