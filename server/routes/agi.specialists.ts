import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { personaPolicy } from "../auth/policy";
import { ensureSpecialistsRegistered } from "../specialists/bootstrap";
import { listSolvers } from "../specialists/solvers";
import { listVerifiers } from "../specialists/verifiers";
import { runSpecialistPlan } from "../services/specialists/executor";

const specialistsRouter = Router();

const RunRequest = z.object({
  solver: z.string().min(1),
  verifier: z.string().optional(),
  params: z.record(z.any()).optional(),
  goal: z.string().min(3),
  personaId: z.string().min(1).default("default"),
  context: z.record(z.any()).default({}),
  repair: z.boolean().optional(),
});

specialistsRouter.use(async (_req, res, next) => {
  if (process.env.ENABLE_SPECIALISTS !== "1") {
    res.status(404).json({ error: "specialists_disabled" });
    return;
  }
  try {
    await ensureSpecialistsRegistered();
    next();
  } catch (err) {
    next(err);
  }
});

specialistsRouter.get("/manifest", (_req, res) => {
  res.json({
    solvers: listSolvers(),
    verifiers: listVerifiers(),
  });
});

specialistsRouter.post("/run", async (req, res) => {
  const parsed = RunRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  let { personaId } = parsed.data;
  if (personaPolicy.shouldRestrictRequest(req.auth) && (!personaId || personaId === "default") && req.auth?.sub) {
    personaId = req.auth.sub;
  }
  if (!personaPolicy.canAccess(req.auth, personaId, "plan")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const traceId = crypto.randomUUID();
  try {
    const result = await runSpecialistPlan(
      {
        solver: parsed.data.solver,
        verifier: parsed.data.verifier,
        params: parsed.data.params,
        repair: parsed.data.repair,
      },
      {
        id: traceId,
        persona_id: personaId,
        goal: parsed.data.goal,
        context: parsed.data.context,
      },
      { personaId, traceId },
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: "specialist_failed", message });
  }
});

export { specialistsRouter };
