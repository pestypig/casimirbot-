Program gate: Independent exploratory comparison; no change to the canonical Casimir-DP commissioning sequence.
Workstream: Casimir-DP and xenon-detector mechanism discrimination.
Capability or component: Shared interaction/noise predictions for coherence, radiation, and nuclear recoil.
Current maturity: Exploratory comparison; local apparatus predictions are conditional model forecasts.
Target maturity: Source-backed mechanism shortlist with reproducible diagnostic screens and explicit falsifiers.
Required frozen inputs: Canonical August 24 article; Stage-4.2R leading design and Gaussian Diosi convention; LZ arXiv:2609.02823v1; source versions below.
Required evidence: Primary-source review, dimensionally checked scale calculations, model-identity ledger, and detector-response requirements.
Stop/fail criteria: Reject a proposed identification if it lacks a common microscopic kernel, mismatches the signal class, changes frozen parameters after the event, or treats missing backgrounds as zero.
Explicit non-goals: No experimental detection claim, candidate retuning, new Casimir-collapse coupling, empirical-packet closure, Theory Graph promotion, or proof/certificate change.
Downstream gate unlocked: Selection of a separately specified quantitative recast; no integrated experimental pilot is unlocked.

# Casimir-DP and the September 2026 LZ event: mechanism comparison

Research date: September 6, 2026, America/New_York. Calculations executed September 7 UTC. This is a new research packet, not an amendment to dated evidence or the canonical article. It can proceed alongside commissioning because it uses frozen inputs and does not supply or replace any missing hardware measurement.

## Finding

There is a worthwhile connection to pursue, but it divides into two different tests:

1. **The most direct existing connection is coherence versus collapse-induced radiation.** The canonical article already identifies an unfinished comparison to XENONnT's collapse search. This review matches the Gaussian width and strength analytically and calculates a separate ideal finite-sphere coherence forecast. A recent atomic-correlation calculation makes the remaining radiation comparison more specific.
2. **The LZ nuclear-recoil connection requires a particle-scattering or other explicitly specified energy-transfer model.** The unchanged 100-nm Gaussian Diosi kernel has effectively no support for the momentum required by the reported recoil. Some LZ-motivated inelastic channels are also closed for the diamond target.

These findings narrow hypotheses; they do not identify the LZ event. A gravitational environment, a mass-energy identity, or a common appearance of the Higgs scale does not establish a shared force.

## 1. Inputs and experimental distinctions

### Local solve: the current target, not the historical prototypes

The authority is the [canonical article](casimir-dp-quantum-foam-study.md), especially Sections 2.1, 3, 5.1, 5.9, 6, and 8, and the [Stage-4.2R configuration](../../configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json). The reproducibility supplement calls itself a historical record. Earlier prototype masses and separations must not replace the current design.

| Input | Frozen value or status |
|---|---|
| Candidate | `stage4_2m_candidate_002`, diamond-density sphere; specimen unselected |
| Radius / mass | 276.302362 nm / 3.0925052683774525e-16 kg |
| Branch separation / hold | 250 nm tangential to boundary / 0.25 s |
| Boundary gap / plate dimension | 10 micrometres / 80 micrometres |
| Temperature / pressure | 4 K / 1e-15 Pa, design targets |
| Collapse dynamics | Nondissipative Gaussian-regularized Diosi mass density; one effective particle |
| Physical Gaussian width | R0 = 100 nm, standard-deviation convention |
| Observable | Complex center-of-mass coherence, including magnitude and phase |
| Prediction | 2.908% Diosi-only loss; lowest transported density diagnostic 0.435%, not a lower bound |
| Empirical status | 0/8 authority packets ready; integrated feasibility pilot not authorized |

The radius, collapse smearing, and wavepacket width are different quantities. No Casimir-boundary variable or Higgs coupling enters the frozen collapse generator. The article's software status is not evidence that the superposition or residual exists in hardware.

### LZ: a measured outlier with unresolved identity

LZ reports one NR-like event, interpreted as 248 +/- 23 statistical +/- 23 systematic keV, in 2.84 tonne-years. Maximum local significance is 3.4 sigma and global significance 2.6; the extended analysis was non-blind. Its models include elastic EFT interactions and endothermic scattering. Nuclear-recoil response used D-D and AmBe calibration. Waveform discrimination and incomplete-charge-collection backgrounds retain limitations; double-vacancy ER-tail extrapolation uncertainty was omitted from statistical inference. The paper's Higgs vacuum expectation value is a coupling normalization, not evidence of Higgs exchange. [LZ paper, Theory, Data Analysis, Discussion, and supplement Sections .4-.10](https://arxiv.org/html/2609.02823v1)

The collaboration has not claimed dark matter discovery. The announcement concerns a new analysis of earlier data, not a confirmed new particle species. [DOE announcement, September 1](https://www.energy.gov/science/articles/lz-sees-surprising-result-search-dark-matter)

The [official presentation, slides 18-24 and 36](https://lz.lbl.gov/wp-content/uploads/sites/6/2026/08/LZ_Slides_260901_TeVPA_Dark_Matter_HENR_EFT_Sam_Eriksen_compressed-medium.pdf) compares a real nuclear recoil with accidental pairing, enhanced light from multiple deposits, and suppressed charge signals. These alternatives belong in a detector-response audit; none is an identified cause.

The [HEPData release](https://doi.org/10.17182/hepdata.182472.v1) was identified but could not be retrieved in this review; a direct record request returned HTTP 403. No release table, detector likelihood, best-fit coupling, or joint exclusion has been reconstructed here.

### The third configuration: XENONnT's collapse search

XENONnT searched 1-140 keV **electronic recoils** from predicted spontaneous radiation in Markovian collapse models. Its Diosi result has local significance 0.2 sigma and gives R0 > 4.9e-10 m at 90% confidence in the authors' convention. It is a different experiment and signal class from LZ's NR-like event. [XENONnT, 2026 paper](https://arxiv.org/html/2506.05507v2)

The numerical ratio 100 nm / 0.49 nm is 204.1. This passes the article's one-dimensional screening comparison, but is not an exact-model external-admission result. The additional correspondence calculation in Section 4.1 matches Gaussian width and Diosi strength; the charged-constituent and effective-composite mapping and detector replay remain open. XENONnT cannot substitute for the local same-apparatus companion packet.

## 2. The physical map needed to connect configurations

For a particle model, freeze one parameter set

\[
\theta=\{m_\chi,\delta,m_{\rm med},\text{operator},c_p,c_n,c_e,
\rho_\chi,f_{\rm lab}(\mathbf v,t),\text{incident-state fractions}\}.
\]

Use the same microscopic interaction to calculate each target's response. The xenon count density is schematically

\[
\frac{dR_{\rm Xe}}{dE_R}=N_{\rm Xe}\frac{\rho_\chi}{m_\chi}
\int d^3v\,f_{\rm lab}\,v\,\frac{d\sigma_{\rm Xe}}{dE_R},
\qquad
\lambda_j=\int_{\rm live}dt\int dE_R\,\frac{dR_{\rm Xe}}{dE_R}(t)\,
\epsilon(E_R,t)P(j\mid E_R,t,\mathrm{accepted}).
\]

Here N is a number of target nuclei and R is a rate for that target, not a rate per kilogram. P is the response conditional on passing the selection whose efficiency is epsilon; acceptance is counted once. Integrate over actual live intervals. An isotope-resolved sum and the measured S1/S2 response replace these schematic quantities in a recast. A photon/electron interaction needs its own ER response rather than this NR map.

In a dilute-collision description of a rigid center-of-mass superposition,

\[
F(\Delta\mathbf x,t)=\frac{\rho_\chi}{m_\chi}
\int d^3v\,f_{\rm lab}\,v\int d^3q\,
\frac{d\sigma_{\rm object}}{d^3q}
\left[1-e^{i\mathbf q\cdot\Delta\mathbf x/\hbar}\right],
\qquad C/C_0=\exp\!\left[-\int F\,dt\right].
\]

Re F suppresses visibility; the phase shift is minus the time integral of Im F in this convention. This is the established scattering-to-decoherence bridge. Its validity depends on the target state and collision regime. [Riedel and Yavin, equations 11-12](https://arxiv.org/abs/1609.04145)

The required comparison is therefore **one interaction, two target response functions**. A separately fitted coupling for each setup is not a prediction. High-energy collisions may eject, heat, or destroy the prepared object. Loss/postselection must be modeled alongside coherence of surviving trials.

For a collapse model, replace incident particle flux with a specified spatial and temporal noise kernel. A measured coherence decay constrains only the kernel filtered by the branch histories. It does not uniquely fix a high-energy recoil or radiation spectrum. The local effective neutral-particle model also does not by itself provide a microscopic charged-constituent emission model.

## 3. Quantitative screens completed

These are new diagnostic calculations, not fits to the LZ likelihood. Appendix A reproduces them. Natural xenon is represented by a mean atomic mass of 131.293 u; isotope/binding corrections are immaterial to these scale screens but required in a precision recast.

### A. The frozen Diosi momentum kernel cannot supply the hard kick

The Gaussian model can be written as a momentum-transfer generator,

\[
\mathcal L\rho=\int d^3q\,\nu(q)
\left[e^{i\mathbf q\cdot\mathbf x/\hbar}\rho
e^{-i\mathbf q\cdot\mathbf x/\hbar}-\rho\right],\quad
\nu(q)=\frac{Gm^2}{2\pi^2\hbar^2q^2}
e^{-q^2R_0^2/\hbar^2}.
\]

This representation also predicts momentum diffusion and heating. It is wrong to reject the model merely because it admits jumps; the actual transfer distribution is what matters. [Bahrami, Smirne, and Bassi, equations 15-17 and 35](https://arxiv.org/abs/1408.6460)

Our comparison assumes that same Gaussian smearing applies to a xenon nuclear degree of freedom. It is a conditional transfer-support test, not a completed microscopic xenon recast.

| Diagnostic | Calculated value |
|---|---:|
| q = sqrt(2 mXe ER), for ER = 248 keV | 246.293 MeV/c |
| Resolving length hbar/q | 0.8012 femtometres |
| Diosi momentum scale hbar/R0 | 1.97327 eV/c |
| Ratio q R0/hbar | 1.24815e8 |
| Gaussian suppression at that q | exp(-1.55787e16) |
| Xe recoil at q = hbar/R0 | 1.59192e-11 eV |

This eliminates the unchanged Gaussian kernel as a credible **direct single-hard-kick** explanation at its frozen width. It does not eliminate its spontaneous-radiation channel: photon energy probes temporal noise and charged-particle dynamics, not simply q squared divided by nuclear mass. Nor does it eliminate all gravitational or non-Gaussian theories.

Accumulation is a separate question from one kick. For an isolated effective Xe nucleus, the same model's mean heating over a microsecond is about 1.35e-36 eV, also negligible. This is an illustrative integration window, not a measured event duration. A collective avalanche or other amplification explanation needs a specified response and energy account.

Reducing R0 to the femtometre scale to admit the event would change the frozen model by roughly eight orders of magnitude in length and would require a new external-constraint calculation. It cannot be presented as recovery of the existing solve.

### B. LZ momentum does not inherit whole-object coherent enhancement

For the selected 276.3-nm sphere, qR/hbar is about 3.45e8 at the xenon recoil momentum. Whole-object coherent enhancement requires spatially unresolved scattering, roughly qR/hbar much less than one. The relevant sphere scale hbar/R is only about 0.714 eV/c. Form factors and constituent responses therefore matter.

The same LZ-compatible model might still predict many soft scatters. That possibility must be computed from its low-q interaction, screening and environmental transport, not obtained by applying a macroscopic N-squared multiplier to a hard nuclear collision. Long-range mediators deserve a distinct parameter scan; they also bring ordinary-matter force and shielding constraints.

### C. Inelastic target thresholds distinguish xenon from diamond

For stationary free nuclei and an endothermic splitting delta,

\[
v_{\min}(E_R,\delta)=\frac{m_AE_R/\mu_{\chi A}+\delta}
{\sqrt{2m_AE_R}},\qquad
\delta_{\max}=\tfrac12\mu_{\chi A}v_{\max}^2.
\]

At a diagnostic mchi = 1 TeV/c squared and chosen maximum lab speed 776 km/s, delta_max is **365.1 keV for Xe** and **37.03 keV for carbon-12**. A 200-300-keV endothermic free-carbon nuclear channel is thus closed in this benchmark even when xenon can respond. For the specific 248-keV xenon recoil with delta = 300 keV, v_min is **704 km/s**, also below the chosen cap. This is a potentially strong prediction of a common cause: the present diamond setup could be insensitive to the same channel.

Replacing the carbon mass with the whole sphere mass is not an automatic escape. Even q >= delta/v at delta = 200 keV requires about 77 MeV/c, far above the whole-sphere coherence regime. A bound-solid or collective channel needs a dynamic structure factor, an allowed final state, and its rate.

For elastic xenon scattering at 248 keV, v_min is 671, 486, and 339 km/s for masses 100, 200, and 1000 GeV/c squared. These kinematics do not turn a spectral mass preference into a model-independent lower bound. Different speeds, excited-state populations, or exothermic channels require separate calculations.

### D. Ordinary gravitational particle scattering is far too weak in a WIMP benchmark

Being inside Earth's gravitational field does not imply gravitational mediation. To quantify the simplest such hypothesis, take nonrelativistic Born scattering from the Newtonian potential, a 1-TeV particle, local density 0.3 GeV/c squared per cubic centimetre, and put all particles in a 776-km/s stream. Assume a pointlike coherent xenon nucleus, form factor one, and unit detection efficiency. Then

\[
\frac{d\sigma_G}{dE_R}=\frac{2\pi G^2m_\chi^2m_A}{v^2E_R^2},
\quad E_{\max}=\frac{2\mu^2v^2}{m_A},
\quad
\sigma_G(E_R\ge E_*)=\frac{2\pi G^2m_\chi^2m_A}{v^2}
\left(\frac1{E_*}-\frac1{E_{\max}}\right).
\]

The result is **6.56e-87 cm squared**, or **6.28e-47 expected events** in 2.84 tonne-years. The integral is zero if the threshold exceeds Emax. This is an illustrative optimistic particle benchmark, not a bound on every gravitational theory. Optimizing its stream speed increases the rate by only about 9%; it does not repair the shortfall. Extended nuclei and realistic response cannot justify the missing tens of orders of magnitude within this benchmark.

The formula follows from the Fourier transform of the Newtonian two-body potential in the weak-coupling nonrelativistic Born approximation; it does not invoke a classical impact parameter below the model's validity scale. It neither computes a collapse rate nor tests a new mediator with gravitational-strength language but different couplings.

### E. Exposure and local companion checks

A deliberately nonphysical scale comparison transports one accepted count per 2.84 tonne-years unchanged per kilogram to the selected object for 0.25 s: **8.63e-28 expected counts**, compared with the local Diosi exponent 0.02951. This is not a cross-section or decoherence bound. Target composition, efficiencies, acceptance, low-energy events and phase sensitivity differ. It shows why one high-energy count cannot be used as a local percent-level visibility prediction without the full transfer calculation.

The local model's own companion forecast reproduces

\[
\dot E=\frac{G\hbar m}{4\sqrt\pi R_0^3}
\simeq 3.07\times10^{-40}\ {\rm W}.
\]

The canonical article has no instrument receipt demonstrating that this is measurable. An external xenon bound is useful model consistency evidence, but does not close the missing local independent-companion measurement or establish the cause of a future residual.

## 4. Ranked leads and the next calculation for each

| Priority | Lead | What this review establishes | Concrete next calculation and stopping rule |
|---|---|---|---|
| 1 | Exact coherence-radiation model match | Gaussian width and Diosi strength now match analytically; an ideal finite-sphere comparison is calculated below | Finish mass/charge operators and temporal-spectrum mapping. Derive constituent-resolved coherence and Xe radiation from that same model. Stop short of an external-allowed claim if the effective neutral-object map is undefined. |
| 2 | LZ operator transferred to diamond | Shared scattering formalism exists; high-q enhancement and endothermic carbon thresholds are restrictive | Freeze inelastic O1 and elastic magnetic-moment examples separately, import authenticated coupling intervals, calculate carbon/whole-object response, survival and coherence. Reject detectable-overlap claims if projected effects remain below qualified apparatus uncertainty. |
| 3 | Soft-scattering channel of a complete mediator model | Low-q scattering could affect coherence without a detectable hard recoil | Use one mediator and one set of couplings across low and high q. Include screening, halo transport, fifth-force constraints, and nuclear/atomic form factors. Reject explanations requiring independently tuned normalizations or an unphysical divergent soft rate. |
| 4 | Updated atomic radiation and colored-noise comparison | A new source provides a more detailed radiation model | Reproduce published white-noise spectra first; then label each atomic/temporal variant separately and fold detector response. A change of time correlations does not repair the frozen spatial hard-kick obstruction. |
| 5 | Boundary-dependent extension | No such kernel is present in the frozen model | First specify a causal, energy-accounted response from boundary/material variables to a noise or interaction kernel. Reject mere conversion of Casimir energy to mass as a mechanism. Only then derive both observable classes. |

The August 2026 [Manti et al. preprint](https://arxiv.org/html/2608.07205v1) replaces simplified emitter positions with atomic radial distributions for Ge/Xe. For exponentially correlated temporal noise, its equation 28 multiplies the white-noise radiation spectrum by Ec squared/(Ec squared + E squared), with correlation time hbar/Ec. It supplies a theory comparison, not a new detector exclusion. A new spectral model therefore needs its own response-folded likelihood before any published bound is updated.

If dilute Markovian scattering fails, the [2026 open-system interferometer framework](https://arxiv.org/abs/2606.00237) is a secondary theory resource. For an atom-cloud redesign, [Badurina et al.](https://arxiv.org/abs/2402.03421) also distinguish one-body decoherence from collectively enhanced phase and higher moments. Neither result can be imported without matching the prepared state; the current proposal concerns one sphere's center of mass.

**First bounded follow-up packet:** complete the constituent-response part of lead 1, reproducing atomic spectra in the published limit and documenting the microscopic-to-COM reduction. Width and overall strength need not be rediscovered. In parallel, lead 2 can proceed once LZ's release tables are accessible. No request to the experimenters has been sent.

### 4.1 Additional work completed: convention match and finite-size comparison

XENONnT Appendix A identifies the Diosi normalization; its displayed equation S1 is CSL and must not be reused as the DP equation. The DP source it cites uses the same Gaussian standard deviation as the local article. [XENONnT Appendix A](https://arxiv.org/html/2506.05507v2#A1), [Piscicchia et al., equations 7-10](https://wigner.hu/~diosi/prints/2024prl132_250203.pdf)

With symmetric K(x,y) and commuting mass-density position operators, expanding the local double commutator gives

\[
-\tfrac12\iint K[A,[B,\rho]]
=\iint K\left(A\rho B-\tfrac12\{AB,\rho\}\right).
\]

Thus the local coefficient -G/(2 hbar) equals the G/hbar Lindblad convention used with the same Gaussian. No square-root-of-two width conversion or extra 8 pi factor is needed for this correspondence to the universal microscopic Diosi implementation. This resolves those two bookkeeping questions; it does not establish a microscopic completion of the effective sphere. [Bahrami et al., equations 6 and 10](https://arxiv.org/html/1408.6460)

For normalized Gaussian gR and pair separation rij, direct integration gives

\[
f_{ij}=4\pi\int d^3x\,g_R(x-r_i)g_R(x-r_j)
=\frac{e^{-r_{ij}^2/(4R_0^2)}}{2\sqrt\pi R_0^3}.
\]

The cited white-noise radiation formula then becomes

\[
\frac{d\Gamma_\gamma}{dE}=
\frac{Ge^2}{12\pi^{5/2}\epsilon_0c^3R_0^3E}
\sum_{ij}z_i z_j e^{-r_{ij}^2/(4R_0^2)}
\operatorname{sinc}\!\left(\frac{E r_{ij}}{\hbar c}\right),
\qquad z_i=q_i/e.
\]

The sum includes ordered pairs and self terms, with sinc(0)=1. It is a primitive for microscopic emission, not a detector count rate. The cited semiclassical emission treatment is intended for photon energies above approximately 1 keV; extending it below that range needs a quantum treatment. Charges, correlations, atomic averaging and detector response must be supplied. An effective neutral sphere with one coordinate and net charge zero cannot replace that sum: doing so discards internal charged-particle physics.

There is also a calculable mass-representation difference. A rigid homogeneous sphere of geometric radius R under universal Gaussian smearing R0 has form factor

\[
F(z)=3\frac{\sin z-z\cos z}{z^3},\quad F(0)=1,
\qquad
E_G^{\rm sphere}=\frac{2Gm^2}{\pi R_0}
\int_0^\infty du\,e^{-u^2}F(uR/R_0)^2
\left[1-\operatorname{sinc}(ud/R_0)\right].
\]

Using the same frozen mass, radius, separation, hold and R0 gives a **new ideal-continuum diagnostic**:

| Representation | EG (J) | Diosi-only visibility loss at 0.25 s |
|---|---:|---:|
| Frozen effective Gaussian particle, replay | 1.244879e-35 | 2.90803% |
| Ideal homogeneous finite sphere with Gaussian smearing | 3.576375e-36 | 0.844242% |

The sphere energy is 0.287287 of the effective-particle value. A separate real-space pair-distance integral reproduces the Fourier result. Here R/R0=2.763, so treating the whole body as spatially pointlike for the collapse kernel is not an automatic microscopic reduction.

This is not candidate retuning: all geometric parameters are held fixed, and the density representation is separately labeled. It is not a selected-specimen density measurement, a replacement for the frozen 2.908% comparator, an update to the historical 0.435% transported diagnostic, or a physical lower bound. It shows precisely why the common microscopic model must be matched before transporting a radiation constraint to the effective COM prediction.

## 5. Controls: what is present, what is absent, and what must cancel

Both apparatuses operate in ordinary gravitational backgrounds. Those backgrounds influence trajectories and clocks. They do not identify the perturbation that caused an event. Separate a deterministic potential/phase, random force or metric noise, and a particle collision; they have different parameters and observables.

| Mechanism or effect | Absolute coherence channel | Boundary four-cell channel | Required discriminator |
|---|---|---|---|
| Frozen boundary-independent Diosi model | Prespecified mass/separation/time contraction | Cancels for matched branch-density histories | Same-generator companion, exact external recast, ordinary covariance |
| Boundary-independent dark matter scattering | Visibility, phase, and possibly trial loss | Cancels if flux, response and histories match | Composition, q dependence, orientation/time dependence, loss accounting |
| Boundary-dependent scattering/transport | Model-dependent | May survive | Explicit boundary effect on flux or interaction, separately calibrated ordinary response |
| Thermal, gas, EM, mechanical and readout effects | May imitate a residual | May survive | Measured spectra, differential scattering, Green response and full covariance |
| Deterministic gravitational phase | Phase; apparent loss if unresolved phase varies | Depends on matched worldlines | Tilt, height, vibration and echo transfer measured together |
| Stochastic gravity/noise extension | Depends on specified noise correlation | Depends on boundary coupling | Positive physical noise spectrum, causal response and energy/heating account |

The local ratio uses zero-hold-normalized complex coherences,

\[
R_4=\frac{\bar C_{a,s}\bar C_{r,c}}{\bar C_{a,c}\bar C_{r,s}}.
\]

A common attenuation of the two separated cells cancels. This cancellation applies to scattering as well as collapse if the relevant histories and exposure are identical. A nonunit ratio first rejects a specified factorization/null model; it does not identify gravity. A boundary effect that changes trajectories also changes exposure and must not be attributed to a new coupling without correction.

Retain absolute coherence and R4 as distinct outputs, plus phase and object-loss fractions. Explore separation/time/composition and orientation sweeps with preregistered ordinary models. A sidereal signature is a possible particle-flux discriminator, not a standalone discovery criterion; solar-day drift and orientation-dependent apparatus forces must be controlled. Unmeasured ordinary channels remain unbounded rather than being subtracted using synthetic values.

### Higgs and energy-accounting constraints

The [local Higgs anchor](casimir-dp-electron-mass-higgs-anchor-stage4-2a-report.md) supplies a conditional mass/Yukawa calibration identity. It does not determine a dark-matter-to-Higgs coupling. Likewise, an electroweak normalization in an EFT coefficient does not identify its mediator. A Higgs-portal lead needs a complete coupling model, nucleon matrix elements, recoil predictions and other applicable bounds.

Do not count electron, nuclear, binding and QCD contributions twice when building a specimen's mass density. A scalar T00/c squared conversion also does not supply pressure, stress fluctuations, a retarded metric response, or a metric-to-coherence law. Any proposed joint explanation must account for exchanged energy and momentum, allowed target excitations, spatial and temporal scales, and the signal-producing response. Those are constraints on a proposed mechanism, not a derivation of gravitational origin.

## 6. Root-to-observable claim and falsifier ledger

This packet records proposed chains locally; it adds no promoted Theory Graph edge and leaves the canonical root-to-leaf manifest unchanged.

| Root | Required chain | Claim allowed here | Falsifier / failure condition |
|---|---|---|---|
| Quantum scattering and specified interaction | Amplitude -> target structure -> q/energy spectrum -> detector response or coherence | Common-parameter comparison is definable | No common parameters reproduce both, or projected coherence is undetectable |
| Frozen Gaussian Diosi generator | Mass operator -> momentum kernel -> coherence/heating | Conditional hard-q obstruction and replayed local forecast | Different authenticated kernel/convention; any proposed rescue must be separately named |
| Charged matter coupled to the same noise | Constituent operator -> radiation spectrum -> ER response | Existing experimental consistency route | Undefined charge map, excluded exact parameters, or invalid temporal extrapolation |
| Newtonian weak-coupling gravity | Potential -> Born scattering -> exposure | WIMP benchmark is far too weak | Assumptions changed; then a new calculation is required |
| QED and apparatus mechanics | Material/geometry -> causal response -> phase/loss covariance | Ordinary effects are competing explanations | Independently measured response fails on held-out data |
| Boundary-conditioned gravity/collapse hypothesis | Stress/metric noise -> branch dynamics -> both responses | Missing-theory lead only | No causal kernel, no energy account, or no distinguishable prediction |

## 7. Evidence and verification scope

The main article and Stage-4.2R configuration are hashed in the accompanying [diagnostics](casimir-dp-lz-mechanism-bridge-diagnostics-2026-09-06.json). Calculations use physical SI/natural-unit conversions, analytic formulas, an independent Fourier quadrature for the effective-particle Diosi energy, and mutually independent Fourier and pair-distance integrals for the ideal finite sphere. The negligible difference between the replayed and stored Diosi exponents is reported rather than altering the frozen input.

Before drafting, `npm run atlas:build`, `npm run atlas:why -- docs/research/casimir-dp-quantum-foam-study.md`, and the corresponding `atlas:trace -- ... --upstream` succeeded. The trace identified the article, equation-action references, publication-rebase receipt, staged reports/configurations and historical supplement. No canonical/recovery G4 route applies to this literature comparison, so no G4 first-divergence run was warranted.

`npm run validate:physics:root-leaf` passed. All nine Appendix A checks passed. A separate Node.js numerical integration of the gravitational differential cross-section agreed with the analytic result to 5.3e-15 relative difference; an independent natural-unit momentum calculation agreed to 1.2e-16. Packet verification also checks local links, numerical replay, finiteness, kinematic thresholds and source hashes. R4 cancellation is an algebraic identity under the stated matching assumptions, not a validated experimental null. These checks validate the research record, not the proposed physics.

This patch consists of a research document and its diagnostic data. It changes no physics runtime, adapter, constraint, certificate, training trace, release gate, or maturity assertion. Under AGENTS.md's scoped documentation rule, no server-backed Casimir verification was run. No adapter or certificate-integrity claim is made. Existing reports and frozen inputs are preserved.

## Appendix A. Reproducible diagnostic calculation

Run the following Python 3 standard-library block from the repository root. It prints the JSON companion. Numerical constants are stated directly; precision is sufficient for the diagnostic comparisons. The exact candidate parameters are read from the frozen configuration. `checks` must all be true.

```python
import hashlib
import json
import math
from pathlib import Path

root = Path.cwd()
config_path = Path("configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json")
article_path = Path("docs/research/casimir-dp-quantum-foam-study.md")
config = json.loads((root / config_path).read_text(encoding="utf-8"))
design = config["leading_design"]
G, hbar, c = 6.67430e-11, 1.054571817e-34, 299792458.0
eV, u, year = 1.602176634e-19, 1.66053906892e-27, 365.25 * 86400
mxe, mc = 131.293 * u, 12 * u
ER, R0 = 248e3 * eV, config["frozen_diosi"]["R0_m"]
m, d, t = design["mass_kg"], design["branch_separation_m"], design["hold_time_s"]
mchi, v, exposure = 1000e9 * eV / c**2, 776e3, 2840 * year
q = math.sqrt(2 * mxe * ER)
mu = mxe * mchi / (mxe + mchi)
emax = 2 * mu**2 * v**2 / mxe
eg = G * m**2 * (1 / (math.sqrt(math.pi) * R0) - math.erf(d / (2 * R0)) / d)
gamma = eg / hbar

def simpson(f, a, b, n=20000):
    step = (b - a) / n
    return step / 3 * (f(a) + f(b) + sum(
        (4 if i % 2 else 2) * f(a + i * step) for i in range(1, n)))

def integrand(x):
    z = x * d / R0
    # Stable small-z form of 1-sin(z)/z.
    loss = z*z/6 - z**4/120 if abs(z) < 1e-4 else 1 - math.sin(z)/z
    return math.exp(-x*x) * loss

eg_fourier = 2 * G * m*m / (math.pi * R0) * simpson(integrand, 0, 10)

# A separately labeled ideal homogeneous sphere, not the frozen effective particle.
radius = design["radius_m"]
def sphere_form_factor(z):
    return (1 - z*z/10 + z**4/280 if abs(z) < 1e-3
            else 3 * (math.sin(z) - z*math.cos(z)) / z**3)

sphere_eg_fourier = 2 * G * m*m / (math.pi * R0) * simpson(
    lambda x: integrand(x) * sphere_form_factor(x * radius / R0)**2, 0, 10)

def erf_primitive(r):
    return (r * math.erf(r/(2*R0))
            + 2*R0/math.sqrt(math.pi) * math.exp(-r*r/(4*R0*R0)))

def pair_distance_integrand(s):
    if s == 0:
        return 0.0
    # Pair-distance density for two uniform points in a ball of radius R.
    density = 3*s*s/radius**3 * (1 - 3*s/(4*radius) + s**3/(16*radius**3))
    self_kernel = math.erf(s/(2*R0))/s
    shifted_angular_mean = (erf_primitive(s+d) - erf_primitive(abs(s-d))) / (2*s*d)
    return density * (self_kernel - shifted_angular_mean)

sphere_eg_realspace = G * m*m * simpson(pair_distance_integrand, 0, 2*radius)

def gravity_sigma(speed):
    maximum = 2 * mu**2 * speed**2 / mxe
    if maximum <= ER:
        return 0.0
    return 2 * math.pi * G**2 * mchi**2 * mxe / speed**2 * (1/ER - 1/maximum)

number_density_m3 = (0.3 / 1000) * 1e6
sigma = gravity_sigma(v)
gravity_events = number_density_m3 * v * sigma * exposure / mxe
vmin = q / (2 * mu)
vopt = math.sqrt(3) * vmin
optimized_events = number_density_m3 * vopt * gravity_sigma(vopt) * exposure / mxe
kernel_xe_rate = G * mxe**2 / (math.sqrt(math.pi) * hbar * R0)
xe_heating = G * hbar * mxe / (4 * math.sqrt(math.pi) * R0**3)
stored_exponent = config["frozen_diosi"]["gaussian_exponent_at_hold"]
relative_exponent_difference = abs(gamma*t/stored_exponent - 1)
vmins = {}
for mass_GeV in (100, 200, 1000):
    chi = mass_GeV * 1e9 * eV / c**2
    reduced = chi * mxe / (chi + mxe)
    vmins[str(mass_GeV)] = q / (2 * reduced) / 1000
thresholds = {}
for label, target in (("xenon_mean", mxe), ("carbon12", mc)):
    reduced = target * mchi / (target + mchi)
    thresholds[label] = reduced * v*v / 2 / eV / 1000
natural_q_MeV = math.sqrt(2 * (mxe*c*c/eV/1e9) * (ER/eV/1e9)) * 1000
inelastic_event_vmin = (mxe * ER / mu + 300e3 * eV) / q

checks = {
    "dp_analytic_fourier_relative_agreement_1e_9": abs(eg_fourier/eg - 1) < 1e-9,
    "stored_dp_exponent_agreement_1e_6": relative_exponent_difference < 1e-6,
    "ideal_sphere_fourier_realspace_agreement_1e_9": abs(sphere_eg_realspace/sphere_eg_fourier-1) < 1e-9,
    "q_si_and_natural_units_agree_1e_12": abs(natural_q_MeV/(q*c/eV/1e6)-1) < 1e-12,
    "gravity_cross_section_zero_below_threshold": gravity_sigma(vmin/2) == 0,
    "gravity_speed_optimum_within_benchmark_cap": vopt < v,
    "carbon_endothermic_200_keV_channel_closed": thresholds["carbon12"] < 200,
    "xenon_endothermic_300_keV_channel_open": thresholds["xenon_mean"] > 300,
    "specific_xenon_248_keV_delta300_channel_open": inelastic_event_vmin < v,
}
result = {
    "evidence_class": "exploratory_diagnostic_calculations_not_measured_or_certified",
    "sources_sha256": {str(p).replace("\\", "/"): hashlib.sha256((root/p).read_bytes()).hexdigest()
                       for p in (article_path, config_path)},
    "constants": {"G_SI": G, "hbar_J_s": hbar, "c_m_s": c, "eV_J": eV,
                  "atomic_mass_kg": u, "year_s": year},
    "inputs": {"leading_design": design, "R0_m": R0, "ER_keV": 248,
               "xenon_mean_u": 131.293, "carbon_u": 12, "mchi_GeV": 1000,
               "lab_speed_km_s": 776, "density_GeV_c2_cm3": 0.3,
               "exposure_kg_s": exposure, "stored_dp_exponent": stored_exponent},
    "results": {
        "q_MeV_c": q*c/eV/1e6, "hbar_over_q_m": hbar/q,
        "dp_qscale_eV_c": hbar*c/R0/eV, "q_over_dp_scale": q*R0/hbar,
        "negative_log_gaussian_factor": (q*R0/hbar)**2,
        "xe_recoil_at_dp_scale_eV": hbar**2/(2*mxe*R0**2)/eV,
        "sphere_qR_over_hbar": q*design["radius_m"]/hbar,
        "sphere_coherent_scale_eV_c": hbar*c/design["radius_m"]/eV,
        "dp_EG_J": eg, "dp_EG_fourier_J": eg_fourier,
        "dp_rate_per_s": gamma, "dp_exponent": gamma*t,
        "stored_exponent_relative_difference": relative_exponent_difference,
        "dp_visibility_loss": -math.expm1(-gamma*t),
        "ideal_uniform_sphere_EG_fourier_J": sphere_eg_fourier,
        "ideal_uniform_sphere_EG_realspace_J": sphere_eg_realspace,
        "ideal_uniform_sphere_to_effective_particle_EG_ratio": sphere_eg_fourier/eg,
        "ideal_uniform_sphere_visibility_loss": -math.expm1(-sphere_eg_fourier/hbar*t),
        "dp_object_heating_W": G*hbar*m/(4*math.sqrt(math.pi)*R0**3),
        "dp_isolated_xe_total_kick_rate_per_s": kernel_xe_rate,
        "dp_isolated_xe_mean_energy_in_1us_eV": xe_heating*1e-6/eV,
        "vmin_elastic_km_s": vmins, "delta_max_keV": thresholds,
        "xe_248_keV_delta300_vmin_km_s": inelastic_event_vmin / 1000,
        "gravity_Emax_keV": emax/eV/1000,
        "gravity_sigma_cm2": sigma*1e4, "gravity_expected_events": gravity_events,
        "gravity_optimal_stream_speed_km_s": vopt/1000,
        "gravity_optimal_stream_events": optimized_events,
        "same_accepted_rate_per_kg_toy_counts": m*t/exposure,
        "r0_numerical_screen_ratio": R0/4.9e-10,
    },
    "limitations": [
        "No LZ likelihood, coupling fit, or detection claim.",
        "Mean Xe mass; no isotope or detector response folding.",
        "Gaussian hard-kick test assumes same smearing for nuclear degree of freedom.",
        "Gravity benchmark is elastic Newtonian Born scattering, not all gravity models.",
        "Mass exposure comparison is not a response or decoherence transfer.",
        "XENONnT ratio is not an exact constituent/noise recast.",
        "Ideal uniform sphere is a separate density representation, not a candidate update or measurement.",
    ],
    "checks": checks,
}
assert all(checks.values()), checks
assert all(math.isfinite(x) for x in result["results"].values() if isinstance(x, (float, int)))
print(json.dumps(result, indent=2, allow_nan=False))
```
