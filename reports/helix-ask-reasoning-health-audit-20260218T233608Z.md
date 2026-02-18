# Helix Ask Reasoning Health Audit

- run_id: 20260218T233608Z
- scope: build-driving audit from latest available Helix Ask artifacts/reports in-repo
- execution: Codex Cloud container only

## Inputs consumed

1. Latest versatility summary/failure signals: `reports/helix-ask-versatility-report.md` (run `versatility-1771444680055`, 270/270 complete, top failure signatures included).
2. Latest goal-zone reports: `reports/helix-ask-goal-zone-latest.md` and `reports/helix-ask-goal-zone-decision.md`.
3. Prior known failure run path requested by prompt:
   - `artifacts/experiments/helix-ask-versatility/20260218T232914Z/versatility-1771457356197/summary.json`
   - **status:** not present in current workspace snapshot (input unavailable).
4. Relevant post-run validation/recommendation artifacts:
   - `reports/helix-ask-post-ad92705b-validation.md`
   - `reports/helix-ask-post-c003e748-validation.md`
   - `artifacts/helix-ask-post-ad92705b/summary.json`
   - `artifacts/helix-ask-post-ad92705b/recommendation.json`
   - `artifacts/helix-ask-relation-assembly/summary.json`
   - `artifacts/helix-ask-relation-assembly/recommendation.json`

---

## 1) Capability scorecard

### Legend
- **Working**: clears target in latest available artifacts and consistent enough to build on.
- **Regressing**: mixed/volatile across latest runs; not stable enough for release confidence.
- **Blocked-by-runtime**: product logic appears valid, but runtime behavior prevents reliable quality verification.

| Capability | Score | Evidence | Build impact |
|---|---|---|---|
| intent routing | **Working** | Versatility report shows `intent_id_correct_rate=93.33%`; post-c003 validation also passes intent (`0.933`); goal-zone diagnostics show expected relation intent path. | Keep current routing; avoid broad retune. |
| report-mode policy | **Regressing** | Latest versatility is `92.22%` (pass), but failure signature still high (`report_mode_mismatch:21`) and post-ad927 missed threshold (`0.8979`). | Needs policy hardening + regression tests to prevent slip below 0.90. |
| relation packet build | **Regressing** | Latest versatility `90.0%` (pass), but post-ad927 failed at `0.787`; repeated relation failure signatures (`relation_packet_built:9`). | Treat as unstable; prioritize contract fallback and packet validation. |
| dual-domain relation validity | **Regressing** | Latest versatility `90.0%` (pass), post-ad927 failed at `0.787`; failure signature includes bridge/evidence insufficiency. | Add stricter bridge/evidence floor and domain-pair checks. |
| citation presence/persistence | **Regressing** | Versatility report is high (`97.78%`) but recent decision-grade/post validations show significant misses (`0.756`, `0.0`) and explicit citation gate failures. | Highest content-quality volatility risk; must harden persistence path. |
| deterministic fallback behavior | **Blocked-by-runtime** | Goal-zone decision says routing diagnostics are correct but strict mode still yields `llm.local stub result`; strict quality fails due runtime stub output. | Runtime/model path blocks trustworthy quality assertions. |
| reliability (non-200 / circuit-open) | **Regressing** | post-ad927 shows non-200s (`4/98`) and `circuit_open_short_circuit:4`; other runs show recovery, implying intermittent reliability not eradicated. | Reliability-first sequencing still required before policy tuning. |

---

## 2) Product issues vs infrastructure/runtime blockers

### Product issues (logic/policy quality)

1. **Citation persistence inconsistency across modes/runs** (passes in one campaign, fails sharply in others).
2. **Relation packet and dual-domain quality volatility** (threshold pass in one run, fail in another).
3. **Report-mode mismatch recurrence** despite aggregate pass in latest versatility.
4. **Length/answer-shape quality regressions** in some decision-grade runs (short/stub-like outputs).

### Infrastructure/runtime blockers

1. **Stub runtime path leakage** in strict goal-zone path (`llm.local stub result`) blocks strict quality validation.
2. **Campaign reliability/coherence issues** in ad927 run (incomplete run count and checkpoint incoherence).
3. **Intermittent non-200/circuit-open behavior** in versatility infrastructure.
4. **Missing requested prior artifact path in current workspace** limits direct trend confirmation against the exact named prior run.

---

## 3) Top 5 patch backlog items (build-driving)

## 1) Enforce strict non-stub relation response contract
- **File targets**
  - `server/services/helix-ask/arbiter.ts`
  - `server/services/helix-ask/strict-fail-reason-ledger.ts`
  - `server/services/helix-ask/runtime-errors.ts`
- **Acceptance tests**
  - `tests/helix-ask-modes.spec.ts`
  - `tests/helix-ask-runtime-errors.spec.ts`
  - add/assert strict case for relation intent to reject `llm.local stub result` emission.
- **Expected metric delta**
  - `stub_text_detected_rate`: -6 to -10 pp
  - `min_text_length_pass_rate`: +8 to +15 pp

## 2) Harden citation persistence at final-answer cleanup boundary
- **File targets**
  - `server/services/knowledge/citations.ts`
  - `server/services/helix-ask/format.ts`
  - `server/services/helix-ask/answer-artifacts.ts`
- **Acceptance tests**
  - `tests/helix-ask-answer-artifacts.spec.ts`
  - `tests/helix-ask-format.spec.ts`
  - add multi-family citation persistence fixture for relation/repo/ambiguous prompts.
- **Expected metric delta**
  - `citation_presence_rate`: +10 to +25 pp (floor to >=0.90)

## 3) Stabilize relation packet + dual-domain bridge assembly
- **File targets**
  - `server/services/helix-ask/relation-assembly.ts`
  - `server/services/helix-ask/graph-resolver.ts`
  - `server/services/helix-ask/proof-packet.ts`
- **Acceptance tests**
  - `tests/helix-ask-relation-assembly.spec.ts`
  - `tests/helix-ask-graph-resolver.spec.ts`
  - `tests/helix-ask-bridge.spec.ts`
- **Expected metric delta**
  - `relation_packet_built_rate`: +5 to +10 pp
  - `relation_dual_domain_ok_rate`: +5 to +10 pp

## 4) Tighten report-mode policy determinism
- **File targets**
  - `server/services/helix-ask/query.ts`
  - `server/services/helix-ask/intent-directory.ts`
  - `server/services/helix-ask/verify-policy.ts`
- **Acceptance tests**
  - `tests/helix-ask-routing.spec.ts`
  - `tests/helix-ask-ps2-runtime-report.spec.ts`
- **Expected metric delta**
  - `report_mode_correct_rate`: +2 to +5 pp
  - top failure count `report_mode_mismatch`: reduce by >50%

## 5) Reliability guardrails for non-200/circuit-open + run coherence
- **File targets**
  - `server/services/resilience/circuit-breaker.ts`
  - `server/services/helix-ask/job-store.ts`
  - `server/routes/agi.adapter.ts`
- **Acceptance tests**
  - `tests/helix-ask-job-store-runtime.spec.ts`
  - `tests/helix-ask-runtime-errors.spec.ts`
  - `server/__tests__/agi.adapter.test.ts`
- **Expected metric delta**
  - `invalid_error_rate`: keep <=1%
  - `circuit_open_short_circuit` incidents: near-zero on 270-run campaign
  - checkpoint coherence: 100% consistent

---

## 4) Next build order (Codex Cloud)

### P0 (must do before new policy experiments)
1. Strict non-stub relation response enforcement (Backlog #1)
2. Reliability/coherence hardening for non-200/circuit-open + checkpoints (Backlog #5)

### P1 (quality stabilization immediately after P0)
3. Citation persistence hardening (Backlog #2)
4. Relation packet + dual-domain stability patch (Backlog #3)

### P2 (optimization/tuning after stability)
5. Report-mode determinism tuning and threshold tightening (Backlog #4)

---

## Build-driving conclusion

- Current state is **not release-trustworthy** for reasoning quality despite strong pockets (intent routing, some latest relation metrics) because runtime-blocked strict behavior and volatility across citation/relation/report-mode persist.
- Recommended implementation path in Codex Cloud: **P0 runtime integrity first**, then P1 quality hardening, then P2 policy tuning.
