# Commit-Pinned Synthesis & Reproducibility Audit of the “Needle Hull Mark 2” Warp-Solve Framework

## Audit scope, boundary, and commit pins

**Repository boundary (non‑negotiable):** This audit treats the Needle Hull Mark 2 (“NHM2”) work as a *reduced‑order, falsifiable gate-and-evidence campaign* with reproducibility requirements, **not** as a claim of physical warp feasibility. This boundary statement is explicitly embedded across the campaign artifacts and specs. fileciteturn48file0L1-L4 fileciteturn30file0L1-L6 fileciteturn43file0L1-L8 fileciteturn40file0L1-L8

**Audit pin (repository snapshot used to extract evidence in this report):** All repo artifacts cited below were fetched from GitHub at commit **`e07f027f3181b7884498c4262cb6bad92085acc6`** (as shown in each artifact’s `display_url` from the connector). Example: the “latest” Full‑Solve Reference Capsule MD is stored at that repo commit while internally citing its own run commit pin. fileciteturn30file0L1-L11

**Evidence pin (run provenance inside the repo’s own state-of-record):** Several “latest” governance artifacts embed an internal `commit_pin` that represents the code+configs baseline for the run they summarize (e.g., `commit_pin: 7e8cc8…` in the 2026‑03‑18 state-of-record and parity/readiness artifacts). This creates a two-level pin: (a) repo snapshot you and I can read now, and (b) run commit pin required to reproduce the exact run. The repo itself flags this as **stale vs head** in the state-of-record synthesis. fileciteturn35file0L4-L12 fileciteturn35file0L61-L64

**Key governance directory structure and entry DAG:** NHM2 is organized as a theory directory (human+machine entrypoints) and a “theory tree” DAG that points to canonical authority artifacts, parity/readiness artifacts, external comparison, and equation/parameter provenance. fileciteturn49file0L1-L27 fileciteturn52file0L1-L24

**Critical reproducibility finding (blocked-from-GitHub-alone):** The NHM2 theory directory marks many `artifacts/research/full-solve/*.json` paths as `exists: true` (required/present) **even when those artifacts are not retrievable from the GitHub commit we can access**, indicating those “exists” checks were performed on a local workspace rather than on committed repository contents. This matters because the campaign scripts and reports frequently cite those artifact paths as primary machine targets. Evidence: (i) the theory-directory JSON flags `artifacts/research/full-solve/state-of-record-synthesis-latest.json` as `exists: true`, yet (ii) a direct repository fetch returns “Not Found”. fileciteturn51file0L29-L45 fileciteturn50file0L1-L1

## Executive synthesis

### What is proven internally

**C-01 (supported, canonical-authoritative): The campaign is explicitly scoped as falsifiable reduced-order gates + reproducible evidence requirements, not a physical warp feasibility claim.** This boundary statement is repeated in the canonical campaign execution report, the reference capsule, the integrity parity suite, and multiple lane reports/specs, making it the top-level guardrail for interpretation. fileciteturn48file0L1-L4 fileciteturn30file0L1-L6 fileciteturn43file0L1-L8 fileciteturn68file0L1-L10

**C-02 (supported, canonical-authoritative): The canonical “Warp Full‑Solve Campaign Execution Report (2026‑02‑24)” declares the executive verdict `REDUCED_ORDER_ADMISSIBLE` with a gate scoreboard of PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1 across 9 gates (G0..G8).** fileciteturn48file0L1-L33

**C-03 (supported, canonical-authoritative): The canonical report includes a structured per-wave gate status snapshot and explicitly records G4 diagnostics and a large “G4 reasons” payload without missing-signal classes (timeout_budget=0, missing_required_signals=0, etc.).** This is important because it indicates the run is asserting evaluability of the gates under the “readiness lane” and not deferring due to missing required signals. fileciteturn48file0L10-L29

**C-04 (supported, canonical-authoritative within this repo): The integrity parity suite (2026‑03‑18) reports `final_parity_verdict: PASS` with `blocker_count: 0` and a rubric indicating all listed parity checks are `true` (canonical decision, geometry baseline checks, GR observable parity, external staleness and taxonomy, capsule validation, and “casimir_verify”).** fileciteturn43file0L1-L23

**C-05 (supported, canonical-authoritative within this repo): The “Full‑Solve Reference Capsule (latest)” (2026‑03‑18) reports a canonical state decision `REDUCED_ORDER_ADMISSIBLE`, counts PASS=8/FAIL=0/UNKNOWN=0/NOT_READY=0/NOT_APPLICABLE=1, and `strong_claim_pass_all: true`.** The same capsule also reports `integrity_ok: true` and a “GREEN” certification status. fileciteturn30file0L8-L23

**C-06 (supported, canonical-authoritative within this repo): Geometry conformance is represented as five checks (`metric_form_alignment`, `shift_mapping`, `york_time_sign_parity`, `natario_control_behavior`, `metric_derived_t00_path`) each marked `pass` and bound to explicit test filenames.** This is explicitly surfaced in the reference capsule and echoed as “geometry_all_pass: true (5/5)” at state-of-record level. fileciteturn30file0L25-L35 fileciteturn35file0L20-L25

**C-07 (supported, canonical-authoritative within this repo): GR observable parity “baseline” is included as a non-blocking sanity layer with explicit predicted/residual values and tolerances for Mercury perihelion, solar limb deflection, frame dragging, and Shapiro delay—each marked `pass` in the capsule and included in integrity parity.** fileciteturn30file0L49-L65 fileciteturn43file0L43-L76

**C-08 (supported, canonical-authoritative): The repository maintains an equation-trace and parameter-registry discipline: the equation trace spec defines required trace fields and encodes per-source recompute readiness as `pass | partial | blocked`, with explicit blocker reasons.** fileciteturn27file0L1-L19

**C-09 (partial, canonical-authoritative): The repo’s “Needle Hull Mark 2 theory directory” and “theory tree” encode a governance map and regeneration command chain, but they assert that several machine artifacts exist at `artifacts/research/full-solve/*` locations that are not present in the GitHub snapshot accessible here.** Therefore, “directory READY / required_missing 0” is **not** fully reproducible from the GitHub commit alone. fileciteturn49file0L31-L59 fileciteturn51file0L29-L45 fileciteturn50file0L1-L1

### What is externally congruent

**C-10 (supported, canonical-authoritative): The external work comparison matrix (2026‑03‑18) summarizes 14 comparison items with outcomes: compatible=7, partial=5, inconclusive=2, stale_count=0; and it reports that the dominant reduced reason code aggregate is `non_comparable_or_unknown=24`.** fileciteturn39file0L1-L21

**C-11 (supported, canonical-authoritative): The same matrix indicates that “GR observable” external comparisons are `compatible` (e.g., EXT‑GR-FD-001, EXT‑GR-LENS‑001, EXT‑GR‑MERC‑001, EXT‑GR‑SHAP‑001), and timing EXT‑TI‑001 is also marked compatible.** fileciteturn39file0L13-L20

**C-12 (supported, canonical-authoritative with explicit non-comparability): For “Core‑4 warp-family” external works, multiple items are explicitly **partial** or **inconclusive** due to declared `non_comparable_or_unknown` reasons rather than fails.** For example, EXT‑WARP‑LEN‑001 and EXT‑WARP‑VDB‑001 are *inconclusive* with multiple non-comparable/unknown reason codes across geometry checks; EXT‑WARP‑ALC‑E001 and EXT‑WARP‑NAT‑E001 are *partial* with non-comparable/unknown reason codes for energetics/QEI-related keys. fileciteturn39file0L17-L21

**Strict/reportable source policy alignment (supported, canonical-authoritative):** The repo includes a “Primary/Standards Citation Pack” that labels sources as `primary | standard | preprint | secondary` and sets the normative policy: normative claims require at least one `primary` or `standard` source; preprints are only exploratory; secondary cannot be sole support. This is a crucial governance bridge between internal claims and external literature. fileciteturn72file0L1-L16

### What remains blocked and why

**C-13 (supported, promoted-candidate but incomplete at system level): Promotion readiness is `PARTIAL` because the promotion readiness suite reports `readiness_gate_pass: false` with one blocked lane (`sem_ellipsometry`) and two reportable-ready lanes (`q_spoiling`, `timing`).** fileciteturn40file0L1-L18

**C-14 (supported, promoted-candidate lane-level): The promotion readiness suite explicitly identifies the `sem_ellipsometry` blockers as `missing_covariance_uncertainty_anchor` and `missing_paired_dual_instrument_run`.** fileciteturn40file0L13-L18

**C-15 (supported, canonical-authoritative spec): The SEM+Ellipsometry lane contract v1 defines **fail-closed** reportable policy: by default `reportableReady=false` and specific blocked reasons must be present until paired-run evidence, covariance uncertainty anchors, and instrument-export provenance are available (and templates are not accepted as real evidence).** This is the principal documented reason that lane stalls promotion readiness. fileciteturn68file0L42-L66 fileciteturn68file0L67-L86

**C-16 (partial, canonical-authoritative reproducibility risk): The repository’s state-of-record synthesis itself declares that the artifact `commit_pin` (7e8cc8…) differs from the current head commit (35eb6b…), flagging staleness.** This does not invalidate the run, but it blocks a “single-pin” reproducibility story unless downstream defects are resolved: either publish the machine artifacts in-repo for that commit pin, or provide a deterministic external artifact store with immutable addressing. fileciteturn35file0L4-L12 fileciteturn35file0L61-L64

## Claim-to-evidence matrix

All claims below are **explicitly tiered** and include: status, repo evidence, source refs (primary/standard preferred; preprints only in exploratory overlay), falsifier conditions, blockers, and next actions.

| claim_id | claim_text | tier | status | equations | repo_refs | source_refs | uncertainty_basis | falsifier | blocker_code | next_action |
|---|---|---|---|---|---|---|---|---|---|---|
| C-01 | The campaign boundary is “falsifiable reduced-order gates + reproducible evidence requirements; not a physical warp feasibility claim.” | canonical-authoritative | supported | n/a | `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`; `docs/audits/research/warp-full-solve-reference-capsule-latest.md`; `docs/audits/research/warp-integrity-parity-suite-latest.md` | n/a (governance boundary; literature not required) | Low (directly quoted in multiple canonical artifacts) | Any canonical-first artifact in the pinned repo removes/contradicts this boundary statement | none | Require boundary string check in CI (fail build if absent/edited) |
| C-02 | Canonical campaign execution report verdict is `REDUCED_ORDER_ADMISSIBLE`. | canonical-authoritative | supported | n/a | `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md` | Governance: citation policy exists (SRC-001..006) but verdict is internal; no external physics claim implied | Low (verbatim in report) | The cited report at the commit pin shows a different verdict or is missing | none | Publish the corresponding decision-ledger JSON referenced by downstream artifacts (see C-17) |
| C-03 | Canonical gate scoreboard is PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1 across 9 gates G0..G8. | canonical-authoritative | supported | n/a | `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md` | n/a | Low (explicit numeric table) | Recomputed scoreboard (from machine artifact or rerun) disagrees | BLK-ART-JSON-MISSING (machine artifact not committed) | Commit the gate-results JSON outputs (or provide immutable artifact store + hash) |
| C-04 | Integrity parity suite final verdict is PASS (`blocker_count=0`). | canonical-authoritative | supported | n/a | `docs/audits/research/warp-integrity-parity-suite-latest.md` (and dated 2026-03-18) | Policy framework sources: ASME/NASA/GUM are present in citation pack (SRC-001..006) but verdict is internal | Medium: suite references machine artifacts and commands not all committed | A rerun at the suite `commit_pin` yields FAIL or blockers >0 | BLK-ART-JSON-MISSING (suite references JSON artifacts paths) | Commit the referenced JSON artifacts or provide reproducible retrieval instructions from `commit_pin` |
| C-05 | Full-solve reference capsule (2026-03-18) reports canonical decision `REDUCED_ORDER_ADMISSIBLE` and `strong_claim_pass_all=true`. | canonical-authoritative | supported | n/a | `docs/audits/research/warp-full-solve-reference-capsule-latest.md`; dated `warp-full-solve-reference-capsule-2026-03-18.md` | n/a | Medium: capsule points to machine paths not committed; but MD is explicit | Capsule MD differs, or regeneration at capsule commit pin yields `strong_claim_pass_all=false` | BLK-ART-JSON-MISSING | Commit `full-solve-reference-capsule-latest.json` or include artifact hash + retrieval method |
| C-06 | Geometry conformance checks (5 keys) are `pass` and tied to explicit test files (metric alignment, shift mapping, York time sign parity, Natário control behavior, derived T00 path). | canonical-authoritative | supported | (geometry chain references: EQT-071-01..EQT-074-01 are external comparators; internal test keys are check IDs) | `docs/audits/research/warp-full-solve-reference-capsule-latest.md` | For external geometry comparators: Alcubierre/Natário/VdB/Lentz are in citation pack (SRC-071..074, primary) | Medium: we did not replay the tests here; we rely on capsule assertion | If running the referenced tests at the capsule `commit_pin` fails any check | BLK-REPLAY-NOT-RUN (auditor did not execute code) | Add CI artifact: publish test log + junit + hashes for geometry suite |
| C-07 | GR observable parity baseline is `pass` for Mercury perihelion, lensing deflection, frame dragging, and Shapiro delay with stated numeric residuals and tolerances. | canonical-authoritative | supported | `EQT-075-01`, `EQT-077-01`, `EQT-080-01`, `EQT-083-01` | `docs/audits/research/warp-full-solve-reference-capsule-latest.md`; `docs/audits/research/warp-integrity-parity-suite-latest.md`; equation trace file | Primary sources for GR observables are in citation pack: Einstein/Will/Eddington/Dyson/Shapiro/Bertotti et al./Ciufolini/Everitt (SRC-075..084, primary) | Medium: observed uncertainty extraction is noted as unresolved in equation trace for Mercury | If recompute from snapshot constants yields mismatched values outside tolerance OR strict-source observed uncertainties change | BLK-GR-UNCERTAINTY-SOURCE (Mercury observed uncertainty sometimes UNKNOWN in trace) | Attach strict-source uncertainty values and cite them per `SRC-076` or equivalent primary source |
| C-08 | External work comparison matrix (2026-03-18) summary: total=14, compatible=7, partial=5, inconclusive=2, stale_count=0; reduced_reason_counts non_comparable_or_unknown=24. | canonical-authoritative | supported | n/a | `docs/audits/research/warp-external-work-comparison-matrix-latest.md` (and dated) | Source policy scaffold: citation pack scope rules (SRC policy table) | Low (explicit summary table) | Matrix report changes or rerun yields different tallies due to changed profiles/thresholds | BLK-ART-JSON-MISSING (matrix JSON referenced but not committed) | Commit matrix JSON or provide immutable hash+store |
| C-09 | Warp-family external comparisons are *not forced* into pass/fail: Lentz and Van den Broeck are “inconclusive” for geometry-first comparisons due to `non_comparable_or_unknown` keys. | canonical-authoritative | supported | `EQT-074-01`, `EQT-073-01` (comparability-limit anchors) | `docs/audits/research/warp-external-work-comparison-matrix-latest.md`; equation trace | Primary sources: VdB/Lentz (SRC-073, SRC-074, primary) | Low (explicit reason codes) | If matrix reports those works as compatible without additional comparability disclosures | none | Keep explicit “non-comparable” policy in the comparison contract and require reason codes in outputs |
| C-10 | Promotion readiness suite verdict is PARTIAL and readiness gate does not pass (`readiness_gate_pass=false`). | promoted-candidate | supported | n/a | `docs/audits/research/warp-promotion-readiness-suite-latest.md` and dated `...-2026-03-18.md` | Governance-only (no external physical claim) | Low | If promotion readiness suite report indicates PASS | none | Define promotion gate criterion in contract as a CI check and publish machine artifact JSON |
| C-11 | `q_spoiling` lane is reportable-ready per promotion readiness suite and has congruent=5, incongruent=24, unknown=25. | promoted-candidate | supported | `EQT-023-01` (F_Q_spoil), `EQT-062-01` (TLS overlay), others in CH-Q-001 | `docs/audits/research/warp-promotion-readiness-suite-latest.md`; `docs/audits/research/warp-qs-compat-check-readiness-2026-03-18.md`; equation trace | Primary sources for Q-spoiling mechanisms are explicitly listed in citation pack: Romanenko PRL 2017 (SRC-021), Romanenko PRSTAB 2014 (SRC-022), Grassellino 2013 (SRC-023) | Medium: many scenarios end as incongruent/unknown; “reportable-ready” is about evidence governance, not “success” | If `warp-qs-compat-check-readiness` rerun changes congruent/incongruent/unknown counts without code/profile changes | BLK-ART-JSON-MISSING (run_artifact JSON not committed) | Commit the `shadow-injection-run-qs-*` JSON and include deterministic replay hashes |
| C-12 | `timing` lane is reportable-ready per promotion readiness suite; timing compatibility check shows scenario_count=12 with congruent=9, incongruent=2, unknown=1. | promoted-candidate | supported | `EQT-032-01` (Allan/MTIE), timing chain CH-T-001 | `docs/audits/research/warp-promotion-readiness-suite-latest.md`; `docs/audits/research/warp-ti-compat-check-readiness-2026-03-18.md`; equation trace | Primary/standard timing sources in citation pack: IEEE 1588 (SRC-029, standard), Serrano ISPCS 2009 (SRC-030), Lipinski NIM A (SRC-031), plus admissible anchors (SRC-067..068) | Medium: some timing sources are explicitly preprint/exploratory (SRC-032); raw time-series often unavailable (equation trace partial) | If the same scenario pack rerun at same commit produces different classifications | BLK-RAW-DATA (equation trace: raw series not published for some sources) | Add raw offset/pps series datasets (or extractable traces) for at least one primary timing dataset |
| C-13 | SEM+Ellipsometry lane blocks promotion readiness with reasons: `missing_covariance_uncertainty_anchor`, `missing_paired_dual_instrument_run`. | promoted-candidate | supported | n/a | `docs/audits/research/warp-promotion-readiness-suite-latest.md`; `docs/specs/casimir-tile-sem-ellipsometry-compatibility-contract-v1.md` | Standards/primary anchors exist but do not substitute for paired-run evidence: GUM/JCGM (SRC-005/006), ISO (SRC-040/043), NIST SRM suite (SRC-085..096), BAM SE procedure (SRC-050) | Low on the *fact of being blocked*; high on the *remedy being required* (explicit in contract) | If promotion readiness suite shows sem_ellipsometry reportable_ready=true without paired-run + covariance evidence | BLK-SE-RPT (fail-closed by contract) | Execute paired SEM+ellips run protocol; include covariance budget; include instrument-export provenance |
| C-14 | Casimir sign-control shadow injection run (cs-primary-reportable, 2026-03-05) shows scenario_count=18 and all scenarios classified compatible (non-blocking shadow mode). | canonical-authoritative | supported | Casimir sign-control mapping uses CH-CS-001; equation trace includes EQT-016-01, EQT-017-01 | `docs/audits/research/warp-shadow-injection-run-cs-primary-reportable-2026-03-05.md`; equation trace | Primary Casimir repulsion anchor: Munday/Capasso/Parsegian Nature 2009 (SRC-016, primary); published sign-route via off-stoichiometry is SRC-017 (primary) | Medium: the run is explicitly “shadow_non_blocking”; compatibility ≠ demonstrated real-world build | If rerun of same scenario pack yields incompatible/error outcomes OR if “shadow_non_blocking” is removed without replacing evidence | none | Promote only if strict evidence lanes exist for fabricated devices (not present here) |
| C-15 | Nanogap reportable compatibility check (2026-03-06) shows scenario_count=10 with congruent=5, incongruent=5, unknown=0 under two profiles (NG-STD-10 and NG-ADV-5). | canonical-authoritative | supported | Nanogap chain CH-NG-001; equation trace includes EQT-035-01..EQT-039-01, EQT-042-01 | `docs/audits/research/warp-ng-compat-check-reportable-2026-03-06.md`; equation trace | Nanogap metrology anchors in citation pack include NIST/peer-reviewed sources (SRC-035..041, primary/standard) | Medium: scenario values are synthetic profile points; raw AFM image stacks usually not embedded (equation trace partial) | If rerun changes classifications without profile/scenario changes | BLK-RAW-AFM (raw images not bundled for recompute) | Add linked raw AFM datasets + uncertainty budgets for true replay-grade closure |
| C-16 | QCD analog replay is “reference_only” and reported as pass_partial with deterministic checks (z-score parity within tolerance). | exploratory overlay | supported | Replay equation shown; equation trace includes EQT-069-01 and derived checks DER-QCD-* | `docs/audits/research/warp-qcd-analog-replay-2026-03-17.md`; equation trace | Source IDs are classified “exploratory” in citation pack: STAR Nature 2026 (SRC-069 primary; usage scope exploratory), HEPData (SRC-070 primary; exploratory) | Medium: analogy lane is not tied to physical feasibility gates by policy | If replay cannot compute z-score or violates tolerance vs reported significance | none | Keep as non-blocking analogy; ensure it cannot be misinterpreted as feasibility evidence |
| C-17 | The repo provides a citation pack and a citation visit audit that classify sources and validate access methods, reinforcing strict/reportable vs exploratory overlay separation. | canonical-authoritative | supported | n/a | `docs/audits/research/warp-primary-standards-citation-pack-2026-03-04.md`; `docs/audits/research/warp-citation-visit-audit-2026-03-04.md` | Primary/Standard sources enumerated across QI/QEI, Casimir, timing, GR observables, metrology; preprints tagged | Medium: audit covers visitability, not correctness of extracted numeric values | If citation pack misclassifies a preprint as primary/standard or omits required normative anchors | none | Enforce source_class tags in CI (block normative claims that cite only preprints/secondary) |

## Equation-chain map

This section maps the major *equation chains* explicitly referenced in NHM2 governance artifacts, emphasizing (a) assumptions/domain, (b) unit sanity cues, (c) observables, and (d) recompute readiness. Where a detail is not directly extractable from committed artifacts, it is labeled **UNKNOWN** with reason.

### Geometry chain

**Chain identity:** geometry conformance is represented operationally as a set of check keys (not a single published equation chain) with explicit test filenames in the reference capsule. fileciteturn30file0L25-L35

**Equation IDs (external comparators, not internal test equations):** The equation trace maps “Core‑4 geometry signature” anchors for warp-family comparison: Alcubierre (EQT‑071‑01), Natário (EQT‑072‑01), Van den Broeck (EQT‑073‑01), Lentz (EQT‑074‑01) with explicit “non‑comparable” handling for Lentz and conditional comparability for Van den Broeck. fileciteturn27file0L72-L75 fileciteturn27file0L73-L75

**Assumptions/domain:** Geometry-first comparison intentionally distinguishes assumption domains and refuses equivalence when domains differ (e.g., Lentz “Einstein‑Maxwell‑plasma” domain is marked non‑comparable against the local vacuum/ADM baseline). fileciteturn27file0L74-L75 fileciteturn39file0L17-L21

**Dimensional/unit sanity:** **UNKNOWN** for internal geometry test equations because the commits provided here expose the *check names* and *pass/fail outcomes* but not the underlying formulae or unit tests in the same artifact surface. (The capsule only provides test file names, not extracted equation content). fileciteturn30file0L25-L35

**Mapped observable(s):** the geometry chain exports categorical pass/fail check results (metric form alignment, shift mapping, York time sign parity, etc.) and feeds the integrity parity suite. fileciteturn43file0L27-L42

**Recompute readiness:** **partial** overall for the auditor in this report because we did not execute the tests; the repo asserts pass. Falsifier: rerun of `tests/theory-checks.spec.ts` etc at the capsule `commit_pin` fails. fileciteturn30file0L25-L35

### QEI/QI chain

**Key equation IDs and anchors:**  
The equation trace explicitly anchors the inertial timelike Lorentzian worldline QI/QEI scaling lane in 4D (EQT‑051‑01) and sampling-family generalization (EQT‑052‑01), plus Hadamard point-splitting renormalization semantics (EQT‑058‑01). fileciteturn27file0L52-L60

**Primary/standard sources (strict/reportable eligible):** The citation pack declares the preferred normative anchors for worldline QI/QEI gate semantics (Ford & Roman, Fewster & Eveson, etc.) as `primary` with explicit DOIs/anchors (e.g., SRC‑051, SRC‑052, SRC‑056, SRC‑058). fileciteturn72file0L35-L41 fileciteturn72file0L132-L141

**Assumptions/domain:** The citation pack highlights a hard caveat: spatial averaging is not interchangeable with timelike worldline averaging in 4D (`SRC-056` “hard caveat anchor”), which is directly relevant to gate semantics and comparability claims. fileciteturn72file0L143-L146

**Dimensional/unit sanity:** The campaign execution report includes unit-bearing fields such as `lhs_Jm3`, `boundComputed_Jm3`, `tau_s`, and a constant `K`, implying a normalization and units discipline exists in the gate output. However, **audit-grade unit derivations are UNKNOWN** in this report because the underlying machine artifacts (`g4-kernel-provenance-audit-*.json`, etc.) are referenced but not committed here. fileciteturn48file0L40-L47

**Mapped observable(s):** In the canonical campaign report, this chain produces G4 “margin ratio” outputs and uncertainty-band classification (e.g., `marginRatioRaw`, `uncertaintySigma_Jm3`, etc.) which drive PASS/FAIL semantics at reduced-order level. fileciteturn48file0L35-L47

**Recompute readiness:** **partial** at the repo surface available here: theorem anchors exist and are governed; but the run’s proof-grade replay artifacts are not all present in GitHub. fileciteturn48file0L122-L132 fileciteturn50file0L1-L1

### Casimir sign-control chain

**Key equation IDs and anchors:** Casimir sign-control trace entries include experimentally grounded Casimir-Lifshitz context and force accounting (EQT‑016‑01) and a sign-window lane (EQT‑017‑01). fileciteturn27file0L18-L26 fileciteturn27file0L17-L19

**Primary/standard sources (strict/reportable eligible):** Citation pack lists a primary measured repulsive Casimir-Lifshitz anchor (Munday/Capasso/Parsegian Nature 2009, `SRC‑016`) and a published material-engineering route (`SRC‑017`), both marked `primary` and admissible for normative sign-control claims. fileciteturn72file0L25-L29

**Assumptions/domain:** The shadow-injection Casimir run is explicitly marked `shadow_non_blocking` and “recovery success bar: map_only”, preventing interpretation as a feasibility claim. fileciteturn67file0L1-L18

**Dimensional/unit sanity:** The Casimir shadow run reports `marginRatioRaw` outputs and uses `tauSelected_s` and sampler fields, implying a consistent gate interface; but equations and unit checks inside the solver pipeline are **UNKNOWN** from committed artifacts alone. fileciteturn67file0L19-L30

**Mapped observable(s):** scenario-wise `marginRatioRaw` and `congruentSolvePass` classification under stated experimental context labels (attractive/transition/repulsive; materials; medium). fileciteturn67file0L31-L55

**Recompute readiness:** **partial** overall—scenario results are explicit in MD; underlying JSON artifact path is referenced but not committed. fileciteturn67file0L17-L27 fileciteturn50file0L1-L1

### Q-spoiling chain

**Key equation IDs and anchors:** Q-spoil lane includes spoil factor definition `F_Q_spoil = Q_clean / Q_spoiled` (EQT‑023‑01) and other mechanism lanes (e.g., trapped flux and TLS parameterizations) with varying recompute readiness in the equation trace. fileciteturn27file0L39-L45

**Primary/standard sources (strict/reportable eligible):** Preferred primary anchors for Q-spoiling mechanism claims are explicitly enumerated: PRL 2017 oxide/TLS-linked low-field Q slope (`SRC‑021`), PRSTAB 2014 trapped flux (`SRC‑022`), and Supercond. Sci. Technol. 2013 hydride/Q disease (`SRC‑023`). fileciteturn72file0L30-L35

**Assumptions/domain:** The q-spoiling compatibility check is an *evidence congruence envelope* across synthetic scenario points against profile floors/ceilings and uncertainty overlap handling (`edge_uncertainty_overlap`). fileciteturn64file0L1-L16 fileciteturn64file0L41-L52

**Dimensional/unit sanity:** Variables are dimensionless or standard for SRF practice (Q0 values, ratios), and uncertainties are expressed as relative quantities (e.g., `u_q0_rel`, `u_f_rel`). This is supported at the report level; deeper unit cross-checks are **UNKNOWN**. fileciteturn64file0L19-L27

**Mapped observable(s):** Congruent/incongruent/unknown classifications across SRF mechanism profiles, with explicit reasons like `q0_baseline_below_floor`, `q0_spoiled_above_ceiling`, `f_q_spoil_below_floor`, and `edge_uncertainty_overlap`. fileciteturn64file0L19-L27 fileciteturn64file0L41-L52

**Recompute readiness:** **supported for deterministic envelope replay from scenario pack** (because the report is deterministic given those values), but **partial for source-level recompute** where raw measurement sweeps are absent (as flagged in equation trace for multiple SRF entries). fileciteturn27file0L41-L49 fileciteturn64file0L1-L16

### Nanogap metrology chain

**Key equation IDs and anchors:** Nanogap chain CH‑NG‑001 includes AFM calibration/uncertainty equations and reconstruction methods (EQT‑035‑01, EQT‑036‑01, EQT‑037‑01, EQT‑038‑01, EQT‑039‑01), as well as uncertainty propagation context (EQT‑042‑01). fileciteturn27file0L28-L38 fileciteturn27file0L45-L47

**Primary/standard sources (strict/reportable eligible):** Citation pack lists NIST/peer-reviewed anchors for AFM nanogap uncertainty and BTR methods (e.g., `SRC‑035`, `SRC‑036`, and related). fileciteturn72file0L107-L114

**Assumptions/domain:** Envelope-based profile checks compare `u_g_mean_nm` and `u_g_sigma_nm` against profile bounds, and classify exceedances (e.g., `u_g_sigma_exceeds_profile`). fileciteturn65file0L19-L33

**Dimensional/unit sanity:** nm-scale fields are explicit in the nanogap report (`gap_nm`, `u_g_mean_nm`, `u_g_sigma_nm`). fileciteturn65file0L19-L33

**Mapped observable(s):** Scenario-level congruence and reportable readiness fields are included in the report output. fileciteturn65file0L19-L33

**Recompute readiness:** **partial** overall: envelope checks are deterministic; many upstream experimental sources are “partial” due to missing raw image stacks in extracted surfaces (equation trace). fileciteturn27file0L28-L38

### Timing chain

**Key equation IDs and anchors:** Timing chain CH‑T‑001 includes timing error and Allan/MTIE statistics (EQT‑031‑01, EQT‑032‑01, EQT‑067‑01, EQT‑068‑01), with many sources marked `partial` because raw time series are not provided. fileciteturn27file0L19-L24

**Primary/standard sources (strict/reportable eligible):** Citation pack nominates IEEE 1588 as `standard` (SRC‑029) and multiple White Rabbit primary anchors (SRC‑030, SRC‑031, SRC‑067, SRC‑068). fileciteturn72file0L36-L41

**Assumptions/domain:** The timing compatibility check distinguishes short-fiber WR vs long-haul unrepeated topology classes and includes uncertainty overlaps. fileciteturn66file0L12-L31

**Dimensional/unit sanity:** All timing statistics are expressed in picoseconds (`sigma_t_ps`, `tie_pp_ps`, etc.) in the compatibility report. fileciteturn66file0L19-L31

**Mapped observable(s):** Scenario-level congruence and reasons (`sigma_exceeds_profile`, `edge_uncertainty_overlap`) are explicit. fileciteturn66file0L19-L31

**Recompute readiness:** **partial** at source level due to missing raw time series (equation trace). Deterministic envelope playback is supported at the scenario level (given scenario pack values). fileciteturn27file0L19-L24 fileciteturn66file0L12-L18

### GR observables chain

**Key equation IDs and anchors:** Mercury perihelion (EQT‑075‑01), lensing limb deflection (EQT‑077‑01), frame dragging (EQT‑080‑01), Shapiro delay (EQT‑083‑01). fileciteturn27file0L75-L83

**Primary/standard sources:** Citation pack lists admissible primary anchors for these observables (SRC‑075..084). fileciteturn72file0L72-L83

**Assumptions/domain:** These are explicitly “reference-only GR observable replay” anchors (non-blocking sanity checks that do not alter canonical warp-lane policy). fileciteturn72file0L100-L107

**Dimensional/unit sanity:** Outputs include arcseconds per century and arcseconds, plus mas/year and PPN gamma residuals. fileciteturn30file0L49-L65

**Mapped observable(s):** Residual-based parity checks against published benchmarks with explicit tolerances. fileciteturn43file0L43-L76

**Recompute readiness:** **partial** overall—deterministic formula replay is available, but strict-source uncertainty tables and covariance decomposition are explicitly noted as outside the wave in equation trace (e.g., Mercury uncertainties). fileciteturn27file0L75-L78

## Lane-by-lane readiness table

Interpretation policy: “reportable_ready” refers to *this repo’s promotion-readiness governance*, **not** to real-world device feasibility. All lanes remain under the non-feasibility boundary (C‑01). fileciteturn30file0L1-L6

| lane | mapping_complete (Y/N) | reportable_ready (Y/N) | blocked_reasons | deterministic replay status | stable citation target IDs |
|---|---|---|---|---|---|
| casimir_sign_control | Y (shadow scenarios + outputs committed) fileciteturn67file0L1-L18 | N/A for promotion suite (not one of the 3 promotion lanes) fileciteturn40file0L12-L18 | Not promotion-gated here; shadow_non_blocking posture fileciteturn67file0L1-L18 | **partial**: MD is deterministic; referenced JSON artifacts not committed fileciteturn67file0L17-L27 | Sources: SRC‑016, SRC‑017 (primary) fileciteturn72file0L25-L30 |
| q_spoiling | Y (promotion lane) fileciteturn40file0L12-L18 | **Y** fileciteturn40file0L12-L18 | none listed in promotion report fileciteturn40file0L12-L18 | **partial**: deterministic envelope; many source-level replays are partial due to raw datasets absent fileciteturn27file0L41-L49 | Sources: SRC‑021..023 (primary); plus timing/standards scaffold fileciteturn72file0L30-L35 |
| nanogap | Y (compat-check report committed) fileciteturn65file0L1-L18 | Y at reportable profile points (report includes `reportable_ready=true`) fileciteturn65file0L19-L33 | none explicit; incongruence mainly due to `u_g_sigma_exceeds_profile` in ADV profile fileciteturn65file0L26-L33 | **partial**: deterministic envelope; source-level recompute often partial due to raw AFM data not bundled fileciteturn27file0L28-L38 | Sources: SRC‑035..041 (primary/standard) fileciteturn72file0L107-L121 |
| timing | Y (promotion lane) fileciteturn40file0L12-L18 | **Y** fileciteturn40file0L12-L18 | none listed in promotion report fileciteturn40file0L12-L18 | **partial**: deterministic envelope; key sources lack raw series fileciteturn27file0L19-L24 | Sources: SRC‑029..031, SRC‑067..068 (standard/primary) fileciteturn72file0L36-L41 fileciteturn72file0L44-L47 |
| sem_ellipsometry | Y at contract/spec level, but **reportable fail-closed** by design until paired evidence exists fileciteturn68file0L42-L86 | **N** fileciteturn40file0L13-L18 | `missing_covariance_uncertainty_anchor`; `missing_paired_dual_instrument_run` fileciteturn40file0L13-L18 | **blocked** for reportable replay until paired-run + covariance + provenance are delivered (contract spells required blocked reasons) fileciteturn68file0L42-L66 | Sources exist (ISO/NIST/BAM), but cannot substitute for paired-run dataset: SRC‑040/043/050/085..096 fileciteturn72file0L84-L99 fileciteturn72file0L121-L131 |
| qcd_analog | Mapping exists but posture is reference_only (not promotion) fileciteturn28file0L6-L10 | N/A | none fileciteturn28file0L55-L56 | **partial**: deterministic replay of summary stats; not event-level reconstruction fileciteturn28file0L24-L37 fileciteturn27file0L69-L71 | Sources are explicitly “exploratory” in citation pack: SRC‑069, SRC‑070 fileciteturn72file0L48-L52 |
| GR observables | Mapping exists and is used in integrity parity as sanity checks fileciteturn43file0L43-L76 | N/A (reference-only parity layer) fileciteturn72file0L100-L107 | none in parity suite fileciteturn43file0L86-L119 | **partial**: deterministic replay is present; strict uncertainty extraction incomplete in at least one chain (Mercury) fileciteturn27file0L75-L78 | Sources: SRC‑075..084 (primary) fileciteturn72file0L72-L83 |

## Visual communication blueprint

This blueprint is *scientist-facing* and aims to make claims falsifiable, tier-separated, and audit-traceable. Where the repo does not expose an explicit “visual orchestrator” renderer/panel interface in committed artifacts, the mapping is provided to **existing report generators / commands** named in parity artifacts; any additional UI paneling is marked **UNKNOWN** (not extractable from committed evidence in this audit pass).

**Figure set requirement coverage:** geometry & metric conformance; guardrail waterfall; evidence congruence per lane; uncertainty propagation; GR observable parity.

### Geometry and metric conformance figure

**Goal:** one diagram that lists the 5 geometry conformance checks and their status, with a pointer to the underlying test files (for reproducibility).

**Data source (supported):** reference capsule geometry conformance table. fileciteturn30file0L25-L35  
**Generator hooks (supported):** integrity parity suite lists the executed step `npm run warp:full-solve:geometry:conformance` as `pass`. fileciteturn43file0L93-L101  
**Renderer/panel status:** UI panel **UNKNOWN** (no committed panel screenshots/JSON were identified in the inspected artifact list); report-based renderer is **supported** via the above command + capsule table. fileciteturn43file0L93-L101  
**Fail-closed cue:** if any check is not `pass`, the figure must prominently flip to “FAILED CHECKS PRESENT” and list failing test file(s). (Falsifier: rerun produces non-pass.)

### Guardrail waterfall

**Goal:** show the gate stack as a waterfall: boundary statement → canonical decision → parity suite → promotion readiness → external comparability taxonomy, explicitly preventing “feasibility” conflation.

**Data sources (supported):** campaign execution report gate scoreboard and verdict. fileciteturn48file0L1-L33  
**Generator hooks (supported):** integrity parity “Executed Steps” includes `npm run warp:full-solve:canonical` (canonical reconciliation) and reference capsule generation/validation steps. fileciteturn43file0L93-L108  
**Renderer/panel status:** **supported** as a derived figure from reports; UI panel **UNKNOWN** (no orchestrator panel artifacts committed in the inspected set).

### Evidence congruence envelope per lane

**Goal:** for each lane, show (congruent/incongruent/unknown) counts and dominant reason codes; explicitly label “unknown” as “inconclusive” (not pass/fail).

**Data sources (supported):**  
- Q-spoiling readiness check summary and reason counts. fileciteturn64file0L12-L18 fileciteturn64file0L53-L65  
- Timing readiness check summary and reasons. fileciteturn66file0L12-L18 fileciteturn66file0L33-L38  
- Nanogap reportable check summary and dominant reason. fileciteturn65file0L12-L18 fileciteturn65file0L34-L36  
- Promotion readiness summary table (for the three promotion lanes). fileciteturn40file0L11-L18

**Generator hooks (supported):** these are already emitted as MD tables; a renderer could parse the MD/JSON (when committed) into bar charts.  
**Renderer/panel status:** **partial**—reports exist; machine JSONs referenced for some runs are not committed (blocked for fully automated plotting without rerun).

### Uncertainty propagation funnel

**Goal:** show how uncertainty influences classification (e.g., “edge_uncertainty_overlap” regions) and where uncertainty sources are missing.

**Data sources (supported/partial):**  
- Q-spoiling shows `edge_uncertainty_overlap` as a dominant reason category. fileciteturn64file0L53-L65  
- Timing shows `edge_uncertainty_overlap` for a boundary case. fileciteturn66file0L23-L27  
- SEM+Ellips contract spells required covariance/provenance evidence and fail-closed blocked reasons (making the uncertainty funnel explicit). fileciteturn68file0L42-L66

**Renderer/panel status:** **partial**—can be produced from reports/contracts, but “full funnel” numerical propagation is blocked without the missing covariance datasets and without committed machine artifacts.

### GR observable parity panel

**Goal:** show predicted vs observed with residuals and tolerances for four observables; clearly labeled “reference-only parity.”

**Data sources (supported):** integrity parity suite and reference capsule values. fileciteturn43file0L43-L76 fileciteturn30file0L49-L65  
**Generator hooks (supported):** integrity parity suite executed steps list external run/compare commands for GR works. fileciteturn43file0L93-L107  
**Renderer/panel status:** **supported** via command logs + report values; UI panel artifacts **UNKNOWN**.

## Final promotion bridge checklist

This checklist is deliberately **fail-closed** and does **not** relax canonical thresholds or redefine the boundary. It specifies measurable actions that increase evidence strength and reproducibility while remaining within the repo’s governance model.

### Evidence publication and artifact availability

**PB-01 (fail-closed): Commit or immutably publish the machine JSON artifacts referenced by canonical and suite reports.**  
Success criterion: all `artifacts/research/full-solve/*.json` paths referenced in the theory directory and suite reports are retrievable at the repo `commit_pin` (or via an immutable artifact store with content hashes), eliminating the “exists:true but not in GitHub” mismatch. Evidence of mismatch exists today. fileciteturn51file0L29-L45 fileciteturn50file0L1-L1  
Falsifier: any referenced artifact remains missing.

**PB-02 (fail-closed): Resolve the state-of-record staleness condition.**  
Success criterion: `stale_against_head=false` or a documented rule that forbids the “latest” alias pointing to a stale artifact commit pin. The state-of-record currently flags `stale_against_head: true` and lists the stale pin mismatch as a blocker. fileciteturn35file0L4-L12 fileciteturn35file0L61-L64

### SEM+Ellipsometry: unblock the promotion readiness gate without changing thresholds

**PB-03 (fail-closed): Execute at least one paired SEM+ellipsometry run bundle that satisfies the SEM+Ellips contract “strict signals” and “reportable unlock” requirements.**  
Contractual minimums include: SEM calibration anchor, ellipsometry anchor, uncertainty reporting anchor, traceability anchor (strict). fileciteturn68file0L17-L36  
Reportable unlock requirements include paired dual-instrument run evidence and covariance uncertainty anchors **with instrument-export provenance**, and templates must be rejected as placeholders. fileciteturn68file0L42-L86  
Falsifier: reportableReady flips true without these fields → governance violation.

**PB-04 (fail-closed): Publish a covariance-aware uncertainty budget artifact set and link it to scenario evaluation.**  
Success criterion: the blocked reason `missing_covariance_uncertainty_anchor` disappears in the promotion readiness suite while keeping the same SE profile thresholds (SE-STD-2, SE-ADV-1). fileciteturn68file0L34-L41 fileciteturn40file0L13-L18

### QEI/QI and conformance: from “reported” to “recompute-grade” surfaced evidence

**PB-05 (fail-closed): Provide a recompute-grade sampler and normalization artifact trail for the QEI/QI gate.**  
Success criterion: all theorem anchor citations used for normative gate semantics are `primary|standard` per the citation pack (not preprint-only) and are linked via equation trace entries with `recompute_status=pass` where feasible. The citation pack already specifies preferred sources (e.g., SRC‑051, SRC‑052, SRC‑058). fileciteturn72file0L132-L142

**PB-06 (fail-closed): Add strict-source uncertainty anchors for GR observable benchmarks where currently marked unresolved/UNKNOWN in the equation trace.**  
Success criterion: the GR observable chain includes observed uncertainty fields traceably extracted from primary sources (e.g., Will Living Reviews, etc.) and recorded in the observable snapshot JSONs (or equivalent). The equation trace explicitly notes Mercury observed uncertainty extraction as unresolved in this pass. fileciteturn27file0L75-L78

### External comparisons: preserve “inconclusive” semantics and prevent tier leakage

**PB-07 (fail-closed): Enforce reason-code completeness for all `partial`/`inconclusive` external comparison outcomes.**  
Success criterion: every non-compatible external-work row includes explicit `non_comparable_or_unknown:*` explanations (as the matrix currently does). fileciteturn39file0L15-L21  
Falsifier: any non-compatible row becomes “compatible” without comparability disclosure or without matching assumption domains.

**PB-08 (fail-closed): Prevent preprints from supporting strict/reportable claims.**  
Success criterion: CI rule checks that “normative” or “reportable_ready” lanes do not cite preprints as sole support, consistent with the citation pack’s scope rule. fileciteturn72file0L9-L16  
Falsifier: a reportable lane’s evidence bundle uses only preprints for a normative statement.

### Deterministic replay hygiene

**PB-09 (fail-closed): Publish deterministic replay hashes for lane scenario packs and checker outputs.**  
Success criterion: for each lane listed in promotion readiness and integrity parity, there exists a committed (or immutably stored) “repeat determinism” artifact demonstrating identical summary and reason-code counts for reruns under the same commit pin and scenario pack. Determinism is explicitly required in multiple lane contracts (e.g., SEM+Ellips). fileciteturn68file0L108-L112

**PB-10 (fail-closed): Maintain a single authoritative “proof-anchor index” that resolves stable citation targets.**  
Success criterion: proof-anchor index *and* its referenced targets are retrievable from the same commit pin surface, eliminating the “present but missing” artifact gap. The proof-anchor index is already committed as human+machine artifacts, but it points to non-committed artifact paths. fileciteturn16file0L8-L21 fileciteturn50file0L1-L1
