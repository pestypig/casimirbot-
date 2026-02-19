import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { helixUtilityPrompts } from "./helix-ask-utility-ab";

type LayerId = "telemetry_x_t" | "linear_baseline" | "pca_baseline" | "helical_6d" | "rho_clamp" | "natario_first";
type ArmName = "A" | "B";
type FailureClass = "invalid_json" | "schema_mismatch" | "metric_input_missing" | "timeout_soft" | "timeout_hard" | "http_error";

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
const REQUEST_HARD_TIMEOUT_MS = Math.max(REQUEST_TIMEOUT_MS + 250, Number(process.env.HELIX_PHASE6_HARD_TIMEOUT_MS ?? String(REQUEST_TIMEOUT_MS + 250)));
const CONCURRENCY = Math.max(1, Number(process.env.HELIX_PHASE6_CONCURRENCY ?? "8"));
const MIN_USABLE_RESPONSE_RATE = Math.max(0, Math.min(1, Number(process.env.HELIX_PHASE6_MIN_USABLE_RESPONSE_RATE ?? "0.90")));
const MIN_HTTP_STATUS_OK_RATE = Math.max(0, Math.min(1, Number(process.env.HELIX_PHASE6_MIN_HTTP_STATUS_OK_RATE ?? "0.95")));
const CLAIM_LINKAGE_FLOOR_MAX = Math.max(0, Math.min(1, Number(process.env.HELIX_PHASE6_CLAIM_LINKAGE_FLOOR_MAX ?? "0.25")));
const METRIC_CONST_EPSILON = Math.max(0, Number(process.env.HELIX_PHASE6_METRIC_CONST_EPSILON ?? "0.000001"));
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
  return [...relation, ...repo, ...ambiguous];
};

const hasRequiredFields = (payload: AskResponse | null): boolean => {
  if (!payload) return false;
  const semantic = payload.debug?.semantic_quality;
  const linkage = semantic?.claim_citation_link_rate;
  const unsupported = semantic?.unsupported_claim_rate;
  const contradiction = semantic?.contradiction_flag;
  const text = payload.text;
  const reasons = semantic?.fail_reasons;
  return typeof text === "string" && text.trim().length > 0 && Number.isFinite(linkage) && Number.isFinite(unsupported) && typeof contradiction === "boolean" && Array.isArray(reasons);
};

const classifyScoreability = (payload: AskResponse | null): { scoreable: boolean; failClass: FailureClass | null; failReason: string | null } => {
  if (!payload || typeof payload !== "object") {
    return { scoreable: false, failClass: "schema_mismatch", failReason: "response_payload_not_object" };
  }
  const semantic = payload.debug?.semantic_quality;
  if (!semantic || typeof semantic !== "object") {
    return { scoreable: false, failClass: "metric_input_missing", failReason: "missing_semantic_quality" };
  }
  const hasRequired = hasRequiredFields(payload);
  if (hasRequired) {
    return { scoreable: true, failClass: null, failReason: null };
  }
  const missingMetricInputs =
    typeof payload.text !== "string" ||
    payload.text.trim().length === 0 ||
    semantic.claim_citation_link_rate === undefined ||
    semantic.unsupported_claim_rate === undefined ||
    semantic.contradiction_flag === undefined ||
    !Array.isArray(semantic.fail_reasons);
  if (missingMetricInputs) {
    return { scoreable: false, failClass: "metric_input_missing", failReason: "required_metric_inputs_missing" };
  }
  return { scoreable: false, failClass: "schema_mismatch", failReason: "semantic_metric_type_mismatch" };
};

const hasContradiction = (payload: AskResponse | null): boolean => {
  const reasons = payload?.debug?.semantic_quality?.fail_reasons ?? [];
  return Boolean(payload?.debug?.semantic_quality?.contradiction_flag) || reasons.some((reason) => /contradiction/i.test(reason));
};

const metricFromPayload = (status: number, payload: AskResponse | null) => {
  const linkage = Number(payload?.debug?.semantic_quality?.claim_citation_link_rate ?? 0);
  const unsupported = Number(payload?.debug?.semantic_quality?.unsupported_claim_rate ?? 1);
  const failReasons = payload?.debug?.semantic_quality?.fail_reasons ?? [];
  const scoreability = classifyScoreability(payload);
  const classification = status === 200
    ? scoreability
    : { scoreable: false, failClass: "http_error" as FailureClass, failReason: `http_status_${status}` };
  const failClass = payload?.fail_class ?? classification.failClass;
  const failReason = payload?.fail_reason ?? classification.failReason;
  const pass = status === 200 && classification.scoreable && !failReason && failReasons.length === 0;
  return {
    pass,
    scoreable: classification.scoreable,
    contradiction: hasContradiction(payload),
    claim_to_hook_linkage: Number.isFinite(linkage) ? Math.max(0, Math.min(1, linkage)) : 0,
    unsupported_claim_rate: Number.isFinite(unsupported) ? Math.max(0, Math.min(1, unsupported)) : 1,
    replay_flag: payload?.debug?.event_journal?.replay_parity === true,
    event_hash: String(payload?.debug?.event_journal?.event_hash ?? ""),
    fail_class: failClass,
    fail_reason: failReason,
  };
};

const runAsk = async (arm: ArmName, prompt: PromptCase, seed: number, replayIndex: number) => {
  const traceId = `phase6-live-${arm}-${prompt.id}-s${seed}-r${replayIndex}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let hardTimeout: ReturnType<typeof setTimeout> | undefined;
  const started = Date.now();
  try {
    const resp = await Promise.race([
      fetch(new URL("/api/agi/ask", BASE_URL), {
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
      }),
      new Promise<Response>((_, reject) => {
        hardTimeout = setTimeout(() => {
          controller.abort();
          reject(new Error("hard_timeout"));
        }, REQUEST_HARD_TIMEOUT_MS);
      }),
    ]);
    if (hardTimeout) clearTimeout(hardTimeout);
    const rawBody = await resp.text();
    const payload = rawBody.length
      ? (JSON.parse(rawBody) as AskResponse)
      : ({ fail_class: "invalid_json", fail_reason: "empty_json_response" } as AskResponse);
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
  } catch (error) {
    if (error instanceof SyntaxError) {
      const payload: AskResponse = {
        fail_reason: error.message,
        fail_class: "invalid_json",
      };
      return {
        arm,
        promptId: prompt.id,
        seed,
        replayIndex,
        traceId,
        status: 200,
        latencyMs: Date.now() - started,
        payload,
        metrics: metricFromPayload(200, payload),
      };
    }
    const isHardTimeout = error instanceof Error && error.message === "hard_timeout";
    const isSoftTimeout = error instanceof Error && error.name === "AbortError";
    const failClass: FailureClass = isHardTimeout ? "timeout_hard" : isSoftTimeout ? "timeout_soft" : "http_error";
    const payload: AskResponse = {
      fail_reason: error instanceof Error ? error.message : "request_failed",
      fail_class: failClass,
    };
    return {
      arm,
      promptId: prompt.id,
      seed,
      replayIndex,
      traceId,
      status: 0,
      latencyMs: Date.now() - started,
      payload,
      metrics: metricFromPayload(0, payload),
    };
  } finally {
    clearTimeout(timeout);
    if (hardTimeout) clearTimeout(hardTimeout);
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

  const failReasonHistogram = new Map<string, number>();
  const failClassHistogram = new Map<string, number>();
  const httpStatusHistogram = new Map<string, number>();
  for (const entry of primaryRows) {
    const reason = String(entry.metrics.fail_reason ?? "none");
    const klass = String(entry.metrics.fail_class ?? "none");
    const statusKey = String(entry.status);
    failReasonHistogram.set(reason, (failReasonHistogram.get(reason) ?? 0) + 1);
    failClassHistogram.set(klass, (failClassHistogram.get(klass) ?? 0) + 1);
    httpStatusHistogram.set(statusKey, (httpStatusHistogram.get(statusKey) ?? 0) + 1);
  }

  const claimValues = primaryRows.map((entry) => entry.metrics.claim_to_hook_linkage);
  const unsupportedValues = primaryRows.map((entry) => entry.metrics.unsupported_claim_rate);

  return {
    episodeCount: primaryRows.length,
    pass_rate: avg(primaryRows.map((entry) => (entry.metrics.pass ? 1 : 0))),
    contradiction_rate: avg(primaryRows.map((entry) => (entry.metrics.contradiction ? 1 : 0))),
    replay_parity: avg(parity),
    claim_to_hook_linkage: avg(primaryRows.map((entry) => entry.metrics.claim_to_hook_linkage)),
    unsupported_claim_rate: avg(primaryRows.map((entry) => entry.metrics.unsupported_claim_rate)),
    http_status_ok_rate: avg(primaryRows.map((entry) => (entry.status === 200 ? 1 : 0))),
    usable_response_rate: avg(primaryRows.map((entry) => (entry.status === 200 && entry.metrics.scoreable ? 1 : 0))),
    diagnostics: {
      claim_to_hook_linkage_min: claimValues.length ? Math.min(...claimValues) : 0,
      claim_to_hook_linkage_max: claimValues.length ? Math.max(...claimValues) : 0,
      unsupported_claim_rate_min: unsupportedValues.length ? Math.min(...unsupportedValues) : 1,
      unsupported_claim_rate_max: unsupportedValues.length ? Math.max(...unsupportedValues) : 1,
      fail_reason_histogram: Object.fromEntries(failReasonHistogram.entries()),
      fail_class_histogram: Object.fromEntries(failClassHistogram.entries()),
      http_status_histogram: Object.fromEntries(httpStatusHistogram.entries()),
    },
  };
};

const computeValidity = (A: ReturnType<typeof summarizeArm>, B: ReturnType<typeof summarizeArm>) => {
  const gateChecks = [
    {
      gate: "A.usable_response_rate",
      threshold: `>= ${MIN_USABLE_RESPONSE_RATE}`,
      value: A.usable_response_rate,
      pass: A.usable_response_rate >= MIN_USABLE_RESPONSE_RATE,
      reason: A.usable_response_rate >= MIN_USABLE_RESPONSE_RATE ? "ok" : "below_min_usable_response_rate",
    },
    {
      gate: "B.usable_response_rate",
      threshold: `>= ${MIN_USABLE_RESPONSE_RATE}`,
      value: B.usable_response_rate,
      pass: B.usable_response_rate >= MIN_USABLE_RESPONSE_RATE,
      reason: B.usable_response_rate >= MIN_USABLE_RESPONSE_RATE ? "ok" : "below_min_usable_response_rate",
    },
    {
      gate: "A.http_status_ok_rate",
      threshold: `>= ${MIN_HTTP_STATUS_OK_RATE}`,
      value: A.http_status_ok_rate,
      pass: A.http_status_ok_rate >= MIN_HTTP_STATUS_OK_RATE,
      reason: A.http_status_ok_rate >= MIN_HTTP_STATUS_OK_RATE ? "ok" : "below_min_http_status_ok_rate",
    },
    {
      gate: "B.http_status_ok_rate",
      threshold: `>= ${MIN_HTTP_STATUS_OK_RATE}`,
      value: B.http_status_ok_rate,
      pass: B.http_status_ok_rate >= MIN_HTTP_STATUS_OK_RATE,
      reason: B.http_status_ok_rate >= MIN_HTTP_STATUS_OK_RATE ? "ok" : "below_min_http_status_ok_rate",
    },
    {
      gate: "A.claim_to_hook_linkage_not_constant_floor_artifact",
      threshold: `max-min > ${METRIC_CONST_EPSILON} OR avg > ${CLAIM_LINKAGE_FLOOR_MAX}`,
      value: { min: A.diagnostics.claim_to_hook_linkage_min, max: A.diagnostics.claim_to_hook_linkage_max, avg: A.claim_to_hook_linkage },
      pass:
        A.diagnostics.claim_to_hook_linkage_max - A.diagnostics.claim_to_hook_linkage_min > METRIC_CONST_EPSILON ||
        A.claim_to_hook_linkage > CLAIM_LINKAGE_FLOOR_MAX,
      reason: "claim_to_hook_linkage_constant_floor_artifact",
    },
    {
      gate: "B.claim_to_hook_linkage_not_constant_floor_artifact",
      threshold: `max-min > ${METRIC_CONST_EPSILON} OR avg > ${CLAIM_LINKAGE_FLOOR_MAX}`,
      value: { min: B.diagnostics.claim_to_hook_linkage_min, max: B.diagnostics.claim_to_hook_linkage_max, avg: B.claim_to_hook_linkage },
      pass:
        B.diagnostics.claim_to_hook_linkage_max - B.diagnostics.claim_to_hook_linkage_min > METRIC_CONST_EPSILON ||
        B.claim_to_hook_linkage > CLAIM_LINKAGE_FLOOR_MAX,
      reason: "claim_to_hook_linkage_constant_floor_artifact",
    },
    {
      gate: "A.unsupported_claim_rate_not_constant_one_artifact",
      threshold: `max-min > ${METRIC_CONST_EPSILON} OR avg < 1.0`,
      value: { min: A.diagnostics.unsupported_claim_rate_min, max: A.diagnostics.unsupported_claim_rate_max, avg: A.unsupported_claim_rate },
      pass:
        A.diagnostics.unsupported_claim_rate_max - A.diagnostics.unsupported_claim_rate_min > METRIC_CONST_EPSILON ||
        A.unsupported_claim_rate < 1,
      reason: "unsupported_claim_rate_constant_one_artifact",
    },
    {
      gate: "B.unsupported_claim_rate_not_constant_one_artifact",
      threshold: `max-min > ${METRIC_CONST_EPSILON} OR avg < 1.0`,
      value: { min: B.diagnostics.unsupported_claim_rate_min, max: B.diagnostics.unsupported_claim_rate_max, avg: B.unsupported_claim_rate },
      pass:
        B.diagnostics.unsupported_claim_rate_max - B.diagnostics.unsupported_claim_rate_min > METRIC_CONST_EPSILON ||
        B.unsupported_claim_rate < 1,
      reason: "unsupported_claim_rate_constant_one_artifact",
    },
  ];

  const failures = gateChecks.filter((gate) => !gate.pass).map((gate) => ({ gate: gate.gate, reason: gate.reason, threshold: gate.threshold, value: gate.value }));
  return {
    valid: failures.length === 0,
    thresholds: {
      usable_response_rate_min: MIN_USABLE_RESPONSE_RATE,
      http_status_ok_rate_min: MIN_HTTP_STATUS_OK_RATE,
      claim_to_hook_linkage_floor_max: CLAIM_LINKAGE_FLOOR_MAX,
      metric_const_epsilon: METRIC_CONST_EPSILON,
    },
    gates: gateChecks,
    failures,
  };
};

const main = async () => {
  const promptSuite = pickPromptSuite();
  const jobs: Array<() => Promise<Awaited<ReturnType<typeof runAsk>>>> = [];

  for (const arm of ["A", "B"] as const) {
    for (const seed of SEEDS) {
      for (const prompt of promptSuite) {
        jobs.push(() => runAsk(arm, prompt, seed, 1));
        jobs.push(() => runAsk(arm, prompt, seed, 2));
      }
    }
  }

  const rows: Array<Awaited<ReturnType<typeof runAsk>>> = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const index = cursor;
      cursor += 1;
      rows.push(await jobs[index]());
    }
  });
  await Promise.all(workers);

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

  const recommendedLayerDecisions: Array<{ layer: LayerId; decision: "keep" | "drop"; basis: string }> = [
    { layer: "telemetry_x_t", decision: deltas.pass_rate >= 0 ? "keep" : "drop", basis: "live_delta_pass_rate" },
    { layer: "linear_baseline", decision: "keep", basis: "baseline anchor" },
    { layer: "pca_baseline", decision: deltas.claim_to_hook_linkage >= 0 ? "keep" : "drop", basis: "live_delta_claim_to_hook_linkage" },
    { layer: "helical_6d", decision: "drop", basis: "phase5_decision_retained_no_live_override" },
    { layer: "rho_clamp", decision: deltas.unsupported_claim_rate <= 0 ? "keep" : "drop", basis: "live_delta_unsupported_claim_rate" },
    { layer: "natario_first", decision: B.replay_parity >= 0.98 ? "keep" : "drop", basis: "live_replay_parity_threshold" },
  ];

  const unchangedLayerDecisions: Array<{ layer: LayerId; decision: "keep" | "drop"; basis: string }> = [
    { layer: "telemetry_x_t", decision: "keep", basis: "phase6_locked_decision" },
    { layer: "linear_baseline", decision: "keep", basis: "phase6_locked_decision" },
    { layer: "pca_baseline", decision: "keep", basis: "phase6_locked_decision" },
    { layer: "helical_6d", decision: "drop", basis: "phase6_locked_decision" },
    { layer: "rho_clamp", decision: "keep", basis: "phase6_locked_decision" },
    { layer: "natario_first", decision: "keep", basis: "phase6_locked_decision" },
  ];

  const validity = computeValidity(A, B);
  const layerDecisions = validity.valid
    ? recommendedLayerDecisions
    : unchangedLayerDecisions.map((entry) => ({ ...entry, basis: `${entry.basis}; evaluation_blocked_due_to_run_invalidity` }));

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
      failReason: entry.metrics.fail_reason ?? null,
      failClass: entry.metrics.fail_class ?? null,
    })),
    arms: { A, B },
    deltas,
    validity,
    evaluation: {
      blocked: !validity.valid,
      reason: validity.valid ? null : "evaluation_blocked_due_to_run_invalidity",
    },
    recommendedLayerDecisions,
    layerDecisions,
  };

  const outPath = path.join("artifacts", "experiments", "helical-phase6", "phase6-live-ab-results.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
  console.log(JSON.stringify({ outPath, runId, episodesPerArm: out.episodesPerArm }, null, 2));
};

export const __test = {
  hasRequiredFields,
  classifyScoreability,
  metricFromPayload,
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
