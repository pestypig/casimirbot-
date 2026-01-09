import crypto from "node:crypto";
import type { EssenceProposal, ProposalKind, ProposalSafetyStatus, ProposalStatus } from "@shared/proposals";
import type { Job } from "@shared/jobs";
import { awardTokens } from "../jobs/token-budget";
import { addUserJob } from "../jobs/engine";
import { scanForUnregisteredPanels } from "./panel-scanner";
import { essenceHub } from "../essence/events";
import { upsertUiPreference } from "../essence/preferences";
import {
  getProposalById,
  getProposalByJobId,
  listProposalsForDay,
  recordProposalAction,
  updateProposalFields,
  upsertProposal,
} from "../../db/proposals";

const DEFAULT_REWARD = Number(process.env.ESSENCE_PROPOSAL_REWARD ?? 250);

const todayKey = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const ownerCacheKey = (ownerId?: string | null) => (ownerId && ownerId.trim() ? ownerId.trim() : "anon");
const ensureCache = new Map<string, Promise<EssenceProposal[]>>();

export async function ensureDailyPanelProposals(ownerId?: string | null, day = todayKey()): Promise<EssenceProposal[]> {
  const key = `${ownerCacheKey(ownerId)}:${day}`;
  const cached = ensureCache.get(key);
  if (cached) {
    return cached;
  }
  const promise = (async () => {
    const existing = await listProposalsForDay(day, { ownerId, includeShared: false });
    if (existing.length) {
      return existing;
    }
    const seeds = scanForUnregisteredPanels();
    const nowIso = new Date().toISOString();
    const proposals = seeds.map((seed) =>
      upsertProposal({
        id: makeProposalId(ownerId, day, seed.id),
        kind: "panel",
        status: "new",
        source: "essence:proposal",
        title: seed.title,
        summary: seed.summary,
        explanation: seed.description,
        target: { type: "panel-seed", componentPath: seed.componentPath },
        patchKind: "ui-config",
        patch: JSON.stringify({
          panelId: seed.panelId,
          componentPath: seed.componentPath,
          dataSources: seed.dataSources,
        }),
        rewardTokens: DEFAULT_REWARD,
        ownerId: ownerId ?? null,
        safetyStatus: "unknown",
        createdAt: nowIso,
        updatedAt: nowIso,
        createdForDay: day,
        metadata: {
          panelId: seed.panelId,
          componentPath: seed.componentPath,
          dataSources: seed.dataSources,
        },
      }),
    );
    await Promise.all(proposals);
    return listProposalsForDay(day, { ownerId });
  })()
    .catch((err) => {
      ensureCache.delete(key);
      throw err;
    })
    .finally(() => {
      ensureCache.delete(key);
    });
  ensureCache.set(key, promise);
  return promise;
}

export async function listProposals(
  ownerId?: string | null,
  day = todayKey(),
  opts?: { kind?: ProposalKind; status?: ProposalStatus; safetyStatus?: ProposalSafetyStatus },
): Promise<EssenceProposal[]> {
  if (ownerId && ownerCacheKey(ownerId) !== "anon") {
    await ensureDailyPanelProposals(null, day);
  }
  await ensureDailyPanelProposals(ownerId, day);
  return listProposalsForDay(day, { ...opts, ownerId });
}

export async function fetchProposal(id: string): Promise<EssenceProposal | null> {
  return getProposalById(id);
}

type ProposalAction = "approve" | "deny";

export async function handleProposalAction(
  id: string,
  action: ProposalAction,
  userId: string,
  note?: string,
): Promise<EssenceProposal | null> {
  const proposal = await getProposalById(id);
  if (!proposal) return null;

  let updated: EssenceProposal | null = null;
  switch (action) {
    case "approve":
      updated = await handleApproveProposal(proposal, userId);
      break;
    case "deny":
      updated = await handleDenyProposal(proposal, note);
      break;
    default:
      return proposal;
  }

  await recordProposalAction({
    proposalId: id,
    action,
    userId,
    note,
  });

  return updated;
}

export async function handleApproveProposal(
  proposal: EssenceProposal,
  actorId: string,
): Promise<EssenceProposal | null> {
  if (proposal.status === "applied" || proposal.status === "building") {
    return proposal;
  }
  const job = convertProposalToJob(proposal);
  const ownerId = proposal.ownerId ?? actorId;
  await updateProposalFields(proposal.id, {
    status: "building",
    safetyStatus: "pending",
    jobId: job.id,
    ownerId,
  });
  awardForAction(actorId, proposal, "approve", job.id);
  emitProposalProgress({
    proposalId: proposal.id,
    jobId: job.id,
    status: "building",
    safetyStatus: "pending",
    safetyScore: proposal.safetyScore,
    phase: "planning",
  });
  return getProposalById(proposal.id);
}

export async function handleDenyProposal(
  proposal: EssenceProposal,
  note?: string,
): Promise<EssenceProposal | null> {
  await updateProposalFields(proposal.id, {
    status: "denied",
    safetyStatus: "failed",
    safetyScore: 0,
    safetyReport: note ?? "Denied by reviewer",
    jobId: null,
    evalRunId: null,
  });
  emitProposalProgress({
    proposalId: proposal.id,
    jobId: proposal.jobId,
    status: "denied",
    safetyStatus: "failed",
    safetyScore: 0,
    phase: "review",
  });
  return getProposalById(proposal.id);
}

function convertProposalToJob(proposal: EssenceProposal): Job {
  const description = [proposal.summary, proposal.explanation].filter(Boolean).join("\n\n");
  const job: Job = {
    id: makeJobId(proposal.id),
    title: `Proposal: ${proposal.title}`,
    description,
    kind: jobKindForProposal(proposal.kind),
    priority: jobPriorityForProposal(proposal.kind),
    source: "essence:proposal",
    rewardTokens: Math.max(100, proposal.rewardTokens || DEFAULT_REWARD),
    paths: collectPaths(proposal),
    tags: [`proposal:${proposal.kind}`],
    status: "open",
    createdAt: Date.now(),
  };
  addUserJob(job);
  return job;
}

function collectPaths(proposal: EssenceProposal): string[] {
  const fromTarget =
    proposal.target.type === "panel-seed"
      ? [proposal.target.componentPath]
      : proposal.target.type === "backend-file"
        ? [proposal.target.path]
        : proposal.target.type === "backend-multi"
          ? proposal.target.paths
          : [];
  const fromMeta = Array.isArray(proposal.metadata?.dataSources) ? (proposal.metadata?.dataSources as string[]) : [];
  return Array.from(new Set([...fromTarget, ...fromMeta].filter(Boolean)));
}

function makeProposalId(ownerId: string | null | undefined, day: string, seedId: string): string {
  return crypto.createHash("sha256").update(`${ownerCacheKey(ownerId)}:${day}:${seedId}`).digest("hex").slice(0, 16);
}

function makeJobId(seed: string): string {
  return crypto.createHash("sha1").update(`proposal-job:${seed}`).digest("hex").slice(0, 16);
}

function awardForAction(userId: string, proposal: EssenceProposal, action: ProposalAction, jobId?: string): void {
  if (action !== "approve") {
    return;
  }
  const base = proposal.rewardTokens || DEFAULT_REWARD;
  const amount = Math.max(10, Math.round(base * 0.2));
  awardTokens(
    userId,
    amount,
    `proposal:${action}:${proposal.id}`,
    jobId ?? proposal.jobId ?? undefined,
    { source: "proposal", ref: proposal.id },
  );
}

function jobKindForProposal(kind: ProposalKind): Job["kind"] {
  switch (kind) {
    case "toolchain":
      return "code";
    case "knowledge":
      return "research";
    default:
      return "agi";
  }
}

function jobPriorityForProposal(kind: ProposalKind): "low" | "medium" | "high" {
  switch (kind) {
    case "toolchain":
      return "high";
    case "layout":
    case "panel":
      return "medium";
    default:
      return "low";
  }
}

function emitProposalProgress(payload: {
  proposalId: string;
  jobId?: string | null;
  status: ProposalStatus;
  safetyStatus: ProposalSafetyStatus;
  safetyScore?: number;
  progress?: number;
  phase?: string;
}): void {
  essenceHub.emit("proposal-progress", {
    type: "proposal-progress",
    ...payload,
  });
}

export function emitProposalChatMessage(payload: {
  proposalId: string;
  jobId?: string | null;
  role: "builder" | "user";
  message: string;
}): void {
  essenceHub.emit("proposal-chat", {
    type: "proposal-chat",
    proposalId: payload.proposalId,
    jobId: payload.jobId,
    role: payload.role,
    message: payload.message,
    ts: new Date().toISOString(),
  });
}

export async function handleProposalJobProgress(jobId: string, progress: number, phase?: string): Promise<void> {
  const proposal = await getProposalByJobId(jobId);
  if (!proposal) return;
  emitProposalProgress({
    proposalId: proposal.id,
    jobId,
    status: proposal.status,
    safetyStatus: proposal.safetyStatus,
    safetyScore: proposal.safetyScore,
    progress,
    phase,
  });
}

export async function handleProposalJobEvaluated(
  jobId: string,
  evalResult: { ok: boolean; safetyScore?: number; summary?: string },
): Promise<void> {
  const proposal = await getProposalByJobId(jobId);
  if (!proposal) return;
  const score = clamp01(evalResult.safetyScore);
  let status: ProposalStatus = "error";
  let safetyStatus: ProposalSafetyStatus = "failed";
  if (evalResult.ok && typeof score === "number" && score >= 0.99) {
    status = "applied";
    safetyStatus = "passed";
  } else if (evalResult.ok) {
    status = "error";
    safetyStatus = "failed";
  }
  await updateProposalFields(proposal.id, {
    status,
    safetyStatus,
    safetyScore: score,
    safetyReport: evalResult.summary,
  });
  if (status === "applied") {
    await persistAppliedPreference(proposal, score);
  }
  emitProposalProgress({
    proposalId: proposal.id,
    jobId,
    status,
    safetyStatus,
    safetyScore: score,
    phase: "running-evals",
  });
}

const clamp01 = (value?: number): number | undefined => {
  if (!Number.isFinite(value ?? NaN)) {
    return undefined;
  }
  return Math.min(1, Math.max(0, Number(value)));
};

async function persistAppliedPreference(proposal: EssenceProposal, score?: number): Promise<void> {
  if (!proposal.ownerId) {
    return;
  }
  const key = buildPreferenceKey(proposal);
  const value = {
    proposalId: proposal.id,
    title: proposal.title,
    summary: proposal.summary,
    kind: proposal.kind,
    target: proposal.target,
    metadata: proposal.metadata ?? null,
    patchKind: proposal.patchKind,
    patch: proposal.patch,
    appliedAt: new Date().toISOString(),
    safetyScore: score ?? proposal.safetyScore ?? null,
  };
  await upsertUiPreference(proposal.ownerId, key, value);
}

function buildPreferenceKey(proposal: EssenceProposal): string {
  if (proposal.kind === "panel" && proposal.target.type === "panel-seed") {
    const panelId =
      (proposal.metadata?.panelId as string | undefined) ??
      proposal.target.componentPath.replace(/[^a-z0-9]+/gi, "-");
    return `panel:${panelId}`;
  }
  return `proposal:${proposal.kind}:${proposal.id}`;
}
