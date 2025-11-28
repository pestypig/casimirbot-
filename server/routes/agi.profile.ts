import { Router } from "express";
import { z } from "zod";
import { summarizeEssenceProfileFromChats } from "../services/profile-summarizer";
import { getLatestProfileSummary } from "../db/profileSummaries";

export const profileRouter = Router();

const SummarizeRequest = z.object({
  personaId: z.string().min(1),
  hours: z.number().int().min(1).max(72).optional(),
  limit: z.number().int().min(1).max(200).optional(),
  persist: z.boolean().optional(),
});

profileRouter.post("/summarize", async (req, res) => {
  const parsed = SummarizeRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
  }
  try {
    const result = await summarizeEssenceProfileFromChats(parsed.data.personaId, {
      hours: parsed.data.hours,
      limit: parsed.data.limit,
      persist: parsed.data.persist,
    });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "summarize_failed", message });
  }
});

profileRouter.get("/latest/:personaId", async (req, res) => {
  const personaId = req.params.personaId;
  if (!personaId) {
    return res.status(400).json({ error: "bad_request" });
  }
  try {
    const summary = await getLatestProfileSummary(personaId);
    if (!summary) {
      return res.status(404).json({ error: "not_found" });
    }
    res.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "lookup_failed", message });
  }
});
