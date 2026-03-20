# Needle Hull Mark 2 Reduced‑Order Full‑Solve Gates and Evidence Governance Manuscript

## Plain-language executive summary

“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.” fileciteturn55file0L1-L1

Needle Hull Mark 2 (NHM2), as documented in the state-of-record artifacts, is organized as a **governance-and-evidence program** rather than as a claim that any “warp” configuration is physically feasible or operationally realizable. The conceptual guide states this orientation explicitly: NHM2 exists to present (i) a math framework with explicit assumptions, (ii) a set of falsifiable gates, and (iii) a reproducible evidence/governance pipeline that can **fail closed** (i.e., it blocks upgrades when required evidence is missing rather than filling gaps with inference). fileciteturn54file0L1-L1 fileciteturn56file0L1-L1

The repo’s **top-level proof map** is the proof-anchor index. It defines (a) a **canonical authority chain** for decisions and (b) default “state-of-record anchors” for human- and machine-readable summaries. fileciteturn55file0L1-L1 fileciteturn56file0L1-L1 In the canonical authority chain, the highest-precedence decision artifact is the campaign execution report (2026‑02‑24), followed by the G4 decision ledger and governance matrix, and then the evidence pack and evidence snapshot. fileciteturn55file0L1-L1 fileciteturn56file0L1-L1

At the **canonical-authoritative** tier, the campaign execution report records an executive verdict **REDUCED_ORDER_ADMISSIBLE** with a reconciled gate scoreboard of **PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1** (9 total gates). fileciteturn57file0L1-L1 This counts/decision is echoed by the committed machine scoreboard JSON (`campaign-gate-scoreboard-2026-02-24.json`). fileciteturn22file0L1-L1 The same canonical report also classifies gate **G5** as **NOT_APPLICABLE** by policy in this campaign context, which is a key structural reason the record does **not** license feasibility language. fileciteturn57file0L1-L1

Independent of that canonical adjudication, the repo runs **integrity parity** checks to ask a narrower question: “Do the consistency checks still hold?” The integrity parity suite (2026‑03‑18) reports **final_parity_verdict: PASS** with **blocker_count: 0**, and asserts that canonical decision/count shape, geometry baseline checks, GR-observable parity checks, external-matrix taxonomy checks, capsule validation, and Casimir verification all satisfied its rubric. fileciteturn59file0L1-L1

Separately, the repo maintains a **promotion-readiness** layer that is explicitly *not the same* as canonical reduced-order gate admissibility. The promotion readiness suite (2026‑03‑18) is **PARTIAL** with `readiness_gate_pass: false`; it reports `reportable_ready: true` for `q_spoiling` and `timing`, but `reportable_ready: false` for `sem_ellipsometry`, with explicit blocked reasons `missing_covariance_uncertainty_anchor` and `missing_paired_dual_instrument_run`. fileciteturn60file0L1-L1

A third layer is the repo’s **external work comparison overlay**, which is explicitly a non-canonical “reference-only” overlay (it does not block or override canonical decisions). fileciteturn54file0L1-L1 fileciteturn56file0L1-L1 In the latest external comparison matrix (2026‑03‑18), 14 works are summarized as **7 compatible, 5 partial, 2 inconclusive, 0 stale**, with “partial/inconclusive” predominantly attributed to `non_comparable_or_unknown` reason codes. fileciteturn61file0L1-L1

### Key terms defined once

**Canonical-authoritative (canonical):** the highest-precedence internal decision artifacts (e.g., the campaign execution report and its canonical chain), and the tier in which decision labels and gate scoreboards may be stated without being overridden by lower tiers. fileciteturn54file0L1-L1 fileciteturn56file0L1-L1 fileciteturn64file0L1-L1

**Fail-closed:** a policy posture in which missing required evidence blocks claim upgrades rather than being ignored; in the proof index this is codified as `missing_artifact_behavior: UNKNOWN_and_fail_closed_for_claim_tier_promotion`. fileciteturn54file0L1-L1 fileciteturn56file0L1-L1 fileciteturn64file0L1-L1

**Congruence:** whether evidence and model outputs agree under lane rules, with lanes allowed to be congruent, incongruent, unknown, or blocked using explicit reason codes. fileciteturn54file0L1-L1 fileciteturn60file0L1-L1

**QI/QEI:** quantum inequality / quantum energy inequality style bounds used as **hard guardrails** in the governance stack, represented in the repo guardrails as an inequality of the form `int_T00_dt >= -K / tau^4` (Ford-Roman style lineage: `SRC-007`, `SRC-051`; Fewster‑Eveson worldline QEI: `SRC-008`, `SRC-052`). fileciteturn54file0L1-L1 fileciteturn65file0L1-L1 fileciteturn62file0L1-L1

Why this matters: the executive summary establishes what NHM2 *is* in this repo—**a falsifiable, gate-driven evidence discipline**—and prevents readers from mistaking a “pipeline status” for a claim of physical feasibility. fileciteturn54file0L1-L1 fileciteturn64file0L1-L1

## Theory lineage

The repo frames its theory lineage as a **concept flow** from (a) GR observables → (b) warp-family context → (c) NHM2 gates/evidence governance, with attention to assumption domains and comparability. fileciteturn54file0L1-L1

### GR observables as “sanity anchors” for a GR-based computation stack

In plain language, the conceptual guide states that GR describes gravity as geometry and that historical/modern tests (Mercury precession, light deflection, frame dragging, Shapiro delay) act as benchmarks for whether a GR-based computational framework is behaving sensibly. fileciteturn54file0L1-L1 The guide also enumerates external literature anchors for those tests using repo-internal source IDs (e.g., Einstein-era foundations `SRC-077`, `SRC-075`; modern synthesis `SRC-076`; lensing anchors `SRC-078`, `SRC-079`; frame-dragging anchors `SRC-080`, `SRC-081`, `SRC-082`; Shapiro anchors `SRC-083`, `SRC-084`). fileciteturn54file0L1-L1 fileciteturn62file0L1-L1

Technically, NHM2 operationalizes these as replayable “shadow” scripts and pinned snapshot paths: the proof index lists GR observable replay scripts (Mercury, lensing deflection, frame dragging, Shapiro delay) and the corresponding snapshot JSONs in `docs/specs/data/…`. fileciteturn55file0L1-L1 fileciteturn56file0L1-L1 The current reference capsule reports all four GR baseline statuses as `pass` and records numerical residuals for each baseline (e.g., Mercury perihelion residual, lensing residuals and gamma residual, frame-dragging residuals, Shapiro gamma residual) as well as the snapshot paths used. fileciteturn58file0L1-L1 The integrity parity suite reports these same observables as `signature_status: pass` with explicit residuals and tolerances. fileciteturn59file0L1-L1

Why this matters: these GR baselines are used as **framework integrity checks** (“is the GR stack numerically sane against known observables?”) rather than as evidence toward feasibility claims. That scoping is explicit in the conceptual guide’s “benchmark/sanity” framing. fileciteturn54file0L1-L1

### Warp-family lineage as a bounded, non-canonical comparison overlay

The conceptual guide defines a “Core‑4” comparison set (Alcubierre 1994 `SRC-071`, Natário 2002 `SRC-072`, Van den Broeck 1999 `SRC-073`, Lentz 2021 `SRC-074`) and states that these are tracked as **external reference overlays**, not “adopted as truth.” fileciteturn54file0L1-L1 The guide’s explicit rule is that when assumptions are non-comparable, the framework marks them partial/inconclusive rather than forcing pass/fail. fileciteturn54file0L1-L1

Technically, the proof index points to the method-track proof paths used to implement those overlays (external work profiles config and warp geometry/energetics replay scripts, plus external-work run/compare/matrix scripts). fileciteturn55file0L1-L1 fileciteturn56file0L1-L1 The external work comparison matrix shows how this policy appears in practice: several “warp-family” works are partial or inconclusive with `non_comparable_or_unknown` reason codes tied to geometry checks or energetics/QEI assumptions, while Natário-geometry work appears as compatible in this overlay. fileciteturn61file0L1-L1

Why this matters: the overlay provides a disciplined way to say “our framework behaves similarly/differently under these assumptions,” while *preserving* the canonical decision boundary and refusing to collapse incompatible assumptions into a single narrative. fileciteturn56file0L1-L1 fileciteturn61file0L1-L1

## NHM2 framework

NHM2, as represented by the state-of-record artifacts, is a **reduced-order full-solve gate framework** coupled to a **governance regime** and **evidence lanes**. The proof anchor index declares it as the default citation map for NHM2 paper generation, centralizing commit-tracked paths for end-to-end traceability. fileciteturn55file0L1-L1

### Tier separation and governance posture

The proof index JSON records a posture of `reference_only: true` and `canonical_blocking: false` for the overall compilation, making explicit that overlays (e.g., external comparisons) do not override canonical decisions. fileciteturn56file0L1-L1 The authoring contract requires that claim tiers **must not be collapsed** into each other, and it defines three tiers: canonical-authoritative, promoted-candidate, and exploratory, with explicit “allowed/disallowed” boundaries (including disallowing physical-feasibility inference from non-canonical tiers). fileciteturn64file0L1-L1

### Gate adjudication as the reduced-order “full-solve” output

The canonical campaign execution report defines a gate scoreboard over gates G0..G8 and records the aggregate result and per-wave gate statuses (Wave A–D). fileciteturn57file0L1-L1 The same decision/count shape is present in the committed gate scoreboard JSON. fileciteturn22file0L1-L1

A key internal feature of the canonical report is **G4 diagnostics**, which explicitly name two hard constraints—FordRomanQI and ThetaAudit—as passing in each wave’s diagnostics, and then detail the diagnostic quantities (margin ratios, uncertainty fields, semantic bridge fields, sampling parameters, curvature applicability, and more). fileciteturn57file0L1-L1 This aligns with the repo’s guardrails file, which declares FordRomanQI and ThetaAudit as **HARD** constraints and provides their abstract forms (`int_T00_dt >= -K / tau^4` and `|thetaCal| <= theta_max`). fileciteturn65file0L1-L1

### Why QI/QEI appears in this framework

The conceptual guide states that warp concepts frequently imply unusual stress-energy requirements, motivating the use of quantum-inequality-style constraints as hard guardrails, and it lists the relevant literature lineage by internal IDs (Ford & Roman: `SRC-007`, `SRC-051`; Fewster & Eveson: `SRC-008`, `SRC-052`; curved/stationary caveats: `SRC-053`, `SRC-054`, `SRC-056`). fileciteturn54file0L1-L1 fileciteturn62file0L1-L1 The citation pack scopes these QI/QEI items as admissible for normative use in this governance setting. fileciteturn62file0L1-L1

At the implementation/governance level, the QEI worldline primer is explicitly referenced as a repo-governance standard (`SRC-057`) in the citation pack, indicating that the repo treats its own primer as an internal normative document for how QEI constraints are applied and checked in this campaign’s gates. fileciteturn62file0L1-L1

### Evidence lanes and promotion-readiness governance

The conceptual guide emphasizes a critical separation: **mathematical solve passes are not the same as measurement closure**, and the repo therefore partitions evidence into “lanes” (e.g., Casimir sign-control, Q-spoiling, nanogap metrology, timing/clocking, SEM+ellipsometry) and tracks congruence/unknown/blocked states with reason codes. fileciteturn54file0L1-L1 The proof index enumerates the evidence-lane contracts (compatibility contracts per lane) and additional lane-specific proof paths (including SEM+ellipsometry closure artifacts and scripts). fileciteturn55file0L1-L1 fileciteturn56file0L1-L1

Why this matters: NHM2’s central scientific contribution *in the state-of-record artifacts* is not a new physical claim; it is a **structured, falsifiable governance architecture** that keeps GR baselines, external overlays, hard-constraint gates, and experimental evidence separated and auditable. fileciteturn54file0L1-L1 fileciteturn64file0L1-L1

## Current status

This section reports what the **committed state-of-record artifacts** explicitly support, what is partial, and what is blocked—without inferring missing content and without making feasibility claims. fileciteturn56file0L1-L1 fileciteturn64file0L1-L1

### What is supported

The canonical campaign execution report supports the statement that, in the readiness lane (`--ci-fast-path`), the canonical reduced-order gate outcome is **REDUCED_ORDER_ADMISSIBLE** with the reconciled counts **PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1**. fileciteturn57file0L1-L1 The committed scoreboard JSON supports the same decision and count shape. fileciteturn22file0L1-L1 The committed first-fail map reports `globalFirstFail: none` and per-wave first fail “none” for the canonical lane snapshot. fileciteturn23file0L1-L1

The integrity parity suite supports that integrity parity is presently **PASS** with `blocker_count: 0`, and that its rubric items—including geometry baseline checks and the four GR observable parity checks—are satisfied. fileciteturn59file0L1-L1 The reference capsule supports that all geometry conformance checks listed in its table are `pass` and that the GR observable baseline statuses are `pass` with recorded numeric residuals and snapshot paths. fileciteturn58file0L1-L1

### What is partial

Promotion readiness is partial: the promotion readiness suite explicitly records **final_readiness_verdict: PARTIAL** and `readiness_gate_pass: false`. fileciteturn60file0L1-L1 It also supports that `q_spoiling` and `timing` are `reportable_ready: true` in the readiness view, meaning those lanes are treated as reportable-ready under this suite’s policy. fileciteturn60file0L1-L1

External comparisons are also “partial” in the specific technical sense used by the repo: the external work comparison matrix reports a mixture of compatible/partial/inconclusive results, with partialness dominated by explicit `non_comparable_or_unknown` reason codes. fileciteturn61file0L1-L1 The proof index posture supports that these remain overlays rather than canonical decision overrides. fileciteturn56file0L1-L1

### What is blocked and why

The promotion readiness suite is explicit that **SEM+ellipsometry is blocked** for reportable readiness, with blocked reasons `missing_covariance_uncertainty_anchor` and `missing_paired_dual_instrument_run`. fileciteturn60file0L1-L1 In the reference capsule, `sem_ellipsometry` reportable accounting shows large reportable-unknown counts (reported as-is) consistent with a lane that has not achieved reportable closure. fileciteturn58file0L1-L1

Separately, the reference capsule marks itself `blocked: true` and lists multiple **HARD** blockers of type `commit_pin_mismatch_*`, each stating that a source commit (notably `7e8cc…`) does not match the capsule commit pin (`e07f…`). fileciteturn58file0L1-L1 Under the repo’s fail-closed posture, this is a governance-level block on treating the capsule as fully aligned across its source chain without additional reconciliation. fileciteturn56file0L1-L1 fileciteturn64file0L1-L1

Why this matters: the current status is exactly what a fail-closed pipeline should expose—**clear progress signals** plus **explicit blockers**—so that readers can see where upgrades are prevented and why. fileciteturn54file0L1-L1 fileciteturn60file0L1-L1

## Reproducibility

This section reports reproducibility anchors present in committed artifacts: commit pins, checksums, deterministic regeneration commands, and explicit missing-artifact behavior. fileciteturn55file0L1-L1 fileciteturn64file0L1-L1

### Commit pin and repo snapshot notes

The repository HEAD commit for the documentation sync (as retrieved via the GitHub connector) is `a3e94a3d43ce8655b2f4c608ed078b5bf152240f`. fileciteturn53file0L1-L1

Within the state-of-record artifacts, multiple internal run commit pins are also explicitly embedded. For example, the integrity parity suite records `commit_pin: 7e8cc8952db5649e54d797a3786bd85e3fb0e96b`. fileciteturn59file0L1-L1 The promotion readiness suite also records that same commit pin. fileciteturn60file0L1-L1 The canonical campaign execution report’s G4 governance decomposition indicates a governance artifact commit and “current head commit” equal to `7e8cc…` for that specific canonical run context. fileciteturn57file0L1-L1

The reference capsule is dated 2026‑03‑19 and records `commit_pin: e07f027f3181b7884498c4262cb6bad92085acc6`, while simultaneously listing blockers that assert a mismatch against source commit `7e8cc…`. fileciteturn58file0L1-L1 Because the capsule itself appears internally inconsistent across its chain, it is explicitly marked `blocked: true` and must be treated as governance-blocked until reconciled under the repo’s policy. fileciteturn58file0L1-L1 fileciteturn64file0L1-L1

### Checksum-bearing artifacts

Checksums are first-class fields in multiple committed artifacts, including:
- Integrity parity suite checksum `80ebb4ad…7c534`. fileciteturn59file0L1-L1
- Promotion readiness suite checksum `d6915519…56629`. fileciteturn60file0L1-L1
- Reference capsule checksum `06ac0bf8…50d34`. fileciteturn58file0L1-L1

### Deterministic regeneration commands

The proof index defines deterministic regeneration commands—including `warp:proof-index:sync`, `warp:full-solve:reference:refresh`, `warp:external:refresh`, `warp:promotion:readiness:check`, and `warp:integrity:check`—as the canonical starting points for rebuilding state-of-record artifacts. fileciteturn55file0L1-L1 fileciteturn56file0L1-L1

```bash
npm run warp:proof-index:sync
npm run warp:full-solve:reference:refresh
npm run warp:external:refresh
npm run warp:promotion:readiness:check
npm run warp:integrity:check
```

### Missing artifact behavior

The proof index enforces a usage rule: `missing_artifact_behavior: UNKNOWN_and_fail_closed_for_claim_tier_promotion`. fileciteturn55file0L1-L1 fileciteturn56file0L1-L1 The authoring contract also requires that if a value is unavailable, it must be explicitly marked `UNKNOWN` and not substituted with narrative assumptions. fileciteturn64file0L1-L1

In addition, the proof index explicitly lists “default state-of-record anchors” that include **machine** and **human** artifact paths for each suite/capsule/matrix, which means the repo’s state-of-record model anticipates both views even when only the human markdown is available to a reader. fileciteturn55file0L1-L1 fileciteturn56file0L1-L1 Any claim that depends on the machine JSON contents, when those are not committed or not available in the reader’s snapshot, is therefore **UNKNOWN** by design under the stated policy. fileciteturn56file0L1-L1 fileciteturn64file0L1-L1

Why this matters: reproducibility is treated as a *gate*—issues like commit mismatches and missing machine artifacts are not merely documentation annoyances; they are explicit blockers that prevent tier promotion. fileciteturn58file0L1-L1 fileciteturn64file0L1-L1

## Claim discipline

This section distinguishes what may be said now from what may not be said now, using explicit repo policy artifacts and the non-feasibility boundary. fileciteturn64file0L1-L1 fileciteturn65file0L1-L1

### What can be said now

It is admissible to say that the repo defines and executes a **falsifiable reduced-order gate campaign** with tracked artifacts, a canonical authority chain, explicit count/decision outputs, and parity/readiness overlays, because that is exactly what the proof index and canonical report describe. fileciteturn55file0L1-L1 fileciteturn57file0L1-L1

It is admissible to report the canonical reduced-order outcome **REDUCED_ORDER_ADMISSIBLE** with its gate counts (PASS/FAIL/UNKNOWN/NOT_READY/NOT_APPLICABLE), because those fields are explicit in the canonical campaign execution report and machine scoreboard JSON. fileciteturn57file0L1-L1 fileciteturn22file0L1-L1

It is admissible to report that integrity parity tests currently pass (per the integrity parity suite) and that promotion readiness is partial (per the promotion readiness suite), including the specific blocked reasons for SEM+ellipsometry reportability. fileciteturn59file0L1-L1 fileciteturn60file0L1-L1

It is admissible to discuss external-literature lineage **as a referenced overlay** by using the repo’s SRC identifiers (e.g., Core‑4: `SRC-071..SRC-074`; GR tests: `SRC-075..SRC-084`; QI/QEI: `SRC-007`, `SRC-008`, `SRC-051..SRC-056`), because that mapping is explicitly provided in the conceptual guide and citation pack. fileciteturn54file0L1-L1 fileciteturn62file0L1-L1

### What cannot be said now

The repo does not authorize a physical feasibility claim in these artifacts. The boundary statement is explicit, and the authoring contract requires an explicit “non-goals” section that includes “no physical-feasibility claim unless strong-claim closure criteria are met,” and disallows canonical override from promoted/exploratory lanes. fileciteturn64file0L1-L1 fileciteturn55file0L1-L1

The repo guardrails further state that the system **MUST NOT** declare any configuration “physically viable” unless all HARD constraints pass **and** a viability oracle produces an `ADMISSIBLE` status. fileciteturn65file0L1-L1 Since the state-of-record manuscript posture is explicitly `reference_only=true` and G5 is policy-scoped as `NOT_APPLICABLE` in the canonical report, the current artifact set cannot be used to justify “physically viable” or “operational” language. fileciteturn56file0L1-L1 fileciteturn57file0L1-L1

Any claim that would require missing artifacts, missing numeric bounds, or missing lane closure evidence must be marked `UNKNOWN` and treated as non-promotable per the fail-closed rule. fileciteturn56file0L1-L1 fileciteturn64file0L1-L1 In particular, SEM+ellipsometry reportable closure is explicitly blocked; therefore, any manuscript statement depending on reportable SEM+ellipsometry evidence is not admissible for promotion. fileciteturn60file0L1-L1

Why this matters: claim discipline is the mechanism that keeps NHM2 “physics-literate but safe” by ensuring the narrative cannot outrun the committed evidence. fileciteturn64file0L1-L1 fileciteturn65file0L1-L1

## Next-steps closure plan with falsifiers

This plan is presented as **falsifiable closure steps** consistent with the authoring contract’s requirement to include deterministic falsifiers (operator mapping, sampling/normalization, applicability, uncertainty, reproducibility). fileciteturn64file0L1-L1 It is not a feasibility argument. fileciteturn55file0L1-L1

### Close the SEM+ellipsometry promotion-readiness blocker

The promotion readiness suite identifies SEM+ellipsometry as not reportable-ready with explicit blocked reasons: `missing_covariance_uncertainty_anchor` and `missing_paired_dual_instrument_run`. fileciteturn60file0L1-L1 The proof index provides SEM+ellipsometry-specific closure paths (paired-run artifact-set spec, evidence template JSON, calibration data path, and associated ingestion/validation/reporting scripts). fileciteturn55file0L1-L1 fileciteturn56file0L1-L1

Falsifier: **If** a refreshed promotion readiness suite continues to show `sem_ellipsometry.reportable_ready=false` **or** continues to list either blocked reason, **then** any claim that depends on reportable SEM+ellipsometry evidence remains `UNKNOWN` and cannot be promoted. fileciteturn60file0L1-L1 fileciteturn64file0L1-L1

### Resolve commit-pin mismatch blockers in the reference capsule

The reference capsule lists multiple HARD blockers asserting `commit_pin_mismatch_*` (sources at `7e8cc…` not matching capsule pin `e07f…`) and sets `blocked: true`. fileciteturn58file0L1-L1 The proof index lists deterministic regeneration commands including `warp:full-solve:reference:refresh` and integrity checks. fileciteturn56file0L1-L1

Falsifier: **If** a refreshed capsule still reports `blocked: true` with commit-mismatch blockers, **then** the capsule cannot be used as a promotable reproducibility anchor beyond what is already supported by canonical and parity artifacts. fileciteturn58file0L1-L1 fileciteturn64file0L1-L1

### Keep tier boundaries fail-closed under missing machine anchors

The proof index defines machine and human anchor paths for parity, capsule, readiness, and external comparison matrix. fileciteturn56file0L1-L1 The usage rules require claim-specific paths and impose `UNKNOWN_and_fail_closed_for_claim_tier_promotion` for missing artifacts. fileciteturn56file0L1-L1

Falsifier: **If** any claim upgrade depends on a machine anchor’s contents that are not available in the committed snapshot used for publication, **then** the upgrade fails by policy and must remain `UNKNOWN` or remain in a lower tier until the artifacts are commit-tracked in the relevant pinned snapshot. fileciteturn56file0L1-L1 fileciteturn64file0L1-L1

### Maintain hard-constraint guardrails and non-feasibility posture

The repo’s guardrails prohibit declaring “physically viable” absent HARD constraint passage and an admissible viability oracle status. fileciteturn65file0L1-L1 The authoring contract also mandates explicit non-goals including no feasibility claims unless closure criteria are met. fileciteturn64file0L1-L1

Falsifier: **If** any manuscript draft introduces feasibility/viability/operational claims without explicit authorization from canonical-authoritative artifacts meeting the guardrail conditions, **then** the draft violates policy and must be rejected or downgraded to `exploratory` with explicit non-feasibility disclaimers. fileciteturn65file0L1-L1 fileciteturn64file0L1-L1

Why this matters: closure plans with falsifiers transform “next steps” from aspirational project management into **scientific stop-conditions** that prevent self-confirming narratives and keep the effort replay-safe. fileciteturn64file0L1-L1
