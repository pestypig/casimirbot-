# Needle Hull Mark 2 Reduced-Order Full-Solve Gates and Evidence Governance Manuscript

## Executive abstract for scientists

This manuscript summarizes the **Needle Hull Mark 2** “state-of-record” artifacts as a **governance-and-evidence campaign** for reduced-order *gate adjudication*, not a statement of real‑world device feasibility. The boundary is explicit and must be preserved: **“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”** fileciteturn56file0L1-L1

Within the **canonical-authoritative** lane, the campaign execution report records the decision label **REDUCED_ORDER_ADMISSIBLE** and a gate scoreboard of **PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1** (9 total gates, reconciled). fileciteturn52file0L1-L1 This same decision and counts are echoed by the campaign scoreboard JSON (lane=`readiness`). fileciteturn85file0L1-L1

The **integrity parity** layer reports a **PASS** verdict (blocker_count=0) and asserts that canonical decision/count shape, geometry baseline checks, four GR-observable parity checks, and external-matrix taxonomy checks are all satisfied under the suite rubric. fileciteturn59file0L1-L1

The **promotion-readiness** layer is **not fully ready for promotion**: the Promotion Readiness Suite verdict is **PARTIAL** with `readiness_gate_pass=false`, and explicitly marks **sem_ellipsometry** as `reportable_ready=false` with blocked reasons **missing_covariance_uncertainty_anchor** and **missing_paired_dual_instrument_run**. fileciteturn60file0L1-L1 This is repeated in the state‑of‑record synthesis, which also lists the SEM+ellipsometry lane blocker as **HIGH severity**. fileciteturn62file0L1-L1

An **external comparison overlay** exists as a non-canonical reference: the external work comparison matrix summarises **14** works with **7 compatible, 5 partial, 2 inconclusive, 0 stale** (and reduced blocker taxonomy dominated by `non_comparable_or_unknown`). fileciteturn61file0L1-L1 These external comparisons are explicitly framed as overlays in the overall proof-index and governance materials rather than as canonical decision overrides. fileciteturn50file0L1-L1

No artifact set reviewed here authorizes a physical-feasibility claim; the repo’s guardrails additionally state that the system **must not** declare a configuration “physically viable” unless required hard constraints pass and the viability oracle produces an admissible status. fileciteturn83file0L1-L1

## Methods and governance pipeline

### Source-of-truth boundary and admissibility rules

This manuscript treats **only the committed Needle Hull Mark 2 state‑of‑record artifacts** as authoritative evidence and marks missing fields as **UNKNOWN** rather than inferring values (per the project’s “missing artifact behavior” rule). fileciteturn50file0L1-L1 The paper-authoring contract requires that claim tiers remain separated and forbids upgrading claims (including feasibility language) from non-canonical tiers. fileciteturn57file0L1-L1

### Claim tiers used in this manuscript

The evidence pack defines three claim tiers and treats them as non-collapsible: **canonical-authoritative**, **promoted-candidate**, and **exploratory**. fileciteturn55file0L1-L1 The authoring contract restates these tiers and explicitly disallows inferring physical feasibility from candidate-only evidence. fileciteturn57file0L1-L1

### Pipeline implemented by the state-of-record index

The proof anchor index is the top-level citation map and defines the canonical authority chain and “default state-of-record anchors.” fileciteturn49file0L1-L1 The canonical authority chain is:

- campaign execution report  
- G4 decision ledger  
- G4 governance matrix  
- evidence pack  
- evidence snapshot fileciteturn50file0L1-L1

A deterministic “canonical → parity → readiness → external comparison” governance pipeline is reflected across the index and the downstream suite artifacts:

Canonical adjudication (decision + counts + per-wave gating) is recorded in the campaign execution report and companion campaign gate JSON artifacts. fileciteturn52file0L1-L1 fileciteturn85file0L1-L1 The **G4 decision ledger** and **G4 governance matrix** provide canonical G4 decomposition and governance classification metadata (including mismatch flags and per-wave rows). fileciteturn53file0L1-L1 fileciteturn54file0L1-L1

Parity assurance (geometry + GR observable parity + external overlay consistency + certification presence) is summarized by the **Integrity Parity Suite**. fileciteturn59file0L1-L1

Promotion readiness (reportable readiness by evidence lane) is summarized by the **Promotion Readiness Suite**, with lane-level congruent/incongruent/unknown accounting and explicit blocked reasons when reportable status cannot be earned. fileciteturn60file0L1-L1

External comparison (method-track overlays to external “work profiles”) is summarized by the **External Work Comparison Matrix**, with stable reason taxonomies. fileciteturn61file0L1-L1

### Conflict handling rule

Where artifacts disagree, the deep-research prompt embedded in the repo defines a precedence order that places the canonical execution report and governance artifacts above summaries/translations. fileciteturn58file0L1-L1 This matters because the “Warp Gates Executive Translation” conflicts with the canonical execution report and the machine scoreboard JSON (see Results and Claim-status matrix). fileciteturn84file0L1-L1 fileciteturn85file0L1-L1

## Results

### Canonical gate outcome

The canonical campaign execution report records:

- Executive verdict: **REDUCED_ORDER_ADMISSIBLE**  
- Gate scoreboard totals: **PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1**  
- Cross-wave aggregate includes **G4: PASS** and **G5: NOT_APPLICABLE** (policy-scoped) fileciteturn52file0L1-L1

The machine scoreboard artifact matches this decision and counts and explicitly identifies lane=`readiness` and `reconciled=true`. fileciteturn85file0L1-L1 The first-fail map records `globalFirstFail="none"` and per-wave first fail “none.” fileciteturn86file0L1-L1

The G4 decision ledger also reports canonical decision **REDUCED_ORDER_ADMISSIBLE** with the same PASS/FAIL/UNKNOWN/NOT_READY/NOT_APPLICABLE counts; it additionally flags `classificationMismatch=true` and states the mismatch reason as a canonical override retaining the canonical class as authoritative. fileciteturn53file0L1-L1

### Geometry conformance

Geometry baseline checks are reported as all pass (5/5) in both the Integrity Parity Suite and the Reference Capsule, with test file anchors:

- metric_form_alignment — pass  
- shift_mapping — pass  
- york_time_sign_parity — pass  
- natario_control_behavior — pass  
- metric_derived_t00_path — pass fileciteturn59file0L1-L1 fileciteturn51file0L1-L1

The state-of-record synthesis likewise reports `geometry_all_pass=true (5/5)` and enumerates the four GR parity statuses as pass. fileciteturn62file0L1-L1

### GR observable parity

The Integrity Parity Suite reports **compatible/pass** parity for four GR observables with explicit residuals and tolerances:

- Mercury perihelion: residual `-0.0193 arcsec/century` vs tolerance `1`  
- Lensing deflection: historical residual `-0.2304 arcsec` vs tolerance `0.5`; gamma residual `-0.0002` vs tolerance `0.001`  
- Frame dragging: GP‑B residual `-2 mas/year` vs tolerance `14.4`; LAGEOS residual ratio `-0.01` vs tolerance `0.2`  
- Shapiro delay: gamma residual `0.000021` vs tolerance `0.00007` fileciteturn59file0L1-L1

The Reference Capsule includes the same four “baseline” statuses as `pass` and provides predicted/observed/residual numerical values and the snapshot paths used for those baselines. fileciteturn51file0L1-L1

### Evidence-lane congruence summaries

Evidence-lane congruence is summarized at two levels: (i) typed vs reportable count accounting (capsule), and (ii) promotion readiness status (readiness suite).

The Reference Capsule reports typed/reportable triplets (congruent / incongruent / unknown) per lane:

- casimir_sign_control: typed `6 / 9 / 3`; reportable `6 / 9 / 3`  
- q_spoiling: typed `5 / 24 / 25`; reportable `5 / 24 / 25`  
- nanogap: typed `5 / 5 / 0`; reportable `5 / 5 / 0`  
- timing: typed `9 / 2 / 1`; reportable `9 / 2 / 1`  
- sem_ellipsometry: typed `0 / 0 / 2`; reportable `0 / 0 / 18`  
- qcd_analog: typed `0 / 0 / 0`; reportable `0 / 0 / 0` fileciteturn51file0L1-L1

Promotion readiness is explicitly **PARTIAL** and describes which lanes are reportable-ready:

- q_spoiling: `reportable_ready=true`  
- timing: `reportable_ready=true`  
- sem_ellipsometry: `reportable_ready=false` with blocking reasons `missing_covariance_uncertainty_anchor` and `missing_paired_dual_instrument_run` fileciteturn60file0L1-L1

The state-of-record synthesis repeats this status and lists two blockers, including a **HIGH severity** readiness blocker for SEM+ellipsometry reportability. fileciteturn62file0L1-L1

## Claim-status matrix

Status legend: **supported** = explicitly stated in admissible artifacts; **partial** = supported but bounded by an explicit blocker or tier restriction; **blocked** = artifact claims exist but required evidence is missing/unavailable for the relevant tier advancement; **unknown** = required field/path not present in committed artifacts.

| Claim | Tier | Status | Artifact-path citation(s) | Notes / constraints |
|---|---|---|---|---|
| Boundary statement is a non-feasibility claim and must be verbatim | canonical-authoritative (governance) | supported | `docs/audits/research/warp-evidence-snapshot-2026-03-02.md` fileciteturn56file0L1-L1 | Manuscript must not claim physical feasibility. |
| Canonical decision label is REDUCED_ORDER_ADMISSIBLE | canonical-authoritative | supported | `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md` fileciteturn52file0L1-L1 | Decision is explicitly “reduced-order” and bounded by the boundary statement. |
| Canonical gate counts: PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1 | canonical-authoritative | supported | `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md` fileciteturn52file0L1-L1; `artifacts/research/full-solve/campaign-gate-scoreboard-2026-02-24.json` fileciteturn85file0L1-L1 | Canonical scoreboard is reconciled and lane=`readiness`. |
| First fail is “none” (global and per-wave) | canonical-authoritative | supported | `artifacts/research/full-solve/campaign-first-fail-map-2026-02-24.json` fileciteturn86file0L1-L1 | Confirms no gate is the earliest blocker in this lane snapshot. |
| G4 governance matrix shows no mismatch across waves | canonical-authoritative | supported | `artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json` fileciteturn54file0L1-L1 | Governance matrix `mismatch=false`. |
| Canonical G4 decision ledger indicates `classificationMismatch=true` but canonical class is authoritative | canonical-authoritative | supported | `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json` fileciteturn53file0L1-L1 | Treated as “diagnostic metadata,” not a decision override. |
| Geometry baseline conformance checks (5/5) pass | integrity parity (validation) | supported | `docs/audits/research/warp-integrity-parity-suite-latest.md` fileciteturn59file0L1-L1 | Also echoed in capsule. fileciteturn51file0L1-L1 |
| GR observable parity (Mercury, Lensing, Frame Dragging, Shapiro) passes within tolerances | integrity parity (validation) | supported | `docs/audits/research/warp-integrity-parity-suite-latest.md` fileciteturn59file0L1-L1 | Reported as `signature_status=pass` with residuals/tolerances. |
| Integrity parity final verdict is PASS | parity | supported | `docs/audits/research/warp-integrity-parity-suite-latest.md` fileciteturn59file0L1-L1 | Machine parity JSON anchor is referenced but not present in committed artifacts (see Repro appendix). fileciteturn50file0L1-L1 |
| Promotion readiness verdict is PARTIAL; readiness_gate_pass=false | promotion-readiness | supported | `docs/audits/research/warp-promotion-readiness-suite-latest.md` fileciteturn60file0L1-L1 | Blocks reportable claim upgrades for some lanes. |
| SEM+ellipsometry reportable readiness is blocked with explicit reasons | promotion-readiness | supported | `docs/audits/research/warp-promotion-readiness-suite-latest.md` fileciteturn60file0L1-L1 | Blocked reasons are explicit; no inference needed. |
| External comparison summary total=14, compatible=7, partial=5, inconclusive=2, stale_count=0 | exploratory overlay (noncanonical) | supported | `docs/audits/research/warp-external-work-comparison-matrix-latest.md` fileciteturn61file0L1-L1 | Treated as overlay only (does not override canonical). fileciteturn55file0L1-L1 |
| Evidence-lane typed vs reportable counts for all lanes | reporting / capsule | supported | `docs/audits/research/warp-full-solve-reference-capsule-latest.md` fileciteturn51file0L1-L1 | SEM+ellipsometry has larger reportable unknown count than typed count; reported as-is. |
| “Warp Gates Executive Translation” decision is NOT_READY with NOT_READY=8 | promotional translation | partial | `docs/audits/research/warp-gates-executive-translation-2026-02-24.md` fileciteturn84file0L1-L1 | Conflicts with canonical execution report + scoreboard. Canonical precedence rule applies. fileciteturn52file0L1-L1 fileciteturn85file0L1-L1 |
| “Physically viable” declaration is prohibited without admissible oracle + hard constraints | governance / guardrail | supported | `WARP_AGENTS.md` fileciteturn83file0L1-L1 | Reinforces non-feasibility posture. |

## Reproducibility appendix

### Commit pin

Repo-level proof anchor and citation map is explicitly commit-addressable here: the proof anchor index artifacts used in this manuscript are fetched from commit `e07f027f3181b7884498c4262cb6bad92085acc6` (as shown in their `display_url`). fileciteturn49file0L1-L1 fileciteturn50file0L1-L1

Multiple artifacts also embed **internal run commit pins** as explicit fields; the dominant one across parity/readiness/capsule is `7e8cc8952db5649e54d797a3786bd85e3fb0e96b`. fileciteturn51file0L1-L1 fileciteturn59file0L1-L1 fileciteturn60file0L1-L1 fileciteturn62file0L1-L1

### Checksums explicitly recorded in committed artifacts

The following checksums are present as first-class fields:

- Integrity parity suite checksum: `80ebb4ad519e3a67bea8d8c828f1f2fb9f59a5189618abfc171a8a232ed7c534` fileciteturn59file0L1-L1  
- Promotion readiness suite checksum: `d69155191447fcd2a64ab17cc2b3116e625f7262eec1a88c2923f744c3756629` fileciteturn60file0L1-L1  
- Full-solve reference capsule checksum: `d1181f7ed42239abc3ba2c163e45a58988941436d9f5cca0896c4d3345f76414` fileciteturn51file0L1-L1  
- State-of-record synthesis checksum: `5a8ab14cb974213eaae784208b5c60530c8ed55f6f92f80a7ad5083c4eef8c46` fileciteturn62file0L1-L1  

### missing_count and missing file list

Definition used here: **missing** = a path is referenced as required/anchor in the proof index, theory directory, or frozen evidence snapshot but is not readable as a committed file at the manuscript’s repo snapshot for this write‑up.

`missing_count = 13`

Missing paths (all referenced in state-of-record artifacts):

- `artifacts/research/full-solve/state-of-record-synthesis-latest.json` (theory directory “required/present” but not committed/readable) fileciteturn63file0L1-L1  
- `artifacts/research/full-solve/integrity-parity-suite-latest.json` (proof index “default anchor (machine)”) fileciteturn50file0L1-L1  
- `artifacts/research/full-solve/full-solve-reference-capsule-latest.json` (proof index “default anchor (machine)”; also referenced by state-of-record synthesis anchors) fileciteturn50file0L1-L1 fileciteturn62file0L1-L1  
- `artifacts/research/full-solve/promotion-readiness-suite-latest.json` (proof index “default anchor (machine)”; also referenced by state-of-record synthesis) fileciteturn50file0L1-L1 fileciteturn62file0L1-L1  
- `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json` (proof index “default anchor (machine)”; also referenced by state-of-record synthesis anchors) fileciteturn50file0L1-L1 fileciteturn62file0L1-L1  
- `artifacts/research/full-solve/external-work/external-work-comparison-matrix-2026-03-18.json` (explicit `matrix_path` in the capsule) fileciteturn51file0L1-L1  
- `artifacts/research/full-solve/se-publication-overlay-latest.json` (proof index SEM+ellipsometry closure path; also referenced by state-of-record synthesis) fileciteturn50file0L1-L1 fileciteturn62file0L1-L1  
- `artifacts/research/full-solve/warp-evidence-snapshot-2026-03-02.json` (evidence snapshot “Machine snapshot JSON (local artifact)”) fileciteturn56file0L1-L1  
- `artifacts/research/full-solve/g4-calculator-2026-03-01.json` (evidence snapshot “required artifacts included”) fileciteturn56file0L1-L1  
- `artifacts/research/full-solve/g4-candidate-promotion-check-2026-03-01.json` (evidence snapshot “required artifacts included”) fileciteturn56file0L1-L1  
- `artifacts/research/full-solve/g4-promotion-bundle-2026-03-01.json` (evidence snapshot “required artifacts included”) fileciteturn56file0L1-L1  
- `artifacts/training-trace.jsonl` (required by frozen snapshot; referenced for certification fields) fileciteturn56file0L1-L1  
- `artifacts/training-trace-export.jsonl` (required by frozen snapshot) fileciteturn56file0L1-L1  

Important discrepancy to report explicitly: the Needle Hull Mark 2 theory directory marks numerous `/artifacts/...latest.json` machine anchors as “required/present” and reports `required_missing: 0/22`. fileciteturn63file0L1-L1 Nevertheless, the repository’s own deep-research prompt warns that runtime files under `/artifacts/` may be uncommitted overlays and must not be hard-required unless committed at the pin. fileciteturn58file0L1-L1 This manuscript therefore treats these machine JSON anchors as **missing committed artifacts** and fails closed (UNKNOWN) on any claim that would require their contents beyond what is already present in the committed audit markdown.

## What must be closed next

This section is written as a **closure plan with falsifiers**, not as an argument for feasibility.

### Close promotion readiness blockers

The highest-severity readiness blocker is that **sem_ellipsometry is not reportable-ready**, and the blocker reasons are explicit: **missing_covariance_uncertainty_anchor** and **missing_paired_dual_instrument_run**. fileciteturn60file0L1-L1  
Concrete falsifier: until the Promotion Readiness Suite reports `sem_ellipsometry.reportable_ready=true` **and** removes those blocked reasons, any manuscript claim that depends on “reportable SEM+ellipsometry evidence” must remain **UNKNOWN** and must not be promoted. fileciteturn57file0L1-L1

### Resolve state-of-record staleness flag

The state-of-record synthesis sets `stale_against_head=true` and includes a blocker stating the artifact `commit_pin` differs from the current `HEAD`. fileciteturn62file0L1-L1  
Concrete falsifier: any attempt to treat the synthesis as “current head” is invalidated unless `stale_against_head=false` in a refreshed synthesis artifact, or the manuscript explicitly declares itself **pinned** and does not claim head freshness. fileciteturn58file0L1-L1

### Make machine anchors commit-tracked or formally downgrade them to optional overlays

Multiple artifacts define machine JSON anchors (parity suite, capsule, readiness suite, external matrix, evidence snapshot JSON) as default proof paths. fileciteturn50file0L1-L1 fileciteturn56file0L1-L1 These anchors are missing as committed files (see missing list).  
Concrete falsifier: any claim tier promotion that requires machine-readable provenance must fail closed unless these machine artifacts become committed and readable at the pin (or the proof index is revised to declare them non-required). The proof index explicitly defines `missing_artifact_behavior` as **UNKNOWN_and_fail_closed_for_claim_tier_promotion**. fileciteturn50file0L1-L1

### Repair internal translation conflicts

The “Warp Gates Executive Translation” currently states `Decision: NOT_READY` and `NOT_READY=8`, conflicting with canonical report and the scoreboard JSON which report `REDUCED_ORDER_ADMISSIBLE` with PASS=8 and NOT_READY=0. fileciteturn84file0L1-L1 fileciteturn85file0L1-L1  
Concrete falsifier: any public-facing summary that repeats NOT_READY for this lane is falsified by the canonical scoreboard and should be treated as non-authoritative until regenerated or corrected under the documented precedence rule. fileciteturn58file0L1-L1

### Maintain the non-feasibility boundary and “no physical viability” guardrail

The repo’s guardrails state the system must not declare any configuration “physically viable” absent hard constraint passage and an admissible viability oracle output. fileciteturn83file0L1-L1  
Concrete falsifier: any manuscript phrasing implying feasibility, viability, or operational realizability is non-compliant unless (a) it is explicitly confined to an allowed tier and (b) the governing artifacts explicitly authorize it—otherwise it must be treated as a tier violation and rejected by the authoring contract’s non-goals. fileciteturn57file0L1-L1
