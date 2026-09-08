# Independent current and four-quark comparison

Exploratory snapshot, September 7, 2026. Previous turn established independent qu overlap. This packet finds current overlap and an unresolved four-quark difference. It does not update candidate parameters or physical predictions.

## Findings

The up-aligned phiq1, phiq3 and phiq1-minus-phiq3 probes agree with the independent matching expression at 80.379, 173 and 300 GeV. Maximum relative complex-coefficient difference is **1.63e-10**. This supports the current matching on these probes, where the Pt-Pu anticommutator vanishes; it does not test its general-flavor S0 contribution.

The qq probes **do not agree**. At mu=173 GeV, with a symmetric mixed up/top tensor of amplitude 1e-6 GeV^-2, the imaginary loop Hamiltonian coefficients are:

| Probe | Selected top expression, GeV^-2 | Broader library expression, GeV^-2 |
|---|---:|---:|
| qq1 mixed | -2.176164273e-15 | 3.570161134e-13 |
| qq3 mixed | 5.766400694e-14 | 7.408781798e-13 |
| Sum | 5.548784266e-14 | 1.097894293e-12 |

These are algebraic probes, not the model's evolved coefficients. Large relative differences against a small selected expression must not be quoted as a percentage correction to the candidate or to epsilon_K.

Setting alpha_s=0 in the library leaves the mixed-probe results unchanged to numerical precision. Therefore an omitted QCD contribution alone cannot explain this comparison. A pure-up qq1 probe also gives a nonzero real library term while the selected top projection is numerically zero. Its imaginary contribution is zero. The broader calculation includes terms outside the selected top approximation; the result does not yet identify which terms account for the differences or prove that either formula is wrong.

## Reproducibility

The [script](casimir-dp-axion-current-qq-independent-overlap-2026-09-07.py) SHA-authenticates the preceding extraction/convention definitions. Both sides use mt=173 GeV, the same v and MW, the same CKM matrix, SM subtraction, full four-index rotation and H=-L. For each qq mixed probe, C_1133=C_3311=amplitude/2 in the up basis. The candidate boundary is untouched.

The selected expression follows [Endo, Kitahara and Ueda, Eq. 2.24](https://arxiv.org/pdf/1811.04961), including the previously derived top-projector completion. The independent library implements the more general [Dekens–Stoffer matching](https://arxiv.org/abs/1908.05295). Their operator, finite-scheme and approximation scopes must be aligned before interpreting a mismatch as an error.

The [JSON](casimir-dp-axion-current-qq-independent-overlap-2026-09-07.json) preserves all 21 rows plus alpha_s=0 diagnostics. Current overlap and linear addition of the library's two mixed qq probes pass. **No qq-overlap pass is claimed.** The root-leaf documentation check passes separately.

## Decision and next work

The previous qq packet remains a selected diagnostic, with independent agreement unresolved. Do not promote its small finite shift to a validated complete matching correction. Decompose the library's qq response into its electroweak and top-dependent pieces, comparing scale derivatives as well as finite terms, and audit finite operator conventions. This takes priority over assembling a kaon bound from the partial coefficient. The independent qu/current overlap narrows the problem but does not close it.

No revised xenon/coherence spectrum, allowed region or model admission follows. The shared-scattering goal remains active.
