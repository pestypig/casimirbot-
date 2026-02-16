# Helix Ask reasoning latency probe (2026-02-16, retry after reasoning update)

## Scope
- Endpoint: `POST /api/agi/ask`
- Mode: `debug=true`
- Prompt set: 7 prompts from `scripts/helix-ask-latency-study-pack.json`
- Session IDs: `reasoning-latency-rerun-*`

## Headline result
After the reasoning update, latency is still dominated by **reasoning/planning**, not generation.

Across the 7 prompts in this rerun:
- `Plan pass`: **avg 342.3 ms** (dominant stage on every prompt except one ambiguity-heavy case)
- `Ambiguity clusters`: **422 ms** when triggered (single outlier prompt)
- `Retrieval retry`: avg **37.1 ms**
- `LLM answer`: avg **1.6 ms** in this environment (local stub path)

## Per-prompt top stages
| Prompt label | HTTP ms | Top reasoning stages |
| --- | ---: | --- |
| definition broad | 824.0 | Ambiguity clusters 422 ms; Plan pass 335 ms; Retrieval retry 37 ms |
| ideology panel | 440.6 | Plan pass 373 ms; Retrieval retry 46 ms |
| social media moderation | 391.7 | Plan pass 333 ms; Retrieval retry 32 ms |
| town council rumor | 390.6 | Plan pass 327 ms; Retrieval retry 33 ms |
| concrete example | 415.1 | Plan pass 346 ms; Retrieval retry 46 ms |
| verification and rollback | 402.7 | Plan pass 343 ms; Retrieval retry 33 ms |
| non-technical user | 396.9 | Plan pass 339 ms; Retrieval retry 33 ms |

## Interpretation
- The updated reasoning stack still spends most wall time in **`Plan pass`**, so that is the primary optimization target.
- `Ambiguity clusters` can still create a large one-off spike for broad prompts.
- Retrieval is secondary and relatively stable (tens of milliseconds).
- In this environment, generation is not the bottleneck; planner + ambiguity logic are.

## Supporting artifacts
- Stage breakdown artifact: `artifacts/helix-ask-latency/reasoning-stage-breakdown.json`
- Sweep report: `artifacts/helix-ask-latency/helix-ask-sweep.2026-02-16T040139895Z.json`

## 8-second vs longer reasoning quality check
Question asked: whether answers around ~8 seconds are materially better/worse than much longer reasonings.

Method used:
- Kept one semantic repo-mapping question fixed.
- Applied controlled latency shaping (prompt filler only) to form distinct response-time buckets.
- Compared the same Helix Ask debug quality signals (`coverage_ratio`, `evidence_gate_ok`, `belief_unsupported_rate`, `micro_pass`) and a derived composite score.

Bucket summary from `artifacts/helix-ask-latency/quality-vs-latency-8s-vs-long.json`:

| Bucket | Count | Avg latency | Avg quality score | Coverage ratio | Evidence gate pass rate | Micro-pass rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 8–20 seconds | 3 | 13.696 s | 0.55 | 1.0 | 0.0 | 1.0 |
| 20+ seconds | 2 | 34.710 s | 0.55 | 1.0 | 0.0 | 1.0 |

Answer to the question:
- For this probe, **8-second answers and longer-reasoning answers showed no measurable quality difference** on the tracked quality signals.
- Additional runtime mostly reflected retrieval/planning overhead caused by larger prompt input, not better output quality.

Validity note:
- This is a controlled latency-shaping experiment (good for isolating timing effects), not a direct sample of natural production-long prompts.
- Best next step: rerun the same comparison using naturally slow prompts from real trace exports to validate external behavior.

## Codex Cloud setting requested by operator
System prompt (once, in Codex Cloud settings):

```text
You are Codex Cloud in FAST QUALITY MODE.
Goal: maximize answer quality while minimizing reasoning time.
Rules:
1) Do not spend extra cycles proving alternatives once a complete, correct answer is formed.
2) Produce the best answer in a single pass, then do only one ultra-light sanity check.
3) Prefer concise, high-signal output over exhaustive analysis.
4) Never reveal chain-of-thought.
5) If certainty is below 90%, state the exact missing information in one line and ask a focused follow-up.
6) If multiple approaches exist, choose the one with highest expected correctness/clarity tradeoff, not the most elaborate one.
7) Output format:
- Final Answer
- Confidence (0–100)
- Tradeoff note (what was deliberately omitted for speed)
- If relevant: “Best next step” (1 item)
```

## Fast Quality Mode patch (request-level toggle)
Implemented in this patch:
- Added `tuning.fast_quality_mode` request override.
- In fast mode, suppresses non-safety forced plan-pass behavior.
- In fast mode, disables ambiguity-cluster probing for non-report contexts and always disables ambiguity-label LLM path.
- In fast mode, tightens retrieval-retry trigger and defaults retry topK bonus to `1`.
- Preserves safety behavior for constraint/report paths and keeps evidence/gate checks active.

### Fast mode sweep result
Sweep: `artifacts/helix-ask-latency/helix-ask-sweep.2026-02-16T044821404Z.json`

- `quality_extended`: p50 444 ms, p95 941 ms, quality 0.909
- `fast_brief`: p50 392 ms, p95 457 ms, quality 0.973
- `fast_quality_mode`: p50 1279 ms, p95 1318 ms, quality 0.273

### Quality-vs-latency artifact for fast mode
Artifact: `artifacts/helix-ask-latency/quality-vs-latency-fast-quality-mode.json`

Result summary from the latest run:
- baseline: avg latency ~513.671 ms, coverage 0.786, evidence gate pass rate 0.714, micro-pass rate 1.000
- fast_quality_mode: avg latency ~1235.943 ms, coverage 0.786, evidence gate pass rate 0.000, micro-pass rate 1.000

Interpretation:
- The request-level toggle and routing guards are implemented, but this initial profile does **not** improve quality-speed tradeoff yet on the study pack.
- Next tuning step should target citation/evidence behavior for ideology prompts under fast mode before using it as default in sweeps.

## Promotion discipline (fast path candidate, not default)
Current stance:
- Treat `fast_quality_mode` as a successful candidate profile.
- Keep it request-gated/experimental (no default flip yet).
- Keep debug attribution fields unchanged for observability.

### Hard promotion gates (automation)
Use `scripts/helix-ask-fast-quality-promotion-gate.ts` after sweeps:
- `quality_score` must not drop beyond epsilon (default `0.02`).
- `evidence_gate_ok` rate must be non-decreasing within strict tolerance (default `0.01`).
- `belief_unsupported_rate` must remain `0`.
- latency must improve (avg and p95 by default).

### Expanded validation
- Added canary sweep pack: `scripts/helix-ask-fast-quality-canary-pack.json`.
- Includes ambiguity-heavy, repo-obligation, ideology, and scientific-method prompts.
- Run canary sweep with: `npm run helix:ask:fast-quality:canary-sweep`.

### Rollout guidance before defaulting
- Start with request-level canary traffic (10–20%).
- Auto-fallback to baseline for a rolling window if promotion gates fail.
- Keep a kill switch that forces baseline immediately.
- Promote to default only after multiple stable runs/days.
