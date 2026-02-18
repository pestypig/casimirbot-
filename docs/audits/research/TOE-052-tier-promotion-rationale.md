# TOE-052 Tier Promotion Rationale: Halobank Residual Tier Promotion Pack

## 1) Claim under evaluation

Ticket: `TOE-052-halobank-residual-tier-promotion-pack`.

Promotion target: permit Halobank orbital-alignment outputs to move from diagnostic-only handling toward **reduced-order recommendation** only when live ephemeris residual evidence is complete and remains within a bounded acceptance envelope.

## 2) Assumptions and bounds

- Scope is limited to Halobank time-model and its consistency gate coverage:
  - `server/services/halobank/time-model.ts`
  - `tests/halobank-time-model.spec.ts`
  - `tests/halobank-horizons-consistency.spec.ts`
- Residual acceptance envelope is fixed at `|residualPpm| <= 5` with a minimum sample count of `>= 3`.
- Evidence completeness requires all of:
  - `ephemerisEvidenceVerified=true`
  - non-empty `ephemerisEvidenceRef`
  - finite `residualPpm`
  - finite `residualSampleCount >= 3`
- Missing or out-of-envelope residual evidence must preserve conservative downgrade behavior (`claim_tier_recommendation=diagnostic`).

## 3) Falsifiable acceptance criteria

A promotion candidate is **rejected** unless all criteria pass:

1. Complete live evidence within envelope produces deterministic PASS and no fail id.
   - `consistency.verdict = PASS`
   - `firstFailId = null`
   - `residualStatus = within_envelope`
2. Complete live evidence outside envelope is deterministically non-pass.
   - `firstFailId = HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE`
   - `claim_tier_recommendation = diagnostic`
3. Incomplete live residual evidence remains conservative and deterministic.
   - `firstFailId = HALOBANK_HORIZONS_RESIDUAL_EVIDENCE_INCOMPLETE`
   - `residualStatus = incomplete_evidence`
   - `claim_tier_recommendation = diagnostic`
4. Fallback ephemeris remains diagnostic-only/non-certifying.
   - `firstFailId = HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`

## 4) Source mapping (source → code path → test path → gate)

| Source | Code path | Test path | Gate |
|---|---|---|---|
| Residual envelope (`5 ppm`) and minimum sample threshold (`>=3`) | `server/services/halobank/time-model.ts` | `tests/halobank-time-model.spec.ts` | Ticket required tests + Casimir verify |
| Deterministic first-fail taxonomy for incomplete/out-of-envelope/fallback | `server/services/halobank/time-model.ts` | `tests/halobank-horizons-consistency.spec.ts` | Ticket required tests + Casimir verify |
| Conservative tier recommendation downgrade behavior | `server/services/halobank/time-model.ts` | `tests/halobank-time-model.spec.ts` | Ticket required tests + Casimir verify |

## 5) Tier recommendation

- **Recommended default tier: `diagnostic`.**
- Promotion posture:
  - Candidate may receive per-run **reduced-order recommendation** only for live, complete, in-envelope residual evidence.
  - Any missing, insufficient, or out-of-envelope residual evidence forces conservative diagnostic downgrade.
- No certified promotion in this scope:
  - Evidence path is explicitly non-certifying and claim-tier output remains guarded by deterministic fail taxonomy.
