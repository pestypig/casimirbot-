import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

type SweepRow = {
  profileId: string;
  fullLoopStateRaw?: string | null;
  fullLoopStateNormalized?: "pass" | "fail";
  stageDetailFreshness?: {
    allFresh?: boolean;
    staleReasonCodes?: string[];
    freshnessDecision?: "fresh" | "stale" | "missing" | "timeout" | "stall";
  } | null;
  fullLoopAvailability?: {
    strictSignalAvailable?: boolean;
    sourceClosureAvailable?: boolean;
    observerAuditAvailable?: boolean;
    certificateAvailable?: boolean;
  } | null;
  gates?: {
    promotionEligible?: "pass" | "fail";
    invariantGate?: "pass" | "fail";
    fullLoopAudit?: "pass" | "fail";
    evidenceLedger?: "pass" | "fail";
  };
  runHealth?: string;
};

type SweepSummary = {
  generatedAt: string;
  sweepName: string;
  rows: SweepRow[];
};

type LadderState =
  | "planned"
  | "completed_pass"
  | "completed_gate_fail"
  | "blocked_runtime"
  | "blocked_timeout"
  | "blocked_transport_error"
  | "skipped_after_blocker";

const repoRoot = process.cwd();
const exploratoryTags = ["0p7000", "0p6500", "0p6000", "0p5500", "0p5000"] as const;
const sweepSummaryPath = path.join(
  repoRoot,
  "artifacts",
  "research",
  "full-solve",
  "selected-family",
  "nhm2-shift-lapse",
  "alpha-sweep",
  "nhm2-lapse-alpha-sweep-latest.json",
);
const sweepRoot = path.join(
  repoRoot,
  "artifacts",
  "research",
  "full-solve",
  "selected-family",
  "nhm2-shift-lapse",
  "alpha-sweep",
);
const ladderStatusPath = path.join(
  repoRoot,
  "artifacts",
  "research",
  "full-solve",
  "selected-family",
  "nhm2-shift-lapse",
  "alpha-sweep",
  "nhm2-exploratory-controlled-ladder-latest.json",
);

const profileIdFromTag = (tag: string): string => `stage1_centerline_alpha_${tag}_v1`;

const clearProfilePublicationLock = (tag: string): void => {
  const profileId = profileIdFromTag(tag);
  const lockPath = path.join(
    sweepRoot,
    profileId,
    ".nhm2-selected-family-bounded-stack.lock",
  );
  if (!fs.existsSync(lockPath)) return;
  fs.unlinkSync(lockPath);
};

const readJson = <T>(filePath: string): T => {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
};

const runSweepForTag = (tag: string): void => {
  clearProfilePublicationLock(tag);
  const env = {
    ...process.env,
    NHM2_ALPHA_SWEEP_ONLY_TAGS: tag,
    NHM2_ALPHA_SWEEP_RUN_FULL_LOOP: "1",
  };

  const result =
    process.platform === "win32"
      ? spawnSync(
          "cmd.exe",
          ["/d", "/s", "/c", "npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep"],
          {
            cwd: repoRoot,
            env,
            stdio: "inherit",
          },
        )
      : spawnSync("sh", ["-lc", "npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep"], {
          cwd: repoRoot,
          env,
          stdio: "inherit",
        });

  if (result.error) {
    throw new Error(`Controlled ladder failed for ${tag}: ${String(result.error)}`);
  }
  if (result.signal) {
    throw new Error(`Controlled ladder failed for ${tag}: terminated by signal ${result.signal}`);
  }
  if (result.status == null) {
    throw new Error(`Controlled ladder failed for ${tag}: sweep command returned null status`);
  }
  if (result.status !== 0) {
    throw new Error(`Controlled ladder failed for ${tag}: sweep command exited with ${result.status}`);
  }
};

const assertFreshFullLoopForTag = (tag: string): SweepRow => {
  if (!fs.existsSync(sweepSummaryPath)) {
    throw new Error(`Missing sweep summary after ${tag}: ${sweepSummaryPath}`);
  }

  const summary = readJson<SweepSummary>(sweepSummaryPath);
  const profileId = profileIdFromTag(tag);
  const row = summary.rows.find((entry) => entry.profileId === profileId);
  if (!row) {
    throw new Error(`Missing row for ${profileId} in ${sweepSummaryPath}`);
  }

  const freshness = row.stageDetailFreshness;
  if (!freshness || freshness.allFresh !== true) {
    const reasonCodes = freshness?.staleReasonCodes?.join(",") ?? "unknown";
    const freshnessDecision = freshness?.freshnessDecision ?? "missing";
    throw new Error(
      `Freshness gate failed for ${profileId}: decision=${freshnessDecision}, reasons=${reasonCodes}`,
    );
  }

  if (row.fullLoopStateRaw == null || row.fullLoopStateRaw === "unavailable") {
    throw new Error(`Full-loop unavailable for ${profileId}: fullLoopStateRaw=${String(row.fullLoopStateRaw)}`);
  }

  const availability = row.fullLoopAvailability;
  if (
    !availability ||
    availability.strictSignalAvailable !== true ||
    availability.sourceClosureAvailable !== true ||
    availability.observerAuditAvailable !== true ||
    availability.certificateAvailable !== true
  ) {
    throw new Error(
      `Full-loop stage availability failed for ${profileId}: strict=${String(availability?.strictSignalAvailable)}, source=${String(availability?.sourceClosureAvailable)}, observer=${String(availability?.observerAuditAvailable)}, certificate=${String(availability?.certificateAvailable)}`,
    );
  }

  return row;
};

const runControlledLadder = (): void => {
  const runStartedAt = new Date().toISOString();
  const completed: Array<{
    tag: string;
    profileId: string;
    runHealth: string | null;
    fullLoopStateRaw: string | null;
    fullLoopStateNormalized: "pass" | "fail" | null;
    freshnessDecision: string | null;
    promotionEligible: "pass" | "fail" | null;
    invariantGate: "pass" | "fail" | null;
    fullLoopAudit: "pass" | "fail" | null;
    evidenceLedger: "pass" | "fail" | null;
  }> = [];
  const ladderRows: Array<{
    tag: string;
    profileId: string;
    ladderState: LadderState;
    blockedBy: string | null;
    runHealth: string | null;
    fullLoopStateRaw: string | null;
    fullLoopStateNormalized: "pass" | "fail" | null;
    runtimeBlockingReason: string | null;
  }> = [];
  let blockedBy: string | null = null;

  for (const tag of exploratoryTags) {
    const profileId = profileIdFromTag(tag);
    if (blockedBy != null) {
      ladderRows.push({
        tag,
        profileId,
        ladderState: "skipped_after_blocker",
        blockedBy,
        runHealth: null,
        fullLoopStateRaw: null,
        fullLoopStateNormalized: null,
        runtimeBlockingReason: null,
      });
      process.stdout.write(`[NHM2 ladder] Skipping ${tag} after blocker ${blockedBy}\n`);
      continue;
    }
    process.stdout.write(`[NHM2 ladder] Running controlled full-loop for ${tag}\n`);
    try {
      runSweepForTag(tag);
      const row = assertFreshFullLoopForTag(tag);
      completed.push({
        tag,
        profileId: row.profileId,
        runHealth: row.runHealth ?? null,
        fullLoopStateRaw: row.fullLoopStateRaw ?? null,
        fullLoopStateNormalized: row.fullLoopStateNormalized ?? null,
        freshnessDecision: row.stageDetailFreshness?.freshnessDecision ?? null,
        promotionEligible: row.gates?.promotionEligible ?? null,
        invariantGate: row.gates?.invariantGate ?? null,
        fullLoopAudit: row.gates?.fullLoopAudit ?? null,
        evidenceLedger: row.gates?.evidenceLedger ?? null,
      });
      ladderRows.push({
        tag,
        profileId: row.profileId,
        ladderState: row.fullLoopStateNormalized === "pass" ? "completed_pass" : "completed_gate_fail",
        blockedBy: null,
        runHealth: row.runHealth ?? null,
        fullLoopStateRaw: row.fullLoopStateRaw ?? null,
        fullLoopStateNormalized: row.fullLoopStateNormalized ?? null,
        runtimeBlockingReason: null,
      });
      if (row.fullLoopStateNormalized !== "pass") {
        blockedBy = row.profileId;
      }
      process.stdout.write(`[NHM2 ladder] ${tag} completed with fresh full-loop artifacts\n`);
    } catch (error) {
      const reason = String(error);
      const runtimeBlockingReason = /timeout/i.test(reason)
        ? "selected_transport_timeout"
        : /selected_transport_(process_error|missing_artifact|invalid_json|profile_mismatch|gate_fail|stale_artifact|unknown_error)|error/i.test(reason)
          ? "selected_transport_process_error"
          : "selected_transport_runtime";
      ladderRows.push({
        tag,
        profileId,
        ladderState:
          runtimeBlockingReason === "selected_transport_timeout"
            ? "blocked_timeout"
            : runtimeBlockingReason === "selected_transport_process_error"
              ? "blocked_transport_error"
              : "blocked_runtime",
        blockedBy: null,
        runHealth: "failed",
        fullLoopStateRaw: "unavailable",
        fullLoopStateNormalized: "fail",
        runtimeBlockingReason,
      });
      blockedBy = profileId;
      process.stderr.write(`[NHM2 ladder] Blocked at ${tag}: ${reason}\n`);
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    runStartedAt,
    runCompletedAt: new Date().toISOString(),
    runner: "run-nhm2-exploratory-controlled-ladder.ts",
    sweepScript: "warp:full-solve:nhm2-shift-lapse:alpha-sweep",
    policy: {
      requireSingleProfileControlledRun: true,
      requireFullLoop: true,
      requireFreshness: true,
      requireAllStageAvailability: true,
      promoteOnlyIfGateStackPasses: true,
      literatureIsContextNotProof: true,
    },
    tags: [...exploratoryTags],
    completed,
    ladderRows,
    frontier: {
      lowestPassingProfileId:
        ladderRows.filter((row) => row.ladderState === "completed_pass").slice(-1)[0]?.profileId ?? null,
      firstBlockedProfileId:
        ladderRows.find((row) =>
          row.ladderState === "blocked_runtime" ||
          row.ladderState === "blocked_timeout" ||
          row.ladderState === "blocked_transport_error" ||
          row.ladderState === "completed_gate_fail",
        )?.profileId ?? null,
      promotionState: blockedBy == null ? "open" : "blocked",
    },
  };

  fs.writeFileSync(ladderStatusPath, `${JSON.stringify(payload, null, 2)}\n`);
  process.stdout.write(`${ladderStatusPath}\n`);
};

const isEntryPoint = (() => {
  if (!process.argv[1]) return false;
  try {
    return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
  } catch {
    return false;
  }
})();

if (isEntryPoint) {
  try {
    runControlledLadder();
  } catch (error) {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  }
}
