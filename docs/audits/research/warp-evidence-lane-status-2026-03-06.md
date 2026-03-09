# Warp Evidence Lane Status (2026-03-06)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Scope
- Snapshot of non-blocking evidence lanes: `casimir_sign_control`, `q_spoiling`, `nanogap`, `timing`, `sem_ellipsometry`.
- Sources: lane compat-check artifacts, reportable packs, and repeat-determinism artifacts.
- Canonical policy unchanged: these lanes are `reference_only` and do not override canonical full-solve adjudication.

## Default Citation Anchor
- JSON capsule: `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
- Markdown capsule: `docs/audits/research/warp-full-solve-reference-capsule-latest.md`
- Regenerate + validate: `npm run warp:full-solve:reference:refresh`

## Lane Summary
| lane | typed summary (C/I/U) | reportable summary (C/I/U) | reportableReady | blockedReasons | repeat_determinism |
|---|---:|---:|---|---|---|
| casimir_sign_control | `6 / 9 / 3` | `6 / 9 / 3` | `n/a` | `[]` | `PASS` |
| q_spoiling | `5 / 24 / 25` | `5 / 24 / 25` | `true` | `[]` | `PASS` |
| nanogap | `5 / 5 / 0` | `5 / 5 / 0` | `true` | `[]` | `PASS` |
| timing | `9 / 2 / 1` | `9 / 2 / 1` | `true` | `[]` | `PASS` |
| sem_ellipsometry | `8 / 0 / 10` | `0 / 0 / 18` | `false` | `["missing_paired_dual_instrument_run","missing_covariance_uncertainty_anchor"]` | `PASS` |

Legend:
- `C/I/U` = `congruent / incongruent / unknown`.

## Notes By Lane
1. `casimir_sign_control`
   - Envelope is mapped and deterministic.
   - Reportable readiness field is not explicitly set in the current frozen pack; treat as governed by lane contract and congruence outputs.
2. `q_spoiling`
   - Mechanism-aware uncertainty lane is active with deterministic replay.
   - Reportable remains enabled under current strict-scope anchors.
3. `nanogap`
   - Profile-based uncertainty thresholds are active and deterministic.
   - Reportable remains enabled under current strict-scope anchors.
4. `timing`
   - WR short profile boundary behavior is visible (`edge` and `exceeds` reasons) and deterministic.
   - Reportable remains enabled under current strict-scope anchors.
5. `sem_ellipsometry`
   - Typed lane has meaningful interior-congruent envelope points.
   - Reportable is intentionally fail-closed pending paired-run + covariance evidence.
   - Numeric anchor refresh (`EXP-SE-016..EXP-SE-020`) improves source-grounded uncertainty bookkeeping but does not clear reportable blockers.

## Current Priority Blocker
- `sem_ellipsometry` is the only lane with explicit reportable fail-closed blockers.
- Required to clear:
  1. commit-tracked paired SEM+ellips run ID and matched sample set,
  2. numeric covariance anchor (`rho_sem_ellip` or `covariance_sem_ellip_nm2`) from paired run.

## Traceability
- generated_on: `2026-03-06`
- owner: `research-governance`
- commitment: `reference_only`
