import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { recordTrainingTrace } from "../services/observability/training-trace-store.js";
import {
  demonstrationIngestSchema,
  retargetDemonstrationToPrimitiveDag,
} from "../services/demonstration-retargeting.js";
import { runPickPlaceBenchmark } from "../services/robotics-benchmark.js";

const demonstrationRouter = Router();

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Tenant-Id, X-Customer-Id, X-Org-Id, traceparent, tracestate",
  );
  res.setHeader("Access-Control-Expose-Headers", "traceparent, tracestate");
};

const requestSchema = z.object({
  demo: demonstrationIngestSchema,
  persistTrace: z.boolean().optional(),
});

demonstrationRouter.options("/retarget", (_req, res) => {
  setCors(res);
  res.status(200).end();
});



demonstrationRouter.post("/benchmark/pick-place", (_req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const report = runPickPlaceBenchmark();
  recordTrainingTrace({
    traceId: `benchmark:${report.traceId}`,
    pass: report.firstFail === null,
    firstFail: report.firstFail ?? undefined,
    deltas: report.deltas.map((entry) => ({
      key: entry.key,
      from: null,
      to: entry.value,
      delta: entry.value - entry.limit,
      change: "added" as const,
    })),
    metrics: {
      optimism: report.firstFail ? 0 : 1,
      entropy: report.deltas.reduce((sum, entry) => sum + Math.abs(entry.value - entry.limit), 0),
      reproducible: report.reproducible,
    },
    notes: ["phase=6", `benchmark=${report.benchmarkId}`],
  });
  return res.json({ ok: true, report });
});


demonstrationRouter.post("/retarget", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const body =
    req.body && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : {};
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid-demonstration-retarget-request",
      details: parsed.error.flatten(),
    });
  }

  const result = retargetDemonstrationToPrimitiveDag(parsed.data.demo);
  if (parsed.data.persistTrace !== false) {
    recordTrainingTrace({
      traceId: result.traceId,
      pass: result.kinematicValidity.ok,
      deltas: result.primitives.map((primitive) => ({
        key: `${primitive.id}.avg_step_norm`,
        from: null,
        to: primitive.avgStepNorm,
        delta: primitive.avgStepNorm,
        change: "added",
      })),
      metrics: {
        optimism: result.kinematicValidity.ok ? 1 : 0,
        entropy:
          result.primitives.length > 0
            ? result.primitives.reduce((sum, primitive) => sum + primitive.avgJointDelta, 0) /
              result.primitives.length
            : 0,
      },
      payload: {
        kind: "movement_episode",
        data: {
          episodeId: `${result.traceId}:demonstration`,
          traceId: result.traceId,
          primitivePath: result.primitives.map((primitive) => primitive.id),
          metrics: {
            optimism: result.kinematicValidity.ok ? 1 : 0,
            entropy:
              result.primitives.length > 0
                ? result.primitives.reduce((sum, primitive) => sum + primitive.avgJointDelta, 0) /
                  result.primitives.length
                : 0,
          },
          events: result.primitives.map((primitive) => ({
            phase: "premeditate" as const,
            ts: new Date(primitive.startTs).toISOString(),
            candidateId: primitive.id,
            metadata: {
              kind: primitive.kind,
              dagNode: `node-${primitive.id}`,
            },
          })),
          replaySeed: result.replaySeed,
          notes: [
            `dag_nodes=${result.dag.nodes.length}`,
            `dag_edges=${result.dag.edges.length}`,
          ],
        },
      },
      notes: ["phase=4", `kinematic_ok=${result.kinematicValidity.ok}`],
    });
  }

  return res.json({
    ok: true,
    result,
  });
});

export { demonstrationRouter };
