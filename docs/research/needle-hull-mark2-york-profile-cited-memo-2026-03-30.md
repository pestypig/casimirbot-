# Needle Hull Mark 2 York-Profile Cited Memo

## Executive Summary

This memo records the current qualified York-time result for the Needle Hull Mark 2 solve and compares it to the two primary warp-family reference papers used by the repo's diagnostic framing:

- Miguel Alcubierre, *The Warp Drive: Hyper-fast Travel Within General Relativity*  
  https://arxiv.org/abs/gr-qc/0009013
- Jose Natario, *Warp Drive With Zero Expansion*  
  https://arxiv.org/abs/gr-qc/0110086

Under the repo's current qualified York diagnostic workflow, **Needle Hull Mark 2 is classified as `nhm2_low_expansion_family` with `status = congruent`, and the cross-lane result is `lane_stable_low_expansion_like`**. The strongest paper-level interpretation of that result is:

> Under the repo's supported York diagnostic lanes, the Needle Hull Mark 2 solve is much closer to the Natario low-/zero-expansion control than to the Alcubierre signed fore/aft expansion-contraction control.

This is a **diagnostic-local morphology result**, not a theory-identity or physical-feasibility claim.

## Repo Evidence Base

Primary local artifacts:

- `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- `artifacts/research/full-solve/warp-york-control-family-rodc-latest.json`
- `docs/audits/research/warp-york-control-family-proof-pack-latest.md`

Current qualified result from the machine-readable artifact:

- `family_label = nhm2_low_expansion_family`
- `status = congruent`
- `stability = stable`
- `cross_lane_status = lane_stable_low_expansion_like`

These are recorded in `artifacts/research/full-solve/warp-york-control-family-rodc-latest.json`.

The current proof-pack also records:

- Lane A ready for verdict
- Lane B observer defined
- Lane B semantics closed
- Lane B cross-lane claim ready
- all required views rendered
- snapshot identity complete
- diagnostic parity closed

Those readiness and parity results appear in `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`.

## What The Papers Contribute

### Alcubierre

Alcubierre's original warp-drive paper is the standard reference for the intuitive picture of **contraction ahead of the bubble and expansion behind it**. In the repo, that paper motivates the Alcubierre control as the reference for a **strong signed York lobe** under the declared York diagnostic lane.

Paper:

- https://arxiv.org/abs/gr-qc/0009013

Repo control interpretation:

- `docs/audits/research/warp-york-control-family-proof-pack-latest.md`
- control note: Alcubierre-like control is expected to show a strong signed fore/aft York morphology under the current lane

### Natario

Natario's paper is the direct paper-level basis for the repo's low-expansion reference family. The paper's central point is that warp-drive spacetimes can be constructed **without the expansion/contraction picture being present as a necessary feature**. In the repo, that makes Natario the natural control for a **low-expansion / zero-expansion York morphology**.

Paper:

- https://arxiv.org/abs/gr-qc/0110086

Repo control interpretation:

- `docs/audits/research/warp-york-control-family-proof-pack-latest.md`
- control note: Natario-like control is expected to show low-expansion York morphology under the current lane

## Direct Comparison To The Qualified NHM2 Result

The qualified proof-pack separates the controls numerically.

### Feature-level comparison

From `docs/audits/research/warp-york-control-family-proof-pack-latest.md`:

- `alcubierre_control`
  - `signed_lobe_summary = fore+/aft-`
  - x-z sign counts: `110 / 62`
- `natario_control`
  - `signed_lobe_summary = null`
  - x-z sign counts: `106 / 66`
- `nhm2_certified`
  - `signed_lobe_summary = null`
  - x-z sign counts: `106 / 66`

This is the first strong indicator that NHM2 is matching the Natario-side morphology rather than the Alcubierre-side morphology under the repo's York lane.

### Distance-to-reference comparison

From `docs/audits/research/warp-york-control-family-proof-pack-latest.md`:

- distance to Alcubierre reference: `0.13559288214795065`
- distance to low-expansion reference: `0.0012469161139296696`
- winning reference: `natario_control`
- reference margin: `0.134345966034021`
- margin sufficient: `true`

This is not a near tie. Under the repo's declared metric, NHM2 is overwhelmingly closer to the Natario-like control than to the Alcubierre-like control.

### Robustness comparison

From `docs/audits/research/warp-york-control-family-proof-pack-latest.md`:

- `baselineVerdict = nhm2_low_expansion_family`
- `stabilityStatus = stable_low_expansion_like`
- `dominantFraction = 1`
- `count_nhm2_low_expansion_family = 28`
- `count_nhm2_alcubierre_like_family = 0`
- `count_inconclusive = 0`

So the result is not only closer to Natario under one setting. It remains there across the contract's nearby perturbation sweep.

## Cross-Lane Result

The live artifact records:

- baseline lane: `lane_a_eulerian_comoving_theta_minus_trk`
- alternate lane: `lane_b_shift_drift_theta_plus_div_beta_over_alpha`
- `cross_lane_status = lane_stable_low_expansion_like`

This matters because the earlier repo work treated lane dependence as an open blocker. Under the current promoted workflow, the two supported lanes now agree on the same low-expansion family classification for NHM2.

That agreement is recorded in:

- `artifacts/research/full-solve/warp-york-control-family-rodc-latest.json`
- `docs/audits/research/warp-york-control-family-proof-pack-latest.md`

## What Is Established

The strongest justified statement from the current repo evidence is:

> Under the repo's supported York diagnostic lanes, Needle Hull Mark 2 exhibits a stable low-expansion York morphology that is much closer to the Natario control than to the Alcubierre signed-lobe control.

This statement is supported by:

- parity-closed render-to-solve congruence
- closed theta / `-K_trace` consistency
- certified lane identity
- deterministic reduced-order feature extraction
- margin-qualified control comparison
- robustness sweep stability
- promoted cross-lane agreement

## What Is Not Established

The current result does **not** establish any of the following:

- that Needle Hull Mark 2 *is* the Natario spacetime
- that the solution is physically feasible
- that the result is invariant under arbitrary observers or foliations
- that York morphology alone settles full theory identity

The repo's own artifacts explicitly keep this at the **diagnostic-local** level.

## Note On The G4 First-Divergence Result

The run also reports a first divergence at `S0_source` on `metricT00Si_Jm3` in:

- `artifacts/research/full-solve/g4-first-divergence-2026-03-30.json`

That source-path divergence is relevant for upstream full-solve/source reconciliation work, but it does **not** overturn the current York-profile conclusion, because the York proof-pack itself is parity-closed and cross-lane-qualified for the current diagnostic comparison.

## Bottom Line

For the purpose of York-time lobe-profile interpretation, the current already-qualified repo result is:

- **not Alcubierre-like**
- **strongly Natario-side / low-expansion-like**
- **stable under the repo's robustness sweep**
- **stable across the two supported diagnostic lanes**

That is the current working diagnostic conclusion for the Needle Hull Mark 2 solve.

## Sources

Primary papers:

1. Miguel Alcubierre, *The Warp Drive: Hyper-fast Travel Within General Relativity*  
   https://arxiv.org/abs/gr-qc/0009013
2. Jose Natario, *Warp Drive With Zero Expansion*  
   https://arxiv.org/abs/gr-qc/0110086
3. Eric Gourgoulhon, *3+1 Formalism and Bases of Numerical Relativity*  
   https://arxiv.org/abs/gr-qc/0703035

Primary repo artifacts:

1. `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
2. `artifacts/research/full-solve/warp-york-control-family-rodc-latest.json`
3. `docs/audits/research/warp-york-control-family-proof-pack-latest.md`
4. `artifacts/research/full-solve/g4-first-divergence-2026-03-30.json`
