# CasimirBot Stakeholder-Readiness Review for Warp Research Stack

This independent review is written for stakeholder presentation readiness on **February 23, 2026 (America/New_York)**, with **no near-term FTL framing** and with the repo’s **diagnostic / reduced-order / certified** tiering treated as the controlling disclosure discipline. fileciteturn57file0 fileciteturn67file0

The key readiness question is not “can a warp metric be written,” but whether the stack’s **claims, interfaces, guardrails, and provenance discipline** can be shown credibly to external audiences without implying physical feasibility that is not supported. In mainstream GR/QFT work, warp-like metrics exist mathematically, but: (i) **exotic stress-energy** is required in known constructions, and (ii) **quantum-inequality/quantum-interest** constraints severely restrict the magnitude-duration and pulse separation/repayment structure for negative energy. citeturn6view0turn0search47turn5search34turn7search2

## Executive Decision

### Presentation readiness verdict by audience

| Audience | GO/NO-GO | One-sentence reason | Allowed framing | Prohibited framing |
|---|---|---|---|---|
| Government / civil space stakeholders | **GO (limited)** | The stack is presentable as a **governance-first constraint and provenance platform** for long-horizon physics R&D, but not as a capability program. fileciteturn67file3 | “Constraint-driven simulation + guardrails + auditability; long-horizon, diagnostic/reduced-order research.” fileciteturn67file3 | “A credible propulsion pathway,” “near-/mid-term warp transportation,” or anything implying operational feasibility. fileciteturn67file3turn67file0 |
| Defense / mission operators | **NO-GO** | The stack’s outputs are contingent on assumptions and proxy/derived metrics; it is not operationally certifiable as mission capability. fileciteturn57file0turn67file0 | “Risk-identification tooling; fail-close constraints; research transparency.” fileciteturn58file1turn58file5 | “Mission planning basis,” “tactical advantage,” “reliable performance envelopes,” or “tested fieldability.” |
| Industry / investors | **GO (conditional)** | Presentable as a **software + methods stack** for falsifiable constraints/provenance (with clear moat in governance), not as a product claiming physical warp sourcing. fileciteturn57file0turn67file3 | “Audit-grade simulation governance; reproducible ‘first-fail’ semantics; roadmap for experiments in vacuum-stress metrology.” fileciteturn58file1turn58file5turn67file3 | “Warp fuel is solved,” “FTL is imminent,” “commercial lunar transport via warp is near.” citeturn5search34turn7search1 |
| Academic physics collaborators | **GO** | The repo is unusually ready for collaboration because it exposes a **CL4-style gap map**, strict/relaxed provenance logic, and test-backed “no overclaim” behavior. fileciteturn53file1turn67file0turn57file1turn58file5 | “Open problems: chart/observer/normalization closure; curvature-window validity; constraint-closed stress-energy.” fileciteturn67file0turn53file1 | “We have proven physical viability,” “we satisfy QFT-in-curved-spacetime constraints for macroscopic devices.” citeturn7search1turn5search34 |

### Bottom-line decision

**Present now only as**: a **constraint-driven simulation + governance stack** that (a) encodes mainstream “hard barriers” (energy-condition burden, QI/QEIs, quantum-interest style repayment), and (b) prevents internal exploratory metrics from being promoted to public “certified” language without provenance. fileciteturn67file3turn57file0turn67file0

**Do not present now as**: any near-term (or even mid-term) propulsion program, any claim of scalable negative-energy sourcing, or any claim that “pulsing/strobing is a loophole.” The physics literature explicitly treats negative-energy sampling as constrained, including repayment (“quantum interest”). citeturn0search47turn5search34turn7search2turn7search0

## What Is Actually Implemented

Each mechanism below is listed with **implementation path**, **test path**, and the **highest claim tier the mechanism can responsibly support** (given the repo’s own discipline: proxy/derived vs measured/contract-closed). fileciteturn67file0turn53file1

- **Claim-tiering + strict congruence promotion/demotion (“promotion replay pack”)**  
  Code: `tools/warpViability.ts` fileciteturn57file0  
  Tests: `tests/warp-viability.spec.ts` fileciteturn57file1  
  Maturity tier supported: **certified (software governance semantics)** for *tier assignment and fail-close behavior*, not for physical viability. fileciteturn57file0turn57file1

- **Warp viability “oracle” that outputs hard/soft constraint passes, notes, and deterministic “first-fail” semantics**  
  Code: `tools/warpViability.ts` fileciteturn57file0  
  Tests: `tests/warp-viability.spec.ts` fileciteturn57file1  
  Maturity tier supported: **reduced-order**, because it depends on derived metric signals and contract metadata to elevate beyond proxy. fileciteturn57file0turn67file0

- **Pipeline computation of warp-relevant runtime state and provenance tags (metric-derived vs proxy/hardware)**  
  Code: `server/energy-pipeline.ts` fileciteturn58file1  
  Tests: `tests/pipeline-ts-qi-guard.spec.ts` fileciteturn58file5  
  Maturity tier supported: **diagnostic → reduced-order**, depending on whether strict mode is enabled and whether metric-derived contract metadata is present. fileciteturn58file1turn58file5turn67file0

- **Ford–Roman-inspired quantum inequality bound function with explicit `-K / τ^4` scaling knob + safety margin**  
  Code: `server/qi/qi-bounds.ts` fileciteturn60file0  
  Tests (behavioral wiring + monotonicity and integration): `tests/pipeline-ts-qi-guard.spec.ts` fileciteturn58file5  
  Maturity tier supported: **reduced-order**, because it is an assumption-sensitive application of flat-spacetime-style scaling to runtime signals. fileciteturn60file0turn67file0turn0search47

- **QI monitor that applies sampling windows/kernels and produces a guard margin (pass/fail + curvature-window/provenance flags)**  
  Code: `server/qi/qi-monitor.ts` fileciteturn60file1  
  Tests: integration checks in `tests/pipeline-ts-qi-guard.spec.ts` fileciteturn58file5  
  Maturity tier supported: **reduced-order** (assumption-sensitive QI/QEI mapping). fileciteturn60file1turn7search1

- **Explicit “strobing/pulsing is not a loophole” posture via scheduling + repayment semantics hooks**  
  Code: implemented as guard policy + scheduler first-fail semantics surfaced in pipeline and planning logic; the repo’s stakeholder doc states strobing is constrained by QI/quantum interest, not a loophole. fileciteturn67file3  
  Tests: planner fail-close on hard QI constraint in `tests/pipeline-ts-qi-guard.spec.ts`. fileciteturn58file5  
  Maturity tier supported: **diagnostic/reduced-order** (policy-level), aligned with quantum-interest literature rather than claiming physical evasion. fileciteturn67file3turn7search2turn7search0

- **GR/Natário baseline instrumentation: “metric-derived T00” references and Natário-family tagging**  
  Code pointers appear in the CL4 guardrail map (`modules/warp/natario-warp.ts`, `server/energy-pipeline.ts`). fileciteturn53file1turn60file4turn58file1  
  Tests: canonical metric reference wiring asserted in `tests/pipeline-ts-qi-guard.spec.ts`. fileciteturn58file5  
  Maturity tier supported: **reduced-order** (DERIVED, convention-sensitive: chart/observer/normalization must be explicit). fileciteturn67file0turn53file1

- **Clocking + TS ratio computation as an operational proxy with regime classification and explicit thresholds**  
  Code: `shared/clocking.ts` fileciteturn65file0  
  Tests: TS provenance and strict-mode gating tested via pipeline + viability. fileciteturn58file5turn57file1  
  Maturity tier supported: **diagnostic → reduced-order** (explicitly labeled operational/proxy unless tied to metric proper distance in strict mode). fileciteturn67file0turn58file5

- **UI hook that implements a light-crossing–aligned timing loop (prevents burst scheduling below light-crossing for a chosen path)**  
  Code: `client/src/hooks/useLightCrossingLoop.ts` fileciteturn61file0  
  Tests: indirectly via pipeline/TS tests and UI proof surfaces referenced by the CL4 map. fileciteturn58file5turn53file1  
  Maturity tier supported: **diagnostic** (UI/operational control loop, not a physical proof). fileciteturn61file0

- **Formal “guardrail map” and “literature vs runtime gap analysis” artifacts (CL4-style disclosure)**  
  Docs: `docs/warp-geometry-cl4-guardrail-map.md`, `docs/warp-literature-runtime-gap-analysis.md` fileciteturn53file1turn67file0  
  Maturity tier supported: **diagnostic (documentation)**, but critical for stakeholder trust because it enumerates EXACT/DERIVED/PROXY_ONLY status. fileciteturn67file0turn53file1

## Claims Matrix

The table below enumerates **external-facing claims** that stakeholders will infer, and rates each as **Defensible Now / Conditional / Not Defensible**, with explicit tiering and “NOT READY” where evidence is absent or ambiguous.

| External claim (include tier label) | Status | Evidence in repo | Missing evidence (→ `NOT READY` trigger) | Risk if publicly stated |
|---|---|---|---|---|
| **“(diagnostic/reduced-order) We implement an auditable viability gate with explicit hard/soft constraints and deterministic first-fail output.”** | **Defensible Now** | `tools/warpViability.ts`; `tests/warp-viability.spec.ts` fileciteturn57file0turn57file1 | None for the *software semantics*; but do not imply physical truth of inputs. | Low if framed as governance software; high if framed as “physics certification.” fileciteturn57file0 |
| **“(reduced-order) We evaluate a Ford–Roman-style QI bound scaling roughly as `-K/τ^4` with explicit assumptions and safety margin.”** | **Conditional** | `server/qi/qi-bounds.ts`; wired via pipeline/tests fileciteturn60file0turn58file5 | Curved-spacetime + interacting-field QEIs, observer/worldline binding, and curvature-window applicability in each scenario. → **NOT READY** for any “certifies physical legality” statement. fileciteturn67file0turn7search1 | Medium: can be attacked if presented as “the QI,” rather than as an operational bound inspired by literature. citeturn0search47turn7search1 |
| **“(reduced-order) Strobing/pulsing is treated as constrained borrowing with payback, not a loophole.”** | **Defensible Now** | Stated explicitly for stakeholders in `docs/warp-bubbles-lunar-transport-stakeholder-readiness-2026-02-23.md`; planner fail-close behavior in `tests/pipeline-ts-qi-guard.spec.ts`. fileciteturn67file3turn58file5 | Quantitative mapping from the repo’s scheduler variables (`dutyCycle`, `negativeFraction`, `TS_ratio`, etc.) to a specific quantum-interest theorem in the exact physical setting. (Still: the *non-loophole principle* is well-supported.) citeturn7search2turn7search0 | Low if framed as “we do not rely on loopholes”; high if claimed as “we satisfy full quantum interest in 4D curved spacetime.” citeturn7search2 |
| **“(reduced-order) We compute Natário/ADM-linked stress-energy diagnostics with explicit provenance (`metricT00Ref`, chart contract status).”** | **Conditional** | CL4 map + pipeline wiring and tests for canonical refs/provenance. fileciteturn53file1turn58file1turn58file5 | Full chart/observer/normalization closure across all warp families and paths; proof that derived quantities reproduce analytic special cases under resolution studies. → **NOT READY** for “certified GR sourcing.” fileciteturn67file0 | Medium: academics will accept “derived under assumptions”; nontechnical stakeholders may mishear as “GR proof.” citeturn6view0 |
| **“(certified) Our outputs demonstrate a physically viable warp configuration.”** | **Not Defensible** (`NOT READY`) | The repo explicitly positions warp as long-horizon and non-certifying for propulsion. fileciteturn67file3turn67file0 | Any experimental pathway to macroscopic negative-energy sourcing; semiclassical backreaction control; QFT-in-curved-spacetime QEI closure for the full geometry. citeturn5search34turn7search1turn4search5 | Extreme: reputational harm; can trigger “breakthrough claim” scrutiny and rapid credibility loss. |
| **“(diagnostic) We can compare lunar logistics readiness (roads/rails/power) vs warp research readiness in one stakeholder package.”** | **Defensible Now** | Explicitly framed in `docs/warp-bubbles-lunar-transport-stakeholder-readiness-2026-02-23.md`. fileciteturn67file3 | None, provided it stays a framing document rather than a mission spec. | Low: valuable positioning if it deconflicts “Moon transport” from “warp.” fileciteturn67file3 |
| **“(reduced-order) We enforce strict-mode blocks on proxy inputs before allowing ‘certified’ language.”** | **Defensible Now** | Enforced in `tools/warpViability.ts` and demonstrated in `tests/warp-viability.spec.ts` (e.g., proxy theta/QI sources fail in strict mode). fileciteturn57file0turn57file1 | None for this *policy enforcement*. | Low: this is a trust-building feature. fileciteturn57file1 |
| **“(reduced-order) TS_ratio, light-crossing timing, and scheduling are derived from metric adapter and clocking (or explicitly marked hardware/proxy).”** | **Conditional** | Metric-derived labeling asserted in `tests/pipeline-ts-qi-guard.spec.ts`; clocking function defines TS/epsilon regimes. fileciteturn58file5turn65file0 | Demonstration that TS mapping corresponds to a literature-defined τ₀ and curvature radius condition for each geometry. fileciteturn67file0 | Medium: safe if called “operational proxy”; risky if called “proves warp stability.” citeturn5search34 |
| **“(certified) We have a near-term plan to use warp bubbles for cislunar/lunar transportation.”** | **Not Defensible** (`NOT READY`) | Repo framing explicitly rejects near-term propulsion positioning. fileciteturn67file3 | Physical feasibility evidence; mission design; safety/verification path; none exist in-repo at certifying level. citeturn5search34turn7search1 | Extreme: invites “fraudulent tech claim” interpretation from sophisticated reviewers. |

## Presentation Package Blueprint

A 12-slide deck structure that is **safe, technically precise, and audience-adaptable**, with explicit “what to say / what not to say.”

**Slide 1 — Title + posture**  
Say: “CasimirBot Warp Research Stack: constraint-driven simulation and governance (diagnostic/reduced-order).” fileciteturn67file3  
Do not say: “Warp drive program,” “FTL roadmap.”

**Slide 2 — Three-tier truth model**  
Say: “We separate: mathematically representable → physically plausible → experimentally actionable.” fileciteturn67file0turn67file3  
Do not say: “A metric implies buildability.” citeturn6view0

**Slide 3 — What warp metrics are (GR-only)**  
Say: “Warp-like spacetimes can be written in GR; e.g., Alcubierre and Natário families.” citeturn6view0turn4search39  
Do not say: “GR already allows FTL engineering.”

**Slide 4 — Why ‘sourcing’ is the hard part**  
Say: “Known warp constructions require exotic stress-energy; energy conditions are violated in the standard analyses.” citeturn6view0turn5search34turn4search39  
Do not say: “Casimir automatically solves exotic matter.”

**Slide 5 — QI/QEI driver and why strobing isn’t a loophole**  
Say: “Negative energy is constrained by quantum inequalities; pulsing implies borrowing and repayment (quantum interest).” citeturn0search47turn7search2turn7search0  
Do not say: “Duty cycling evades QIs.”

**Slide 6 — Casimir reality check**  
Say: “Casimir effects are real; scaling to macroscopic gravitational sourcing is unestablished.” (Keep this as a boundary statement.) fileciteturn67file3  
Do not say: “Casimir plates fuel warp.”

**Slide 7 — What the stack actually does**  
Say: “It encodes constraints, provenance, and fail-close logic (first-fail), with strict-mode blocking of proxies.” fileciteturn57file0turn57file1turn58file5  
Do not say: “It certifies physics.”

**Slide 8 — Proof visibility: guardrails**  
Say: FordRomanQI / ThetaAudit / GR constraint gate; each has runtime signals and fail conditions. fileciteturn60file0turn57file1turn53file1  
Do not say: “These prove nature complies.”

**Slide 9 — CL4 gap map (what’s still missing)**  
Say: “We publish EXACT/DERIVED/PROXY_ONLY status and chart/observer/normalization gaps.” fileciteturn67file0turn53file1  
Do not say: “All quantities are geometry-derived.”

**Slide 10 — Stakeholder use-cases (safe)**  
Government/industry: “risk-managed long-horizon R&D governance.” Academia: “collaboration to close chart/QEI gaps.” fileciteturn67file3turn67file0  
Do not say: “mission operators should plan around this.”

**Slide 11 — 90-day upgrade plan**  
Say: “We can increase presentability and reduce ambiguity without claiming certification.” fileciteturn67file0

**Slide 12 — Explicit claim boundaries (read aloud)**  
Say the disclaimer verbatim (below). fileciteturn67file3turn67file0

### Public “no-overclaim” disclaimer language (ready to paste)

> “CasimirBot is a constraint-driven simulation and governance environment for exploring warp-like metrics under explicit assumptions. It does not demonstrate a physical propulsion capability, does not claim scalable negative-energy generation, and does not claim near-term faster-than-light transportation. All outputs are labeled by maturity tier (diagnostic / reduced-order / certified-as-governance) with explicit provenance; proxy-derived quantities are not presented as physical proofs.” fileciteturn67file3turn57file0turn67file0

## Proof Visibility Layer

This section lists **hard guardrails** (and one “hard-by-policy” gate) with: plain-English meaning, equation/metric form, runtime signals, fail condition, and confidence.

### FordRomanQI

- Plain English: “Even if you can create negative energy, QI/QEI-style bounds restrict how large and how long it can be along an observer’s worldline; the system fail-closes if the sampled negative energy exceeds the configured bound.” fileciteturn60file0turn60file1turn58file1turn58file5  
- Metric form: implemented as a configurable bound scaling like **`bound(τ) = -K / τ^4`** (with floors/ceilings and safety margin), and a runtime comparison between measured/derived `lhs` and `bound`. fileciteturn60file0 citeturn0search47turn7search1  
- Runtime signals: `qiGuardrail.marginRatio`, `qiGuardrail.lhs_Jm3`, `qiGuardrail.bound_Jm3`, `qiGuardrail.rhoSource`, plus strict-mode provenance flags surfaced through viability. fileciteturn58file1turn57file1turn53file1  
- Fail condition: margin below threshold or source/provenance is proxy in strict mode (treated as fail / not certifiable). fileciteturn57file1turn58file5  
- Current confidence: **reduced-order** (assumption-sensitive). The τ⁻⁴ scaling is a known feature of flat-spacetime QI/QEI results for suitable sampling, but mapping into curved, dynamical warp settings requires explicit curvature-window and observer definitions. fileciteturn67file0turn0search47turn7search1turn5search34

### ThetaAudit

- Plain English: “We do not trust hand-tuned ‘theta’—if strict mode is on, expansion/divergence must be metric-derived with chart contract metadata; proxy theta fails.” fileciteturn57file1turn53file1  
- Metric form: threshold gate **`|thetaCal| <= theta_max`** with provenance enforcement (metric-derived vs proxy). fileciteturn57file0turn66file0  
- Runtime signals: `theta_geom` / `theta_metric_*` vs `theta_pipeline_proxy`, plus chart contract status flags. fileciteturn53file1turn57file1  
- Fail condition: proxy input in strict mode, or missing chart contract metadata, or exceeding theta bounds. fileciteturn57file1turn67file0  
- Current confidence: **reduced-order** (DERIVED, convention-sensitive). In Alcubierre/Natário-style ADM framing, θ is definable, but sign/observer/chart conventions must be locked down to claim exact equivalence. fileciteturn67file0turn6view0turn4search39

### GR constraint gate

- Plain English: “If the runtime claims a geometry/stress-energy pairing, the ADM constraints should be close (within policy thresholds); otherwise we treat the situation as not physically self-consistent.” fileciteturn53file1turn66file0  
- Metric form: Hamiltonian and momentum residual thresholds (policy says unknown-as-fail for hard decisions). fileciteturn66file0turn53file1  
- Runtime signals: summarized as constraint residual stats (`H_constraint`, `M_constraint`, etc.) in pipeline snapshots and surfaced through viability outputs (where available). fileciteturn57file1turn58file1  
- Fail condition: residuals above thresholds, or missing values treated as fail under hard-only/unknown-as-fail policy. fileciteturn66file0  
- Current confidence: **diagnostic → reduced-order** depending on whether inputs are truly metric-derived and on numerical resolution. In ADM-based work, constraints are the right gate, but the stack must demonstrate convergence/consistency on analytic checks to claim high confidence. citeturn6view0turn5search1 fileciteturn67file0

## Red-Team Objections

All objections below are “likely” from expert reviewers; responses are constrained to what is defensible today.

1. **“Your `-K/τ^4` is a flat-spacetime proxy; QEIs in curved spacetime are subtler.”**  
   Response: Correct—repo classifies QI as DERIVED/assumption-sensitive and demands observer/curvature-window binding for higher congruence. The value proposition is governance-by-explicit-assumptions, not claiming QFT-in-curved-spacetime closure. fileciteturn67file0turn60file0turn60file1turn7search1

2. **“Pulsing can’t evade QIs; where is ‘quantum interest’ handled?”**  
   Response: The stakeholder posture explicitly rejects strobing as a loophole, and the platform fail-closes planning when QI hard constraints fail; quantum-interest work supports the payback framing as a constraint, not a free trick. fileciteturn67file3turn58file5turn7search2turn7search0

3. **“Your ‘certified’ label will be misunderstood as physical certification.”**  
   Response: Present “certified” only as “certified governance semantics” (strict provenance + pass gates) and require the public deck to avoid the word unless paired with a disclaimer sentence. The tiering logic is test-backed and designed to block proxy promotion. fileciteturn57file0turn57file1turn67file3

4. **“Warp metrics exist, but sourcing requires exotic matter; do you claim a sourcing method?”**  
   Response: No; the repo’s stakeholder doc explicitly states warp remains long-horizon foundational physics and that scalable negative-energy distributions for warp sourcing are not established. This aligns with Alcubierre/Natário and QI-driven critiques. fileciteturn67file3turn6view0turn4search39turn5search34

5. **“Casimir energy is real but gravitationally tiny; are you implying it scales?”**  
   Response: The defensible claim is metrology + constraint modeling, not macroscopic sourcing. Casimir and DCE are referenced as real phenomena, but the document explicitly separates that from warp sourcing. fileciteturn67file3

6. **“Your theta and T00 are chart/observer/normalization dependent; where is that declared?”**  
   Response: The CL4 guardrail map and runtime gap analysis explicitly call out chart/observer/normalization as required metadata; strict mode can fail when contract metadata is missing. fileciteturn53file1turn67file0turn57file1

7. **“Pfenning–Ford suggests Planck-scale wall thickness constraints for Alcubierre under QIs—how do you address that?”**  
   Response: We treat this as a hard-barrier citation justifying conservative gates, not as something the software ‘solves.’ The stack is positioned to make those constraints explicit in schedules and provenance, not to claim escape. citeturn5search34turn6view0 fileciteturn67file3turn60file0

8. **“Van Den Broeck reduces total energy, but doesn’t remove deeper issues—are you overselling VdB?”**  
   Response: The repo requires derivative evidence for VdB region-II claims and flags the path as partial/conditional; this is consistent with VdB being an energy-budget reshaping, not a solved sourcing/stability theory. fileciteturn53file1turn57file1turn6view1

9. **“Your TS_ratio thresholds appear inconsistent across artifacts; is the governance internally consistent?”**  
   Response: This is a real presentability risk: `WARP_AGENTS.md` encodes TS_ratio ≥ 1.5 while the viability logic can enforce a much higher default depending on context; this must be reconciled before external briefings. fileciteturn66file0turn57file0turn65file0

10. **“Why mix lunar logistics narrative with warp physics at all?”**  
   Response: The repo’s own stakeholder framing uses lunar logistics as a contrast class to prevent misallocation of capital: lunar infrastructure is transport-heavy and incremental; warp bubbles are long-horizon physics. This is a helpful anti-overclaim narrative when used carefully. fileciteturn67file3

## 90-Day Action Plan to Upgrade Readiness

Each item is designed to **increase presentability and credibility** without granting false certification.

1. **Unify threshold semantics across spec + code**  
   Owner: physics lead + software lead  
   Artifact: “Constraint Threshold Canon” doc + updated config in `WARP_AGENTS.md` and `tools/warpViability.ts`  
   Acceptance test: one test asserting the same TS_ratio_min is enforced/declared across spec, runtime, and UI. fileciteturn66file0turn57file0turn57file1  
   Stakeholder impact: removes “governance inconsistency” objection.

2. **Publish a “Public Claims Boundary Sheet” as a required deck appendix**  
   Owner: comms + scientific reviewer  
   Artifact: 1-page claims boundary PDF mirrored in repo docs  
   Acceptance test: CI check that slides/brief contain the disclaimer text block. fileciteturn67file3  
   Impact: prevents accidental FTL/sourcing overclaim.

3. **Lock down chart/observer/normalization contract fields as mandatory in strict mode**  
   Owner: GR engineer  
   Artifact: stricter contract schema in pipeline + viability  
   Acceptance test: strict-mode tests fail when any of (`observer`, `normalization`, `unit system`, `chart contract`) is missing. fileciteturn67file0turn57file1turn58file5  
   Impact: academic trust; reduces “DERIVED ambiguity.”

4. **Add an analytic-special-case regression pack (Alcubierre + Natário)**  
   Owner: numerical relativity engineer  
   Artifact: test fixtures with known analytic profiles; expected sign/shape checks for `T00`/θ under declared conventions  
   Acceptance test: reproduce Alcubierre relations (e.g., θ ↔ TrK under the repo’s chosen convention) within tolerance. citeturn6view0turn4search39  
   Impact: upgrades confidence from “derived” toward “verified under special cases.”

5. **Make QI applicability explicit: curvature window + observer worldline binding**  
   Owner: QFT-in-curved-spacetime advisor  
   Artifact: documented rule: when `τ` is not “small vs curvature radius,” the QI gate reports “NOT APPLICABLE” instead of pass/fail  
   Acceptance test: proof pack contains curvature-window status and blocks “certified” tier when unknown. fileciteturn67file0turn60file1  
   Impact: prevents incorrect QI claims; increases defensibility.

6. **Formalize “quantum interest” repayment model boundary**  
   Owner: QI/QEI specialist  
   Artifact: a short repo note: “repayment model is heuristic until bound-mapped,” with citations to quantum-interest work and explicit non-guarantee language  
   Acceptance test: UI labels “repayment heuristic” unless a mapped theorem is selected. citeturn7search2turn7search0  
   Impact: addresses “strobing loophole” skepticism proactively.

7. **Add “versioned evidence packs” to every external briefing**  
   Owner: program manager  
   Artifact: auto-generated bundle containing: repo commit hash, proof pack export, first-fail report, and claim-tier snapshot  
   Acceptance test: one command outputs a deterministic bundle with checksum; CI verifies determinism. fileciteturn57file0turn58file3turn58file7  
   Impact: increases investor/government trust via reproducibility.

8. **Create a dedicated “Audience Mode” in the UI (Public vs Academic)**  
   Owner: front-end lead  
   Artifact: UI toggle suppressing speculative panels, hiding internal terminology like “certified,” and showing only boundary-safe outputs publicly  
   Acceptance test: snapshot tests for each mode; public mode cannot surface proxy as geometry-derived. fileciteturn53file1turn61file0turn58file7  
   Impact: reduces misinterpretation risk.

9. **Independent academic pre-brief (closed) with a structured review rubric**  
   Owner: PI + external collaborators  
   Artifact: reviewer packet: CL4 map, runtime gap analysis, test list, and “open questions”  
   Acceptance test: written feedback logged and mapped into issues with resolution status. fileciteturn53file1turn67file0turn66file0  
   Impact: upgrades credibility before broader stakeholder exposure.

10. **Reframe lunar content as “capital allocation hygiene,” not “warp roadmap”**  
   Owner: strategy + comms  
   Artifact: short addendum clarifying the lunar section is a contrast case to prevent warp overclaim and to contextualize near-term transport work  
   Acceptance test: deck language explicitly separates lunar logistics from warp R&D. fileciteturn67file3  
   Impact: improves acceptance by government/industry without implying capability.
