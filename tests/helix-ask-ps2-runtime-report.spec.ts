import express from "express";
import fs from "node:fs";
import path from "node:path";
import type { Server } from "http";
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";

type AskRow = {
  question: string;
  seed: number;
  status: number;
  latencyMs: number;
  text: string;
  failReason: string | null;
  debug: Record<string, unknown>;
};

type GateMetric = {
  name: string;
  threshold: string;
  measured: number;
  pass: boolean;
};

const PS2_QUESTIONS = [
  "How does the universe produce life",
  "How can a Human protect itself from an AI financial hack",
] as const;
const PS2_SEEDS = [7, 11, 13] as const;
const PS2_TEMPERATURE = 0.2;
const STRICT_FAIL_PROBE = "STRICT FAIL CHECK: cite repo evidence for ZXQJ-404 impossible symbol";

const parsePreviousReportMetrics = (reportPath: string): Record<string, number> => {
  if (!fs.existsSync(reportPath)) return {};
  const out: Record<string, number> = {};
  for (const line of fs.readFileSync(reportPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\|\s*([a-z0-9_]+)\s*\|\s*[^|]+\|\s*([0-9.]+)\s*\|/i);
    if (!match) continue;
    out[match[1]] = Number(match[2]);
  }
  return out;
  debug: Record<string, unknown>;
  beforeText: string;
};

describe("Helix Ask PS2 runtime report", () => {
  let server: Server;
  let baseUrl = "http://127.0.0.1:0";

  beforeAll(async () => {
    process.env.ENABLE_AGI = "1";
    process.env.HELIX_ASK_ENFORCE_GLOBAL_QUALITY_FLOOR = "1";
    process.env.HELIX_ASK_FAILURE_MAX = "0";
    vi.resetModules();
    const { planRouter } = await import("../server/routes/agi.plan");
    const app = express();
    app.use(express.json({ limit: "5mb" }));
    app.get("/api/ready", (_req, res) => {
      res.json({ ok: true, ready: true });
    });
    app.use("/api/agi", planRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === "object") {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  }, 60000);

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (!server) return resolve();
      server.close(() => resolve());
    });
  });

  const askWithRetries = async (question: string, seed: number, sessionId: string) => {
    let lastStatus = 0;
    let payload: { text?: string; debug?: Record<string, unknown>; fail_reason?: string } = {};
    let latencyMs = 0;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const start = Date.now();
      const response = await fetch(`${baseUrl}/api/agi/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          debug: true,
          temperature: PS2_TEMPERATURE,
          seed,
          sessionId: `${sessionId}-a${attempt}`,
        }),
      });
      latencyMs = Date.now() - start;
      lastStatus = response.status;
      try {
        payload = (await response.json()) as { text?: string; debug?: Record<string, unknown>; fail_reason?: string };
      } catch {
        payload = {};
      }
      if (response.status === 200) {
        break;
      }
      if (response.status === 503 || response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
        continue;
      }
      break;
    }

    return { status: lastStatus, latencyMs, payload };
  };

  it("runs fixed PS2 prompt pack and writes before/after quality delta contract", async () => {
    const rows: AskRow[] = [];
    for (const question of PS2_QUESTIONS) {
      for (const seed of PS2_SEEDS) {
        const result = await askWithRetries(question, seed, `ps2-runtime-${seed}`);
        rows.push({
          question,
          seed,
          status: result.status,
          latencyMs: result.latencyMs,
          text: result.payload.text ?? "",
          failReason:
            result.payload.fail_reason ??
            ((result.payload.debug as { helix_ask_fail_reason?: string | null } | undefined)?.helix_ask_fail_reason ?? null),
          debug: result.payload.debug ?? {},
        });
      }
    }

    const strictDeterminismRows: Array<{ seed: number; attempt: number; key: string }> = [];
    for (const seed of PS2_SEEDS) {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const result = await askWithRetries(STRICT_FAIL_PROBE, seed, `ps2-strict-${seed}-${attempt}`);
        const debug = (result.payload.debug ?? {}) as Record<string, unknown>;
        const reason =
          result.payload.fail_reason ??
          (typeof debug.helix_ask_fail_reason === "string" ? debug.helix_ask_fail_reason : null) ??
          (typeof debug.fallback_reason === "string" ? debug.fallback_reason : null) ??
          "none";
        strictDeterminismRows.push({
          seed,
          attempt,
          key: `${result.status}:${reason}`,
  it("runs focused PS2 asks and writes required artifacts", async () => {
    const questions = [
      "How does the universe produce life",
      "How can a Human protect itself from an AI financial hack",
      "Why are dreams weird and sometimes coherent",
      "Can unknown dark matter interactions influence daily electronics",
      "What hidden factors shape sudden social panic online",
      "How could a city respond to a surprise magnetic storm",
      "What could explain déjà vu without mystical assumptions",
      "How can a family plan food resilience for unknown disruptions",
    ];
    const seeds = [7, 11, 13];
    const rows: AskRow[] = [];

    const readyResponse = await fetch(`${baseUrl}/api/ready`);
    const readyPayload = (await readyResponse.json()) as { ready?: boolean; ok?: boolean };
    const readyOk = readyResponse.ok && (readyPayload.ready === true || readyPayload.ok === true);

    const smokeCount = 12;
    const smokeStatuses: number[] = [];
    for (let i = 0; i < smokeCount; i += 1) {
      const smokeResponse = await fetch(`${baseUrl}/api/agi/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `smoke-check-${i}: summarize fallback contract behavior`,
          debug: false,
          temperature: 0,
          seed: i + 1,
          sessionId: `ps2-smoke-${i}`,
        }),
      });
      smokeStatuses.push(smokeResponse.status);
    }
    const smoke200Rate = smokeStatuses.filter((status) => status === 200).length / smokeStatuses.length;
    const reliabilityStatus = readyOk && smoke200Rate >= 0.9 ? "pass" : "infra-blocked";

    for (const question of questions) {
      for (const seed of seeds) {
        const start = Date.now();
        const response = await fetch(`${baseUrl}/api/agi/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, debug: true, temperature: 0.2, seed, sessionId: `ps2-${seed}-${question.slice(0, 12)}` }),
        });
        const latencyMs = Date.now() - start;
        let payload: { text?: string; debug?: Record<string, unknown> } = {};
        try {
          payload = (await response.json()) as { text?: string; debug?: Record<string, unknown> };
        } catch {
          payload = {};
        }
        const beforeText = String(
          payload.debug?.answer_before_fallback ?? payload.debug?.answer_raw_preview ?? "before unavailable",
        );
        rows.push({
          question,
          seed,
          status: response.status,
          latencyMs,
          text: payload.text ?? "",
          debug: payload.debug ?? {},
          beforeText,
        });
      }
    }

    const runId = new Date().toISOString().replace(/[:.]/g, "-");
    const baseDir = path.join("artifacts", "experiments", "helix-ask-ps2", runId);
    fs.mkdirSync(path.join(baseDir, "raw"), { recursive: true });
    fs.writeFileSync(path.join(baseDir, "raw", "responses.json"), JSON.stringify(rows, null, 2));
    fs.writeFileSync(path.join(baseDir, "raw", "strict-fail-determinism.json"), JSON.stringify(strictDeterminismRows, null, 2));

    const mechanismRe = /\bMechanism:\s*.+->.+->.+/i;
    const maturityRe = /\bMaturity\s*\((?:exploratory|reduced-order|diagnostic|certified)\)\s*:/i;
    const citationRe = /Sources:/i;

    const rate = (predicate: (row: AskRow) => boolean): number =>
      rows.length === 0 ? 0 : rows.filter(predicate).length / rows.length;

    const sortedLatency = [...rows.map((row) => row.latencyMs)].sort((a, b) => a - b);
    const p95LatencyMs = sortedLatency[Math.max(0, Math.ceil(sortedLatency.length * 0.95) - 1)] ?? 0;

    const strictConsistency = PS2_SEEDS.map((seed) => {
      const keys = strictDeterminismRows.filter((row) => row.seed === seed).map((row) => row.key);
      const [head, ...rest] = keys;
      return head ? rest.every((item) => item === head) : false;
    });

    const metrics = {
      claim_citation_linkage_pass_rate: rate(
        (row) => (((row.debug.semantic_quality as { claim_citation_link_rate?: number } | undefined)?.claim_citation_link_rate ?? 0) >= 0.9),
      ),
      mechanism_sentence_present_rate: rate((row) => mechanismRe.test(row.text)),
      maturity_label_present_rate: rate((row) => maturityRe.test(row.text)),
      citation_presence_rate: rate((row) => citationRe.test(row.text)),
      strict_fail_determinism_rate:
        strictConsistency.length === 0
          ? 0
          : strictConsistency.filter(Boolean).length / strictConsistency.length,
      p95_latency_ms: p95LatencyMs,
    };

    const previousReports = fs
      .readdirSync("reports", { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^helix-ask-ps2-runtime-contract-.*\.md$/i.test(entry.name))
      .map((entry) => entry.name)
      .sort();
    const previousPath = previousReports.length
      ? path.join("reports", previousReports[previousReports.length - 1])
      : "";
    const beforeMetrics = previousPath ? parsePreviousReportMetrics(previousPath) : {};

    const thresholds: Record<string, { threshold: string; pass: (value: number) => boolean }> = {
      claim_citation_linkage_pass_rate: { threshold: ">= 0.90", pass: (value) => value >= 0.9 },
      mechanism_sentence_present_rate: { threshold: ">= 0.95", pass: (value) => value >= 0.95 },
      maturity_label_present_rate: { threshold: ">= 0.95", pass: (value) => value >= 0.95 },
      citation_presence_rate: { threshold: ">= 0.95", pass: (value) => value >= 0.95 },
      strict_fail_determinism_rate: { threshold: "== 1.00", pass: (value) => value === 1 },
      p95_latency_ms: { threshold: "<= 2500", pass: (value) => value <= 2500 },
    };

    const gateRows: GateMetric[] = Object.entries(metrics).map(([name, measured]) => ({
      name,
      threshold: thresholds[name].threshold,
      measured,
      pass: thresholds[name].pass(measured),
    }));
    const semanticGates = {
      runId,
      thresholds: {
        claim_citation_link_rate: 0.9,
        unsupported_claim_rate: 0.1,
        repetition_penalty_fail_rate: 0.1,
        contradiction_flag_rate: 0.1,
      },
      measured: {
        claim_citation_link_rate: metrics.claim_citation_link_rate,
        unsupported_claim_rate: metrics.unsupported_claim_rate,
        repetition_penalty_fail_rate: metrics.repetition_penalty_fail_rate,
        contradiction_flag_rate: metrics.contradiction_flag_rate,
      },
      pass: {
        claim_citation_link_rate: metrics.claim_citation_link_rate >= 0.9,
        unsupported_claim_rate: metrics.unsupported_claim_rate <= 0.1,
        repetition_penalty_fail_rate: metrics.repetition_penalty_fail_rate <= 0.1,
        contradiction_flag_rate: metrics.contradiction_flag_rate <= 0.1,
      },
    };
    fs.writeFileSync(path.join(baseDir, "semantic-gates.json"), JSON.stringify(semanticGates, null, 2));

    const summary = {
      runId,
      fixed_pack: {
        questions: PS2_QUESTIONS,
        seeds: PS2_SEEDS,
        temperature: PS2_TEMPERATURE,
      },
      before_report: previousPath || null,
      before_metrics: beforeMetrics,
      metrics,
      thresholds: Object.fromEntries(
        Object.entries(thresholds).map(([name, value]) => [name, value.threshold]),
      ),
      pass: gateRows.every((entry) => entry.pass),
    };
    fs.writeFileSync(path.join(baseDir, "summary.json"), JSON.stringify(summary, null, 2));

    const reportPath = path.join("reports", `helix-ask-ps2-runtime-contract-${runId}.md`);
      reliability_preflight: {
        ready_ok: readyOk,
        smoke_count: smokeCount,
        smoke_200_rate: smoke200Rate,
        status: reliabilityStatus,
      },
    };
    fs.writeFileSync(path.join(baseDir, "summary.json"), JSON.stringify(summary, null, 2));

    const recommendation = {
      status:
        reliabilityStatus === "pass" &&
        metrics.placeholder_fallback_rate === 0 &&
        metrics.empty_scaffold_rate === 0 &&
        metrics.mechanism_sentence_present_rate >= 0.95 &&
        metrics.maturity_label_present_rate >= 0.95 &&
        metrics.claim_citation_link_rate >= 0.90 &&
        metrics.unsupported_claim_rate <= 0.10 &&
        metrics.repetition_penalty_fail_rate <= 0.10 &&
        metrics.contradiction_flag_rate <= 0.10 &&
        metrics.min_text_length_pass_rate >= 0.95 &&
        metrics.p95_latency_ms <= 2500 &&
        metrics.non_200_rate <= 0.02
          ? "pass"
          : "fail",
      notes: reliabilityStatus === "pass"
        ? [
            "PS2 runtime contract metrics generated from focused asks.",
            "Use raw/responses.json for deep per-seed debugging.",
          ]
        : ["Reliability preflight failed; classify run as infra-blocked before quality scoring."],
    };
    fs.writeFileSync(path.join(baseDir, "recommendation.json"), JSON.stringify(recommendation, null, 2));

    const focusedQa = rows.map((row) => ({
      question: row.question,
      seed: row.seed,
      beforeSnippet: String(
        row.beforeText,
      ).slice(0, 280),
      afterSnippet: row.text.slice(0, 420),
      citations: (row.text.match(/Sources:\s*([^\n]+)/i)?.[1] ?? "not-present").slice(0, 220),
    }));
    fs.writeFileSync(path.join(baseDir, "focused-qa.json"), JSON.stringify(focusedQa, null, 2));

    const reportPath = path.join("reports", `helix-ask-quake-frame-loop-${runId}.md`);
    fs.mkdirSync("reports", { recursive: true });

    const lines = [
      `# Helix Ask PS2 Runtime Contract (${runId})`,
      "",
      "Run config: fixed prompt set, seeds=7,11,13; temperature=0.2; debug=true.",
      previousPath ? `Baseline report: ${previousPath}` : "Baseline report: unavailable",
      "Run config: seeds=7,11,13; temperature=0.2; debug=true.",
      `Reliability preflight: ready_ok=${readyOk}; smoke_200_rate=${smoke200Rate.toFixed(3)}; status=${reliabilityStatus}.`,
      "",
      "| Metric | Threshold | Before | After | Delta | Pass |",
      "|---|---:|---:|---:|---:|:--:|",
      ...gateRows.map((entry) => {
        const before = beforeMetrics[entry.name] ?? Number.NaN;
        const delta = Number.isFinite(before) ? entry.measured - before : Number.NaN;
        const beforeText = Number.isFinite(before) ? before.toFixed(3) : "n/a";
        const deltaText = Number.isFinite(delta) ? `${delta >= 0 ? "+" : ""}${delta.toFixed(3)}` : "n/a";
        return `| ${entry.name} | ${entry.threshold} | ${beforeText} | ${entry.measured.toFixed(3)} | ${deltaText} | ${entry.pass ? "PASS" : "FAIL"} |`;
      }),
      "",
      "## Strict fail determinism probe",
      "",
      "| Seed | Attempt | Key |",
      "|---:|---:|---|",
      ...strictDeterminismRows.map((row) => `| ${row.seed} | ${row.attempt} | ${row.key} |`),
      "## Before/after snippets",
      ...focusedQa.flatMap((entry) => [
        `- Q: ${entry.question} (seed ${entry.seed})`,
        `  - Before: ${entry.beforeSnippet.replace(/\n+/g, " ")}`,
        `  - After: ${entry.afterSnippet.replace(/\n+/g, " ")}`,
        `  - Citations: ${entry.citations}`,
      ]),
      "",
      `Artifacts: ${baseDir}`,
    ];
    fs.writeFileSync(reportPath, lines.join("\n"));

    expect(rows).toHaveLength(PS2_QUESTIONS.length * PS2_SEEDS.length);
    expect(rows).toHaveLength(24);
    expect(fs.existsSync(path.join(baseDir, "semantic-gates.json"))).toBe(true);
    expect(fs.existsSync(reportPath)).toBe(true);
  }, 240000);
});
