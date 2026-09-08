# Diamond independent-electron spin diagnostic

September 6, 2026. Exploratory S1 research. The frozen experiment is unchanged. This is a specified approximation, not an authenticated interacting spin susceptibility or a fitted common mechanism.

## Result and implication

Using the same photon magnetic moment as the xenon and diamond density calculations, an independent spin-degenerate Kohn-Sham response gives a finite-grid electronic spin rate about **147.9 times the preceding electronic density rate**. For 1 TeV DM at 776 km/s and moment 10^-6 GeV^-1, D_spin,grid <= 6.350e-27 during the frozen hold. Dividing by the same raw xenon prediction gives <=8.266e-29 per 5.4–270 keV event or <=3.940e-25 per 200–270 keV event. Neither number is an experimental upper limit.

This component dominates the preceding finite-grid density contribution in the stated approximation but remains extremely small relative to the DP comparator D=0.0295115. A missing-channel calculation can be larger than an earlier component without establishing a detectable common signal.

## Response intake and distinction

The [QCDark2 source repository](https://github.com/meganhott/QCDark2/tree/6d22f936bf49a15db73a24d1274dcc63c37780dd) provides a separate `dielectric_functions/nolfe/diamond_nolfe.h5`, 48,116,408 bytes, Git blob `775bab519afc75d424ae1fc499b09b54b42384a3`. The archived file is authenticated in the script. The raw-content server reset connections; the GitHub blob API supplied the matching bytes. No upstream program was installed or executed.

The [QCDark2 paper, equation 15](https://arxiv.org/html/2603.12326v1) constructs the independent Kohn-Sham polarizability from orbital matrix elements. Its no-local-field dielectric function allows recovery of that *independent* density spectral response through Im(epsilon), whereas the inverse dielectric loss describes screened density response. Its composite local-field table cannot simply be substituted for this purpose.

Archived `epsilon_routines.py`, particularly `save_eps`, and `epsilon_utils.py`, `epsilon_r`, establish how the unscreened spectral function is angular-averaged and stored as `epsilon`. The `include_lfe=False` attribute is checked. SHA256 records and upstream license accompany the local archive. The source's interpolation and angular averaging remain inherited approximations; cubic symmetry does not imply exact isotropy at every momentum.

## Model and normalization

Assume spin-degenerate independent orbitals with no spin-orbit coupling, magnetic order, defects or spin-dependent response vertex. For S_i=sigma_i/2, the spin traces give

`chi_spin,ij^(0) = delta_ij chi_density^(0)/4`,

and `chi_density,spin^(0)=0` because Tr(sigma_i)=0. These statements follow from this model's spin factorization. They are not a claim that all mixed responses vanish in the actual apparatus. In a spin-rotation-invariant unpolarized state, scalar-density/vector-spin mixed response also vanishes by symmetry, but interacting spin response need not equal one quarter of the interacting charge response.

The photon magnetic-dipole spin amplitude is

`A_spin = (2 e mu_chi/m_e) S_chi · (1-qhat qhat) · S_e`.

A direct four-dimensional Pauli-matrix calculation gives the free-particle spin average `<|A_spin|²> = e² mu_chi²/(2m_e²)`. Thus dσ/dq² = alpha mu_chi²/(2m_e²v²), agreeing with the point-electron magnetic term in the same moment convention as the preceding xenon calculation.

Inserting the independent spin susceptibility into the golden rule gives

`Gamma_spin/mu_chi² = [1/(4 pi² v m_e²)] integral q³ dq dw Im(epsilon_noLFE)`.

The domain is `w/q + q/(2m_chi) <= v`, with w=5.5–150 eV and the archived momentum centers 37.289–74616.078 eV/c. The script uses the prior mass-normalized volume and reference moment via authenticated rate ratios. No Coulomb ELF screening denominator is applied to this independent spin response. The need for a separate spin susceptibility in the general problem is explained by [Hochberg et al., section III.2](https://arxiv.org/html/2510.25835v1).

## Verification and limits

Run `python docs/research/casimir-dp-diamond-spin-bubble-2026-09-06.py`. The companion JSON records 100, 200 and 1000 GeV cases, input identities and four passing checks: free-spin amplitude normalization, spin-bubble trace factor, positive rates, and Simpson/trapezoid agreement within 1% (observed about 0.13%). Numerical agreement does not measure uncertainty from omitted interactions.

D<=2N bounds the real decoherence exponent for this specified positive spin contribution. It does not imply that all scattering events remain trapped or survive postselection. Adding it to the prior density component is meaningful only under compatible response approximations and the stated vanishing mixed terms; this packet does not report their sum as the full electromagnetic rate.

Open terms include transverse orbital current, interacting spin/excitonic corrections, spin-orbit and defect response, below-threshold modes, the unprovided q/energy tail, halo folding, xenon detector likelihood, transport/external exclusions and the actual boundary-control observable. In particular, the independent-electron relation must not be mistaken for measured diamond magnetic susceptibility. This calculation advances a concrete common-coupling model component; S1 and the overall user goal remain active.
