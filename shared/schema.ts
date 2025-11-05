import { z } from "zod";

export const sweepGeometrySchema = z.enum(["parallel_plate", "cpw"]);
export type SweepGeometry = z.infer<typeof sweepGeometrySchema>;

export type Radians = number;
export type Degrees = number;

export const gateKindSchema = z.enum(["AND", "OR", "NOT", "MUX", "DEMUX"]);
export type GateKind = z.infer<typeof gateKindSchema>;

export const gateRouteRoleSchema = z.enum(["BUS", "SINK"]);
export type GateRouteRole = z.infer<typeof gateRouteRoleSchema>;

export const samplingKindSchema = z.enum(["gaussian", "lorentzian"]);
export type SamplingKind = z.infer<typeof samplingKindSchema>;

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
});
export type QiSettings = z.infer<typeof qiSettingsSchema>;

export const qiStatsSchema = z.object({
  sampler: samplingKindSchema,
  tau_s_ms: z.number().positive(),
  observerId: z.string(),
  dt_ms: z.number().positive(),
  avg: z.number(),
  bound: z.number(),
  margin: z.number(),
  window_ms: z.number().nonnegative(),
  samples: z.number().int().nonnegative(),
});
export type QiStats = z.infer<typeof qiStatsSchema>;

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
  dwell_ms: z.coerce.number().nonnegative().optional(),
  burst_ms: z.coerce.number().nonnegative().optional(),
  strobeHz: z.coerce.number().nonnegative().optional(),
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
  modulationFreqGHz: z.number().positive().min(0.1).max(100).default(15), // GHz (f_m)
  strokeAmplitudePm: z.number().positive().min(0.1).max(1000).default(50), // pm (delta a)
  burstLengthUs: z.number().positive().min(0.1).max(1000).default(10), // microseconds (t_burst)
  cycleLengthUs: z.number().positive().min(1).max(10000).default(1000), // microseconds (t_cycle)
  cavityQ: z.number().positive().min(1e3).max(1e12).default(1e9), // Q factor
  gateSchedule: z.array(gatePulseSchema).optional(),
  gateRouting: z.array(gateRouteSchema).optional(),
  // Needle Hull sector strobing parameters
  sectorCount: z.number().int().positive().min(1).max(1000).default(400), // Number of sectors
  sectorDuty: z.number().positive().min(1e-6).max(1).default(2.5e-5), // Ship-wide duty factor
  pulseFrequencyGHz: z.number().positive().min(0.1).max(100).default(15), // Pulse frequency
  lightCrossingTimeNs: z.number().positive().min(1).max(1000).default(100), // Light crossing time
  // Warp field parameters
  shiftAmplitude: z.number().positive().min(1e-15).max(1e-9).default(50e-12), // m (shift amplitude)
  expansionTolerance: z.number().positive().min(1e-15).max(1e-6).default(1e-12), // Zero-expansion tolerance
  warpFieldType: z.enum(["natario", "alcubierre"]).default("natario"), // Warp field type
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

// Simulation parameter schemas - Extended for modular Casimir-Tile platform
export const simulationParametersSchema = z.object({
  geometry: z.enum(["sphere", "parallel_plate", "bowl"]),
  gap: z.number().positive().min(0.01).max(1000), // nm
  radius: z.number().positive().min(1).max(100000), // um
  sagDepth: z.number().min(0).max(1000).optional(), // nm, only for bowl geometry (0 = flat surface)
  material: z.enum(["PEC", "custom"]).default("PEC"),
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
