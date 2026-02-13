# Strobing + Natário Conical Pipeline Audit Checklist

Run this for one bundle to decide whether directional strobing and strict Natário checks are operational.

## 1) Inputs

- Run directory: `tmp/curvature-check-cycle/<TIMESTAMP>/`
- Required artifacts (minimum set):
  - `time-dilation-diagnostics.json`
  - `curvature-congruence-report.json`
  - `pipeline-proofs.json`
  - optional: `time-dilation-lattice-debug.json`
  - optional runtime/strobing trace or logs (if available)

## 2) Fast extraction (copy/paste)

```powershell
$run = "tmp\curvature-check-cycle\<TIMESTAMP>"
Get-Content "$run\time-dilation-diagnostics.json" | ConvertFrom-Json | ConvertTo-Json -Depth 6
Get-Content "$run\curvature-congruence-report.json" | ConvertFrom-Json | ConvertTo-Json -Depth 6
Get-Content "$run\pipeline-proofs.json" | ConvertFrom-Json | ConvertTo-Json -Depth 6
Get-Content "$run\time-dilation-lattice-debug.json" 2>$null | ConvertFrom-Json | ConvertTo-Json -Depth 4
```

## 3) Gate audit (pass/fail criteria)

### A. Natário contract and strict mode

PASS if all are true/expected:

- `time-dilation-diagnostics.json: strict.strictCongruence = true`
- `time-dilation-diagnostics.json: strict.anyProxy = false`
- `time-dilation-diagnostics.json: strict.latticeMetricOnly = true`
- `time-dilation-diagnostics.json: strict.grCertified = true`
- `time-dilation-diagnostics.json: canonical.family = "natario"`
- `time-dilation-diagnostics.json: canonical.chart = "comoving_cartesian"`
- `time-dilation-diagnostics.json: canonical.observer = "eulerian_n"`
- `time-dilation-diagnostics.json: canonical.normalization = "si_stress"`

WARN/FALSE if any are missing or differ.

### B. Strict math/provenance checks

PASS if:

- `curvature-congruence-report.json: primary.status = "PASS"`
- `curvature-congruence-report.json: primary.checks[name="gttResidual"].status = "PASS"`
- `curvature-congruence-report.json: primary.checks[name="thetaK"].status = "PASS"`
- `curvature-congruence-report.json: primary.checks[name="fieldProvenancePresence"].status = "PASS"` (or equivalent check in your schema)
- `curvature-congruence-report.json: primary.checks[name="invariantAvailability"].status = "PASS"`

Critical note:
- If `gttResidual` is WARN, first classify the root cause. A shape mismatch for beta often indicates representation mismatch (`beta_x/y/z` vs packed `beta`), not necessarily physical failure.

### C. Strobing activity (is directional lobe control actually used?)

PASS indicators:

- Sector timing params exist and are non-trivial:
  - `sectorCount > 0`
  - `sectorPeriod_ms > 0`
  - duty fields (`duty`, `dutyCycle`, `sectorDuty`, or analog) are present and not all zero
  - strobe timing fields (`dwell_ms`, `burst_ms`) satisfy non-degenerate values if present
- Geometry path shows non-trivial sector envelope influence:
  - envelope not neutral across runtime layer
  - sector role/sign fields indicate signed or alternating sector control
- If optional sector fields are absent in the artifact, mark: `not available in provided artifacts`.

FAIL indicators:

- No sector fields present and no evidence of envelope/sign scheduling in this run
- all strobe-related parameters resolve to zero/effective-off
- debug/sector trace explicitly indicates disabled behavior

### D. Provenance clarity for panel truth claims

PASS if render sources are explicit and GR-bounded:

- `time-dilation-diagnostics.json: render_plan.sourceForAlpha = "gr-brick"`
- `time-dilation-diagnostics.json: render_plan.sourceForBeta = "gr-brick"`
- `time-dilation-diagnostics.json: render_plan.sourceForTheta = "gr-brick"`
- `time-dilation-diagnostics.json: render_plan.sourceForClockRate = "gr-brick"`

Check whether proxy flags are surfaced:
- `pipeline-proofs.json` `proxy` indicators for truth fields should be false or explicitly documented as derived/diagnostic.

### E. Optional panel parity check

PASS if:

- `time-dilation-lattice-debug.json` loads successfully and `renderingSeed` matches diagnostics
- key contract flags match between diagnostics and debug snapshot (`gate.banner`, `strict` fields)

If debug file is missing with `api_not_found`, mark as `not verified in this bundle`.

## 4) Hard interpretation for reporting

- Geometry-derived values are valid only as **model outputs** of the GR/metric pipeline.
- Negative energy sourcing is a separate source-layer question; if needed, route this to separate Casimir-energy proofs.
- If Natário math passes but strobing is inactive, note clearly:
  - “Natário-admitted geometry verified; strobing was configured but not evidenced as active in this bundle” (or inverse).

## 5) Copy-paste report paragraph

- “Bundle `<TIMESTAMP>` passes strict Natário admissibility (`PASS`) on reported fields: `strictCongruence`, `anyProxy=false`, `grCertified=true`, and core checks (`gttResidual`, `thetaK`, invariants). Strobing evidence is [PASS/WAIVED/MISS]; where available, sector timing/envelope fields indicate [active/inactive]. Panel truth provenance is [clear/ambiguous] because sources for `alpha/beta/theta/clockRate` are [GR brick/other/missing].”

## 6) Common block reasons (reuse directly)

- `gttResidual` WARN due to beta shape mismatch:
  - likely component vs packed-vector representation mismatch
- `time-dilation-lattice-debug.json` unavailable:
  - operational parity cannot be proven for this run
- geometry warp/normalization mismatch between fields:
  - publish only one applied value and label it VISUAL ONLY
- panel claims exceed strict math:
  - require additional provenance paths before publication language.
