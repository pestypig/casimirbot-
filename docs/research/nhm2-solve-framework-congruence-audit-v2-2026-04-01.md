# NHM2 Solve Framework Congruence Audit v2

Date: 2026-04-01
Supersedes the stale repo-state claims in `docs/research/nhm2-solve-framework-congruence-audit-2026-04-01.md`.

## Executive Verdict

**overallCongruenceStatus:** `diagnostic_tier_coherent_artifact_backed_with_specific_correctness_and_modeling_gaps`

Current repo state is stronger than the prior memo claimed.
The core NHM2 research stack is now artifact-backed in-repo across:
- York proof-pack outputs
- canonical visual comparison outputs
- render taxonomy outputs
- shift-geometry outputs
- shift-plus-lapse diagnostics/comparison/dashboard outputs

At the same time, several concrete gaps still block stronger congruence claims:
- a now materially closed Source→York bridge whose optional timing-authority partiality remains advisory rather than proof-promotable
- a source-formula direct-vs-reconstructed proxy gap still reported by the proof-pack
- a now explicit source/mechanism maturity lane that is bounded to reduced-order advisory claims, paired with an explicit promotion contract whose parity route is blocked by derivation-class difference in current architecture and whose exemption route is now active only for bounded source-annotation, mechanism-context, and reduced-order-comparison claims
- a generalized shift-plus-lapse branch that is diagnostic/reference-only, not a full generalized NHM2 solve
- a directional mechanism layer that must keep its pairwise collapse-stage interpretation explicit so internal variance is not overstated or hidden

The right conclusion is not “the repo lacks artifacts.”
The right conclusion is: the repo now has a coherent diagnostic and presentation stack, but several correctness and bridge gaps remain important enough that stronger physics/congruence claims should stay limited.

## Corrected Agreement Summary

## What I agree with

### 1. Canonical NHM2 is still a Natario-like low-expansion baseline under the repo’s current authoritative contract.
This remains the correct repo-level reading.
The proof-pack artifact and audit still classify NHM2 against `natario_control` and `alcubierre_control`, and the winning reference remains `natario_control` in the current artifact.

Relevant repo evidence:
- `shared/warp-promoted-profile.ts`
- `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- `docs/audits/research/warp-york-control-family-proof-pack-latest.md`

### 2. The Casimir mechanism is still proxy-modeled rather than first-principles.
This part of the audit is directionally correct.
The repo models Casimir behavior through reduced-order energy-density/amplification/duty chains rather than a first-principles field solve.
That is acceptable at diagnostic tier, but it is not a first-principles demonstration.

Relevant repo evidence:
- `modules/dynamic/stress-energy-equations.ts`
- `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`

### 3. Sector strobing and timing are represented, but still not fully authoritative as metric-derived timing semantics.
This is also correct.
The repo does compute duty/strobing logic, but the proof-pack still records unresolved policy/authority caveats around timing provenance.

Relevant repo evidence:
- `modules/dynamic/stress-energy-equations.ts`
- `tools/warpViability.ts`
- `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`

### 4. The shift-plus-lapse branch is real, but still reference-only.
This is correct and should remain explicit.
The branch exists, emits calibrated mild local cabin gravity diagnostics, emits tiny local clock-gradient diagnostics, and emits wall-normal `beta_outward/alpha` safety summaries.
But it is still a diagnostics-first/reference-only branch rather than a promoted proof surface.

Relevant repo evidence:
- `server/gr-evolve-brick.ts`
- `artifacts/research/full-solve/nhm2-shift-plus-lapse-diagnostics-latest.json`
- `artifacts/research/full-solve/nhm2-shift-plus-lapse-comparison-latest.json`
- `artifacts/research/full-solve/nhm2-shift-plus-lapse-dashboard-latest.json`

### 5. Precision/provenance handling is necessary and correctly called out as a real issue.
This is correct.
The mild lapse gradient is small enough that raw float32 brick channels under-resolve it, and the repo now explicitly handles that through analytic companion reporting plus provenance warnings.
That is a real numerical limitation, not a cosmetic note.

Relevant repo evidence:
- `artifacts/research/full-solve/nhm2-shift-plus-lapse-diagnostics-latest.json`
- `artifacts/research/full-solve/nhm2-shift-plus-lapse-comparison-latest.json`
- `shared/time-dilation-diagnostics.ts`

### 6. The interpolation bug was a real high-priority falsifier path and is now closed.
This was the strongest concrete correctness finding in the earlier memo, and it was valid when raised.
The sampled trilinear interpolation path in `modules/warp/natario-warp.ts` was corrected so `y1` now uses `ty` consistently rather than `tz`.
That bug is no longer an open current-state contradiction, but it should remain documented as a closed falsifier path with regression coverage.

Relevant repo evidence:
- `modules/warp/natario-warp.ts:1246`

### 7. The `divBeta*` vs `theta*` schema mismatch was real and is now closed.
This was also a valid correctness finding when raised.
The Natário-canonical consumer path now reads the emitted `thetaRms/thetaMax` schema instead of falling through on stale `divBeta*` field names.
That producer/consumer mismatch is no longer an open current-state gap, but it should remain locked down by regression tests.

Relevant repo evidence:
- `shared/time-dilation-diagnostics.ts:1721`
- `modules/warp/warp-metric-adapter.ts:544`

### 8. The Source→York bridge is now materially closed under the current serialization/readiness policy.
This earlier gap no longer remains in the broad form described above.
The current bridge artifact now records:
- `timingAuthorityPresent = true`
- `timingAuthorityStatus = recognized_required_fields_present_optional_fields_partial`
- `parameterMappingsComplete = true`
- `parameterMappingsExplained = true`
- `bridgeReady = true`
- `bridgeClosurePolicy = close_with_current_serialization`

What changed is specific:
- the previously open reduced-order handoff mappings (`sectorCount`, `concurrentSectors`, `dutyCycle`, `modulationFreq_GHz`, `reducedOrderReference.radius_m`) are now serialized and explained as closed bridge fields rather than left in a generic legacy-open bucket
- timing authority is now recognized using the same readiness-aligned required-field policy already used by the dedicated timing-authority audit (`tauLC_ms`, `tauPulse_ms`, `TS_ratio`)
- optional timing fields (`TS`, `epsilon`, `isHomogenized`) may still be partial in the live timing artifact, but that partiality is now explicitly advisory and tracked separately instead of causing the whole bridge to read as absent

This does not promote new physics claims or alter Lane A. It does remove a broad provenance ambiguity and narrows the remaining timing nuance to a non-blocking advisory note.

Relevant repo evidence:
- `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`

### 9. The source-formula mismatch remains non-equivalent, but its policy meaning is now explicit.
The proof-pack still reports `formulaEquivalent = false`, but this is no longer semantically fuzzy.
The current source-formula audit now narrows the state to:
- `formulaMismatchClass = direct_vs_reconstructed`
- `mismatchReason = proxy_vs_metric_term_gap`
- `sourceFormulaInterpretationPolicy = expected_proxy_vs_metric_gap_non_promotable`

The current emitted term-level comparison says:
- the two paths share `rhoMetric_Jm3`
- the reconstructed comparison path lands on that shared `rhoMetric_Jm3`-scale proxy term
- the authoritative direct path lands on a materially larger `final_metricT00Si_Jm3`
- additional emitted reasons are `duty_definition_mismatch`, `timing_source_mismatch`, and `missing_term_mapping`, because the reconstructed path resolves selector/timing inputs that the canonical direct artifact does not serialize as like-for-like inputs

That means the remaining source-formula issue is now specific:
- it is not a tolerance problem
- it is not a hidden unit-contract drift
- it is an explicit direct-metric vs reconstructed-proxy gap
- in the current repo policy, direct-vs-proxy parity is **not** expected for this reconstruction-only comparison
- that mismatch is therefore advisory for Lane A and classification, but still non-promotable for any parity/equivalence claim about the reconstructed path

The right reading is:
- Lane A remains unaffected
- NHM2 classification remains unaffected
- the reconstructed proxy path must not be promoted as formula-equivalent to the authoritative direct metric path
- stronger closure work would still be required before treating the reconstructed path as parity-valid rather than comparison-only

Relevant repo evidence:
- `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- `artifacts/research/full-solve/nhm2-source-formula-audit-latest.json`

## What I do not agree with from the earlier memo

### 1. The claim that the core full-solve artifacts are not present in the repository.
This is no longer correct in the current checkout.
The following committed artifacts exist now:
- `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- `artifacts/research/full-solve/nhm2-canonical-visual-comparison-latest.json`
- `artifacts/research/full-solve/nhm2-york-optix-render-latest.json`
- `artifacts/research/full-solve/render-taxonomy-latest.json`
- `artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json`
- `artifacts/research/full-solve/nhm2-shift-plus-lapse-diagnostics-latest.json`
- `artifacts/research/full-solve/nhm2-shift-plus-lapse-comparison-latest.json`
- `artifacts/research/full-solve/nhm2-shift-plus-lapse-dashboard-latest.json`

The repo may still have reproducibility issues in a clean CI-from-scratch sense, but “artifacts are not present in the repository” is stale as written.

### 2. The claim that `scripts/warp-york-control-family-proof-pack.ts` is empty.
This is false in the current repo.
The file is populated and large, and current taxonomy/render/dashboard integration work is wired through it.

Relevant repo evidence:
- `scripts/warp-york-control-family-proof-pack.ts`

### 3. The claim that shift geometry is only audit-text-backed because artifacts are absent.
This is stale for current repo state.
The current checkout does contain:
- `artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json`

That does not remove the policy caveat (`constraintContextStatus = deferred_units_and_policy_unresolved`), but it does mean the output is artifact-backed in the current repo.

### 4. The claim that render taxonomy is not committed / not reproducible because the main script is empty.
This is also stale in current state.
Both the taxonomy artifact and the corresponding audit are present, and the proof-pack script is not empty.
The right criticism now is not “missing taxonomy artifact.”
The right criticism is “taxonomy exists, but should still be enforced and regenerated deterministically in CI.”

## Corrected Position

The most defensible current position is:
- NHM2 baseline classification is artifact-backed and currently Natario-like under Lane A.
- The repo has a real, coherent diagnostics stack for shift geometry and shift-plus-lapse comparison.
- The mild `nhm2_shift_lapse` branch does represent local cabin gravity, a tiny local clock gradient, and wall-normal safety diagnostics; it is now carried as a candidate authoritative solve family in provenance/model-selection while bounded transport proof surfaces remain fail-closed/reference-only pending the later low-expansion and transport promotion gates.
- The repo now has a provenance-clean comparison/dashboard/presentation layer for this branch, and the current-facing latest dashboard/comparison surfaces explicitly separate candidate solve-family identity from fail-closed bounded transport certification instead of flattening the family back to global `reference_only`.
- The Source→York bridge is now closed under the current serialization/readiness policy, while the remaining source/mechanism layer is explicitly formalized as a bounded reduced-order advisory lane with clear promotion blockers, an explicit promotion contract, and an explicit parity-route feasibility result that the direct metric vs reconstructed proxy route is not currently closable without derivation-class closure work.
- The strongest remaining risks are promotion-level source/mechanism closure, model fidelity, and localized mechanism-render interpretation, not wholesale absence of artifacts.

## Post-Fix Update

The two highest-priority correctness defects identified above have now been fixed and re-run against the current artifact stack:

1. The sampled-shift trilinear interpolation defect in `modules/warp/natario-warp.ts` was corrected.
2. The `divBeta*` vs `theta*` producer/consumer mismatch was reconciled so Natário-canonical checks now read the emitted metric-adapter schema.

Observed rerun deltas after those fixes:
- Lane A winner remains `natario_control`.
- The core York verdict remains Natário-like / low-expansion under the current authoritative contract.
- The Lane A distance numbers moved, but not enough to change the classification:
  - previous Natário distance: about `0.0012469161`
  - rerun Natário distance: `0.0020422635`
  - previous Alcubierre distance: about `0.1355928821`
  - rerun Alcubierre distance: `0.1254708448`
- The shift-plus-lapse diagnostics/comparison values remained materially stable in the current mild-reference branch.
- The regenerated shift-geometry artifact now reports:
  - `shiftGeometryStatus = available`
  - `directionOverlayStatus = available`
  - `directionOverlayCaseDistinctness = mixed`
  - explicit pairwise collapse-stage metadata across the `beta_direction_xz` case set

That last point matters: the interpolation/schema fixes did not overturn the Lane A classification, and the follow-on directional overlay work narrowed the remaining ambiguity honestly. The only same-image pair is now `flat_space_zero_theta` vs `natario_control`, and the updated artifact records that as:
- raw full-slice hashes differ
- sampled overlay-direction hash matches at render resolution
- final image match is therefore treated as a genuine sampled-field equivalence
- any differing seed, streamline-geometry, or overlay hashes are retained as raw debug data but interpreted as non-material internal variance after sampled-field match, not as a blocking collapse

## Corrected Most Important Falsifiers

1. Keep the Source→York bridge in its new materially-closed state by preserving explicit reduced-order handoff serialization and timing-status policy rather than regressing back to a generic legacy-open bucket.
2. Keep the current direct-vs-proxy source-formula gap in settled advisory/non-promotable status unless and until a real parity closure path is implemented.
3. Keep the new `beta_direction_xz` pairwise collapse-stage reporting in place so future directional regressions are localized immediately instead of being inferred from image hashes alone.
4. If shift-plus-lapse is meant to become more than a cabin-lapse diagnostic branch, replace uniform shift initialization with spatial `beta(x)` initialization.

## Recommended Next Action

1. Treat the interpolation bug and the `divBeta*`/`theta*` schema mismatch as closed and keep their regression tests in place.
2. Treat the flat-vs-Natário `beta_direction_xz` same-image pair as a genuine sampled-field match with non-material internal variance, and keep the raw intermediate hashes visible for future debugging.
3. Keep current claims at diagnostic/reference tier; the Source→York bridge is now materially closed in current serialization mode, the source-formula gap remains policy-closed as advisory for Lane A but still not promotable as parity, and the source/mechanism lane is now explicitly bounded to reduced-order advisory claims with only three activated bounded exemption claims.
4. Treat the next unresolved work as parity architecture or downstream bounded-claim consumer hardening rather than route ambiguity: the parity route is explicitly blocked by derivation-class difference centered on `final_metricT00Si_Jm3`, an un-emitted authoritative direct additive closure term set, and the absence of a mapped proxy-side closure term beyond `rhoMetric_Jm3`, while the exemption route is active only for bounded source annotation, mechanism context, and reduced-order comparison claims, downstream proof-pack/dashboard consumers now check Lane A authority directly, include the rendered dashboard card family in conformance, cannot expand the route beyond that bounded scope without a new contract, and use transport-specific fail-closed wording rather than implying that the entire `nhm2_shift_lapse` family is globally `reference_only`.
5. Preserve the current presentation/dashboard work, but do not let it outrun the corrected artifact surfaces.

## Bottom Line

We can agree with the earlier audit on the important technical risks.
We should not agree with its stale repo-state claims about missing artifacts and an empty proof-pack script.

The corrected shared view should be:
- the repo is now substantially more complete and artifact-backed than that memo says
- most provenance and integration ambiguity is now closed enough to support coherent diagnostic-tier interpretation
- the remaining source/mechanism issues are formalized as a bounded advisory maturity layer with an explicit promotion contract, an explicit parity-route feasibility reading, an activated but tightly bounded exemption-route claim surface, and downstream consumer-conformance checks that now explicitly verify Lane A authority and rendered-card boundaries rather than a vague open bucket
- the next unresolved work is promotion-level route closure, specifically derivation-class closure for parity or additional consumer/readiness hardening of the bounded advisory claim subsets; the remaining limitation on the current consumer-conformance result is declared artifact-coupling risk rather than hidden contract ambiguity
