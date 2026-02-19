import fs from "node:fs";
import path from "node:path";

import { helixUtilityPrompts } from "./helix-ask-utility-ab";

type LayerId = "telemetry_x_t" | "linear_baseline" | "pca_baseline" | "helical_6d" | "rho_clamp" | "natario_first";
type ArmName = "A" | "B";

type AskResponse = {
  text?: string;
  fail_reason?: string | null;
  fail_class?: string | null;
  trace_id?: string;
  debug?: {
    semantic_quality?: {
      claim_citation_link_rate?: number;
      unsupported_claim_rate?: number;
      contradiction_flag?: boolean;
      fail_reasons?: string[];
    };
    event_journal?: {
      replay_parity?: boolean;
      event_hash?: string;
    };
  } & Record<string, unknown>;
};

type PromptCase = ReturnType<typeof helixUtilityPrompts>[number];

const BASE_URL = process.env.HELIX_PHASE6_BASE_URL ?? "http://127.0.0.1:5173";
const REQUEST_TIMEOUT_MS = Number(process.env.HELIX_PHASE6_TIMEOUT_MS ?? "30000");
const PROMPT_LIMIT = Math.max(1, Number(process.env.HELIX_PHASE6_PROMPT_LIMIT ?? "6"));
const SEEDS = [
  1103, 2081, 3191, 4273, 5399, 6421, 7507, 8629, 9733, 10859,
  11939, 13007, 14143, 15269, 16381, 17489, 18617, 19739, 20849, 21961,
] as const;

const ARM_TUNING: Record<ArmName, Record<string, unknown>> = {
  A: {
    fast_quality_mode: false,
    format_enforcement: "relaxed",
    soft_expansion: 0,
    arbiter_repo_ratio: 0.5,
    arbiter_hybrid_ratio: 0.5,
  },
  B: {
    fast_quality_mode: true,
    format_enforcement: "strict",
    soft_expansion: 1,
    arbiter_repo_ratio: 0.62,
    arbiter_hybrid_ratio: 0.38,
  },
};

const avg = (values: number[]): number => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

const pickPromptSuite = (): PromptCase[] => {
  const all = helixUtilityPrompts();
  const relation = all.filter((entry) => entry.family === "relation").slice(0, 2);
  const repo = all.filter((entry) => entry.family === "repo_technical").slice(0, 2);
  const ambiguous = all.filter((entry) => entry.family === "ambiguous_general").slice(0, 2);
  return [...relation, ...repo, ...ambiguous].slice(0, PROMPT_LIMIT);
};

const hasContradiction = (payload: AskResponse | null): boolean => {
  const reasons = payload?.debug?.semantic_quality?.fail_reasons ?? [];
  return Boolean(payload?.debug?.semantic_quality?.contradiction_flag) || reasons.some((reason) => /contradiction/i.test(reason));
};

const metricFromPayload = (status: number, payload: AskResponse | null) => {
  const linkage = Number(payload?.debug?.semantic_quality?.claim_citation_link_rate ?? 0);
  const unsupported = Number(payload?.debug?.semantic_quality?.unsupported_claim_rate ?? 1);
  const failReasons = payload?.debug?.semantic_quality?.fail_reasons ?? [];
  const pass = status === 200 && !payload?.fail_reason && failReasons.length === 0;
  return {
    pass,
    contradiction: hasContradiction(payload),
    claim_to_hook_linkage: Number.isFinite(linkage) ? Math.max(0, Math.min(1, linkage)) : 0,
    unsupported_claim_rate: Number.isFinite(unsupported) ? Math.max(0, Math.min(1, unsupported)) : 1,
    replay_flag: payload?.debug?.event_journal?.replay_parity === true,
    event_hash: String(payload?.debug?.event_journal?.event_hash ?? ""),
  };
};

const runAsk = async (arm: ArmName, prompt: PromptCase, seed: number, replayIndex: number) => {
  const traceId = `phase6-live-${arm}-${prompt.id}-s${seed}-r${replayIndex}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = Date.now();
  try {
    const resp = await fetch(new URL("/api/agi/ask", BASE_URL), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: prompt.question,
        debug: true,
        seed,
        temperature: 0,
        sessionId: `phase6-live:${arm}:${prompt.id}:s${seed}`.slice(0, 120),
        traceId,
        strictProvenance: arm === "B",
        tuning: ARM_TUNING[arm],
      }),
      signal: controller.signal,
    });
    const payload = (await resp.json().catch(() => null)) as AskResponse | null;
    return {
      arm,
      promptId: prompt.id,
      seed,
      replayIndex,
      traceId,
      status: resp.status,
      latencyMs: Date.now() - started,
      payload,
      metrics: metricFromPayload(resp.status, payload),
    };
  } finally {
    clearTimeout(timeout);
  }
};

const summarizeArm = (rows: Array<Awaited<ReturnType<typeof runAsk>>>) => {
  const primaryRows = rows.filter((entry) => entry.replayIndex === 1);
  const replayRows = rows.filter((entry) => entry.replayIndex === 2);
  const replayMap = new Map(replayRows.map((entry) => [`${entry.promptId}:${entry.seed}`, entry]));
  const parity = primaryRows.map((entry) => {
    const replay = replayMap.get(`${entry.promptId}:${entry.seed}`);
    if (!replay) return 0;
    const passSame = entry.metrics.pass === replay.metrics.pass;
    const contradictionSame = entry.metrics.contradiction === replay.metrics.contradiction;
    const hashSame = entry.metrics.event_hash.length > 0 && entry.metrics.event_hash === replay.metrics.event_hash;
    return passSame && contradictionSame && (hashSame || (entry.metrics.replay_flag && replay.metrics.replay_flag)) ? 1 : 0;
  });

  return {
    episodeCount: primaryRows.length,
    pass_rate: avg(primaryRows.map((entry) => (entry.metrics.pass ? 1 : 0))),
    contradiction_rate: avg(primaryRows.map((entry) => (entry.metrics.contradiction ? 1 : 0))),
    replay_parity: avg(parity),
    claim_to_hook_linkage: avg(primaryRows.map((entry) => entry.metrics.claim_to_hook_linkage)),
    unsupported_claim_rate: avg(primaryRows.map((entry) => entry.metrics.unsupported_claim_rate)),
    http_status_ok_rate: avg(primaryRows.map((entry) => (entry.status === 200 ? 1 : 0))),
  };
};

const main = async () => {
  const promptSuite = pickPromptSuite();
  const rows: Array<Awaited<ReturnType<typeof runAsk>>> = [];

  for (const arm of ["A", "B"] as const) {
    for (const seed of SEEDS) {
      for (const prompt of promptSuite) {
        rows.push(await runAsk(arm, prompt, seed, 1));
        rows.push(await runAsk(arm, prompt, seed, 2));
      }
    }
  }

  const armRowsA = rows.filter((entry) => entry.arm === "A");
  const armRowsB = rows.filter((entry) => entry.arm === "B");
  const A = summarizeArm(armRowsA);
  const B = summarizeArm(armRowsB);

  const deltas = {
    pass_rate: B.pass_rate - A.pass_rate,
    contradiction_rate: B.contradiction_rate - A.contradiction_rate,
    contradiction_rate_delta_rel: (B.contradiction_rate - A.contradiction_rate) / Math.max(A.contradiction_rate, 1e-6),
    replay_parity: B.replay_parity - A.replay_parity,
    claim_to_hook_linkage: B.claim_to_hook_linkage - A.claim_to_hook_linkage,
    unsupported_claim_rate: B.unsupported_claim_rate - A.unsupported_claim_rate,
  };

  const layerDecisions: Array<{ layer: LayerId; decision: "keep" | "drop"; basis: string }> = [
    { layer: "telemetry_x_t", decision: deltas.pass_rate >= 0 ? "keep" : "drop", basis: "live_delta_pass_rate" },
    { layer: "linear_baseline", decision: "keep", basis: "baseline anchor" },
    { layer: "pca_baseline", decision: deltas.claim_to_hook_linkage >= 0 ? "keep" : "drop", basis: "live_delta_claim_to_hook_linkage" },
    { layer: "helical_6d", decision: "drop", basis: "phase5_decision_retained_no_live_override" },
    { layer: "rho_clamp", decision: deltas.unsupported_claim_rate <= 0 ? "keep" : "drop", basis: "live_delta_unsupported_claim_rate" },
    { layer: "natario_first", decision: B.replay_parity >= 0.98 ? "keep" : "drop", basis: "live_replay_parity_threshold" },
  ];

  const runAt = new Date().toISOString();
  const runId = `phase6-live-ab-${runAt.replace(/[:.]/g, "-")}`;
  const out = {
    mode: "live",
    runAt,
    runId,
    endpoint: `${BASE_URL}/api/agi/ask`,
    fixedSeeds: SEEDS,
    promptIds: promptSuite.map((entry) => entry.id),
    prompts: promptSuite,
    episodesPerArm: SEEDS.length * promptSuite.length,
    replayEpisodesPerArm: SEEDS.length * promptSuite.length,
    armConfig: {
      A: {
        description: "baseline controller (manifold/helical OFF)",
        tuning: ARM_TUNING.A,
      },
      B: {
        description: "baseline + retained layers; helical layer remains dropped",
        tuning: ARM_TUNING.B,
      },
    },
    traceRefs: rows.map((entry) => ({
      arm: entry.arm,
      promptId: entry.promptId,
      seed: entry.seed,
      replayIndex: entry.replayIndex,
      traceId: entry.traceId,
      status: entry.status,
      latencyMs: entry.latencyMs,
      failReason: entry.payload?.fail_reason ?? null,
      failClass: entry.payload?.fail_class ?? null,
    })),
    arms: { A, B },
    deltas,
    layerDecisions,
  };

  const outPath = path.join("artifacts", "experiments", "helical-phase6", "phase6-live-ab-results.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
  console.log(JSON.stringify({ outPath, runId, episodesPerArm: out.episodesPerArm }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
