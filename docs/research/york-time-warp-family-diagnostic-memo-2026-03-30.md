# York-Time / Warp-Family Diagnostic Memo for CasimirBot

## Executive Summary

This memo answers the repo's core diagnostic question: **were the "strange York-time renderings" seen in the NHM2 full warp solve primarily caused by (1) renderer / conversion failure, or (2) the solved field itself under the current York diagnostic contract?** The repo's current state (contracts + enforcement + calibrated controls + proof-pack) supports a **disciplined conclusion**: **under the declared York diagnostic lane, renderer failure is no longer the lead explanation; NHM2 is consistently classified as "low-expansion-like," and that classification remains stable under nearby contract perturbations.** [filecite](turn11file0#L1) [filecite](turn14file0#L1)

The key scientific posture embedded in the repo is **not "which famous warp metric is NHM2,"** but **"what is established under an explicitly declared diagnostic lane, and how stable is that conclusion under controlled congruence checks."** In practice, the repo has moved from a vague "renderer suspicion" phase to a **calibrated, certificate-backed classification workflow** that:

1. **Declares the lane:** chart, observer, foliation, theta definition, remap, normalization. [filecite](turn11file0#L1)
2. **Enforces the lane at render-time:** strict render certificate metadata, identity hashes, and anti-hidden-gain requirements. [filecite](turn22file0#L1) [filecite](turn21file0#L1)
3. **Calibrates with control families** (e.g., Alcubierre-like vs Natario-like) as *references* rather than ontologies. [filecite](turn12file0#L1) [filecite](turn14file0#L1)
4. **Reduces the field to deterministic, comparable features** and evaluates distances with defined thresholds/weights, plus robustness to nearby policy perturbations. [filecite](turn11file0#L1) [filecite](turn14file0#L1)

Important boundaries:

* The repo's result is a **diagnostic-local classification**, not a proof of **theory identity** ("NHM2 is fundamentally Natario in all meaningful frames"). The contract explicitly frames the classification scope as lane-relative rather than invariant/ontological. [filecite](turn11file0#L1)
* York morphology is expected to be **foliation/observer dependent** in general; the repo's current statement is only about **the declared lane**. (The physics basis below explains why.) [cite](turn6view0) [cite](turn7view0)

A repo gap to note: the user-requested artifact file `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json` was **not found in the GitHub snapshot** (404). This memo therefore relies heavily on the committed **latest audit markdown** as the primary human-readable proof-pack artifact. [filecite](turn14file0#L1)

## Diagnostic Goal and Scientific Posture

### Current diagnostic goal in one sentence

**Establish whether NHM2's York-time morphology is an artifact of rendering/conversion or a real property of the solved field under a declared diagnostic contract-and do so in a way that is repeatable, lane-explicit, and comparable across warp families.** [filecite](turn11file0#L1) [filecite](turn14file0#L1)

### Why the goal is framed as a "contract problem," not a "pretty render" problem

The repo formalizes York-time analysis as a **scientific lane**: the lane is not "York-time in general," but a **specific, declared mapping** from a GR evolution snapshot to rendered/derived diagnostics. This is necessary because:

* **theta (expansion) depends on a congruence of observers**; in 3+1 formalisms you must specify which observer field you're using (e.g., the hypersurface normal / Eulerian observers) and what your slicing is. [cite](turn6view0) [cite](turn7view0)
* Even if the underlying spacetime is the same, **changing the foliation/observer can change the computed theta field** (and its sign-lobe appearance). The repo's approach rightly treats this as a lane-relative diagnostic until proven otherwise. [cite](turn6view0) [cite](turn7view0)

### The repo's present "high-level state" (verified, not repeated)

From the committed contract + enforcement tests + proof-pack audit:

* The repo has a **declared York diagnostic lane** with explicit: chart, observer, theta definition, remap policy, normalization policy, and a scope statement that this is a **diagnostic-local classification**. [filecite](turn11file0#L1)
* The renderer path used in the scientific lane is constrained by **render certificates** and strict validation (lane-id matching, theta metadata required, slice hash provenance required, anti-hidden-gain enforcement). [filecite](turn22file0#L1) [filecite](turn21file0#L1)
* The proof-pack has evolved into a **calibrated classification workflow**: it compares NHM2 against at least two calibrated references (including a low-/zero-expansion-like control) and then checks **robustness under nearby contract perturbations**; the latest audit reports NHM2 is classified as low-expansion-like under the current contract and that the conclusion is robust. [filecite](turn14file0#L1)

## Physics Basis for the Current York Diagnostic

This section is *only* about the physics required to interpret what the repo claims, not about proposing new warp theory.

### York time, Eulerian observers, and why theta is not "free-floating"

In the 3+1 decomposition, the spacetime is foliated by spacelike hypersurfaces Sigma_t with unit timelike normal **n** (the Eulerian observer field). Gourgoulhon's lecture notes derive several identities that matter directly for the repo's York lane:

* The extrinsic curvature tensor satisfies
  **K = -(1/2) L_n gamma** (Lie derivative of the induced metric along the unit normal). [cite](turn6view0)
* The gradient of the normal is related to K and the lapse N, e.g.
  **nabla_beta n_alpha = -K_alpha_beta - D_alpha ln N * n_beta**. [cite](turn6view0)
* Crucially (and explicitly stated in the notes):
  **nabla_mu n_mu = -K**, i.e., the 4-divergence (expansion) of the Eulerian congruence equals negative trace of the extrinsic curvature (with the sign conventions used). [cite](turn7view0)

This is the precise physics bridge for the repo's "theta = -trK" definition: if theta is defined as the Eulerian expansion theta := nabla_mu n_mu, then under this convention theta = -K (trace). [cite](turn7view0)

### Why Alcubierre and Natario are calibration references, not ontologies

Alcubierre's original warp drive construction is commonly summarized as producing a "warp bubble" whose kinematics can be described as expansion behind and contraction ahead (in the presentation/slicing used by Alcubierre). The preprint associated with the published C.Q.G. paper explicitly describes the local expansion/contraction picture in its abstract. [cite](turn2search3)

Natario's paper **explicitly constructs warp drive spacetimes with zero expansion**, showing that expansion/contraction is not an intrinsic necessity of "warp drive," but can be a consequence of choices (including the specific structure used by Alcubierre). [cite](turn1search0)

These two papers are therefore natural **calibration endpoints** for a York/expansion diagnostic:

* Alcubierre-like (in the chosen lane/coordinates) is expected to yield a strong signed structure in theta. [cite](turn2search3)
* Natario's "zero expansion" is a natural "low-expansion-like" target. [cite](turn1search0)

The repo's discipline comes from treating these as **controls** (known behaviors under a declared lane) rather than insisting NHM2 "must be" one of them as a global identity claim. That distinction is encoded explicitly in the contract language and in the proof-pack's *classification* framing. [filecite](turn11file0#L1) [filecite](turn14file0#L1)
## Repo Contract and Enforcement

This section answers the memo's Key Questions 1-4 and grounds them in repo artifacts.

### What exactly are the York frames in this repo defined by?

The repo's York diagnostic contract (v1) declares a lane whose identity is also echoed in render certificate requirements:

* **Chart:** `comoving_cartesian`. [filecite](turn11file0#L1) [filecite](turn22file0#L1)
* **Observer:** `eulerian_n` (Eulerian observers associated with the foliation normal). [filecite](turn11file0#L1) [filecite](turn22file0#L1)
* **theta definition:** `theta=-trK`. [filecite](turn11file0#L1) [filecite](turn22file0#L1)
* **Extrinsic curvature sign convention:** `K_ij=-1/2*L_n(gamma_ij)` appears as required certificate metadata; this matches the convention used in Gourgoulhon's derivation. [filecite](turn22file0#L1) [cite](turn6view0) [cite](turn7view0)
* **Lane id:** `lane_a_eulerian_comoving_theta_minus_trk` is treated as a first-class identity token that must match certificate conventions. [filecite](turn22file0#L1) [filecite](turn11file0#L1)

**Interpretation:** "York frames" here are not an abstract family; they mean: **the Eulerian-normal congruence of a specific comoving-cartesian 3+1 foliation, with theta computed as -trK in that convention**. [filecite](turn11file0#L1) [cite](turn7view0)

### Remap policy and normalization policy

The repo makes two crucial design choices to keep York comparisons "reduced-order but deterministic":

1. **Fix the slice extraction choice** (so you're not comparing different projections). The York render contract explicitly includes slice planes such as:
   * `x-z-midplane` for a canonical midplane slice, and
   * `x-rho` for a cylindrical remap. [filecite](turn22file0#L1)

2. **Separate "raw" vs "topology-only" normalizations**:
   * Raw York views use `normalization: symmetric-about-zero` and explicitly forbid hidden amplification (see below). [filecite](turn22file0#L1)
   * Topology-normalized views use a different normalization (`topology-only-unit-max`) and label themselves as topology-only via `magnitude_mode: normalized-topology-only`. [filecite](turn22file0#L1)

This is essential for scientific discipline: topology-only renders can be used to compare *shape/sign structure* without confusing it with magnitude; raw renders preserve magnitude meaning but must be guarded against arbitrary gain. [filecite](turn22file0#L1)

### York render / certificate enforcement: what is enforced and why it matters

The hull render route tests show the repo enforces the scientific lane by requiring that a remote render frame includes a **render certificate** whose metadata must match the requested York view:

* **Field key must be `theta`** for York views; mismatches fail closed. [filecite](turn22file0#L1)
* **Lane id must exist and match conventions**; missing lane metadata fails; convention drift (e.g., observer mismatch) fails. [filecite](turn22file0#L1)
* **Slice plane and coordinate mode must match** (e.g., `x-z-midplane` vs `x-rho`); mismatches fail. [filecite](turn22file0#L1)
* **Normalization must match** for each view; mismatches fail. [filecite](turn22file0#L1)
* **Anti-hidden-gain:** raw York views require `display_gain = 1` and reject hidden gain; this directly targets the earlier "renderer suspicion" class of failure. [filecite](turn22file0#L1)
* **Provenance hashes:** York render certificates carry `slice_array_hash` (and other hashes for specialized views); missing hashes fail. [filecite](turn22file0#L1)

Taken together, the repo's contract enforcement is explicitly aimed at preventing the main renderer/conversion failure modes that could produce "strange York-time renderings" (wrong field, wrong slice, wrong normalization, silent gain, or mismatched snapshot identity). [filecite](turn22file0#L1) [filecite](turn21file0#L1)

## Evidence Chain From Solver to Brick to Render to Proof-Pack

This section answers Key Questions 5-6 and provides the "solver -> artifact" trace.

### Solver -> brick: where theta exists as a first-class channel

The GR brick produced by `buildGrEvolveBrick` publishes a channel set that includes:

* ADM-like basics: lapse `alpha`, shift components `beta_*`, spatial metric components `gamma_*`, and **`K_trace`**. [filecite](turn23file0#L1)
* Derived diagnostics including **`theta`** as a named channel in the declared channel ordering. [filecite](turn23file0#L1)
* Constraint channels `H_constraint` and `M_constraint_*`, plus optional invariants and matter. [filecite](turn23file0#L1)

The evolution step that produces the state is `runBssnEvolution`, which evolves a BSSN state and computes constraints. [filecite](turn24file0#L1)

**What matters for York:** the pipeline is set up so that theta and K_trace are both available in the same brick snapshot, enabling direct consistency checks (see proof-pack). [filecite](turn23file0#L1) [filecite](turn14file0#L1)

### Brick -> render: certified York views are not "just pictures"

The hull render validation tests describe the "scientific frame" as carrying not only an image but also:

* A render certificate with lane identity, theta metadata, extrema, and slice hashes. [filecite](turn22file0#L1)
* Optional "scientific atlas" sidecar panes that include channel hashes for a multi-pane diagnostic readout. [filecite](turn22file0#L1)

This means the York render path is designed to be auditable: each rendered York frame can be traced back to a specific theta slice array under a declared sampling/remap policy. [filecite](turn22file0#L1)

### Proof-pack: how the repo operationalizes "renderer vs solved field"

The proof-pack script and spec (and the latest audit output) establish a workflow that, in effect, does this:

1. Confirm the lane contract is applied (expected lane id / policies). [filecite](turn11file0#L1) [filecite](turn13file0#L1)
2. Confirm renderer frames are certificate-valid and "no hidden gain." [filecite](turn22file0#L1)
3. Compare NHM2 against calibrated controls (including a low-expansion-like reference) using reduced-order features and a defined distance metric. [filecite](turn12file0#L1)
4. Run robustness checks by perturbing contract parameters/policies within a defined neighborhood and verifying the classification does not flip. [filecite](turn14file0#L1)

The latest audit is the committed artifact that reports the end-to-end result of this workflow. [filecite](turn14file0#L1)
## Findings and Claim Boundaries

This section answers Key Questions 7-8 and explicitly separates what has been established from what is still not proven.

### What has been established already

**Renderer failure is no longer the lead explanation (under the current York contract).** This is established in the repo in a contract-driven way, not by argument:

* York frames require certified lane identity + theta metadata + slice hashes, and reject hidden gain. [filecite](turn22file0#L1)
* The proof-pack audit reports the classification and stability results as an outcome of the certified workflow, not as a one-off render. [filecite](turn14file0#L1)

**theta is being treated as -trK and this is explicitly audited.** The latest proof-pack audit reports a "theta + trK consistency" style check (showing numerical agreement), and the contract/certificates label theta as `theta=-trK`. [filecite](turn14file0#L1) [filecite](turn11file0#L1)

This is also aligned with the 3+1 identity **nabla_mu n_mu = -K** in Gourgoulhon's notes, so the repo's York-time theta matches the Eulerian expansion under that convention. [cite](turn7view0) [cite](turn6view0)

**NHM2 is classified as "low-expansion-like" under the lane.** The latest audit reports that NHM2's reduced-order York features are extremely close to the low/zero-expansion-like control family and far from the Alcubierre-like control, under the current weights/thresholds. [filecite](turn14file0#L1)

Concretely, the audit shows (examples):
* NHM2 and the low-expansion-like control share near-identical positive/negative support counts and lack the Alcubierre-like fore/aft signed-lobe structure under the lane's canonical slices. [filecite](turn14file0#L1)
* The distance-to-low-expansion-like is reported as tiny compared to distance-to-Alcubierre-like, and the NHM2 classification is recorded as passing the low-expansion-like threshold. [filecite](turn14file0#L1)

**Robustness under nearby contract perturbations is established.** The latest audit explicitly reports a robustness sweep: when nearby policy parameters are perturbed (within the proof-pack's defined neighborhood) the classification of NHM2 does not flip away from low-expansion-like. [filecite](turn14file0#L1)

### What is still not proven (and would be over-claiming)

**"NHM2 is fundamentally Natario-like in all meaningful frames."** Unsupported by the current repo evidence. Natario's "zero expansion" is a statement about expansion for a chosen congruence; the repo has only tested one declared lane. The repo's own contract framing treats the result as diagnostic-local rather than invariant. [filecite](turn11file0#L1) [cite](turn1search0) [cite](turn7view0)

**"York morphology is foliation-invariant."** Unsupported. In 3+1, the choice of foliation (and observer congruence) is structurally part of the definition of the objects being computed (n, K, and thus theta). Gourgoulhon emphasizes foliation kinematics (lapse/shift, Eulerian observers) and the meaning of K as tied to a foliation. [cite](turn6view0) [cite](turn7view0)

**Magnitude-level physical claims about NHM2 based solely on theta plots.** The proof-pack's classification is intentionally reduced-order and stable under policy perturbations, but it does not yet establish that a specific magnitude of theta corresponds to some invariant physical "warp strength." Any such claim would require additional lane(s), resolution studies, and invariant cross-checks. [filecite](turn11file0#L1) [filecite](turn14file0#L1)

## Reduced-Order Deterministic Congruence and Why Controls Are Not Ontology

This section answers Key Questions 8-10 and explains the repo's "reduced-order deterministic congruence" idea in operational terms.

### What "reduced-order deterministic congruence" means in this repo

In practice, the repo's workflow defines a **deterministic reduction**:

**(full 3D evolved state) -> (theta slice(s) under fixed remap) -> (certified render + hashed slice arrays) -> (feature vector) -> (distance-to-controls + thresholds)** [filecite](turn22file0#L1) [filecite](turn12file0#L1) [filecite](turn14file0#L1)

The "congruence" part is not a claim of geometric congruence between spacetimes; it is a claim that **the diagnostic pipeline itself is congruent**: repeated evaluation under the same contract yields the same reduced-order result, and nearby policy perturbations don't arbitrarily flip the classification. [filecite](turn14file0#L1)

This is exactly the correct move when your initial uncertainty is "renderer vs field": you build a system where renders are *certificates* of the field extraction policy, not aesthetic artifacts. [filecite](turn22file0#L1)

### Why Alcubierre/Natario appear as calibration references

Under the repo's posture, Alcubierre and Natario are not treated as "truth labels for all warp solutions," but as **known endpoints for one diagnostic dimension**: Eulerian expansion theta.

* Alcubierre's warp drive presentation explicitly leans on the expansion/contraction picture (under the choices made there), so it should produce a strong signed theta morphology in a compatible lane. [cite](turn2search3)
* Natario explicitly constructs warp drives where the expansion vanishes, so it is a direct calibration reference for what "low-expansion-like" should look like under theta-based diagnostics. [cite](turn1search0)

The repo uses these controls the way numerical relativity uses test problems: not to force ontology, but to calibrate a measurement pipeline. [filecite](turn14file0#L1)

### What "NHM2 low-expansion-like" means under the present contract

Under the contract, "NHM2 low-expansion-like" means:

1. Compute theta as -trK for the Eulerian observer field (lane definition). [filecite](turn11file0#L1) [cite](turn7view0)
2. Extract canonical slices (`x-z-midplane`, and optionally `x-rho`) under the contract. [filecite](turn22file0#L1)
3. Reduce those slices to a feature representation (counts, lobe summaries, extrema, etc.) and compute distances to control references using contract-defined normalization/weights. [filecite](turn12file0#L1)
4. Observe that NHM2's distance is very close to the low-expansion-like control and not close to the Alcubierre-like control, and this remains true under local perturbations of the contract parameters. [filecite](turn14file0#L1)

This is a **lane-relative morphological classification**, not an invariant statement about NHM2's full spacetime identity.
## Roadmap, Falsifiers, Next Steps, and Appendices

This final section consolidates the memo's required deliverables: success criteria, falsifiers, next patches, "do-not-do next," plus appendices (file map, claims matrix, primary citations, and the 1-page truth summary).

### Success criteria and falsifiers for future work

A disciplined workflow needs explicit "what would overturn this" statements. Under the repo's posture, the falsifiers are contract- and artifact-driven, not rhetorical.

**Success criteria for the current lane (Lane A)**
* **Reproducible classification**: re-running the proof-pack on the same NHM2 snapshot yields the same classification and closely matching distances (within a small tolerance). [filecite](turn14file0#L1)
* **Renderer congruence remains certificate-valid**: any York view used in the proof-pack is backed by strict certificate checks (lane id, theta metadata, slice hashes, gain = 1 for raw views). [filecite](turn22file0#L1)
* **Robustness neighborhood is stable**: classification should not flip in response to small perturbations the contract declares "nearby." [filecite](turn14file0#L1)

**Primary falsifiers**
* **Renderer pathway falsifier:** proof-pack detects mismatch between offline-computed theta slices and certified render slice hashes, or detects hidden gain / normalization drift in a "raw York" view. If that happens, renderer/conversion failure becomes plausible again. [filecite](turn22file0#L1)
* **Lane-sensitivity falsifier:** add a second lane (different foliation/observer choice) and observe that NHM2 switches families (e.g., becomes Alcubierre-like). This would not invalidate Lane A's claim, but would falsify any *implicit* overreach that "NHM2 is low-expansion-like in general." [cite](turn7view0) [cite](turn6view0)
* **Resolution/scheme falsifier:** step the solver resolution or numerical scheme (within certified solver health bounds) and observe that the reduced-order features/distance metrics change dramatically, indicating the classification is not numerically stable. [filecite](turn23file0#L1)

### Five concrete next patches / research tasks

These are phrased as repo-implementable patches with measurable outputs.

**Add a second declared diagnostic lane (Lane B) that changes exactly one conceptual degree of freedom**-for example, a different observer congruence or slicing strategy-while keeping the rest identical. Then rerun the proof-pack and record inter-lane classification deltas. This directly operationalizes "foliation dependence" rather than debating it abstractly. (Physics motivation: theta depends on n and thus on foliation choices.) [cite](turn7view0) [cite](turn6view0) [filecite](turn11file0#L1)

**Extend the proof-pack to a "render-path A/B test"** where the same certified theta slice arrays are rendered through two independent rendering backends (if available) while enforcing identical certificate fields and then checking hash congruence. This turns "renderer suspicion" into a permanently monitored invariant. [filecite](turn22file0#L1)

**Add resolution and timestep stability gates to the proof-pack**: run NHM2 and controls at two or three grid resolutions and/or dt scales (within CFL/solver-health limits) and require that (a) theta+trK consistency remains tight, and (b) the reduced-order distances do not cross classification thresholds. [filecite](turn23file0#L1) [filecite](turn14file0#L1)

**Promote the missing JSON proof-pack artifact into the repo (or provide a deterministic regeneration command + pinned commit hash).** The GitHub snapshot lacked `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`, limiting machine-verifiable reproducibility in this memo. Treat this as a provenance hardening task: either commit the artifact (if size permits) or commit a strict recipe that regenerates it. [filecite](turn14file0#L1)

**Design a "cross-solution congruence interface"**: formalize a stable struct for "diagnostic lane output" (feature vectors + hashes + key extrema + control distances), and make all future warp solutions emit that struct. This is the long-run architecture that prevents the project from regressing into screenshot comparisons. [filecite](turn11file0#L1) [filecite](turn22file0#L1)

### Do-not-do-next list (anti-regression guardrails)

Do **not** claim "NHM2 is Natario" (or "is Alcubierre") as an ontological identity based on Lane A York morphology alone. The repo's own framing is diagnostic-local; keep it that way until multi-lane evidence exists. [filecite](turn11file0#L1) [cite](turn1search0) [cite](turn7view0)

Do **not** loosen render strictness (gain checks, lane-id checks, slice hash requirements) to "get nicer pictures." That would resurrect the original renderer failure risk and destroy the proof-pack's point. [filecite](turn22file0#L1)

Do **not** merge new warp families without adding them as either (a) new calibrated controls or (b) explicitly labeled "unclassified" targets with recorded distances and uncertainty. This prevents "silent ontology drift." [filecite](turn12file0#L1)

Do **not** interpret sign lobes (fore+/aft-) as frame-invariant physics without stating the lane and without multi-lane replication. [cite](turn7view0) [cite](turn6view0)

Do **not** treat topology-only normalized renders as magnitude evidence. They are explicitly labeled topology-only and must remain so. [filecite](turn22file0#L1)

### Appendix A: File / directory map

This memo's evidence is grounded primarily in these committed repo artifacts:

* **York lane declaration:** `configs/york-diagnostic-contract.v1.json` [filecite](turn11file0#L1)
* **Proof-pack workflow:** `scripts/warp-york-control-family-proof-pack.ts` [filecite](turn12file0#L1)
* **Proof-pack test coverage:** `tests/warp-york-control-family-proof-pack.spec.ts` [filecite](turn13file0#L1)
* **Latest proof-pack audit report:** `docs/audits/research/warp-york-control-family-proof-pack-latest.md` [filecite](turn14file0#L1)
* **York render certificate generation / service:** `scripts/hull-optix-service.ts` [filecite](turn21file0#L1)
* **Strict York render enforcement tests:** `server/__tests__/hull-render.routes.spec.ts` [filecite](turn22file0#L1)
* **GR evolution brick (channel publication incl. theta and K_trace):** `server/gr-evolve-brick.ts` [filecite](turn23file0#L1)
* **BSSN evolution orchestration:** `server/gr/evolution/solver.ts` [filecite](turn24file0#L1)
* **Stress-energy build glue:** `server/gr/evolution/stress-energy.ts` [filecite](turn25file0#L1)
* **Stress-energy brick and family context (includes "nhm2_certified" family id tagging):** `server/stress-energy-brick.ts` [filecite](turn26file0#L1)

File not found in this GitHub snapshot (requested by user):
* `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json` (404 when fetched). This memo therefore treats the latest audit markdown as the primary proof-pack artifact. [filecite](turn14file0#L1)

### Appendix B: Claims matrix

| claim | status | evidence in repo | physics source | falsifier / what would overturn it |
|---|---|---|---|---|
| Renderer failure is no longer the lead explanation under the current York contract | established | Strict render certificate requirements incl. lane id, theta metadata, slice hash provenance, and anti-hidden-gain checks [filecite](turn22file0#L1); proof-pack audit reports results as certified workflow output [filecite](turn14file0#L1) | Conceptual: diagnostics must be reproducible under defined observer/slicing [cite](turn6view0) [cite](turn7view0) | Proof-pack detects slice hash mismatch, hidden gain, or lane drift that can explain morphology independently of the field |
| York lane uses Eulerian observer tied to a declared foliation | established | Lane contract + render certificate require `observer: eulerian_n` and lane id matching [filecite](turn11file0#L1) [filecite](turn22file0#L1) | Eulerian observers and foliation kinematics in Gourgoulhon [cite](turn6view0) | A future lane contract changes observer/foliation without versioning lane id (would be a contract breach) |
| theta is treated as -trK in the repo's York lane, and this is enforced | established | Contract and certificates label `theta=-trK`; proof-pack audit reports theta + trK consistency check [filecite](turn11file0#L1) [filecite](turn14file0#L1) | nabla_mu n_mu = -K in Gourgoulhon (so Eulerian expansion corresponds to -trK under that convention) [cite](turn7view0) [cite](turn6view0) | theta+trK check fails materially on certified runs; or contract changes theta definition without version bump |
| York morphology is foliation-dependent in principle | provisional (physics-established, repo-not-yet-tested multi-lane) | Repo currently evaluates one lane and labels scope as diagnostic-local [filecite](turn11file0#L1) | Foliation/observer dependence is built into 3+1 decomposition (n, lapse/shift, K definitions) [cite](turn6view0) [cite](turn7view0) | Add Lane B with different foliation/observer and show morphology/classification is invariant across lanes |
| Alcubierre and Natario controls are calibration references, not forced ontology | established (repo posture) | Proof-pack is framed as control-family comparison + robustness; contract emphasizes diagnostic-local classification [filecite](turn11file0#L1) [filecite](turn14file0#L1) | Alcubierre describes expansion/contraction picture [cite](turn2search3); Natario constructs "zero expansion" warp spacetimes [cite](turn1search0) | Repo starts labeling solutions as "is Natario" without multi-lane identity proofs or invariant checks |
| NHM2 is low-expansion-like under the present York diagnostic contract | established (lane-relative) | Latest proof-pack audit reports NHM2 closest to low-expansion-like reference and far from Alcubierre-like; features align [filecite](turn14file0#L1) | Natario "zero expansion" motivates the low-expansion endpoint [cite](turn1search0) | Re-running proof-pack on the same snapshot yields different classification; or contract-perturbation neighborhood flips classification |
| The current classifier is robust under nearby policy perturbations | established | Robustness sweep reported in latest audit [filecite](turn14file0#L1) | Methodological (not physics): robustness implies reduced sensitivity to arbitrary policy choices | A documented neighborhood perturbation flips NHM2 classification or significantly changes distances |
| "NHM2 is fundamentally Natario-like in all meaningful frames" | unsupported | No multi-lane evaluation; contract scope is diagnostic-local [filecite](turn11file0#L1) | Natario's result is congruence-dependent; identity claim needs more than theta under one lane [cite](turn1search0) [cite](turn7view0) | Establish multi-lane invariance + additional invariants matching Natario construction in appropriate sense |
| Reduced-order baselines should be used as deterministic comparators going forward | established (repo method) | Proof-pack architecture: deterministic feature extraction + distances + versioned contract + audit artifact [filecite](turn12file0#L1) [filecite](turn14file0#L1) | Numerical relativity pedagogy: use test problems/controls; foliation dependence requires declared gauge [cite](turn6view0) [cite](turn7view0) | Baselines do not reproduce expected behavior under the same lane, or comparisons depend on untracked render parameters |

### Appendix C: Primary citations

Primary / foundational sources used for equation-level interpretation:

* **Eric Gourgoulhon, "3+1 Formalism and Bases of Numerical Relativity" (arXiv:gr-qc/0703035)** - used here for explicit identities linking Eulerian observers, extrinsic curvature sign conventions, and divergence/trace relations (e.g., nabla_mu n_mu = -K; K = -1/2 L_n gamma). [cite](turn6view0) [cite](turn7view0) [cite](turn4view0)
* **Miguel Alcubierre, "The warp drive: hyper-fast travel within general relativity" (C.Q.G. 11 (1994) L73-L77; arXiv posting gr-qc/0009013)** - used as a calibration endpoint for the "expansion/contraction" narrative under a compatible slicing. (Repo treats this as a reference, not as ontology.) [cite](turn2search3) [cite](turn1search1)
* **Jose Natario, "Warp Drive with Zero Expansion" (Class. Quantum Grav. 19 (2002) 1157-1165; arXiv:gr-qc/0110086; DOI 10.1088/0264-9381/19/6/308)** - used as the foundational "zero/low expansion" calibration endpoint. [cite](turn1search0) [cite](turn1search5)

### One-page "current truth state" summary

**Declared lane:** Lane A (`lane_a_eulerian_comoving_theta_minus_trk`) defines York theta as **theta = -trK** for the **Eulerian (normal) observers** in `comoving_cartesian` chart, with certified slice extraction (`x-z-midplane`, optional `x-rho`) and explicit normalization modes separating raw vs topology-only views. [filecite](turn11file0#L1) [filecite](turn22file0#L1)

**Renderer risk status:** The scientific render path is certificate-gated and fails closed on normalization drift, hidden gain, lane mismatch, missing theta metadata, or missing slice-hash provenance. This sharply reduces (but does not metaphysically eliminate) the chance that "strange York renders" are mere renderer artifacts under Lane A. [filecite](turn22file0#L1)

**NHM2 result (Lane A):** The latest committed proof-pack audit reports that NHM2 is classified as **low-expansion-like** when compared to calibrated controls under Lane A. The classification remains stable under nearby contract perturbations; thus the conclusion is not a fragile artifact of one threshold/weight choice. [filecite](turn14file0#L1)

**What we can claim now:** "Under Lane A York diagnostics, NHM2's theta morphology and reduced-order distances match the low-expansion-like control family much more closely than the Alcubierre-like control, and this is robust under local policy perturbations." [filecite](turn14file0#L1)

**What we cannot claim yet:** We cannot claim "NHM2 is Natario in all meaningful frames," nor can we treat York morphology as foliation-invariant without multi-lane replication. Those would be category errors (ontology drift from lane-relative classification). [filecite](turn11file0#L1) [cite](turn7view0) [cite](turn1search0)

**Next scientific move:** Build at least one additional, explicitly versioned diagnostic lane (Lane B) and rerun the exact proof-pack to measure lane dependence; add resolution/scheme stability checks; harden provenance by committing or deterministically regenerating the missing proof-pack JSON artifact. [filecite](turn14file0#L1)

### Appendix D: Research Run Source Inventory

This appendix records the named sources surfaced by the deep-research run that informed this memo. The intent is provenance retention, not source equivalence: repo files and primary GR papers remain the authoritative basis for code and equation-level claims.

#### Direct repo sources named in the research run

- `configs/york-diagnostic-contract.v1.json`
  - <https://github.com/pestypig/casimirbot-/blob/main/configs/york-diagnostic-contract.v1.json>
- `docs/audits/research/warp-york-control-family-proof-pack-latest.md`
  - <https://github.com/pestypig/casimirbot-/blob/main/docs/audits/research/warp-york-control-family-proof-pack-latest.md>
- `server/__tests__/hull-render.routes.spec.ts`
  - <https://github.com/pestypig/casimirbot-/blob/main/server/__tests__/hull-render.routes.spec.ts>
- `scripts/hull-optix-service.ts`
  - <https://github.com/pestypig/casimirbot-/blob/main/scripts/hull-optix-service.ts>
- `scripts/warp-york-control-family-proof-pack.ts`
  - <https://github.com/pestypig/casimirbot-/blob/main/scripts/warp-york-control-family-proof-pack.ts>
- `server/gr-evolve-brick.ts`
  - <https://github.com/pestypig/casimirbot-/blob/main/server/gr-evolve-brick.ts>
- `server/gr/evolution/solver.ts`
  - <https://github.com/pestypig/casimirbot-/blob/main/server/gr/evolution/solver.ts>
- `tests/warp-york-control-family-proof-pack.spec.ts`
  - <https://github.com/pestypig/casimirbot-/blob/main/tests/warp-york-control-family-proof-pack.spec.ts>
- `server/gr/evolution/stress-energy.ts`
  - <https://github.com/pestypig/casimirbot-/blob/main/server/gr/evolution/stress-energy.ts>
- `server/stress-energy-brick.ts`
  - <https://github.com/pestypig/casimirbot-/blob/main/server/stress-energy-brick.ts>

#### Connector-scanned repo context from the research run

- `AGENTS.md`
  - <https://github.com/pestypig/casimirbot-/blob/main/AGENTS.md>
- `WARP_AGENTS.md`
  - <https://github.com/pestypig/casimirbot-/blob/main/WARP_AGENTS.md>
- `AGENT_PLAYBOOK.md`
  - <https://github.com/pestypig/casimirbot-/blob/main/AGENT_PLAYBOOK.md>
- `MATH_STATUS.md`
  - <https://github.com/pestypig/casimirbot-/blob/main/MATH_STATUS.md>
- `MATH_GRAPH.json`
  - <https://github.com/pestypig/casimirbot-/blob/main/MATH_GRAPH.json>
- `docs/alcubierre-alignment.md`
  - <https://github.com/pestypig/casimirbot-/blob/main/docs/alcubierre-alignment.md>
- `docs/needle-hull-citation-trace.md`
  - <https://github.com/pestypig/casimirbot-/blob/main/docs/needle-hull-citation-trace.md>
- `docs/needle-hull-citation-trace.json`
  - <https://github.com/pestypig/casimirbot-/blob/main/docs/needle-hull-citation-trace.json>

#### Primary and foundational GR / warp sources named in the research run

- Eric Gourgoulhon, "3+1 Formalism and Bases of Numerical Relativity"
  - arXiv PDF: <https://arxiv.org/pdf/gr-qc/0703035.pdf>
- Miguel Alcubierre, "The Warp Drive: Hyper-fast Travel Within General Relativity"
  - ResearchGate access copy surfaced by the run: <https://www.researchgate.net/publication/1963139_The_Warp_Drive_Hyper-fast_Travel_Within_General_Relativity?utm_source=chatgpt.com>
  - canonical publication DOI referenced elsewhere in the run: `10.1088/0264-9381/11/5/001`
- Jose Natario, "Warp Drive with Zero Expansion"
  - ResearchGate access copy surfaced by the run: <https://www.researchgate.net/publication/1964573_Warp_Drive_With_Zero_Expansion?utm_source=chatgpt.com>
  - canonical publication DOI referenced elsewhere in the run: `10.1088/0264-9381/19/6/308`

#### Broader scan context from the research run

The run reported `Sources scanned: 162`. That broader scan included:

- secondary citation mirrors and bibliographic pages
- publisher landing pages and repository mirrors
- press and popular-science summaries
- forum, Q&A, and aggregator pages

Those sources can be useful for discovery, but they should not be treated as authoritative for repo behavior or equation-level GR claims unless they resolve back to primary sources or the repo itself.
