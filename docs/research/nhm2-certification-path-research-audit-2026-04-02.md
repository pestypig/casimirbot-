# NHM2 Final Bounded-Stack Status Audit

- date: 2026-04-02
- status: bounded-stack decision memo
- owner: codex
- authoritative latest evidence generation: 2026-04-03 UTC

## Purpose

This document is the final bounded-stack status audit for NHM2 as it now exists in the repo. It is not a roadmap memo and it does not widen any physics claim. Its job is to answer the mission-question family from the current certified `latest` proof surfaces, using the hardened publication and provenance model.

The bounded NHM2 stack now includes:

- a certified bounded `warpWorldline`
- a certified bounded cruise-envelope preflight
- a certified bounded route-time worldline
- a certified bounded mission-time estimator
- a certified bounded mission-time comparison
- a certified bounded cruise envelope
- a certified bounded in-hull proper-acceleration surface
- a hardened proof-surface manifest and bounded-stack publication path

## Executive Summary

The repo now gives coherent bounded answers to the main NHM2 mission-question family, but those answers remain deliberately scoped.

- The hull-"gravity" question is now answerable as observer-defined experienced proper acceleration for a declared interior observer family. In the current certified NHM2 latest artifact, that bounded cabin-cross profile is an honest zero-profile result. This is not curvature-gravity certification.
- The cruise question is now answerable as a certified bounded cruise-control descriptor envelope over `bounded_local_transport_descriptor_norm = ||beta_eff||`. This is stronger than preflight because it is consistency-qualified by the route-time, mission-time, and comparison layers. It is not a scalar `vmax` certificate.
- The Alpha Centauri mission-time question is now answerable only as a bounded target-coupled estimator. On the current certified basis for `alpha-cen-a`, the estimator reports coordinate time and ship proper time separately, and both are `4.3652231448899625 yr`.
- The relativistic-vs-nonrelativistic comparison question is now answerable only on the current bounded comparison basis. The present certified result is an honest zero-differential case against the `classical_no_time_dilation_reference`; it must not be translated into a broad "warp advantage" claim.
- The acceleration-profile question is only partially answered. The repo has a bounded local worldline, bounded route-time progression, and bounded in-hull proper-acceleration profile, but it still does not publish a full route-dynamic acceleration history, comfort profile, or scalar speed history.

## Authoritative Latest Proof Surfaces

The authoritative summary layer is:

- `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- `docs/audits/research/warp-york-control-family-proof-pack-latest.md`
- `artifacts/research/full-solve/nhm2-proof-surface-manifest-latest.json`
- `docs/audits/research/warp-nhm2-proof-surface-manifest-latest.md`

The manifest is the publication/provenance authority for the bounded NHM2 stack.

- `publicationMode`: `bounded_stack_latest_sequential_single_writer`
- `trackedRepoEvidenceStatus`: `repo_tracked_latest_evidence`
- `proofSurfaceCount`: `8`
- per-surface SHA256 checksums are recorded in the manifest
- current latest JSON files are checksum-consistent with the manifest entries

The evidence-state model is now exact rather than optimistic:

- `repo_trackable_latest_evidence`: the bounded latest paths are not ignored, but one or more are not yet git-tracked
- `repo_tracked_latest_evidence`: the bounded latest paths are git-tracked, but the critical bounded-stack set still has index/worktree delta
- `repo_landed_clean_latest_evidence`: the bounded latest paths are git-tracked and clean for the critical bounded-stack set after publish

The current emitted state is intentionally the middle state, not the strongest one. That means the bounded-stack evidence is repo-facing and tracked, but the audit does not overstate it as a clean landed state while the critical set still has git delta.

The current bounded proof surfaces covered by the manifest are:

- `nhm2-warp-worldline-proof-latest.json`
- `nhm2-cruise-envelope-preflight-latest.json`
- `nhm2-route-time-worldline-latest.json`
- `nhm2-mission-time-estimator-latest.json`
- `nhm2-mission-time-comparison-latest.json`
- `nhm2-cruise-envelope-latest.json`
- `nhm2-in-hull-proper-acceleration-latest.json`
- `warp-york-control-family-proof-pack-latest.json`

## Final Status Matrix

| Surface | Status | Certified | Primary meaning | Main non-claim |
| --- | --- | --- | --- | --- |
| `warpWorldline` | `bounded_solve_backed` | yes | bounded local-comoving transport contract | not mission time, not max speed |
| cruise preflight | `bounded_preflight_ready` | yes | admissible bounded descriptor support band | not a speed certificate |
| route-time worldline | `bounded_route_time_ready` | yes | bounded route-progress progression in fixed chart | not a target ETA |
| mission-time estimator | `bounded_target_coupled_estimate_ready` | yes | target-coupled bounded estimator with separate coordinate/proper time | not a full route dynamic |
| mission-time comparison | `bounded_target_coupled_comparison_ready` | yes | bounded paired comparison against a classical no-time-dilation reference | not broad relativistic advantage |
| cruise envelope | `bounded_cruise_envelope_certified` | yes | certified bounded cruise-control descriptor envelope | not scalar `vmax` |
| in-hull proper acceleration | `bounded_in_hull_profile_certified` | yes | observer-defined experienced proper acceleration profile | not curvature gravity, not comfort certification |
| proof-surface manifest | `bounded_stack_publication_hardened` | yes | deterministic publication/provenance layer for bounded latest evidence | not a physics surface |

## Question-By-Question Status

### 1. In-hull gravity

Current answer:

- The repo now gives a certified bounded answer as observer-defined experienced proper acceleration for the declared `eulerian_comoving_cabin` observer family in the `comoving_cartesian` chart.
- The current certified cabin-cross profile has `sampleCount = 7`, `representative_mps2 = 0`, `representative_g = 0`, `min_mps2 = 0`, and `max_mps2 = 0`.

Supporting evidence:

- `artifacts/research/full-solve/nhm2-in-hull-proper-acceleration-latest.json`
- `docs/audits/research/warp-nhm2-in-hull-proper-acceleration-latest.md`

Status:

- `certified_bounded_answer`

Claim boundary:

- This is experienced proper acceleration for a declared interior observer family.
- It is not curvature-gravity certification.
- It is not comfort or safety certification.
- The older shift+lapse gravity lane remains `reference_only` and does not widen this claim.

### 2. Cruise / "maximum speed"

Current answer:

- The repo does not certify a scalar NHM2 max speed.
- It does certify a bounded cruise envelope over `bounded_local_transport_descriptor_norm = ||beta_eff||`.
- The current certified admissible band is `3.6531425984160347e-16 .. 1.9546804721038186e-15`, with representative value `1.9546804721038186e-15`.

Supporting evidence:

- `artifacts/research/full-solve/nhm2-cruise-envelope-latest.json`
- `docs/audits/research/warp-nhm2-cruise-envelope-latest.md`
- `artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json`

Status:

- `bounded_partial_answer`

Claim boundary:

- This is a chart-fixed cruise-control descriptor envelope.
- It is stronger than preflight because it is route-time, mission-time, and comparison consistent.
- It is not scalar `vmax`.
- It is not an unconstrained speed certificate.

### 3. Acceleration profile

Current answer:

- The repo now answers part of this question through two bounded surfaces:
  - a bounded route-time worldline progression
  - a bounded in-hull proper-acceleration profile
- It still does not certify a full route-dynamic acceleration history, a comfort profile, or a speed history along an arbitrary mission trajectory.

Supporting evidence:

- `artifacts/research/full-solve/nhm2-route-time-worldline-latest.json`
- `artifacts/research/full-solve/nhm2-in-hull-proper-acceleration-latest.json`

Status:

- `bounded_partial_answer`

Claim boundary:

- The route-time layer is a bounded progression surface, not a full acceleration-history surface.
- The hull result is an interior proper-acceleration profile, not a route-dynamic comfort model.
- No comfort or safety certification is implied.

### 4. Relativistic vs non-relativistic comparison

Current answer:

- The repo now gives a certified bounded paired comparison on the same target-distance basis used by the bounded mission estimator.
- The current certified comparator is `classical_no_time_dilation_reference`.
- The present certified result is an honest zero-differential case:
  - `warpCoordinateYears = 4.3652231448899625`
  - `warpProperYears = 4.3652231448899625`
  - `classicalReferenceYears = 4.3652231448899625`
  - `properMinusCoordinateSeconds = 0`
  - `properMinusClassicalSeconds = 0`

Supporting evidence:

- `artifacts/research/full-solve/nhm2-mission-time-comparison-latest.json`
- `docs/audits/research/warp-nhm2-mission-time-comparison-latest.md`

Status:

- `certified_bounded_answer`

Claim boundary:

- The current certified comparison is target-coupled and assumption-bearing.
- It is not a speed-based SR/NR comparison.
- A zero differential is a real certified result on the current basis and must not be spun into a hidden warp-advantage claim.

### 5. Alpha Centauri mission time

Current answer:

- The repo now gives a certified bounded target-coupled mission-time estimator for `alpha-cen-a`.
- The current certified bounded estimate is:
  - coordinate time: `137755965.9171795 s` = `4.3652231448899625 yr`
  - ship proper time: `137755965.9171795 s` = `4.3652231448899625 yr`

Supporting evidence:

- `artifacts/research/full-solve/nhm2-mission-time-estimator-latest.json`
- `docs/audits/research/warp-nhm2-mission-time-estimator-latest.md`

Status:

- `certified_bounded_estimator`

Claim boundary:

- This is a bounded mission estimator, not a full route dynamic.
- It is target-coupled and assumption-bearing.
- It is not an unconstrained ETA surface for arbitrary targets.
- Route-map ETA remains deferred.

## Certified Bounded Answers

The repo now has certified bounded answers for:

- bounded local-comoving transport/worldline semantics
- bounded route-time transport progression in a fixed chart
- bounded target-coupled mission-time estimation
- bounded relativistic-vs-classical no-time-dilation comparison
- bounded cruise-envelope semantics on a fixed descriptor basis
- bounded in-hull experienced proper acceleration
- deterministic publication/provenance for the full bounded latest stack

## Bounded Partial Answers

The repo still answers some mission questions only partially:

- Cruise is answered as a descriptor envelope, not as scalar max speed.
- Acceleration is answered as bounded local/route progression plus cabin proper-acceleration profile, not as a full route-dynamic history.
- Mission time is estimator-grade within its declared bounded regime, not a fully resolved route dynamic.

## Explicit Non-Answers And Deferred Claims

The current certified bounded stack does not answer or certify:

- scalar max-speed certification
- unconstrained ETA or route-map ETA
- full route-dynamic certification
- speed-based relativistic-vs-nonrelativistic comparison
- broad relativistic advantage
- curvature-gravity certification
- comfort/safety certification
- viability promotion

These are outside the present contract boundary even though the bounded answer chain is now substantially complete.

## Publication And Provenance Status

The bounded NHM2 stack is publication-hardened and repo-facing. The remaining question is not whether the publisher works; it is whether the current git state qualifies as fully clean-landed evidence.

- canonical refresh path: `npm run warp:full-solve:york-control-family:publish-bounded-stack-latest`
- publication mode: `bounded_stack_latest_sequential_single_writer`
- tracked repo evidence status: `repo_tracked_latest_evidence`
- proof-surface manifest is the canonical checksum and path registry for the bounded latest stack
- proof-pack latest remains the top-level summary surface

Current audit conclusion:

- the previous "local-only latest evidence" gap is materially cleared for the bounded NHM2 proof surfaces because the bounded `latest` evidence is now git-tracked and checksum-registered
- the current emitted evidence state is exact: tracked, but not claimed as `repo_landed_clean_latest_evidence` while the critical bounded-stack set still has git delta
- publication/provenance can be treated as fully closed only when the emitted status advances to `repo_landed_clean_latest_evidence`
- the remaining gaps are no longer publisher-mechanics gaps
- the remaining gaps are claim-boundary gaps that would require new certified contracts, not merely cleaner publishing

## Remaining Gaps

The meaningful remaining gaps after this audit are:

- a stronger speed-semantics layer if the repo later wants to ask scalar or speed-adjacent cruise questions more directly
- a speed-based relativistic/nonrelativistic comparison layer if it can be derived without proxy leakage
- a full route-dynamic or ETA contract if the repo later wants catalog-facing route answers
- a separate curvature-gravity interpretation layer if that question must be answered distinctly from experienced proper acceleration
- a separate comfort/safety interpretation layer if human-factors claims are later required

None of those gaps should be smuggled into the current bounded contracts.

## Recommended Next Research

The repo does not need another foundational bounded-stack surface before it can describe its current NHM2 status honestly. The next justified step is a focused follow-on only if a new question is genuinely required:

- speed-semantics upgrade, if scalar or speed-adjacent cruise claims are needed
- stronger comparison upgrade, if speed-based relativistic/nonrelativistic comparison is needed
- route-dynamic / ETA contract, if catalog-facing travel answers are needed
- curvature or comfort interpretation layers, if those questions must be answered separately from the current bounded observer-defined proper-acceleration result

## Bottom Line

NHM2 now has a coherent bounded answer stack and a hardened repo-facing publication model.

- The repo can answer the hull-"gravity" question only as observer-defined experienced proper acceleration.
- The repo can answer the cruise question only as a bounded descriptor envelope.
- The repo can answer the Alpha Centauri question only as a bounded estimator.
- The repo can answer the relativistic-vs-nonrelativistic question only on the current bounded comparison basis, which presently yields a certified zero differential.

That is enough to support a final bounded-stack status decision memo.

It is not enough to claim scalar max speed, curvature gravity, comfort/safety, unconstrained ETA, full route dynamics, or viability.
