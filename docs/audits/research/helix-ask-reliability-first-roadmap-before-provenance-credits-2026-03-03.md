# Helix Ask Reliability-First Roadmap Before Provenance Credits (2026-03-03)

## Intent

Before implementing multi-repo derivative ownership/credit mechanics, Helix Ask must be reliable enough to serve as a job adjudicator and evidence router.

This document sets a hard sequencing rule:

1. Stabilize Helix Ask reliability.
2. Then implement provenance-credit expansion.

## Decision Rule (Hard Boundary)

Do **not** promote provenance-credit or derivative minting features that depend on Helix Ask adjudication unless the readiness loop below is green.

Required readiness reference:

- `docs/helix-ask-readiness-debug-loop.md`

## Why This Sequence

If reliability is weak, we encode noisy judgments into ledgered ownership and rewards.
That creates permanent audit debt and trust erosion.

Reliability first keeps economics downstream of evidence quality.

## Readiness Gates (Must Pass)

Use the same gate semantics already defined in the readiness loop:

1. Casimir verify PASS with certificate integrity OK.
2. Contract battery green for ambiguity, ideology, and frontier continuity.
3. Variety battery at target probabilities for routing and output contract behavior.
4. Patch probe pass rate stable under seeded randomized checks.
5. No debug leakage and no runtime fallback leakage in live LLM mode.

## Reliability Scope for Current Phase

Helix Ask must be dependable for:

1. Intent routing (`general`, `repo`, `hybrid`, `ambiguity`, `frontier`).
2. Retrieval grounding (Atlas + retrieval coverage channels additive, not conflicting).
3. Deterministic uncertainty behavior (clarify vs answer logic).
4. Calculator delegation behavior (math router + warp delegation guard).
5. Deterministic fail reasons and replayability via trace evidence.

## Required Evidence Bundle Per Patch

1. Regression output from `scripts/helix-ask-regression.ts`.
2. Variety outputs (`summary.json`, `failures.json`).
3. Patch probe outputs (`summary.json`, report).
4. Math-router evidence run output (strict mode).
5. Casimir verification output with:
   - verdict
   - runId
   - certificate hash
   - integrity status

## Execution Plan (Reliability First)

### Phase R1: Routing + Clarification Stability

1. Eliminate ambiguous routing drift between `general/repo/hybrid`.
2. Keep short-definition prompts deterministic (clarify preservation rules).
3. Ensure mode rationale telemetry is deterministic and replayable.

Exit criteria:

1. Contract battery fully passing.
2. No route regression in patch probe sample.

### Phase R2: Retrieval Reliability + Atlas Alignment

1. Keep Atlas retrieval additive with existing retrieval coverage channels.
2. Prevent framework conflict by deterministic tie-break and channel contributions telemetry.
3. Maintain benchmark gate pass (`atlas:bench:ci`) with representative sampling.

Exit criteria:

1. Atlas benchmark gate PASS.
2. Retrieval contract misses reduced and stable across seeds.

### Phase R3: Calculator + Guardrail Reliability

1. Keep calculator lane deterministic (symbolic + numeric).
2. Preserve warp delegation guard behavior as final for guarded prompts.
3. Ensure no unsafe over-certifying language in fallback/open-world responses.

Exit criteria:

1. Math-router evidence suite PASS in strict mode.
2. Guardrail prompts return expected deterministic reasons.

### Phase R4: Operational Readiness

1. Freeze reliability scorecard for one release candidate window.
2. Run full readiness debug loop and archive artifacts.
3. Tag final verdict as `READY` (not `PARTIAL_READY`) before economic coupling work.

Exit criteria:

1. Readiness verdict `READY`.
2. Casimir PASS with integrity OK for the release candidate.

## After Reliability: Provenance-Credit Workstream (Deferred)

Only after R4:

1. Add derivative provenance fields (repo SHAs, Atlas node lineage, prompt/output hash) to contribution receipts.
2. Enforce trace-linked mintability for derivative lanes.
3. Optionally anchor receipt hashes externally for public timestamping/ownership proofs.

## Out-of-Scope Until READY

1. Crypto token economics changes.
2. External settlement logic.
3. Automated derivative minting tied to Helix outputs.

## Weekly Operator Checklist

1. Run readiness loop commands.
2. Record scorecard deltas.
3. Log top failure buckets.
4. Patch only first divergence class per cycle.
5. Re-run Casimir verify before completion claims.

## Handoff Note

If a patch improves one lane but worsens route reliability, keep reliability as the higher-priority objective and defer feature expansion.

