import { Router } from "express";
import { z } from "zod";
import { handleProposalAction, listProposals, fetchProposal } from "../services/proposals/engine";
import {
  isPublicPostulateStatus,
  proposalKindSchema,
  proposalSafetyStatusSchema,
  proposalStatusSchema,
} from "@shared/proposals";
import { buildPatchPromptPresets } from "../services/proposals/prompt-presets";
import { claimPostulateReceipt, submitPostulateProposal } from "../services/proposals/postulate";
import { canReadProposalForAccount, shouldListAllProposalOwnersForAccount } from "../services/proposals/access-policy";
import { getAccountSessionStatus } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import { listProposalsForDay } from "../db/proposals";

export const proposalsRouter = Router();

const resolveOwnerId = (req: any): string | null =>
  (req?.auth?.sub as string | undefined) ?? (req?.auth?.personaId as string | undefined) ?? null;

const resolveRequestAccount = async (req: any): Promise<{
  ownerId: string | null;
  accountType: "developer" | "user";
}> => {
  const jwtOwnerId = resolveOwnerId(req);
  try {
    const status = await getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie));
    const profile = status.session?.profile;
    return {
      ownerId: jwtOwnerId ?? profile?.profile_id ?? null,
      accountType: profile?.account_type === "developer" ? "developer" : "user",
    };
  } catch {
    return {
      ownerId: jwtOwnerId,
      accountType: "user",
    };
  }
};

const ActionRequest = z.object({
  action: z.enum(["approve", "deny"]),
  note: z.string().max(2000).optional(),
});

const PostulateRequest = z.object({
  proposalText: z.string().min(1).max(20000),
  userComment: z.string().max(4000).optional().nullable(),
  originatingSessionId: z.string().max(256).optional().nullable(),
  originatingAnswerId: z.string().max(256).optional().nullable(),
  evidenceContext: z.object({
    evidenceSidecarRefs: z.array(z.string().min(1).max(240)).max(24).optional(),
    promotedEquationRowRefs: z.array(z.string().min(1).max(240)).max(24).optional(),
    pageRenderRefs: z.array(z.string().min(1).max(240)).max(24).optional(),
    cropRefs: z.array(z.string().min(1).max(240)).max(24).optional(),
    graphReflectionRefs: z.array(z.string().min(1).max(240)).max(24).optional(),
    provenanceAuditRefs: z.array(z.string().min(1).max(240)).max(24).optional(),
    calculatorCheckRefs: z.array(z.string().min(1).max(240)).max(24).optional(),
    uncertaintyReductionRefs: z.array(z.string().min(1).max(240)).max(24).optional(),
  }).optional().nullable(),
});

const PostulateClaimRequest = z.object({
  receiptId: z.string().min(1).max(128),
});

const todayKey = () => new Date().toISOString().slice(0, 10);

proposalsRouter.get("/", async (req, res) => {
  const dayParam = typeof req.query.day === "string" && req.query.day ? req.query.day : todayKey();
  const kindParam = typeof req.query.kind === "string" ? req.query.kind : undefined;
  const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
  const safetyParam = typeof req.query.safety === "string" ? req.query.safety : undefined;

  const kind = kindParam && proposalKindSchema.safeParse(kindParam).success ? (kindParam as any) : undefined;
  const status = statusParam && proposalStatusSchema.safeParse(statusParam).success ? (statusParam as any) : undefined;
  const safetyStatus =
    safetyParam && proposalSafetyStatusSchema.safeParse(safetyParam).success ? (safetyParam as any) : undefined;
  const { ownerId, accountType } = await resolveRequestAccount(req);
  const proposals = await listProposals(ownerId, dayParam, {
    kind,
    status,
    safetyStatus,
    includeAllOwners: shouldListAllProposalOwnersForAccount(accountType, kind),
  });
  res.json({
    day: dayParam,
    proposals: proposals.filter((proposal) => canReadProposalForAccount(proposal, ownerId, accountType)),
  });
});

proposalsRouter.get("/postulate/board", async (req, res) => {
  const dayParam = typeof req.query.day === "string" && req.query.day ? req.query.day : todayKey();
  const proposals = await listProposalsForDay(dayParam, { kind: "postulate" });
  const board = proposals.filter((proposal) => isPublicPostulateStatus(proposal.status));
  res.json({ day: dayParam, proposals: board });
});

proposalsRouter.post("/postulate", async (req, res) => {
  const parsed = PostulateRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  try {
    const account = await resolveRequestAccount(req);
    const result = await submitPostulateProposal({
      ...parsed.data,
      submittedByAgentId: "helix-postulate-gate",
      ownerId: account.ownerId,
      accountType: account.accountType,
    });
    res.json({
      ok: true,
      proposal: result.proposal,
      score: result.score,
      receiptId: result.receiptId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: "postulate_submit_failed", message });
  }
});

proposalsRouter.post("/postulate/:id/claim", async (req, res) => {
  const parsed = PostulateClaimRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const { ownerId } = await resolveRequestAccount(req);
  if (!ownerId) {
    return res.status(401).json({ error: "sign_in_required" });
  }
  try {
    const proposal = await claimPostulateReceipt({
      proposalId: req.params.id,
      receiptId: parsed.data.receiptId,
      ownerId,
    });
    res.json({ ok: true, proposal });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: "postulate_claim_failed", message });
  }
});

const parseIdeologyPressures = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => String(entry).split(","))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

proposalsRouter.get("/:id/prompts", async (req, res) => {
  const proposal = await fetchProposal(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: "not_found" });
  }
  const { ownerId, accountType } = await resolveRequestAccount(req);
  if (!canReadProposalForAccount(proposal, ownerId, accountType)) {
    return res.status(403).json({ error: "forbidden" });
  }
  if (proposal.patchKind !== "code-diff") {
    return res.json({ presets: [] });
  }
  try {
    const ideologyPressures = parseIdeologyPressures(req.query.ideologyPressures);
    const presets = await buildPatchPromptPresets(proposal, 3, {
      pressureContext: ideologyPressures.length > 0 ? { activePressures: ideologyPressures } : undefined,
    });
    res.json({ presets, evidenceHints: ["guardrailStatus", "maturity", "traceRef", "runRef"] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "prompt_presets_failed", message });
  }
});

proposalsRouter.get("/:id", async (req, res) => {
  const proposal = await fetchProposal(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: "not_found" });
  }
  const { ownerId, accountType } = await resolveRequestAccount(req);
  if (!canReadProposalForAccount(proposal, ownerId, accountType)) {
    return res.status(403).json({ error: "forbidden" });
  }
  res.json({ proposal });
});

proposalsRouter.post("/:id/action", async (req, res) => {
  const parsed = ActionRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const proposal = await fetchProposal(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: "not_found" });
  }
  const { ownerId: resolvedOwnerId, accountType } = await resolveRequestAccount(req);
  const ownerId = resolvedOwnerId ?? "anon";
  if (proposal.kind === "postulate" && accountType !== "developer") {
    return res.status(403).json({ error: "postulate_action_requires_developer" });
  }
  const developerPostulateAccess = proposal.kind === "postulate" && accountType === "developer";
  if (proposal.ownerId && ownerId && proposal.ownerId !== ownerId && !developerPostulateAccess) {
    return res.status(403).json({ error: "forbidden" });
  }
  const updated = await handleProposalAction(proposal.id, parsed.data.action, String(ownerId), parsed.data.note);
  if (!updated) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({ ok: true, proposal: updated });
});
