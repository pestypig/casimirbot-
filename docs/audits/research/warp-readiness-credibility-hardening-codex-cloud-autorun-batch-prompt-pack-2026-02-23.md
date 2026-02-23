# Warp Readiness Credibility Hardening - Codex Cloud Autorun Batch Prompt Pack (2026-02-23)

Use this prompt in Codex Cloud for a focused implementation pass that improves stakeholder-presentable rigor and resolves common preconceived objections.

## Operator Objective
Harden CasimirBot as a constraint-first research platform that is externally presentable without overclaiming propulsion feasibility. Prioritize verifiable governance behavior, strict Natario contract integrity, and claim-boundary enforcement.

## Scope
Target the following in one coherent patch set:
1. Fix strict Natario contract validation path and metadata sourcing.
2. Make Public vs Academic audience mode operational in UI (not helper-only).
3. Strengthen objection-to-test coverage for claim boundaries and provenance labeling.
4. Keep maturity posture explicit: diagnostic -> reduced-order -> certified-as-governance-only.

## Required Inputs
Read and obey before changes:
- `AGENTS.md`
- `WARP_AGENTS.md`
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-literature-runtime-gap-analysis.md`
- `docs/public-claims-boundary-sheet.md`

## Non-Negotiable Guardrails
1. No near-term propulsion claims.
2. No "strobing/pulsing loophole" framing.
3. No proxy-as-geometry wording in Public mode.
4. Strict mode must fail closed when Natario contract metadata is incomplete.
5. If QI applicability is not PASS, promotion cannot become certified tier.

## Implementation Plan

### A) Natario strict-contract fix
- In `tools/warpViability.ts`, ensure Natario contract checks use Natario chart contract metadata when present (for example `natario.chartContractStatus`) and only fall back to warp adapter chart metadata when needed.
- Keep strict metadata requirements explicit: chart label, chart contract status, observer, normalization/sign convention, unit system.
- Ensure fail reasons are surfaced in snapshot/constraint details for replayability.

### B) Audience mode activation in UI
- In `client/src/components/live-energy-pipeline.tsx`, add an actual mode control for Public vs Academic and wire it to the existing audience-mode formatter.
- Public mode should show boundary-safe labels; Academic mode may show full provenance detail.
- Keep default mode Public.

### C) Test hardening
Add or update tests so regressions are caught:
- Natario strict contract path tests where Natario metadata is valid but warp adapter chart metadata is absent/unknown.
- Audience mode UI behavior test proving mode switch changes rendered derivation labels.
- Existing boundary wording tests remain enforced.

### D) Docs and operator handoff
- Add/update one short doc in `docs/audits/research/` summarizing what changed, what was fixed, and which objections are now test-encoded.
- Include a concise claims boundary reminder paragraph.

## Required Test Execution
Run at minimum:
- `npx vitest run tests/warp-viability.spec.ts`
- `npx vitest run tests/pipeline-ts-qi-guard.spec.ts`
- `npx vitest run tests/qi-guardrail.spec.ts`
- `npx vitest run client/src/lib/__tests__/audience-mode.spec.ts`
- any new tests created for this patch

If touched files trigger additional required tests from `WARP_AGENTS.md`, run those too.

## Required Casimir Verification Gate (for any patch)
Run adapter-backed verify and report exact fields:
- `npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`

If verdict is FAIL:
1. Fix first failing HARD constraint.
2. Re-run verification.
3. Repeat until PASS.

Do not mark complete without PASS and integrity OK.

## Output Contract
Return in this exact structure:
1. `Summary by Goal` (A-D)
2. `Files Changed`
3. `Test Results`
4. `Casimir Verify`:
   - verdict
   - firstFail
   - certificateHash
   - integrityOk
   - traceId
   - runId
5. `Residual Risks`
6. `Commit(s)`

## Optional Batch Sequencing
If running as a multi-step cloud batch, split into:
- Batch 1: Natario strict-contract fix + tests
- Batch 2: Audience mode UI activation + tests
- Batch 3: Docs/handoff + full verification
