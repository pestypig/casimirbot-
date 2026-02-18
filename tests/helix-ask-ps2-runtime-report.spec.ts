import express from "express";
import fs from "node:fs";
import path from "node:path";
import type { Server } from "http";
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";

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

  it("runs focused PS2 asks and writes required artifacts", async () => {
    const questions = [
      "How does the universe produce life",
      "How can a Human protect itself from an AI financial hack",
    ];
    const seeds = [7, 11, 13];
    const rows: Array<{ question: string; seed: number; status: number; latencyMs: number; text: string; debug: Record<string, unknown> }> = [];

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
        rows.push({
          question,
          seed,
          status: response.status,
          latencyMs,
          text: payload.text ?? "",
          debug: payload.debug ?? {},
        });
      }
    }

    const runId = new Date().toISOString().replace(/[:.]/g, "-");
    const baseDir = path.join("artifacts", "experiments", "helix-ask-quake-frame-loop", runId);
    fs.mkdirSync(path.join(baseDir, "raw"), { recursive: true });

    fs.writeFileSync(path.join(baseDir, "raw", "responses.json"), JSON.stringify(rows, null, 2));

    const mechanismRe = /\bMechanism:\s*.+->.+->.+/i;
    const maturityRe = /\bMaturity\s*\((?:exploratory|reduced-order|diagnostic|certified)\)\s*:/i;
    const missingEvidenceRe = /\bMissing evidence:\s*[^\n]{12,}/i;
    const citationRe = /Sources:/i;
    const placeholderRe = /\b(?:llm\.local\s+stub\s+result|placeholder|unable to answer|i cannot answer|answer grounded in retrieved evidence\.?\s*$)\b/i;
    const emptyScaffoldRe = /^\s*(?:Unverified:\s*- No repo-evidenced claims were confirmed yet\.[\s\S]*)$/i;

    const rate = (predicate: (row: (typeof rows)[number]) => boolean): number =>
      rows.filter(predicate).length / rows.length;

    const sortedLatency = [...rows.map((row) => row.latencyMs)].sort((a, b) => a - b);
    const p95LatencyMs = sortedLatency[Math.max(0, Math.ceil(sortedLatency.length * 0.95) - 1)] ?? 0;

    const metrics = {
      placeholder_fallback_rate: rate((row) => placeholderRe.test(row.text)),
      empty_scaffold_rate: rate((row) => emptyScaffoldRe.test(row.text)),
      mechanism_sentence_present_rate: rate((row) => mechanismRe.test(row.text)),
      maturity_label_present_rate: rate((row) => maturityRe.test(row.text)),
      claim_citation_link_rate: rate((row) => (row.debug.semantic_quality as any)?.claim_citation_link_rate >= 0.9 || citationRe.test(row.text)),
      unsupported_claim_rate: rate((row) => ((row.debug.semantic_quality as any)?.unsupported_claim_rate ?? 1) > 0.1),
      repetition_penalty_fail_rate: rate((row) => Boolean((row.debug.semantic_quality as any)?.repetition_penalty_fail)),
      contradiction_flag_rate: rate((row) => Boolean((row.debug.semantic_quality as any)?.contradiction_flag)),
      min_text_length_pass_rate: rate((row) => row.text.length >= 260),
      missing_evidence_present_rate: rate((row) => missingEvidenceRe.test(row.text)),
      p95_latency_ms: p95LatencyMs,
      non_200_rate: rate((row) => row.status !== 200),
    };

    const summary = {
      runId,
      total: rows.length,
      seeds,
      temperature: 0.2,
      debug: true,
      metrics,
    };
    fs.writeFileSync(path.join(baseDir, "summary.json"), JSON.stringify(summary, null, 2));

    const recommendation = {
      status:
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
      notes: [
        "PS2 runtime contract metrics generated from focused asks.",
        "Use raw/responses.json for deep per-seed debugging.",
      ],
    };
    fs.writeFileSync(path.join(baseDir, "recommendation.json"), JSON.stringify(recommendation, null, 2));

    const focusedQa = rows.map((row) => ({
      question: row.question,
      seed: row.seed,
      beforeSnippet: String(
        row.debug.answer_before_fallback ?? row.debug.answer_raw_preview ?? "before unavailable",
      ).slice(0, 280),
      afterSnippet: row.text.slice(0, 420),
    }));
    fs.writeFileSync(path.join(baseDir, "focused-qa.json"), JSON.stringify(focusedQa, null, 2));

    const reportPath = path.join("reports", `helix-ask-quake-frame-loop-${runId}.md`);
    const gates: Array<[string, string, number, boolean]> = [
      ["placeholder_fallback_rate", "== 0", metrics.placeholder_fallback_rate, metrics.placeholder_fallback_rate === 0],
      ["empty_scaffold_rate", "== 0", metrics.empty_scaffold_rate, metrics.empty_scaffold_rate === 0],
      ["mechanism_sentence_present_rate", ">= 0.95", metrics.mechanism_sentence_present_rate, metrics.mechanism_sentence_present_rate >= 0.95],
      ["maturity_label_present_rate", ">= 0.95", metrics.maturity_label_present_rate, metrics.maturity_label_present_rate >= 0.95],
      ["claim_citation_link_rate", ">= 0.90", metrics.claim_citation_link_rate, metrics.claim_citation_link_rate >= 0.90],
      ["unsupported_claim_rate", "<= 0.10", metrics.unsupported_claim_rate, metrics.unsupported_claim_rate <= 0.10],
      ["repetition_penalty_fail_rate", "<= 0.10", metrics.repetition_penalty_fail_rate, metrics.repetition_penalty_fail_rate <= 0.10],
      ["contradiction_flag_rate", "<= 0.10", metrics.contradiction_flag_rate, metrics.contradiction_flag_rate <= 0.10],
      ["min_text_length_pass_rate", ">= 0.95", metrics.min_text_length_pass_rate, metrics.min_text_length_pass_rate >= 0.95],
      ["p95_latency", "<= 2500ms", metrics.p95_latency_ms, metrics.p95_latency_ms <= 2500],
      ["non_200_rate", "<= 0.02", metrics.non_200_rate, metrics.non_200_rate <= 0.02],
    ];

    const lines = [
      `# Helix Ask PS2 Runtime Contract (${runId})`,
      "",
      "Run config: seeds=7,11,13; temperature=0.2; debug=true.",
      "",
      "| Gate | Threshold | Measured | Pass |",
      "|---|---:|---:|:--:|",
      ...gates.map(([name, threshold, measured, pass]) =>
        `| ${name} | ${threshold} | ${typeof measured === "number" ? measured.toFixed(3) : measured} | ${pass ? "✅" : "❌"} |`,
      ),
      "",
      "## Before/after snippets",
      ...focusedQa.flatMap((entry) => [
        `- Q: ${entry.question} (seed ${entry.seed})`,
        `  - Before: ${entry.beforeSnippet.replace(/\n+/g, " ")}`,
        `  - After: ${entry.afterSnippet.replace(/\n+/g, " ")}`,
      ]),
      "",
      `Artifacts: ${baseDir}`,
    ];
    fs.writeFileSync(reportPath, lines.join("\n"));

    expect(rows).toHaveLength(6);
    expect(fs.existsSync(reportPath)).toBe(true);
  }, 180000);
});
