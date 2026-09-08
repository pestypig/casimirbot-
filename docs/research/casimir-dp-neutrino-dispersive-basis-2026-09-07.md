# Conditional dispersive pion slice after basis normalization

Exploratory snapshot, September 7, 2026. This is a specified numerical prescription, not a validated dispersive solution or full decay/detector model. It advances the [intake audit](casimir-dp-neutrino-dispersive-intake-2026-09-07.md); the upstream files remain unmodified.

The paper arranges two canonical solution columns in an Omnes matrix and imposes identity at zero. Its linear integral equation permits constant real combinations of solution columns. The relative pion/kaon projection is n_K/n_pi = 2/sqrt(3). These conventions and the constant subtraction prescription are given in [equations 6, 12, 15 and 59 of Blackstone et al.](https://arxiv.org/html/2407.13587v1).

Our prescription assembles each archived sample as

```text
O(s) = [[c1(s), d1(s)], [c2(s), d2(s)]]
Omega(s) = O(s) inverse[O(0)]
Gamma_pi(s) = Omega_11(s) Gamma_pi(0)
            + (2/sqrt(3)) Omega_12(s) Gamma_K(0).
```

All sampled O(0) matrices are real to the checked precision and well conditioned: condition numbers 1.0296–1.1661. Right multiplication recovers identity and is invariant under an arbitrary nonsingular real change of fundamental columns. This is appropriate **if** the paired columns are solutions of the same sampled integral equation. Those algebraic checks do not independently verify that equation, its phase input, or the correspondence between samples across files. No claim that normalization repairs the upstream solver is made.

Subtraction constants use the printed NLO equations 77 and 79, including the mass-weighted logarithms missing from the archived GammaK0 implementation. With its central constants and m_pi=0.134 GeV, we obtain Gamma_pi(0)=0.01769084 GeV^2 and Gamma_K(0)=0.01371508 GeV^2. These are held fixed across the 100 phase samples. No strange or gluon source coupling is added to the up/down model.

The exclusive pion slice uses the previously independently counted charged/neutral phase space, with g_phi_pipi = yq Gamma_pi/mhat and mhat=(0.00216+0.00467)/2 GeV. The couplings remain ychi=yq=0.02 m_phi/GeV. Integration covers 2m_pi <= sqrt(s) <= 0.35 GeV, using piecewise quadrature at the native interpolation knots. This quantity is a partial decay width of chi into neutrino plus pions, not the width of an on-shell mediator.

| m_chi / m_phi (GeV) | Mean partial width (GeV) | Ratio to LO slice at the same pion mass | Mean flight length at 10 GeV (mm) |
|---|---:|---:|---:|
| 1 / 1 | 2.22072e-11 | 2.21885 | 0.088410 |
| 1 / 10 | 1.79380e-11 | 2.21425 | 0.109451 |
| 2 / 10 | 4.22593e-11 | 2.21782 | 0.022875 |

Flight lengths use recoil 248 keV and the partial width alone. They are conditional estimates; no QCD-qualified upper bound on the physical lifetime is established. Additional disjoint decay channels would shorten them if this partial amplitude is valid.

Numerical and prescription sensitivity:

- Keeping the raw matrices changes the width by about +0.215% on average; the largest sampled difference is below 0.5%. Large zero-momentum matrix residuals therefore do not translate directly into a comparably large error in this projected integral.
- Using the reciprocal relative channel coefficient found in the inspected code changes the width by about -1%. It is recorded as a diagnostic, not an equally established convention.
- Linear versus componentwise PCHIP interpolation differs by at most 0.123% in the source-mass calculation. Doubling piecewise quadrature order changes the representative width by less than 2.5e-7 relatively. These are separate tests of interpolation choice and quadrature; neither measures missing fine-grid structure.
- Replacing the pion mass in subtraction constants and phase space by 0.13957039 GeV, while keeping the numerical Omnes functions fixed, gives 0.091009, 0.113275 and 0.023576 mm. This is explicitly a **hybrid sensitivity calculation**, since the phase input has not been regenerated for that mass. It does not resolve charged/neutral isospin breaking.
- The phase-sample spread is about 0.18% of the width here. It is not the full theoretical uncertainty or a confidence interval: subtraction uncertainties/correlations, mass conventions, asymptotic assumptions and numerical-solution accuracy remain missing.

Within these prescriptions the pion slice is enhanced, not suppressed by the hundreds-to-thousands factor required by the preceding illustrative 10 cm/50% survival screen at 10 GeV. This changes the next useful action: carry the short-lived hypothesis into a decay-cascade response and incident-energy-weighted survival calculation, while retaining the unresolved hadronic uncertainty. It does not establish an LZ veto or exclude the neutrino model. Higher incident energies give longer boosts, and actual paths and daughter energy deposition must be modeled.

For the shared-experiment goal, raw xenon production counts still cannot stand in for accepted isolated recoils. The canonical local coherence forecast and boundary cancellation are unchanged; no measured residual, shared gravitational cause, or common-model fit is asserted.

Five checks pass: normalized identity, real basis invariance, recovery of the specified subtraction value, quadrature refinement, and positive finite widths. Run the sibling Python script to reproduce the sibling JSON; parent definitions and numerical files are hash checked without rerunning archived outputs. Ordinary research-document validation applies, with no certificate promotion.
