# Helix Ask Universal Constraints Build Plan (2026-02-17)

Status: active
Audience: implementation and release engineering
Primary anchors:
- `docs/audits/universal-constraints-crossover-audit-2026-02-17.md`
- `docs/architecture/helix-ask-proof-packet-rfc.md`
- `docs/ADAPTER-CONTRACT.md`
- `WARP_AGENTS.md`

## 1) Objective

Ship a production-ready Helix Ask path that preserves one contract from:
- ideology and intent routing
- evidence retrieval
- observe/act tool execution
- verification (verdict, firstFail, certificate, integrity)
- trace and artifact continuity

Target outcome:
- no fail-open proof language
- no schema/runtime drift in proof packets
- deterministic fallback when structured output is unsafe

## 2) Non-negotiable constraints

- Do not claim certification unless gate verdict is PASS and certificate integrity is OK.
- LLM outputs cannot directly actuate hardware; deterministic boundaries stay enforced.
- Verify-mode must fail closed.
- Every proof-relevant run must expose artifact refs and trace continuity.
- Any code/config patch must pass Casimir verification gate before completion.

## 3) Baseline snapshot (as of this plan)

Completed:
- Proof packet RFC and P0 utility landed:
  - `docs/architecture/helix-ask-proof-packet-rfc.md`
  - `server/services/helix-ask/proof-packet.ts`
- Ask mode wiring (`read|observe|act|verify`) and Option C fallback hooks landed:
  - `server/routes/agi.plan.ts`
- Adapter response schema parity for certificate field closed:
  - `shared/schema.ts` (`adapterRunResponseSchema.certificate`)

Open blockers:
- Crossover ablation is still infra-dominated (`infra_fail_rate = 100%`), so quality deltas are not yet meaningful.
- Adapter route test runtime is unstable in current branch and must be repaired before canary decisions:
  - `server/__tests__/agi.adapter.test.ts` currently surfaces unresolved symbol failures in route runtime.

## 4) Phase plan

### Phase 0: Transport and runtime reliability recovery (P0)

Scope:
- Remove infrastructure/runtime errors that invalidate ablation quality signals.
- Restore deterministic testability of adapter and ask execution paths.

Primary files:
- `server/routes/agi.adapter.ts`
- `server/services/adapter/run.ts`
- `server/routes/agi.plan.ts`
- `scripts/helix-ask-crossover-ablation.ts`
- `reports/helix-ask-crossover-ablation-report.md`

Required tests/checks:
- `npx vitest run server/__tests__/agi.adapter.test.ts`
- `npx vitest run tests/helix-ask-modes.spec.ts`
- `npx vitest run tests/helix-ask-live-events.spec.ts`
- `npx tsx scripts/helix-ask-crossover-ablation.ts`

Acceptance gates:
- `infra_fail_rate <= 1.0%` for all variants over 2 consecutive ablation runs.
- adapter route tests pass with no unhandled rejections.
- no unresolved `ReferenceError` in adapter/ask execution path.

Exit artifacts:
- updated `reports/helix-ask-crossover-ablation-report.md`
- failure-signature summary showing infra failures no longer dominant

### Phase 1: Proof packet contract completion (P0/P1)

Scope:
- Make proof packet fields first-class and consistent across adapter, ask response, and client parsing.

Primary files:
- `shared/schema.ts`
- `shared/helix-ask-envelope.ts`
- `client/src/lib/agi/api.ts`
- `server/routes/agi.plan.ts`
- `docs/ADAPTER-CONTRACT.md`

Required tests/checks:
- `npx vitest run server/__tests__/agi.adapter.test.ts`
- `npx vitest run tests/helix-ask-modes.spec.ts`
- add and run contract parity tests for adapter/ask response schemas

Acceptance gates:
- verify-mode ask responses include parseable proof packet fields:
  - `verdict`, `firstFail`, `certificateHash`, `integrityOk`, `artifacts`
- contract snapshots match runtime JSON for both:
  - GR mode
  - constraint-pack mode

Exit artifacts:
- schema snapshot test outputs
- proof-packet example payloads in docs

### Phase 2: Act/verify execution hardening (P1)

Scope:
- Route act/verify execution through policy-aware execution path (approvals, agent allowlists, safety boundaries), not ad hoc tool invocation.

Primary files:
- `server/routes/agi.plan.ts`
- `server/services/planner/chat-b.ts`
- `configs/agent-map.json`
- `server/skills/*` (tool safety metadata where needed)

Required tests/checks:
- `npx vitest run tests/helix-ask-modes.spec.ts`
- new tests for:
  - tool allowlist denial in ask act mode
  - approval-required tool behavior
  - verify-mode fail-closed behavior

Acceptance gates:
- verify-mode returns `ok=false` when:
  - verdict is FAIL, or
  - certificate integrity is false/missing
- act-mode cannot bypass agent/tool policy constraints.

Exit artifacts:
- mode-behavior test matrix
- policy denial traces with explicit reasons

### Phase 3: Maturity and visibility discipline (P1)

Scope:
- Enforce user-visible maturity/gate status for physics and verification intents.

Primary files:
- `client/src/components/helix/HelixAskPill.tsx`
- `client/src/pages/desktop.tsx`
- `client/src/lib/agi/api.ts`
- `server/routes/agi.plan.ts`

Required tests/checks:
- component tests for proof/maturity rendering states
- regression checks for no-certificate/no-proof scenarios

Acceptance gates:
- UI always shows maturity plus gate status for verification intents.
- answer text cannot appear as certified without adjacent gate/cert state.

Exit artifacts:
- screenshots or fixture outputs for each gate state
- UX contract checklist marked complete

### Phase 4: Ideology to tool to gate policy binding (P1/P2)

Scope:
- Bind ideology branches to required execution rails and proof artifacts.

Primary files:
- `docs/ethos/ideology.json`
- `server/routes/agi.plan.ts`
- `server/services/planner/agent-map.ts`
- `configs/agent-map.json`
- `shared/local-call-spec.ts`

Required tests/checks:
- new policy tests for ideology branch preflight requirements
- ask routing tests asserting branch-specific required artifacts

Acceptance gates:
- policy-covered ideology branches fail closed when required evidence/tools are missing.
- branch-to-artifact mapping is machine-readable and test-enforced.

Exit artifacts:
- ideology execution policy map (doc or config)
- branch coverage report

### Phase 5: Canary and promotion (P1)

Scope:
- Controlled rollout of proof-packet path using RFC thresholds and reversible fallback.

Primary files:
- `server/routes/agi.plan.ts`
- runtime env/deployment config for:
  - `HELIX_ASK_PROOF_PACKET_P0`
  - `HELIX_ASK_OPTION_C_FALLBACK`
- `scripts/helix-ask-crossover-ablation.ts`
- `reports/helix-ask-crossover-ablation-report.md`

Required checks:
- 2 consecutive ablation runs with transport healthy
- canary error budget and p95 latency comparison

Promotion thresholds (from RFC):
- `infra_fail_rate <= 1.0%`
- `parse_fail_rate <= 2.0%` (conditioned on successful transport)
- `successful_samples_only.crossover_completeness_mean >= current_adaptive - 1.0%`
- `successful_samples_only.claim_support_ratio_mean >= 0.70`
- `p95_latency_increase <= 15%` vs `D_current_adaptive`
- `LOW_EVIDENCE_UTILIZATION <= 5%` of successful samples

Exit artifacts:
- canary report with threshold table
- explicit go/no-go decision log

## 5) PR slicing model

Use one PR per phase. Do not mix phases unless blocked by shared typing.

Per-PR checklist:
- objective and scope
- files touched
- tests executed and status
- Casimir verification output:
  - verdict
  - firstFail
  - certificateHash
  - integrityOk
  - artifact refs

## 6) Verification protocol (mandatory for each code/config patch)

1. Apply patch.
2. Run scoped tests for touched phase.
3. Run Casimir verification gate:

```bash
npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl
```

4. If verdict is FAIL:
- fix first failing HARD constraint
- rerun until PASS

5. Do not close patch without PASS and certificate integrity OK when certificate policy applies.

## 7) Immediate next execution order

1. Phase 0 reliability recovery (blocker removal)
2. Phase 1 proof contract closure
3. Phase 2 execution hardening
4. Phase 3 visibility discipline
5. Phase 4 ideology binding
6. Phase 5 canary and promotion decision
