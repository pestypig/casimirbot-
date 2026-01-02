import { apiRequest } from "@/lib/queryClient";
import type { CurvatureQuality } from "@/lib/curvature-brick";
import type { GrRegionStats } from "@shared/schema";

export interface GrRegionStatsRequest {
  quality?: CurvatureQuality;
  dims?: [number, number, number];
  source?: "auto" | "gr" | "stress";
  targetRegions?: number;
  thetaBins?: number;
  longBins?: number;
  phaseBins?: number;
  radialBins?: number;
  longAxis?: "x" | "y" | "z";
  phase01?: number;
  strobeHz?: number;
  sectorPeriod_s?: number;
  topN?: number;
  maxVoxels?: number;
  requireCertified?: boolean;
}

const buildQuery = (request: GrRegionStatsRequest) => {
  const params = new URLSearchParams();
  if (request.quality) params.set("quality", request.quality);
  if (request.dims) params.set("dims", request.dims.join("x"));
  if (request.source) params.set("source", request.source);
  if (Number.isFinite(request.targetRegions ?? NaN)) {
    params.set("targetRegions", String(Math.max(1, Math.floor(request.targetRegions as number))));
  }
  if (Number.isFinite(request.thetaBins ?? NaN)) {
    params.set("thetaBins", String(Math.max(1, Math.floor(request.thetaBins as number))));
  }
  if (Number.isFinite(request.longBins ?? NaN)) {
    params.set("longBins", String(Math.max(1, Math.floor(request.longBins as number))));
  }
  if (Number.isFinite(request.phaseBins ?? NaN)) {
    params.set("phaseBins", String(Math.max(1, Math.floor(request.phaseBins as number))));
  }
  if (Number.isFinite(request.radialBins ?? NaN)) {
    params.set("radialBins", String(Math.max(1, Math.floor(request.radialBins as number))));
  }
  if (request.longAxis) params.set("longAxis", request.longAxis);
  if (Number.isFinite(request.phase01 ?? NaN)) params.set("phase01", String(request.phase01));
  if (Number.isFinite(request.strobeHz ?? NaN)) params.set("strobeHz", String(request.strobeHz));
  if (Number.isFinite(request.sectorPeriod_s ?? NaN)) {
    params.set("sectorPeriod_s", String(request.sectorPeriod_s));
  }
  if (Number.isFinite(request.topN ?? NaN)) {
    params.set("topN", String(Math.max(1, Math.floor(request.topN as number))));
  }
  if (Number.isFinite(request.maxVoxels ?? NaN)) {
    params.set("maxVoxels", String(Math.max(1, Math.floor(request.maxVoxels as number))));
  }
  if (typeof request.requireCertified === "boolean") {
    params.set("requireCertified", request.requireCertified ? "1" : "0");
  }
  return params.toString();
};

export async function fetchGrRegionStats(
  request: GrRegionStatsRequest,
  signal?: AbortSignal,
): Promise<GrRegionStats> {
  const query = buildQuery(request);
  const res = await apiRequest("GET", `/api/helix/gr-region-stats?${query}`, undefined, signal);
  const json = await res.json();
  if (!json || json.kind !== "gr-region-stats") {
    throw new Error("Invalid gr-region-stats payload");
  }
  return json as GrRegionStats;
}
