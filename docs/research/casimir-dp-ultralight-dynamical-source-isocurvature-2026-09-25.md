# Three-field isocurvature screen for the dynamical-source benchmark

This packet propagates inflationary fluctuations of all three canonical real fields \((x,y,S)\) through the same nonlinear homogeneous equations as the \(M_S/m_\phi=1\) autonomous-source benchmark. It addresses the source-field omission in the earlier charged-pulse isocurvature screen, while keeping the calculation conditional and separate-universe.

## Method and result

The background is normalized to \(f_\phi=0.10\), with the real source contributing \(f_S=0.07914\) and the remaining heavy component assumed adiabatic. Each light field is assigned an independent inflationary fluctuation \(H_{\rm inf}/(2\pi)\). The nonlinear late total comoving energy is differentiated with respect to the three initial dimensionless fields using central finite differences at steps \(10^{-3}\) and \(5\times10^{-4}\). The relative change in the resulting logarithmic-density-gradient vector is \(7.3\times10^{-8}\), so this differencing step is numerically stable for this background.

The resulting gradient is \((0.9975,-0.2684,1.1158)\), with norm 1.5205. Applying the Planck 2018 uncorrelated, scale-invariant CDM-isocurvature limit \(\beta_{\rm iso}<0.038\) gives the conditional bound

\[
H_{\rm inf}<5.06\times10^{11}\;\mathrm{GeV}.
\]

At \(H_{\rm inf}=10^{11}\) GeV, the estimated isocurvature fraction is 0.00154; at \(10^{12}\) GeV it is 0.133 and fails the adopted screen. This is tighter than the two-component pulse screen because the stable source's inflationary fluctuation also modulates the total cold density.

## Interpretation and limits

The initial source displacement is still assigned to produce the previously fixed source/phi energy ratio. The calculation does not explain why inflation or reheating should select that displacement. It assumes the three fields are light, independent and unsuppressed during inflation; neglects metric and finite-wavelength perturbations; assumes fixed radiation domination, no entropy transfer, no source decay, and an adiabatic heavy component; and uses Planck's specific uncorrelated scale-invariant CDI limit rather than a CMB likelihood fit. It computes density response only, not charge-isocurvature transfer or fragmentation.

Therefore this strengthens the conditional initial-condition screen but does not validate the source mechanism, boson-star formation, or any LZ/gamma/Casimir-DP signal. A next model must derive the displaced source from an explicit cosmological potential/history and evolve its coupled perturbations and explicitly broken phi-current transfer (or replace it with an exactly U(1)-preserving mediator).

Reproduce with:

```powershell
python docs/research/casimir-dp-ultralight-dynamical-source-isocurvature-2026-09-25.py
```

The adjacent JSON records the full parameterization, finite-difference convergence, Planck comparison and limitations.
