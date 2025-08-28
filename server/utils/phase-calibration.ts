import { promises as fs } from "fs";
import path from "path";

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