# IDM LZ-to-Casimir-DP bridge audit

Date: September 24, 2026 (America/New_York). Exploratory compatibility screen within the active shared-scattering goal. No selected NHM2 boson-star member or frozen Casimir-DP input is changed.

## Finding

The Inert Doublet Model (IDM) is a materially stronger bosonic LZ benchmark than the earlier generic split-scalar/vector-mediator skeleton: it specifies a renormalizable electroweak scalar sector and fixes the leading inelastic interaction to the off-diagonal `ZHA` vertex. A recent IDM preprint reports a profile best-fit point `m_H = 1080 GeV` and `delta = m_A - m_H = 369 keV` for the LZ event. This is a model-dependent fit to one candidate, not confirmation of dark matter. More importantly for our cross-experiment goal, the IDM's same endothermic `Z`-mediated channel is **closed for independent carbon-12 targets** in the frozen Casimir-DP material calculation: its minimum incident speed is about 2,449 km/s, versus the 798 km/s SHM cap used by the source analysis. The xenon threshold is about 778 km/s, and the event energy itself requires about 786 km/s under the same representative Xe-131 kinematics.

So this is a useful falsifier of the simplest shared-channel bridge, rather than a successful joint prediction. The IDM can still be a candidate for LZ. It does not currently predict an observable Casimir-DP effect through the same inelastic nuclear collision. A separate elastic or collective material response must be derived from the model and computed against the frozen experiment before claiming otherwise.

## Model and numerical reproduction

The IDM adds a (Z_2)-odd scalar electroweak doublet with neutral real states (H) and (A). The light state (H) is stable; the derivative (ZHA) coupling makes the tree-level neutral-current process (H+N\to A+N) off-diagonal. The scalar-potential parameter λ5 controls the neutral splitting. At the cited profile point, the implied magnitude is

\[
|\lambda_5|=\frac{m_A^2-m_H^2}{v^2}≈1.315\times10^{-5},
\]

with λ5 negative under the paper's convention. The coupling is fixed by electroweak charge, rather than being a freely fitted scattering normalization. The authors also include a Higgs-mediated elastic contribution, which they report to be negligible for the high-recoil fit.

For target mass `M_N`, reduced mass μ, and endothermic splitting δ, minimizing the standard inelastic `v_min(E_R)` gives

\[
v_{\rm thr}=\sqrt{\frac{2\delta}{\mu}},\qquad
E_R^\star=\frac{\mu}{M_N}\delta.
\]

The adjacent [reproducibility script](casimir-dp-idm-lz-bridge-screen-2026-09-24.py) and [JSON output](casimir-dp-idm-lz-bridge-screen-2026-09-24.json) implement these relations at the paper's profile point using isotope masses `A*u`, `u = 0.93149410242 GeV`, `v = 246.22 GeV`, and the paper's `v_esc + v_lab = 544 + 254 = 798 km/s` benchmark.

| Target/kinematic point | Reduced mass | Required speed | Result at 798 km/s |
|---|---:|---:|---|
| Xe-131 threshold minimum | 109.64 GeV | 777.8 km/s | Open, but only in the extreme tail |
| Xe-131 at 248 keV recoil | 109.64 GeV | 786.0 km/s | Open, close to the assumed cutoff |
| C-12 threshold minimum | 11.06 GeV | 2,448.5 km/s | Closed for ground-state independent-nucleus scattering |

For Xe-131 the threshold-minimum recoil is 331.5 keV; the 248 keV candidate lies away from that minimum and therefore needs a still faster incident particle. These are kinematics, not event-rate predictions. The source paper uses a Standard Halo Model with a lab speed of 254 km/s and escape speed 544 km/s, but the physical halo tail is uncertain; the speed cap is a modeling convention, not a universal astrophysical theorem.

For C-12 the momentum transfer at threshold is about 90 MeV, corresponding to a length scale of order nuclear dimensions, not the long wavelength needed to add amplitudes coherently over a macroscopic diamond object. This supports treating the specified independent-nucleus channel as closed; it does not prove that every possible collective or material excitation channel is impossible. Such a channel would need an explicit target response function and energy/momentum-conserving calculation. The existing inelastic audit also found the direct carbon upscatter closed for the earlier high-splitting benchmarks [local inelastic audit](casimir-dp-inelastic-local-audit-2026-09-06.md).

## Remaining elastic Higgs channel: a conditional ceiling

I checked the repository for an IDM-specific elastic/material kernel. None is present. The closest prior packets study other scalar Higgs portals, whose mediator and coupling structure cannot be transplanted into IDM. Instead, the paper's fixed IDM point can be passed through a deliberately generous contact-interaction ceiling.

With the IDM convention `g_hHH = 2 lambda_L v` and a zero-transfer isoscalar nucleon matrix element `f_N m_N / v`, the leading heavy-DM nucleon cross section is

\[
\sigma_n^{\rm SI}=\frac{\lambda_L^2f_N^2m_n^4}{\pi m_H^2m_h^4}.
\]

Using the paper's `lambda_L = -1.92e-4`, `m_H = 1080 GeV`, `m_h = 125.1 GeV`, and a broad `f_N = 0.26` to 0.33 scan gives `sigma_n = 8.43e-52 to 1.36e-51 cm^2`. The scan brackets commonly used Higgs-nucleon inputs; it is a sensitivity interval, not a statistical error model. Across the assumed halo support, the largest momentum transfer is approximately `2*m_H*v_max = 5.8 GeV`, much smaller than `m_h`, so treating this Higgs propagator as contact changes the amplitude by less than about 0.3%.

For an intentionally conservative elastic-scattering envelope, take the sum of all `A_obj = 1.862e11` nucleon amplitudes to be perfectly coherent at every momentum transfer: σobj ≤ σn Aobj² (μobj/μn)². With the frozen Stage-4.2R mass, 0.25 s hold, `rho_H = 0.3 GeV/cm^3`, and a speed support cap of 798 km/s, the central `f_N = 0.30` point gives `sigma_obj <= 5.15e-23 cm^2` and a single-hold visibility exponent `D <= 2*n_H*v*t*sigma_obj <= 5.71e-19`. The full f_N scan gives `D <= 4.29e-19 to 6.91e-19`. This is about `1e-16` of the registered one-sigma magnitude-precision target `0.005816`. The target comes from the Stage-4.2R forecast requirement, not measured apparatus performance.

This calculation is a conservative **Born/contact, elastic, coherent-amplitude ceiling**, not the actual solid-state response or a total local decoherence prediction. Its amplitude inequality overestimates coherent enhancement at finite momentum and hence is useful as a null-scale screen under its assumptions. It does not cover inelastic internal excitations, absorption, multiple scattering, non-Higgs IDM loop operators, halo substructure beyond the stated support, or nonperturbative response. The [updated script](casimir-dp-idm-lz-bridge-screen-2026-09-24.py) now reads the frozen apparatus JSON directly and records its SHA-256 in the adjacent output. This closes the simplest elastic Higgs portal route at the precision scale within the stated model; it does not establish a universal no-go for all IDM material channels.

## What the paper establishes, and what it does not

The IDM paper states that a complete reconstruction of the LZ likelihood requires additional detector-level information not currently public. Its profile analysis uses an extended one-event likelihood with normalized recoil and background distributions and nuisance priors. Thus its quoted best-fit point is useful as a concrete benchmark, but it is not a collaboration-approved interpretation or a fully independently reproducible detector likelihood. The official LZ result remains one 248 keV candidate with 2.6σ global significance and a maximum 3.4σ local significance across tested models; LZ has not claimed a dark-matter detection.

The IDM's local signal normalization in the paper assumes (H) supplies the local dark matter density. If instead ultralight φ boson stars or another component carry a meaningful share of the dark sector, the local free-(H) density and hence the LZ rate must be recalculated. A star population cannot simply be substituted for an incident particle flux: the cosmological formation history, mass function, local number density, and residual unbound (H) fraction all matter.

There is already a tight abundance-budget issue at the published profile point. The paper reports Ω_H h² = 0.12014, while the Planck target it adopts is Ω_DM h² = 0.1198 ± 0.0012. The central-value ratio is 1.0028: H alone saturates, and marginally exceeds, the central total-DM abundance. A substantial additional ultralight φ component therefore cannot simply be added to this benchmark in standard cosmology. It would require reducing the H relic abundance through a recalculated coupled freeze-out/conversion history or changing the cosmological assumptions. Reducing the local H fraction also reduces the predicted LZ rate linearly before any velocity or clustering effects. This makes the abundance and local-population calculation a first-class model gate, not a later correction.

This leaves three distinct questions, which should not be merged:

1. **LZ candidate:** does the official response-folded likelihood prefer the inelastic IDM spectrum over background once full detector information and sidebands are available?
2. **Casimir-DP:** can any IDM interaction that is open on the actual target produce a calculable coherence-loss signal under the frozen geometry and material response? The fitted inelastic Z channel fails the first kinematic screen for free carbon; the small Higgs elastic channel is not yet a demonstrated signal.
3. **Boson stars and halo population:** can a specified ultralight scalar form the desired compact objects while leaving a cosmologically and locally consistent abundance of the TeV IDM state? This requires a two-component abundance/evolution model, not merely both fields being bosonic.

The recent model-independent sideband study remains a separate detector-level concern. Its 271–800 keV interval is a true-recoil calculation above the LZ published DM search range, and cannot be read as a measured zero-count interval until LZ acceptance and response are folded in. The existing [shape-only sideband reproduction](casimir-dp-lz-inelastic-sideband-screen-2026-09-24.py) does not perform that response fold.

## Recommended next work

1. Keep IDM as the concrete bosonic LZ benchmark, but mark the same-inelastic-channel Casimir-DP bridge as failed under the current independent-carbon model. Do not force a connection by independently retuning couplings for the two experiments.
2. The fixed-λL Higgs-elastic channel has now been checked against a generous frozen-object envelope and is roughly 16 orders below the registered one-sigma precision. Keep that result conditional on Born/contact elastic scattering; revisit IDM only if a separately derived loop or material-excitation channel changes the rate by a defensible amount.
3. For a nonzero shared Casimir-DP signal, prioritize a different fully specified model only if it has a channel open on carbon at halo speeds and provides a common amplitude for xenon and the solid target. Require one coupling set, a nuclear and material response, exposure/likelihood, and explicit heating/force constraints.
4. Develop the boson-star/local-population branch separately: choose the ultralight field mass and self-interaction from an existing stable star solution; then solve for the heavy IDM relic fraction and local free-particle density. Only connect them if a concrete production, conversion, or gravitational capture history predicts both fractions.
5. Keep the 248 keV event, gamma-ray excess claims, and any boson-star imaging templates as separate likelihoods until a single model predicts their spectra, morphologies, rates, and uncertainties.

## Sources and status

- [IDM interpretation preprint, arXiv:2609.06571v1](https://arxiv.org/abs/2609.06571): interaction, profile point, kinematics, fixed electroweak normalization, and its detector-information caveat.
- [LZ collaboration result, arXiv:2609.02823](https://arxiv.org/abs/2609.02823): observed event, exposure, response selection, and significance.
- [Model-independent inelastic sideband study, arXiv:2609.26698](https://arxiv.org/abs/2609.26698): shape-only sideband concern and its scope.
- [Hoferichter et al., Higgs-nucleon coupling from lattice QCD and pion-nucleon data](https://arxiv.org/abs/1708.02245): a source for the Higgs-nucleon scalar matrix-element scale and uncertainty context; our wider fN scan is declared explicitly above.

Status: the IDM has passed a model-definition screen and failed the simplest common-inelastic-channel kinematic screen for the frozen carbon target. The Born/contact elastic channel has a conditional single-hold coherence-exponent ceiling; it is not an exact material response. No LZ likelihood, star population, or gamma-ray prediction is produced here. The overall compatibility goal remains open.
