# Needle Hull / NHM2 / Warp Solve Weekly Report | 2026-06-28

## Opening Bell
This week in the Needle Hull lane felt less like a new leap in geometry and more like the patient laying out of lab benches, checklists, and red tags. The repo kept last week's lower-alpha NHM2 diagnostic campaign pass in view, but most new movement did not try to stretch that pass into transport truth. Instead it asked a harder practical question: if a source-side story is ever going to matter, what exact receipts, test plans, operating budgets, and full-apparatus tensor artifacts would have to exist first? The answer arrived as a dense bundle of contracts and tests. Quietly, that is progress. It is the kind that narrows ambiguity before it narrows physics.

## Baseline
For a first-time reader, this lane is CasimirBot's attempt to make speculative warp geometry legible as same-chart modeling, source accounting, solver diagnostics, and claim-bounded review. The standing baseline in `docs/nhm2-closed-loop.md` and `docs/research/nhm2-current-status-whitepaper-2026-05-02.md` still treats NHM2 as a lapse-extended Natario-style diagnostic or reduced-order candidate lane, not a certified transport result. `WARP_AGENTS.md` remains the hard boundary: no physical-viability language without hard-constraint passage and admissibility under policy.

## What changed this week
Most of the lane activity concentrated on the source-side evidence stack. The June 21-22 commits added and then refined contracts such as `shared/contracts/nhm2-tile-source-material-evidence-receipts.v1.ts`, `shared/contracts/nhm2-tile-source-physical-validation-plan.v1.ts`, `shared/contracts/nhm2-tile-source-experimental-campaign-package.v1.ts`, and the family of operating-budget and test-plan artifacts for coupon stress, force-gap pull-in, roughness and patch potentials, active control, fatigue/layer scaling, and full-apparatus tensor coverage. The effect is not a new physical source. It is a stricter definition of what would count as one, down to sample counts, provenance refs, no-metric-echo requirements, and explicit blockers when a candidate is only scalar, grouped, sparse, or unbacked.

The second movement was campaign wiring. `shared/contracts/nhm2-campaign-profile-run-manifest.v1.ts` now spells out the evidence that must be present before a screened profile can even be queued for a frozen run, and `tools/nhm2/build-candidate-profile-campaign-run.ts` assembles a full artifact chain around that rule. It writes layer-stack receipts, source authority handoff artifacts, momentum and shear audits, switching conservation, frequency convergence, dynamic/effective geometry evidence, observer checks, stability evidence, and finally `nhm2_time_dependent_source_campaign/v1`. The repo is trying to make a candidate profile earn its way through governed receipts instead of slipping from search result to meaningful status.

There was also a smaller but telling follow-on pass on June 23. Commit `faf85f757` refined `shared/contracts/nhm2-time-dependent-source-campaign.v1.ts` and its tests so the dynamic campaign remains fail-closed unless explicit switching, frequency, geometry, tensor, observer, QEI, and stability evidence are all present together. The tests say this directly: static source, tensor, QEI, and observer evidence alone must not pass the dynamic campaign.

## What it is trying to do
This week's code is trying to turn the new diagnostic campaign frontier into a disciplined physical-evidence waiting room. The repo now separates three things more clearly: a profile that looks interesting, a diagnostic campaign that passes under bounded artifact rules, and the much harder experimental bundle that would be needed before source-side or transport-adjacent language could strengthen.

## Why this matters for the larger picture
The broader project cannot afford to confuse a clean dashboard with a real source model. By forcing NHM2 through receipts, operating budgets, full-apparatus tensor coverage, and falsification maps, the repo is learning where the source story is thin before it claims that geometry and matter agree. That is useful even when the answer is "not yet." It keeps the modeling frontier honest enough to teach something.

## Horizon note
The frontier begins with learning which constraints hold fast and which variables still invite careful exploration. This week widened that frontier on the experimental side: not by promising a craft, but by naming the measurements, tensors, and null tests that would have to stand still under scrutiny before imagination earns another step.

## Gate to watch
The next validation step is whether the new tile-source receipt bundle can be tied to one pinned frozen campaign run with full-apparatus tensor provenance, adequate sample support, and reproducible no-metric-echo authority rather than remaining a well-typed planning surface.

## Evidence trail
- commit `b293cb1d3` on 2026-06-21: `Add NHM2 viability campaign contracts`
- commit `c7c001b69` on 2026-06-22: `Add NHM2 tile source validation plans`
- commit `038b24afe` on 2026-06-22: `Add NHM2 tile source operating budgets`
- commit `e62df9dde` on 2026-06-22: `Add NHM2 experimental campaign package`
- commit `faf85f757` on 2026-06-23: `Refine NHM2 time dependent evidence`
- `shared/contracts/nhm2-tile-source-material-evidence-receipts.v1.ts`
- `shared/contracts/nhm2-campaign-profile-run-manifest.v1.ts`
- `tools/nhm2/build-candidate-profile-campaign-run.ts`
- `tests/nhm2-tile-source-material-evidence-receipts.spec.ts`
- `tests/nhm2-time-dependent-source-campaign.spec.ts`

## Quiet Ledger
This week did not claim a new admissible profile beyond the already-established June 19 diagnostic campaign frontier, and it did not claim physical viability, source realization, transport validation, route ETA, or speed authority. What remains unresolved is whether the new source-side evidence machinery can be backed by pinned, reproducible, experimentally credible receipts instead of increasingly precise placeholders.

## Closing Path Note
There is a steady kind of rigor in work that chooses sharper blockers over louder conclusions. NHM2 now has a fuller experimental campaign grammar: receipts, budgets, falsifiers, handoffs, run manifests, and dynamic gates that refuse to pass on partial evidence. None of that solves the hard source problem. It does something more foundational first. It teaches the lane to distinguish a modeled tensor from a realized one, a campaign pass from a physical pass, and a promising row from a trusted result. For this project, that honesty is not a delay. It is the path.
