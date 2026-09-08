# Exact mixed-triplet remainder identity

Exploratory snapshot, September 7, 2026. The previous turn identified the remainder numerically. This packet verifies an exact algebraic identity for a specified two-flavor mixed probe. No physical parameter, apparatus input or model-admission status changes.

## Result

For the symmetric mixed up/top triplet probe and the library's explicit-mt additive subset, the normalized expression satisfies

`H_library/(pref amplitude Pt_ij Pu_ij) = 8 J(x) + 4 K(x,mu) + 2 x ln(x)/(x-1)`.

Here pref=g2^2/(16 pi^2). The selected expression is 8J+4K. SymPy simplifies the difference from the displayed right-hand side to **exactly zero**, without fitting coefficients or sampling masses. This upgrades the previous mass-scan pattern to an exact identity for the stated algebraic probe.

## Exact contraction and normalization

The calculation uses an orthogonal two-flavor rotation embedded in three flavors. Its relevant columns are (1,0,1)/sqrt(2) and (1,0,-1)/sqrt(2), hence Pu_ij=1/2 and Pt_ij=-1/2. The four-index rotation weights are rational multiples of 1/4. Input Cqq3_1133=Cqq3_3311=1/2 represents unit probe amplitude. The selected top contraction is -Pu_ij and the external-leg contraction is 2 Pu_ij Pt_ij; these give 8J+4K after normalization.

The library Lagrangian coefficient is converted with H=-L. With MW=v=1 for algebraic evaluation, pref=1/(4 pi^2), so the rotated library tensor is multiplied by 16 pi^2 to obtain the normalized expression. These unit choices are for the identity test, not the physical model.

Set t=mt/MW and u=mu/MW. The script retains symbolic t, u and Z-mass dependence, translates decimal constants into exact rationals, and expands logarithms for positive masses/scales. All tensor contractions involve exact binary rationals, avoiding rounded CKM input. Gauge symbols appearing in intermediate terms are retained; the final simplified identity has no residual Z-mass or gauge-symbol dependence beyond the extracted prefactor. The formulas are understood away from their removable equal-mass singularities.

## Reproducibility and scope

The [script](casimir-dp-axion-triplet-symbolic-remainder-2026-09-07.py) authenticates the preceding extraction chain and performs the exact reduction with SymPy 1.14.0. [JSON](casimir-dp-axion-triplet-symbolic-remainder-2026-09-07.json) records the normalized expression, zero residual and passing checks. The physics root-leaf documentation check passes separately. Installed and archived source files are unchanged.

The source formulas remain the selected matching of [Endo, Kitahara and Ueda](https://arxiv.org/pdf/1811.04961) and the broader [Dekens–Stoffer matching](https://arxiv.org/abs/1908.05295) implemented by the authenticated library. The algebraic partition is not a gauge-invariant diagram decomposition. This proof does not include the terms without explicit mt, arbitrary flavor tensors, or the full candidate boundary.

## Next decision

The finite remainder on this mixed probe is now accounted for exactly, and its electroweak-suppressed scaling remains consistent with the prior approximation-scope explanation. Next test independent flavor structures and derive any covariant extension before applying it to evolved candidate tensors. Full qq overlap and the complete kaon constraint remain unproven. Do not add a probe-only term to the joint model.

The xenon/coherence predictions are unchanged. Shared-scattering goal remains active.
