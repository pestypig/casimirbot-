# An Identifiability-First Feasibility Protocol for a Gaussian-Regularized Diósi Collapse Test with a Casimir-Boundary Control

**Document type:** theoretical design study and empirical-feasibility protocol  
**Version:** leading-design draft, 6 August 2026
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

The methodological result is a design progression ending in a bounded leading
design. An initial synthetic apparatus was rejected because its candidate
collapse signature was nearly collinear with modeled nuisance responses. A
first bounded redesign established a usable covariance-whitened geometry, with
maximum signature cosine 0.7177 and normalized Gram condition number 6.53, but
its 0.9979 power and 542-window forecast belonged to that parent synthetic
world. A subsequent 200-candidate apparatus search retained the same whitened
geometry and frozen collapse law while applying mass-density, phase, gas,
preparation-scale, external-bound, power, and companion gates. Three candidates
survived. The leading candidate requires 1,028 paired windows and has forecast
power 0.927 at 1,600 windows. None of these power values is empirical.

A downstream synthetic diagnostic now makes the boundary question explicit:
a normalized four-cell complex cross-ratio tests boundary--branch
nonfactorization while canceling the boundary-independent registered Diósi
factor. Its null recovery and injected-signal tests pass, but no measured
branch-control, wave-packet, ordinary-response, or interaction data exist.

The leading design is now also bound to a material/Green/FDT ordinary-null
runtime. In its synthetic recovery fixture, the finite-geometry response gives
an electromagnetic phase of 0.0200 rad and an echo contraction exponent of
\(1.34\times10^{-6}\); zero-coupling, infinite-distance, detailed-balance,
Planck--Stefan--Boltzmann, and intervention-recovery gates pass. These are
software-recovery values, not apparatus forecasts: the specimen spectrum,
as-built geometry, full-Maxwell solution, independent solver check, and
measured response covariance remain absent.

A constituent and environmental diagnostic separates Hamiltonian phase from
nonunitary contraction and stress-tests the mass model. The leading synthetic
commissioning design uses a diamond-density 276.302 nm-radius sphere with mass
3.09251×10^-16 kg, 250 nm tangential branch separation, 250 ms hold time,
10 μm boundary gap, 4 K temperature, and 10^-15 Pa pressure. At the selected
regularization length R0=100 nm, the registered effective-particle model
predicts a conditional rate of 0.118046 s^-1 and 2.908% DP-only visibility
loss. Transporting the registered mass-density sensitivity envelope lowers the
design floor to 0.435%. The ordinary-background surrogates yield gas-to-DP
ratio 0.00732 and echoed phase uncertainty 1.11×10^-8 rad, but they remain
unmeasured. The design is therefore a commissioning target, not a physically
admitted apparatus.

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
2. a bounded parent redesign establishes a usable nominal whitened geometry;
3. three of 200 downstream configurations pass every transported synthetic
   gate;
4. the leading configuration predicts 2.908% effective-Gaussian loss and a
   0.435% conservative density-envelope loss at 250 ms;
5. its selected-candidate acquisition forecast is 1,028 paired windows and
   power 0.927 at 1,600 windows;
6. no measured response, covariance, state-preparation, or companion-detector
   receipt yet authorizes a physical pilot or confirmatory campaign.

Figure 1 gives the proposed geometry. Figure 2 shows the acquisition sequence.

![Figure 1. Leading commissioning apparatus and observables.](figures/casimir-dp/apparatus-schematic.svg)

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

For the leading synthetic commissioning point,

\[
\begin{aligned}
m &=3.0925053\times10^{-16}\ {\rm kg},\\
d &=2.50\times10^{-7}\ {\rm m},\\
R_0&=1.00\times10^{-7}\ {\rm m},\\
E_G&=1.2448784\times10^{-35}\ {\rm J},\\
\Gamma_{\rm D}&=1.1804586\times10^{-1}\ {\rm s^{-1}},\\
\tau_{\rm D}&=8.47128\ {\rm s}.
\end{aligned}
\tag{3}
\]

At t=0.25 s,

\[
1-\mathcal V_{\rm D}
=1-e^{-\Gamma_{\rm D}t}
=2.90803\times10^{-2}
=2.90803\%.
\tag{4}
\]

This is the registered effective-Gaussian forecast for the leading design. A
second value is required because the mass-density representation is not yet an
empirical authority. Transporting the Stage-4.2L representation envelope gives
an exponent of 0.00435852, or a conservative 0.434903% loss at the same hold
time. The paper therefore carries 2.90803% as the named-model prediction and
0.434903% as the design floor; neither is a total measured-visibility forecast.

#### 2.1.1 From Schrödinger evolution to the measured residual

The experiment does not measure \(E_G\) directly. It reconstructs the
off-diagonal center-of-mass coherence \(C(t)=\langle A|\hat\rho(t)|B\rangle\).
For two Hamiltonian energy eigenstates, ordinary Schrödinger evolution gives

\[
|\psi(t)\rangle
=c_1e^{-iE_1t/\hbar}|E_1\rangle
+c_2e^{-iE_2t/\hbar}|E_2\rangle,
\qquad
\rho_{12}(t)=c_1c_2^*e^{-i(E_1-E_2)t/\hbar}.
\]

Thus the beat frequency is \((E_1-E_2)/\hbar\), while
\(|\rho_{12}(t)|=|c_1c_2^*|\) remains constant in an ideal closed system. The
energy variance
\(\sigma_H^2=\langle H^2\rangle-\langle H\rangle^2\) describes the outcome
spread of Hamiltonian-energy measurements; it is not the gravitational
mass-density difference energy \(E_G\). The localized apparatus branches
\(|A\rangle\) and \(|B\rangle\) need not themselves be stationary energy
eigenstates, so the experiment reconstructs their projected complex coherence
rather than assuming a literal two-line atomic spectrum.

For the registered hypothesis lanes, the transparent scalar form is

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2j-schrodinger-coherence-factorization -->
\[
C(t)=C(0)
e^{-i\Delta E_Ht/\hbar}
e^{-\chi_{\rm env}(t)}
e^{-E_Gt/\hbar}.
\tag{4a}
\]

The Hamiltonian energy difference \(\Delta E_H\) rotates phase. The ordinary
open-system functional \(\chi_{\rm env}\) represents environmental contraction
after the environment is traced out. The final factor is the additional
nonunitary contraction of the frozen Diósi model. Equal units do not make these
three objects interchangeable: in particular, a Schrödinger energy variance,
a photon frequency, and the gravitational mass-density difference energy are
not the same source term.

After ordinary loss has been estimated from blinded controls, a remaining
scalar contraction can be expressed as

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2j-dp-equivalent-energy-inverse -->
\[
E_{\rm D,eq}
=-\frac{\hbar}{t}
\ln\!\left(\frac{|C_{\rm residual}(t)|}{|C(0)|}\right).
\tag{4b}
\]

Equation (4b) is a conditional inference under the registered exponential
model, not a calorimetric measurement of gravitational energy. The full
whitened complex estimator in Eqs. (8)--(9), rather than this scalar summary,
remains authoritative for distinguishing phase, loss, and correlated nuisance
responses.

#### 2.1.2 Constituent mass density changes the forecast

Equation (2) treats the apparatus as one effective Gaussian particle. Stage
4.2J also evaluates a homogeneous sphere of physical radius \(R\), convolved
with the identical Gaussian regularization \(R_0\). Its radial Fourier form is

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2j-homogeneous-sphere-energy -->
\[
E_G^{\rm sphere}
=\frac{2Gm^2}{\pi R_0}\int_0^\infty du\,e^{-u^2}
\left[\frac{3(\sin q-q\cos q)}{q^3}\right]^2
\left[1-\frac{\sin(ud/R_0)}{ud/R_0}\right],
\qquad q=\frac{uR}{R_0}.
\tag{4c}
\]

For the earlier silica reference, the converged homogeneous-sphere diagnostic
was 0.249896 of its effective-Gaussian energy. Stage 4.2L subsequently widened
the registered representation envelope to a factor of 6.77099. Stage 4.2M
transports that factor to the leading candidate rather than pretending that a
diamond-density label supplies an atomistic density map. This yields the
0.434903% conservative design floor quoted above. A direct homogeneous,
layered, coarse-grained, and atomistic calculation for the selected specimen
remains blocked pending provenance-bound density and coating inputs.

#### 2.1.3 Cheap feasibility screens precede power

For an ideal equilibrium residual gas, the Stage-4.2J conservative screen uses

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2j-residual-gas-screen -->
\[
n=\frac{P}{k_BT},\qquad
\bar v=\sqrt{\frac{8k_BT}{\pi m_g}},\qquad
\Gamma_{\rm coll}^{\rm screen}=n\bar v\,\pi R^2.
\tag{4d}
\]

The earlier \(2\times10^{-11}\) Pa silica reference failed this screen. The
leading design therefore registers 4 K and \(10^{-15}\) Pa. Its transported
Stage-4.2L QLBE proxy gives
\(\Gamma_{\rm gas}=8.64118\times10^{-4}\ {\rm s^{-1}}\), or 0.007320 of the
registered DP rate. This clears the synthetic one-tenth-DP gate, but it is not
a measured vacuum receipt or a complete collisional decoherence kernel [13].
Species-resolved differential scattering, confinement, pressure calibration,
and collision-veto performance must replace the proxy. The leading mass is
also about \(1.0955\times10^6\) times the 170 kDa cross-platform benchmark
cited in Ref. [6], so state preparation remains the first independent hardware
gate.

Hydrogen and Rydberg scales remain useful dimensional calibration checks. The
registered \(E_G\) is about \(5.71\times10^{-18}\) of the Rydberg energy, but
that ratio supplies neither a cavity coupling nor a collapse mechanism. It
only states the scale of the residual that the coherence estimator would infer
if the frozen Diósi model were selected after ordinary channels were excluded.

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

The leading object's geometric radius is 276.3 nm, but Eq. (2) treats its
center of mass as one Gaussian-smeared effective particle. This is not
equivalent to resolving a selected specimen's atomic or layered density. The
current representation audit is:

| Representation of the same apparatus | Current standing | Consequence |
|---|---|---|
| single effective Gaussian particle | executable; Eq. (2) | 2.90803% leading-design forecast |
| transported Stage-4.2L density envelope | executable sensitivity floor | 0.434903% leading-design floor; not a selected specimen map |
| homogeneous selected sphere | not yet recomputed for the Stage-4.2M material identity | bulk-profile dependence unresolved |
| coated or layered selected sphere | not computed | coating dependence unknown |
| coarse-grained or atomistic selected density | no admissible density provenance | granularity dependence unknown |
| R0 sweep with converged selected representations | sensitivity-only calculations exist | parameter stability unresolved |

Therefore this article proposes a test of the effective-particle Diósi model,
not a representation-independent or generic DP test. A revised confirmatory
analysis must either demonstrate stability across physically defensible mass
representations or preserve that narrower claim in its title and conclusion.

## 3. Leading Synthetic Commissioning Design

The following manifest is the current target for measured subsystem
commissioning. It supersedes earlier design assumptions for forward planning,
but it does not claim an as-built apparatus or physical feasibility.

| Field | Leading design value | Evidence role |
|---|---:|---|
| identity | `stage4_2m_candidate_002` | frozen synthetic search identity |
| material and geometry | diamond-density sphere | bounded-search assumption; specimen not selected |
| radius | 276.302 nm | derived from frozen mass/material identity |
| mass | 3.0925053×10^-16 kg = 1.86235×10^11 Da | frozen model input |
| branch separation | 250 nm, parallel to boundary | frozen model input |
| principal hold time | 250 ms | frozen model input |
| hold-time requirement | include preregistered shorter and longer cells | identifiability check |
| nominal surface gap | 10 μm, common to both branches | boundary-control input |
| finite plate size | 80 μm × 80 μm | transported finite-geometry input |
| boundary program | static randomized cells; nominal cadence label 0.5 Hz | transfer function unmeasured |
| primary sequence | Ramsey-type branch preparation/recombination | design assumption |
| control sequences | identical-branch/sham splitter, echo, path swap, sham switch, detuned boundary | required nuisance and interaction discrimination |
| temperature | 4 K | design target, unmeasured in integrated apparatus |
| pressure | 1×10^-15 Pa | design target, unmeasured in integrated apparatus |
| registered echo residual | 1×10^-4 | synthetic control assumption |
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
| Stage-4.2C silica parent | 276.3 nm radius, 160 nm separation, 0.25 s, 1.2 μm gap | `superseded_search_parent` |
| leading Stage-4.2M design | diamond-density, 276.3 nm radius, 250 nm separation, 0.25 s, 10 μm gap | `current_synthetic_commissioning_target` |

“Frozen” means immutable within a particular run. It does not mean that an
older run remains the current proposal after an explicit downstream
supersession.

### 3.2 The dominant scale gap

The leading mass is approximately \(1.86235\times10^{11}\) Da. Matter-wave
interference has recently been demonstrated for sodium clusters above
170,000 Da [6]. The proposed object is therefore about
\(1.0955\times10^6\) times more massive than that free-particle interference
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

Until these steps are demonstrated, the leading 1,028-window requirement and
1,600-window planning ceiling are not actionable acquisition durations. The
older 542-window value remains only a Stage-4.2C parent-design record.

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

### 5.1 Boundary--branch interaction diagnostic

The full whitened estimator remains primary, but the boundary question has a
transparent four-cell projection. Let \(\beta=0,1\) denote reference and active
boundary states, and let \(q=0,1\) denote a measured identical-branch (or
preregistered sham-split) control and the separated material superposition.
Normalize each cell without discarding phase,

\[
\bar C_{\beta q}(t)=\frac{C_{\beta q}(t)}{C_{\beta q}(0)}.
\]

The Stage-4.2I diagnostic freezes the complex cross-ratio

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2i-complex-cross-ratio -->
\[
\mathcal R_\times=
\frac{\bar C_{11}\bar C_{00}}
     {\bar C_{01}\bar C_{10}},
\qquad
I_\times=-\ln|\mathcal R_\times|,
\qquad
\Phi_\times=\arg\mathcal R_\times .
\tag{9a}
\]

The registered ordinary-physics prediction is not assumed to factorize
perfectly. Its measured response model supplies \(\mathcal R_{\times,0}\), and
the corrected interaction is

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2i-ordinary-corrected-interaction -->
\[
\mathcal R_{\times,\mathrm{corr}}=
\frac{\mathcal R_{\times,\mathrm{obs}}}
     {\mathcal R_{\times,0}},
\quad
I_{\times,\mathrm{corr}}=I_{\times,\mathrm{obs}}-I_{\times,0},
\quad
\Phi_{\times,\mathrm{corr}}=
\operatorname{wrap}(\Phi_{\times,\mathrm{obs}}-\Phi_{\times,0}).
\tag{9b}
\]

Standard \(H_{\rm D}\) multiplies both separated-branch boundary cells by the
same \(e^{-\Gamma_{\rm D}t}\). That factor cancels from Eq. (9a), so this
statistic is not the primary standard-Diosi test. It asks the separate
question: does the boundary change branch-dependent coherence? A nonzero
corrected interaction first challenges \(H_0\) or complete-joint-system
equivalence. It cannot identify a Casimir-to-collapse mechanism without the
separate kernel prohibited by Eq. (6).

For log-loss cells \(Y=(Y_{00},Y_{01},Y_{10},Y_{11})\), the elementary
contrast is \(c^{\mathsf T}Y\) with \(c=(1,-1,-1,1)^{\mathsf T}\) and variance
\(c^{\mathsf T}\Sigma_Yc\). Stage 4.2I recovers this as the saturated four-cell
special case of covariance-weighted projection; Eq. (8), with all controls and
quadratures retained, remains the general estimator. If any normalized
coherence is outside the registered log-coverage domain, Eq. (9a) is withheld
and the raw complex cells remain authoritative.

The same campaign replaces an opaque wave-packet receipt with explicit
center-of-mass custody:

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2i-wavepacket-custody -->
\[
\mathbf d=\mathbf x_B-\mathbf x_A,
\qquad
\sigma_{\rm CM}=\sqrt{\frac{\operatorname{tr}\Sigma_{\rm CM}}{3}},
\qquad
\{R_{\rm sphere},R_0,\sigma_{\rm CM}\}
\quad\text{have distinct physical and model roles}.
\tag{9c}
\]

Centers, packet covariance, overlap, momentum difference, separation
uncertainty, hold jitter, preparation fidelity, trajectory, and tomography
provenance must agree across boundary states within frozen tolerances. The
maintained Stage-4.2I fixture exercises this contract synthetically with
\(\sigma_{\rm CM}=10\ \mathrm{nm}\); it is not a prepared-state measurement.
In that boundary-independent-DP recovery,
\(I_{\times,\mathrm{corr}}=1.11\times10^{-16}\),
\(\Phi_{\times,\mathrm{corr}}=-9.30\times10^{-19}\ \mathrm{rad}\), and the
maximum interaction significance is \(3.85\times10^{-13}\). An adversarial
fixture recovers an injected (0.002) loss interaction and
(0.004\ \mathrm{rad}) phase interaction, while low coherence, packet
mismatch, non-positive covariance, and boundary-dependent DP fail closed.
These are software-recovery results only; the four cells, packet metrology,
and ordinary response are not measured.

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

### 5.2 Rejected design

The initial synthetic design produced

| Diagnostic | Result | Gate |
|---|---:|---|
| maximum absolute whitened cosine | 0.999977 | fail |
| normalized Gram condition number | 179,104 | fail |
| acquisition power | withheld | not meaningful |

The correct result was an apparatus-design no-go. It was not a null result on
the Diósi model.

### 5.3 Parent synthetic redesign

The Stage-4.2C parent redesign produced

| Diagnostic | Nominal synthetic value | Gate |
|---|---:|---|
| maximum absolute whitened cosine | 0.717724 | pass |
| normalized Gram condition number | 6.53169 | pass |
| forecast power | 0.997858 | pass in nominal world |
| nominal required paired windows | 542 | descriptive only |
| planned paired windows | 1,600 | not yet authorized |

![Figure 4. Identifiability progression.](figures/casimir-dp/identifiability-geometry.svg)

*Figure 4. The first design's candidate direction lies almost inside the
nuisance span. The parent redesign establishes the nominal whitened geometry
later transported by Stage 4.2M. Both panels remain conditional on synthetic
response vectors and an assumed covariance.*

### 5.4 Leading Stage-4.2M design

The downstream search evaluates 200 bounded configurations under the frozen
Diósi law and the same registered whitened geometry. Three pass all twelve
synthetic gates. The leading point is:

| Diagnostic | Leading synthetic value | Gate |
|---|---:|---|
| maximum absolute whitened cosine | 0.717724 | pass; transported geometry |
| normalized Gram condition number | 6.53169 | pass; transported geometry |
| effective-Gaussian visibility loss at 250 ms | 2.90803% | pass |
| conservative density-envelope loss at 250 ms | 0.434903% | pass |
| gas-to-DP proxy ratio | 0.007320 | pass synthetically |
| echoed phase uncertainty | 1.109×10^-8 rad | pass synthetically |
| synthetic companion SNR | 8.668 | pass synthetically |
| required paired windows | 1,028 | within 1,600 ceiling |
| forecast power at 1,600 windows | 0.927386 | pass |

This table, not the 542-window parent result, is the current acquisition
forecast. It remains a subsystem-commissioning target because its response,
covariance, gas, phase, preparation, and companion inputs are transported
surrogates rather than measurements.

### 5.5 Material-resolved ordinary complex-coherence null

Stage 4.2N replaces the transported electromagnetic scalar with an executable
ordinary-response chain for the leading design. A passive specimen loss table
is converted to \(\epsilon(i\xi)\), a finite-geometry Green table supplies the
mean branch potential, and a two-sided fluctuation--dissipation spectrum
supplies phase/loss covariance. The transparent ordinary prediction is

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2n-complex-ordinary-null -->
\[
C_{0,\beta}(t)=C(0)
\exp\!\left[i\Phi_{{\rm EM},\beta}(t)-\chi_{0,\beta}(t)\right].
\tag{16a}
\]

The boundary-by-superposition control is represented by the normalized
four-cell ratio

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2n-four-cell-cross-ratio -->
\[
\mathcal R_4=
\frac{C_{{\rm active},{\rm separated}}
      C_{{\rm reference},{\rm compact}}}
     {C_{{\rm active},{\rm compact}}
      C_{{\rm reference},{\rm separated}}},
\qquad
\Phi_4=\arg\mathcal R_4,
\qquad
\chi_4=-\ln|\mathcal R_4|.
\tag{16b}
\]

This is the explicit form of the comparison already motivated by the Stage
4.2I estimator. A nonzero corrected \(\mathcal R_4\) challenges factorization of
the boundary and branch responses; it does not by itself identify collapse.
The boundary-independent registered Diósi factor is identical in active and
reference cells and therefore cancels from this interaction statistic. The
separate Diósi exponents remain the mass--separation--time comparator for the
primary coherence analysis; Stage 4.2N does not add them to the ordinary
Green/FDT exponent and supplies no Casimir-to-collapse kernel.

The current synthetic fixture recovers
\(\Phi_4=0.01999999999\ {\rm rad}\) and
\(\chi_4=1.34165\times10^{-6}\), with propagated phase uncertainty
\(6.30\times10^{-5}\ {\rm rad}\). It also recovers zero response at zero
coupling and infinite distance and a Stefan--Boltzmann relative error of
\(1.38\times10^{-14}\). These values validate executable bookkeeping only.
Measured evidence and ordinary-null authority remain `not_ready`; residual
attribution, collapse identification, and manifold dynamics remain `blocked`.

### 5.6 Why the selected power is still conditional

The response/covariance geometry used by Stage 4.2M was transported from the
same synthetic world used to establish the parent candidate family.
Finite-pilot covariance uncertainty was not propagated. Accordingly, 0.927386
is a conditional calculation, not a robust power claim. The 0.997858 value is
retained only as the Stage-4.2C parent result. The next empirical computation
must report an envelope rather than a single number.

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

## 7. Leading-design forecast

Figure 6 shows the conditional coherence curve from Eq. (2). It contains no
ordinary-decoherence band because that band must be learned from pilot data.

![Figure 6. Conditional Diósi-only coherence forecast.](figures/casimir-dp/coherence-forecast.svg)

*Figure 6. The registered effective-Gaussian curve reaches 2.908% loss at
250 ms, while the transported conservative density envelope reaches 0.435%.
The interval is model sensitivity, not a statistical confidence band. Neither
curve is a total visibility forecast.*

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

For the leading manifest,
\(\dot E=3.07013\times10^{-40}\) W. If 100 independent samples and SNR≥5
were demanded, the algebraic maximum one-shot standard uncertainty would be

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2g-companion-threshold -->
\[
\sigma_{\dot E,\mathrm{one\ shot}}
\le \frac{\dot E\sqrt{100}}{5}
=6.14027\times10^{-40}\ {\rm W}.
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
2. state-preparation fidelity, an explicit identical-branch or sham-split
   control, and separated-branch metrology;
3. center-of-mass packet centers/covariances, overlap, momentum difference,
   hold-time jitter, and recombination metrology in both boundary states;
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
| corrected four-cell interaction is null | no resolved boundary--branch nonfactorization at demonstrated sensitivity | standard boundary-independent DP false |
| corrected four-cell interaction is nonzero | H0 or complete-joint-system equivalence challenged | Casimir-modified collapse without a registered kernel |
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

1. **State preparation:** the leading mass is approximately 1.10 million times the
   170 kDa free-particle interference benchmark; measured packet width,
   overlap, trajectory, and boundary-to-boundary branch equivalence are absent.
2. **Synthetic optimization:** the selected design was evaluated in the same
   assumed response/covariance world in which it was found.
3. **External-bound mapping:** the selected R0 passes a numerical lower-bound
   screen, but the exact convention/composite mapping is not certified.
4. **Mass representation:** the 2.908% prediction is specific to one effective
   Gaussian particle; the transported representation envelope lowers the
   design floor to 0.435%, while selected-specimen homogeneous, layered,
   coarse-grained, and atomistic calculations are incomplete.
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
2. replace the conservative residual-gas no-go with a measured composition,
   pressure, and scattering/collision-veto model or redesign the apparatus;
3. complete provenance-bound layered and constituent density maps;
4. complete the exact external-bound convention and composite-particle map;
5. measure finite-geometry material and boundary transfer functions;
6. obtain pilot response vectors and covariance;
7. run the registered robustness envelope and repeat candidate selection in
   independent synthetic worlds;
8. either demonstrate a companion instrument or retain the lower
   interpretation ceiling;
9. only then freeze a blinded confirmatory campaign.

This sequence keeps the paper's methodological core useful even if the present
apparatus is rejected. The estimator, hypothesis separation, packet custody,
and design gates can be carried into a lower-mass or otherwise redesigned
platform without preserving the current sphere as a favored physical object.

### 11.6 Microscopic electromagnetic closure and orientation no-go

Stage 4.2K replaces the literal "missing virtual photons" picture with the
ordinary macroscopic-QED chain that the apparatus must actually calibrate. For
an isotropic ground state, transition frequencies and dipole matrix elements
define the polarizability, while the boundary enters through the scattering
Green tensor:

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2k-ground-state-green-chain -->
\[
\alpha_g(i\xi)=\frac{2}{3\hbar}\sum_n
\frac{\omega_{ng}|\langle n|\hat{\mathbf d}|g\rangle|^2}
{\omega_{ng}^2+\xi^2},\qquad
U_{\rm CP}(\mathbf r)=\frac{\hbar\mu_0}{2\pi}\int_0^\infty d\xi\,
\xi^2\alpha_g(i\xi)\operatorname{Tr}\mathbf G^{(1)}(\mathbf r,\mathbf r;i\xi).
\]

For the silica sphere, the diagnostic small-particle response is

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2k-sphere-polarizability -->
\[
\alpha_{\rm sph}(i\xi)=4\pi\epsilon_0R^3
\frac{\epsilon(i\xi)-1}{\epsilon(i\xi)+2}.
\]

Charge/current response therefore controls the Casimir lane; total mass density
controls the registered Diósi lane. A common composition and geometry manifest
must bind them, but the two operators are not interchangeable.

The synthetic two-oscillator recovery gives \(\epsilon(0)=3.8\) and
\(\alpha_{\rm sph}(0)=1.13303\times10^{-30}\) in SI units. These are software
fixtures, not measured cryogenic silica data. More importantly, this
superseded-parent calculation exposed the orientation constraint used by the
later redesign. At a 1.2 micrometre surface gap, a 160 nm split normal to the plane gives
\(\Delta U_{\rm CP}=3.55916\times10^{-24}\) J and an accumulated 250 ms phase
of \(8.43746\times10^9\) rad. The tangential split gives zero differential
phase in the translationally invariant ideal-plane limit. Neither is the final
finite-geometry forecast; their difference shows that branch orientation must
be registered before residual attribution.

Phase noise also contracts averaged coherence. For Gaussian phase jitter,

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2k-phase-jitter-loss -->
\[
\left\langle e^{i\delta\phi}\right\rangle
=e^{-\sigma_\phi^2/2},\qquad
\chi_\phi=\frac{\sigma_\phi^2}{2}.
\]

Keeping this contribution below one tenth of the registered DP exponent needs
\(\sigma_\phi\le 0.03464\) rad in the normal screen, corresponding to roughly
\(4.11\times10^{-12}\) fractional stability relative to its phase. Echoes may
cancel a static phase, but their measured rejection and residual covariance
must replace this screening calculation.

Finally, the Stage-4.2J collision count cannot be promoted into a complete gas
decoherence rate. That replacement requires the quantum-linear-Boltzmann
kernel

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2k-qlbe-decoherence -->
\[
\Gamma_{\rm gas}(\Delta\mathbf x)=n_g\!\int d^3v\,\mu(\mathbf v)v
\int d\Omega\,|f(\mathbf q,\mathbf v)|^2
\left[1-e^{i\mathbf q\cdot\Delta\mathbf x/\hbar}\right],
\]

with measured species-resolved pressure and temperature, differential
scattering amplitudes, confinement geometry, momentum-transfer quadrature, and
independent pressure calibration. All are currently absent. Stage 4.2K thus
passes as an analytic diagnostic while finite-geometry electromagnetic closure,
the QLBE environment, and residual attribution remain blocked.

### 11.7 Derivation ancestry: empirical-authority no-go

Stage 4.2L froze the previously missing silica-parent geometry as a design
authority for its own run. In a
right-handed frame whose origin is the plate center, the reference sphere is at
\((0,0,1.476302\ \mu{\rm m})\), the plate normal is
\(\hat{\mathbf n}=(0,0,1)\), and the 160 nm branch vector is
\(\Delta\mathbf x=(160\ {\rm nm},0,0)\). Thus
\(\Delta\mathbf x\cdot\hat{\mathbf n}=0\): the registered design branch is
tangential. This is now a superseded search-parent manifest, retained because
its no-go result defines the requirements applied by Stage 4.2M; it was never
as-built CAD, branch metrology, or plate-normal metrology.

To test the geometry pipeline before a full Maxwell solve, Stage 4.2L uses a
finite rectangular-plate surrogate. The plate's solid angle and the screened
retarded energy are

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2l-finite-rectangle-surrogate -->
\[
\Omega(\mathbf r)=\iint_A
\frac{z\,dA'}{[(x'-x)^2+(y'-y)^2+z^2]^{3/2}},\qquad
U_{\rm rect}(\mathbf r)=\frac{\Omega(\mathbf r)}{2\pi}
U_{\rm CP}^{\infty}(z).
\]

Analytic rectangular solid angle and 160-by-160 midpoint surface quadrature
agree in branch energy to \(1.15\times10^{-6}\) relative error. The centered
tangential branches have equal analytic energies, and hence zero nominal
differential phase. This is a symmetry diagnostic, not a full Green tensor:
finite thickness, coatings, apertures, roughness, patches, and nearby conductors
remain outside the surrogate.

The useful quantity is therefore not the nominal zero but its response
Jacobian. For control coordinates
\(\boldsymbol\theta=(x_c,z,\vartheta_b,\vartheta_p)\),

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2l-phase-covariance -->
\[
J_i=\frac{\partial\Phi_{\rm EM}}{\partial\theta_i},\qquad
\sigma_\phi^2=\mathbf J\,\boldsymbol\Sigma_\theta\mathbf J^{\mathsf T}.
\]

The frozen synthetic design tolerances return
\(\sigma_\phi\simeq1.28\times10^4\) rad, far above the registered
\(0.03464\) rad allowance. Considered one at a time, the surrogate requires
about \(5.50\times10^{-14}\) m lateral centering or
\(4.39\times10^{-12}\) rad branch/plate angular stability. These values do
not assert that such stability has been measured; they reject the current
reference tolerances and require a geometry, gap, modulation, echo, or
mass/separation redesign before a pilot.

For residual gas, Stage 4.2L evaluates the isotropic reduction of the QLBE
kernel,

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2l-qlbe-isotropic-proxy -->
\[
\Gamma_{\rm gas}(d)=\sum_s n_s\bar v_s\sigma_s
\frac12\int_{-1}^{1}d\mu\,
\left[1-\operatorname{sinc}\!\left(
\frac{m_s\bar v_s d\sqrt{2(1-\mu)}}{\hbar}\right)\right].
\]

At 4 K and \(2\times10^{-11}\) Pa, the registered H2/He isotropic proxy gives
\(17.28\ {\rm s^{-1}}\), about 720 times the registered DP rate. Reaching one
tenth of that rate would require approximately
\(2.78\times10^{-15}\) Pa under the same proxy. Because measured species,
differential scattering, confinement, and pressure calibration are absent,
this is a redesign no-go rather than an empirical environmental forecast.

Stage 4.2L also expands the DP representation screen. For a normalized radial
form factor \(F_a\),

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2l-density-regularization-envelope -->
\[
E_G^{(a)}(d,r_0)=\frac{2Gm^2}{\pi r_0}
\int_0^\infty du\,e^{-u^2}|F_a(uR/r_0)|^2
\left[1-\operatorname{sinc}(ud/r_0)\right].
\]

At \(r_0=100\) nm, the effective Gaussian, homogeneous sphere, thin shell,
and a 5% shell sensitivity profile span
\(3.74\times10^{-37}\) to \(2.53\times10^{-36}\) J, a factor of 6.77.
This confirms material-representation dependence; it does not choose the
correct representation without internal-density and coating metrology.

The current external-bound ledger is now partly closed. XENONnT reports, in
the Markovian Diósi convention, \(R_0>4.9\times10^{-10}\) m at 90% confidence.
The frozen \(R_0=10^{-7}\) m point is about 204 times above that scalar lower
bound and is not excluded by this one-dimensional screen. A source-level
likelihood and composite-representation recast remain required before calling
the parameter point fully mapped.

Finally, the reference object's mass is \(1.1706\times10^{11}\) Da. The 2026
matter-wave benchmark demonstrates more than 170 kDa with 133 nm separation,
so the proposed mass is about \(6.89\times10^5\) times larger even though the
separation is only 1.20 times larger. The material, diameter, trapping, and
interferometer platform also differ. State preparation therefore remains an
unclosed physical-feasibility gate.

### 11.8 Selection of the leading bounded design

Stage 4.2M defines the paper's leading design by asking whether any point in
a frozen, bounded apparatus domain can simultaneously make the registered DP
signal resolvable while keeping the transported electromagnetic, gas,
preparation, identifiability, power, and companion constraints within their
preregistered limits. The search does not refit the DP generator, use
confirmatory data, or introduce a Casimir-to-collapse transfer law.

For each candidate \(q\), the registered decision is the conjunction

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2m-multigate-objective -->
\[
G_M(q)=G_{\rm DP}\wedge G_{\rho}\wedge G_{\phi}\wedge G_{\rm gas}
\wedge G_{\rm prep}\wedge G_{\rm bound}\wedge G_{\rm id}
\wedge G_{\rm power}\wedge G_{\rm companion}.
\]

The ordinary-background quantities are transported as explicit design
surrogates rather than declared measured authorities. In particular,

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2m-transported-backgrounds -->
\[
\sigma_{\phi,\rm echo}^2
=\eta_{\rm echo}^2\mathbf J_{\phi}(q)\boldsymbol\Sigma_q
\mathbf J_{\phi}^{\mathsf T}(q),\qquad
\Gamma_{\rm gas}(q)=\Gamma_{\rm gas,L}\,\mathcal T_{P,T,R,d}(q).
\]

The deterministic 200-candidate search returns three points that pass every
synthetic gate. The best-ranked point uses a diamond-density sphere with radius
276.302 nm and mass \(3.09251\times10^{-16}\) kg, a 250 nm tangential branch,
a 250 ms hold, a 10 micrometre gap, 4 K, and \(10^{-15}\) Pa. Under the frozen
effective-Gaussian Diósi law it gives
\(\Gamma_{\rm DP}=0.118046\ {\rm s^{-1}}\), a 2.908% Gaussian-model loss, and
a conservative density-envelope loss of 0.435%. Its transported diagnostics
give \(\Gamma_{\rm gas}/\Gamma_{\rm DP}=0.00732\), echoed phase uncertainty
\(1.11\times10^{-8}\) rad, maximum whitened cosine 0.7177, condition number
6.53, 1,028 required paired windows, power 0.927 at 1,600 windows, and synthetic
companion SNR 8.67.

This is a bounded commissioning target, not a solved apparatus. The full
finite-geometry Maxwell response, measured material spectra, measured phase
covariance, species-resolved QLBE inputs, state preparation, companion detector,
and exact external-bound recast remain absent. The mass is still approximately
\(1.10\times10^6\) times the 170 kDa matter-wave benchmark. Accordingly,
measured evidence remains not ready; residual attribution, collapse
identification, and manifold dynamics remain blocked; and physical viability
remains unevaluated.

## 12. Claim boundaries

This paper establishes:

- the exact model and parameter point used by the forecast;
- the failure of the first synthetic identifiability design;
- the nominal separability of a bounded redesign under stated assumptions;
- a leading synthetic design with a 2.908% effective-Gaussian prediction and
  a 0.435% transported density-envelope floor;
- a selected-candidate forecast of 1,028 paired windows and power 0.927 at the
  1,600-window ceiling;
- a representation envelope showing that the effective-Gaussian prediction is
  not representation-independent;
- a transported gas screen that passes at the leading \(10^{-15}\) Pa target
  while remaining unmeasured;
- an ideal-plane orientation screen showing that boundary phase and phase
  jitter can dominate the target residual unless geometry is frozen and
  empirically calibrated;
- a frozen 3D search geometry, a crosschecked finite-plate surrogate, and
  explicit phase-control tolerances that define the selected echo/alignment
  target;
- a QLBE-structured gas proxy, current scalar external-bound screen, and
  four-representation DP sensitivity envelope;
- a bounded 200-candidate redesign search with three synthetic-only points that
  pass the frozen multigate screen;
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

The leading design is the three-point Stage-4.2M region, not the earlier silica
reference. Its best-ranked point is a diamond-density 276.302 nm-radius sphere,
250 nm tangential split, 250 ms hold, 10 μm gap, 4 K, and \(10^{-15}\) Pa. The
frozen effective-Gaussian model predicts 2.908% loss; the transported
mass-density envelope sets a 0.435% design floor. In the registered whitened
space, the point retains cosine 0.7177 and condition number 6.53, requires 1,028
paired windows, and reaches forecast power 0.927 at 1,600 windows.

The earlier no-go calculations are the evidence that shaped this design. They
showed that the first signature was non-identifiable, the silica parent was gas
dominated at its declared pressure, normal boundary orientation created an
overwhelming phase screen, centered tangential cancellation was tolerance
sensitive, and the DP energy varied by a factor of 6.77 across registered mass
profiles. Those results are retained as derivation ancestry rather than
presented as competing current apparatuses.

The leading design is still not physically viable evidence. Its electromagnetic
response, covariance, gas kernel, echo rejection, state preparation, material
density, external-bound mapping, and companion detector are transported or
unmeasured. It therefore authorizes measured subsystem commissioning only, not
a physical pilot, confirmatory campaign, collapse claim, or manifold claim.

The integrated Stage-4.2M software path passes 62 focused tests, the 101-test
Stage-4.2C-through-M campaign replay, the 179-test required GR/WARP battery,
the 221-entry math registry, equation-sidecar and root-to-leaf validation, and
both production builds. The fresh leading-design publication-rebase adapter run
`2374` (`adapter:1d8a8433-4f7a-4f8e-81d7-19ac5f0fcbfc`) returns `PASS`, no first
failure, empty deltas, certificate status `GREEN`, integrity true, and
certificate SHA-256
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
That certificate establishes repository convergence only.

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
