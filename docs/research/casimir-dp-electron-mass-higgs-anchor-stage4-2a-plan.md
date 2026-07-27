# Casimir-DP Stage-4.2A electron-mass and Higgs-Yukawa anchor plan

**Status:** diagnostic runtimes, campaign, and downstream Casimir software verification pass; measured DP evidence not ready  
**Evidence class:** implemented source-backed diagnostic replay  
**Maximum mass-lane claim:** `electron_mass_metrology_replay_and_conditional_sm_tree_mapping_only`  
**Cross-scale calibration claim ceiling:** `cross_scale_constant_unit_and_normalization_consistency_only`  
**Conditional cosmology claim ceiling:** `counterfactual_cosmology_test_architecture_only`  
**Promotion allowed:** no  
**Upstream authority:** complete immutable Stage-4.1 role/path/hash tuple  
**Observable bridge edges allowed:** zero  
**Runtime sources:** `shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts`; `shared/casimir-dp-planck-solar-calibration-stage4-2a.ts`  
**Campaign run:** `casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1-20260725T211750900Z`  
**Generated report hashes:** JSON `a53a2f1cdc7e4b2d1c9957aaa0a73316d77037371002b7ced4a2978a630fe35d`; Markdown `d7dbf59d6e284ef60ccae58f0f01076b453de1a81fcb2b6863bf44d969f7357a`  
**Campaign receipt SHA-256:** `592a6245993411801672c6fa6ffa4cea4484e4fcf9164ad03f586a55333b17c3`  
**Downstream verification receipt SHA-256:** `debd651e7e500ee9b7011e7fa1c7a16ddcdcf56a6957ca0d2d91b28fe756b66a`

## 1. Purpose and campaign position

Stage 4.2A defines the electron-mass anchor used by the Stage-4.1 QED
scale hierarchy. It reconstructs a published Penning-trap/bound-electron
mass determination, carries its theory and covariance ledger, and expresses the
same rest-energy parameter in tree-level Standard Model Higgs-Yukawa notation.

This is a calibration branch, not a Casimir-DP mechanism:

- Stage 4.1 remains immutable and supplies the QED/atomic scale hierarchy.
- Stage 4.2A asks how the electron rest mass is measured and parameterized.
- Stage 4.2B remains the apparatus-coupled coherence-residual forecast.
- Stage 4.2A cannot open or numerically populate a Stage-4.2B
  Casimir-to-DP transfer.

The implemented runtime keeps four evidence lanes distinct:

1. published electron-mass metrology reconstruction;
2. convention-bound Standard Model tree mapping; and
3. direct collider upper-bound comparison; and
4. cross-scale constant, unit, and normalization calibration.

Agreement across these lanes is consistency within the registered Standard
Model and metrology assumptions. It is not evidence for Casimir vacuum
dynamics, objective collapse, or quantum manifolds.

## 2. Required interpretation

- The Higgs field is not a drag medium and does not slow particles.
  Electroweak symmetry breaking permits a fermion mass term.
- QED uses the electron rest mass as an input. The Standard Model rewrites that
  input at tree level as the product of an electroweak scale and an electron
  Yukawa coupling; it does not predict why that coupling has its value.
- CERN measurements establish a Higgs boson and support the mass-dependent
  coupling pattern for resolved heavier particles. They do not yet directly
  measure the Standard Model electron Yukawa coupling.
- A Penning-trap electron-mass result is a theory-assisted frequency-ratio
  inference, not a static-weight measurement.
- The Higgs vacuum expectation value, electromagnetic/Casimir vacuum,
  cosmological vacuum energy, and quantum-foam hypothesis are distinct.
  Shared use of the word "vacuum" is not a transfer kernel.
- SI metrology and collider natural units require typed, exact conversion;
  they cannot be made identical by renaming variables.
- The Planck blackbody spectrum and the gravitational Planck units are
  different constructions. `planck_thermal_spectrum` uses \(h\), \(k_B\),
  \(c\), and temperature; `planck_mass`, `planck_length`, and `planck_time`
  use \(G\), \(\hbar\), and \(c\). Their shared name is not a physical edge.
- The implemented TSIS result is a coarse, frozen-window Wien-peak color
  diagnostic. It is not a full response/covariance-aware spectral fit, is not
  the IAU bolometric effective-temperature conversion, and need not equal it.
- The DP rate diagnostic consumes a separately defined material branch
  difference \(\Delta\rho\) and regularization. It is not derived from the
  electron Compton scale, an atomic line, a blackbody fit, or a solar
  temperature.

## 3. Electron-mass metrology lane

The preferred benchmark is a bound-electron \(g\)-factor determination using a
hydrogen-like ion in a Penning trap. For ion charge \(q\), ion cyclotron
frequency \(\omega_c\), bound-electron Larmor frequency \(\omega_L\),
bound-electron factor \(g_b\), and ion mass \(m_{\rm ion}\), the observational
equation is

\[
m_e=
\frac{|g_b|}{2}\frac{|e|}{|q|}
\frac{\omega_c}{\omega_L}m_{\rm ion}.
\]

The runtime must carry:

- the measured frequency ratio and statistical/systematic covariance;
- trap-field, image-charge, relativistic, line-shape, and frequency-shift
  corrections reported by the selected experiment;
- the bound-state-QED calculation of \(g_b\) and its theory uncertainty;
- recoil, nuclear-size, and nuclear-mass inputs;
- the ion charge state and binding/ionization-energy mass ledger;
- the self-consistent dependence of the ion mass on \(m_e\), where applicable;
- correction and supersession history for the published carbon/silicon inputs;
- all shared ancestors with the selected CODATA adjustment.

Outputs must remain distinct:

\[
A_r(e)=\frac{m_e}{m_u},\qquad
m_e\ [{\rm kg}],\qquad
m_ec^2\ [{\rm J}],\qquad
m_ec^2\ [{\rm MeV}].
\]

The kg, joule, and MeV forms are deterministic, fully correlated conversions,
not separate measurements. The primary result may be called
`electron_mass_metrology_replay`. It may not be called an independent CODATA
confirmation when the selected Penning result contributes to the same
adjustment. A pull is allowed only when cross-covariance or a justified
leave-one-out adjustment is supplied.

## 4. Higgs-Yukawa parameter lane

Use the convention

\[
\mathcal L_Y\supset
-y_e\,\bar L_e\Phi e_R+\mathrm{h.c.},\qquad
\langle\Phi\rangle=
\begin{pmatrix}0\\v_F/\sqrt2\end{pmatrix}.
\]

At tree level in natural-energy notation,

\[
m_ec^2=\frac{y_e^{\rm tree}v_F}{\sqrt2},\qquad
v_F=(\sqrt2G_F)^{-1/2}\approx246.21965\ {\rm GeV}.
\]

Therefore,

\[
y_e^{\rm tree,inferred}
=\frac{\sqrt2\,m_ec^2}{v_F}
\approx2.93503\times10^{-6},
\]

while the physical tree vertex coefficient convention is

\[
g_{hee}^{\rm tree}=\frac{m_ec^2}{v_F}
=\frac{y_e^{\rm tree,inferred}}{\sqrt2}
\approx2.07538\times10^{-6}.
\]

These are convention-bound derived anchors, not direct electron-Higgs
measurements. The uncertainty and provenance of \(G_F\) must be propagated;
\(v_F\) is a \(G_\mu\)-scheme input inferred from muon decay, not a direct
measurement of a static field value.

The Stage-4.1 identities may be rewritten without changing their content:

\[
\nu_C=
\frac{m_ec^2}{h}
=\frac{y_e^{\rm tree,inferred}v_F}{\sqrt2h},
\]

\[
\mathrm{Ry}^{(0)}
=\frac12\alpha_{\rm fs}(0)^2m_ec^2
=\frac{\alpha_{\rm fs}(0)^2y_e^{\rm tree,inferred}v_F}{2\sqrt2}.
\]

Because \(v_F\) is an energy scale, another factor of \(c^2\) in these
substitutions is a unit error. A separate SI convention may represent a
mass-equivalent \(v_m=v_F/c^2\), but the conventions may not be mixed.

Precision promotion requires a matched relation such as

\[
m_e^{\rm pole}c^2=
\frac{y_e^{\overline{\rm MS}}(\mu)
      v^{\overline{\rm MS}}(\mu)}{\sqrt2}
\left[1+\Delta_e(\mu,\mathrm{scheme})\right],
\]

with sourced scale, scheme, tadpole prescription, electroweak/QED matching,
perturbative order, and uncertainty. Until then,
`running_yukawa_at_higgs_scale` remains `blocked`.

## 5. CERN collider lane

The collider lane must remain independent from the mass-inferred tree anchor.
Current Higgs data support the Standard Model coupling pattern over resolved
particles and channels. The direct electron-specific search remains an upper
limit:

\[
\mathcal B(H\rightarrow e^+e^-)<3.0\times10^{-4}
\quad(95\%\ {\rm CL}).
\]

The runtime output must therefore be
`electron_yukawa_collider_status=upper_bound_only`. Any registered coupling
modifier must use the published analysis and its production, width, nuisance,
and confidence assumptions; a naive square root of branching-ratio values is
not an authorized reconstruction.

Allowed conclusion:

- the mass-inferred Standard Model anchor is compatible with the current
  direct collider upper bound;
- the collider result does not measure \(y_e\) at its Standard Model value;
- agreement for heavier-particle Higgs couplings supports the broader
  Standard Model structure but cannot substitute for an electron observation.

## 6. Formal zero-\(v_F\) limit

The formal tree algebra gives

\[
v_F\rightarrow0,\quad y_e\ {\rm fixed}
\Longrightarrow
m_e,\nu_C,\mathrm{Ry}^{(0)}\rightarrow0,\qquad
\lambda_C,\bar\lambda_C,a_0\rightarrow\infty.
\]

This is a recovery-limit check only. It exits the broken-electroweak,
low-energy atomic domain in which these formulas were derived. It is not an
experimental switch, and the runtime must not extrapolate unchanged QCD,
proton, atomic, Casimir, or apparatus models through \(v_F=0\).

## 7. Cross-scale calibration ladder and semantic breaks

The requested "mass/energy calibration ladder" is a provenance and
normalization ladder, not one causal mechanism. Its rungs must be typed as
follows:

| Rung | Registered relation or operation | Evidence role | Forbidden inference |
|---|---|---|---|
| Penning electron anchor | published frequency ratio plus bound-state-QED, ion-mass, correction, covariance, and source-overlap ledgers \(\rightarrow m_e\) | metrology replay | a static weighing or independent CODATA confirmation |
| Rest-energy conversion | \(E_e=m_ec^2\) in J and MeV | exact correlated conversion | a new measurement or physical oscillator |
| Compton/Rydberg scales | \(\nu_C=E_e/h\), \(cR_\infty=\alpha_{\rm fs}^2\nu_C/2\) | immutable Stage-4.1 identity calibration | a cavity, thermal, solar, or collapse coupling |
| Planck/Stefan-Boltzmann closure | integrate the thermal Planck spectrum and recover \(\sigma=2\pi^5k_B^4/(15h^3c^2)=\pi^2k_B^4/(60\hbar^3c^2)\) | thermal normalization | access to gravitational Planck-scale physics |
| TSIS frozen-window Wien diagnostic | select the maximum of predeclared continuum points in a content-addressed TSIS snapshot and apply \(T_{\rm color}^{\rm Wien}=b/\lambda_{\max}\) | coarse source-backed spectral-shape diagnostic | a response-aware spectral fit, unique photospheric temperature, bolometric effective temperature, or stellar-structure solution |
| IAU bolometric effective temperature | \(T_{\rm eff,bol}=[L_\odot/(4\pi R_\odot^2\sigma)]^{1/4}\), with \(T_{\rm eff,\odot}^{\rm N}=5772\ {\rm K}\) retained as an exact nominal conversion constant | flux-equivalent normalization using supplied luminosity and radius | prediction of the Sun's temperature from \(h\), \(m_e\), or atomic physics alone |
| Preregistered DP test | \(E_G[\Delta\rho;r_0]\) and \(\Gamma_{\rm DP}=E_G/\hbar\) from a separately prepared branch geometry | collapse-model diagnostic | derivation from any preceding thermal, solar, or frequency rung |

The implemented runtime stops at the coarse frozen-window Wien diagnostic and
keeps measured fit significance `not_ready`. A future response- and
covariance-aware spectral fit may use

\[
S_\lambda^{\rm TSIS}
\approx
A_{\rm disk}\,
\frac{2hc^2}{\lambda^5}
\frac{1}{\exp[hc/(\lambda k_BT_{\rm color}^{\rm TSIS})]-1},
\]

only after the TSIS product version, date range, wavelength window, quality
flags, irradiance convention, instrument-response/calibration provenance,
nuisance amplitude, line/mask policy, covariance, and fit statistic are frozen.
Such a \(T_{\rm color}^{\rm TSIS}\) would be a fit result, not an identity and
not the IAU nominal value. Stage 4.2A does not claim that stronger result.

The allowed graph contains direct `derives` edges only from Penning \(m_e\) to
\(m_ec^2\) and from that reference to the Stage-4.1 Compton/Rydberg identities.
It contains a separate `normalizes` edge from the Planck spectrum to
Stefan-Boltzmann and a separate `infers_given_inputs` edge from
\((L_\odot,R_\odot,\sigma)\) to bolometric \(T_{\rm eff}\). Between the
atomic, thermal/solar, and DP branches it may record only
`shares_constant_and_units` and `does_not_imply` edges. Common \(h\), \(\hbar\),
\(c\), energy units, or dimensional closure calibrate the implementation; they
do not evidence DP.

The maximum claim for this complete ladder is
`cross_scale_constant_unit_and_normalization_consistency_only`. Only a
measured, preregistered coherence residual with the required mass, branch,
separation, regularization, and hold-time scaling can advance a DP evidence
gate.

## 8. Level-1/2/3 evidence ladder and conditional cosmology extension

The empirical ladder must remain separate from the calibration ladder:

1. **Level 1 — objective-collapse candidate.** A replicated held-out
   coherence residual survives the complete ordinary-QED, gas, thermal,
   mechanical, surface, readout, leakage, and covariance closure,
   discriminates every registered remaining unitary/environmental alternative,
   and matches a frozen nonunitary dynamical signature. This would motivate
   objective collapse but would not identify gravity as its cause.
2. **Level 2 — DP scaling support.** The measured residual follows the
   preregistered \(E_G[\Delta\rho;r_0]/\hbar\) dependence across independently
   varied mass, branch geometry or separation, hold time, and permitted
   regularization settings, while ordinary alternatives fail. This is the
   first level that could support the tested DP rate law.
3. **Level 3 — boundary-sensitive extension.** With the material branches and
   DP regularization fixed, a replicated boundary-conditioned remainder
   survives every electromagnetic and apparatus control and matches a
   preregistered bridge kernel. This would support a laboratory
   boundary-sensitive extension beyond standard DP; it would not by itself
   establish a cosmological vacuum-collapse mechanism.

Current measured evidence is `not_ready`; collapse identification, the
Compton-to-collapse transfer, and manifold dynamics remain `blocked`. The
algebraic and thermal calibration rungs cannot change those states.

A cosmological application is a strictly conditional future campaign. It
requires, in order:

1. a laboratory-fixed collapse operator, rate law, smearing scale, noise
   spectrum, dissipation/heating law, and uncertainty distribution;
2. a causal covariant lift with an explicit foliation policy and a conserved
   total stress tensor;
3. gauge-invariant inflationary predictions and a frozen CMB likelihood;
4. a separately derived background backreaction, if any, that satisfies
   nucleosynthesis, CMB spectrum, structure-growth, lensing, distance, and
   heating constraints.

The attached cosmology proposal is therefore represented as a five-gate,
fail-closed extension, not as a Stage-4.2A result:

| Gate | Required artifact or observation | Current state | Falsifiable break condition |
|---|---|---|---|
| C1 laboratory collapse kernel | replicated Level-2 support for a frozen \(\Gamma_{\rm col}(m,R,\Delta x,r_0,T,\ldots)\) and its uncertainty | `not_ready` | the held-out residual disappears, is absorbed by a registered unitary/environmental alternative, or fails the frozen \(E_G/\hbar\) scaling |
| C2 boundary sensitivity | fixed-material-branch estimate and measurement of \(\Delta_b\Gamma_{\rm col}\) under a preregistered boundary kernel | `blocked` by C1 | the contrast is explained by electromagnetic/apparatus closure, fails replication, or disagrees with the frozen kernel |
| C3 covariant lift | collapse operator, causal noise kernel, regularization, foliation policy, and conserved total stress tensor | `blocked` | the lift violates causality, its declared ultraviolet/Hadamard domain, or \(\nabla^\mu T_{\mu\nu}^{\rm total}=0\) |
| C4 inflationary prediction | laboratory-fixed \(\mathcal P_\zeta(k)\), \(B_\zeta\), tensor/isocurvature outputs, and frozen CMB likelihood | `blocked` by C3 | the no-retuning prediction violates the registered CMB spectrum, Gaussianity, isotropy, or tensor/isocurvature bounds |
| C5 expansion backreaction | laboratory-fixed \(Q_{\rm col}(t)\), \(\varepsilon_X(t)\), \(w_X(t)\), and \(H(z)\) | `not_evaluated` | the prediction violates heating, nucleosynthesis, CMB-spectrum, structure-growth, lensing, supernova, or BAO constraints |

The registered conditional nulls are
\(\Delta_b\Gamma_{\rm DP}=0\) for fixed material branches under standard DP,
\(C_{\rm col}(k)=1\) for no primordial-spectrum correction, and
\(Q_{\rm col}=0\) for collapse without background backreaction. No C1--C5
runtime or Theory Badge is created here; the table defines what a later
campaign must freeze and what would reject it.

Every laboratory parameter and uncertainty must be frozen before cosmological
comparison. Cosmology-only retuning is forbidden. Failure of the
laboratory-fixed kernel in CMB or expansion tests would disfavor that
cosmological extension, not retroactively convert calibration agreement into
DP evidence.

Planck units may be used only as a reparameterization:

\[
\ell_P=\sqrt{\frac{\hbar G}{c^3}},\qquad
m_P=\sqrt{\frac{\hbar c}{G}},\qquad
t_P=\sqrt{\frac{\hbar G}{c^5}}.
\]

For the explicitly stated compact-geometry approximation
\(E_G\sim\eta Gm^2/L\),

\[
\Gamma_{\rm DP}
\sim
\eta\frac{c}{L}\left(\frac{m}{m_P}\right)^2.
\]

This does not show that the experiment reaches the Planck length or Planck
energy, that energy is quantized in Planck units, that spacetime is discrete,
or that the DP smearing length equals \(\ell_P\). The maximum cosmology/Planck
claim before a complete later runtime exists is
`counterfactual_cosmology_test_architecture_only`; dark-energy generation,
primordial-collapse signatures, and a Casimir-to-cosmology transfer remain
`blocked` or `not_evaluated`.

## 9. Implemented runtime contracts

The implemented source boundaries are
`shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts` and
`shared/casimir-dp-planck-solar-calibration-stage4-2a.ts`. Their strict
contracts, source-backed fixtures, focused tests, campaign orchestrator,
generated report, receipt, and non-promotable Theory Badge projections are
implemented. Fresh adapter run `2324` returns `PASS`, first failure `null`,
empty deltas, certificate integrity `true`, and certificate SHA-256
`38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34`.
That software-verification result cannot promote measured DP, collapse,
manifold, or physical-viability evidence.

| Runtime | Required inputs | Outputs | Hard failure examples |
|---|---|---|---|
| `electron_mass_penning_reconstruction` | frequency ratios, bound \(g_b\), ion charge/mass ledger, corrections, covariance | \(A_r(e)\), \(m_e\), uncertainty budget, recovery residual | missing correction, inverted ratio, circular ion-mass treatment |
| `electron_mass_source_overlap_audit` | experiment/CODATA dependency DAG and covariance | independence class and pull status | calling a shared adjustment independent |
| `fermi_scale_tree_anchor` | \(G_F\), source hash, unit convention | \(v_F\), uncertainty, convention receipt | mixing GeV and GeV/\(c^2\), extra \(c^2\) |
| `electron_yukawa_tree_inference` | \(m_ec^2\), \(v_F\), covariance | \(y_e^{\rm tree,inferred}\), \(g_{hee}^{\rm tree}\) | missing \(\sqrt2\), bare or dimensionful Yukawa |
| `electron_yukawa_precision_matching_gate` | pole/running scheme, \(\mu\), matching kernel | matched value or `blocked` | treating the tree relation as precision matching |
| `cern_electron_yukawa_bound` | published result and assumption ledger | upper-bound compatibility state | relabeling an upper limit as observation |
| `qed_higgs_scale_identity_replay` | immutable Stage-4.1 tuple plus tree anchor | Compton/Rydberg identity residuals | changing Stage 4.1 or promoting shared algebra |
| `planck_solar_calibration_stage4_2a` | independently frozen SI/frequency conventions, content-addressed TSIS SSI rows and peak window, IAU nominal constants, supplied \(L_\odot,R_\odot\) | Planck/Stefan residual, coarse \(T_{\rm color}^{\rm Wien}\), \(T_{\rm eff,bol}\), nominal-value recovery, semantic edge matrix | relabeling the peak diagnostic as a full fit, conflating Planck law with Planck units, equating color and bolometric temperatures, deriving DP from closure |
| `level_1_2_3_evidence_prerequisite_gate` | measured residual receipts, ordinary-null closure, frozen DP scaling and optional boundary-kernel contracts | Level-1/2/3 state with first unmet prerequisite | promotion from calibration, unblinded retuning, Level-3 cosmology claim |
| `stage4_2a_nonbridge_orchestrator` | prior receipts | final gates and claim ledger | any calibration output promoted into a Casimir/DP/collapse/manifold claim or observable bridge |

## 10. Schema and namespace rules

Required names include:

- `A_r_e`;
- `m_e_OS_kg`;
- `E_e_OS_J` and `E_e_OS_MeV`;
- `v_F_tree_GeV`;
- `y_e_lagrangian_tree`;
- `g_h_e_e_tree`;
- `y_e_MSbar_at_mu` only with `mu_GeV` and a scheme;
- `kappa_e_collider_bound`;
- `planck_thermal_spectrum_basis`;
- `sigma_SB_W_m2_K4`;
- `T_color_TSIS_K`;
- `T_eff_bolometric_K`;
- `T_eff_solar_nominal_K`;
- `planck_mass_kg`, `planck_length_m`, and `planck_time_s` only in the
  Planck-unit reparameterization lane;
- `E_G_DP_J` and `Gamma_DP_s_inv` only with a named
  `delta_rho_branch_manifest` and regularization;
- `alpha_fs`.

Reject:

- bare `mass`, `m_e`, `v`, `y_e`, or `alpha`;
- material band/effective mass substituted for electron rest mass;
- \(246\) GeV labeled as \(v_F/\sqrt2\), or \(174\) GeV labeled as \(v_F\);
- angular/cyclic frequency interchange;
- `MeV` used as an SI mass or `MeV/c^2` used as an energy;
- \(c=1\) or \(\hbar=1\) inside the SI lane;
- pole/running comparison without scale, scheme, and matching;
- `direct_electron_yukawa_observed=true`;
- `higgs_field_drag=true`;
- `zero_higgs_is_apparatus_control=true`;
- `cosmic_ladder=true` or use of the repository's cosmic-distance-ladder name
  for this cross-domain calibration map;
- `planck_thermal_spectrum=planck_gravity_scale`;
- `T_color_TSIS=T_eff_bolometric` without an empirical equality test;
- `solar_temperature_predicted_from_h=true`;
- `shared_constants_imply_transfer=true`;
- `blackbody_to_DP_bridge=true` or `solar_to_DP_bridge=true`;
- `planck_scale_reached=true`;
- any unregistered cavity, Casimir, collapse, manifold, quantum-foam,
  resonance, polarization, cosmology, or transfer-kernel output; the named
  \(E_G/\hbar\) fields are allowed only as a preregistered empirical target and
  never as calibration-derived evidence.

## 11. Order of operations

1. Hash-validate the complete immutable Stage-4.1 authority tuple.
2. Freeze source snapshots and role/path/hash records.
3. Freeze SI, natural-unit, mass-scheme, frequency, and Higgs conventions.
4. Validate the dependency DAG and source-overlap labels.
5. Validate experimental, theory, and adjustment covariance blocks.
6. Reconstruct the Penning observational equations.
7. Solve the ion-mass/electron-mass dependence and correction ledger.
8. Reproduce CODATA kg/J/MeV forms as correlated conversions.
9. Derive \(v_F\) and the conditional tree-level Yukawa anchor.
10. Replay the Stage-4.1 Compton and Rydberg identities.
11. Compare the independently frozen Planck/frequency conventions against the
    Stage-4 thermal diagnostic without claiming a hash-linked dependency or
    importing apparatus outputs.
12. Recover the Planck-to-Stefan-Boltzmann normalization.
13. Run the content-addressed, frozen-window TSIS Wien-peak diagnostic and
    preserve its product/window dependence while leaving full-fit significance
    `not_ready`.
14. Recover the supplied-input bolometric \(T_{\rm eff}\) and the distinct IAU
    nominal conversion.
15. Classify every cross-domain edge as `derives`, `normalizes`,
    `infers_given_inputs`, `shares_constant_and_units`, or `does_not_imply`.
16. Register the preregistered DP \(E_G/\hbar\) scaling test as an independent
    empirical target; do not populate it from calibration outputs.
17. Evaluate the precision-matching ledger without setting omissions to zero.
18. Ingest the direct collider upper bound and enforce its nonclaim.
19. Run the formal zero-\(v_F\) recovery check with a domain-exit flag.
20. Populate the Level-1/2/3 prerequisites, falsifiers, nonclaims, and final
    gates without promoting absent measurements.
21. Project a non-promotable Theory Badge with zero observable bridges.
22. Write content-addressed reports and an immutable receipt.
23. Run focused, publication, math, root-to-leaf, WARP, build, and fresh
    adapter verification after implementation.

## 12. Falsifiers and focused tests

The campaign must fail or remain unpromoted when:

- published Penning values cannot be reconstructed within declared
  uncertainty;
- a correction, covariance block, ion-binding term, or theory uncertainty is
  omitted or superseded data are silently substituted;
- an ionic charge, species, frequency orientation, or \(g_b\) convention is
  changed;
- a covariance matrix has the wrong order/diagonal, is asymmetric, non-PSD, or
  silently treats unknown cross-covariance as zero;
- CODATA and Penning outputs share ancestors but are called independent;
- kg, joule, and MeV forms are treated as separate confirmations;
- SI/natural-unit round trips or analytic/finite-difference Jacobians fail;
- the \(\sqrt2\) distinction between \(y_e\) and \(g_{hee}\) is lost;
- a pole mass is substituted into a precision running-Yukawa calculation;
- the collider upper limit is relabeled as an observation;
- the formal zero-\(v_F\) limit is used as an apparatus scenario;
- Planck-spectrum integration does not recover the registered
  Stefan-Boltzmann constant within tolerance;
- a full TSIS fit or measured fit significance is claimed while data-quality
  flags, response, nuisance model, masks, or covariance remain omitted;
- a TSIS color temperature is relabeled as the IAU nominal or bolometric
  effective temperature;
- nominal \(L_\odot,R_\odot,T_{\rm eff,\odot}^{\rm N}\) conversion constants
  are relabeled as independent measurements of the current Sun;
- common \(h\), \(\hbar\), \(c\), energy units, or dimensional closure is used
  to populate \(E_G\) or \(\Gamma_{\rm DP}\);
- a Level-1 residual is called gravitational without the Level-2 scaling test;
- a Level-3 laboratory boundary result is called a cosmological mechanism
  without a covariant lift and independent cosmological likelihood;
- any cosmological parameter is retuned after ingesting CMB or expansion data;
- any Higgs/mass identity creates a Casimir-to-DP observable bridge.

A future direct, assumption-complete measurement excluding
\(\kappa_e=1\) at the preregistered threshold would disfavor the minimal
Standard Model electron Yukawa relation. It would not by itself support the
Casimir-DP hypothesis.

## 13. Theory Badge and maturity standing

Live badge ids:

`study.casimir_dp.electron_mass_higgs_anchor_stage4_2a`

`study.casimir_dp.planck_solar_calibration_stage4_2a`

Implemented properties:

- evidence role: `diagnostic_gate`;
- maturity: `stage_1_reduced_order`;
- maximum claim:
  `electron_mass_metrology_replay_and_conditional_sm_tree_mapping_only`;
- cross-scale calibration subclaim:
  `cross_scale_constant_unit_and_normalization_consistency_only`;
- conditional cosmology subclaim:
  `counterfactual_cosmology_test_architecture_only`;
- promotion allowed: false;
- calculator action: deliberately absent for these non-promotable diagnostic
  gates;
- observable bridge edges: zero.

Implemented non-observable edges:

- immutable Stage 4.1 `constrains` Stage 4.2A;
- Penning metrology `informs` the rest-mass anchor;
- collider \(H\rightarrow e^+e^-\) `constrains` the direct-coupling lane;
- Stage 4.2A `does_not_imply` a Casimir-DP transfer;
- Stage 4.2A `constrains` Stage-4.2B parameter semantics only.
- Stage-4.1 Compton/Rydberg and Stage-4 Planck/solar authorities
  `share_constants_and_units` without an observable bridge;
- the solar calibration `does_not_imply` the preregistered DP test;
- Level 1 `does_not_imply` Level 2, and Level 3 `does_not_imply` cosmological
  transfer.

The two non-promotable Stage-4.2A badges were added to the live graph only
after their strict contracts, source-backed fixtures, runtimes, focused tests,
and campaign receipt existed. They add zero observable bridge edges.

## 14. Implemented gates

| Gate | Current Stage-4.2A state |
|---|---|
| primary-source integrity | `pass` |
| Penning observational replay | `pass` |
| CODATA correlated reproduction | `pass` |
| covariance and unit semantics | `pass` |
| conditional Standard Model tree mapping | `pass` |
| Planck/Stefan-Boltzmann recovery | `pass` |
| TSIS spectral color-temperature recovery | `pass` |
| IAU bolometric/nominal temperature separation | `pass` |
| cross-scale semantic nonbridge | `pass` |
| independent electron-mass validation | `not_ready` |
| running Yukawa at Higgs scale | `blocked` |
| direct electron-Yukawa observation | `not_ready` |
| electron mass from Higgs identification | `blocked` |
| Higgs-origin identification | `blocked` |
| measured Casimir/coherence evidence | `not_ready` |
| Level-1 objective-collapse candidate | `not_ready` |
| Level-2 DP scaling support | `blocked` |
| Level-3 boundary-sensitive extension | `blocked` |
| Casimir/Higgs/DP transfer | `blocked` |
| Compton-to-collapse clock | `blocked` |
| collapse identification | `blocked` |
| manifold dynamics | `blocked` |
| covariant cosmological lift | `blocked` |
| primordial-spectrum prediction | `not_evaluated` |
| expansion/dark-energy backreaction | `not_evaluated` |
| Planck-scale discreteness or energy lattice | `blocked` |
| physical viability | `not_evaluated` |
| publication claim | `diagnostic_cross_scale_calibration_only` |

## 15. Primary sources

- S. Sturm et al., "High-precision measurement of the atomic mass of the
  electron," *Nature* 506, 467-470 (2014),
  [DOI 10.1038/nature13026](https://doi.org/10.1038/nature13026).
- F. Köhler et al., "The electron mass from \(g\)-factor measurements on
  hydrogen-like carbon \(^{12}{\rm C}^{5+}\)," *Journal of Physics B* 48,
  144032 (2015),
  [detailed analysis](https://arxiv.org/abs/1604.04380).
- P. J. Mohr, D. B. Newell, B. N. Taylor, and E. Tiesinga, "CODATA
  recommended values of the fundamental physical constants: 2022,"
  *Reviews of Modern Physics* 97, 025002 (2025),
  [NIST source](https://physics.nist.gov/cuu/pdf/JPCRD2022CODATA.pdf).
- Particle Data Group, "Status of Higgs Boson Physics," *Review of Particle
  Physics* (2025),
  [review](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-higgs-boson.pdf).
- CMS Collaboration, "Search for the Higgs boson decay to a pair of electrons
  in proton-proton collisions at \(\sqrt{s}=13\) TeV," *Physics Letters B*
  846, 137783 (2023),
  [CMS HIG-21-015](https://cms-results.web.cern.ch/cms-results/public-results/publications/HIG-21-015/index.html).
- NASA and the Laboratory for Atmospheric and Space Physics, TSIS-1 Hybrid
  Solar Reference Spectrum,
  [TSIS-1 HSRS data](https://lasp.colorado.edu/lisird/data/tsis1_hsrs/); support a
  versioned frozen-window Wien diagnostic, not a full spectral fit, unique
  solar temperature, or DP input.
- International Astronomical Union, 2015 Resolution B3,
  [nominal solar conversion constants](https://www.iau.org/common/Uploaded%20files/IAUGA2015-Resolution-B3-recommended-nominal-conversion.pdf);
  supplies the exact nominal \(T_{\rm eff,\odot}^{\rm N}=5772\ {\rm K}\)
  conversion and its luminosity/radius context, not a current independent
  solar measurement.
- S. Donadi et al., "Underground test of gravity-related wave function
  collapse," *Nature Physics* 17, 74-78 (2021),
  [DOI 10.1038/s41567-020-1008-4](https://doi.org/10.1038/s41567-020-1008-4);
  constrains the natural parameter-free DP prescription and its radiation
  signature, not every regularized or dissipative collapse model.
- J. Juárez-Aubry, B. Kay, and D. Sudarsky, "Generally covariant dynamical
  reduction models and the Hadamard condition," *Physical Review D* 97,
  025010 (2018),
  [DOI 10.1103/PhysRevD.97.025010](https://doi.org/10.1103/PhysRevD.97.025010);
  supports requirements for a covariant reduction architecture, not a
  completed cosmological DP theory.
- T. Josset, A. Perez, and D. Sudarsky, "Dark Energy from Violation of Energy
  Conservation," *Physical Review Letters* 118, 021102 (2017),
  [DOI 10.1103/PhysRevLett.118.021102](https://doi.org/10.1103/PhysRevLett.118.021102);
  supplies one conditional unimodular model class, not a consequence of the
  standard DP rate law.

These sources support their named metrology, adjustment, Standard Model, or
collider lanes only. None supplies a Casimir, DP, collapse, manifold, or
quantum-foam transfer.

## 16. Implemented campaign scope and next evidence goal

The immutable downstream Stage-4.2A campaign now reconstructs the registered
Penning-trap/bound-electron mass determination with observational,
bound-state-QED, ion-binding, correction, source-overlap, and covariance
ledgers. It infers the convention-bound tree-level \(v_F\), \(y_e\), and
\(g_{hee}\) anchors with strict SI/natural-unit and pole/running separation;
replays the Stage-4.1 Compton and Rydberg identities without treating shared
algebra as independent evidence; recovers the Planck/Stefan-Boltzmann
normalization; and keeps the coarse TSIS frozen-window Wien color diagnostic
distinct from supplied-input bolometric and IAU nominal solar effective
temperature. The CMS \(H\rightarrow e^+e^-\) result remains an
upper-bound-only collider lane. Both runtimes, their focused tests, the
campaign receipt, and two non-promotable Theory Badges exist with zero
observable bridge edges.

The next scientific goal is not another cross-scale calibration match. It is a
replicated held-out coherence residual that survives complete registered
ordinary-decoherence closure, discriminates the remaining registered
unitary/environmental alternatives, and matches a frozen nonunitary dynamical
signature. Only then can Level 1 advance from `not_ready`; a separately frozen
mass/branch/separation/hold-time \(E_G/\hbar\) scaling test is required for
Level 2, and a fixed-branch boundary-sensitive residual matching a registered
kernel is required for Level 3. Until those measurements exist, Casimir/DP
transfer, collapse identification, manifold dynamics, cosmology, Planck
discreteness, and physical viability remain closed regardless of the passing
downstream software-verification result.
