import { Router } from "express";
import { PersonaProfile } from "@shared/essence-persona";
import { getPersona, listPersonas, savePersona } from "../db/agi";
import { personaPolicy } from "../auth/policy";

export const personaRouter = Router();
const personaUiEnabled = (): boolean => process.env.ENABLE_PERSONA_UI === "1";

personaRouter.get("/list", async (req, res) => {
  if (!personaUiEnabled()) {
    return res.status(404).json({ error: "persona_ui_disabled" });
  }
  try {
    const items = await listPersonas();
    if (!personaPolicy.shouldRestrictRequest(req.auth)) {
      return res.json({ personas: items });
    }
    if (!req.auth) {
      return res.status(403).json({ error: "forbidden" });
    }
    const allowed = personaPolicy.allowedPersonas(req.auth, "plan");
    if (allowed.size === 0) {
      return res.json({ personas: [] });
    }
    const personas = items.filter((item) => allowed.has(item.id));
    return res.json({ personas });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "persona_list_failed", message });
  }
});

personaRouter.get("/:id", async (req, res) => {
  const personaId = req.params.id;
  if (!personaPolicy.canAccess(req.auth, personaId, "persona:read")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const persona = await getPersona(personaId);
  if (!persona) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json(persona);
});

personaRouter.put("/:id", async (req, res) => {
  const personaId = req.params.id;
  if (!personaPolicy.canAccess(req.auth, personaId, "persona:write")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const parsed = PersonaProfile.safeParse({ id: personaId, ...req.body });
  if (!parsed.success) {
    return res.status(400).json(parsed.error);
  }
  const stored = await savePersona(parsed.data);
  res.json(stored);
});
