# Electroweak current normalization and loop-input provenance

Date: September 6, 2026 America/New_York. Status: independent leading-order amplitude audit; S1 and the shared prediction-model goal remain active. No source benchmark is silently retuned.

## Result

For the vector-like neutral current printed in the candidate model, our leading nonrelativistic calculation gives neutron normalization **7.42993e-39 cm² at 1.1 TeV**, rather than approximately 1.86e-39 cm². The difference is a factor four in cross section, corresponding to a factor two in transition amplitude. It is not a unit conversion, halo assumption or ordinary final-state counting convention.

The independent [Pospelov–Ramani solar-capture paper, equation 4 and following text](https://arxiv.org/html/2609.02775v1) explicitly identifies the same vector-like versus half-current discrepancy. [Di Mauro, equations 84–85 and footnote 2](https://arxiv.org/html/2609.02608v2) also uses the larger normalization. This supports the audit but does not reproduce either study's capture or detector inference.

The [Smirnov–Griffith–Beacom benchmark, equations 13–21](https://arxiv.org/html/2609.04144v1), prints a full off-diagonal current but the smaller cross section. For its stated neutral mass matrix, the leading spin-independent transition weight differs from unity by less than 1.3e-7 in the six table benchmarks. Mixing cannot supply the missing factor four. We therefore use the full-current result as the normalization contract for our future recast, while retaining the published table as a historical source input.

## Amplitude derivation

At low momentum the vector-like neutral dark current has coupling magnitude g/(2 c_W), while the neutron vector coupling has magnitude g/(4 c_W). Integrating out Z gives

\[
C_n=\frac{g^2}{8c_W^2m_Z^2}=\frac{G_F}{\sqrt2},
\qquad C_p=-(1-4s_W^2)C_n.
\]

The relative sign determines the weak nuclear charge; the overall sign does not change the cross section. With spinors normalized by ubar u=2m, a leading time-like vector current is 2m times its spin overlap. Thus the amplitude for each spin-preserving combination is 4 m_chi m_n C_n. Summing final spins and averaging the four initial spin combinations gives

\[
\overline{|\mathcal M|^2}=16m_\chi^2m_n^2 C_n^2,
\qquad\sigma_n=\frac{\mu_n^2 C_n^2}{\pi}
=\frac{G_F^2\mu_n^2}{2\pi}.
\]

Halving the physical transition current would give the smaller result. One must not halve the off-diagonal Majorana matrix element again after rewriting a vector-like Dirac current. No extra average over final neutral states belongs in the cross section. Nonzero splitting subsequently changes phase space and the velocity threshold; sigma_n here is the zero-splitting contact normalization.

## Neutral-state check

We independently diagonalized the printed real matrix in the (M,D_minus,D_plus) basis:

\[
M_0=\begin{pmatrix}m&t&0\\t&-m&0\\0&0&m\end{pmatrix},
\quad t=yv/\sqrt2.
\]

The light state is exactly D_plus. The other signed eigenvalues are ±M_star, with M_star=sqrt(m²+t²). Rephasing the negative signed state to positive mass makes its transition current vector-like; the positive state's transition is axial. Their squared neutral-current weights are

\[
w_V=\tfrac12(1+m/M_\star),\qquad
w_A=\tfrac12(1-m/M_\star).
\]

They sum to one, but their nonrelativistic operators are different. Summing current norms does not make both channels unsuppressed SI scattering. The dominant vector channel alone gives the corrected coefficient multiplied by w_V. Across the source table the rate multiplier relative to its smaller normalization is **3.99999948–3.99999999** at otherwise fixed parameters. The axial contribution is not included in this leading SI ratio.

This means a spectrum previously normalized to one raw event would become approximately four raw events under the same target response, halo and splitting. It is not a new LZ likelihood or an exclusion. To recover a specified count, the splitting/halo calculation must be rerun, and the intersection with a relic trajectory must also be revisited. We have not replaced the source's masses, splittings or Yukawa values with an inferred correction.

## Loop inputs remain approximate

Tracing the elastic table leads to [the February generalized-framework paper, section VII.5 and conclusions](https://arxiv.org/html/2602.17764v1). It imports pure-Majorana cross sections for the mixed model and discusses additional Higgs-loop corrections. Its cited [2018 mixed-multiplet analysis, sections 2.2.3 and 3.3](https://arxiv.org/pdf/1711.08619) cautions that mixed-state radiative behavior is not generically identical to pure minimal dark matter, and discusses cancellations between scalar and twist-two contributions.

Our matrix check confirms zero tree-level diagonal Higgs coupling. That does not prove equality of loop amplitudes. Nor does finding a D_plus light state justify replacing the source values with pure-Dirac-multiplet values: charged-state mixing, hypercharge, masses and cancellations must be retained. Therefore the earlier local bounds remain conditional on the imported contact amplitudes; they are not a completed loop prediction for these models.

The required next inputs are the broken-phase charged and neutral vertices, matching to scalar and twist-two quark/gluon operators, and neutron/proton matrix elements with uncertainties. The exact model must also pass its relevant external constraints. For example, the solar-capture paper's constraint applies to its thermal Higgsino and annihilation assumptions; it cannot be transferred numerically to all six mixed multiplets.

## Verification and next action

Run `python docs/research/casimir-dp-electroweak-current-audit-2026-09-06.py` with NumPy from the canonical repository root. The adjacent JSON contains source-input hash, cross sections, state weights and seven passing checks: spin normalization, factor four, light-state identity, current sum, analytic mixing, zero tree Higgs derivative and absence of a mixing explanation for the discrepancy.

Atlas build/why/upstream trace completed before additions. This adds offline research diagnostics and documentation only, with no changes to runtime physics, adapters, constraints, certificate semantics or the frozen candidate. No physical-verification certificate is claimed.

Next: implement an explicitly labeled recoil-level recast with the audited neutral-current normalization and isotope responses, while sourcing the loop matching independently. The overall model is not yet satisfactory or experimentally admitted; S1 stays open.
