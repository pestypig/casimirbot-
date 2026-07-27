# Boundary-Condition Casimir Observables and Diósi–Penrose Collapse

## A separated-lane quantum-foam study protocol

**Study id:** `casimir-dp-quantum-foam-study`  
**Short id:** `CDP-QF-1`  
**Status:** proposal package complete; commissioning conditional on Stage-4.2B identifiability redesign; measured evidence not ready<br>
**Current / maximum claim tier:** diagnostic / diagnostic  
**Manifold-response math maturity:** Stage 0 exploratory / noncomputable  
**Current apparatus-DP forecast:** `signature_not_identifiable`; no DP exclusion<br>
**Evidence cutoff:** 2026-07-26<br>
**Run config:** `configs/research/casimir-dp-quantum-foam-study.v1.json`  
**Runner:** `scripts/research/run-casimir-dp-quantum-foam-study.ts`  
**Experiment-design config:** `configs/research/casimir-dp-experiment-design.v1.json`  
**Experiment-design runner:** `scripts/research/run-casimir-dp-experiment-design.ts`  
**Maintained design report:** `docs/research/casimir-dp-experiment-design-report.md`  
**Gated-computations config:** `configs/research/casimir-dp-next-computations.v1.json`  
**Gated-computations runner:** `scripts/research/run-casimir-dp-next-computations.ts`  
**Gated-computations report:** `docs/research/casimir-dp-next-computations-report.md`  
**Data-readiness config:** `configs/research/casimir-dp-data-readiness.v1.json`  
**Data-readiness runner:** `scripts/research/run-casimir-dp-data-readiness.ts`  
**Data-readiness report:** `docs/research/casimir-dp-data-readiness-report.md`  
**Proposal-closure config:** `configs/research/casimir-dp-proposal-closure.v1.json`  
**Proposal-closure runner:** `scripts/research/run-casimir-dp-proposal-closure.ts`  
**Experiment proposal:** `docs/research/casimir-dp-experiment-proposal.md`  
**Proposal-closure report:** `docs/research/casimir-dp-proposal-closure-report.md`  
**OR/phase Stage-2 config:** `configs/research/casimir-dp-or-phase-stage2.v1.json`<br>
**OR/phase Stage-2 runner:** `scripts/research/run-casimir-dp-or-phase-stage2.ts`<br>
**OR/phase Stage-2 report:** `docs/research/casimir-dp-or-phase-stage2-report.md`<br>
**Stage-3 evidence-map config:** `configs/research/casimir-dp-evidence-map-stage3.v1.json`<br>
**Stage-3 evidence-map runner:** `scripts/research/run-casimir-dp-evidence-map-stage3.ts`<br>
**Stage-3 evidence-map report:** `docs/research/casimir-dp-evidence-map-stage3-report.md`<br>
**Stage-4 polarization/congruence config:** `configs/research/casimir-dp-polarization-congruence-stage4.v1.json`<br>
**Stage-4 polarization/congruence runner:** `scripts/research/run-casimir-dp-polarization-congruence-stage4.ts`<br>
**Stage-4 polarization/congruence report:** `docs/research/casimir-dp-polarization-congruence-stage4-report.md`<br>
**Stage-4 verification receipt:** `docs/research/casimir-dp-polarization-congruence-stage4-verification-receipt.json`<br>
**Stage-4.1 QED scale-hierarchy config:** `configs/research/casimir-dp-qed-scale-hierarchy-stage4-1.v1.json`<br>
**Stage-4.1 QED scale-hierarchy runner:** `scripts/research/run-casimir-dp-qed-scale-hierarchy-stage4-1.ts`<br>
**Stage-4.1 QED scale-hierarchy report:** `docs/research/casimir-dp-qed-scale-hierarchy-stage4-1-report.md`<br>
**Stage-4.1 verification receipt:** `docs/research/casimir-dp-qed-scale-hierarchy-stage4-1-verification-receipt.json`<br>
**Stage-4.2A electron-mass/Higgs-anchor implementation and standing:** `docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-plan.md`<br>
**Implemented Stage-4.2A runtime sources:** `shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts`; `shared/casimir-dp-planck-solar-calibration-stage4-2a.ts` (diagnostic campaign and downstream software verification pass; measured DP evidence not ready)<br>
**Stage-4.2A verification receipt:** `docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-verification-receipt.json`<br>
**Stage-4.2B apparatus-residual plan:** `docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-plan.md`<br>
**Stage-4.2B config:** `configs/research/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json`<br>
**Stage-4.2B runner:** `scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts`<br>
**Stage-4.2B maintained report:** `docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-report.md`<br>
**Stage-4.2B verification receipt:** `docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-verification-receipt.json`<br>
**Stage-4.2B authoritative run:** `artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/` (synthetic only; downstream software verification pass)<br>
**Equation-action sidecar:** `docs/research/casimir-dp-quantum-foam-study.equation-actions.json`  
**Equation-action source:** `docs/research/casimir-dp-quantum-foam-study.equation-actions.source.json`  
**Theory-badge graph:** `shared/theory/casimir-dp-study-theory-badges.ts`

## Abstract

This study asks whether changing a Casimir boundary condition can produce a
pre-registered residual in either a force observable or a coherence-decay
observable while remaining consistent with Diósi–Penrose (DP) collapse
phenomenology and modern experimental bounds. It deliberately separates
standard Casimir theory and measurement, ordinary open-system decoherence, DP
mass-density-branch diagnostics, semiclassical or stochastic metric response,
and candidate quantum-foam models. The study does not assume that measured
Casimir force is DP gravitational self-energy, that a negative renormalized
energy density is a scalar "negative curvature," or that vacuum-induced
decoherence is objective collapse. The initial runnable scaffold therefore
produces independent Casimir and DP diagnostic outputs plus blocked
manifold-response and observable bridges. Promotion requires
material/metrology receipts, a controlled coherence experiment, measured
mass-density branch evidence, quantitative response dynamics, sensitivity and
negative-control campaigns, and comparison with independent collapse bounds.

Stage 4 makes the photon and thermal controls explicit. It resolves the two
transverse electromagnetic polarizations, adds Planck/FDT radiative closure,
checks tensor/dimensional/semantic congruence, expands the ordinary-physics
null, and reuses the named Stage-3 DP manifest without mutation. Its current
outputs are synthetic predictions only: measured evidence is `not_ready` and
collapse/manifold identification remains `blocked`.

Stage 4.1 adds a source-backed QED scale-hierarchy calibration downstream of
that immutable campaign. It checks Compton, atomic, uncertainty, covariance,
and reduced-mass conventions without treating their algebraic congruence as a
Casimir, DP, collapse, or manifold mechanism.

Stage 4.2A implements two further source-backed diagnostic lanes: an
electron-mass/Penning replay with conditional tree-level Higgs-Yukawa
parameterization, and a Planck/solar radiometric calibration with a coarse
frozen-window Wien color diagnostic kept distinct from bolometric effective
temperature. Their campaign, non-promotable Theory Badges, and downstream
software verification pass. These calibration results leave measured DP
evidence `not_ready` and collapse identification and manifold dynamics
`blocked`.

Stage 4.2B now transports the proposed apparatus, complete joint-system branch
ledger, response-corrected thermometry, sensor-noise separation, ordinary
decoherence, frozen named-DP prediction, complex residual, and full covariance
into one content-addressed synthetic campaign. Runtimes A–E pass their software
contracts, but Runtime F fails closed as `signature_not_identifiable`: the
physical signature matrix has rank 7, maximum absolute whitened cosine
\(0.9999771044199663\), and normalized Gram condition number
\(179103.91134865975\). The present controls name their axes and levels but do
not yet carry source-backed numerical response vectors and block covariance.
Required acquisition and power are therefore not estimable. This is an
apparatus-redesign result, not an exclusion of DP and not measured evidence.

### OR-motivated experimental thesis

Penrose objective reduction (OR) supplies the conceptual motivation, not the
current boundary-response prediction. In Penrose's argument, a coherent
superposition of materially different mass distributions is associated,
schematically and in a weak-field description, with branch-dependent spacetime
geometries whose time-translation structures cannot be identified
unambiguously. A gravitational self-energy scale `E_G` gives the
order-of-magnitude instability estimate `tau_OR ~ hbar/E_G`.

`CDP-QF-1` asks a narrower extension question: when the prepared material
branches are held fixed, can changing a nearby QED boundary produce a phase or
coherence differential beyond the complete ordinary-coupling prediction?
Standard Penrose/DP reasoning alone does not predict that boundary dependence.
The experiment is therefore OR-motivated, but it is not a direct confirmation
experiment for OR unless a source-backed boundary-to-collapse dynamics and a
dynamics-level discriminator are supplied.

## 1. Why this is separate from NHM2

NHM2 uses Casimir-related quantities inside a broader source-budget and
geometry pipeline. This paper asks a different question about Casimir
phenomenology and objective-collapse constraints. It may reuse repository
calculators, material receipts, provenance conventions, and run-order lessons,
but it does not inherit NHM2 source closure, transport, viability, certificate,
or force-to-stress assumptions.

The shared study method is procedural:

- freeze claims before running;
- separate observables from interpretations;
- run prerequisites before dependent stages;
- keep scalar calculator rows distinct from field or receipt authority;
- hash outputs and preserve contradictory statuses;
- promote no conclusion beyond the weakest required evidence lane.

The reusable protocol is in
`docs/research/study-full-solve-template.md`.

## 2. Research question and hypotheses

### 2.1 Research question

Can a registered quantum-foam response model produce a gap-, geometry-,
material-, temperature-, or modulation-dependent Casimir residual that is
distinguishable from standard electromagnetic, thermal, material, patch-force,
roughness, and apparatus systematics, while its implied gravitational-collapse
parameters remain compatible with independent DP bounds?

### 2.2 Hypotheses

- `H0 — standard Casimir`: Lifshitz/QED boundary-response theory plus known
  apparatus and material corrections accounts for the data.
- `H1 — quantum-foam residual`: a future, explicitly parameterized
  quantum-spacetime response model predicts an additional observable residual.
- `H2 — nuisance residual`: electrostatic patches, geometry, calibration,
  roughness, drift, thermal response, or model misspecification produces the
  residual.
- `H3 — DP consistency only`: DP supplies a separate collapse-timescale and
  bound-comparison lane for stated mass-density branches; it is not the source
  of a Casimir residual unless a registered theory supplies that bridge.
- `H4 — ordinary boundary-conditioned decoherence`: changing the cavity
  boundary changes electromagnetic, thermal, mechanical, or measurement
  backaction and therefore changes visibility without objective collapse.
- `H5 — manifold-response residual`: after the `H4` budget is frozen and
  subtracted, a registered semiclassical, stochastic-gravity, or new
  quantum-spacetime model predicts a nonzero boundary-conditioned coherence
  residual with a pre-registered scale law.

At scaffold time, `H1` and `H5` are not executable because no quantitative
response model or registered observable bridge has been admitted.

### 2.3 Prompt-derived manifold-response hypothesis

The motivating hypothesis is retained in this narrower form:

> Boundary conditions alter the renormalized quantum-field stress tensor. If a
> source-backed extension of semiclassical or stochastic gravity maps that
> alteration to branch-dependent metric fluctuations, those fluctuations may
> contribute a distinguishable residual to the coherence decay of a separately
> prepared material superposition.

This is a Stage 0 exploratory hypothesis. It is not presently a Penrose or DP
prediction. Its value is that every link can be tested or blocked separately:

1. establish the boundary-conditioned stress-tensor difference;
2. establish the ordinary environmental decoherence budget;
3. hold the material mass-density branches fixed;
4. register a tensor-to-metric and metric-to-coherence response model;
5. test a blinded boundary-conditioned coherence differential;
6. compare any surviving parameter region with independent collapse bounds.

### 2.4 Penrose OR motivation, notation, and scope

The paper uses the following notation crosswalk:

| Layer | Notation | Meaning and authority |
|---|---|---|
| Penrose 1996 | `E_Delta` | Gravitational self-energy of the difference between alternative mass distributions; conceptual OR instability scale. |
| Penrose 2014 | `E_G` | Later notation for the same weak-field order-of-magnitude idea. |
| Repository | `Delta E_G^repo(ell)`; field `deltaE_J` | Plummer-regularized, grid-dependent numerical estimator from explicit material branches. |

<!-- helix-doc-equation-action/v1 id=cdp-or-branch-geometry-context -->
\[
|\Psi\rangle\ \sim\
\alpha|\rho_A,g^{(A)}_{\mu\nu}\rangle+
\beta|\rho_B,g^{(B)}_{\mu\nu}\rangle,
\qquad
\tau_{\mathrm{OR}}\sim\frac{\hbar}{E_G}.
\]

The state notation labels correlated matter and branch-dependent metric
configurations; it is not a completed covariant quantum-gravity state
construction. "Branch-dependent metric configurations" is therefore preferred
here to "two manifolds." Penrose's concern is that point identification and
time translation between the alternative geometries are not canonically
defined. The repository does not solve that geometric superposition. It
computes the regulated Newtonian mass-density proxy in Lane B.

The three quantities in the table correspond conceptually, but they are not
assumed numerically identical across conventions. The repository value depends
on the branch construction, grid, cutoff, Plummer length, and provenance. OR
supplies motivation and a timescale conjecture; it does not supply a Casimir
coupling, a cavity resonance, or a gravitational-wave signature.

An ambient classical gravitational field must also remain separate from the OR
branch-difference energy. A common background belongs to both branch
descriptions. If the material paths sample different gravitational potentials,
it produces an ordinary unitary matter-wave phase:

<!-- helix-doc-equation-action/v1 id=cdp-ambient-gravity-phase-control -->
\[
\Delta\phi_g=
-\frac{m}{\hbar}\int
\left[\Phi_A(t)-\Phi_B(t)\right]dt.
\]

This phase, plus tidal, vibration, and alignment effects, is an experimental
control. The mere presence of `Phi_ambient` or `|g|` is not
`E_G[rho_A-rho_B]` and does not open the Casimir-to-OR bridge. For the frozen
`75 nm` silica sphere, `20 nm` branch separation, and `0.1 s` window, a fully
vertical branch separation would produce about `7.23e8 rad`. Keeping a
boundary-correlated contribution below `0.1 rad` requires a vertical-projection
stability of about `2.77e-18 m`, or a small-angle tilt stability of about
`1.38e-10 rad`. These are high-risk measured controls, not collapse
predictions.

Penrose OR is the only part of the OR/Orch OR family placed in the causal
motivation of this study. Orch OR adds a biological proposal involving
microtubules, neuronal orchestration, anesthetic response, and conscious
events. `CDP-QF-1` contains none of those preparations or endpoints. It can at
most constrain the OR ingredient under a named mass-density and regularization
model; it cannot validate or falsify Orch OR as a complete biological theory.

## 3. Lane A — Casimir reference and observation

For ideal, perfectly conducting parallel plates at zero temperature, the
reference energy per unit area is:

<!-- helix-doc-equation-action/v1 id=cdp-casimir-energy-per-area -->
\[
\frac{E_C}{A}=-\frac{\pi^2\hbar c}{720a^3}.
\]

The corresponding ideal pressure is:

<!-- helix-doc-equation-action/v1 id=cdp-casimir-pressure -->
\[
P_C=-\frac{\pi^2\hbar c}{240a^4}.
\]

These are reference rows, not complete apparatus predictions. A reportable
measurement comparison must attach run-specific geometry, gap calibration,
dielectric response, temperature, roughness, patch-potential, vibration, and
force-response receipts. For shaped or finite structures, an ideal
parallel-plate result cannot substitute for a validated geometry/material
calculation.

Define the measurement residual only after those corrections are frozen:

<!-- helix-doc-equation-action/v1 id=cdp-casimir-force-residual -->
\[
R_F(a,T,\mathcal{G},\mathcal{M})=F_{obs}-F_{standard}.
\]

`R_F` is an observed-minus-model force residual in newtons. It is not an energy,
mass-density branch difference, gravitational self-energy, or collapse rate.

The ideal parallel-plate case is attractive. Casimir interactions are not
intrinsically "repulsion from negative density": their sign and spatial stress
depend on boundary conditions, geometry, material response, medium, and state.
Likewise, "virtual photons popping in and out" is a perturbative picture, not a
literal population with a measured birth, lifetime, and annihilation event.
The study therefore uses renormalized field observables and apparatus response,
not virtual-particle trajectories, as the QED lane.

## 4. Lane B — Diósi–Penrose diagnostic

The DP lane begins with two explicit mass-density branches:

\[
\Delta\rho(\mathbf{x})=\rho_A(\mathbf{x})-\rho_B(\mathbf{x}).
\]

Positive and negative regions of `Delta rho` record where ordinary positive
mass is present in one material branch relative to the other. They do not
represent negative-mass matter, negative-frequency particles, or Casimir
negative energy. The Casimir stress difference and the DP mass-density
difference are distinct signed quantities with distinct operational
definitions.

The repository computes a regularized gravitational self-energy diagnostic
from those branches. Its conceptual form is:

<!-- helix-doc-equation-action/v1 id=cdp-dp-self-energy -->
\[
\Delta E_G\sim \frac{G}{2}\iint
\frac{\Delta\rho(\mathbf{x})\Delta\rho(\mathbf{y})}
{|\mathbf{x}-\mathbf{y}|}\,d^3x\,d^3y.
\]

This is field/runtime-owned. A scalar calculator cannot reconstruct it from a
Casimir force value. The scalar timescale may be replayed only after
`deltaE_G_J` has a documented branch, grid, cutoff, and provenance receipt:

<!-- helix-doc-equation-action/v1 id=cdp-dp-timescale -->
\[
\tau_{DP}=\frac{\hbar}{\Delta E_G}.
\]

Analytic or synthetic branch distributions are diagnostic. Measured-density
paths still require traceable branch construction and current experimental
bound comparison. DP collapse is a stochastic model modification, not a result
derived from standard Casimir theory.

### 4.1 Compton-frequency non-bridge

Mass-energy equivalence and Planck's relation permit frequency notation, but
they do not by themselves identify a physical oscillator, a spectral line, or
an apparatus coupling. Define the rest-energy and DP characteristic
frequencies separately:

<!-- helix-doc-equation-action/v1 id=cdp-compton-dp-frequency-identities -->
\[
\nu_C=\frac{mc^2}{h},\qquad
\nu_{DP}=\frac{\Delta E_G}{h}=\frac{1}{2\pi\tau_{DP}},\qquad
\omega_{DP}=\frac{\Delta E_G}{\hbar}=\tau_{DP}^{-1}.
\]

`\nu_C` is the Compton frequency associated with total rest energy. It becomes
operational only through a specified phase difference, reference, and readout;
the identity does not make the body vibrate at `\nu_C`. By contrast,
`\nu_{DP}` and `\omega_{DP}` are derived from the branch-dependent DP
self-energy. They express the inverse DP timescale in cyclic- and
angular-frequency notation, but the current DP model does not predict an
oscillatory line at either rate.

Equal dimensions do not establish a coupling to a Casimir-cavity mode. The
study therefore registers the following fail-closed gate:

<!-- helix-doc-equation-action/v1 id=cdp-frequency-cavity-bridge-gate -->
\[
\mathrm{Bridge}(\nu_C,\nu_{DP},\omega_{cavity})
=\mathrm{BLOCKED}:
\mathcal K_{cavity\rightarrow branch/coherence}\ \text{not registered}.
\]

Opening this gate requires a sourced transfer kernel `\mathcal K` that states:

- which boundary-conditioned field observable enters the model, such as a
  renormalized spectral density, stress tensor, or noise kernel;
- how that input modifies `\Delta\rho`, `\Delta E_G`, or a declared
  coherence/master-equation term without substituting one observable for
  another;
- the predicted differential output, including its gap, material, temperature,
  switching-state, and superposition-geometry dependence;
- units, normalization, covariance, validity domain, standard and DP limits,
  parameter priors, and an independently testable falsifier; and
- a source or derivation that supplies the dynamics, rather than an analogy
  based only on `E=mc^2=h\nu`.

Until those items exist, "beat frequency," "manifold ringing," and
"quantum-foam resonance" are explanatory metaphors, not registered
observables or predictions.

#### Stage-4.1 QED scale-hierarchy calibration

Stage 4.1 is a source-backed algebra and metrology calibration downstream of
the immutable Stage-4 campaign. It does not revise the Stage-4 config,
authority manifest, reports, receipts, DP parameter manifest, or predictions.
The [BIPM SI definition](https://www.bipm.org/en/measurement-units/si-defining-constants)
fixes \(h\) and \(c\) exactly in SI, while the
[2022 CODATA adjustment](https://doi.org/10.1103/RevModPhys.97.025002)
supplies the adjusted values, standard uncertainties, and correlations used
for the remaining electron and atomic scales.

The calibration uses an explicit namespace: \(\alpha_{\rm fs}\) is the
fine-structure coupling, \(\alpha_{ij}^{\rm pol}\) is a polarizability tensor,
and \(\alpha_{\rm stat}\) is a statistical threshold. Bare `alpha` is not an
admitted input. Full and reduced Compton quantities, and cyclic and angular
frequencies, are kept distinct:

<!-- helix-doc-equation-action/v1 id=cdp-qed-scale-hierarchy-identities -->
\[
\begin{aligned}
\nu_C&=\frac{m_ec^2}{h}=\frac{c}{\lambda_C},
&\omega_C&=\frac{m_ec^2}{\hbar}
=\frac{c}{\bar\lambda_C}=2\pi\nu_C,\\
\lambda_C&=\frac{h}{m_ec},
&\bar\lambda_C&=\frac{\hbar}{m_ec}
=\frac{\lambda_C}{2\pi},\\
a_0&=\frac{\bar\lambda_C}{\alpha_{\rm fs}},
&r_e&=\alpha_{\rm fs}\bar\lambda_C
=\alpha_{\rm fs}^2a_0,\\
R_\infty&=\frac{\alpha_{\rm fs}^2m_ec}{2h},
&cR_\infty&=\frac12\alpha_{\rm fs}^2\nu_C,\\
\mathrm{Ry}&=hcR_\infty
=\frac12\alpha_{\rm fs}^2m_ec^2,
&E_h&=2\,\mathrm{Ry}
=\alpha_{\rm fs}^2m_ec^2,\\
u^2[f(\mathbf x)]&=\mathbf J\,\mathbf C_{\mathbf x}\,\mathbf J^{\mathsf T},
&J_i&=\frac{\partial f}{\partial x_i}.
\end{aligned}
\]

Here \(\alpha_{\rm fs}\) is the dimensionless electromagnetic coupling in the
stated low-energy convention. It is not a universal probability that an
electron emits or absorbs a photon. Process probabilities and rates depend on
the interaction, kinematics, selection rules, phase space, preparation, and
environment, even when their perturbative expansions contain powers of
\(\alpha_{\rm fs}\); away from the CODATA low-energy convention, its running
and renormalization scheme must also be declared. Likewise, \(\nu_C\) and
\(\omega_C\) are rest-energy conversion scales, not evidence that the electron
or apparatus is a physical oscillator or clock at those frequencies.
\(cR_\infty\) is the infinite-nuclear-mass Rydberg frequency scale, not a
complete measured atomic transition.

The covariance expression is mandatory when adjusted CODATA inputs are
combined. Treating \(\alpha_{\rm fs}\), \(m_e\), \(R_\infty\), \(a_0\), or
their derived reference values as statistically independent can double-count
the same adjustment and understate uncertainty. If the required
cross-covariance is unavailable, the runtime may report a conservative
envelope but may not report an independent-input significance or precision
validation.

Hydrogen spectroscopy is retained only as a leading-order recovery boundary.
With the bare-proton ratio \(q=m_p/m_e\),

<!-- helix-doc-equation-action/v1 id=cdp-qed-hydrogen-reduced-mass-boundary -->
\[
\begin{aligned}
\mu_{ep}&=\frac{m_em_p}{m_e+m_p}
=m_e\frac{q}{q+1},\\
R_H^{(0)}&=\frac{\mu_{ep}}{m_e}R_\infty,
&\nu_{1S\rightarrow2S}^{(0)}
&=\frac34\,cR_H^{(0)},\\
\nu_{1S\rightarrow2S}^{\rm model}
&=\nu_{1S\rightarrow2S}^{(0)}
+\delta\nu_{\rm Dirac/fs}
+\delta\nu_{\rm recoil}
+\delta\nu_{\rm radiative/Lamb}
+\delta\nu_{\rm finite\ size}
+\delta\nu_{\rm hfs}+\cdots .
\end{aligned}
\]

The reduced-mass row must use the bare proton rather than a hydrogen-atom mass.
The correction ledger must state the chosen transition centroid and retain
relativistic/fine-structure, recoil, radiative/Lamb-shift, finite-nuclear-size,
hyperfine, and any apparatus corrections separately. Agreement of the
leading-order row with its intended scale is not a precision spectroscopy
prediction and must not be compared with a measured \(1S\)-\(2S\) frequency as
though the omitted terms were zero.

The maximum Stage-4.1 claim is `qed_scale_identity_calibration`: the equations,
namespaces, source literals, uncertainties, covariance policy, and leading
reduced-mass recovery are internally consistent at the declared tolerance.
This calibration supplies no polarization, cavity-mode, Casimir-force,
Casimir-energy, DP-rate, collapse, manifold-response, resonance, or transfer
kernel evidence. Its semantic output remains
`same_dimension_not_connected`, so it cannot open any Stage-4 bridge or raise
the paper above diagnostic maturity.

The authoritative Stage-4.1 execution is
`casimir-dp-qed-scale-hierarchy-stage4-1-v1-20260725T183020238Z`, with config
SHA-256
`e2625c86a5366258677c58cbe78e73b8fcc1893ecd417b48765d74488f953478`,
JSON report SHA-256
`8f06bf394e64d40d24530e9e93b5d61edece3752318ece2095f27d61f55042c5`,
Markdown report SHA-256
`6ae9530701fc35aa544b438709e789929b45eaf53ae950ec93ed976bb9703ba6`,
and campaign-receipt SHA-256
`d835b56a87ed6f6d78edfb8e627bceecb931575348232ca0fd77795f5ffe24af`.
Its downstream verification receipt has SHA-256
`a7f60aa9b12b7c1c143a7a1681048a61275495aaed33e1dfa6caa11e9e44b8db`.
The fresh adapter trace
`casimir-dp-qed-scale-hierarchy-stage4-1-v1-20260725T183020238Z-final`
records `PASS`, no first failure, no deltas, and certificate integrity `true`
for the explicitly supplied software metrics; the combined replay contains 32
files and 328 passing tests. Certificate status `GREEN` has scientific scope
`none`, is not WARP admissibility, and does not promote any not-ready, blocked,
or not-evaluated scientific gate.

#### Implemented Stage-4.2A electron-mass and Higgs-Yukawa anchor

This calibration branch defines how the electron rest-mass input is measured
and how the same parameter is written in Standard Model notation. It
reconstructs a published Penning-trap/bound-electron \(g\)-factor
determination,

\[
m_e=
\frac{|g_b|}{2}\frac{|e|}{|q|}
\frac{\omega_c}{\omega_L}m_{\rm ion},
\]

with the bound-state-QED, ion-binding, recoil, nuclear, trap-systematic,
source-overlap, and covariance ledgers explicit. Because the selected mass
measurement contributes to fundamental-constant adjustments, agreement with
CODATA is not automatically an independent validation.

In the conditional tree-level Standard Model convention,

\[
m_ec^2=\frac{y_e^{\rm tree}v_F}{\sqrt2},\qquad
v_F=(\sqrt2G_F)^{-1/2}\approx246.21965\ {\rm GeV},
\]

so the rest-energy reference implies
\(y_e^{\rm tree,inferred}\approx2.93503\times10^{-6}\). Here \(v_F\) is an
energy-scale input inferred from muon decay: multiplying the substituted
Compton or Rydberg expressions by another \(c^2\) would be a unit error.
Precision use requires a declared pole/running-mass scheme, renormalization
scale, VEV/tadpole convention, and electroweak/QED matching correction.

CERN Higgs results support the broader mass-dependent coupling pattern for
resolved heavier particles, but the electron-specific collider lane is
currently an upper bound, not a direct Standard Model electron-Yukawa
measurement. The maximum mass-lane claim is
`electron_mass_metrology_replay_and_conditional_sm_tree_mapping_only`.
Stage 4.2A cannot explain why \(y_e\) has its value, treat the Higgs field as
drag, identify the Higgs and Casimir vacua, or connect either to DP collapse
or manifold dynamics. The complete contract is in
`docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-plan.md`;
the implemented split is
`shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts` and
`shared/casimir-dp-planck-solar-calibration-stage4-2a.ts`. Campaign run
`casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1-20260725T211750900Z`
passed its frozen source, software, fixture, and final-status contracts. Its
report hashes are
`a53a2f1cdc7e4b2d1c9957aaa0a73316d77037371002b7ced4a2978a630fe35d`
(JSON) and
`d7dbf59d6e284ef60ccae58f0f01076b453de1a81fcb2b6863bf44d969f7357a`
(Markdown); its campaign-receipt SHA-256 is
`592a6245993411801672c6fa6ffa4cea4484e4fcf9164ad03f586a55333b17c3`.
The live non-promotable badges are
`study.casimir_dp.electron_mass_higgs_anchor_stage4_2a` and
`study.casimir_dp.planck_solar_calibration_stage4_2a`; both have zero
calculator payloads and zero observable bridge edges. Fresh adapter run `2324`
returns `PASS`, first failure `null`, empty deltas, certificate integrity
`true`, and certificate SHA-256
`38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34`.
The downstream verification-receipt SHA-256 is
`debd651e7e500ee9b7011e7fa1c7a16ddcdcf56a6957ca0d2d91b28fe756b66a`.
The certificate has scientific scope `none`.

Stage 4.2A also defines a cross-scale calibration ladder from the Penning
\(m_e\) replay through \(m_ec^2\), Compton/Rydberg identities,
Planck/Stefan-Boltzmann normalization, distinct TSIS spectral color-temperature
and IAU bolometric effective-temperature checks, and finally the separately
preregistered DP \(E_G/\hbar\) test. The ladder standardizes constants, units,
source ancestry, and normalization. It is not a causal chain: the solar and
atomic outputs do not populate \(E_G\), and common \(h\), \(\hbar\), \(c\), or
dimensions do not evidence collapse.

### 4.2 Scientific and runtime claim baseline

The following table fixes the interpretation baseline used by the paper,
sidecars, and Theory Badge graph. "Resolved" in the runtime column means that
the claim is classified and bounded; it does not mean that the proposed physics
has been experimentally demonstrated.

| Proposition | Scientific standing | Paper/runtime standing | Allowed use in this study |
|---|---|---|---|
| `E=mc^2=h\nu_C` supplies a collapse clock | The identity defines a Compton frequency but no collapse observable or cavity coupling by itself. | `blocked` by the Compton/DP/cavity frequency-separation gate. | Rest-energy bookkeeping and explicitly modeled phase differences only. |
| \(cR_\infty=\alpha_{\rm fs}^2\nu_C/2\) supplies a Casimir/DP mechanism | This is a QED/atomic scale identity. \(\alpha_{\rm fs}\) is a coupling, not a universal emission probability, and \(cR_\infty\) is not a complete measured line. | Stage-4.1 source/algebra/covariance calibration only; semantic state `same_dimension_not_connected`. | Constants, convention, uncertainty, and leading reduced-mass checks only. |
| \(m_ec^2=y_ev_F/\sqrt2\) and CERN Higgs data independently validate the electron anchor | The tree relation parameterizes the electron mass in the minimal Standard Model; \(y_e\) remains a free parameter. Heavier-particle measurements support the broader pattern, while direct \(H\to e^+e^-\) searches currently provide an upper bound only. | Stage-4.2A source-backed metrology replay and conditional tree mapping `pass`; direct electron-Yukawa observation `not_ready`; live badge non-promotable. | Electron-mass provenance, conditional tree mapping, and collider-bound compatibility only; no Casimir/DP transfer. |
| \(m_e\rightarrow\nu_C,R_\infty\rightarrow\) Planck spectrum \(\rightarrow T_\odot\rightarrow\Gamma_{\rm DP}\) is one physical ladder | The electron/atomic and thermal/solar relations form separate calibration branches. The implemented TSIS result is a coarse frozen-window Wien-peak color diagnostic, not a full spectral fit; the IAU value is a nominal bolometric conversion; the DP rate consumes an independently prepared \(\Delta\rho\). | Stage-4.2A Planck/Stefan-Boltzmann and distinct color/bolometric temperature closures `pass`; measured spectral-fit significance and the measured DP gate remain `not_ready`, while transfer/collapse gates remain `blocked`. | Source, unit, spectral, and normalization regression only; only a measured DP residual and scaling test may advance collapse evidence. |
| The current apparatus is ready to exclude DP | Stage-4.2B couples the proposed apparatus into one frozen synthetic observable/covariance space, but the DP and nuisance signatures are nearly collinear and the controls lack numerical response/covariance authority. | Campaign/content integrity `pass`; A–E `pass`; F `blocked` as `signature_not_identifiable`; required windows and power `not_estimable_until_identifiable`; measured evidence `not_ready`. | Apparatus redesign and calibration target only. It excludes no DP region and supplies no collapse or manifold evidence. |
| DP reduction is a beat between two manifolds | Penrose motivates an incompatibility between alternative mass geometries; the repository implements a nonrelativistic mass-density self-energy proxy, not an acoustic mode. | DP rate-only diagnostic; covariant manifold dynamics `blocked`. | Metaphor only; no resonance or spectral-line claim. |
| Collapse accelerates merely in a stronger ambient gravitational field | Standard OR/DP uses the branch-relative self-energy, not the shared field magnitude. Different path potentials can create a large ordinary unitary phase. | Ambient-gravity phase/tilt runtime `pass`; measured alignment receipts `not_ready`. | Treat as a phase and systematics control, not an OR rate. |
| Constructive/destructive interference or gravitational-wave reality proves quantum manifolds | Interference measures phase and visibility; gravitational-wave observations establish classical metric dynamics. Neither result establishes superposed quantum geometries or objective reduction. | Four-quadrature readout runnable; measured evidence `not_ready`; collapse and manifold gates `blocked`. | Instrument/readout motivation only. |
| A non-biological Casimir experiment validates Orch OR | Orch OR adds microtubule, neuronal, anesthetic, and consciousness claims absent from this protocol. | Explicit Orch OR scope boundary; no biological runtime. | At most constrain a named OR ingredient, never the complete Orch OR theory. |
| Conducting plates literally filter long-wavelength virtual particles | Mode and Green-function language can be useful, but a virtual-particle population is not the measured observable and Casimir forces do not select a unique vacuum ontology. | Resolved as a QED claim boundary. | Use Lifshitz/material response and measured apparatus observables. |
| A Casimir region has absolute negative energy | Ideal renormalized stress can be negative relative to a reference; real apparatus predictions require material, boundary, geometry, temperature, and renormalization receipts. | Ideal and reduced-order validation `pass`; apparatus-matched evidence `not_ready`. | Reference-subtracted stress/force statements with stated model domain. |
| Negative energy density means negative spacetime curvature | Curvature follows a tensor field equation; the sign of one stress component does not determine the solved geometry. | Semiclassical baseline registered; causal manifold response `blocked`. | Tensor-source hypothesis only, with no geometry-control claim. |
| Changing a cavity boundary changes the standard DP rate | Not when the material branch distributions and DP regularization are held fixed. | Conditional DP boundary null registered. | A nonzero effect requires a new sourced bridge or a documented branch change. |
| Sweeping cavity spacing maps virtual-photon or quantum-foam frequencies | No registered theory supplies a one-to-one spectral map; a gap sweep also changes ordinary electromagnetic and mechanical nuisances. | Primary proposal instead freezes geometry and switches a boundary state between shots. | Exploratory diagnostic only after an explicit transfer function and nuisance model exist. |
| A boundary-conditioned coherence residual proves objective collapse | A residual first identifies model inadequacy or unmodeled decoherence; nonunitary attribution requires discriminating dynamics and replication. | Coherence pipeline `pass`; measured evidence `not_ready`; collapse identification `blocked`. | Report as a residual until the preregistered identification gate closes. |

Penrose's motivation concerns the ill-defined identification of time evolution
between materially different spacetime geometries. The repository DP estimator
implements the nonrelativistic mass-density self-energy proxy above; it does not
compute a covariant superposition of manifolds. A virtual photon is also not a
prepared, persistent mass-density branch accepted by that estimator. Applying
`\tau_{DP}=\hbar/\Delta E_G` to an assigned virtual-particle "lifetime" would
therefore mix two different formalisms without a registered derivation.

The repository's generic DP adapters can, for exploratory diagnostics, convert
signed `energy_density_J_m3` or `geom_stress` samples into a scalar
`T00/c^2`-like density grid. That generic capability is not admitted as a
Casimir-to-OR bridge in this study. A scalar conversion omits the pressure,
momentum-flux, renormalization, gauge, causal metric-response, and
metric-to-coherence dynamics required by the proposed mechanism. Feeding a
Casimir stress sample through that adapter cannot close the observable,
frequency, collapse-identification, or manifold-response gates.

For the current DP implementation, a useful null prediction is:

<!-- helix-doc-equation-action/v1 id=cdp-dp-boundary-null -->
\[
\Delta_b\Gamma_{\mathrm{DP}}^{\mathrm{registered}}=0
\quad\text{only if}\quad
\Delta\rho_{r_0}^{(b=0)}(\mathbf x,t)
=\Delta\rho_{r_0}^{(b=1)}(\mathbf x,t)
\]

Here `b` labels the cavity boundary setting, not a DP branch, and
\(\Delta\rho_{r_0}\) denotes the complete joint-system branch-density
difference after the exact registered smearing prescription. This conditional
identity applies only to the named nonrelativistic Markovian mass-density DP
generator with the same parameter manifest, grid, smearing, trajectories,
branch geometry, and measured preparation in both boundary states. It is not a
theorem about Penrose OR generally, relativistic, colored, dissipative, or
non-Markovian collapse models, or a separately postulated branch-dependent
cavity modifier. If the boundary moves, heats, polarizes, charges, strains, or
otherwise changes any registered branch density or trajectory, the premise is
false.

Stage 4.2B recovers the numerical identity for its synthetic design fixture,
but its state-preparation evidence class remains `design_assumption`.
Experimental complete-joint-system equivalence is `not_ready`, so the runtime
does not authorize a physical boundary-null claim. A measured
boundary-correlated residual under a future validated identity would first be
an anomaly relative to the registered model, not automatic evidence for
Casimir-modified collapse.

## 5. Lane C — candidate quantum-foam model

### 5.1 Semiclassical curvature baseline

The conservative starting point is not a foam ontology but the renormalized
stress tensor in semiclassical gravity. In a simplified notation,

<!-- helix-doc-equation-action/v1 id=cdp-semiclassical-curvature-baseline -->
\[
G_{\mu\nu}+\Lambda g_{\mu\nu}
=\frac{8\pi G}{c^4}\left\langle\hat T_{\mu\nu}\right\rangle_{\rm ren}.
\]

A complete renormalized treatment may also require local curvature counterterms.
The equation is a tensor relation: a negative value of one energy-density
component does not by itself imply a globally or uniquely "negative-curved"
manifold. Pressures, momentum fluxes, the quantum state, boundary conditions,
and the solved geometry all matter.

For two controlled cavity settings `b_1` and `b_0`, define the QFT input as:

<!-- helix-doc-equation-action/v1 id=cdp-boundary-stress-difference -->
\[
\Delta_b\!\left\langle\hat T_{\mu\nu}\right\rangle_{\rm ren}
=\left\langle\hat T_{\mu\nu}\right\rangle_{\rm ren}^{b_1}
-\left\langle\hat T_{\mu\nu}\right\rangle_{\rm ren}^{b_0}.
\]

This boundary-setting difference is not the DP mass-density branch difference
`\Delta\rho`. It can become an input to a manifold-response model only after
its material, geometry, state, renormalization, and uncertainty contracts are
specified.

### 5.2 Mean response, fluctuations, and collapse are separate

The semiclassical equation uses the mean renormalized stress tensor. A
stochastic-gravity treatment adds stress-tensor correlations through a noise
kernel and can predict induced metric fluctuations. Neither framework, by
itself, is the DP objective-collapse rule. The study therefore distinguishes:

- mean Casimir stress and its semiclassical metric response;
- stress-tensor noise and ordinary open-system decoherence;
- a DP collapse term derived from stated material mass-density branches;
- a genuinely new manifold-response or quantum-foam term.

Environmental decoherence can suppress interference while the joint quantum
state remains unitary. Objective collapse changes the dynamics. Observing
visibility loss is not enough to distinguish them without a model comparison
and a complete noise budget.

### 5.3 Registered coherence observable

The proposed direct manipulation is to change a cavity boundary setting while
holding the prepared material superposition fixed, then measure its coherence
decay rate `\Gamma`. The residual observable is:

<!-- helix-doc-equation-action/v1 id=cdp-coherence-rate-residual -->
\[
\Delta\Gamma_{res}
=\left(\Gamma_{obs}^{b_1}-\Gamma_{obs}^{b_0}\right)
-\Delta\Gamma_{EM}-\Delta\Gamma_{thermal}
-\Delta\Gamma_{mech}-\Delta\Gamma_{readout}.
\]

Every subtraction term must be fixed from calibration or control data before
the blinded target comparison. The standard-null expectation is
`\Delta\Gamma_{res}=0` within the combined uncertainty.
This paper uses four aggregate nuisance buckets: `EM` includes the separately
reported electrostatic, patch, and surface terms; `thermal` includes thermal,
blackbody, and residual-gas collision terms; `mech` contains vibration and
trap-motion terms; and `readout` includes optical readout and backaction. The
experiment proposal expands those same buckets into seven explicit terms; it
does not define a different residual.

Phase and visibility are separate readout coordinates. A static boundary has a
state, not an oscillation phase with which the particle becomes "in phase."
The interferometric phase is the material-branch action difference under a
specified boundary state, and the two-port probabilities make constructive and
destructive interference operational:

<!-- helix-doc-equation-action/v1 id=cdp-interferometric-phase-visibility-readout -->
\[
\Delta\phi_b=
-\frac{1}{\hbar}\int
\left[U_{b,A}(t)-U_{b,B}(t)\right]dt,
\qquad
P_\pm(b,t)=\frac12\left[
1\pm V_b(t)\cos\!\left(\Delta\phi_b+\chi\right)\right],
\qquad
V_b(t)=V_{b,0}e^{-\Gamma_b t}.
\]

The phase residual is formed only after subtracting registered QED,
electrostatic, thermal, mechanical, readout, and gravity phase terms. A phase
shift can occur without visibility loss; visibility loss can occur without a
resolved phase shift; and neither observation alone identifies nonunitary
collapse. Four analysis phases `chi={0,pi/2,pi,3pi/2}` reconstruct the cosine
and sine quadratures, visibility, and phase without assigning their cause.

### 5.4 Candidate manifold-response bridge

The prompt's core proposal is represented by a deliberately unregistered
functional:

<!-- helix-doc-equation-action/v1 id=cdp-manifold-response-slot -->
\[
\Delta\Gamma_{MR}
=\mathcal{F}_{MR}\!\left[
\Delta_b\!\left\langle\hat T_{\mu\nu}\right\rangle_{ren},
N_{\mu\nu\rho\sigma},\Delta\rho;\theta_{MR}\right],
\qquad \mathcal{F}_{MR}\ \text{not yet registered}.
\]

`N_{\mu\nu\rho\sigma}` denotes a stress-tensor noise kernel. A candidate model
must state whether it uses the mean source, the correlations, or both; how they
produce a branch-dependent metric response; how that response changes
coherence; and why the term is objective collapse rather than an unmodeled bath.
It must also recover the ordinary QED/open-system and DP limits when its new
coupling is set to zero.

### 5.5 Quantum-foam model requirements

"Quantum foam" is a model-family label until a study version supplies all of:

- state variables and dynamics;
- a response function mapping model parameters to a Casimir observable;
- dimensional and frame consistency;
- a validity domain and limiting behavior recovering the standard baseline;
- an uncertainty/error model;
- a falsifier that separates the signal from material and apparatus nuisance
  models;
- a separately justified map, if any, to DP mass-density branches or collapse
  parameters.

The current hypothesis slot is intentionally noncomputable:

<!-- helix-doc-equation-action/v1 id=cdp-quantum-foam-response-slot -->
\[
R_F^{foam}=\mathcal{R}_{foam}(a,T,\mathcal{G},\mathcal{M};\theta_{foam}),
\qquad \mathcal{R}_{foam}\ \text{not yet registered}.
\]

No parameter fit is permitted until `\mathcal{R}_{foam}` and the nuisance model
are frozen before exposure to the target residual dataset.

### 5.6 Direct-manipulation experiment packet

The preferred experiment is a differential coherence study, not a force-only
measurement:

1. prepare the same spatial or mechanical superposition under both cavity
   settings;
2. switch or modulate a boundary property without changing the branch mass
   distribution;
3. record force, displacement, temperature, charge/patch potential, vibration,
   photon occupation, material loss, and readout backaction as sidecars;
4. infer `\Gamma_{obs}` with the analysis blinded to the boundary label;
5. unblind only after the standard decoherence model and uncertainty budget are
   frozen;
6. test the pre-registered gap, material, temperature, modulation-frequency,
   and branch-separation scaling laws;
7. repeat with a matched-force or matched-heating control that changes the QED
   bath without the proposed manifold variable, where feasible.

Static and actively modulated boundary protocols must be separate campaigns.
Active modulation can create ordinary photons, heating, vibration, and
dynamical-Casimir-like excitations, all of which belong to `H4` unless a
quantitative residual survives their modeled contribution.

### 5.7 Role-separated experiment-design campaign

Campaign `boundary-coherence-platform-screen-v1` compares three complementary
roles. It does not declare one apparatus to be the physics winner:

| Role | Platform and actuator | Diagnostic result | Present use |
|---|---|---|---|
| Casimir calibration | Cryogenic nanomechanical resonator; superconducting transition | ideal-reference force SNR `1.30e6`; unmodeled phase `1.23e-7 rad`; DP branch unresolved | characterize boundary switching and force sidecars |
| Integrated development | Cryogenic levitated nanoparticle; symmetric gated 2D boundaries | force SNR `163`; visibility `0.807`; corrected centered-grid Gaussian-proxy `tau_DP=1.04e6 s` | develop the joint switching/coherence protocol |
| Spatial benchmark | Free-flight nanoparticle matter wave; photoexcited semiconductor | `133 nm` branch separation; visibility `0.242`; unmodeled phase `8.24e5 rad` | benchmark large separation while exposing the force-cancellation problem |

For the integrated levitated design, the registered proxy gives
`Gamma_DP=9.62e-7 s^-1` against an assumed ordinary-environment rate of
`Gamma_env=2.15 s^-1`. The accessible-rate ratio is therefore:

<!-- helix-doc-equation-action/v1 id=cdp-accessible-rate-ratio -->
\[
\mathcal R_{access}=\frac{\Gamma_{DP}}{\Gamma_{env}}
=4.47\times 10^{-7}.
\]

This more-than-six-order rate gap is the central quantitative design constraint,
not evidence of collapse. Closing it requires measured decoherence sidecars,
realistic mass-density branches, a publication-grade finite-material Casimir
calculation, and a dynamics-level discriminator. The nanomechanical candidate
ranks highest on the campaign's engineering index only because it is a strong
actuator/calibration platform; its femtometre-scale branch requires an
elastic-body DP model and is not currently a DP test result.

All current Casimir values in this campaign are ideal parallel-plate
references. All computed DP values are Gaussian branch proxies. The maintained
report preserves the full gate ledger and the meaning of each role.

### 5.8 Gated computations Stage 1

Campaign `casimir-dp-gated-computations-stage1-v1` advances all five open
calculation lanes without promoting any physical claim.

#### Equilibrium Lifshitz calculation

The new solver directly evaluates the equilibrium planar Lifshitz free energy
and pressure from Matsubara frequencies and TE/TM reflection coefficients:

<!-- helix-doc-equation-action/v1 id=cdp-stage1-lifshitz-free-energy -->
\[
\frac{\mathcal F(a,T)}{A}=\frac{k_B T}{2\pi}
\sum_{n=0}^{\infty}{}'\int_0^{\infty}k_\perp\,dk_\perp
\sum_{p\in\{TE,TM\}}\ln\!\left(1-r_p^{(1)}r_p^{(2)}e^{-2q_na}\right).
\]

At `300 K` and `100 nm`, the ideal-conductor validation row converges in 134
Matsubara terms to `-13.001258 Pa`, a ratio of `1.00000005` to the ideal
zero-temperature reference. A gold-like Drude sphere/plate PFA reference gives
`-5.631390 Pa` for the underlying plane-plane pressure, or `0.433142` of the
ideal reference. This second row remains literature-parameterized and PFA-only.
It does not close the measured-material or finite-geometry gates.

The actual gated-2D, superconducting-transition, and photoexcited-semiconductor
candidate boundaries remain `not_ready`; they require surface-conductivity or
transition-specific reflection operators and time-resolved material receipts.

#### Sidecars and DP branch convergence

The switching and decoherence schemas now require every measured datum to carry
a raw-artifact SHA-256. The current levitated sidecars intentionally retain
`design_assumption` status. Their combined rate is `2.15 +/- 0.48 s^-1` under a
diagonal covariance assumption, giving visibility `0.806541` over `0.1 s`.

Replacing the earlier Gaussian branch with a homogeneous rigid sphere gives the
following exact-grid diagnostic:

| Grid | `Delta E_G` (J) | `Gamma_DP` (`s^-1`) | Change from prior |
|---:|---:|---:|---:|
| `12^3` | `2.2291e-40` | `2.1137e-6` | n/a |
| `14^3` | `1.7473e-40` | `1.6568e-6` | `0.2758` |
| `16^3` | `1.2511e-40` | `1.1864e-6` | `0.3966` |

The corrected centered grids pass mass conservation, branch symmetry, and
boundary containment. The final change does not pass the registered coarse
`25%` spatial-convergence gate, so numerical convergence is now `not_ready`.
Density provenance also remains `not_ready`: the sphere is a design model, not
a measured internal mass-density map.

#### Power and identifiability

Under an independent-binomial fringe approximation, two-sided `alpha=0.05`,
`90%` power, and variance inflation 2, detecting only the rigid-sphere DP rate
against the assumed `2.15 s^-1` background requires approximately
`1.60e15` shots per setting (`3.21e15` total). This makes the rate-only protocol
inaccessible under the present assumptions.

More importantly, rate-only visibility cannot identify collapse. The dynamics
signature gate remains blocked until a source-backed collapse model predicts a
secondary phase, heating, or cross-correlation observable that is linearly
independent of the switching/decoherence signature under measured uncertainty.
Phase and cross-correlation observables are therefore the next design priority.

The tensor-to-metric-to-coherence manifold slot remains blocked. The new
registration contract names the missing renormalized stress prescription,
stress-noise kernel, causal metric response, gauge contract, coherence dynamics,
consistency/recovery proofs, frozen parameters, and falsifiers; it supplies no
surrogate rate for any of them.

### 5.9 Data-readiness and blinded discriminator gate

Campaign `casimir-dp-data-readiness-stage1-v1` now makes the next experimental
inputs runnable without relabelling fixtures or external datasets as evidence
from this apparatus.

#### Optical response on the imaginary axis

The material pipeline accepts a real-axis loss table with a raw-artifact
SHA-256, calibration references, uncertainties, a frequency-coverage contract,
and registered low- and high-frequency tails. It evaluates

<!-- helix-doc-equation-action/v1 id=cdp-data-readiness-kramers-kronig -->
\[
\epsilon(i\xi)=1+\frac{2}{\pi}\int_0^\infty
\frac{\omega\epsilon''(\omega)}{\omega^2+\xi^2}\,d\omega.
\]

A hash-authenticated synthetic single-Lorentz fixture agrees with its analytic
imaginary-axis response to a maximum relative error below `1e-6` in the frozen
campaign. This is a numerical validation only. The measured-material gate
remains `not_ready` until an apparatus-specific loss table, calibration chain,
uncertainty/covariance model, coverage justification, and authentic raw hash are
provided. The converted synthetic fixture is deliberately emitted as a design
assumption, never as measured material.

#### Acquisition sidecars and covariance

Switching and decoherence sidecars now have a raw JSON ingestion path that
checks their SHA-256, calibration references, observable identities, covariance
dimensions, symmetry, and positive-semidefinite status. The supplied sidecars
pass those structural checks as `synthetic_fixture` artifacts. Their measured
evidence gates remain `not_ready`.

The blinded analysis freezes coherence decay as the primary observable and
phase, coupled heat, force mismatch, and switch cross-correlation as secondary
channels. Matched heating, a detuned boundary, an identical boundary, label
permutation, and switch-disabled runs are registered negative controls.
Unblinding is disallowed until hashes, calibrations, covariance, exclusions,
and analysis code are frozen.

For a correlation alternative, the diagnostic power approximation is

<!-- helix-doc-equation-action/v1 id=cdp-data-readiness-correlation-power -->
\[
N_{pair}=\left\lceil 3+
\left(\frac{z_{1-\alpha/(2m)}+z_{power}}
{\operatorname{atanh}(\rho_1)-\operatorname{atanh}(\rho_0)}\right)^2
\right\rceil.
\]

With four registered secondary tests, two-sided family alpha `0.05`, and `90%`
power, the frozen design requires `1,422` paired windows for correlation
`rho=0.10`, or `351` for `rho=0.20`. These counts size a switching-contamination
or dynamics-discriminator channel. They do not identify objective collapse.

#### Source-data access ledger

The access manifest registers, without importing them as this study's
measurements:

- the open Zenodo data/code package for the 2026 sodium-cluster interferometer,
  DOI `10.5281/zenodo.17502163`, including repository checksum metadata;
- the ETH source-data landing record for cryogenic nanoparticle control, DOI
  `10.3929/ethz-b-000480147`;
- the figure source-data spreadsheets for the Gran Sasso DP constraint study;
- the supplementary-information route for the 2026 superconducting nonlinear
  force measurement, whose raw machine-readable measurement package has not
  yet been authenticated for this campaign.

The collapse-identifiability gate remains `blocked`: no source-backed DP or
Penrose secondary-observable signature is registered. The manifold-response
gate likewise remains `blocked` pending a renormalized stress/noise-kernel,
causal metric-response, gauge, and metric-to-coherence dynamics contract.

### 5.10 Proposal closure and architecture correction

The proposal-closure campaign freezes
`transverse-branch-sample-hold-2d-boundary` as the single commissioning
architecture. This replaces the earlier reliance on symmetric cancellation of
large normal forces.

The particle is a nominal 75 nm-radius silica sphere at a 5 micrometre surface
distance, commissioned only across the registered 10-to-4 micrometre ladder.
Its 20 nm superposition separation is transverse to the surface normal. The
boundary state is randomized between shots, allowed to settle for at least 10
seconds, and held static during each 0.1 second coherent evolution. A separate
cofabricated nanomechanical calibrator must establish a five-sigma
gate-dependent force contrast before the coherence phases may start.

The literature-anchored retarded silica/silicon reference gives

\[
C_4=3.2062\times10^{-49}\ \mathrm{J\,m^4},\quad
U_{CP}=-5.1300\times10^{-28}\ \mathrm J,\quad
F_{CP}=-4.1040\times10^{-22}\ \mathrm N
\]

at the nominal distance. These values are reference scales, not the proposed
2D boundary-state contrast. Apparatus-specific optical response and
finite-geometry contrast remain `not_ready`.

The phase-stability contract exposes the central integration risk:

<!-- helix-doc-equation-action/v1 id=cdp-proposal-phase-force-bound -->
\[
\delta F_{max}=\frac{\hbar\,\delta\phi_{max}}{\Delta x\,t}
=5.2729\times10^{-27}\ \mathrm N.
\]

For one elementary charge this is equivalent to only
`3.2911e-8 V/m`. Zero measured net charge, field reversal, shielding,
surface-patch mapping, state-expansion alignment, and direct phase-nuisance
measurement are therefore hard commissioning gates.

The machine-readable proposal registers first-class signal,
finite-geometry/material, calibration, synchronization, blinding, covariance,
systematics-transfer, commissioning, and statistical-decision contracts. It
also registers twelve systematics families, six dependency-ordered
commissioning stages, at least 1,600 paired windows for the main run, and five
exhaustive outcome classes. Cross-field invariants make inconsistent clock,
window, blinding, alpha, power, or sample-count settings fail closed. Proposal
completeness is `pass`; commissioning entry is `conditional_pass`. Hardware
completion, measured evidence, finite-geometry contrast, collapse
identification, and manifold dynamics remain open for the exact artifacts that
can close them.

### 5.11 OR/phase Stage-2 plausibility runtime

Campaign `casimir-dp-or-phase-stage2-v1` turns the revised hypothesis into
three categorical lanes rather than a numerical plausibility score:

No numerical plausibility score is produced; authority and evidence are
categorical and fail closed.

| Lane | Authority | Runnable output | Current evidence state |
|---|---|---|---|
| QED/open-system baseline | established reference plus apparatus model | branch-action phase, four-port quadratures, visibility, force/phase and ambient-gravity controls | computable; measured receipts `not_ready` |
| OR/DP branch instability | sourced conjecture plus weak-field diagnostic | `Delta E_G`, `tau`, pairwise/potential identity, proposal-specific resolution sweep, branch sampling, fixed-branch boundary null | algebraic audit `pass`; proposal convergence, branch provenance, bounds, and Stage-1 authority transfer `not_ready` |
| Boundary-conditioned spacetime bridge | unregistered extension | required inputs, falsifiers, and claim ceiling only | `blocked`; no rate computed |

The audit first corrected two DP bookkeeping defects: the asymmetric
cross-energy component now includes both branch orderings, and the analytic
point-pair helper now obeys the registered one-half double-integral convention.
It also corrects the Stage-1 grid builders to treat `origin_m` as the grid
center rather than the minimum corner. With the corrected centered grids,
mass conservation, branch symmetry, and boundary containment pass, but the
`12/14/16` rigid-sphere sequence no longer meets the `0.25` spatial-convergence
tolerance. The corrected Stage-1 gate is therefore `not_ready`, replacing the
earlier false pass.

For the frozen proposal sphere, the Stage-2 `16^3` diagnostic gives
`Delta E_G=8.04731e-40 J`, `tau=1.31046e5 s`, and a pairwise-to-softened-
potential relative error of `6.08e-16`. The independently accumulated
self/cross component identity agrees to `1.74e-12`, inside its registered
`1e-10` tolerance. These are software and algebraic checks, not evidence of
physical reduction.

Stage 2 now runs its own proposal-sphere `12/14/16` resolution sweep. Its final
two relative energy changes are about `0.665` and `0.446`, so it does not meet
the registered `0.10` convergence tolerance. The earlier Stage-1 convergence,
provenance, and bound gates are explicitly non-transferable: Stage 1 used a
`1e-18 kg`, `50 nm` sphere, whereas the frozen proposal uses a
`3.88772e-18 kg`, `75 nm` sphere. Their separation and Plummer length match,
but that does not make the mass/radius inputs identical.

Replaying two boundary labels with identical `Delta rho`, grid, branch
geometry, and Plummer length gives exactly
`Delta_b Gamma_DP=0`. The `+/-1 nm` perturbation audit now freezes one
`16^3` grid instead of changing voxel size with separation. The sampled masses
remain fixed, but a `1 nm` separation change is below the `20 nm` voxel scale,
so the raw rate remains unchanged and the physical-sensitivity gate is
`not_ready`. No separation derivative is inferred from an unresolved grid.
Switching-correlated motion, strain, heating, or polarization must still
update the branch receipt before any comparison with the fixed-branch null.

The ordinary phase runtime predicts the frozen first-order transverse
common-mode null, reconstructs visibility `0.806541` from four quadratures, and
keeps its measured-evidence gate `not_ready`; its uncertainty model is also
`not_registered`, so a data hash alone cannot promote it. The ambient-gravity calculation
produces the `7.23e8 rad` vertical phase and the `1.38e-10 rad` boundary-
correlated tilt target above. This makes gravitational phase an explicit
control without identifying it with collapse.

The Stage-2 configuration hash is
`b517e8fbf002303258a5269e7f37c6b16d4bc3c45c609072bdb2a9e5184e596d`;
the maintained run receipt hash is
`64f0e1c95307829540d3c01ad7cb7e10b15d510cb31cf8e73f88a8990d2c25ab`.
Software/algebraic diagnostics pass. Measured QED phase/coherence remains
`not_ready`; collapse identification and manifold dynamics remain `blocked`;
the publication claim ceiling remains `diagnostic_protocol_only`.

### 5.12 Stage-3 evidence map: what each result would and would not show

Stage 3 changes the computational question from “does the diagnostic pipeline
run?” to “which frozen model, if any, survives ordinary-physics closure and a
blinded held-out comparison?” It consumes the exact Stage-2 config, report, and
receipt hashes without rewriting Stage 2. The authoritative timestamped
Stage-2 run is `casimir-dp-or-phase-stage2-v1-20260723T220236Z`; the mutable
`artifacts/.../current` alias is not evidence authority.

The comparison begins with an additive ordinary-physics baseline:

<!-- helix-doc-equation-action/v1 id=cdp-stage3-composite-null -->
\[
M_0=M_{\rm QED\ phase}+M_{\rm technical\ dephasing}
  +M_{\rm environmental\ decoherence}+M_{\rm ordinary\ GR}.
\]

Named alternatives are nested additions to this baseline rather than mutually
exclusive replacements. `M_0+M_{\rm DP,<variant>}` is admitted only for a
named master equation and one frozen physical-parameter manifest.
`M_0+M_{\rm bridge,<id>}` is admitted only after the fail-closed
manifold-kernel registry passes. Penrose's lifetime prescription remains a
diagnostic envelope unless a generative stochastic dynamics and observation
likelihood are separately registered.

The seven evidence lanes are:

| Lane | Primary Stage-3 question | Maximum interpretation |
|---|---|---|
| QED Hamiltonian | Does the boundary produce the predicted path-sign-reversing phase? | controlled QED phase |
| Technical dephasing | Does independent conditioning or echo recover coherence? | conditionable/reversible dephasing |
| QED/environmental decoherence | Do the same material, Green, and PSD receipts explain phase, noise, heating, and loss? | ordinary open-system closure |
| Penrose OR heuristic | Is a boundary-independent timescale compatible with the registered `E_G` envelope? | compatibility or exclusion of that lifetime prescription |
| Named dynamical DP | Do coherence and an applicable companion observable follow one frozen model and parameter set? | constraint, rejection, or replicated support for that named implementation only |
| Ordinary GR | What mass, weight, metric, and unitary phase bound follows from the complete apparatus state-energy difference? | scalar or tensor diagnostic according to source completeness |
| Registered bridge | Does one preregistered causal tensor/noise kernel predict all held-out boundary, material, temperature, echo, mass, and companion axes? | evidence for that specific extension only |

#### Complex coherence and fixed-branch equivalence

Visibility alone is not the Stage-3 primary estimator. Each blinded boundary
cell retains the complex coherence

<!-- helix-doc-equation-action/v1 id=cdp-stage3-complex-coherence -->
\[
C_b(t)=V_b(t)e^{i\phi_b(t)}.
\]

Four analysis quadratures, block covariance, independent phase conditioning,
path swap, echo, and a sufficiently populated hold-time grid distinguish
coherent phase, conditionable dephasing, unrecovered loss, and
non-identifiability. Echo failure or a non-exponential line shape is not by
itself an objective-collapse label.

The fixed-\(\delta\rho\) comparison is also an experimental gate, not a verbal
assumption. Branch wavepacket and trajectory receipts must demonstrate that
the prepared material mass-density difference agrees across boundary states
within the frozen tolerance. Boundary-induced force, trap, strain,
polarization, or trajectory changes are ordinary confounds and invalidate the
standard OR/DP boundary null until modeled.

#### Mean QED response, noise, and ordinary gravity

The QED lane uses one material/geometry/Green receipt for both mean and
fluctuation observables. Mean Lifshitz pressure is never converted into a
noise spectrum. A force or energy-noise PSD requires its sidedness, material
loss, temperature, geometry, fluctuation model, and filter function.

The ordinary-gravity lane starts from a signed complete-apparatus ledger:

<!-- helix-doc-equation-action/v1 id=cdp-stage3-complete-apparatus-mass -->
\[
\Delta m_{\rm app}=\frac{\Delta E_{\rm app}}{c^2},
\qquad
\Delta F_{\rm weight}=g\frac{\Delta E_{\rm app}}{c^2}.
\]

Plate pressure and the large internal equal-and-opposite plate forces are not
gravitational weight. A tensor or ordinary gravitational-phase calculation
remains blocked until the complete \(\Delta T_{\mu\nu}\), surface terms,
frame/gauge contract, covariance, and conservation residual pass. The NHM2
car-scale amplification proxy is not imported.

#### Manifold-kernel preflight

The bridge registry is evaluated before model signatures, priors, confirmatory
cells, and held-out comparison are frozen. Its causal skeleton is

<!-- helix-doc-equation-action/v1 id=cdp-stage3-manifold-kernel-preflight -->
\[
\delta h_{\mu\nu}(x)=\int d^4x'\,
G^{\rm ret}_{\mu\nu\alpha\beta}(x,x')
\,\delta\langle T^{\alpha\beta}(x')\rangle ,
\]

with the full kernel arguments and coordinate dependence supplied by any real
candidate. A stochastic or nonunitary rate additionally requires a registered
stress-noise covariance and physically consistent metric-to-coherence
dynamics. A scalar negative energy density, Casimir pressure, or frequency
coincidence cannot fill those tensor and dynamics fields. Registry completion
means schema/consistency completeness, not empirical validation. A blocked
registry is therefore a valid, informative Stage-3 runtime result and emits no
bridge phase or rate.

In the maintained Stage-3 run, the registry schema reaches `registered`, but
`registration_is_empirical_validation=false`. No frozen bridge predictor is
admitted to the held-out comparison. Thus the run validates the registry
contract and its ordering only: it does not numerically compare, validate, or
emit a phase or collapse rate for a manifold bridge.

#### Outcome-to-claim rules

| Observed outcome | Establishes | Disfavors | Does not establish |
|---|---|---|---|
| Integrity, calibration, randomization, or blind failure | invalid/exploratory campaign | no physics model | a physical null or anomaly |
| Reversible path-sign phase and conditioning/echo recovery | controlled Hamiltonian phase or dephasing | an irreducible-loss interpretation of the recovered component | collapse or manifold dynamics |
| Loss tracked by calibrated ordinary channels | open-system closure within uncertainty | powered intrinsic excesses in the covered region | universal exclusion of OR/DP |
| Powered null after ordinary closure | upper bound | only the covered preregistered region | that collapse never occurs |
| Boundary-independent `E_G` scaling without a required DP companion | compatibility with the Penrose lifetime envelope | the tested DP variant if its companion was powered and absent | Penrose OR as a proven mechanism |
| Coherence plus powered companions from one named DP manifest | replicated support for that implementation | registered alternatives failing the joint prediction | every DP variant or a spacetime ontology |
| Boundary-dependent residual at fixed `delta_rho` without a registered bridge | replicated unexplained anomaly | unextended OR/DP as its explanation | collapse, gravity, quantum foam, or manifolds |
| Held-out response matching one registered bridge and independent observable | evidence for that specific extension | registered alternatives that fail | generic manifold dynamics |
| Frequency coincidence | no physical correspondence by itself | nothing | resonance, transfer, or collapse |

The neutral state is written
`not_disfavored_within_powered_region`, not “confirmed.” Any null excludes only
the parameter region for which the frozen campaign demonstrated sensitivity.
A DP support tier additionally requires an applicable, independently powered
companion observable and independent replication.

#### Current Stage-3 standing and NHM2 transfer boundary

The Stage-3 implementation uses six versioned runtimes plus one orchestrator:
complex coherence; measurement-constrained QED Green/noise; named DP
companions; complete-apparatus gravity bounds; blinded joint comparison; and
the manifold-kernel registry. Synthetic fixtures may close software,
dimensional, limiting-case, recovery, and fail-closed tests only. They may not
change `measured evidence: not_ready`, `collapse identification: blocked`, or
`manifold dynamics: blocked`.

The immutable maintained execution is
`casimir-dp-evidence-map-stage3-v1-20260725T134544Z`. Its config SHA-256 is
`231cb26e9c9bb523e2dda40a6178d8a484ec099f1868a74b995d8153337d29c2`;
its receipt SHA-256 is
`5bcd2400bfeaa57a85c4b726224ac25dc8ab4c56bd59dad1b6e54f7f11ff0346`;
and its JSON and Markdown report SHA-256 values are
`feb799bcf93f1497673d58eac1a98a773ac1e1b0767082104af7b7d6c8e3508b`
and
`41aae6d542a19b6564f88ae7c8e7f2531abf90b08a7d02c11b043e5c691cc23a`.
All required upstream and fixture hashes pass. The optional pre-freeze
proposal-copy hash is `not_ready` because the live proposal had already moved
beyond that baseline; it is not used as evidence authority.

The synthetic held-out fixture exercises a `disfavored` state for
`M0_ordinary_physics` and
`not_disfavored_within_powered_region` for
`M_dp_regularized_synthetic_v1`. Those labels validate the comparison
machinery only. They do not favor DP over ordinary physics in nature, close
ordinary decoherence, or supply measured evidence.

What transfers from NHM2 is workflow discipline: immutable provenance,
scientific sidecars, staged math, full-apparatus bookkeeping, ordered runtimes,
focused tests, and a fresh certificate policy. The NHM2 amplified car proxy,
scalar pressure-as-weight inference, geometry receipts, stress tensors, and
its prior certificate do not transfer as evidence for this apparatus. Stage 3
received its own adapter execution under trace
`casimir-dp-evidence-map-stage3-v1-20260725T134544Z`, run `2314`. Its
certificate integrity is `true` and its status is `GREEN`. The content hash
matches Stage 2 because the unchanged passing `repo-convergence` certificate
payload is content-addressed; the new trace, run id, timestamp, and exported
training trace—not the repeated hash alone—establish the Stage-3 execution.

### 5.13 Stage-4 polarization, thermal, and congruence campaign

Stage 4 asks whether the proposed leverage point survives a stricter
ordinary-physics null. It does not add polarization to DP by assumption.
Instead, it first gives standard electromagnetism every polarization and
thermal response that the apparatus can generate, then asks whether a
separately prepared material superposition retains a residual after those
controls close.

#### Transverse field dimensionality and circular polarization

For a fixed propagation direction, the quantized electromagnetic field has
two transverse polarization degrees of freedom. TE/TM and RCP/LCP are unitary
bases of that same two-dimensional space:

<!-- helix-doc-equation-action/v1 id=cdp-stage4-transverse-polarization-completeness -->
\[
\mathbf e_R=\frac{\mathbf e_{\rm TE}-i\mathbf e_{\rm TM}}{\sqrt2},
\qquad
\mathbf e_L=\frac{\mathbf e_{\rm TE}+i\mathbf e_{\rm TM}}{\sqrt2},
\qquad
\sum_{\lambda=R,L}e_{\lambda i}e_{\lambda j}^{*}
=\delta_{ij}-\hat k_i\hat k_j .
\]

The handedness convention is defined relative to \(+\mathbf k\), not merely
to the laboratory observer. An active mirror reverses helicity under the
frozen convention. Jones coherency matrices must be Hermitian and
positive-semidefinite; the associated Stokes vector must remain inside the
physical polarization cone. A basis round trip must leave every predicted
phase, force, heating, torque, trap shift, noise term, and coherence term
invariant.

The Stage-4 polarization runtime propagates the polarization state through a
material reflection matrix, including polarization mixing when the registered
response is nonreciprocal. It evaluates matched RCP/LCP cells and the
mirror-odd double contrast

<!-- helix-doc-equation-action/v1 id=cdp-stage4-polarization-double-contrast -->
\[
\Delta_{h,m}X=
\frac12\left[
  (X_{+,R}-X_{+,L})-(X_{-,R}-X_{-,L})
\right].
\]

This is an ordinary-QED control observable. A nonzero value may be expected
from a chiral or nonreciprocal material response. It does not identify
collapse, gravity, or a new spacetime degree of freedom. Conversely, the
unchanged named DP model predicts no helicity or mirror-odd term when
\(\delta\rho\) and the branch trajectories are fixed. A persistent residual
would first be an unexplained optical or boundary-correlated anomaly unless a
separately registered numerical bridge predicted its sign and scaling.

The current runtime is deliberately reduced-order: its synthetic transfer
coefficients exercise state physicality, basis invariance, mirror reversal,
matched controls, sensitivity, and limiting cases. They are not a
finite-geometry apparatus Green-tensor receipt.

#### Planck/FDT and Stefan-Boltzmann closure

The thermal lane keeps the canonical internal spectral variable
\(\omega=2\pi\nu\) and converts spectral densities with their Jacobian. For
one bosonic mode,

\[
\bar n(\omega,T)=\frac{1}{e^{\hbar\omega/(k_BT)}-1},
\qquad
\langle E_{\rm mode}\rangle
=\hbar\omega\left(\bar n+\frac12\right).
\]

The zero-point half quantum and the thermal occupation term are tracked
separately. The former is not added to a net heat-transfer power. Far-field
greybody transfer is used only when its separation criterion passes; a
near-field cell instead requires an exclusive material Green/FDT receipt.
Combining both outputs, or recounting the parent-QED thermal channel, fails
closed.

Integrating the Planck spectrum must recover

<!-- helix-doc-equation-action/v1 id=cdp-stage4-planck-stefan-boltzmann-closure -->
\[
\sigma=\frac{\pi^2k_B^4}{60\hbar^3c^2},
\qquad
P_{\rm net}=\epsilon_{\rm eff}AF\sigma
\left(T_s^4-T_e^4\right).
\]

The same runtime checks detailed balance, nonnegative entropy production,
thermal recoil, energy-current noise, heating, decoherence, and their shared
covariance. As a normalization benchmark, \(L_\odot\) and \(R_\odot\) recover
the flux-equivalent \(T_{\rm eff}\). This does not mean that Planck's constant
alone predicts the Sun's temperature: luminosity and radius are empirical
inputs, and a stellar-structure model remains a separate layer.

#### Cross-scale calibration ladder and conditional evidence levels

The implemented Stage-4.2A campaign extends this normalization into a typed
calibration ladder:

\[
\begin{aligned}
m_e
&\xrightarrow{\rm exact\ conversion} E_e=m_ec^2
\xrightarrow{\rm QED\ identities}
\left(\nu_C,\;cR_\infty\right),\\
B_\nu(\nu,T)
&\xrightarrow{\ \pi\int_0^\infty d\nu\ }
F_{\rm bol}=\sigma T^4
\xrightarrow[\rm supplied\ L_\odot,R_\odot]{\rm bolometric}
T_{\rm eff,bol},\\
\Delta\rho(\mathbf x),r_0
&\xrightarrow{\rm separate\ DP\ model}
E_G[\Delta\rho;r_0]
\xrightarrow{\ /\hbar\ }\Gamma_{\rm DP}.
\end{aligned}
\]

The first, second, and third lines are separate branches. The arrows do not
continue from \(R_\infty\) into a blackbody temperature or from a solar
temperature into \(E_G\). Their shared constants and dimensions provide
conversion and regression checks only.

The solar spectral check must also retain two different temperatures. The
implemented Stage-4.2A runtime selects a predeclared maximum from a
content-addressed TSIS continuum snapshot and reports the coarse Wien
diagnostic \(T_{\rm color}^{\rm Wien}=b/\lambda_{\max}\). It does not perform a
full spectral fit, and its measured-fit-significance gate remains `not_ready`.
A future TSIS spectral fit may define \(T_{\rm color}^{\rm TSIS}\) only after the
data-product version, observation interval, wavelength window, quality flags,
spectral response, line/mask policy, nuisance amplitude, and covariance are
frozen. The bolometric quantity is instead

\[
T_{\rm eff,bol}
=
\left(\frac{L_\odot}{4\pi R_\odot^2\sigma}\right)^{1/4}.
\]

The IAU nominal \(T_{\rm eff,\odot}^{\rm N}=5772\ {\rm K}\) is an exact
conversion constant chosen near the solar estimate, not an independent
measurement of the current Sun. Neither temperature is predicted from
\(m_e\), \(h\), or \(\alpha_{\rm fs}\) alone, and neither is a DP input.

The empirical evidence order is stricter:

1. **Level 1:** a replicated held-out coherence residual survives the full
   ordinary-decoherence and apparatus closure, discriminates every registered
   remaining unitary/environmental alternative, and matches a frozen
   nonunitary dynamical signature; this would support an objective-collapse
   candidate, not a gravitational cause.
2. **Level 2:** the measured residual follows the preregistered
   \(E_G[\Delta\rho;r_0]/\hbar\) dependence across independently varied mass,
   branch geometry or separation, hold time, and permitted regularization;
   only this level could support the tested DP rate law.
3. **Level 3:** with material branches and regularization fixed, a replicated
   boundary-conditioned remainder survives all controls and matches a
   preregistered bridge kernel; this would support a laboratory extension
   beyond standard DP, not a cosmological mechanism by itself.

The maximum calibration-ladder claim is
`cross_scale_constant_unit_and_normalization_consistency_only`. Measured
evidence remains `not_ready`, while collapse identification and manifold
dynamics remain `blocked`.

Any cosmological or Planck-scale interpretation is a conditional future
extension. It must inherit the laboratory-fixed collapse operator, rate,
smearing scale, noise, dissipation/heating law, and uncertainty without
cosmology-only retuning; construct a causal covariant lift with conserved total
stress; and then confront frozen CMB and expansion likelihoods. Planck units
may rewrite a compact-geometry estimate as

\[
\Gamma_{\rm DP}
\sim
\eta\frac{c}{L}\left(\frac{m}{m_P}\right)^2,
\qquad
m_P=\sqrt{\frac{\hbar c}{G}},
\]

but this is only a reparameterization of the assumed
\(E_G\sim\eta Gm^2/L\). It is not evidence for Planck-length access, discrete
spacetime, Planck-quantized energy, primordial collapse, dark energy, or a
Casimir-to-cosmology transfer. The maximum present cosmology claim is
`counterfactual_cosmology_test_architecture_only`.

That counterfactual is divided into five fail-closed gates:

| Gate | Required evidence or calculation | Current state | Rejection condition |
|---|---|---|---|
| C1 laboratory kernel | replicated Level-2 evidence for a frozen \(\Gamma_{\rm col}(m,R,\Delta x,r_0,T,\ldots)\) | `not_ready` | no held-out residual, ordinary alternatives win, or frozen \(E_G/\hbar\) scaling fails |
| C2 boundary sensitivity | fixed-branch \(\Delta_b\Gamma_{\rm col}\) and a preregistered boundary kernel | `blocked` | ordinary QED/apparatus closure explains the contrast, replication fails, or the frozen kernel misses |
| C3 covariant lift | causal collapse operator/noise kernel, regularization, foliation policy, and conserved total stress | `blocked` | causality, declared ultraviolet/Hadamard domain, or \(\nabla^\mu T_{\mu\nu}^{\rm total}=0\) fails |
| C4 inflationary prediction | laboratory-fixed \(\mathcal P_\zeta(k)\), \(B_\zeta\), tensor/isocurvature outputs, and CMB likelihood | `blocked` | the no-retuning prediction violates registered spectrum, Gaussianity, isotropy, or tensor/isocurvature limits |
| C5 expansion backreaction | laboratory-fixed \(Q_{\rm col}(t)\), \(\varepsilon_X(t)\), \(w_X(t)\), and \(H(z)\) | `not_evaluated` | heating, nucleosynthesis, CMB-spectrum, growth, lensing, supernova, or BAO constraints fail |

The corresponding nulls are
\(\Delta_b\Gamma_{\rm DP}=0\) at fixed material branches under standard DP,
\(C_{\rm col}(k)=1\) for no primordial-spectrum correction, and
\(Q_{\rm col}=0\) for no background backreaction. Stage 4.2A creates no
cosmology runtime or live badge; these gates only make the future extension
falsifiable.

#### Congruence is not a coupling

Using the same SI dimensions and canonical variables across runtimes prevents
conversion mistakes, but semantic identity remains stricter than dimensional
identity:

<!-- helix-doc-equation-action/v1 id=cdp-stage4-frequency-semantic-nonbridge -->
\[
\omega_C=\frac{mc^2}{\hbar},\qquad
\Gamma_{\rm DP}=\frac{E_G}{\hbar},\qquad
\omega_{\rm cav}
\quad\Longrightarrow\quad
[\omega_C]=[\Gamma_{\rm DP}]=[\omega_{\rm cav}]=T^{-1},
\]
\[
T^{-1}=T^{-1}
\quad\not\Longrightarrow\quad
K_{\rm transfer}\ne 0 .
\]

The congruence runtime therefore returns
`same_dimension_not_connected` unless a sourced, preregistered transfer
kernel maps one semantic quantity into another and supplies a measurable
output, uncertainty, recovery limit, and falsifier. It separately validates
the QED chain
\(G_{ij}+\alpha_{ij}\rightarrow S^{FF}_{ij}\rightarrow
S_{\Delta U}\rightarrow\chi\) and the proposed tensor chain
\(T_{\mu\nu}+N_{\mu\nu\rho\sigma}\rightarrow G^{\rm ret}\rightarrow
h_{\mu\nu}\rightarrow\) phase/rate. The latter currently reaches
`registered_congruence_only`; its numerical bridge output is `null`.

This distinction also answers the interference question. Constructive and
destructive optical interference test the relative phase and polarization
response of the electromagnetic preparation/readout. Classical gravitational
waves demonstrate propagating metric dynamics, but neither fact supplies a
quantum-gravity polarization bridge or an OR transfer kernel.

#### Expanded null and frozen comparison policy

The Stage-4 baseline is

<!-- helix-doc-equation-action/v1 id=cdp-stage4-expanded-ordinary-null -->
\[
M'_0=M_0+M_{\rm polarization\ QED}+M_{\rm thermal/FDT}.
\]

`M_dp_regularized_synthetic_v1` is reused without mutation with parameter
manifest SHA-256
`4868b598b05e76f43f9814858f81c27cf8d8a783d360deb56e26793aad7047c6`.
`M_bridge_tensor_noise_v1` remains excluded from numerical comparison because
no frozen numerical kernel exists. A schema-level registry cannot be promoted
into a predictor after seeing a residual.

| Axis | Expanded ordinary null | Unchanged named DP | Registered bridge |
|---|---|---|---|
| helicity | calibrated material/scattering response may differ for RCP/LCP | zero contrast at fixed `delta_rho` | frozen sign and magnitude only |
| active mirror | registered pseudoscalar optical terms change parity | mirror-even at fixed `delta_rho` | preregistered mirror parity plus companion |
| material / distance | strong reflection-matrix, Green, geometry, and loss scaling | no standard boundary term | causal kernel scaling |
| temperature | Planck/FDT occupation, emissivity, recoil, heating, and noise | no standard thermal boundary term | registered thermal/noise law without double counting |
| hold time / echo | unitary phase and filter-function response; conditionable terms may refocus | frozen master-equation prediction | frozen line shape, echo response, and companion |

The immutable synthetic run
`casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z` uses config
SHA-256
`ade06cd7b95e27fe414614ad36512d5764d439c4fa6623f8499ad218ba07c3d7`.
Its receipt SHA-256 is
`185a09ceb61b4f158afe16022783c8b184c1035f456cb341b5c90920b69b774a`;
the JSON and Markdown report SHA-256 values are
`2c56cd9b61928ee750cf0714435674cc923b4c81f02e325b8ee9e9e5a9816d0b`
and
`1221cf1e6b6c247c3253240c44ed78446318b2cdb2966610a63d08c7ec4f00a8`.
The earlier `20260725T151803Z` local run is superseded because its source
registry attached an incorrect DOI to the macroscopic-QED review. It is not
Stage-4 evidence authority.
The later `20260725T153607Z` run is also superseded: a fail-closed audit found
that its aggregate software gate did not explicitly bind every internal
polarization and thermal gate, its declared Git tracking state was inaccurate,
and its runtime sources were not content-addressed. The authoritative run above
repairs those provenance and promotion boundaries, preserves millisecond run
identity, and creates immutable outputs exclusively.
The `20260725T161353353Z` run is superseded as well: the final adversarial
review added an explicit hash for the thermal constants dependency, finite and
PSD checks for the optional near-field FDT lane, production-shape certificate
validation for the single-record trace, exact upstream/source role tuples, and
independent recomputation of every nested thermal and congruence gate.
The `20260725T163307292Z` run is superseded because it encoded a sealed
custodian state and sentinel mapping hash without an actual custody receipt.
The authority above replaces that representation with a fail-closed
`synthetic_contract_only` state: reserved labels remain available for contract
tests, but no custodian receipt, mapping, measured comparison, or unblinding
exists or is authorized. This corrects provenance truthfulness; it does not
change the earlier run's already closed measured-evidence gates.

The fixture predicts a mirror-odd phase double contrast of
\(0.1509886914\ {\rm rad}\), zero double-contrast coherence-decay rate,
zero double-contrast force and heating, and basis-invariance error
\(2.2774\times10^{-15}\). The Planck integration recovers
\(\sigma\) with relative error \(2.3298\times10^{-11}\), and the nominal
solar inputs recover \(5772.0034\ {\rm K}\). These values validate synthetic
prediction behavior only. They are not apparatus forecasts until the
coefficients and receipts are replaced by measured or source-backed apparatus
inputs. Final gates remain: software/synthetic predictions and the
synthetic-blinding fail-closed contract `pass`; measured evidence and
ordinary-physics closure `not_ready`; registered bridge numeric comparison,
collapse identification, and manifold dynamics `blocked`; physical viability
`not_evaluated`. Passing the synthetic blinding contract means that
nonpromotion is enforced. It does not mean that a physical blind has been
executed.

The fresh adapter trace
`casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z-final`,
isolated run `1`, records verdict `PASS`, null first failure, empty deltas, and
certificate integrity `true`. The certificate SHA-256 is
`38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34`.
The request disables telemetry auto-merge and content-addresses explicit
current inputs: a full production build, 5 files/73 focused tests, Stage-4
runtime-contract and adversarial schema tests, and a coherent top-level
dependency graph. Lint and repository-wide typecheck proxies are not supplied;
the isolated strict Stage-4 TypeScript surface passes, while the full
repository TypeScript command still exposes a large pre-existing backlog
outside this campaign. The validated trace is one JSONL record, contains no
NUL bytes, and has SHA-256
`f40b4bdecb3f9e03f784e66c5b5db50d7e86571f31d0ae7547d110673d45bfd8`.
The certificate attests only the `repo-convergence` constraint pack over those
explicitly supplied software inputs. It does not bind the Stage-4 report or
Vitest bytes and has no scientific scope. The downstream receipt, SHA-256
`721b9f6aeab4b181ccc5ac21b4bc81c984d3b1fb72cdf76e55abedba11e38440`,
independently hash-binds the exact artifacts after a 27-file/301-test combined
replay. Neither lane changes any scientific gate above.

### 5.14 Implemented Stage-4.2B apparatus-coupled coherence residual

Stage 4.2B is the first campaign in this study to carry the proposed object,
boundary, thermometry, sensor, ordinary-decoherence, named-DP, residual,
covariance, identifiability, and acquisition forecasts through one frozen cell
registry. It is an apparatus-coupled **synthetic forecast**, not a measurement
and not a Casimir-to-collapse bridge. Its runtime claim ceiling is
`apparatus_coupled_residual_and_dp_scaling_sensitivity_forecast_only`, while
the publication claim is capped at
`apparatus_power_and_identifiability_forecast_only`; measured ingestion
requires a new versioned campaign and evidence class.

The confirmatory design has three independently metrology-planned silica
objects (`silica_r50`, `silica_r75`, and `silica_r100`), separations of
10, 20, and 40 nm, holds of 0, 25, 50, and 100 ms, and Ramsey, path-swap, and
echo sequences under paired randomized blinded active/reference boundary
states. That produces 216 primary cells. Thirty separately registered
one-axis-at-a-time, sham, and detuned controls identify temperature, pressure,
vibration, charge, distance, polarization, readout-power, matched-waveform, and
matched-heating checks. The campaign also freezes 216 disjoint pilot templates
and 216 independent-replication templates. These are design contracts;
authentic object, branch, calibration, and coherence receipts remain
`not_ready`.

Runtime A transports composition, bulk mass, hierarchy, and the complete
joint-system branch ledger. Uniform-sphere bulk transport is an apparatus
design approximation only. The named DP dynamics in Runtime D instead use the
exact manifest `single_effective_gaussian_particle`; the two descriptions are
not silently substituted for one another.

Runtime B fits internal temperature through the measured detector/material
response rather than identifying observed spectral power with an ideal
blackbody:

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2b-spectral-thermometry-forward-model -->
\[
\begin{aligned}
d_k&=\sum_\ell R_{k\ell}\!\left[
\Omega_\ell C_{{\rm abs},\ell}B_\ell(T_{\rm int})
+I_{{\rm reflected},\ell}+I_{{\rm stray},\ell}\right]+b_k+\eta_k,\\
\widehat T_{\rm int}
&=\arg\min_T
\bigl[\mathbf d-\mathbf m(T)\bigr]^{\mathsf T}
\Sigma_d^{-1}
\bigl[\mathbf d-\mathbf m(T)\bigr].
\end{aligned}
\]

Ideal blackbody and free-space limits are recovery tests only. The apparatus
prediction must retain emissivity/absorption, collection geometry, reflected
and stray radiation, calibration covariance, and the declared near/far-field
routing.

Runtime C separates physical disturbance from sensor self-noise and keeps the
cross terms that would otherwise create a false decoherence budget:

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2b-sensor-self-noise-forward-model -->
\[
\begin{aligned}
\mathbf x_{\rm obs}(\omega)&=H(\omega)\mathbf x_{\rm phys}(\omega)
+\mathbf n(\omega),\\
S_{\rm obs}&=H S_{xx}H^\dagger+S_{nn}
+H S_{xn}+S_{nx}H^\dagger,\\
S_{xx}&=H^{-1}
\bigl(S_{\rm obs}-S_{nn}-H S_{xn}-S_{nx}H^\dagger\bigr)
H^{-\dagger}.
\end{aligned}
\]

All spectral densities use the frozen two-sided convention and must remain
Hermitian and positive semidefinite. An observed sensor PSD is not, by itself,
the physical disturbance PSD.

The ordinary phase/decoherence prediction then consumes that physical spectrum
and the response-corrected thermal result:

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2b-ordinary-coherence-exponent -->
\[
\begin{aligned}
\Delta U_i(\omega)&=K_i(\omega)\mathbf x_{\rm phys}(\omega),\\
S_{\Delta U_i}(\omega)&=K_i S_{xx}K_i^\dagger,\\
\chi_{G,i}(t)&=\frac{1}{2\hbar^2}
\int_{-\infty}^{\infty}\frac{d\omega}{2\pi}
|Y_i(\omega,t)|^2S_{\Delta U_i}(\omega),\\
\chi_{{\rm ord},i}(t)&=\chi_{G,i}(t)
+\sum_j\chi_{{\rm jump},ij}(t).
\end{aligned}
\]

The unitary phase
\(\phi_{{\rm ord},i}=-\hbar^{-1}\int\Delta U_i(t)\,dt+\cdots\) remains a
separate output. Gas collisions and other non-Gaussian jump processes are not
folded into a Gaussian PSD merely for convenience.

Runtime E propagates shared calibration and cross-covariance into the residual:

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2b-residual-covariance -->
\[
\Sigma_r=
\Sigma_{yy}+J\Sigma_{xx}J^{\mathsf T}
-\Sigma_{yx}J^{\mathsf T}-J\Sigma_{xy}.
\]

The pilot-frozen matrix must be positive definite in the scored space.
Regularization is allowed only when its rule and magnitude were frozen from
pilot data; a singular confirmatory covariance cannot be rescued by
post-unblinding jitter.

The preferred held-out observable is raw complex coherence. Log-visibility
residuals are used only inside a coverage-qualified domain:

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2b-joint-complex-residual -->
\[
\begin{aligned}
C_{\rm obs}&=V_{\rm obs}e^{i\phi_{\rm obs}},&
d&=-\ln(V_{\rm obs}/V_0),&
r&=d-\chi_{\rm ord},\\
C_{i,M}&=V_{0,i}
\exp[-\chi_{{\rm ord},i}-s_{i,M}+i\phi_{{\rm ord},i}],&
Q_M&=(\mathbf z-\mathbf z_M)^{\mathsf T}
\Sigma_z^{-1}(\mathbf z-\mathbf z_M).
\end{aligned}
\]

Numerical zero contrast remains valid in raw-complex scoring, but its
log-residual is `null` and its phase is unresolved; the runtime does not insert
a synthetic visibility floor. No confirmatory label, nuisance response,
covariance regularization, DP amplitude, \(r_0\), row order, or exclusion rule
may be learned after the pilot freeze.

Runtime D evaluates only the frozen named regularized DP model:

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2b-frozen-dp-scaling -->
\[
\begin{aligned}
\Delta\rho_{r_0}&=g_{r_0}*(\rho_A-\rho_B),\\
E_G[\Delta\rho;r_0]&=\frac{G}{2}
\iint\frac{\Delta\rho_{r_0}(\mathbf x,t)
\Delta\rho_{r_0}(\mathbf y,t)}
{|\mathbf x-\mathbf y|}\,d^3x\,d^3y,\\
\chi_{\rm DP}(t)&=\int_0^t\frac{E_G(t')}{\hbar}\,dt',
\qquad C_{\rm DP}(t)=e^{-\chi_{\rm DP}(t)},\\
\Gamma_{\rm DP}&=\frac{Gm^2}{\hbar R}
F\!\left(\frac{\Delta x}{R},\frac{r_0}{R},\ldots\right),
\qquad
s_q=\frac{\partial\ln\Gamma_{\rm DP}}{\partial\ln q}.
\end{aligned}
\]

The nominal linked cell has \(m=3.8877\times10^{-18}\ {\rm kg}\),
\(R=75\ {\rm nm}\), \(\Delta x=20\ {\rm nm}\),
\(t=100\ {\rm ms}\), and \(r_0=100\ {\rm nm}\). The multi-axis grid, not that
single nominal point, supplies the mass/separation/time scaling test. Common
units, \(h\), \(\hbar\), \(c\), Compton frequency, blackbody calibration, or
Higgs mass notation do not provide an interaction kernel.

Runtime F whitens the frozen DP and nuisance signatures in the same covariance
space and projects the DP signature away from the nuisance span:

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2b-identifiability-power-gate -->
\[
\begin{aligned}
P_\perp&=I-N(N^{\mathsf T}N)^{-1}N^{\mathsf T},&
\mathcal I_{\rm DP}&=\mathbf s_{\rm DP}^{\mathsf T}
P_\perp\mathbf s_{\rm DP},\\
\pi(n)&=\Phi\!\left(\sqrt{n\mathcal I_{\rm DP}}
-z_{1-\alpha/2}\right),&
n_{\rm req}&=
\left\lceil
\frac{(z_{1-\alpha/2}+z_{\pi_{\min}})^2}
{\mathcal I_{\rm DP}}
\right\rceil .
\end{aligned}
\]

These power expressions have authority only after rank, maximum signature
cosine, Gram conditioning, coverage, and an independently powered applicable
companion pass. In the authoritative baseline they do not: the physical
signature matrix has rank 7, the maximum absolute whitened cosine is
\(0.9999771044199663\) for `signature-intercept` versus
`signature-thermal`, and the normalized Gram condition number is
\(179103.91134865975\). The 30 frozen controls identify axes and levels but do
not contain source-backed numerical response vectors and a block-bound control
covariance. Runtime F therefore returns `signature_not_identifiable`; planned
paired windows are 1,600, while required windows and achieved power are
`not_estimable_until_identifiable`. Powered regions and regions excludable by
a future null are both empty. This result requires apparatus
redesign/calibration and excludes no DP parameter region.

The coupled identity gates pass exactly: Runtime A object/branch values feed D;
B thermometry feeds C; C ordinary predictions and full covariance plus D
\(\chi_{\rm DP}\) feed E; and the quadrature ordering and C/D/E hashes feed F.
The shared 216-cell registry SHA-256 is
`297fb6486a4959e79eae65e00e8c3273a3f4067d6aa3773227315dadfd241d53`.
All 19 positive, contamination, leakage, retuning, covariance, likelihood, and
power fixtures execute; the focused Stage-4.2B suite passes 84/84 tests.

The sole authoritative run is
`casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z`.
Its config, authority-manifest, and fixture SHA-256 values are respectively
`2abf8808fe73f6099d3e9e93e1bed2c8ca33d1094b6a93e9ad926f5fd900fa3e`,
`dd3e423c02fdb16481c91c7ff3ee8583aa740efc71e5a04902ce32cf10754d35`,
and
`ca89c5385bd55290b1cda8084b3d067cbd76420c810164fc958f310de11d1b8c`.
The immutable report JSON, report Markdown, 42-record/NUL-free trace, and
campaign receipt hashes are
`2ebd9971bacc393842dc71bfd80063d7b244231947074bc70b3be25bd7ad5b67`,
`e29564c6cedcace388233f6006b98683fab54f9326b96ab9bbaf3334f33adcbe`,
`727d78249462f0b4171532af37db97be5500a3a7a870cc56b2e533cae0ae0df7`,
and
`50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c`.
The deterministic power-coverage receipt is
`e913ac89d45bcbff566a88214ddd74b8c5faa5e12b21a8350aeec0f63b8f5fdb`
with empirical two-sided coverage 0.95 over 200,000 strata. A fresh Casimir
adapter execution now passes as run `2325`, with no first failure, no deltas,
and certificate integrity `OK`. Its downstream receipt is
`194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d`;
the certificate has scientific scope `none`.

## 6. Observable-separation gate

The study currently fails closed at the cross-lane bridge:

<!-- helix-doc-equation-action/v1 id=cdp-observable-separation-gate -->
\[
\mathrm{Bridge}(R_F,\Delta E_G)=\mathrm{BLOCKED}:
\mathrm{missing\ registered\ observable\ bridge}.
\]

Matching subject words such as vacuum, gravity, fluctuation, or energy do not
make these observables identical. The bridge can be unblocked only by a
source-backed quantitative theory that names its transformation, assumptions,
validity domain, and error contract, followed by independent testing.

A second gate keeps visibility loss distinct from collapse:

<!-- helix-doc-equation-action/v1 id=cdp-decoherence-collapse-gate -->
\[
\mathrm{Identify}(\Delta\Gamma_{res},\Gamma_{collapse})
=\mathrm{BLOCKED}:\mathrm{ordinary\ decoherence\ alternatives\ remain}.
\]

This gate requires a registered dynamics-level discriminator, not merely a
correlation between cavity setting and reduced interference visibility.

## 7. Canonical run order

The machine-readable order in the config is normative:

1. `freeze_protocol`
2. `casimir_reference_baseline`
3. `casimir_material_and_metrology_gate`
4. `boundary_condition_coherence_protocol`
5. `standard_decoherence_budget_gate`
6. `dp_branch_provenance_gate`
7. `dp_self_energy_diagnostic`
8. `dp_experimental_bounds_gate`
9. `manifold_response_model_gate`
10. `observable_bridge_gate`
11. `sensitivity_and_negative_controls`
12. `cold_start_reproduction`
13. `paper_evidence_ledger_update`

This order prevents residual-fitting from becoming evidence for the mechanism
that was tuned to it. Stages may use internal parallelism, but a dependent
stage cannot acquire authority before its prerequisites close.

### 7.1 Stage-3 campaign run order

The Stage-3 config separately freezes this exact dependency order. The gate
column reports the immutable maintained synthetic execution:

| # | Stage | Current gate |
|---:|---|---|
| 1 | `freeze_sources_conventions_models_and_upstream_hashes` | `pass` |
| 2 | `validate_blind_provenance_randomization_and_control_coverage` | `not_ready` |
| 3 | `estimate_complex_coherence` | `diagnostic` |
| 4 | `evaluate_phase_conditioning_path_swap_and_echo` | `not_ready` |
| 5 | `evaluate_decay_shape_and_time_grid_identifiability` | `diagnostic` |
| 6 | `validate_material_green_noise_and_technical_sidecars` | `not_ready` |
| 7 | `predict_qed_phase_noise_heating_and_decoherence` | `diagnostic` |
| 8 | `validate_named_or_dp_models_and_parameter_manifest` | `diagnostic` |
| 9 | `predict_dp_coherence_and_applicable_companions` | `diagnostic` |
| 10 | `validate_complete_apparatus_energy_and_stress_ledger` | `diagnostic` |
| 11 | `compute_mass_weight_weak_field_and_ordinary_gravity_phase_bounds` | `diagnostic` |
| 12 | `preflight_manifold_kernel_registry` | `diagnostic` |
| 13 | `freeze_signatures_likelihoods_priors_criteria_and_falsifiers` | `pass` |
| 14 | `run_blinded_held_out_joint_model_comparison` | `diagnostic` |
| 15 | `populate_outcome_to_claim_ledger` | `pass` |
| 16 | `write_hash_backed_receipt_report_and_evidence_state` | `pass` |

The registry preflight therefore occurs before signatures and held-out
comparison are frozen. Registration does not itself admit a bridge predictor;
that is a separate, fail-closed decision.

### 7.2 Stage-4 polarization/congruence run order

The Stage-4 config preserves Stage 3 as immutable upstream evidence and freezes
this order before any synthetic comparison:

| # | Stage | Current gate |
|---:|---|---|
| 1 | `hash_link_immutable_stage3_authorities` | `pass` |
| 2 | `freeze_units_frequency_psd_frame_handedness_and_mirror_conventions` | `pass` |
| 3 | `freeze_polarization_states_randomization_blinding_and_calibration` | `not_ready` |
| 4 | `validate_jones_stokes_mueller_and_matched_control_sidecars` | `diagnostic` |
| 5 | `run_polarization_resolved_macroscopic_qed_control` | `pass` |
| 6 | `run_planck_fdt_and_stefan_boltzmann_thermal_closure` | `pass` |
| 7 | `run_tensor_dimensional_and_semantic_congruence` | `pass` |
| 8 | `freeze_helicity_mirror_material_temperature_and_companion_signatures` | `pass` |
| 9 | `version_expanded_null_unchanged_dp_and_registered_bridge_comparator` | `pass` |
| 10 | `run_blinded_synthetic_prediction_comparison` | `diagnostic` |
| 11 | `populate_stage4_outcome_falsifier_and_nonclaim_ledger` | `diagnostic` |
| 12 | `write_hash_backed_stage4_receipt_report_and_evidence_state` | `pass` |

The `not_ready` blinding/calibration gate is intentional: the synthetic
fixture freezes the contract but has no measured custodian mapping or
apparatus calibration. The synthetic comparison does not unblind a physical
dataset.

#### Stage-4.1 downstream run order

Stage 4.1 must consume the complete authoritative Stage-4 tuple before it
reads CODATA inputs or evaluates an identity. Its ten-stage contract is:

| # | Stage | Contract purpose |
|---:|---|---|
| 1 | `hash_link_immutable_stage4_authorities` | reject upstream config, manifest, report, receipt, or verification drift |
| 2 | `freeze_codata_units_symbols_species_mass_and_frequency_conventions` | distinguish \(h/\hbar\), \(\nu/\omega\), full/reduced Compton, bare-proton, and alpha namespaces |
| 3 | `validate_source_provenance_uncertainty_covariance_and_rounding` | bind official literals, standard uncertainties, correlations, and published rounding |
| 4 | `compute_compton_energy_frequency_and_wavelength_closure` | evaluate the rest-energy conversion identities |
| 5 | `compute_bohr_classical_radius_rydberg_and_hartree_closure` | evaluate the QED/atomic scale hierarchy |
| 6 | `compute_leading_hydrogenic_reduced_mass_closure` | recover the gross-structure hydrogen scale without precision overclaim |
| 7 | `validate_dimensionless_scale_hierarchy_and_reference_envelopes` | compare internal ratios and source-backed uncertainty envelopes |
| 8 | `freeze_precision_correction_ledger_and_semantic_nonbridge` | preserve omitted corrections and `same_dimension_not_connected` |
| 9 | `populate_stage4_1_outcome_nonclaim_and_falsifier_ledger` | state what each failure or pass can and cannot establish |
| 10 | `write_hash_backed_stage4_1_receipt_report_and_evidence_state` | emit immutable diagnostic artifacts without mutating Stage 4 |

This order blocks reverse inference: a hydrogen-scale recovery cannot excuse
source or covariance failure, and a scale-identity pass cannot be used to
reinterpret the upstream Stage-4 cavity, polarization, thermal, DP, or bridge
outputs.

### 7.3 Stage-4.2B apparatus-residual run order

The Stage-4.2B config freezes this exact dependency order. A `pass` on the
orchestrator stage means the named evaluation executed and recorded its honest
gate; it does not force Runtime F to return an identifiable apparatus:

| # | Stage | Current gate |
|---:|---|---|
| 1 | `freeze_claim_policy_conventions_sources_and_upstream_authorities` | `pass` |
| 2 | `freeze_dp_manifest_external_bounds_ordinary_registry_and_bridge_policy` | `pass` |
| 3 | `validate_blind_generation_and_synthetic_custody_mode` | `pass` |
| 4 | `ingest_calibration_and_pilot_artifacts_only` | `pass` |
| 5 | `validate_object_mass_composition_density_geometry_and_hierarchy` | `pass` |
| 6 | `validate_complete_joint_system_branches_and_equivalence` | `pass` |
| 7 | `validate_material_response_kk_geometry_surfaces_and_solver_receipts` | `pass` |
| 8 | `fit_response_corrected_spectral_thermometry_from_pilot` | `pass` |
| 9 | `fit_sensor_noise_and_cross_spectral_response_from_pilot` | `pass` |
| 10 | `predict_all_registered_ordinary_phase_and_decoherence_lanes` | `pass` |
| 11 | `compute_frozen_dp_density_functional_scaling_and_companion` | `pass` |
| 12 | `reconcile_dp_manifests_and_conditional_boundary_identity` | `pass` |
| 13 | `construct_pilot_likelihood_residual_covariance_and_coverage` | `pass` |
| 14 | `forecast_signature_identifiability_power_and_coverage` | `pass`; Runtime F result `signature_not_identifiable` |
| 15 | `run_synthetic_recovery_and_fail_closed_fixtures` | `pass`; 19/19 executed |
| 16 | `freeze_code_exclusions_covariance_predictions_cells_and_scoring` | `pass` |
| 17 | `ingest_synthetic_held_out_artifacts_after_freeze` | `pass` |
| 18 | `estimate_held_out_complex_coherence_without_refitting` | `pass` |
| 19 | `retain_custodian_authority_and_prohibit_automatic_unblinding` | `pass`; no physical unblinding |
| 20 | `score_blinded_synthetic_held_out_comparison` | `pass` |
| 21 | `populate_outcome_claim_nonclaim_and_blocker_ledger` | `pass` |
| 22 | `write_content_addressed_report_receipt_and_downstream_evidence_state` | `pass` |

This order binds the object and branches before DP evaluation, thermometry and
sensor response before ordinary coherence, the ordinary and DP predictions
before residual construction, and that complete cell/covariance space before
identifiability or power. It also makes the current no-go an upstream design
finding: required windows cannot be interpreted until numerical
control-response and covariance authority make the signature matrix
identifiable.

### 7.4 Cross-runtime authority order

The thirteen stages above govern the base study runner. The repository also
contains twelve maintained authority layers. Their paper-level authority order
is:

1. **Base diagnostic scaffold** — freezes the separated observables, runs the
   ideal Casimir reference and synthetic DP smoke calculation, and emits the
   first blocked-gate receipt.
2. **Experiment-design screen** — compares candidate platforms using explicit
   design assumptions. It ranks engineering questions; it does not select the
   final apparatus or validate a mechanism.
3. **Stage-1 gated computations** — exercises the reduced-order Lifshitz,
   switching/decoherence, rigid-sphere DP convergence, rate-accessibility, and
   manifold-registration gates.
4. **Data-readiness campaign** — validates artifact hashes, Kramers–Kronig
   numerics, acquisition-sidecar structure, covariance, blinding, and
   secondary-channel power without admitting synthetic fixtures as measured
   evidence.
5. **Proposal closure** — freezes the transverse-branch sample-and-hold
   apparatus, preregistration contracts, commissioning ladder, model lanes,
   and decision table.
6. **OR/phase Stage 2** — replays corrected DP branch numerics through a
   softened-potential identity, computes ordinary phase/interference and
   ambient-gravity controls, evaluates the fixed-branch null, and emits the
   three-lane plausibility ledger.
7. **Stage-3 evidence map** — consumes immutable Stage-2 authorities, executes
   the six synthetic scientific runtimes in the frozen order, preflights the
   manifold-kernel registry, and exercises blinded nested-model decisions
   without promoting synthetic output to measured evidence.
8. **Stage-4 polarization/congruence campaign** — hash-links immutable Stage 3,
   expands the ordinary-physics null with polarization-QED and thermal/FDT
   controls, reuses the named DP manifest without mutation, and rejects
   dimensional coincidences as bridges.
9. **Stage-4.1 QED scale-hierarchy calibration** — hash-links the immutable
   Stage-4 authority tuple, checks source-backed Compton and atomic identities,
   propagates covariance, and freezes the precision and semantic non-bridges.
10. **Stage-4.2A mass and radiometric anchors** — replays the electron-mass
    metrology/Higgs-tree parameterization and Planck/solar calibration branches
    while preserving their explicit nonbridge into DP.
11. **Stage-4.2B apparatus-residual forecast** — hash-links immutable upstream
    authorities and couples Runtimes A–F through one cell registry and
    covariance space; its current synthetic result is the fail-closed
    `signature_not_identifiable` apparatus no-go.
12. **Document synchronization** — regenerates equation actions, validates the
   theory-badge graph and paper actions, and then updates this ledger.

This is an **authority dependency rail**, not an assertion that every CLI
directly consumes the previous CLI's output file. Later campaigns may supersede
earlier design assumptions only by saying so explicitly. In particular, the
proposal-closure architecture supersedes the experiment screen's earlier
symmetric-normal-force candidate; the earlier row remains evidence of the
screening path and force-cancellation problem, not the current proposal.

## 8. Runnable diagnostic scaffold

Run the deterministic scaffold from the repository root:

```text
npx tsx scripts/research/run-casimir-dp-quantum-foam-study.ts --config configs/research/casimir-dp-quantum-foam-study.v1.json
```

Run the role-separated experiment-design campaign with:

```text
npx tsx scripts/research/run-casimir-dp-experiment-design.ts --config configs/research/casimir-dp-experiment-design.v1.json --report-doc docs/research/casimir-dp-experiment-design-report.md
```

Run the Stage-1 gated computations with:

```text
npx tsx scripts/research/run-casimir-dp-next-computations.ts --config configs/research/casimir-dp-next-computations.v1.json --report-doc docs/research/casimir-dp-next-computations-report.md
```

Run the data-readiness and blinded-discriminator campaign with:

```text
npx tsx scripts/research/run-casimir-dp-data-readiness.ts
```

Run the proposal-closure audit with:

```text
npx tsx scripts/research/run-casimir-dp-proposal-closure.ts
```

Run the OR/phase Stage-2 audit with:

```text
npx tsx scripts/research/run-casimir-dp-or-phase-stage2.ts --config configs/research/casimir-dp-or-phase-stage2.v1.json --report-doc docs/research/casimir-dp-or-phase-stage2-report.md
```

Run the Stage-3 evidence-map campaign with:

```text
npx tsx scripts/research/run-casimir-dp-evidence-map-stage3.ts --config configs/research/casimir-dp-evidence-map-stage3.v1.json --report-doc docs/research/casimir-dp-evidence-map-stage3-report.md
```

Run the Stage-4 polarization/congruence prediction campaign with:

```text
npx tsx scripts/research/run-casimir-dp-polarization-congruence-stage4.ts --config configs/research/casimir-dp-polarization-congruence-stage4.v1.json --report-doc docs/research/casimir-dp-polarization-congruence-stage4-report.md
```

Only after that immutable Stage-4 authority is present, run the Stage-4.1 QED
scale-hierarchy calibration with:

```text
npx tsx scripts/research/run-casimir-dp-qed-scale-hierarchy-stage4-1.ts --config configs/research/casimir-dp-qed-scale-hierarchy-stage4-1.v1.json --report-doc docs/research/casimir-dp-qed-scale-hierarchy-stage4-1-report.md
```

Run the Stage-4.2B apparatus-coupled synthetic campaign with:

```text
npx tsx scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts --config configs/research/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json --report-doc docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-report.md
```

### 8.1 Runtime-to-artifact contract

| Runtime | Frozen input and SHA-256 | Outputs / sidecars | Current receipt or maintained evidence | Claim ceiling |
|---|---|---|---|---|
| Base diagnostic scaffold | `casimir-dp-quantum-foam-study.v1.json`; `56ab76ca85f4ef4da7ce1ac9da3e87d2eb4e898b02cbc09aca0ad301e0a3f2d2` | `casimir-reference-baseline.json`, `dp-collapse-diagnostic.json`, `study-run-receipt.json` in a timestamped run directory | receipt schema `casimir_dp_quantum_foam_study_receipt/1`; hashes both outputs and preserves every open gate | diagnostic smoke result only |
| Experiment-design screen | `casimir-dp-experiment-design.v1.json`; `bd5528824d70de65e8b181dc18a78c3a287b2fd9c2cdd66bb5a9a79a3c97fe84` | timestamped JSON/Markdown reports and `experiment-design-receipt.json`; maintained design report | `casimir_dp_experiment_design_receipt/1`; input and both output hashes | engineering screen only; frozen proposal supersedes its symmetric-force candidate |
| Stage-1 gated computations | `casimir-dp-next-computations.v1.json`; `5b12c758228dc68865f4a91d3ae1aa9ade698932546c686aab5cb9e5773b5e93` | timestamped JSON/Markdown reports and `gated-computations-receipt.json`; corrected maintained computations report | receipt `d9f42cb1e025bcfa56484b05919797dda8ed2cec383ea927d0972fd7e652c887`; branch sampling passes and spatial convergence is not ready | corrected reduced-order diagnostic numerics only |
| Data readiness | `casimir-dp-data-readiness.v1.json`; `a95e7a22c20e29ed9c34f45ece90916748a9264a32be8315663819171b406475` | maintained data-readiness report plus authenticated optical, switching, and decoherence fixture checks | receipt `9e0f1e8aa01f8ff3e7faf0c070853e0cd4887a191115c51804fa5c71a7c2be5d` | synthetic-pipeline readiness; measured-evidence gate remains closed |
| Proposal closure | `casimir-dp-proposal-closure.v1.json`; `7b3b2673c95d4eebca060261385f3b0659365c1112c1d9d42bc1d8700686b8ba` | maintained closure report and experiment proposal | receipt `aae5cf37e01df022509bc9f997287719eafd5670c6156fdd626d24ce94dbb4c0` | proposal completeness only; commissioning conditional |
| OR/phase Stage 2 | `casimir-dp-or-phase-stage2.v1.json`; `b517e8fbf002303258a5269e7f37c6b16d4bc3c45c609072bdb2a9e5184e596d` | JSON/Markdown OR/phase report, maintained report, and hashed receipt | receipt `64f0e1c95307829540d3c01ad7cb7e10b15d510cb31cf8e73f88a8990d2c25ab`; software/algebraic diagnostics pass; proposal convergence and sensitivity not ready | three-lane diagnostic only; measured, collapse, and manifold gates remain closed |
| Stage-3 evidence map | `casimir-dp-evidence-map-stage3.v1.json`; `231cb26e9c9bb523e2dda40a6178d8a484ec099f1868a74b995d8153337d29c2` | six hash-registered synthetic fixtures; timestamped JSON/Markdown reports and receipt; maintained evidence-map report | run `casimir-dp-evidence-map-stage3-v1-20260725T134544Z`; campaign receipt `5bcd2400bfeaa57a85c4b726224ac25dc8ab4c56bd59dad1b6e54f7f11ff0346`; downstream verification receipt `2cf09b5c5f6d0a584a0c3fd56d8e53834b78f938814ac2ff5500651349930082`; registry schema registered, bridge not admitted | software and synthetic diagnostic only; publication ceiling `diagnostic_protocol_only` |
| Stage-4 polarization/congruence | `casimir-dp-polarization-congruence-stage4.v1.json`; `ade06cd7b95e27fe414614ad36512d5764d439c4fa6623f8499ad218ba07c3d7` | three hash-registered synthetic fixtures; seven content-addressed runtime/contract/dependency sources; polarization-QED, thermal/FDT, congruence, comparator, timestamped JSON/Markdown reports, campaign receipt, and downstream verification receipt | authoritative run `casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z`; campaign receipt `185a09ceb61b4f158afe16022783c8b184c1035f456cb341b5c90920b69b774a`; downstream verification receipt `721b9f6aeab4b181ccc5ac21b4bc81c984d3b1fb72cdf76e55abedba11e38440`; DP manifest unchanged; numerical bridge excluded | synthetic prediction and falsifier playground only; synthetic blinding contract confirms nonpromotion, while measured/collapse/manifold gates remain closed |
| Stage-4.1 QED scale hierarchy | `casimir-dp-qed-scale-hierarchy-stage4-1.v1.json`; `e2625c86a5366258677c58cbe78e73b8fcc1893ecd417b48765d74488f953478`; authority manifest `cd681b977d47de6715322249c1026ecf5e963ac81735d6c29aa5100942824f4f`; CODATA fixture `784e5d456940b55f07f81a7c421fc7ba323c9aefb34b65863f1c1a999803d392` | source-backed CODATA fixture; immutable-authority checks; QED scale, covariance, reduced-mass, correction-ledger, and semantic-nonbridge reports; campaign and downstream receipts | authoritative run `casimir-dp-qed-scale-hierarchy-stage4-1-v1-20260725T183020238Z`; campaign receipt `d835b56a87ed6f6d78edfb8e627bceecb931575348232ca0fd77795f5ffe24af`; downstream verification receipt `a7f60aa9b12b7c1c143a7a1681048a61275495aaed33e1dfa6caa11e9e44b8db`; immutable Stage-4 tuple unchanged; observable bridge edges added `0` | `qed_scale_identity_calibration` only; source-backed calculation is not independent measurement or precision spectroscopy, and all Casimir/DP/collapse/manifold transfers remain closed |
| Stage-4.2B apparatus coherence residual | `casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json`; `2abf8808fe73f6099d3e9e93e1bed2c8ca33d1094b6a93e9ad926f5fd900fa3e`; authority manifest `dd3e423c02fdb16481c91c7ff3ee8583aa740efc71e5a04902ce32cf10754d35`; fixture `ca89c5385bd55290b1cda8084b3d067cbd76420c810164fc958f310de11d1b8c` | six coupled Runtimes A–F, strict campaign contract, 19 executed fixtures, timestamped JSON/Markdown reports, 42-record trace, campaign receipt, and downstream verification receipt | authoritative run `casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z`; A–E pass; F `signature_not_identifiable`; campaign receipt `50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c`; adapter run `2325` PASS/integrity OK; downstream receipt `194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d` | synthetic apparatus identifiability forecast and software/provenance certification only; no measured evidence, DP exclusion, collapse identification, manifold dynamics, physical viability, or observable bridge |
| Paper / workstation synchronization | paper plus `.equation-actions.source.json`; theory-badge module | generated `.equation-actions.json`, document-action tests, badge-graph tests | 41 equation markers = 41 source entries = 41 generated entries; 27 study badges and 79 edges | navigation and provenance only |

The input hashes identify the exact frozen configuration bytes in this
checkout. Timestamped receipts identify a particular execution. A maintained
Markdown report is a readable projection of its runtime result, not a
replacement for the hashed JSON/receipt family when a particular run is being
cited.

For a disposable verification run, supply `--out <directory>`. The runner
writes:

- `casimir-reference-baseline.json`;
- `dp-collapse-diagnostic.json`;
- `study-run-receipt.json`.

The receipt hashes the two outputs and preserves the blocked/not-ready gates.
Its `status=completed` means the code path completed; it does not mean the
scientific hypothesis passed.

The supplied config uses synthetic Gaussian DP branches solely to exercise the
existing solver. Those values must never enter a results or abstract claim as
apparatus measurements.

### 8.2 Validation standing

Validation is reported in separate software, algebraic, provenance, and
scientific lanes so that repository health cannot be mistaken for experimental
evidence.

| Validation lane | Current result | What it establishes | What it does not establish |
|---|---|---|---|
| Optical-response analytic check | Kramers-Kronig relative error `7.0692e-7`; synthetic pipeline `pass` | the registered transform and synthetic acquisition path replay within their diagnostic contract | measured material response |
| DP/phase focused contracts | 10 files, 67 tests `pass` | corrected DP normalization, density-payload integrity, branch sampling, proposal-specific resolution, potential/pairwise identity, phase/interference, paper provenance, badge graph, and root-leaf manifest agree | a physical collapse signal |
| Stage-3 immutable campaign | receipt `5bcd2400bfeaa57a85c4b726224ac25dc8ab4c56bd59dad1b6e54f7f11ff0346`; JSON report `feb799bcf93f1497673d58eac1a98a773ac1e1b0767082104af7b7d6c8e3508b`; Markdown report `41aae6d542a19b6564f88ae7c8e7f2531abf90b08a7d02c11b043e5c691cc23a` | all required authorities and six synthetic fixture hashes pass; runtime ordering, recovery, provenance, and fail-closed claims execute | measured ordinary-physics closure, DP support, collapse, or manifold dynamics |
| Stage-4 immutable campaign | receipt `185a09ceb61b4f158afe16022783c8b184c1035f456cb341b5c90920b69b774a`; JSON report `2c56cd9b61928ee750cf0714435674cc923b4c81f02e325b8ee9e9e5a9816d0b`; Markdown report `1221cf1e6b6c247c3253240c44ed78446318b2cdb2966610a63d08c7ec4f00a8` | all required immutable Stage-3 authority, Stage-4 fixture, and runtime/dependency-source hashes pass; polarization, thermal, congruence, comparator, evidence-class, finite-output, covariance, nonclaim, and synthetic-only blinding logic execute | a physical blind, measured ordinary-physics closure, DP support, a numerical bridge, collapse, or manifold dynamics |
| Stage-4.1 immutable campaign | receipt `d835b56a87ed6f6d78edfb8e627bceecb931575348232ca0fd77795f5ffe24af`; JSON report `8f06bf394e64d40d24530e9e93b5d61edece3752318ece2095f27d61f55042c5`; Markdown report `6ae9530701fc35aa544b438709e789929b45eaf53ae950ec93ed976bb9703ba6` | the frozen Stage-4 tuple and Stage-4.1 source, fixture, namespace, algebra, covariance, reduced-mass, correction-ledger, and semantic-nonbridge contracts pass | independent empirical validation, precision spectroscopy, a cavity/DP transfer, a collapse clock, collapse identification, manifold dynamics, or physical viability |
| Stage-4.2A immutable campaign | receipt `592a6245993411801672c6fa6ffa4cea4484e4fcf9164ad03f586a55333b17c3`; JSON report `a53a2f1cdc7e4b2d1c9957aaa0a73316d77037371002b7ced4a2978a630fe35d`; Markdown report `d7dbf59d6e284ef60ccae58f0f01076b453de1a81fcb2b6863bf44d969f7357a` | source, software, fixture, TSIS-snapshot, run-order, mass/Higgs, radiometric, temperature-semantics, and zero-bridge gates pass | an independent electron-mass validation, direct electron Yukawa observation, full solar spectral fit, DP evidence, collapse, manifold dynamics, cosmology, or physical viability |
| Stage-4.2B coupled campaign | receipt `50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c`; JSON report `2ebd9971bacc393842dc71bfd80063d7b244231947074bc70b3be25bd7ad5b67`; Markdown report `e29564c6cedcace388233f6006b98683fab54f9326b96ab9bbaf3334f33adcbe`; trace `727d78249462f0b4171532af37db97be5500a3a7a870cc56b2e533cae0ae0df7` | campaign/content integrity pass; A–E pass; F blocks as `signature_not_identifiable`; all 19 fixtures and 84 focused tests pass; cross-runtime values, cell order, covariance, and hashes agree | measured ordinary-decoherence closure, an identifiable or powered apparatus, a DP exclusion, collapse, a boundary modifier, manifold dynamics, or physical viability |
| Equation and Theory Badge sidecars | `41/41/41` equation parity; 27 badges and 79 edges | paper navigation and claim-boundary provenance are synchronized | empirical support for any badge hypothesis |
| Math-stage registry | 213 entries; validation `pass` | Stage-2, seven Stage-3, four Stage-4, Stage-4.1, both Stage-4.2A calibration lanes, and six Stage-4.2B runtime responsibilities are registered at their declared maturity | certified manifold dynamics |
| Required GR/warp regression battery | 18 files, 179 tests `pass` | this revision does not break the repository's required GR/constraint contracts | physical viability of the Casimir-DP extension |
| Prior Casimir adapter certificate | pre-Stage-3 verdict `PASS`; SHA-256 `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`; explicitly not reused by the Stage-3 receipt | adapter and constraint-pack integrity at the earlier certified revision only | certificate authority for the integrated Stage-3 patch |
| Stage-3 Casimir adapter certificate | fresh trace `casimir-dp-evidence-map-stage3-v1-20260725T134544Z`; run `2314`; verdict `PASS`; first failure null; deltas empty; integrity `true`; status `GREEN`; certificate SHA-256 `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`; downstream receipt `2cf09b5c5f6d0a584a0c3fd56d8e53834b78f938814ac2ff5500651349930082` | a new Stage-3 adapter execution and exported trace pass; the repeated content hash is expected because the unchanged `repo-convergence` payload is content-addressed | experimental evidence, physical viability of the hypothesis, or permission to reuse the Stage-2 trace as Stage-3 authority |
| Stage-4 Casimir adapter certificate | fresh trace `casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z-final`; isolated run `1`; verdict `PASS`; first failure null; deltas empty; integrity `true`; status `GREEN`; certificate SHA-256 `38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34`; validated trace `f40b4bdecb3f9e03f784e66c5b5db50d7e86571f31d0ae7547d110673d45bfd8`; downstream receipt `721b9f6aeab4b181ccc5ac21b4bc81c984d3b1fb72cdf76e55abedba11e38440` | a new Stage-4 adapter execution over explicitly bound build, focused-test, Stage-4-schema, and dependency inputs plus a validated one-record trace; 27 receipt-grade files and 301 tests pass; lint and full-repository typecheck proxies are omitted rather than carried forward | measured polarization or thermal closure, a sourced numerical bridge, collapse identification, manifold dynamics, physical viability, or direct certificate binding of Stage-4 report bytes |
| Stage-4.1 Casimir adapter certificate | fresh trace `casimir-dp-qed-scale-hierarchy-stage4-1-v1-20260725T183020238Z-final`; run `2322`; verdict `PASS`; first failure null; deltas empty; integrity `true`; status `GREEN`; certificate SHA-256 `38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34`; validated trace `cb59e4fdf60c645756902b93479ddd8a6bbe124aa6fb372dcd9c3d191a5ffcc6`; downstream receipt `a7f60aa9b12b7c1c143a7a1681048a61275495aaed33e1dfa6caa11e9e44b8db` | a fresh Stage-4.1 execution over explicitly bound build, 32-file/328-test replay, Stage-4.1 schema/publication graph, and dependency inputs; the repeated certificate content hash reflects the same normalized four passing software metrics, not artifact reuse | CODATA independence, precision spectroscopy, measured Casimir or coherence evidence, a transfer kernel, collapse identification, manifold dynamics, WARP admissibility, physical viability, or direct certificate binding of campaign bytes |
| Stage-4.2A Casimir adapter certificate | fresh trace `casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1-20260725T211750900Z-final`; run `2324`; verdict `PASS`; first failure null; deltas empty; integrity `true`; status `GREEN`; certificate SHA-256 `38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34`; validated trace `d98cea52156b0f490c7e1785f76bbe86228fb4fed3e909a0c27b885b2d252a30`; downstream receipt `debd651e7e500ee9b7011e7fa1c7a16ddcdcf56a6957ca0d2d91b28fe756b66a` | a fresh explicit no-auto-telemetry execution over the content-addressed campaign, production build, 25-file/260-test replay, schema/graph/root/GR scope, and dependency inputs; the repeated certificate hash reflects the same normalized four passing software metrics, not artifact reuse | primary-source truth, a full solar fit, measured DP evidence, collapse identification, manifold dynamics, cosmological lift, WARP admissibility, or physical viability |
| Stage-4.2B Casimir adapter certificate | fresh trace `casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T130100867Z-final`; run `2325`; verdict `PASS`; first failure null; deltas empty; integrity `true`; status `GREEN`; certificate SHA-256 `38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34`; validated trace `3894af959e1f3de8d28ede457727a97688c2fd64031c3512f941f5b89a889ffd`; downstream receipt `194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d` | a fresh explicit no-auto-telemetry execution over the content-addressed campaign, production build, 51-file/509-test replay, Stage-4.2B schema/graph/root/GR scope, and dependency inputs; the repeated certificate content hash reflects the same normalized four passing software metrics, not reuse of an earlier trace or certificate artifact | measured evidence, signature identifiability, acquisition power, DP exclusion, collapse identification, a boundary modifier, manifold dynamics, WARP admissibility, or physical viability |
| Scientific promotion gates | measured evidence `not_ready`; collapse identification `blocked`; manifold dynamics `blocked` | the proposal remains fail-closed while apparatus receipts and bridge dynamics are absent | permission to state the central hypothesis as a result |

## 9. Runtime plan

| Stage | Class | Target | Current authority |
|---|---|---:|---|
| Ideal Casimir formulas | instant scalar | <1 s | reference |
| DP synthetic smoke case | small diagnostic | <30 s | diagnostic |
| Material/geometry model | small or sweep | config-dependent | not ready without receipts |
| Boundary-conditioned coherence fit | experiment/runtime | dataset-dependent | protocol only |
| Standard decoherence budget | analysis campaign | dataset-dependent | not ready |
| Semiclassical/stochastic metric response | field solve | model-dependent | Stage 0 / unregistered |
| Gap/material/temperature sweeps | sweep | request-manifest bounded | planned |
| Quantum-foam response | unregistered | none | blocked |
| Experimental-bound comparison | review/runtime | dataset-dependent | review |
| Cold-start reproduction | small/sweep | same campaign class | planned |
| Data-readiness artifact validation | small diagnostic | <30 s for registered fixtures | structural pipeline pass; measured evidence not ready |
| Proposal-closure audit | small diagnostic | <30 s | proposal package pass; commissioning conditional |
| OR/phase Stage-2 audit | small diagnostic | <30 s | algebraic/runtime pass; Stage-1 transfer, proposal convergence/provenance/bounds, sub-voxel sensitivity, and measured evidence not ready; collapse/manifold gates closed |
| Stage-3 evidence-map audit | six diagnostics plus orchestrator | <30 s for registered synthetic fixtures | synthetic diagnostics pass; registry schema registered but bridge not compared or validated; measured evidence not ready; collapse/manifold gates closed |
| Stage-4 polarization/congruence audit | three diagnostics plus comparator/orchestrator | <30 s for registered synthetic fixtures | synthetic predictions pass; measured QED/thermal lanes not ready; named DP unchanged; numerical bridge, collapse, and manifold gates closed |
| Stage-4.1 QED scale-hierarchy calibration | source-backed calculation plus immutable-authority orchestrator | <30 s for the registered CODATA fixture | identity/reference/reduced-mass software gates pass; precision spectroscopy not ready; Casimir/DP/collapse/manifold transfers blocked |
| Stage-4.2A mass/energy and Planck/solar calibration | two source-backed diagnostics plus a semantic-nonbridge campaign | bounded registered diagnostic; runtime/campaign and downstream software verification pass | calibration and nonbridge gates pass; full spectral-fit significance and Level 1 measured evidence `not_ready`; Level 2/3, collapse, and manifold claims `blocked` |
| Stage-4.2B apparatus-residual forecast | six coupled diagnostics plus strict orchestrator | bounded synthetic campaign; 19 fixtures and 84 focused tests | campaign passes; A–E pass; F is `signature_not_identifiable`; numeric control-response/covariance authority and measured evidence not ready; no DP exclusion |
| Equation-sidecar synchronization | small document build | <30 s | 41/41/41 marker/source/generated parity |

Long sweeps must use a request manifest, bounded output directory, timeout,
freshness hashes, and explicit cancellation/failure state. A `latest` alias is
not independent evidence.

## 10. Required campaign matrix

Before any result is promoted, the campaign should include:

- gap, temperature, geometry, material, roughness, and patch-potential sweeps;
- boundary-setting coherence runs with the material branch distribution fixed;
- electromagnetic, thermal, gas-collision, vibrational, material-loss,
  radiation-pressure, readout-backaction, and active-modulation noise budgets;
- matched-force, matched-heating, cavity-detuned, identical-boundary, and
  boundary-label-shuffle controls;
- source-backed or measured numerical response vectors and block covariance
  for every frozen nuisance/control axis, sufficient to pass the Stage-4.2B
  rank, cosine, and conditioning gates;
- disjoint pilot/training, primary confirmatory, and independent-replication
  partitions with the exact registered cell order;
- solver grid, cutoff `ell_m`, and downsampling convergence for DP;
- identical-branch, zero-mass-difference, shuffled-label, and injected-signal
  negative/positive controls;
- blinded residual analysis where practical;
- comparison against the 2021 Gran Sasso and 2026 XENONnT DP constraints;
- cold-start reproduction with output hashes;
- explicit contradiction ledger when summary and detailed artifacts disagree.

## 11. Results ledger

No physical result is claimed yet. This ledger records maintained campaigns or
runnable receipt families; `<timestamp>` denotes a per-execution identifier,
not a single maintained measurement run.

| Run id | Revision | Input hash | Stage | Status | Key result | Uncertainty | Artifact | Claim effect |
|---|---|---|---|---|---|---|---|---|
| `diagnostic-smoke-v1-<timestamp>` | local diagnostic | `56ab76ca85f4ef4da7ce1ac9da3e87d2eb4e898b02cbc09aca0ad301e0a3f2d2` | protocol scaffold | completed / downstream gates not ready or blocked | ideal Casimir reference plus synthetic DP solver smoke path | synthetic branches; material, metrology, and bridge absent | timestamped `study-run-receipt.json` and two hashed outputs | confirms runnable separation only |
| boundary-coherence-platform-screen-v1 | local diagnostic | `bd5528824d70de65e8b181dc18a78c3a287b2fd9c2cdd66bb5a9a79a3c97fe84` | experiment design | completed / promotion blocked | corrected centered-grid integrated proxy `Gamma_DP/Gamma_env=4.47e-7`; no candidate promoted | design assumptions dominate | maintained design report; receipt `002256c567e0897f2e0f93c29ec1d50652e1337b3c9175147f8928827c6667e0` | defines rate gap and next computations only |
| casimir-dp-gated-computations-stage1-v1 | local diagnostic | `5b12c758228dc68865f4a91d3ae1aa9ade698932546c686aab5cb9e5773b5e93` | five gated computation lanes | completed / promotion blocked | Lifshitz ideal validation pass; DP mass/symmetry/containment pass; corrected spatial convergence not ready; rate-only power not ready | material and sidecar receipts absent; branch convergence and provenance open; manifold dynamics unregistered | corrected gated-computations report; receipt `d9f42cb1e025bcfa56484b05919797dda8ed2cec383ea927d0972fd7e652c887` | repairs false convergence pass and preserves promotion block |
| casimir-dp-data-readiness-stage1-v1 | local diagnostic | `a95e7a22c20e29ed9c34f45ece90916748a9264a32be8315663819171b406475` | data and acquisition readiness | completed / measured gates not ready | Kramers–Kronig analytic error `7.0692e-7`; synthetic sidecar integrity and covariance checks pass | no apparatus-matched optical or acquisition sidecar | data-readiness report; receipt `9e0f1e8aa01f8ff3e7faf0c070853e0cd4887a191115c51804fa5c71a7c2be5d` | validates the data path, not measured physics |
| casimir-dp-transverse-branch-pilot-v1 | local proposal closure | `7b3b2673c95d4eebca060261385f3b0659365c1112c1d9d42bc1d8700686b8ba` | proposal and preregistration closure | proposal package pass / commissioning conditional | frozen transverse architecture; nine machine contracts pass; five model roles separated | integrated hardware, finite-geometry contrast, and dynamics signatures remain absent | proposal, closure report; receipt `aae5cf37e01df022509bc9f997287719eafd5670c6156fdd626d24ce94dbb4c0` | authorizes commissioning planning only |
| casimir-dp-or-phase-stage2-v1 | local diagnostic | `b517e8fbf002303258a5269e7f37c6b16d4bc3c45c609072bdb2a9e5184e596d` | OR notation, proposal-specific DP convergence, DP algebra, phase/interference, ambient gravity, three-lane bridge audit | software/algebraic diagnostics pass / promotion blocked | potential identity `6.08e-16`; fixed-branch `Delta_b Gamma_DP=0`; frozen-grid perturbation unresolved; vertical phase `7.23e8 rad`; bridge blocked | Stage-1 input mismatch; proposal convergence, provenance, bounds, perturbation sensitivity, and measured phase/coherence not ready; no bridge dynamics | Stage-2 report; receipt `64f0e1c95307829540d3c01ad7cb7e10b15d510cb31cf8e73f88a8990d2c25ab` | operationalizes the revised hypothesis without promoting OR or manifold claims |
| casimir-dp-evidence-map-stage3-v1-20260725T134544Z | local synthetic diagnostic | `231cb26e9c9bb523e2dda40a6178d8a484ec099f1868a74b995d8153337d29c2` | six scientific runtimes plus fail-closed orchestrator | completed / promotion prohibited | required authority and fixture hashes pass; synthetic comparison exercises `M0_ordinary_physics: disfavored` and `M_dp_regularized_synthetic_v1: not_disfavored_within_powered_region`; registry schema registered, bridge omitted; fresh adapter trace `2314` passes with integrity `true` | every scientific input is synthetic; stages 2, 4, and 6 remain not ready; ordinary decoherence and measured evidence not ready; collapse/manifold blocked | timestamped Stage-3 JSON/Markdown reports; campaign receipt `5bcd2400bfeaa57a85c4b726224ac25dc8ab4c56bd59dad1b6e54f7f11ff0346`; verification receipt `2cf09b5c5f6d0a584a0c3fd56d8e53834b78f938814ac2ff5500651349930082` | validates evidence-map mechanics, claim ceilings, and repository gates only; creates no model preference from nature |
| casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z | local synthetic prediction diagnostic | `ade06cd7b95e27fe414614ad36512d5764d439c4fa6623f8499ad218ba07c3d7` | polarization-QED, Planck/FDT thermal closure, tensor/dimensional/semantic congruence, and Stage-4 comparator/orchestrator | completed / promotion prohibited | all authority, fixture, runtime, and constants hashes pass; basis invariance `2.2774e-15`; mirror-odd phase fixture `0.1509886914 rad`; Stefan-Boltzmann error `2.3298e-11`; `same_dimension_not_connected`; DP manifest unchanged; bridge omitted; synthetic blinding contract records no physical blind or measured comparison; adapter PASS/integrity OK | every scientific input is synthetic; measured QED/thermal closure not ready; registered numerical bridge absent; collapse/manifold blocked; viability not evaluated | timestamped Stage-4 JSON/Markdown reports; campaign receipt `185a09ceb61b4f158afe16022783c8b184c1035f456cb341b5c90920b69b774a`; downstream verification receipt `721b9f6aeab4b181ccc5ac21b4bc81c984d3b1fb72cdf76e55abedba11e38440` | validates prediction mechanics, cross-system congruence, source provenance, repository-gate execution, and claim ceilings only; creates no model preference from nature |
| casimir-dp-qed-scale-hierarchy-stage4-1-v1-20260725T183020238Z | source-backed calculation | `e2625c86a5366258677c58cbe78e73b8fcc1893ecd417b48765d74488f953478` | immutable Stage-4 hash link; QED/atomic scale identities; CODATA provenance, covariance, reduced mass, correction ledger, and semantic nonbridge | completed / promotion prohibited | all required authority, fixture, and software hashes pass; maximum algebraic residual `1.697367151440e-16`; maximum dimensionless-hierarchy residual `1.937272989296e-16`; leading hydrogen scale `2.466038423660e15 Hz`; cross-source significance `not_computable_without_cross_covariance`; adapter PASS/integrity OK | CODATA adjusted outputs are correlated; the leading hydrogen row is not precision spectroscopy; precision corrections, apparatus response, measurements, polarization, and every Casimir/DP transfer remain absent | timestamped Stage-4.1 JSON/Markdown reports; campaign receipt `d835b56a87ed6f6d78edfb8e627bceecb931575348232ca0fd77795f5ffe24af`; downstream verification receipt `a7f60aa9b12b7c1c143a7a1681048a61275495aaed33e1dfa6caa11e9e44b8db` | calibrates names, dimensions, algebra, source literals, and uncertainty semantics only; creates no empirical model preference and no observable bridge |
| casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z | local synthetic apparatus forecast | `2abf8808fe73f6099d3e9e93e1bed2c8ca33d1094b6a93e9ad926f5fd900fa3e` | apparatus/branch transport, spectral thermometry, sensor/ordinary covariance, frozen DP scaling, complex residual, and identifiability/power | campaign and content integrity pass / promotion prohibited / Runtime F blocked | A–E pass in one hash-asserted 216-cell/covariance space; 19/19 fixtures execute; rank 7, max cosine `0.9999771044199663`, Gram condition `179103.91134865975`; verdict `signature_not_identifiable`; required windows and power not estimable | all scientific inputs remain synthetic/design-class; 30 controls lack numerical response vectors and block covariance; measured ordinary closure, physical blind, and identifiable companion absent | immutable JSON `2ebd9971bacc393842dc71bfd80063d7b244231947074bc70b3be25bd7ad5b67`; Markdown `e29564c6cedcace388233f6006b98683fab54f9326b96ab9bbaf3334f33adcbe`; trace `727d78249462f0b4171532af37db97be5500a3a7a870cc56b2e533cae0ae0df7`; receipt `50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c`; adapter run `2325` PASS/integrity OK; downstream receipt `194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d` | establishes an apparatus-redesign/identifiability no-go and certified software/provenance path only; excludes no DP region and adds no observable bridge, collapse, manifold, or physical-viability evidence |

## 12. Claim boundaries

This paper does not claim:

- that the Casimir effect proves zero-point energy as a unique ontology;
- that quantum foam is the accepted explanation of the Casimir effect;
- that measured Casimir force equals DP gravitational self-energy;
- that a Casimir apparatus creates the mass-density superposition required by
  the DP model;
- that virtual particles are literal short-lived objects whose annihilation
  supplies the Penrose collapse clock;
- that `mc^2/h`, `\Delta E_G/h`, or dimensional agreement supplies a physical
  Casimir-cavity resonance without a registered transfer kernel;
- that \(\alpha_{\rm fs}\) is a universal photon-emission probability or that
  matching powers of \(\alpha_{\rm fs}\) identify a shared mechanism;
- that Compton, Bohr, classical-electron-radius, Rydberg, or Hartree scale
  identities supply Casimir, DP, collapse, or manifold evidence;
- that the Higgs field acts as drag, predicts the numerical electron Yukawa
  coupling, or that \(m_ec^2=y_ev_F/\sqrt2\) is a direct electron-Higgs
  measurement;
- that CERN's heavier-particle Higgs-coupling results or the present
  \(H\rightarrow e^+e^-\) upper limit independently validate the
  electron-specific Yukawa coupling or connect the Higgs and Casimir vacua;
- that resolving TE/TM or RCP/LCP polarization adds a gravitational degree of
  freedom or a standard DP polarization term;
- that Planck-to-Stefan-Boltzmann recovery predicts the Sun's temperature from
  Planck's constant alone or connects blackbody radiation to collapse;
- that the Planck blackbody spectrum and gravitational Planck units are one
  physical scale, or that a DP reparameterization in \(m_P\) demonstrates
  Planck-length access, discrete spacetime, or an energy lattice;
- that a TSIS spectral-fit color temperature is identical to the bolometric
  effective temperature, the IAU nominal conversion, or a stellar-structure
  prediction;
- that a Penning-to-Compton/Rydberg-to-thermal/solar calibration ladder is a
  causal chain into \(E_G\), \(\Gamma_{\rm DP}\), or a cosmological
  backreaction;
- that calibration closure supplies Level-1 objective-collapse evidence,
  Level-2 DP scaling evidence, or Level-3 boundary-sensitive evidence;
- that the Stage-4.2B synthetic recovery, coupled hash identities, or 0.95
  deterministic coverage constitutes measured ordinary-decoherence closure;
- that the baseline `signature_not_identifiable` result or the separate
  `underpowered_null` test fixture excludes DP, bounds a DP parameter region,
  or supplies an interpretable required-window forecast;
- that naming nuisance/control axes supplies numerical control leverage without
  source-backed response vectors and a block-bound covariance;
- that numerical recovery of the conditional fixed-branch boundary identity
  authorizes an experimental boundary-null claim before measured-preparation
  complete-joint-system equivalence is demonstrated;
- that a future laboratory boundary residual by itself establishes primordial
  collapse, dark energy, a cosmological vacuum mechanism, or permission to
  retune laboratory-fixed collapse parameters against cosmological data;
- that the synthetic Stage-4 phase double contrast is an apparatus forecast or
  a measured anomaly;
- that tensor/dimensional/semantic congruence validates the registered
  manifold bridge when its numerical output remains `null`;
- that a negative renormalized energy-density component uniquely determines
  negative spacetime curvature;
- that boundary-conditioned decoherence is objective collapse;
- that an ambient gravitational field is the DP branch self-energy or that
  ordinary gravitational phase is an OR rate;
- that the existing nonrelativistic DP estimator accepts vacuum stress,
  pressure, or a noise kernel as a substitute for material `\Delta\rho`;
- that observations of classical gravitational waves establish quantum
  superposed geometries, Penrose reduction, or a cavity coupling;
- that DP collapse has been observed;
- that this non-biological experiment validates Orch OR, microtubule
  coherence, neuronal orchestration, or consciousness claims;
- that this study validates NHM2, propulsion, negative-energy engineering,
  gravity control, or physical viability.

## 13. Source register

- H. B. G. Casimir, “On the Attraction Between Two Perfectly Conducting
  Plates” (1948), original ideal-plate calculation.
- E. M. Lifshitz, finite-temperature/material-response formulation of
  dispersion forces (1956), required conceptual basis for real materials.
- S. J. Rahi, T. Emig, N. Graham, R. L. Jaffe, and M. Kardar, "Scattering
  Theory Approach to Electrodynamic Casimir Forces," *Physical Review D* 80,
  085021 (2009), DOI `10.1103/PhysRevD.80.085021`; supports explicit material,
  geometry, basis, and temperature scattering operators, not a collapse
  coupling.
- S. Scheel and S. Y. Buhmann, "Macroscopic QED — concepts and applications,"
  arXiv:0902.3586; supports the Green-tensor quantization and
  fluctuation-dissipation control lane, not a unique vacuum ontology.
- S. Fuchs et al., "Casimir-Lifshitz Force for Nonreciprocal Media and
  Applications to Photonic Topological Insulators," arXiv:1707.04577;
  supports polarization-mixing reflection matrices in macroscopic QED, not a
  polarization-dependent objective-collapse law.
- E. Tiesinga et al., "CODATA recommended values of the fundamental physical
  constants: 2018," *Reviews of Modern Physics* 93, 025010 (2021), DOI
  `10.1103/RevModPhys.93.025010`; supplies the exact SI radiation constants and
  Stefan-Boltzmann normalization.
- P. J. Mohr, D. B. Newell, B. N. Taylor, and E. Tiesinga, "CODATA
  recommended values of the fundamental physical constants: 2022," *Reviews
  of Modern Physics* 97, 025002 (2025), DOI
  `10.1103/RevModPhys.97.025002`; supplies the adjusted electron/atomic
  constants, standard uncertainties, and covariance context for Stage 4.1,
  not a Casimir, collapse, or manifold mechanism.
- NIST Standard Reference Database 121,
  [2022 CODATA recommended values](https://physics.nist.gov/constants), Web
  Version 9.0; supplies the official machine-readable constants tables and
  correlation lookup used for source-literal checks, not an independent
  experiment or a mechanism claim.
- Bureau International des Poids et Mesures, *The International System of
  Units (SI)*, 9th ed., DOI `10.59161/AUEZ1291`; supplies the exact SI defining
  values of \(h\) and \(c\), not an empirical cross-check of derived QED scales.
- S. Sturm et al., "High-precision measurement of the atomic mass of the
  electron," *Nature* 506, 467-470 (2014), DOI
  `10.1038/nature13026`, and F. Köhler et al., the detailed
  bound-electron-\(g\) analysis, *Journal of Physics B* 48, 144032 (2015),
  [arXiv:1604.04380](https://arxiv.org/abs/1604.04380); support the proposed
  Penning-trap mass reconstruction and correction ledger, not a direct
  Higgs-coupling observation.
- Particle Data Group, "Status of Higgs Boson Physics," *Review of Particle
  Physics* (2025),
  [source](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-higgs-boson.pdf);
  supports the Yukawa Lagrangian, \(m_f=y_fv/\sqrt2\), Fermi-scale convention,
  and current Higgs-coupling standing, not a Casimir/DP mechanism.
- CMS Collaboration, "Search for the Higgs boson decay to a pair of
  electrons," *Physics Letters B* 846, 137783 (2023),
  [CMS HIG-21-015](https://cms-results.web.cern.ch/cms-results/public-results/publications/HIG-21-015/index.html);
  supports the electron-specific collider upper limit, not an observation of
  the Standard Model electron Yukawa coupling.
- IAU 2015 Resolution B3, arXiv:1510.07674, and A. Prša et al., *Astronomical
  Journal* 152, 41 (2016); supply nominal solar conversion constants for the
  flux-equivalent effective-temperature benchmark, not a stellar-structure
  derivation.
- NASA and the Laboratory for Atmospheric and Space Physics,
  [TSIS-1 Hybrid Solar Reference Spectrum](https://lasp.colorado.edu/lisird/data/tsis1_hsrs/);
  supplies the versioned full-disk spectral irradiance rows and uncertainties
  used by the frozen-window Wien diagnostic, not a full response/covariance
  fit, unique solar temperature, bolometric identity, or DP input.
- R. L. Jaffe, “Casimir effect and the quantum vacuum,” *Physical Review D* 72,
  021301(R) (2005), DOI `10.1103/PhysRevD.72.021301`, useful for separating a
  measurable force from a unique vacuum ontology.
- L. Diósi, “A universal master equation for the gravitational violation of
  quantum mechanics,” *Physics Letters A* 120, 377–381 (1987), DOI
  `10.1016/0375-9601(87)90681-5`; supports the gravity-related master-equation
  lineage, not a Casimir modifier or an unregularized universal prediction.
- L. Diósi, “Models for universal reduction of macroscopic quantum
  fluctuations,” *Physical Review A* 40, 1165–1174 (1989), DOI
  `10.1103/PhysRevA.40.1165`; supports a mass-density collapse-generator
  formulation, not a Casimir-boundary theorem.
- R. Penrose, “On Gravity's Role in Quantum State Reduction,” *General
  Relativity and Gravitation* 28, 581–600 (1996), DOI
  `10.1007/BF02105068`; supports the branch-geometry/self-energy lifetime
  heuristic, not a unique stochastic dynamics or cavity-transfer kernel.
- R. Penrose, "On the Gravitization of Quantum Mechanics 1: Quantum State
  Reduction," *Foundations of Physics* 44, 557-575 (2014), DOI
  `10.1007/s10701-013-9770-0`; source for the `E_G` notation and
  `tau~hbar/E_G` order-of-magnitude OR estimate, not for a Casimir coupling.
- S. Hameroff and R. Penrose, "Consciousness in the universe: A review of the
  'Orch OR' theory," *Physics of Life Reviews* 11, 39-78 (2014), DOI
  `10.1016/j.plrev.2013.08.002`; used only to define the biological Orch OR
  scope that this experiment does not test.
- R. Colella, A. W. Overhauser, and S. A. Werner, "Observation of
  Gravitationally Induced Quantum Interference," *Physical Review Letters* 34,
  1472-1474 (1975), DOI `10.1103/PhysRevLett.34.1472`; experimental precedent
  for ordinary unitary gravitational phase, not objective reduction.
- B. P. Abbott et al., "Observation of Gravitational Waves from a Binary Black
  Hole Merger," *Physical Review Letters* 116, 061102 (2016), DOI
  `10.1103/PhysRevLett.116.061102`; evidence for classical dynamical spacetime
  curvature, not quantum-geometry superposition or OR.
- P. Wolf et al., “Does an atom interferometer test the gravitational redshift
  at the Compton frequency?,” *Classical and Quantum Gravity* 28, 145017
  (2011), DOI `10.1088/0264-9381/28/14/145017`; operational context for why
  assigning `mc^2/h` does not, without a specified differential phase and
  readout model, create an experimentally accessible clock or cavity resonance.
  This study does not rely on the paper's broader redshift conclusion.
- B. L. Hu and E. Verdaguer, “Stochastic Gravity: Theory and Applications,”
  *Living Reviews in Relativity* 11, 3 (2008), DOI
  `10.12942/lrr-2008-3`; source for the separation between semiclassical mean
  stress, the stress-tensor noise kernel, and induced metric fluctuations, not
  for an objective-collapse claim.
- G. L. Klimchitskaya, U. Mohideen, and V. M. Mostepanenko, “The Casimir force
  between real materials: Experiment and theory,” *Reviews of Modern Physics*
  81, 1827 (2009), DOI `10.1103/RevModPhys.81.1827`; material, temperature,
  roughness, and metrology authority needed beyond the ideal reference rows.
- F. Tebbenjohanns et al., “Quantum control of a nanoparticle optically
  levitated in cryogenic free space,” *Nature* 595, 378–382 (2021), DOI
  `10.1038/s41586-021-03617-w`; platform evidence for cryogenic levitation and
  measured decoherence control, not for the campaign's assumed rates.
- B. Melo et al., “Vacuum levitation and motion control on chip,”
  *Nature Nanotechnology* 19, 1270–1276 (2024), DOI
  `10.1038/s41565-024-01677-3`; demonstrates high-vacuum on-chip trapping and
  electrical feedback, but not the proposed near-surface cryogenic
  superposition integration.
- G. Winstone et al., “Direct measurement of the electrostatic image force of
  a levitated charged nanoparticle close to a surface,” *Physical Review A* 98,
  053831 (2018), DOI `10.1103/PhysRevA.98.053831`; supplies the silica/silicon
  retarded Casimir-Polder reference and direct evidence that surface
  electrostatics and trap anharmonicity are leading approach risks.
- G. P. Seta et al., “Shot-to-Shot Displacement Noise in State-Expansion
  Protocols with Inverted Potentials,” *Physical Review Letters* 136, 123602
  (2026), DOI `10.1103/y1q9-pnlc`; identifies stray electric fields and
  mechanical instability as state-expansion noise sources.
- P. Rodriguez-Lopez et al., “Casimir force phase transitions in the graphene
  family,” *Nature Communications* 8, 14699 (2017), DOI
  `10.1038/ncomms14699`; theoretical evidence for externally tunable 2D-material
  Casimir interactions, not a receipt for the proposed device.
- F. Chen et al., “Control of the Casimir force by the modification of
  dielectric properties with light,” *Physical Review B* 76, 035338 (2007),
  DOI `10.1103/PhysRevB.76.035338`; experimental precedent for optical
  modulation and a warning that pump-induced heat and carriers require
  explicit sidecars.
- S. Pedalino et al., “Probing quantum mechanics with nanoparticle matter-wave
  interferometry,” *Nature* 649, 866–870 (2026), DOI
  `10.1038/s41586-025-09917-9`; observed interference above 170 kDa supplies
  a high-mass spatial-superposition benchmark, not DP, Casimir-DP, or a
  universal preparation limit.
- C. Martí Farràs et al., “Numerical evaluation of Casimir forces using the
  discontinuous Galerkin time-domain method,” arXiv:2603.03888 (2026); a current
  finite-temperature Maxwell-stress/finite-geometry method target. It is not
  represented by the present planar solver or PFA row.
- S. Kryhin and V. Sudhir, “Distinguishable Consequence of Classical Gravity on
  Quantum Matter,” *Physical Review Letters* 134, 061501 (2025), DOI
  `10.1103/PhysRevLett.134.061501`; motivates phase and cross-correlation
  observables that can distinguish dynamics from naive decoherence, without
  supplying a Casimir-to-DP bridge.
- S. Donadi et al., “Underground test of gravity-related wave function
  collapse,” *Nature Physics* 17, 74–78 (2021), DOI
  `10.1038/s41567-020-1008-4`; constrains the natural parameter-free DP
  prescription and its radiation signature, not Penrose OR generally or all
  regularized, colored, non-Markovian, or dissipative variants.
- K. Hornberger et al., *Physical Review Letters* 90, 160401 (2003), DOI
  `10.1103/PhysRevLett.90.160401`; supports pressure- and
  collision-dependent matter-wave decoherence, not objective collapse.
- L. Hackermüller et al., *Nature* 427, 711–714 (2004), DOI
  `10.1038/nature02276`; supports thermal-emission decoherence in heated
  molecular interferometry, not silica-nanoparticle thermometry or
  boundary-modified emission.
- J. Schäfer, B. A. Stickler, and K. Hornberger, *Physical Review Research* 6,
  043307 (2024), DOI `10.1103/PhysRevResearch.6.043307`; supports a free-space
  emission master equation for quasi-equilibrated dielectric rigid bodies, not
  a measured thermometer or cavity-modified emission law.
- J. L. Garrett, J. Kim, and J. N. Munday, *Physical Review Research* 2, 023355
  (2020), DOI `10.1103/PhysRevResearch.2.023355`; supports
  Kelvin-probe-informed patch-force estimation in a sphere–plate Casimir
  apparatus, not a stochastic patch-noise coherence kernel.
- Y.-B. Yang et al., *Physical Review Letters* 121, 212001 (2018), DOI
  `10.1103/PhysRevLett.121.212001`; supports a scheme- and scale-specified
  lattice-QCD proton energy–momentum decomposition, not treating individual QCD
  terms as DP sources or deriving silica density.
- C. Rembold et al., *New Journal of Physics* 19, 033009 (2017), DOI
  `10.1088/1367-2630/aa60a1`; supports vibration-noise transfer and recovery
  methods for matter-wave interferometry, not DP or a Casimir bridge.
- G. Cowan et al., *European Physical Journal C* 71, 1554 (2011), DOI
  `10.1140/epjc/s10052-011-1554-0`; supports profile-likelihood, power, and
  asymptotic-method definitions, not their validity without simulation
  coverage or a physical DP model.
- PSI nEDM Collaboration, *European Physical Journal A* 57, 152 (2021), DOI
  `10.1140/epja/s10050-021-00456-1`; supplies an implemented physics-analysis
  blinding precedent, not proof that this campaign's custody protocol is
  sufficient and not a DP claim.
- J. Juárez-Aubry, B. Kay, and D. Sudarsky, "Generally covariant dynamical
  reduction models and the Hadamard condition," *Physical Review D* 97,
  025010 (2018), DOI `10.1103/PhysRevD.97.025010`; supplies requirements for a
  covariant reduction architecture, not a completed cosmological DP model.
- T. Josset, A. Perez, and D. Sudarsky, "Dark Energy from Violation of Energy
  Conservation," *Physical Review Letters* 118, 021102 (2017), DOI
  `10.1103/PhysRevLett.118.021102`; supplies one conditional unimodular model
  class, not a dark-energy consequence of standard DP.
- E. Aprile et al. (XENON Collaboration), “Challenging Spontaneous Quantum
  Collapse with the XENONnT Dark Matter Detector,” *Physical Review Letters*
  136, 120201 (2026), DOI `10.1103/2jm3-4976`; supplies the applicable lower
  \(r_0\) bound/no-excess result for the tested Markovian white-noise
  spontaneous-radiation implementation, not a generic exclusion of Penrose OR
  or colored, dissipative, or non-Markovian DP.
- M. H. J. de Jong et al., “Measurement of a strong nonlinear force between
  superconductors compatible with the Casimir force,” *Nature Communications*
  (2026), DOI `10.1038/s41467-026-75261-9`; included as current experimental
  context, with the authors' “compatible with” qualification preserved.

## 14. Repository evidence map

- `docs/research/casimir-dp-quantum-foam-study.equation-actions.source.json`
- `docs/research/casimir-dp-quantum-foam-study.equation-actions.json`
- `shared/theory/casimir-dp-study-theory-badges.ts`
- `shared/theory/__tests__/casimir-dp-study-theory-badges.spec.ts`
- `client/src/lib/docs/__tests__/docEquationActions.spec.ts`
- `shared/theory/casimir-cavity-theory-badges.ts`
- `shared/theory/curvature-collapse-theory-badges.ts`
- `shared/dp-collapse.ts`
- `docs/DP_COLLAPSE_DERIVATION.md`
- `docs/knowledge/physics/casimir-force-energy.md`
- `docs/knowledge/physics/diosi-penrose-timescale.md`
- `docs/research/study-full-solve-template.md`
- `configs/research/casimir-dp-quantum-foam-study.v1.json`
- `scripts/research/run-casimir-dp-quantum-foam-study.ts`
- `shared/contracts/casimir-dp-experiment-design.v1.ts`
- `configs/research/casimir-dp-experiment-design.v1.json`
- `scripts/research/run-casimir-dp-experiment-design.ts`
- `docs/research/casimir-dp-experiment-design-report.md`
- `shared/casimir-lifshitz.ts`
- `shared/casimir-dp-inference.ts`
- `shared/contracts/casimir-dp-next-computations.v1.ts`
- `configs/research/casimir-dp-next-computations.v1.json`
- `scripts/research/run-casimir-dp-next-computations.ts`
- `docs/research/casimir-dp-next-computations-report.md`
- `shared/casimir-optical-response.ts`
- `shared/casimir-dp-data-readiness.ts`
- `shared/contracts/casimir-dp-data-readiness.v1.ts`
- `configs/research/casimir-dp-data-readiness.v1.json`
- `scripts/research/run-casimir-dp-data-readiness.ts`
- `docs/research/casimir-dp-data-readiness-report.md`
- `shared/casimir-dp-proposal-readiness.ts`
- `shared/contracts/casimir-dp-proposal-closure.v1.ts`
- `configs/research/casimir-dp-proposal-closure.v1.json`
- `scripts/research/run-casimir-dp-proposal-closure.ts`
- `docs/research/casimir-dp-experiment-proposal.md`
- `docs/research/casimir-dp-proposal-closure-report.md`
- `tests/casimir-dp-proposal-closure.spec.ts`
- `shared/casimir-dp-phase-coherence.ts`
- `shared/casimir-dp-or-phase-stage2.ts`
- `shared/contracts/casimir-dp-or-phase-stage2.v1.ts`
- `configs/research/casimir-dp-or-phase-stage2.v1.json`
- `scripts/research/run-casimir-dp-or-phase-stage2.ts`
- `docs/research/casimir-dp-or-phase-stage2-report.md`
- `tests/casimir-dp-phase-coherence.spec.ts`
- `tests/casimir-dp-or-phase-stage2.spec.ts`
- `configs/research/casimir-dp-stage3-authorities.v1.json`
- `configs/research/casimir-dp-evidence-map-stage3.v1.json`
- `configs/research/fixtures/casimir-dp-stage3-*.synthetic.v1.json`
- `shared/contracts/casimir-dp-evidence-map-stage3.v1.ts`
- `shared/casimir-dp-complex-coherence.ts`
- `shared/casimir-dp-qed-green-noise.ts`
- `shared/casimir-dp-dp-companion.ts`
- `shared/casimir-dp-gravity-upper-bound.ts`
- `shared/casimir-dp-model-comparison.ts`
- `shared/casimir-dp-manifold-kernel-registry.ts`
- `shared/casimir-dp-evidence-map-stage3.ts`
- `scripts/research/run-casimir-dp-evidence-map-stage3.ts`
- `docs/research/casimir-dp-evidence-map-stage3-report.md`
- `docs/research/casimir-dp-evidence-map-stage3-verification-receipt.json`
- `reports/vitest-stage3.json`
- `tests/casimir-dp-complex-coherence.spec.ts`
- `tests/casimir-dp-qed-green-noise.spec.ts`
- `tests/casimir-dp-dp-companion.spec.ts`
- `tests/casimir-dp-gravity-upper-bound.spec.ts`
- `tests/casimir-dp-model-comparison.spec.ts`
- `tests/casimir-dp-manifold-kernel-registry.spec.ts`
- `tests/casimir-dp-evidence-map-stage3.spec.ts`
- `artifacts/research/casimir-dp-evidence-map-stage3/casimir-dp-evidence-map-stage3-v1-20260725T134544Z/`
- `configs/research/casimir-dp-stage4-authorities.v1.json`
- `configs/research/casimir-dp-polarization-congruence-stage4.v1.json`
- `configs/research/fixtures/casimir-dp-stage4-polarization.synthetic.v1.json`
- `configs/research/fixtures/casimir-dp-stage4-thermal.synthetic.v1.json`
- `configs/research/fixtures/casimir-dp-stage4-congruence.synthetic.v1.json`
- `shared/contracts/casimir-dp-polarization-congruence-stage4.v1.ts`
- `shared/casimir-dp-polarization-qed-control.ts`
- `shared/casimir-dp-radiative-thermal-closure.ts`
- `shared/casimir-dp-tensor-dimensional-congruence.ts`
- `shared/casimir-dp-polarization-congruence-stage4.ts`
- `scripts/research/run-casimir-dp-polarization-congruence-stage4.ts`
- `docs/research/casimir-dp-polarization-congruence-stage4-report.md`
- `docs/research/casimir-dp-polarization-congruence-stage4-verification-receipt.json`
- `tests/casimir-dp-polarization-qed-control.spec.ts`
- `tests/casimir-dp-radiative-thermal-closure.spec.ts`
- `tests/casimir-dp-tensor-dimensional-congruence.spec.ts`
- `tests/casimir-dp-polarization-congruence-stage4.spec.ts`
- `artifacts/research/casimir-dp-polarization-congruence-stage4/casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z/`
- `docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-plan.md`
- `configs/research/casimir-dp-stage4-2b-authorities.v1.json`
- `configs/research/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json`
- `configs/research/fixtures/casimir-dp-stage4-2b-campaign.synthetic.v1.json`
- `shared/contracts/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.ts`
- `shared/casimir-dp-apparatus-scale-transport-stage4-2b.ts`
- `shared/casimir-dp-apparatus-spectral-thermometry-stage4-2b.ts`
- `shared/casimir-dp-apparatus-response-covariance-stage4-2b.ts`
- `shared/casimir-dp-dp-scaling-forecast-stage4-2b.ts`
- `shared/casimir-dp-apparatus-coherence-residual-stage4-2b.ts`
- `shared/casimir-dp-apparatus-identifiability-stage4-2b.ts`
- `scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts`
- `docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-report.md`
- `docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-verification-receipt.json`
- `tests/casimir-dp-apparatus-scale-transport-stage4-2b.spec.ts`
- `tests/casimir-dp-apparatus-spectral-thermometry-stage4-2b.spec.ts`
- `tests/casimir-dp-apparatus-response-covariance-stage4-2b.spec.ts`
- `tests/casimir-dp-dp-scaling-forecast-stage4-2b.spec.ts`
- `tests/casimir-dp-apparatus-coherence-residual-stage4-2b.spec.ts`
- `tests/casimir-dp-apparatus-identifiability-stage4-2b.spec.ts`
- `tests/casimir-dp-stage4-2b-contract.spec.ts`
- `tests/casimir-dp-stage4-2b-campaign.spec.ts`
- `artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/`
- `configs/physics-root-leaf-manifest.v1.json`

## Appendix A. Equation-to-artifact and equation-to-claim map

The equation-action source is hand-maintained; the generated sidecar binds the
exact equation text and section anchor from this paper. `calculator_ingest`
means scalar replay is permitted. `artifact_backed_theory_run` means the
workstation must open the named evidence/badge path rather than pretend that a
scalar calculator can reconstruct the required field, dataset, or provenance.

| Equation id | Workstation action | Runtime / evidence anchor | Maximum claim |
|---|---|---|---|
| `cdp-casimir-energy-per-area` | calculator ingest | base scaffold; `casimir.cavity.parallel_plate_energy_density` | ideal perfect-conductor reference only |
| `cdp-casimir-pressure` | calculator ingest | base scaffold; `casimir.cavity.parallel_plate_pressure` | ideal pressure reference only |
| `cdp-casimir-force-residual` | artifact-backed path | Lifshitz/material receipt, beyond-PFA gate, observable-separation badge | observed-minus-standard force residual; no DP identification |
| `cdp-dp-self-energy` | artifact-backed path | `shared/dp-collapse.ts`; mass-density branch and DP self-energy badges | branch-provenance-bounded DP diagnostic only |
| `cdp-dp-timescale` | calculator ingest | DP self-energy payload and `tau=hbar/Delta E_G` calculator path | rate/timescale replay only |
| `cdp-or-branch-geometry-context` | artifact-backed path | Penrose OR context, material-branch, and DP self-energy badges; Stage-2 notation crosswalk | conceptual branch-geometry and timescale context only; no covariant solution or Casimir coupling |
| `cdp-ambient-gravity-phase-control` | artifact-backed path | Stage-2 ambient-gravity/tilt runtime and decoherence-collapse gate | ordinary unitary phase and alignment control; not an OR rate |
| `cdp-compton-dp-frequency-identities` | artifact-backed path | Compton/DP/cavity frequency-separation badge and DP timescale badge | unit-safe frequency bookkeeping; no oscillator or resonance claim |
| `cdp-frequency-cavity-bridge-gate` | artifact-backed path | Compton/DP/cavity frequency-separation, manifold-response, and claim-boundary badges | blocks frequency-to-cavity inference while the transfer kernel is absent |
| `cdp-qed-scale-hierarchy-identities` | artifact-backed path | Stage-4.1 QED scale-hierarchy calibration, energy-frequency context, and claim boundary | source-backed identity, namespace, and covariance calibration only; no physical oscillator, Casimir, DP, collapse, or manifold claim |
| `cdp-qed-hydrogen-reduced-mass-boundary` | artifact-backed path | Stage-4.1 QED scale-hierarchy calibration and atomic electronic-level context | leading reduced-mass recovery with an explicit precision-correction ledger; no spectroscopy-to-cavity or collapse bridge |
| `cdp-dp-boundary-null` | artifact-backed path | named DP manifest, complete-joint-system equivalence receipt, fixed-branch null, and manifold-response hypothesis badge | conditional identity only for the registered nonrelativistic Markovian mass-density DP generator with exact parameters, smearing, trajectories, and measured-preparation equivalence; no generic Penrose/DP or Casimir bridge |
| `cdp-semiclassical-curvature-baseline` | artifact-backed path | manifold-response, decoherence gate, and claim-boundary badges | formal semiclassical baseline only |
| `cdp-boundary-stress-difference` | artifact-backed path | measured Lifshitz/material receipt plus observable-separation gate | candidate QFT input; not curvature or collapse by itself |
| `cdp-coherence-rate-residual` | artifact-backed path | data-readiness and decoherence-collapse gates | boundary-conditioned residual only |
| `cdp-interferometric-phase-visibility-readout` | artifact-backed path | Stage-2 phase/coherence runtime and decoherence-collapse gate | phase, visibility, and constructive/destructive port prediction; no collapse attribution |
| `cdp-manifold-response-slot` | artifact-backed path | manifold-response hypothesis and both bridge/identifiability gates | noncomputable placeholder while causal dynamics are missing |
| `cdp-quantum-foam-response-slot` | artifact-backed path | quantum-foam hypothesis, observable gate, claim boundary | unregistered hypothesis family only |
| `cdp-stage1-lifshitz-free-energy` | artifact-backed path | Stage-1 computations report and material receipt badge | reduced-order equilibrium planar diagnostic |
| `cdp-accessible-rate-ratio` | artifact-backed path | experiment-design report and decoherence gate | engineering/rate-gap screening only |
| `cdp-data-readiness-kramers-kronig` | artifact-backed path | optical-response module and data-readiness report | numerical-transform validation; no measured material response |
| `cdp-data-readiness-correlation-power` | artifact-backed path | data-readiness preregistration and covariance sidecars | nuisance/discriminator-channel sizing only |
| `cdp-proposal-phase-force-bound` | artifact-backed path | proposal-closure report and proposal badge | high-risk commissioning requirement only |
| `cdp-stage3-composite-null` | artifact-backed path | Stage-3 model-comparison runtime and evidence-map badge | additive ordinary-physics baseline; no automatic physical closure |
| `cdp-stage3-complex-coherence` | artifact-backed path | Stage-3 complex-coherence runtime and discriminator badge | phase/visibility recovery and identifiability diagnostic only |
| `cdp-stage3-complete-apparatus-mass` | artifact-backed path | Stage-3 complete-apparatus gravity ledger and upper-bound badge | signed scalar mass/weight bound; no tensor manifold response |
| `cdp-stage3-manifold-kernel-preflight` | artifact-backed path | Stage-3 manifold-kernel registry and bridge gate | registered schema preflight; no numerical bridge comparison or empirical validation |
| `cdp-stage4-transverse-polarization-completeness` | artifact-backed path | Stage-4 polarization-QED runtime and radiation-mode badges | two transverse photon polarizations and basis completeness; no new gravitational degree of freedom |
| `cdp-stage4-polarization-double-contrast` | artifact-backed path | Stage-4 matched-helicity/mirror prediction runtime | ordinary-QED polarization control; no collapse attribution |
| `cdp-stage4-planck-stefan-boltzmann-closure` | artifact-backed path | Stage-4 thermal/FDT runtime and radiation badges | thermal normalization and covariance control; no collapse bridge |
| `cdp-stage4-frequency-semantic-nonbridge` | artifact-backed path | Stage-4 congruence runtime and frequency-bridge gate | `same_dimension_not_connected` unless a sourced transfer kernel exists |
| `cdp-stage4-expanded-ordinary-null` | artifact-backed path | Stage-4 comparator/orchestrator and campaign badge | synthetic expanded-null predictions only; measured/collapse/manifold gates remain closed |
| `cdp-stage4-2b-spectral-thermometry-forward-model` | artifact-backed path | Stage-4.2B Runtime B and apparatus-residual badge | response-corrected synthetic thermometry forward model only; no measured temperature, blackbody identity, or collapse evidence |
| `cdp-stage4-2b-sensor-self-noise-forward-model` | artifact-backed path | Stage-4.2B Runtime C and apparatus-residual badge | physical/sensor-noise separation and cross-spectral covariance contract only |
| `cdp-stage4-2b-ordinary-coherence-exponent` | artifact-backed path | Stage-4.2B Runtime C ordinary-physics registry | synthetic ordinary phase/decoherence prediction only; no objective-collapse attribution |
| `cdp-stage4-2b-residual-covariance` | artifact-backed path | Stage-4.2B Runtime E pilot-frozen likelihood and covariance receipts | full residual-covariance propagation and fail-closed factorization only |
| `cdp-stage4-2b-joint-complex-residual` | artifact-backed path | Stage-4.2B Runtime E raw-complex/log-domain comparator | coverage-qualified synthetic residual scoring only; no measured anomaly |
| `cdp-stage4-2b-frozen-dp-scaling` | artifact-backed path | Stage-4.2B Runtime D named manifest, branch ledger, companion, and external-bound map | frozen regularized DP mass/separation/time forecast only; no Casimir modifier or DP evidence |
| `cdp-stage4-2b-identifiability-power-gate` | artifact-backed path | Stage-4.2B Runtime F signature/covariance space and apparatus no-go receipt | `signature_not_identifiable`; required windows/power withheld and no DP region excluded |
| `cdp-observable-separation-gate` | artifact-backed path | protocol, observable-separation, and claim-boundary badges | blocks any Casimir-residual-to-DP promotion |
| `cdp-decoherence-collapse-gate` | artifact-backed path | decoherence, manifold-response, and claim-boundary badges | blocks objective-collapse identification |

Sidecar parity is exact for this revision: 41 paper markers, 41 source entries,
and 41 generated entries. The graph layer exposes 27 study badges connected by
79 dependency, requirement, documentation, and blocking edges. Those counts
are navigation-integrity evidence; they are not physical evidence.
