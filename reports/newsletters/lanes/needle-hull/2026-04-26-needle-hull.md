# Needle Hull / NHM2 / Warp Solve Weekly Report | 2026-04-26

## Opening Bell
This week the Needle Hull / NHM2 lane felt like a workshop rearranging its benches before lifting a heavier part. The repo did add fresh transport-side evidence, but the deeper story is about alignment: which shift+lapse profile the lane is really publishing, which observer route is being trusted, and which render layers are presentation rather than proof. The code and docs kept repeating a useful refrain. Bounded outputs are allowed to be useful without being overread. Scientific pictures are allowed to be vivid without pretending to settle the field equations. That restraint gives the week's optimism its footing.

## Baseline
For a first-time reader, this lane is the repo's attempt to turn a Natario-style zero-expansion transport core into an NHM2 shift+lapse research program with explicit profiles, observer audits, mission-time products, and promotion gates. The standing baseline in `docs/nhm2-closed-loop.md` is still conservative: `modules/warp/natario-warp.ts` is a reduced-order geometry and source proxy surface, while stronger claims stay blocked until source closure, certificate logic, and integrity checks line up.

## What changed this week
The clearest movement came from the selected-family transport stack. `docs/audits/research/selected-family/nhm2-shift-lapse/boundary-sweep/warp-nhm2-shift-lapse-boundary-sweep-latest.md` says the stronger-side sweep never found a first failure inside the tested bracket, with every sampled `stage1_centerline_alpha_*` profile from `0.9875` down through `0.7300` remaining gate-admitted and the bounded timing differential scaling monotonically. The companion envelope suite at `docs/audits/research/warp-nhm2-envelope-perturbation-suite-latest.md` records 114 pass cases across resolution, boundary conditions, local profile perturbations, and the stronger-boundary bracket, while still marking the whole surface as envelope evidence rather than a viability claim.

At the same time, the lane's selected-family latest artifacts now point to a stronger published profile than last week's narrative baseline. `docs/audits/research/selected-family/nhm2-shift-lapse/warp-nhm2-cruise-envelope-preflight-latest.md`, `warp-nhm2-mission-time-estimator-latest.md`, and `warp-nhm2-shift-vs-lapse-decomposition-latest.md` all name `stage1_centerline_alpha_0p7000_v1`, with the decomposition reporting `137755965.9171795 s` coordinate time, `96429176.14202563 s` proper time, and a nearly fully tracked lapse contribution. But the root full-loop summary in `docs/audits/research/warp-nhm2-full-loop-audit-latest.md` still names `stage1_centerline_alpha_0p995_v1` and stays in `review` with `blockingReasons = insufficient_provenance, policy_review_required`, explicitly citing profile mismatches between `0p7000` and `0p995`. So the repo advanced the selected-family publication lane, but it has not yet reconciled its top-level ledger.

The other major thread was presentation discipline. `scripts/warp-york-control-family-proof-pack.ts` grew new render and audit outputs that surface NHM2 curvature invariants and render classes, while `docs/audits/research/warp-york-control-family-proof-pack-latest.md`, `docs/audits/research/warp-nhm2-curvature-invariant-visualization-latest.md`, and `docs/audits/research/warp-render-taxonomy-latest.md` keep repeating the same boundary: `diagnostic_lane_a` is authoritative, while `scientific_3p1_field`, overlays, comparison panels, and Rodal-inspired invariant views are solve-backed but secondary. The new citation checklists in `docs/research/nhm2-ricci4-natario-citation-checklist.v1.json` and `docs/research/nhm2-spacetime-grid-overlay-citation-checklist.v1.json`, backed by `scripts/lib/research-citation-gate.ts`, show the repo trying to make even visual claims carry provenance and scope labels.

## What it is trying to do
This week's work is trying to make NHM2 legible as a stack of distinct products: bounded transport artifacts, observer-route admission, profile-specific timing outputs, and secondary scientific renders with explicit non-claim language. The aim is not to announce a solved warp configuration. The aim is to keep the lane reproducible enough that when a result changes, the repo can say whether it was a profile shift, a provenance mismatch, a route-admission decision, or only a visualization upgrade.

## Why this matters for the larger picture
That separation matters because the larger project is trying to turn speculative geometry into audited modeling rather than a blur of dashboards. A wider admitted bracket means something. A full-loop provenance mismatch also means something. A good taxonomy for renders means something else again. When those meanings stay distinct, the project gains credibility even before it gains closure.

## Horizon note
The frontier begins with learning which constraints hold fast and which variables still invite careful exploration. This week widened the explored shift+lapse bracket and improved the map around it, while also showing that better maps do not erase unresolved provenance or policy gates.

## Gate to watch
The next validation step is to rebuild the root NHM2 full-loop package from the same selected-family profile now used by the latest preflight, mission-time, and decomposition artifacts, then check whether the remaining `review` status is truly just provenance and policy rather than a deeper inconsistency.

## Evidence trail
- `docs/nhm2-closed-loop.md`
- `docs/research/nhm2-full-solve-overview-v2-2026-04-23.md`
- `docs/audits/research/warp-nhm2-full-loop-audit-latest.md`
- `docs/audits/research/selected-family/nhm2-shift-lapse/boundary-sweep/warp-nhm2-shift-lapse-boundary-sweep-latest.md`
- `docs/audits/research/warp-nhm2-envelope-perturbation-suite-latest.md`
- `docs/audits/research/selected-family/nhm2-shift-lapse/warp-nhm2-mission-time-estimator-latest.md`
- `docs/audits/research/selected-family/nhm2-shift-lapse/warp-nhm2-cruise-envelope-preflight-latest.md`
- `docs/audits/research/warp-york-control-family-proof-pack-latest.md`, `docs/audits/research/warp-nhm2-curvature-invariant-visualization-latest.md`, and `docs/audits/research/warp-render-taxonomy-latest.md`
- `modules/warp/natario-warp.ts`, `shared/contracts/nhm2-full-loop-audit.v1.ts`, `tests/nhm2-full-loop-audit-contract.spec.ts`, `tests/warp-york-control-family-proof-pack.spec.ts`
- `scripts/lib/research-citation-gate.ts`, `docs/research/nhm2-ricci4-natario-citation-checklist.v1.json`, and `docs/research/nhm2-spacetime-grid-overlay-citation-checklist.v1.json`

## Quiet Ledger
This week did not claim physical viability, route-speed proof, field-equation closure, or authoritative status for the new curvature and overlay renders. The repo still says those visuals are secondary, the top-level full-loop audit is still under `review`, and the stronger selected-family publication path still needs provenance reconciliation before its confidence can travel upward.

## Closing Path Note
There is real progress here, but it is the kind that earns trust by keeping its shoes on. The lane widened its bounded shift+lapse bracket, published a stronger selected-family timing stack, and improved the labels around what counts as proof, presentation, and policy. Just as important, it left the unresolved mismatch visible at the top level. That is a healthy habit for this kind of work. The geometry is still speculative, the bookkeeping is getting better, and the better bookkeeping is part of how careful exploration becomes durable.
