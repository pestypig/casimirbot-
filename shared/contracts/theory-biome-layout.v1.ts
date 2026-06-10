export const THEORY_BIOME_LAYOUT_SCHEMA_VERSION = "theory_biome_layout/v1" as const;

export const THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1 = {
  badgeSizePx: 44,
  minBadgeGapXPx: 72,
  minBadgeGapYPx: 56,
  labelReserveTopPx: 44,
  chunkLabelReservePx: 32,
  scaleBandWidthPx: 440,
  chunkSizePx: 768,
  badgesPerChunkTarget: 6,
} as const;

export type TheoryBiomeBand =
  | "planck_quantum"
  | "nuclear"
  | "atomic"
  | "molecular"
  | "cellular_biophysical"
  | "device_laboratory"
  | "human_engineering"
  | "planetary"
  | "stellar"
  | "galactic_cosmic"
  | "abstract_formal"
  | "claim_boundary";

export type TheoryBiomeFidelity =
  | "canonical"
  | "derived"
  | "model"
  | "simulation_proxy"
  | "runtime_artifact"
  | "diagnostic_gate"
  | "claim_boundary";

export type TheoryBiomeCoordinateV1 = {
  badgeId: string;
  scaleLog10M: number | null;
  scaleBand: TheoryBiomeBand;
  fidelity: TheoryBiomeFidelity;
  domainKey: string;
  temperature: number;
  moisture: number;
  altitude: number;
  claimPressure: number;
  x: number;
  y: number;
  chunkX: number;
  chunkY: number;
  renderChunkId: string;
  semanticChunkId: string;
  lod: number;
  reasons: string[];
};

export type TheoryBiomeChunkV1 = {
  id: string;
  chunkX: number;
  chunkY: number;
  lod: number;
  bounds: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  badgeIds: string[];
  dominantScaleBand: TheoryBiomeBand;
  dominantDomainKey: string;
  averageClaimPressure: number;
  averageFidelity: number;
  capacityBadgeCount: number;
  densityRatio: number;
  semanticChunkIds: string[];
};

export type TheoryBiomeLayoutV1 = {
  schemaVersion: typeof THEORY_BIOME_LAYOUT_SCHEMA_VERSION;
  graphId: string;
  seed: string;
  width: number;
  height: number;
  coordinates: TheoryBiomeCoordinateV1[];
  chunks: TheoryBiomeChunkV1[];
};
