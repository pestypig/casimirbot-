# Needle Hull Mark 2 Compact Note on ADM Warp-Family Metrics, Reduced-Order Full-Solve Gates, and Fail-Closed Evidence Governance

## Motivation and Boundary

Warp-family spacetimes are studied because General Relativity constrains **local** causal motion (no material observer exceeds light speed locally) but allows **global** geometric structures in which coordinate distances between events can change via time-dependent metrics (a “loophole” in the purely rhetorical sense: a feature of GR’s geometric degrees of freedom, not a claim of buildability). The canonical comparison reference (outside NHM2 proper) is Alcubierre’s 1994 metric construction, which is explicitly a solution-level *metric ansatz* discussion and not an engineering design. citeturn1search4

Needle Hull Mark 2 (NHM2) is defined and governed in this repository as a **reduced-order, falsifiable gate campaign** with explicit provenance and fail-closed evidence handling (tier: canonical-authoritative). The intended contribution, per the repo’s top-level anchor map and authoring contract, is the discipline of (i) explicit assumptions, (ii) explicit adjudication gates, and (iii) explicit reproducibility and evidence-lane blockers—*not* a “warp feasibility” claim.

**Boundary statement (verbatim, hard constraint):**  
This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim. 

Fail-closed posture is not rhetorical; it is encoded as precedence and behavior. Canonical conflicts are resolved by the repo’s declared authority chain (proof-anchor index → campaign execution report → G4 decision ledger → G4 governance matrix → parity/readiness/evidence summaries → overlays → external literature), and missing artifacts must be treated as `UNKNOWN` rather than inferred (tier: canonical-authoritative).

The authoring contract further enforces non-collapsed claim tiers—`canonical-authoritative`, `promoted-candidate`, `exploratory`—and prohibits using lower tiers to override canonical adjudication or to imply feasibility (tier: canonical-authoritative). 

## Metric Setup

### ADM conventions actually instantiated in the repo

NHM2's metric machinery is implemented in explicit **3+1 / ADM** form, with a "warp-metric adapter" snapshot built with **lapse** \(\alpha = 1\), **diagonal Euclidean spatial metric** \(\gamma_{ij} = \delta_{ij}\), and a **shift vector field** \(\beta^i(x)\) that carries the "warp-family" geometry (tier: canonical-authoritative insofar as it is committed code used by the audited tests and artifacts). 

A standard ADM line element (shown here as physics context; NHM2 then specializes it) is:
\[
ds^2 = -\left(\alpha^2 - \beta_i\beta^i\right)dt^2 + 2\beta_i \, dx^i dt + \gamma_{ij}dx^i dx^j,
\]
and NHM2's "flat-slice" specialization (as committed code) sets \(\alpha=1\), \(\gamma_{ij}=\delta_{ij}\), leaving \(\beta^i\) as the nontrivial geometry carrier. 

The repository also explicitly implements and tests a sign convention for the Eulerian expansion ("York time"): **\(\theta\) is mapped to \(-K\)**, where \(K=\mathrm{Tr}\,K_{ij}\) is the trace of the extrinsic curvature (tier: canonical-authoritative-unit test contract). 

### Lineage as bounded context (not adopted truth)

The repo's warp-family comparison overlay tracks, at minimum, Alcubierre (1994), Natário (2002), and Van den Broeck (1999) as "Core-4" references (plus other domains), but explicitly treats these as **reference-only overlays** that may be partial/inconclusive when assumptions are non-comparable (tier: exploratory for external literature; canonical-authoritative for "how the repo uses them").  

Two canonical metric forms appear in committed repo artifacts:

Alcubierre (shift-only form, flat spatial slices):
\[
ds^2 = -c^2 dt^2 + \left(dx - v_s f(r_s)\,dt\right)^2 + dy^2 + dz^2,
\quad \beta^x=-v_s f(r_s),
\]
with a smooth “top-hat” \(f(r_s)\) and its derivative \(df/dr_s\) emphasized for audits.   citeturn0search47

Natário (zero-expansion control form):
\[
ds^2 = -dt^2 + \sum_i \left(dx^i - X^i dt\right)^2,\qquad \nabla\cdot X = 0,
\]
which the repo uses both as a comparison anchor and as an internal control target for divergence-free shift construction (tier: contextual from literature; operationalized by committed code/tests).  citeturn1search1

### Shape functions, chart assumptions, and hull encoding

For Alcubierre-aligned paths, the codebase implements the canonical smooth-top-hat \(f(r_s)\) and analytic derivative \(df/dr_s\) (tier: canonical-authoritative insofar as it is committed implementation used by tests):
\[
f(r_s)=\frac{\tanh(\sigma(r_s+R))-\tanh(\sigma(r_s-R))}{2\tanh(\sigma R)}.
\]
 

For NHM2's Natário-SDF family, the "hull" is encoded by a **signed-distance-function (SDF)** geometry evaluator (ellipsoid/radial/SDF), and the shift field is projected into a divergence-controlled / divergence-minimized field using a Helmholtz–Hodge procedure of the form:
\[
\beta_{\perp} = \beta - \nabla\psi,\qquad \Delta\psi = \nabla\cdot\beta,
\]
implemented numerically (Poisson iteration) on a 3D grid (tier: canonical-authoritative as committed method). 

The metric adapter snapshot constructed for these runs is explicitly labeled as a "bubble-centered coordinates" map in a "comoving_cartesian" chart, again with \(\alpha=1\) and \(\gamma_{ij}=\delta_{ij}\) (tier: canonical-authoritative). 

### Canonical theta semantics and notation mappings

The repository uses **two non-identical meanings of "theta"** that must not be conflated:

* **GR / ADM theta (York-time expansion scalar)**: \(\theta_{\mathrm{GR}} \equiv -K\), the negative trace of extrinsic curvature, and (in flat-slice, \(\alpha=1\), \(\gamma_{ij}=\delta_{ij}\)) \(K \sim \partial_i\beta^i\) under the repo's discrete derivative scheme (tier: canonical-authoritative test + implementation contract).  

* **Engine-facing "thetaScale" (NHM2 pipeline amplitude scalar)**: an application-specific scalar defined in `docs/theta-semantics.md` as
  \[
  \Theta_{\mathrm{eng}} = \gamma_{\mathrm{geo}}^{3}\cdot q \cdot \gamma_{\mathrm{VdB}}\cdot \mathrm{duty}_{\mathrm{FR}},
  \]
  and explicitly stated as the authoritative value emitted by `server/helix-core.ts` for engine uniforms (tier: canonical-authoritative as repo semantics contract). 

The same semantics doc also distinguishes a **Natário diagnostic** `thetaScaleCore_sqrtDuty` that scales as \(\sqrt{\mathrm{duty}}\) and is **not** to be used as the engine theta (tier: canonical-authoritative).

**Conflict disclosure (explicit):** the committed Natário module computes `thetaScaleCore_sqrtDuty` using factors that (by inspection) may include \(\gamma_{\mathrm{VdB}}\) via a shared "geometric amplification" term, while `docs/theta-semantics.md` states the Natário diagnostic omits \(\gamma_{\mathrm{VdB}}\). The repo artifacts in this prompt do not include an authoritative reconciliation note; therefore the \(\gamma_{\mathrm{VdB}}\) inclusion/exclusion in the diagnostic scalar is **UNKNOWN** at manuscript level and should be treated as an implementation-audit item, not paper-level truth (tier: exploratory for interpretation; canonical-authoritative for noting the mismatch exists).  

## Physical Interpretation

In ADM language, \(\alpha\) sets proper-time lapse between hypersurfaces, \(\beta^i\) expresses how spatial coordinates "shift" between slices, and \(\gamma_{ij}\) is the induced 3-metric. NHM2's default adapter specialization (\(\alpha=1\), \(\gamma_{ij}=\delta_{ij}\)) makes the **shift field** the principal geometric degree of freedom for warp-family diagnostics (tier: canonical-authoritative). 

### Expansion, contraction, and shift in this repo's conventions

"Expansion" and "contraction" appear in two distinct ways in the repo:

* In the Alcubierre-alignment framing, \(\theta\) is interpreted as an expansion scalar with a fore/aft sign flip, and the repo's alignment checklist demands that sign flip as a visual/analytic audit (tier: contextual; the audit requirement is repo-authoritative). 

* In the Natário control framing, the key diagnostic is **divergence control** (\(\nabla\cdot\beta \approx 0\)), implemented via Hodge projection and reported as max/rms divergence and curl diagnostics (tier: canonical-authoritative). 

Because the repo's York-time test states \(\theta_{\mathrm{GR}}=-K\), and the Natário machinery computes divergences of \(\beta\), the "zero expansion" goal is concretely a "small \(|K|\)" / "small \(|\nabla\cdot\beta|\)" goal under the repo's sign convention (tier: canonical-authoritative).  

### What \(\rho\), shear, and vorticity mean here

The repo distinguishes:

* **Metric-derived Eulerian energy density** \(\rho_{\mathrm{metric}}\) (often stored/identified by strings like `warp.metric.T00.natario_sdf.shift`), computed from the shift field by estimating extrinsic curvature components and then forming
  \[
  \rho_{\mathrm{geom}}=\frac{K^2-K_{ij}K^{ij}}{16\pi},
  \qquad \rho_{\mathrm{SI}}=\rho_{\mathrm{geom}}\cdot(\texttt{GEOM\_TO\_SI\_STRESS}),
  \]
  in the code's flat-slice approximation (tier: canonical-authoritative implementation contract). 

  This is also asserted by tests that NHM2's Natário and Natário-SDF paths use **metric-derived stress** and set the `metricT00Ref` appropriately (tier: canonical-authoritative test contract). 

* **Proxy / pipeline energy density** \(\rho_{\mathrm{proxy}}\) (e.g., `pipeline.rho_static` in canonical run logs), which is explicitly treated as a different lane that may be coupled to the metric term under a declared coupling policy (tier: canonical-authoritative as a gate-audit field; physical interpretability is not implied). 

In standard kinematics, the spatial derivative of the shift can be decomposed into symmetric and antisymmetric parts. In the repo's discrete flat-slice scheme, the symmetric part is directly used to form \(K_{ij}\) (see next section), so the traceless symmetric part corresponds to **shear-like** behavior, while the antisymmetric part corresponds to **vorticity/curl-like** behavior. The Natário-SDF machinery computes curl diagnostics explicitly (tier: canonical-authoritative). 

### What is exact vs reduced-order vs proxy-based in NHM2

NHM2's "full-solve" is **not** a full physical solve of coupled semiclassical gravity. Rather, the canonical artifacts explicitly describe a **reduced-order** workflow whose admissibility is adjudicated by gates (G0..G8) with explicit "PASS/FAIL/UNKNOWN/NOT_READY/NOT_APPLICABLE" semantics (tier: canonical-authoritative). 

The most relevant exactness boundaries are:

* **Exact within the code-defined model:** given a configured \(\beta^i(x)\), the repo computes finite-difference derivatives, builds \(K_{ij}\), and computes a metric-derived \(\rho\) as above (tier: canonical-authoritative within the model). 

* **Reduced-order / proxy-coupled**: canonical G4 logs explicitly label the base quantity type as a "classical proxy from curvature" while claiming semantic comparability to a renormalized timelike energy density via a "strict evidence gated" bridge (tier: canonical-authoritative about the label; the physical completeness of the bridge is out of scope by policy). 

* **Evidence-lane dependent:** metrology, Casimir sign-control, Q-spoiling, timing, and SEM+ellipsometry are separate lanes with their own closure status and blockers; they do not collapse into the gate verdict (tier: canonical-authoritative as governance posture).  

## Worked Reduced-Order Solve

This section runs one **gate-adjudication** trace as a reduced-order solve example, using only canonical repo artifacts. No interstellar-travel vignette is used; the worked object is the gate computation itself.

### Canonical parameterization and gate context

The canonical campaign execution report (2026-02-24) records:

* Executive verdict: `REDUCED_ORDER_ADMISSIBLE`
* Gate scoreboard (G0..G8): PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1
* Gate G4 diagnostics: `FordRomanQI=pass`, `ThetaAudit=pass`
* Gate G5: `NOT_APPLICABLE` by policy for this campaign context (tier: canonical-authoritative). 

The same report provides a per-wave G4 diagnostic record (waves A-D are numerically identical in the published fields for G4). A canonical row includes (tier: canonical-authoritative):

* \( \text{lhs}_{J/m^3} = -3.093763128722717\)
* \( \text{boundUsed}_{J/m^3} = -24.00000000002375\)
* \(\text{marginRatioRaw} = 0.12890679702998564\)
* \(\tau_s = 2.0\times 10^{-5}\,\mathrm{s}\) (selected/configured)
* \(\tau_{\text{window}} = 10^{-3}\,\mathrm{s}\), \(\tau_{\text{pulse}} = 6.717980877290783\times 10^{-8}\,\mathrm{s}\), \(\tau_{\mathrm{LC}} = 3.358990438645391\times 10^{-6}\,\mathrm{s}\)
* Coupling fields: \(\alpha_{\mathrm{cpl}}=0.5\), \(\rho_{\mathrm{metric}}=-8.988873009553961\times 10^{7}\,J/m^3\), \(\rho_{\mathrm{proxy}}=-2.5512274856810015\,J/m^3\), \(\rho_{\mathrm{shadow}}=-4.494436632338355\times 10^{7}\,J/m^3\)
* Semantic/QEI audit fields: timelike worldline class; Hadamard state class; point-splitting renormalization; unit-integral sampling normalization; operator mapping key `t_munu_uu_ren` (tier: canonical-authoritative as recorded audit fields). 

The same G4 row records a theta constraint audit with \(|\theta| \approx 0.0024036376\) against a declared max of \(10^{12}\), with `ThetaAudit=pass` (tier: canonical-authoritative). 

### From metric assumptions to gate-relevant quantities

#### Metric-derived stress-energy lane (geometry → \(K_{ij}\) → \(\rho\))

NHM2's Natário-SDF stress-energy is asserted in tests to be **metric-derived** with reference key `warp.metric.T00.natario_sdf.shift` (tier: canonical-authoritative). 

In committed code, the metric-derived stress-energy routine computes finite differences of \(\beta(x,y,z)\), forms:
\[
K_{xx}=\partial_x \beta_x,\;
K_{yy}=\partial_y \beta_y,\;
K_{zz}=\partial_z \beta_z,\;
K_{xy}=\tfrac12(\partial_x\beta_y+\partial_y\beta_x),
\]
(and similarly \(K_{xz},K_{yz}\)), then computes:
\[
K=\mathrm{Tr}\,K_{ij}=K_{xx}+K_{yy}+K_{zz},\qquad
K_{ij}K^{ij}=K_{xx}^2+K_{yy}^2+K_{zz}^2+2(K_{xy}^2+K_{xz}^2+K_{yz}^2),
\]
and finally:
\[
\rho_{\mathrm{geom}}=\frac{K^2-K_{ij}K^{ij}}{16\pi},
\qquad \rho_{\mathrm{SI}}=\rho_{\mathrm{geom}}\cdot \texttt{GEOM\_TO\_SI\_STRESS}.
\]
(tier: canonical-authoritative as committed method). 

The canonical campaign report records that the G4 run uses `rhoMetricSource=warp.metric.T00.natario_sdf.shift` with \(\rho_{\mathrm{metric}}=-8.988873009553961\times 10^{7}\,J/m^3\) (tier: canonical-authoritative). 

#### Proxy lane and coupling (explicit, not inferred)

The same canonical artifact records a proxy energy density \(\rho_{\mathrm{proxy}}=-2.5512274856810015\,J/m^3\) from `pipeline.rho_static`, coupled via `couplingAlpha=0.5` to form
\[
\rho_{\mathrm{shadow}} \equiv \alpha_{\mathrm{cpl}}\rho_{\mathrm{metric}} + (1-\alpha_{\mathrm{cpl}})\rho_{\mathrm{proxy}}
= -4.494436632338355\times 10^{7}\,J/m^3,
\]
which matches the value logged in the canonical report (tier: canonical-authoritative; arithmetic shown here is deterministic replay of logged numbers). 

The report explicitly labels this as a "shadow coupling" mode with a "bridge-ready evidence no gate override" semantic, and states that the base quantity is a "classical proxy from curvature" mapped to a "renormalized expectation timelike energy density" type via a "strict evidence gated" semantic bridge (tier: canonical-authoritative as an audit statement; note this is not a physics feasibility claim). 

#### Gate computation: Ford-Roman/QEI margin and theta audit

The repo's commit-pinned scientific analysis describes the FordRomanQI policy shape as
\[
\int dt\, T_{00} \;\ge\; -\frac{K}{\tau^4},
\]
as the governance "shape" expected at the canonical-authoritative tier (tier: canonical-authoritative statement of policy shape; constants/normalizations are still governed by separate provenance and admissibility checks). 

Separately, the repo's QEI worldline primer states the general QEI/QI structure in a "repo-mappable" form (for normalized sampler \(g\)):
\[
\int dt\, g(t)\,\langle T_{00}(t)\rangle_{\mathrm{ren}} \;\ge\; -\frac{C_g}{t_0^{d}},
\quad (d=4\Rightarrow \sim t_0^{-4}),
\]
and emphasizes admissibility conditions on the sampler (smooth, even, nonnegative, normalized) as fail-closed requirements (tier: canonical-authoritative primer).  citeturn1search0

In the canonical campaign report, the gate-relevant quantities provided are:
\[
\text{lhs}=-3.0937631287\;\mathrm{J/m^3},\qquad
\text{boundUsed}=-24.0000000000\;\mathrm{J/m^3}.
\]
The recorded margin ratio is:
\[
\text{marginRatioRaw}=\frac{|\text{lhs}|}{|\text{boundUsed}|}
=\frac{3.0937631287}{24.0000000000}
=0.1289067970 < 1,
\]
which is consistent with the gate's PASS status and is numerically identical to the value stored in the canonical artifact (tier: canonical-authoritative inputs; deterministic recomputation shown). 

For the theta constraint, the canonical report records \(|\theta|\approx 0.0024036376\) with `ThetaAudit=pass`, alongside a declared maximum \(10^{12}\) (tier: canonical-authoritative). 

### Sanity anchors only: GR-observable replay and geometry conformance

The integrity parity suite (2026-03-18) records successful geometry baseline checks for `metric_form_alignment`, `shift_mapping`, `york_time_sign_parity`, `natario_control_behavior`, and `metric_derived_t00_path`, and it reports all four GR observables replays (Mercury, lensing, frame dragging, Shapiro) as signature-compatible within declared tolerances (tier: promoted-candidate / parity layer; used here strictly as a sanity anchor, not a feasibility argument). 

## Guardrails, Price Tag, and Blockers

The "price tag" analogue in NHM2 is not an energy budget for a device; it is the set of **guardrails, applicability limits, and evidence blockers** that constrain what can be claimed.

### QI/QEI guardrails and applicability caveats

The QEI worldline primer makes "domain caveats" explicit: flat-spacetime worldline QEIs do not automatically transfer to curved or bounded settings without short-sampling and applicability evidence; null/spatial averaging is not interchangeable with timelike worldline bounds; and operator-semantic parity requires explicit renormalized stress-tensor mapping (tier: canonical-authoritative). 

The canonical campaign report's G4 record explicitly includes (i) timelike worldline class, (ii) Hadamard/point-splitting scheme labels, (iii) unit-integral sampling normalization, and (iv) a semantic bridge field showing "strict evidence gated" comparability (tier: canonical-authoritative). 

External literature (context only) supports the general existence of quantum inequalities and their role in constraining exotic spacetimes; e.g., Fewster–Eveson (1998) generalizes Ford–Roman style bounds for classes of smooth sampling functions, and Ford–Roman (1996) emphasizes curvature/boundary caveats for applying flat-space bounds (tier: exploratory context; does not override repo policy). citeturn1search0turn0search1

### Stress-energy and energy-condition caveats

The repo’s Alcubierre alignment documentation includes a canonical negative-energy-density form for Alcubierre’s Eulerian energy density (negative sign), emphasizing that classical energy-condition violations are expected in such warp-family constructions (tier: contextual for Alcubierre; canonical for “how the repo audits sign/topology expectations”).  citeturn0search47

NHM2, however, explicitly refuses to turn this observation into a feasibility claim; it treats stress-energy structure as a **guardrail target** and an **audit lane** (e.g., negative-energy branch policy, worldline-QEI requirement, stress-source contract, assumption-domain disclosure, physical-feasibility boundary appear as baseline keys in state-of-record artifacts) (tier: promoted-candidate / capsule layer; but note capsule is itself marked blocked-see below). 

### Evidence-lane closure status and blockers

Promotion readiness is **not equivalent** to the canonical reduced-order gate verdict. The promotion readiness suite (2026-03-18) reports `final_readiness_verdict=PARTIAL` with `readiness_gate_pass=false`, and explicitly blocks `sem_ellipsometry` as not reportable-ready due to `missing_covariance_uncertainty_anchor` and `missing_paired_dual_instrument_run` (tier: parity/readiness overlay; non-overriding). 

The frozen evidence snapshot (2026-03-02) records (tier: canonical-authoritative as a frozen governance artifact) that while a promoted-candidate calculator can show a candidate-pass class in its own lane, the **promotion aggregate** remains `INADMISSIBLE` with `candidatePromotionReady=false` and `candidatePromotionStable=false`, explicitly blocking tier upgrade. 

### Reproducibility blockers (commit-pin and artifact consistency)

The proof-anchor index mandates deterministic regeneration commands and enforces `UNKNOWN_and_fail_closed_for_claim_tier_promotion` when artifacts are missing (tier: canonical-authoritative).  

The reference capsule artifact is explicitly marked `blocked: true` due to commit-pin mismatch between the capsule's own pin and upstream canonical artifacts (tier: promoted-candidate artifact; its blocked flag must be respected). 

Accordingly, any manuscript statement that depends on the capsule's blocked portions must be treated as `UNKNOWN` for promotion purposes, even if the capsule contains otherwise useful derived summaries (tier: canonical-authoritative governance posture applied to a blocked promoted-candidate artifact).  

## Derivation Appendix

This appendix is written to be dense and derivation-forward, while remaining within the repo's fail-closed and non-feasibility bounds.

### Metric and ADM derivations used by NHM2

**Notation block (ADM fields):**

| symbol | definition | units | substitution values | mapped repo variable/path |
|---|---|---|---|---|
| \(\alpha\) | lapse | dimensionless | \(\alpha=1\) | `buildWarpMetricAdapterSnapshot(... alpha: 1 ...)`  |
| \(\beta^i\) | shift vector field | dimensionless (code-level) | `natario_sdf` shift field (explicit form depends on hull SDF; values are run-dependent) = `UNKNOWN` | `shiftVectorField.evaluateShiftVector`  |
| \(\gamma_{ij}\) | spatial metric | dimensionless | \(\gamma_{ij}=\delta_{ij}\) | `gammaDiag: [1,1,1]`  |

**Extrinsic curvature (repo's discrete flat-slice scheme):**

Committed code constructs \(K_{ij}\) from spatial derivatives of \(\beta\) via symmetric combinations (finite differences) and then uses the ADM-like scalar
\[
\rho_{\mathrm{geom}}=\frac{K^2-K_{ij}K^{ij}}{16\pi}
\]
to produce an Eulerian energy density (after multiplying by a conversion constant to SI) (tier: canonical-authoritative implementation). 

### Canonical theta derivation and Natário diagnostic comparison

**Notation block (theta variants):**

| symbol | definition | units | substitution values | mapped repo variable/path |
|---|---|---|---|---|
| \(\theta_{\mathrm{GR}}\) | York-time / expansion scalar for Eulerian observers, with repo sign: \(\theta_{\mathrm{GR}}=-K\) | \(1/\text{length}\) in geometric units; code reports dimensionless diagnostics = `UNKNOWN` | canonical run reports \(|\theta|\approx 0.0024036\) (interpretation of units not specified) | York-time test + canonical run log   |
| \(\Theta_{\mathrm{eng}}\) | engine-facing thetaScale amplitude | dimensionless | depends on \(\gamma_{\mathrm{geo}},q,\gamma_{\mathrm{VdB}},\mathrm{duty}_{FR}\) (values run-dependent; not in canonical report) = `UNKNOWN` | `docs/theta-semantics.md` contract  |
| \(\Theta_{\mathrm{Nat,\sqrt{d}}}\) | Natário diagnostic (\(\propto \sqrt{\mathrm{duty}}\)) | dimensionless | mismatch on \(\gamma_{\mathrm{VdB}}\) inclusion is `UNKNOWN` | `thetaScaleCore_sqrtDuty`   |

In the repo's York-time test, "Alcubierre theta sign convention maps theta to \(-K\)" (tier: canonical-authoritative), making the interpretation:
\[
\theta_{\mathrm{GR}}=-\mathrm{Tr}\,K_{ij}.
\]


In the Natário-SDF machinery, the "expansionScalar" diagnostic is reported from divergence metrics (max/rms divergence), with curl metrics also reported (tier: canonical-authoritative). 

### GR-style derived scalar mappings

Using the shift-gradient tensor \(B_{ij}\equiv\partial_i\beta_j\) (flat slice), define:

* Symmetric part \(S_{ij}=\tfrac12(B_{ij}+B_{ji})\) (this is what the repo uses to form \(K_{ij}\) numerically).   
* Antisymmetric part \(A_{ij}=\tfrac12(B_{ij}-B_{ji})\), which encodes vorticity/curl-like behavior; the repo computes curl norms directly in the Natário-SDF path.   
* Trace \(K=\mathrm{Tr}\,K_{ij}\) and \(\theta_{\mathrm{GR}}=-K\) per repo convention.   

A shear-like scalar can be constructed from the traceless symmetric part:
\[
\sigma_{ij} \equiv K_{ij}-\tfrac13\gamma_{ij}K,\qquad
\sigma^2\equiv \sigma_{ij}\sigma^{ij},
\]
while a vorticity-like scalar can be represented via the curl magnitude \(|\nabla\times\beta|\), which the repo reports as `maxCurl` and `rmsCurl` in Natário-SDF diagnostics (tier: implementation-defined; the canonical report in this prompt does not publish specific maxCurl/rmsCurl numbers, so substitutions are `UNKNOWN`). 

### QI/QEI derivation and sampler admissibility mapping

**Canonical QEI/QI inequality family (context and repo mapping):**
\[
\int dt \, g(t)\,\langle T_{00}(t)\rangle_{\mathrm{ren}}
\ge -\frac{C_g}{t_0^{d}},
\quad \text{(flat spacetime; \(d=4\Rightarrow t_0^{-4}\) scaling)}.
\]
(tier: canonical-authoritative primer; exploratory literature context via APS).  citeturn1search0

**Sampler admissibility (fail-closed):** smooth, even, nonnegative, normalized (repo primer). 

**Repo gate-field mapping (canonical artifact fields):**

| symbol / field | meaning | substitution (canonical run) | units | source |
|---|---|---:|---|---|
| `tau_s` | selected sampling scale | \(2.0\times 10^{-5}\) | s |  |
| `tauWindow_s` | window length | \(10^{-3}\) | s |  |
| `tauPulse_s` | pulse time | \(6.717980877\times10^{-8}\) | s |  |
| `lhs_Jm3` | LHS energy-density proxy for QI test | \(-3.0937631287\) | J/m3 |  |
| `boundUsed_Jm3` | bound used for pass/fail | \(-24.0000000000\) | J/m3 |  |
| `marginRatioRaw` | \(|\mathrm{lhs}|/|\mathrm{bound}|\) | \(0.1289067970\) | unitless |  |

The repo's campaign report also records semantic fields and renormalization scheme labels (`qeiStateClass=hadamard`, `qeiRenormalizationScheme=point_splitting`, `qeiSamplingNormalization=unit_integral`, `qeiOperatorMapping=t_munu_uu_ren`) as part of gate admissibility evidence (tier: canonical-authoritative). 

### GR observable replay equations (sanity anchors)

These equations are required as *framework integrity checks*, not as evidence of feasibility.

**Mercury perihelion (weak-field Schwarzschild):**
\[
\Delta\varpi_{\mathrm{orbit}}=\frac{6\pi GM_\odot}{a(1-e^2)c^2},\qquad
\Delta\varpi_{\mathrm{century}}=\Delta\varpi_{\mathrm{orbit}}\cdot(\text{rad}\to\text{arcsec})\cdot\frac{36525}{P_{\mathrm{days}}}.
\]
(tier: exploratory/reference-only; mapped in repo extraction). 

**Lensing deflection (solar limb, weak field):**
\[
\alpha_{\mathrm{limb,rad}}=\frac{4GM_\odot}{c^2 b},\qquad
\alpha_{\mathrm{limb,arcsec}}=\alpha_{\mathrm{limb,rad}}\cdot(\text{rad}\to\text{arcsec}).
\]
(tier: exploratory/reference-only; mapped in repo extraction). 

**Frame dragging (replay residual forms):** the repo's equation-trace describes residual constructions such as \(\delta=\omega_{\mathrm{measured}}-\omega_{\mathrm{GR}}\) (GP-B) and ratio residuals (LAGEOS family) used in a deterministic replay pipeline (tier: exploratory/reference-only mapping). 

**Shapiro delay:**
\[
\Delta t_{\mathrm{Shapiro}}=(1+\gamma)\frac{2GM_\odot}{c^3}\ln\left(\frac{r_E+r_R+R}{r_E+r_R-R}\right),
\]
with \(\gamma\) constrained by precision tests (tier: exploratory/reference-only mapping). 

The integrity parity suite reports these replays as within tolerance (e.g., Mercury residual \(\approx-0.0193\) arcsec/century; etc.) (tier: promoted-candidate sanity status). 

### Evidence-lane derivation mapping

The experimental parameter registry explicitly maps extracted parameters and equations into derivation chains (timing CH-T-001, nanogap CH-NG-001, Q-spoiling CH-Q-001, Casimir sign-control CH-CS-001, SEM+ellipsometry CH-SE-001, worldline QEI CH-QEI-001, etc.) and declares recompute readiness (`true/partial/.`) per chain (tier: exploratory-to-promoted-candidate, depending on lane; canonical-authoritative only for the governance rule "mark UNKNOWN when missing").  

## Provenance Tables

The tables below satisfy the required column schema. They are *selective*, focusing on the most load-bearing chains for this manuscript; any missing substitution fields are marked `UNKNOWN` by rule.

### Worldline QEI chain provenance (CH-QEI-001)

| source_id | equation_trace_id | equation | substitutions (with units) | mapped_entry_ids | mapped_framework_variables | recompute_status | blocker_reason |
|---|---|---|---|---|---|---|---|
| SRC-051 | EQT-051-01 | inertial worldline QI scaling \(\sim t_0^{-4}\) | prefactor `3/(32*pi^2)`; \(t_0=\tau_0>0\) (units s) | `EXP-QEI-001`, `EXP-QEI-002`, `EXP-QEI-018` | `scaling_ok`, `KDerivation`, `tau_s_ms` | pass | implementation sweep artifacts still required for runtime closure (`UNKNOWN` if not committed here)  |
| SRC-052 | EQT-052-01 | smooth sampler class assumptions | smooth/even/nonnegative + normalized | `EXP-QEI-003..004` | `normalize_ok`, `smoothness_ok`, `samplingKernelIdentity` | partial | constants for every deployed sampler family not replay-verified (`as stated`)  |

### Warp-family geometry chain provenance (CH-WARP-001)

| source_id | equation_trace_id | equation | substitutions (with units) | mapped_entry_ids | mapped_framework_variables | recompute_status | blocker_reason |
|---|---|---|---|---|---|---|---|
| SRC-071 | EQT-071-01 | Alcubierre shift-only metric | \(v_s(t)\), \(f(r_s)\), \(r_s=\sqrt{(x-x_s)^2+y^2+z^2}\) | `EXP-WARP-001..004` | `geometry_signature.shift_mapping`, `york_time_sign_parity`, `metric_form_alignment` | partial | "geometry-first extraction complete; energetics equivalence out of scope"  |
| SRC-072 | EQT-072-01 | Natário metric + div-free control | \(\nabla\cdot X=0\) (symbolic) | `EXP-WARP-005..007` | `natario_control_behavior`, `metric_form_alignment` | partial | observer/normalization parity deferred (`as stated`)  |

### GR observables replay chain provenance (CH-GR-001..004)

| source_id | equation_trace_id | equation | substitutions (with units) | mapped_entry_ids | mapped_framework_variables | recompute_status | blocker_reason |
|---|---|---|---|---|---|---|---|
| SRC-075 | EQT-075-01 | Mercury perihelion replay | observed benchmark `43 arcsec/century`; uncertainty `UNKNOWN` | `EXP-GR-001..005` | `gr_observables.mercury_perihelion.*` | partial | observed-uncertainty extraction unresolved (`UNKNOWN`)  |
| SRC-083 | EQT-083-01 | Shapiro delay replay | \(\gamma-1=2.1\times10^{-5}\pm2.3\times10^{-5}\) | `EXP-GR-016..019` | `gr_observables.shapiro_delay.*` | partial | conservative tolerance policy retained (`as stated`)  |

### SEM+Ellipsometry lane provenance (CH-SE-001) and explicit blocker tie-in

| source_id | equation_trace_id | equation | substitutions (with units) | mapped_entry_ids | mapped_framework_variables | recompute_status | blocker_reason |
|---|---|---|---|---|---|---|---|
| SRC-050 | EQT-050-01 | ellipsometry procedure uncertainty anchors | thickness range `0.1 nm-10 Âµm`; expanded uncertainty `0.5 nm (k=2)`. | `EXP-SE-012..014` | `d_ellip_nm`, `u_ellip_nm` | partial | paired SEM+ellips covariance datasets still required (`as stated`)   |
| (promotion readiness) | UNKNOWN | reportable readiness condition | `missing_covariance_uncertainty_anchor`, `missing_paired_dual_instrument_run` | UNKNOWN | sem_ellipsometry lane | blocked | explicitly blocked in readiness suite  |

## Claim Discipline and Self-Check

### What can be said now

* The canonical campaign decision and gate scoreboard can be stated: `REDUCED_ORDER_ADMISSIBLE` with PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1 (tier: canonical-authoritative).   
* A worked reduced-order gate replay can be shown using canonical G4 fields (lhs, boundUsed, margin ratio, tau fields, semantic/QEI audit labels) without implying physical feasibility (tier: canonical-authoritative).   
* Evidence governance can be stated: claim tiers must not be collapsed; missing values must be `UNKNOWN`; fail-closed blocks tier promotion (tier: canonical-authoritative).    

### What cannot be said now

* No statement of physical feasibility, operational realizability, or viability is authorized by these artifacts; the authoring contract forbids collapsing from reduced-order or promoted-candidate outcomes into feasibility claims, and the boundary statement explicitly excludes feasibility claims (tier: canonical-authoritative).    
* Any claim depending on blocked evidence lanes (notably SEM+ellipsometry reportable readiness) cannot be promoted and must remain `UNKNOWN`/blocked (tier: parity/readiness overlay; enforced by canonical fail-closed policy).    

### Why physical-feasibility claims are out of scope

Because the repo's governance is explicitly built to prevent narrative drift: it separates reduced-order gate admissibility from promotion readiness, treats missing evidence as blocking, and embeds the feasibility boundary as a required statement and as a guardrail (tier: canonical-authoritative).  

### Canonical vs promoted-candidate vs exploratory conclusions (non-collapsed)

* `canonical-authoritative`: the authority chain paths; the 2026-02-24 decision label and scoreboard; the existence of G4 audit fields and pass status; the fail-closed policy and tier constraints.     
* `promoted-candidate`: parity and readiness suites' summaries and replay compatibility statuses; these can support "framework integrity is passing" and "promotion readiness is partial," but do not override the canonical chain.    
* `exploratory`: external work comparison results and literature context, explicitly bounded by non-comparability codes; they provide context but cannot override canonical repo decisions.    

### Self-check (required)

The boundary statement appears verbatim (see Motivation and Boundary).   
The manuscript follows the Alcubierre-note argument order (motivation → metric → interpretation → worked adjudication → price tag).
Equations appear in both main body and appendix (ADM form, metric-derived stress identity, QEI/QI forms, GR observable replays).     
Canonical repo state is not overridden by literature (literature is used only as contextual citation).   
Where values are missing or ambiguous, they are treated as `UNKNOWN` and/or flagged as conflicts rather than inferred (e.g., Natário diagnostic \(\gamma_{\mathrm{VdB}}\) inclusion mismatch).  

