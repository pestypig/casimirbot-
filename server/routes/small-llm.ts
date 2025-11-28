import { Router } from "express";
import { z } from "zod";
import {
  smallLlmCallSpecTriage,
  smallLlmCollapseChooser,
  smallLlmRankEvidence,
  smallLlmSortProposalsForGoal,
  smallLlmExtractProfileSignals,
  smallLlmHintTelemetry,
} from "../services/small-llm";

export const smallLlmRouter = Router();

const CallSpecSchema = z.object({
  currentChat: z.string(),
  currentPageContext: z.string().optional(),
  existingResourceHints: z.array(z.string()).optional(),
});

smallLlmRouter.post("/call-spec-triage", async (req, res) => {
  const parsed = CallSpecSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
  }
  try {
    const result = await smallLlmCallSpecTriage(parsed.data);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "triage_failed", message });
  }
});

const CollapseSchema = z.object({
  goal: z.string(),
  candidates: z.array(
    z.object({
      id: z.string(),
      summary: z.string(),
    }),
  ),
});

smallLlmRouter.post("/collapse-chooser", async (req, res) => {
  const parsed = CollapseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
  }
  try {
    const result = await smallLlmCollapseChooser(parsed.data.goal, parsed.data.candidates);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "collapse_failed", message });
  }
});

const EvidenceSchema = z.object({
  goal: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      snippet: z.string(),
      path: z.string().optional(),
    }),
  ),
});

smallLlmRouter.post("/evidence-ranking", async (req, res) => {
  const parsed = EvidenceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
  }
  try {
    const result = await smallLlmRankEvidence(parsed.data.goal, parsed.data.items);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "evidence_failed", message });
  }
});

const ProposalSortSchema = z.object({
  goal: z.string(),
  profileSummary: z.any().optional(),
  proposals: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string().optional(),
      kind: z.string(),
    }),
  ),
});

smallLlmRouter.post("/proposal-sorting", async (req, res) => {
  const parsed = ProposalSortSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
  }
  try {
    const result = await smallLlmSortProposalsForGoal(
      parsed.data.goal,
      parsed.data.profileSummary ?? null,
      parsed.data.proposals,
    );
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "proposal_sort_failed", message });
  }
});

const ProfileSignalsSchema = z.object({
  chatSnippets: z.array(z.string()),
});

smallLlmRouter.post("/profile-signals", async (req, res) => {
  const parsed = ProfileSignalsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
  }
  try {
    const result = await smallLlmExtractProfileSignals(parsed.data.chatSnippets);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "profile_signals_failed", message });
  }
});

const TelemetrySchema = z.object({
  goal: z.string(),
  telemetry: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      path: z.string().optional(),
    }),
  ),
});

smallLlmRouter.post("/telemetry-hints", async (req, res) => {
  const parsed = TelemetrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
  }
  try {
    const result = await smallLlmHintTelemetry(parsed.data.goal, parsed.data.telemetry);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "telemetry_failed", message });
  }
});
