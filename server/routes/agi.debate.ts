import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { DebateConfig } from "@shared/essence-debate";
import {
  DEBATE_CLAIM_TIERS,
  DEBATE_PROVENANCE_CLASSES,
  type DebateEvidenceProvenance,
} from "../services/debate/types";
import { personaPolicy } from "../auth/policy";
import {
  getDebateOwner,
  getDebateSnapshot,
  getDebateTelemetry,
  listDebateEvents,
  resumeDebate,
  startDebate,
  subscribeToDebate,
  type DebateStreamEvent,
} from "../services/debate/orchestrator";

const debateRouter = Router();

const StreamQuery = z.object({
  debateId: z.string().min(4, "debateId is required"),
});

const TelemetryQuery = z.object({
  debateId: z.string().min(4, "debateId is required"),
});

export function resolveDebatePersonaId(req: Request, candidate?: string | null): string {
  let personaId = (candidate ?? "").trim();
  if (personaPolicy.shouldRestrictRequest(req.auth) && (!personaId || personaId === "default") && req.auth?.sub) {
    personaId = req.auth.sub;
  }
  if (!personaId) {
    personaId = "default";
  }
  return personaId;
}

debateRouter.post("/start", async (req, res) => {
  const payload = normalizeStartPayload(req.body);
  const parsed = DebateConfig.safeParse(payload);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const personaId = resolveDebatePersonaId(req, parsed.data.persona_id);
  if (!personaPolicy.canAccess(req.auth, personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const config = { ...parsed.data, persona_id: personaId };
  const { debateId } = await startDebate(config);
  const snapshot = getDebateSnapshot(debateId);
  res.json({
    debateId,
    evidence_provenance: snapshot?.outcome
      ? {
          provenance_class: snapshot.outcome.provenance_class,
          claim_tier: snapshot.outcome.claim_tier,
          certifying: snapshot.outcome.certifying,
          fail_reason: snapshot.outcome.fail_reason ?? undefined,
        }
      : normalizeDebateEvidenceProvenance(config.context),
  });
});

debateRouter.get("/stream", (req, res) => {
  const parsed = StreamQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const { debateId } = parsed.data;
  const ownerId = getDebateOwner(debateId);
  if (!ownerId) {
    return res.status(404).json({ error: "debate_not_found" });
  }
  if (!personaPolicy.canAccess(req.auth, ownerId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  res.write(`retry: 5000\n\n`);

  const lastEventId = req.get("last-event-id") ?? req.get("Last-Event-ID");
  const sinceSeq = parseSequence(lastEventId);
  const backlog = listDebateEvents(debateId, sinceSeq);
  backlog.forEach((event) => sendEvent(res, event));

  const unsubscribe = subscribeToDebate(debateId, (event) => sendEvent(res, event));
  const ping = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {}\n\n`);
    } catch {
      // ignore broken pipes; cleanup will run via close handler
    }
  }, 25000);

  const cleanup = () => {
    clearInterval(ping);
    unsubscribe();
    try {
      res.end();
    } catch {
      // ignore teardown errors
    }
  };
  req.on("close", cleanup);
  req.on("error", cleanup);
  resumeDebate(debateId);
});

debateRouter.get("/telemetry", (req, res) => {
  const parsed = TelemetryQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const { debateId } = parsed.data;
  const ownerId = getDebateOwner(debateId);
  if (!ownerId) {
    return res.status(404).json({ error: "debate_not_found" });
  }
  if (!personaPolicy.canAccess(req.auth, ownerId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const snapshot = getDebateTelemetry(debateId);
  if (!snapshot) {
    return res.status(404).json({ error: "debate_not_found" });
  }
  res.json(snapshot);
});

debateRouter.get("/:id", (req, res) => {
  const snapshot = getDebateSnapshot(req.params.id);
  if (!snapshot) {
    return res.status(404).json({ error: "debate_not_found" });
  }
  if (!personaPolicy.canAccess(req.auth, snapshot.persona_id, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  res.json(snapshot);
});

function normalizeStartPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const input = raw as Record<string, unknown>;
  const goal = typeof input.goal === "string" ? input.goal : undefined;
  const persona_id =
    typeof input.persona_id === "string"
      ? input.persona_id
      : typeof input.personaId === "string"
        ? input.personaId
        : undefined;
  const evidenceProvenance = parseEvidenceProvenance(input.evidence_provenance);
  const strictProvenance = input.strict_provenance === true;
  const contextInput =
    input.context && typeof input.context === "object"
      ? ({ ...(input.context as Record<string, unknown>) } as Record<string, unknown>)
      : undefined;

  if (strictProvenance) {
    const knowledgeHints =
      contextInput?.knowledge_hints && typeof contextInput.knowledge_hints === "object"
        ? ({ ...(contextInput.knowledge_hints as Record<string, unknown>) } as Record<string, unknown>)
        : {};
    knowledgeHints.strict_provenance = true;
    if (contextInput) {
      contextInput.knowledge_hints = knowledgeHints;
    }
  }

  if (evidenceProvenance) {
    const existingWarp =
      contextInput?.warp_grounding && typeof contextInput.warp_grounding === "object"
        ? ({ ...(contextInput.warp_grounding as Record<string, unknown>) } as Record<string, unknown>)
        : {};
    if (evidenceProvenance.certifying) {
      existingWarp.status = existingWarp.status ?? "ADMISSIBLE";
      existingWarp.certificateHash = existingWarp.certificateHash ?? "manual:debate-start";
    }
    if (contextInput) {
      contextInput.warp_grounding = existingWarp;
    }
  }

  return {
    ...input,
    goal,
    persona_id,
    context: contextInput ?? input.context,
  };
}

function parseEvidenceProvenance(input: unknown): DebateEvidenceProvenance | undefined {
  if (!input || typeof input !== "object") return undefined;
  const candidate = input as Record<string, unknown>;
  if (!DEBATE_PROVENANCE_CLASSES.includes(candidate.provenance_class as any)) return undefined;
  if (!DEBATE_CLAIM_TIERS.includes(candidate.claim_tier as any)) return undefined;
  if (typeof candidate.certifying !== "boolean") return undefined;
  return {
    provenance_class: candidate.provenance_class as DebateEvidenceProvenance["provenance_class"],
    claim_tier: candidate.claim_tier as DebateEvidenceProvenance["claim_tier"],
    certifying: candidate.certifying,
  };
}

function normalizeDebateEvidenceProvenance(context: unknown): DebateEvidenceProvenance {
  const warp =
    context && typeof context === "object" && (context as Record<string, unknown>).warp_grounding
      ? ((context as Record<string, unknown>).warp_grounding as Record<string, unknown>)
      : undefined;
  const certifying = warp?.status === "ADMISSIBLE" && typeof warp?.certificateHash === "string";
  if (certifying) {
    return { provenance_class: "measured", claim_tier: "certified", certifying: true };
  }
  return { provenance_class: "proxy", claim_tier: "diagnostic", certifying: false };
}

function sendEvent(res: Response, event: DebateStreamEvent): void {
  try {
    res.write(`id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  } catch {
    // ignore broken pipes
  }
}

function parseSequence(value?: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export { debateRouter };
