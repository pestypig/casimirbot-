import crypto from "node:crypto";
import {
  HELIX_DOTTIE_MANIFEST_RUN_SCHEMA,
  type HelixDottieManifestRun,
  type HelixDottieManifestRunStatus,
} from "@shared/helix-dottie-manifest-run";

const runsById = new Map<string, HelixDottieManifestRun>();
const runIdsByThread = new Map<string, string[]>();

const hashShort = (value: unknown, size = 20): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const uniqueStrings = (values: unknown): string[] =>
  Array.isArray(values)
    ? Array.from(new Set(values.map(normalizeString).filter((entry): entry is string => Boolean(entry))))
    : [];

export function makeDottieManifestRunId(input: {
  threadId: string;
  roomId: string;
  presetRef: string;
  receiptRefs: string[];
  createdAt: string;
}): string {
  return `dottie_manifest_run:${hashShort([
    input.threadId,
    input.roomId,
    input.presetRef,
    input.receiptRefs,
    input.createdAt,
  ])}`;
}

export function recordDottieManifestRun(input: {
  run_id?: string | null;
  thread_id: string;
  room_id: string;
  environment_id?: string | null;
  status?: HelixDottieManifestRunStatus | null;
  preset_ref: string;
  receipt_refs?: string[] | null;
  commentary_refs?: string[] | null;
  applied_steps: HelixDottieManifestRun["applied_steps"];
  created_at?: string | null;
  updated_at?: string | null;
}): HelixDottieManifestRun {
  const threadId = normalizeString(input.thread_id);
  const roomId = normalizeString(input.room_id);
  const presetRef = normalizeString(input.preset_ref);
  if (!threadId) throw new Error("Dottie manifest run requires thread_id.");
  if (!roomId) throw new Error("Dottie manifest run requires room_id.");
  if (!presetRef) throw new Error("Dottie manifest run requires preset_ref.");

  const createdAt = normalizeString(input.created_at) ?? new Date().toISOString();
  const receiptRefs = uniqueStrings(input.receipt_refs ?? []);
  const runId = normalizeString(input.run_id) ?? makeDottieManifestRunId({
    threadId,
    roomId,
    presetRef,
    receiptRefs,
    createdAt,
  });
  const now = normalizeString(input.updated_at) ?? createdAt;

  const run: HelixDottieManifestRun = {
    schema: HELIX_DOTTIE_MANIFEST_RUN_SCHEMA,
    run_id: runId,
    preset_id: "auntie_dottie",
    thread_id: threadId,
    room_id: roomId,
    environment_id: normalizeString(input.environment_id),
    status: input.status ?? "applied_as_receipts",
    preset_ref: presetRef,
    receipt_refs: receiptRefs,
    commentary_refs: uniqueStrings(input.commentary_refs ?? []),
    applied_steps: input.applied_steps.map((step) => ({
      step: step.step,
      status: step.status,
      artifact_ref: normalizeString(step.artifact_ref),
      missing_evidence: uniqueStrings(step.missing_evidence ?? []),
    })),
    safety: {
      command_lane_enabled: false,
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
    },
    created_at: createdAt,
    updated_at: now,
  };

  runsById.set(run.run_id, run);
  const current = runIdsByThread.get(run.thread_id) ?? [];
  runIdsByThread.set(run.thread_id, Array.from(new Set([...current, run.run_id])).slice(-200));
  return run;
}

export function getDottieManifestRun(runId: string): HelixDottieManifestRun | null {
  return runsById.get(runId) ?? null;
}

export function listDottieManifestRuns(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  limit?: number;
}): HelixDottieManifestRun[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 50))) : 50;
  return (runIdsByThread.get(input.threadId) ?? [])
    .map((runId) => runsById.get(runId))
    .filter((run): run is HelixDottieManifestRun => Boolean(run))
    .filter((run) => !input.roomId || run.room_id === input.roomId)
    .filter((run) => !input.environmentId || run.environment_id === input.environmentId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetDottieManifestRunsForTest(): void {
  runsById.clear();
  runIdsByThread.clear();
}
