import { Router } from "express";
import { z } from "zod";
import { handleProposalAction, listProposals, fetchProposal } from "../services/proposals/engine";
import { proposalKindSchema, proposalSafetyStatusSchema, proposalStatusSchema } from "@shared/proposals";
import { buildPatchPromptPresets } from "../services/proposals/prompt-presets";

export const proposalsRouter = Router();

const resolveOwnerId = (req: any): string | null =>
  (req?.auth?.sub as string | undefined) ?? (req?.auth?.personaId as string | undefined) ?? null;

const ActionRequest = z.object({
  action: z.enum(["approve", "deny"]),
  note: z.string().max(2000).optional(),
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
  const ownerId = resolveOwnerId(req);
  const proposals = await listProposals(ownerId, dayParam, { kind, status, safetyStatus });
  res.json({ day: dayParam, proposals });
});

proposalsRouter.get("/:id/prompts", async (req, res) => {
  const proposal = await fetchProposal(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: "not_found" });
  }
  const ownerId = resolveOwnerId(req);
  if (proposal.ownerId && ownerId && proposal.ownerId !== ownerId) {
    return res.status(403).json({ error: "forbidden" });
  }
  if (proposal.patchKind !== "code-diff") {
    return res.json({ presets: [] });
  }
  try {
    const presets = await buildPatchPromptPresets(proposal, 3);
    res.json({ presets });
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
  const ownerId = resolveOwnerId(req);
  if (proposal.ownerId && ownerId && proposal.ownerId !== ownerId) {
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
  const ownerId = resolveOwnerId(req) ?? "anon";
  if (proposal.ownerId && ownerId && proposal.ownerId !== ownerId) {
    return res.status(403).json({ error: "forbidden" });
  }
  const updated = await handleProposalAction(proposal.id, parsed.data.action, String(ownerId), parsed.data.note);
  if (!updated) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({ ok: true, proposal: updated });
});
