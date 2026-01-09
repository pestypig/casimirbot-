import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { execa } from "execa";
import { EssenceEnvelope } from "@shared/essence-schema";
import { metrics, recordTaskOutcome, evalReplayLatency, evalReplayTotal } from "../metrics";
import { runSmokeEval } from "../services/agi/eval-smoke";
import { putEnvelope } from "../services/essence/store";
import { essenceHub } from "../services/essence/events";

const evalRouter = Router();

const featureEnabled = (): boolean => process.env.ENABLE_AGI === "1";
const replayEnabled = (): boolean => process.env.ENABLE_EVAL_REPLAY === "1";

const inferBaseUrl = (req: Request): string => {
  const forwardedProto = req.get("x-forwarded-proto");
  const forwardedHost = req.get("x-forwarded-host");
  const host = forwardedHost ?? req.get("host");
  const proto = (forwardedProto ?? req.protocol ?? "http").replace(/[^a-z]+/gi, "") || "http";
  if (!host) {
    return "http://localhost:3000";
  }
  return `${proto}://${host}`;
};

evalRouter.post("/smoke", async (req, res) => {
  if (!featureEnabled()) {
    return res.status(404).json({ error: "eval_disabled" });
  }
  try {
    const baseUrl = process.env.EVAL_BASE_URL ?? inferBaseUrl(req);
    const result = await runSmokeEval({ baseUrl });
    const outcome = result.skipped ? "skipped" : result.rate >= result.target ? "ok" : "fail";
    metrics.recordEvalRun(outcome);
    if (!result.skipped) {
      recordTaskOutcome(result.rate >= result.target);
    }
    res.json({
      total: result.total,
      ok: result.ok,
      rate: result.rate,
      skipped: result.skipped,
      reason: result.reason,
      target: result.target,
      outcome,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    metrics.recordEvalRun("error");
    res.status(500).json({ error: "eval_failed", message });
  }
});

const ReplayRequest = z.object({
  traceId: z.string().trim().min(1).optional(),
  essenceId: z.string().trim().min(1).optional(),
  baseUrl: z.string().trim().min(1).optional(),
});

type EvalReplayRecord = {
  kind: "eval.replay";
  traceId?: string;
  essenceId?: string;
  ok: boolean;
  exitCode: number | null;
  timedOut: boolean;
  duration_ms: number;
  stdout: string;
  stderr: string;
  baseUrl: string;
  env: Record<string, unknown>;
  started_at: string;
  finished_at: string;
};

evalRouter.post("/replay", async (req, res) => {
  if (!replayEnabled()) {
    return res.status(404).json({ error: "replay_disabled" });
  }
  const parsed = ReplayRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const { traceId, essenceId: targetEssenceId, baseUrl: requestedBase } = parsed.data;
  const baseUrl = requestedBase || process.env.EVAL_BASE_URL || inferBaseUrl(req);
  const startedAt = Date.now();
  const startedIso = new Date(startedAt).toISOString();
  try {
    const child = await execa("pnpm", ["run", "eval:smoke"], {
      timeout: 60_000,
      reject: false,
      env: { ...process.env, FORCE_COLOR: "0", EVAL_BASE_URL: baseUrl },
    });
    const duration = Date.now() - startedAt;
    const stdout = clampTail(child.stdout, 100_000);
    const stderr = clampTail(child.stderr, 20_000);
    const ok = child.exitCode === 0 && !child.timedOut;
    const statusLabel = ok ? "ok" : "fail";
    try {
      evalReplayTotal.inc({ status: statusLabel });
      evalReplayLatency.observe(duration);
    } catch {
      /* metrics best-effort */
    }
    const record: EvalReplayRecord = {
      kind: "eval.replay",
      traceId,
      essenceId: targetEssenceId,
      ok,
      exitCode: typeof child.exitCode === "number" ? child.exitCode : null,
      timedOut: Boolean(child.timedOut),
      duration_ms: duration,
      stdout,
      stderr,
      baseUrl,
      env: collectEvalEnvFlags(),
      started_at: startedIso,
      finished_at: new Date().toISOString(),
    };
    const envelopeId = await persistEvalReplayEnvelope(record);
    res.json({
      ok,
      exitCode: typeof child.exitCode === "number" ? child.exitCode : null,
      duration_ms: duration,
      timed_out: Boolean(child.timedOut),
      stdout,
      stderr,
      essence_id: envelopeId,
      traceId,
      essenceId: targetEssenceId,
    });
  } catch (error) {
    const duration = Date.now() - startedAt;
    try {
      evalReplayTotal.inc({ status: "error" });
      evalReplayLatency.observe(duration);
    } catch {
      /* ignore metrics errors */
    }
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "eval_replay_failed", message });
  }
});

function clampTail(value: string | undefined, limit: number): string {
  if (!value) {
    return "";
  }
  if (value.length <= limit) {
    return value;
  }
  return value.slice(value.length - limit);
}

function collectEvalEnvFlags(): Record<string, unknown> {
  return {
    ENABLE_TRACE_EXPORT: process.env.ENABLE_TRACE_EXPORT === "1",
    ENABLE_POLICY_REASONS: process.env.ENABLE_POLICY_REASONS === "1",
    ENABLE_TRACE_API: process.env.ENABLE_TRACE_API === "1",
    ENABLE_EVAL_REPLAY: process.env.ENABLE_EVAL_REPLAY === "1",
    HULL_MODE: process.env.HULL_MODE === "1",
    LLM_POLICY: process.env.LLM_POLICY ?? "remote",
  };
}

async function persistEvalReplayEnvelope(record: EvalReplayRecord): Promise<string> {
  const digest = createHash("sha256").update(JSON.stringify(record)).digest("hex");
  const sourceUri = buildReplaySourceUri(record.traceId, record.essenceId);
  const envelope = EssenceEnvelope.parse({
    header: {
      id: randomUUID(),
      version: "essence/1.0",
      modality: "text",
      created_at: record.finished_at,
      source: {
        uri: sourceUri,
        original_hash: { algo: "sha256", value: digest },
        creator_id: "system/eval-replay",
        license: "CC-BY-4.0",
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility: "private", groups: [] },
    },
    features: {
      text: {
        lang: "en",
      },
    },
    embeddings: [],
    provenance: {
      pipeline: [
        {
          name: "eval.replay",
          impl_version: process.env.npm_package_version ?? "0.0.0",
          lib_hash: { algo: "sha256", value: createHash("sha256").update("eval.replay").digest("hex") },
          params: record,
          input_hash: { algo: "sha256", value: digest },
          output_hash: { algo: "sha256", value: digest },
          started_at: record.started_at,
          ended_at: record.finished_at,
        },
      ],
      merkle_root: { algo: "sha256", value: digest },
      previous: null,
      signatures: [],
    },
  });
  await putEnvelope(envelope);
  essenceHub.emit("created", { type: "created", essenceId: envelope.header.id });
  return envelope.header.id;
}

function buildReplaySourceUri(traceId?: string, essenceId?: string): string {
  if (traceId) {
    return `eval://replay/trace/${traceId}`;
  }
  if (essenceId) {
    return `eval://replay/essence/${essenceId}`;
  }
  return "eval://replay/detached";
}

export { evalRouter };
