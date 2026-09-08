# Covered silica electronic stopping for the shared scattering lead

Exploratory research calculation, 2026-09-07. No experimental validation, allowed shared point, capture efficiency, or measured coherence signal is established.

The two-mediator products are frozen to the existing common-parameter receipt. Using the tabulated silica dielectric response instead of an assumed static-response continuation gives a small covered contribution to electronic stopping. It does not establish a small total stopping rate: the source has finite momentum coverage.

| Mediator masses | Covered electronic loss at 7e9 g/cm² | Including below-gap table entries, sensitivity only |
|---|---:|---:|
| 1 keV, 1 GeV | 0.0466267 eV | 0.0604617 eV |
| 100 keV, 1 GeV | 5.85134e-6 eV | 6.06439e-6 eV |
| 10 MeV, 1 GeV | 6.58456e-14 eV | 6.81032e-14 eV |

These are constant-initial-speed mean energy losses, with 100 GeV incident mass and speed 776 km/s. The initial kinetic energy is about 335 keV. The chosen column is a diagnostic path budget, not reconstructed Earth geology or a transported trajectory. The covered electronic contribution by itself offers no substantial slowing mechanism. It cannot supply the assumed thermal population required by the earlier partial diamond calculation.

## Response provenance and coverage

Source: [DarkELF SiO2 Mermin table at pinned commit](https://github.com/tongylin/DarkELF/blob/352149fb53b614adbac6ee242045c56be25aad29/data/SiO2/SiO2_mermin.dat), SHA256 `8b9ea234e91cfeb29550a5f830a1a183dc3dd4f68553bccdcb71a49af3d6e053`. Its header credits Sun et al., Calculations of Energy-Loss Function for 26 Materials (2016). This is a model-derived response table, not a complete directly measured silica response. See the [DarkELF methods paper](https://arxiv.org/abs/2104.12786) and [dielectric scattering formulation](https://arxiv.org/abs/2101.08263).

There are 249 energy nodes from 0.1 to 99.3 eV and 100 momentum nodes from 37.2895 to 37289.5 eV. Columns are energy, momentum, real epsilon and imaginary epsilon. Linear interpolation is applied to epsilon before forming Im(-1/epsilon). No out-of-grid evaluation or extrapolation is used. The upstream loader's vacuum/zero default outside its grid is not a physical statement that the omitted response vanishes.

The pinned SiO2 configuration supplies density 2.65 g/cm³ and electronic gap 9.2 eV. The principal result restricts deposited energy to at least this gap. The separate table-floor run diagnoses sensitivity to nonzero sub-gap entries and is not a validated electronic or phonon contribution. One imaginary-epsilon NaN at (8.1 eV, 37.2895 eV) is backward-filled as in the upstream loader; that cell and its neighboring interpolation region at this energy are outside incident kinematic support.

## Formula and checks

For the fixed effective products alpha_i, define A(q) = sum_i alpha_i/(q² + m_i²), with energy and momentum in eV and hbar=c=1 inside the integral. At zero temperature, for the isotropic electronic response,

    dK/dX = 2/(pi alpha_EM v² hbarc rho)
             integral dq q³ A(q)² integral dOmega Omega Im[-1/epsilon(q,Omega)].

Here hbarc = 1.973269804e-5 eV cm; the output is eV per g/cm². The energy ceiling is min(table ceiling, qv-q²/(2m_chi)). The mediator amplitudes are summed before squaring, preserving interference and the previously fixed normalization. The expression follows the charge-density response convention S/V = q² Im(-1/epsilon)/(4 pi² alpha_EM).

Replacing the energy integral with the complete electronic f-sum reproduces the free-electron stopping moment normalization, including inverse electron mass; the algebraic check agrees within 3.4e-16 relative. Refining both numerical integrations from 512 to 1024 subdivisions changes results by at most 0.023%. This tests quadrature over the fixed interpolant, not the accuracy of the material model. Source and common-parameter hashes are asserted at runtime.

Reproduce with Python, NumPy and SciPy:

    python -X utf8 docs/research/casimir-dp-silica-elf-stopping-2026-09-07.py PATH_TO_PINNED_DARKELF

The sibling JSON records inputs, coverage, refinements and all six results. No Casimir verification gate is invoked: this packet changes research documentation and exploratory calculation only, with no GR, adapter, certificate, or physical viability authority.

## Next discriminating work

Obtain or compute the missing finite-q electronic/core response above 37.3 keV with stated validity and uncertainty, or derive a controlled remainder bound. This is the unresolved material-response contribution; neither the earlier loose sum-rule envelope nor an unchecked q^-4 continuation supplies it. Only after adequate total stopping and transport can this lead claim a capture-supplied local population. A measurable boundary-dependent coherence contrast and a detector-folded xenon prediction still require separate calculations using that same population and parameter set. The LZ candidate remains an anomaly, not an established dark-matter detection.
