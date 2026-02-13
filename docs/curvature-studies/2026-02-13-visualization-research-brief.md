# Natario Visualization Research Brief (Targeted Intake)

## Objective
Assess Natario panel interpretation for one strict bundle only, and separate three classes of layer behavior:
- truth layers (from GR fields)
- diagnostic overlays (wall/curvature thresholding)
- visual transforms (normalization/warp display settings)

## LLM preface (use exactly)
- Use only the artifacts listed in this brief as ground truth.
- Do not use prior chat history as evidence.
- If a required field is not present, say: "not available in provided artifacts".

## Evidence bundle (single bundle)
- `tmp/curvature-check-cycle/20260213T012326/artifacts/curvature-congruence-report.json`
- `tmp/curvature-check-cycle/20260213T012326/time-dilation-diagnostics.json`
- `tmp/curvature-check-cycle/20260213T012326/pipeline-proofs.json`
- `tmp/curvature-check-cycle/20260213T012326/gr-evolve-brick.json`
- `tmp/curvature-check-cycle/20260213T012326/time-dilation-lattice-debug.json`

## Known interpretation constraints for this bundle
- `time-dilation-diagnostics.json` is present and carries strict diagnostics.
- `time-dilation-lattice-debug.json` may be an API-availability gap (`error = "api_not_found"`) and should be used only if available from the current runtime.

## Required handling of checks
- PASS: use as a green base for interpretation.
- FAIL: any strict math or strict provenance blocker in this bundle -> do not proceed to interpretation.
- WARN: workflow-only mismatch that is explicitly non-blocking.

## Tightness check points (resolve before publication)
1. Geometry scale provenance
- `time-dilation-diagnostics.json: render_plan.geomWarpScale = 0.75`
- `time-dilation-diagnostics.json: renderingProbe` is a string payload containing `\"geomScale\":0.045`.
- Explain and use one canonical deformation scale for publication captions.

2. Debug parity availability
- `time-dilation-lattice-debug.json: error = "api_not_found"` in this bundle sample.
- State whether UI parity is validated from `time-dilation-diagnostics.json` + checker only when debug endpoint is unavailable.

3. Status semantics separation
- `time-dilation-diagnostics.json: gate.banner = "CERTIFIED"`
- `time-dilation-diagnostics.json: strict.* = true values`
- `pipeline-proofs.json: overallStatus.value = "CRITICAL"` can be a pipeline-status namespace difference; do not conflate with strict math strictness.

## Analysis questions
1. Which displayed layers map directly to defined quantities in diagnostics/proofs/brick fields?
2. Which layers are truth vs diagnostic overlays vs visual transforms?
3. Where can users misread diagnostics as physical effect?
4. What default visibility and legend wording minimizes ambiguity?
5. What contradiction points block clean publication narration?

## Expected output
1. One-line verdict: ready / not-ready for research publication.
2. 3 evidence-tied reasons with exact field paths.
3. 3 ranked recommendations (no code changes required).
4. Contradiction list with exact field paths.
5. Final recommended default panel configuration.

## Copy/paste query for GPT
You have only the attached artifacts as ground truth.
Do not use prior chat context as evidence.
If a field is missing, use: "not available in provided artifacts".

Assess publication readiness for Natario visual interpretation under strict-mode rules:
- FAIL only for strict math/provenance blockers.
- WARN only for non-blocking workflow mismatches.
- PASS for strict checks and consistent truth provenance.

Report: one-line verdict, 3 evidence reasons, 3 recommendations, contradiction list, and final panel defaults.

Use exact evidence paths and avoid external assumptions.
