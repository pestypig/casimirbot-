# Conditional ultralight misalignment isocurvature screen

This packet checks one necessary cosmological condition for the cold ultralight component already used in the shared-observable budget. It does not test boson-star formation or provide a detector prediction.

## Result

For a light spectator scalar during inflation, quadratic misalignment, uncorrelated scale-invariant CDM isocurvature, and no later dilution, the standard estimate is

\[
\mathcal P_S=\left(\frac{f_\phi H_{\rm inf}}{\pi\phi_i}\right)^2,
\qquad
\beta_{\rm iso}=\frac{\mathcal P_S}{A_s+\mathcal P_S}.
\]

The code numerically evolves the homogeneous Klein-Gordon equation in radiation domination and finds that the frozen initial amplitude is 1.576 times the field amplitude in the existing `3H=m` normalization. With that transfer applied, the conditional 95% upper bound is \(H_{\rm inf}<6.87\times10^{11}\) GeV for \(f_\phi=0.10\), and \(<2.17\times10^{11}\) GeV if this field is all of the dark matter. At \(f_\phi=0.10\), an illustrative \(H_{\rm inf}=10^{11}\) GeV gives \(\beta_{\rm iso}\simeq8.4\times10^{-4}\), below the adopted limit; \(10^{12}\) GeV gives \(\beta_{\rm iso}\simeq0.077\), above it. The bound weakens as \(f_\phi^{-1/2}\) for a subcomponent.

The adopted limit is Planck's \(\beta_{\rm iso}(k=0.05\,{\rm Mpc}^{-1})<0.038\) at 95% CL for its uncorrelated, scale-invariant CDM-isocurvature (“axion I”) case. The calculation uses \(A_s=2.1\times10^{-9}\). See the [Planck inflation analysis](https://arxiv.org/abs/1807.06211) and [Planck cosmological parameters](https://arxiv.org/abs/1807.06209).

## Interpretation and next calculation

This is a conditional pass/fail screen, not an exclusion of the ultralight branch: it gives an upper limit on inflationary scale only under the listed initial-condition and spectrum assumptions. A post-inflationary symmetry-breaking history, correlated or non-scale-invariant modes, late entropy production, or a different abundance transfer can change the inference. The transfer calculation assumes a radiation background with fixed relativistic degrees of freedom; it does not include reheating dynamics or a coupled perturbation evolution.

It is even less complete for the charged complex field used in the boson-star charge budget: perturbations of both real components, the phase, and the conserved charge need to be evolved together. The next meaningful refinement is to add the linear perturbation and charge evolution, matched to the abundance and charge initial conditions. Only after that should this constraint be folded into fragmentation and compact-object population simulations.

Reproduce the screening table with:

```powershell
python docs/research/casimir-dp-ultralight-misalignment-isocurvature-screen-2026-09-25.py
```

The script writes the adjacent JSON and asserts the expected fraction scaling. Inputs and limitations are recorded in both outputs.
