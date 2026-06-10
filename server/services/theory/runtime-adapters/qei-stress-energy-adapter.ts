import path from "node:path";
import fg from "fast-glob";
import {
  buildTheoryRuntimeReceiptV1,
  type TheoryRuntimeGateStatus,
  type TheoryRuntimeReceiptStatus,
  type TheoryRuntimeReceiptV1,
} from "../../../../shared/contracts/theory-runtime-receipt.v1";
import { buildStaticGrTensorTraceV1 } from "../../../../shared/theory/runtime-traces/static-gr-tensor-trace";
import type {
  TheoryRuntimeAdapter,
  TheoryRuntimeAdapterInput,
} from "./theory-runtime-adapter-types";
import { readJsonArtifactFile } from "./json-artifact-reader";

export const QEI_STRESS_ENERGY_RUNTIME_ADAPTER_ID = "qei_stress_energy.artifact_reader" as const;
export const QEI_STRESS_ENERGY_LANE_ID = "qei_stress_energy" as const;

export const QEI_STRESS_ENERGY_SUPPORTED_BADGE_IDS = [
  "physics.fields.stress_energy_tensor",
  "physics.gr.stress_energy_conservation",
  "nhm2.source.energy_density_proxy",
  "nhm2.closure.source_residual",
  "nhm2.qei.sampling_window",
  "nhm2.qei.worldline_dossier",
  "nhm2.energy_condition.diagnostic_gate",
] as const;

export const QEI_STRESS_ENERGY_ARTIFACT_ROOTS = [
  "artifacts/research/full-solve/selected-family/nhm2-shift-lapse",
  "artifacts/qei",
  "artifacts/stress-energy",
  "docs/audits/research",
] as const;

const REQUIRED_QEI_GATE_IDS = [
  "timelike_worldline",
  "hadamard_state",
  "point_splitting",
  "unit_integral_sampling",
  "operator_mapping",
  "semantic_bridge",
  "curvature_applicability",
  "qei_margin",
] as const;

const SCALAR_KEYS = [
  "qei_bound",
  "qei_sample",
  "qei_margin",
  "marginRatio",
  "rhoMetric",
  "rhoProxy",
  "tauSelected",
  "tauWindow",
  "regionalMargin",
] as const;

const CONTEXT_KEYS = [
  "sampler",
  "fieldType",
  "qeiStateClass",
  "renormalizationScheme",
  "samplingNormalization",
  "operatorMapping",
  "worldlineClass",
  "semanticComparable",
  "bridgeReady",
  "uncertaintyDecisionClass",
  "worldline",
  "samplingFunction",
  "rhoSource",
  "qeiBoundSource",
  "dutyLightCrossingConsistency",
] as const;

type ParsedArtifact = {
  relativePath: string;
  data: unknown;
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

function candidateValueFromRecord(value: Record<string, unknown>): unknown {
  for (const key of ["status", "state", "verdict", "result", "passed", "pass", "ok", "ready", "comparable"]) {
    if (key in value) return value[key];
  }
  return undefined;
}

function gateStatusFromValue(value: unknown): TheoryRuntimeGateStatus {
  if (isRecord(value)) return gateStatusFromValue(candidateValueFromRecord(value));
  if (typeof value === "boolean") return value ? "pass" : "fail";
  if (typeof value === "number") return Number.isFinite(value) ? "pass" : "unknown";
  if (typeof value !== "string") return "unknown";
  const normalized = normalizeKey(value);
  if (["pass", "passed", "ok", "ready", "valid", "true", "comparable", "applicable"].includes(normalized)) {
    return "pass";
  }
  if (["fail", "failed", "false", "invalid", "inapplicable", "notcomparable"].includes(normalized)) return "fail";
  if (["missing", "notready", "blocked", "unknown", "unavailable", "none", "null"].includes(normalized)) {
    return "not_ready";
  }
  if (["notapplicable", "na"].includes(normalized)) return "not_applicable";
  return "unknown";
}

function qeiGateForKey(keyPath: string) {
  const key = normalizeKey(keyPath);
  if (/timelike.*worldline|worldline.*timelike|worldlineclass/.test(key)) return "timelike_worldline";
  if (/hadamard|stateclass|qeistateclass/.test(key)) return "hadamard_state";
  if (/pointsplitting|renormalization/.test(key)) return "point_splitting";
  if (/unitintegral|samplingnormalization|sampler/.test(key)) return "unit_integral_sampling";
  if (/operatormapping|operator.*mapping/.test(key)) return "operator_mapping";
  if (/semanticbridge|semanticcomparable|bridgeready/.test(key)) return "semantic_bridge";
  if (/curvatureapplicability|curvature.*applicable/.test(key)) return "curvature_applicability";
  if (/qeimargin|marginratio|qei.*margin/.test(key)) return "qei_margin";
  return null;
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

function collectContextScalars(artifacts: ParsedArtifact[]): Record<string, number | string | boolean | null> {
  const contextByNormalizedKey = new Map(CONTEXT_KEYS.map((key) => [normalizeKey(key), key] as const));
  const context: Record<string, number | string | boolean | null> = {};
  for (const artifact of artifacts) {
    walk(artifact.data, (key, entry) => {
      if (entry !== null && typeof entry !== "number" && typeof entry !== "string" && typeof entry !== "boolean") {
        return;
      }
      const contextKey = contextByNormalizedKey.get(normalizeKey(key));
      if (contextKey && !(contextKey in context)) context[contextKey] = entry;
    });
  }
  return context;
}

function collectGates(artifacts: ParsedArtifact[]): Record<string, TheoryRuntimeGateStatus> {
  const gates: Record<string, TheoryRuntimeGateStatus> = {};
  for (const artifact of artifacts) {
    walk(artifact.data, (key, entry, keyPath) => {
      const gateId = qeiGateForKey(keyPath);
      if (!gateId) return;
      const status = gateStatusFromValue(entry);
      if (status === "unknown" && gates[gateId]) return;
      gates[gateId] = status;
    });
  }
  return gates;
}

function deriveScalarCuts(
  scalars: Record<string, number | string | boolean | null>,
): Record<string, number | string | boolean | null> {
  const derived: Record<string, number | string | boolean | null> = {};
  const bound = typeof scalars.qei_bound === "number" ? scalars.qei_bound : null;
  const sample = typeof scalars.qei_sample === "number" ? scalars.qei_sample : null;
  if (bound !== null && sample !== null && !("qei_margin" in scalars)) {
    derived.qei_margin = bound - sample;
  }
  if (bound !== null && sample !== null && bound !== 0 && !("marginRatio" in scalars)) {
    derived.marginRatio = sample / bound;
  }
  if (
    typeof scalars.tauWindow === "number" &&
    typeof scalars.tauSelected === "number"
  ) {
    derived.tau_margin = scalars.tauWindow - scalars.tauSelected;
  }
  return derived;
}

function applyFailClosedGateDefaults(args: {
  gates: Record<string, TheoryRuntimeGateStatus>;
  scalars: Record<string, number | string | boolean | null>;
  context: Record<string, number | string | boolean | null>;
}): Record<string, TheoryRuntimeGateStatus> {
  const gates = { ...args.gates };
  if (!gates.qei_margin && "qei_margin" in args.scalars) gates.qei_margin = "pass";
  if (!gates.timelike_worldline && args.context.worldlineClass) gates.timelike_worldline = "pass";
  if (!gates.hadamard_state && args.context.qeiStateClass) gates.hadamard_state = "pass";
  if (!gates.point_splitting && args.context.renormalizationScheme) gates.point_splitting = "pass";
  if (!gates.unit_integral_sampling && args.context.samplingNormalization) gates.unit_integral_sampling = "pass";
  if (!gates.operator_mapping && args.context.operatorMapping) gates.operator_mapping = "pass";
  if (!gates.semantic_bridge && (args.context.semanticComparable || args.context.bridgeReady)) {
    gates.semantic_bridge = gateStatusFromValue(args.context.semanticComparable ?? args.context.bridgeReady);
  }
  return gates;
}

function missingSignalsForGates(gates: Record<string, TheoryRuntimeGateStatus>): string[] {
  return REQUIRED_QEI_GATE_IDS.filter((gateId) => {
    const status = gates[gateId];
    return !status || status === "unknown" || status === "not_ready" || status === "not_applicable";
  }).map((gateId) => `${gateId}_missing`);
}

function receiptStatus(args: {
  artifactCount: number;
  parseFailed: boolean;
  missingSignals: string[];
}): TheoryRuntimeReceiptStatus {
  if (args.parseFailed) return "failed";
  if (args.artifactCount === 0) return "not_run";
  if (args.missingSignals.length > 0) return "blocked";
  return "completed";
}

async function readJsonArtifacts(projectRoot: string): Promise<ParsedArtifact[]> {
  if (artifactCache?.projectRoot === projectRoot) return artifactCache.artifacts;
  if (artifactCachePromise) return artifactCachePromise;
  artifactCachePromise = readJsonArtifactsUncached(projectRoot);
  try {
    const artifacts = await artifactCachePromise;
    artifactCache = { projectRoot, artifacts };
    return artifacts;
  } finally {
    artifactCachePromise = null;
  }
}

async function readJsonArtifactsUncached(projectRoot: string): Promise<ParsedArtifact[]> {
  const patterns = QEI_STRESS_ENERGY_ARTIFACT_ROOTS.map((root) => `${root.replace(/\\/g, "/")}/**/*.json`);
  const paths = await fg(patterns, {
    cwd: projectRoot,
    onlyFiles: true,
    dot: false,
    unique: true,
  });
  const artifacts: ParsedArtifact[] = [];
  for (const relativePath of paths) {
    const absolutePath = path.resolve(projectRoot, relativePath);
    artifacts.push({
      relativePath: normalizeRelativePath(relativePath),
      data: await readJsonArtifactFile(absolutePath),
    });
  }
  return artifacts;
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
    : [...QEI_STRESS_ENERGY_SUPPORTED_BADGE_IDS];
  const baseScalars = input.parseError ? {} : collectScalars(input.artifacts);
  const context = input.parseError ? {} : collectContextScalars(input.artifacts);
  const scalars = {
    ...baseScalars,
    ...deriveScalarCuts(baseScalars),
    ...context,
  };
  const gates = input.parseError
    ? {}
    : applyFailClosedGateDefaults({
        gates: collectGates(input.artifacts),
        scalars,
        context,
      });
  const missingSignals = input.parseError ? ["artifact_parse_failed"] : missingSignalsForGates(gates);
  const status = receiptStatus({
    artifactCount: input.artifacts.length,
    parseFailed: Boolean(input.parseError),
    missingSignals,
  });
  const failingGates = REQUIRED_QEI_GATE_IDS.filter((gateId) => gates[gateId] === "fail");
  const promotionBlockedBy = unique([
    ...missingSignals.map((signal) => signal.replace(/_missing$/, "")),
    ...failingGates.map((gateId) => `${gateId}_failed`),
  ]);
  const warnings = unique([
    "Read-only QEI/Stress-Energy artifact adapter; no backend runtime executed.",
    input.artifacts.length === 0 && !input.parseError ? "No QEI/Stress-Energy artifacts were found." : "",
    input.parseError ?? "",
    ...missingSignals.map((signal) => `${signal.replace(/_/g, " ")}; QEI semantics fail closed.`),
    ...failingGates.map((gateId) => `${gateId.replace(/_/g, " ")} failed; no promotion claim emitted.`),
  ]);

  return buildTheoryRuntimeReceiptV1({
    generatedAt,
    receiptId: `runtime:${QEI_STRESS_ENERGY_RUNTIME_ADAPTER_ID}:${Date.now().toString(36)}`,
    runtimeId: QEI_STRESS_ENERGY_RUNTIME_ADAPTER_ID,
    graphId,
    badgeIds,
    command: null,
    args: {
      adapter: QEI_STRESS_ENERGY_RUNTIME_ADAPTER_ID,
      artifactRoots: [...QEI_STRESS_ENERGY_ARTIFACT_ROOTS],
      requestedRuntimeId: input.adapterInput.runtimeId ?? null,
      scalarCuts: [
        "qei_margin = qei_bound - qei_sample",
        "margin_ratio = lhs / bound",
        "tau_margin = tauWindow - tauSelected",
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
      promotionBlockedBy,
    },
  });
}

export async function readQeiStressEnergyArtifacts(
  input: TheoryRuntimeAdapterInput = {},
): Promise<TheoryRuntimeReceiptV1> {
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  try {
    const artifacts = await readJsonArtifacts(projectRoot);
    return buildReceipt({ adapterInput: input, artifacts, parseError: null });
  } catch (error) {
    return buildReceipt({
      adapterInput: input,
      artifacts: [],
      parseError: error instanceof Error ? error.message : "QEI/Stress-Energy artifact parse failed.",
    });
  }
}

export const qeiStressEnergyAdapter: TheoryRuntimeAdapter = {
  runtimeId: QEI_STRESS_ENERGY_RUNTIME_ADAPTER_ID,
  family: "qei_worldline",
  laneId: QEI_STRESS_ENERGY_LANE_ID,
  capabilities: ["static_reference", "artifact_reader"],
  supportedBadgeIds: [...QEI_STRESS_ENERGY_SUPPORTED_BADGE_IDS],
  canHandle: (input) =>
    input.runtimeId === QEI_STRESS_ENERGY_RUNTIME_ADAPTER_ID ||
    input.laneId === QEI_STRESS_ENERGY_LANE_ID ||
    Boolean(
      input.badgeIds?.some((badgeId) =>
        QEI_STRESS_ENERGY_SUPPORTED_BADGE_IDS.includes(
          badgeId as typeof QEI_STRESS_ENERGY_SUPPORTED_BADGE_IDS[number],
        ),
      ),
    ),
  buildReferenceTrace: (input) =>
    buildStaticGrTensorTraceV1({
      runtimeId: QEI_STRESS_ENERGY_RUNTIME_ADAPTER_ID,
      graphId: input.graphId ?? "nhm2-theory-badge-graph",
      badgeIds: input.badgeIds?.length ? input.badgeIds : [...QEI_STRESS_ENERGY_SUPPORTED_BADGE_IDS],
      generatedAt: input.generatedAt ?? undefined,
    }),
  readArtifacts: readQeiStressEnergyArtifacts,
};
