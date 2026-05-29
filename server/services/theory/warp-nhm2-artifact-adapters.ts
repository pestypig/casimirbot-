import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import {
  buildTheoryRuntimeReceiptV1,
  type TheoryRuntimeGateStatus,
  type TheoryRuntimeReceiptStatus,
  type TheoryRuntimeReceiptV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";
import {
  buildTheoryCompoundRunV1,
  type TheoryCompoundRunV1,
} from "../../../shared/contracts/theory-compound-run.v1";
import { getTheoryRuntimeEntrypoint } from "../../../shared/theory/runtime-entrypoints";

export type WarpNhm2ArtifactAdapterInput = {
  runtimeId: "warp.full_solve.campaign" | "nhm2.shift_lapse.alpha_sweep";
  graphId: string;
  badgeIds: string[];
  projectRoot?: string;
  generatedAt?: string;
};

type ParsedArtifact = {
  path: string;
  absolutePath: string;
  data: unknown;
  stale: boolean;
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
  if (value === true || value === "pass" || value === "passed" || value === "ok" || value === "PASS") return "pass";
  if (value === false || value === "fail" || value === "failed" || value === "FAIL") return "fail";
  if (value === "not_ready" || value === "missing" || value === "blocked") return "not_ready";
  if (value === "not_applicable" || value === "n/a") return "not_applicable";
  return "unknown";
}

function candidateGlobs(runtimeId: string): string[] {
  const entrypoint = getTheoryRuntimeEntrypoint(runtimeId);
  return entrypoint?.outputArtifactGlobs.length
    ? entrypoint.outputArtifactGlobs
    : ["artifacts/research/full-solve/**/*.json", "docs/audits/**/*.json"];
}

async function readArtifacts(projectRoot: string, runtimeId: string): Promise<ParsedArtifact[]> {
  const paths = await fg(candidateGlobs(runtimeId), {
    cwd: projectRoot,
    onlyFiles: true,
    dot: false,
    unique: true,
  });
  const artifacts: ParsedArtifact[] = [];
  for (const relativePath of paths) {
    const absolutePath = path.resolve(projectRoot, relativePath);
    const raw = await fs.readFile(absolutePath, "utf8");
    const data = JSON.parse(raw) as unknown;
    artifacts.push({
      path: normalizeRelativePath(relativePath),
      absolutePath,
      data,
      stale: hasStaleMarker(data),
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

function collectGates(artifacts: ParsedArtifact[]): Record<string, TheoryRuntimeGateStatus> {
  const gates: Record<string, TheoryRuntimeGateStatus> = {};
  for (const artifact of artifacts) {
    walk(artifact.data, (key, entry, keyPath) => {
      if (/gate|check|verdict|status|certificate|closure|observer|audit/i.test(key)) {
        const status = gateStatusFromValue(entry);
        if (status !== "unknown" || /certificate|closure|observer|audit/i.test(key)) {
          gates[keyPath.replace(/[^A-Za-z0-9_.-]+/g, "_").slice(0, 80)] = status;
        }
      }
    });
  }
  return gates;
}

function artifactsMention(artifacts: ParsedArtifact[], pattern: RegExp): boolean {
  return artifacts.some((artifact) => pattern.test(artifact.path) || pattern.test(JSON.stringify(artifact.data)));
}

function requiredGateState(artifacts: ParsedArtifact[], gates: Record<string, TheoryRuntimeGateStatus>) {
  const sourceClosurePresent =
    artifactsMention(artifacts, /source[_\s-]?closure|closure[_\s-]?residual/i) ||
    Object.keys(gates).some((key) => /source.*closure|closure.*source/i.test(key));
  const certificatePresent =
    artifactsMention(artifacts, /certificate|integrity/i) ||
    Object.keys(gates).some((key) => /certificate|integrity/i.test(key));
  const observerAuditPresent =
    artifactsMention(artifacts, /observer.*audit|dual.*tensor|timelike|null.*observer/i) ||
    Object.keys(gates).some((key) => /observer.*audit|dual.*tensor|timelike|null.*observer/i.test(key));

  return {
    source_closure: sourceClosurePresent ? "pass" : "not_ready",
    certificate_integrity: certificatePresent ? "pass" : "not_ready",
    observer_audit: observerAuditPresent ? "pass" : "not_ready",
  } satisfies Record<(typeof REQUIRED_SIGNALS)[number], TheoryRuntimeGateStatus>;
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
  return missingSignals.map((signal) => signal.replace(/_missing$/, ""));
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
    artifacts = await readArtifacts(projectRoot, input.runtimeId);
  } catch (error) {
    parseFailed = true;
    parseWarning = error instanceof Error ? error.message : "Artifact parse failed.";
  }

  const gates = collectGates(artifacts);
  const required = requiredGateState(artifacts, gates);
  Object.assign(gates, required);
  const missingSignals = REQUIRED_SIGNALS
    .filter((signal) => required[signal] !== "pass")
    .map((signal) => `${signal}_missing`);
  const stale = artifacts.some((artifact) => artifact.stale);
  const warnings = unique([
    "Read-only NHM2/warp artifact adapter; no backend runtime executed.",
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
    command: null,
    args: {
      adapter: "read_only_warp_nhm2_artifact_adapter",
      projectRoot,
      outputArtifactGlobs: candidateGlobs(input.runtimeId),
    },
    status,
    outputs: {
      artifacts: artifacts.map((artifact) => artifact.path),
      scalars: collectScalars(artifacts),
      units: {},
      gates,
      missingSignals: parseFailed ? unique([...missingSignals, "artifact_parse_failed"]) : missingSignals,
      warnings,
    },
    provenance: {
      gitSha: null,
      startedAt: null,
      completedAt: generatedAt,
      durationMs: null,
    },
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
