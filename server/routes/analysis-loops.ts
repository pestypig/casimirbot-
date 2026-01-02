import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { runNoiseFieldLoop } from "../../modules/analysis/noise-field-loop.js";
import { runImageDiffusionLoop } from "../../modules/analysis/diffusion-loop.js";
import { runBeliefGraphLoop } from "../../modules/analysis/belief-graph-loop.js";

const router = Router();

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const summarizeValues = (values: Float32Array) => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value < min) min = value;
    if (value > max) max = value;
    sum += value;
  }
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 0;
  const mean = values.length ? sum / values.length : 0;
  return { min, max, mean };
};

const clampSchema = z
  .object({
    min: z.number(),
    max: z.number(),
  })
  .refine((value) => value.max >= value.min, {
    message: "clamp max must be >= min",
  });

const noiseFieldRequestSchema = z
  .object({
    width: z.number().int().min(2).max(256).optional(),
    height: z.number().int().min(2).max(256).optional(),
    seed: z.number().int().min(0).max(2_147_483_647).optional(),
    maxIterations: z.number().int().min(1).max(25).optional(),
    stepSize: z.number().min(0.001).max(1).optional(),
    thresholds: z
      .object({
        laplacianRmsMax: z.number().positive(),
        laplacianMaxAbsMax: z.number().positive(),
      })
      .partial()
      .optional(),
    clamp: clampSchema.optional(),
    includeValues: z.boolean().optional(),
    includeAttempts: z.boolean().optional(),
  })
  .strict();

const diffusionRequestSchema = z
  .object({
    width: z.number().int().min(2).max(256).optional(),
    height: z.number().int().min(2).max(256).optional(),
    channels: z.number().int().min(1).max(4).optional(),
    seed: z.number().int().min(0).max(2_147_483_647).optional(),
    maxIterations: z.number().int().min(1).max(25).optional(),
    stepSize: z.number().min(0.001).max(1).optional(),
    scoreWeight: z.number().min(0).max(5).optional(),
    smoothWeight: z.number().min(0).max(5).optional(),
    thresholds: z
      .object({
        scoreRmsMax: z.number().positive(),
        fidelityRmsMax: z.number().positive(),
      })
      .partial()
      .optional(),
    clamp: clampSchema.optional(),
    targetValue: z.number().optional(),
    targetValues: z.array(z.number()).optional(),
    includeValues: z.boolean().optional(),
    includeAttempts: z.boolean().optional(),
  })
  .strict();

const beliefNodeSchema = z.object({
  id: z.string().min(1),
  score: z.number(),
  fixed: z.boolean().optional(),
});

const beliefEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  kind: z.enum(["implies", "excludes"]),
  weight: z.number().optional(),
});

const beliefGraphSchema = z.object({
  nodes: z.array(beliefNodeSchema).min(1),
  edges: z.array(beliefEdgeSchema).optional(),
});

const beliefGraphRequestSchema = z
  .object({
    graph: beliefGraphSchema.optional(),
    maxIterations: z.number().int().min(1).max(20).optional(),
    stepSize: z.number().min(0.01).max(1).optional(),
    thresholds: z
      .object({
        violationMax: z.number().int().min(0),
        violationWeightMax: z.number().min(0),
      })
      .partial()
      .optional(),
    scoreClamp: clampSchema.optional(),
    includeGraph: z.boolean().optional(),
    includeAttempts: z.boolean().optional(),
  })
  .strict();

router.options("/loops/noise-field", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

router.options("/loops/diffusion", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

router.options("/loops/belief-graph", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

router.post("/loops/noise-field", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const parsed = noiseFieldRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid-noise-loop-request",
      details: parsed.error.flatten(),
    });
  }

  const request = parsed.data;
  const width = Math.max(2, request.width ?? 32);
  const height = Math.max(2, request.height ?? 32);
  const seed = request.seed ?? 1;
  const maxIterations = request.maxIterations ?? 6;
  const stepSize = request.stepSize ?? 0.15;
  const thresholds = {
    laplacianRmsMax: 0.12,
    laplacianMaxAbsMax: 0.6,
    ...(request.thresholds ?? {}),
  };
  const includeValues = request.includeValues === true;
  const includeAttempts = request.includeAttempts === true;

  const result = runNoiseFieldLoop({
    width,
    height,
    seed,
    maxIterations,
    stepSize,
    thresholds,
    clamp: request.clamp,
  });

  const attempts = result.attempts.map((attempt) => ({
    iteration: attempt.iteration,
    accepted: attempt.accepted,
    gate: attempt.gate,
    constraints: attempt.constraints,
  }));
  const finalAttempt = attempts[attempts.length - 1] ?? null;
  const stats = summarizeValues(result.finalState.values);
  const values = includeValues
    ? Array.from(result.finalState.values)
    : undefined;

  return res.json({
    kind: "constraint-loop",
    domain: "noise-field",
    version: 1,
    config: {
      width,
      height,
      seed,
      maxIterations,
      stepSize,
      thresholds,
      clamp: request.clamp ?? null,
    },
    accepted: result.accepted,
    acceptedIteration: result.acceptedIteration ?? null,
    iterations: attempts.length,
    gate: finalAttempt?.gate ?? null,
    constraints: finalAttempt?.constraints ?? null,
    attempts: includeAttempts ? attempts : undefined,
    state: {
      width: result.finalState.width,
      height: result.finalState.height,
      encoding: "row-major",
      ...(includeValues ? { values } : {}),
    },
    stats,
  });
});

router.post("/loops/diffusion", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const parsed = diffusionRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid-diffusion-loop-request",
      details: parsed.error.flatten(),
    });
  }

  const request = parsed.data;
  const width = Math.max(2, request.width ?? 32);
  const height = Math.max(2, request.height ?? 32);
  const channels = Math.max(1, request.channels ?? 1);
  const total = width * height * channels;
  const targetValues = request.targetValues
    ? new Float32Array(request.targetValues)
    : undefined;
  if (targetValues && targetValues.length !== total) {
    return res.status(400).json({
      error: "invalid-diffusion-loop-request",
      message: "targetValues length does not match dimensions.",
    });
  }
  const maxIterations = request.maxIterations ?? 8;
  const stepSize = request.stepSize ?? 0.2;
  const thresholds = {
    scoreRmsMax: 0.08,
    fidelityRmsMax: 0.25,
    ...(request.thresholds ?? {}),
  };
  const includeValues = request.includeValues === true;
  const includeAttempts = request.includeAttempts === true;

  const result = runImageDiffusionLoop({
    width,
    height,
    channels,
    seed: request.seed ?? 1,
    maxIterations,
    stepSize,
    scoreWeight: request.scoreWeight ?? 1,
    smoothWeight: request.smoothWeight ?? 0.04,
    thresholds,
    clamp: request.clamp,
    target: targetValues,
    targetValue: request.targetValue ?? 0,
  });

  const attempts = result.attempts.map((attempt) => ({
    iteration: attempt.iteration,
    accepted: attempt.accepted,
    gate: attempt.gate,
    constraints: attempt.constraints,
  }));
  const finalAttempt = attempts[attempts.length - 1] ?? null;
  const stats = summarizeValues(result.finalState.values);
  const values = includeValues
    ? Array.from(result.finalState.values)
    : undefined;

  return res.json({
    kind: "constraint-loop",
    domain: "image-diffusion",
    version: 1,
    config: {
      width,
      height,
      channels,
      seed: request.seed ?? 1,
      maxIterations,
      stepSize,
      scoreWeight: request.scoreWeight ?? 1,
      smoothWeight: request.smoothWeight ?? 0.04,
      thresholds,
      clamp: request.clamp ?? null,
      targetValue: request.targetValue ?? 0,
      targetValuesProvided: Boolean(targetValues),
    },
    accepted: result.accepted,
    acceptedIteration: result.acceptedIteration ?? null,
    iterations: attempts.length,
    gate: finalAttempt?.gate ?? null,
    constraints: finalAttempt?.constraints ?? null,
    attempts: includeAttempts ? attempts : undefined,
    state: {
      width: result.finalState.width,
      height: result.finalState.height,
      channels: result.finalState.channels,
      encoding: "row-major-channels-last",
      ...(includeValues ? { values } : {}),
    },
    stats,
  });
});

router.post("/loops/belief-graph", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const parsed = beliefGraphRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid-belief-graph-loop-request",
      details: parsed.error.flatten(),
    });
  }

  const request = parsed.data;
  const thresholds = {
    violationMax: 0,
    violationWeightMax: 0,
    ...(request.thresholds ?? {}),
  };
  const includeGraph = request.includeGraph !== false;
  const includeAttempts = request.includeAttempts === true;

  const result = runBeliefGraphLoop({
    graph: request.graph
      ? {
          nodes: request.graph.nodes.map((node) => ({
            id: node.id,
            score: node.score,
            fixed: node.fixed,
          })),
          edges: (request.graph.edges ?? []).map((edge) => ({
            from: edge.from,
            to: edge.to,
            kind: edge.kind,
            weight: edge.weight,
          })),
        }
      : undefined,
    maxIterations: request.maxIterations,
    stepSize: request.stepSize,
    thresholds,
    scoreClamp: request.scoreClamp,
  });

  const attempts = result.attempts.map((attempt) => ({
    iteration: attempt.iteration,
    accepted: attempt.accepted,
    gate: attempt.gate,
    constraints: attempt.constraints,
  }));
  const finalAttempt = attempts[attempts.length - 1] ?? null;
  const nodeCount = result.finalState.nodes.length;
  const edgeCount = result.finalState.edges.length;

  return res.json({
    kind: "constraint-loop",
    domain: "belief-graph",
    version: 1,
    config: {
      maxIterations: request.maxIterations ?? 6,
      stepSize: request.stepSize ?? 0.25,
      thresholds,
      scoreClamp: request.scoreClamp ?? null,
    },
    summary: {
      nodeCount,
      edgeCount,
    },
    accepted: result.accepted,
    acceptedIteration: result.acceptedIteration ?? null,
    iterations: attempts.length,
    gate: finalAttempt?.gate ?? null,
    constraints: finalAttempt?.constraints ?? null,
    attempts: includeAttempts ? attempts : undefined,
    graph: includeGraph
      ? {
          nodes: result.finalState.nodes.map((node) => ({
            id: node.id,
            score: node.score,
            fixed: node.fixed,
          })),
          edges: result.finalState.edges.map((edge) => ({ ...edge })),
        }
      : undefined,
  });
});

export { router as analysisLoopRouter };
