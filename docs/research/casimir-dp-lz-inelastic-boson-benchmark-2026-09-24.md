# LZ high-recoil event and inelastic boson benchmark

Date: September 24, 2026. Goal status: exploratory model construction. This note evaluates a candidate mechanism against the September 2026 LZ extended-window result; it is not a detection claim, parameter fit, or proof of viability.

## What the new LZ result says

LZ reports one event reconstructed as a nuclear recoil of 248 +/- 23 (stat) +/- 23 (sys) keV in a 2.84 tonne-year exposure. Its profile-likelihood comparison gives 2.6 sigma global tension with background-only after the look-elsewhere effect and a maximum 3.4 sigma local significance across tested models. The preprint was submitted September 2, 2026 and was described by LZ as submitted to PRL at the time of the announcement. The event is evidence that merits follow-up, but it does not establish that dark matter caused it.

The spectral fit scans include nonrelativistic effective-field-theory operators and inelastic extensions of the spin-independent O1 and spin-dependent O4 interactions. In the inelastic O1 table, representative 1 TeV benchmarks with splittings from 200 to 350 keV have local significances around 2.7 to 3.3 sigma. These are model-conditional local values; the global result remains 2.6 sigma. The event is not a measured WIMP mass or a uniquely determined mass splitting. The 45 GeV, 1 MeV-splitting sphere calculation in earlier goal notes is a separate illustrative proposal and should not be presented as the LZ paper's preferred particle model.

Sources: [LZ announcement and result summary](https://lz.lbl.gov/), [LZ collaboration preprint, arXiv:2609.02823](https://arxiv.org/abs/2609.02823), especially its theory description and supplemental local-significance tables.

An immediate caution emerged in follow-up preprints. A September 3 Higgsino study argues that a thermal 1.1 TeV interpretation with delta around 370-490 keV can overpredict a high-energy S1c sideband, while noting that the acceptance in that bin was not public to those authors. A September 22 model-independent analysis computes true-recoil ratios over 14-225, 225-271 and 271-800 keV, and reports an optimized splitting near 339 keV at 1 TeV with about 1.9 sigma *conditional* Poisson tension, rising to about 2.5 sigma near 3 TeV. However, it also states that the 271-800 keV interval lies above LZ's published DM search window and has not yet been analyzed as a DM signal region. Therefore its high-sideband zero-count assumption is not yet an official detector-level constraint. The analysis highlights strong xenon Helm-form-factor suppression near the candidate recoil, with |F_Xe|^2 ~ 3e-4. These are early theoretical preprints, not LZ collaboration conclusions, and the sideband inference remains conditional on unpublished acceptance/response information.

Sources: [Higgsino sideband study](https://arxiv.org/abs/2609.04175), [model-independent inelastic sideband study](https://arxiv.org/abs/2609.26698).

## Reproducible shape-only sideband calculation

The accompanying [Python script](casimir-dp-lz-inelastic-sideband-screen-2026-09-24.py) and [JSON output](casimir-dp-lz-inelastic-sideband-screen-2026-09-24.json) implement the model-independent preprint's coherent spin-independent rate shape: isotope-abundance-weighted natural xenon, its stated Helm form factor, inelastic minimum speed, and truncated Standard Halo Model with (v0, vE, vesc) = (238, 232, 544) km/s. The common rate normalization cancels. At each (mchi, delta), each sideband integral is divided by the 225-271 keV integral; using N_sig=1 is only a shape normalization and does not identify the observed event as dark matter.

At mchi=1 TeV, the code finds a balanced delta=339.20 keV and sideband ratios 1.796 and 1.796, compared with 339 keV and 1.77 in the preprint. It reproduces the preprint's tabulated ratios to a few percent across delta=280-355 keV. Its natural-xenon Helm average at 248 keV is 2.55e-4, consistent with the preprint's rounded 3e-4. For masses 0.5, 0.7, 1.0, 1.5, 2.0 and 3.0 TeV, it gives balanced splittings about 332.55, 336.09, 339.20, 341.97, 343.43 and 344.91 keV, with per-sideband ratios 0.51, 1.23, 1.80, 2.20, 2.38 and 2.55. The preprint's corresponding rounded values are <0.5, 1.21, 1.77, 2.17, 2.35 and 2.51. A 4001-to-8001 energy-grid refinement changes the 1 TeV sideband ratios by less than 3e-7 relative; this checks numerical integration only, not the input model.

The preprint reports a joint halo/form-factor variation envelope of roughly delta*=310-379 keV and a conditional zero-sideband Gaussian-equivalent range 0.6-3.5 sigma at 1 TeV; the script does not independently reproduce that multidimensional systematic scan. The shape calculation omits LZ's event-selection acceptance, energy resolution, background likelihood and high-energy sideband response. It therefore verifies the published kinematic/form-factor calculation at approximate level, not the observed-count interpretation or a detector exclusion.

The LZ article makes the response gap concrete. Its WIMP signal ROI requires S1c=3-600 phd, S2>645 phd, and S2c=10^2.75-10^4.15 phd; it reports an average 96% NR signal efficiency only over 14-250 keV. The event itself has S1c=540.1 phd at reconstructed 248 keV, close to the ROI's upper S1c edge. LZ also uses an 800-1700 phd high-energy S1 sideband to validate MSSI backgrounds. That measured-space sideband is not the same as the theory preprint's true-recoil 271-800 keV interval. Therefore the high-true-recoil ratio cannot be treated as a directly observed zero-count LZ sideband without folding a recoil spectrum through the NEST/BACCARAT response and the exact cuts. The event S1/E ratio would put the 600-phd boundary near 275.5 keV under a naive linear extrapolation, but the event is 1.5 sigma below the NR-band median; this is only a diagnostic warning, not an efficiency estimate.

LZ states that its tuned NEST v2.4.5 response parameters are in the Data Release. The linked HEPData record returned HTTP 403 from this environment on repeated requests, so those parameters and any detector-level high-recoil acceptance have not been extracted.

As a bounded follow-up benchmark, the shape-only scan favors testing mchi=0.5-0.7 TeV and delta near 333-336 keV before the 1 TeV point: it minimizes the conditional sideband burden within the chosen mass grid and overlaps the mass range of the separate Milky Way continuum fit. This is a computationally convenient, favorable benchmark, not an LZ best fit, a DM inference, or a joint gamma-ray fit. Any fit to the gamma spectrum still needs its own channel yield, morphology, astrophysical nuisance model and likelihood.

## Candidate bosonic mechanism

Use two dark sectors with distinct jobs:

1. A light complex scalar phi with an approximate global U(1), mass benchmark m_phi ~ 1e-17 eV, and a repulsive self-interaction can be tested as the boson-star-forming field. Its mass and self-interaction must be solved against the chosen star family; the EHT imaging paper is a model benchmark, not a measured local flux.
2. A heavier complex scalar X, split into two nearly degenerate real states X1 and X2, supplies an inelastic halo-scattering channel. Let delta = m2 - m1 be a candidate splitting in the 0.2-0.35 MeV interval and take m1 in the 0.4-4 TeV scan range used in the LZ interpretation tables. These are scan coordinates motivated by the paper, not fitted values.

A minimal low-energy interaction structure is

```text
L contains |D_mu X|^2 - m_X^2 |X|^2
         - (mu_b^2/2) (X^2 + X*^2)
         - (1/4) F'_mu_nu F'^mu_nu - (epsilon/2) F'_mu_nu F^mu_nu
         + |partial_mu phi|^2 - m_phi^2 |phi|^2 - lambda_phi |phi|^4
         - (lambda_phiX/2) |phi|^2 |X|^2 .
```

Here D_mu = partial_mu - i g_D A'_mu. The small soft-breaking term splits the real states; for small splitting, delta is approximately mu_b^2/m_X. In the mass basis the dark-vector interaction is off-diagonal, proportional to g_D A'_mu (X1 partial^mu X2 - X2 partial^mu X1). Kinetic mixing epsilon gives A' a coupling to the electromagnetic current. This is a model skeleton: its full potential, symmetry assignments, mass eigenstates, and radiative stability still need an explicit derivation before numerical claims.

The same g_D and epsilon, with one mediator mass m_A', determine the momentum-dependent X1-to-X2 scattering amplitude. LZ and a matter-wave interferometer would then use the same kernel, but integrate it against very different target and momentum-transfer responses. For a 248 keV xenon recoil, q is about 0.25 GeV. The Casimir-DP setup may probe much smaller transfers set by its branch separation and material form factors. If m_A' is not heavy compared with both momentum scales, a contact-interaction extrapolation between the experiments is invalid; the propagator, screening, and material response must be retained.

## The potential bridge and its limits

- **LZ recoil:** X1 + Xe -> X2 + Xe is endothermic upscattering. A splitting changes the minimum incident speed and can suppress low-energy recoils while allowing a high-energy event. The prediction needs the actual halo speed distribution, isotope mixture, nuclear form factors, detector response, exposure, and background likelihood. The 248 keV event alone must not be normalized as one expected signal count.
- **Interferometer:** the same differential cross section can enter the which-path decoherence kernel, weighted by the momentum-transfer phase across the two paths. The prediction also needs the sphere's charged constituents, screening, dielectric response, finite-size form factors, geometry, branch history, and environmental losses. LZ's nuclear response cannot be copied to a macroscopic neutral object.
- **Gamma rays:** if m_A' < m_X, X-pair annihilation to dark vectors may occur; the vectors can decay to Standard Model states through epsilon and yield photons. That is a possible common-sector route, not a prediction yet. Its rate depends on g_D, epsilon, m_A', the relic history, and the heavy-component density fraction. A b-bbar spectrum specifically requires suitable mediator mass and branching fractions. The reported 0.5-0.8 TeV b-bbar fit and the cluster line are separate hypotheses; this model does not explain either until the photon spectrum, morphology, and constraints are computed.
- **Boson stars:** phi can form the compact gravitational structures. The cross-quartic lambda_phiX is the only explicit link in this skeleton. It can alter production, conversion, or the star's effective environment, but no useful relation between the star abundance and the local X1 flux follows from merely writing this term. A cosmological history must predict both component fractions and any conversion rate. If that fails, the two sectors are just coexistence, not a predictive bridge.

## Immediate exclusions and pass criteria

The simple one-state Higgs-portal scalar is not an adequate first model of this LZ feature: it has no excited state and therefore cannot realize the paper's inelastic splitting. A Higgs portal could be added for annihilation, but it is an extra interaction and must be tested against direct-detection, collider, relic-density, and gamma constraints. The vector-mediated split-scalar candidate is more faithful to the inelastic lead and naturally defines one momentum-dependent scattering kernel for both LZ and decoherence.

Advance this candidate only if one fixed point or bounded region in (m1, delta, m_A', g_D, epsilon, lambda_phiX, m_phi, lambda_phi, f_X, f_phi) can:

1. reproduce the LZ recoil likelihood better than background-only without treating the single event as confirmed signal;
2. predict a detectable interferometer change with the same scattering kernel and admitted local X abundance, while respecting force, heating, and shielding controls;
3. satisfy a stable, formed boson-star solution and an explicit cosmological population calculation for phi and X;
4. survive laboratory, astrophysical, cosmological, and gamma-ray constraints; and
5. make a falsifiable photon prediction only for one selected gamma dataset and channel, rather than combining unrelated excesses by label.

The first shape-only calculation is now reproducible at approximate level. The next calculation must acquire or reconstruct detector-level acceptance, response and event-count information for the high-energy region, then determine whether the published true-recoil sideband concern is an actual LZ likelihood constraint. The HEPData endpoint was inaccessible from this environment in the last attempt; no likelihood fit was made. Only after that response question is resolved should a split-scalar UV completion be folded through the existing LZ and Casimir-DP response interfaces. Do not yet retune the NHM2 selected boson-star candidate or alter the frozen Casimir-DP apparatus configuration.

## Disposition

This remains the leading *mechanism-shaped benchmark to stress-test*, because it is explicitly inelastic and can use a shared momentum-dependent scattering kernel. The published shape screen exposes a potentially strong sideband/form-factor challenge, but whether that challenge excludes a physical model is unverified until LZ response information is incorporated. No coupling point, local density, detector count, coherence loss, photon flux, or star population has been calculated. The light-field/heavy-particle multicomponent architecture remains a hypothesis with a strong mass-scale rationale, but its predictive value depends on deriving the component fractions rather than fitting them independently.
