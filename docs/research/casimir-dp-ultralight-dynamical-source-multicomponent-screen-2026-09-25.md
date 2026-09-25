# Dynamical U(1)-breaking source and three-component abundance screen

This packet replaces the prescribed Gaussian mass-mixing pulse with a minimally coupled, autonomous homogeneous toy. A real scalar source \(S\) has a quadratic mass and a trilinear \(\mu Sxy\) coupling to the two real components of an ultralight complex field \(\Phi=(x+iy)/\sqrt2\). The same dimensionless equations and parameters are used to calculate charge generation and the source's residual cold abundance.

## Model construction

The dimensionless potential is

\[
\frac{V}{m_\phi^2F^2}=\frac12(X^2+Y^2)+\frac12r^2Z^2+\beta ZXY+\frac{\widehat\lambda_\phi}{4}(X^2+Y^2)^2,
\]

where \(r=M_S/m_\phi\), \(X=x/F\), \(Y=y/F\), \(Z=S/F\), and \(u=m_\phi t\). Completing the square in \(Z\) gives a boundedness requirement \(\widehat\lambda_\phi\geq\beta^2/(2r^2)\); the scan fixes the quartic at 1.01 times this threshold. The source's initial displacement and trilinear are fixed by the prior pulse's target \(g=0.615\), while equalizing the source-energy fraction and source-backreaction scales at \(\sqrt g\). These parameters are set before integrating; they are not retuned to force a desired late charge.

## Results

The \(M_S/m_\phi=1\) run has a signed late \(Q_\phi/E_\phi\) ratio of \(-0.763\), a 0.75% span of comoving phi charge over its late averaging window, and a positive sampled quadratic mass matrix (minimum eigenvalue \(0.385m_\phi^2\)). Between \(u=1000\) and 3000 the ratio and source-to-phi energy ratio change by less than 0.1%. But \(Q_\phi\) is **not an exactly conserved charge** in this potential: the real \(Sxy\) coupling explicitly breaks the phi U(1). If \(\phi\) makes up 10% of the dark matter and both scalars are stable, this adds a 7.91% source fraction and leaves 82.09% for the heavy species. Under local co-tracing and fixed-shape assumptions, the heavy fraction gives a xenon-rate ratio of 0.821 and a fixed-cross-section annihilation-flux ratio of 0.674. The conditional thermal-relic cross-section rescaling gives a gamma-flux ratio of 0.823. These are abundance scalings only; they do not calculate a recoil spectrum or gamma likelihood.

The \(M_S/m_\phi=0.5\) case gives \(|Q_\phi/E_\phi|\simeq0.985\) and changes negligibly between \(u=1000\) and 3000, but its stable source carries about 2.45 times the \(\phi\) energy. At a 10% \(\phi\) fraction, the source would then take about 24.5% of total dark matter. The \(M_S/m_\phi=2\) case is unsettled: its late \(|Q_\phi/E_\phi|\) shifts from 0.516 at \(u=1000\) to 0.289 at \(u=3000\), and its source-to-\(\phi\) ratio shifts from 0.053 to 0.248. The \(M_S/m_\phi=5\) case keeps a small \(|Q_\phi/E_\phi|\simeq0.026\); its source energy ratio is steady by \(u=3000\), while the within-window phi-charge span is still 1.24%. These are finite-time drift diagnostics, not Noether-charge conservation tests.

The \(r=1\), 10%-\(\phi\) normalization corresponds to \(F\simeq2.41\times10^{15}\) GeV, initial \(S\simeq2.13\times10^{15}\) GeV, \(M_S=10^{-17}\) eV, \(\mu\simeq2.88\times10^{-68}\) GeV, and a physical quartic \(\lambda_\phi\simeq4.19\times10^{-84}\). Although that quartic is numerically tiny, its dimensionless strength \(\lambda_\phi F^2/m_\phi^2\simeq0.244\) is substantial at the cosmological field amplitude. The free-field boson-star mass-radius curve therefore cannot be carried over to this model.

## Decision and limits

The \(r=1\) case is the best current *cosmological source* benchmark, but it is not yet a viable stationary charged-star benchmark. Its late \(Q_\phi/E_\phi\) is not an exactly conserved Noether charge. Moreover, a rotating complex \(\Phi\) profile drives \(S\) at twice its frequency; with \(M_S=m_\phi\), that harmonic lies in the propagating continuum for a weakly bound star. The \(r=2\) case is closer to a localized second-harmonic mode, but its cosmological partition continues to evolve between \(u=1000\) and 3000. No mass ratio in this real-source toy has been validated across both cosmology and stationary compact-star structure. The initial \(S\) displacement has no production mechanism, source perturbations and fragmentation are absent, and LZ/Casimir-DP connectors remain conditional density scalings. See the [symmetry and harmonic compatibility audit](casimir-dp-ultralight-source-boson-star-symmetry-compatibility-2026-09-25.md).

The script and adjacent JSON contain the equations, solver tolerances, mass-ratio scan, selected long-run checks, physical normalizations, observable scalings, and falsification limits. Reproduce with:

```powershell
python docs/research/casimir-dp-ultralight-dynamical-source-multicomponent-screen-2026-09-25.py
```

The next decisive work is to derive the source displacement and fluctuations from an explicit early-Universe mechanism, then solve the coupled two-field boson-star stability problem with this same potential before making any laboratory-facing prediction.
