# TOE-070 Comparative Evidence Pack: Halobank Horizons Long-Window Calibration Pack

## 1) Claim being compared

Whether Halobank reduced-order recommendation eligibility should require explicit long-window residual calibration evidence in addition to canonical live evidence completeness and residual envelope bounds.

## 2) Experiment design and bounds

- Lane: `research` (`tier_promotion`).
- Deterministic fixtures:
  - `tests/halobank-time-model.spec.ts`
  - `tests/halobank-horizons-consistency.spec.ts`
  - `tests/horizons-proxy.spec.ts`
- Comparator scenarios:
  - **A (live, canonical, complete, long-window, in-envelope)**
  - **B (live, canonical, short-window, in-envelope)**
  - **C (live, canonical, long-window, out-of-envelope)**
  - **D (live, non-canonical evidence reference)**
  - **E (fallback source)**

## 3) Comparative results

| Scenario | Source class | Evidence reference | Residual window | Residual status | Expected behavior | Observed behavior | Acceptance |
|---|---|---|---:|---|---|---|---|
| A: long-window bounded live | live | canonical artifact ref | 72 h | within_envelope | PASS; no first fail; reduced-order recommendation | `verdict=PASS`, `firstFailId=null`, `residualWindowStatus=long_window`, recommendation `reduced-order` | PASS |
| B: short-window live | live | canonical artifact ref | 6–12 h | within_envelope | FAIL with deterministic long-window fail id | `firstFailId=HALOBANK_HORIZONS_LONG_WINDOW_REQUIRED`, `residualWindowStatus=short_window` | PASS |
| C: out-of-envelope long-window | live | canonical artifact ref | 72 h | out_of_envelope | FAIL with deterministic residual out-of-envelope id | `firstFailId=HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE` | PASS |
| D: non-canonical reference | live | invalid format | 72 h | within_envelope | FAIL with deterministic reference-invalid id | `firstFailId=HALOBANK_HORIZONS_EVIDENCE_REF_INVALID` | PASS |
| E: fallback | fallback | n/a | n/a | n/a | FAIL with deterministic fallback id; non-certifying | `firstFailId=HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`, `certifying=false` | PASS |

## 4) Promotion thresholds

Reduced-order recommendation remains allowed only when all are true:

1. `ephemerisSource=live`
2. `ephemerisEvidenceVerified=true`
3. `ephemerisEvidenceRef` is canonical (`artifact:<provider>:<ref...>`)
4. `residualPpm` finite and `|residualPpm| <= 5`
5. `residualSampleCount` integer in `[3, 10000]`
6. `residualWindowHours` in `[24, 8760]`
7. `consistency.verdict=PASS` and `consistency.firstFailId=null`

Any threshold miss returns deterministic FAIL semantics with recommendation downgraded to `diagnostic`.

## 5) Falsifiability hooks

- Keep all PASS thresholds but set `residualWindowHours=12` → must return `HALOBANK_HORIZONS_LONG_WINDOW_REQUIRED`.
- Keep long-window evidence and set `residualPpm=7.4` → must return `HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE`.
- Keep residual bounded and window valid but set `ephemerisEvidenceRef="horizons-run-123"` → must return `HALOBANK_HORIZONS_EVIDENCE_REF_INVALID`.
- Keep canonical references and bounds but use `ephemerisSource="fallback"` → must return `HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`.
