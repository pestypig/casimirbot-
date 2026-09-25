# Two-component isocurvature response of the charge-pulse toy

This calculation takes one already-scanned homogeneous charge-generation toy and asks whether its linear, superhorizon field perturbations change the earlier real-field isocurvature screen. It is an exploratory response calculation, not a complete early-Universe model.

## Frozen benchmark and result

The benchmark is the prior radiation-era pulse fit with \(\sigma=0.2\), \(g_0=0.614899\), and late charge asymmetry \(|\epsilon|=0.5\). Its mass matrix remains positive, with minimum eigenvalue \(0.3851m_\phi^2\). Propagating the two canonical component perturbations through the same linear equations gives the late comoving-energy response

\[
K=\begin{pmatrix}0.39535&0.04993\\0.04993&0.39535\end{pmatrix},
\qquad
\rho_{\phi,\mathrm{com}}\propto (x_0,y_0)K(x_0,y_0)^T.
\]

The positive eigenvalues verify that this response is a valid quadratic energy form. Around the chosen \((X,0)\) background, the transverse field fluctuation adds a factor \(1+(K_{xy}/K_{xx})^2=1.01595\) to the squared density-gradient response. After rescaling the initial field to retain the same final abundance, the conditional 95% bound is \(H_{\rm inf}<6.59\times10^{11}\) GeV for \(f_\phi=0.10\), compared with \(6.87\times10^{11}\) GeV for the one-component no-pulse screen. At \(f_\phi=0.10\), \(H_{\rm inf}=10^{11}\) GeV gives \(\beta_{\rm iso}\simeq9.1\times10^{-4}\), while \(10^{12}\) GeV gives \(\simeq0.083\), above Planck's adopted 0.038 limit.

Thus this particular homogeneous pulse causes only a modest change in the density-isocurvature estimate. That does not establish the charge-generation scenario: the pulse is prescribed, and the source that could generate it may itself fluctuate and contribute perturbations.

## Method and limitations

Because the toy equations are linear in the fields, the late comoving energy is a quadratic form in initial \((x_0,y_0)\). The script integrates basis and mixed initial conditions to determine \(K\), then uses independent canonical inflationary fluctuations \(\delta x=\delta y=H_{\rm inf}/(2\pi)\). It assumes a superhorizon separate-universe mode, the same fixed radiation background, light unsuppressed field components during inflation, no correlations with adiabatic curvature, and the uncorrelated scale-invariant Planck CDI limit.

The calculation does not evolve finite-wavelength modes, metric perturbations, perturbations of the source that breaks U(1), or the conserved-charge isocurvature into fragmentation. It therefore cannot certify the charged condensate or predict a boson-star population. Next derive and evolve the source sector and its perturbations; then propagate density and charge fluctuations into nonlinear fragmentation before using this branch in detector-facing predictions.

Reproduce with:

```powershell
python docs/research/casimir-dp-ultralight-charged-pulse-isocurvature-screen-2026-09-25.py
```

The adjacent JSON records the response matrix, assumptions, and per-fraction benchmark results.
