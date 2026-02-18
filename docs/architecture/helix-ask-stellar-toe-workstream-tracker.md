# Helix Ask Stellar+TOE Workstream Tracker

## Objective
Close the gap between research-framework artifacts and decision-grade Helix Ask runtime utility, while preserving Casimir/TOE gate integrity.

This tracker exists to reduce handoff drift between agents.

## Current baseline (bookkept)
- Framework pass completed from stellar paper and merged (`ac4b3faa` lineage).
- Artifacts present under `artifacts/research/stellar-framework/`:
  - `claim-registry.json`
  - `equation-targets.json`
  - `variable-dictionary.json`
  - `maturity-matrix.json`
  - `repo-congruence-map.json`
  - `missing-tree-dag-bridges.json`
  - `retrieval-contract-deltas.json`
  - `build-backlog.json`
  - `summary.json`
- Report present:
  - `reports/helix-ask-stellar-equation-framework.md`
- PS2 runtime contract merged (`60c594cb` merge, `725f3fbd` patch lineage).

## Workstream stages

### Stage A: Provenance + TOE reconciliation
Goal: convert framework artifacts into TOE-complete evidence surfaces.

- A1: Source provenance lock
  - Ensure full paper is in-repo (`docs/papers/stellar-consciousness-orch-or-review-full.pdf`).
  - Add source-hash + page-span mapping for claim registry entries.
- A2: TOE reconciliation
  - Map runtime-contract artifacts to required TOE research/runtime fields.
  - Recompute and verify `docs/audits/toe-progress-snapshot.json`.
  - Target: reduce `missing_research_artifacts` blockers in strict-ready release gate.

### Stage B: Runtime integration
Goal: improve unknown/open-world answer quality from framework inputs.

- B1 (PS1): Bridge integration
  - Implement P0/P1 bridges from `missing-tree-dag-bridges.json`.
  - Wire resolver traversal and add tests.
- B2 (PS2.5): Quake-frame runtime hardening
  - Event pump parity + deterministic fallback path + fixed tick split.
  - Semantic gates: claim-citation link, unsupported claim, repetition, contradiction.
- B3 (PS3): Falsifier schema validation
  - Enforce exploratory-claim falsifier fields and maturity-safe narration.

## Progress ledger template (update each handoff)
Use this exact block in every agent response and append to this file when major state changes happen.

```md
### Handoff Snapshot <UTC timestamp>
- Branch/HEAD:
- Result type: pass | needs_quality_patch | needs_reliability_patch | insufficient_run_quality
- Stage completed:
- Gates passed:
- Gates failed:
- Casimir: PASS/FAIL, certificateHash=..., integrityOk=...
- New artifacts:
- Next single highest-priority task:
```

## Active gate targets
- placeholder_fallback_rate == 0
- empty_scaffold_rate == 0
- mechanism_sentence_present_rate >= 0.95
- maturity_label_present_rate >= 0.95
- claim_citation_link_rate >= 0.90
- unsupported_claim_rate <= 0.10
- contradiction_flag_rate <= 0.10
- p95_latency <= 2500ms
- non_200_rate <= 0.02

## Codex Cloud prompt: Stage A (A1 + A2 combined)
Use this first to stabilize provenance and TOE bookkeeping.

```md
Run Stage A for Helix Ask stellar workstream.

Inputs:
- artifacts/research/stellar-framework/*
- reports/helix-ask-stellar-equation-framework.md
- docs/audits/toe-progress-snapshot.json
- docs/audits/toe-coverage-extension-backlog-2026-02-18.json
- docs/audits/ticket-results/*

Goals:
1) Source provenance lock for stellar framework artifacts.
2) TOE reconciliation so progress snapshot reflects completed research/runtime artifacts correctly.

Required tasks:
1. Ensure source PDF exists at:
   - docs/papers/stellar-consciousness-orch-or-review-full.pdf
   If absent, record explicit provenance warning and hash available source proxy.
2. Add/refresh provenance map artifact:
   - artifacts/research/stellar-framework/source-provenance-map.json
   Include claim_id -> source_path -> page_span -> content_hash.
3. Reconcile TOE metadata for relevant Helix Ask tickets:
   - TOE-062, TOE-067, TOE-068, TOE-069 (and related strict-ready tickets if impacted).
4. Recompute TOE progress snapshot and validate schema/tooling:
   - scripts/compute-toe-progress.ts
   - scripts/validate-toe-ticket-results.ts
   - scripts/validate-toe-ticket-backlog.ts
5. Emit reconciliation report with before/after blocker counts.

Required outputs:
- reports/helix-ask-stellar-toe-reconciliation-<run-id>.md
- artifacts/research/stellar-framework/source-provenance-map.json
- artifacts/research/stellar-framework/toe-reconciliation-summary.json

Mandatory Casimir:
- POST /api/agi/adapter/run (constraint-pack repo-convergence)
- GET /api/agi/training-trace/export

Final response format:
1) Executive summary
2) Strict-ready blocker delta (before/after)
3) Updated TOE ticket status table
4) Exact commands run
5) ✅/⚠️/❌ tests
6) Casimir block
7) Commit hash
```

## Codex Cloud prompt: Stage B1 (PS1 bridge integration)
Run this after Stage A is green.

```md
Implement PS1 bridge integration from:
- artifacts/research/stellar-framework/missing-tree-dag-bridges.json
- artifacts/research/stellar-framework/build-backlog.json

Goals:
- Add P0/P1 nodes/bridges and wire resolver traversal deterministically.
- Add tests for bridge retrieval and fail-safe behavior.

Required outputs:
- reports/helix-ask-stellar-ps1-bridge-integration-<run-id>.md
- artifacts/experiments/helix-ask-stellar-ps1/<run-id>/summary.json
- artifacts/experiments/helix-ask-stellar-ps1/<run-id>/recommendation.json

Mandatory Casimir + trace export and full gate table.
```

## Codex Cloud prompt: Stage B2 (PS2.5 Quake frame loop hardening)
Run this after B1.

```md
Implement PS2.5 runtime hardening from:
- docs/helix-ask-scientific-method-gap.md (Quake frame loop spec section)

Goals:
- Deterministic fallback as engine path.
- Event pump parity + semantic gates.
- No generic placeholder final output.

Required outputs:
- reports/helix-ask-quake-frame-loop-<run-id>.md
- artifacts/experiments/helix-ask-quake-frame-loop/<run-id>/summary.json
- artifacts/experiments/helix-ask-quake-frame-loop/<run-id>/recommendation.json
- artifacts/experiments/helix-ask-quake-frame-loop/<run-id>/focused-qa.json

Mandatory Casimir + trace export and full gate table.
```

## Operator notes
- If a run passes local gates but strict-ready remains blocked, treat that as a TOE reconciliation failure, not a model-quality success.
- Do not merge runtime-quality claims without:
  - semantic gate table
  - Casimir PASS block
  - updated TOE progress snapshot delta

## Bookkeeping snapshots

### Handoff Snapshot 2026-02-18T22:00:00Z (cloud Stage A)
- Branch/HEAD: cloud run, commit `683c761`
- Result type: pass (Stage A scope)
- Stage completed: Stage A (A1 source provenance lock + A2 TOE reconciliation)
- Gates passed:
  - Source provenance lock complete (full-paper asset path + SHA256 + per-claim provenance map)
  - Claim registry rebound to direct source/page evidence
  - TOE validators passed (`compute-toe-progress`, `validate-toe-ticket-results`)
  - Research artifact completion moved to `27/27`
  - Strict-ready blocked reasons reduced to `missing_verified_pass` only
- Gates failed:
  - None reported in Stage A summary
- Casimir: PASS, `certificateHash=6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`, `integrityOk=true`
- New artifacts:
  - `artifacts/research/stellar-framework/source-provenance-map.json`
  - Stage A reconciliation report (`reports/helix-ask-stellar-toe-reconciliation-<run-id>.md`)
  - TOE reconciliation summary artifact (`artifacts/research/stellar-framework/toe-reconciliation-summary.json`)
- Next single highest-priority task:
  - Stage B1 (PS1 bridge integration from `missing-tree-dag-bridges.json` + resolver wiring + tests)

### Handoff Snapshot 2026-02-18T22:44:11Z
- Branch/HEAD: work / cab3729
- Result type: pass
- Stage completed: Stage A (A1 source provenance lock + A2 TOE reconciliation)
- Gates passed: source provenance lock, toe progress recompute, ticket result validation
- Gates failed: none
- Casimir: PASS, certificateHash=6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45, integrityOk=true
- New artifacts: docs/papers/stellar-consciousness-orch-or-review-full.pdf; artifacts/research/stellar-framework/source-provenance-map.json
- Next single highest-priority task: Stage B runtime integration (P0/P1 bridge wiring and tests).

### Handoff Snapshot 2026-02-18T23:10:40Z
- Branch/HEAD: work / 0297925
- Result type: pass
- Stage completed: Stage B1 (PS1 bridge integration)
- Gates passed: bridge inventory ingestion (P0/P1), resolver registration, deterministic traversal, fail-safe missing-anchor structured path, focused retrieval checks
- Gates failed: live /api/agi/ask returned non-200 in this environment due missing local LLM readiness (captured in report)
- Casimir: PASS, certificateHash=d2821c7d650d8d4c86f5270c2510b94ed7cd8c45b12d807e0420613f9fe7ce5d, integrityOk=true
- New artifacts:
  - reports/helix-ask-stellar-ps1-bridge-integration-20260218T230617Z.md
  - artifacts/experiments/helix-ask-stellar-ps1/20260218T230617Z/summary.json
  - artifacts/experiments/helix-ask-stellar-ps1/20260218T230617Z/recommendation.json
  - artifacts/experiments/helix-ask-stellar-ps1/20260218T230617Z/implemented-bridges.json
  - artifacts/experiments/helix-ask-stellar-ps1/20260218T230617Z/remaining-bridges.json
  - artifacts/experiments/helix-ask-stellar-ps1/20260218T230617Z/training-trace-export.jsonl
- Next single highest-priority task:
  - Stage B2 (PS2.5 Quake-frame runtime hardening and semantic gate tightening)

### Handoff Snapshot 2026-02-18T23:21:03Z
- Branch/HEAD: cloud run, commit `0455aa8`
- Result type: infra-blocked
- Stage completed: Stage B2 (PS2.5 Quake-frame runtime hardening benchmark)
- Gates passed:
  - Reliability preflight `/api/ready` true
  - Semantic gates: `repetition_penalty_fail_rate` and `contradiction_flag_rate`
  - Required artifacts emitted: `summary.json`, `recommendation.json`, `focused-qa.json`, `semantic-gates.json`
- Gates failed:
  - Reliability preflight `/api/agi/ask` smoke 200-rate (`0.000`, threshold `>=0.90`)
  - Semantic gates: `claim_citation_link_rate` (`0.000`) and `unsupported_claim_rate` (`1.000`)
- Casimir: PASS, `certificateHash=765346b07be3b1d97dbf4fb7c0091cee28903983e571973afa2ca631ad4fcd08`, `integrityOk=true`
- New artifacts:
  - `reports/helix-ask-quake-frame-loop-2026-02-18T23-21-03-498Z.md`
  - `artifacts/experiments/helix-ask-quake-frame-loop/2026-02-18T23-21-03-498Z/summary.json`
  - `artifacts/experiments/helix-ask-quake-frame-loop/2026-02-18T23-21-03-498Z/recommendation.json`
  - `artifacts/experiments/helix-ask-quake-frame-loop/2026-02-18T23-21-03-498Z/focused-qa.json`
  - `artifacts/experiments/helix-ask-quake-frame-loop/2026-02-18T23-21-03-498Z/semantic-gates.json`
- Next single highest-priority task:
  - Fix ask-runtime readiness/reliability path, then rerun Stage B2 semantic gates in decision-grade mode.
