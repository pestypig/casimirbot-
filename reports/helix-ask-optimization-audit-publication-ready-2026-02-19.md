# Helix Ask Optimization Audit (Publication-Ready)

- Date: 2026-02-19
- Scope: Helix Ask reasoning optimization status for a versatile, scientifically grounded reasoner
- Verdict standard: A system is "optimized" only if no realistic alternative yields >5% relative gain on core quality metrics without unacceptable latency/reliability/safety regression.
- Baseline evidence snapshot: `run_id=versatility-1771483259807` with 270/270 completed runs.

## Executive Verdict

- Verdict: Not optimized (materially improvable).
- Confidence: High for relation/report-mode gaps; medium for latency frontier claims (no run-level latency distribution published).
- Strong points: low stub rate in latest 270-run campaign, high citation-presence proxy, sub-1.5s p95 latency.
- Main blockers: relation packet build and dual-domain relation validity remain at 86.67%, report-mode correctness at 92.22%, and provenance gate is blocked (`decision_grade_ready=false`).
- Scientific-method alignment is partially implemented (trace contract fields exist) but evaluation reproducibility remains inconsistent across campaigns.

Citations: [I1], [I2], [I3], [I4], [I5], [I6].

## Methods

1. Baseline selection
   - Used the latest complete versatility run (`270/270`) as primary baseline.
2. Metrics
   - Core: relation packet build, relation dual-domain success, report-mode correctness, intent correctness, citation presence proxy, latency p50/p95.
   - Reproducibility: provenance gate status and decision-grade readiness.
3. Uncertainty treatment
   - Binomial rates reported with 95% Wilson confidence intervals.
   - No hypothesis test was run for latency p95 delta because public artifacts expose summary percentiles, not per-run paired samples.
4. Claim typing
   - Every major claim is marked `Measured` or `Inferred` in a dedicated ledger.

Citations: [I2], [I3], [I4].

## Core Evidence Table (Measured)

| Metric | Measured value | 95% CI (Wilson) | Optimization bar | Gap | Type |
|---|---:|---:|---:|---:|---|
| Relation packet built | 78/90 = 86.67% | 78.13% to 92.21% | >=95% | +8.33 pp (+9.6% rel) | Measured |
| Relation dual-domain OK | 78/90 = 86.67% | 78.13% to 92.21% | >=95% | +8.33 pp (+9.6% rel) | Measured |
| Report-mode correct | 249/270 = 92.22% | 88.40% to 94.86% | >=98% | +5.78 pp (+6.3% rel) | Measured |
| Intent ID correct | 84/90 = 93.33% | 86.21% to 96.91% | >=95% (working bar) | +1.67 pp (+1.8% rel) | Measured |
| Citation presence proxy | 261/270 = 96.67% | 93.79% to 98.24% | >=99% (stability bar) | +2.33 pp (+2.4% rel) | Measured |
| Latency total p95 | 1422 ms | N/A (summary percentile only) | <=1200 ms (strict) / <=2500 ms (legacy) | +222 ms vs strict | Measured |
| Decision-grade readiness | false | N/A | true | blocked | Measured |

Notes:
- Bars `>=95%` for relation metrics and `>=98%` for report-mode come from the versatility recommendation logic.
- Legacy validation artifacts use more permissive thresholds (for example `report_mode>=0.90`, relation metrics `>=0.85`), so this report treats "optimized" as the stricter bar.

Citations: [I2], [I4], [I5], [I6].

## Measured vs Inferred Claim Ledger

| ID | Claim | Class | Evidence | Status |
|---|---|---|---|---|
| C1 | Latest complete campaign is 270/270 with `run_id=versatility-1771483259807`. | Measured | [I2] | Supported |
| C2 | `relation_packet_built_rate=86.67%` and `relation_dual_domain_ok_rate=86.67%`. | Measured | [I2] | Supported |
| C3 | `report_mode_correct_rate=92.22%`. | Measured | [I2] | Supported |
| C4 | `provenance_gate_pass=false` and `decision_grade_ready=false`. | Measured | [I2] | Supported |
| C5 | Post-tool rerun shows p95 latency improvement 1931 -> 1422 ms with unchanged headline quality rates. | Measured | [I3] | Supported |
| C6 | Semantic quality metrics (`claimCitationLinkRate`, `unsupportedClaimRate`, `contradictionFlag`) exist in code but are not included in versatility summary output. | Measured | [I7], [I4] | Supported |
| C7 | Variant selection is disabled by default (`HELIX_ASK_VARIANT_SELECTION=0`). | Measured | [I8] | Supported |
| C8 | Current state is not optimized under the >5% relative-gain criterion. | Inferred | [C2, C3] | Supported |
| C9 | Primary quality bottleneck is relation-mode assembly/routing, not raw latency. | Inferred | [I2], [I3], [I5], [I6] | Supported |
| C10 | Provenance blocking weakens scientific-method reproducibility quality. | Inferred | [I2], [E11], [E12], [E13] | Supported |
| C11 | Adding adaptive multi-path reasoning (for uncertain cases only) is a plausible later-stage gain path, but secondary to relation/report-mode hardening. | Inferred | [I2], [I7], [E1], [E2], [E3], [E4], [E5] | Plausible, untested |

## Scientific-Method Trace

### Hypotheses

- H0: Helix Ask is not optimized.
- H1: Helix Ask is optimized or statistically indistinguishable from optimized.

### Tests and Outcomes

1. Threshold attainment test
   - Observation: relation packet and dual-domain metrics are both 86.67%, below 95% strict target; report-mode is 92.22%, below 98% strict target.
   - Outcome: rejects H1 under strict optimization criterion.

2. Pareto movement test (recent change)
   - Observation: p95 latency improved by 26.4% (1931 -> 1422 ms) with no change in headline quality metrics in before/after rerun.
   - Outcome: indicates recent non-Pareto-tight behavior (frontier still movable).

3. Reproducibility gate test
   - Observation: campaign marked `provenance_gate_pass=false`, `decision_grade_ready=false`.
   - Outcome: scientific-method alignment is incomplete at evaluation-governance layer.

Citations: [I2], [I3], [I4], [E11], [E12], [E13].

## Contradictions and Residual Risk

- Cross-run quality volatility exists:
  - `citation_presence_rate=0.756` with stub leakage 0.111 in one validation snapshot.
  - `citation_presence_rate=0.0` in another snapshot with incomplete run quality.
- This conflicts with declaring stable optimization even when the newest run looks materially better.
- General-intent policy allows no required citations in some profiles, but broad harness checks can still penalize citation absence; this may create evaluation-policy mismatch.

Citations: [I5], [I6], [I9].

## Prioritized Optimization Roadmap

1. Relation-mode fallback and assembly hardening
   - Target: relation packet build and dual-domain metrics >=95%.
   - Why first: largest quality gap and repeated top failure signatures.
   - Expected effect: +5 to +10 pp from internal audit estimate.

2. Report-mode determinism hardening
   - Target: report-mode correctness >=98%.
   - Why second: largest failure count (`report_mode_mismatch`).
   - Expected effect: +2 to +5 pp and failure count reduction.

3. Provenance gate enforcement for decision-grade runs
   - Target: `provenance_gate_pass=true` by default in release-quality campaigns.
   - Why: required for reproducible scientific claims.

4. Promote semantic quality metrics to first-class campaign outputs
   - Add: `unsupported_claim_rate`, `contradiction_rate`, `claim_citation_link_rate` distributions in summary markdown/JSON.
   - Why: currently instrumented but under-reported.

5. Conditional advanced reasoning escalation (later-stage)
   - Trigger bounded self-consistency / extra retrieval only on high-uncertainty cases.
   - Why: literature-backed gains, but should follow deterministic routing fixes to control latency cost.

Citations: [I2], [I5], [I7], [E1], [E2], [E3], [E4], [E5], [E6].

## Internal References

- [I1] `docs/helix-ask-flow.md:23` to `docs/helix-ask-flow.md:37`
- [I2] `reports/helix-ask-versatility-post-tool-20260219T064058Z.md:8` to `reports/helix-ask-versatility-post-tool-20260219T064058Z.md:62`
- [I3] `reports/helix-ask-versatility-post-tool-rerun-20260219T064450Z.md:7` to `reports/helix-ask-versatility-post-tool-rerun-20260219T064450Z.md:26`
- [I4] `scripts/helix-ask-versatility-record.ts:977` to `scripts/helix-ask-versatility-record.ts:1025`
- [I5] `reports/helix-ask-post-c003e748-validation.md:20` to `reports/helix-ask-post-c003e748-validation.md:25`
- [I6] `reports/helix-ask-post-ad92705b-validation.md:27` to `reports/helix-ask-post-ad92705b-validation.md:32`
- [I7] `server/services/helix-ask/quake-frame-loop.ts:279` to `server/services/helix-ask/quake-frame-loop.ts:310`
- [I8] `server/services/helix-ask/platonic-gates.ts:153` to `server/services/helix-ask/platonic-gates.ts:154`
- [I9] `server/services/helix-ask/intent-directory.ts:145` to `server/services/helix-ask/intent-directory.ts:148`
- [I10] `tests/helix-ask-semantic-quality.spec.ts:10` to `tests/helix-ask-semantic-quality.spec.ts:29`
- [I11] `tests/helix-ask-platonic-gates.spec.ts:32` to `tests/helix-ask-platonic-gates.spec.ts:47`

## External References

- [E1] Wei et al. (2022). Chain-of-Thought Prompting Elicits Reasoning in Large Language Models. https://arxiv.org/abs/2201.11903
- [E2] Wang et al. (2022). Self-Consistency Improves Chain of Thought Reasoning in Language Models. https://arxiv.org/abs/2203.11171
- [E3] Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models. https://arxiv.org/abs/2210.03629
- [E4] Yao et al. (2023). Tree of Thoughts: Deliberate Problem Solving with Large Language Models. https://arxiv.org/abs/2305.10601
- [E5] Shinn et al. (2023). Reflexion: Language Agents with Verbal Reinforcement Learning. https://arxiv.org/abs/2303.11366
- [E6] Liang et al. (2022). Holistic Evaluation of Language Models. https://arxiv.org/abs/2211.09110
- [E7] Hendrycks et al. (2020). Measuring Massive Multitask Language Understanding. https://arxiv.org/abs/2009.03300
- [E8] Lin et al. (2021). TruthfulQA: Measuring How Models Mimic Human Falsehoods. https://arxiv.org/abs/2109.07958
- [E9] Jimenez et al. (2023). SWE-bench: Can Language Models Resolve Real-World GitHub Issues? https://arxiv.org/abs/2310.06770
- [E10] Mialon et al. (2023). GAIA: a benchmark for General AI Assistants. https://arxiv.org/abs/2311.12983
- [E11] National Academies (2019). Reproducibility and Replicability in Science. https://nap.nationalacademies.org/catalog/25303/reproducibility-and-replicability-in-science
- [E12] Munafò et al. (2017). A manifesto for reproducible science. https://www.nature.com/articles/s41562-016-0021
- [E13] Ioannidis (2005). Why Most Published Research Findings Are False. https://doi.org/10.1371/journal.pmed.0020124

## Reproducibility Appendix

- CI formula for binomial rates: Wilson score interval, z=1.96.
- Counts used for confidence intervals in this report:
  - 78/90 (relation packet and dual-domain)
  - 75/90 (ambiguous family pass proxy)
  - 249/270 (report-mode)
  - 261/270 (citation presence)
  - 84/90 (intent)
- Latency significance note: no paired raw sample vectors were available in cited markdown summaries, so a formal significance test on p95 delta was not performed.

## Casimir Verification Gate (This Patch)

- Adapter endpoint: `POST /api/agi/adapter/run`
- Trace export endpoint: `GET /api/agi/training-trace/export`
- Command: `npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace-publication-audit-2026-02-19.jsonl --trace-limit 200 --ci`
- Verdict: `PASS`
- traceId: `adapter:fe33e434-71f1-4602-bb38-43b40f56c243`
- runId: `19394`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`
- firstFail: `null`
- deltas: `[]`
- exported trace artifact: `artifacts/training-trace-publication-audit-2026-02-19.jsonl` (16184085 bytes; 2026-02-19T19:35:12.8748717Z)

