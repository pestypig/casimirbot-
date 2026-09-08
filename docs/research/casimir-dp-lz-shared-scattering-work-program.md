Program gate: S1 — define and screen common scattering kernels.
Workstream: Independent exploratory Casimir–DP / LZ prediction-model research.
Capability or component: Joint xenon recoil and local center-of-mass coherence predictions.
Current maturity: Exploratory; no fitted common mechanism or measured local residual.
Target maturity: Reproducible conditional prediction model with uncertainty and falsification tests, reviewed with the user.
Required frozen inputs: Canonical Casimir–DP article and Stage-4.2R configuration; versioned experimental releases and microscopic interactions.
Required evidence: One parameter set, two target responses, physical normalization, survival accounting, external constraints and independent checks.
Stop/fail criteria: Reject unsupported shared-cause claims, separately fitted target couplings, invalid momentum extrapolations and unqualified sensitivity claims.
Explicit non-goals: No baseline retuning, hardware authorization, detection claim, Theory Graph promotion or certificate change.
Downstream gate unlocked: S2 joint forward calculation after S1 requirements are met.

# Shared-scattering prediction-model work program

Created September 6, 2026, America/New_York. Status: **active research goal**.

## User objective and completion standard

The user requested an ongoing goal: pursue the best leads for a specific scattering interaction that predicts both xenon recoils and the proposed experiment's coherence loss with the same parameters, until the prediction model is satisfactory.

This document is the roadmap for that comparison only. It does not replace the canonical Casimir–DP commissioning program. Dated research packets remain evidence snapshots. Completing one packet does not complete this goal. A final candidate must be presented for the user's assessment; numerical agreement alone must not be described as experimental validation.

User steering (September 7): prioritize a measurable signal in both experiments. Conditional local-null models remain comparison controls; they must not replace the measurable-overlap research priority. Do not manufacture a signal or relax physical constraints to achieve that priority.

Working acceptance criteria:

1. Specify the interaction, applicable approximations, units, particle mass/state populations, mediator parameters, target couplings and incident distribution.
2. Predict the xenon spectrum and local coherence magnitude/phase from that same specification, including event loss and heating where relevant.
3. Authenticate experimental normalization and propagate its uncertainty; when inputs are unavailable, expose that limitation instead of supplying a best fit.
4. Audit relevant existing exclusions, transport/shielding, target structure and approximation validity over the proposed parameter region.
5. Produce reproducible curves, uncertainty ranges, null predictions and discriminating experimental changes. Compare predicted effects with qualified apparatus uncertainty when such evidence exists.
6. Explain what would reject the model, and distinguish a conditional model from a measured shared cause. Iterate with the user before marking the overall goal complete.

A common model that predicts no accessible local signal is a valid result, but not a detectable-overlap claim. If all investigated models fail, report that outcome and the remaining gaps; do not invent an interaction merely to achieve agreement.

### Registered design sensitivity (recovered September 7)

The Stage-4.2R [readiness report](casimir-dp-integrated-feasibility-pilot-stage4-2r-report.md) already defines a forecast-based precision requirement: visibility loss 0.029080253747730156 at SNR 5, implying one-sigma magnitude uncertainty <= 0.005816050749546031. Use this as an existing design benchmark for comparisons; it is neither measured performance nor a lower bound on achievable uncertainty. Earlier conversational requests for a design target overlooked this registered requirement. No new user choice is required to use the existing benchmark.

At uncertainty equal to that ceiling, the conditional exothermic rigid-channel ceiling D=4.955410934904939e-8 would have signal/uncertainty about 8.52e-6, requiring approximately 586838-fold improvement in precision for SNR 5. This comparison inherits the magnetic-screen and rigid-channel assumptions and does not exclude every interaction. Compare 1-exp(-D), not D itself, with the visibility magnitude requirement.

Absolute coherence and the four-cell boundary cross-ratio remain separate estimands. A factor identical in the active and reference cells cancels from the cross-ratio even if it changes absolute visibility. A boundary signal requires a model-specific difference plus covariance propagation. The eight absent empirical packets in the readiness report cannot be replaced by this design comparison.

## Frozen baseline and completed exclusions

Use `docs/research/casimir-dp-quantum-foam-study.md` and `configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json`: diamond-density sphere, radius 276.302362 nm, mass 3.0925052683774525e-16 kg, separation 250 nm, hold 0.25 s, DP width 100 nm. Preserve branch histories and readout definitions; a constant-separation hold is only an explicitly labeled approximation.

The local DP forecast is a comparator, not an observed residual to be fitted. Any alternative scattering signal is computed separately. Adding DP and scattering requires an explicit independent-mechanisms assumption and must not count one putative cause twice.

Completed packets:

- `casimir-dp-lz-mechanism-bridge-research-2026-09-06.md`: frozen DP hard-kick obstruction, free-carbon inelastic threshold, gravitational-scattering benchmark and common-kernel formalism.
- `casimir-dp-xenon-constituent-radiation-followup-2026-09-06.md`: constituent radiation and ideal finite-sphere comparisons.
- `casimir-dp-xenon-response-rdf-audit-2026-09-06.md`: historical efficiency diagnostic and additive-atom radiation bound. This branch cannot supply an appreciable LZ event rate at frozen parameters under its stated assumptions.

## Current gate S1: model definitions and discriminating screens

The [LZ paper](https://arxiv.org/html/2609.02823v1) uses inelastic isoscalar O1 and elastic isoscalar L10 as illustrative examples; L10 describes a magnetic-moment interaction. Its nuclear spectra use WimPyDD and specified nuclear response matrices. Its plotted Higgs scale is a normalization convention. Preserve the actual operator definitions instead of inferring a photon propagator, Higgs mediator or carbon response from the model name.

| Lead | Role in comparison | Required next evidence |
|---|---|---|
| Elastic spin-independent finite-mass mediator | Transparent baseline connecting low and high momentum transfer | Explicit potential/amplitude, coupling convention, nuclear and whole-object responses; contact and light-mediator limits |
| LZ inelastic O1 | High-energy xenon example and a possible local null prediction | Authenticated normalization; splitting/state populations; free-nucleus thresholds before any bound-solid extension |
| LZ elastic L10 | Operator-specific alternative to the simple scalar baseline | Exact covariant-to-nonrelativistic reduction; isotope responses; atomic/solid low-q completion |

The first row is a tractable comparison model, not a claim that it is favored by the event. A mediator propagator can connect momentum scales, but cannot be chosen independently at each target. Proton, neutron and electron couplings must follow the chosen model. Include an infrared regulator or physical screening where required; do not manufacture an infinite decoherence rate from a divergent scattering integral.

The established [soft-scattering decoherence framework](https://arxiv.org/abs/1609.04145) motivates using the momentum-dependent coherence filter and target structure, with environmental shielding considered. Its sensitivity to light particles does not establish that those particles can produce the LZ high-energy recoil.

### New kinematic screen recorded at goal creation

For an elastic halo particle scattering from a stationary free Xe nucleus, use mean mass m_A = 122.298655189 GeV and a diagnostic maximum lab speed v = 776 km/s. At E_R = 248 keV,

\[
\mu_{\rm required}=\sqrt{m_A E_R/(2v^2)},\qquad
m_{\chi,\min}=\frac{m_A\mu_{\rm required}}{m_A-\mu_{\rm required}}.
\]

In natural units v is divided by c. This gives μ_required = 47.575204636 GeV and m_chi,min = **77.865563011 GeV**. A 100-MeV particle at the same speed has E_R,max = **0.00109390705 keV**, about 1.094 eV. Therefore the sub-100-MeV elastic-halo examples motivating soft-scattering detection cannot simply be reused as a common explanation for this recoil. The screen does not cover exothermic, boosted or multi-component models; those require a new energy and population account. Mean-isotope mass and central recoil energy make this a benchmark, not a confidence bound.

Replay (standard-library Python):

```python
import math
mA = 131.293 * 0.93149410242
v = 776 / 299792.458
ER = 248e-6
mu = math.sqrt(mA*ER/(2*v*v))
mmin = mu*mA/(mA-mu)
m = 0.1
emax_keV = 2*(m*mA/(m+mA))**2*v*v/mA*1e6
assert abs(mmin-77.86556301055496) < 1e-9
assert abs(emax_keV-0.0010939070504773977) < 1e-12
print(mmin, emax_keV)
```

### Normalization strategy

In a single-channel weak-scattering model with a common multiplicative strength A and remaining parameters ψ, define the response-integrated xenon count λ_Xe = A K_Xe(ψ), and local visibility exponent D = −log|C/C0| = A K_coh(ψ). Then

\[
\frac{D}{\lambda_{\rm Xe}}=\frac{K_{\rm coh}(\psi)}{K_{\rm Xe}(\psi)}
\]

when K_Xe is nonzero. Each kernel includes its actual exposure or branch-history duration, so this ratio is dimensionless. This is an original algebraic strategy, not a fitted result. First calculate the ratio, then propagate an authenticated allowed count/coupling distribution. Do not set λ_Xe = 1 just because one event is under discussion. Coupling-dependent transport, multiple interfering terms or saturation can invalidate factorization; in those regimes evaluate the full parameter dependence instead.

S1 exit requires one fully specified kernel and its validity domain, reproduced analytic limits, a target-response prescription, and a parameter/input ledger distinguishing authenticated values, chosen benchmarks and unavailable inputs. S1 remains open.

### Current prioritization

The user has explicitly chosen measurable signals in both experiments. That preference is settled. Earlier dated reviews that treated it as pending are historical snapshots; their small-local-signal defaults do not govern the active priority. No qualified measurable-overlap model has yet been admitted, and the DP forecast is not an observed residual to fit.

The visible 10 MeV captured-dark-photon completion is now demoted by the [strong transport laboratory screen](casimir-dp-strong-transport-visible-screen-2026-09-07.md) within its stated coupling and decay assumptions. The transport pilots remain conditional method evidence. Before another detailed detector calculation, require a separately specified laboratory-surviving completion and a quantitative route to measurable local coherence; changing mass or opening dark decays requires new shared-rate and population calculations. No such replacement point is admitted yet.

Current disposition:

- Axion, absorption and the symmetric vector-plus-radial-scalar benchmark remain comparison controls or incomplete matching/response tasks. A tiny computed local component does not satisfy the user's priority.
- Compact elastic composites at the tested force-limited ranges and their tested surface-mode additions are deprioritized. The family bound and mode calculations retain their Born and response limitations.
- Independent arrival clustering and a shared incident direction do not supply the previously illustrated perfectly aligned-kick enhancement. Correlated impact geometry would require an explicit joint kernel and mechanical companion.
- A contemporaneous CASPAR beam is rejected as the source of the June 2023 event by the facility operating history. Future accelerator tests are separate experiments.
- Extended scalar-field mechanics remains unresolved pending actual branch dynamics, confinement and medium-response evidence; earlier percent-level fixed-trajectory examples are not admitted predictions.

The LZ response release was not retrieved in the latest access audit. Raw true-recoil integrals are neither accepted-event predictions nor official exclusions. Qualified local uncertainty and the canonical boundary cancellation also remain requirements. Do not substitute another null control or an unrelated prospective experiment for the original shared-model objective.

## Subsequent gates

The dated progress records preserve the evidence for completed screens and their specific limitations. Gate S1 remains open; none of those component calculations independently satisfies the following full-model requirements.

| Gate | Deliverable | Requirement to advance |
|---|---|---|
| S2: shared forward predictions | Xenon spectrum; local coherence, phase, survival and heating; parameter sweeps | One parameter set and independent normalization/dimensional checks; no unjustified macroscopic enhancement |
| S3: empirical constraints | Applicable detector likelihood or clearly limited surrogate, external limits and uncertainty envelope | Verified source conventions; no missing background treated as zero; qualified exclusions |
| S4: discrimination and review | Prediction-model packet with observable changes and falsifiers | Explain separation/hold/orientation/material/time dependences, ordinary backgrounds and sensitivity gaps; user review |

For a spatially homogeneous incident distribution with unchanged target/branch histories, a Casimir-boundary change need not change scattering. Explicitly compute which terms survive the canonical readout's cancellations. A total scattering rate that cancels from that observable is not a predicted residual.

## New-lead intake and progress records

- 2026-09-07: [Exothermic constraint synthesis](casimir-dp-exothermic-magnetic-screen-2026-09-07.md) combines the all-speed rigid envelope with a declared 2025 muon magnetic-moment Gaussian screen: D <= 4.96e-8 for alpha_D <= 1, no cancellation. Direct and additive rigid channels demoted; no full-model exclusion or measured sensitivity claimed. Reopening criteria and resonance-table coverage gaps recorded.


- 2026-09-07: [Exothermic population requirements](casimir-dp-exothermic-population-requirement-2026-09-07.md) inverts the conditional additive envelope. Even hypothetical D=1e-6 requires f_H <= 1.16e-10 at fixed xenon normalization, over 53 million below the source-like fraction. Necessary only; no viable population, laboratory allowance, or measurable signal established.


- 2026-09-07: [Exothermic additive coherence envelope](casimir-dp-exothermic-additive-coherence-2026-09-07.md) tests maximal coherent addition of the prior effective nuclear amplitudes. Conditional D ceiling 3.49e-22 at f_H=0.0062; not a microscopic solid bound. Coherent addition alone does not rescue the source-like benchmark. Python/JSON retain input provenance.


- 2026-09-07: [Exothermic elastic companion bound](casimir-dp-exothermic-companion-bound-2026-09-07.md) retains the intermediate-state resolvent and derives an independent-carbon second-Born upper D=8.91e-34 at conditional f_H=0.0062. Coupling/population degeneracy made explicit; no full matching, collective-response bound, or model exclusion claimed. Python/JSON checks reproduce the potential integrals.


- 2026-09-07: Newly inspected exothermic primary 2609.05204v1 screened at its illustrative normalization: independent-carbon direct-channel D <= 1.65e-25 per frozen hold. Demoted for measurable-in-both priority; no full-model exclusion, official likelihood, or population/lifetime validation. See [packet](casimir-dp-exothermic-new-proposal-2026-09-07.md).


- 2026-09-07: [Semivisible mass-family bound](casimir-dp-semivisible-mass-bound-2026-09-07.md) derives Gamma<=alpha_eff^2 m2^5/(6 pi mA^4) and a lab-length floor of 211.944 m for a 50 GeV parent across allowed two-body light masses. At most 4.61 percent decay within a chosen 10 m path; mass changes alone do not make this transition predominantly prompt. No full laboratory recast or general semivisible exclusion follows.


- 2026-09-07: [Semivisible lifetime benchmark](casimir-dp-semivisible-lifetime-2026-09-07.md) computes the 6-to-3 MeV Dirac transition through the 10 MeV vector at the fixed strong product. Proper length is 34.9 m; a chosen 50 GeV parent implies lab length >=124 km and <=8.1e-5 decay probability within 10 m. This specific example does not provide a prompt-visible acceptance escape; no general semivisible exclusion follows.


- 2026-09-07: [Defined invisible escape screen](casimir-dp-strong-invisible-escape-2026-09-07.md) adds a 1 MeV unit-charge Dirac daughter and tests alpha_D<=.1, epsilon<=.01 at the fixed strong product. Conditional NA64 missing-energy yield exceeds the archived limit by at least 11.14; no full efficiency/finite-width recast or broader-completion exclusion is claimed. Do not treat invisible branching alone as a viable replacement.


- 2026-09-07: [Strong transport visible-mediator screen](casimir-dp-strong-transport-visible-screen-2026-09-07.md) finds continuous published/recast exclusion coverage for both old-root and scale-3.9 products with alpha_D<=1, epsilon<=.01 and standard electron-pair decay. Demote this completion before further detector work; altered masses/decays require new matching and screening.


- 2026-09-07: [Timed Xe replay and pulse-merging intake](casimir-dp-xenon-timed-replay-2026-09-07.md) adds collision flight times with exact replay of five existing histories batches. LZ SR1 MIMP paper supplies approximate S1/S2 merging scales, but not transferable WS2023 selection. Applicable drift, width and pulse-area response remains required.


- 2026-09-07: [Coupled rock-Xe pilot](casimir-dp-coupled-xenon-pilot-2026-09-07.md) preserves entry angles and weights, verifies crossing normalization, and executes energy-updating Xe histories. Exactly-one-above-5.4-keV predicates remain about 1.5e8-2.4e8 before pulse selection; ESS only 13-15. Direct high-bin events are unsampled, not zero-rate. No accepted-count or shared-model admission follows.


- 2026-09-07: [Energy-updating Xe transport](casimir-dp-xenon-recoil-transport-2026-09-07.md) implements Helm null-collision sampling with recoil records and per-history energy conservation. Slow particles lose energy through many soft recoils; individual-threshold multiplicity differs sharply from total collision multiplicity. No LZ pulse selection or coupled incident-spectrum prediction yet.


- 2026-09-07: [Soft Xe loss audit](casimir-dp-xenon-soft-loss-2026-09-07.md) separates total collisions from recoil-threshold integrals. At 150 km/s tau_total=6.35 but tau_above_5.4keV=0.18; initial-speed loss is 46 percent of kinetic energy. Near 99 km/s the fixed-speed loss exceeds incident energy, demonstrating that energy-updating detector transport is required. No pulse-efficiency inference follows.


- 2026-09-07: [Slow xenon opacity](casimir-dp-slow-xenon-opacity-2026-09-07.md) finds Helm optical depth 14.24 at 98.77 km/s versus 0.2395 at 776 km/s in the inherited diagnostic 300 g/cm2 column at scale 3.9. Slow thin-target counts are not selected-event predictions. Next require explicit xenon transport and resolvable-scatter selection; neither exclusion nor candidate rescue follows.


- 2026-09-07: [Full raw low-energy Xe fold](casimir-dp-weighted-low-xenon-2026-09-07.md) finds scale-3.9 raw high counts about 0.88-1.01 but low counts 4.6e8-8.5e8 in the inherited thin-target model. Low-band ESS falls to 3.05; no precise fit or selected-event count follows. Suspend strong-root normalization claims pending detector optical-depth/multiple-scatter audit; captured population remains unresolved.


- 2026-09-07: [Weighted lower-energy transport](casimir-dp-weighted-low-transport-2026-09-07.md) resolves scale-3.9 outgoing flux with a 1 keV capability cutoff. Controls agree, but rare-tail runs give far-exit ESS 75.9 and 8.73, with up to 30.6 percent from one history. Saved weighted arrays enable spectrum folding; no precise normalization, detector prediction or capture density is claimed.


- 2026-09-07: [Lower-energy transport pilot](casimir-dp-lower-energy-transport-2026-09-07.md) extends unbiased slab histories to 5.4 and 1 keV Xe capability, preserving terminal arrays. At old-root scale, far exits rise from about 25 percent to 65 percent; strong scale 3.9 remains unresolved by ordinary rare-tail sampling. No detector fold or captured population follows. Next extend weighted transport below the old high-window cut.


- 2026-09-07: [Shared Bose/contact xenon normalization](casimir-dp-bose-contact-xenon-2026-09-07.md) uses one density-contact C for an illustrative truncated Gaussian population and mean-A uniform Xe target. At 100 GeV, stimulated D upper/raw high count is 2.33e-32 with raw low/high ratio 4.53e5. Deprioritize this contact-statistics rescue; no detector fit, total-coherence bound or exclusion is claimed.


- 2026-09-07: [Finite-time Bose envelope](casimir-dp-bose-finite-time-bound-2026-09-07.md) derives D_B <= C^2 Q^2 T^2 n^2 for the stimulated term of a weak contact-density interaction in a number-diagonal Gaussian boson state. At 100 GeV and benchmark density the unit-C coefficient is 2.65847e-18. No cold-width divergence, total-decoherence bound, supplied cloud or xenon fit is inferred.


- 2026-09-07: [Occupied final-state screen](casimir-dp-bose-final-state-screen-2026-09-07.md) computes Gaussian pair overlap and zero-drift correlation time. The 100 GeV unit-occupation example has a normalized overlap branch filter 8.17e-11 and correlation time 4.06e6 s, invalidating a Markovian cold-endpoint extrapolation. No absolute rate or general cold-population exclusion follows.


- 2026-09-07: [Bose occupation screen](casimir-dp-bose-occupation-screen-2026-09-07.md) inspects arXiv:2606.00237v1. For the stated smooth Gaussian population, heavy elastic-Xe-compatible masses have peak occupation below 7.1e-39; stimulated decoherence is negligible in that family. Cold or captured states require a separately derived population and final-state kernel. No measurable shared point admitted.


- 2026-09-07: Recorded published LZ gains and ER response parameters in [ER response intake](casimir-dp-lz-er-response-intake-2026-09-07.md). Full response remains unauthenticated; prioritize a defensible measurable-coherence estimate before detailed xenon folding for new candidates. Goal remains active.


- 2026-09-07: [Virtual independent-spin component](casimir-dp-virtual-spin-bubble-2026-09-07.md) uses the conditional contact spin coefficient and authenticated unscreened independent response. Pauli normalization gives a constant response ratio 2.60943e-17 and covered D <= 1.65683e-42. Not an interacting spin or total material bound. Both resolved electronic components remain tiny; deprioritize further numerical refinement without a substantive matching or mechanism change. S1 active.


- 2026-09-07: [Virtual leading-density component](casimir-dp-virtual-leading-density-2026-09-07.md) reduces the conditional scalar/spin-2 coefficients at leading NR order and applies the authenticated contact response. At unchanged xenon normalization, covered D is 3.58490e-43 with LFE, 4.60190e-43 without. This is a conditional component, not a complete model or material bound; spin, binding, nonforward and complete-diagram gaps remain. Deprioritize further precision on this tiny density term. S1 active.


- 2026-09-07: [Conditional scalar/spin-2 extraction](casimir-dp-electron-scalar-twist-fit-2026-09-07.md) separates the forward motion dependence under a two-operator ansatz. Candidate coefficients are stable across sampled momenta; each coefficient separately approaches C7 within 0.25 percent at a validation mass ratio of 30. This strengthens forward normalization only; binding, nonforward, spin-response and complete-diagram requirements remain. No rate admission; S1 active.


- 2026-09-07: [Forward electron-motion check](casimir-dp-electron-forward-motion-2026-09-07.md) generalizes the vector trace to moving on-shell electrons. At 30 and 100 keV/c the normalized coefficient changes by 0.0573 and 0.6423 percent. Rest recovery and numerical checks pass; this is not a nonforward or bound-material error bound. Next identify finite-transfer operators before material folding. S1 remains active.


- 2026-09-07: [Forward vector-pair spin operator](casimir-dp-electron-box-spin-operator-2026-09-07.md) retains full external spin blocks and finds conditional Pauli-dot coefficient -1.23585e-12 GeV^-2, comparable to the SI coefficient. Matrix algebra and coordinate checks pass. This specified diagram pair is not complete Majorana matching; retain distinct material density/spin responses and do not infer a rate from the spin trace. S1 active.


- 2026-09-07: [Electron-line Ward check](casimir-dp-electron-box-ward-2026-09-07.md) verifies both vector-index contractions on 24 full external-spin blocks, residual <=2.20e-16, with wrong-sign control residual 2. The conditional forward SI coefficient is 1.80308e-12 GeV^-2 at unchanged coupling. This closes forward electron-line longitudinal cancellation only; Majorana/operator and finite-momentum/material work remain. No signal admission; S1 active.


- 2026-09-07: [Electron heavy-limit check](casimir-dp-electron-box-heavy-limit-2026-09-07.md) finds equal-sign trace-sum/reference ratios 1.02125, 1.00225 and 1.000046 as mediator/dark mass ratio increases from 10 to 100. Supports forward SI magnitude normalization only; Majorana/gauge/operator checks remain. An excessively tight preliminary quadrature hit subdivision limits; accepted runs use documented tolerances with warnings fatal. No candidate retuning or signal admission.


- 2026-09-07: [Forward electron vector spin trace](casimir-dp-electron-box-spin-trace-2026-09-07.md) verifies the normalized numerator with explicit gamma matrices and integrates both routing families. Values +0.0649603 and -0.0637219 GeV^-2 remain uncombined pending Majorana signs, gauge and known-limit checks. Coordinate refinements agree below 5.5e-12 relative. These are not squared amplitudes or rates; next resolve physical diagram conventions before material folding. S1 remains active.


- 2026-09-07: [Full-gap electron scalar masters](casimir-dp-electron-box-scalar-master-2026-09-07.md) derives positive forward box denominator families retaining the 10 MeV splitting and 300 MeV mediator. Two coordinate integrations agree below 9e-12 relative. These GeV^-4 scalar integrals are not electron amplitudes: tensor numerators, diagram conventions, gauge checks and operator matching remain the next substantive work. No rate or sensitivity promotion; S1 remains active.


- 2026-09-07: [Fluctuation-readout intake](casimir-dp-fluctuation-readout-intake-2026-09-07.md) assesses arXiv:2602.23427v1. Its many-output enhancement cannot use the nuclei of a single rigid sphere as independent readouts. A total-variance calculation identifies common classical noise as a required control; the explicit example gives 102.01 times binomial variance without dark matter. Retain as a future protocol lead only, with no frozen-apparatus sensitivity promotion. S1 remains active.


- 2026-09-07: [Matched whole-sphere resonance](casimir-dp-matched-sphere-resonance-2026-09-07.md) finds z=0.00393830 versus first threshold pi/2 in the uniform nuclear optical potential. The unchanged 300 MeV xenon-normalized component is nonresonant. Reaching threshold formally needs 159082 times W_C, requiring new nuclear/transport/constraint validation rather than retaining the original xenon prediction. Analytic and radial numerical scattering lengths agree; no material-wide exclusion or signal admission. S1 remains active.


- 2026-09-07: [Slow resonance resolution](casimir-dp-slow-resonance-resolution-2026-09-07.md) derives the isotropic elastic s-wave filter 1-sinc(k*d)^2 and verifies five angular integrals. The fixed-density unitarity envelope vanishes at zero speed. Its formal independent-carbon D=0.08536 peak fails the dilute-target/solid-response assumptions (overlap diagnostic 1.27e10) and is not admitted as a signal. Next require finite-object scattering and a common fast/slow population budget; S1 remains open.


- 2026-09-07: [Independent-carbon resonance ceiling](casimir-dp-carbon-resonance-ceiling-2026-09-07.md) applies elastic s-wave unitarity beyond Born. At 776 km/s and the illustrative minimum mass for a 248 keV Xe recoil, D <= 1.77414e-8; at 100 GeV, D <= 1.30576e-8. This is not an all-material, all-partial-wave or halo-averaged bound. A promising resonance lead needs an explicit additional response or consistently transported population. Python/JSON preserve the frozen configuration; S1 remains active.


- 2026-09-07: [Nominal efficiency envelope](casimir-dp-virtual-efficiency-envelope-2026-09-07.md) applies the published nominal 50-percent efficiency window to all six virtual-scan spectra. The 300 MeV row retains at least 90.2103 accepted low-origin events per expected accepted high-origin event. This is a true-energy-origin ratio bound, not reconstructed-bin inference or a likelihood exclusion. Overall normalization cannot remove this spectral issue. Reproducible Python/JSON added; measurable shared-signal priority and S1 remain active.


- 2026-09-07: Added explicit binary-readout shot scenarios to separate the DP forecast from measurability. At hypothetical V=0.5, nominal z=5, D=5.58e-4 has a conservative budget of 1.28e9 accepted shots; not an instrument forecast or universal lower bound. Measured visibility/throughput/systematic-floor input requested. See [scenarios](casimir-dp-coherence-shot-scenarios-2026-09-07.md).


- 2026-09-07: Yukawa arrival envelope includes an explicit exponential-tail bound. At the 300 MeV candidate envelope D<=0.0005583443 in the static eikonal model; only genuinely longer-range variants evade this screen. Illustrative mass variants are not new xenon normalizations. See [tail bound](casimir-dp-yukawa-arrival-tail-2026-09-07.md).


- 2026-09-07: Compact-support eikonal arrival bound gives D<=5.58344e-4 for 100 GeV objects confined to the sphere footprint, independent of phase strength. Necessary support radius for the theoretical comparator is at least 2.00876 micrometres; larger composites face reduced flux. Yukawa tails require separate bounds. See [arrival screen](casimir-dp-localized-arrival-bound-2026-09-07.md).


- 2026-09-07: Long-wavelength LA contact estimate gives D=7.40392e-28 through 0.1*(2pi/a); full-cutoff linear extrapolation remains diagnostic only. This channel does not rescue the contact bridge; microscopic finite-momentum response remains absent. See [acoustic estimate](casimir-dp-electron-acoustic-contact-2026-09-07.md).


- 2026-09-07: Rigid electron-density contact sphere gives D=5.37075e-19 and loose component bound 1.49289e-17 at the nominal xenon reference count; central phase is small. This missing elastic component does not rescue the contact bridge, and is not a total subgap bound. See [rigid response](casimir-dp-electron-rigid-sphere-2026-09-07.md).


- 2026-09-07: Single-Yukawa electron response scan improves the contact diamond/xenon ratio by about 1.53e4 at its lightest sample, but nominal D remains only 4.00e-19. Demote this covered single-density route; coupling rescaling cannot repair the ratio. See [range ratio](casimir-dp-electron-range-ratio-2026-09-07.md).


- 2026-09-07: Contact electron cross-experiment ratio demotes the simple shared density channel: the nominal XENON1T reference count corresponds to covered diamond D=2.60933e-23 with local-field effects. This is conditional on common unattenuated flux and covered responses, not a new confidence limit. Prioritize demonstrably different response/population mechanisms. See [cross-check](casimir-dp-electron-contact-cross-check-2026-09-07.md).


- 2026-09-07: Unit electron-density contact calibration gives covered D=1.10268e-19 [W/(GeV^-2)]^2 with local-field effects. Formal W target for the DP comparator is 5.17334e8 GeV^-2, not a realizable or matched model coefficient. This supplies a quantitative electron-matching target. See [calibration](casimir-dp-electron-unit-contact-2026-09-07.md).


- 2026-09-07: The 300 MeV candidate nuclear reach remains negligible: independent-carbon D<=1.84962e-26 and separate smooth-sphere D<=1.50534e-30 under their component assumptions. Prioritize a calculated electronic/material channel over further halo-only refinement. See [reach](casimir-dp-virtual-300-nuclear-reach-2026-09-07.md).


- 2026-09-07: Added scalar diagonal potential and finite-speed s-wave phases for the 300 MeV candidate. Scalar shifts the zero-energy scattering length by about -0.81%; converged phases are not a full halo transport cross section. See [s-wave diagnostic](casimir-dp-virtual-self-s-wave-2026-09-07.md).


- 2026-09-07: Vector-only coupled-channel zero-energy solve for the 300 MeV candidate gives a=5.33083 GeV^-1 with successful cutoff refinement. Born self-scattering is not assumed; scalar, finite-velocity, spin/transport and halo effects remain. See [diagnostic](casimir-dp-virtual-self-zero-energy-2026-09-07.md).


- 2026-09-07: Broader laboratory intake adds BaBar/NA62/NuCAL/CHARM/A1 contours and identifies the 2026 FASER update. A conditional 300 MeV, alpha_D=0.1 test case remains outside the selected exclusions, with an explicit perturbative scalar mass; not an allowed-region claim. Next assess self-interactions and coherence reach. See [candidate](casimir-dp-virtual-300mev-candidate-2026-09-07.md).


- 2026-09-07: Fresh virtual mass scan normalizes six mediator masses independently. The 100-300 MeV range improves the raw xenon low/high ratio (716 and 180) and has gaps in the limited four-search screen; neither is an allowed model or coherence prediction. Prioritize broader laboratory constraints before material calculations. See [mass scan](casimir-dp-virtual-mass-scan-2026-09-07.md).


- 2026-09-07: Continuous visible-decay screen extends the four-point demotion: overlapping E137/E141/NA64/NA48 exclusions cover epsilon=4.63102e-6 through 0.01 for the fixed virtual benchmark. Changing only the coupling split does not rescue it in that domain. Prioritize a newly normalized, laboratory-screened variant. See [continuous screen](casimir-dp-virtual-visible-continuous-screen-2026-09-07.md).


- 2026-09-07: Visible-mediator laboratory screen demotes all four explicit virtual gauge-completion coupling splits: E137/E141 contours contain them when the 10 MeV mediator decays predominantly to electron pairs. Full-loop work is deferred pending a surviving completion or newly normalized variant. See [screen](casimir-dp-virtual-visible-lab-screen-2026-09-07.md).


- 2026-09-07: Minimal charge-two dark-Higgs completion makes the gap/coupling relation explicit. Loose Yukawa perturbativity gives alpha_D<=0.5 and epsilon>=4.63102e-6 for the fixed product; scalar decoupling is conditional. This is a model-definition screen, not an allowed-region claim. See [completion](casimir-dp-virtual-gauge-completion-2026-09-07.md).


- 2026-09-07: Electron resolvent diagnostic finds positive-energy instantaneous amplitude 0.170864 of the static-gap point-electron value, versus 0.058682 for nonrelativistic recoil. This is not full matching or a signal bound; it rejects both shortcuts and leaves gap-dependent box/crossed matching necessary. See [diagnostic](casimir-dp-virtual-electron-resolvent-2026-09-07.md).


- 2026-09-07: Virtual electronic matching intake identifies the scalar/spin-2 loop framework but rejects its heavy-mediator formula for the frozen light-mediator benchmark. Gap-retaining relativistic electron matching is required before reusing diamond response data; no electronic signal claimed. See [intake](casimir-dp-virtual-electron-matching-intake-2026-09-07.md).


- 2026-09-07: `casimir-dp-virtual-carbon-impulse-2026-09-07.md` fixes independent-carbon nuclear recoils at the same virtual xenon normalization: sigma=1.01263e-40 cm2 and mean hold events=9.1465e-26. Quadrature and forward-amplitude envelope checks pass. This is not an inclusive solid bound or additive continuum channel. Nuclear routes are negligible; next screen electronic/two-density response before further virtual-benchmark development.


- 2026-09-07: `casimir-dp-virtual-smooth-sphere-2026-09-07.md` evaluates the fixed xenon-normalized nuclear continuum contribution: D=1.4873e-30 with a loose full-component bound 4.1343e-29. Macroscopic phase is small. This route cannot yield measurable overlap; no total diamond bound is claimed. Screen omitted material channels before advancing or demoting the entire virtual benchmark.


- 2026-09-07: `casimir-dp-virtual-nuclear-match-2026-09-07.md` establishes a fresh common virtual nuclear normalization for 10 MeV mediator/gap: alpha=2.7973e-7, raw low/high xenon ratio 15962.75, carbon nuclear W(0)=-1.53594e-7 GeV^-2. Radial refinement passes; no detector fit or neutral-diamond rate. The earlier massless atomic overlap does not transfer to this short-range benchmark. Next complete carbon and assess coherence with this fixed normalization.


- 2026-09-07: `casimir-dp-neutral-virtual-shell-tail-2026-09-07.md` completes the ideal bulk forward shell sum: multiplier 1.047932536, with analytic outside-1-nm contribution below 4.414e-13 (separate from quadrature error). Shell convergence is resolved for the Gaussian toy; next advance shared nuclear/atomic normalization or realistic response rather than further shell refinement.


- 2026-09-07: `casimir-dp-neutral-virtual-pair-2026-09-07.md` checks atomic cross terms: first four ideal diamond shells give a 1.04793 forward-amplitude multiplier in the rigid Gaussian toy. Real/momentum-space integrals agree. This is a positive partial shell sum, not full material convergence or a rate; finish the shell tail before using the assembly as a benchmark.


- 2026-09-07: `casimir-dp-neutral-virtual-finite-q-2026-09-07.md` verifies the large-gap Gaussian atom amplitude shape beyond q=0: F2=0.95683 at 3.47 keV/c and essentially unity in the whole-sphere soft window. Independent quadratures agree; no rate or finite-q propagator error bound follows. Next test atomic cross terms before assembling diamond and matching xenon with the same operator.


- 2026-09-07: `casimir-dp-neutral-virtual-finite-gap-2026-09-07.md` retains the intermediate kinetic-energy denominator in the rigid Gaussian forward-amplitude toy. Ratios to constant-gap values are 0.9999867 (1 MeV) and 0.9999949 (10 MeV); segmented integration resolves the initial refinement failure. No finite-q decoherence or shared xenon normalization follows. Next evaluate the finite-q second-order kernel.


- 2026-09-07: `casimir-dp-neutral-virtual-toy-2026-09-07.md` verifies a nonzero second-order forward amplitude for a rigid neutral Gaussian atom in the large-gap limit. Analytic momentum and independent real-space checks agree. This is not a diamond response or decoherence rate; next test the finite-gap propagator before any joint normalization or material enhancement claim.


- 2026-09-07: `casimir-dp-virtual-channel-intake-2026-09-07.md` specifies literature-backed second-order elastic scattering through a virtual state. A safely closed sphere channel at the chosen mass/speed also closes real xenon excitation, requiring a new joint elastic normalization. Next derive the neutral-carbon two-insertion response with the resolvent; do not square net charge or inherit first-order B-L products.


- 2026-09-07: `casimir-dp-state-change-soft-window-2026-09-07.md` extends the existing inelastic screen to signed splittings. The rigid whole-sphere qR<=1 channel requires approximately abs(delta)<=1.85 meV at the fixed speed; large exothermic splitting is not an automatic coherent-channel rescue. This is not a total decoherence bound. Next specify virtual elastic or additional-final-state channels with one microscopic normalization before advancing an off-diagonal lead.


- 2026-09-07: `casimir-dp-bl-layer-conversion-2026-09-07.md` replaces the assumed nanoforce composition factor with the published layered kernel: C=0.3628 nominal, 0.1901-0.4403 in a broad neutron-fraction box. Coupling gap remains at least 15.4 across that box. Independent depth integration passes; visual force-envelope and nominal-film limitations remain. Keep the simple 1 eV benchmark demoted and develop the next explicit lead.


- 2026-09-07: `casimir-dp-bl-nanoforce-screen-2026-09-07.md` uses Chen et al. Figure 4 at 197 nm with a conservative assumed composition factor: g_SM ceiling 1.91e-13 versus perturbative floor 3.02e-12. Demote the simple 1 eV completion under this screen; a full layered recast remains verification work. Both B-L benchmarks lack viable perturbative completion; compare a new explicit mechanism without inheriting these products as allowed.


- 2026-09-07: `casimir-dp-bl-fraction-screen-2026-09-07.md` tests reduced local abundance with the xenon rate preserved. At g_SM=1e-11, f=0.1 increases the conditional per-particle self-transport rate 8.14-fold and raises dark alpha to 0.915. No rescaled coherence forecast or halo exclusion is claimed. Population reduction is not an automatic rescue; short-range/halo constraints remain next.


- 2026-09-07: `casimir-dp-bl-self-scattering-2026-09-07.md` adds classical repulsive light-mediator self-scattering for the same 1 eV products. Even g_SM=1e-11 yields about 5752 cm2/g at relative 200 km/s; no halo exclusion is claimed. Population/halo consistency and applicable ordinary-matter constraints must precede joint prediction acceptance. Reproducible Python/JSON check the classical-fit regime; full two-mediator and collective effects remain unresolved.


- 2026-09-07: `casimir-dp-bl-stellar-intake-2026-09-07.md` corrects the 1 eV screen: primary plasma-aware solar curve is around 1e-12, not an authenticated 1e-15 ceiling. With approximate stellar modelling this is coupling tension, not robust rejection; retain the row unresolved and prioritize short-range force and dark self-interaction tests. Earlier 0.01 eV laboratory conclusion is unaffected.


- 2026-09-07: Primary Figure 5 inspection and conservative composition screen in `casimir-dp-bl-laboratory-screen-2026-09-07.md` demote the simple unscreened 0.01 eV B-L candidate: laboratory-screen coupling ceiling 1.71e-17 versus perturbative floor 3.02e-12. This is a weak visual envelope, not a new precision exclusion fit. The 1 eV row requires its own short-range/stellar constraint screen; no range transfer or inherited strongly coupled completion is authorized by these calculations.


- 2026-09-07: `casimir-dp-bl-coupling-split-2026-09-07.md` identifies a conditional perturbative coupling obstruction: frozen light product needs g_SM >= 3.0244e-12 for dark alpha <= 1, above the source-summary/trial ceiling scale. Large eikonal coherence forecast is on hold; primary mass-resolved laboratory recast remains next, with no global exclusion claim or mediator-DM lifetime bound applied. Python/JSON preserve product normalization and test its reconstruction.


- 2026-09-07: B-L uniform-sphere eikonal calculation completed in `casimir-dp-bl-eikonal-2026-09-07.md` with reproducible Python/JSON. Phase resummation gives D=0.1851033 (0.01 eV) and 0.001027910 (1 eV), conditional on fixed population and uniform sphere. Quadratic limit recovers independent Born integrals; numerical refinement passes. No allowed model or demonstrated sensitivity: prioritize external coupling splits/constraints and transport before interpreting this as measurable overlap.


- 2026-09-07: [B-L finite-sphere Born audit](casimir-dp-bl-sphere-born-2026-09-07.md) gives formal D=0.598/0.02684 for 0.01/1-eV light mediators, but central phases 308/40.6 invalidate their small-phase Born interpretation. Potential/kinetic-energy ratios are about 1e-7 and kR is large. Next eikonal phase resummation with weak-coupling recovery and tail checks; do not promote these formal benchmark-sized signals to a solution.


- 2026-09-07: [B-L two-mediator screen](casimir-dp-bl-two-mediator-screen-2026-09-07.md) introduces a distinct current: resolved nuclei couple to A, neutral atoms to A-Z at low q. Fresh natural-Xe normalization gives raw low/high minimum 131.8735 and products approximately [8.532e-13,-3.429e-10] for light masses 0.01 eV, 1 eV, 1 keV plus 1 GeV. Next finite-sphere scattering with explicit Born validity, then individual coupling/external constraints. No allowed shared model or detector fit.


- 2026-09-07: [Neutral mediator-range family bound](casimir-dp-neutral-range-scan-2026-09-07.md) holds leading products fixed and extends light mass toward zero. Neutral charge and branch suppression yield a uniform q<=qBZ elastic envelope 1.327e-5 for all nonnegative light masses, 2224 below comparator. This is not a new xenon fit or inclusive inelastic bound; merely extending range cannot rescue that elastic channel.


- 2026-09-07: [Mass-matched initial capture rate](casimir-dp-matched-capture-2026-09-07.md) integrates the narrow allowed recoil interval with fixed products. Even a pure A107/A108 target column of 7e9 g/cm2 gives point-nuclear initial-path optical depth <4.95e-10, or about 1e-13 with Helm response. This standalone channel is weak before abundance dilution; prior slowing and other capture histories are not bounded by this calculation.


- 2026-09-07: [Elastic capture kinematic screen](casimir-dp-capture-kinematics-2026-09-07.md) finds one-collision capture of the fixed local 776 km/s, 100-GeV population at chosen escape 11.2 km/s requires target mass 97.15-102.93 GeV. O/Si/Fe require at least 15/8/4 ideal maximal-transfer collisions at fixed potential. Next evaluate the narrow hard-recoil integral for mass-matched nuclei with fixed products and abundance/path constraints; no capture rate or local density follows from kinematics.


- 2026-09-07: [Gravity-only focusing audit](casimir-dp-focusing-moment-2026-09-07.md) proves density-weighted inverse-speed moment invariance for a steady isotropic unbound population in a static transparent spherical potential. Focusing alone cannot improve the inclusive closure bound in that setting. Numerical Maxwell and mono-shell checks pass. Real halo anisotropy and capture remain distinct; next require an energy-changing population-supply mechanism with retention and spatial distribution.


- 2026-09-07: [Inclusive charge-closure bound](casimir-dp-inclusive-charge-closure-2026-09-07.md) bounds all final states of the fixed-number isotropic Born charge-density model using absolute charge inventory. Leading fixed-fast-population D<=1.262e-5, 2339 below comparator. Omitted material channels cannot rescue this benchmark within those assumptions; prioritize supplied phase space or concrete mechanism change. Not a nonperturbative/relativistic theorem or experimental sensitivity exclusion.


- 2026-09-07: [Covered diamond electronic coherence](casimir-dp-diamond-electronic-2026-09-07.md) evaluates the fixed incoming population with the branch filter: leading D=7.109e-21 with LFE and 9.900e-21 without, over 5.5-50 eV and tabulated q. Maximum numerical refinement 0.36 percent. Another small partial channel, not a total exclusion; subgap many-body response and capture supply remain open.


- 2026-09-07: [Diamond response intake](casimir-dp-diamond-response-intake-2026-09-07.md) verifies with/without-LFE electronic grids: 891 energies 5.5-50 eV, 2174 momenta 0-30.614 keV, finite data and hashes recorded. They do not cover sub-eV phonons. Inspected PhonoDark supplies LiF, not diamond inputs. Next compute the covered electronic channel with common products and branch filter; no material substitution or phonon extrapolation.


- 2026-09-07: [Single-phonon validity audit](casimir-dp-single-phonon-validity-2026-09-07.md) authenticates the source-paper restriction of atomic effective charges to q>=qBZ. Low-q single-phonon helpers cannot be promoted to a physical diamond prediction solely because callable. Diamond has zero long-wavelength Born effective charge, not zero finite-q response. Next seek mode-dependent many-body charge response or suitably covered low-energy ELF; no unsupported low-q rate generated.


- 2026-09-07: [Excess-charge diagnostic](casimir-dp-excess-charge-diagnostic-2026-09-07.md) derives a formal all-q Born envelope using one-sign charge and maximal coherence. Leading comparator charge is >=9.007e12 elementary charges, 96.7 times nominal electron inventory. This does not validate high-charge Born scattering or bound mixed-sign patches. Modest-charge Q-squared enhancement does not rescue this fixed fast-population branch within the model; prioritize omitted inelastic response or physically supplied capture.


- 2026-09-07: [Neutral intermediate elastic envelope](casimir-dp-neutral-intermediate-envelope-2026-09-07.md) fills the neutral elastic momentum gap through qBZ. With maximal positional coherence and arbitrary neutral cells of rms radius <=0.1 nm, leading all-q-below-qBZ D upper envelope is 1.332e-6, about 22100 below comparator. This conditional bound permits cell dipoles but excludes nonneutral surfaces and inelastic channels. Next prioritize charge-state dependence or omitted inelastic response; no total apparatus bound follows.


- 2026-09-07: [Neutral sphere-scale envelope](casimir-dp-neutral-sphere-envelope-2026-09-07.md) includes neutrality and branch filter while granting maximal N-squared positional coherence. For assumed spherical neutral cells with 0.1-nm electron rms radius and q<=hbar/R=0.714 eV, leading conditional D upper envelope is 1.307e-29. Not an authenticated diamond density or total bound; intermediate q, crystal bonding and surface charge remain open.


- 2026-09-07: [Fast population partial diamond response](casimir-dp-two-mediator-fast-partial-2026-09-07.md) evaluates the fixed incoming 776 km/s, 0.003/cm3 population without capture. Leading covered multiphonon exponent is 2.066e-20; this channel cannot reach the frozen comparator but is not a total bound. Next evaluate neutral finite-size low-q coherent scattering and the branch filter before declaring capture necessary.


- 2026-09-07: [Observable distinction and range audit](casimir-dp-two-mediator-observables-2026-09-07.md) corrects recent overly restrictive boundary wording: the frozen primary contraction and boundary cross-ratio are separate estimands. A factorized scattering model can produce primary loss with null R4. The 1-keV mediator range is 0.197 nm, so direct static exchange across the configured 10-um gap is suppressed by exp(-50677); this is not a real-particle transport bound. Next require supplied phase space and primary branch-history prediction, with R4 independently predicted rather than forced nonzero.


- 2026-09-07: [Published XENON1T ROI check](casimir-dp-xenon1t-roi-check-2026-09-07.md) yields 0.45566 leading-pair events in the prescribed 165.3-271.7 PE region with E>=186 eV, versus the notebook reference limit 24.6-24.8. This conditional nominal comparison does not reject the point or establish global compatibility. Initial older-search screening is complete; return priority to population supply and canonical boundary contrast.


- 2026-09-07: [XENON1T conditional ER fold](casimir-dp-xenon1t-fold-2026-09-07.md) gives 1.208 selected leading-pair events with E>=186 eV across all released S2 bins at 356770 kg day; the E>=50 eV extension gives 37.694 and is sensitivity only. Full bin arrays are saved. Raw near-threshold counts do not alone establish conflict; no ROI likelihood, exclusion, transport or shared-model validation follows.


- 2026-09-07: [Detector response intake](casimir-dp-xenon-response-intake-2026-09-07.md) corrects the planned XENONnT ER recast: inspected release supplies only NR matrices. Pinned XENON1T fallback supplies a verified 41-by-199 ER matrix including selections and 356770 kg-day search exposure. Next use that response with the analysis energy cutoff and frozen products; no folded result or exclusion yet.


- 2026-09-07: [Xenon onset audit](casimir-dp-xenon-threshold-audit-2026-09-07.md) finds first-node onset removal lowers the leading total 3.78 percent; raw 40-700 eV counts remain 24644 at the original 2.84 tonne-year exposure. Identified arXiv:2601.11296 and XENONnT/s2_only_data_release for the next detector-response comparison. No unit-efficiency assumption or exclusion follows.


- 2026-09-07: [Covered xenon electron spectrum](casimir-dp-xenon-electron-covered-2026-09-07.md) matches the fixed products to K/EH atomic spectral density. Leading light pair gives 1.77e6 covered raw 5 eV-10 keV ionizations but only 0.01481 above 1 keV in 2.84 tonne-year. Prioritize shell-threshold/liquid-response and charge-sensitive acceptance audit; raw counts are not an exclusion. Numerical refinement is below 0.013 percent; source multipole and missing-q errors remain open.


- 2026-09-07: [Relativistic core-response intake](casimir-dp-relativistic-core-intake-2026-09-07.md) authenticates a relativistic vector Xe ionization grid (5 eV-10 keV, q=100 eV-5 MeV) for an independent shared-parameter electron-recoil test. Free stationary electrons close above q=2.645 keV for the chosen source, but this is not an atomic cutoff. Bound-state/core response remains necessary; no silica substitution, total rate or capture result follows.


- 2026-09-07: [Silica missing-momentum budget](casimir-dp-silica-remainder-budget-2026-09-07.md) bounds the 37.2895-200 keV interval in the conditional nonrelativistic electronic f-sum model: leading initial-speed envelope 21.626 eV at 7e9 g/cm2; all q below 200 keV gives 61.807 eV. This is not realized stopping or capture. Prioritize physically supported higher-q response and its relativistic validity rather than a small extension of the Mermin table.


- 2026-09-07: [Covered silica ELF stopping](casimir-dp-silica-elf-stopping-2026-09-07.md) uses the pinned DarkELF SiO2 Mermin table and frozen two-mediator products. Leading covered electronic loss is 0.04663 eV across the chosen 7e9 g/cm2 initial-speed column; no total stopping bound or capture supply follows. Missing response above 37.3 keV momentum remains the next material-response question. Script and JSON preserve hashes, gap selection, below-gap sensitivity, and quadrature checks.


- 2026-09-07: [Static-response continuation sensitivity](casimir-dp-static-stopping-sensitivity-2026-09-07.md) compares trial f-sum/inverse-frequency envelopes. For the lightest pair, indefinite q^-4 gives about 2 eV while a 200-keV frozen trial gives 24 keV; neither is actual stopping. Large-q continuation, not numerical quadrature, dominates the uncertainty. Require supported electronic response before any capture inference.

- 2026-09-07: [Charge f-sum stopping audit](casimir-dp-charge-fsum-stopping-2026-09-07.md) derives a formal ground-state nonrelativistic inclusive envelope using common products. Its roughly 26-keV path-budget envelope is dominated (>99.7%) by q>m_e and is not realized stopping or capture. Newly authenticated arXiv:2608.05282v1 motivates tightening with finite-q material response and explicit validity/temperature treatment.

- 2026-09-07: [Two-mediator stopping screen](casimir-dp-two-mediator-stopping-2026-09-07.md) finds only 0.037 eV first-order mean loss for a 335-keV particle in the lightest pair over the chosen 7e9-g/cm2 silica path, despite about 71 point collisions. A conditional rigid-elastic half-energy-loss bound is 2.84e-6. No Earth capture claim: additional inelastic channels and actual path distribution remain required to supply the slow population.

- 2026-09-07: [Two-mediator common normalization](casimir-dp-two-mediator-common-2026-09-07.md) applies the same normalized summed amplitude to raw xenon and the audited partial diamond channel. The 1-keV/1-GeV pair requires about 6.19e13 slow particles/cm3 at 5000 K (3.27e19 at 300 K) to match the DP comparator. No supplied population or boundary-contrast signal is established; prioritize same-kernel energy loss/capture and mediator constraints.

- 2026-09-07: [Two-mediator shape intake](casimir-dp-two-mediator-shape-2026-09-07.md) optimizes the full 5.4-200/200-269.9-keV Born ratio over two real exchange products. Best tested ratio is about 126, versus 110,000 for the old 10-MeV single exchange; much improvement is heavy-exchange shape. This new lead requires common normalization, screened diamond response, Born-validity and external constraints before any measurable-overlap claim.

- 2026-09-07: [Threshold isotope kernel](casimir-dp-threshold-xenon-kernel-2026-09-07.md) resolves isotope openings from 601.12 to 603.75 km/s. At 602 km/s only 2.0944% of target atoms are in open isotopes; corrected low/high ratios are 3.8e8-5.4e8. At 610 km/s they remain 2.5e5-4.3e5. Threshold slowing worsens the sampled imbalance; preserve exact endpoints in future interpolation.

- 2026-09-07: [Natural-xenon finite-speed kernel](casimir-dp-natural-xenon-kernel-2026-09-07.md) covers all nine recorded isotopes at 650 and 776 km/s, both signs. Independent Born normalization checks pass. Corrected low/high cross-section ratios remain 56,000-117,000 at these speeds; isotope averaging does not rescue the accompaniment. No global transport reweighting or nonperturbative bound is inferred from two speeds.

- 2026-09-07: [Full angular independent check](casimir-dp-full-angular-check-2026-09-07.md) compares all l=0..202 adaptive phases with Numerov recoil bands at 650 km/s. High-band differences are 0.0287% attractive and 0.0201% repulsive; cutoff/quadrature checks pass. This supports the numerical correction at one isotope/speed, not a shared fit. Natural-isotope and speed coverage remain next.

- 2026-09-07: [Independent selected-phase check](casimir-dp-phase-independent-check-2026-09-07.md) compares adaptive radial integration with Numerov for fourteen phase shifts at 650 km/s; maximum difference 1.50e-7 rad. This checks integration, not the complete differential spectrum or nuclear inputs. Full angular and isotope/speed coverage remain open.

- 2026-09-07: [Finite-speed Xe131 partial waves](casimir-dp-finite-speed-xe131-2026-09-07.md) pass retained refinement and weak-coupling checks. At 650-776 km/s, total scattering is near Born but high-recoil bands shift by tens of percent with sign. Zero-energy enhancement cannot rescale LZ counts. Isotope/speed coverage and an independent solver remain required.

- 2026-09-07: [Helm-consistent potential audit](casimir-dp-helm-potential-2026-09-07.md) constructs and checks the extended charge potential matching the existing recoil form factor. Nuclear size shifts the zero-energy pole closer to the fixed benchmark. Finite-speed partial waves and isotope dependence remain prerequisites; do not apply zero-energy enhancement factors to LZ counts.

- 2026-09-07: [Point-Yukawa sign audit](casimir-dp-yukawa-sign-audit-2026-09-07.md) finds strong sign dependence for zero-energy point xenon at the existing coupling; the attractive branch is near a pole. Do not rescale LZ spectra with these zero-energy ratios. Specify charge sign consistently and calculate finite-speed extended-charge scattering before further Born-based physical claims.

- 2026-09-07: [Veto flight-time screen](casimir-dp-veto-flight-times-2026-09-07.md) finds metre-scale flight times of 1.29-1.66 microseconds for the benchmark, exceeding prompt windows. Correlated external scatters are not automatically veto-tagged; retain path times and thresholds in sample transfer. No timing efficiency is inferred.

- 2026-09-07: [Selection and veto-transfer audit](casimir-dp-selection-transfer-audit-2026-09-07.md) authenticates published low-energy sensitivity but identifies the missing position/history-dependent acceptance for this transported population. Vetoed events feed jointly fitted samples; they cannot be discarded through an arbitrary suppression factor. Require common-model sample transfer before an exclusion or fit.

- 2026-09-07: [Angular support audit](casimir-dp-angular-bound-2026-09-07.md) finds 95.6-96.2% of the simulated raw high-energy rate within the cosine >=0.9 bound domain. The estimated conditional low single-scatter bound coefficient is about 36,000-38,000; these are not confidence lower limits or accepted LZ counts. Prioritize authenticated low-energy selection over further high-count tuning.

- 2026-09-07: [Exactly-one-scatter spectral bound](casimir-dp-single-scatter-bound-2026-09-07.md) gives at least 38,752 low/high single-collision events for a chosen 300-g/cm2 xenon slab and high-capable incident rays with cosine >=0.9. Multiple-collision rejection alone cannot rescue this restricted benchmark; actual angular support, geometry and response remain necessary before any LZ exclusion.

- 2026-09-07: [Low/high xenon spectrum screen](casimir-dp-low-high-spectrum-2026-09-07.md) finds roughly one raw high-energy interaction accompanied by order 5e8 low-energy interactions in the conditional thin-target model. This is major spectral tension, not exclusion: finite-detector slowing/multiple-scatter selection is now a decisive prerequisite. Do not use the order-one high count alone as model success.

- 2026-09-07: [Bounded-weight transport mixture](casimir-dp-defensive-mixture-2026-09-07.md) restores all-history normalization using equal ordinary/biased sampling and bounded weights. Rare-exit ESS remains low; normalization is not spectrum convergence. Energy-resolved uncertainty and detector response remain open.

- 2026-09-07: [Lower-recoil transport extension](casimir-dp-lower-recoil-transport-2026-09-07.md) resolves substantial lower-energy exits at the reference coupling. Stronger-coupling importance sampling fails an all-history normalization diagnostic; do not claim converged flux or fold it into accepted counts before resolving weight-tail coverage.

- 2026-09-07: [NEST NR interface mapping](casimir-dp-lz-nest-interface-2026-09-07.md) pins the paper-linked beta source and maps the energy-dependent exponent into its 12-parameter input. Conditional charge-yield ratio at 248 keV is 0.7952; no detector kernel or accepted counts claimed. Lower-energy transport and authenticated detector response remain prerequisites.

- 2026-09-07: [LZ energy-response audit](casimir-dp-lz-energy-response-audit-2026-09-07.md) recovers tuned NR parameters directly from paper Table S5 despite renewed HEPData HTTP 403. Previous data-access limitation did not imply those parameters were unavailable. No universal Gaussian inferred from event errors. Current 200-keV transport termination cannot support reconstructed-event migration; next NEST interface matching and lower-energy transport support.

- 2026-09-07: [Full weighted high-window Xe spectrum](casimir-dp-weighted-xenon-spectrum-2026-09-07.md) finds raw totals near one around scale 3.9 but only about 0.001 raw events in 240-260 keV. One normalization run has ESS 7.9 and 35 percent maximum weight share. No precise root, reconstructed likelihood or captured population. Next detector/energy-response comparison and tail-quality improvement; total-count matching alone is insufficient.

- 2026-09-07: [Weighted rare-tail transport](casimir-dp-weighted-slab-2026-09-07.md) passes resolved-region controls and resolves nonzero tails: scale-three raw high-speed subset is about 300-360, scale-four subset about 0.014-0.021 with low effective sample sizes. Not a full-rate root bracket or accepted count. Next full weighted xenon energy/angle response with bias convergence, then shared population/validity checks.

- 2026-09-07: [Transport coupling scan](casimir-dp-transport-coupling-scan-2026-09-07.md) resolves excessive raw subset rates through twice the former strong root; three times and above are unsampled rare tails, not zero flux. Ordinary MC cannot establish the one-event scale. Next weighted rare-event transport with bias/variance validation; no normalized or allowed candidate yet.

- 2026-09-07: [Repeated-collision slab transport](casimir-dp-slab-transport-2026-09-07.md) finds about 24.8 percent far-side high-recoil-capable transmission at the former strong uncollided root, with two independent 30000-particle runs. A restricted raw Xe subset estimate is about 1.32e8 events, not one. That algebraic root is not a normalized transport candidate; no actual-site or complete-model exclusion. Next transport-aware coupling/validity comparison.

- 2026-09-07: [Exactly-one soft-scatter component](casimir-dp-one-soft-scatter-2026-09-07.md) gives 6.276 times the uncollided transmitted flux at the strong root in the same idealized slab, with independent lower bound 5.933. High Xe recoil window remains accessible. Uncollided root is not total transport; next full energy/angle redistribution, not repeated truncated-order retuning.

- 2026-09-07: [Coupled attenuation branches](casimir-dp-coupled-attenuation-branches-2026-09-07.md) solves detection/attenuation together. Strong uncollided root has cross-section multiplier 126927 and silica tau=21.08; chosen xenon-column tau=0.066 does not establish opacity. Retain as conditional transport candidate; scattered flux, Born validity, captured population and detector response unresolved.

- 2026-09-07: [Silica attenuation diagnostic](casimir-dp-silica-attenuation-2026-09-07.md) gives tau=1.66e-4 and 99.983 percent uncollided transmission at the fixed matched coupling in a chosen 4e5 g/cm2 silica column. Strong shielding cannot be assumed for that benchmark. Next solve coupled stronger-coupling count/attenuation equation and check detector scattering; not site transport or exclusion.

- 2026-09-07: [Capture supply envelope](casimir-dp-capture-supply-envelope-2026-09-07.md) links local density, surviving fast fraction and effective spatial volume. Perfect constant-source accumulation cannot supply the homogeneous benchmark: partial-channel density exceeds maximal Earth average by 106 at 5000 K and 2.63e7 at 300 K. Not a local-density bound or full-model exclusion; next same-interaction stopping/spatial calculation.

- 2026-09-07: [Matched diamond/xenon coefficients](casimir-dp-darkelf-xenon-match-2026-09-07.md) makes q0=73.3841 MeV explicit and preserves common proton normalization. Conditional raw full/high Xe ratio is 1.10e5; partial diamond DP comparison requires slow/fast ratios 3.86e27 or 1.56e22 at 300 or 5000 K. No supplied populations, detector fit or exclusion. Next assess spectrum and supply/attenuation before density enhancement claims.

- 2026-09-07: [Executed thermal diamond partial coefficient](casimir-dp-darkelf-thermal-partial-2026-09-07.md) gives hold-event coefficients 2.86e-23 and 7.07e-18 per particle/cm3 at 300 and 5000 K, for 100 GeV DM, 10 MeV mediator and reference proton cross section 1e-38 cm2. Conditional high-q/energy domain only; no allowed point or supplied density. Next match xenon coefficient and transport.

- 2026-09-07: [Pinned DarkELF source audit](casimir-dp-darkelf-source-audit-2026-09-07.md) authenticates carbon response files and explicit high-q integration requirements. Under isotropic independent-scattering assumptions, q>=qBZ visibility exponent differs from t times the rate by at most 0.023 percent. No rate executed or overlap established; next run restricted response with matched proton normalization.

- 2026-09-07: [Diamond inelastic intake](casimir-dp-diamond-inelastic-intake-2026-09-07.md) identifies DarkELF multiphonon response as the next executable lead. Atomic-charge matching is not authenticated below q_BZ~3.48 keV; prior soft elastic ratios remain toy results. Particle temperature cannot be inferred from the 4 K sphere. Next inspect pinned diamond response inputs and supported high-q contribution.

- 2026-09-07: [Neutral-carbon dark-photon screen](casimir-dp-dark-photon-carbon-screen-2026-09-07.md) enforces exact neutrality using IUCr atomic coefficients. Conditional rigid elastic qR<=80 response is 3.14e-12 of bare-charge response for 10-100 MeV mediators; not an all-q bound or absolute rate. Bonded-solid/inelastic response remains required before captured-density claims. Measurable-in-both goal remains open.

- September 7: Current priorities reconciled with the settled measurable-both preference. [Captured dark-photon definition](casimir-dp-captured-dark-photon-definition-2026-09-07.md) fixes the next charge-response and transport screen; dated null-control defaults no longer determine priority.

- September 7: [CASPAR timing screen](casimir-dp-caspar-timing-screen-2026-09-07.md) rejects a contemporaneous CASPAR-beam source for the June 2023 LZ event: primary facility records document 2021 disassembly and a 2025 restart, corroborated by a June 2023 overview. Generic future accelerator tests remain separate from historical attribution.

- September 7: [Thermal/two-step kinematics](casimir-dp-thermal-two-step-kinematics-2026-09-07.md) screens thermal hard-recoil tails and identifies published accelerator upscattering as a distinct source model. Alpha-projectile endpoints can permit the recoil; no source operation, geometry, rate or event association is established.

- September 7: [Same-population elastic kinematics](casimir-dp-common-population-kinematics-2026-09-07.md) generalizes the common-beam covariance screen to any mass at speeds capable of the representative hard Xe recoil. It does not cover slower companions or exothermic channels; those require explicit population accounting.

- September 7: [LZ cascade response contract](casimir-dp-lz-cascade-response-contract-2026-09-07.md) rechecks single-scatter and three-sample likelihood requirements. HEPData retrieval remains inaccessible (HTTP 403 independently observed); no response tables were imported. Parent-to-selected-event kernels and multiplicity must precede an accepted cascade prediction.

- September 7: [Common-beam covariance screen](casimir-dp-common-beam-kick-covariance-2026-09-07.md) shows that independent elastic azimuths suppress the aligned-kick toy enhancement by q^2/(4 k^2). At 1 TeV and 776 km/s, 10,000 soft hits give at most 1.22e-12 fractional second-moment enhancement over the inspected interval. A shared incoming direction alone is insufficient.

- September 7: [Correlated-kick diagnostic](casimir-dp-correlated-kick-screen-2026-09-07.md) distinguishes independent arrival clustering from aligned momentum transfers. Only the latter enhances the toy coherence exponent, with enhanced momentum variance as a required companion. No actual burst occupancy, rate or allowed point is inferred.

- September 7: [Loose-composite breakup intake](casimir-dp-loose-composite-breakup-intake-2026-09-07.md) authenticates the constituent-resolved response and newer Earth-disassembly study. Independent-constituent count cancels the reduced composite flux at fixed density; potential novelty is transport and correlated events, requiring a matched portal and detector selection.

- September 7: [Integrated compact surface modes](casimir-dp-composite-surface-sum-2026-09-07.md) sums the kinematically accessible ground-to-one-phonon response. It adds at most about 0.12 percent to the tiny high-window elastic rate for the tested gaps. Deprioritize this implementation; no inclusive inelastic bound or joint-signal admission.

- September 7: [Surface-mode response diagnostic](casimir-dp-composite-surface-mode-2026-09-07.md) authenticates the quadrupole amplitude-gap relation. Tested compact-nugget modes are weaker than the elastic response at representative Xe momentum and cannot be excited at the soft separation momentum. No integrated inelastic exclusion or microscopic spectrum is claimed.

- September 7: [Elastic composite family bound](casimir-dp-dark-composite-family-bound-2026-09-07.md) bounds the high-recoil raw Born yield across radius, constituent count and normalized nonrelativistic speed laws under the stated screening relation. At 0.01 eV the conditional envelope is 6.93779e-5 events; prioritize changed mediator ranges or microscopic inelastic responses over another elastic size scan.

- September 7: [Compact composite force/rate screen](casimir-dp-dark-composite-force-rate-2026-09-07.md) evaluates shared kernels at two conservative ordinary-force ceilings. Raw high-energy Xe remains tiny; the largest quadratic D is 9,001 times below the comparator and fails the small-phase check. Deprioritize this benchmark at these ranges; no general composite exclusion.

- September 7: [Composite radius screen](casimir-dp-dark-composite-radius-2026-09-07.md) authenticates a saturated mass-radius relation and internal-screening condition. The 10 GeV constituent, N=10,000 diagnostic retains 0.81054 elastic dark form-factor squared at 248 keV; joint rates and constraints remain outstanding.

- September 7: [Dark composite intake](casimir-dp-dark-composite-intake-2026-09-07.md) identifies a distinct charge-enhancement lead and its flux/form-factor tradeoff. A microscopic mass-radius relation and both response calculations remain required; no measurable overlap is claimed.

- [Composite scalar�vector diagnostic](casimir-dp-scalar-vector-composite-2026-09-07.md): primary literature identifies nonstatic/composition corrections to static cancellation. Its Fermi-gas proxy gives Xe131 minus C12 =3.24e-4, larger than inherited matching tolerances; this is not a short-range exclusion or full nuclear matching. No protecting construction established. Deprioritize unprotected cancellation scans and require controlled composite matching before another detectable-point claim.

- [Scalar�vector cancellation requirements](casimir-dp-scalar-vector-cancellation-2026-09-07.md): opposite ordinary-force signs can leave dark scattering nonzero, but the inherited long-range benchmarks require residual fractions near 1e-13/6.48e-7. Single-distance matching fails under mass mismatch; cross-material cancellation requires proportional scalar/vector charges. Distinct emitted particles do not cancel stellar losses by force sign. Next require a concrete protecting/matching mechanism before another signal scan; no candidate admitted.

- [Multiple-scalar force screen](casimir-dp-multiple-scalar-force-screen-2026-09-07.md): existing stable Yukawa percent-level cases had already failed the ordinary-force screen. Healthy unscreened same-charge scalars cannot cancel identical-source attraction; at equal mediator mass and fixed total dark coupling budget, Cauchy�Schwarz preserves the single-scalar margin. Unequal ranges require a geometric recast. A scalar-plus-vector cancellation is a distinct, still untested alternative requiring common-composition matching and retained dark scattering; avoid repeating the completed scalar-only scan.

- [Scalar branch decision and control](casimir-dp-scalar-branch-decision-2026-09-07.md): user explicitly prioritizes a measurable signal in both experiments. The consolidated 100 GeV vector/scalar null-scale benchmark is a control only, not the lead. Its finite-vector Xe correction is reproduced. Next inspect existing stable elastic/light-mediator evidence and screen the unresolved measurable-overlap region using Xe high/low shape and local response jointly, without an assumed excited reservoir.

- [Scalar survival/Xe optimization](casimir-dp-scalar-survival-xenon-2026-09-07.md): the physical pseudoscalar transition kernel now shares its coupling with real-scalar decay. Optimizing the no-source primordial population gives at most 6.68e-12/4.81e-11 raw Xe window events for the declared gN<=4 pi cap at 40/100 GeV and 1 eV mediator. These are conditional leading-model integrals, not accepted-count or confidence limits. Deprioritize this no-source branch; a continuation requires an explicit source or different protected interaction.

- [Nonuniversal scalar transition lifetime](casimir-dp-scalar-transition-lifetime-2026-09-07.md): the restored physical pseudoscalar transition opens real 1 eV scalar emission, with diagnostic lifetimes 103 s and 3.61 h. Primordial unreplenished excited populations fail at these points; a source or much smaller transition is required. The vector-contact Xe rate cannot normalize this different operator. Exact/leading width checks pass; no model admission.

- [Universal scalar selection rule](casimir-dp-universal-scalar-selection-2026-09-07.md): a scalar that rescales the entire dark mass matrix has exactly diagonal tree Yukawas and cannot supply the existing exothermic transition. Six Takagi checks pass. Visible-only universality with a nonuniversal dark sector remains a separate incomplete lead; it requires new matching and survival calculations, not reuse of the radial pilot rates.

- [Mixed-nucleus scalar cancellation](casimir-dp-scalar-mixed-nuclei-dipole-2026-09-07.md): additive electron/proton/neutron charges cannot exactly cancel the elementary dipole across H/He/C/O with isotope mass proxies. H/He tuning leaves C/O residuals 6.51e-4/9.69e-4; the minimax residual is 4.84e-4. This is not a stellar bound. A full mass-energy coupling with binding-charge matching is a concrete alternative to investigate, with all target and medium responses required.

- [Stellar constraint correction and dipole check](casimir-dp-scalar-stellar-correction-2026-09-07.md): 2303.00778v2 challenges the much stronger earlier nuclear-bremsstrahlung limits and supplies a Higgs reference near sin(theta)=2e-10. Do not treat 2205.01669 as an uncontested stronger bound. The 1 eV pilot predicts D=3.34e-16/4.01e-17 at the corrected reference; its Higgs charge/mass ratios do not give an exact elementary dipole cancellation. Large-coupling transport remains uncomputed.

- [Scalar boundary-estimator transfer](casimir-dp-scalar-boundary-transfer-2026-09-07.md): the frozen tangential equal-gap geometry and four-cell cancellation require an explicit boundary-state response beyond homogeneous scattering. The 1 eV Yukawa gap factor is 9.80e-23; range equal to 10 micrometers requires 0.01973 eV. Neither a longer range nor a single-history exponent establishes a boundary residual. Primary contraction and boundary-response tracks remain distinct.

- [Scalar eikonal validity diagnostics](casimir-dp-dark-scalar-eikonal-validity-2026-09-07.md): included-speed trajectories have potential/kinetic ratio below 6.44e-4 and sampled deflection below 6e-4 rad. An analytic real-phase inequality bounds the b/R>16 contribution within eikonal theory at 7.14e-20. Low-speed exact scattering and a quantified physical error remain open; no model admission.

- [Large-phase scalar overlap](casimir-dp-dark-scalar-eikonal-2026-09-07.md): real straight-path phase exponentiation reduces the 1 eV pilot coherence to D=0.001079 and 0.0005305 over speeds >=10 km/s, versus the previous formal target near 0.0295. Quadratic recovery agrees within 9.1e-9; refined grids change below 0.026%. The analytic real-phase inequality forbids enhancement within this eikonal model; exact-scattering/material admission and external constraints remain open.

- [Scalar elastic xenon companion](casimir-dp-dark-scalar-xenon-companion-2026-09-07.md): the same scalar parameters now predict five Xe recoil bins. Formal 1 eV sphere-target angles give 54.2�77.7 raw elastic events, predominantly below 30 keV; their sphere Born validity remains false. Reference-angle rates are tiny. Contact normalization agrees within 9.1e-13; detector response and a joint likelihood remain open.

- [Dark-scalar sphere response and validity screen](casimir-dp-dark-scalar-sphere-2026-09-07.md): reference-mixing coherence is tiny; forecast-sized formal mixings invalidate Born extrapolation and require stellar/ordinary-force consistency. No full-model admission.

- [Dark-scalar portal potential](casimir-dp-dark-scalar-portal-potential-2026-09-07.md): reconstructed masses/mixing/quartics with high precision and mapped the same mixing to a nucleon force proxy. Stellar sources identified but no full recast or radiative-stability claim. Next compare required sphere mixing against these shared constraints.

- [Dark scalar selection rule](casimir-dp-dark-scalar-selection-2026-09-07.md): new symmetric mass branch has derived diagonal radial-scalar couplings but no tree scalar transition; heavy vector can retain xenon scattering. Prior asymmetric pilot remains distinct. Next constrain the shared Higgs portal/potential and ordinary forces before a local scalar forecast.

- [Resonant recycling ceiling](casimir-dp-resonant-recycling-ceiling-2026-09-07.md): even an overly generous single-resonance absorption peak requires eV/keV vector energy densities far above the frozen halo. Deprioritize this incoherent single-vector recycling branch; next evaluate a derived stable-state scalar/loop companion rather than another bath-spectrum tuning.

- [Thermal vector recycling](casimir-dp-thermal-vector-recycling-2026-09-07.md): detailed balance plus generous coupling caps requires 10–18 keV baths for the eV/keV mediator pilots, with one-polarization energy density over 1e21 times the frozen halo density. Thermal recycling is not compatible with treating that background as unchanged; nonthermal sources remain unmodeled.

- [Replenishment source floor](casimir-dp-replenishment-floor-2026-09-07.md): frozen cold-halo self-excitation and stationary-free-target replenishment are kinematically closed for the 40/100 GeV pilots. Derived a coupling-independent gross production floor and microscopic eV-mediator decay lengths. High-energy sources or vector recycling require a new coupled transport/distribution calculation.

- [Real-vector survival screen](casimir-dp-real-vector-survival-2026-09-07.md): exact vector-emission width plus xenon-required coupling product. Even the generous gB<=4pi cap prevents the scanned open-channel points from recovering reference Xe strength without replenishment. Formal light-mediator sphere forecasts are not population-consistent; production/replenishment or a different completion is now required.

- [Axial rigid-sphere fold](casimir-dp-axial-sphere-fold-2026-09-07.md): propagated the mass-derived axial coupling through the frozen sphere and recalculated xenon normalization across mediator masses. Largest scanned qR<=80 result is D=6.47e-15; useful light-mediator entries open real-vector decay. Next test that decay with the xenon-required coupling product and abundance.

- [Axial elastic kernel](casimir-dp-axial-elastic-kernel-2026-09-07.md): derived spin-zero target recoil kernel with transverse-velocity suppression; 18 independent Dirac traces and contact angular integral agree. Pilot CA fixed by mass asymmetry. Next fold the rigid-sphere coherence response and consistent xenon-normalized mediator dependence.

- [Elastic companion from mass mixing](casimir-dp-elastic-mass-mixing-2026-09-07.md): independently diagonalized two-state mass/current matrices. Same-sign masses bound the axial diagonal coupling; a signed counterexample shows the gap alone is insufficient. Next derive the axial/vector elastic target kernel for the specified mL=3d/4, mR=d/4 pilot without fitting a separate local coupling.

- [Single light-mediator envelope](casimir-dp-exothermic-light-mediator-bound-2026-09-07.md): positive-weight bound combines all mediator masses with arbitrary constant proton/neutron ratios. Four benchmark local D ceilings remain below 2.31e-21 at reference raw Xe. Next investigate a derived separate elastic channel rather than further tuning this exothermic propagator.

- [Mixed target response and isospin ceiling](casimir-dp-exothermic-mixed-targets-2026-09-07.md): consistent proton correction folded through both isotope targets. All constant charge ratios improve carbon/Xe at most 179–190 times in the four benchmarks; local D remains below 2.57e-22 at the selected raw Xe normalization. Isospin tuning cannot supply percent-scale local loss within this class.

- [Hypercharge neutrino decay](casimir-dp-exothermic-hypercharge-decay-2026-09-07.md): both neutral-vector exchanges give a zero-momentum cancellation and gap^9 width. Pure kinetic mixing gives negligible reference depletion; direct charges/mass mixing and the literature flavor-count convention remain separate open issues.

- [Active-neutrino survival condition](casimir-dp-exothermic-neutrino-survival-2026-09-07.md): derived chiral contact width and optimized shared-rate abundance ceiling. Three equal flavor ratios must be below 2.64e-4 (40 GeV) or 1.20e-3 (100 GeV) for the selected reference strength without replenishment. Ratios remain mediator-dependent; no fit or model admission.

- [Radiative normalization audit](casimir-dp-radiative-offset-audit-2026-09-07.md): near-constant low-mass offset passes an eight-point held-out comparison; ordinary mass/alpha rounding is insufficient. No correction adopted; independent normalization and additional decay channels remain open.

- [Tabulated radiative diagnostic](casimir-dp-exothermic-tabulated-radiative-2026-09-07.md): authors’ numerical data recovered; low-mass series/table consistency check fails by about 0.59%. Conditional convolution preserved without normalization repair or model admission.

- [Radiative spectral connection](casimir-dp-exothermic-radiative-spectral-2026-09-07.md): derives the inclusive vector-width convolution and reproduces electron-pair normalization. Published six-term corrections integrate to5.709/1.493 at40/100GeV, unlike endpoint evaluation. No remainder bound or lifetime admitted; next authenticate the full vector-width function.

- [Pair-closed radiative applicability](casimir-dp-exothermic-radiative-validity-2026-09-07.md): 40/100GeV points have Delta/me=1.969/1.079, outside the inspected low-energy three-photon estimate's stated diagnostic regime. No lifetime extrapolated; finite-mass electron loop and version/convention audit required. Pair closure remains distinct from population survival.

- [Vector phase space and benchmark failure](casimir-dp-exothermic-vector-phase-space-2026-09-07.md): two independent integrations give F=0.6965/0.4583 at10/15GeV. With illustrative r=alpha/(4pi), optimized no-replenishment present strengths reach only0.106%/1.074% of the chosen benchmark. This specific mixing/history cannot support prior undepleted rates. Next examine pair-closed points or separately specified suppressed mixing; no universal exclusion.

- [Baryonic mixing benchmark](casimir-dp-baryonic-mixing-benchmark-2026-09-07.md): the published illustrative r=alpha/(4pi) requires electron-pair F<=8.44e-4 or5.33e-3 at10/15GeV to recover the chosen present strength. Mixing remains an independent UV boundary, not fixed by the nucleon operator; next compute vector-decay phase space before assessing this benchmark.

- [Exothermic depletion ceiling](casimir-dp-exothermic-depletion-ceiling-2026-09-07.md): solves cross-section/decay feedback with no replenishment. Maximum present strength is f0/(e b); recovering the chosen benchmark requires r sqrt(F)<=1.69e-5 or4.24e-5 for10/15GeV and f0=1. Both solution branches checked against population ODE. No UV mixing, production history or experimental exclusion inferred.

- [Exothermic mediator survival](casimir-dp-exothermic-mediator-survival-2026-09-07.md): baryonic-vector matching exposes photon mixing as a shared decay/proton-scattering parameter. Approximate cosmic-age requirement gives |Ce/Cb|sqrt(F)<=2.78e-5 and6.99e-5 for10/15GeV points. No mixing floor, excited fraction or lifetime is established; anomaly completion and thresholds remain required.

- [Exothermic common rate](casimir-dp-exothermic-common-rate-2026-09-07.md): explicit isoscalar off-diagonal nucleon contact at sigma_p=1e-45 cm² and conditional f*=1 yields 3.84–5.97 raw Xe window events, but carbon independent-event estimates below 7e-25 per hold. Speed/recoil integrations agree below 4e-9. No detector fit or population-survival claim; next resolve mediator/lifetime consistency.

- [Response refresh and exothermic screen](casimir-dp-exothermic-lead-screen-2026-09-07.md): LZ release access failed (DOI404/direct403), with no inference of absence. Efficiency crossings are not hard true-energy boundaries. New 2609.04673 down-scattering lead carries a 248keV xenon peak to 0.496–1.55MeV carbon peaks in tested masses; carbon is open but rate, excited population, lifetime and event-loss accounting remain uncomputed. No imported zero-background fit or model admission.

- [Selected gluon momentum check](casimir-dp-axion-family-gluon-momentum-2026-09-07.md): isotope-resolved q dependence changes raw xenon totals by less than 2e-10 fractionally across the family. Independent parameter-integral reduction and split-window checks pass. This narrow contact-approximation concern is negligible; omitted amplitudes and detector response remain higher priorities.

- [Family joint target response](casimir-dp-axion-family-target-response-2026-09-07.md): propagates both gluon insertions and repairs rounded gu in spin/box terms. At yL=0.10, central raw Xe=1.368095 and independent-nucleus D upper estimate=2.179609e-29; six halo scenarios and squared-subset diagnostics retained. Selected corrections do not create a local signal or establish a detector fit/full model.

- [Fixed-gu family loop cost](casimir-dp-axion-family-loop-cost-2026-09-07.md): independently differentiated potential and heavy-gluon coefficients at all four points. At yL=0.10 the curvature and aa-gluon term grow approximately fourfold while the Higgs-gluon term shrinks; next recompute both target responses with the two insertions and explicit mass-input assumptions. No naturalness exclusion or model admission.

- [Messenger-coupling flow scan](casimir-dp-axion-coupling-flow-scan-2026-09-07.md): four independently rebuilt/evolved boundaries at fixed leading gu; yL=0.10 reduces conditional kaon contribution to 10.15% of dated measured magnitude while yR approximately doubles. Leading target responses persist, but altered loop terms and signed SM constraints prevent admission; next audit the scalar/loop consequences of this family.

- [FLAG24 kaon input ledger](casimir-dp-axion-flag24-input-ledger-2026-09-07.md): authenticated updated bag parameter reduces conditional epsilon contribution by 1.21% to 9.0439e-4; charged-kaon proxy and incomplete matching remain explicit. Covariance scenarios cover input errors only; no exclusion or shared-model admission.

- [Conditional observable scale/Fierz flavor check](casimir-dp-axion-fierz-observable-diagnostic-2026-09-07.md): single-insertion flavor-diagonal penguin structure vanishes symbolically in Delta-S=2. Dated-input conversion gives |epsilon_NP|=9.15431e-4, 41.09% of measured magnitude and 9.23% below the old estimate. This is not a total amplitude or exclusion; neutral-kaon input update, parameter dependence and UV completeness remain open.

- [NDR evolution/convention audit](casimir-dp-axion-ndr-qcd-evolution-2026-09-07.md): matching three-gamma subtraction coefficients agree; conditional NLO RGI factor is 0.576306336 and Im C_hat=1.59898741e-15 GeV^-2. J3, symbolic derivative and scale checks pass. Finite Fierz revision and hadronic input alignment remain open; no precision constraint or joint prediction update.

- [Thresholded low-energy QCD](casimir-dp-axion-low-qcd-evolution-2026-09-07.md): LO nf5->4->3 evolution gives Im C_hat_LO=1.63805e-15 GeV^-2, factor 0.5903858192 relative to the weak coefficient. Three-scale RGI and independent ODE checks pass. Higher-order NDR/hadronic normalization remains next; no reused eta factor or precision epsilon_K claim.

- [Kaon chirality audit](casimir-dp-axion-kaon-chirality-audit-2026-09-07.md): all non-VLL tree/finite Delta-S=2 entries vanish in both orientations in the top-only approximation; VLL reproduces 2.77454421e-15 imaginary GeV^-2. Chirality rotations and amplification checks pass. Next thresholded low-energy QCD and hadronic convention matching; no full-model constraint or joint prediction update.

- [Generated-operator VLL inventory](casimir-dp-axion-generated-operator-matching-2026-09-07.md): 25 additional active entries give +3.35197e-20 imaginary GeV^-2, about +0.00121%; full finite VLL assembly yields 2.77454421e-15 GeV^-2. Rotation, linearity and conditioning checks pass. Other Delta-S=2 structures, complete UV/input treatment and low-energy conversion remain open.

- [Electroweak/Higgs running sensitivity](casimir-dp-axion-ew-higgs-running-2026-09-07.md): coupled one-loop g/gp/gs/yt/Lambda/m2 trajectory raises the partial imaginary coefficient by 2.124284%, to 2.77451069e-15 GeV^-2. Top-only Yukawa and tree-derived input conventions remain explicit. Beta and tolerance checks pass; generated-operator matching and UV/input/low-energy completion remain next.

- [Broader candidate qq matching](casimir-dp-axion-full-qq-matching-2026-09-07.md): full evolved qq1/qq3 finite response lowers the partial imaginary coefficient by 0.764316%, to 2.71679818e-15 GeV^-2. Operator linearity, numerical amplification and previous-total checks pass. Electroweak/Higgs running, UV completeness and low-energy consistency remain next; no revised kaon bound or joint prediction.

- [Candidate tensor membership](casimir-dp-axion-candidate-tensor-membership-2026-09-07.md): evolved qq3 has 1.079% norm outside the tested family, or 0.01578% after adding the pure-up direction. Direct full-tensor explicit-mt remainder is -6.75987e-18 imaginary GeV^-2; outside-family contribution is +2.18016e-22. Keep full-tensor matching; next include non-explicit-mt qq terms and qq1. No full kaon or joint prediction update.

- [Triplet flavor-span test](casimir-dp-axion-triplet-flavor-span-2026-09-07.md): naive extension passes the light block but fails for top-containing H. The restricted-family map QHQ+(QHT+THQ)/4 passes nine Hermitian basis elements and three held-out combinations at three scales within 3.75e-13 scaled error. Next test candidate tensor membership; no arbitrary-tensor correction or joint prediction update authorized by this evidence.

- [Exact triplet remainder identity](casimir-dp-axion-triplet-symbolic-remainder-2026-09-07.md): rational two-flavor mixed-probe reduction gives exactly zero residual for library minus selected minus 2x ln(x)/(x-1). This resolves that algebraic finite remainder; arbitrary flavor and full matching remain open. No candidate or joint prediction changes.

- [Triplet mass remainder](casimir-dp-axion-triplet-mass-remainder-2026-09-07.md): mixed-probe finite remainder follows 2x ln(x)/(x-1) times the stated prefactor across 24 mass/scale tests, within 2.47e-11. Its scaling supports a subleading electroweak explanation; symbolic/general-flavor completion remains open. No candidate coefficient or joint prediction changed.

- [Four-quark term decomposition](casimir-dp-axion-qq-term-decomposition-2026-09-07.md): algebraic explicit-mt group agrees with selected qq1 probe; qq3 retains a finite remainder, while both logarithmic slopes agree. Groups reconstruct the library within 3.2e-14. This is not a physical sector decomposition. Next isolate the triplet finite remainder; model predictions remain unchanged.

- [Independent current/qq comparison](casimir-dp-axion-current-qq-independent-overlap-2026-09-07.md): aligned current probes agree within 1.63e-10, but mixed qq probes differ substantially from the broader library expression. The difference persists with alpha_s=0. Keep qq matching unresolved; decompose electroweak/top and finite-convention terms before a kaon bound. No shared-model prediction updated.

- [Independent qu matching overlap](casimir-dp-axion-qu-independent-overlap-2026-09-07.md): common-mass qu1/qu8 probes agree with independent VddLL matching at three scales within 1.3e-10 relatively after full external flavor rotation and H=-L conversion. This validates those probe conventions only; current/qq overlap and complete model treatment remain open.

- [Independent matching mass-input audit](casimir-dp-axion-matching-library-input-audit-2026-09-07.md): installed loop matcher hardcodes mt=173; changing supplied m_t leaves the VddLL probe unchanged. An isolated configurable variant responds and agrees at the default. Match mass/scheme, flavor rotations and normalization before independent coefficient comparison; no candidate coefficient changed.

- [Top self-running sensitivity](casimir-dp-axion-top-self-running-2026-09-07.md): consistent gs/yt subsystem raises the selected imaginary kaon coefficient by 1.222887%; analytic/ODE, library beta, tolerance and low-boundary checks pass. Other SM couplings remain imposed zero. Next extend/audit the SM trajectory and matching scope; no full uncertainty estimate or updated shared-model admission.

- [Heavy-current boundary sensitivity](casimir-dp-axion-uv-current-sensitivity-2026-09-07.md): authenticated quartic current terms shift the selected imaginary kaon coefficient by -0.0817606%; tolerance/alignment/sum checks pass. This is partial higher-order sensitivity, not an uncertainty estimate. Next prioritize the top/QCD SM trajectory and independent matching before a revised joint parameter screen.

- [Four-quark matching diagnostic](casimir-dp-axion-qq-matching-2026-09-07.md): top-projector J and external-leg K terms shift the selected imaginary coefficient by -0.0262563%; rephasing, external-leg log cancellation and tolerance checks pass. Independent general-flavor matching and missing UV boundary terms remain next; no revised kaon bound or shared-model admission.

- [Generated qu matching](casimir-dp-axion-generated-qu-matching-2026-09-07.md): isolated right-handed-top singlet/octet weak-scale terms shift the selected imaginary kaon coefficient by -0.005188%; tolerance and current-normalization checks pass. Left-handed qq matching and complete UV/low-energy treatment remain open; no model admission or revised flavor bound.

- **2026-09-07 — coupled boundary-subset flow integrated:** [packet](casimir-dp-axion-coupled-flow-2026-09-07.md), Python/JSON. Gaugeless top-Yukawa SMEFT integration on the declared QCD SM trajectory gives coupled/restricted=0.9962303 for the current-and-box projection; tolerance refinement is stable. Generated qu1 and other operators still lack their finite EW matching, and omitted UV boundary terms remain explicit. This is not an updated epsilon or complete Hamiltonian. Next match generated operators consistently, then complete boundary/SM running and flavor inputs. No model admitted.

- **2026-09-07 — independent beta audit:** [packet](casimir-dp-axion-wilson-beta-audit-2026-09-07.md), Python/JSON. wilson 2.5.2 independently reproduces the analytic mixed source, VLL homogeneous factor and QCD Yukawa term at the aligned boundary. Full gaugeless beta functions also evolve current coefficients and generate C_qu^(1), absent from the preceding pure-QCD subset. Next integrate the coupled system with complete declared boundary and compatible finite matching. This is a boundary audit, not full evolution or model admission.

- **2026-09-07 — selected leading-log QCD calculated:** [packet](casimir-dp-axion-mixed-qcd-leading-log-2026-09-07.md), Python/JSON. Six-flavour running of the top Yukawa and VLL coefficient with the verified electroweak source gives a ratio 0.9445066 to no-QCD at M=2 TeV and diagnostic alpha_s(162.6)=0.108. Analytic and ODE solutions agree. This is not eta_tT, a full QCD correction or a scale-uncertainty band; do not multiply it into the old eta without separating overlap. Next complete coupled-operator/QCD matching and consistent signed flavor inputs. No model admitted.

- **2026-09-07 — mixed electroweak overlap closed:** [packet](casimir-dp-axion-mixed-box-matching-2026-09-07.md), Python/JSON. Published U hard matching plus generic SMEFT current evolution and finite electroweak matching reproduce the leading mixed top-heavy full box. Both matching scales cancel; the additional flavor sum vanishes by up/top projector orthogonality. At 2 TeV full/EFT=0.99836888. This resolves that electroweak overlap, not QCD or CKM fitting. Next treat QCD using the verified hard/evolution split, then consistent signed flavor inputs. No full model admitted.

- **2026-09-07 — heavy-box overlap verified:** [packet](casimir-dp-axion-heavy-box-overlap-2026-09-07.md), Python/JSON. The pure-heavy full electroweak box approaches the published U-singlet four-quark coefficient with consistent Hamiltonian and left-current normalization. At 2 TeV its full/leading ratio is 1.047695; this real aligned term is already counted and has no CP phase. Next complete the mixed top-heavy hard/EFT overlap, including current mixing and scale cancellation, before heavy-scale QCD evolution. No full matching or model admission claim.

- **2026-09-07 — VLQ source representation corrected:** [audit](casimir-dp-axion-vlq-representation-audit-2026-09-07.md). The five-representation study 1609.04783 omits our up singlet. Replacement 2204.05962v2 explicitly includes it and provides relevant supplementary one-loop coefficients. Its tree C_Hq^(1)=-C_Hq^(3) agrees with the archived current shift. Next check four-quark coefficients, flavor-basis rotation and overlap with the existing full-theory box; retain the light pseudoscalar in any EFT. Electroweak matching is not the missing QCD calculation. No model admitted.

- **2026-09-07 — QCD sensitivity separated:** [packet](casimir-dp-axion-kaon-qcd-sensitivity-2026-09-07.md), Python/JSON. Charm cancels only 0.03135% of the top–messenger contribution. Borrowed SM eta errors contribute about 1.1% under any correlation, but do not quantify heavy-matching error. Original yL=0.2 needs eta_tT≈0.1633 versus reference 0.5765 to reach the dated same-sign endpoint. Next inspect representation-specific VLQ matching (1609.04783), prioritizing the top–messenger coefficient and consistent CKM inputs. No full QCD or model admission claim.

- **2026-09-07 — kaon/mass tradeoff:** [packet](casimir-dp-axion-kaon-mass-tradeoff-2026-09-07.md), Python/JSON. At fixed gu, reducing the conditional kaon contribution increases the yR-dependent potential mass curvature; their product is approximately constant. The smaller-coupling reference gives 12.6563 GeV² against ma²=1 GeV². This is a scheme-specific matching cost, not a pole-mass result or naturalness exclusion. Retain the family conditionally; pursue signed CKM/heavy-scale QCD constraints before refreshing the full two-target loop prediction. No model admitted.

- **2026-09-07 — kaon charge sign:** [packet](casimir-dp-axion-kaon-charge-sign-2026-09-07.md), Python/JSON. With unchanged decay/absorptive assumptions, the magnitude-reflected solution predicts negative A_L≈-0.00323, whereas the authenticated average is +0.00332. Flavor rephasing cannot fix |q/p|. A compensating right-sign rate asymmetry would need about 0.00655 and has not been generated by the model. Deprioritize the reflected branch conditionally; reopening requires explicit DeltaS=1/absorptive matching and external constraints. Continue the small-yL fixed-gu family with signed CKM/QCD analysis and mediator corrections. No model admitted.

- **2026-09-07 — signed kaon branches:** [packet](casimir-dp-axion-kaon-signed-branches-2026-09-07.md), Python/JSON. A dated fixed-input magnitude sensitivity has a small-coupling branch yL≤0.10639 and a reversed-total-sign branch yL≈0.40018–0.43386. These are not confidence regions. At fixed gu, the second branch reduces yR-squared mediator corrections; it must face rephasing-invariant kaon phase and decay tests before being considered physical. Next priority is authenticating those observables and computing their sign consistently, then a joint CKM/QCD analysis. No model admitted.

- **2026-09-07 — conditional epsilon_K conversion:** [packet](casimir-dp-axion-epsilon-kaon-conversion-2026-09-07.md), with reproducible Python/JSON. The aligned yL=0.2 reference gives |epsilon_K^NP|≈0.00100852, 45.27% of the measured magnitude, with opposing imaginary amplitude at fixed CKM. This is conditional tension, not a global exclusion. A dated diagnostic scale selects yL≈0.09917, yR≈0.006453 at fixed tree gu, while increasing the leading mediator mass correction 4.066-fold. Next: consistent signed CKM/kaon screening and heavy-scale QCD matching along the fixed-gu family, before smaller scattering-loop refinements. No model admitted.

- [Aligned messenger kaon box screen](casimir-dp-axion-kaon-box-screen-2026-09-07.md): full four-row GIM accounting leaves a material heavy-quark contribution even with no new CP phase. At the frozen yL=0.20 point its imaginary kernel is -0.42776 times the unweighted leading SM imaginary kernel. Six algebraic/loop checks pass. This is not an epsilon_K ratio or exclusion; conversion with consistent QCD, hadronic and CKM inputs now takes priority over further small scattering-loop refinements.

- [APV matching dispute audit](casimir-dp-apv-matching-dispute-2026-09-07.md): located the July published proposal, a direct finite-nuclear-size critique and the proposal's explicit published response. The issue is contested separation of coherent nuclear response from short-distance matching; overlap with conventional weak-charge coefficients has not been independently resolved. The prior alternate cesium shift stays an unadmitted sensitivity exercise. Continue independent flavor constraints without treating this literature dispute as a measured effect or universal blocker.

- [Neutral-current weak-charge screen](casimir-dp-axion-neutral-current-screen-2026-09-07.md): the same aligned messenger predicts delta QW(p)=-0.000605961 and delta QW(Cs)=-0.0569603. The proton PVES summary gives a -0.378 Gaussian pull; the cesium interpretation changes materially with the theory baseline, including an independently unverified 2026 proposed correction. Three mapping checks pass. No combined fit or exclusion is claimed; radiative-correction overlap and flavor alignment require further evidence.

- [Weak-current mixing screen](casimir-dp-axion-weak-mixing-screen-2026-09-07.md): aligned up-singlet mixing predicts first-row CKM deficit 0.0003029804 and delta gL_u=-0.0001514902. A specified PDG independent-row summary gives a 1.85-sigma Gaussian pull, not a global exclusion or model validation. A four-point fixed-gu family shows that weak currents can separate messenger couplings otherwise degenerate in the pseudoscalar portal. Five checks pass; neutral-current precision data and flavor alignment are the next independent constraints to inspect.

- [Exact Higgs-background neutral loop](casimir-dp-axion-broken-higgs-loop-2026-09-07.md): included heavy-light and heavy-heavy Higgs couplings with exact yL v/MU mixing at yu=0. The scalar propagator-only correction changes from -1.73839208e-4 to -1.73598292e-4, a +2.40917e-7 change relative to the tree amplitude. Four derivative/recovery/input-condition checks pass. This controls the background approximation for the CP-even neutral component only; CP-odd hadronic, vertex/fermion and electroweak input matching remain open.

- [Neutral messenger pole subset](casimir-dp-axion-messenger-pole-subset-2026-09-07.md): evaluated six finite input counterterms from the leading neutral heavy-light two-point/tadpole contribution. Full momentum dependence matters at the heavy scalar pole; a linear expansion misses 15.13% of this loop's momentum increment there. The spacelike scalar propagator-only amplitude correction is approximately -1.73839e-4. Three checks pass. Electroweak input conversion, broken-background, vertex/fermion and other matching terms remain excluded; totals are unchanged.

- [Scalar reference input scheme](casimir-dp-axion-scalar-input-scheme-2026-09-07.md): enumerated the thirteen-coefficient CP/gauge-invariant renormalizable scalar potential and verified that six vacuum/mass conditions leave seven inputs. Selected explicit full-theory MS-bar boundary assumptions at MU=2 TeV reproducing the existing tree reference, with a declared pole/tadpole/mixing prescription for the dependent coefficients. Four algebraic checks pass. Counterterm equations are specified but not yet evaluated; no total-rate update or full-model admission follows.

- [Scalar input identifiability](casimir-dp-axion-input-identifiability-2026-09-07.md): a CP/gauge-allowed diagnostic family preserves tree masses, mixing and even the signed light-Higgs AA coupling while changing the radial contribution to the spacelike triangle. Two trilinears fix only two combinations of four displayed deformations. At xi=1 GeV the isolated zero-transfer triangle changes by 5.67 times but remains only 2.07e-6 of the tree scalar amplitude. This is an input-degeneracy demonstration, not an uncertainty band or new fit. A declared renormalized input/boundary prescription remains necessary before updating totals.

- [Messenger field normalization](casimir-dp-axion-field-threshold-2026-09-07.md): derived the leading heavy-light two-point subset, checked its potential mass sign, and verified exchange-amplitude invariance under consistent field redefinition. At mu=MU, delta ZA=1.94537e-7 and delta ZH=3.79954e-4; field-only quartic and portal entries are scheme-dependent components, not rate shifts. Physical-input/counterterm choices and full amplitude matching remain open; joint forecasts are unchanged.

- Axion [potential-running ledger](casimir-dp-axion-potential-running-2026-09-07.md) derives the additive messenger mass/quartic scale terms and checks cancellation of explicit scale dependence. Three checks pass. Existing gluon insertions and finite-Q CP-even triangles are acknowledged; the missing work is full hard matching/subtraction and field/parameter matching, not recalculating those subsets. No potential-only correction is promoted to an observable shift.

- [Shared-ratio review](casimir-dp-shared-ratio-review-2026-09-07.md): all 54 archived axion/absorption rows compared with their same-parameter local upper estimates and raw Xe counts. Ratios remain tiny; common rate scaling cancels. Three checks pass. Axion matching resumes as the default completion target; absorption requires genuinely new response/constraint evidence rather than further acceptance arithmetic.

- [Neutron-response qualification](casimir-dp-absorption-response-qualification-2026-09-07.md): KamLAND transport references located, but no directly reusable response matrix found in the inspected sources. Complete final-state/selection requirements and exact binomial simulation thresholds are recorded; 52 accepted of 100,000 valid unweighted signal trials would place a one-sided 95% simulation lower bound above the conditional acceptance ceiling. No transport was run and no exclusion follows.

- Conditional [neutron-shift and acceptance screen](casimir-dp-absorption-neutron-shift-2026-09-07.md): rigid diagnostic energy shifts give 59,642–64,404 primary KamLAND interactions under the stated source exposure. The raw 18-candidate Poisson screen requires mean acceptance below approximately 0.04%. Four checks pass. Neither the rigid neutron mapping nor detector acceptance is authenticated, so no exclusion is promoted; transport now has a quantitative target.

- Conditional [spectral convolution](casimir-dp-absorption-spectral-convolution-2026-09-07.md) now yields binned primary proton spectra under the explicitly projected point-vector current. Spectator-recoil plus Pauli case gives rate/sigma0=0.30005 and local carbon-12 proton-only D <= 5.434e-26. Four checks include the independent free moving-target limit. No neutron, many-body current or detector-response authority is claimed.

- [Removal-energy and species audit](casimir-dp-absorption-removal-convention-2026-09-07.md): newer carbon primary work confirms proton normalization to Z and motivates resolved residual states. Exact spectator bookkeeping yields a conditional 2.329 MeV mean recoil on the legacy table; four conservation/support checks pass. A neutron response and consistent off-shell current remain prerequisites to the absorption convolution.

- Carbon [spectral-function intake](casimir-dp-absorption-spectral-intake-2026-09-07.md): archived public GENIE table and loader at a fixed commit; independently recovered normalization 5.999988 nucleons and the single radial p-squared weight. Five checks pass. This explicitly legacy table is a comparison input; neutron isospin/removal-energy and off-shell current conventions remain necessary before rate convolution.

- Absorption [Fermi-gas kernel](casimir-dp-absorption-fermi-kernel-2026-09-07.md): exact on-shell vector rate and phase space give 180.5 unblocked or 104.3 Pauli-blocked xenon primary interactions at the fixed coupling, with negligible conditional local encounter decoherence. Four checks pass. Binding, response partition and detector transport remain absent; these are not accepted event predictions or exclusion bounds.

- Literal absorption [source-form comparison](casimir-dp-absorption-source-form-2026-09-07.md): source Helm yields 5.382 raw xenon events and conditional local D <= 9.813e-26 at the frozen 247 MeV/11.5 TeV benchmark. Four checks pass. Quoted source enhancement, isotope endpoints and one-event estimate are not reproduced; no coupling fit or exclusion promotion is made.

- KamLAND provenance audit: [absorption constraint audit](casimir-dp-absorption-kamland-audit-2026-09-07.md) authenticates the rebinned residual arrays but flags raw-count, covariance and response-template limitations. The preliminary 80 TeV bound remains conditional; shared rate scaling and four arithmetic checks are recorded without exclusion promotion.

- September 7: [Absorption rate normalization](casimir-dp-absorption-rate-2026-09-07.md) verifies sigma*v with an explicit temporal-vector spin trace and phase space, then uses one coefficient for Xe and carbon. At 247 MeV and Lambda=11.5 TeV, illustrative Helm/KN prescriptions give 4.0906/0.2254 raw xenon events and local independent-channel D estimates below 9e-26; the point-nucleus channel comparison is below 4.5e-24. Four checks pass. Finite-size model spread is not an uncertainty interval, no accepted-event fit is made, and incoherent/solid channels, decay stability and the reported KamLAND tension remain open.

- September 7: [Shared-model priority review and absorption intake](casimir-dp-shared-model-priority-review-2026-09-07.md) compares the five leading branches and preserves the axion assembly as a conditional reference with negligible calculated local effect. The new absorption kinematic check gives 249.716 keV on Xe131 and 2.67071 MeV on C12 for 247 MeV chi, with three conservation/inversion checks passing. This route differs from endothermic up-scattering but is not a rate prediction; next audit its sigma-versus-sigma*v convention and applicable incoherent constraints before allocating a full calculation. All model-admission gates remain open.

- September 7: [Shared coupling competition](casimir-dp-neutrino-coupling-survival-2026-09-07.md) scales production, pion decay and the inherited local response consistently. For the three mass benchmarks and a hypothetical 1 cm path, the low-energy coupling-independent envelopes are at most 6.404e-5 surviving events; separate high-energy envelopes are below 1.91e-16. The same low-range optimal couplings give independent-carbon D upper estimates 2.42e-25–6.16e-24. Four checks pass. Deprioritize the escaped-chi detectable-bridge interpretation within these assumptions; preserve decay-cascade acceptance, actual geometry and full hadronic uncertainty as unresolved rather than claiming an exclusion. Compare other mechanisms before further coupling tuning.

- September 7: [Separate high-energy survival contribution](casimir-dp-neutrino-highflux-survival-2026-09-07.md) extends the atmospheric integral from 10 TeV to 100 PeV without fitting a splice. For a hypothetical 10 cm path, the added contribution is 0.7–1.6% of the prior contribution for the two 1 GeV benchmarks and 1.30 times the prior contribution for the 2 GeV benchmark; all remain tiny in absolute normalization. Four numerical checks pass. Angular gaps, Earth propagation, astrophysical flux and hadronic uncertainty remain explicit. Next vary the common coupling product consistently in production and decay to test whether increased production can rescue the prescribed-path surviving rate.

- September 7: [High-energy NuFlux intake](casimir-dp-neutrino-highflux-intake-2026-09-07.md) archives sixteen H3a_SIBYLL23C atmospheric spline tables plus source/reference files. An independent reader agrees with 512 in-domain upstream values within 13.3 ppm; strict 1e-10 parity failed and is not claimed. Sampled flux now extends beyond 10 TeV, but a one-degree horizon belt is excluded and Earth transport/astrophysical components are absent. Four intake checks pass. Next compare the overlap and compute a separately labeled high-energy contribution before any all-energy survival conclusion.

- September 7: [Flux-weighted flight survival](casimir-dp-neutrino-flux-survival-2026-09-07.md) integrates the same production and conditional decay kernels. In the supplied flux range, 202–269.9 keV recoil survival fractions are 3.75e-6–9.79e-6 for an illustrative 1 mm path and 4.07e-15–4.45e-14 for 10 cm. The 2 GeV benchmark receives 89.7% of its 10 cm surviving contribution from 5–10 TeV, so an authenticated high-energy extension is needed before any all-energy statement. Five checks pass. These are prescribed-path survival calculations, not accepted LZ events; cascade transport and geometry remain required, and hadronic uncertainties remain open.

- September 7: [Conditional dispersive basis calculation](casimir-dp-neutrino-dispersive-basis-2026-09-07.md) uses well-conditioned right normalization, printed NLO subtractions and the paper's channel projection. Under this prescription the narrow pion slice is enhanced about 2.2 times over same-mass LO, giving partial-width flight estimates 0.0229–0.1095 mm at 10 GeV. Raw versus normalized widths differ about 0.2%, so that matrix discrepancy does not rescue escape in this diagnostic. Five numerical checks pass, but phase-sample spread is not full hadronic uncertainty; sample pairing/integral-equation accuracy and mass conventions remain unresolved. Next prioritize flux-weighted survival and decay-cascade response while retaining those limitations. Shared-model admission remains open.

- September 7: [Dispersive numerical intake](casimir-dp-neutrino-dispersive-intake-2026-09-07.md) archives the 2024 author implementation and four Omnes tables at pinned commit `6a6dcfccf903317ea2104e27bb1dbbc7ad1d9fc7`: 100 samples and 601 common s nodes. Four integrity/audit checks pass, but direct adoption fails two checks: zero-momentum identity residuals reach 0.1191 and the source GammaK0 normalization differs from the printed NLO expression (2.88576 versus 1.52763 in units of m_pi^2/2). Next reconcile the basis, use audited subtraction expressions, and quantify pion-mass conventions before revising the decay prediction. No numerical lifetime upgrade or exclusion is admitted yet.

- September 7: [Up/down pion form-factor survival requirement](casimir-dp-neutrino-formfactor-survival-2026-09-07.md) isolates the correct mass-weighted light-quark form factor and its absolute normalization. For the three closed-two-body benchmarks, 50% survival over an illustrative 10 cm at 10 GeV requires the narrow-slice weighted squared form factor to be at most 0.000368–0.001764 of the LO normalization. This is a necessary condition, not a QCD bound, detector acceptance, or exclusion. No numerical dispersive table was authenticated; the next input is the properly normalized timelike form factor and its uncertainties, followed by decay-cascade response. Four calculation checks pass; shared-model admission remains open.

- **Off-shell low-dipion slice, September 7:** [packet](casimir-dp-neutrino-dipion-slice-2026-09-07.md) evaluates chi->nu pi pi below 0.35/0.45/0.5 GeV dipion mass for the closed-two-body benchmarks. The narrowest LO slice implies 0.053–0.254 mm mean flight at 10 GeV incident energy. These are conditional chiral estimates, not rigorous physical lifetime bounds. Fixed-product Yukawa repartition does not reduce this contribution. Four checks pass. Scalar pion form-factor uncertainty and cascade detector response are now priorities; no stable-escape assumption or gate promotion.

- **Outgoing neutrino-produced state survival, September 7:** [packet](casimir-dp-neutrino-two-body-survival-2026-09-07.md) derives and independently spin-trace-checks chi -> nu phi. At (mchi,mphi,y)=(2 GeV,1 GeV,0.02), mean flight is 2.16e-10 m for a 10 GeV incident neutrino and 248 keV recoil. Raw recoil forecasts therefore cannot assume an escaping stable chi. Fixed-product coupling repartition cannot yield a 10 cm mean flight within the stated |yq|<=sqrt(4pi) diagnostic over the tabulated energies. Closed two-body channels remain stability-undetermined. Four checks pass; mediator daughters, off-shell decays and detector selection remain open, with no exclusion or gate promotion.

- **Neutrino low/high shape screen, September 7:** [packet](casimir-dp-neutrino-shape-screen-2026-09-07.md) finds raw low/high ratios 14.162–224.335 across 15 produced/mediator mass points, failing both of the source's inconsistent fractional-background surrogates when the high expectation is set to one. These are not statistical exclusions. At mchi=2 GeV, an artificial 10 GeV incident cap changes the ratio from 15.656 to 0.545, demonstrating sensitivity to discarding the high-energy tail. Four checks pass. Prioritize detector-folded spectral compatibility and outgoing-state survival before further local-response refinement; no gate promotion.

- **First common neutrino-target fold, September 7:** [packet](casimir-dp-neutrino-joint-2026-09-07.md) declares three degenerate orthogonal outgoing states with Y†Y proportional to identity, fixed coupling ratio 0.02 GeV^-1, produced masses 1/2 GeV and mediator masses 1/10 GeV. With the pinned 2026 flux, raw Xe full-window counts span 0.02835–1.79678, while conditional independent-carbon D upper estimates span 1.53e-23–1.98e-21. Four checks pass. The realistic high-energy flux produces a low-recoil tail; source-window and detector boundaries remain distinct. No fitted normalization, constraint admission, full-material bound or gate promotion.

- **Pinned 2026 atmospheric flux comparison, September 7:** [packet](casimir-dp-neutrino-flux-update-2026-09-07.md) archives the primary-linked DUNE tables at commit f5a8bab508c6ad5874070f0f6b83409baa96d3d2. Integrated new/Honda flux ratios at the tested GeV thresholds differ by roughly -3.4% to +2.3%; these are model comparisons, not uncertainty bands or event-rate ratios. Muon-propagation variants are identical above 1 GeV in the tables. Four checks pass. Next is a flavor-explicit shared interaction fold with a separately specified mediator mass; no detector normalization or gate promotion.

- **Homestake atmospheric flux archive, September 7:** [packet](casimir-dp-neutrino-flux-intake-2026-09-07.md) pins Honda solar-min/max all-direction tables and a 20-zenith-bin cross-check, covering 0.1–10,000 GeV. Angular averaging agrees within 4.511e-5. Four checks pass. Units require 4pi/10,000 for the angle-integrated cm^-2 flux; no extra speed factor. HTTP provenance is explicit, flavor/oscillation assumptions remain unresolved, and the local site is unspecified. A newer primary-linked July 2026 data repository is identified for comparison. No event normalization or gate promotion.

- **New atmospheric-neutrino lead, September 7:** [intake](casimir-dp-neutrino-upscatter-intake-2026-09-07.md) inspects 2609.04185v1 and reproduces exact free-nucleus kinematics. For a 2 GeV produced particle, 248 keV requires 8.26464 GeV incident neutrinos in Xe131 versus 26.99082 GeV in C12. Four checks pass. A decreasing flux is not a strict low-recoil cutoff. The source's one-event normalization, conflicting 10^-3/10^-4 background cuts and different recoil window are not an admitted likelihood. Next priority for this competing population: authenticated atmospheric flux and a common two-target rate. The produced state is not assumed to be dark matter; no gate promotion.

- **Equilibrium thermal closure, September 7:** [packet](casimir-dp-axion-thermal-closure-2026-09-07.md) uses Gibbs detailed balance to extend the any-orientation scalar bound to energy-releasing transitions at 4 K. The central lambda=0.03 total is D<=1.81327e-14. This is a loose bound, not a predicted thermal rate increase. Four checks pass. Born/contact and high-momentum-envelope assumptions remain; actual equilibrium is not established and driven/non-equilibrium energy release is outside scope. No gate promotion.

- **Any-orientation scalar envelope, September 7:** [packet](casimir-dp-axion-direction-envelope-2026-09-07.md) removes the preceding closure screen's rotational-averaging restriction using an unnormalized positive majorant of the shifted halo distribution. The central multiplier is 7.43132, giving D<=3.36943e-15 at lambda=0.03 for any fixed crystal orientation. Four checks pass. Born/contact, nonnegative target energy and the specified halo remain assumptions; thermal energy release and UV validity remain open. No gate promotion.

- **Inclusive scalar-density closure screen, September 7:** [packet](casimir-dp-axion-scalar-closure-bound-2026-09-07.md) replaces independent nuclear final states by a conservative norm/closure bound in the rotationally averaged, non-energy-releasing Born contact model. At lambda=0.03, D<=4.53410e-16, still about 6.5e13 below the frozen DP comparator despite permitting a 2.09e13 enhancement over the independent scalar estimate. This is not a full UV/material bound: fixed crystal orientation, thermal energy release and the contact envelope at GeV momentum require separate treatment. Collective enhancement alone is deprioritized as a route to percent-level overlap in this channel; small-signal prediction completion remains open.

- **Messenger-gluon EFT insertions, September 7:** [packet](casimir-dp-axion-gluon-insertion-2026-09-07.md) projects the selected heavy-messenger terms through the LO scalar trace anomaly and the authenticated pseudoscalar triangle. Their net benchmark correction is +6.72206e-5 of the tree potential. The paired contact forecasts shift from 1.37450164 to 1.37459954 raw full-window xenon events; the independent-nucleus local estimate stays near 2.18e-29. Four checks pass. Full-theory gluon subtraction, higher-dimension matching and renormalization remain open; no bound on omitted terms or gate promotion.

- **Heavy-messenger gluon threshold, September 7:** [packet](casimir-dp-axion-heavy-gluon-threshold-2026-09-07.md) derives CP-even a²G² and Higgs G² operators from the heavy mass eigenstate in the yu=0 approximation. In the explicit alpha_s/pi convention, Kaa=1.06602e-13 GeV^-2 and Kh=1.02552e-7 GeV^-1. Four checks pass. These are additional messenger terms, distinct from SM heavy flavors already in f_N. Do not integrate out the light up eigenstate or add an unsubtracted full box on top. Next: EFT insertion, light-field matching and the remaining hard contribution; no forecast or gate promotion yet.

- **Higgs/gluon ledger and hadronic sensitivity, September 7:** [packet](casimir-dp-axion-higgs-hadronic-ledger-2026-09-07.md) distinguishes heavy-quark gluons already contained in the total Higgs-like nucleon factor from missing nonuniversal box matching. A published one-body f_N=0.307±0.018 sensitivity scan gives 1.31891–1.50857 raw full-window xenon events and 2.02403e-29–2.55520e-29 local independent-nucleus exponent upper estimates at fixed benchmark couplings. This is not a joint confidence interval or a new admitted model. Four checks pass. Do not add the already-included Higgs heavy-quark term twice or import the two-body effective f_N into carbon without target response.

- **Finite-Q CP-even triangle, September 7:** [packet](casimir-dp-axion-finite-scalar-triangle-2026-09-07.md) extends the dominant calculated scalar triangle to spacelike transfer, including the exchanged scalar propagator. Its amplitude varies by at most 4.503e-6 on the 24-point benchmark grid through Q=0.262 GeV. Four checks pass, including a positive-integral bound and zero-transfer recovery. This reduces the priority of heavy-scalar contact error; it does not bound light-mediator boxes, hadronic form factors or omitted matching terms. No gate promotion.

- **Conditional assembled axion prediction, September 7:** [packet](casimir-dp-axion-assembled-subsets-2026-09-07.md), executable and 48-row JSON combine O6, scalar tree, calculated triangles and proton/neutron scalar/twist boxes. At lambda=0.03 the linear-interference benchmark gives 1.37450 raw full-window xenon events and a 2.17972e-29 independent-free-nucleus local exponent upper estimate. A prescribed 2.16749 GeV hadronic boundary and scalar Q=0 contact approximation remain assumptions, not UV matching. Four assembly checks pass. No fitted explanation or gate promotion: finite-Q loop matching, hard gluons, counterterms, material response and detector likelihood remain open. This channel remains negligible against the frozen DP comparator.

- **Native-grid PDF moments (September 7):** [moment packet](casimir-dp-axion-pdf-moments-2026-09-07.md) integrates the authenticated 240x37x11 CT14lo grid at its native Q knots. Four checks pass, including momentum and valence sums. Independent interpolators differ by at most 2.49e-6 per flavor moment; raw bottom moment at the set's 4.75 GeV threshold is -1.11e-7. This is independent interpolation, not official LHAPDF parity; tiny raw negatives, missing small-x tails and QMin remain explicit. Common-scale axion matching is still required.

- **Heavy threshold and PDF intake (September 7):** [threshold packet](casimir-dp-axion-heavy-threshold-2026-09-07.md) validates the leading dual threshold map and rejects blindly decoupling the rounded-source bottom residual. Four checks pass. The complete CT14lo central grid and metadata are archived with SHA-256 provenance; their 4.75 GeV bottom parameter and QMin=1.295 GeV must be respected. Next is grid interpolation/moment validation, followed by common-scale matching; acquisition alone is not PDF or model validation.

- **Spin-two RG transport (September 7):** [evolution packet](casimir-dp-axion-twist-rg-2026-09-07.md) implements dual Wilson/momentum evolution over a fixed five-flavor MZ-to-10-GeV interval. Five checks pass, including amplitude invariance and an independent ODE. In the test vector, evolving moments alone errs by 12.6%, while discarding generated gluon coefficients errs by 5.3%. This validates transport, not an axion boundary assignment; heavy thresholds and low-mediator-scale matching remain required.

- **Box hadronic projection (September 7):** [hadronic packet](casimir-dp-axion-box-hadronic-2026-09-07.md) projects the leading up-scalar box with published sigma-term sensitivities, giving central Lagrangian C_p=7.781e-16 and C_n=6.866e-16 GeV^-2. The script rejects missing/mismatched scales for the traceless contribution: available source PDF moments are at mZ, not an established matching scale for this calculation. Four checks pass. Complete quark/gluon evolution, QCD uncertainty and finite-Q nuclear matching remain required before admission.

- **Dirac up-quark box subset (September 7):** [box packet](casimir-dp-axion-dirac-box-2026-09-07.md) separates scalar and symmetric-traceless coefficients using combined denominator integrals. Two integration orders and a forward Dirac decomposition check pass. At the benchmark C_u=4.577e-14 GeV^-3; the mass-weighted traceless combination is 2.343e-16 GeV^-3 after cancellation. These are zero-transfer partonic Lagrangian coefficients, requiring proton/neutron matrix elements, scale matching and sign conversion before combination with the earlier potential coefficients. Full QCD/finite-transfer and renormalization authority remains open.

- **CP-even scalar triangles (September 7):** [scalar-triangle packet](casimir-dp-axion-scalar-triangle-2026-09-07.md) computes the finite trilinear subset, including mixed internal mass eigenstates. Its zero-transfer amplitude correction is about +3% of the tree scalar coefficient over the examined quartics, much larger than the suppressed pseudoscalar subset. An independent matrix-log derivative agrees within 1.43e-7. This supersedes any interpretation of the axion cancellation as total-loop suppression; full renormalization, finite transfer and remaining operator matching are still required.

- **Messenger finite quartic threshold (September 7):** [threshold packet](casimir-dp-axion-messenger-threshold-2026-09-07.md) derives delta kappaA=-Nc yL-squared yR-squared/(4 pi-squared)=-3.113e-8 in the leading yu=0 potential matching. High-precision eigenvalue expansion and three-scale checks pass. A logarithmic mixed term cancels at this order. Under an explicit zero independent-boundary assumption it nearly cancels the earlier triangle subset at one benchmark; that proximity is neither protected nor a complete two-loop result. Independent boundary coefficients, field matching and other loop operators remain open.

- **Finite axion triangle subset (September 7):** [triangle packet](casimir-dp-axion-triangle-subset-2026-09-07.md) derives the Dirac two-pseudoscalar triangle with both CP-even exchanges and explicit kappaA dependence. The minimal zero-transfer triangle/tree ratio is 3.661e-7; illustrative kappaA=1e-3 gives 0.01220. Four checks pass, including an independent B0 derivative and the scalar mass-matrix contraction. This is a finite subset, not full loop matching or a universal floor. Remaining scalar, box, twist-2/gluon and renormalization contributions must be completed consistently.

- **Axion potential closure (September 7):** [potential packet](casimir-dp-axion-potential-closure-2026-09-07.md) reconstructs a minimal soft-breaking tree potential with exact physical masses, verifies Cartesian/polar on-shell vertices and the exact radial/Higgs scalar coefficient. Four checks pass. The explicitly U(1)-breaking messenger permits additional scalar counterterms: an A-squared/Higgs operator can change the trilinear without changing the specified masses. Thus the next loop calculation needs a declared matching boundary condition or parameterized symmetry-breaking coefficients; no universal loop floor is established by the current inputs.

- **Axion tree companions and loop scope (September 7):** [companion packet](casimir-dp-axion-tree-companions-2026-09-07.md) adds the same radial/Higgs quartic to both targets. At quartic 0.03 the central 400 GeV point gives 1.330 raw total Xe events and a local independent-nuclear tree envelope D<=2.056e-29. Four checks pass. Scalar and spin rates add for unpolarized DM, but scalar loops must interfere at amplitude level. The cited Majorana/two-Higgs loop calculation is not a numerical substitute for this Dirac/up-quark/radial-singlet completion. Next is explicit model-specific loop and renormalization matching; complete material and detector admission remains open.

- **Axion shared spin rates (September 7):** [joint spin diagnostic](casimir-dp-axion-joint-spin-2026-09-07.md) now integrates the same LO pseudoscalar coefficients and shifted halo for xenon and approximate independent C13 recoils. At the central 400 GeV point it gives 0.60181 raw Xe events and local D<=1.696e-31; these are channel-specific predictions, not an LZ fit or full diamond bound. Four checks pass across a 72-row sensitivity packet. Next priority is radial/Higgs scalar and loop companions, with exact detector and material completion still required.

- **Axion longitudinal matching (September 7):** [conditional derivation](casimir-dp-axion-longitudinal-matching-2026-09-07.md) distinguishes pseudoscalar density from induced axial current, retains pion and eta poles, derives the approximate C13 longitudinal factor `-(1+2y)exp(-y)/3`, and verifies a free-nucleon spin normalization anchor. Five numerical checks pass. The radial/Higgs scalar cross-section estimate is independently reproduced, but its quartic and loop completion remain additional shared-model inputs. Next priority is Xe longitudinal normalization and common-halo target integration; no joint prediction or detector fit is admitted.

### Primary-lead refresh: axion portal and seasonal inelasticity — September 7, 2026

[Intake packet](casimir-dp-primary-lead-refresh-2026-09-07.md) inspects two September 3 primary papers. The axion portal supplies a distinct O6/pion-pole kernel; its soft operator factor is about 2.23e-33 of the 246 MeV value at hbar c/d, not a local rate. Template bracketing is not accepted as a likelihood-significance bound. The seasonal inelastic lead supplies a time discriminator, but its high splitting remains closed to free-carbon scattering. Three intake checks pass. Next calculate matched longitudinal-spin Xe/C13 responses and audit companion scalar channels; no model is promoted and the goal remains active.

### Joint force and bubble-drift screen — September 7, 2026

[Joint screen](casimir-dp-portal-joint-force-loop-2026-09-07.md) enforces both requirements in the fixed-C/aN family. A declared 10% bubble-drift tolerance gives Delta_lambda <= 0.401335 and raises the reference-strength large-cavity confinement requirement to 1.087 MHz. Lowering the light product permits smaller force allowances; at a hypothetical 100 kHz the conditional common-halo rigid-vacuum envelope is 2.31e-6. Four checks pass. These are explicit component diagnostics, not actual trap specifications or a full apparatus/loop fit. The 277 kHz endpoint remains unadmitted. Lower-signal common models remain legitimate candidates; S1 and the goal stay open.

### Loop-control correction to strong force-reduction endpoint — September 7, 2026

[Pair-loop packet](casimir-dp-portal-pair-loop-drift-2026-09-07.md) computes the subtraction-independent quadratic-scalar bubble drift. At the 277 kHz tree endpoint it changes the contact-like coefficient by 1.546 times tree C across local/hard scales, and 15.4% across a representative Xe window. The original weaker point has only 0.128% cross-scale drift. Four checks pass. A 10% diagnostic requires Delta_lambda <= 0.4013 but is not a physical exclusion. Tree identities and the Higgs screen alone do not admit the strongest endpoint; one-loop renormalization/matching or a lower-coupling region now takes priority before interpreting medium opacity or full joint predictions. S1 and the goal remain open.

### Heavy-contact transport column screen — September 7, 2026

[Heavy-column packet](casimir-dp-portal-heavy-column-2026-09-07.md) evaluates 60 mass/composition/column/coupling cases. At the matched 1 TeV point an A=56 column of 7e9 g/cm2 gives optical depth 2.33e-9; even the largest conditional-count-ceiling case remains below 4.77e-4. Three consistency checks pass. Columns are explicit benchmarks, not authenticated overburden. This clears only the known elastic heavy component as a major attenuation mechanism; connected light-medium fluctuations, quadratic vertices and interface backgrounds remain unresolved. Mean-field refraction must not be double counted as independent coherent constituent collisions. S1 and the goal remain open.

### Collisionless center transport: mass-well sign and phase-space accounting — September 7, 2026

[Center-transport packet](casimir-dp-portal-center-transport-2026-09-07.md) finds a 5.1605 keV attractive mass well in the suppressed cavity. At 1 TeV, its ideal central speed floor is 30.46 km/s and unbound density increases by 0.79%. Low-speed incident particles accelerate rather than being cut off. At the exact transparent spherical center, Liouville mapping preserves the density-weighted inverse-speed tensor; changing speeds alone would be inconsistent. Four checks pass. This does not establish wall transmission, noncentral trajectories, a full LZ transport model or valid fixed sphere branches. Next audit wall interaction/transport scales. S1 and the goal remain open.

### Common shifted-halo scalar envelope and xenon components — September 7, 2026

[Common-halo packet](casimir-dp-portal-common-halo-2026-09-07.md) removes the mono-speed mismatch and retains the wind-axis tensor. At 1 TeV the central-halo rigid-vacuum local envelopes are 0.02106 parallel and 0.03231 perpendicular; these are not predicted measured contraction or a DP fit. The matched heavy Xe high-window expectation remains 0.000228. Four normalization/tensor/refinement checks pass across 18 mass/halo cases. Force constraints remain active; unattenuated transport, low-speed eikonal validity, chamber response and full xenon light channels are unresolved. Next audit incident transport. S1 and the goal stay open.

### Finite rigid-sphere envelope parameterized by force allowance — September 6, 2026

[Finite-sphere packet](casimir-dp-portal-finite-sphere-force-envelope-2026-09-06.md) evaluates an exact-shape/exact-separation quadratic eikonal envelope in homogeneous vacuum, including all impact parameters within the rigid elastic model: D <= 0.015617 at the illustrative coupling and mono-speed transverse incidence. The separate weak-source plate mapping gives D limits 6.19e-8 at a hypothetical 10 kHz force allowance and 6.19e-4 at 100 kHz for the thin 2900 kg/m3 benchmark. No trap capability is assumed. Four checks pass, including explicit omitted-tail bounds. This is not a full chamber or material-channel bound; common-halo integration and actual confinement remain open. S1 and the goal stay active.

### Plate force tensor: rotation does not restore a fixed free hold — September 6, 2026

[Tensor packet](casimir-dp-portal-plate-force-tensor-2026-09-06.md) finds two restoring parallel directions and one unstable normal direction. At the thin 2900 kg/m3 benchmark, their scales are 152 kHz restoring and 224 kHz unstable. Four checks pass, including an independent Cartesian Hessian and Helmholtz trace. A conditional nonlinear positive-field argument also forbids three-dimensional stability from this scalar force alone at an empty-space stationary point with 0 < phi < phi_vac. Rotation changes branch dynamics but does not preserve the assumed constant separation. Actual confinement/trajectory input is still pending; no hardware capability is inferred. S1 and the goal remain active.

### Weak-source plate force survives compensated matter-coupling reduction — September 6, 2026

[Plate-force identity](casimir-dp-portal-plate-force-invariant-2026-09-06.md): at fixed C, vacuum alpha, ychi and KSS, matching fixes aN^2 phi_vac^2 = 4 pi alpha C/(ychi^2 KSS). Reducing aN alone therefore does not reduce the leading weak-source plate force when scattering strength is restored through phi_vac. At the tested Yukawa endpoint, 0.1 micrometre plates at 2900 kg/m3 require about 224 kHz normal confinement; thicker benchmarks require more. Four checks pass. This is not a nonlinear universal bound or an assumed branch orientation. User input on free/confined hold and restoring force is pending; no capability is assumed. The chamber-only force improvement does not establish complete apparatus compatibility. S1 and the goal remain open.

### Restricted force/scattering tradeoff at fixed matching — September 6, 2026

[Tradeoff packet](casimir-dp-portal-force-tradeoff-2026-09-06.md) varies b with matched kappa/ychi, preserving CchiN, aN and the leading light potential through an explicit lambda rescaling. In the stated heuristic perturbative domain, the large-cavity confinement threshold decreases from 9.62 MHz to 276.5 kHz; the original force threshold is not universal. Four identity/boundary checks pass and the inherited conditional Higgs yield remains below 0.107. An uncompensated hold still fails (10% growth about 0.255 microseconds); no actual trap is authenticated. Full loop/UV/transport constraints and a broader coupled scan remain open. The percent-level fixed-branch result stays unadmitted; S1 and the goal remain active.

### Priority correction: classical force invalidates uncompensated percent-level forecast — September 6, 2026

[Companion force audit](casimir-dp-portal-classical-force-2026-09-06.md) finds that the same illustrative lambda_eff = 1e-24 point supplies an outward sphere curvature equivalent to a 9.62 MHz confinement threshold in the 1 millimetre cavity/1 millimetre wall case. Uncompensated branch displacement changes by 10% in 7.34 ns, not the assumed 0.25 s hold. The prior 0.96% far-tail value remains a fixed-branch mathematical result and must not be admitted as an experimental forecast. No authenticated trap stiffness was found; RF examples are not trap specifications. Four checks pass. Prioritize a force-compatible parameter region or verified compensation before further near-impact refinement. The diagnostic free-hold constraint would require lambda_eff >= 1.16e-9 and suppress that far-sector phase envelope to about 7.02e-33. This is not a general scalar exclusion; S1 and the goal remain open.

### Integrated far-trajectory light-channel coherence — September 6, 2026

[Phase-tail packet](casimir-dp-portal-phase-tail-2026-09-06.md) integrates the fixed-chamber dipole with full phase dependence. With the same illustrative matched parameters and 776 km/s transverse incidence, b > 1 micrometre gives D = 0.009688 in the 1 millimetre cavity versus 5.507e-10 in the 250 micrometre cavity. Close trajectories receive a separate 0.0003657 geometric ceiling; conditional near+far envelopes are not rigorous full-physics exclusions. Three integration checks and an independent vacuum line-integral check pass. Finite displacement/source, common halo, transport and external constraints remain necessary; the same coefficient's heavy xenon component stays unchanged and no full joint fit is claimed. S1 and the goal remain open.

### Fixed-chamber dipole branch response — September 6, 2026

[Dipole packet](casimir-dp-portal-chamber-dipole-2026-09-06.md) computes the first source-displacement derivative while keeping the chamber fixed. In the 250 micrometre cavity with a 1 millimetre wall, translating the entire centered profile overestimates the leading coefficient by 13.82% at 100 micrometres. The correct coefficient is 0.00024512 of vacuum there. Four checks pass, including analytic finite-domain vacuum normalization. Next integrate branch-dependent scattering phases with finite-source/displacement, trajectory and transport controls; a sampled static coefficient is not a coherence rate. S1 and the goal remain open.

### Static chamber Green function and combined vertices — September 6, 2026

[Centered-source propagator packet](casimir-dp-portal-chamber-green-2026-09-06.md) computes the static monopole on the authenticated nonlinear backgrounds. In the 250 micrometre cavity with a 1 millimetre wall, propagation at 100 micrometres is enhanced by 2.21 over vacuum but the combined vertex/propagator potential is only 0.0004197 of vacuum. Four numerical checks pass. This closes neither dynamic propagation nor branch-dependent scattering: translating a centered potential would incorrectly move the fixed chamber. Next calculate off-center multipoles and the branch-difference interaction, with far-boundary/interpolation checks. S1 and the goal remain active.

### Nonlinear finite-shell chamber backgrounds — September 6, 2026

[Spherical chamber packet](casimir-dp-portal-spherical-chamber-2026-09-06.md) solves the same matched light-scalar equation across six hypothetical cavity/shell geometries with exact interface matching. For mu = 0.001 eV and a 2900 kg/m3, 1 millimetre wall, central field fractions are 0.01408 at 250 micrometre cavity radius and 0.98715 at 1 millimetre radius. Four checks pass, including vacuum recovery and tail/tolerance refinement below 4.88e-10 absolute change. The positive-field Hessian identity provides a conditional linear-stability argument within this scalar equation. Geometry is parameterized, not attributed to the apparatus. Next use the spatial fluctuation operator for propagation rather than importing the vacuum Yukawa mass; S1 and the goal remain active.

### Finite-plate nonlinear suppression bound — September 6, 2026

[Finite-plate packet](casimir-dp-portal-finite-plate-screen-2026-09-06.md) derives a maximum-principle field-deficit bound using the matched matter coupling. For isolated 80 micrometre square plates, 10 micrometre gap and assumed 10 micrometre thickness, the mid-gap field remains at least 93.45% of vacuum even at the 8600 kg/m3 benchmark. This differs from the prior semi-infinite-wall background; the latter cannot stand in for these finite sources. Four checks pass for the geometric integrals. Thickness, source inventory and chamber boundary conditions remain unverified parameters. Next examine the chamber background and fluctuation propagator before claiming a rate; no S1 promotion or goal completion.

### Higgs-matched density and finite-wall screen — September 6, 2026

[Matched density packet](casimir-dp-portal-matched-density-2026-09-06.md): the conditional Higgs-limited coupling implies a nucleon-density scale of 2290 GeV. At the 2900 kg/m3 benchmark, bulk restoration requires mu < 0.001544 eV; at mu = 0.001 eV its interior decay length is 168 micrometres and a semi-infinite wall retains 45.8% of the vacuum field at its surface. Thus earlier independently chosen 30 GeV screening numbers and ideal Dirichlet walls cannot be transferred to this matched portal. Four checks pass across 12 cases. Next solve finite geometry with matched sources before interpreting local vertices as a rate; source/species, thermal, vacuum-mixing and external-constraint gaps remain. S1 and the goal stay open.

### Same-coupling local heavy-contact screens — September 6, 2026

[Local response packet](casimir-dp-portal-local-contact-2026-09-06.md) carries the authenticated xenon coefficient into independent-C12 and rigid-sphere limits, plus distinct positive-density envelopes. At 1 TeV and the conditional Xe count ceiling, independent-C12 D <= 1.06e-25 and rigid-sphere D <= 6.80e-30. The q <= 10 MeV nonnegative-transfer envelope is 2.96e-16; an explicitly formal all-q extension gives 1.34e-11 and is not a QCD or finite-temperature bound. These responses are not added. Four numerical checks pass; survival-conditioned visibility remains a separate observable. This closes a useful same-coupling heavy-component comparison but leaves light-sector, material and full detector response work open. S1 and the user goal remain active.

### Matched portal heavy-contact xenon spectrum — September 6, 2026

[Reproducible packet](casimir-dp-portal-contact-spectrum-2026-09-06.md): the physical-Higgs-matched heavy coefficient predicts 0.208 wider-window and 0.000228 high-window raw xenon recoils at 1 TeV. One expected high-window recoil requires about 913 wider-window recoils. The conditional all-count screen permits up to 4.13 raw high-window recoils, so it does not exclude that normalization; differential response/background information remains necessary. Five numerical checks pass across 18 mass/halo cases. Next carry this same heavy coupling into the local material response while keeping coherent, constituent and accepted-ensemble channels distinct. This is an exploratory heavy-component calculation, not a full portal fit or an S1 promotion; the research goal remains active.

The external screen `casimir-dp-portal-higgs-decay-screen-2026-09-06.md` (Python/JSON) matches the 125 GeV eigenmass and tests invisible decay in the small-phi-background portal limit. The b=100 GeV, kappa=1000 GeV illustration predicts SM-normalized invisible yield .923 versus the published ATLAS .107 limit, conditional on invisible escape and stated production assumptions. Reducing kappa to the nominal ceiling suppresses the light coupling product about 101-fold at fixed effective quartic, while leaving the tree heavy contact unchanged. Four checks pass; no surviving point is admitted as a full model. S1 remains open.

The explicit tree-level portal construction in `casimir-dp-scalar-portal-matching-2026-09-06.md` (Python/JSON) generates both even light-scalar portals and a direct heavy contact interaction, related by a_chi*a_N=2*Delta_lambda*C_chiN. It fixes a tree-level contact contribution rather than assigning an independent Xenon coefficient. Five matching checks pass. Strong soft/hard separation in this example requires an explicitly small residual quartic; this is sensitivity, not an exclusion. Higgs/QCD matching, radiative effects and finite-density source changes remain open, and the demonstration eigenmass is not an admitted physical Higgs benchmark. S1 remains open.

The follow-up `casimir-dp-symmetron-density-screen-2026-09-06.md` (Python/JSON) identifies a conditional small-sphere/bulk-Xe screening window and a new matching requirement. In restored xenon the linear vertices vanish in the homogeneous limit; surviving two-scalar exchange from the dimension-five portals has a logarithmically divergent loop and needs a UV-matched contact coefficient. Thus the initial five-parameter extension is not yet sufficient for an absolute recoil prediction. Four scale checks pass, but no allowed benchmark or completed shared model follows. UV matching is required before advancing this branch.

The screened-scalar intake `casimir-dp-symmetron-planar-intake-2026-09-06.md` (Python/JSON) defines a Z2-even particle extension and checks an ideal one-plane background against an independent nonlinear solver. It explicitly separates density sourcing, linear versus quadratic vertices, static phase and decoherence. Optical switching at unchanged scalar sources is a null in this minimal model; dense xenon can remove linear exchange while leaving higher processes open. Four ideal-limit checks pass. No finite-apparatus response, common rate, constraint admission or gate promotion is claimed.

The canonical readout map in `casimir-dp-scattering-readout-map-2026-09-06.md` derives the magnitude/phase four-cell contrast for current scattering prescriptions. Homogeneous matched responses cancel exactly, even with a nonzero matched sham response. It also derives hold-time mismatch leakage and quantifies it from the current photon count-only ceilings. A nonzero boundary lead must now specify four branch-conditioned kernels or a justified boundary change in flux/propagator/response; an absolute scattering rate alone is not such a prediction. Primary small-signal models remain valid candidates. No estimator or frozen tolerance changes; S1 remains open.

The limited data-normalization surrogate in `casimir-dp-photon-lz-count-screen-2026-09-06.md` (Python/JSON) uses 1831 published events across the three disjoint LZ samples and an explicit acceptance-floor assumption. With floor .5 and the central halo, the 1 TeV moment ceiling is 1.014e-5 GeV^-1 and the specified spin-bubble D ceiling is 2.091e-25. Four checks pass. This is a count-only conditional screen, not the LZ likelihood, a photon exclusion supplied by the collaboration, or a rejection of the individual event. HEPData remains inaccessible; response/likelihood and external-constraint matching remain open. S1 is unchanged.

The common photon-halo calculation in `casimir-dp-photon-shared-halo-2026-09-06.md` (Python/JSON) folds both approximate Xe and two finite-grid diamond components through identical shifted-Maxwellian moments. Eighteen scenarios and five checks are recorded. At 1 TeV the central spin-bubble D/raw high-window Xe count is <=2.697e-25, with a full/high Xe ratio about 4,869. This supplies a spectral consistency test and removes the single-speed assumption for these components; it does not constitute a detector fit or complete material model. S1 remains open.

The inclusive impact-support screen in `casimir-dp-incident-flux-screen-2026-09-06.md` (Python/JSON) gives D<=4.343e-5 for 1 TeV particles at 776 km/s when branch-dependent effects are confined to the sphere. A comparator-sized effect requires effective support radius >=8.904 micrometers or >=679-fold flux enhancement under the same assumptions. Four checks pass. This is not a universal force bound: noncompact tails, resonances, correlated fields and altered populations require their own derivations. It redirects comparator-sized leads toward explicit extended interactions while preserving small-signal models as valid outcomes.

An authenticated separate no-LFE diamond dataset supports the explicit independent-electron spin diagnostic in `casimir-dp-diamond-spin-bubble-2026-09-06.md` (Python/JSON plus licensed source archive). It predicts about 147.9 times the preceding finite-grid density rate, but only D/raw full-window Xe count <=8.266e-29 at 1 TeV. Four checks pass. The spin-degenerate bubble relation and vanishing mixed response are model assumptions, not a measured interacting susceptibility. Orbital-current, spin-vertex, low-energy and tail responses remain open; S1 remains active.

The August sum-rule lead now gives a conditional density-response ceiling in `casimir-dp-diamond-density-sumrule-2026-09-06.md` (Python/JSON). For transfers >=5.5 eV and q<=100 keV/c, the 1 TeV mono-speed diagnostic gives D/raw full-window Xe count <=7.104e-26, including unprovided spectral strength within that region. Four checks pass. Its formal all-q nonrelativistic extension is explicitly not a physical relativistic bound. Below-threshold, spin/current/mixed and higher-q response remain open; no full-model exclusion or gate promotion follows.

The diamond longitudinal density calculation is now reproducible in `casimir-dp-diamond-density-rate-2026-09-06.md` with companion Python/JSON. The free-charge limit and source spin-trace convention fix its magnetic-moment normalization. At 1 TeV and 776 km/s, the specified finite-grid component gives D/raw full-window xenon count <= 5.588e-31. Four numerical/normalization checks pass. This is not a total material bound: transverse-current/spin/mixed responses, out-of-grid strength, halo/detector folding, exclusions and retained-event visibility remain open. S1 remains active; no baseline or maturity promotion follows.

Diamond electronic input acquired: `casimir-dp-diamond-response-intake-2026-09-06.md` authenticates QCDark2's 24-MB composite diamond dielectric table at a pinned revision. Six checks pass; actual grid centers span 37 eV/c–74.6 keV/c and 0–150 eV. It supplies density response only, with local-field effects included through 12 alpha*m_e. Above-gap halo excitations require keV momentum, outside the earlier soft rigid screen. Next derive and integrate the magnetic-dipole density component with explicit finite-grid coverage and unchanged mu_chi; spin-density response remains separately required. S1 remains open.

Photon nuclear-magnetic matching: `casimir-dp-photon-nuclear-magnetic-2026-09-06.md` adds both targets' magnetic terms with the same mu_chi as charge, using authenticated ground-state moments and explicit approximate finite-q shapes. At 1 TeV the full/high raw Xe ratio changes from about 6888 to 4766; the two modeled local components remain tiny. Four checks pass. This is not a full electromagnetic bound; electronic/discrete-material response and magnetic-form-factor uncertainty are now the substantive gaps. Avoid spending further precision effort on these small components before addressing those gaps. S1 remains open.

Photon charge completion: `casimir-dp-photon-charge-tail-2026-09-06.md` analytically bounds the unresolved tail within the smooth rigid Gaussian-atom model and pairs it with natural-xenon Helm charge spectra. The full-window D_charge/lambda_Xe,charge upper ratio is 4.61e-32–3.06e-30. The 1-TeV charge-only spectrum predicts roughly 6,888 full-window counts per high-window count. These are conditional component results, not full electromagnetic or detector exclusions. Four checks pass. Next match the magnetic channels with the same magnetic moment, retaining the charge term and its limits. S1 remains open.

Photon-mediated lead: `casimir-dp-photon-neutral-screen-2026-09-06.md` derives a separate static neutral-atom charge response. At qR/hbar<=80, a Gaussian electron-cloud model suppresses the rigid soft-charge integral by 13–15 orders relative to bare nuclei. Five checks pass. This is a partial channel calculation, not a full-rate bound: the screened tail, magnetic response, electronic excitations and surface charge remain separate inputs. Next investigate these remaining electromagnetic responses with a common magnetic moment; do not import contact L10 or bare-charge enhancements. S1 remains open.

Shared halo follow-up: `casimir-dp-l10-halo-2026-09-06.md` replaces mono-speed flux with a shifted truncated Maxwellian for both targets. Across 72 cases, the orientation-independent D<=2N bound per raw full-window Xe count remains below 8e-31. The exact isotropic coherence estimate is not reused for the wind. Six checks include direct speed-fold recovery for both targets. Recoil shapes are halo-sensitive, but this tested independent-carbon contact channel remains a poor observable-coherence lead. Preserve it as a conditional null in model comparison; investigate qualitatively different responses rather than forcing normalization. S1 remains open.

Shared L10 benchmark: `casimir-dp-l10-joint-kernel-2026-09-06.md` computes old-table xenon spectra and conditional p1/2-carbon coherence with one explicit per-nucleon coefficient. Under the same isotropic 776-km/s population, D per raw full-window xenon count is 8.85e-31–1.90e-30 across twelve cases. A bounded isotropic coherence filter replaces a total-rate-only proxy. Seven checks cover normalization, parent recovery and integration. This disfavors an appreciable shared signal through this tested independent-carbon channel; it is not an exclusion or a full solid/detector prediction. Next replace the mono-speed population consistently and audit response uncertainties. S1 remains open.

Conditional carbon kernel: `casimir-dp-c13-single-particle-2026-09-06.md` derives a one-neutron p1/2 oscillator transverse response, kappa_T=-(1-2y)exp(-y)/3. Five checks include independent real-space Fourier recovery and the point integral. It produces an explicit independent-carbon rate at a chosen per-nucleon coefficient, with a labeled oscillator-length sweep; no many-body error interval or LZ normalization is claimed. Next pair this conditional kernel with xenon in the same coefficient convention and compare response ratios. Full carbon/solid responses remain missing, and S1 remains open.

Spin-response intake: `casimir-dp-spin-response-intake-2026-09-06.md` pins and archives an alternative WIMpy_NREFT snapshot. Xenon spin entries exist but carbon-13 is missing; its helper's unknown-isotope zero must not become a physical null prediction. The intake now rejects missing carbon-13 explicitly, with three passing coverage checks and enforced archive hashes. WimPyDD homepage timeout is recorded separately and establishes no coverage conclusion about that different program. Next authenticate transverse-response conventions and source or derive qualified carbon-13 nuclear matching. S1 remains open.

L10 identity audit: `casimir-dp-l10-operator-audit-2026-09-06.md` authenticates the leading contact dipole-dipole operator and its correlated O4/O6 reduction. It is not automatically a photon-mediated electromagnetic dipole. Five algebra checks verify transverse-spin interference, q-fourth-power probability and independent unpolarized spin counting. Carbon-12 has no leading elastic spin response; carbon-13 matching and isotope composition become necessary inputs. The soft-q comparison is not an integrated rate bound. Pursue this contact channel separately from photon completions; do not apply scalar N-squared enhancement or atomic charge screening to it by analogy. S1 remains open.

Long-range follow-up: `casimir-dp-yukawa-full-phase-2026-09-06.md` now evaluates phase differences beyond Born and recovers the weak momentum-space kernel. The two longest-range test points retain percent-level mathematical visibility loss, but the same unscreened scalar implies matter-matter forces exceeding conservative published limits by over six orders of magnitude even at maximal adopted perturbative dark coupling. These test points fail external admission under that minimal realization. Shorter-range points are reduced substantially by full-phase treatment. Prioritize matched operator/loop models; do not treat screened or nonperturbative extensions as unchanged candidates. S1 remains open.

Latest recoil calculation: `casimir-dp-xe-recoil-recast-2026-09-06.md` implements natural-isotope Helm spectra with the audited neutral current and annual SHM averaging. At fixed source masses, one-raw-count contours shift upward by 6.88–16.71 keV relative to an otherwise identical quarter-strength calculation. Halo-tail sensitivity is comparable or larger. The direct free-carbon upscatter remains closed even at the seasonal speed maximum. These are unit-efficiency contours, not LZ fits; thermal intersections and loop matching remain incomplete. S1 remains open.

Current normalization result: `casimir-dp-electroweak-current-audit-2026-09-06.md` independently derives the full vector-current neutron coefficient, cross section and neutral-state weights. For the printed mixed-model current, the leading SI normalization is about four times its quoted value; mixing does not explain the discrepancy. Future recasts use the audited coefficient, without silently changing source table benchmarks. Loop amplitudes remain conditional: tracing their provenance does not establish complete mixed-state matching. Next implement a clearly labeled corrected recoil-level calculation and source the loop Wilson coefficients. S1 remains open.

Current model audit: `casimir-dp-inelastic-local-audit-2026-09-06.md` shows that the generic vector model's leading xenon coefficient does not uniquely fix its remaining elastic terms. Even an all-excited population gives a negligible independent-carbon downscatter channel at its reference coupling. A newly authenticated electroweak preprint (arXiv:2609.04144v1) supplies six conditional loop-elastic inputs; local constant-amplitude and rigid-channel screens are tiny, but full loop matching is not yet authenticated. Resolve the cross-paper neutral-current normalization and loop neutron/proton amplitudes before a shared recast. This is the next model-completion priority; S1 remains open.

Evaluate new leads by their specified interaction, momentum/energy support, common-parameter map, target response, experimental constraints and discriminating predictions. Rank them by these criteria rather than novelty. Record versioned sources, calculations, rejected regions and unresolved inputs in new dated packets; update only this roadmap's current status. Restricted data remain unavailable until access is legitimately supplied. No external correspondence is authorized by this goal alone.

This is an active research goal in the current task; no scheduled literature monitor has been configured. The goal stays active across research packets until the model and its limitations have been reviewed with the user.

## Initial verification record

Before this addition, Atlas build, why and upstream trace completed for `docs/research/casimir-dp-lz-mechanism-bridge-research-2026-09-06.md`. The traced dependency path includes the canonical article and frozen configuration. The numerical screen above executed successfully. This is a documentation-only research roadmap; it changes no runtime physics, adapter or certificate semantics and makes no physical-admissibility claim.
