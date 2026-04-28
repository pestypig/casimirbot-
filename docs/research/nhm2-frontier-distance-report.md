# NHM2 Frontier Distance From 0p995

- status: generator-backed report placeholder
- source generator: `scripts/research/run-nhm2-lapse-alpha-sweep.ts`
- frontier ledger: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/nhm2-frontier-distance-latest.json`

## Claim Boundary
The `stage1_centerline_alpha_0p995_v1` profile remains the confirmed full-pass anchor unless a newer full-loop artifact proves otherwise.

Lower-alpha rows are expected clocking targets until their own NHM2 full-loop artifacts pass.

The current strategy is to revalidate outward from `0p995`, locate the lowest full-pass alpha, then bisect toward `0p7000`.

## Research Context
- ADM / 3+1 lapse-shift formalism provides formalism context only: https://arxiv.org/abs/gr-qc/0405109 and https://arxiv.org/abs/gr-qc/0703035.
- Alcubierre and Natario provide warp metric context only: https://arxiv.org/abs/gr-qc/0009013 and https://arxiv.org/abs/gr-qc/0110086.
- Quantum inequality and energy-condition papers provide limitation and uncertainty language only: https://arxiv.org/abs/gr-qc/9702026 and https://arxiv.org/abs/2105.03079.
- NHM2 repository artifacts are required for project-specific pass, validated, frontier, and full-loop claims.

## Ladder Groups
- `confirmed_revalidation_ladder`: `0p995 -> 0p7300`
- `frontier_bisection_ladder`: `0p7250 -> 0p7000`
- `deep_exploratory_ladder`: `0p6500 -> 0p5000`

## Interpretation
- A row with `validationState=evidence_viable` has earned repository-measured evidence under the current full-loop gates.
- A row with `validationState=runtime_blocked` has not reached the evidence question yet.
- A row with `validationState=planned` or `skipped_after_blocker` remains an expected target only.
- Literature references constrain wording and uncertainty; they do not validate an NHM2 profile.

