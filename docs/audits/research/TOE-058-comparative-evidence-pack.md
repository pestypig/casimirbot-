# TOE-058 Comparative Evidence Pack: Halobank Residual Reduced-Order Promotion

## 1) Claim being compared

Whether Halobank consistency output should emit reduced-order recommendation for complete in-envelope live residual evidence, versus deterministic diagnostic downgrade for incomplete, out-of-envelope, or fallback cases.

## 2) Experiment design and bounds

- Lane: `research` (`tier_promotion`).
- Deterministic fixtures come from:
  - `tests/halobank-time-model.spec.ts`
  - `tests/halobank-horizons-consistency.spec.ts`
- Comparator scenarios:
  - **A (live, complete, in-envelope)**
  - **B (live, complete, out-of-envelope)**
  - **C (live, incomplete evidence)**
  - **D (fallback source)**

## 3) Comparative results

| Scenario | Source class | Evidence completeness | Residual status | Expected behavior | Observed behavior | Acceptance |
|---|---|---:|---|---|---|---|
| A: live complete in-envelope | live | complete | within_envelope | PASS; no first fail; reduced-order recommendation | `verdict=PASS`, `firstFailId=null`, recommendation `reduced-order` | PASS |
| B: live complete out-of-envelope | live | complete | out_of_envelope | FAIL with deterministic out-of-envelope fail id | `firstFailId=HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE`, recommendation `diagnostic` | PASS |
| C: live incomplete evidence | live | incomplete | incomplete_evidence | FAIL with deterministic incomplete-evidence fail id | `firstFailId=HALOBANK_HORIZONS_RESIDUAL_EVIDENCE_INCOMPLETE`, recommendation `diagnostic` | PASS |
| D: fallback | fallback | n/a | n/a | FAIL with deterministic fallback fail id; non-certifying | `firstFailId=HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`, `certifying=false` | PASS |

## 4) Promotion thresholds

Reduced-order recommendation is allowed only when all are true:

1. `ephemerisSource=live`
2. `ephemerisEvidenceVerified=true`
3. `ephemerisEvidenceRef` is non-empty
4. `residualPpm` is finite and `|residualPpm| <= 5`
5. `residualSampleCount >= 3`
6. `consistency.verdict=PASS` and `consistency.firstFailId=null`

Any threshold miss produces deterministic FAIL semantics and recommendation downgrade to `diagnostic`.

## 5) Falsifiability hooks

- Keep residual bounded but set `residualSampleCount=2` → must return `HALOBANK_HORIZONS_RESIDUAL_EVIDENCE_INCOMPLETE`.
- Keep completeness true but set `residualPpm=7+` → must return `HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE`.
- Switch source to `fallback` with orbital-alignment request → must return `HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`.

## 6) Tier recommendation

- Global default: `diagnostic`.
- Deterministic promotion eligibility: per-run `reduced-order` recommendation only for live complete in-envelope evidence.
- Certified tier remains out of scope.
