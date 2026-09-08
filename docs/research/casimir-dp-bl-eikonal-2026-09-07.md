# B-L sphere: phase-resummed coherence forecast

Date: 2026-09-07. Exploratory conditional calculation; no allowed shared model or detection claim.

The 0.01 eV light-mediator candidate survives the first correction to its invalid macroscopic Born approximation with a potentially substantial local forecast. The 1 eV candidate is considerably suppressed. Neither result establishes experimental measurability or compatibility with external constraints.

## Frozen model and calculation

Use the inputs and raw xenon normalization in `casimir-dp-bl-two-mediator-screen-2026-09-07.json`, and the apparatus and charge in `casimir-dp-bl-sphere-born-2026-09-07.json`. The 100 GeV incident particle has speed 776 km/s and number density 0.003/cm3. The neutral, uniform carbon sphere has B-L charge 9.3117510038e10, radius 276.302362 nm, branch separation 250 nm and constant hold time 0.25 s. These assumptions do not authenticate the local incident population.

For the straight-line phase chi(b), the elastic decoherence cross section is

`sigma_dec(d_perp) = integral d^2b [1 - cos(chi(b) - chi(b + d_perp))]`.

Average over isotropic incident directions with `d_perp = d sqrt(1-mu^2)`; multiply by incident flux and hold time to obtain exponent D, with contrast multiplier exp(-D). The phase integrates the Yukawa potential over the projected uniform sphere. A split radial integral uses modified Bessel I0 and K0 inside the sphere; the exterior phase is proportional to K0. The 1 GeV mediator's tiny macroscopic phase is omitted. This is an eikonal calculation, not an exact partial-wave solution.

## Results

| Light mediator | Formal Born D | Eikonal D | Predicted contrast loss 1-exp(-D) |
|---|---:|---:|---:|
| 0.01 eV | 0.5978081 | 0.1851033 | about 16.90% |
| 1 eV | 0.02683638 | 0.001027910 | about 0.103% |

Both retain the prior raw low/high xenon recoil ratio of about 131.87 and normalization to one raw high-window event. That normalization is not an accepted-event fit. The frozen DP exponent 0.02951146 is a theoretical comparator, not measured excess decoherence or an established detection threshold.

The independent momentum-space Born integral is recovered by replacing the cosine integrand with half the squared phase difference: relative discrepancies are 1.29e-7 and 1.94e-9. Combined impact-radius, angular and tail refinement changes the full results by 8.31e-6 and 1.33e-6 respectively. These are numerical checks, not total physical uncertainty. The phase interpolation grid is shared across these refinement runs.

## Interpretation and next gate

The lightest candidate remains worth testing against independent constraints. Its nonzero neutral-atom B-L charge is the reason the earlier electric-charge cancellation does not eliminate this forecast. This does not identify the interaction as gravity, a Higgs interaction, or Diosi-Penrose collapse.

Required next work: split the effective products into consistent dark and ordinary-matter couplings; apply mediator-range-dependent fifth-force and particle constraints; then calculate transport and a detector-level xenon comparison. A viable split is necessary before calling this a candidate allowed model. Also assess straight-line eikonal accuracy, phase-grid convergence, omitted heavy phase, finite material structure and actual branch histories. A homogeneous local signal need not produce a nonzero boundary cross-ratio.

Reproduce with `C:\Python313\python.exe docs/research/casimir-dp-bl-eikonal-2026-09-07.py`. Machine-readable results are in the matching JSON. The script checks quadratic-limit recovery, refinement and full-phase suppression relative to its quadratic limit. No GR, runtime, certificate or physical-maturity authority is changed.
