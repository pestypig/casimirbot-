import { promises as fs } from "fs";
import path from "path";
import type { VacuumGapSweepRow } from "../../shared/schema.js";

export interface PhaseCalibrationConfig {
  tile_area_cm2: number;
  ship_radius_m: number;
  P_target_W: number;   // e.g. pipeline P_avg_W
  M_target_kg: number;  // e.g. 1400
  zeta_target: number;  // e.g. 0.5
  // Additional context for Python side
  timestamp: string;
  source: string;       // "energy_pipeline" | "mode_change" | "manual"
}

export async function writePhaseCalibration(config: Omit<PhaseCalibrationConfig, 'timestamp' | 'source'>, source = 'energy_pipeline'): Promise<void> {
  const calibPath = process.env.HELIX_PHASE_CALIB_JSON ?? path.join(process.cwd(), "sim_core", "phase_calibration.json");
  
  const calibData: PhaseCalibrationConfig = {
    ...config,
    timestamp: new Date().toISOString(),
    source
  };

  try {
    await fs.mkdir(path.dirname(calibPath), { recursive: true });
    await fs.writeFile(calibPath, JSON.stringify(calibData, null, 2), "utf8");
    console.log(`[PHASE-CALIB] Written calibration: P=${(config.P_target_W/1e6).toFixed(1)}MW, M=${config.M_target_kg}kg`);
  } catch (error) {
    console.error("[PHASE-CALIB] Failed to write calibration:", error);
  }
}

export async function readPhaseCalibration(): Promise<PhaseCalibrationConfig | null> {
  const calibPath = process.env.HELIX_PHASE_CALIB_JSON ?? path.join(process.cwd(), "sim_core", "phase_calibration.json");
  
  try {
    const data = await fs.readFile(calibPath, "utf8");
    return JSON.parse(data) as PhaseCalibrationConfig;
  } catch (error) {
    // File doesn't exist or is invalid - that's OK, use defaults
    return null;
  }
}

/**
 * Append pump-bias snapshots plus a subset of sweep rows for offline analysis.
 * Records are stored as JSONL under .cal/phase-calibration-log.jsonl by default.
 */
export async function appendPhaseCalibrationLog(payload: {
  phase_deg_set: number;
  pump_freq_GHz?: number;
  rows?: VacuumGapSweepRow[];
  meta?: Record<string, unknown>;
}): Promise<void> {
  const dir = process.env.PHASE_CAL_DIR || ".cal";
  const file = path.join(dir, "phase-calibration-log.jsonl");
  await fs.mkdir(dir, { recursive: true });
  const record = {
    t: new Date().toISOString(),
    phase_deg_set: payload.phase_deg_set,
    pump_freq_GHz: payload.pump_freq_GHz,
    rows: (payload.rows ?? []).map((row) => ({
      ...row,
      QL: Number.isFinite(row.QL) ? Number(row.QL) : null,
      G: Number.isFinite(row.G) ? Number(row.G) : null,
    })),
    meta: payload.meta ?? {},
  };
  await fs.appendFile(file, JSON.stringify(record) + "\n", "utf8");
}

export type PhaseBiasKey = {
  T_K_bin: number;
  Ppump_dBm_bin: number;
  d_nm: number;
  m: number;
  Omega_GHz: number;
};

export type PhaseBiasEntry = PhaseBiasKey & {
  phi_star_deg: number;
  width_deg: number;
  G_ref_dB: number;
  Q_penalty_pct: number;
  samples: number;
};

const binByStep = (value: number, step: number) =>
  step > 0 ? Math.round(value / step) * step : value;

export function reducePhaseCalLogToLookup(
  rows: VacuumGapSweepRow[],
  env: { T_K?: number; Ppump_dBm?: number },
  opts: { T_step?: number; P_step?: number } = {},
): PhaseBiasEntry[] {
  const T_step = opts.T_step ?? 0.1;
  const P_step = opts.P_step ?? 0.5;
  const Tbin = binByStep(env.T_K ?? 2, T_step);
  const Pbin = binByStep(env.Ppump_dBm ?? -20, P_step);

  const byKey = new Map<string, PhaseBiasEntry>();

  for (const row of rows) {
    if (!row.crest || !row.plateau) continue;
    const key: PhaseBiasKey = {
      T_K_bin: Tbin,
      Ppump_dBm_bin: Pbin,
      d_nm: row.d_nm,
      m: row.m,
      Omega_GHz: row.Omega_GHz,
    };
    const keyStr = `${key.T_K_bin}|${key.Ppump_dBm_bin}|${key.d_nm}|${key.m}|${key.Omega_GHz}`;
    const existing = byKey.get(keyStr);
    const entry: PhaseBiasEntry = existing
      ? {
          ...existing,
          phi_star_deg: (existing.phi_star_deg * existing.samples + row.phi_deg) / (existing.samples + 1),
          width_deg:
            (existing.width_deg * existing.samples + row.plateau.width_deg) / (existing.samples + 1),
          G_ref_dB:
            (existing.G_ref_dB * existing.samples + row.plateau.G_ref_dB) / (existing.samples + 1),
          Q_penalty_pct:
            (existing.Q_penalty_pct * existing.samples + row.plateau.Q_penalty_pct) /
            (existing.samples + 1),
          samples: existing.samples + 1,
        }
      : {
          ...key,
          phi_star_deg: row.phi_deg,
          width_deg: row.plateau.width_deg,
          G_ref_dB: row.plateau.G_ref_dB,
          Q_penalty_pct: row.plateau.Q_penalty_pct,
          samples: 1,
        };
    byKey.set(keyStr, entry);
  }

  return Array.from(byKey.values());
}
