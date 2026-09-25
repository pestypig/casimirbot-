# Bosonic dark-sector compatibility screen

Date: September 24, 2026. Goal milestone: candidate compatibility triage before any joint fit or new detector scan. Evidence class: source-backed scale checks and conditional model requirements; not a likelihood analysis or a physical solve.

## Decision question

Can one explicitly specified dark-sector model support the relevant bosonic gravitational structures and predict a viable subset of the proposed astrophysical gamma-ray, xenon-recoil, and interferometer signatures? These channels are linked only by the same Lagrangian and population model. Similarity of labels or energy scales is insufficient.

## Candidate-branch screen

| Branch | Inputs already anchoring it | Immediate compatibility result | What must pass next |
| --- | --- | --- | --- |
| Ultralight single field | User-supplied [Olivares et al. accreting-star imaging model](https://arxiv.org/html/1809.08682) uses constituent mass around 1e-17 eV for its Sgr A* scaling. | Standard nonrelativistic elastic scattering on xenon cannot produce a keV-scale nuclear recoil: the incident particle's kinetic energy at halo speeds is itself only of order 1e-23 eV. This rules out the ordinary single-particle LZ recoil channel for that illustrative mass. A coherent field or gravitational encounter is a different detector response and remains a separate conditional question. | Reproduce a specific stable-field/star solution; quantify permitted local field or compact-object abundance and encounter history; specify a non-gravitational xenon coupling if claiming particle recoils; calculate field-induced phase/noise with actual coupling and apparatus response. |
| GeV–TeV single boson | LZ-inspired illustrative inelastic proposal uses 45 GeV; Totani's Milky Way continuum interpretation uses 0.5–0.8 TeV; Fan et al. report a ~43 GeV line hypothesis. These are different analyses, not a combined mass measurement. | These masses can supply recoil/annihilation energies kinematically, but the respective signals require specified nucleus couplings and number-changing final states. A boson-star solution at these particle masses is not established by the ultralight Sgr A* imaging model; gravity-only, free-field structure must be recalculated, likely with any self-interaction stated explicitly. | Solve mass-radius/stability and formation for the chosen potential; establish halo abundance and phase space; compute annihilation/decay channels and external constraints; calculate xenon and sphere response using one coupling set. |
| Explicit multicomponent sector | A light field could form compact structures while a heavier boson supplies recoil or gamma channels. | This avoids forcing one constituent mass to span ~1e-17 eV and GeV–TeV, but adds independent fractions, conversion/interaction assumptions and stability constraints. It is not explanatory unless these are fixed by an explicit model rather than fitted independently to each observation. | Write the minimal Lagrangian and cosmological production/history; set component fractions and any coupling between fields; solve star structure and population; jointly propagate predicted signals and constraints with shared underlying parameters. |

The ultralight recoil screen uses the kinetic-energy ceiling E_k≈mχv²/2 and a representative halo speed v≈10^-3 c. It is an order-of-magnitude kinematic result, not a bound on coherent-field couplings, gravitational phase shifts, or rare compact-object encounters. For mχ=1e-17 eV, E_k≈5e-24 eV, over 27 orders of magnitude below a keV. Exact maximum nuclear recoil is smaller still when mχ is far below the xenon-nucleus mass.

## How the three sky observations enter

- [Cluster line paper](https://arxiv.org/html/2407.11737): reported ~43.2 GeV line and no inner-Galaxy counterpart. Treat the latter as a direct stress test of a smooth, canonical annihilation interpretation, not a nuisance to tune away.
- [Milky Way halo excess paper](https://arxiv.org/html/2507.07209): its 0.5–0.8 TeV b-bbar interpretation and quoted rate are conditional on foreground and halo assumptions and face dwarf-galaxy tension. It is not a detected particle mass or a direct-detection cross section.
- [Galactic Center Excess source-analysis PRL](https://journals.aps.org/prl/abstract/10.1103/dkcq-6y4f): diffuse Poisson-like emission remains plausible in the paper's best-fit background, with a very numerous faint-source alternative. It informs source-population discrimination, not an annihilation measurement.

Gamma-ray intensity from annihilation scales schematically with <σv>/mχ² times the line-of-sight integral of ρ² and the channel yield. Xenon scattering scales with local density/mχ and a velocity-weighted nucleus cross section. Interferometer scattering decoherence weights momentum transfers by branch separation while coherent-field and gravitational responses require separate calculations. Thus even a common particle mass does not bridge these observables without the couplings, spatial/velocity distribution, source history, target response and instrument models.

## Recommended gate and falsifiers

1. Freeze three candidate records: light single field, heavy single field, and minimal two-component sector. Record field content, masses, potential, symmetries, initial/cosmological state, fractions, ordinary-matter operators, number-changing channels, and validity ranges.
2. First close mass/kinematics and boson-star stability. Drop any branch that cannot support its claimed star or detector channel under its own equations. Do not reuse the Sgr A* metric, particle mass or stability result as generic boson-star authority.
3. For surviving branches, calculate the astrophysical population and its photon likelihood inputs; then xenon recoil spectrum/rate and interferometer phase, coherence, heating and force with the same model parameters. Preserve separate instrument likelihoods and nuisance models.
4. Admit a joint prediction only if it survives gamma foreground/source alternatives, dwarf-galaxy limits where applicable, local-density/velocity uncertainty, xenon target response and existing direct bounds, and the frozen apparatus sensitivity/force constraints.

Falsifiers include: no stable/formed star in the admitted family; annihilation forbidden or too weak for the proposed photon feature; photon morphology/line counterpart inconsistent with the model; xenon recoil kinematics or rate insufficient; or coherence below the qualified uncertainty while force/heating exceeds apparatus tolerance. A surviving parameter region is a conditional prediction, not a detection claim.

## First branch to advance

Start with the **ultralight single-field branch as the boson-star/gravity benchmark**, and explicitly label standard LZ elastic nuclear recoils as kinematically unavailable at the illustrative 1e-17 eV mass. In parallel, keep the GeV–TeV branch as the direct-recoil/annihilation benchmark. Only promote a unified or multicomponent bridge after the minimal model and its parameters are specified. This two-benchmark sequence tests the real incompatibility early and prevents the multicomponent model from becoming an unconstrained escape hatch.

No raw gamma-ray data were reprocessed, no LZ likelihood was fit, no boson-star simulation was executed, and no Casimir-DP experimental evidence was added in this screen.

## Reproducible free-field mass and recoil calculation

The accompanying [scaling script](casimir-dp-bosonic-free-field-scaling-2026-09-24.py) and JSON use the [boson-star review's free complex-scalar result](https://arxiv.org/html/1202.5809v5) Mmax=0.633 M_Pl^2/m and nonrelativistic elastic-recoil ceiling E_R,max=2 mu^2 v^2/m_Xe. Inputs include a Planck mass of 1.22089e19 GeV, Xe-129 mass approximated as 129 u, and the 798 km/s cutoff inherited from the earlier illustrative scattering screen.

| Constituent benchmark | Free-field maximum boson-star mass | Maximum Xe-129 elastic recoil at 798 km/s |
| --- | ---: | ---: |
| 1e-17 eV (Sgr A* image model) | 8.46e6 solar masses | 1.18e-53 keV |
| 45 GeV (illustrative LZ inelastic model) | 3.74e9 kg (1.88e-21 solar masses) | 126.4 keV |
| 43.2 GeV (line energy scale only) | 3.89e9 kg (1.96e-21 solar masses) | 119.1 keV |
| 0.5 TeV (continuum fit scale) | 3.36e8 kg (1.69e-22 solar masses) | 1.107 MeV |
| 0.8 TeV (continuum fit scale) | 2.10e8 kg (1.06e-22 solar masses) | 1.287 MeV |

The ultralight free-field maximum is 2.10 times the stated Sgr A* mass, an order-of-magnitude consistency check, not reproduction of the paper's profile, stability branch, accretion image, or the repository's selected simulation. In the free-field model, GeV-TeV constituent stars max out at asteroid-scale masses, far below ordinary stellar/Sgr A* scales. This does not exclude compact dark objects of those masses or alternative potentials.

The high-mass rows show that an elastic 45 GeV candidate cannot reach the central 248 keV recoil at this assumed speed cap, whereas the 0.5-0.8 TeV mass range can do so kinematically. The LZ motivated example is inelastic with a 1 MeV released splitting, so it has a separate energy source and this elastic ceiling does not apply; its earlier sphere-scattering calculation nevertheless predicted a negligible local decoherence rate under its own assumptions. Kinematic reach alone is not a rate or a fit.

A repulsive quartic self-interaction changes free-field scaling. Applying the review's asymptotic formula only as a diagnostic, matching 1 solar mass would require lambda≈4.1e8 for 45 GeV, and matching 4.02e6 solar masses would require lambda≈6.6e21; the 0.5-0.8 TeV Sgr A* values are ≈1.0e26-6.6e26. These enormous dimensionless couplings are not evidence of viable or perturbative completions. They show that a heavy single-field astrophysical-star bridge needs a materially different potential with an explicit field-theory validity analysis. No parameter tuning has been done.

Reproducibility status: script assertions passed; outputs are deterministically written to its adjacent JSON. Checks cover the Sgr A* mass ratio and whether each elastic recoil ceiling lies above or below 248 keV. They do not validate detector efficiencies, halo distributions, a boson-star numerical solver, annihilation rates, or interferometer response.

## Current branch ranking

For the combined target of an Sgr A*-scale boson star plus GeV-TeV laboratory/annihilation signatures, the **explicit two-component dark sector is the leading architecture for the next model-construction step**. The ultralight free-field branch fits the boson-star mass scale but is kinematically incapable of xenon recoils. The heavy free-field branch can yield xenon recoil energies, but its maximum stable star mass is only about 10^8-10^9 kg. Quartic self-interaction formally changes that mass scale, but the illustrative couplings needed for a solar or Sgr A*-mass object are extreme and not yet shown to define a valid particle theory.

This ranks architectures; it does not select a validated physical model or prove a no-go theorem. Preserve the self-interacting heavy single-field branch as a comparator until its field-theory validity, cosmology and observables are calculated. The next concrete task is to write a minimal two-field Lagrangian and ask whether it predicts the required light-star and heavy-particle fractions without freely tuning separate populations to each observation.
