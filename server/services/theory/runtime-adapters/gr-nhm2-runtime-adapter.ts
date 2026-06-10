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

export const GR_NHM2_RUNTIME_ADAPTER_ID = "gr_nhm2.artifact_reader" as const;
export const GR_NHM2_LANE_ID = "warp_gr_nhm2" as const;

export const GR_NHM2_SUPPORTED_BADGE_IDS = [
  "physics.gr.einstein_field_equation",
  "physics.gr.stress_energy_conservation",
  "physics.gr.3p1_decomposition",
  "nhm2.geometry.lapse_shift_profile",
  "nhm2.source.energy_density_proxy",
  "nhm2.closure.source_residual",
  "nhm2.source.wall_t00_trace",
  "nhm2.tensor.full_authority_gate",
  "nhm2.tensor.same_chart_full_tensor",
  "nhm2.natario.curvature_invariants",
  "nhm2.natario.invariant_audit",
  "nhm2.energy_condition.observer_robust_gate",
  "nhm2.energy_condition.diagnostic_gate",
  "nhm2.claim_boundary.diagnostic_only",
] as const;

export const GR_NHM2_ARTIFACT_ROOTS = [
  "artifacts/research/full-solve/selected-family/nhm2-shift-lapse",
  "docs/audits/research/selected-family/nhm2-shift-lapse",
] as const;

const REQUIRED_GATE_IDS = [
  "source_closure",
  "qei_applicability",
  "observer_audit",
  "hard_constraints",
  "certificate_issued",
  "certificate_integrity",
] as const;

const SCALAR_KEYS = [
  "curvatureRatio",
  "marginRatio",
  "qeiMargin",
  "tauSelected",
  "sourceClosureResidualRms",
  "sourceClosureResidualMax",
  "sourceClosureWallT00RelLInf",
  "wallT00RelLInf",
  "properTimeS",
  "savedDays",
  "betaOverAlphaMax",
  "wallHorizonMargin",
  "weylScalar",
  "ricciInvariant",
] as const;

type RequiredGateId = (typeof REQUIRED_GATE_IDS)[number];
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
  for (const key of ["status", "state", "verdict", "result", "passed", "pass", "ok", "valid", "issued"]) {
    if (key in value) return value[key];
  }
  return undefined;
}

function gateStatusFromValue(value: unknown): TheoryRuntimeGateStatus {
  if (isRecord(value)) return gateStatusFromValue(candidateValueFromRecord(value));
  if (typeof value === "boolean") return value ? "pass" : "fail";
  if (typeof value !== "string") return "unknown";
  const normalized = normalizeKey(value);
  if (["pass", "passed", "ok", "valid", "issued", "complete", "completed", "admissible"].includes(normalized)) {
    return "pass";
  }
  if (["fail", "failed", "false", "inadmissible", "invalid"].includes(normalized)) return "fail";
  if (
    [
      "missing",
      "notready",
      "notrun",
      "blocked",
      "unavailable",
      "notissued",
      "none",
      "null",
      "unknown",
    ].includes(normalized)
  ) {
    return "not_ready";
  }
  if (["notapplicable", "na"].includes(normalized)) return "not_applicable";
  return "unknown";
}

function gateIdForKey(keyPath: string): RequiredGateId | null {
  const key = normalizeKey(keyPath);
  if (/certificate.*integrity|integrity.*certificate/.test(key)) return "certificate_integrity";
  if (/certificate|certissued|certificateissued|certificatestatus/.test(key)) return "certificate_issued";
  if (/sourceclosure|closureresidual|sourceresidual/.test(key)) return "source_closure";
  if (/qei/.test(key) && /applicability|dossier|worldline|margin|gate|status/.test(key)) {
    return "qei_applicability";
  }
  if (/observeraudit|dualtensor|timelikeobserver|nullobserver/.test(key)) return "observer_audit";
  if (/hardconstraints|hardconstraint|hardgate|constraintsverdict/.test(key)) return "hard_constraints";
  return null;
}

function collectGates(artifacts: ParsedArtifact[]): Record<string, TheoryRuntimeGateStatus> {
  const gates: Record<string, TheoryRuntimeGateStatus> = {};
  for (const artifact of artifacts) {
    walk(artifact.data, (key, entry, keyPath) => {
      const gateId = gateIdForKey(keyPath);
      if (!gateId) return;
      const status = gateStatusFromValue(entry);
      if (status === "unknown" && gates[gateId]) return;
      gates[gateId] = status;
    });
  }
  return gates;
}

function collectScalars(artifacts: ParsedArtifact[]): Record<string, number | string | boolean | null> {
  const scalarByNormalizedKey = new Map(SCALAR_KEYS.map((key) => [normalizeKey(key), key] as const));
  const scalars: Record<string, number | string | boolean | null> = {};
  for (const artifact of artifacts) {
    walk(artifact.data, (key, entry) => {
      if (entry !== null && typeof entry !== "number" && typeof entry !== "string" && typeof entry !== "boolean") {
        return;
      }
      const scalarKey = scalarByNormalizedKey.get(normalizeKey(key));
      if (scalarKey && !(scalarKey in scalars)) scalars[scalarKey] = entry;
    });
  }
  return scalars;
}

function missingSignalsForGates(gates: Record<string, TheoryRuntimeGateStatus>): string[] {
  return REQUIRED_GATE_IDS.filter((gateId) => {
    const status = gates[gateId];
    return !status || status === "unknown" || status === "not_ready" || status === "not_applicable";
  }).map((gateId) => `${gateId}_missing`);
}

function promotionBlockedBy(gates: Record<string, TheoryRuntimeGateStatus>, missingSignals: string[]): string[] {
  return unique([
    ...missingSignals.map((signal) => signal.replace(/_missing$/, "")),
    ...REQUIRED_GATE_IDS.filter((gateId) => gates[gateId] === "fail").map((gateId) => `${gateId}_failed`),
  ]);
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

function maximumTierForGates(gates: Record<string, TheoryRuntimeGateStatus>): "reduced_order" | "certified" {
  return gates.certificate_issued === "pass" && gates.certificate_integrity === "pass"
    ? "certified"
    : "reduced_order";
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
  const patterns = GR_NHM2_ARTIFACT_ROOTS.map((root) => `${root.replace(/\\/g, "/")}/**/*.json`);
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
    : [...GR_NHM2_SUPPORTED_BADGE_IDS];
  const gates = input.parseError ? {} : collectGates(input.artifacts);
  const scalars = input.parseError ? {} : collectScalars(input.artifacts);
  const missingSignals = input.parseError ? ["artifact_parse_failed"] : missingSignalsForGates(gates);
  const status = receiptStatus({
    artifactCount: input.artifacts.length,
    parseFailed: Boolean(input.parseError),
    missingSignals,
  });
  const blockedBy = status === "failed" ? ["artifact_parse_failed"] : promotionBlockedBy(gates, missingSignals);
  const promotionAllowed =
    status === "completed" && REQUIRED_GATE_IDS.every((gateId) => gates[gateId] === "pass");
  const warnings = unique([
    "Read-only GR/NHM2 artifact adapter; no backend runtime executed.",
    input.artifacts.length === 0 && !input.parseError ? "No GR/NHM2 artifacts were found." : "",
    input.parseError ?? "",
    ...missingSignals.map((signal) => `${signal.replace(/_/g, " ")}; claim promotion blocked.`),
    ...REQUIRED_GATE_IDS.filter((gateId) => gates[gateId] === "fail").map(
      (gateId) => `${gateId.replace(/_/g, " ")} failed; claim promotion blocked.`,
    ),
  ]);

  return buildTheoryRuntimeReceiptV1({
    generatedAt,
    receiptId: `runtime:${GR_NHM2_RUNTIME_ADAPTER_ID}:${Date.now().toString(36)}`,
    runtimeId: GR_NHM2_RUNTIME_ADAPTER_ID,
    graphId,
    badgeIds,
    command: null,
    args: {
      adapter: GR_NHM2_RUNTIME_ADAPTER_ID,
      artifactRoots: [...GR_NHM2_ARTIFACT_ROOTS],
      requestedRuntimeId: input.adapterInput.runtimeId ?? null,
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
      maximumTier: maximumTierForGates(gates),
      promotionAllowed,
      promotionBlockedBy: blockedBy,
    },
  });
}

export async function readGrNhm2RuntimeArtifacts(
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
      parseError: error instanceof Error ? error.message : "GR/NHM2 artifact parse failed.",
    });
  }
}

export const grNhm2RuntimeAdapter: TheoryRuntimeAdapter = {
  runtimeId: GR_NHM2_RUNTIME_ADAPTER_ID,
  family: "warp_full_solve",
  laneId: GR_NHM2_LANE_ID,
  capabilities: ["static_reference", "artifact_reader"],
  supportedBadgeIds: [...GR_NHM2_SUPPORTED_BADGE_IDS],
  canHandle: (input) =>
    input.runtimeId === GR_NHM2_RUNTIME_ADAPTER_ID ||
    input.laneId === GR_NHM2_LANE_ID ||
    Boolean(input.badgeIds?.some((badgeId) => GR_NHM2_SUPPORTED_BADGE_IDS.includes(badgeId as typeof GR_NHM2_SUPPORTED_BADGE_IDS[number]))),
  buildReferenceTrace: (input) =>
    buildStaticGrTensorTraceV1({
      runtimeId: GR_NHM2_RUNTIME_ADAPTER_ID,
      graphId: input.graphId ?? "nhm2-theory-badge-graph",
      badgeIds: input.badgeIds?.length ? input.badgeIds : [...GR_NHM2_SUPPORTED_BADGE_IDS],
      generatedAt: input.generatedAt ?? undefined,
    }),
  readArtifacts: readGrNhm2RuntimeArtifacts,
};
