# Triplet remainder: flavor-span test

Exploratory snapshot, September 7, 2026. Previous turn proved the mixed two-flavor identity. This packet tests its extension and records both a failed unrestricted guess and a successful restricted-family reconstruction. Frozen model and apparatus inputs remain unchanged.

## Tested family

In the up basis, T=diag(0,0,1) projects onto top. Consider

`Cqq3 = amplitude (H tensor T + T tensor H)/2`,

with H an arbitrary Hermitian 3x3 matrix. This is a structured family of four-index coefficients, not the complete qq3 tensor space. The numerical probe uses amplitude=1e-6 GeV^-2, mt=173 GeV and the same authenticated CKM rotation as previous comparisons.

The naive extension of the previous remainder replaces Pu with Hdown=V-dagger H V. It passes the four independent Hermitian light-block basis elements, with maximum relative error **3.09e-13**, but fails outside that block. Relative to that guess, top-light off-diagonal basis elements yield a factor 1/4, while the top-only element yields zero.

## Reconstructed family rule

Those basis responses suggest the linear map

`F(H) = Q H Q + (Q H T + T H Q)/4`, with Q=1-T.

For this family, the numerically tested remainder is

`delta H_sd = pref amplitude Pt_sd [V-dagger F(H) V]_sd 2x ln(x)/(x-1)`.

This is a reconstruction of an algebraic matching response, not a fit of dark-matter couplings to experimental data. It passes the full nine-element Hermitian basis and three independently generated Hermitian combinations (fixed seeds 7, 19 and 41), each at scales 80.379, 173 and 300 GeV. Maximum scaled complex residual is **3.75e-13**. The denominator is the largest magnitude of the naive hypothesis, library response and mapped prediction, with a 1e-25 floor; this avoids presenting a relative error against the zero top-only prediction.

The matrix expression transforms consistently when H and the top projector are transformed together. Numerical coverage of this family does not establish an arbitrary four-index formula or a symbolic proof for all H. The earlier exact symbolic identity covers the simpler mixed probe only.

## Reproducibility and decision

The [script](casimir-dp-axion-triplet-flavor-span-2026-09-07.py) authenticates the prior extraction chain. It uses the same 104 explicit-mt library terms and compares against the selected J/K expression. [JSON](casimir-dp-axion-triplet-flavor-span-2026-09-07.json) preserves the failed naive predictions as well as the successful mapped predictions, so the rejected extension is auditable. Both declared checks pass; the root-leaf documentation check passes separately. No installed or archived source is changed.

The underlying matching sources are [Endo, Kitahara and Ueda](https://arxiv.org/pdf/1811.04961) and [Dekens and Stoffer](https://arxiv.org/abs/1908.05295), through the authenticated implementation. This packet's map is our diagnostic reconstruction, not a formula attributed to either source. The explicit-mt partition is still algebraic and omits the library's remaining terms.

Next determine whether the evolved candidate qq3 tensor lies in this tested family, and quantify its residual outside the family before applying any correction. If it does not, evaluate the full matching response or derive the missing tensor structures. Do not apply F to an arbitrary tensor by an unspecified projection.

No kaon bound, xenon spectrum, local-coherence prediction or model-admission status changes. The shared-scattering goal remains active.
