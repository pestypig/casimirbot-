import { Router } from "express";
import { z } from "zod";
import { handleInformationEvent } from "../services/star/service";
import { InformationEvent } from "../../shared/star-telemetry";

const neuroRouter = Router();

const ArtifactFlags = z.record(z.number().min(0).max(1));

const NeuroFeaturePayload = z.object({
  session_id: z.string().min(3),
  session_type: z.string().optional(),
  device_id: z.string().optional(),
  host_id: z.string().optional(),
  host_mode: z.string().optional(),
  host_mass_norm: z.number().min(0).max(1).optional(),
  host_radius_norm: z.number().min(0).max(1).optional(),
  gamma_sync_z: z.number().optional(),
  phase_dispersion: z.number().min(0).max(1).optional(),
  artifact_flags: ArtifactFlags.optional(),
  sample_count: z.number().int().nonnegative().optional(),
  timestamp: z.number().int().nonnegative().optional(),
  origin: z.enum(["user", "model", "tool", "system"]).optional(),
});

neuroRouter.post("/features", (req, res) => {
  const parsed = NeuroFeaturePayload.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const payload = parsed.data;
  const bytes = Number.isFinite(payload.sample_count)
    ? Math.max(0, Math.round(payload.sample_count as number))
    : 1;
  const event = InformationEvent.parse({
    session_id: payload.session_id,
    session_type: payload.session_type,
    host_id: payload.host_id ?? payload.device_id,
    host_mode: payload.host_mode,
    host_mass_norm: payload.host_mass_norm,
    host_radius_norm: payload.host_radius_norm,
    origin: payload.origin ?? "system",
    bytes,
    complexity_score: 0.5,
    alignment: 0,
    gamma_sync_z: payload.gamma_sync_z,
    phase_dispersion: payload.phase_dispersion,
    artifact_flags: payload.artifact_flags,
    timestamp: payload.timestamp,
    metadata: {
      kind: "neuro_features",
      device_id: payload.device_id,
      artifact_flags: payload.artifact_flags,
    },
  });
  try {
    const snapshot = handleInformationEvent(event);
    res.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "star_error", message });
  }
});

export { neuroRouter };
