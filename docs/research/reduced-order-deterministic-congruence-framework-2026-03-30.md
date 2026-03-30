# Framework Memo: Reduced-Order Deterministic Congruence in CasimirBot

## Executive Summary

This repo already contains the core building blocks for reduced-order deterministic congruence (RODC): explicit contracts (e.g., `york_diagnostic_contract@v1`), deterministic hashing/provenance in rendering certificates, and staged claim governance (`exploratory -> reduced-order -> diagnostic -> certified`). [filecite](turn46file0#L1) [filecite](turn41file0#L1) [filecite](turn16file0#L1)

In this repo, RODC should mean:

A deterministic, replayable, contract-scoped method for comparing two warp solutions by projecting their (possibly different) underlying representations into a reduced-order feature space, then computing a policy-defined distance plus robustness/stability under near-contract perturbations. RODC yields diagnostic family resemblance verdicts (e.g., low-expansion-like) without claiming physical ontology (e.g., is Alcubierre) unless higher evidence layers (CL0-CL4 / certified stage) are satisfied. [filecite](turn46file0#L1) [filecite](turn28file0#L1) [filecite](turn25file0#L1)

The York control-family proof pack demonstrates this architecture end-to-end: it locks a diagnostic lane (observer + foliation + theta definition + sign convention), extracts morphology features, scores NHM2 against Alcubierre and Natario controls, and classifies the result with a robustness sweep (stable/marginal thresholds). It explicitly states a boundary: it is a render/geometry audit, not a physical feasibility claim. [filecite](turn25file0#L1) [filecite](turn46file0#L1)

The memo below formalizes this into a repo-wide RODC framework that:

Keeps evidence layers separated (full state -> diagnostic projection -> morphology features -> family interpretation), aligns with the repo's staged-math posture (and Congruence Ladder CL0-CL4), and requires deterministic contracts + falsifiers at every promotion step. [filecite](turn16file0#L1) [filecite](turn28file0#L1) [filecite](turn33file0#L1)

## Proposed Congruence Architecture

### Definition of Reduced-Order Deterministic Congruence

In this repo, RODC is not metric identity. It is a comparison protocol producing a constrained claim:

> "Under a declared diagnostic contract (chart/observer/theta convention/normalization), solution A's reduced-order feature vector is congruent to (or distinct from) baseline family B, with stability >= X under contract-local perturbations."

That matches the repo's existing posture that congruence must be explicit about chart/observer/normalization, and that proxy-derived or visualization-only math must not be promoted into physical claims without constraint closure. [filecite](turn27file0#L1) [filecite](turn32file0#L1)

Operationally, RODC is the intersection of three repo patterns:

1. Contract lock (determinism + replayability)  
   The York diagnostic contract encodes the lane: baseline lane id, observer `eulerian_n`, foliation `comoving_cartesian_3p1`, theta definition `theta=-trK`, `kij_sign_convention=ADM`, explicit coordinate views (e.g., `x-z-midplane`, `x-rho`), remap and normalization rules, and scoring thresholds. [filecite](turn46file0#L1)

2. Reduced-order feature projection  
   The contract defines a fixed feature set (e.g., amplitudes, sign counts, overlap %, topology/shell activity) and a distance policy (`weighted_normalized_l1`) with weights and penalties. [filecite](turn46file0#L1)

3. Stability under near-policy variation  
   The contract's robustness checks perturb weights, margins, thresholds, and even drop features; it then labels stable vs marginal via fraction thresholds (`stable_fraction_min=0.8`, `marginal_fraction_min=0.6`). [filecite](turn46file0#L1)

### Evidence-layer separation as first-class architecture

The repo's CL0-CL4 ladder already provides the correct mental model: different edge/claim types require different congruence levels (metric, ADM, derived geometry, stress-energy, guardrails). [filecite](turn28file0#L1)

RODC should be explicitly positioned as:

- Reduced-order / diagnostic-local congruence (typically CL1-CL2 flavored signals in a fixed lane), used for classification and drift detection, not ontology. [filecite](turn46file0#L1)
- Promotion toward ontology-like statements (CL0-CL3) or runtime/guardrail authority (CL4) is governed by staged math maturity and explicit falsifiers. [filecite](turn16file0#L1) [filecite](turn49file0#L1)

### Why without forcing theory identity is structurally enforced

The York contract and audits already encode classification scope = `diagnostic_local_only`. [filecite](turn46file0#L1)  
The audit boundary statement repeats: the proof pack is a geometry/render audit, not feasibility. [filecite](turn25file0#L1)

The architecture should codify the following hard rule:

Family resemblance != ontology.  
A Natario-like low expansion verdict means closest to the Natario control under the declared lane + feature policy, not is a Natario spacetime. The repo's own congruence task plan states this as a goal: lock contracts, prefer geometry-derived quantities when claiming higher congruence levels, and keep pipeline-derived values as telemetry unless constraint-closed. [filecite](turn27file0#L1)

## Required Feature Layers

### Feature-layer table

| layer | purpose | candidate metrics | current repo support | missing pieces |
|---|---|---|---|---|
| full GR state | Preserve the maximum-fidelity, replayable state for CL1-CL3 checks and certified export/parity; enable invariants & constraints | Canonical tensor channels: `alpha`, `beta_*`, `gamma_*`, `K_*`, `K_trace`, `theta`, `rho`, `S*`, constraints (`H_constraint`, `M_constraint_*`); per-channel hashes; `metric_ref_hash`; chart/observer/theta/kij conventions | Strong: render contract defines required channels + render certificate with hashes & conventions [filecite](turn41file0#L1); export contract defines strict metadata lock + parity matrix [filecite](turn42file0#L1) | Repo-wide comparative tooling for CL0 invariants and CL1 field-diff norms isn't standardized in a single congruence baseline harness (York pack is specialized). |
| diagnostic projection | Produce lane-locked views/slices used for deterministic comparison and human audit (York, topology, shell maps) | `HullScientificRenderView` outputs; slice hashes: `theta_channel_hash`, `slice_array_hash`, `normalized_slice_hash`; view-specific support hashes; offline vs rendered parity | York proof pack emits per-view evidence: raw/display extrema, hashes, support overlap, plus offline slice audit outcomes [filecite](turn25file0#L1); render certificate schema carries these diagnostics [filecite](turn41file0#L1) | Additional supported lanes (alternate observer/foliation) are explicitly pending in the contract, so cross-lane congruence is currently structurally inconclusive [filecite](turn46file0#L1) [filecite](turn25file0#L1) |
| morphology features | Compress projections into a small, deterministic vector usable for scoring/stability sweeps | York contract set: `theta_abs_max_raw`, `theta_abs_max_display`, sign counts in xz/xrho, `support_overlap_pct`, `near_zero_theta`, `signed_lobe_summary`, `shell_map_activity`; plus topology signals like `zero_contour_segments` (available in render diagnostics) | York diagnostic contract provides feature list + weights + thresholds [filecite](turn46file0#L1); audit shows extracted feature table & distances [filecite](turn25file0#L1) | Broader morphology library isn't standardized across other views (e.g., shift-shell, causal/optical panes) despite atlas panes existing [filecite](turn41file0#L1) |
| family interpretation | Convert feature distances into controlled labels (congruent/distinct/marginal/unstable), while preventing ontology creep | Distance-to-baselines, margin checks, distinctness threshold, robustness fraction; precondition gating (controls independent, required views rendered, provenance hashes present, runtime provenance present); cross-lane agreement status | Audit defines preconditions and forces verdict to `inconclusive` when unmet (example 2026-03-29) [filecite](turn24file0#L1); 2026-03-30 run shows calibrated lane and stable `nhm2_low_expansion_family` under 28 variants [filecite](turn25file0#L1) | Repo-wide taxonomy for congruent vs distinct vs marginal vs unstable across multiple proof packs (York, render benchmark, future invariants) needs a common schema and claim registry alignment [filecite](turn32file0#L1) |

### Layering rule that must be documented as policy

To keep diagnostic family resemblance separate from physical ontology, the repo should enforce:

- A feature vector always includes the diagnostic contract identifiers (contract id, version, lane id) because features are lane-relative. [filecite](turn46file0#L1)
- Any family verdict must be accompanied by precondition status and robustness fraction, otherwise it is inconclusive. This is already how the proof pack behaves. [filecite](turn24file0#L1) [filecite](turn25file0#L1)

## Reduced-Order Baseline Roles

### Baselines as calibration anchors, not ontological templates

The repo's York diagnostic contract explicitly defines two reference controls:

- `alcubierre_control`: role = `high_expansion_calibration_reference`
- `natario_control`: role = `low_expansion_calibration_reference` [filecite](turn46file0#L1)

These are not truth labels; they are calibration anchors used to validate that the diagnostic lane is implemented consistently (sign conventions, slicing, remaps, rendering, normalization).

This is reinforced by the proof pack's decision table language: controls calibrate the lane; only after preconditions pass is NHM2 classified relative to them. [filecite](turn25file0#L1)

### What Alcubierre and Natario contribute scientifically in this repo

At the paper level (external reference), Alcubierre provides the canonical ADM expression and warp metric in a slicing with `alpha=1`, flat `gamma_ij`, and shift `beta^x = -v_s f(r_s)` (and the tanh shape function). [cite](turn4view0) [cite](turn4view1)  
Natario defines the warp-drive class via a vector field `X` with line element `ds^2 = -dt^2 + Sum_i (dx^i - X^i dt)^2`, gives the extrinsic curvature `K = 1/2 (partial_i X_j + partial_j X_i)`, and identifies Eulerian expansion as `theta = nabla·X`, explicitly enabling zero expansion constructions. [cite](turn5view0) [cite](turn4view2)

In-repo, their role should be sharply constrained:

- RODC baseline role: anchor endpoints in feature space (strong signed lobe vs low-expansion) under a declared diagnostic lane. [filecite](turn46file0#L1)
- Lane sanity role: if the Alcubierre control fails to show the expected signed lobe morphology (fore/aft sign structure), the lane is treated as suspicious or inconclusive (as happened in the 2026-03-29 audit where preconditions failed). [filecite](turn24file0#L1)
- Non-role: they must not silently force parameter identity (e.g., sigma mapping) onto NHM2; such mappings remain separate, cited, and stage-governed (the scientific congruence task explicitly rejects forcing Needle Hull parameters and Needle Hull papers as runtime authority). [filecite](turn27file0#L1)

### NHM2 baselines: internal certified solve identity, external family resemblance

In the York proof pack, NHM2 appears as a case named `nhm2_certified`, and the request enforces `requireNhm2CongruentFullSolve=1`. [filecite](turn25file0#L1)  
That implies two distinct baseline roles:

- Solve identity baseline (internal): this NHM2 run corresponds to an internally congruent full solve snapshot. This is closer to full GR state identity and should be treated as a certificate-like prerequisite, not a morphology result. (The repo's broader export/certificate ecosystem supports this pattern via certificate hashes, channel hashes, and strict mismatch failures.) [filecite](turn41file0#L1) [filecite](turn42file0#L1)
- Morphology baseline (reduced-order): NHM2 is low-expansion-like vs Alcubierre-like vs distinct under the York contract. In the 2026-03-30 audit, NHM2 is decisively closest to Natario-like low expansion (`distance_to_low_expansion_reference~=0.00125` vs `distance_to_alcubierre_reference~=0.1356`) with stable dominance across 28 robustness variants. [filecite](turn25file0#L1)

The framework should require that these are reported and stored separately to prevent certified solve identity from being misread as theory identity.

## Drift/Regression Tracking Model

### Drift must be tracked at three strata

The repo already demonstrates the right model: scripts write dated artifacts + latest pointers, and audits embed provenance (commit hash/build hash/runtime instance id). [filecite](turn25file0#L1) [filecite](turn43file0#L1)

RODC drift tracking should explicitly separate:

Contract drift (what policy changed?)  
- Contract ids/versions and lane ids must be versioned and diffable (York does this via `york_diagnostic_contract@v1`). [filecite](turn46file0#L1)

Implementation drift (did the same inputs yield different projections?)  
- Use per-view hashes already present (`theta_channel_hash`, slice hashes) and require them in strict comparisons; the proof pack already requires provenance hashes and blocks verdicts when missing. [filecite](turn25file0#L1)

Sampling/data drift (was the run even comparable?)  
- The render congruence benchmark shows how insufficient events makes the lane inconclusive even if other anchors pass: latest benchmark is `PARTIAL` because the render lane had only 1 displacement event (required >=6). [filecite](turn45file0#L1)

### Recommended concrete drift artifact format

Adopt a canonical JSON artifact per RODC run, intentionally similar to existing audit payloads:

- `artifactType: warp_rodc_snapshot/v1`
- `contract: {id, version, lane_id}`
- `inputs: {metricT00Ref, shape_function_id, dims, steps, solver params}`
- `provenance: {repo_commit_sha, serviceVersion, buildHash, runtimeInstanceId, timestamp_ms}`
- `evidence_hashes: {metric_ref_hash, theta_channel_hash, K_trace_hash, slice_hashes_by_view}`
- `feature_vector: {named_features...}`
- `distance: {to_alcubierre, to_natario, to_other_baselines...}`
- `policy: {weights, thresholds, margin_min, normalization_method}`
- `robustness: {totalVariants, dominantFraction, stabilityStatus, counts_by_verdict}`
- `preconditions: {controlsIndependent, requiredViewsRendered, provenanceHashesPresent,...}`
- `verdict: {family_label, status: congruent|distinct|inconclusive, stability: stable|marginal|unstable}`

The York proof pack already emits most of these fields in its markdown audit; the missing gap is committing the corresponding machine-readable JSON artifact that the docs reference but which is not present in the repo tree at the expected path (e.g., `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json` is currently not found). [filecite](turn25file0#L1)

### Regression enforcement hooks already present in repo patterns

Two existing mechanisms should be reused directly:

- Deterministic matrix build + validate pattern  
  The math congruence matrix is deterministically generated and validated byte-for-byte (`validate-math-congruence-matrix.ts` rejects drift from the builder output). [filecite](turn33file0#L1) [filecite](turn34file0#L1)  
  RODC should have the same: a builder script that generates the expected baseline snapshot set, and a validator that fails CI if snapshots drift without an explicit update process.

- Checksum + boundary statement pattern for research audits  
  The render congruence benchmark computes a checksum over a canonicalized payload and includes an explicit boundary statement (not a physical warp feasibility claim). [filecite](turn43file0#L1) [filecite](turn44file0#L1)

## Falsifiers and Promotion Rules

### Promotion-rule table

| stage | allowable claim | required evidence | falsifier |
|---|---|---|---|
| exploratory | Prototype comparison / visualization only; no scientific congruence claim. | Must carry stage tag + doc-only checks per stage registry; no hard guardrails based on it [filecite](turn18file0#L1) | Any attempt to use exploratory outputs to justify CL3/CL4 decisions or theory identity (policy lint + CI). [filecite](turn16file0#L1) |
| reduced-order | Reduced-order congruence under contract X: feature vectors + distance policy; diagnostic family resemblance only. | Versioned contract; deterministic feature extraction; stored feature vector + distances; explicit boundary statement and scope tag (diagnostic-local) [filecite](turn46file0#L1) | Re-run with same contract+inputs yields materially different feature vector/distances outside tolerance; or missing contract fields causes strict failure. [filecite](turn32file0#L1) |
| diagnostic | Diagnostic-lane congruence: projections/hashes are consistent; controls calibrate lane; stability evaluated; verdict allowed only if preconditions pass. | Full precondition set (controlsIndependent, required views rendered, provenance hashes present, runtime provenance present) plus robustness sweep results [filecite](turn25file0#L1) | Any failed precondition forces `inconclusive` (as in 2026-03-29); cross-lane mismatch once alternate lanes are supported; offline-vs-render parity failure. [filecite](turn24file0#L1) |
| certified | Repo-authoritative decision (policy gate / certificate) based on geometry/constraint-derived quantities; eligible for CL4 guardrail congruence. | Certificate integrity + policy checks aligned with math stage governance; strict fail-closed on contract mismatch and missing authority chains [filecite](turn18file0#L1) [filecite](turn42file0#L1) | Certificate hash mismatch, channel hash mismatch, metadata mismatch, or constraint/guardrail violations; must fail closed (explicit failure codes). [filecite](turn42file0#L1) |

### What counts as congruent, distinct, marginal, unstable (repo-standard semantics)

The York contract already encodes most of this; the framework should elevate it to a shared vocabulary across proof packs. [filecite](turn46file0#L1)

Congruent (family-congruent under a contract)  
- Preconditions pass (views rendered, hashes present, controls independent, runtime provenance present). [filecite](turn25file0#L1)  
- Winning reference distance <= `reference_match_threshold` and margin >= `reference_margin_min`. [filecite](turn46file0#L1)  
- Robustness dominance fraction >= `stable_fraction_min` (stable) or >= `marginal_fraction_min` (marginal). [filecite](turn46file0#L1)

Distinct  
- Preconditions pass, but no baseline wins with sufficient margin, or all baseline distances exceed `distinctness_threshold` (as defined by policy). [filecite](turn46file0#L1)  
- Result should be distinct family under this lane, not new theory.

Marginal  
- Preconditions pass, but robustness dominance is between marginal and stable thresholds (e.g., 0.6-0.8). [filecite](turn46file0#L1)  
- Must ship with what flipped evidence (which perturbations caused alternate verdicts).

Unstable  
- Preconditions fail (forced inconclusive), or robustness dominance < marginal threshold, or supported lanes disagree once multiple lanes exist. The contract already anticipates lane incompleteness by marking the alternate lane unsupported and treating cross-lane comparison as inconclusive. [filecite](turn46file0#L1) [filecite](turn25file0#L1)

### Attaching falsifiers so the framework stays scientific

The repo already has a falsifier-first mindset in two places that should be unified:

- The root-to-leaf theory congruence audit requires each path to define observable, reject rule, uncertainty model, and concrete test references. [filecite](turn49file0#L1)
- The math congruence matrix generator encodes per-equation residual metrics and falsifiers in a deterministic schema. [filecite](turn33file0#L1)

RODC should adopt the same schema style:

A congruence claim is not valid unless it has:
- a named observable (feature vector + lane hashes),
- a reject rule (threshold/margin/stability fraction),
- an uncertainty model (robustness sweep definition),
- and evidence pointers (artifact paths + commit hash).

Needle Hull citation trace is a good negative example: it is explicitly labeled `provided_unverified` and thus cannot serve as runtime authority until promoted. [filecite](turn15file0#L1)  
The framework should replicate that style: unverified mappings stay quarantined and cannot accidentally become baselines.

## Recommended Repo Artifacts to Add

### Versioned contracts and schemas

Add a dedicated spec + schema for RODC artifacts to avoid each proof pack inventing its own semantics:

- `docs/specs/warp-rodc-contract-v1.md`  
  Define required fields: contract id/version, lane id, required views, required hashes, feature definitions, distance metric, robustness sweep definition, and boundary statements.
- `shared/warp-rodc-contract.ts` (or `shared/warp-rodc-schema.ts`)  
  Typed schema used by scripts/tests, mirroring the approach used in hull export/render contracts. [filecite](turn41file0#L1)

### Machine-readable outputs that docs already reference but are missing

The York proof pack and related audits reference JSON artifacts under `artifacts/research/full-solve/...`, but some expected files are not present in the repo (404 when fetched). The framework should decide one of:

- Commit small, canonical latest JSON summaries (feature vectors + hashes, not full volumes), or
- Use Git LFS for larger artifacts, or
- Add a clearly documented artifacts are local only policy and stop linking missing paths from committed docs.

At minimum, commit the reduced-order evidence JSON for each audit, because it is the primary machine-checkable source for drift/regression.

### Drift check automation

Add:

- `scripts/warp-rodc-drift-report.ts`  
  Loads latest + last N dated artifacts, computes deltas per feature + per-distance + per-hash, and emits:
  - `docs/audits/research/warp-rodc-drift-latest.md`
  - `artifacts/research/full-solve/warp-rodc-drift-latest.json`
- `tests/warp-rodc-drift.spec.ts`  
  Enforces no silent drift unless a baseline update is explicitly approved.

Model these after existing practice:
- Dated + latest outputs, checksum, boundary statement (render benchmark pattern). [filecite](turn43file0#L1)
- Deterministic builder/validator coupling (math congruence matrix pattern). [filecite](turn34file0#L1)

### Claim registry integration

Extend the claim registry direction from the math congruence research plan into warp RODC:

- `docs/knowledge/math-claims/warp-rodc.claims.v1.json`  
  Each claim row: id, stage tier, CL requirement, contract id/version, baselines used, falsifier, evidence paths.

This directly supports the repo's stated goals:
- detect cross-layer drift,
- make claims traceable,
- separate diagnostic visualization math from certified physics math,
- provide CI-visible gates. [filecite](turn32file0#L1)

## Claims Matrix

The matrix below separates what the repo can already claim (with cited artifacts) from what would require new evidence or promotion. It also encodes the diagnostic resemblance vs physical ontology boundary.

| claim | meaning in this repo | maturity stage ceiling | CL ceiling | current evidence | falsifier / failure mode |
|---|---|---|---|---|---|
| York diagnostic contract defines a deterministic lane and feature policy for classification | Contract-locked how to compare (observer/foliation/theta convention, views, remaps, weights, thresholds, robustness sweep) | diagnostic | CL1-CL2 (lane-local) | `configs/york-diagnostic-contract.v1.json` [filecite](turn46file0#L1) | Contract missing/changed without version bump; missing required views/hashes violates strict mode. [filecite](turn46file0#L1) |
| York proof pack is a geometry/render audit, not feasibility | Forces claim boundary: no ontology / no warp works conclusion | diagnostic | CL2 (morphology) | Proof pack boundary statement in audit header [filecite](turn25file0#L1) | Any downstream use of this verdict to justify certified/CL4 claims without separate evidence violates `MATH_STATUS` governance. [filecite](turn16file0#L1) |
| A family verdict is allowed only when preconditions pass | Deterministic fail closed: missing renders/hashes/controls independence forces inconclusive | diagnostic | CL2 | Preconditions table + 2026-03-29 inconclusive run [filecite](turn24file0#L1) | Any code path that emits a non-inconclusive verdict when preconditions fail is a falsifier. [filecite](turn24file0#L1) |
| NHM2 is low-expansion-like under the supported York lane in the 2026-03-30 run | Under lane A and the contract policy, NHM2 is closest to Natario-like control with robust dominance | diagnostic | CL2 | 2026-03-30 audit: distances, margin, dominanceFraction=1 across 28 variants [filecite](turn25file0#L1) | Re-run under same contract+inputs yields different verdict, or robustness dominance drops below stable threshold. [filecite](turn25file0#L1) |
| Cross-lane congruence is currently inconclusive | Alternate lane is explicitly unsupported; comparisons must not overclaim cross-lane invariance | diagnostic | CL2 | Contract marks lane B unsupported; audit reports cross-lane inconclusive [filecite](turn46file0#L1) [filecite](turn25file0#L1) | Any cross-lane same classification claim before lane B implementation is a falsifier. [filecite](turn46file0#L1) |
| Render congruence drift must be separable from observable parity | Renderer vs metric displacement can be inconclusive even when integrity suite parity anchors pass | diagnostic (research audit) | CL2-ish (render parity) | Benchmark latest: overall PARTIAL because render lane inconclusive; observables PASS [filecite](turn45file0#L1) | Treating PASS observables as proof that render lane is calibrated is a falsifier; min event requirement is deterministic. [filecite](turn43file0#L1) |
| CL0-CL4 ladder governs what congruence means at each layer | Prevents linking nodes/claims without required evidence | policy / diagnostic | CL0-CL4 | `docs/warp-tree-dag-congruence-policy.md` [filecite](turn28file0#L1) | An edge/claim that asserts equivalence without meeting required CL is invalid by policy. [filecite](turn28file0#L1) |
| Staged-math posture caps claim strength | What can be said depends on stage; certified requires tests/policy/certificates | repo governance | N/A | `MATH_STATUS.md`, stage registry in `shared/math-stage.ts`, evidence profiles [filecite](turn16file0#L1) [filecite](turn18file0#L1) [filecite](turn20file0#L1) | Any claim exceeding its stage ceiling (e.g., treating reduced-order resemblance as certified truth) is a falsifier; CI should enforce via stage tooling. [filecite](turn16file0#L1) |
| Needle Hull citation trace is provenance-only until promoted | Explicit quarantine of unverified mappings | exploratory / diagnostic-only | none | `docs/needle-hull-citation-trace.md` status `provided_unverified` [filecite](turn15file0#L1) | Using this trace as runtime parameter authority without promotion is a falsifier (policy + lint). [filecite](turn15file0#L1) |

### Closing note: what RODC should not be allowed to mean here

RODC must never be a synonym for same warp theory, physical feasibility, or metric equivalence, because the repo is designed to keep those claims gated by CL-level evidence and stage governance. The scientific congruence task explicitly states the direction: lock contracts, prefer geometry/constraint-derived quantities for hard decisions, and label proxy outputs as telemetry. [filecite](turn27file0#L1)

## Source Inventory From This Research Run

This appendix records the source list returned by the research run that produced this memo. The intent is provenance retention. Repo files and primary papers remain the authoritative sources for code and equation-level claims; the wider scan list is discovery context unless it resolves back to those sources.

### Named citations from the run

#### Direct repo sources

- `configs/york-diagnostic-contract.v1.json`
  - `https://github.com/pestypig/casimirbot-/blob/main/configs/york-diagnostic-contract.v1.json`
- `shared/hull-render-contract.ts`
  - `https://github.com/pestypig/casimirbot-/blob/main/shared/hull-render-contract.ts`
- `MATH_STATUS.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/MATH_STATUS.md`
- `docs/warp-tree-dag-congruence-policy.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/warp-tree-dag-congruence-policy.md`
- `docs/audits/research/warp-york-control-family-proof-pack-2026-03-30.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/audits/research/warp-york-control-family-proof-pack-2026-03-30.md`
- `scripts/build-math-congruence-matrix.ts`
  - `https://github.com/pestypig/casimirbot-/blob/main/scripts/build-math-congruence-matrix.ts`
- `docs/warp-scientific-congruence-task.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/warp-scientific-congruence-task.md`
- `docs/math-congruence-research-plan.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/math-congruence-research-plan.md`
- `docs/audits/root-to-leaf-theory-congruence-audit.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/audits/root-to-leaf-theory-congruence-audit.md`
- `docs/specs/hull-scientific-export-contract-v1.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/specs/hull-scientific-export-contract-v1.md`
- `docs/audits/research/warp-york-control-family-proof-pack-2026-03-29.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/audits/research/warp-york-control-family-proof-pack-2026-03-29.md`
- `scripts/warp-render-congruence-benchmark.ts`
  - `https://github.com/pestypig/casimirbot-/blob/main/scripts/warp-render-congruence-benchmark.ts`
- `docs/audits/research/warp-render-congruence-benchmark-latest.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/audits/research/warp-render-congruence-benchmark-latest.md`
- `scripts/validate-math-congruence-matrix.ts`
  - `https://github.com/pestypig/casimirbot-/blob/main/scripts/validate-math-congruence-matrix.ts`
- `docs/audits/research/warp-render-congruence-benchmark-2026-03-23.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/audits/research/warp-render-congruence-benchmark-2026-03-23.md`
- `shared/math-stage.ts`
  - `https://github.com/pestypig/casimirbot-/blob/main/shared/math-stage.ts`
- `docs/needle-hull-citation-trace.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/needle-hull-citation-trace.md`
- `math.evidence.json`
  - `https://github.com/pestypig/casimirbot-/blob/main/math.evidence.json`

#### Primary paper links surfaced by the run

- Miguel Alcubierre, `gr-qc/0009013`
  - `https://arxiv.org/pdf/gr-qc/0009013`
- Jose Natario, `gr-qc/0110086v3`
  - `https://arxiv.org/pdf/gr-qc/0110086`

### Connector-scanned repo context from the run

The run also reported a broader connector scan across repo materials relevant to congruence and staged claim governance. Notable items included:

- `tests/warp-york-control-family-proof-pack.spec.ts`
- `docs/audits/research/warp-york-control-family-proof-pack-latest.md`
- `MATH_GRAPH.json`
- `math.config.json`
- `math.waivers.json`
- `docs/warp-congruence-build-plan.md`
- `docs/warp-geometry-congruence-synthesis.md`
- `docs/warp-geometry-congruence-report.md`
- `docs/warp-geometry-congruence-state-of-the-art.md`
- `docs/warp-full-congruence-closure-task.md`
- `server/services/evolution/congruence-gate.ts`
- `client/src/lib/congruence-meta.ts`
- `shared/hull-export-contract.ts`
- `server/lib/hull-scientific-atlas-validation.ts`
- `server/lib/hull-scientific-snapshot.ts`
- `server/routes/hull-export.ts`

These connector-scanned repo sources reinforce the framework memo's main themes:

- deterministic contract locking
- stage-gated claim strength
- parity / congruence validation
- certificate-backed export and render boundaries

### Broader scanned context from the run

The run reported `Sources scanned: 139`. That broader scan included:

- mirrors and repository copies of Alcubierre, Natario, and Gourgoulhon
- bibliographic and citation index pages
- later warp-drive literature such as `warp drive aerodynamics` and `ADM mass in warp drive spacetimes`
- publisher landing pages and archive mirrors

Representative examples named in the scan:

- ResearchGate mirror for Natario:
  - `https://www.researchgate.net/publication/1964573_Warp_Drive_With_Zero_Expansion`
- ResearchGate mirror for Alcubierre:
  - `https://www.researchgate.net/publication/1963139_The_Warp_Drive_Hyper-fast_Travel_Within_General_Relativity`
- ResearchGate entry for Gourgoulhon:
  - `https://www.researchgate.net/publication/1972628_31_Formalism_and_Bases_of_Numerical_Relativity`
- Springer landing page for `Warp drive aerodynamics`
  - `https://link.springer.com/article/10.1007/JHEP08%282022%29288`
- Springer landing page for `ADM mass in warp drive spacetimes`
  - `https://link.springer.com/article/10.1007/s10714-022-03061-9`

These broader sources are useful for discovery and follow-up, but they should not outrank the repo itself or the primary papers when the memo is used as a decision baseline.
