# An Identifiability-First Feasibility Protocol for a Gaussian-Regularized Diósi Collapse Test with a Casimir-Boundary Control

**Document type:** theoretical design study and empirical-feasibility protocol  
**Version:** referee-response draft, 30 July 2026  
**Authors and affiliations:** to be supplied before external submission  
**Corresponding author:** to be supplied before external submission

> **Scientific standing.** This article does not report measured evidence for
> objective collapse, a physically realized mesoscopic superposition, a
> Casimir-to-collapse coupling, or spacetime-manifold dynamics. It reports a
> model-specific, synthetic identifiability result and defines the measurements
> required to determine whether that result survives in hardware.

## Abstract

We present an identifiability-first protocol for testing one specified
collapse dynamics: the nondissipative, Gaussian-regularized Diósi
mass-density model applied to a single effective particle. Penrose objective
reduction supplies motivation for asking whether spatially distinct
mass-density branches have a finite lifetime; it does not supply the stochastic
master equation used for the forecast. A nearby conducting boundary is treated
as a secondary, independently controlled quantum-electrodynamic perturbation.
No Casimir variable enters the registered collapse generator.

The methodological result is a design progression. An initial synthetic
apparatus was rejected because its candidate collapse signature was nearly
collinear with modeled nuisance responses: the maximum covariance-whitened
signature cosine was 0.999977 and the normalized Gram condition number was
1.79×10^5. A bounded synthetic redesign reduced those nominal values to
0.7177 and 6.53. Under that same assumed response and covariance model, the
forecast power was 0.9979 and the nominal minimum was 542 paired windows.
These power values are not empirical and are not treated as robust until a
finite-pilot covariance and response-uncertainty campaign is completed.

The current reference manifest freezes a 276.3 nm-radius silica sphere with
mass 1.94385×10^-16 kg, branch separation 160 nm, 250 ms hold time, 1.2 μm
boundary gap, 4 K temperature, and 2×10^-11 Pa pressure. At the selected
regularization length R0=100 nm, the registered effective-particle model
predicts a conditional collapse rate of 0.0240 s^-1 and a DP-only visibility
loss of 0.598% at 250 ms. A separate 3.32% value belongs to a stronger
sensitivity-grid cell and is not the reference-apparatus prediction.

The proposal remains an empirical no-go until the stated mass can be prepared
in a verified spatial superposition, finite-geometry electromagnetic and
material responses are measured, the covariance model passes preregistered
stress tests, and an interpretation-eligible companion observable is
demonstrated. The contribution is therefore a falsifiable protocol and a
transparent map of its dominant failure modes, not evidence that objective
collapse occurs.

**Keywords:** objective collapse; Diósi model; Penrose objective reduction;
matter-wave coherence; Casimir boundary; identifiability; covariance
whitening; experimental design

## 1. Scientific question and result

The experiment asks a narrow question:

> After ordinary thermal, electromagnetic, gas, vibration, readout, and
> boundary-correlated responses have been measured, can the remaining complex
> coherence data support or exclude the frozen mass–separation–hold-time
> signature of one regularized Diósi model?

This question is intentionally narrower than “does gravity collapse the wave
function?” A null result can constrain only the registered generator and
parameter point within the experiment's demonstrated sensitivity. A positive
residual can be assigned to that generator only if it is identifiable against
the nuisance span and if the model's independently registered companion
prediction is observed. Neither outcome, by itself, establishes Penrose's
spacetime interpretation.

The present result is conditional:

1. a first synthetic design is non-identifiable and is rejected;
2. a bounded redesign is identifiable in its nominal synthetic world;
3. a single reference apparatus produces a 0.598% conditional DP-only
   coherence loss at 250 ms;
4. no measured response, covariance, state-preparation, or companion-detector
   receipt yet authorizes the acquisition-power forecast.

Figure 1 gives the proposed geometry. Figure 2 shows the acquisition sequence.

![Figure 1. Reference apparatus and observables.](figures/casimir-dp/apparatus-schematic.svg)

*Figure 1. The boundary is an electromagnetic control, not a term in the
registered Diósi generator. The two center-of-mass branches are separated
parallel to the boundary so that the nominal surface distance is common to both
branches. Environmental witnesses and a separate companion channel are required
for interpretation.*

![Figure 2. Preregistered timing and custody sequence.](figures/casimir-dp/timing-sequence.svg)

*Figure 2. Preparation and branch verification precede the blinded hold. Path
swap, echo, sham-switch, and detuned-boundary cells are randomized. Unblinding
is permitted only after exclusions, response vectors, covariance ancestry, and
analysis code are frozen.*

## 2. Exact tested dynamics

### 2.1 Registered Gaussian-regularized Diósi model

The executable prediction is not a generic “Diósi–Penrose” rate. It is one
named reduced-order implementation: a nondissipative Diósi mass-density master
equation for a single effective particle whose mass-density operator is
Gaussian-smeared over the physical length R0 [1–3]. In schematic form,

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2f-dp-master-model -->
\[
\frac{d\hat\rho}{dt}
=-\frac{i}{\hbar}[\hat H,\hat\rho]
-\frac{G}{2\hbar}
\int d^3x\,d^3y\,
\frac{[\hat M_{R_0}(\mathbf x),
[\hat M_{R_0}(\mathbf y),\hat\rho]]}
{|\mathbf x-\mathbf y|}.
\tag{1}
\]

The implementation freezes the convention, the mass representation, and R0.
For two branches of the same effective Gaussian particle, with mass m and
center separation d, the registered self-energy difference is

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2g-single-identity-dp -->
\[
E_G(m,d,R_0)=Gm^2\left[
\frac{1}{\sqrt{\pi}R_0}
-\frac{\operatorname{erf}(d/2R_0)}{d}
\right],
\qquad
\Gamma_{\rm D}=\frac{E_G}{\hbar},
\qquad
\mathcal V_{\rm D}(t)=e^{-\Gamma_{\rm D}t}.
\tag{2}
\]

The d→0 limit is evaluated analytically. A Fourier-space Simpson quadrature is
used only as a numerical cross-check; its softening parameter is not the
physical cutoff.

For the current reference point,

\[
\begin{aligned}
m &=1.94385\times10^{-16}\ {\rm kg},\\
d &=1.60\times10^{-7}\ {\rm m},\\
R_0&=1.00\times10^{-7}\ {\rm m},\\
E_G&=2.53142\times10^{-36}\ {\rm J},\\
\Gamma_{\rm D}&=2.40042\times10^{-2}\ {\rm s^{-1}},\\
\tau_{\rm D}&=41.6594\ {\rm s}.
\end{aligned}
\tag{3}
\]

At t=0.25 s,

\[
1-\mathcal V_{\rm D}
=1-e^{-\Gamma_{\rm D}t}
=5.98308\times10^{-3}
=0.598308\%.
\tag{4}
\]

This is the only headline coherence-loss forecast for the authoritative
apparatus. The 3.32% loss reported in the development record belongs to the
strongest transported sensitivity-grid cell, where
\(\Gamma_{\rm D}=0.134872\ {\rm s^{-1}}\) at the same hold time. It is a
different point, not a second estimate of Eq. (4).

### 2.2 Penrose OR motivation, notation, and scope

Penrose's objective-reduction argument motivates an order-of-magnitude lifetime
\(\tau_{\rm OR}\sim\hbar/E_G\) for incompatible mass distributions [4,5].
That heuristic and Eq. (2) share a gravitational self-energy scale, but they
are not the same theory object:

| Question | Penrose OR motivation | Registered Diósi runtime |
|---|---|---|
| Why consider finite branch lifetime? | incompatibility of alternative spacetime geometries | not supplied |
| Numerical lifetime scale | \(\tau\sim\hbar/E_G\) | \(\Gamma=E_G/\hbar\) |
| Stochastic master equation | not uniquely specified | specified |
| Gaussian cutoff R0 | not fixed by OR | frozen at 100 nm |
| Diffusion/heating companion | not uniquely specified | specified |
| Casimir-boundary modifier | not supplied | absent |

Consequently, an exclusion of Eq. (2) is not an exclusion of every
Penrose-motivated theory. A match to Eq. (2) is not direct evidence for
spacetime “snapping” or manifold instability.

### 2.3 Mass-density representation is part of the hypothesis

The reference object's geometric radius is 276.3 nm, but Eq. (2) treats its
center of mass as one Gaussian-smeared effective particle. This is not
equivalent to resolving the silica sphere's atomic or layered density. The
current representation audit is:

| Representation of the same apparatus | Current standing | Consequence |
|---|---|---|
| single effective Gaussian particle | executable; Eq. (2) | 0.598% reference forecast |
| homogeneous rigid sphere | previous spatial calculation failed the registered convergence gate | no accepted comparative rate |
| coated or layered sphere | not computed | coating dependence unknown |
| coarse-grained internal density | not computed with admissible density provenance | granularity dependence unknown |
| R0 sweep with converged representations | sensitivity-only calculations exist; no unified robustness receipt | parameter stability unresolved |

Therefore this article proposes a test of the effective-particle Diósi model,
not a representation-independent or generic DP test. A revised confirmatory
analysis must either demonstrate stability across physically defensible mass
representations or preserve that narrower claim in its title and conclusion.

## 3. Current Authoritative Apparatus Manifest

The following manifest supersedes all earlier candidate geometries in the
development record.

| Field | Authoritative value | Evidence role |
|---|---:|---|
| identity | `silica_high_mass_identifiable_single_object_v1` | frozen design identity |
| material and geometry | silica sphere | design assumption |
| radius | 276.302 nm | derived from frozen mass/material identity |
| mass | 1.94385×10^-16 kg = 1.17061×10^11 Da | frozen model input |
| branch separation | 160 nm, parallel to boundary | frozen model input |
| principal hold time | 250 ms | frozen model input |
| hold-time requirement | include preregistered shorter and longer cells | identifiability check |
| nominal surface gap | 1.2 μm, common to both branches | boundary-control input |
| boundary program | static randomized cells; nominal cadence label 0.5 Hz | transfer function unmeasured |
| primary sequence | Ramsey-type branch preparation/recombination | design assumption |
| control sequences | echo, path swap, sham switch, detuned boundary | required nuisance discrimination |
| temperature | 4 K | design target, unmeasured in integrated apparatus |
| pressure | 2×10^-11 Pa | design target, unmeasured in integrated apparatus |
| vibration target | 5×10^-10 m s^-2 Hz^-1/2 | design target |
| readout | 1550 nm, 5 nW nominal | design assumption |
| polarization | circular-control pair plus linear-basis checks | electromagnetic witness |
| companion channel | center-of-mass energy increase | detector authority absent |
| settling rule | to be measured and frozen from transfer-function data | not inherited from old design |

The “0.5 Hz” value is a configuration label, not permission to assume that a
two-second cycle is quasistatic. No continuous modulation or ten-second
settling rule is admitted until the measured boundary-to-apparatus transfer
function defines a compatible sequence. Static randomized cells are the
default pilot implementation.

### 3.1 Supersession ancestry

| Design record | Geometry | Status |
|---|---|---|
| original symmetric-force candidate | early Casimir-force-centered architecture | `superseded_design_record` |
| proposal-closure architecture | 75 nm radius, 20 nm separation, 0.1 s, 5 μm nominal gap, 10–4 μm commissioning ladder | `superseded_design_record` |
| synthetic identifiability candidate | high-mass parameter-search result | parent of current manifest |
| present reference manifest | 276.3 nm radius, 160 nm separation, 0.25 s, 1.2 μm gap | `current_authoritative_design_assumption` |

“Frozen” means immutable within a particular run. It does not mean that an
older run remains the current proposal after an explicit downstream
supersession.

### 3.2 The dominant scale gap

The reference mass is approximately \(1.17\times10^{11}\) Da. Matter-wave
interference has recently been demonstrated for sodium clusters above
170,000 Da [6]. The proposed object is therefore about
\(6.89\times10^5\) times more massive than that free-particle interference
benchmark. The comparison is not a universal impossibility theorem—trapped
mechanical systems use different state-preparation strategies—but it prevents
the manuscript from treating preparation as an ordinary checklist item.

State preparation is the first physical go/no-go:

1. verify the object's mass and internal-state distribution;
2. demonstrate coherent branch preparation at the registered separation;
3. verify the 250 ms branch hold without conditioning on successful
   recombination;
4. measure visibility and phase stability over the full control schedule;
5. show that the preparation procedure does not itself generate the fitted
   nuisance signature.

Until these steps are demonstrated, neither 542 nor 1,600 paired windows is an
actionable acquisition duration.

## 4. Hypotheses separated before data

![Figure 3. Hypothesis separation and claim ceilings.](figures/casimir-dp/hypothesis-graph.svg)

*Figure 3. The ordinary-physics null, the frozen effective-particle Diósi
generator, and a possible boundary-to-collapse extension are separate
hypotheses. A Casimir-correlated residual cannot move from the left branch to
the right branch without a registered transfer kernel and new data.*

### 4.1 Ordinary-physics null, H0

H0 contains all registered ordinary mechanisms that can alter complex
coherence:

- blackbody emission, absorption, scattering, and temperature drift;
- residual-gas collision and recoil;
- patch potentials, charge, dielectric response, and electromagnetic forces;
- vibration, tilt, support motion, and clock error;
- optical back-action, detector self-noise, and analysis leakage;
- boundary switching, material hysteresis, and finite-geometry Casimir/QED
  response.

The nuisance model is empirical. Textbook formulas provide priors and
dimensional checks, not a substitute for measured response vectors.

### 4.2 Frozen Diósi hypothesis, HD

HD adds Eq. (2) to H0 with the mass, separation, R0, and hold-time law frozen
before confirmatory data. The Casimir gap and modulation state do not enter the
collapse generator. Under complete joint-system equivalence, standard HD
therefore predicts the same collapse term in boundary-active and
boundary-reference cells.

### 4.3 Lane C: boundary-conditioned extension, HB

HB is a future model slot in which a Casimir boundary changes collapse or
coherence through an explicitly sourced transfer kernel. No such kernel is
registered. The ideal Casimir energy,

<!-- helix-doc-equation-action/v1 id=cdp-casimir-energy-per-area -->
\[
\frac{E_{\rm C}}{A}=-\frac{\pi^2\hbar c}{720a^3},
\qquad
P_{\rm C}=-\frac{\pi^2\hbar c}{240a^4},
\tag{5}
\]

does not define a map from plate gap a to \(\Gamma_{\rm D}\). Real-material
Lifshitz theory, finite geometry, temperature, patches, roughness, and
nonequilibrium response belong first in H0.

### 4.4 Manifold-response hypothesis

The motivating manifold statement is a research question, not an admitted
mechanism: if alternative mass configurations source incompatible
gravitational geometries, a collapse-like lifetime might scale with a
gravitational self-energy. The present nonrelativistic master equation tests
one phenomenological realization of that scale. A spacetime claim would
additionally require a covariant source, a complete apparatus stress-energy
tensor, a specified dynamical metric response, and a causal observable. Those
objects are absent.

### 4.5 Compton-frequency non-bridge

Rest energy may be written as a frequency,
\(\nu_{\rm C}=mc^2/h\), and the collapse energy as
\(\nu_G=E_G/h\). Atomic, QED, Higgs, blackbody, Zeeman, Stark, Maxwell, and
gravitational benchmarks use compatible energy and frequency units. That
compatibility is valuable for calibration and unit recovery but does not
create a coupling between cavity modes and collapse:

<!-- helix-doc-equation-action/v1 id=cdp-frequency-cavity-bridge-gate -->
\[
\mathcal K_{\mathrm{boundary}\rightarrow
\mathrm{branch/coherence}}\quad\text{is not registered}.
\tag{6}
\]

The same rule applies to light cones, spinors, gravitational waves, Jeans
instability, Schwarzschild radii, and mass–energy equivalence. They validate
parts of relativistic or quantum notation; they do not supply Eq. (6).

## 5. Complex-coherence estimator and identifiability

The primary datum is not a fitted scalar decay constant. Each control cell
contributes a complex coherence,

\[
C_k=\langle e^{i\phi}\rangle_k
=\operatorname{Re}C_k+i\,\operatorname{Im}C_k.
\tag{7}
\]

Real and imaginary components retain phase rotations that a visibility-only
analysis would discard. Let y be the stacked real vector of all components,
X the matrix of registered nuisance signatures, sD the frozen Diósi signature,
and Σ the block covariance. Whitening gives

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2c-control-response-whitening -->
\[
\tilde y=L^{-1}y,\qquad
\tilde X=L^{-1}X,\qquad
\tilde s_{\rm D}=L^{-1}s_{\rm D},
\qquad LL^{\mathsf T}=\Sigma.
\tag{8}
\]

The collapse-sensitive component is the part orthogonal to the whitened
nuisance span:

\[
s_\perp=(I-P_{\tilde X})\tilde s_{\rm D}.
\tag{9}
\]

The preregistered nominal design gates are

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2c-identifiability-power-gates -->
\[
\max_j|\cos(\tilde s_{\rm D},\tilde x_j)|\le0.97,\quad
\kappa(G_{\rm norm})\le100,\quad
\mathrm{power}\ge0.80,\quad
\mathrm{FPR}\le0.05.
\tag{10}
\]

These are design-admission gates, not proof that the modeled nuisance set is
complete.

### 5.1 Rejected design

The initial synthetic design produced

| Diagnostic | Result | Gate |
|---|---:|---|
| maximum absolute whitened cosine | 0.999977 | fail |
| normalized Gram condition number | 179,104 | fail |
| acquisition power | withheld | not meaningful |

The correct result was an apparatus-design no-go. It was not a null result on
the Diósi model.

### 5.2 Nominal synthetic redesign

The bounded redesign produced

| Diagnostic | Nominal synthetic value | Gate |
|---|---:|---|
| maximum absolute whitened cosine | 0.717724 | pass |
| normalized Gram condition number | 6.53169 | pass |
| forecast power | 0.997858 | pass in nominal world |
| nominal required paired windows | 542 | descriptive only |
| planned paired windows | 1,600 | not yet authorized |

![Figure 4. Identifiability progression.](figures/casimir-dp/identifiability-geometry.svg)

*Figure 4. The first design's candidate direction lies almost inside the
nuisance span. The redesign is separated in the nominal whitened geometry.
The right panel is still conditional on synthetic response vectors and an
assumed covariance.*

### 5.3 Why the nominal power is not the headline

The same synthetic response/covariance world was used to search candidates and
evaluate the selected candidate. Finite-pilot covariance uncertainty was not
propagated. Accordingly, 0.997858 is a conditional calculation, not a robust
power claim. The next computation must report an envelope rather than a single
number.

The preregistered stress family must include:

| Stress axis | Required analysis | Current status |
|---|---|---|
| finite-pilot covariance | nested simulation, bootstrap, or analytical propagation | not run |
| shrinkage/regularization | repeat whitening across declared estimators | not run |
| drift and non-Gaussian tails | correlated drift and heavy-tail worlds | not run |
| response amplitude/phase error | perturb every nuisance vector within pilot uncertainty | not run |
| missing nuisance | inject unregistered channels and test residual inflation | not run |
| branch and hold-time jitter | propagate preparation/metrology distributions | not run |
| shared calibration ancestry | model cross-control correlation explicitly | partially represented, not stressed |
| leave-one-control-out | refit after withholding each control family | not run |
| covariance structure | alternate preregistered block families | not run |
| selection optimism | repeat candidate search in independent synthetic worlds | not run |

The accepted future headline has the form: “Across the registered uncertainty
family, power ranged from X to Y and all design gates survived in Z% of worlds.”
Until X, Y, and Z are computed, the acquisition-power claim remains
provisional.

## 6. External constraints and scientific reach

The selected R0=100 nm point must be compared with constraints on the same
model convention. Direct spontaneous-radiation searches currently provide a
strong lower-bound axis for Markovian DP. The 2026 XENONnT analysis reports
\(R_0>4.9\times10^{-10}\) m at 90% confidence and
\(R_0>4.5\times10^{-10}\) m at 95% confidence in its stated Diósi convention
[7]. Earlier germanium searches ruled out the natural parameter-free proposal
and progressively strengthened the lower limit [8,9].

The selected \(R_0=1.0\times10^{-7}\) m is about 204 times the XENONnT
90%-confidence lower bound. It is therefore not excluded by that one-sided
screening comparison. This is not yet a full admission receipt: the
mass-density smearing definition, normalization convention, charged-constituent
radiation map, and treatment of the effective composite particle must be
matched line by line before the point is called externally allowed.

![Figure 5. External-bound screening and selected point.](figures/casimir-dp/constraint-screen.svg)

*Figure 5. Logarithmic R0 screening. The XENONnT lower bound and the selected
100 nm point are shown on the same numerical axis. The shaded “apparatus”
marker is conditional sensitivity, not a measured exclusion. The formal
model-equivalence audit remains open.*

The current reach statement is therefore limited:

- a measured null with validated sensitivity could exclude the registered
  effective-particle point;
- it would not exclude all regularized, dissipative, colored-noise, or
  Penrose-motivated models;
- a positive coherence residual could favor the frozen line shape over the
  registered nuisance span;
- it could not distinguish neighboring collapse generators without additional
  parameter and companion observables;
- a boundary-correlated excess would first challenge H0 and the joint-system
  equivalence assumption, not prove HB.

## 7. Final reference-apparatus forecast

Figure 6 shows the conditional coherence curve from Eq. (2). It contains no
ordinary-decoherence band because that band must be learned from pilot data.

![Figure 6. Conditional Diósi-only coherence forecast.](figures/casimir-dp/coherence-forecast.svg)

*Figure 6. The authoritative reference curve reaches a 0.598% loss at 250 ms.
The sensitivity-grid curve reaches 3.32% and is shown only to prevent those
predictions from being conflated. Neither curve is a total visibility
forecast.*

### 7.1 Companion observable and interpretation ceiling

The same nondissipative generator predicts momentum diffusion

\[
D_{pp}=\frac{G\hbar m^2}{12\sqrt{\pi}R_0^3}
\tag{11}
\]

and a center-of-mass energy increase

\[
\dot E=\frac{3D_{pp}}{m}
=\frac{G\hbar m}{4\sqrt{\pi}R_0^3}.
\tag{12}
\]

For the reference manifest,
\(\dot E=1.92979\times10^{-40}\) W. If 100 independent samples and SNR≥5
were demanded, the algebraic maximum one-shot standard uncertainty would be

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2g-companion-threshold -->
\[
\sigma_{\dot E,\mathrm{one\ shot}}
\le \frac{\dot E\sqrt{100}}{5}
=3.85958\times10^{-40}\ {\rm W}.
\tag{13}
\]

Equation (13) is not an instrument model. No registered detector demonstrates
this bandwidth, calibration, independence, or noise floor. The companion
observable is therefore presently a structural no-go for the paper's strongest
positive interpretation.

This revision adopts the conservative third option:

> Unless an independently powered companion channel becomes feasible, a
> replicated DP-shaped coherence residual may be reported as unexplained
> model-consistent phenomenology, but not as support-eligible identification of
> the Diósi generator.

The project may replace the heating channel only through a preregistered
derivation from the same frozen dynamics, with an instrument-level bandwidth,
integration-time, noise, calibration-transfer, and cross-covariance model.

## 8. Empirical pilot and confirmatory decisions

### 8.1 Pilot first

The feasibility pilot is a hardware-characterization campaign, not a search for
collapse. It must deliver provenance-bound measurements of:

1. object mass, geometry, material, coating, and internal-density model;
2. state-preparation fidelity and branch separation;
3. hold-time and recombination metrology;
4. finite-geometry electromagnetic Green response and material permittivity;
5. boundary-switching transfer functions and settling time;
6. thermal, gas, vibration, tilt, patch, charge, optical, and sensor responses;
7. raw complex-coherence covariance, including shared calibration ancestry;
8. sham, detuned, echo, and path-swap controls;
9. companion-channel feasibility or the lower interpretation ceiling;
10. blinded data custody and independent solver replication.

### 8.2 Pilot admission rule

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2g-whitened-pilot-gates -->
\[
\mathcal G_{\rm pilot}=
\mathcal G_{\rm preparation}\land
\mathcal G_{\rm response}\land
\mathcal G_{\rm covariance}\land
\mathcal G_{\rm identifiability}\land
\mathcal G_{\rm power}\land
\mathcal G_{\rm custody}.
\tag{14}
\]

The pilot is admitted to confirmatory planning only if every factor is true.
The numerical identifiability gates remain Eq. (10), but power must additionally
survive the uncertainty envelope in Section 5.3. If any factor fails, the
result is an explicit apparatus-redesign no-go.

### 8.3 Confirmatory campaign

Only after pilot admission may the team freeze:

- one canonical apparatus identity;
- one mass-density representation and R0 point or preregistered grid;
- exclusions and quality-control rules;
- response and covariance ancestry;
- analysis code and randomization;
- companion interpretation ceiling;
- primary and replication sample sizes.

The confirmatory data remain blinded until completeness and custody checks
pass. An independent replication is required for any positive interpretation.

### 8.4 Decisive outcomes

| Observed outcome | Defensible inference | Not established |
|---|---|---|
| pilot cannot prepare the state | current apparatus infeasible | collapse model false |
| pilot fails cosine/conditioning gates | current design non-identifiable | collapse model false |
| measured null with demonstrated sensitivity | registered point disfavored/excluded at stated confidence | all DP or Penrose OR false |
| residual follows ordinary control | H0 response model repaired | collapse |
| boundary-correlated residual without transfer kernel | anomaly eligible for a new bridge study | Casimir-induced collapse |
| replicated Diósi-shaped coherence residual, no companion | unexplained model-consistent phenomenology | generator identified |
| replicated shape plus independent companion | tested generator gains support within registered alternatives | manifold dynamics or universal objective collapse |

## 9. Observable-separation gate

Force, phase, coherence, heating, curvature, and collapse rate are different
observables. They may be connected only by a declared model with units,
parameters, provenance, and falsifiers. The governing gate is:

<!-- helix-doc-equation-action/v1 id=cdp-observable-separation-gate -->
\[
\text{observable A}\rightarrow\text{observable B}
\quad\Longrightarrow\quad
\{\text{transfer law, units, source, parameters, test}\}.
\tag{15}
\]

Equation similarity, shared use of Planck's constant, or a common
energy-frequency conversion is insufficient. In particular:

- Casimir pressure is not DP self-energy;
- renormalized negative energy density is not automatically negative spacetime
  curvature for the complete apparatus;
- virtual-particle language is not a detector model;
- gravitational-wave interference does not imply phase coherence between
  Casimir and matter-wave channels;
- circular polarization is an electromagnetic control degree of freedom, not a
  collapse source;
- a light cone defines causal structure, not a nonrelativistic collapse
  generator.

## 10. Limitations

The main limitations are scientific, not typographic:

1. **State preparation:** the reference mass is nearly 690,000 times the
   170 kDa free-particle interference benchmark.
2. **Synthetic optimization:** the selected design was evaluated in the same
   assumed response/covariance world in which it was found.
3. **External-bound mapping:** the selected R0 passes a numerical lower-bound
   screen, but the exact convention/composite mapping is not certified.
4. **Mass representation:** the 0.598% prediction is specific to one effective
   Gaussian particle; rigid, layered, and coarse-grained comparisons are
   incomplete.
5. **Companion channel:** the heating signal lacks a physically credible
   detector receipt, lowering the maximum positive interpretation.
6. **Ordinary physics:** finite-geometry material and environmental responses
   are unmeasured for the integrated apparatus.
7. **Relativity:** the registered dynamics is nonrelativistic and does not
   compute manifold evolution.
8. **Boundary bridge:** no Casimir-to-collapse transfer kernel exists in the
   tested model.

The machine-readable status is equivalent to the following prose: measured
evidence is not yet available; empirical pilot readiness and physical
viability have not been established; collapse identification and manifold
dynamics remain blocked.

## 11. Discussion

### 11.1 What is new

The useful result is not that a sufficiently massive object has a large
collapse rate; that scaling is already built into the selected model. The
advance is the conversion of that rate into a fail-closed experimental
comparison. A candidate signal is expressed in the same complex-coherence
coordinates as the measured control responses, whitened by their joint
covariance, and tested for linear dependence before acquisition power is
reported. The rejected design demonstrates why this order matters. A nominally
nonzero loss can be statistically powerless as evidence when its direction is
indistinguishable from ordinary drift or decoherence.

This approach also changes what counts as a useful negative result. Failure to
prepare the state is an apparatus no-go. Failure of the cosine or conditioning
gate is an identifiability no-go. A measured null becomes a model constraint
only after the apparatus demonstrates sensitivity to the frozen direction.
These outcomes answer different questions and should not be combined into a
single “experiment failed” category.

### 11.2 Why retain the Casimir boundary

The Casimir boundary remains valuable even though it does not enter Eq. (2).
It creates a tunable electromagnetic and material environment with strong gap,
temperature, polarization, and surface dependence. That makes it an unusually
demanding test of whether the ordinary-physics null is complete. Sham switching,
detuning, static gap cells, path swaps, and polarization controls can reveal
phase rotations or losses that might otherwise be misidentified as a
mass-dependent collapse residual.

This use is scientifically asymmetric. Agreement with finite-geometry
macroscopic QED improves confidence in H0; disagreement produces a
boundary-response anomaly. Neither result modifies HD automatically. Only a
new, independently motivated transfer law could make the boundary a parameter
of a collapse generator. Keeping that bridge closed protects both sides of the
experiment: ordinary boundary physics is not mislabeled as gravity, and a
failure of the particular Diósi model is not mislabeled as a failure of Casimir
theory.

### 11.3 What a positive result would mean

A coherence residual with the registered mass, separation, and hold-time
dependence would be more informative than an unexplained scalar decay rate.
Replication across object masses and branch geometries would make an
ordinary single-channel explanation progressively less plausible. Even so, the
interpretation remains conditional on the alternative set. An unmodeled gas,
patch, readout, preparation, or calibration response can imitate a structured
signal if it shares the same experimental schedule.

The companion channel was intended to reduce that ambiguity by demanding a
second prediction from the same generator. Its forecast, however, is too small
to count as an experimental discriminator without a credible instrument
proposal. The present claim ceiling is therefore deliberately lower than the
original protocol's aspirational ceiling. A replicated coherence residual
without a companion would motivate new tests and model comparison; it would not
identify objective collapse. This is a scientific consequence of the detector
gap, not merely cautious wording.

### 11.4 What a null result would mean

At a demonstrated sensitivity, a null result can exclude the registered
effective-particle point. It cannot directly exclude a rigid-sphere
representation that was never converged, a different regularization length, a
dissipative or colored-noise theory, or Penrose's broader lifetime motivation.
The mass-density robustness campaign therefore determines how widely the null
may be interpreted. If several defensible representations predict comparable
losses and all are within reach, the experiment tests a family. If their
predictions diverge substantially, the representation itself becomes part of
the preregistered alternative set.

### 11.5 Priority order after this design study

The next scientific work should be ordered by the chance that it invalidates
the apparatus before costly acquisition:

1. demonstrate or reject state preparation at the registered mass, separation,
   and hold time;
2. complete the exact external-bound convention and composite-particle map;
3. measure finite-geometry material and boundary transfer functions;
4. obtain pilot response vectors and covariance;
5. run the registered robustness envelope and repeat candidate selection in
   independent synthetic worlds;
6. compare mass-density representations on a converged numerical grid;
7. either demonstrate a companion instrument or retain the lower
   interpretation ceiling;
8. only then freeze a blinded confirmatory campaign.

This sequence keeps the paper's methodological core useful even if the present
apparatus is rejected. The estimator, hypothesis separation, packet custody,
and design gates can be carried into a lower-mass or otherwise redesigned
platform without preserving the current sphere as a favored physical object.

## 12. Claim boundaries

This paper establishes:

- the exact model and parameter point used by the forecast;
- the failure of the first synthetic identifiability design;
- the nominal separability of a bounded redesign under stated assumptions;
- a single, unambiguous 0.598% reference-apparatus prediction;
- a fail-closed pilot and confirmatory decision structure;
- the empirical and computational work still required.

This paper does not establish:

- that the apparatus can be built or the state prepared;
- that the nominal power survives model uncertainty;
- that the selected point is fully admitted by all external constraints;
- that a Casimir boundary changes a collapse rate;
- that objective collapse occurs;
- that Penrose's geometric interpretation is observed;
- that spacetime manifold dynamics have been measured or simulated.

## 13. Conclusion

The strongest result is methodological. A scalar loss rate that is nearly
collinear with ordinary backgrounds is not an adequate collapse test. The
experiment must operate in raw complex-coherence space, measure the nuisance
responses and covariance, project the frozen candidate away from that span,
and fail closed when the geometry is ill-conditioned.

The current synthetic redesign satisfies nominal identifiability gates and
maps one effective-particle Diósi model to a 0.598% loss at 250 ms. That result
is scientifically useful because it identifies exactly what hardware would
need to resolve. It is not yet a physically viable proposal: the
state-preparation scale, response/covariance robustness, exact external-bound
mapping, mass-density dependence, and companion detector remain open.

The appropriate next action is therefore a measured feasibility pilot. If the
pilot reproduces the response geometry and survives the registered robustness
family, a blinded confirmatory campaign becomes justified. If it does not, the
apparatus is redesigned or rejected without converting an engineering failure
into a claim about nature.

## Publication declarations

**Author contributions.** To be completed by the human authors before
submission. Repository history records the provenance of calculations and
AI-assisted drafting; it does not determine scholarly authorship.

**Code and data availability.** The executable configurations, synthetic
fixtures, reports, tests, equation-action sidecars, and receipts are maintained
in the CasimirBot repository. The complete development record is preserved in
[the reproducibility supplement](casimir-dp-quantum-foam-study-reproducibility-supplement.md).
No measured experimental dataset is reported.

**Competing interests.** To be declared by the human authors before
submission.

**Acknowledgments.** To be completed before submission.

## References

1. L. Diósi, “A universal master equation for the gravitational violation of
   quantum mechanics,” *Physics Letters A* **120**, 377–381 (1987).
   https://doi.org/10.1016/0375-9601(87)90681-5
2. L. Diósi, “Models for universal reduction of macroscopic quantum
   fluctuations,” *Physical Review A* **40**, 1165–1174 (1989).
   https://doi.org/10.1103/PhysRevA.40.1165
3. A. Bassi, K. Lochan, S. Satin, T. P. Singh, and H. Ulbricht, “Models of
   wave-function collapse, underlying theories, and experimental tests,”
   *Reviews of Modern Physics* **85**, 471–527 (2013).
   https://doi.org/10.1103/RevModPhys.85.471
4. R. Penrose, “On gravity's role in quantum state reduction,” *General
   Relativity and Gravitation* **28**, 581–600 (1996).
   https://doi.org/10.1007/BF02105068
5. R. Penrose, *The Road to Reality* (Jonathan Cape, London, 2004), Chapter 30.
6. S. Pedalino *et al.*, “Probing quantum mechanics with nanoparticle
   matter-wave interferometry,” *Nature* **649**, 866–870 (2026).
   https://doi.org/10.1038/s41586-025-09917-9
7. E. Aprile *et al.* (XENON Collaboration), “Search for Spontaneous Radiation
   from Wave Function Collapse in the XENONnT Experiment,” *Physical Review
   Letters* **136**, 120201 (2026).
   https://doi.org/10.1103/2jm3-4976
8. S. Donadi *et al.*, “Underground test of gravity-related wave function
   collapse,” *Nature Physics* **17**, 74–78 (2021).
   https://doi.org/10.1038/s41567-020-1008-4
9. I. J. Arnquist *et al.* (Majorana Collaboration), “Search for Spontaneous
   Radiation from Wave Function Collapse,” *Physical Review Letters* **129**,
   080401 (2022); Erratum **130**, 239902 (2023).
   https://doi.org/10.1103/PhysRevLett.129.080401
10. M. Carlesso, S. Donadi, L. Ferialdi, M. Paternostro, H. Ulbricht, and
    A. Bassi, “Present status and future challenges of non-interferometric tests
    of collapse models,” *Nature Physics* **18**, 243–250 (2022).
    https://doi.org/10.1038/s41567-021-01489-5
11. H. B. G. Casimir, “On the attraction between two perfectly conducting
    plates,” *Proceedings of the Royal Netherlands Academy of Arts and
    Sciences* **51**, 793–795 (1948).
12. E. M. Lifshitz, “The theory of molecular attractive forces between solids,”
    *Soviet Physics JETP* **2**, 73–83 (1956).
13. M. Arndt and K. Hornberger, “Testing the limits of quantum mechanical
    superpositions,” *Nature Physics* **10**, 271–277 (2014).
    https://doi.org/10.1038/nphys2863
