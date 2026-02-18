# TOE-052 Comparative Evidence Pack: Halobank Residual Tier Promotion

## 1) Claim being compared

Whether Halobank orbital-alignment outputs are eligible for reduced-order recommendation when residual evidence is complete/in-envelope versus incomplete or out-of-envelope.

## 2) Experiment design and bounds

- Lane: `research` (`tier_promotion`).
- Deterministic fixtures from required tests:
  - `tests/halobank-time-model.spec.ts`
  - `tests/halobank-horizons-consistency.spec.ts`
- Comparator scenarios:
  - **A (complete + in-envelope):** live source, explicit verification, reference present, residual + adequate sample count, residual bounded by envelope.
  - **B (complete + out-of-envelope):** same as A but residual exceeds envelope.
  - **C (incomplete evidence):** live source with insufficient residual evidence completeness.
  - **D (fallback source):** fallback path regardless of residual fields.

## 3) Comparative results

| Scenario | Source class | Evidence completeness | Residual envelope status | Expected behavior | Observed test-aligned behavior | Acceptance |
|---|---|---:|---|---|---|---|
| A: complete + in-envelope | live | complete | within_envelope | PASS, no first fail, reduced-order recommendation | `verdict=PASS`, `firstFailId=null`, `claim_tier_recommendation=reduced-order` | PASS |
| B: complete + out-of-envelope | live | complete | out_of_envelope | deterministic non-pass + diagnostic downgrade | `firstFailId=HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE`, recommendation diagnostic | PASS |
| C: incomplete residual evidence | live | incomplete | incomplete_evidence | deterministic incomplete-evidence fail + diagnostic downgrade | `firstFailId=HALOBANK_HORIZONS_RESIDUAL_EVIDENCE_INCOMPLETE`, recommendation diagnostic | PASS |
| D: fallback source | fallback | n/a | n/a | deterministic fallback fail + non-certifying diagnostic-only | `firstFailId=HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`, `certifying=false` | PASS |

## 4) Deterministic thresholds for promotion acceptance

Promotion eligibility from diagnostic to reduced-order recommendation is allowed only when all thresholds pass:

1. `ephemerisSource=live`.
2. `ephemerisEvidenceVerified=true` and non-empty `ephemerisEvidenceRef`.
3. `residualPpm` is finite and `|residualPpm| <= 5`.
4. `residualSampleCount >= 3`.
5. Consistency gate is deterministic with `verdict=PASS` and `firstFailId=null`.

If any threshold fails, policy outcome is **conservative fallback to diagnostic recommendation**.

## 5) Falsifiability hooks

- Lower sample count below threshold while keeping residual small → must produce `HALOBANK_HORIZONS_RESIDUAL_EVIDENCE_INCOMPLETE`.
- Raise residual above envelope with otherwise complete evidence → must produce `HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE`.
- Switch source to fallback under orbital-alignment request → must produce `HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY` and remain non-certifying.

## 6) Tier recommendation

- **Current global recommendation:** `diagnostic` default.
- **Per-run promotion eligibility:** reduced-order recommendation for complete, in-envelope live residual evidence only.
- **Not eligible for certified tier:** no certificate-grade certifying evidence chain in current ticket scope.
