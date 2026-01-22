import { Router } from "express";
import { z } from "zod";
import { discoverJobs, addUserJob } from "../services/jobs/engine";
import { awardEarnings, getTokenBalance } from "../services/jobs/token-budget";
import {
  fundUbiPool,
  listPayouts,
  requestPayout,
  runUbiDistribution,
  updatePayoutStatus,
} from "../services/jobs/payouts";
import { listProposals } from "../services/proposals/engine";
import {
  jobProposalSchema,
  payoutKindSchema,
  payoutStatusSchema,
  type DesktopPanelProposal,
  type Job,
  type JobProposal,
} from "@shared/jobs";
import type { EssenceProposal } from "@shared/proposals";
import { recordTask } from "../metrics";

export const jobsRouter = Router();

const resolveOwnerId = (req: any): string | null =>
  (req?.auth?.sub as string | undefined) ?? (req?.auth?.personaId as string | undefined) ?? null;

const requirePayoutAdmin = (req: any, res: any): boolean => {
  const token = process.env.ESSENCE_PAYOUT_ADMIN_TOKEN?.trim();
  if (!token) {
    return true;
  }
  const header = req.headers?.["x-payout-admin-token"];
  if (typeof header === "string" && header === token) {
    return true;
  }
  res.status(403).json({ error: "payout_forbidden" });
  return false;
};

const isPanelSeedProposal = (
  proposal: EssenceProposal,
): proposal is EssenceProposal & { target: { type: "panel-seed"; componentPath: string } } =>
  proposal.kind === "panel" && proposal.target.type === "panel-seed";

const CompleteRequest = z.object({ jobId: z.string().min(1), evidence: z.string().min(1).max(4000).optional() });
const PayoutRequest = z
  .object({
    amount: z.number().int().nonnegative(),
    destination: z.string().min(1).max(200).optional(),
    reason: z.string().min(1).max(200).optional(),
  })
  .strict();
const PayoutListQuery = z
  .object({
    kind: payoutKindSchema.optional(),
    status: payoutStatusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .partial();
const PayoutStatusRequest = z
  .object({
    status: payoutStatusSchema,
    note: z.string().min(1).max(500).optional(),
  })
  .strict();
const UbiRunRequest = z
  .object({
    minBalance: z.number().int().nonnegative().optional(),
    minPayout: z.number().int().nonnegative().optional(),
    maxUsers: z.number().int().positive().optional(),
  })
  .strict();
const UbiFundRequest = z
  .object({
    amount: z.number().int().nonnegative(),
    reason: z.string().min(1).max(200).optional(),
  })
  .strict();

jobsRouter.get("/list", (_req, res) => {
  const { jobs, generatedAt } = discoverJobs();
  res.json({ jobs, generatedAt });
});

jobsRouter.get("/proposals", async (req, res) => {
  const ownerId = resolveOwnerId(req);
  const proposals = await listProposals(ownerId);
  const panelSeeds: DesktopPanelProposal[] = proposals.filter(isPanelSeedProposal).map((p) => {
    const componentPath = (p.metadata?.componentPath as string) ?? p.target.componentPath;
    const panelId =
      (p.metadata?.panelId as string) ?? componentPath.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
    return {
      id: p.id,
      title: p.title,
      summary: p.summary,
      componentPath,
      panelId,
      dataSources: Array.isArray(p.metadata?.dataSources) ? (p.metadata?.dataSources as string[]) : [],
    };
  });
  res.json({ generatedAt: Date.now(), proposals: panelSeeds });
});

jobsRouter.get("/budget", (req, res) => {
  const userId = (req as any)?.auth?.sub || "anon";
  const balance = getTokenBalance(String(userId), true);
  res.json(balance);
});

jobsRouter.get("/payouts", (req, res) => {
  const userId = resolveOwnerId(req) ?? "anon";
  const parsed = PayoutListQuery.safeParse(req.query ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const payouts = listPayouts({
    userId,
    kind: parsed.data.kind,
    status: parsed.data.status,
    limit: parsed.data.limit,
  });
  res.json({ payouts, total: payouts.length, generatedAt: Date.now() });
});

jobsRouter.post("/payouts/request", (req, res) => {
  const userId = resolveOwnerId(req) ?? "anon";
  const parsed = PayoutRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const result = requestPayout({
    userId,
    amount: parsed.data.amount,
    destination: parsed.data.destination,
    reason: parsed.data.reason,
  });
  if (!result.ok) {
    return res.status(result.error === "invalid_amount" ? 400 : 409).json({ error: result.error });
  }
  return res.json({ ok: true, payout: result.payout });
});

jobsRouter.post("/payouts/:id/status", (req, res) => {
  if (!requirePayoutAdmin(req, res)) {
    return;
  }
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const parsed = PayoutStatusRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const updated = updatePayoutStatus(id, parsed.data.status, parsed.data.note);
  if (!updated) {
    return res.status(404).json({ error: "not_found" });
  }
  return res.json({ ok: true, payout: updated });
});

jobsRouter.post("/ubi/run", (req, res) => {
  if (!requirePayoutAdmin(req, res)) {
    return;
  }
  const parsed = UbiRunRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const result = runUbiDistribution(parsed.data);
  if (!result.ok) {
    return res.status(409).json({ error: result.reason });
  }
  return res.json(result);
});

jobsRouter.post("/ubi/fund", (req, res) => {
  if (!requirePayoutAdmin(req, res)) {
    return;
  }
  const parsed = UbiFundRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const result = fundUbiPool({ amount: parsed.data.amount, reason: parsed.data.reason });
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ ok: true, balance: result.balance });
});

jobsRouter.post("/complete", (req, res) => {
  const parsed = CompleteRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const userId = (req as any)?.auth?.sub || "anon";
  const { jobId } = parsed.data;
  const { jobs } = discoverJobs();
  const job = jobs.find((j: Job) => j.id === jobId);
  if (!job) {
    return res.status(404).json({ error: "not_found" });
  }
  // Award tokens for completion; trusting operator validation for now
  const award = Math.max(0, job.rewardTokens || 0);
  const bal = awardEarnings(
    String(userId),
    award,
    `job:complete:${job.id}`,
    job.id,
    { source: "job", ref: job.id, evidence: parsed.data.evidence },
  );
  try { recordTask(award > 0 ? "ok" : "fail"); } catch {}
  res.json({ ok: true, award, balance: bal });
});

// Propose a new job (user-submitted). Minimal heuristic validation for now.
jobsRouter.post("/propose", (req, res) => {
  const parsed = jobProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "bad_request", details: parsed.error.issues });
  }
  const proposal: JobProposal = parsed.data;
  // lightweight agreement heuristic: length + common keywords or file refs
  const text = `${proposal.title}\n${proposal.description}`.toLowerCase();
  const hasRef = Array.isArray(proposal.paths) && proposal.paths.length > 0;
  const keywords = ["error", "bug", "fail", "docs", "metric", "warp", "tile", "phase", "qi", "spectrum"];
  const hit = keywords.some((k) => text.includes(k)) || hasRef || proposal.description.length >= 120;
  const agreed = !!hit;
  const now = Date.now();
  const idSeed = `${proposal.title}:${now}`;
  const crypto = require("node:crypto");
  const id = crypto.createHash("sha256").update(idSeed).digest("hex").slice(0, 16);
  const reward = Number.isFinite(proposal.rewardTokens as any)
    ? Math.max(0, Math.floor(Number(proposal.rewardTokens)))
    : proposal.priority === "high"
      ? 400
      : proposal.priority === "low"
        ? 100
        : 200;
  const job: Job = {
    id,
    title: proposal.title,
    description: proposal.description,
    kind: proposal.kind ?? "code",
    priority: proposal.priority ?? "medium",
    source: "other",
    rewardTokens: reward,
    paths: proposal.paths ?? [],
    tags: proposal.tags ?? ["user"],
    status: agreed ? "open" : "claimed", // if not agreed, show but mark as pending review
    createdAt: now,
  };
  addUserJob(job);
  return res.json({ ok: true, agreed, job });
});
