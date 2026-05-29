import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import {
  buildTheoryRuntimeReceiptV1,
  type TheoryRuntimeGateStatus,
  type TheoryRuntimeReceiptStatus,
  type TheoryRuntimeReceiptV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";

type EvidenceSourceRef = {
  kind: string;
  path?: string | null;
  id?: string | null;
  note?: string | null;
};

export type EvidenceArtifactResolverInput = {
  sourceRefs?: EvidenceSourceRef[];
  outputArtifactGlobs?: string[];
  runtimeId: string;
  graphId?: string;
  badgeIds?: string[];
  command?: string | null;
  projectRoot?: string;
  generatedAt?: string;
};

export type EvidenceArtifactResolverArtifact = {
  path: string;
  absolutePath: string;
  sizeBytes: number;
  mtimeMs: number;
  parsed: boolean;
  stale: boolean;
  parseError: string | null;
};

export type EvidenceArtifactResolverOutput = {
  runtimeId: string;
  badgeIds: string[];
  artifactsFound: EvidenceArtifactResolverArtifact[];
  artifactsMissing: string[];
  stale: boolean;
  warnings: string[];
  gateHints: Record<string, TheoryRuntimeGateStatus>;
  missingSignals: string[];
  receiptV1: TheoryRuntimeReceiptV1;
};

const KNOWN_ARTIFACT_PATTERNS = [
  "artifacts/research/full-solve/**/*.json",
  "docs/audits/research/**/*.json",
  "AUDIT_TREE.json",
  "MATH_GRAPH.json",
  "**/*manifest*.json",
] as const;

const CERTIFICATE_PATTERNS = [
  "**/*certificate*.json",
  "**/*certificate*.md",
  "artifacts/research/full-solve/**/*certificate*",
  "docs/audits/**/*certificate*",
] as const;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function looksLikeGlob(value: string): boolean {
  return /[*?[\]{}()!+@]/.test(value);
}

function sourceRefArtifactPatterns(sourceRefs: EvidenceSourceRef[]): string[] {
  return sourceRefs
    .filter((ref) => ref.kind === "artifact" || ref.kind === "manifest" || ref.kind === "runtime")
    .map((ref) => ref.path ?? "")
    .filter((refPath) => refPath.trim().length > 0);
}

function candidatePatterns(input: EvidenceArtifactResolverInput): string[] {
  return unique([
    ...(input.outputArtifactGlobs ?? []),
    ...sourceRefArtifactPatterns(input.sourceRefs ?? []),
    ...KNOWN_ARTIFACT_PATTERNS,
  ].map(normalizeRelativePath));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function gateStatusFromValue(value: unknown): TheoryRuntimeGateStatus {
  if (value === true || value === "pass" || value === "passed" || value === "ok" || value === "PASS") return "pass";
  if (value === false || value === "fail" || value === "failed" || value === "FAIL") return "fail";
  if (value === "not_ready" || value === "missing" || value === "blocked") return "not_ready";
  if (value === "not_applicable" || value === "n/a") return "not_applicable";
  return "unknown";
}

function collectGateHints(value: unknown, prefix = "gate"): Record<string, TheoryRuntimeGateStatus> {
  if (!isRecord(value)) return {};
  const hints: Record<string, TheoryRuntimeGateStatus> = {};
  const possibleGateRecords = [
    value.gates,
    value.gateStatus,
    value.gate_status,
    value.gateStatuses,
    value.checks,
    value.verdicts,
  ];
  for (const record of possibleGateRecords) {
    if (!isRecord(record)) continue;
    for (const [key, entry] of Object.entries(record)) {
      hints[key] = gateStatusFromValue(entry);
    }
  }
  if ("verdict" in value) hints[`${prefix}.verdict`] = gateStatusFromValue(value.verdict);
  if ("status" in value && typeof value.status !== "object") hints[`${prefix}.status`] = gateStatusFromValue(value.status);
  return hints;
}

function hasStaleMarker(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.stale === true || value.isStale === true) return true;
  if (value.freshness === "stale" || value.freshnessStatus === "stale") return true;
  if (isRecord(value.freshness)) {
    if (value.freshness.stale === true || value.freshness.status === "stale") return true;
  }
  if (value.status === "stale" || value.artifactStatus === "stale") return true;
  return false;
}

async function expandPattern(projectRoot: string, pattern: string): Promise<string[]> {
  const absolute = path.resolve(projectRoot, pattern);
  if (!looksLikeGlob(pattern)) {
    try {
      const stat = await fs.stat(absolute);
      if (stat.isFile()) return [normalizeRelativePath(path.relative(projectRoot, absolute))];
      if (stat.isDirectory()) {
        return fg(`${normalizeRelativePath(pattern)}/**/*.{json,md}`, {
          cwd: projectRoot,
          onlyFiles: true,
          dot: false,
          unique: true,
        });
      }
    } catch {
      return [];
    }
  }
  return fg(pattern, {
    cwd: projectRoot,
    onlyFiles: true,
    dot: false,
    unique: true,
  });
}

async function inspectArtifact(projectRoot: string, relativePath: string): Promise<{
  artifact: EvidenceArtifactResolverArtifact;
  gateHints: Record<string, TheoryRuntimeGateStatus>;
  warnings: string[];
}> {
  const absolutePath = path.resolve(projectRoot, relativePath);
  const stat = await fs.stat(absolutePath);
  const artifact: EvidenceArtifactResolverArtifact = {
    path: normalizeRelativePath(relativePath),
    absolutePath,
    sizeBytes: stat.size,
    mtimeMs: stat.mtimeMs,
    parsed: false,
    stale: false,
    parseError: null,
  };
  const warnings: string[] = [];
  let gateHints: Record<string, TheoryRuntimeGateStatus> = {};
  if (relativePath.toLowerCase().endsWith(".json")) {
    try {
      const parsed = JSON.parse(await fs.readFile(absolutePath, "utf8")) as unknown;
      artifact.parsed = true;
      artifact.stale = hasStaleMarker(parsed);
      gateHints = collectGateHints(parsed, relativePath);
    } catch (error) {
      artifact.parseError = error instanceof Error ? error.message : "invalid JSON artifact";
      warnings.push(`${relativePath}: JSON parse failed; failing closed.`);
    }
  }
  return { artifact, gateHints, warnings };
}

function isWarpOrNhm2(input: EvidenceArtifactResolverInput): boolean {
  const haystack = [
    input.runtimeId,
    ...(input.badgeIds ?? []),
    ...(input.outputArtifactGlobs ?? []),
    ...(input.sourceRefs ?? []).map((ref) => ref.path ?? ""),
  ].join(" ").toLowerCase();
  return haystack.includes("nhm2") || haystack.includes("warp") || haystack.includes("full-solve");
}

async function findCertificateArtifacts(projectRoot: string): Promise<string[]> {
  return fg([...CERTIFICATE_PATTERNS], {
    cwd: projectRoot,
    onlyFiles: true,
    dot: false,
    unique: true,
  });
}

function receiptStatus(args: {
  foundCount: number;
  parseFailed: boolean;
  stale: boolean;
}): TheoryRuntimeReceiptStatus {
  if (args.parseFailed) return "failed";
  if (args.foundCount === 0) return "not_run";
  if (args.stale) return "stale";
  return "completed";
}

export async function resolveEvidenceArtifacts(
  input: EvidenceArtifactResolverInput,
): Promise<EvidenceArtifactResolverOutput> {
  const projectRoot = input.projectRoot ? path.resolve(input.projectRoot) : process.cwd();
  const patterns = candidatePatterns(input);
  const foundByPattern = new Map<string, string[]>();
  for (const pattern of patterns) {
    foundByPattern.set(pattern, await expandPattern(projectRoot, pattern));
  }

  const foundPaths = unique([...foundByPattern.values()].flat());
  const artifactsMissing = [...foundByPattern.entries()]
    .filter(([, paths]) => paths.length === 0)
    .map(([pattern]) => pattern);
  const inspected = await Promise.all(foundPaths.map((relativePath) => inspectArtifact(projectRoot, relativePath)));
  const artifactsFound = inspected.map((entry) => entry.artifact);
  const gateHints = inspected.reduce<Record<string, TheoryRuntimeGateStatus>>(
    (acc, entry) => ({ ...acc, ...entry.gateHints }),
    {},
  );
  const warnings = inspected.flatMap((entry) => entry.warnings);
  const stale = artifactsFound.some((artifact) => artifact.stale);
  const parseFailed = artifactsFound.some((artifact) => artifact.parseError);
  const missingSignals = artifactsMissing.map((pattern) => `missing:${pattern}`);

  if (artifactsFound.length === 0) warnings.push("No evidence artifacts were found; runtime is treated as not_run.");
  if (stale) warnings.push("At least one evidence artifact is marked stale.");

  let promotionBlockedBy = [...missingSignals];
  if (isWarpOrNhm2(input)) {
    const certificates = await findCertificateArtifacts(projectRoot);
    if (certificates.length === 0) {
      promotionBlockedBy = unique([...promotionBlockedBy, "missing_certificate"]);
      gateHints.certificate_integrity = "not_ready";
      warnings.push("NHM2/warp evidence is fail-closed because no certificate artifact was found.");
    }
  }

  const status = receiptStatus({
    foundCount: artifactsFound.length,
    parseFailed,
    stale,
  });

  const receiptV1 = buildTheoryRuntimeReceiptV1({
    generatedAt: input.generatedAt,
    receiptId: `evidence:${input.runtimeId}:${Date.now().toString(36)}`,
    runtimeId: input.runtimeId,
    graphId: input.graphId ?? "unknown-theory-graph",
    badgeIds: input.badgeIds ?? [],
    command: input.command ?? null,
    args: {
      sourceRefs: input.sourceRefs ?? [],
      outputArtifactGlobs: input.outputArtifactGlobs ?? [],
      artifactResolver: "evidence-artifact-resolver",
    },
    status,
    outputs: {
      artifacts: artifactsFound.map((artifact) => artifact.path),
      scalars: {
        artifact_count: artifactsFound.length,
        missing_artifact_count: artifactsMissing.length,
        stale_artifact_count: artifactsFound.filter((artifact) => artifact.stale).length,
      },
      units: {},
      gates: gateHints,
      missingSignals: promotionBlockedBy,
      warnings,
    },
    provenance: {
      gitSha: null,
      startedAt: null,
      completedAt: input.generatedAt ?? new Date().toISOString(),
      durationMs: null,
    },
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: isWarpOrNhm2(input) ? "reduced_order" : "diagnostic",
      promotionAllowed: false,
      promotionBlockedBy,
    },
  });

  return {
    runtimeId: input.runtimeId,
    badgeIds: input.badgeIds ?? [],
    artifactsFound,
    artifactsMissing,
    stale,
    warnings,
    gateHints,
    missingSignals: promotionBlockedBy,
    receiptV1,
  };
}
