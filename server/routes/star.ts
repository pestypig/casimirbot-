import { Router } from "express";
import { z } from "zod";
import { handleInformationEvent, getTelemetrySnapshot, forceCollapse } from "../services/star/service";
import { InformationEvent } from "../../shared/star-telemetry";

const starRouter = Router();

const TelemetryQuery = z.object({
  session_id: z.string().min(3),
  session_type: z.string().optional(),
});

const CollapseInput = z.object({
  session_id: z.string().min(3),
  session_type: z.string().optional(),
  branch_id: z.string().optional(),
  reason: z.string().optional(),
});

starRouter.post("/event", (req, res) => {
  const parsed = InformationEvent.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  try {
    const snapshot = handleInformationEvent(parsed.data);
    res.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "star_error", message });
  }
});

starRouter.get("/telemetry", (req, res) => {
  const parsed = TelemetryQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  try {
    const snapshot = getTelemetrySnapshot(parsed.data.session_id, parsed.data.session_type);
    res.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "star_error", message });
  }
});

starRouter.post("/collapse", (req, res) => {
  const parsed = CollapseInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  try {
    const decision = forceCollapse(parsed.data);
    res.json(decision);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "star_error", message });
  }
});

export { starRouter };
