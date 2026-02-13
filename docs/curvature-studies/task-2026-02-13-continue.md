# Curvature Build Task (2026-02-13)
Status: ready_for_tightening

Scope:
- Keep math admissibility unchanged.
- Finish interpretation-hardening before the next publication-oriented research pass.

Run target:
- `tmp/curvature-check-cycle/20260213T012326`

Open artifacts:
- `tmp/curvature-check-cycle/20260213T012326/artifacts/curvature-congruence-report.json`
- `tmp/curvature-check-cycle/20260213T012326/time-dilation-diagnostics.json`
- `tmp/curvature-check-cycle/20260213T012326/pipeline-proofs.json`
- `tmp/curvature-check-cycle/20260213T012326/gr-evolve-brick.json`
- `tmp/curvature-check-cycle/20260213T012326/time-dilation-lattice-debug.json`

Tightening tasks before next research publication block:

1) Resolve debug availability semantics
- Confirm whether `time-dilation-lattice-debug.json` is expected to be API-provided in this environment.
- If feature-flagged off, explicitly annotate: `error = "api_not_found"` is workflow-only and not a strict math blocker.
- Keep this as a separate note: "Panel parity can still be validated from diagnostics + checker if debug endpoint is unavailable."

2) Canonicalize geometry scale reporting
- Current evidence shows two geometry numbers:
  - `time-dilation-diagnostics.json: render_plan.geomWarpScale = 0.75`
  - `time-dilation-diagnostics.json: renderingProbe` includes `geomScale = 0.045` (inside stringified payload)
- Produce one publication statement:
  - either `geomWarpScale` only, or
  - interpret `renderingProbe.geomScale` as the rendered value and align `render_plan.geomWarpScale` accordingly.
- Document which one is used for rendered geometry and mark as visual-only.

3) Normalize status interpretation language
- Do not mix artifact namespaces:
  - `time-dilation-diagnostics.json: gate.banner = CERTIFIED` (strict+runtime contract)
  - `pipeline-proofs.json: overall_status.value = CRITICAL` (pipeline meta-state)
- Research output must distinguish these with separate labels.

4) Panel-default recommendations (no code change now)
- Truth-first default: α and |β| truth layers on.
- Diagnostics: keep wall overlay OFF by default, add explicit enable toggle.
- Visual transform markers: always display percentiles, warp weights, and geometry scale with explicit "VISUAL ONLY" marker.

Acceptance criteria for this task:
- A single, unambiguous statement exists for scale rendering policy.
- Debug-parity limitation is clearly documented and non-blocking.
- Panel default recommendations are ready for human-facing research docs.
- No new strict math/provenance blockers.
