import fs from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import fg from "fast-glob";
import {
  buildTheoryRuntimeOutputManifestV1,
  buildTheoryRuntimeReceiptV1,
  validateTheoryRuntimeOutputManifestV1,
  type TheoryRuntimeArtifactEvidenceV1,
  type TheoryRuntimeArtifactFreshness,
  type TheoryRuntimeGateStatus,
  type TheoryRuntimeExecutionV1,
  type TheoryRuntimeOutputManifestV1,
  type TheoryRuntimeReceiptStatus,
  type TheoryRuntimeReceiptV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";
import {
  buildTheoryCompoundRunV1,
  type TheoryCompoundRunV1,
} from "../../../shared/contracts/theory-compound-run.v1";
import { getTheoryRuntimeEntrypoint } from "../../../shared/theory/runtime-entrypoints";
import { sha256TheoryRuntimeFile } from "./runtime-artifact-manifest";

export type WarpNhm2ArtifactAdapterInput = {
  runtimeId: "warp.full_solve.campaign" | "nhm2.shift_lapse.alpha_sweep";
  graphId: string;
  badgeIds: string[];
  projectRoot?: string;
  generatedAt?: string;
  requestId?: string;
  outputDirectory?: string;
  artifactManifest?: TheoryRuntimeOutputManifestV1;
  command?: string;
  provenance?: TheoryRuntimeReceiptV1["provenance"];
  execution?: TheoryRuntimeExecutionV1;
  warnings?: string[];
};

type ParsedArtifact = {
  path: string;
  absolutePath: string;
  data: unknown;
  stale: boolean;
  sha256: string;
  sizeBytes: number;
  modifiedAt: string;
  freshness: TheoryRuntimeArtifactFreshness;
};

const REQUIRED_SIGNALS = [
  "source_closure",
  "certificate_integrity",
  "observer_audit",
] as const;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function gateStatusFromValue(value: unknown): TheoryRuntimeGateStatus {
  if (value === true) return "pass";
  if (value === false) return "fail";
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (["pass", "passed", "ok", "integrity_ok", "admissible"].includes(normalized)) return "pass";
  if (["review", "audit_review", "needs_review", "under_review"].includes(normalized)) return "review";
  if (["fail", "failed", "rejected", "invalid"].includes(normalized)) return "fail";
  if (["not_ready", "missing", "blocked", "pending"].includes(normalized)) return "not_ready";
  if (["not_applicable", "n/a"].includes(normalized)) return "not_applicable";
  return "unknown";
}

function candidateGlobs(runtimeId: string): string[] {
  const entrypoint = getTheoryRuntimeEntrypoint(runtimeId);
  return entrypoint?.outputArtifactGlobs.length
    ? entrypoint.outputArtifactGlobs
    : ["artifacts/research/full-solve/**/*.json", "docs/audits/**/*.json"];
}

async function readArtifacts(input: {
  projectRoot: string;
  runtimeId: string;
  artifactManifest?: TheoryRuntimeOutputManifestV1;
  outputDirectory?: string;
}): Promise<ParsedArtifact[]> {
  const paths = input.artifactManifest
    ? input.artifactManifest.entries.map((entry) => entry.path)
    : await fg(candidateGlobs(input.runtimeId), {
        cwd: input.projectRoot,
        onlyFiles: true,
        dot: false,
        unique: true,
      });
  const artifacts: ParsedArtifact[] = [];
  const manifestEntryByPath = new Map(
    input.artifactManifest?.entries.map((entry) => [normalizeRelativePath(entry.path), entry]) ?? [],
  );
  const outputDirectory = input.outputDirectory
    ? path.resolve(input.projectRoot, input.outputDirectory)
    : null;
  let realOutputDirectory: string | null = null;
  if (outputDirectory && input.artifactManifest) {
    const outputStat = await fs.lstat(outputDirectory);
    if (outputStat.isSymbolicLink()) {
      throw new Error("Runtime output directory must not be a symbolic link.");
    }
    const [realProjectRoot, resolvedRealOutputDirectory] = await Promise.all([
      fs.realpath(input.projectRoot),
      fs.realpath(outputDirectory),
    ]);
    if (
      resolvedRealOutputDirectory === realProjectRoot ||
      !isPathInside(realProjectRoot, resolvedRealOutputDirectory)
    ) {
      throw new Error("Runtime output directory escaped the real project root.");
    }
    realOutputDirectory = resolvedRealOutputDirectory;
  }
  for (const relativePath of paths) {
    const absolutePath = path.resolve(input.projectRoot, relativePath);
    if (input.artifactManifest && (!outputDirectory || !isPathInside(outputDirectory, absolutePath))) {
      throw new Error(`Runtime manifest entry is outside the requested output directory: ${relativePath}`);
    }
    const lstat = await fs.lstat(absolutePath);
    if (input.artifactManifest && lstat.isSymbolicLink()) {
      throw new Error(`Runtime manifest entry must not be a symbolic link: ${relativePath}`);
    }
    if (input.artifactManifest && realOutputDirectory) {
      const realArtifactPath = await fs.realpath(absolutePath);
      if (!isPathInside(realOutputDirectory, realArtifactPath)) {
        throw new Error(`Runtime manifest entry escaped the requested output directory: ${relativePath}`);
      }
    }
    const stat = await fs.stat(absolutePath);
    let data: unknown = null;
    if (path.extname(relativePath).toLowerCase() === ".json") {
      const raw = await fs.readFile(absolutePath, "utf8");
      data = JSON.parse(raw) as unknown;
    }
    artifacts.push({
      path: normalizeRelativePath(relativePath),
      absolutePath,
      data,
      stale: hasStaleMarker(data),
      sha256: await sha256TheoryRuntimeFile(absolutePath),
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      freshness: manifestEntryByPath.get(normalizeRelativePath(relativePath))?.freshness ?? "preexisting",
    });
  }
  return artifacts;
}

function hasStaleMarker(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.stale === true || value.isStale === true) return true;
  if (value.status === "stale" || value.freshness === "stale" || value.freshnessStatus === "stale") return true;
  if (isRecord(value.freshness) && (value.freshness.status === "stale" || value.freshness.stale === true)) return true;
  return false;
}

function walk(value: unknown, visit: (key: string, entry: unknown, path: string) => void, prefix = ""): void {
  if (!isRecord(value) && !Array.isArray(value)) return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visit, `${prefix}[${index}]`));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    visit(key, entry, nextPath);
    walk(entry, visit, nextPath);
  }
}

function collectScalars(artifacts: ParsedArtifact[]): Record<string, number | string | boolean | null> {
  const scalars: Record<string, number | string | boolean | null> = {};
  for (const artifact of artifacts) {
    walk(artifact.data, (key, entry, keyPath) => {
      if (entry === null || typeof entry === "number" || typeof entry === "string" || typeof entry === "boolean") {
        const normalizedKey = keyPath.replace(/[^A-Za-z0-9_.-]+/g, "_").slice(0, 80);
        if (
          /residual|margin|status|verdict|certificate|closure|observer|audit|qei|energy|alpha|proper|coordinate/i.test(key)
        ) {
          scalars[normalizedKey] = entry;
        }
      }
    });
  }
  return scalars;
}

function artifactSchemaIdentity(artifact: ParsedArtifact): string {
  const data = artifact.data;
  if (!isRecord(data)) return "";
  const identityFields = ["artifactId", "artifact_id", "schemaVersion", "schema_version", "kind", "type", "title"];
  const values = identityFields
    .map((field) => data[field])
    .filter((value): value is string => typeof value === "string");
  return values.join(" ");
}

function artifactPresenceIdentity(artifact: ParsedArtifact): string {
  return `${artifact.path} ${artifactSchemaIdentity(artifact)}`;
}

const REQUIRED_GATE_PATTERNS: Record<(typeof REQUIRED_SIGNALS)[number], RegExp> = {
  source_closure: /source[_\s.-]*closure|closure[_\s.-]*(?:source|residual)/i,
  certificate_integrity: /(?:certificate[^\n]*integrity|integrity[^\n]*certificate)/i,
  observer_audit: /observer[_\s.-]*audit|dual[_\s.-]*tensor|timelike|null[_\s.-]*observer/i,
};

type GateObservation = {
  keyPath: string;
  status: TheoryRuntimeGateStatus;
};

function mergeGateStatuses(statuses: TheoryRuntimeGateStatus[]): TheoryRuntimeGateStatus {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("review")) return "review";
  if (statuses.includes("not_ready")) return "not_ready";
  if (statuses.includes("unknown")) return "unknown";
  if (statuses.includes("pass")) return "pass";
  if (statuses.includes("not_applicable")) return "not_applicable";
  return "unknown";
}

function isGateCue(key: string, keyPath: string): boolean {
  return /(?:^|\.)gates?(?:\.|\[)/i.test(keyPath) ||
    /^(?:status|state|verdict|result|outcome|integrity|authority|admissibility|admissible|pass|passed|ok|overallState)$/i.test(key) ||
    /(?:gate|check|status)$/i.test(key);
}

function gateObservations(artifact: ParsedArtifact): GateObservation[] {
  const observations: GateObservation[] = [];
  walk(artifact.data, (key, entry, keyPath) => {
    if ((typeof entry !== "string" && typeof entry !== "boolean") || !isGateCue(key, keyPath)) return;
    observations.push({ keyPath, status: gateStatusFromValue(entry) });
  });
  return observations;
}

function collectGates(artifacts: ParsedArtifact[]): Record<string, TheoryRuntimeGateStatus> {
  const gates: Record<string, TheoryRuntimeGateStatus> = {};
  for (const artifact of artifacts) {
    for (const observation of gateObservations(artifact)) {
      const key = observation.keyPath.replace(/[^A-Za-z0-9_.-]+/g, "_").slice(0, 80);
      gates[key] = gates[key]
        ? mergeGateStatuses([gates[key], observation.status])
        : observation.status;
    }
  }
  return gates;
}

function buildArtifactEvidence(artifacts: ParsedArtifact[]): TheoryRuntimeArtifactEvidenceV1[] {
  return artifacts.map((artifact) => {
    const observations = gateObservations(artifact);
    const gates: Record<string, TheoryRuntimeGateStatus> = {};
    for (const observation of observations) {
      const key = observation.keyPath.replace(/[^A-Za-z0-9_.-]+/g, "_").slice(0, 80);
      gates[key] = gates[key]
        ? mergeGateStatuses([gates[key], observation.status])
        : observation.status;
    }
    return {
      path: artifact.path,
      sha256: artifact.sha256,
      freshness: artifact.freshness,
      status: mergeGateStatuses(Object.values(gates)),
      gates,
    };
  });
}

type RequiredGateEvidence = {
  status: TheoryRuntimeGateStatus;
  found: boolean;
  freshAuthoritativeFound: boolean;
  artifactIssues: string[];
};

function isAggregateSignalObservation(keyPath: string, pattern: RegExp): boolean {
  const key = keyPath.split(".").at(-1) ?? keyPath;
  return (/(?:^|\.)gates?\./i.test(keyPath) && pattern.test(key)) ||
    (pattern.test(key) && /gate|check|verdict|status|integrity|authority|admissib/i.test(key));
}

function isArtifactLevelStatusObservation(keyPath: string): boolean {
  return !keyPath.includes(".") && !keyPath.includes("[") &&
    /^(?:status|state|verdict|result|outcome|integrity|authority|admissibility|admissible|pass|passed|ok|overallState)$/i.test(
      keyPath,
    );
}

function requiredGateEvidence(
  artifacts: ParsedArtifact[],
  signal: (typeof REQUIRED_SIGNALS)[number],
): RequiredGateEvidence {
  const pattern = REQUIRED_GATE_PATTERNS[signal];
  const observations: Array<GateObservation & { artifact: ParsedArtifact; aggregate: boolean }> = [];
  const artifactIssues: string[] = [];
  for (const artifact of artifacts) {
    const schemaIdentity = artifactSchemaIdentity(artifact);
    const matching = gateObservations(artifact)
      .filter((observation) =>
        pattern.test(observation.keyPath) ||
        (pattern.test(`${schemaIdentity} ${observation.keyPath}`) &&
          isArtifactLevelStatusObservation(observation.keyPath))
      )
      .map((observation) => ({
        ...observation,
        artifact,
        aggregate: isAggregateSignalObservation(observation.keyPath, pattern),
      }));
    observations.push(...matching);
    const supportingStatus = mergeGateStatuses(
      matching.filter((observation) => !observation.aggregate).map((observation) => observation.status),
    );
    if (matching.some((observation) => !observation.aggregate) && !["pass", "not_applicable"].includes(supportingStatus)) {
      artifactIssues.push(`${signal}_artifact_${supportingStatus}`);
    }
  }
  const aggregateStatuses = observations
    .filter((observation) => observation.aggregate)
    .map((observation) => observation.status);
  const allStatuses = observations.map((observation) => observation.status);
  return {
    status: observations.length > 0
      ? mergeGateStatuses(aggregateStatuses.length > 0 ? aggregateStatuses : allStatuses)
      : "not_ready",
    found: observations.length > 0,
    freshAuthoritativeFound: observations.some(
      (observation) => observation.artifact.freshness !== "preexisting" && observation.status !== "unknown",
    ),
    artifactIssues: unique(artifactIssues),
  };
}

function requiredGateState(artifacts: ParsedArtifact[]) {
  const evidence = Object.fromEntries(
    REQUIRED_SIGNALS.map((signal) => [signal, requiredGateEvidence(artifacts, signal)]),
  ) as Record<(typeof REQUIRED_SIGNALS)[number], RequiredGateEvidence>;

  return {
    gates: Object.fromEntries(
      REQUIRED_SIGNALS.map((signal) => [signal, evidence[signal].status]),
    ) as Record<(typeof REQUIRED_SIGNALS)[number], TheoryRuntimeGateStatus>,
    evidence,
  };
}

function hasPresenceOnlyGateCue(
  artifacts: ParsedArtifact[],
  evidence: Record<(typeof REQUIRED_SIGNALS)[number], RequiredGateEvidence>,
): boolean {
  return REQUIRED_SIGNALS.some((signal) => {
    if (evidence[signal].found && evidence[signal].status !== "unknown") return false;
    const pattern = REQUIRED_GATE_PATTERNS[signal];
    return artifacts.some((artifact) =>
      pattern.test(`${artifactPresenceIdentity(artifact)} ${JSON.stringify(artifact.data)}`)
    );
  });
}

function requiredSignalIssue(
  signal: (typeof REQUIRED_SIGNALS)[number],
  evidence: RequiredGateEvidence,
): string | null {
  if (evidence.status === "pass") return null;
  if (!evidence.found) return `${signal}_missing`;
  if (evidence.status === "fail") return `${signal}_failed`;
  return `${signal}_not_authoritative`;
}

type ManifestAssessment = {
  bindingOk: boolean;
  freshArtifactPresent: boolean;
  warnings: string[];
};

function isPathInside(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

function buildUnboundArtifactManifest(input: {
  runtimeId: string;
  generatedAt: string;
  artifacts: ParsedArtifact[];
}): TheoryRuntimeOutputManifestV1 {
  return buildTheoryRuntimeOutputManifestV1({
    generatedAt: input.generatedAt,
    requestId: null,
    runtimeId: input.runtimeId,
    gitSha: null,
    startedAt: null,
    completedAt: null,
    outputDirectory: null,
    boundToExecution: false,
    manifestPath: null,
    manifestSha256: null,
    entries: input.artifacts.map((artifact) => ({
      path: artifact.path,
      sha256: artifact.sha256,
      sizeBytes: artifact.sizeBytes,
      modifiedAt: artifact.modifiedAt,
      freshness: "preexisting",
    })),
  });
}

async function assessManifestBinding(input: {
  projectRoot: string;
  runtimeId: string;
  requestId?: string;
  outputDirectory?: string;
  manifest: TheoryRuntimeOutputManifestV1;
  artifacts: ParsedArtifact[];
  command?: string;
  provenance?: TheoryRuntimeReceiptV1["provenance"];
  execution?: TheoryRuntimeExecutionV1;
}): Promise<ManifestAssessment> {
  const warnings: string[] = [];
  const validationIssues = validateTheoryRuntimeOutputManifestV1(input.manifest);
  if (validationIssues.length > 0) warnings.push(`Runtime output manifest invalid: ${validationIssues.join("; ")}`);
  if (!input.manifest.boundToExecution) warnings.push("Runtime output manifest is not bound to an execution.");
  if (!input.manifest.requestId) warnings.push("Runtime output manifest requestId is missing.");
  if (!input.requestId || input.manifest.requestId !== input.requestId) {
    warnings.push("Runtime output manifest requestId does not match the active request.");
  }
  if (input.manifest.runtimeId !== input.runtimeId) warnings.push("Runtime output manifest runtimeId does not match.");

  const outputDirectory = input.outputDirectory ? path.resolve(input.projectRoot, input.outputDirectory) : null;
  const relativeOutputDirectory = outputDirectory
    ? normalizeRelativePath(path.relative(input.projectRoot, outputDirectory)) || "."
    : null;
  if (!outputDirectory || !isPathInside(input.projectRoot, outputDirectory)) {
    warnings.push("Requested runtime output directory is missing or outside the project root.");
  }
  if (input.manifest.outputDirectory !== relativeOutputDirectory) {
    warnings.push("Runtime output manifest directory does not match the requested output directory.");
  }
  if (!input.execution?.outputDirectoryBound || input.execution.outputDirectory !== relativeOutputDirectory) {
    warnings.push("Execution metadata is not bound to the requested output directory.");
  }
  const entrypointScript = getTheoryRuntimeEntrypoint(input.runtimeId)?.command?.match(/^npm\s+run\s+(.+)$/)?.[1]?.trim();
  const entrypointCommand = getTheoryRuntimeEntrypoint(input.runtimeId)?.command ?? null;
  if (!entrypointCommand || input.command !== entrypointCommand) {
    warnings.push("Receipt command does not match the registered runtime entrypoint.");
  }
  const executionCwd = input.execution
    ? path.resolve(input.projectRoot, input.execution.cwd)
    : null;
  if (!executionCwd || executionCwd !== path.resolve(input.projectRoot)) {
    warnings.push("Execution working directory does not match the project root.");
  }
  const executionRunsExpectedScript = Boolean(
    entrypointScript && input.execution?.args.some((argument, index, args) =>
      argument === "run" && args[index + 1] === "-s" && args[index + 2] === entrypointScript
    ),
  );
  if (!entrypointScript || !executionRunsExpectedScript) {
    warnings.push("Execution command does not match the registered runtime entrypoint.");
  }
  if (
    input.runtimeId === "nhm2.shift_lapse.alpha_sweep" &&
    input.execution?.environment.NHM2_OUTPUT_DIR !== relativeOutputDirectory
  ) {
    warnings.push("Execution environment is not explicitly bound through NHM2_OUTPUT_DIR.");
  }
  if (
    !input.provenance?.gitSha ||
    !input.provenance.startedAt ||
    !input.provenance.completedAt ||
    input.provenance.durationMs == null
  ) {
    warnings.push("Execution commit or interval provenance is incomplete.");
  }
  if (
    input.manifest.gitSha !== input.provenance?.gitSha ||
    input.manifest.startedAt !== input.provenance?.startedAt ||
    input.manifest.completedAt !== input.provenance?.completedAt
  ) {
    warnings.push("Runtime output manifest provenance does not match execution provenance.");
  }
  if (input.execution?.exitCode !== 0 || input.execution.timedOut) {
    warnings.push("Execution metadata does not identify a successful process exit.");
  }

  const artifactByPath = new Map(input.artifacts.map((artifact) => [artifact.path, artifact]));
  const manifestPaths = new Set<string>();
  for (const entry of input.manifest.entries) {
    if (manifestPaths.has(entry.path)) warnings.push(`Duplicate runtime manifest entry: ${entry.path}`);
    manifestPaths.add(entry.path);
    const absolutePath = path.resolve(input.projectRoot, entry.path);
    if (!outputDirectory || !isPathInside(outputDirectory, absolutePath)) {
      warnings.push(`Runtime manifest entry is outside the requested output directory: ${entry.path}`);
      continue;
    }
    const artifact = artifactByPath.get(entry.path);
    if (
      !artifact ||
      artifact.sha256 !== entry.sha256 ||
      artifact.sizeBytes !== entry.sizeBytes ||
      artifact.modifiedAt !== entry.modifiedAt
    ) {
      warnings.push(`Runtime manifest hash, size, or modification-time mismatch: ${entry.path}`);
    }
  }
  if (artifactByPath.size !== manifestPaths.size) {
    warnings.push("Runtime manifest does not account for every artifact read from the output directory.");
  }

  if (!input.manifest.manifestPath || !input.manifest.manifestSha256 || !outputDirectory) {
    warnings.push("Concrete runtime output manifest path or hash is missing.");
  } else {
    const absoluteManifestPath = path.resolve(input.projectRoot, input.manifest.manifestPath);
    if (!isPathInside(outputDirectory, absoluteManifestPath)) {
      warnings.push("Concrete runtime output manifest is outside the requested output directory.");
    } else {
      try {
        const manifestStat = await fs.lstat(absoluteManifestPath);
        if (manifestStat.isSymbolicLink()) {
          warnings.push("Concrete runtime output manifest must not be a symbolic link.");
        }
        const actualManifestSha = await sha256TheoryRuntimeFile(absoluteManifestPath);
        if (actualManifestSha !== input.manifest.manifestSha256) {
          warnings.push("Concrete runtime output manifest SHA-256 mismatch.");
        }
        const persistedManifest = JSON.parse(await fs.readFile(absoluteManifestPath, "utf8")) as unknown;
        const expectedPersistedManifest = { ...input.manifest, manifestSha256: null };
        if (!isDeepStrictEqual(persistedManifest, expectedPersistedManifest)) {
          warnings.push("Concrete runtime output manifest content does not match the bound receipt manifest.");
        }
      } catch (error) {
        warnings.push(error instanceof Error ? error.message : "Concrete runtime output manifest could not be read.");
      }
    }
  }

  return {
    bindingOk: warnings.length === 0,
    freshArtifactPresent: input.manifest.entries.some(
      (entry) => entry.freshness === "new" || entry.freshness === "changed",
    ),
    warnings,
  };
}

function receiptStatus(args: {
  artifacts: ParsedArtifact[];
  parseFailed: boolean;
  stale: boolean;
  missingSignals: string[];
}): TheoryRuntimeReceiptStatus {
  if (args.parseFailed) return "failed";
  if (args.artifacts.length === 0) return "not_run";
  if (args.stale) return "stale";
  if (args.missingSignals.length > 0) return "blocked";
  return "completed";
}

function blockedByForMissing(missingSignals: string[]): string[] {
  return missingSignals.map((signal) => signal.replace(/_(?:missing|failed|not_authoritative)$/, ""));
}

function receiptRank(receipt: TheoryRuntimeReceiptV1 | null | undefined): number {
  if (!receipt) return 0;
  if (receipt.status === "completed") return 6;
  if (receipt.status === "stale") return 5;
  if (receipt.status === "blocked") return 4;
  if (receipt.status === "failed" || receipt.status === "timeout") return 3;
  return 1;
}

export async function readWarpNhm2RuntimeArtifacts(
  input: WarpNhm2ArtifactAdapterInput,
): Promise<TheoryRuntimeReceiptV1> {
  const entrypoint = getTheoryRuntimeEntrypoint(input.runtimeId);
  if (!entrypoint) throw new Error(`Runtime ${input.runtimeId} is not registered.`);
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  let artifacts: ParsedArtifact[] = [];
  let parseFailed = false;
  let parseWarning: string | null = null;

  try {
    artifacts = await readArtifacts({
      projectRoot,
      runtimeId: input.runtimeId,
      artifactManifest: input.artifactManifest,
      outputDirectory: input.outputDirectory,
    });
  } catch (error) {
    parseFailed = true;
    parseWarning = error instanceof Error ? error.message : "Artifact parse failed.";
  }

  const artifactManifest = input.artifactManifest ?? buildUnboundArtifactManifest({
    runtimeId: input.runtimeId,
    generatedAt,
    artifacts,
  });
  const manifestAssessment = input.artifactManifest && !parseFailed
    ? await assessManifestBinding({
        projectRoot,
        runtimeId: input.runtimeId,
        requestId: input.requestId,
        outputDirectory: input.outputDirectory,
        manifest: input.artifactManifest,
        artifacts,
        command: input.command,
        provenance: input.provenance,
        execution: input.execution,
      })
    : {
        bindingOk: false,
        freshArtifactPresent: false,
        warnings: [
          input.artifactManifest
            ? "Runtime output manifest could not be bound because artifact parsing failed."
            : "No run-bound runtime output manifest was supplied.",
        ],
      };
  const gates = collectGates(artifacts);
  const artifactEvidence = buildArtifactEvidence(artifacts);
  const required = requiredGateState(artifacts);
  Object.assign(gates, required.gates);
  const presenceOnlyGateSemantics = hasPresenceOnlyGateCue(artifacts, required.evidence);
  const requiredFreshEvidenceOk = REQUIRED_SIGNALS.every(
    (signal) => required.evidence[signal].freshAuthoritativeFound,
  );
  gates.runtime_gate_semantics = presenceOnlyGateSemantics ? "not_ready" : "pass";
  gates.runtime_execution_provenance = manifestAssessment.bindingOk ? "pass" : "not_ready";
  gates.runtime_artifact_freshness = manifestAssessment.bindingOk &&
      manifestAssessment.freshArtifactPresent &&
      requiredFreshEvidenceOk
    ? "pass"
    : "not_ready";
  const missingSignals = unique([
    ...REQUIRED_SIGNALS
      .map((signal) => requiredSignalIssue(signal, required.evidence[signal]))
      .filter((signal): signal is string => signal !== null),
    ...REQUIRED_SIGNALS.flatMap((signal) => required.evidence[signal].artifactIssues),
    presenceOnlyGateSemantics ? "runtime_gate_semantics_presence_only" : "",
    !manifestAssessment.bindingOk ? "runtime_artifact_freshness_unbound" : "",
    manifestAssessment.bindingOk && !manifestAssessment.freshArtifactPresent
      ? "runtime_artifact_freshness_preexisting_only"
      : "",
    manifestAssessment.bindingOk && manifestAssessment.freshArtifactPresent && !requiredFreshEvidenceOk
      ? "runtime_required_gate_fresh_evidence_missing"
      : "",
  ]);
  const stale = artifacts.some((artifact) => artifact.stale);
  const warnings = unique([
    input.artifactManifest
      ? "Run-bound NHM2/warp artifact adapter receipt."
      : "Read-only NHM2/warp artifact adapter; no backend runtime executed.",
    ...(input.warnings ?? []),
    ...manifestAssessment.warnings,
    parseWarning ?? "",
    artifacts.length === 0 ? "No existing NHM2/warp artifacts were found." : "",
    stale ? "One or more NHM2/warp artifacts are marked stale." : "",
    ...missingSignals.map((signal) => `${signal.replace(/_/g, " ")}; claim promotion blocked.`),
  ]);
  const status = receiptStatus({ artifacts, parseFailed, stale, missingSignals });
  const promotionBlockedBy = unique([
    ...entrypoint.claimBoundary.promotionRequires,
    ...blockedByForMissing(missingSignals),
    status === "failed" ? "artifact_parse_failed" : "",
    status === "stale" ? "stale_artifact" : "",
    status === "not_run" ? "artifact_missing" : "",
  ]);

  return buildTheoryRuntimeReceiptV1({
    generatedAt,
    receiptId: `runtime:${input.runtimeId}:artifact-read:${Date.now().toString(36)}`,
    runtimeId: input.runtimeId,
    graphId: input.graphId,
    badgeIds: input.badgeIds,
    command: input.command ?? null,
    args: {
      adapter: input.artifactManifest
        ? "run_bound_warp_nhm2_artifact_adapter"
        : "read_only_warp_nhm2_artifact_adapter",
      projectRoot,
      outputDirectory: artifactManifest.outputDirectory,
      outputManifestPath: artifactManifest.manifestPath,
      outputArtifactGlobs: candidateGlobs(input.runtimeId),
    },
    status,
    outputs: {
      artifacts: artifactManifest.entries.map((artifact) => artifact.path),
      scalars: collectScalars(artifacts),
      units: {},
      gates,
      missingSignals: parseFailed ? unique([...missingSignals, "artifact_parse_failed"]) : missingSignals,
      warnings,
      artifactManifest,
      artifactEvidence,
    },
    provenance: input.provenance ?? {
      gitSha: null,
      startedAt: null,
      completedAt: generatedAt,
      durationMs: null,
    },
    ...(input.execution ? { execution: input.execution } : {}),
    claimBoundary: {
      currentTier: entrypoint.claimBoundary.currentTier,
      maximumTier: entrypoint.claimBoundary.maximumTier,
      promotionAllowed: false,
      promotionBlockedBy,
    },
  });
}

export async function attachWarpNhm2ArtifactReceiptsToCompoundRun(input: {
  run: TheoryCompoundRunV1;
  projectRoot?: string;
  generatedAt?: string;
}): Promise<TheoryCompoundRunV1> {
  const runtimeIds = ["warp.full_solve.campaign", "nhm2.shift_lapse.alpha_sweep"] as const;
  let rows = input.run.rows;

  for (const runtimeId of runtimeIds) {
    const entrypoint = getTheoryRuntimeEntrypoint(runtimeId);
    const badgeIds = input.run.rows
      .filter((row) => entrypoint?.ownedBadgeIds.includes(row.badgeId))
      .map((row) => row.badgeId);
    if (badgeIds.length === 0) continue;
    const receipt = await readWarpNhm2RuntimeArtifacts({
      runtimeId,
      graphId: input.run.graphId,
      badgeIds: unique(badgeIds),
      projectRoot: input.projectRoot,
      generatedAt: input.generatedAt,
    });
    rows = rows.map((row) => {
      if (!entrypoint?.ownedBadgeIds.includes(row.badgeId) && row.kind !== "evidence") return row;
      const selectedReceipt = receiptRank(receipt) >= receiptRank(row.runtimeReceiptV1)
        ? receipt
        : row.runtimeReceiptV1;
      return {
        ...row,
        runtimeReceiptV1: selectedReceipt,
        status:
          selectedReceipt?.status === "completed"
            ? "computed"
            : selectedReceipt?.status === "failed"
              ? "failed"
              : "blocked",
        warnings: unique([...row.warnings, ...receipt.outputs.warnings]),
      };
    });
  }

  return buildTheoryCompoundRunV1({
    generatedAt: input.run.generatedAt,
    runId: input.run.runId,
    graphId: input.run.graphId,
    targetBadgeIds: input.run.targetBadgeIds,
    source: input.run.source,
    rows,
  });
}
