# Inelastic models: which local predictions are actually determined?

Date: September 6, 2026 America/New_York. Independent exploratory comparison; S1 and the overall shared-model goal remain open. Frozen apparatus/configuration unchanged.

## Finding

The generic pseudo-Dirac benchmark does not yet uniquely specify every local elastic interaction. Its masses, splitting and leading inelastic coefficient leave degrees of freedom in the mediator and Majorana mass terms. A more specific electroweak construction supplies published loop-elastic benchmarks; translating those into a constant, equal-proton/neutron contact amplitude gives extremely small local effects. These are conditional calculations, not experimentally admitted models or complete electroweak response predictions.

The most useful bridge emerging here may be a **predicted local null** alongside xenon events. A null can discriminate mechanisms, but must not be presented as predicting a detectable percent-level coherence residual.

## Generic vector model: normalization and missing parameters

The [Di Mauro preprint, section IV](https://arxiv.org/html/2609.02608v2), specifies universal quark-vector couplings and an off-diagonal pseudo-Dirac interaction. Its contact matching gives c_N=3 g_chi g_q/m_V² and sigma_N=mu_N² c_N²/pi. It describes a phenomenological construction and explicitly notes the need for a symmetry-breaking sector, gauge consistency and an excited-state history. Its relic relation assumes an off-resonance heavy mediator; the effective contact scale alone does not establish that limit.

Using its diagnostic sigma_N=6.5e-43 cm² and mass 1 TeV, our conversion gives c_N=7.71482317e-8 GeV⁻² and Lambda=sqrt(3/c_N)=6.23588 TeV. This reproduces the contact normalization, not the relic calculation or LZ likelihood.

There is a concrete identifiability issue even before loops. For real Majorana terms, the two-Weyl mass matrix is [[m_L,m_D],[m_D,m_R]]. Fixing physical masses 1000 and 1000.000297 GeV fixes the trace/splitting but permits a continuous change in m_R−m_L if m_D changes accordingly. Our independent matrix diagonalization gives:

| (m_R−m_L)/delta | Magnitude of diagonal rotated Weyl charge |
|---|---:|
| 0 | numerical zero |
| 0.5 | 7.4250e-8 |
| 1 | 1.4850e-7 |

All three choices preserve both physical masses; the off-diagonal charge stays near one. Its tiny change can be compensated in the bare coupling while preserving the leading measured coefficient. The diagonal Weyl current corresponds to axial structure in four-component Majorana notation; the vector Majorana current still vanishes. These charge factors are not cross sections. They demonstrate that a mass splitting and inelastic coefficient alone do not identify all elastic operators. An exact exchange/parity choice can set the diagonal term to zero, but that is an additional model choice.

## Could an excited population restore the direct carbon channel?

Ground-state upscattering is closed for free carbon under the existing 776-km/s cap. For an excited incoming particle, downscattering releases delta and is allowed. We calculated an intentionally generous free-carbon contact envelope: every incident particle is excited, all nuclei scatter independently, nuclear form factors equal one and the entire frozen mass is carbon-12.

For a constant SI contact amplitude,

\[
\sigma_C^0=\sigma_N\,12^2(\mu_C/\mu_N)^2,
\qquad v\sigma_{down}(v)=\sigma_C^0\sqrt{v^2+2\delta/\mu_C}.
\]

The speed in this equation is in natural units. Restoring c and using density 0.3 GeV/cm³, the predicted count over the 0.25-s hold is at most **3.52135e-24** at the benchmark. The associated unconditioned scattering decoherence exponent is bounded by twice that count. This is not a bound on collective channels or survival-conditioned coherence; it does show that simply adding an excited fraction cannot rescue the independent free-carbon channel at this normalization. Smaller excited fractions reduce it linearly.

## A more predictive lead with a loop-elastic companion

[Smirnov, Griffith and Beacom, arXiv:2609.04144v1](https://arxiv.org/html/2609.04144v1), submitted September 3, tabulates six Higgs-coupled electroweak benchmarks. At its custodial point, tree-level diagonal Higgs coupling vanishes, while an inelastic Z interaction and an approximate representation-dependent loop-elastic signal remain. Its one-event normalization is a rate-level estimate without the full detector response. The loop signal is approximated by a pure-multiplet result, not a new complete matching calculation for every benchmark.

We ingested its masses, splittings, Yukawa couplings and loop cross sections as **source inputs**, not independently verified amplitudes. Replaying its mass-splitting relation from rounded table values agrees within 1%. Every benchmark's direct free-carbon upscatter remains closed: carbon's maximum splitting is 37.16–37.44 keV, versus source splittings above 350 keV.

For a deliberately specified local approximation, convert each source loop cross section into an energy-independent SI contact amplitude with equal proton and neutron couplings. Let A_obj=mass/u and allow the triangle bound on the summed Born amplitude, S(q)≤A_obj². For a cold target without exothermic energy release, q≤2 m_chi v then gives

\[
\sigma_{obj}\le\sigma_N A_{obj}^2(m_\chi/\mu_N)^2,
\qquad D\le2(\rho_\chi/m_\chi)v_{max}t\,\sigma_{obj}.
\]

This is a **constant-amplitude envelope**, not an assumption that the entire object physically scatters coherently at all q. Across the six inputs it ranges from D≤8.31e-15 to D≤3.01e-10. Those values are far below the 0.0295 comparator within the stated approximation. The equal-nucleon assumption and amplitude bound over the entire momentum interval must be authenticated before this can be a bound on the full electroweak models: loop cancellations at q=0 or momentum dependence can invalidate such an extrapolation, particularly where the generous q cap exceeds electroweak scales.

We also compute the narrower rigid uniform-sphere channel at qR≤80 with the full visibility filter, using the constant contact amplitude only in that low-q regime. Its exponents are 7.27e-35 to 3.18e-34. These are partial-channel predictions under an isotropic 776-km/s shell and constant separation, not total local coherence rates. Extending the uniform contact model's integral has a tail bound from |F(x)|≤6/x² and 1−sinc≤2; that mathematical tail does not establish the omitted solid response.

## Normalization discrepancy that must be resolved

The two recent sources quote neutral-current neutron cross sections differing by about four: 7.4e-39 and 1.9e-39 cm² in their respective constructions. Their stated neutral-current structures warrant an amplitude-level comparison, including Majorana normalization, initial-state averaging and inclusive final states. Do not merge their rate-selected splittings or declare either formula corrected from this audit alone. This is an explicit unresolved input for the xenon recast.

## Decision and next work

Keep the electroweak benchmarks as a priority because they provide a concrete elastic companion, while retaining their approximation limits. Next authenticate their loop Wilson coefficients and neutron/proton matching, resolve the neutral-current factor, and only then fold a shared xenon/local response. The generic vector model requires an explicit mediator/mass-term completion before claiming a unique elastic forecast. Long-range Yukawa cases remain a separate unfinished lead.

No calculation here identifies gravity as the scattering force or predicts boundary dependence. The same cancellations in the canonical boundary cross-ratio still apply to a homogeneous interaction with matched histories.

## Verification

Run `python docs/research/casimir-dp-inelastic-local-audit-2026-09-06.py` from the canonical root with NumPy/SciPy. The adjacent JSON records source inputs, conditional results, seven passing checks and the frozen-config hash. Checks verify mass preservation, rotated charges, contact normalization, thresholds, envelope ordering and rounded mass-splitting replay. They do not test the full models against experiment.

Atlas build, canonical-article why and upstream trace succeeded before additions. Only offline diagnostics and documentation changed; no runtime physics, adapters, constraints, certificates or physical-admissibility authority changed. Casimir verification is not claimed.
