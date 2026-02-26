# Helix Ask Unified Ownership + Evolution Operating Model and Roadmap

## Repository provenance and source-of-truth precedence

**Date context:** February 26, 2026 (America/New_York). **Repo scope:** `pestypig/casimirbot-` (current `main`).  
**Provenance (git state used):** analyzed `main@35046c0e4546057fc8d4d96384977a7f481541a0` (HEAD at time of research). Repo evidence for this HEAD includes a merge commit labeled "Merge pull request #402 ..." (repo evidence: `fetch_commit(main)` result for `repo_full_name=pestypig/casimirbot-`).

**Source-of-truth precedence (enforced in this report):**
1) **Runtime behavior + enforced contracts in code** (routes/services)  
2) **Shared schemas/types** (e.g., `shared/*.ts`)  
3) **Architecture docs** (e.g., `docs/architecture/*.md`)  
4) **Research docs** (e.g., `docs/audits/research/*.md`)

**Detected code?schema/doc tensions (with resolution):**
- **Promotion stage taxonomy mismatch risk** *(resolution: follow "must use exactly" prompt definitions for the unified model; treat existing enum gaps as migration work)*: the repo contains ladder-like tier enums in shared schemas (repo evidence: `shared/schema.ts`), but the prompt requires the **promotion stage** set `exploratory -> reduced-order -> diagnostic -> certified`. Where existing enums omit any stage, the unified plan treats that as a **schema migration requirement**, not a semantic change.
- **Determinism vs "timestamp-as-identifier" tensions** *(resolution: treat existing timestamped IDs as acceptable for observability, but not acceptable for replay-deterministic policy decisions)*: several flows use `Date.now()` / runtime randomness for trace IDs and other UX identifiers (repo evidence: `server/routes/evolution.ts`, `client/src/components/helix/HelixAskPill.tsx`). The unified plan requires separating **operator-facing trace correlation IDs** (can be time-based) from **policy decision IDs** (must be replay-stable and hash-addressed).

## Integrated decision-grade plan

1) **Executive verdict (GO/NO-GO boundaries)**  
**Decision type:** **hold_report_only** *(inference)*

**GO boundaries (what can be claimed now):**
- **GO (bounded):** "Report-only unified governance surfaces exist or can be assembled from existing primitives: evolution ingest + gate run + training-trace export + voice parity gating + knowledge corpus provenance tags." *(inference grounded by existing primitives; see current-state matrix evidence below)*  
- **GO (bounded):** "Deterministic patch identity is feasible now via hash-derived patch IDs." *(verified; repo evidence: `server/services/evolution/patch-store.ts`)*  
- **GO (bounded):** "Voice/text certainty parity enforcement is implemented as a callable policy primitive." *(verified; repo evidence: `shared/helix-dottie-callout-contract.ts`, `server/routes/voice.ts`)*

**NO-GO boundaries (what cannot be claimed until evidence exists):**
- **NO-GO (no_go_l4_claims):** Do **not** claim **L4 Ownable** until **L3 Portable** is demonstrated with **certified-only promotion enforcement** and replay receipts across the custody path. *(inference; constrained by your anti-goals plus missing end-to-end enforce evidence)*  
- **NO-GO:** Do **not** claim multimodal verification completeness; parts of multimodal ingest/verification are placeholder/heuristic. *(verified; repo evidence: `server/routes/essence.ts`, `server/services/essence/ingest-jobs.ts`)*  
- **NO-GO:** Do **not** claim probabilistic (VI/ELBO) improvements as "certification evidence." *(inference; reinforced by VI/ELBO literature and your constraint that diagnostics ? certification)* ?cite?turn6view0?turn6view1?

2) **Current-state matrix (exists_now | partial_or_stub | missing)**  
*All rows below are current-state facts derived from repo evidence and tagged per your rules.*

| Domain | Capability (strict) | Status | Claim tag | Repo evidence (exact paths) | Notes |
|---|---|---:|---|---|---|
| Backend | Evolution patch ingest endpoint (`/patches/ingest`) | exists_now | verified | `server/routes/evolution.ts`, `server/services/evolution/patch-store.ts` | Patch records append to local JSONL under `.cal/evolution`. |
| Backend | Evolution gate run endpoint (`/gate/run`) + hard-fail semantics | exists_now | verified | `server/routes/evolution.ts`, `server/services/evolution/congruence-gate.ts`, `shared/evolution-schema.ts` | Gate returns `PASS/WARN/FAIL` + `firstFail` for hard failures. |
| Backend | Evolution trajectory endpoint (`/trajectory/:id`) | exists_now | verified | `server/routes/evolution.ts`, `server/services/evolution/trajectory.ts`, `server/services/evolution/git-history.ts` | Uses deterministic co-change over recent git history when available. |
| Backend | Canonical, deterministic patch ID derivation | exists_now | verified | `server/services/evolution/patch-store.ts` | `patch:<sha256(canonical_json)>` with stable sort/dedupe. |
| Backend | Voice service route implementing callout eligibility + parity gates | exists_now | verified | `server/routes/voice.ts`, `shared/callout-eligibility.ts`, `shared/helix-dottie-callout-contract.ts` | Eligibility decision and parity primitive exist; route composes them. |
| Backend | Mission go-board routes (snapshot/events/actions/ack) | exists_now | verified | `server/routes/mission-board.ts` | Server route exists; client fetch helpers also exist. |
| Backend | Training trace API routes (list/export ingest) | exists_now | verified | `server/routes/training-trace.ts`, `docs/TRAINING-TRACE-API.md`, `server/services/observability/training-trace-store.ts`, `shared/schema.ts` | Export + schema types present; store supports multiple trace types. |
| Backend | Knowledge baseline endpoint + knowledge projects sync | exists_now | verified | `server/routes/knowledge.ts`, `server/services/knowledge/corpus.ts` | Baseline builder exists; corpus persistence tags ingestion/retrieval as deterministic. |
| Backend | Essence verification endpoint | partial_or_stub | verified | `server/routes/essence.ts` | Verification currently returns placeholder "ok" in places; do not overclaim completeness. |
| Compute/Training | Patch momentum computation function | exists_now | verified | `server/services/evolution/momentum.ts` | Function exists, but end-to-end wiring into evolution gate artifacts appears incomplete. |
| Compute/Training | Replayable training-trace record shape (metrics, deltas, prediction-vs-observation ledger) | exists_now | verified | `shared/schema.ts`, `server/routes/training-trace.ts`, `server/services/observability/training-trace-store.ts` | Prediction/observation ledger includes uncertainty fields; can host calibration signals. |
| Compute/Training | Certified-only promotion enforcement (hard gate that blocks non-certified promotion into production knowledge) | missing | missing_evidence | (no single enforced gate found in required anchors) | There are gating primitives, but no repo-evidence of a unified "promotion write barrier" enforcing certified-only across production-facing surfaces. |
| UI | Helix Ask pill (core user surface) | exists_now | verified | `client/src/components/helix/HelixAskPill.tsx` | Contains live events, proof display, objective-first situational view (heuristic extraction). |
| UI | Mission overwatch context controls + voice emission logic | exists_now | verified | `client/src/lib/mission-overwatch/index.ts`, `shared/callout-eligibility.ts` | UI uses shared eligibility logic for voice callouts. |
| UI | Evolution operator UI surface (force-matrix/hotspot control panel) | missing | missing_evidence | (no dedicated UI in required anchors) | Evolution endpoints exist, but a first-class operator panel is not evidenced in the required anchors. |
| Governance | Ownership maturity ladder defined in docs | exists_now | verified | `docs/ownership-maturity-ladder-v1.md` | The ladder and gates exist as definitions; enforcement maturity is separate. |
| Governance | Evolution governance contract defined in docs | exists_now | verified | `docs/architecture/evolution-governance-contract.md`, `docs/audits/research/helix-ask-evolution-governance-framework-2026-02-23.md` | Contract exists; implementation is partial (see above). |
| Uncertainty | Probabilistic lane with ELBO/VI diagnostics captured in manifests/traces | missing | missing_evidence | (no explicit VI/ELBO manifest/traces in required anchors) | Training trace metrics are extensible and can host it, but no evidence it is currently produced. |
3) **Unified architecture proposal (backend/compute/UI/governance)**  
*(All items below are recommendations; tag = inference unless explicitly stated otherwise.)*

**Unifying concept:** merge the ownership ladder and evolution governance into one operator-inspectable **control loop**:

**(A) custody spine (must use exactly):** **Evidence envelope -> Claim node -> Promotion stage**  
**(B) promotion stage (must use exactly):** **exploratory -> reduced-order -> diagnostic -> certified**  
**(C) ownership maturity (must use exactly):** **Trainable -> Repeatable -> Portable -> Ownable**  
(repo evidence for these definitions: `docs/ownership-maturity-ladder-v1.md`) *(verified)*

**Proposed unified control loop (must reconcile ingest -> momentum -> congruence -> promotion):**  
- **Ingest -> Evidence envelope**: transform "patch intent + touched paths + test outputs + trace export receipts + knowledge diffs" into a **versioned evidence envelope** stored local-first. *(inference; uses existing patch ingest + training trace export primitives: `server/routes/evolution.ts`, `server/routes/training-trace.ts`)*  
- **Momentum -> Claim node**: compute **patch momentum** as a deterministic vector over `scope/subsystem/coupling/test/uncertainty` (required definition) and attach to a **claim node** describing what the patch asserts will improve, with typed failure semantics. *(inference; function exists: `server/services/evolution/momentum.ts`; schema exists: `shared/evolution-schema.ts`)*  
- **Congruence -> Claim node**: run congruence gate (existing) and attach verdict + firstFail + deltas to the claim node. *(verified gate exists; repo evidence: `server/services/evolution/congruence-gate.ts`)*  
- **Promotion -> Promotion stage**: promotion stage is a decision that moves a claim node across `exploratory -> reduced-order -> diagnostic -> certified` and (only at **certified**) is allowed to update **production-facing knowledge promotion** surfaces. *(inference; certified-only enforcement is missing evidence today—must be built.)*

**Control-plane separation (key design rule):**
- **Operator trace correlation IDs** may be time-based (`traceId` for observability), but **policy decisions must be replay-stable**: policy decision IDs must be derived from canonicalized inputs (hash-addressed) and must emit replay receipts. *(inference; aligned with reproducible build principles about controlling variance and using hashes to verify identical outputs) ?cite?turn1search0?turn1search7?*

4) **Out-of-scope and anti-goals** *(inference, but required constraints)*  
- Do **not** claim full **L4 Ownable** without demonstrated **L3 Portable** + **certified-only promotion enforcement**.  
- Do **not** claim multimodal verification completeness when endpoints/jobs are placeholder or heuristic (notably essence verification and ingest jobs contain best-effort behavior). *(verified; repo evidence: `server/routes/essence.ts`, `server/services/essence/ingest-jobs.ts`)*  
- Do **not** replace `casimir:verify`; unified governance must be additive and treat existing Casimir verification as an input signal. *(inference; "casimir:verify" exists as a first-class script) (repo evidence: `package.json`)*  
- Do **not** introduce cloud-only mandatory dependencies for the core custody path; local-first custody remains first-class. *(inference; consistent with existing local JSONL storage under `.cal/*` in evolution patch store.)*

5) **Dependency DAG and batch ordering**  
**Strict dependency ordering (required minimum ordering satisfied):**  
1) manifests + policy decision log  
2) evidence/claim registry  
3) promotion gate  
4) force-matrix/hotspot operator surface  
5) probabilistic (VI/ELBO) diagnostic lane  
6) hardening (bundle integrity/signing) *(inference)*

**Proposed dependency DAG (conceptual):**
- **Batch 1 — Manifests + policy decision log**  
  - `depends_on`: none  
  - `blocks`: all later batches  
  - `exit_criteria`: deterministic canonicalization + hash-addressed IDs for policy decisions; replay receipt schema drafted and validated. *(inference; justified by deterministic build + provenance best practice) ?cite?turn1search0?turn3search0?*
- **Batch 2 — Evidence/claim registry (custody spine operational)**  
  - `depends_on`: Batch 1  
  - `blocks`: promotion gate  
  - `exit_criteria`: evidence envelopes and claim nodes persist local-first; claim nodes reference evidence envelopes; export/replay works offline. *(inference; aligns with in-toto supply chain transparency concept) ?cite?turn0search0?*
- **Batch 3 — Promotion gate (certified-only enforcement)**  
  - `depends_on`: Batches 1–2  
  - `blocks`: any enforce rollout  
  - `exit_criteria`: certified-only promotion compliance = 1.0; typed rejection coverage = 1.0. *(inference; required by your gates)*
- **Batch 4 — Force-matrix/hotspot operator surface**  
  - `depends_on`: Batches 1–3  
  - `blocks`: probabilistic lane graduation (because hotspot UI is how operators triage risk)  
  - `exit_criteria`: deterministic hotspot classes (hot/warm/cold) + typed fail semantics surfaced in UI; trajectory-based hotspots reproducible. *(inference; repo has co-change baseline primitive) (repo evidence: `server/services/evolution/trajectory.ts`, `server/services/evolution/git-history.ts`)*
- **Batch 5 — Probabilistic diagnostic lane (VI/ELBO)**  
  - `depends_on`: Batches 1–4  
  - `blocks`: hardening (signing) only in the sense that signing must cover new artifacts  
  - `exit_criteria`: ELBO decomposition metric coverage = 1.0; posterior collapse detection coverage = 1.0; regressions trigger mandatory promotion blocks. *(inference; grounded in VI/ELBO foundations) ?cite?turn6view0?turn6view2?*
- **Batch 6 — Hardening (bundle integrity/signing)**  
  - `depends_on`: Batches 1–5  
  - `blocks`: enforce graduation  
  - `exit_criteria`: bundle integrity verification + optional signing for artifacts; transparent logging optional for public artifacts; local-first signing for private mode. *(inference; parallels Sigstore and provenance frameworks) ?cite?turn0search7?turn3search0?*

6) **Patch momentum + force-matrix operationalization**  
**Viability assessment (deterministic operator tooling):**
- **Patch momentum computation is viable now** in a deterministic form because inputs can be derived from git diffs + test reports + known file sets, and the repo already has a momentum function with the required component decomposition. *(verified for function existence; repo evidence: `server/services/evolution/momentum.ts`; inference for full wiring)*  
- **Interaction-matrix transform model** is **partially viable** now: the repo has a deterministic co-change baseline across files (symmetric edges), which can seed a subsystem-level operator "force matrix." *(verified for co-change primitive; repo evidence: `server/services/evolution/git-history.ts`; inference for asymmetric force matrix extension)*

**Hotspot classes (operator-facing, deterministic):**
- **hot**: co-change weight >= 4 OR high coupling factor + policy/schema touched  
- **warm**: co-change weight 2–3  
- **cold**: co-change weight <= 1  
*(inference; leverage existing weight usage in `trajectory.ts` where weight >= 3 is treated as risk) (repo evidence: `server/services/evolution/trajectory.ts`)*

**Typed fail semantics (required):**
- Reuse existing congruence hard-fail IDs as "typed fail reasons" for promotion blocks (e.g., `CASIMIR_VERIFY_FAIL`, `TRACE_SCHEMA_BREAK`, `API_BREAK_DETECTED`). *(verified; repo evidence: `server/services/evolution/congruence-gate.ts`)*  
- Add new typed fails for momentum and uncertainty regressions (see items 7 and 11). *(inference)*
7) **VI/ELBO uncertainty lane policy and gates**  
**Policy stance (required):** probabilistic lane is **optional** and **diagnostic**; ELBO/calibration are **signals**, not certification evidence. *(inference; consistent with VI foundations and calibration literature) ?cite?turn6view0?turn6view1?*

**Where VI/ELBO metrics should live (min-breaking change):**
- Use `training_trace.metrics` (which already supports arbitrary key/value pairs) to store:  
  - `vi.elbo_total`, `vi.elbo_recon`, `vi.elbo_kl`, `vi.kl_per_latent` (if scalarized), `vi.posterior_collapse_rate`  
  - `cal.ece`, `cal.mce`, `cal.brier`, `cal.nll`  
  *(inference enabled by existing flexible metrics map; repo evidence: `shared/schema.ts`)*

**Calibration metrics required (minimum operator-safe set):**
- **ECE** and a binning-based reliability summary (at least in artifact form) as standard calibration indicators. *(inference; calibration as a recognized problem and temperature scaling as a baseline method) ?cite?turn6view1?*  
- **NLL** (negative log-likelihood) and **Brier score** as proper scoring rule complements. *(inference; standard practice in probabilistic evaluation; calibration paper grounds the need for calibration) ?cite?turn6view1?*

**Mandatory promotion blocks (when uncertainty quality regresses):**
- Block promotion if any of the following regress beyond tolerance for the benchmark pack:  
  - `cal.ece` worsens by > e  
  - `vi.posterior_collapse_rate` exceeds threshold or increases by > e  
  - `vi.elbo_kl` collapses toward 0 without a justified architectural change (posterior collapse signature) *(inference; posterior collapse is a known VAE failure mode) ?cite?turn6view2?turn6view0?*  
- Block promotion if **metric coverage** is incomplete (coverage gates below). *(inference; required by your KPI targets)*

8) **Runtime/budget/SLO envelope** *(inference; must be explicit and fail-closed)*  
**Compute budget per evolution cycle (operator-triggered):**
- CPU: 10–20 minutes per cycle (diff stats + gate + replay + artifact hashing)  
- GPU: 0 minutes baseline; probabilistic lane optionally budgets GPU separately (e.g., <= 30 GPU-min)  
*(inference; local-first and deterministic priorities)*

**Storage budget / retention:**
- Evidence envelopes + claim nodes: retained 90 days (hot) / 30 days (warm) / 14 days (cold), with explicit retention class tags. *(inference)*  
- Training traces: rotate by size and age; keep exportable JSONL receipts to preserve replayability. *(inference; training trace export exists) (repo evidence: `server/routes/training-trace.ts`)*  
- Evolution patches JSONL: respect existing retention max parameter and enforce deterministic pruning. *(verified; repo evidence: `server/services/evolution/patch-store.ts`)*

**Latency SLOs (verification surfaces):**
- Gate compute (congruence + momentum): p95 <= 2.0s for "report-only," p95 <= 5.0s for "enforce" (since enforce may include heavier checks). *(inference)*  
- UI refresh for operator panels: p95 <= 250ms for cached states, <= 1.5s when recomputing. *(inference)*

**Availability SLO (verification surfaces):**
- Local-first mode: "available if local disk available" (best-effort).  
- If adding transparency logs (optional): target consistent with public Rekor SLOs when applicable. ?cite?turn0search7? *(inference)*

**Fail-closed degradation behavior (required):**
- If budget exceeded or required artifacts missing:  
  - **Promotion gate fails closed** (no certified promotion).  
  - UI shows typed reason and emits a replay receipt with "budget_exceeded" classification. *(inference)*

9) **Data governance (privacy/license/redaction)** *(inference, anchored in local-first custody and SBOM principles)*  
**Prompt/user-data minimization & redaction in traces:**
- Default: redact raw prompts and attachments; store only hashed references + minimized excerpts needed for replay. *(inference; consistent with "reduce variance / minimize environment attributes" thinking and provenance discipline) ?cite?turn1search0?turn3search0?*  
- Treat `predictionObservationLedger` and similar logs as potentially sensitive; store aggregated metrics by default. *(inference; ledger schema exists: repo evidence `shared/schema.ts`)*

**License/rights propagation through evidence envelopes:**
- Evidence envelopes carry a `license_provenance` block (SPDX license expressions) and/or CycloneDX metadata for artifacts when exporting across boundaries. *(inference; SPDX and CycloneDX are SBOM standards and include license metadata) ?cite?turn3search3?turn2search6?*

**Retention classes + deletion guarantees:**
- Define explicit artifact classes: `trace`, `evidence`, `claim`, `promotion_receipt`, `bundle_signature`. *(inference)*  
- Deletion guarantees: enforce tombstone records that preserve reason-code continuity without retaining raw sensitive payloads. *(inference)*

**External provider outputs in local-first custody mode:**
- If a remote vision/voice provider is used, store only: provider name/version, request hash, response hash, and a redacted summary necessary for replay comparisons. *(inference; remote provider use is present in essence ingest and voice routes) (repo evidence: `server/services/essence/ingest-jobs.ts`, `server/routes/voice.ts`)*

10) **Migration, backfill, and rollback strategy** *(inference; must preserve replayability)*  
**Legacy mapping:**
- Map existing training traces to new unified claim nodes by deriving `claim_id = sha256(canonical(traceId + patchId + gate_inputs))` while preserving original `traceId` as correlation metadata. *(inference; training traces exist, patch IDs exist)*  
- Map existing evolution patch records to evidence envelopes retroactively by emitting "synthetic envelopes" with `class=derived` provenance. *(inference; mirrors knowledge.corpus provenance approach) (repo evidence: `server/services/knowledge/corpus.ts`)*

**Backfill safety + idempotency:**
- Backfill jobs must be idempotent: if derived artifact exists with matching hash, skip; else emit diff artifact and block promotion until reconcile. *(inference)*

**Rollback plan (required):**
- Keep dual-write (report-only window): write new envelopes + claim nodes while leaving legacy flows untouched; if rollback, stop reading new artifacts but keep them for replay audit. *(inference)*  
- Preserve reason-code continuity by never reusing typed fail IDs; only deprecate. *(inference)*

11) **Report-only -> enforce graduation gates** *(inference; measurable gates required)*  
**Graduation prerequisites:**
- Minimum stability window: 14 consecutive days of report-only runs with no untyped rejections. *(inference)*  
- False positive/negative bounds: define per gate; enforce requires meeting bounds. *(inference)*  
- Replay determinism threshold compliance duration: >= 0.99 determinism for policy decisions sustained for 14 days. *(inference; aligns with reproducibility principles) ?cite?turn1search0?*  
- Operator override requires audit trail: signed override receipt (local-first signing) and "why override" reason code. *(inference; policy-as-code and provenance norms) ?cite?turn1search1?turn3search0?*
12) **30/60/90 + batch plan with adversarial tests** *(inference; no code implementation here)*  
**30 days (Batch 1–2 focus):**
- Deliver: manifest schema + policy decision log + evidence/claim registry (local-first).  
- Adversarial tests:  
  - Replay determinism under environment variance (timezone, locale, ordering) in the spirit of reproducible-build variation testing. ?cite?turn1search7?turn1search0?  
  - Evidence omission attacks: remove evidence refs and confirm hard gate "repo-attributed claims without evidence refs = 0." *(required KPI)*

**60 days (Batch 3–4 focus):**
- Deliver: certified-only promotion gate (still report-only) + first operator surface for hotspots.  
- Adversarial tests:  
  - Drift injection: modify voice or mission-board contracts and verify congruence hard-fail triggers (`CONTRACT_DRIFT_*`). *(repo evidence: `server/services/evolution/congruence-gate.ts`)*  
  - Coupling explosion: synthetic patch touching multiple subsystems to verify momentum signal and hotspot class assignment. *(inference; backed by momentum function shape in `server/services/evolution/momentum.ts`)*

**90 days (Batch 5–6 focus):**
- Deliver: probabilistic diagnostic lane + bundle integrity/signing + enforce graduation evidence.  
- Adversarial tests:  
  - Posterior collapse simulation and detection gating. ?cite?turn6view2?turn6view0?  
  - Calibration regression tests (ECE/NLL drift) and verify promotion blocks. ?cite?turn6view1?  
  - Artifact tamper tests: modify evidence artifact after the fact and verify integrity check fails closed (supply-chain provenance style). ?cite?turn0search7?turn3search0?

13) **KPI table with thresholds** *(required; targets reproduced exactly)*

| KPI | Threshold / Target | Gate type |
|---|---:|---|
| voice/text certainty parity violations | **0** | hard gate |
| repo-attributed claims without evidence refs | **0** | hard gate |
| replay determinism rate for policy decisions | **>= 0.99** | hard gate |
| suppression reason stability under replay | **>= 0.999** | hard gate |
| certified-only promotion compliance | **1.0** | hard gate |
| promotion rejection typed-reason coverage | **1.0** | hard gate |
| ELBO decomposition metric coverage on probabilistic lanes | **1.0** | hard gate |
| posterior-collapse detection coverage on probabilistic lanes | **1.0** | hard gate |

14) **Risk register + kill criteria**  
**Risk register (top items):**
- **R1: "Report-only forever" failure mode** — governance artifacts exist but never become enforceable because typed reasons and replay receipts are incomplete. *(inference)*  
- **R2: Determinism regressions via latent randomness** — use of runtime randomness bleeds into policy decisions. *(inference; repo has runtime randomness in multiple non-policy contexts) (repo evidence: `client/src/components/helix/HelixAskPill.tsx`, `server/routes/evolution.ts`)*  
- **R3: Multimodal overclaim risk** — essence verify and ingest heuristics are treated as verification. *(verified; repo evidence: `server/routes/essence.ts`, `server/services/essence/ingest-jobs.ts`)*  
- **R4: Operator overload** — hotspot/force-matrix UI surfaces too many signals without typed triage semantics (hot/warm/cold). *(inference)*

**Kill criteria (required):**
- Kill (disable enforce) if any hard gate KPI breaches for 2 consecutive days. *(inference)*  
- Kill if certified-only promotion compliance < 1.0 in any enforce canary. *(inference)*  
- Kill if replay determinism rate drops below 0.99 for any gate decision class. *(inference; reproducibility principle) ?cite?turn1search0?*  
- Kill if typed-reason coverage < 1.0 (any "unknown" rejection) in enforce. *(inference)*

**Rollback conditions (required):**
- Roll back to report-only if enforced promotion blocks legitimate certified promotions above tolerance (false negatives beyond bound) or if operators regularly override without convergence (indicates gate mismatch). *(inference)*

15) **External comparison with citations (primary-source patterns)**  
**Where this repo's approach is stricter/different (comparative):**
- **Stricter than generic provenance:** the custody spine requires not only provenance but explicit promotion stages and adversarial checks. *(inference; compare to provenance specs as attestation frameworks)* ?cite?turn3search0?turn0search0?  
- **In-toto alignment:** in-toto emphasizes transparent recording of steps, who performed them, and verification against intended steps—this maps cleanly to evidence envelopes and claim nodes. ?cite?turn0search0? *(inference mapping)*  
- **SLSA alignment:** SLSA build provenance treats provenance as verifiable information about how artifacts were produced and recommends explicit schemas and verification rules; your unified model extends this from "build artifacts" to "agent evolution artifacts + promotion gates." ?cite?turn3search0?turn0search2? *(inference mapping)*  
- **Policy-as-code parallel:** OPA positions policy as declarative rules evaluated over structured inputs; your system already has structured schema-driven contracts and can adopt policy-as-code patterns for promotion gating, with deterministic evaluation and typed outputs. ?cite?turn1search1?turn1search4? *(inference mapping)*  
- **Transparency/signing optionality:** Sigstore/Rekor provides a public transparency log with auditing properties and published availability targets; your plan keeps this optional and local-first, but can mirror the "append-only, auditable log" idea for evidence envelopes. ?cite?turn0search7?turn0search3? *(inference mapping)*  
- **Reproducibility emphasis:** reproducible-build guidance centers on controlling inputs/environment/instructions so outputs can be bit-identical; your determinism gates are essentially "policy decision reproducibility" applied to agent governance. ?cite?turn1search0?turn1search7? *(inference mapping)*  
- **Uncertainty lane discipline:** VI/ELBO foundations define ELBO as a lower bound objective; calibration work demonstrates modern networks can be miscalibrated and motivates explicit calibration measurement; your plan correctly treats these as diagnostics, not certification. ?cite?turn6view0?turn6view1?

16) **Open questions and missing evidence**  
- Where is the **single, enforced write barrier** that prevents non-certified promotion into production-facing knowledge surfaces? *(missing_evidence)*  
- What is the authoritative mapping from **ownership maturity gates** (Trainable->Repeatable->Portable->Ownable) to concrete CI proofs in this repo? *(missing_evidence; definitions exist but enforcement mapping is not evidenced in required anchors) (repo evidence: `docs/ownership-maturity-ladder-v1.md`)*  
- How should "interaction-matrix transform model" become **asymmetric** (directional) in a way that remains deterministic and operator-explainable? *(missing_evidence/inference)*  
- Which artifacts are considered "production-facing knowledge promotion" in Helix Ask specifically (knowledge corpus DB, baseline docs bundle, prompt ingest, something else)? *(missing_evidence; ingestion/persistence exist but "promotion" boundary needs explicit contract) (repo evidence: `server/routes/knowledge.ts`, `server/services/knowledge/corpus.ts`)*

17) **Artifact list and paths + schema versions + validation commands**  
*(This run is research-only; no files edited. The following are required output artifacts to be authored/committed by the executing team.)*
**Required artifacts (paths):**
- `docs/audits/research/helix-ask-ownership-evolution-unified-deep-research-2026-02-26.md`  
  - schema version: `doc/markdown/1` *(inference)*  
  - validation: markdown lint (if present) + PR review checklist *(inference)*
- `reports/helix-ask-ownership-evolution-unified-decision-matrix-2026-02-26.json`  
  - schema version: `helix-ask/ownership-evolution-decision-matrix/1` *(inference)*  
  - validation command (proposed): `npm run validate:helix-unified -- decision-matrix` *(inference; would need to be added)*
- `reports/helix-ask-ownership-evolution-unified-batch-prompts-2026-02-26.md`  
  - schema version: `doc/markdown/1` *(inference)*
- `reports/helix-ask-ownership-evolution-unified-dependency-dag-2026-02-26.json`  
  - schema version: `helix-ask/ownership-evolution-dag/1` *(inference)*
- `reports/helix-ask-ownership-evolution-unified-runtime-envelope-2026-02-26.json`  
  - schema version: `helix-ask/runtime-envelope/1` *(inference)*
- `reports/helix-ask-ownership-evolution-unified-graduation-gates-2026-02-26.json`  
  - schema version: `helix-ask/graduation-gates/1` *(inference)*

**Validation commands grounded in repo evidence (available today):**
- `npm run audit:agent-context:check` *(repo evidence: `package.json`)*  
- `npm run helix:ask:regression` *(repo evidence: `package.json`, `scripts/helix-ask-regression.ts`)*  
- `npm run helix:ask:sweep` and `npm run helix:ask:fast-quality:gate` *(repo evidence: `package.json`, `scripts/helix-ask-fast-quality-promotion-gate.ts`)*  
- `npm run casimir:verify` *(repo evidence: `package.json`)*

**Deterministic hash/signature fields (where applicable):**
- Every evidence envelope and claim node must include:  
  - `schemaVersion`  
  - `canonical_hash` (sha256 of canonical JSON)  
  - `parent_hashes[]` (to form an append-only DAG)  
  - optional `signature` block for offline signing  
*(inference; aligns with provenance and transparency-log concepts) ?cite?turn3search0?turn0search7?*

## Ownership and decision authority model

**Batch-level ownership (required fields; roles are suggestions and should map to your org reality):**
- **Batch 1 (manifests + policy decision log):**  
  - DRI: Platform/Infra lead (agent governance) *(inference)*  
  - Approver (report-only -> enforce): Safety/Verification lead *(inference)*  
  - Rollback authority: On-call SRE / Platform lead *(inference)*  
  - Escalation: Safety council if enforcement blocks critical ops *(inference)*
- **Batch 2 (evidence/claim registry):**  
  - DRI: Backend lead (observability + storage) *(inference)*  
  - Approver: Safety/Verification lead *(inference)*  
  - Rollback: Backend lead *(inference)*  
  - Escalation: Data governance owner if privacy constraints conflict *(inference)*
- **Batch 3 (promotion gate):**  
  - DRI: Safety/Verification lead *(inference)*  
  - Approver: Product owner + Safety lead joint approval *(inference)*  
  - Rollback: Safety lead (fail-closed) *(inference)*  
  - Escalation: Exec sponsor when certified-only blocks business-critical promotion *(inference)*
- **Batch 4 (force-matrix/hotspot UI):**  
  - DRI: Frontend lead + tooling PM *(inference)*  
  - Approver: Operator lead (mission control) *(inference)*  
  - Rollback: Frontend lead *(inference)*  
  - Escalation: Safety lead if UI obscures typed reasons *(inference)*
- **Batch 5 (probabilistic lane):**  
  - DRI: ML/Applied research lead *(inference)*  
  - Approver: Safety/Verification lead *(inference)*  
  - Rollback: ML lead *(inference)*  
  - Escalation: Safety council if diagnostics are misinterpreted as certification *(inference)*
- **Batch 6 (hardening/signing):**  
  - DRI: Security engineering *(inference)*  
  - Approver: Security + Safety joint approval *(inference)*  
  - Rollback: Security engineering *(inference)*  
  - Escalation: Security incident response owner *(inference)*

## External operational patterns

The unified model is best understood as applying supply-chain provenance, policy-as-code, and reproducibility disciplines to **agent evolution governance**:

- **Supply-chain provenance / in-toto:** represent steps performed, by whom, and allow verification against intended process. ?cite?turn0search0?  
- **SLSA build provenance:** formalize how artifacts are produced, define schemas, and require verification rules. ?cite?turn3search0?turn0search2?  
- **Policy-as-code (OPA/Rego):** declarative policy evaluated over structured inputs-fits promotion gates and typed fail semantics. ?cite?turn1search1?turn1search4?  
- **Reproducible builds:** control variance so third parties can reproduce outputs; in your case, "third party" is the operator replay tool. ?cite?turn1search0?turn1search7?  
- **Transparency logs (Sigstore/Rekor):** append-only auditability with published availability targets; your plan keeps this optional and local-first, but compatible. ?cite?turn0search7?turn0search3?  
- **Uncertainty + calibration literature:** VI/ELBO provides training diagnostics; calibration must be measured explicitly; neither alone implies certification. ?cite?turn6view0?turn6view1?
