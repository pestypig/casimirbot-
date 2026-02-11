# Warp Viability Remediation Plan

Status: draft  
Owner: dan  
Date: 2026-02-10  
Scope: Post-INADMISSIBLE remediation paths to reach ADMISSIBLE under strict metric-derived constraints.

## Purpose
Provide a concrete remediation plan to move from the current INADMISSIBLE viability run to a certified ADMISSIBLE run without weakening guardrails or reclassifying proxy telemetry as geometry-derived.

## Inputs
- `reports/warp-viability-run-final.json`
- `WARP_AGENTS.md`
- `docs/warp-definitive-viability-task.md`
- `docs/warp-geometry-cl4-guardrail-map.md`

## Current Failures (from definitive run)
- HARD: `FordRomanQI` failed.
- SOFT: `TS_ratio_min` failed (TS_ratio ~= 50, required >= 100).

## Non-Negotiables
1. HARD guardrails must pass with strict metric-derived sources.
2. No proxy-only substitutions in strict mode.
3. Viability claim requires ADMISSIBLE + integrity OK.

## Remediation Tracks

### Track A: Ford-Roman QI Remediation (HARD)
Goal: Make `FordRomanQI` pass under metric-derived sources.

Actions:
1. Instrument curvature window inputs used by QI guard.
   - Ensure curvature radius or curvature ratio is computed and surfaced (avoid `curvature=unknown`).
   - Verify QI sampling assumptions are satisfied when curvature window is enforced.
2. Reduce effective negative energy exposure in the QI integral.
   - Adjust duty or time window so sampled energy integrates below the bound.
   - If these are configuration knobs, document them as mitigation levers but keep defaults unchanged unless explicitly approved.
3. Add a controlled parameter sweep to identify an ADMISSIBLE region.
   - Use the viability oracle to scan parameters with strict metric-derived inputs.
   - Record the smallest parameter change that clears QI without breaking other HARD guards.

Acceptance criteria:
- `FordRomanQI` passes with `rho_source` = metric-derived and `curvature_enforced` true.
- Evidence captured in a new viability run file.

### Track B: TS Ratio Remediation (SOFT)
Goal: Reach `TS_ratio >= 100` without breaking HARD constraints.

Actions:
1. Confirm autoscale ceiling and floor limits.
   - If `TS_ratio` stalls at ~50, check burst/pulse floor and slew limits.
2. If permissible, adjust pulse or light-crossing timing inputs (without altering defaults).
   - Document the minimal change needed to hit 100 for a pass scenario.
3. Record changes as mitigation hints, not as default values.

Acceptance criteria:
- `TS_ratio_min` passes when mitigation settings are applied.
- `TS_ratio` evidence and source tags are metric-derived.

### Track C: Certified ADMISSIBLE Run
Goal: Produce an ADMISSIBLE certificate with integrity OK.

Actions:
1. Run the viability oracle in strict mode after applying mitigation settings.
2. Record `status`, constraints, and certificate hash in a new report file.
3. Update `docs/warp-definitive-viability-task.md` with the new evidence.

Acceptance criteria:
- `status=ADMISSIBLE` and all HARD constraints pass.
- Certificate integrity OK.

## Outputs
- `reports/warp-viability-run-<timestamp>.json` (new evidence run)
- Updated definitive statement in `docs/warp-definitive-viability-task.md`
- Updated panel audit checklist in `docs/warp-panel-congruence-audit.md`

## Notes
- This plan does not change runtime defaults. Any parameter changes must be explicitly scoped as mitigation experiments.
- If the QI bound is structurally violated under all strict metric-derived settings, the correct outcome is to keep the system INADMISSIBLE.
