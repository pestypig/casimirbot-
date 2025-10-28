import { create, type StateCreator } from "zustand";

export type HullSamplingWindowKey = "instant" | "tauLC" | "burst" | "sector";

export interface HullSamplingWindowState {
  key: HullSamplingWindowKey;
  label: string;
  durationMs?: number;
  provenance?: string;
}

export type HullPhaseSource = "time" | "scroll" | "server" | "metrics" | "bus";

export interface HullPhaseBusState {
  mode: "time" | "scroll" | "auto";
  source: HullPhaseSource;
  phase01: number;
  phaseCont: number;
  sign: 1 | -1;
  wedgeIndex: number;
  nextWedgeIndex: number;
  dutyWindow?: [number, number];
  damp: number;
  updatedAt: number;
}

export interface HullPhysicsScaleState {
  locked: boolean;
  thetaExpected?: number;
  thetaUsed?: number;
  ratio?: number;
  trimDb: number;
  yGain: number;
  kColor: number;
  analyticPeak?: number;
  tailPeak?: number;
  updatedAt: number;
}

export interface HullReciprocityState {
  tauLC_ms?: number;
  burst_ms?: number;
  dwell_ms?: number;
  ratio?: number;
  status: "pass" | "warn" | "unknown";
}

export interface HullZetaState {
  value?: number;
  limit?: number;
  status: "pass" | "warn" | "limit" | "unknown";
}

export interface HullComplianceState {
  reciprocity: HullReciprocityState;
  zeta: HullZetaState;
}

export interface HullSectorDebugState {
  weightsInstant: Float32Array;
  weightsAverage: Float32Array;
  sqrtBoost: Float32Array;
  betaSign: 1 | -1;
  activeIndex: number;
  nextIndex: number;
  dutyWindow?: [number, number];
}

export type HullPaletteId = "diverging" | "purple" | "colorblind";

export interface HullPaletteState {
  id: HullPaletteId;
  encodeSectorHue: boolean;
  encodeBetaSign: boolean;
  legend: boolean;
}

export type SectorGrid3DMode = "shell" | "extruded";

export interface SectorGrid3DConfig {
  enabled: boolean;
  mode: SectorGrid3DMode;
  mixEMA: number;
  alpha: number;
  activeBoost: number;
  edgeSoftness: number;
  shellR0: number;
  shellR1: number;
  rInner: number;
  rOuter: number;
  halfHeight: number;
}

export interface HullOverlayConfig {
  sectorGrid3D: SectorGrid3DConfig;
}

export interface Hull3DSharedState {
  phase: HullPhaseBusState;
  sampling: HullSamplingWindowState;
  physics: HullPhysicsScaleState;
  compliance: HullComplianceState;
  sector: HullSectorDebugState;
  palette: HullPaletteState;
  overlays: HullOverlayConfig;
  setPhase: (next: Partial<HullPhaseBusState>) => void;
  setSampling: (next: Partial<HullSamplingWindowState>) => void;
  setPhysics: (next: Partial<HullPhysicsScaleState>) => void;
  setCompliance: (next: Partial<HullComplianceState>) => void;
  setSector: (next: Partial<HullSectorDebugState>) => void;
  setPalette: (next: Partial<HullPaletteState>) => void;
  setSectorGrid3D: (
    next:
      | Partial<SectorGrid3DConfig>
      | ((current: SectorGrid3DConfig) => SectorGrid3DConfig)
  ) => void;
  togglePhysicsLock: (locked?: boolean) => void;
  trimPhysicsDb: (deltaDb: number) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const creator: StateCreator<Hull3DSharedState> = (set) => ({
  phase: {
    mode: "auto",
    source: "time",
    phase01: 0,
    phaseCont: 0,
    sign: 1,
    wedgeIndex: 0,
    nextWedgeIndex: 1,
    damp: 0.15,
    updatedAt: 0,
  },
  sampling: {
    key: "instant",
    label: "Instant",
    durationMs: 0,
    provenance: "Instantaneous sample",
  },
  physics: {
    locked: true,
    thetaExpected: undefined,
    thetaUsed: undefined,
    ratio: undefined,
    trimDb: 0,
    yGain: 1,
    kColor: 1,
    analyticPeak: undefined,
    tailPeak: undefined,
    updatedAt: 0,
  },
  compliance: {
    reciprocity: { status: "unknown" },
    zeta: { status: "unknown" },
  },
  sector: {
    weightsInstant: new Float32Array(0),
    weightsAverage: new Float32Array(0),
    sqrtBoost: new Float32Array(0),
    betaSign: 1,
    activeIndex: 0,
    nextIndex: 1,
  },
  palette: {
    id: "diverging",
    encodeSectorHue: false,
    encodeBetaSign: true,
    legend: true,
  },
  overlays: {
    sectorGrid3D: {
      enabled: true,
      mode: "shell",
      mixEMA: 0.65,
      alpha: 0.24,
      activeBoost: 0.35,
      edgeSoftness: 0.18,
      shellR0: 1.0,
      shellR1: 1.035,
      rInner: 0.985,
      rOuter: 1.045,
      halfHeight: 0.055,
    },
  },
  setPhase: (next) =>
    set((state) => ({
      phase: {
        ...state.phase,
        ...next,
        phase01: clamp(
          typeof next.phase01 === "number" ? next.phase01 : state.phase.phase01,
          0,
          1
        ),
        sign:
          typeof next.sign === "number"
            ? (next.sign >= 0 ? 1 : -1)
            : state.phase.sign,
        updatedAt: next.updatedAt ?? Date.now(),
      },
    })),
  setSampling: (next) =>
    set((state) => ({
      sampling: {
        ...state.sampling,
        ...next,
      },
    })),
  setPhysics: (next) =>
    set((state) => {
      const locked =
        typeof next.locked === "boolean" ? next.locked : state.physics.locked;
      const trimDb =
        typeof next.trimDb === "number" ? clamp(next.trimDb, -24, 24) : state.physics.trimDb;
      const ratio =
        typeof next.ratio === "number"
          ? next.ratio
          : state.physics.ratio;
      return {
        physics: {
          ...state.physics,
          ...next,
          locked,
          trimDb,
          ratio,
          updatedAt: next.updatedAt ?? Date.now(),
        },
      };
    }),
  setCompliance: (next) =>
    set((state) => ({
      compliance: {
        reciprocity: {
          ...state.compliance.reciprocity,
          ...(next.reciprocity ?? {}),
        },
        zeta: {
          ...state.compliance.zeta,
          ...(next.zeta ?? {}),
        },
      },
    })),
  setSector: (next) =>
    set((state) => ({
      sector: {
        ...state.sector,
        ...next,
        betaSign:
          typeof next.betaSign === "number"
            ? (next.betaSign >= 0 ? 1 : -1)
            : state.sector.betaSign,
      },
    })),
  setPalette: (next) =>
    set((state) => ({
      palette: {
        ...state.palette,
        ...next,
      },
    })),
  setSectorGrid3D: (next) =>
    set((state) => {
      const current = state.overlays.sectorGrid3D;
      const updated: SectorGrid3DConfig =
        typeof next === "function"
          ? (next as (curr: SectorGrid3DConfig) => SectorGrid3DConfig)(current)
          : ({ ...current, ...next } as SectorGrid3DConfig);

      return {
        overlays: {
          ...state.overlays,
          sectorGrid3D: updated,
        },
      };
    }),
  togglePhysicsLock: (locked) =>
    set((state) => ({
      physics: {
        ...state.physics,
        locked: typeof locked === "boolean" ? locked : !state.physics.locked,
        updatedAt: Date.now(),
      },
    })),
  trimPhysicsDb: (deltaDb) =>
    set((state) => ({
      physics: {
        ...state.physics,
        trimDb: clamp(state.physics.trimDb + deltaDb, -24, 24),
        updatedAt: Date.now(),
      },
    })),
});

export const useHull3DSharedStore = create<Hull3DSharedState>(creator);
