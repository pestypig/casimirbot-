import { z } from "zod";
import {
  agiDatasetExportSchema,
  agiGateReportSchema,
  agiRefinerySummarySchema,
  agiTrajectorySchema,
} from "./agi-refinery";
import { InformationBoundary } from "./information-boundary";

export const sweepGeometrySchema = z.enum(["parallel_plate", "cpw"]);
export type SweepGeometry = z.infer<typeof sweepGeometrySchema>;

export type Radians = number;
export type Degrees = number;

export const gateKindSchema = z.enum(["AND", "OR", "NOT", "MUX", "DEMUX"]);
export type GateKind = z.infer<typeof gateKindSchema>;

export const gateRouteRoleSchema = z.enum(["BUS", "SINK"]);
export type GateRouteRole = z.infer<typeof gateRouteRoleSchema>;

export const samplingKindSchema = z.enum(["gaussian", "lorentzian", "compact"]);
export type SamplingKind = z.infer<typeof samplingKindSchema>;

export const qiFieldTypeSchema = z.enum(["scalar", "em", "dirac"]);
export type QiFieldType = z.infer<typeof qiFieldTypeSchema>;

// --- Hull geometry ----------------------------------------------------------

export const hullSchema = z.object({
  Lx_m: z.number().positive(),
  Ly_m: z.number().positive(),
  Lz_m: z.number().positive(),
  wallThickness_m: z.number().positive().optional(),
});
export type HullSchema = z.infer<typeof hullSchema>;

export const hullAreaOverrideSchema = z.object({
  hullAreaOverride_m2: z.number().positive().optional(),
  hullAreaOverride_uncertainty_m2: z.number().nonnegative().optional(),
});

// Optional per-sector surface area map (m^2 per sector)
export const hullAreaPerSectorSchema = z
  .array(z.number().nonnegative())
  .min(1)
  .max(10_000)
  .optional();

const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

export const axisLabelSchema = z.enum(["x", "y", "z"]);
export type AxisLabel = z.infer<typeof axisLabelSchema>;

export const basisTransformSchema = z.object({
  swap: z
    .object({
      x: axisLabelSchema.optional(),
      y: axisLabelSchema.optional(),
      z: axisLabelSchema.optional(),
    })
    .optional(),
  flip: z
    .object({
      x: z.boolean().optional(),
      y: z.boolean().optional(),
      z: z.boolean().optional(),
    })
    .optional(),
  scale: vec3Schema.optional(),
});
export type BasisTransform = z.infer<typeof basisTransformSchema>;

export const hullBasisResolvedSchema = z.object({
  swap: z.object({
    x: axisLabelSchema,
    y: axisLabelSchema,
    z: axisLabelSchema,
  }),
  flip: z.object({
    x: z.boolean(),
    y: z.boolean(),
    z: z.boolean(),
  }),
  scale: vec3Schema,
  forward: vec3Schema,
  up: vec3Schema,
  right: vec3Schema,
});
export type HullBasisResolved = z.infer<typeof hullBasisResolvedSchema>;

export const hullPreviewObbSchema = z.object({
  center: vec3Schema,
  halfSize: vec3Schema,
  axes: z.tuple([vec3Schema, vec3Schema, vec3Schema]).optional(),
});
export type HullPreviewOBB = z.infer<typeof hullPreviewObbSchema>;

export const hullPreviewIndexedGeometrySchema = z.object({
  positions: z.array(z.number()).optional(),
  indices: z.array(z.number().int().nonnegative()).optional(),
  normals: z.array(z.number()).optional(),
  tangents: z.array(z.number()).optional(),
  bounds: z
    .object({
      min: vec3Schema,
      max: vec3Schema,
    })
    .optional(),
  boundingBox: z
    .object({
      min: vec3Schema,
      max: vec3Schema,
    })
    .optional(),
  vertexCount: z.number().int().nonnegative().optional(),
  triangleCount: z.number().int().nonnegative().optional(),
  byteLength: z.number().int().nonnegative().optional(),
});
export type HullPreviewIndexedGeometry = z.infer<typeof hullPreviewIndexedGeometrySchema>;

export const hullPreviewLodSchema = z.object({
  tag: z.enum(["coarse", "full"]).optional(),
  glbUrl: z.string().optional(),
  meshHash: z.string().optional(),
  triangleCount: z.number().int().nonnegative().optional(),
  vertexCount: z.number().int().nonnegative().optional(),
  byteLength: z.number().int().nonnegative().optional(),
  indexedGeometry: hullPreviewIndexedGeometrySchema.optional(),
  decimation: z
    .object({
      targetTris: z.number().int().positive().optional(),
      targetRatio: z.number().positive().max(1).optional(),
      achievedTris: z.number().int().positive().optional(),
      errorMetric: z.number().nonnegative().optional(),
      method: z.string().optional(),
    })
    .optional(),
  fitBounds: z
    .object({
      min: vec3Schema,
      max: vec3Schema,
    })
    .optional(),
});
export type HullPreviewLOD = z.infer<typeof hullPreviewLodSchema>;

export const hullPreviewMeshArtifactSchema = z.object({
  glbUrl: z.string().optional(),
  meshHash: z.string().optional(),
  basis: basisTransformSchema.optional(),
  obb: hullPreviewObbSchema.optional(),
  lods: z.array(hullPreviewLodSchema).optional(),
  coarseLod: hullPreviewLodSchema.optional(),
  fullLod: hullPreviewLodSchema.optional(),
  provenance: z.enum(["preview", "pipeline"]).optional(),
  clampReasons: z.array(z.string()).optional(),
});
export type HullPreviewMeshArtifact = z.infer<typeof hullPreviewMeshArtifactSchema>;

export const hullPreviewMetricsSchema = z.object({
  dims_m: z.object({
    Lx_m: z.number().positive(),
    Ly_m: z.number().positive(),
    Lz_m: z.number().positive(),
  }),
  area_m2: z.number().positive(),
  areaUnc_m2: z.number().nonnegative().optional(),
  method: z.string().optional(),
  triangleCount: z.number().int().nonnegative().optional(),
  vertexCount: z.number().int().nonnegative().optional(),
});
export type HullPreviewMetrics = z.infer<typeof hullPreviewMetricsSchema>;

const hullPreviewPayloadVersionSchema = z.enum(["v1"]);
export type HullPreviewPayloadVersion = z.infer<typeof hullPreviewPayloadVersionSchema>;

const hullPreviewPayloadBaseSchema = z.object({
  glbUrl: z.string().optional(),
  meshHash: z.string().optional(),
  mesh: hullPreviewMeshArtifactSchema.optional(),
  basis: basisTransformSchema.optional(),
  obb: hullPreviewObbSchema.optional(),
  scale: vec3Schema.optional(),
  targetDims: z
    .object({
      Lx_m: z.number().positive(),
      Ly_m: z.number().positive(),
      Lz_m: z.number().positive(),
    })
    .optional(),
  hullMetrics: hullPreviewMetricsSchema.nullable().optional(),
  area_m2: z.number().nonnegative().optional(),
  areaUnc_m2: z.number().nonnegative().optional(),
  updatedAt: z.number().nonnegative().optional(),
  provenance: z.enum(["preview", "pipeline"]).optional(),
  clampReasons: z.array(z.string()).optional(),
  lodCoarse: hullPreviewLodSchema.optional(),
  lodFull: hullPreviewLodSchema.optional(),
  lods: z.array(hullPreviewLodSchema).optional(),
});

export const warpGeometryKindSchema = z.enum(["ellipsoid", "radial", "sdf"]);
export type WarpGeometryKind = z.infer<typeof warpGeometryKindSchema>;
export const warpFallbackModeSchema = z.enum(["allow", "warn", "block"]);
export type WarpFallbackMode = z.infer<typeof warpFallbackModeSchema>;
export const warpGeometryFallbackSchema = z.object({
  mode: warpFallbackModeSchema,
  applied: z.boolean(),
  reasons: z.array(z.string()).default([]),
  requestedKind: warpGeometryKindSchema.nullable().optional(),
  resolvedKind: warpGeometryKindSchema.optional(),
  blocked: z.boolean().optional(),
});
export type WarpGeometryFallback = z.infer<typeof warpGeometryFallbackSchema>;

export const warpRadialSampleSchema = z.object({
  theta: z.number().optional(),
  phi: z.number().optional(),
  r: z.number(),
  n: vec3Schema.optional(),
  dA: z.number().positive().optional(),
});
export type WarpRadialSample = z.infer<typeof warpRadialSampleSchema>;

export const warpSurfaceSampleSchema = z.object({
  p: vec3Schema,
  n: vec3Schema.optional(),
  dA: z.number().positive().optional(),
  signedDistance_m: z.number().optional(),
});
export type WarpSurfaceSample = z.infer<typeof warpSurfaceSampleSchema>;

export const warpGeometrySchema = z.object({
  kind: warpGeometryKindSchema.default("ellipsoid"),
  assetId: z.string().optional(),
  resolution: z.number().int().positive().max(256).optional(),
  wallThickness_m: z.number().positive().optional(),
  driveDirection: vec3Schema.optional(),
  radial: z
    .object({
      samples: z.array(warpRadialSampleSchema).optional(),
      nTheta: z.number().int().positive().max(1024).optional(),
      nPhi: z.number().int().positive().max(1024).optional(),
    })
    .optional(),
  sdf: z
    .object({
      samples: z.array(warpSurfaceSampleSchema).optional(),
      dims: z
        .tuple([
          z.number().int().positive(),
          z.number().int().positive(),
          z.number().int().positive(),
        ])
        .optional(),
      bounds_m: vec3Schema.optional(),
      band_m: z.number().positive().optional(),
      format: z.enum(["float", "byte"]).optional(),
    })
    .optional(),
});
export type WarpGeometry = z.infer<typeof warpGeometrySchema>;

export const warpFieldTypeSchema = z.enum(["natario", "natario_sdf", "alcubierre", "irrotational"]);
export type WarpFieldType = z.infer<typeof warpFieldTypeSchema>;

export type TimeDilationRenderMode = "alcubierre" | "natario";
export type TimeDilationDataSource = "gr-brick" | "lapse-brick" | "analytic-proxy" | "none";
export type TimeDilationBannerState =
  | "CERTIFIED"
  | "FALLBACK"
  | "PROXY"
  | "NO_HULL"
  | "WAITING_GR"
  | "UNSTABLE";
export type TimeDilationNormalizationMode = "percentile" | "range" | "proxy" | "off" | "missing";
export type TimeDilationNormalization = {
  mode: TimeDilationNormalizationMode;
  scale: number;
  percentile?: number | null;
  baseScale?: number | null;
};
export type TimeDilationRenderPlan = {
  mode: TimeDilationRenderMode;
  flags: {
    hasHull: boolean;
    hasGrBrick: boolean;
    grCertified: boolean;
    anyProxy: boolean;
    mathStageOK: boolean;
    solverStatus?: "CERTIFIED" | "UNSTABLE" | "NOT_CERTIFIED";
    exploratoryOverride?: boolean;
    cinematicOverride?: boolean;
    natarioGeometryWarp?: boolean;
    wallDetected?: boolean;
    wallSource?: "kretschmann" | "ricci4";
  };
  sourceForAlpha: TimeDilationDataSource;
  sourceForBeta: TimeDilationDataSource;
  sourceForTheta: TimeDilationDataSource;
  sourceForClockRate: TimeDilationDataSource;
  enableGeometryWarp: boolean;
  geomWarpScale: number;
  betaWarpWeight: number;
  thetaWarpWeight: number;
  shearWeight: number;
  metricBlend: number;
  warpCap: number;
  normalization: {
    beta: TimeDilationNormalization;
    theta: TimeDilationNormalization;
    gamma: TimeDilationNormalization;
    shear: TimeDilationNormalization;
  };
  banner: TimeDilationBannerState;
  reasons: string[];
};

const cardGateSourceSchema = z.enum(["schedule", "blanket", "combined"]);
const cardVolumeVizSchema = z.enum([
  "theta_drive",
  "theta_gr",
  "rho_gr",
  "shear_gr",
  "vorticity_gr",
  "alpha",
]);
const cardVolumeDomainSchema = z.enum(["wallBand", "bubbleBox"]);
const cardVolumeSourceSchema = z.enum(["analytic", "lattice", "brick"]);
export type CardVolumeSource = z.infer<typeof cardVolumeSourceSchema>;
export const cardCameraPresetSchema = z.enum([
  "threeQuarterFront",
  "broadside",
  "topDown",
  "inside",
  "outside",
  "wallGrazing",
]);
export type CardCameraPreset = z.infer<typeof cardCameraPresetSchema>;
const cardCameraSchema = z
  .object({
    eye: vec3Schema.optional(),
    target: vec3Schema.optional(),
    up: vec3Schema.optional(),
    fov_deg: z.number().positive().max(180).optional(),
    radius_m: z.number().nonnegative().optional(),
    yaw_deg: z.number().optional(),
    pitch_deg: z.number().optional(),
    preset: cardCameraPresetSchema.optional(),
  })
  .optional();

const cardMeshBudgetSchema = z.object({
  maxPreviewTriangles: z.number().int().positive().optional(),
  maxHighTriangles: z.number().int().positive().optional(),
  maxEdges: z.number().int().positive().optional(),
});
export type CardMeshBudget = z.infer<typeof cardMeshBudgetSchema>;

export const cardMeshMetadataSchema = z.object({
  meshHash: z.string().optional(),
  provenance: z.enum(["preview", "pipeline"]).optional(),
  geometrySource: z.enum(["preview", "pipeline", "fallback", "geometric"]).optional(),
  lod: z.enum(["preview", "high"]).optional(),
  lodTag: hullPreviewLodSchema.shape.tag.optional(),
  triangleCount: z.number().int().nonnegative().optional(),
  vertexCount: z.number().int().nonnegative().optional(),
  decimation: hullPreviewLodSchema.shape.decimation.optional(),
  budgets: cardMeshBudgetSchema.optional(),
  basis: basisTransformSchema.optional(),
  basisTags: basisTransformSchema.optional(),
  basisResolved: hullBasisResolvedSchema.optional(),
  clampReasons: z.array(z.string()).optional(),
  wireframeEnabled: z.boolean().optional(),
  updatedAt: z.number().nonnegative().optional(),
});
export type CardMeshMetadata = z.infer<typeof cardMeshMetadataSchema>;

export const CARD_RECIPE_SCHEMA_VERSION = 1 as const;

// --- Card lattice persistence ----------------------------------------------

const latticeDimsSchema = z.tuple([
  z.number().int().positive(),
  z.number().int().positive(),
  z.number().int().positive(),
]);

const mat4Schema = z.array(z.number()).length(16);

const cardLatticePresetSchema = z.enum(["low", "medium", "high", "card"]);
const cardLatticeProfileTagSchema = z.enum(["preview", "card"]);
const cardLatticeBoundsProfileSchema = z.enum(["tight", "wide"]);

export const cardLatticeFrameSchema = z.object({
  preset: cardLatticePresetSchema.optional(),
  profileTag: cardLatticeProfileTagSchema.optional(),
  boundsProfile: cardLatticeBoundsProfileSchema.optional(),
  dims: latticeDimsSchema,
  voxelSize_m: z.number().positive(),
  latticeMin: vec3Schema,
  latticeSize: vec3Schema,
  worldToLattice: mat4Schema,
  latticeToWorld: mat4Schema.optional(),
  clampReasons: z.array(z.string()).optional(),
});
export type CardLatticeFrame = z.infer<typeof cardLatticeFrameSchema>;

export const cardLatticeDriveLadderScalarsSchema = z.object({
  R: z.number(),
  sigma: z.number(),
  beta: z.number(),
  gate: z.number(),
  ampChain: z.number(),
});
export type CardLatticeDriveLadderScalars = z.infer<typeof cardLatticeDriveLadderScalarsSchema>;

export const cardLatticeMetadataSchema = z.object({
  enabled: z.boolean().optional(),
  updatedAt: z.number().nonnegative().optional(),
  band_m: z.number().positive().optional(),
  frame: cardLatticeFrameSchema.optional(),
  hashes: z
    .object({
      strobe: z.string().optional(),
      weights: z.string().optional(),
      volume: z.string().optional(),
      sdf: z.string().optional(),
    })
    .optional(),
  driveLadder: z
    .object({
      scalars: cardLatticeDriveLadderScalarsSchema.nullable().optional(),
      signature: z.string().optional(),
      hash: z.string().optional(),
    })
    .optional(),
  stats: z
    .object({
      coverage: z.number().min(0).max(1).optional(),
      maxGate: z.number().optional(),
      maxDfdr: z.number().optional(),
      maxDrive: z.number().optional(),
    })
    .optional(),
});
export type CardLatticeMetadata = z.infer<typeof cardLatticeMetadataSchema>;

export const latticeAssetRefSchema = z.object({
  filename: z.string(),
  byteLength: z.number().int().nonnegative(),
  sha256: z.string(),
  encoding: z.enum(["rg16f-le", "r8"]),
});
export type LatticeAssetRef = z.infer<typeof latticeAssetRefSchema>;

const latticePrecomputedAssetsSchema = z.object({
  volumeRG16F: latticeAssetRefSchema.optional(),
  sdfR8: latticeAssetRefSchema.optional(),
});
export type LatticePrecomputedAssets = z.infer<typeof latticePrecomputedAssetsSchema>;

export const latticePrecomputeAttachmentSchema = z.object({
  meshHash: z.string().optional(),
  basisSignature: z.string().optional(),
  profileTag: z.string().optional(),
  preset: z.string().optional(),
  rejectionReasons: z.array(z.string()).optional(),
  meta: cardLatticeMetadataSchema.optional(),
  frame: cardLatticeFrameSchema.optional(),
  assets: latticePrecomputedAssetsSchema.optional(),
  updatedAt: z.number().nonnegative().optional(),
  sourcePath: z.string().optional(),
});
export type LatticePrecomputeAttachment = z.infer<typeof latticePrecomputeAttachmentSchema>;

export const hullPreviewPayloadSchema = hullPreviewPayloadBaseSchema
  .extend({
    version: hullPreviewPayloadVersionSchema.optional(),
    precomputed: latticePrecomputeAttachmentSchema.nullable().optional(),
  })
  .transform((payload) => ({
    ...payload,
    version: payload.version ?? "v1",
  }));
export type HullPreviewPayload = z.infer<typeof hullPreviewPayloadSchema>;

const cardRecipeSignaturesSchema = z.object({
  meshHash: z.string().optional(),
  meshSignature: z.string().optional(),
  basisSignature: z.string().optional(),
  hullSignature: z.string().optional(),
  blanketSignature: z.string().optional(),
  vizSignature: z.string().optional(),
  profileSignature: z.string().optional(),
  geometrySignature: z.string().optional(),
});
export type CardRecipeSignatures = z.infer<typeof cardRecipeSignaturesSchema>;

export const spacetimeGridWarpFieldSchema = z.enum(["dfdr", "alpha"]);
export type SpacetimeGridWarpField = z.infer<typeof spacetimeGridWarpFieldSchema>;

export const spacetimeGridPrefsSchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(["slice", "surface", "volume"]),
  spacing_m: z.number().positive(),
  warpStrength: z.number().nonnegative(),
  falloff_m: z.number().positive(),
  colorBy: z.enum(["thetaSign", "thetaMagnitude", "warpStrength"]),
  warpField: spacetimeGridWarpFieldSchema.optional(),
  useSdf: z.boolean(),
  warpStrengthMode: z.enum(["manual", "autoThetaPk", "autoThetaScaleExpected"]),
  warpGamma: z.number().positive().optional(),
  useGradientDir: z.boolean().optional(),
});
export type SpacetimeGridPrefs = z.infer<typeof spacetimeGridPrefsSchema>;

export const cardRecipeSchema = z.object({
  schemaVersion: z.number().int().positive().default(CARD_RECIPE_SCHEMA_VERSION),
  hull: hullSchema,
  area: z.object({
    hullAreaOverride_m2: hullAreaOverrideSchema.shape.hullAreaOverride_m2,
    hullAreaOverride_uncertainty_m2: hullAreaOverrideSchema.shape.hullAreaOverride_uncertainty_m2,
    hullArea_m2: z.number().positive().optional(),
    __hullAreaSource: z.enum(["override", "ellipsoid"]).optional(),
  }),
  blanket: z.object({
    tilesPerSectorVector: z.array(z.number().nonnegative()).min(1).max(10_000).optional(),
    activeFraction: z.number().min(0).max(1).optional(),
  }),
  viz: z.object({
    volumeViz: cardVolumeVizSchema.default("theta_drive"),
    volumeDomain: cardVolumeDomainSchema.default("wallBand"),
    volumeSource: cardVolumeSourceSchema.default("lattice"),
    gateSource: cardGateSourceSchema.default("schedule"),
    gateView: z.boolean().default(true),
    forceFlatGate: z.boolean().optional(),
    opacityWindow: z.tuple([z.number(), z.number()]).optional(),
    spacetimeGrid: spacetimeGridPrefsSchema.optional(),
  }),
  geometry: z.object({
    warpFieldType: warpFieldTypeSchema.optional(),
    warpGeometryKind: warpGeometryKindSchema.optional(),
    warpGeometryAssetId: z.string().optional(),
    warpGeometry: warpGeometrySchema.optional(),
  }),
  camera: cardCameraSchema,
  mesh: cardMeshMetadataSchema.optional(),
  lattice: cardLatticeMetadataSchema.optional(),
  signatures: cardRecipeSignaturesSchema.optional(),
});
export type CardRecipe = z.infer<typeof cardRecipeSchema>;

// --- Navigation / Pose -------------------------------------------------------

export type NavFrame = "heliocentric-ecliptic" | "heliocentric-icrs" | "simulation" | "geocentric";

/**
 * Ground-truth world-frame pose for the craft (or a simulated stand-in).
 * Units are meters / m/s; heading is projected into the ecliptic plane.
 */
export interface NavigationPose {
  /** unix epoch (ms) of the sample */
  timestamp_ms: number;
  /** reference frame of position/velocity */
  frame: NavFrame;
  /** world position [x,y,z] in meters */
  position_m: [number, number, number];
  /** world velocity [vx,vy,vz] in meters per second */
  velocity_mps: [number, number, number];
  /** heading in degrees, 0 = +x axis of the frame */
  heading_deg: number;
}

export const observerWorldlineSchema = z.object({
  id: z.string(),
  label: z.string(),
  beta: z.number().optional(),
});
export type ObserverWorldline = z.infer<typeof observerWorldlineSchema>;

export const qiSettingsSchema = z.object({
  sampler: samplingKindSchema,
  tau_s_ms: z.number().positive(),
  observerId: z.string(),
  guardBand: z.number().min(0).max(1).optional(),
  fieldType: qiFieldTypeSchema.default("em"),
});
export type QiSettings = z.infer<typeof qiSettingsSchema>;

const complexSchema = z.object({
  real: z.number(),
  imag: z.number(),
});

export const qiStatsSchema = z.object({
  sampler: samplingKindSchema,
  tau_s_ms: z.number().positive(),
  observerId: z.string(),
  fieldType: qiFieldTypeSchema.optional(),
  dt_ms: z.number().positive(),
  avg: z.number(),
  bound: z.number(),
  margin: z.number(),
  interestRate: z.number().optional(),
  interestWindow_ms: z.number().nonnegative().optional(),
  interestDebt: z.number().optional(),
  interestCredit: z.number().optional(),
  interestMargin: z.number().optional(),
  interestNetCycle: z.number().optional(),
  interestNeg: z.number().optional(),
  interestPos: z.number().optional(),
  sampledIntegral_Jm3: z.number().optional(),
  boundTight_Jm3: z.number().optional(),
  marginRatio: z.number().optional(),
  marginRatioRaw: z.number().optional(),
  policyLimit: z.number().optional(),
  window_ms: z.number().nonnegative(),
  samples: z.number().int().nonnegative(),
  varT00_lattice: z.number().min(0).optional(),
  gradT00_norm: z.number().min(0).optional(),
  C_warp: z.number().min(0).max(1).optional(),
  QI_envelope_okPct: z.number().min(0).max(100).optional(),
  sigmaT00_norm: z.number().min(0).optional(),
  sigmaT00_Jm3: z.number().min(0).optional(),
  maxTileSigma: z.number().min(0).optional(),
  trimEnergy_pct: z.number().min(0).optional(),
  meanT00_abs: z.number().min(0).optional(),
  homogenizerSource: z.enum(["synthetic", "hardware", "offline"]).optional(),
  eccentricity: z.number().min(0).optional(),
  periapsisAngle: z.number().optional(),
  lrlVector: z.tuple([z.number(), z.number(), z.number()]).optional(),
  lrlMagnitude: z.number().min(0).optional(),
  lrlActionRate: z.number().optional(),
  lrlOscillatorCoordinate: complexSchema.optional(),
  lrlOscillatorVelocity: complexSchema.optional(),
  lrlOscillatorEnergy: complexSchema.optional(),
  lrlPlanarResidual: z.number().min(0).optional(),
  lrlGeometryResidual: z.number().min(0).optional(),
});
export type QiStats = z.infer<typeof qiStatsSchema>;

// ---- QI lattice live stream types ------------------------------------------

export interface QITileSnapshot {
  /** Stable tile identifier consistent with scheduler / pipeline ids */
  tileId: string;
  /** Integer lattice index */
  ijk: [number, number, number];
  /** Physical tile center (meters) */
  center_m: [number, number, number];
  /** Saturation ratio S = |∫ g(t) ρ_neg(t) dt| / qi_limit (clamped to ≈1.5) */
  S: number;
  /** Instantaneous negative energy density (J/m^3) */
  rho_neg_Jm3: number;
  /** Effective sampling window (seconds) */
  tau_eff_s: number;
  /** Applied Ford–Roman bound */
  qi_limit: number;
  /** Optional diagnostics */
  Q_factor?: number;
  T_K?: number;
  /** Magnitude of |T^{00}| in J/m^3 (if supplied by the producer) */
  absRho_Jm3?: number;
  /** Deviation from the lattice mean (J/m^3) */
  deviation_Jm3?: number;
  /** Normalized deviation (sigma units) */
  sigmaNorm?: number;
  /** Optional signal weight / confidence (0..1) */
  weight?: number;
}

export interface QISample {
  /** Unix time (ms) when the snapshot was computed */
  tUnixMs: number;
  /** Tiles included in this frame (full set or deltas) */
  tiles: QITileSnapshot[];
  meta: {
    /** Effective sampling window supplied by the producer */
    window_s: number;
    sampler: SamplingKind;
    /** Frames alternate between 'full' dumps and 'delta' updates */
    frame_kind?: "full" | "delta";
    /** Optional monotonic sequence for client-side ordering */
    sequence?: number;
  };
}

export const QI_S_THRESH = {
  amber: 0.7,
  red: 0.9,
} as const;

// ---- QI controller + tile schema -------------------------------------------

export const qiPulseEnvelopeSchema = z.enum(["rectangular", "gaussian", "raised_cosine"]);
export type QiPulseEnvelope = z.infer<typeof qiPulseEnvelopeSchema>;

export const qiControllerSafetyStateSchema = z.enum(["OK", "MARGIN_LOW", "QI_AT_RISK", "HARD_STOP"]);
export type QiControllerSafetyState = z.infer<typeof qiControllerSafetyStateSchema>;

export const qiTileTelemetrySchema = z.object({
  tileId: z.string(),
  label: z.string().optional(),
  gap_nm: z.number(),
  gapMin_nm: z.number(),
  gapMax_nm: z.number(),
  maxDeltaGap_nm_perTick: z.number().nonnegative(),
  duty: z.number().min(0).max(1),
  dutyMin: z.number().min(0).max(1),
  dutyMax: z.number().min(0).max(1),
  maxDutyStep: z.number().min(0).max(1).default(0.02),
  Q_eff: z.number().positive(),
  Q_min: z.number().positive().optional(),
  temperatureK: z.number().nonnegative(),
  T_maxK: z.number().positive(),
  area_mm2: z.number().positive(),
  gammaGeo: z.number().positive(),
  roughness_nm: z.number().nonnegative(),
  fieldType: qiFieldTypeSchema,
  kernelType: samplingKindSchema,
  tau_s: z.number().positive(),
  guardBandFrac: z.number().min(0).max(1).optional(),
  dutyNominal: z.number().min(0).max(1).optional(),
  envelopeType: qiPulseEnvelopeSchema.default("rectangular"),
  sectorId: z.number().int().nonnegative(),
  drivePhase_rad: z.number(),
  repRate_Hz: z.number().positive(),
  safetySigma_Jm3: z.number().nonnegative().optional(),
  tauKernel_s: z.number().positive().optional(),
  slewLimit_nm_per_s: z.number().nonnegative().optional(),
  telemetryAt: z.number().optional(),
});
export type QiTileTelemetry = z.infer<typeof qiTileTelemetrySchema>;

export const qiTileControllerStateSchema = z.object({
  tileId: z.string(),
  label: z.string().optional(),
  sectorId: z.number().int().nonnegative(),
  drivePhase_rad: z.number(),
  drivePhaseTarget_rad: z.number(),
  gap_nm: z.number(),
  gapTarget_nm: z.number(),
  gapMin_nm: z.number(),
  gapMax_nm: z.number(),
  duty: z.number().min(0).max(1),
  dutyTarget: z.number().min(0).max(1),
  dutyMin: z.number().min(0).max(1),
  dutyMax: z.number().min(0).max(1),
  tau_s: z.number().positive(),
  fieldType: qiFieldTypeSchema,
  kernelType: samplingKindSchema,
  envelopeType: qiPulseEnvelopeSchema.optional(),
  rhoEff_Jm3: z.number(),
  rhoAvg_Jm3: z.number(),
  bound_Jm3: z.number(),
  guardBand_Jm3: z.number(),
  safetyBound_Jm3: z.number(),
  margin_Jm3: z.number(),
  targetMargin_Jm3: z.number().optional(),
  qEff: z.number().positive(),
  temperatureK: z.number().nonnegative(),
  T_maxK: z.number().positive(),
  limitFlags: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
  role: z.enum(["neg", "pos", "neutral"]).optional(),
  safetyState: qiControllerSafetyStateSchema,
  slewActive: z.boolean().optional(),
  pendingUserInput: z.boolean().optional(),
});
export type QiTileControllerState = z.infer<typeof qiTileControllerStateSchema>;

export const qiControllerStateSchema = z.object({
  updatedAt: z.number(),
  cycleTime_ms: z.number().nonnegative().optional(),
  safetyState: qiControllerSafetyStateSchema,
  marginMin_Jm3: z.number(),
  marginTarget_Jm3: z.number().optional(),
  marginHysteresis_Jm3: z.number().optional(),
  marginMode: z.enum(["increase_margin", "hold"]).optional(),
  payback: z
    .object({
      required: z.number().int().nonnegative(),
      achieved: z.number().int().nonnegative(),
      sectors: z.array(z.number().int().nonnegative()).optional(),
    })
    .optional(),
  tiles: z.array(qiTileControllerStateSchema),
  staggering: z
    .object({
      strategy: z.string(),
      repRate_Hz: z.number().positive(),
      tau_s: z.number().positive(),
      phaseOffsets_rad: z.array(z.number()),
      sectorPeriod_ms: z.number().positive(),
      sectorCount: z.number().int().positive(),
      negSectors: z.array(z.number().int().nonnegative()).optional(),
      posSectors: z.array(z.number().int().nonnegative()).optional(),
      weights: z.array(z.number()).optional(),
    })
    .optional(),
  optimizer: z
    .object({
      iterations: z.number().int().nonnegative(),
      infeasible: z.boolean(),
      targetEnergy_Jm3: z.number(),
      achievedEnergy_Jm3: z.number(),
    })
    .optional(),
  intents: z
    .array(
      z.object({
        intent: z.enum(["increase_negative_energy", "increase_margin", "hold", "custom"]),
        aggressiveness: z.number().min(0).max(1).optional(),
        issuedAt: z.number(),
        expiresAt: z.number().optional(),
        summary: z.string().optional(),
      }),
    )
    .optional(),
  notes: z.array(z.string()).optional(),
});
export type QiControllerState = z.infer<typeof qiControllerStateSchema>;

export const qiSetpointSuggestionSchema = z.object({
  intent: z.enum(["increase_negative_energy", "increase_margin", "hold", "custom"]).default("hold"),
  aggressiveness: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
  tiles: z
    .array(
      z.object({
        tileId: z.string(),
        gap_nm: z.number().optional(),
        duty: z.number().min(0).max(1).optional(),
        tau_s: z.number().positive().optional(),
      }),
    )
    .optional(),
});
export type QiSetpointSuggestion = z.infer<typeof qiSetpointSuggestionSchema>;

// ---- Phase schedule telemetry for HUD overlays -----------------
export interface PhaseScheduleTelemetry {
  /** Total sectors on the ring. */
  N: number;
  /** Full ring period in milliseconds. */
  sectorPeriod_ms: number;
  /** Current ring phase in [0, 1). */
  phase01: number;
  /** Per-sector phase offsets in degrees applied by the scheduler. */
  phi_deg_by_sector: number[];
  /** Sector indices tagged for negative lobes. */
  negSectors: number[];
  /** Sector indices tagged for positive payback. */
  posSectors: number[];
  /** Sampler used to compute the kernel weights. */
  sampler: SamplingKind;
  /** Sample window tau in milliseconds. */
  tau_s_ms: number;
  /**
   * Optional sampler weights per sector (same ordering as sector index).
   * When omitted, clients can recompute for visualization only.
   */
  weights?: number[];
}

export const phaseScheduleTelemetrySchema = z.object({
  N: z.number().int().positive(),
  sectorPeriod_ms: z.number().nonnegative(),
  phase01: z.number(),
  phi_deg_by_sector: z.array(z.number()),
  negSectors: z.array(z.number().int().nonnegative()),
  posSectors: z.array(z.number().int().nonnegative()),
  sampler: samplingKindSchema,
  tau_s_ms: z.number().nonnegative(),
  weights: z.array(z.number()).optional(),
});

export const hardwareSectorStateSchema = z.object({
  currentSector: z.coerce.number().int().nonnegative().optional(),
  activeSectors: z.coerce.number().int().nonnegative().optional(),
  sectorsConcurrent: z.coerce.number().int().positive().optional(),
  sectorCount: z.coerce.number().int().positive().optional(),
  load: z.enum(["sector", "midi", "launcher"]).optional(),
  i_peak_A: z.coerce.number().optional(),
  dwell_ms: z.coerce.number().nonnegative().optional(),
  burst_ms: z.coerce.number().nonnegative().optional(),
  strobeHz: z.coerce.number().nonnegative().optional(),
  // Optional measured controls (telemetry-inferred, override design values).  
  measuredModulationFreqGHz: z.coerce.number().positive().optional(),
  measuredPulseFrequencyGHz: z.coerce.number().positive().optional(),
  measuredBurstLengthUs: z.coerce.number().positive().optional(),
  measuredCycleLengthUs: z.coerce.number().positive().optional(),
  measuredDutyCycle: z.coerce.number().min(0).max(1).optional(),
  measuredSectorDuty: z.coerce.number().min(0).max(1).optional(),
  measuredSectorCount: z.coerce.number().int().positive().optional(),
  measuredCavityQ: z.coerce.number().positive().optional(),
  measuredGammaGeo: z.coerce.number().nonnegative().optional(),
  measuredGammaVanDenBroeck: z.coerce.number().nonnegative().optional(),
  measuredQSpoilingFactor: z.coerce.number().nonnegative().optional(),
  measuredQMechanical: z.coerce.number().nonnegative().optional(),
  phase01: z.coerce.number().optional(),
  phaseCont: z.coerce.number().optional(),
  pumpPhase_deg: z.coerce.number().optional(),
  tauLC_ms: z.coerce.number().optional(),
  timestamp: z.union([z.coerce.number(), z.string()]).optional(),
  phaseScheduleTelemetry: phaseScheduleTelemetrySchema.optional(),
  timebase: z
    .object({
      source: z.string(),
      confidence: z.number().min(0).max(1).optional(),
    })
    .optional(),
  provenance: z.string().optional(),
  notes: z.array(z.string()).optional(),
});
export type HardwareSectorState = z.infer<typeof hardwareSectorStateSchema>;

export const hardwareQiSampleSchema = z.object({
  windowId: z.string(),
  bounds: z
    .object({
      lower: z.coerce.number(),
      upper: z.coerce.number(),
    })
    .optional(),
  margin: z.coerce.number().optional(),
  sectorHealth: z.array(z.coerce.number()).optional(),
  timestamp: z.union([z.coerce.number(), z.string()]).optional(),
  provenance: z.string().optional(),
});
export type HardwareQiSample = z.infer<typeof hardwareQiSampleSchema>;

export const hardwareSpectrumFrameSchema = z.object({
  panelId: z.string().optional(),
  f_Hz: z.array(z.coerce.number()).min(1),
  P_dBm: z.array(z.coerce.number()).min(1),
  RBW_Hz: z.coerce.number().positive().optional(),
  refLevel_dBm: z.coerce.number().optional(),
  temperature_K: z.coerce.number().optional(),
  timestamp: z.union([z.coerce.number(), z.string()]).optional(),
  provenance: z.string().optional(),
});
export type HardwareSpectrumFrame = z.infer<typeof hardwareSpectrumFrameSchema>;


export const pumpToneSchema = z.object({
  omega_hz: z.number(),
  depth: z.number(),
  phase_deg: z.number(),
});
export type PumpTone = z.infer<typeof pumpToneSchema>;

export const pumpCommandSchema = z.object({
  tones: z.array(pumpToneSchema),
  rho0: z.number().optional(),
  issuedAt_ms: z.number().nonnegative(),
  /**
   * Optional global phase epoch (monotonic milliseconds) for tone coherence.
   * Drivers fall back to their internal epoch when this is absent.
   */
  epoch_ms: z.number().nonnegative().optional(),
});
export type PumpCommand = z.infer<typeof pumpCommandSchema>;

export const gatePulseSchema = z.object({
  id: z.string().optional(),
  inA: z.string(),
  inB: z.string().optional(),
  out: z.string(),
  t0_ns: z.number().nonnegative(),
  dur_ns: z.number().positive(),
  rho: z.number().nonnegative(),
  phi_deg: z.number(),
  kind: gateKindSchema,
  sink: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  /** Optional multi-tone payload for pumps that support concurrent carriers. */
  tones: z.array(pumpToneSchema).optional(),
  /** Optional sector ordinal used by phase schedulers / HUD overlays. */
  sectorIndex: z.number().int().nonnegative().optional(),
  /** Optional semantic role for visualization (e.g., negative, positive, neutral). */
  role: z.enum(["neg", "pos", "neutral"]).optional(),
});
export type GatePulse = z.infer<typeof gatePulseSchema>;

export const gateRouteSchema = z.object({
  port: z.string(),
  role: gateRouteRoleSchema,
  description: z.string().optional(),
});
export type GateRoute = z.infer<typeof gateRouteSchema>;

export const entropyLedgerEntrySchema = z.object({
  t_ns: z.number(),
  gateId: z.string(),
  photons: z.number(),
  joules: z.number(),
  reversible: z.boolean(),
  bits: z.number().nonnegative().optional(),
});
export type EntropyLedgerEntry = z.infer<typeof entropyLedgerEntrySchema>;

export const gateRoutingSummarySchema = z.object({
  gateId: z.string(),
  kind: gateKindSchema,
  route: gateRouteRoleSchema,
  sink: z.boolean(),
  reversible: z.boolean(),
  photons: z.number(),
  joules: z.number(),
  bits: z.number(),
  phi_deg: z.number(),
  rho: z.number(),
  out: z.string(),
  tags: z.array(z.string()).optional(),
  ledger: z.array(entropyLedgerEntrySchema).optional(),
  duty: z.number().nonnegative().max(1).optional(),
});
export type GateRoutingSummary = z.infer<typeof gateRoutingSummarySchema>;

export const gateAnalyticsSchema = z.object({
  reversibleFraction: z.number().min(0).max(1).optional(),
  busJoules: z.number().nonnegative(),
  sinkJoules: z.number().nonnegative(),
  totalBits: z.number().nonnegative().optional(),
  pulses: z.array(gatePulseSchema).default([]),
  ledger: z.array(entropyLedgerEntrySchema).default([]),
});
export type GateAnalytics = z.infer<typeof gateAnalyticsSchema>;

export interface PlateauSummary {
  phi_min_deg: Degrees;
  phi_max_deg: Degrees;
  width_deg: Degrees;
  G_ref_dB: number;
  Q_penalty_pct: number;
}

export interface RidgePreset {
  d_nm: number;
  Omega_GHz: number;
  phi_deg: number;
  m_pct?: number;
  note?: string;
}

export const vacuumGapSweepConfigSchema = z.object({
  gaps_nm: z.array(z.number().positive()).min(1),
  mod_depth_pct: z.array(z.number().positive()).optional(),
  pump_freq_GHz: z.union([z.literal("auto"), z.array(z.number().positive())]).optional(),
  phase_deg: z.array(z.number()).optional(),
  geometry: sweepGeometrySchema.optional(),
  gamma_geo: z.number().positive().optional(),
  Qc: z.number().positive().optional(),
  base_f0_GHz: z.number().positive().optional(),
  T_K: z.number().positive().optional(),
  activeSlew: z.boolean().optional(),
  twoPhase: z.boolean().optional(),
  slewDelayMs: z.number().nonnegative().optional(),
  hardwareProfile: z
    .object({
      gapLimit: z.number().int().positive().max(100).optional(),
      phaseLimit: z.number().int().positive().max(360).optional(),
      modDepthLimit: z.number().int().positive().max(50).optional(),
      pumpLimit: z.number().int().positive().max(50).optional(),
      pumpFreqLimit_GHz: z.number().positive().max(1_000).optional(),
      delayMs: z.number().nonnegative().optional(),
    })
    .optional(),
  maxGain_dB: z.number().positive().optional(),
  minQL: z.number().positive().optional(),
  plateau: z
    .object({
      dBDrop: z.number().nonnegative().optional(),
      maxQLPenaltyPct: z.number().nonnegative().optional(),
      minWidth_deg: z.number().nonnegative().optional(),
    })
    .optional(),
  phaseMicroStep_deg: z.number().positive().optional(),
  gateSchedule: z.array(gatePulseSchema).optional(),
  gateRouting: z.array(gateRouteSchema).optional(),
});
export type VacuumGapSweepConfig = z.infer<typeof vacuumGapSweepConfigSchema>;
export type DynamicCasimirSweepConfig = VacuumGapSweepConfig;

export const dynamicConfigSchema = z.object({
  // Drive modulation frequency (GHz); measurable via synthesizer readback.
  modulationFreqGHz: z.number().positive().min(0.1).max(100).default(15),
  // Measured modulation frequency (GHz); overrides modulationFreqGHz.
  measuredModulationFreqGHz: z.number().positive().min(0.1).max(100).optional(),
  strokeAmplitudePm: z.number().positive().min(0.1).max(1000).default(50), // pm (delta a)
  // Burst on-window length (us); measurable from gate timing.
  burstLengthUs: z.number().positive().min(0.1).max(1000).default(10),
  // Measured burst length (us); overrides burstLengthUs.
  measuredBurstLengthUs: z.number().positive().min(0.1).max(1000).optional(),
  // Cycle length (us); measurable from sequencer timing.
  cycleLengthUs: z.number().positive().min(1).max(10000).default(1000),
  // Measured cycle length (us); overrides cycleLengthUs.
  measuredCycleLengthUs: z.number().positive().min(1).max(10000).optional(),
  // Local duty fraction (0..1) during a burst; measurable from gate timing.
  dutyCycle: z.number().min(0).max(1).optional(),
  // Measured local duty fraction (0..1); overrides dutyCycle.
  measuredDutyCycle: z.number().min(0).max(1).optional(),
  // Cavity quality factor (Q); measurable via ringdown/linewidth.
  cavityQ: z.number().positive().min(1e3).max(1e12).default(1e9),
  // Measured cavity Q; overrides cavityQ.
  measuredCavityQ: z.number().positive().min(1e3).max(1e12).optional(),
  gateSchedule: z.array(gatePulseSchema).optional(),
  gateRouting: z.array(gateRouteSchema).optional(),
  // Needle Hull sector strobing parameters
  // Total sectors in the ring; measurable from scheduler telemetry.
  sectorCount: z.number().int().positive().min(1).max(1000).default(400),
  // Measured sector count; overrides sectorCount.
  measuredSectorCount: z.number().int().positive().min(1).max(1000).optional(),
  // Ship-wide effective duty (FR); measurable from strobe telemetry.
  sectorDuty: z.number().positive().min(1e-6).max(1).default(2.5e-5),
  // Measured ship-wide duty; overrides sectorDuty.
  measuredSectorDuty: z.number().positive().min(1e-6).max(1).optional(),
  // Pulse frequency (GHz); measurable via synthesizer readback.
  pulseFrequencyGHz: z.number().positive().min(0.1).max(100).default(15),
  // Measured pulse frequency (GHz); overrides pulseFrequencyGHz.
  measuredPulseFrequencyGHz: z.number().positive().min(0.1).max(100).optional(),
  lightCrossingTimeNs: z.number().positive().min(1).max(1000).default(100), // Light crossing time
  // Warp field parameters
  shiftAmplitude: z.number().positive().min(1e-15).max(1e-9).default(50e-12), // m (shift amplitude)
  expansionTolerance: z.number().positive().min(1e-15).max(1e-6).default(1e-12), // Zero-expansion tolerance
  warpFieldType: warpFieldTypeSchema.default("natario"), // Warp field type
  warpGeometry: warpGeometrySchema.optional(),
  // Optional sweep controls (single point or arrays)
  gap_nm: z.union([z.number().positive(), z.array(z.number().positive())]).optional(),
  mod_depth_pct: z.union([z.number().positive().max(100), z.array(z.number().positive().max(100))]).optional(),
  pump_freq_GHz: z
    .union([
      z.number().positive(),
      z.array(z.number().positive()),
      z.literal("auto"),
    ])
    .optional(),
  phase_deg: z.union([z.number(), z.array(z.number())]).optional(),
  sweep: vacuumGapSweepConfigSchema.optional(),
});
export type DynamicConfig = z.infer<typeof dynamicConfigSchema>;

// --- Parametric sweep types -------------------------------------------------
export const rangeSpecSchema = z.object({
  start: z.number().refine(Number.isFinite, { message: "start must be finite" }),
  stop: z.number().refine(Number.isFinite, { message: "stop must be finite" }),
  step: z
    .number()
    .refine((value) => Number.isFinite(value) && value !== 0, { message: "step must be finite and non-zero" }),
});
export type RangeSpec = z.infer<typeof rangeSpecSchema>;

export const sweepGuardSpecSchema = z.object({
  maxGain_dB: z.number().refine(Number.isFinite, { message: "maxGain_dB must be finite" }).optional(),
  minQL: z.number().positive().optional(),
  maxQL: z.number().positive().optional(),
  qlDropPct: z.number().nonnegative().optional(),
  timeoutMs: z.number().nonnegative().optional(),
  abortOnGain: z.boolean().optional(),
});
export type SweepGuardSpec = z.infer<typeof sweepGuardSpecSchema>;

export const sweepSpecSchema = z.object({
  gap_nm: rangeSpecSchema,
  pumpFreq_GHz: rangeSpecSchema,
  modulationDepth_pct: rangeSpecSchema,
  pumpPhase_deg: rangeSpecSchema,
  hardware: z.boolean().optional(),
  plateauDetect: z.boolean().optional(),
  measureOnly: z.boolean().optional(),
  guards: sweepGuardSpecSchema.optional(),
});
export type SweepSpec = z.infer<typeof sweepSpecSchema>;

export interface SweepPointExtended {
  gap_nm: number;
  pumpFreq_GHz: number;
  modulationDepth_pct: number;
  pumpPhase_deg: number;
  kappa_Hz?: number;
  kappaEff_Hz?: number;
  kappa_MHz?: number;
  kappaEff_MHz?: number;
  detune_MHz?: number;
  pumpRatio?: number; // rho = g/g_th (dimensionless)
  g_lin?: number;
  G_lin?: number;
  G_dB?: number;
  QL?: number;
  QL_base?: number;
  stable?: boolean;
  status?: "PASS" | "WARN" | "UNSTABLE";
  plateau?: boolean;
  abortReason?: string | null;
  ts?: number;
  gate?: GateRoutingSummary | null;
}

export type SweepProgressEvent =
  | { type: "init"; payload: { total: number; spec: SweepSpec } }
  | { type: "point"; payload: SweepPointExtended }
  | { type: "done"; payload: { resultsCount: number; elapsedMs: number } }
  | { type: "abort"; payload: { reason: string; at?: SweepPointExtended } };

export interface VacuumGapSweepRow {
  d_nm: number;
  m: number;
  Omega_GHz: number;
  phi_deg: number;
  G: number;
  QL?: number;
  stable: boolean;
  notes?: string[];
  QL_base?: number;
  Omega_rad_s?: number;
  detune_MHz?: number;
  kappaEff_Hz?: number;
  kappa_MHz?: number;
  kappaEff_MHz?: number;
  pumpRatio?: number; // rho = g/g_th (dimensionless)
  status?: "PASS" | "WARN" | "UNSTABLE";
  dB_squeeze?: number;
  sidebandAsym?: number;
  noiseTemp_K?: number;
  deltaU_cycle_J?: number;
  deltaU_mode_J?: number;
  negEnergyProxy?: number;
  crest?: boolean;
  plateau?: PlateauSummary | null;
  pumpPhase_deg?: number;
  kappa_Hz?: number;
  g_lin?: number;
  abortReason?: string | null;
  gate?: GateRoutingSummary | null;
}

export interface SweepPoint {
  d_nm: number;
  m: number;
  phi_deg: number;
  Omega_GHz: number;
  G: number;
  QL?: number;
  stable: boolean;
  status?: "PASS" | "WARN" | "UNSTABLE";
  gate?: GateRoutingSummary | null;
  detune_MHz?: number;
  kappa_MHz?: number;
  kappaEff_MHz?: number;
  pumpRatio?: number;
  plateau?: boolean;
}

export interface SweepRuntime {
  active: boolean;
  status?: "idle" | "queued" | "running" | "completed" | "cancelled" | "failed";
  jobId?: string;
  queuedAt?: number;
  startedAt?: number;
  completedAt?: number;
  iter?: number;
  total?: number;
  etaMs?: number;
  last?: SweepPoint | null;
  top?: SweepPoint[];
  slewDelayMs?: number;
  cancelRequested?: boolean;
  cancelled?: boolean;
  error?: string;
  activeSlew?: boolean;
  nextJobId?: string;
  nextJobQueuedAt?: number;
  nextJobActiveSlew?: boolean;
}

export type VacuumContractField =
  | "geometry"
  | "boundary"
  | "thermal"
  | "loss"
  | "drive"
  | "readout";

export interface VacuumContractSpec {
  geometry: {
    gap_nm: number | null;
    tileArea_cm2: number | null;
    shipRadius_m: number | null;
    sectorCount: number | null;
    sectorsConcurrent: number | null;
    curvatureRadius_m?: number | null;
  };
  boundary: {
    material: string | null;
    model: string | null;
    surface: string | null;
    patchMap?: string | null;
  };
  thermal: {
    cavity_K: number | null;
    environment_K?: number | null;
    gradient_K?: number | null;
  };
  loss: {
    qCavity: number | null;
    qMechanical: number | null;
    zeta: number | null;
    qSpoiling?: number | null;
    kappaFloor_MHz?: number | null;
  };
  drive: {
    modulationFreq_GHz: number | null;
    modulationDepth_pct?: number | null;
    detune_MHz?: number | null;
    dutyCycle?: number | null;
    sectorDuty?: number | null;
    pumpPhase_deg?: number | null;
    driveLaw?: string | null;
  };
  readout: {
    coupling_zeta: number | null;
    amplifierNoiseTemp_K?: number | null;
    effectiveBandwidth_MHz?: number | null;
  };
}

export type VacuumContractStatus = "green" | "amber" | "red";

export interface VacuumContractExports {
  modeDensity_perGHz?: number | null;
  effectiveTemp_K?: number | null;
  kappaEff_MHz?: number | null;
  dceGain_dB?: number | null;
  pumpRatio?: number | null;
  qiGuards?: {
    zeta: { value: number | null; status: VacuumContractStatus };
    duty: { value: number | null; status: VacuumContractStatus };
  };
}

export interface VacuumContract {
  id: string;
  label: string;
  spec: VacuumContractSpec;
  exports: VacuumContractExports;
  status: VacuumContractStatus;
  fingerprint: string;
  updatedAt: number;
  changed: VacuumContractField[];
  rule?: string;
}
// --- GR constraint contract (Helix agents) --------------------------------
export const grConstraintSeveritySchema = z.enum(["HARD", "SOFT"]);
export type GrConstraintSeverity = z.infer<typeof grConstraintSeveritySchema>;

export const grConstraintStatusSchema = z.enum(["pass", "fail", "unknown"]);
export type GrConstraintStatus = z.infer<typeof grConstraintStatusSchema>;

const ladderTierSchema = z.enum(["diagnostic", "reduced-order", "certified"]);

export const grConstraintEntrySchema = z.object({
  id: z.string(),
  severity: grConstraintSeveritySchema,
  status: grConstraintStatusSchema,
  value: z.number().nullable().optional(),
  limit: z.string().nullable().optional(),
  proxy: z.boolean().optional(),
  note: z.string().optional(),
});
export type GrConstraintEntry = z.infer<typeof grConstraintEntrySchema>;

export const grConstraintPolicySchema = z.object({
  mode: z.enum(["all", "hard-only"]).default("hard-only"),
  unknownAsFail: z.boolean().default(true),
  minLadderTier: ladderTierSchema.optional(),
});
export type GrConstraintPolicy = z.infer<typeof grConstraintPolicySchema>;

export const grConstraintThresholdSchema = z.object({
  H_rms_max: z.number().nonnegative(),
  M_rms_max: z.number().nonnegative(),
  H_maxAbs_max: z.number().nonnegative().optional(),
  M_maxAbs_max: z.number().nonnegative().optional(),
});
export type GrConstraintThresholds = z.infer<typeof grConstraintThresholdSchema>;

export const grConstraintGateStatusSchema = z.enum(["pass", "fail", "unknown"]);
export type GrConstraintGateStatus = z.infer<typeof grConstraintGateStatusSchema>;

export const grConstraintGateSchema = z.object({
  status: grConstraintGateStatusSchema,
  evaluatedAt: z.number(),
  thresholds: grConstraintThresholdSchema,
  policy: grConstraintPolicySchema,
});
export type GrConstraintGate = z.infer<typeof grConstraintGateSchema>;

export const grConstraintGateConfigSourceSchema = z.enum([
  "warp-agents",
  "default",
]);
export type GrConstraintGateConfigSource = z.infer<
  typeof grConstraintGateConfigSourceSchema
>;

export const grConstraintGateConfigSchema = z.object({
  version: z.number().int().positive(),
  source: grConstraintGateConfigSourceSchema,
  thresholds: grConstraintThresholdSchema,
  policy: grConstraintPolicySchema,
  overridesApplied: z.boolean().optional(),
});
export type GrConstraintGateConfig = z.infer<
  typeof grConstraintGateConfigSchema
>;

export const grCertificatePolicySchema = z.object({
  admissibleStatus: z.string(),
  allowMarginalAsViable: z.boolean(),
  treatMissingCertificateAsNotCertified: z.boolean(),
});
export type GrCertificatePolicy = z.infer<typeof grCertificatePolicySchema>;

export const grConstraintPolicyBundleSchema = z.object({
  gate: grConstraintGateConfigSchema,
  certificate: grCertificatePolicySchema,
});
export type GrConstraintPolicyBundle = z.infer<
  typeof grConstraintPolicyBundleSchema
>;

export const grGuardrailStatusSchema = z.enum(["ok", "fail", "proxy", "missing"]);
export type GrGuardrailStatus = z.infer<typeof grGuardrailStatusSchema>;

export const grGuardrailSchema = z.object({
  fordRoman: grGuardrailStatusSchema,
  thetaAudit: grGuardrailStatusSchema,
  tsRatio: grGuardrailStatusSchema,
  vdbBand: grGuardrailStatusSchema,
});
export type GrGuardrails = z.infer<typeof grGuardrailSchema>;
const grFixupStepStatsSchema = z.object({
  alphaClampCount: z.number().nonnegative(),
  kClampCount: z.number().nonnegative(),
  detFixCount: z.number().nonnegative(),
  traceFixCount: z.number().nonnegative(),
  maxAlphaBeforeClamp: z.number().nonnegative(),
  maxKBeforeClamp: z.number().nonnegative(),
});
const grFixupStatsSchema = grFixupStepStatsSchema.extend({
  totalCells: z.number().int().nonnegative(),
  alphaClampByStep: z.array(z.number().nonnegative()),
  kClampByStep: z.array(z.number().nonnegative()),
  detFixByStep: z.array(z.number().nonnegative()),
  traceFixByStep: z.array(z.number().nonnegative()),
  alphaClampMin: z.number(),
  alphaClampMax: z.number(),
  kClampMaxAbs: z.number(),
  clampFraction: z.number().nonnegative().optional(),
  postStep: grFixupStepStatsSchema.optional(),
});
const grSolverHealthSchema = z.object({
  status: z.enum(["CERTIFIED", "UNSTABLE", "NOT_CERTIFIED"]),
  reasons: z.array(z.string()),
  alphaClampFraction: z.number().nonnegative(),
  kClampFraction: z.number().nonnegative(),
  totalClampFraction: z.number().nonnegative(),
  maxAlphaBeforeClamp: z.number().nonnegative(),
  maxKBeforeClamp: z.number().nonnegative(),
});
const grBrickMetaSchema = z.object({
  status: z.enum(["CERTIFIED", "NOT_CERTIFIED"]),
  reasons: z.array(z.string()),
});

export const grConstraintContractSchema = z.object({
  kind: z.literal("gr-constraint-contract"),
  version: z.number().int().positive(),
  updatedAt: z.number(),
  policy: grConstraintPolicyBundleSchema,
  sources: z.object({
    grDiagnostics: z.enum(["gr-evolve-brick", "pipeline", "missing"]),
    certificate: z.enum(["physics.warp.viability", "missing"]),
  }),
  grid: z
    .object({
      dims: z.tuple([
        z.number().int().positive(),
        z.number().int().positive(),
        z.number().int().positive(),
      ]),
      bounds: z.object({
        min: vec3Schema,
        max: vec3Schema,
      }),
      voxelSize_m: z.number().positive().optional(),
      time_s: z.number().optional(),
      dt_s: z.number().optional(),
    })
    .optional(),
  diagnostics: z
    .object({
      H_rms: z.number().optional(),
      M_rms: z.number().optional(),
      lapseMin: z.number().optional(),
      lapseMax: z.number().optional(),
      betaMaxAbs: z.number().optional(),
      fixups: grFixupStatsSchema.optional(),
      solverHealth: grSolverHealthSchema.optional(),
      brickMeta: grBrickMetaSchema.optional(),
    })
    .optional(),
  perf: z
    .object({
      totalMs: z.number().optional(),
      evolveMs: z.number().optional(),
      brickMs: z.number().optional(),
      voxels: z.number().int().optional(),
      channelCount: z.number().int().optional(),
      bytesEstimate: z.number().int().optional(),
      msPerStep: z.number().optional(),
    })
    .optional(),
  gate: grConstraintGateSchema.optional(),
  guardrails: grGuardrailSchema.optional(),
  constraints: z.array(grConstraintEntrySchema),
  certificate: z.object({
    status: z.string(),
    admissibleStatus: z.string(),
    hasCertificate: z.boolean(),
    certificateHash: z.string().nullable(),
    certificateId: z.string().nullable(),
  }),
  notes: z.array(z.string()).optional(),
  proxy: z.boolean().optional(),
});
export type GrConstraintContract = z.infer<typeof grConstraintContractSchema>;

export const grEvaluationSchema = z.object({
  kind: z.literal("gr-evaluation"),
  updatedAt: z.number(),
  policy: grConstraintPolicyBundleSchema,
  residuals: z.object({
    H_rms: z.number().optional(),
    M_rms: z.number().optional(),
    H_maxAbs: z.number().optional(),
    M_maxAbs: z.number().optional(),
  }),
  gate: grConstraintGateSchema,
  constraints: z.array(grConstraintEntrySchema),
  certificate: z.object({
    status: z.string(),
    admissibleStatus: z.string(),
    hasCertificate: z.boolean(),
    certificateHash: z.string().nullable(),
    certificateId: z.string().nullable(),
    integrityOk: z.boolean(),
    authenticityOk: z.boolean().optional(),
    authenticityRequired: z.boolean().optional(),
    authenticityConsequence: z.enum(["low", "medium", "high"]).optional(),
    authenticityReasonCodes: z.array(z.string()).optional(),
  }),
  pass: z.boolean(),
  notes: z.array(z.string()).optional(),
});
export type GrEvaluation = z.infer<typeof grEvaluationSchema>;

export const grGroundingCertificateSchema = z.object({
  status: z.string(),
  admissibleStatus: z.string().optional(),
  hasCertificate: z.boolean().optional(),
  certificateHash: z.string().nullable(),
  certificateId: z.string().nullable(),
  integrityOk: z.boolean().optional(),
  authenticityOk: z.boolean().optional(),
  authenticityRequired: z.boolean().optional(),
  authenticityConsequence: z.enum(["low", "medium", "high"]).optional(),
  authenticityReasonCodes: z.array(z.string()).optional(),
});
export type GrGroundingCertificate = z.infer<typeof grGroundingCertificateSchema>;

export const grGroundingSchema = z.object({
  kind: z.literal("gr-grounding"),
  version: z.number().int().positive(),
  updatedAt: z.number(),
  policyVersion: z.string(),
  residuals: grEvaluationSchema.shape.residuals,
  constraints: z.array(grConstraintEntrySchema),
  certificate: grGroundingCertificateSchema,
  pass: z.boolean(),
  notes: z.array(z.string()).optional(),
  proxy: z.boolean().optional(),
});
export type GrGrounding = z.infer<typeof grGroundingSchema>;

const grAssistantCheckSchema = z
  .object({
    check_name: z.string(),
    passed: z.boolean(),
    residual: z.string().nullable().optional(),
    notes: z.string().optional(),
  })
  .passthrough();
export type GrAssistantCheck = z.infer<typeof grAssistantCheckSchema>;

export const grAssistantReportPayloadSchema = z.object({
  source: z.string(),
  assumptions: z.object({
    coords: z.array(z.string()),
    signature: z.string(),
    units_internal: z.string(),
  }),
  metric: z.record(z.any()).optional(),
  artifacts: z.array(z.string()),
  checks: z.array(grAssistantCheckSchema),
  failed_checks: z.array(grAssistantCheckSchema),
  invariants: z.record(z.any()).optional(),
  brick_invariants: z.record(z.any()).optional(),
  sample: z
    .object({
      ix: z.number(),
      iy: z.number(),
      iz: z.number(),
      x_m: z.number(),
      y_m: z.number(),
      z_m: z.number(),
      t_s: z.number(),
    })
    .optional(),
  passed: z.boolean(),
  notes: z.array(z.string()).optional(),
});
export type GrAssistantReportPayload = z.infer<typeof grAssistantReportPayloadSchema>;

export const grAssistantReportSchema = z.object({
  kind: z.literal("gr-assistant-report"),
  updatedAt: z.number(),
  report: grAssistantReportPayloadSchema,
  gate: grGroundingSchema.optional(),
  citations: z.array(z.string()).optional(),
  trace_id: z.string().optional(),
  training_trace_id: z.string().optional(),
});
export type GrAssistantReport = z.infer<typeof grAssistantReportSchema>;

const grAssistantUnitCheckSchema = z.object({
  expression: z.string().min(1),
  unit_system: z.string().optional(),
  symbol_units: z.record(z.string()).optional(),
  unit_tags: z.array(z.string()).optional(),
  unit_modules: z.array(z.string()).optional(),
});

export const grAssistantReportRequestSchema = z
  .object({
    brick: z.record(z.any()).optional(),
    metric: z.record(z.any()).optional(),
    sample: z
      .object({
        ix: z.number().int().min(0).optional(),
        iy: z.number().int().min(0).optional(),
        iz: z.number().int().min(0).optional(),
        x_m: z.number().optional(),
        y_m: z.number().optional(),
        z_m: z.number().optional(),
      })
      .optional(),
    vacuum_sample_points: z.array(z.record(z.number())).optional(),
    vacuum_epsilon: z.number().optional(),
    run_invariants: z.boolean().optional(),
    run_checks: z.boolean().optional(),
    run_artifacts: z.boolean().optional(),
    unit_check: grAssistantUnitCheckSchema.optional(),
    tool_base_url: z.string().optional(),
    warpConfig: z.record(z.any()).optional(),
    config: z.record(z.any()).optional(),
    thresholds: grConstraintThresholdSchema.partial().optional(),
    policy: grConstraintPolicySchema.partial().optional(),
    useLiveSnapshot: z.boolean().optional(),
    traceId: z.string().optional(),
  })
  .passthrough();
export type GrAssistantReportRequest = z.infer<typeof grAssistantReportRequestSchema>;

export const proofValueSchema = z.object({
  value: z.union([z.number(), z.boolean(), z.string(), z.null()]),
  unit: z.string().optional(),
  source: z.string().optional(),
  proxy: z.boolean().optional(),
  note: z.string().optional(),
  basis: z.record(z.string()).optional(),
});
export type ProofValue = z.infer<typeof proofValueSchema>;

export const proofPackSchema = z.object({
  kind: z.literal("proof-pack"),
  version: z.number().int().positive(),
  generatedAt: z.string(),
  pipeline: z
    .object({
      seq: z.number().optional(),
      ts: z.number().optional(),
      mode: z.string().optional(),
    })
    .optional(),
  values: z.record(proofValueSchema),
  equations: z.record(z.string()).optional(),
  sources: z.record(z.string()).optional(),
  notes: z.array(z.string()).optional(),
});
export type ProofPack = z.infer<typeof proofPackSchema>;

export const grOsStageSchema = ladderTierSchema;
export type GrOsStage = z.infer<typeof grOsStageSchema>;

export const grOsConstraintStatusSchema = z.enum(["PASS", "FAIL", "WARN"]);
export type GrOsConstraintStatus = z.infer<typeof grOsConstraintStatusSchema>;

export const grOsGatePolicySchema = z.object({
  mode: grConstraintPolicySchema.shape.mode,
  unknownAsFail: grConstraintPolicySchema.shape.unknownAsFail,
});
export type GrOsGatePolicy = z.infer<typeof grOsGatePolicySchema>;

export const grOsConstraintSummarySchema = z.object({
  gate: grOsGatePolicySchema,
  status: grOsConstraintStatusSchema,
  metrics: z.lazy(() => grConstraintMetricsSchema.partial()).optional(),
  hard_fail_ids: z.array(z.string()).default([]),
});
export type GrOsConstraintSummary = z.infer<typeof grOsConstraintSummarySchema>;

export const grOsStressEnergySchema = z.object({
  div_mean: z.number().optional(),
  div_rms: z.number().optional(),
  div_max_abs: z.number().optional(),
  net_flux_norm: z.number().optional(),
});
export type GrOsStressEnergy = z.infer<typeof grOsStressEnergySchema>;

export const grOsGaugeSchema = z.object({
  lapse_min: z.number().optional(),
  lapse_max: z.number().optional(),
  shift_rms: z.number().optional(),
  shift_max_abs: z.number().optional(),
  K_trace_mean: z.number().optional(),
});
export type GrOsGauge = z.infer<typeof grOsGaugeSchema>;

export const grOsStabilitySchema = z.object({
  cfl: z.number().optional(),
  step_ms: z.number().optional(),
  steps: z.number().int().nonnegative().optional(),
  nan_count: z.number().int().nonnegative().optional(),
  total_ms: z.number().optional(),
  voxels: z.number().int().nonnegative().optional(),
  channel_count: z.number().int().nonnegative().optional(),
});
export type GrOsStability = z.infer<typeof grOsStabilitySchema>;

export const grOsViabilityStatusSchema = z.enum([
  "ADMISSIBLE",
  "MARGINAL",
  "INADMISSIBLE",
  "NOT_CERTIFIED",
]);
export type GrOsViabilityStatus = z.infer<typeof grOsViabilityStatusSchema>;

export const grOsViabilitySchema = z.object({
  status: grOsViabilityStatusSchema,
  certificate_hash: z.string().nullable().optional(),
  certificate_id: z.string().nullable().optional(),
  integrity_ok: z.boolean().optional(),
});
export type GrOsViability = z.infer<typeof grOsViabilitySchema>;

export const grOsGridSchema = z.object({
  nx: z.number().int().positive(),
  ny: z.number().int().positive(),
  nz: z.number().int().positive(),
  dx_m: z.number().positive().optional(),
  dy_m: z.number().positive().optional(),
  dz_m: z.number().positive().optional(),
  voxelSize_m: vec3Schema.optional(),
});
export type GrOsGrid = z.infer<typeof grOsGridSchema>;

export const grOsProvenanceSchema = z.object({
  essence_id: z.string().optional(),
  information_boundary: InformationBoundary.optional(),
});
export type GrOsProvenance = z.infer<typeof grOsProvenanceSchema>;

export const grOsActionSchema = z.object({
  type: z.enum(["throttle", "halt", "notify"]),
  reason: z.string(),
});
export type GrOsAction = z.infer<typeof grOsActionSchema>;

export const grOsPayloadSchema = z.object({
  schema_version: z.literal("gr-os/0.1"),
  stage: grOsStageSchema,
  timestamp: z.string().datetime(),
  grid: grOsGridSchema.optional(),
  constraints: grOsConstraintSummarySchema.optional(),
  stress_energy: grOsStressEnergySchema.optional(),
  gauge: grOsGaugeSchema.optional(),
  stability: grOsStabilitySchema.optional(),
  viability: grOsViabilitySchema.optional(),
  provenance: grOsProvenanceSchema.optional(),
  actions: z.array(grOsActionSchema).default([]),
});
export type GrOsPayload = z.infer<typeof grOsPayloadSchema>;

export const grConstraintMetricsSchema = z.object({
  H_rms: z.number().nonnegative(),
  M_rms: z.number().nonnegative(),
  H_maxAbs: z.number().nonnegative(),
  M_maxAbs: z.number().nonnegative(),
});
export type GrConstraintMetrics = z.infer<typeof grConstraintMetricsSchema>;

export const grConstraintTrendSchema = z.object({
  H_rms: z.number(),
  M_rms: z.number(),
  H_maxAbs: z.number(),
  M_maxAbs: z.number(),
});
export type GrConstraintTrend = z.infer<typeof grConstraintTrendSchema>;

export const grConstraintSeriesPointSchema = z.object({
  step: z.number().int().nonnegative(),
  time_s: z.number().nonnegative(),
  metrics: grConstraintMetricsSchema,
  gateStatus: grConstraintGateStatusSchema,
});
export type GrConstraintSeriesPoint = z.infer<typeof grConstraintSeriesPointSchema>;

export const grConstraintNetworkSummarySchema = z.object({
  max: grConstraintMetricsSchema,
  final: grConstraintMetricsSchema,
  trend: grConstraintTrendSchema,
  steps: z.number().int().nonnegative(),
});
export type GrConstraintNetworkSummary = z.infer<typeof grConstraintNetworkSummarySchema>;

export const grConstraintNetworkSchema = z.object({
  kind: z.literal("gr-constraint-network-4d"),
  version: z.number().int().positive(),
  updatedAt: z.number(),
  pass: z.boolean(),
  grid: z.object({
    dims: z.tuple([
      z.number().int().positive(),
      z.number().int().positive(),
      z.number().int().positive(),
    ]),
    bounds: z.object({
      min: vec3Schema,
      max: vec3Schema,
    }),
    voxelSize_m: vec3Schema.optional(),
    time_s: z.number(),
    dt_s: z.number(),
    steps: z.number().int().nonnegative(),
  }),
  initial: z.object({
    status: z.enum(["CERTIFIED", "NOT_CERTIFIED"]),
    iterations: z.number().int().nonnegative(),
    residual: z.number().nonnegative(),
    tolerance: z.number().nonnegative(),
    reason: z.string().optional(),
  }),
  gate: grConstraintGateSchema,
  constraints: z.array(grConstraintEntrySchema),
  summary: grConstraintNetworkSummarySchema,
  series: z.array(grConstraintSeriesPointSchema),
  notes: z.array(z.string()).optional(),
});
export type GrConstraintNetwork4d = z.infer<typeof grConstraintNetworkSchema>;

export const grRegionGridSchema = z.object({
  thetaBins: z.number().int().positive(),
  longBins: z.number().int().positive(),
  phaseBins: z.number().int().positive(),
  radialBins: z.number().int().positive(),
  totalRegions: z.number().int().positive(),
  longAxis: z.enum(["x", "y", "z"]),
  targetRegions: z.number().int().positive().optional(),
  strobeHz: z.number().nonnegative(),
  strobePeriod_s: z.number().nonnegative(),
  lightCrossing_s: z.number().nonnegative(),
  phase01: z.number().optional(),
  phaseBin: z.number().int().nonnegative().optional(),
});
export type GrRegionGrid = z.infer<typeof grRegionGridSchema>;

export const grRegionStatsEntrySchema = z.object({
  id: z.number().int().nonnegative(),
  key: z.string(),
  indices: z.object({
    theta: z.number().int().nonnegative(),
    long: z.number().int().nonnegative(),
    phase: z.number().int().nonnegative(),
    radial: z.number().int().nonnegative(),
  }),
  voxelCount: z.number().int().nonnegative(),
  volume: z.number().nonnegative(),
  negEnergy: z.number().nonnegative(),
  posEnergy: z.number().nonnegative(),
  negFraction: z.number().nonnegative(),
  negShare: z.number().nonnegative(),
  centroid: vec3Schema.nullable().optional(),
});
export type GrRegionStatsEntry = z.infer<typeof grRegionStatsEntrySchema>;

const grRegionWallSchema = z.object({
  source: z.enum(["kretschmann", "ricci4"]),
  detected: z.boolean(),
  p98: z.number().nonnegative(),
  threshold: z.number().nonnegative(),
  bandMin: z.number().nonnegative(),
  bandMax: z.number().nonnegative(),
  sampleCount: z.number().int().nonnegative(),
  voxelCount: z.number().int().nonnegative(),
  voxelFraction: z.number().nonnegative(),
  center: vec3Schema.nullable().optional(),
  radiusMin: z.number().nonnegative().optional(),
  radiusMax: z.number().nonnegative().optional(),
  radiusMean: z.number().nonnegative().optional(),
  thickness: z.number().nonnegative().optional(),
  wallFraction: z.number().nonnegative(),
  bandFraction: z.number().nonnegative(),
});

export const grRegionStatsSchema = z.object({
  kind: z.literal("gr-region-stats"),
  updatedAt: z.number(),
  source: z.object({
    brick: z.enum(["gr-evolve-brick", "stress-energy-brick", "missing"]),
    proxy: z.boolean(),
    certified: z.boolean().optional(),
    notes: z.array(z.string()).optional(),
  }),
  geometry: z.object({
    source: z.enum(["preview", "pipeline"]),
    meshHash: z.string().nullable().optional(),
    hull: z.object({
      Lx_m: z.number(),
      Ly_m: z.number(),
      Lz_m: z.number(),
      wallThickness_m: z.number(),
    }),
    bounds: z.object({
      min: vec3Schema,
      max: vec3Schema,
    }),
    radialMap: z.enum(["warp-geometry", "preview", "none"]),
  }),
  grid: grRegionGridSchema,
  sample: z.object({
    dims: z.tuple([
      z.number().int().positive(),
      z.number().int().positive(),
      z.number().int().positive(),
    ]),
    voxelSize_m: vec3Schema,
    voxelCount: z.number().int().nonnegative(),
    stride: z.number().int().positive().optional(),
  }),
  summary: z.object({
    negEnergy: z.number().nonnegative(),
    posEnergy: z.number().nonnegative(),
    negFraction: z.number().nonnegative(),
    contractionVector: vec3Schema.nullable().optional(),
    contractionMagnitude: z.number().nonnegative(),
    wall: grRegionWallSchema.optional(),
  }),
  topRegions: z.array(grRegionStatsEntrySchema),
});
export type GrRegionStats = z.infer<typeof grRegionStatsSchema>;

export const casimirTileSummarySchema = z.object({
  kind: z.literal("casimir-tile-summary"),
  updatedAt: z.number(),
  source: z.object({
    brick: z.enum(["stress-energy-brick"]),
    proxy: z.boolean(),
    notes: z.array(z.string()).optional(),
  }),
  sample: z
    .object({
      dims: z.tuple([
        z.number().int().positive(),
        z.number().int().positive(),
        z.number().int().positive(),
      ]),
      bounds: z.object({
        min: vec3Schema,
        max: vec3Schema,
      }),
      voxelSize_m: vec3Schema,
    })
    .optional(),
  inputs: z.object({
    sectorCount: z.number().int().positive(),
    sectorDuty: z.number().nonnegative(),
    strobeHz: z.number().nonnegative(),
    phase01: z.number().optional(),
    splitEnabled: z.boolean(),
    splitFrac: z.number().min(0).max(1),
    sigmaSector: z.number().nonnegative(),
    N_tiles: z.number().int().nonnegative(),
    tileArea_cm2: z.number().nonnegative(),
    gammaGeo: z.number().nonnegative(),
    gammaVdB: z.number().nonnegative(),
    qSpoil: z.number().nonnegative(),
  }),
  summary: z.object({
    dutyEffectiveFR: z.number().nonnegative(),
    rho_avg: z.number().nullable(),
    T00_min: z.number(),
    T00_max: z.number(),
    netFlux: vec3Schema,
    divRms: z.number().nonnegative(),
    strobePhase: z.number().nonnegative(),
  }),
});
export type CasimirTileSummary = z.infer<typeof casimirTileSummarySchema>;

// --- Material model selection for Casimir calculations --------------------
export const materialModelSchema = z.enum(["ideal_retarded", "lifshitz_drude", "lifshitz_plasma", "auto"]);
export type MaterialModel = z.infer<typeof materialModelSchema>;

export const materialPropsSchema = z.object({
  plasmaFrequency_eV: z.number().positive().optional(),
  damping_eV: z.number().positive().optional(),
  hamaker_zJ: z.number().positive().optional(),
  roughness_nm: z.number().nonnegative().optional(),
  temperature_K: z.number().positive().optional(),
});
export type MaterialProps = z.infer<typeof materialPropsSchema>;

export const supercellCouplingSchema = z.object({
  tiles: z.number().int().positive(),
  energy_J: z.number().optional(),
  ratio: z.number().nonnegative().max(1).optional(),
});
export type SupercellCoupling = z.infer<typeof supercellCouplingSchema>;

export const couplingCorrectionSchema = z.object({
  chi: z.number().min(0).max(1).optional(),
  pitch_nm: z.number().positive().optional(),
  pitch_um: z.number().positive().optional(),
  pitch_m: z.number().positive().optional(),
  frameFill: z.number().min(0).max(1).optional(),
  packingFraction: z.number().min(0).max(1).optional(),
  supercell: supercellCouplingSchema.optional(),
});
export type CouplingCorrection = z.infer<typeof couplingCorrectionSchema>;

// --- Amplification controls -------------------------------------------------
export const amplificationFactorsSchema = z.object({
  // Geometry amplification from tile layout/curvature; measurable via metrology + fit.
  gammaGeo: z.number().nonnegative().optional(),
  // Van den Broeck pocket compression; hypothesis unless experimentally constrained.
  gammaVanDenBroeck: z.number().nonnegative().optional(),
  // Off-state Q multiplier; measurable via on/off ringdown.
  qSpoilingFactor: z.number().nonnegative().optional(),
  // Mechanical stroke gain (power knob); measurable from actuator calibration.
  qMechanical: z.number().nonnegative().optional(),
  // Cavity Q factor; measurable via linewidth or ringdown.
  qCavity: z.number().nonnegative().optional(),
  // Measured counterparts override design values when supplied.
  measuredGammaGeo: z.number().nonnegative().optional(),
  measuredGammaVanDenBroeck: z.number().nonnegative().optional(),
  measuredQSpoilingFactor: z.number().nonnegative().optional(),
  measuredQMechanical: z.number().nonnegative().optional(),
  measuredCavityQ: z.number().nonnegative().optional(),
});
export type AmplificationFactors = z.infer<typeof amplificationFactorsSchema>;

// --- Experimental inputs -------------------------------------------------
// force_N sign convention: negative values indicate attraction (toward smaller separation).
export const casimirForceDatasetSchema = z
  .object({
    datasetId: z.string().min(1),
    geometry: z.enum(["parallelPlate", "spherePlane"]),
    temperature_K: z.number().positive(),
    separation_m: z.array(z.number().positive()),
    force_N: z.array(z.number().finite()),
    // By default, attraction is negative. Use attractionPositive only with explicit sign handling.
    forceSignConvention: z
      .enum(["attractionNegative", "attractionPositive"])
      .optional(),
    allowForceSignAutoFlip: z.boolean().optional(),
    sigmaForce_N: z.array(z.number().nonnegative()).optional(),
    sigmaSep_m: z.array(z.number().nonnegative()).optional(),
    area_m2: z.number().positive().optional(),
    radius_m: z.number().positive().optional(),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const n = value.separation_m.length;
    if (n < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "casimirForce requires at least 2 separation samples",
        path: ["separation_m"],
      });
    }
    if (value.force_N.length !== n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "force_N must match separation_m length",
        path: ["force_N"],
      });
    }
    if (value.sigmaForce_N && value.sigmaForce_N.length !== n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "sigmaForce_N must match separation_m length",
        path: ["sigmaForce_N"],
      });
    }
    if (value.sigmaSep_m && value.sigmaSep_m.length !== n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "sigmaSep_m must match separation_m length",
        path: ["sigmaSep_m"],
      });
    }
    if (value.geometry === "parallelPlate" && !value.area_m2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "area_m2 is required for parallelPlate datasets",
        path: ["area_m2"],
      });
    }
    if (value.geometry === "spherePlane" && !value.radius_m) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "radius_m is required for spherePlane datasets",
        path: ["radius_m"],
      });
    }
  });
export type CasimirForceDataset = z.infer<typeof casimirForceDatasetSchema>;

export const experimentalSchema = z.object({
  casimirForce: casimirForceDatasetSchema.optional(),
});
export type ExperimentalInputs = z.infer<typeof experimentalSchema>;

// Simulation parameter schemas - Extended for modular Casimir-Tile platform
export const simulationParametersSchema = z.object({
  geometry: z.enum(["sphere", "parallel_plate", "bowl"]),
  gap: z.number().positive().min(0.01).max(1000), // nm
  radius: z.number().positive().min(1).max(100000), // um
  sagDepth: z.number().min(0).max(1000).optional(), // nm, only for bowl geometry (0 = flat surface)
  material: z.enum(["PEC", "custom"]).default("PEC"),
  materialModel: materialModelSchema.default("ideal_retarded"),
  materialProps: materialPropsSchema.optional(),
  temperature: z.number().positive().min(0.1).max(1000).default(20), // K

  // Module system parameters (for future expansion)
  moduleType: z.enum(["static", "dynamic", "array", "warp"]).default("static"),

  // Array module parameters
  arrayConfig: z
    .object({
      size: z.number().int().min(1).max(100).default(1), // N-by-N array
      spacing: z.number().positive().min(1).max(10000).default(1000), // um between tiles
      coherence: z.boolean().default(true), // Include coherent effects
    })
    .optional(),

  // Dynamic module parameters (based on math-gpt.org formulation)
  dynamicConfig: dynamicConfigSchema.optional(),
  // Amplification controls (geometry/Q/Van den Broeck factors + measured overrides)
  ampFactors: amplificationFactorsSchema.optional(),
  warpGeometry: warpGeometrySchema.optional(),
  warpGeometryKind: warpGeometryKindSchema.optional(),
  warpGeometryAssetId: z.string().optional(),
  massMode: z
    .enum(["MODEL_DERIVED", "TARGET_CALIBRATED", "MEASURED_FORCE_INFERRED"])
    .optional(),
  allowMassOverride: z.boolean().optional(),

  // Advanced computational parameters
  advanced: z
    .object({
      xiMin: z.number().positive().default(0.001),
      maxXiPoints: z.number().int().positive().default(10000),
      intervals: z.number().int().positive().default(50),
      absTol: z.number().min(0).default(0),
      relTol: z.number().positive().default(0.01),
    })
    .optional(),
  coupling: couplingCorrectionSchema.optional(),
  experimental: experimentalSchema.optional(),
});

export const simulationResultSchema = z.object({
  id: z.string(),
  parameters: simulationParametersSchema,
  status: z.enum([
    "pending",
    "generating",
    "meshing",
    "calculating",
    "processing",
    "completed",
    "failed",
  ]),
  startTime: z.date(),
  endTime: z.date().optional(),
  results: z
    .object({
      // Static Casimir results
      totalEnergy: z.number().optional(),
      energyPerArea: z.number().optional(),
      force: z.number().optional(),
      convergence: z.string().optional(),
      xiPoints: z.number().int().optional(),
      computeTime: z.string().optional(),
      errorEstimate: z.string().optional(),
      U_static_nominal: z.number().optional(),
      U_static_realistic: z.number().optional(),
      U_static_min: z.number().optional(),
      U_static_max: z.number().optional(),
      casimirModel: materialModelSchema.optional(),
      casimirRatio: z.number().optional(),
      lifshitzSweep: z.array(z.object({ gap_nm: z.number(), ratio: z.number() })).optional(),
      couplingChi: z.number().min(0).max(1).optional(),
      couplingMethod: z.string().optional(),
      supercellRatio: z.number().min(0).max(1).optional(),
      tilePitch_m: z.number().nonnegative().optional(),
      U_static_uncoupled: z.number().optional(),
      adiabaticGuard: z
        .object({
          status: z.enum(["PASS", "WARN", "FAIL", "UNKNOWN"]),
          driveHz: z.number().optional(),
          materialResponseHz: z.number().optional(),
          gapResponseHz: z.number().optional(),
          ratioDriveToMaterial: z.number().optional(),
          ratioDriveToGap: z.number().optional(),
          criteria: z.string().optional(),
          note: z.string().optional(),
        })
        .optional(),

      // Dynamic Casimir results (when moduleType === 'dynamic')
      strokePeriodPs: z.number().optional(),
      dutyFactor: z.number().optional(),
      boostedEnergy: z.number().optional(),
      cycleAverageEnergy: z.number().optional(),
      totalExoticMass: z.number().optional(),
      exoticEnergyDensity: z.number().optional(),
      quantumInequalityMargin: z.number().optional(),
      quantumSafetyStatus: z.enum(["safe", "warning", "violation"]).optional(),
      instantaneousPower: z.number().optional(),
      averagePower: z.number().optional(),
      // Additional power and mass readouts
      averagePowerPerTile: z.number().optional(),
      averagePowerTotalLattice: z.number().optional(),
      exoticMassPerTileDynamic: z.number().optional(),
      exoticMassTotalLattice: z.number().optional(),
      isaacsonLimit: z.boolean().optional(),
      greenWaldCompliance: z.boolean().optional(),
      // Needle Hull / Natário metric support
      stressEnergyT00: z.number().optional(),
      stressEnergyT11: z.number().optional(),
      natarioShiftAmplitude: z.number().optional(),
      sectorStrobingEfficiency: z.number().optional(),
      grValidityCheck: z.boolean().optional(),
      homogenizationRatio: z.number().optional(),
      timeAveragedCurvature: z.number().optional(),

      // Warp bubble results
      geometricBlueshiftFactor: z.number().optional(),
      effectivePathLength: z.number().optional(),
      qEnhancementFactor: z.number().optional(),
      totalAmplificationFactor: z.number().optional(),
      exoticMassPerTile: z.number().optional(),
      timeAveragedMass: z.number().optional(),
      powerDraw: z.number().optional(),
      quantumSafetyStatusWarp: z.enum(["safe", "warning", "violation"]).optional(),
      isZeroExpansion: z.boolean().optional(),
      isCurlFree: z.boolean().optional(),
      expansionScalar: z.number().optional(),
      curlMagnitude: z.number().optional(),
      momentumFlux: z.number().optional(),
      nullEnergyConditionSatisfied: z.boolean().optional(),
    })
    .optional(),
  generatedFiles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        size: z.string(),
        path: z.string(),
        type: z.enum(["scuffgeo", "mesh", "output", "log"]),
      }),
    )
    .default([]),
  logs: z.array(z.string()).default([]),
  error: z.string().optional(),
});

export type SimulationParameters = z.infer<typeof simulationParametersSchema>;
export type SimulationResult = z.infer<typeof simulationResultSchema>;
export type InsertSimulationResult = Omit<SimulationResult, "id">;

const rng = (start: number, stop: number, step: number) => {
  const out: number[] = [];
  if (step === 0) return out;
  const dir = step > 0 ? 1 : -1;
  for (let x = start; dir > 0 ? x <= stop + 1e-12 : x >= stop - 1e-12; x += step) {
    out.push(Number(x.toFixed(9)));
  }
  return out;
};

export const DEFAULT_GEOMETRY_SWEEP: DynamicCasimirSweepConfig = {
  gaps_nm: rng(20, 400, 10),
  mod_depth_pct: [0.1, 0.2, 0.5, 1, 2],
  pump_freq_GHz: "auto",
  phase_deg: rng(-10, 10, 1),
  maxGain_dB: 15,
  minQL: 5e4,
  plateau: { dBDrop: 0.5, maxQLPenaltyPct: 5, minWidth_deg: 1 },
  phaseMicroStep_deg: 0.25,
};

export const DEFAULT_PHASE_MICRO_SWEEP: Pick<DynamicCasimirSweepConfig, "phase_deg" | "phaseMicroStep_deg"> = {
  phase_deg: rng(-2, 2, 0.25),
  phaseMicroStep_deg: 0.25,
};

export const trainingTraceSourceSchema = z.object({
  system: z.string().optional(),
  component: z.string().optional(),
  tool: z.string().optional(),
  version: z.string().optional(),
  proxy: z.boolean().optional(),
});
export type TrainingTraceSource = z.infer<typeof trainingTraceSourceSchema>;

export const policyLadderTierSchema = ladderTierSchema;
export type PolicyLadderTier = z.infer<typeof policyLadderTierSchema>;

export const policyLadderSchema = z.object({
  tier: policyLadderTierSchema,
  policy: z.string().optional(),
  policyVersion: z.string().optional(),
});
export type PolicyLadder = z.infer<typeof policyLadderSchema>;

export const trainingTraceSignalSchema = z.object({
  kind: z.string().optional(),
  proxy: z.boolean().optional(),
  ladder: policyLadderSchema.optional(),
});
export type TrainingTraceSignal = z.infer<typeof trainingTraceSignalSchema>;    

const trainingTraceMetricValueSchema = z.union([
  z.number(),
  z.boolean(),
  z.string(),
  z.null(),
]);

export const trainingTraceMetricsSchema = z.record(
  trainingTraceMetricValueSchema,
);
export type TrainingTraceMetrics = z.infer<typeof trainingTraceMetricsSchema>;

export const trainingTraceDeltaSchema = z.object({
  key: z.string(),
  from: z.number().nullable().optional(),
  to: z.number().nullable().optional(),
  delta: z.number().optional(),
  unit: z.string().optional(),
  change: z.enum(["added", "removed", "changed"]).optional(),
});
export type TrainingTraceDelta = z.infer<typeof trainingTraceDeltaSchema>;

export const trainingTraceConstraintSchema = z.object({
  id: z.string(),
  severity: z.string().optional(),
  status: z.string().optional(),
  value: z.number().nullable().optional(),
  limit: z.string().nullable().optional(),
  note: z.string().optional(),
});
export type TrainingTraceConstraint = z.infer<typeof trainingTraceConstraintSchema>;

export const trainingTraceCertificateSchema = z.object({
  status: z.string().optional(),
  certificateHash: z.string().nullable(),
  certificateId: z.string().nullable().optional(),
  integrityOk: z.boolean().optional(),
  authenticityOk: z.boolean().optional(),
  authenticityRequired: z.boolean().optional(),
  authenticityConsequence: z.enum(["low", "medium", "high"]).optional(),
  authenticityReasonCodes: z.array(z.string()).optional(),
});
export type TrainingTraceCertificate = z.infer<typeof trainingTraceCertificateSchema>;

const predictionObservationValueSchema = z.union([
  z.number(),
  z.array(z.number()),
]);

export const predictionObservationUncertaintySchema = z.object({
  predictionStdDev: z.number().nonnegative().optional(),
  observationStdDev: z.number().nonnegative().optional(),
  combinedStdDev: z.number().nonnegative().optional(),
  intervalLower: z.number().optional(),
  intervalUpper: z.number().optional(),
});
export type PredictionObservationUncertainty = z.infer<
  typeof predictionObservationUncertaintySchema
>;

export const predictionObservationTrendSchema = z.object({
  window: z.string().optional(),
  sampleCount: z.number().int().positive().optional(),
  drift: z.number().optional(),
  bias: z.number().optional(),
  mae: z.number().nonnegative().optional(),
  rmse: z.number().nonnegative().optional(),
  slope: z.number().optional(),
});
export type PredictionObservationTrend = z.infer<typeof predictionObservationTrendSchema>;

export const predictionObservationGateTuningRefSchema = z.object({
  thresholdKey: z.string().optional(),
  trendMetric: z.string().optional(),
  adjustmentHint: z.string().optional(),
});
export type PredictionObservationGateTuningRef = z.infer<
  typeof predictionObservationGateTuningRefSchema
>;

export const predictionObservationLedgerEntrySchema = z.object({
  metric: z.string(),
  prediction: predictionObservationValueSchema,
  observation: predictionObservationValueSchema,
  delta: z.number().optional(),
  absoluteError: z.number().nonnegative().optional(),
  relativeError: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  uncertainty: predictionObservationUncertaintySchema.optional(),
  trend: predictionObservationTrendSchema.optional(),
  gateTuning: predictionObservationGateTuningRefSchema.optional(),
});
export type PredictionObservationLedgerEntry = z.infer<
  typeof predictionObservationLedgerEntrySchema
>;

export const predictionObservationLedgerSchema = z.object({
  kind: z.literal("prediction_vs_observation"),
  version: z.literal(1),
  entries: z.array(predictionObservationLedgerEntrySchema).default([]),
  trendRollup: predictionObservationTrendSchema.optional(),
});
export type PredictionObservationLedger = z.infer<typeof predictionObservationLedgerSchema>;

export const movementEpisodeMetricsSchema = z.object({
  optimism: z.number(),
  entropy: z.number(),
});
export type MovementEpisodeMetrics = z.infer<typeof movementEpisodeMetricsSchema>;

export const movementEpisodePhaseSchema = z.enum([
  "sense",
  "premeditate",
  "act",
  "compare",
]);
export type MovementEpisodePhase = z.infer<typeof movementEpisodePhaseSchema>;

export const movementEpisodeEventSchema = z.object({
  phase: movementEpisodePhaseSchema,
  ts: z.string(),
  candidateId: z.string().optional(),
  controllerRef: z.string().optional(),
  predictedDelta: z.number().optional(),
  actualDelta: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type MovementEpisodeEvent = z.infer<typeof movementEpisodeEventSchema>;

export const movementEpisodePayloadSchema = z.object({
  episodeId: z.string(),
  traceId: z.string().optional(),
  primitivePath: z.array(z.string()).default([]),
  provenanceClass: z.enum(["robotics.demonstration", "robotics.hardware", "robotics.simulation"]),
  sensorChannelCoverage: z.array(z.string()).min(1),
  certificateRefs: z.array(z.string()).min(1),
  metrics: movementEpisodeMetricsSchema,
  events: z.array(movementEpisodeEventSchema).default([]),
  replaySeed: z.string().optional(),
  notes: z.array(z.string()).optional(),
});
export type MovementEpisodePayload = z.infer<typeof movementEpisodePayloadSchema>;

export const replaySummaryProvenanceSchema = z.object({
  provenanceClass: z.enum(["robotics.demonstration", "robotics.hardware", "robotics.simulation"]),
  sensorChannelCoverage: z.array(z.string()).min(1),
  certificateRefs: z.array(z.string()).min(1),
});
export type ReplaySummaryProvenance = z.infer<typeof replaySummaryProvenanceSchema>;

export const trainingTracePayloadSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("trajectory"), data: agiTrajectorySchema }),
  z.object({ kind: z.literal("trajectory_gates"), data: agiGateReportSchema }),
  z.object({
    kind: z.literal("trajectory_replay_summary"),
    data: agiRefinerySummarySchema,
    provenance: replaySummaryProvenanceSchema,
  }),
  z.object({ kind: z.literal("dataset_export"), data: agiDatasetExportSchema }),
  z.object({ kind: z.literal("movement_episode"), data: movementEpisodePayloadSchema }),
]);
export type TrainingTracePayload = z.infer<typeof trainingTracePayloadSchema>;

export const trainingTraceSchema = z.object({
  kind: z.literal("training-trace"),
  version: z.number().int().positive(),
  id: z.string(),
  seq: z.number().int().nonnegative(),
  ts: z.string(),
  traceId: z.string().optional(),
  tenantId: z.string().optional(),
  source: trainingTraceSourceSchema.optional(),
  signal: trainingTraceSignalSchema.optional(),
  pass: z.boolean(),
  deltas: z.array(trainingTraceDeltaSchema),
  metrics: trainingTraceMetricsSchema.optional(),
  firstFail: trainingTraceConstraintSchema.optional(),
  certificate: trainingTraceCertificateSchema.optional(),
  predictionObservationLedger: predictionObservationLedgerSchema.optional(),
  payload: trainingTracePayloadSchema.optional(),
  notes: z.array(z.string()).optional(),
});
export type TrainingTraceRecord = z.infer<typeof trainingTraceSchema>;

export const adapterActionSchema = z
  .object({
    id: z.string().optional(),
    kind: z.string().optional(),
    label: z.string().optional(),
    params: z.record(z.unknown()).optional(),
    note: z.string().optional(),
  })
  .passthrough();
export type AdapterAction = z.infer<typeof adapterActionSchema>;

export const adapterBudgetSchema = z.object({
  maxIterations: z.number().int().positive().max(50).optional(),
  maxTotalMs: z.number().nonnegative().optional(),
  maxAttemptMs: z.number().nonnegative().optional(),
});
export type AdapterBudget = z.infer<typeof adapterBudgetSchema>;

export const adapterCertificateAuthenticityConsequenceSchema = z.enum(["low", "medium", "high"]);
export type AdapterCertificateAuthenticityConsequence = z.infer<typeof adapterCertificateAuthenticityConsequenceSchema>;

export const adapterCertificateAuthenticityPolicySchema = z.object({
  consequence: z.enum(["low", "medium", "high"]).optional(),
  required: z.boolean().optional(),
  trustedSignerKeyIds: z.array(z.string()).optional(),
});
export type AdapterCertificateAuthenticityPolicy = z.infer<typeof adapterCertificateAuthenticityPolicySchema>;

export const adapterPolicySchema = z.object({
  thresholds: grConstraintThresholdSchema.partial().optional(),
  gate: grConstraintPolicySchema.partial().optional(),
  authenticity: adapterCertificateAuthenticityPolicySchema.optional(),
});
export type AdapterPolicy = z.infer<typeof adapterPolicySchema>;

const adapterMetricValueSchema = z.union([
  z.number(),
  z.boolean(),
  z.string(),
  z.null(),
]);

const adapterMetricsSchema = z.record(adapterMetricValueSchema).optional();

export const adapterModeSchema = z.enum(["gr", "constraint-pack"]);
export type AdapterMode = z.infer<typeof adapterModeSchema>;

export const adapterConstraintPackSchema = z.object({
  id: z.string(),
  customerId: z.string().optional(),
  policyProfileId: z.string().optional(),
  policyOverride: z.lazy(() => constraintPackOverrideInputSchema).optional(),
  telemetry: z.record(z.unknown()).optional(),
  metrics: adapterMetricsSchema,
  certificate: z.lazy(() => constraintPackCertificateResultSchema).optional(),
  deltas: z.array(trainingTraceDeltaSchema).optional(),
  notes: z.array(z.string()).optional(),
  proxy: z.boolean().optional(),
  ladderTier: policyLadderTierSchema.optional(),
  autoTelemetry: z.boolean().optional(),
  telemetryPath: z.string().optional(),
  junitPath: z.string().optional(),
  vitestPath: z.string().optional(),
  jestPath: z.string().optional(),
  eslintPath: z.string().optional(),
  tscPath: z.string().optional(),
  toolLogTraceId: z.string().optional(),
  toolLogWindowMs: z.number().optional(),
  toolLogLimit: z.number().optional(),
});
export type AdapterConstraintPack = z.infer<typeof adapterConstraintPackSchema>;



export const adapterPremeditationCandidateSchema = z.object({
  id: z.string(),
  valueLongevity: z.number(),
  risk: z.number().nonnegative(),
  entropy: z.number().nonnegative(),
  ideologyAlignment: z.number().min(0).max(1).optional(),
  coherenceAlignment: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
});
export type AdapterPremeditationCandidate = z.infer<typeof adapterPremeditationCandidateSchema>;

export const adapterPremeditationInputSchema = z.object({
  candidates: z.array(adapterPremeditationCandidateSchema).min(1),
  lambda: z.number().nonnegative().default(1),
  mu: z.number().nonnegative().default(1),
  ideologyWeight: z.number().nonnegative().default(0),
  coherenceWeight: z.number().nonnegative().default(0),
});
export type AdapterPremeditationInput = z.infer<typeof adapterPremeditationInputSchema>;

export const adapterPremeditationScoredCandidateSchema = z.object({
  id: z.string(),
  score: z.number(),
  optimism: z.number(),
  entropy: z.number(),
  rationaleTags: z.array(z.string()),
});
export type AdapterPremeditationScoredCandidate = z.infer<typeof adapterPremeditationScoredCandidateSchema>;

export const adapterPremeditationResultSchema = z.object({
  chosenCandidateId: z.string().optional(),
  optimism: z.number(),
  entropy: z.number(),
  rationaleTags: z.array(z.string()),
  scores: z.array(adapterPremeditationScoredCandidateSchema),
});
export type AdapterPremeditationResult = z.infer<typeof adapterPremeditationResultSchema>;



export const adapterRoboticsSafetySchema = z.object({
  collisionMargin_m: z.number(),
  collisionMarginMin_m: z.number().nonnegative(),
  torqueUsageRatio: z.number(),
  torqueUsageMax: z.number().positive(),
  speedUsageRatio: z.number(),
  speedUsageMax: z.number().positive(),
  stabilityMargin: z.number(),
  stabilityMarginMin: z.number(),
  certificateHash: z.string().nullable().optional(),
  integrityOk: z.boolean().optional(),
  signature: z.string().optional(),
  signer: z.object({
    keyId: z.string(),
  }).optional(),
});
export type AdapterRoboticsSafety = z.infer<typeof adapterRoboticsSafetySchema>;

export const adapterArtifactRefSchema = z.object({
  kind: z.string(),
  ref: z.string(),
  label: z.string().optional(),
});
export type AdapterArtifactRef = z.infer<typeof adapterArtifactRefSchema>;

export const adapterRunRequestSchema = z.object({
  traceId: z.string().optional(),
  mode: adapterModeSchema.optional(),
  pack: adapterConstraintPackSchema.optional(),
  actions: z.array(adapterActionSchema).min(1).optional(),
  budget: adapterBudgetSchema.optional(),
  policy: adapterPolicySchema.optional(),
  premeditation: adapterPremeditationInputSchema.optional(),
  roboticsSafety: adapterRoboticsSafetySchema.optional(),
});
export type AdapterRunRequest = z.infer<typeof adapterRunRequestSchema>;

export const adapterRunResponseSchema = z.object({
  traceId: z.string().optional(),
  runId: z.string(),
  verdict: z.enum(["PASS", "FAIL"]),
  pass: z.boolean(),
  firstFail: trainingTraceConstraintSchema.nullable().optional(),
  deltas: z.array(trainingTraceDeltaSchema),
  certificate: z.lazy(() => constraintPackCertificateResultSchema).nullable().optional(),
  premeditation: adapterPremeditationResultSchema.optional(),
  artifacts: z.array(adapterArtifactRefSchema),
});
export type AdapterRunResponse = z.infer<typeof adapterRunResponseSchema>;

export const constraintPackPolicySchema = z.object({
  mode: z.enum(["all", "hard-only"]).default("hard-only"),
  unknownAsFail: z.boolean().default(true),
  minLadderTier: policyLadderTierSchema.optional(),
});
export type ConstraintPackPolicy = z.infer<typeof constraintPackPolicySchema>;

export const constraintPackCertificatePolicySchema = z.object({
  issuer: z.string().optional(),
  admissibleStatus: z.string(),
  allowMarginalAsViable: z.boolean(),
  treatMissingCertificateAsNotCertified: z.boolean(),
});
export type ConstraintPackCertificatePolicy = z.infer<
  typeof constraintPackCertificatePolicySchema
>;

export const constraintPackConstraintSchema = z.object({
  id: z.string(),
  severity: z.enum(["HARD", "SOFT"]),
  description: z.string().optional(),
  metric: z.string().optional(),
  op: z.string().optional(),
  limit: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  units: z.string().optional(),
  source: z.string().optional(),
  proxy: z.boolean().optional(),
  note: z.string().optional(),
});
export type ConstraintPackConstraint = z.infer<
  typeof constraintPackConstraintSchema
>;

export const constraintPackConstraintOverrideSchema = z.object({
  id: z.string(),
  severity: z.enum(["HARD", "SOFT"]).optional(),
  description: z.string().optional(),
  op: z.string().optional(),
  limit: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  proxy: z.boolean().optional(),
  note: z.string().optional(),
});
export type ConstraintPackConstraintOverride = z.infer<
  typeof constraintPackConstraintOverrideSchema
>;

export const constraintPackOverrideSchema = z.object({
  packId: z.string(),
  policy: constraintPackPolicySchema.partial().optional(),
  certificate: constraintPackCertificatePolicySchema.partial().optional(),
  constraints: z.array(constraintPackConstraintOverrideSchema).optional(),
  proxies: z.array(constraintPackConstraintOverrideSchema).optional(),
});
export type ConstraintPackOverride = z.infer<typeof constraintPackOverrideSchema>;

export const constraintPackOverrideInputSchema =
  constraintPackOverrideSchema.extend({
    packId: z.string().optional(),
  });
export type ConstraintPackOverrideInput = z.infer<
  typeof constraintPackOverrideInputSchema
>;

export const constraintPackSchema = z.object({
  id: z.string(),
  domain: z.string(),
  version: z.number().int().positive(),
  description: z.string().optional(),
  signalKinds: z.object({
    diagnostic: z.string(),
    certified: z.string(),
  }),
  policy: constraintPackPolicySchema,
  certificate: constraintPackCertificatePolicySchema,
  constraints: z.array(constraintPackConstraintSchema),
  proxies: z.array(constraintPackConstraintSchema).optional(),
  traceMapping: z
    .object({
      passRule: z.string().optional(),
      firstFailRule: z.string().optional(),
      signalKindRule: z
        .object({
          certified: z.string().optional(),
          diagnostic: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  artifacts: z
    .object({
      metricsRef: z.string().optional(),
      reportRef: z.string().optional(),
    })
    .optional(),
});
export type ConstraintPack = z.infer<typeof constraintPackSchema>;

export const constraintPackPolicyProfileSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  version: z.number().int().positive(),
  packs: z.array(constraintPackOverrideSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ConstraintPackPolicyProfile = z.infer<
  typeof constraintPackPolicyProfileSchema
>;

export const constraintPackPolicyProfileInputSchema = z.object({
  id: z.string().optional(),
  customerId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  version: z.number().int().positive().optional(),
  packs: z.array(constraintPackOverrideSchema).min(1),
});
export type ConstraintPackPolicyProfileInput = z.infer<
  typeof constraintPackPolicyProfileInputSchema
>;

export const constraintPackConstraintResultSchema = z.object({
  id: z.string(),
  severity: z.enum(["HARD", "SOFT"]).optional(),
  status: z.enum(["pass", "fail", "unknown"]).optional(),
  value: z.number().nullable().optional(),
  limit: z.union([z.string(), z.number()]).nullable().optional(),
  proxy: z.boolean().optional(),
  note: z.string().optional(),
});
export type ConstraintPackConstraintResult = z.infer<
  typeof constraintPackConstraintResultSchema
>;

export const constraintPackCertificateResultSchema = z.object({
  status: z.string().optional(),
  certificateHash: z.string().nullable().optional(),
  certificateId: z.string().nullable().optional(),
  integrityOk: z.boolean().optional(),
  authenticityOk: z.boolean().optional(),
  authenticityRequired: z.boolean().optional(),
  authenticityConsequence: z.enum(["low", "medium", "high"]).optional(),
  authenticityReasonCodes: z.array(z.string()).optional(),
});
export type ConstraintPackCertificateResult = z.infer<
  typeof constraintPackCertificateResultSchema
>;

export const constraintPackEvaluationSchema = z.object({
  pass: z.boolean().optional(),
  constraints: z.array(constraintPackConstraintResultSchema).optional(),        
  certificate: constraintPackCertificateResultSchema.optional(),
  deltas: z.array(trainingTraceDeltaSchema).optional(),
  firstFail: constraintPackConstraintResultSchema.optional(),
  notes: z.array(z.string()).optional(),
  proxy: z.boolean().optional(),
  ladderTier: policyLadderTierSchema.optional(),
});
export type ConstraintPackEvaluation = z.infer<
  typeof constraintPackEvaluationSchema
>;
