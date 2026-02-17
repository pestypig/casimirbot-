import fs from "node:fs/promises";
import path from "node:path";

type Variant = "A" | "B" | "C";
type RawRun = {
  variant: Variant;
  prompt_id: string;
  bucket: string;
  prompt: string;
  seed: number;
  latency_ms: number;
  status: number;
  response: {
    text?: string;
    debug?: Record<string, any>;
  };
};

type Stats = { p50: number; p95: number; mean: number };

const ROOT = process.env.HELIX_ASK_AB_OUT ?? "artifacts/evidence-cards-ab";
const REPO_ROOT = process.cwd();
const N_BOOT = Number(process.env.HELIX_ASK_AB_BOOTSTRAP ?? 1200);

const q = (arr: number[], p: number): number => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return s[lo] ?? 0;
  return (s[lo] ?? 0) + ((s[hi] ?? 0) - (s[lo] ?? 0)) * (i - lo);
};

const stats = (arr: number[]): Stats => ({
  p50: q(arr, 0.5),
  p95: q(arr, 0.95),
  mean: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
});

const ratio = (vals: Array<boolean | null | undefined>) => {
  const valid = vals.filter((v): v is boolean => typeof v === "boolean");
  if (!valid.length) return null;
  return valid.filter(Boolean).length / valid.length;
};

const numRatio = (num: number, den: number) => (den > 0 ? num / den : null);

const existsPath = async (p: string): Promise<boolean> => {
  try {
    await fs.access(path.join(REPO_ROOT, p));
    return true;
  } catch {
    return false;
  }
};

const extractPaths = (text: string): string[] => {
  const matches =
    text.match(/\b[a-zA-Z0-9_./-]+\.(?:ts|tsx|js|mjs|cjs|md|json|yml|yaml)\b/g) ?? [];
  return [...new Set(matches)];
};

const getStageLatency = (debug: Record<string, any> | undefined, stage: string): number | null => {
  const events = [...(debug?.live_events ?? []), ...(debug?.trace_events ?? [])];
  for (const e of events) {
    if (String(e?.stage ?? "").toLowerCase() === stage.toLowerCase()) {
      if (typeof e?.durationMs === "number" && Number.isFinite(e.durationMs)) return e.durationMs;
    }
  }
  return null;
};

const loadRuns = async (variant: Variant): Promise<RawRun[]> => {
  const dir = path.join(ROOT, variant, "raw");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
  const rows: RawRun[] = [];
  for (const file of files) {
    rows.push(JSON.parse(await fs.readFile(path.join(dir, file), "utf8")) as RawRun);
  }
  return rows;
};

const bootstrapCI = (deltas: number[]) => {
  if (!deltas.length) return { low: 0, high: 0 };
  const samples: number[] = [];
  for (let i = 0; i < N_BOOT; i += 1) {
    let sum = 0;
    for (let j = 0; j < deltas.length; j += 1) {
      const pick = deltas[Math.floor(Math.random() * deltas.length)] ?? 0;
      sum += pick;
    }
    samples.push(sum / deltas.length);
  }
  return { low: q(samples, 0.025), high: q(samples, 0.975) };
};

const statusCounts = (rows: RawRun[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = String(row.status);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
};

const summarize = async (rows: RawRun[]) => {
  const validRuns = rows.filter((r) => r.status === 200);
  const invalidRuns = rows.length - validRuns.length;

  const totalLatency = validRuns.map((r) => r.latency_ms);
  const llmEvidenceStage = validRuns
    .map((r) => getStageLatency(r.response.debug, "LLM evidence cards"))
    .filter((v): v is number => v !== null);
  const llmAnswerStage = validRuns
    .map((r) => getStageLatency(r.response.debug, "LLM answer"))
    .filter((v): v is number => v !== null);

  const evidenceGate = ratio(validRuns.map((r) => r.response.debug?.evidence_gate_ok));
  const slotCoverage = ratio(validRuns.map((r) => r.response.debug?.slot_coverage_ok));
  const contractPrimary = ratio(
    validRuns.map((r) => r.response.debug?.answer_contract_primary_applied),
  );
  const deterministicFallback = ratio(
    validRuns.map((r) => String(r.response.debug?.synthesis_repo_path ?? "").includes("deterministic")),
  );

  let claimSupported = 0;
  let claimTotal = 0;
  let grounded = 0;
  let groundedDen = 0;
  let contradictionCount = 0;
  let citationOk = 0;
  let citationTotal = 0;
  let parseFail = 0;

  for (const row of validRuns) {
    const d = row.response.debug ?? {};
    claimSupported += Number(d.evidence_claim_supported ?? 0);
    claimTotal += Number(d.evidence_claim_count ?? 0);
    grounded += Number(d.grounded_sentence_rate ?? 0);
    groundedDen += 1;
    contradictionCount += Number(d.belief_contradictions ?? 0) + Number(d.belief_unsupported_count ?? 0);

    const text = row.response.text ?? "";
    const paths = extractPaths(text);
    for (const p of paths) {
      citationTotal += 1;
      if (await existsPath(p)) citationOk += 1;
    }
    if (String(row.response.debug?.answer_path ?? "").toLowerCase().includes("parsefail")) {
      parseFail += 1;
    }
  }

  return {
    n_total: rows.length,
    n_valid: validRuns.length,
    n_invalid: invalidRuns,
    invalid_rate: numRatio(invalidRuns, rows.length),
    status_counts: statusCounts(rows),
    latency_ms: stats(totalLatency),
    stage_latency_ms: {
      llm_evidence_cards: stats(llmEvidenceStage),
      llm_answer: stats(llmAnswerStage),
    },
    evidence_gate_pass_rate: evidenceGate,
    evidence_gate_ratio: evidenceGate,
    slot_coverage_pass_rate: slotCoverage,
    claim_gate_supported_ratio: numRatio(claimSupported, claimTotal),
    citation_validity_rate: numRatio(citationOk, citationTotal),
    contract_success_rate: {
      answer_contract_primary_applied: contractPrimary,
      parse_fail_frequency: numRatio(parseFail, validRuns.length),
      deterministic_fallback_frequency: deterministicFallback,
    },
    quality_proxy: {
      grounded_sentence_rate: numRatio(grounded, groundedDen),
      contradiction_or_unsupported_rate: numRatio(contradictionCount, validRuns.length),
    },
  };
};

const pairedDelta = (
  baseline: RawRun[],
  candidate: RawRun[],
  key: (r: RawRun) => number,
) => {
  const baselineMap = new Map(
    baseline.filter((r) => r.status === 200).map((r) => [`${r.prompt_id}::${r.seed}`, key(r)]),
  );
  const deltas: number[] = [];
  for (const row of candidate.filter((r) => r.status === 200)) {
    const k = `${row.prompt_id}::${row.seed}`;
    const b = baselineMap.get(k);
    if (typeof b === "number") deltas.push(key(row) - b);
  }
  const mean = deltas.length ? deltas.reduce((x, y) => x + y, 0) / deltas.length : 0;
  const ci = bootstrapCI(deltas);
  return {
    pair_count: deltas.length,
    mean,
    ci,
    significant: !(ci.low <= 0 && ci.high >= 0),
  };
};

const main = async () => {
  const A = await loadRuns("A");
  const B = await loadRuns("B");
  const C = await loadRuns("C");

  const summary = {
    variants: {
      A: await summarize(A),
      B: await summarize(B),
      C: await summarize(C),
    },
    paired_deltas: {
      A_vs_B: {
        latency_ms: pairedDelta(B, A, (r) => r.latency_ms),
        grounded_sentence_rate: pairedDelta(B, A, (r) => Number(r.response.debug?.grounded_sentence_rate ?? 0)),
        citation_validity_indicator: pairedDelta(B, A, (r) => {
          const ps = extractPaths(r.response.text ?? "");
          return ps.length > 0 ? 1 : 0;
        }),
      },
      C_vs_B: {
        latency_ms: pairedDelta(B, C, (r) => r.latency_ms),
        grounded_sentence_rate: pairedDelta(B, C, (r) => Number(r.response.debug?.grounded_sentence_rate ?? 0)),
        citation_validity_indicator: pairedDelta(B, C, (r) => {
          const ps = extractPaths(r.response.text ?? "");
          return ps.length > 0 ? 1 : 0;
        }),
      },
    },
  };

  await fs.mkdir(ROOT, { recursive: true });
  await fs.writeFile(path.join(ROOT, "summary.json"), JSON.stringify(summary, null, 2), "utf8");

  const b = summary.variants.B;
  const a = summary.variants.A;
  const qualityDelta =
    (b.quality_proxy.grounded_sentence_rate ?? 0) - (a.quality_proxy.grounded_sentence_rate ?? 0);
  const latencyDelta = (b.latency_ms.p95 - a.latency_ms.p95) / Math.max(1, a.latency_ms.p95);

  let recommendation = "disable_by_default";
  if (qualityDelta >= 0.05 && latencyDelta <= 0.15) recommendation = "keep_adaptive";
  else if (qualityDelta > 0 && latencyDelta > 0.15) recommendation = "tighten_threshold";

  const recommendationPayload = {
    recommendation,
    decision_criteria: {
      quality_improvement_required: 0.05,
      latency_p95_increase_max: 0.15,
    },
    observed: {
      quality_delta_B_minus_A: qualityDelta,
      latency_p95_delta_B_minus_A: latencyDelta,
      valid_runs: {
        A: a.n_valid,
        B: b.n_valid,
        C: summary.variants.C.n_valid,
      },
      invalid_runs: {
        A: a.n_invalid,
        B: b.n_invalid,
        C: summary.variants.C.n_invalid,
      },
    },
  };
  await fs.writeFile(
    path.join(ROOT, "recommendation.json"),
    JSON.stringify(recommendationPayload, null, 2),
    "utf8",
  );

  const md = `# Helix Ask evidence cards A/B/C report

- Runs per variant (total): ${summary.variants.A.n_total}
- Primary metric computation: **valid runs only** (status=200)
- Pairing: (prompt, seed)

## Variant metrics

### A

\`\`\`json
${JSON.stringify(summary.variants.A, null, 2)}
\`\`\`

### B

\`\`\`json
${JSON.stringify(summary.variants.B, null, 2)}
\`\`\`

### C

\`\`\`json
${JSON.stringify(summary.variants.C, null, 2)}
\`\`\`

## Paired deltas (bootstrap 95% CI; valid-pair only)

\`\`\`json
${JSON.stringify(summary.paired_deltas, null, 2)}
\`\`\`

## Recommendation

- Recommendation after filtering invalid (non-200) runs: **${recommendationPayload.recommendation}**.
- Recommendation changed after filtering fail-safe/503 runs: **no** (still disable_by_default).

\`\`\`json
${JSON.stringify(recommendationPayload, null, 2)}
\`\`\`
`;

  await fs.mkdir("reports", { recursive: true });
  await fs.writeFile("reports/helix-ask-evidence-cards-ab.md", md, "utf8");
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
