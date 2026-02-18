# TOE-058 Tier Promotion Rationale: Halobank Residual Reduced-Order Promotion

## 1) Claim under evaluation

Ticket: `TOE-058-halobank-residual-reduced-order-promotion`.

Promotion target: allow Halobank orbital-alignment outputs to emit a **reduced-order recommendation** only when live ephemeris residual evidence is complete and in-envelope, while enforcing deterministic conservative downgrade for incomplete, out-of-envelope, or fallback conditions.

## 2) Assumptions and bounds

- Scope is restricted to:
  - `server/services/halobank/time-model.ts`
  - `server/skills/halobank.time.compute.ts`
  - `tests/halobank-time-model.spec.ts`
  - `tests/halobank-horizons-consistency.spec.ts`
- Residual envelope is fixed at `|residualPpm| <= 5`.
- Minimum residual sample count is `residualSampleCount >= 3`.
- Complete live residual evidence requires all of:
  - `ephemerisSource=live`
  - `ephemerisEvidenceVerified=true`
  - non-empty `ephemerisEvidenceRef`
  - finite `residualPpm`
  - finite `residualSampleCount >= 3`

## 3) Falsifiable acceptance criteria

1. Complete, in-envelope live evidence returns deterministic pass semantics.
   - `consistency.verdict=PASS`
   - `consistency.firstFailId=null`
   - `claim_tier_recommendation=reduced-order`
2. Incomplete live evidence returns deterministic non-pass semantics.
   - `consistency.verdict=FAIL`
   - `consistency.firstFailId=HALOBANK_HORIZONS_RESIDUAL_EVIDENCE_INCOMPLETE`
   - `claim_tier_recommendation=diagnostic`
3. Out-of-envelope live evidence returns deterministic non-pass semantics.
   - `consistency.firstFailId=HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE`
   - `claim_tier_recommendation=diagnostic`
4. Fallback source remains deterministic diagnostic-only.
   - `consistency.firstFailId=HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`
   - `provenance.certifying=false`

## 4) Source mapping (source → code path → test path → gate)

| Source | Code path | Test path | Gate |
|---|---|---|---|
| Residual completeness and envelope policy | `server/services/halobank/time-model.ts` | `tests/halobank-time-model.spec.ts` | Ticket-required tests + Casimir verify |
| Deterministic first-fail taxonomy for incomplete/out-of-envelope/fallback | `server/services/halobank/time-model.ts` | `tests/halobank-horizons-consistency.spec.ts` | Ticket-required tests + Casimir verify |
| Conservative downgrade policy on failed residual gates | `server/services/halobank/time-model.ts` | `tests/halobank-time-model.spec.ts` | Ticket-required tests + Casimir verify |

## 5) Tier recommendation

- **Default operational tier remains `diagnostic`.**
- **Reduced-order recommendation eligibility** is per-run and deterministic only for complete live evidence in-envelope.
- Any missing/incomplete/out-of-envelope/fallback condition deterministically downgrades recommendation to `diagnostic`.
- No certified claim is produced in this ticket scope.
