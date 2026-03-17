# Helix Ask Equation Stabilization: Falsifiability Decision Brief (2026-03-17)

## Purpose
This brief records the current chat's observed Helix Ask behavior, failure signatures, and decision options in a falsifiable format for deep research and rollout decisions.

Primary question:
- How should equation-answer reliability be improved without overfitting to one benchmark prompt?

## Scope
In scope:
- Equation asks (broad, mid, specific).
- Selector/gate interaction after retrieval.
- Runtime/latency impact on fallback behavior.

Out of scope:
- Rewriting retrieval index infrastructure.
- Topic-specific hardcoding per individual question.

## Evidence Snapshot From This Session
Observed repeatedly across user-provided logs and live runs:

1. Retrieval often succeeds while final answer still degrades.
- `stage05_slot_coverage.ratio = 1` appeared in multiple runs.
- Yet terminal output still collapsed to clarify/fallback style responses.

2. Selector found strong in-family anchors but downstream gates overrode value.
- Recent live job: `7b88bd99-298c-4cc6-8704-ac79ddf442e6`
- `equation_selector_primary_key = docs/dp_collapse_derivation.md:L23`
- `equation_selector_primary_confidence = 86.32`
- `equation_selector_primary_family_match = true`
- `equation_selector_state_lock_committed = true`
- Still ended with `fallback_reason_taxonomy = clarify:ambiguity_gate`

3. Contract/gate mismatch persisted post-selection.
- Same job reported:
  - `equation_quote_contract.reason = equation_relevance_missing`
  - `equation_relevance_score = 12`
  - `equation_relevance_reason = weak_domain_signal`
- This conflicts with high selector confidence and family match.

4. Runtime and loop pressure are major contributors.
- Same job elapsed about `108845 ms`.
- `stage05_total_ms = 41655`
- Answer path included semantic rerank and multiple late checks before finalization.

5. Operational instability signals were present in the cycle.
- Runtime fallback errors seen earlier (example: `answerGenerationFailed is not defined`).
- Long-running asks/hangs and degraded UX under load were observed.

## Current Setup: Negative Effects On Outcome
1. Gate conflict:
- A high-confidence primary anchor can be selected, then effectively demoted by late semantic/ambiguity gates.

2. Selector non-authority in parts of flow:
- Even with lock signals, renderer/gates can still route to clarify/fallback framing.

3. Quality metrics not aligned to final utility:
- Coverage and slot presence can pass while answer usefulness is low.

4. Latency-driven degradation:
- Long multi-stage loops increase timeout and fallback probability, reducing deterministic quality.

5. Drift risk from late mutation:
- Post-selection rewrite/cleanup stages can reintroduce instability or reduce anchor fidelity.

## Falsifiable Hypotheses
H1:
- If selector-authoritative policy is enforced for equation asks, primary-anchor accuracy increases and clarify fallback decreases.
- Falsifier: no statistically meaningful improvement vs baseline.

H2:
- If ambiguity/equation-relevance gates are calibrated to respect high selector confidence + family match, false downgrades fall.
- Falsifier: downgrade rate remains high for high-confidence in-family anchors.

H3:
- If runtime is bounded with one degrade path and no cascading repairs after selector lock, p95 latency and drift both improve.
- Falsifier: p95 remains above target or drift rate unchanged.

## Candidate Methodologies (General, Not Question-Specific)
Option A: Deterministic-First Selector Authority
- Retrieval remains broad.
- Typed candidate table + deterministic selector becomes source of truth.
- Post-selector stages become style-only and non-mutating.

Option B: Dual-Path Arbitration
- Run deterministic selection path and current path in parallel.
- Choose output by objective rubric (anchor validity, family match, latency).

Option C: Learned Calibration Layer
- Keep deterministic selector.
- Replace some threshold heuristics with learned calibration from trace outcomes.

Option D: Minimal-Change Threshold Tuning
- Adjust current gates only.
- Lower implementation risk but likely weakest long-term stability.

## Recommended Experimental Design
Design principles:
- Pre-register metrics and promotion thresholds.
- Use the same prompt pack and seeds across variants.
- Separate broad/mid/specific scoring.

Prompt ladder per target equation:
1. Broad conceptual ask.
2. Mid mechanism + equation ask.
3. Specific path/symbol ask.

Core metrics:
- `primary_anchor_accuracy`
- `primary_family_match_rate`
- `symbol_target_hit_rate` (specific prompts)
- `clarify_fallback_rate`
- `anchor_drift_rate` (renderer primary != selector primary)
- `artifact_leak_rate`
- `p95_latency`

Promotion gate (example):
- `primary_anchor_accuracy`: +10% minimum over baseline.
- `clarify_fallback_rate`: at least 40% reduction.
- `artifact_leak_rate`: no regression.
- `p95_latency`: <= 30s for equation asks.

## Decision Matrix
Use this matrix for deep research adjudication:

1. Reliability under broad prompts.
2. Reliability under specific path/symbol prompts.
3. Resistance to cross-topic substitution as primary.
4. Runtime stability under load.
5. Explainability of failures from debug telemetry.

Decision rule:
- Promote only if reliability + latency + explainability all improve simultaneously.

## Immediate Next Actions
1. Run baseline (`V0`) and selector-authoritative (`V1`) on the same ladder set.
2. Capture per-run debug records and compute the registered metrics.
3. Review misfire buckets:
- `clarify:ambiguity_gate` after selector lock.
- `equation_relevance_missing` despite high selector confidence.
- long-running `stage05_total_ms` cases.
4. Decide promotion or rollback based on threshold outcomes.

## Traceability Anchors (This Session)
- Representative long equation job:
  - `jobId`: `7b88bd99-298c-4cc6-8704-ac79ddf442e6`
  - `traceId`: `ask:aa272e33-c37a-4374-9c8c-4822b7a40fbb`
- Representative completed generic job:
  - `jobId`: `b5fe8478-1037-40b3-a85b-ac0f0b1504b1`
  - `traceId`: `ask:2d317c01-6918-45f6-a8a5-ddb122a37332`

## Notes
- This brief intentionally avoids single-question hardcoding as a strategy.
- The objective is robust, generalizable equation-answer behavior with deterministic evidence continuity.
