# Magnetic-dipole diamond density contribution

Date: September 6, 2026. Exploratory finite-grid calculation for shared-scattering gate S1. No fitted common mechanism, measured local residual, hardware admission, or certification claim.

## Result

The authenticated diamond dielectric grid now supplies a conditional longitudinal electronic contribution at the **same magnetic moment** used in the xenon calculation. For a 1 TeV Dirac particle, speed 776 km/s, density 0.3 GeV/cm³ and magnetic moment 10^-6 GeV^-1, the frozen sphere has 2.1463e-29 expected electronic scattering events during its 0.25 s hold, within the integration window. The associated decoherence exponent obeys D_grid <= 4.2926e-29, without assuming an isotropic incident direction.

The matching xenon charge-plus-nuclear-magnetic calculation gives about 76.82 raw events in 5.4–270 keV or 0.01612 in 200–270 keV, for 2.84 tonne-years and unit efficiency. Thus D_grid/raw-Xe-count <= 5.588e-31 or 2.663e-27 respectively. These are conditional response ratios, **not an experimental exclusion or fit**. In particular, normalizing to a single high-energy event would also predict thousands of lower-energy events in this approximate xenon model; that cannot be hidden by separately adjusting the sphere coupling.

The finite-grid density contribution is much smaller than the frozen DP comparator D = 0.0295115. This does not establish a bound on omitted channels or the complete magnetic-dipole model.

## Derivation and normalization

Define the dipole convention by the free-charge cross section of [Barger, Keung and Marfatia, equation 4](https://arxiv.org/pdf/1007.4345). In natural units, the longitudinal density amplitude used here has spin-averaged square

`<|A_density|²> = e² mu_chi² [1/(4 m_chi²) + v_perp²/q²]`,

with `v_perp² = v² - (omega/q + q/(2 m_chi))²`. It is retained only where this expression for v_perp² is nonnegative. This is the longitudinal component under the material-response decomposition, not a replacement for every electronic current or spin response.

For a stationary free charge of mass M, substitute omega = q²/(2M). Using dσ/dq² = <|A|²>/(4πv²) gives

`dσ/dq² = alpha mu_chi²/q² [1 - q²/(4 M² v²) - q²/(2 M m_chi v²)]`.

This matches the free-charge recoil expression and independently fixes the moment convention.

At effectively zero temperature for omega >= 5.5 eV, use `S = 2 Im(-chi_density)` and `Im(-chi_density) = q²/e² ELF`. Golden-rule integration over the polar angle then gives

`Gamma_density/mu_chi² = (1/(2π² v)) integral q dq dω [v_perp² + q²/(4 m_chi²)] ELF(q,ω)`.

Gamma is the rate for one incident particle in an infinite homogeneous medium, in energy units. The finite-target expected count is `(rho_chi/m_chi) V_target t Gamma/hbar`. No additional atom count or coherent N² enhancement multiplies a response already normalized per material volume.

The apparent factor-two ambiguity in [Hochberg et al., Appendix B–C, equations 29 and 34–35](https://arxiv.org/html/2510.25835v1) resolves as follows: equation 34 is for fixed incident/final spin states; its 4π becomes 2π upon taking one half of the ordinary spin trace for unpolarized spin-half DM. The trace in equation 35 must therefore be the ordinary matrix trace. Using an already averaged squared amplitude, as here, requires the explicit FDT factor two. The prose description near equation 5 can otherwise invite double averaging. We do not allege a numerical error in the authors' implementation.

## Authenticated material input and integration scope

Use the archive and hashes in `casimir-dp-diamond-response-intake-2026-09-06.json`, originating from [QCDark2](https://arxiv.org/html/2603.12326v1). The archived complex dielectric function is unchanged. Only roundoff-scale negative ELF values are clipped in working memory after a passivity tolerance check.

Integrate energy 5.5–150 eV and tabulated q centers 37.289–74616.078 eV. There is no extrapolation below the gap, above either grid endpoint, or to unprovided spin responses. The composite grid has different local-field treatment in its high-q part, as recorded in the intake packet. A finite grid is not complete merely because its final bins look small.

Transfer the bulk response by the frozen mass and the source unit-cell density, 3512.48 kg/m³. This gives volume 8.80434e-14 cm³, versus the frozen geometric volume 8.83573e-14 cm³ (about 0.36% difference). This is an explicit bulk-material approximation; neither frozen radius nor mass was changed. Finite surfaces, defects, orientation dependence and trap dynamics remain unmodeled.

For a translation superposition, each momentum-transfer event contributes `1-cos(q·d/hbar)` between zero and two to the real decoherence exponent. Accordingly D_grid <= 2N_grid is safe for this specified positive density term, without replacing a directional halo by an isotropic sinc. Mixed-response interference means this statement is not automatically a bound on the total electromagnetic answer. This packet does not predict retained-event visibility after heating or trap loss.

## Reproduction and checks

Run `python docs/research/casimir-dp-diamond-density-rate-2026-09-06.py` from the canonical repository. It writes the companion JSON, authenticates the frozen configuration, dielectric file and prior xenon result, and does not execute previous result-generating scripts.

Four checks pass: free-charge normalization across masses and recoil fractions; ordinary versus averaged spin-trace convention; positive integrated rates; and Simpson versus trapezoidal quadrature agreement within 1%. The observed integration difference is about 0.1513%; it is a numerical cross-check, not a claimed total theory uncertainty. Cases at 100, 200 and 1000 GeV are recorded. Rates scale quadratically with the reference magnetic moment and linearly with the assumed incident density only inside the weak-scattering approximation.

## Next discriminating work

1. Establish the electronic transverse-current/spin response and any mixed terms; determine which vanish by the actual material symmetries rather than declaring missing data zero.
2. Bound the omitted momentum/energy region using a justified sum rule or independently authenticated response. Do not call the current finite-grid result a total upper bound.
3. Fold a common halo distribution and actual xenon detector acceptance, then apply existing magnetic-moment exclusions and propagation constraints before considering a parameter fit.
4. Convert the local scattering distribution into survival, heating and the canonical boundary-control observable. A boundary-independent factor cancels in matched cross-ratios.

The goal remains active. This packet advances one calculable component; it does not satisfy the full-model acceptance criteria.
