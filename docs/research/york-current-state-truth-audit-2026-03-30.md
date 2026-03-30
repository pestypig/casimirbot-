# Repo-Truth Audit: York Diagnostic Framework at commit eadb671862c89aafdae48949ecd9cb0630aa1b85

## Executive Summary

At the target commit, the repo's "York diagnostic" path is implemented as a **scientific-lane rendering + certificate-gated proxy** that is designed to fail closed by default, and to treat York plots as **same-snapshot diagnostics** of a single NHM2 solve (not as a claim about simultaneous multi-parameter or multi-lane "system identity"). The most enforceable "truth" the repo currently provides is **contract enforcement**, especially at the render boundary: the server proxy validates a render certificate (schema version, hash, channel-hash completeness), enforces York-view metadata invariants (field key, slice plane, coordinate mode, normalization), and explicitly blocks "hidden gain" in raw York views by requiring `display_gain===1`. [filecite](turn17file0#L1)

The repo also wires the York workflow to a broader "scientific lane" posture that prefers an **OptiX-first** remote render service and, under default settings, effectively **requires** a remote research-grade frame instead of silently falling back to local deterministic imagery. [filecite](turn17file0#L1)

Where the repo is weaker (and where over-claim risk is highest) is that the render certificate is a **self-hash integrity object**, not a cryptographic proof of correctness: the proxy can verify internal consistency, but it does not independently recompute or attest that channel hashes match a trusted metric volume, nor does it cryptographically bind the remote renderer's outputs to a trusted hardware/software stack. [filecite](turn17file0#L1)

A required research artifact (`artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`) is **not present at this commit** via repository lookup/fetch, which limits the audit's ability to independently re-derive the "latest" proof-pack results purely from committed machine outputs (as opposed to reading the narrative audit markdown). (See "Current Unknowns".)

## Current York Diagnostic Contract

The repo implements York diagnostics as a contract spanning:

- **A lane identifier** that implies a fixed set of conventions (chart, observer, theta definition, K sign convention).
- **A fixed set of York render views** (time slice, surfaces, topology-normalized variant, shell-map variants).
- **A canonical channel contract** (ADM fields + derived fields + constraint channels) that must be present in the certified render output.
- **A render certificate schema** (`nhm2.render-certificate.v1`) that records channel hashes, snapshot identity fields, render metadata, and scalar diagnostics (null residual, step convergence, bundle spread, constraint RMS, support coverage). [filecite](turn18file0#L1)

### Baseline lane conventions currently recognized by the server

The server-side render proxy presently hardcodes *one* York diagnostic lane convention mapping:

- `lane_a_eulerian_comoving_theta_minus_trk`
  - `chart: "comoving_cartesian"`
  - `observer: "eulerian_n"`
  - `theta_definition: "theta=-trK"`
  - `kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)"` [filecite](turn17file0#L1)

This matters because if a caller requests a York view with a `diagnosticLaneId`, the proxy will reject certificates that do not match the lane's declared conventions and lane IDs. [filecite](turn17file0#L1)

### York diagnostic "same-snapshot" rule

The proxy includes an explicit "same-snapshot congruence" rule for York views: it requires snapshot identity fields (metric reference hash, chart, observer, theta definition, K sign convention, unit system, timestamp) and (when a `metricVolumeRef.updatedAt` exists) requires the certificate's timestamp to match it. [filecite](turn17file0#L1)

Repo-truth implication: **York views are treated as renderings of one snapshot**, and the code comments explicitly warn that parameter-family comparisons are separate products and must not be represented as a single simultaneous system. [filecite](turn17file0#L1)

### Canonical channel requirements bound into certificates

The shared contract enumerates the canonical channel IDs that York/"scientific lane" rendering expects, including lapse/shift, spatial metric gamma components, extrinsic curvature K components, traces, theta, rho, stress-energy projections, and constraint channels (Hamiltonian and momentum constraints). [filecite](turn18file0#L1)

Repo-truth implication: a "scientific" York deliverable is not just an image; it is an image **plus** a certificate that asserts availability/hashes for a large canonical tensor/constraint set. [filecite](turn18file0#L1)

## Evidence Chain: Solver -> Brick -> Render -> Certificate -> Proof-Pack

This section describes what the codebase enforces as the **evidence chain** and where each link is validated.

### Solver and "congruent NHM2 full-solve" gate

The render proxy can enforce a "congruent NHM2 full-solve" readiness gate before it will serve a frame, returning HTTP 422 if the gate is required and the global pipeline state is not PASS. [filecite](turn17file0#L1)

In tests, this gate is modeled as `congruentSolve: { pass, policyMarginPass, computedMarginPass, applicabilityPass, metricPass, semanticPass, strictMode, failReasons }`, and the router exposes its snapshot in `/status`. [filecite](turn17file0#L1) [filecite](turn19file0#L1)

Repo-truth implication: the repo distinguishes "NHM2 solve classification" (pass/fail + sub-reasons) from render output, and can *block rendering* in workflows that demand "congruent full solve PASS." [filecite](turn17file0#L1)

### Brick: metric volume reference

The render request supports a `metricVolumeRef` object of kind `gr-evolve-brick`, recording a URL, optional source/chart/dimensions/updatedAt, and an optional hash. [filecite](turn18file0#L1)

Repo-truth implication: the render layer is designed to take an explicit reference to a brick/volume object, and the certificate validator can enforce `metric_ref_hash` equality when that `metricVolumeRef.hash` is supplied. [filecite](turn17file0#L1) [filecite](turn18file0#L1)

### Render: remote scientific service selection and strictness posture

The proxy prefers an **OptiX-first** backend by default and defines default endpoints for OptiX and Unity services (loopback ports 6062 and 6061 respectively). It also supports an "auto" mode that orders candidates `[optix, unity, generic]` in preference. [filecite](turn17file0#L1)

Crucially, the proxy enforces "scientificness" depending on strict flags:

- It can reject frames that appear "synthetic/fallback/scaffold/teaching" based on diagnostics note/provenance. [filecite](turn17file0#L1)
- It can require a "research-grade" tier signaled by provenance/diagnostics fields. [filecite](turn17file0#L1)
- It can require a specific provenance source prefix. [filecite](turn17file0#L1)

The tests affirm that in strict mode the router fails closed when remote is unconfigured or returns non-scientific frames, and that it does not silently fall back to a local deterministic renderer unless explicitly allowed by environment overrides. [filecite](turn19file0#L1)

### Certificate: what is validated, and what is not

The proxy requires a `HullRenderCertificateV1` in strict/scientific contexts and validates:

- The schema version matches `nhm2.render-certificate.v1`. [filecite](turn18file0#L1)
- The `certificate_hash` equals `sha256(stableStringify(certificateBody))` (certificate body excludes the hash field). [filecite](turn17file0#L1)
- Required canonical channels have non-empty hashes. It also conditionally requires off-diagonal gamma channel hashes and hull support channels for shell-map views. [filecite](turn17file0#L1)
- View-specific metadata invariants for York views (examples below). [filecite](turn17file0#L1)

However, repo-truth limitation: this is an **integrity and contract check**, not a cryptographic proof. The hash verifies internal consistency of what the remote returned; it does not prove the remote computed values correctly, nor does the proxy recompute channel hashes from a locally verified volume. [filecite](turn17file0#L1)

### Proof-pack: how the repo packages evidence

The proof-pack script and its tests establish that the York workflow is intended to produce a "proof pack" output for a control-parameter family, and the repo includes a "latest" research audit markdown in `docs/audits/research/warp-york-control-family-proof-pack-latest.md`. [filecite](turn10file0#L1) [filecite](turn11file0#L1) [filecite](turn12file0#L1)

Repo-truth limitation: the requested machine-readable "latest JSON" artifact at `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json` could not be fetched/found at this commit in-repo, so the audit cannot fully "replay" the proof-pack from committed structured outputs. (See "Current Unknowns".)

## Current Established Results

This section answers the user's concrete questions in "repo-truth" terms (what is enforced and evidenced by code/tests/docs at this commit).

### What exactly is the current baseline York diagnostic lane?

Repo-truth answer: the **only** York diagnostic lane with explicit convention enforcement in the server proxy is:

- `lane_a_eulerian_comoving_theta_minus_trk` with:
  - `chart = comoving_cartesian`
  - `observer = eulerian_n`
  - `theta_definition = theta=-trK`
  - `kij_sign_convention = K_ij=-1/2*L_n(gamma_ij)` [filecite](turn17file0#L1)

When a caller supplies `scienceLane.diagnosticLaneId` for a York view, the proxy checks that the render certificate includes both render and diagnostics lane IDs and that the convention fields exactly match the lane definition; otherwise it fails closed. [filecite](turn17file0#L1)

### What does the proof-pack currently do, step by step?

Repo-truth answer (from code structure and interfaces):

- It operates on a **control-family** parameterization exposed in the render request as `solve: { beta, alpha, sigma, R, chart }` and couples it with geodesic diagnostics (null residual, step convergence, bundle spread) and optionally a metric volume reference (`gr-evolve-brick`). [filecite](turn17file0#L1) [filecite](turn18file0#L1)
- It requests one or more York scientific render views via `scienceLane.renderView`, which explicitly enumerates available York views: `york-time-3p1`, `york-surface-3p1`, `york-surface-rho-3p1`, `york-topology-normalized-3p1`, `york-shell-map-3p1`, plus `full-atlas` for atlas-sidecar validation and `shift-shell-3p1` for a `beta_x` shell view. [filecite](turn17file0#L1) [filecite](turn18file0#L1)
- It relies on the hull-render proxy's scientific lane enforcement to ensure that any resulting York frames are accompanied by a render certificate meeting the view invariants and channel contract. [filecite](turn17file0#L1)
- It produces/updates a narrative "latest" audit markdown in `docs/audits/research/warp-york-control-family-proof-pack-latest.md`. [filecite](turn12file0#L1)

Because the structured JSON artifact requested for inspection is not present at this commit, the exact numeric iteration steps (e.g., which control points were sampled, how many family members, and detailed acceptance criteria used inside the script) cannot be fully re-derived from committed machine outputs alone in this audit.

### What is the current NHM2 verdict?

Repo-truth answer: the codebase defines an NHM2 "congruent full-solve" gate as a boolean `pass` plus named sub-check booleans and reasons (policy margin, computed margin, applicability, metric, semantic, strict mode). [filecite](turn17file0#L1)

The render proxy can be configured (and defaults) to reject renders unless this gate is PASS. [filecite](turn17file0#L1)

For the "current verdict" in the workflow sense, the repo includes an authoritative narrative report at `docs/audits/research/warp-york-control-family-proof-pack-latest.md`, which is the committed record of the latest proof-pack run at this commit. [filecite](turn12file0#L1)

**Important repo-truth separation:** this "NHM2 verdict" is a *diagnostic-local classification* tracked by the pipeline and used as a gate; it is not, by itself, a claim of "theory identity" beyond the repo's formal definition of what NHM2 PASS means within this diagnostic framework. [filecite](turn17file0#L1)

### What does the repo currently prove about renderer trust?

Repo-truth: the repo proves **contract enforcement at the proxy boundary**, not absolute correctness of the remote renderer.

Established enforcement properties:

- **Fail-closed by default for scientific frames.** If scientific rendering is requested (or required by env defaults), and no remote endpoint exists, the router returns a 502 and does not silently deliver a local "teaching" frame. [filecite](turn17file0#L1) [filecite](turn19file0#L1)
- **Non-scientific / synthetic responses are rejected** in strict mode based on provenance and diagnostics note filters. [filecite](turn17file0#L1) [filecite](turn19file0#L1)
- **Research-grade requirement** can be enforced (reject scaffold-tier frames). [filecite](turn17file0#L1) [filecite](turn19file0#L1)
- **Render certificate validation** enforces schema version, self-hash integrity, required channel hash presence, metric-ref consistency, and York-view invariants. [filecite](turn17file0#L1)
- **Hidden-gain prevention for raw York views:** for York time/surface/shell-map raw views, `display_gain` must be exactly `1`, explicitly blocking amplification disguised as "raw." [filecite](turn17file0#L1)
- **Same-snapshot identity alignment** is enforced for York views (and tests also verify that full-atlas and york-time identity fields remain aligned for the same snapshot payload). [filecite](turn17file0#L1) [filecite](turn19file0#L1)

What it does **not** prove: that the remote service computed the right physics; only that it returned an internally consistent certificate and metadata matching expectations. [filecite](turn17file0#L1)

### What does the repo currently prove about control calibration?

Repo-truth: the repo's York diagnostic workflow is parameterized by a solve/control tuple `{beta, alpha, sigma, R}` and expects these to be used consistently across the render request (and, via metricVolumeRef/chart identity checks, consistent with the referenced brick snapshot). [filecite](turn17file0#L1)

What is established by enforcement:
- The proxy deterministically incorporates those parameters into request parsing and into local deterministic rendering seeds (for "teaching" fallback imagery), implying the parameters are treated as **control knobs** for the diagnostic product. [filecite](turn17file0#L1)
- The proof-pack scaffolding exists (script + tests + "latest" audit record) to package a "control family" evaluation. [filecite](turn10file0#L1) [filecite](turn11file0#L1) [filecite](turn12file0#L1)

What is not established at repo-truth level (without the missing structured artifact): the exact calibration algorithm/criteria used to select/accept members of the family, and whether calibration is reproducible across environments.

### What does the repo currently prove about NHM2 classification?

Repo-truth: the repo defines an NHM2 congruence classification state with named sub-check booleans and fail reasons and can make it a hard gate for rendering. [filecite](turn17file0#L1)

The tests confirm fail-closed behavior when the gate is requested but not passed. [filecite](turn19file0#L1)

This is a **diagnostic-local classification**, i.e., "PASS" is meaningful as "passes the repo's NHM2 congruent full-solve contract checks," not as an external equivalence claim to any broader theoretical identity beyond what the code defines. [filecite](turn17file0#L1)

### What does the repo currently prove about robustness under policy perturbations?

Repo-truth: the pipeline-level NHM2 congruence state explicitly tracks both `policyMarginPass` and `computedMarginPass` as distinct booleans. [filecite](turn17file0#L1)

However, at the render-proxy level, the enforcement is currently mostly on the aggregate `pass` boolean (with visibility into sub-fields through `/status`). There is no direct proof in the proxy itself that the system is robust under *multiple* policy perturbations; that would need to be demonstrated by proof-pack outputs and/or tests that explicitly vary policy and show stable PASS outcomes. [filecite](turn17file0#L1)

### What does the repo currently prove about cross-lane comparison?

Repo-truth: the proxy language and validation behavior treat York views as **same-snapshot congruent renderings** and warns against representing parameter-family comparisons as "one simultaneous system." [filecite](turn17file0#L1)

Additionally, only one lane ID has an enforced convention mapping at the proxy. [filecite](turn17file0#L1)

So, cross-lane comparison is currently **limited** at the enforcement level: the code can ensure that if a lane ID is requested, the certificate matches, but there is not evidence here of a multi-lane comparison framework with multiple lane IDs and explicit equivalence/ordering rules.

## Current Unknowns

This section lists what remains **unproven or under-specified** at this commit, in repo-truth terms.

The biggest practical gap is that the requested structured output artifact `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json` is not available in-repo at this commit (it cannot be fetched/found), so the audit cannot fully validate what the "latest" proof-pack computed without relying on the narrative report markdown. This blocks independent verification of: (a) which control points were evaluated, (b) exact numeric thresholds, and (c) whether any failures occurred but were summarized away. [filecite](turn12file0#L1)

Beyond that artifact gap, key unknowns include:

The proxy validates certificate self-hash and metadata invariants, but there is no cryptographic signing or trusted hardware attestation for the remote renderer; thus "renderer trust" is bounded to "contract compliance," not "ground truth correctness." [filecite](turn17file0#L1)

The repo's render certificate requires channel hashes, but the proxy does not re-derive them from a locally verified volume; thus it cannot prove that channel hashes correspond to the actual underlying brick data unless another verified pathway exists in the solver/brick layer (not established in the inspected files). [filecite](turn17file0#L1) [filecite](turn18file0#L1)

Policy-robustness is represented in the congruent solve snapshot structure, but there is no commit-level machine artifact here demonstrating multi-policy perturbation sweeps and stable NHM2 PASS across them. [filecite](turn17file0#L1)

Cross-lane comparison is constrained: only one York lane ID convention map is enforced in the proxy, limiting what can be claimed about multi-lane or cross-convention equivalence. [filecite](turn17file0#L1)

## Claims Matrix

| claim | status | repo evidence | what would falsify it |
|---|---|---|---|
| The baseline York diagnostic lane currently enforced by the server is `lane_a_eulerian_comoving_theta_minus_trk` with conventions (comoving_cartesian, eulerian_n, theta=-trK, K_ij=-1/2*L_n(gamma_ij)). | established | The proxy defines `YORK_DIAGNOSTIC_LANE_CONVENTIONS` with that single lane and enforces lane ID + convention matches when `diagnosticLaneId` is supplied. [filecite](turn17file0#L1) | Adding/using a different lane mapping (or removing this mapping) without updating validations/tests; or observing the proxy accept a different lane ID/coventions in strict mode. |
| York views are treated as same-snapshot diagnostic renderings, not as a single multi-parameter "simultaneous system." | established | `validateYorkSnapshotIdentity` requires snapshot identity fields and includes an explicit comment about same-snapshot congruence and separating parameter-family comparisons. [filecite](turn17file0#L1) | Proxy accepting York views with missing/contradictory snapshot identity fields; or a code change that removes the identity checks / warnings. |
| The server proxy defaults to an OptiX-first scientific backend selection logic and ships default loopback endpoints. | established | Default endpoint constants and backend ordering (`optix` default; auto prefers optix/unity before generic). [filecite](turn17file0#L1) | Default mode changed to unity/generic or defaults removed; tests updated to new behavior. |
| In strict/scientific mode, the proxy fails closed when no remote scientific endpoint is configured. | established | `/frame` returns 502 "mis_proxy_unconfigured" when scientific frame requested but remote not configured and local fallback disallowed; test asserts fail-closed default. [filecite](turn17file0#L1) [filecite](turn19file0#L1) | Observing a local-deterministic response under default strict/scientific conditions without explicit env opt-in. |
| The proxy enforces a render certificate schema version `nhm2.render-certificate.v1` and validates a self-hash integrity field (`certificate_hash`). | established | Schema constant in shared contract; proxy recomputes sha256 over stable-stringified certificate body and compares; rejects mismatches. [filecite](turn18file0#L1) [filecite](turn17file0#L1) | Proxy accepting a mismatched schema version or incorrect `certificate_hash` in strict mode. |
| The proxy requires canonical channel hashes for scientific/York renders (and conditionally requires off-diagonal gamma channels and hull support channels for shell-map views). | established | Required channel arrays in shared contract; proxy computes `missingChannels` and fails closed; additional requirements for shell-map view. [filecite](turn18file0#L1) [filecite](turn17file0#L1) | Successful strict York/shell-map render with missing required channel hashes or missing support hashes. |
| Raw York renders are fail-closed against hidden display amplification (display_gain must be exactly 1). | established | For york-time, york-surface, york-shell-map views, proxy checks `display_gain` absolute difference from 1 and rejects otherwise; tests cover. [filecite](turn17file0#L1) [filecite](turn19file0#L1) | Proxy accepting a York certificate with `display_gain != 1` while representing it as raw. |
| Scientific lane can require integral signal attachments (depth + shell mask attachments). | established | Proxy checks `hasIntegralSignalAttachments` when required; tests cover failure when missing. [filecite](turn17file0#L1) [filecite](turn19file0#L1) | Proxy returning 200 in strict/integral-required mode with missing attachments. |
| The repo's NHM2 classification gate is represented as `congruentSolve` with pass + sub-check flags, and the proxy can block renders unless this gate is PASS. | established | `readCongruentSolveGate` reads and exposes the snapshot; `/frame` returns 422 when `requireCongruentNhm2FullSolve` and gate not ok; tests cover. [filecite](turn17file0#L1) [filecite](turn19file0#L1) | Proxy rendering while gate is required and `congruentSolve.pass` is false or missing. |
| The proof-pack exists as a script + tests + a committed "latest" audit markdown describing the control-family proof-pack status. | established | Presence of proof-pack script/test, and `docs/audits/research/warp-york-control-family-proof-pack-latest.md`. [filecite](turn10file0#L1) [filecite](turn11file0#L1) [filecite](turn12file0#L1) | Removal or stubbing of scripts/tests/docs; or docs diverging from executable behavior without tests catching it. |
| The repo currently "proves" renderer correctness in a cryptographic / adversarial sense. | unsupported | Certificate is self-hashed and validated for internal consistency; there is no evidence in inspected files of signing/attestation/trusted recomputation of channel hashes by the proxy. [filecite](turn17file0#L1) | Adding cryptographic signing or local recomputation checks and tests demonstrating adversarial resistance. |
| The repo currently proves robustness under policy perturbations (beyond representing policyMarginPass/computedMarginPass flags). | provisional | Congruent solve snapshot has explicit policy/computed margin flags, but enforcement and committed machine artifacts showing perturbation sweeps are not established in inspected files. [filecite](turn17file0#L1) | A committed proof-pack JSON artifact plus tests demonstrating stable classification across systematic policy perturbations (or evidence of failures). |
| The repo currently supports meaningful cross-lane comparison across multiple York diagnostic lanes. | unsupported | Only one lane convention mapping is present/enforced in the proxy; no evidence of multiple lane IDs with comparison rules. [filecite](turn17file0#L1) | Adding multiple lane IDs and an explicit comparison framework, with tests and committed artifacts demonstrating cross-lane equivalence/differences. |
| The "latest" proof-pack machine output JSON is present and auditable within the repo at this commit. | unsupported | The narrative "latest.md" is present, but the requested structured JSON path is not available to fetch/find at this commit. [filecite](turn12file0#L1) | Committing the JSON artifact at the specified path (or updating docs to point to the actual committed structured artifact). |
