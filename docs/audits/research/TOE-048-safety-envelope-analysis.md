# TOE-048 Safety Envelope Analysis

## Scope
This analysis defines the safety envelope for runtime interpretation of Halobank-vs-Horizons residuals under orbital-alignment requests.

## Envelope Definition
- Envelope variable: `residual_ppm` (diagnostic mismatch metric, parts-per-million scale).
- Envelope threshold: `|residual_ppm| <= 5`.
- Required evidence fields for envelope eligibility:
  1. `residual_ppm` is finite.
  2. `residualSampleCount` is finite and `>= 3`.
  3. `ephemerisEvidenceRef` is non-empty.
  4. `ephemerisEvidenceVerified === true`.

## Deterministic Downgrade Policy
1. **Fallback source path**
   - Condition: `ephemerisSource=fallback`
   - Verdict: `FAIL`
   - firstFail: `HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`

2. **Incomplete evidence path**
   - Condition: any required evidence field missing/invalid for `live` source
   - Verdict: `FAIL`
   - firstFail: `HALOBANK_HORIZONS_RESIDUAL_EVIDENCE_INCOMPLETE`

3. **Residual out-of-envelope path**
   - Condition: complete evidence + `|residual_ppm| > 5`
   - Verdict: `FAIL`
   - firstFail: `HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE`

4. **Residual in-envelope path**
   - Condition: complete evidence + `|residual_ppm| <= 5`
   - Verdict: `PASS`
   - firstFail: `null`

## Hazard Notes
- Residual metrics can conceal timing-window or frame mismatches if evidence metadata is absent.
- Incomplete evidence is treated as unsafe for consistency claims to prevent false confidence.
- PASS status indicates only diagnostic consistency under this bounded envelope, not physical certification.

## Validation Hooks
- Runtime bridge logic: `server/services/halobank/time-model.ts`
- Contract tests:
  - `tests/halobank-time-model.spec.ts`
  - `tests/halobank-horizons-consistency.spec.ts`
