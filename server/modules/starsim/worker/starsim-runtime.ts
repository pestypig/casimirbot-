import fs from "node:fs/promises";
import path from "node:path";
import type { CanonicalStar } from "../contract";
import type {
  OscillationGyreWorkerResult,
  StarSimExternalRuntimeKind,
  StructureMesaWorkerResult,
} from "./starsim-worker-types";

type SolverName = "mesa" | "gyre";

export interface StarSimSolverRuntimeConfig {
  solver: SolverName;
  runtime_kind: StarSimExternalRuntimeKind;
  image: string | null;
  executable: boolean;
}

type FixturePayload = Record<string, unknown>;

const resolveRuntimeKind = (solver: SolverName): StarSimExternalRuntimeKind => {
  const envName = solver === "mesa" ? "STAR_SIM_MESA_RUNTIME" : "STAR_SIM_GYRE_RUNTIME";
  const value = process.env[envName]?.trim().toLowerCase();
  switch (value) {
    case "mock":
    case "docker":
    case "wsl":
    case "disabled":
      return value;
    default:
      return "disabled";
  }
};

export const resolveStarSimSolverRuntime = (solver: SolverName): StarSimSolverRuntimeConfig => {
  const runtimeKind = resolveRuntimeKind(solver);
  const imageEnv = solver === "mesa" ? "STAR_SIM_MESA_IMAGE" : "STAR_SIM_GYRE_IMAGE";
  return {
    solver,
    runtime_kind: runtimeKind,
    image: process.env[imageEnv]?.trim() || null,
    executable: runtimeKind !== "disabled",
  };
};

const resolveFixturePath = (solver: SolverName, fixtureId: string): string =>
  path.resolve(process.cwd(), "tests", "fixtures", "starsim", solver, `${fixtureId}.json`);

const loadFixture = async (solver: SolverName, fixtureId: string): Promise<FixturePayload> => {
  const raw = await fs.readFile(resolveFixturePath(solver, fixtureId), "utf8");
  return JSON.parse(raw) as FixturePayload;
};

const isGTypeMainSequence = (star: CanonicalStar): boolean => {
  const teff = star.fields.spectroscopy.teff_K.value;
  const logg = star.fields.spectroscopy.logg_cgs.value;
  const spectral = star.target.spectral_type?.toUpperCase() ?? "";
  return (
    spectral.startsWith("G")
    || (typeof teff === "number" && teff >= 5_200 && teff <= 6_100)
    || (typeof teff === "number" && typeof logg === "number" && teff >= 5_000 && teff <= 6_300 && logg >= 4)
  );
};

const usesSeismicConstraints = (star: CanonicalStar): boolean =>
  typeof star.fields.asteroseismology.numax_uHz.value === "number"
  || typeof star.fields.asteroseismology.deltanu_uHz.value === "number"
  || typeof star.fields.asteroseismology.mode_count.value === "number";

const selectMesaFixtureId = (star: CanonicalStar): string | null => {
  if (star.target.is_solar_calibrator) {
    return "solar-calibration";
  }
  if (isGTypeMainSequence(star)) {
    return "g-type-main-sequence";
  }
  return null;
};

const selectGyreFixtureId = (star: CanonicalStar): string | null => {
  if (star.target.is_solar_calibrator) {
    return "solar-astero";
  }
  if (isGTypeMainSequence(star)) {
    return "g-type-astero";
  }
  return null;
};

export const canMockStructureMesa = (star: CanonicalStar): boolean => selectMesaFixtureId(star) !== null;
export const canMockOscillationGyre = (star: CanonicalStar): boolean => selectGyreFixtureId(star) !== null;

export async function executeStructureMesaRuntime(star: CanonicalStar): Promise<StructureMesaWorkerResult> {
  const runtime = resolveStarSimSolverRuntime("mesa");
  if (runtime.runtime_kind === "disabled") {
    throw new Error("structure_mesa_runtime_disabled");
  }
  if (runtime.runtime_kind === "docker" || runtime.runtime_kind === "wsl") {
    throw new Error(`structure_mesa_runtime_unimplemented:${runtime.runtime_kind}`);
  }

  const fixtureId = selectMesaFixtureId(star);
  if (!fixtureId) {
    throw new Error("structure_mesa_mock_out_of_domain");
  }

  const fixture = await loadFixture("mesa", fixtureId);
  return {
    runtime_kind: "mock",
    solver_version: String(fixture.solver_version ?? "mesa.mock/1"),
    benchmark_case_id: typeof fixture.benchmark_case_id === "string" ? fixture.benchmark_case_id : null,
    fixture_id: fixtureId,
    used_seismic_constraints: usesSeismicConstraints(star),
    evidence_fit: typeof fixture.evidence_fit === "number" ? fixture.evidence_fit : 0.85,
    structure_summary:
      typeof fixture.structure_summary === "object" && fixture.structure_summary
        ? (fixture.structure_summary as Record<string, unknown>)
        : {},
    synthetic_observables:
      typeof fixture.synthetic_observables === "object" && fixture.synthetic_observables
        ? (fixture.synthetic_observables as Record<string, unknown>)
        : {},
    inferred_params:
      typeof fixture.inferred_params === "object" && fixture.inferred_params
        ? (fixture.inferred_params as Record<string, unknown>)
        : {},
    residuals_sigma:
      typeof fixture.residuals_sigma === "object" && fixture.residuals_sigma
        ? (fixture.residuals_sigma as Record<string, number>)
        : {},
    domain_validity:
      typeof fixture.domain_validity === "object" && fixture.domain_validity
        ? (fixture.domain_validity as Record<string, unknown>)
        : {},
    model_placeholder: {
      kind: "gsm_hdf5_placeholder",
      solver: "mesa",
      fixture_id: fixtureId,
      note: "Mock runtime placeholder for a future MESA GSM HDF5 model artifact.",
    },
  };
}

export async function executeOscillationGyreRuntime(star: CanonicalStar): Promise<OscillationGyreWorkerResult> {
  const runtime = resolveStarSimSolverRuntime("gyre");
  if (runtime.runtime_kind === "disabled") {
    throw new Error("oscillation_gyre_runtime_disabled");
  }
  if (runtime.runtime_kind === "docker" || runtime.runtime_kind === "wsl") {
    throw new Error(`oscillation_gyre_runtime_unimplemented:${runtime.runtime_kind}`);
  }

  const fixtureId = selectGyreFixtureId(star);
  if (!fixtureId) {
    throw new Error("oscillation_gyre_mock_out_of_domain");
  }

  const fixture = await loadFixture("gyre", fixtureId);
  return {
    runtime_kind: "mock",
    solver_version: String(fixture.solver_version ?? "gyre.mock/1"),
    benchmark_case_id: typeof fixture.benchmark_case_id === "string" ? fixture.benchmark_case_id : null,
    fixture_id: fixtureId,
    evidence_fit: typeof fixture.evidence_fit === "number" ? fixture.evidence_fit : 0.82,
    mode_summary:
      typeof fixture.mode_summary === "object" && fixture.mode_summary
        ? (fixture.mode_summary as Record<string, unknown>)
        : {},
    inferred_params:
      typeof fixture.inferred_params === "object" && fixture.inferred_params
        ? (fixture.inferred_params as Record<string, unknown>)
        : {},
    residuals_sigma:
      typeof fixture.residuals_sigma === "object" && fixture.residuals_sigma
        ? (fixture.residuals_sigma as Record<string, number>)
        : {},
    domain_validity:
      typeof fixture.domain_validity === "object" && fixture.domain_validity
        ? (fixture.domain_validity as Record<string, unknown>)
        : {},
  };
}
