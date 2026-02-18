# TOE-063 Comparative Evidence Pack: Halobank Residual Reduced-Order Hardening Pack

## 1) Claim being compared

Whether Halobank reduced-order recommendation should remain gated by complete live in-envelope evidence while additionally requiring canonical evidence references and bounded integer sample counts.

## 2) Experiment design and bounds

- Lane: `research` (`tier_promotion`).
- Deterministic fixtures:
  - `tests/halobank-time-model.spec.ts`
  - `tests/halobank-horizons-consistency.spec.ts`
- Comparator scenarios:
  - **A (live, canonical, complete, in-envelope)**
  - **B (live, non-canonical reference)**
  - **C (live, non-integer sample count)**
  - **D (live, complete, out-of-envelope)**
  - **E (fallback source)**

## 3) Comparative results

| Scenario | Source class | Evidence reference | Sample count | Residual status | Expected behavior | Observed behavior | Acceptance |
|---|---|---|---:|---|---|---|---|
| A: canonical in-envelope | live | canonical artifact ref | integer in range | within_envelope | PASS; no first fail; reduced-order recommendation | `verdict=PASS`, `firstFailId=null`, recommendation `reduced-order` | PASS |
| B: non-canonical ref | live | invalid format | integer in range | within_envelope | FAIL with deterministic ref-invalid fail id | `firstFailId=HALOBANK_HORIZONS_EVIDENCE_REF_INVALID`, recommendation `diagnostic` | PASS |
| C: non-integer samples | live | canonical artifact ref | non-integer | incomplete_evidence | FAIL with deterministic incomplete-evidence fail id | `firstFailId=HALOBANK_HORIZONS_RESIDUAL_EVIDENCE_INCOMPLETE` | PASS |
| D: out-of-envelope | live | canonical artifact ref | integer in range | out_of_envelope | FAIL with deterministic out-of-envelope fail id | `firstFailId=HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE` | PASS |
| E: fallback | fallback | n/a | n/a | n/a | FAIL with deterministic fallback fail id; non-certifying | `firstFailId=HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`, `certifying=false` | PASS |

## 4) Promotion thresholds

Reduced-order recommendation is allowed only when all are true:

1. `ephemerisSource=live`
2. `ephemerisEvidenceVerified=true`
3. `ephemerisEvidenceRef` is canonical (`artifact:<provider>:<ref...>`)
4. `residualPpm` is finite and `|residualPpm| <= 5`
5. `residualSampleCount` is an integer in `[3, 10000]`
6. `consistency.verdict=PASS` and `consistency.firstFailId=null`

Any threshold miss returns deterministic FAIL semantics with recommendation downgraded to `diagnostic`.

## 5) Falsifiability hooks

- Keep residual bounded and sample count valid but set `ephemerisEvidenceRef="horizons-run-123"` → must return `HALOBANK_HORIZONS_EVIDENCE_REF_INVALID`.
- Keep canonical reference and bounded residual but set `residualSampleCount=7.5` → must return `HALOBANK_HORIZONS_RESIDUAL_EVIDENCE_INCOMPLETE`.
- Keep completeness true and set `residualPpm=7.4` → must return `HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE`.
- Switch source to `fallback` with orbital-alignment request → must return `HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`.

## 6) Tier recommendation

- Default tier remains `diagnostic`.
- Reduced-order recommendation is deterministic and conditional on canonical complete bounded live evidence.
- Certified tier remains out of scope.
