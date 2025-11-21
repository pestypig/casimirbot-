import { Router } from "express";
import { z } from "zod";
import { buildLocalRestSnapshot } from "../modules/stellar/local-rest";
import { computeProofs } from "../modules/stellar/evolution";
import { navPoseBus } from "../lib/nav-pose-bus";
import type { LocalRestQuery } from "@shared/stellar";

export const stellarRouter = Router();

const LsrQuery = z.object({
  epoch: z.string().optional(),
  radius_pc: z.coerce.number().positive().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  per_page: z.coerce.number().int().min(10).max(5000).optional(),
  with_oort: z.coerce.boolean().optional(),
});

// GET /api/stellar/local-rest?epoch=ISO&radius_pc=..&category=..&page=..&per_page=..
stellarRouter.get("/local-rest", async (req, res, next) => {
  try {
    const q = LsrQuery.parse(req.query);
    const snap = await buildLocalRestSnapshot(q as LocalRestQuery);
    res.json(snap);
  } catch (err) {
    next(err);
  }
});

// SSE stream: /api/stellar/local-rest/stream?epoch=ISO&radius_pc=...
stellarRouter.get("/local-rest/stream", async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const q = LsrQuery.parse(req.query);
  buildLocalRestSnapshot(q as LocalRestQuery)
    .then((snap) => send("snapshot", snap))
    .catch((err) => send("error", { message: String(err) }));

  const onNav = (pose: any) => send("nav-pose", pose);
  navPoseBus.on("pose", onNav);

  const timer = setInterval(async () => {
    if (!q.epoch) {
      try {
        const snap = await buildLocalRestSnapshot({ ...q, epoch: new Date().toISOString() } as LocalRestQuery);
        send("snapshot", snap);
      } catch (err) {
        send("error", { message: String(err) });
      }
    }
  }, Number(process.env.LSR_SSE_REFRESH_MS ?? 5000));

  req.on("close", () => {
    clearInterval(timer);
    navPoseBus.off("pose", onNav);
    res.end();
  });
});

// --- Evolution endpoints (analytical closures for HR overlay + proofs) ---
const proofsQuerySchema = z.object({
  T_K: z.coerce.number().positive().finite(),
  nH_cm3: z.coerce.number().positive().finite(),
  mass_Msun: z.coerce.number().positive().finite().default(1),
  metallicity_Z: z.coerce.number().positive().finite().max(0.1).default(0.0142),
  Y_He: z.coerce.number().positive().finite().max(0.35).default(0.28),
  epochMs: z.coerce.number().optional(),
});

const trackQuerySchema = z.object({
  mass_Msun: z.coerce.number().positive().finite().default(1),
  metallicity_Z: z.coerce.number().positive().finite().max(0.1).default(0.0142),
});

stellarRouter.get("/evolution/proofs", (req, res) => {
  const parsed = proofsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_query", issues: parsed.error.issues });
  }
  try {
    const proofs = computeProofs(parsed.data);
    return res.json(proofs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "compute_failed", message });
  }
});

stellarRouter.get("/evolution/track", (req, res) => {
  const parsed = trackQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_query", issues: parsed.error.issues });
  }
  // reuse computeProofs to generate coarse track (ignore cloud inputs)
  const proofs = computeProofs({
    T_K: 10,
    nH_cm3: 100,
    mass_Msun: parsed.data.mass_Msun,
    metallicity_Z: parsed.data.metallicity_Z,
  });
  return res.json({
    input: { mass_Msun: proofs.input.mass_Msun, metallicity_Z: proofs.input.metallicity_Z },
    track: proofs.track,
    meta: proofs.meta,
  });
});
