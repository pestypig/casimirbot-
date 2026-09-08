# Conditional carbon-13 transverse response for contact L10

September 6, 2026. Exploratory analytic approximation, not an authenticated many-body carbon response. The prior source-intake packet made progress by preventing missing carbon-13 data from being interpreted as zero. This packet supplies an explicit approximate response instead, without inserting it into the upstream library.

## Model and derivation

Assume an inert spin-zero carbon-12 core plus one neutron in a harmonic-oscillator p1/2 orbital. The [TRIUMF nuclear-shell-model notes](https://www.triumf.ca/sites/default/files/Yen_nuclear_decay_and_models_w.pdf) describe the unpaired-neutron p1/2 assignment. The inert core, oscillator wavefunction and oscillator lengths below are our simplifying assumptions, not measured properties or a claimed complete nuclear wavefunction.

Angular-momentum projection gives P S_n P = kappa J at q=0, with

\[
\kappa=\frac{j(j+1)+s(s+1)-l(l+1)}{2j(j+1)}=-\frac13
\quad(l=1,s=j=1/2).
\]

For q along z, the transverse spin-flip matrix element selects the p_z orbital overlap. With normalized p_z density proportional to z² exp(-r²/b²), its Fourier transform is (1-2y) exp(-y), where y=(qb/2)² in natural units. The effective transverse coefficient is therefore

\[
\kappa_T(q)=-\frac13(1-2y)e^{-y}.
\]

This is our derivation under the stated single-particle assumptions. At q=0 it gives a squared response one ninth of a free spin-half neutron with the same coefficient. At finite q it is not a scalar Helm form factor. A direct numerical real-space Fourier integral reproduces the expression, including its sign change and node.

## Explicit conditional rate kernel

Define the per-nucleon coefficient c_N (GeV^-2) by the leading nonrelativistic Hamiltonian amplitude

\[
M_{NR}=\frac{4c_N}{m_N^2}(\mathbf q\times\mathbf S_\chi)
\cdot(\mathbf q\times\kappa_T\mathbf J).
\]

For unpolarized spin-half dark matter and carbon-13, the spin average is 2 c_N² q⁴ kappa_T²/m_N⁴. Using the convention d sigma/d(q²)=<|M_NR|²>/(4 pi v²),

\[
\sigma_C=\frac{c_N^2}{2\pi v^2m_N^4}
\int_0^{(2\mu_Cv)^2} dx\,x^2\kappa_T(\sqrt{x})^2.
\]

The units before conversion are GeV^-2. The point-response integral is q_max^6/27, independently checked by quadrature. These definitions avoid silently importing a factor of two from an isoscalar convention. No identification with an LZ fitted coefficient has yet been made.

With the inherited 1-TeV, 776-km/s mono-speed population, density 0.3 GeV/cm³, frozen mass and 0.25-s hold, natural carbon-13 fraction 0.0107, and **chosen** c_N=1/(246.2 GeV)², q_max=61.94 MeV. The reference energy scale is normalization only; it does not specify Higgs exchange.

| Assumed oscillator length b | Carbon-13 cross section (cm²) | Expected independent-carbon count in hold |
|---|---:|---:|
| 1.4 fm | 5.414e-42 | 5.228e-30 |
| 1.6 fm | 5.051e-42 | 4.877e-30 |
| 1.8 fm | 4.663e-42 | 4.503e-30 |
| 2.0 fm | 4.259e-42 | 4.113e-30 |

This length sweep illustrates sensitivity; it is not a nuclear uncertainty interval. In this independent free-nucleus model alone, the real decoherence exponent is at most twice the count because 0 <= 1-cos(q.d) <= 2. This yields about 8.23e-30 to 1.05e-29 at the chosen coupling. Counts and exponents scale as c_N² in this weak-scattering model. Neither an LZ-derived upper bound nor an experimentally validated local prediction follows from the reference normalization.

## Limitations and next use

Configuration mixing, core polarization and two-body currents are omitted. There is no controlled many-body error estimate. The nucleus is treated as free for scattering kinematics; solid spin dynamics, recoil/phonon response, selection of surviving paths, and the boundary cross-ratio are not included. This result is one conditional channel, not a bound on all scattering in diamond.

The next shared calculation must implement the xenon transverse response with exactly the same c_N convention, validate it against a free-nucleon limit and a published spectrum, and form a response ratio before any fitted normalization. Retain this carbon approximation as a labeled sensitivity model alongside the missing full nuclear response. Do not promote it to replace that missing input silently.

Replay: `python docs/research/casimir-dp-c13-single-particle-2026-09-06.py`. Adjacent JSON records five passing analytic/numerical checks, assumptions and the unchanged frozen-config SHA-256. Atlas build, why and upstream trace succeeded against the canonical quantum-foam article before additions. Research-only change; no runtime, adapter or certificate semantics changed. S1 and the overall goal remain open.
