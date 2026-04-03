# Relativistic Map Projection Brief

- date: 2026-04-02
- status: diagnostic
- owner: codex

## Scope

This patch adds two relativistic map projections to the TREE+DAG and Helix route surfaces:

- an instantaneous comoving ship-view map
- a Sun-centered accessibility map

It now also introduces a bounded NHM2 `warpWorldline` contract that can unlock one solve-backed warp-derived projection mode:

- a certified local-comoving projection from a bounded NHM2 centerline-plus-shell-cross sample family

## Boundary

These are projection products, not warp-field products.

- The instantaneous ship-view map is a `ship_comoving` projection under a declared control law.
- The Sun-centered accessibility map is `outer_reference_only`.
- Neither projection is a Lane A proof surface.
- Neither projection implies ADM equivalence, metric equivalence, or bubble-geometry identity.
- The new NHM2 `warpWorldline` contract is a bounded solve-backed transport contract only.
- It is not mission-time certified, not max-speed certified, and not a viability upgrade by itself.
- The repo now separately publishes a bounded NHM2 in-hull proper-acceleration surface for Eulerian cabin observers.
- That in-hull surface is observer-defined experienced acceleration only; it is not a projection product, not curvature gravity certification, and not a comfort/safety certification.

## Control Model In This Patch

The implemented control model is flat special relativity with a declared constant proper-acceleration flip-burn profile.

- Radius remapping uses onboard proper time under that control law.
- Instantaneous ship-view remapping contracts only the component parallel to motion.

For warp-derived transport, the repo now accepts only a certified NHM2-local `warpWorldline` emitted by the authoritative solve producer.

- Current bounded regime: a provenance-hardened centerline-plus-shell-cross sample family in the `comoving_cartesian` chart.
- The earlier centerline-only triplet was structurally valid but numerically flat because it sampled the interior tilt-dominated region.
- The current shell-cross family reveals bounded solve-backed local shift variation in the neighborhood of the hull wall while staying local-comoving and non-route-time.
- Coordinate velocity remains fixed to zero by chart choice; transport is represented only through a solve-backed local shift descriptor, not a certified ship speed.
- In the current bounded low-g regime, `dtau_dt` may remain nearly flat even when the local shift descriptor varies; that is informative for bounded transport differentiation only.
- The repo now also publishes a bounded cruise-envelope preflight over that same shell-cross contract using the fixed-chart descriptor norm `||beta_eff||` as a local transport descriptor support quantity.
- That preflight surface reports admissible bounded local descriptor support and explicit above-support rejection, but it is still not a speed certificate or mission-time estimator by itself.
- The repo now publishes a bounded route-time worldline extension derived from the certified local-comoving worldline plus the certified cruise-preflight contract.
- That route-time layer freezes `lambda` as a normalized bounded longitudinal probe-progress parameter in the fixed `comoving_cartesian` chart and uses the local shell-aft to shell-fore light-crossing horizon as its coordinate-time schedule.
- The new route-time contract is transport-capable but still local and bounded: it is not target-coupled, not a route ETA, not mission time, and not a ship-speed certificate.
- The repo now also publishes a bounded mission-time estimator that consumes the certified local-comoving worldline, cruise-preflight contract, bounded route-time worldline, and a deterministic committed local-rest target-distance contract for `alpha-cen-a` and `proxima`.
- That estimator reports coordinate time and ship proper time separately for a target-coupled but assumption-bearing repeated-local-probe schedule. It is still not a max-speed certificate, not a viability upgrade, and not an unconstrained catalog ETA surface.
- The repo now also publishes a bounded mission-time comparison layer on the same target-distance basis. Its current certified comparator is only `classical_no_time_dilation_reference`, meaning the same target-coupled estimator basis with `tau=t`; stronger speed-based nonrelativistic or SR comparators remain explicitly deferred.
- In the current bounded regime, the certified comparison can honestly report a zero differential. That is a real result, not an omission, and it must not be translated into a broad warp-advantage or ETA claim.
- The repo now also publishes a certified bounded cruise-envelope layer on top of the preflight, route-time, mission-time, and comparison chain.
- That envelope stays on the fixed-chart descriptor quantity `bounded_local_transport_descriptor_norm = ||beta_eff||`. It is strengthened by route-time and target-coupled mission consistency, not by a new speed mapping.
- In the current solve family, the certified cruise-envelope band may numerically match the preflight extrema because the certified longitudinal route-time samples already realize the full observed descriptor support. That is still stronger than preflight because it is consistency-qualified by the later certified transport surfaces.
- The new cruise envelope is therefore a chart-fixed bounded cruise-control descriptor envelope only. It is not an unconstrained max-speed certificate, not a route-map ETA contract, and not a viability upgrade.
- Current enabled warp projection mode: `warp_worldline_local_comoving` for `instantaneous_ship_view`.
- Current deferred warp projection mode: `warp_worldline_route_time`.
- If `warpWorldline`, the bounded route-time contract, or the bounded mission-time estimator is absent, uncertified, or outside the declared validity regime, warp-derived route-time projections remain unavailable.
- The bounded NHM2 stack is now publication-hardened: authoritative latest evidence is emitted through a deterministic single-writer bounded-stack publisher plus a proof-surface manifest.
- The manifest evidence-state is now exact rather than optimistic:
  - `repo_trackable_latest_evidence` means unignored but not fully git-tracked
  - `repo_tracked_latest_evidence` means git-tracked but not yet clean-landed for the critical bounded-stack set
  - `repo_landed_clean_latest_evidence` is reserved for the clean landed state with no bounded-stack git delta
- Current bounded-stack latest evidence is repo-facing and git-tracked, but closure wording must follow the emitted evidence-state rather than assuming the strongest clean-landed state.

## Deferred Work

A true catalog-facing warp-derived accessibility map remains deferred.

That future branch must be computed from an explicit route-map ETA contract on top of the new bounded mission-time estimator, not from the flat-SR proxy and not by silently promoting estimator outputs into map answers. Until then, any route-time warp map must fail closed as unavailable.

The repo has now moved from bounded mission-time comparison into a stronger bounded cruise-envelope layer, and the bounded NHM2 proof surfaces are publication-hardened as deterministic repo-facing `latest` evidence. The final bounded-stack decision memo now lives in `docs/research/nhm2-certification-path-research-audit-2026-04-02.md`, and its publication/provenance closure language is justified only when the emitted evidence-state itself reaches the strongest clean-landed state. Any later work should start from that audit rather than from publication cleanup. Route-map ETA, speed-based relativistic-advantage certification, unconstrained speed certification, and viability promotion remain unavailable until downstream contracts exist and are separately certified.

## Publication

- worldline publication command: `npm run warp:full-solve:york-control-family:publish-worldline-latest`
- cruise-preflight publication command: `npm run warp:full-solve:york-control-family:publish-cruise-preflight-latest`
- route-time publication command: `npm run warp:full-solve:york-control-family:publish-route-time-latest`
- mission-time publication command: `npm run warp:full-solve:york-control-family:publish-mission-time-latest`
- mission-time comparison publication command: `npm run warp:full-solve:york-control-family:publish-mission-time-comparison-latest`
- cruise-envelope publication command: `npm run warp:full-solve:york-control-family:publish-cruise-envelope-latest`
- in-hull proper-acceleration publication command: `npm run warp:full-solve:york-control-family:publish-in-hull-proper-acceleration-latest`
- proof-surface manifest publication command: `npm run warp:full-solve:york-control-family:publish-proof-surface-manifest-latest`
- recommended audit-ready publication command: `npm run warp:full-solve:york-control-family:publish-bounded-stack-latest`
- emitted artifact: `artifacts/research/full-solve/nhm2-warp-worldline-proof-latest.json`
- emitted audit: `docs/audits/research/warp-nhm2-warp-worldline-proof-latest.md`
- emitted preflight artifact: `artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json`
- emitted preflight audit: `docs/audits/research/warp-nhm2-cruise-envelope-preflight-latest.md`
- emitted route-time artifact: `artifacts/research/full-solve/nhm2-route-time-worldline-latest.json`
- emitted route-time audit: `docs/audits/research/warp-nhm2-route-time-worldline-latest.md`
- emitted mission-time artifact: `artifacts/research/full-solve/nhm2-mission-time-estimator-latest.json`
- emitted mission-time audit: `docs/audits/research/warp-nhm2-mission-time-estimator-latest.md`
- emitted mission-time comparison artifact: `artifacts/research/full-solve/nhm2-mission-time-comparison-latest.json`
- emitted mission-time comparison audit: `docs/audits/research/warp-nhm2-mission-time-comparison-latest.md`
- emitted cruise-envelope artifact: `artifacts/research/full-solve/nhm2-cruise-envelope-latest.json`
- emitted cruise-envelope audit: `docs/audits/research/warp-nhm2-cruise-envelope-latest.md`
- emitted in-hull proper-acceleration artifact: `artifacts/research/full-solve/nhm2-in-hull-proper-acceleration-latest.json`
- emitted in-hull proper-acceleration audit: `docs/audits/research/warp-nhm2-in-hull-proper-acceleration-latest.md`
- emitted proof-surface manifest artifact: `artifacts/research/full-solve/nhm2-proof-surface-manifest-latest.json`
- emitted proof-surface manifest audit: `docs/audits/research/warp-nhm2-proof-surface-manifest-latest.md`
- proof status: bounded solve-backed transport contract only; Lane A authority and NHM2 classification remain unchanged
