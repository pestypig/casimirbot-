import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import {
  buildTheoryRuntimeReceiptV1,
  type TheoryRuntimeGateStatus,
  type TheoryRuntimeReceiptStatus,
  type TheoryRuntimeReceiptV1,
} from "../../../../shared/contracts/theory-runtime-receipt.v1";
import { buildStaticSolarRuntimeTraceV1 } from "../../../../shared/theory/runtime-traces/static-solar-runtime-trace";
import { runTheoryRuntimeAdapter } from "../runtime-adapters";
import type {
  TheoryRuntimeAdapter,
  TheoryRuntimeAdapterInput,
} from "./theory-runtime-adapter-types";

export const SOLAR_RUNTIME_ADAPTER_ID = "solar_spectrum.artifact_reader" as const;
export const SOLAR_LANE_ID = "solar_surface_spectrum" as const;
export const SOLAR_QUICK_RUNTIME_ID = "solar.manifest" as const;

export const SOLAR_SUPPORTED_BADGE_IDS = [
  "solar.spectrum.photon_energy",
  "solar.spectrum.wien_peak",
  "solar.spectrum.stefan_boltzmann_luminosity",
  "solar.spectrum.halpha_line_reference",
  "solar.spectrum.doppler_shift",
  "solar.spectrum.radial_velocity_proxy",
  "solar.spectrum.blackbody_curve_reference",
  "solar.magnetic.zeeman_split_proxy",
  "solar.flare.energy_proxy",
  "solar.runtime.spectrum_analysis",
  "solar.claim_boundary.observational_proxy",
] as const;

export const SOLAR_ARTIFACT_PATTERNS = [
  "artifacts/solar/**/*.json",
  "artifacts/solar-spectrum/**/*.json",
  "artifacts/**/*solar*manifest*.json",
  "artifacts/**/*solar*spectrum*.json",
  "docs/knowledge/physics/solar-*.json",
  "datasets/solar/**/*.json",
] as const;

const SCALAR_KEYS = [
  "lambda",
  "lambda_obs",
  "lambda0",
  "f",
  "E",
  "v",
  "T",
  "lambda_max",
  "L",
  "R",
  "E_flare",
  "P_flare",
  "duration",
] as const;

type ParsedArtifact = {
  relativePath: string;
  data: unknown;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeKey(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function walk(value: unknown, visit: (key: string, entry: unknown, keyPath: string) => void, prefix = ""): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visit, `${prefix}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    visit(key, entry, keyPath);
    walk(entry, visit, keyPath);
  }
}

function gateStatusFromValue(value: unknown): TheoryRuntimeGateStatus {
  if (isRecord(value)) {
    for (const key of ["status", "state", "present", "available", "identified", "calibrated"]) {
      if (key in value) return gateStatusFromValue(value[key]);
    }
    return "unknown";
  }
  if (typeof value === "boolean") return value ? "pass" : "fail";
  if (typeof value !== "string") return "unknown";
  const normalized = normalizeKey(value);
  if (["pass", "passed", "ok", "present", "available", "identified", "calibrated", "true"].includes(normalized)) {
    return "pass";
  }
  if (["fail", "failed", "missing", "false", "uncalibrated", "unidentified"].includes(normalized)) return "fail";
  if (["unknown", "unavailable", "notready", "none", "null"].includes(normalized)) return "not_ready";
  if (["notapplicable", "na"].includes(normalized)) return "not_applicable";
  return "unknown";
}

async function readArtifacts(projectRoot: string): Promise<ParsedArtifact[]> {
  const paths = await fg([...SOLAR_ARTIFACT_PATTERNS], {
    cwd: projectRoot,
    onlyFiles: true,
    dot: false,
    unique: true,
  });
  const artifacts: ParsedArtifact[] = [];
  for (const relativePath of paths) {
    const absolutePath = path.resolve(projectRoot, relativePath);
    const raw = await fs.readFile(absolutePath, "utf8");
    artifacts.push({
      relativePath: normalizeRelativePath(relativePath),
      data: JSON.parse(raw) as unknown,
    });
  }
  return artifacts;
}

function collectScalars(artifacts: ParsedArtifact[]): Record<string, number | string | boolean | null> {
  const scalarByNormalizedKey = new Map(SCALAR_KEYS.map((key) => [normalizeKey(key), key] as const));
  const scalars: Record<string, number | string | boolean | null> = {};
  for (const artifact of artifacts) {
    walk(artifact.data, (key, entry, keyPath) => {
      if (entry !== null && typeof entry !== "number" && typeof entry !== "string" && typeof entry !== "boolean") {
        return;
      }
      if (/gate|status|verdict/i.test(keyPath)) return;
      const scalarKey = scalarByNormalizedKey.get(normalizeKey(key));
      if (scalarKey && typeof entry !== "number") return;
      if (scalarKey && !(scalarKey in scalars)) scalars[scalarKey] = entry;
    });
  }
  return scalars;
}

function deriveScalarCuts(
  scalars: Record<string, number | string | boolean | null>,
): Record<string, number | string | boolean | null> {
  const derived: Record<string, number | string | boolean | null> = {};
  const c = 299_792_458;
  const h = 6.62607015e-34;
  const b = 2.897771955e-3;
  const sigma = 5.670374419e-8;
  if (typeof scalars.lambda === "number") {
    if (!("f" in scalars)) derived.f = c / scalars.lambda;
    if (!("E" in scalars)) derived.E = (h * c) / scalars.lambda;
  }
  if (typeof scalars.lambda_obs === "number" && typeof scalars.lambda0 === "number") {
    derived.v = c * ((scalars.lambda_obs - scalars.lambda0) / scalars.lambda0);
  }
  if (typeof scalars.T === "number") derived.lambda_max = b / scalars.T;
  if (typeof scalars.T === "number" && typeof scalars.R === "number") {
    derived.L = 4 * Math.PI * scalars.R ** 2 * sigma * scalars.T ** 4;
  }
  if (typeof scalars.P_flare === "number" && typeof scalars.duration === "number") {
    derived.E_flare = scalars.P_flare * scalars.duration;
  }
  return derived;
}

function hasKeyLike(artifacts: ParsedArtifact[], pattern: RegExp): boolean {
  return artifacts.some((artifact) => {
    let found = false;
    walk(artifact.data, (key, entry, keyPath) => {
      if (found) return;
      if (pattern.test(key) || pattern.test(keyPath)) found = true;
      if (typeof entry === "string" && pattern.test(entry)) found = true;
    });
    return found;
  });
}

function collectGates(artifacts: ParsedArtifact[]): Record<string, TheoryRuntimeGateStatus> {
  const calibrationPresent = hasKeyLike(artifacts, /calibration|calibrated|wavelengthSolution|instrumentResponse/i);
  const bandpassPresent = hasKeyLike(artifacts, /bandpass|band.*pass|filterBand|spectralWindow/i);
  const lineIdentificationPresent = hasKeyLike(artifacts, /lineIdentification|line.*id|halpha|h-alpha|lambda0|restLine/i);
  return {
    observation_artifact_present: artifacts.length > 0 ? "pass" : "not_ready",
    calibration_present: calibrationPresent ? "pass" : "not_ready",
    bandpass_present: bandpassPresent ? "pass" : "not_ready",
    line_identification_present: lineIdentificationPresent ? "pass" : "not_ready",
    model_proxy_boundary: "pass",
  };
}

function receiptStatus(args: {
  artifactCount: number;
  parseFailed: boolean;
  gates: Record<string, TheoryRuntimeGateStatus>;
}): TheoryRuntimeReceiptStatus {
  if (args.parseFailed) return "failed";
  if (args.artifactCount === 0) return "not_run";
  if (args.gates.calibration_present !== "pass" || args.gates.bandpass_present !== "pass") return "blocked";
  return "completed";
}

function buildReceipt(input: {
  adapterInput: TheoryRuntimeAdapterInput;
  artifacts: ParsedArtifact[];
  parseError: string | null;
}): TheoryRuntimeReceiptV1 {
  const generatedAt = input.adapterInput.generatedAt ?? new Date().toISOString();
  const graphId = input.adapterInput.graphId ?? "nhm2-theory-badge-graph";
  const badgeIds = input.adapterInput.badgeIds?.length
    ? input.adapterInput.badgeIds
    : [...SOLAR_SUPPORTED_BADGE_IDS];
  const baseScalars = input.parseError ? {} : collectScalars(input.artifacts);
  const scalars = {
    ...baseScalars,
    ...deriveScalarCuts(baseScalars),
  };
  const gates = input.parseError ? {} : collectGates(input.artifacts);
  const status = receiptStatus({
    artifactCount: input.artifacts.length,
    parseFailed: Boolean(input.parseError),
    gates,
  });
  const missingSignals = unique([
    input.parseError ? "artifact_parse_failed" : "",
    gates.observation_artifact_present === "not_ready" ? "observation_artifact_missing" : "",
    gates.calibration_present !== "pass" ? "calibration_missing" : "",
    gates.bandpass_present !== "pass" ? "bandpass_missing" : "",
    gates.line_identification_present !== "pass" ? "line_identification_missing" : "",
  ]);
  const warnings = unique([
    "Read-only Solar Spectrum artifact adapter; no backend runtime executed.",
    "Solar rows are observation/model proxies; physical interpretation requires calibration and bandpass context.",
    input.artifacts.length === 0 && !input.parseError ? "No solar spectrum artifacts were found." : "",
    input.parseError ?? "",
    gates.calibration_present !== "pass" ? "Calibration context is missing." : "",
    gates.bandpass_present !== "pass" ? "Bandpass context is missing." : "",
    gates.line_identification_present !== "pass" ? "Line identification context is missing." : "",
  ]);

  return buildTheoryRuntimeReceiptV1({
    generatedAt,
    receiptId: `runtime:${SOLAR_RUNTIME_ADAPTER_ID}:${Date.now().toString(36)}`,
    runtimeId: SOLAR_RUNTIME_ADAPTER_ID,
    graphId,
    badgeIds,
    command: null,
    args: {
      adapter: SOLAR_RUNTIME_ADAPTER_ID,
      artifactPatterns: [...SOLAR_ARTIFACT_PATTERNS],
      requestedRuntimeId: input.adapterInput.runtimeId ?? null,
      scalarCuts: [
        "E = h*c/lambda",
        "f = c/lambda",
        "v = c*(lambda_obs - lambda0)/lambda0",
        "lambda_max = b/T",
        "L = 4*pi*R^2*sigma*T^4",
        "E_flare = P_flare*duration",
      ],
    },
    status,
    outputs: {
      artifacts: input.artifacts.map((artifact) => artifact.relativePath),
      scalars,
      units: {},
      gates,
      missingSignals,
      warnings,
    },
    provenance: {
      gitSha: null,
      startedAt: null,
      completedAt: generatedAt,
      durationMs: null,
    },
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: "diagnostic",
      promotionAllowed: false,
      promotionBlockedBy: unique(["observation_model_proxy_only", ...missingSignals]),
    },
  });
}

export async function readSolarArtifacts(
  input: TheoryRuntimeAdapterInput = {},
): Promise<TheoryRuntimeReceiptV1> {
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  try {
    const artifacts = await readArtifacts(projectRoot);
    return buildReceipt({ adapterInput: input, artifacts, parseError: null });
  } catch (error) {
    return buildReceipt({
      adapterInput: input,
      artifacts: [],
      parseError: error instanceof Error ? error.message : "Solar Spectrum artifact parse failed.",
    });
  }
}

export const solarRuntimeAdapter: TheoryRuntimeAdapter = {
  runtimeId: SOLAR_RUNTIME_ADAPTER_ID,
  family: "solar_spectrum",
  laneId: SOLAR_LANE_ID,
  capabilities: ["static_reference", "artifact_reader", "quick_runtime"],
  supportedBadgeIds: [...SOLAR_SUPPORTED_BADGE_IDS],
  canHandle: (input) =>
    input.runtimeId === SOLAR_RUNTIME_ADAPTER_ID ||
    input.runtimeId === SOLAR_QUICK_RUNTIME_ID ||
    input.laneId === SOLAR_LANE_ID ||
    Boolean(
      input.badgeIds?.some((badgeId) =>
        SOLAR_SUPPORTED_BADGE_IDS.includes(badgeId as typeof SOLAR_SUPPORTED_BADGE_IDS[number]),
      ),
    ),
  buildReferenceTrace: (input) =>
    buildStaticSolarRuntimeTraceV1({
      runtimeId: SOLAR_RUNTIME_ADAPTER_ID,
      graphId: input.graphId ?? "nhm2-theory-badge-graph",
      badgeIds: input.badgeIds?.length ? input.badgeIds : [...SOLAR_SUPPORTED_BADGE_IDS],
      generatedAt: input.generatedAt ?? undefined,
    }),
  readArtifacts: readSolarArtifacts,
  runQuick: (input) =>
    runTheoryRuntimeAdapter({
      runtimeId: SOLAR_QUICK_RUNTIME_ID,
      graphId: input.graphId ?? "nhm2-theory-badge-graph",
      badgeIds: input.badgeIds?.length ? input.badgeIds : [...SOLAR_SUPPORTED_BADGE_IDS],
      projectRoot: input.projectRoot ?? undefined,
      generatedAt: input.generatedAt ?? undefined,
    }),
};
