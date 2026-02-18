# ToE Research Context Pack (2026-02-18)

## Purpose
Use this file as the mandatory context anchor for Codex Cloud audit/build/closure runs when external GPT sessions cannot load repository files directly.

This pack captures the canonical research backbone and maps it to existing repository structures so future tickets can compare against a stable congruence baseline.

## Scope Boundary
- Coverage maturity is not physical proof.
- `toe_progress_pct` is an engineering-maturity metric, not a truth metric.
- Claims above `diagnostic` must be justified by explicit evidence + gates + reproducibility artifacts.

## Canonical Equation Backbone (Research Baseline)
`E1` GR baseline:
- `G_ab + Lambda g_ab = (8*pi*G/c^4) T_ab`

`E2` Semiclassical coupling:
- `G_ab + Lambda g_ab = (8*pi*G/c^4) <T_ab>_ren`

`E3` Stress-energy consistency:
- `nabla^a G_ab = 0`
- `nabla^a T_ab = 0` (or semiclassical analog)

`E4` Uncertainty propagation:
- `y = f(x)`
- `Sigma_y ~= J Sigma_x J^T`

`E5` Runtime safety gate:
- Use deterministic policy/gate conditions for action acceptance, fallback, and fail reasons.

## Repo Congruence Map (Current State)
`E1`:
- `server/gr/gr-evaluation.ts`
- `server/gr/constraint-evaluator.ts`
- `tests/gr-constraint-gate.spec.ts`

`E2`:
- `server/gr/constraint-evaluator.ts` (`semiclassical_*` residual hooks and mismatch gates)
- `tests/gr-constraint-contract.spec.ts`
- `tests/gr-constraint-gate.spec.ts`

`E3`:
- `modules/gr/stress-energy-integrals.ts`
- `tests/stress-energy-integrals.spec.ts`
- `tests/stress-energy-units.spec.ts`

`E4`:
- `server/services/physics/invariants.ts` (interval propagation and conservative gate decisions)
- `tests/gr-invariants.spec.ts`
- `tests/stress-energy-integrals.spec.ts`

`E5`:
- `tools/warpViability.ts`
- `tools/warpViabilityCertificate.ts`
- `tests/warp-viability.spec.ts`
- `tests/proof-pack-strict-parity.spec.ts`

## Research-Lane Domain Bundles
Halobank/Horizons:
- `docs/audits/research/TOE-048-*.md`
- `docs/audits/research/TOE-052-*.md`
- `docs/audits/research/TOE-058-*.md`
- `docs/audits/research/TOE-063-*.md`
- `docs/audits/research/TOE-070-*.md`

Warp viability:
- `docs/audits/research/TOE-049-*.md`
- `docs/audits/research/TOE-054-*.md`
- `docs/audits/research/TOE-059-*.md`
- `docs/audits/research/TOE-064-*.md`
- `docs/audits/research/TOE-071-*.md`

Ideology-physics bridge:
- `docs/audits/research/TOE-050-*.md`
- `docs/audits/research/TOE-055-*.md`
- `docs/audits/research/TOE-060-*.md`
- `docs/audits/research/TOE-065-*.md`
- `docs/audits/research/TOE-072-*.md`

## Evidence Contract (Required for Promotions)
Minimum fields per claim/evaluation record:
- `claim_id`
- `equation_ref` (`E1..E5`)
- `evidence_type` (`measured|proxy|inferred`)
- `observed_values` with units
- `uncertainty` method + confidence/coverage
- `residuals` + threshold rule
- `gate_verdict` + deterministic reason
- `reproducibility_artifact_hash`
- `test_or_proof_reference`

## Maturity Rules
`diagnostic`:
- Useful for instrumentation and bounded hypothesis checks.
- Not sufficient for high-consequence autonomy claims.

`reduced-order`:
- Requires bounded domain + reproducible residual/gate behavior + explicit uncertainty handling.

`certified`:
- Requires independent reproduction, strict V&V, and safety-gate proof posture.

## Codex Cloud Prompt Standard (Research-Informed)
Every prompt must include:
1. "Read and apply `docs/audits/research/toe-research-context-pack-2026-02-18.md` first."
2. Ticket scope from backlog (`allowed_paths`, `required_tests`, `research_gate`).
3. Explicit requirement to produce:
   - equation -> code -> gate -> test mapping delta
   - unresolved contradictions list
   - promotion recommendation (`diagnostic|reduced-order|certified`)
4. Contract validators:
   - `npx tsx scripts/validate-toe-ticket-backlog.ts`
   - `npx tsx scripts/validate-toe-ticket-results.ts`
   - `npm run validate:toe:research-gates`
   - `npx tsx scripts/compute-toe-progress.ts`
5. Casimir gate:
   - `npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`

## Prompt Template: Audit Pass
Use this in Codex Cloud:

```
Read and apply docs/audits/research/toe-research-context-pack-2026-02-18.md first.
Run a read-only congruence audit for <DOMAIN> against E1..E5 mapping.
No code changes.
Output:
- equation->code->gate->test matrix delta
- missing thresholds and unresolved contradictions
- top 5 patch recommendations with expected maturity impact
Write:
- docs/audits/<domain>-congruence-audit-<date>.md
- artifacts/audits/<domain>-congruence-audit-<date>.json
```

## Prompt Template: Build Pass
Use this in Codex Cloud:

```
Read and apply docs/audits/research/toe-research-context-pack-2026-02-18.md first.
Implement exactly ticket <TOE-ID> from backlog.
Stay inside allowed_paths.
Run required_tests and all ticket validators.
Recompute progress snapshot.
Run Casimir verify with adapter URL and export URL.
Emit receipt:
docs/audits/ticket-results/<TOE-ID>.<UTCSTAMP>.json
Include:
- files_changed
- tests_run (file paths, not only command strings)
- claim_tier
- casimir {verdict, trace_id, run_id, certificate_hash, integrity_ok}
- remaining_gaps
```

## Prompt Template: Closure Audit
Use this in Codex Cloud:

```
Read and apply docs/audits/research/toe-research-context-pack-2026-02-18.md first.
Compare latest implementation outputs against prior domain audit.
Produce:
- resolved gaps
- remaining gaps
- regressions (if any)
- promotion recommendation with evidence
Write:
- docs/audits/<domain>-closure-audit-<date>.md
- artifacts/audits/<domain>-closure-audit-<date>.json
```

## Current Research-Lane Summary (2026-02-18)
- Research-lane ticket receipts present: 15/15.
- Research-lane claim tiers: 11 diagnostic, 4 reduced-order, 0 certified.
- Owner coverage is complete, but tier promotion still depends on domain-specific falsification and reproducibility depth.
