import { Router } from "express";
import { z } from "zod";
import { createOrUpdateProfilePanelProposal } from "../services/proposals/profile-panel-proposals";

export const profilePanelRouter = Router();

const RequestSchema = z.object({
  personaId: z.string().min(1),
});

profilePanelRouter.post("/", async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
  }
  try {
    const proposal = await createOrUpdateProfilePanelProposal(parsed.data.personaId);
    res.json({ proposal });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "profile_panel_failed", message });
  }
});
