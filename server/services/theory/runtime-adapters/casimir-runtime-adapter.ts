import path from "node:path";
import fg from "fast-glob";
import {
  buildTheoryRuntimeReceiptV1,
  type TheoryRuntimeGateStatus,
  type TheoryRuntimeReceiptStatus,
  type TheoryRuntimeReceiptV1,
} from "../../../../shared/contracts/theory-runtime-receipt.v1";
import { buildStaticCasimirRuntimeTraceV1 } from "../../../../shared/theory/runtime-traces/static-casimir-runtime-trace";
import { runTheoryRuntimeAdapter } from "../runtime-adapters";
import type {
  TheoryRuntimeAdapter,
  TheoryRuntimeAdapterInput,
} from "./theory-runtime-adapter-types";
import { readJsonArtifactFile, readJsonlArtifactFile } from "./json-artifact-reader";

export const CASIMIR_RUNTIME_ADAPTER_ID = "casimir.artifact_reader" as const;
export const CASIMIR_LANE_ID = "casimir_cavity_modes" as const;
export const CASIMIR_QUICK_RUNTIME_ID = "casimir.verify" as const;

export const CASIMIR_SUPPORTED_BADGE_IDS = [
  "casimir.cavity.parallel_plate_energy_density",
  "casimir.cavity.parallel_plate_pressure",
  "casimir.cavity.per_tile_energy",
  "casimir.cavity.static_tile_budget",
  "casimir.tile.duty_budget",
  "casimir.cavity.geometry_gain",
  "casimir.cavity.output_energy_proxy",
  "casimir.cavity.mass_equivalent_proxy",
  "casimir.cavity.mode_frequency",
  "casimir.cavity.mode_photon_energy",
  "casimir.runtime.static_casimir_module",
  "casimir.material_receipts",
  "casimir.material.lifshitz_receipt",
  "casimir.geometry.beyond_pfa_validity",
  "casimir.claim_boundary.diagnostic_source_context",
] as const;

export const CASIMIR_ARTIFACT_PATTERNS = [
  "artifacts/casimir/**/*.json",
  "artifacts/casimir/**/*.jsonl",
  "artifacts/training-trace.jsonl",
  "artifacts/training-trace*.jsonl",
  "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/*source-closure*-latest.json",
] as const;

const SCALAR_KEYS = [
  "gap",
  "E_area",
  "P_casimir",
  "E_tile",
  "U_static",
  "d_burst",
  "d_cycle",
  "N_concurrent",
  "N_sector",
  "d_eff",
  "gammaGeo",
  "Q_L",
  "E_out",
  "M_proxy",
  "f_n",
  "E_n",
] as const;

type ParsedArtifact = {
  relativePath: string;
  data: unknown;
  kind: "json" | "jsonl";
};

let artifactCache: { projectRoot: string; artifacts: ParsedArtifact[] } | null = null;
let artifactCachePromise: Promise<ParsedArtifact[]> | null = null;

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
    for (const key of ["status", "state", "verdict", "result", "passed", "fresh", "present"]) {
      if (key in value) return gateStatusFromValue(value[key]);
    }
    return "unknown";
  }
  if (typeof value === "boolean") return value ? "pass" : "fail";
  if (typeof value !== "string") return "unknown";
  const normalized = normalizeKey(value);
  if (["pass", "passed", "ok", "ready", "fresh", "present", "valid", "true"].includes(normalized)) return "pass";
  if (["fail", "failed", "stale", "invalid", "false"].includes(normalized)) return "fail";
  if (["missing", "notready", "unknown", "unavailable", "none", "null"].includes(normalized)) return "not_ready";
  if (["notapplicable", "na"].includes(normalized)) return "not_applicable";
  return "unknown";
}

async function readArtifact(relativePath: string, projectRoot: string): Promise<ParsedArtifact> {
  const absolutePath = path.resolve(projectRoot, relativePath);
  if (/\.jsonl$/i.test(relativePath)) {
    return { relativePath: normalizeRelativePath(relativePath), data: await readJsonlArtifactFile(absolutePath), kind: "jsonl" };
  }
  return {
    relativePath: normalizeRelativePath(relativePath),
    data: await readJsonArtifactFile(absolutePath),
    kind: "json",
  };
}

async function readArtifacts(projectRoot: string): Promise<ParsedArtifact[]> {
  if (artifactCache?.projectRoot === projectRoot) return artifactCache.artifacts;
  if (artifactCachePromise) return artifactCachePromise;
  artifactCachePromise = readArtifactsUncached(projectRoot);
  try {
    const artifacts = await artifactCachePromise;
    artifactCache = { projectRoot, artifacts };
    return artifacts;
  } finally {
    artifactCachePromise = null;
  }
}

async function readArtifactsUncached(projectRoot: string): Promise<ParsedArtifact[]> {
  const paths = await fg([...CASIMIR_ARTIFACT_PATTERNS], {
    cwd: projectRoot,
    onlyFiles: true,
    dot: false,
    unique: true,
  });
  const artifacts: ParsedArtifact[] = [];
  for (const relativePath of paths) artifacts.push(await readArtifact(relativePath, projectRoot));
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
  if (typeof scalars.E_out === "number" && !("M_proxy" in scalars)) {
    derived.M_proxy = scalars.E_out / c ** 2;
  }
  const massProxy = typeof scalars.M_proxy === "number" ? scalars.M_proxy : derived.M_proxy;
  if (typeof massProxy === "number") derived.f_mass_equiv = (massProxy * c ** 2) / h;
  if (typeof scalars.f_n === "number" && !("E_n" in scalars)) derived.E_n = h * scalars.f_n;
  if (
    typeof scalars.d_burst === "number" &&
    typeof scalars.d_cycle === "number" &&
    typeof scalars.N_concurrent === "number" &&
    typeof scalars.N_sector === "number" &&
    scalars.N_sector !== 0 &&
    !("d_eff" in scalars)
  ) {
    derived.d_eff = scalars.d_burst * scalars.d_cycle * (scalars.N_concurrent / scalars.N_sector);
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

function telemetryStatus(artifacts: ParsedArtifact[]): TheoryRuntimeGateStatus {
  let sawTelemetry = false;
  let stale = false;
  for (const artifact of artifacts) {
    if (/telemetry|training-trace/i.test(artifact.relativePath)) sawTelemetry = true;
    walk(artifact.data, (key, entry, keyPath) => {
      if (/telemetry|freshness|stale|updatedAt|timestamp/i.test(keyPath)) sawTelemetry = true;
      if (/stale|freshness/i.test(keyPath) && gateStatusFromValue(entry) === "fail") stale = true;
      if (typeof entry === "string" && /stale/i.test(entry)) stale = true;
      if (entry === false && /fresh/i.test(key)) stale = true;
    });
  }
  if (stale) return "fail";
  return sawTelemetry ? "pass" : "not_ready";
}

function collectGates(artifacts: ParsedArtifact[]): Record<string, TheoryRuntimeGateStatus> {
  const materialContextPresent = hasKeyLike(artifacts, /material|permittivity|conductivity|drude|plasma/i);
  const finiteTemperaturePresent = hasKeyLike(artifacts, /finite.*temperature|temperature|thermal|tempK|temperatureK/i);
  return {
    artifact_present: artifacts.length > 0 ? "pass" : "not_ready",
    material_context_present: materialContextPresent ? "pass" : "not_ready",
    finite_temperature_context_present: finiteTemperaturePresent ? "pass" : "not_ready",
    telemetry_fresh: telemetryStatus(artifacts),
    nhm2_bridge_diagnostic_only: "pass",
  };
}

function receiptStatus(args: {
  artifactCount: number;
  parseFailed: boolean;
  telemetryFresh: TheoryRuntimeGateStatus;
}): TheoryRuntimeReceiptStatus {
  if (args.parseFailed) return "failed";
  if (args.artifactCount === 0) return "not_run";
  if (args.telemetryFresh === "fail") return "stale";
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
    : [...CASIMIR_SUPPORTED_BADGE_IDS];
  const baseScalars = input.parseError ? {} : collectScalars(input.artifacts);
  const scalars = {
    ...baseScalars,
    ...deriveScalarCuts(baseScalars),
  };
  const gates = input.parseError ? {} : collectGates(input.artifacts);
  const status = receiptStatus({
    artifactCount: input.artifacts.length,
    parseFailed: Boolean(input.parseError),
    telemetryFresh: gates.telemetry_fresh,
  });
  const missingSignals = unique([
    input.parseError ? "artifact_parse_failed" : "",
    gates.artifact_present === "not_ready" ? "artifact_missing" : "",
    gates.material_context_present !== "pass" ? "material_context_missing" : "",
    gates.finite_temperature_context_present !== "pass" ? "finite_temperature_context_missing" : "",
    gates.telemetry_fresh === "fail" ? "telemetry_stale" : "",
    gates.material_context_present !== "pass" || gates.finite_temperature_context_present !== "pass"
      ? "material_receipts_missing"
      : "",
  ]);
  const warnings = unique([
    "Read-only Casimir artifact adapter; no backend runtime executed.",
    "Casimir/NHM2 bridge remains diagnostic/source-context only.",
    input.artifacts.length === 0 && !input.parseError ? "No Casimir artifacts were found." : "",
    input.parseError ?? "",
    gates.material_context_present !== "pass" ? "Material context is missing." : "",
    gates.finite_temperature_context_present !== "pass" ? "Finite-temperature context is missing." : "",
    gates.telemetry_fresh === "fail" ? "Telemetry is stale." : "",
    gates.telemetry_fresh === "not_ready" ? "Telemetry freshness is unavailable." : "",
  ]);

  return buildTheoryRuntimeReceiptV1({
    generatedAt,
    receiptId: `runtime:${CASIMIR_RUNTIME_ADAPTER_ID}:${Date.now().toString(36)}`,
    runtimeId: CASIMIR_RUNTIME_ADAPTER_ID,
    graphId,
    badgeIds,
    command: null,
    args: {
      adapter: CASIMIR_RUNTIME_ADAPTER_ID,
      artifactPatterns: [...CASIMIR_ARTIFACT_PATTERNS],
      requestedRuntimeId: input.adapterInput.runtimeId ?? null,
      scalarCuts: [
        "E_area = -(pi^2*hbar_c)/(720*a^3)",
        "P_casimir = -(pi^2*hbar_c)/(240*a^4)",
        "U_static",
        "d_eff = d_burst*d_cycle*(N_concurrent/N_sector)",
        "E_out",
        "M_proxy = E_out/c^2",
        "f_mass_equiv = M_proxy*c^2/h",
        "f_n = n*c/(2*L)",
        "E_n = h*f_n",
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
      promotionBlockedBy: unique([
        "diagnostic_source_context_only",
        ...missingSignals,
      ]),
    },
  });
}

export async function readCasimirArtifacts(
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
      parseError: error instanceof Error ? error.message : "Casimir artifact parse failed.",
    });
  }
}

export const casimirRuntimeAdapter: TheoryRuntimeAdapter = {
  runtimeId: CASIMIR_RUNTIME_ADAPTER_ID,
  family: "casimir_field",
  laneId: CASIMIR_LANE_ID,
  capabilities: ["static_reference", "artifact_reader", "quick_runtime"],
  supportedBadgeIds: [...CASIMIR_SUPPORTED_BADGE_IDS],
  canHandle: (input) =>
    input.runtimeId === CASIMIR_RUNTIME_ADAPTER_ID ||
    input.runtimeId === CASIMIR_QUICK_RUNTIME_ID ||
    input.laneId === CASIMIR_LANE_ID ||
    Boolean(
      input.badgeIds?.some((badgeId) =>
        CASIMIR_SUPPORTED_BADGE_IDS.includes(badgeId as typeof CASIMIR_SUPPORTED_BADGE_IDS[number]),
      ),
    ),
  buildReferenceTrace: (input) =>
    buildStaticCasimirRuntimeTraceV1({
      runtimeId: CASIMIR_RUNTIME_ADAPTER_ID,
      graphId: input.graphId ?? "nhm2-theory-badge-graph",
      badgeIds: input.badgeIds?.length ? input.badgeIds : [...CASIMIR_SUPPORTED_BADGE_IDS],
      generatedAt: input.generatedAt ?? undefined,
    }),
  readArtifacts: readCasimirArtifacts,
  runQuick: (input) =>
    runTheoryRuntimeAdapter({
      runtimeId: CASIMIR_QUICK_RUNTIME_ID,
      graphId: input.graphId ?? "nhm2-theory-badge-graph",
      badgeIds: input.badgeIds?.length ? input.badgeIds : [...CASIMIR_SUPPORTED_BADGE_IDS],
      projectRoot: input.projectRoot ?? undefined,
      generatedAt: input.generatedAt ?? undefined,
    }),
};
