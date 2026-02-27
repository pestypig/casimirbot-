# Forward-Facing Plan for Helix Ask: Targeted Phase Update With a Falsifiable Alignment Coincidence Gate

## Executive thesis

The core Helix Ask architecture is directionally correct: a deterministic workflow spine with bounded bypass lanes and verification gates, plus a readiness discipline that treats quality as measurable contracts rather than vibes. The observed failures (repo pipeline misroutes, ambiguity "cavity" drift, ideology narrative contract misses, and Tree Walk/debug leakage) are consistent with **execution gaps** in *prompt ↔ evidence coincidence* and *output hygiene*, not a broken strategy. fileciteturn46file0L1-L1 fileciteturn70file0L1-L1

The forward plan is therefore **not a replan**. It is a **phase update** that adds a first-class, falsifiable **Alignment Coincidence Gate** (real-vs-decoy margin + rewrite stability + contradiction checks + calibrated confidence lower bound), and then tightens three "known-fail" areas already represented in the codebase as explicit contracts:

- **Evidence/contract plumbing**: extend the existing "proof packet" + typed fail-reason taxonomy so alignment and bypass are auditable artifacts, not implicit behavior. fileciteturn42file2L1-L1 fileciteturn42file3L1-L1
- **Ambiguity handling**: make ambiguity outcomes deterministic and measurable (clarify vs fail-closed vs open-world-bypass) and tie them to the new alignment gate. fileciteturn56file2L1-L1
- **Output hygiene**: harden debug leakage stripping (Tree Walk variants, "Execution log", "Ask debug", etc.) and make telemetry leaks a first-class strict failure category. fileciteturn49file0L1-L1 fileciteturn72file6L1-L1

Success is defined by scorecard deltas (route accuracy and leak rates) and a verified Casimir pass discipline, not narrative confidence. fileciteturn70file1L1-L1 fileciteturn58file17L1-L1

## No-Replan vs Replan decision

The repo already encodes "keep the spine, tighten the gates" as its operating philosophy: staged rollout, explicit thresholds, typed failure categories, and reversible feature flags. fileciteturn42file3L1-L1 fileciteturn72file6L1-L1

**Verdict: No full replan now.** The next build should be a targeted phase update, because:

- There is already an explicit contract direction for structured evidence-to-claims via a proof packet, with typed fail reasons including telemetry leakage and missing scientific-method slots. fileciteturn42file2L1-L1
- There is already a known runbook discipline for proving the ask lane actually invoked the HTTP LLM provider (OpenAI-compatible), and for gating readiness by a Casimir verify pass. fileciteturn70file1L1-L1
- There is already a regression harness that names the exact ambiguity family ("cavity") and ideology narrative "Technical notes" leakage expectations-meaning the system has testable intent-level and UX-level contracts to expand. fileciteturn56file2L1-L1

**Replan trigger criteria (explicit):** replan only if, after enforcing the alignment coincidence gate + hygiene hardening, **route accuracy does not move measurably toward target** on the existing sweep/regression infrastructure, or if strict telemetry leak rate remains non-zero under "strict-ready" constraints. fileciteturn70file0L1-L1 fileciteturn72file6L1-L1

## Current-state map and what is missing

### What already exists and should remain the backbone

The repo has strong "engineering truth" primitives that align with the plan direction:

- **Proof packet + structured answer contract (v1)** with typed failure taxonomy, including `SCIENTIFIC_METHOD_MISSING_SLOT` and `TELEMETRY_LEAK_IN_ANSWER`, plus deterministic citation rendering from evidence IDs. fileciteturn42file2L1-L1 fileciteturn42file3L1-L1
- **Runaway/debug artifact stripping** that already recognizes headings like "Tree Walk", "Execution log", "Ask debug", and "Context sources" as removal markers. fileciteturn49file0L1-L1
- **Platonic gates** that already operationalize "coverage", "belief", and "rattling" (drift) concepts as measurable gateable summaries. fileciteturn46file1L1-L1 fileciteturn46file0L1-L1
- **Strict fail-reason ledger** that deterministically categorizes failures into evidence/bridge/runtime contract buckets, including telemetry leak classification as runtime-contract. fileciteturn72file6L1-L1
- **A regression harness** that already encodes the exact failure families your phase update targets: repo pipeline routing, ambiguity ("cavity"), and ideology narrative "Technical notes" suppression. fileciteturn56file2L1-L1
- **A routing + HTTP/provider smoke discipline** that determines whether Helix Ask's `/api/agi/ask` actually called the provider and is eligible for decision-grade evaluation, plus Casimir verify as a hard gate. fileciteturn70file1L1-L1 fileciteturn58file17L1-L1

### What is missing in a "first-class contract" sense

The gaps are not conceptual-they are contract-shaped:

- **Missing: a prompt ↔ evidence coincidence gate** that can falsify "the model made weak evidence look relevant," using real-vs-decoy comparisons and perturbation stability. (Rattling exists, but it is not the same as "coincidence vs decoy" and does not directly test retrieval alignment under ambiguity.) fileciteturn46file1L1-L1
- **Missing: an explicit open-world bypass mode** that is *measured* and *declared* (in debug + artifacts), rather than inferred indirectly from intent domain defaults. fileciteturn42file2L1-L1
- **Incomplete: debug leakage defense-in-depth.** Stripping already exists, but the presence of multiple markers and variants means you need both (a) stricter stripping (more patterns) and (b) proactive prompt/runtime forbiddance and strict fail reasons when residue remains. fileciteturn49file0L1-L1 fileciteturn72file6L1-L1

## Target architecture and data contracts

### Architecture intent

Keep the current architecture philosophy: **deterministic spine**, bounded optional agentic modules, and **gates that turn qualitative risks into logged pass/fail decisions**. The new gate is not a philosophical flourish; it is an engineering mechanism that answers a falsifiable question:

> **Is selected context measurably more aligned to the prompt than a plausible decoy, and is that alignment stable under small prompt rewrites?**

This is the "ambiguity cavity" fix: ambiguity is no longer "coping resort"; it becomes a measurable failure mode with deterministic behaviors and artifacts. fileciteturn56file2L1-L1

### Core gate definition

Adopt (and instrument) the falsifiable gate you proposed:

- Null hypothesis (H0): selected context is not more aligned than decoy context.
- Alternative (H1): selected context is significantly more aligned than decoy context, stable across rewrites.

**Pass/Fail rule (initial thresholds; to calibrate):**

- `coincidence_margin >= 0.18`
- `stability_3_rewrites >= 0.55`
- `contradiction_rate <= 0.05`
- `lower95_p_align >= 0.75`

These thresholds should be treated as **promising** defaults (not yet proven) and moved only via logged calibration using your existing sweep infrastructure and strict-ready ledger visibility. fileciteturn70file0L1-L1 fileciteturn72file6L1-L1

### Typed schemas

Below are the forward-facing schemas (TypeScript-style) that "bring it all together" as a contract. The repo already uses a Zod-heavy style for hard schemas in key areas (proof packet), so these should follow that pattern for strict validation and typed artifacts. fileciteturn42file2L1-L1

```ts
/** Meaning distribution over plausible intents/spans. */
export type MeaningMap = {
  schemaVersion: "meaning_map/v1";
  question: string;
  // For ambiguity auditability: "what span is ambiguous?"
  targetSpan?: string;
  // Candidate meanings (mutually-exclusive-ish).
  candidates: Array<{
    id: string;                 // e.g. "cavity:dental", "cavity:physics"
    description: string;        // short explanation
    p: number;                  // normalized probability
    rationaleTags?: string[];   // lightweight, not chain-of-thought
  }>;
  ambiguityEntropy: number;     // measured from p distribution
};

/** Planner output: obligations + policy + retrieval plan. */
export type PlanPacket = {
  schemaVersion: "plan_packet/v1";
  question: string;
  intentId: string;
  intentDomain: "general" | "repo" | "hybrid" | "falsifiable";

  // Deterministic obligations / contract sections.
  obligations: string[]; // e.g. ["definitions","hypothesis","anti_hypothesis","falsifiers","uncertainty"]

  requiresRepoEvidence: boolean;
  allowOpenWorldBypass: boolean;

  // Replayable retrieval plan.
  retrieval: {
    realQueries: string[];
    decoyQueries: string[];
    topK: number;
  };

  // Gate policy knobs for this run.
  gates: {
    alignmentCoincidence: "shadow" | "enforce";
    outputHygiene: "shadow" | "enforce";
    strictReady: boolean;
  };
};

/** Alignment coincidence gate result: auditable falsifiable metrics. */
export type AlignmentGate = {
  schemaVersion: "alignment_gate/v1";
  alignment_real: number;        // [0,1]
  alignment_decoy: number;       // [0,1]
  coincidence_margin: number;    // real - decoy

  stability_3_rewrites: number;  // overlap in top evidence across 3 rewrites
  contradiction_rate: number;    // contradictions among selected evidence claims
  lower95_p_align: number;       // calibrated, conservative lower bound

  decision: "PASS" | "BORDERLINE" | "FAIL";

  // For measurement + debugging.
  evidence: {
    realEvidenceIds: string[];
    decoyEvidenceIds: string[];
  };
};

/** Deterministic reasoning contract consumed by final synthesis. */
export type ReasoningPacket = {
  schemaVersion: "reasoning_packet/v1";
  question: string;

  definitions: string[];
  baseline?: string;

  hypothesis?: string;
  antiHypothesis?: string;

  falsifiers: string[];

  uncertaintyBand: "low" | "medium" | "high";
  claimTier: "diagnostic" | "reduced-order" | "certified";

  openWorldBypass: boolean;
  openWorldBypassReason?: string;

  // For claim-evidence binding (pairs naturally with proof packet).
  claimLedger: Array<{
    id: string;
    text: string;
    evidenceIds: string[];
    tier: "fact" | "inference" | "assumption" | "hypothesis";
  }>;
};
```

**Proven vs promising vs speculative classification for this architecture layer:**

- **Proven (in-repo):** ProofPacket/contract style, typed fail reasons, deterministic artifact discipline. fileciteturn42file2L1-L1 fileciteturn42file3L1-L1
- **Promising (next build):** AlignmentGate (real-vs-decoy + rewrite stability) as a first-class policy. fileciteturn56file2L1-L1
- **Speculative (optional enhancement):** swapping token/slot overlap scoring for a dedicated entailment model or LLM-graded entailment with calibration; this should remain behind a flag until its own scorecard shows net improvement without new failure classes.

## File-by-file implementation plan and exact patch order

This patch order is designed to be **safely additive first**, then enforceable, while minimizing the chance of breaking the existing fallback behavior and while producing auditable artifacts at every step. fileciteturn42file3L1-L1

### Patch set that introduces the Alignment Coincidence Gate

Create a new module and wire it in *before* final synthesis and *before* arbiter mode finalization, so ambiguity and misroute decisions happen with falsifiable evidence rather than post-hoc cleanup.

- **Add:** `server/services/helix-ask/alignment-gate.ts` (new)
  - Inputs: question, selected evidence candidates, decoy candidates, current intent profile, and any ambiguity target span.
  - Outputs: `AlignmentGate` object + decision.
  - Shadow-mode behavior first: compute + log, do not block.

- **Integrate into runtime:** `server/routes/agi.plan.ts` (existing orchestrator)
  - Insert the alignment gate right after retrieval candidate selection and before the final synthesis prompt assembly.
  - Ensure the gate result is written into the `debug` block and (when strict-ready is on) into the strict fail-reason ledger path if it produces a deterministic fail reason. fileciteturn72file6L1-L1

Because the repo already treats "proof packet" as the contract boundary between evidence and narration, the most robust integration is:

1) retrieval -> 2) alignment gate -> 3) build proof packet + reasoning packet -> 4) synthesis/narration -> 5) verification/hygiene. fileciteturn42file3L1-L1

### Patch set that hardens open-world bypass as explicit policy

Implement bypass as a declared, measured regime-not an implicit accident.

- **Update:** intent/bypass policy layer to add **`open_world_bypass_mode`**
  - `open_world_bypass=false` when repo evidence is required and alignment fails -> clarify/fail-closed.
  - `open_world_bypass=true` only when intent policy allows it and alignment fails -> answer must be provenance-labeled, no fake repo citations.
  - Log bypass frequency as a first-class metric and treat it as a controlled knob.

The repo already has structured contract primitives for "fail reasons" and "proof packet evidence IDs"; bypass must attach to those rather than float as undocumented behavior. fileciteturn42file2L1-L1 fileciteturn72file6L1-L1

### Patch set that fixes Tree Walk/debug leakage in depth

You already have a post-strip mechanism that recognizes "Tree Walk" and other sections as runaway markers. The problem is typically *variants* (colon headers, nested headings, mid-answer insertions, etc.) and *prompt-side incentives* that still cause the model to output debug-like blocks.

- **Update:** `server/services/helix-ask/answer-artifacts.ts`
  - Expand stripping rules to include:
    - `Tree Walk:` and `Tree Walk -` and `## Tree Walk` style headings.
    - "Execution log:" and other colon variants.
    - Mid-body occurrences when clearly in a debug block, not only trailing markers.
  - Preserve and merge `Sources:` lines as today, but only if they remain valid under evidence policy (repo/hybrid vs open-world). fileciteturn49file0L1-L1

- **Update (defense-in-depth):** strict runtime contract
  - If any forbidden debug markers survive stripping in strict-ready contexts, emit typed fail reason `TELEMETRY_LEAK_IN_ANSWER` (already in the typed fail bucket list) so this becomes a measurable ceiling, not a hidden annoyance. fileciteturn42file2L1-L1 fileciteturn72file6L1-L1

### Patch set that tightens ideology narrative contract adherence

The regression harness already encodes the intended ideology UX: narrative, plain-language default, no "Technical notes" unless explicitly requested. fileciteturn56file2L1-L1

The targeted improvement should be:

- Prefer deterministic narrative scaffolding for ideology answers (root->leaf chain + example + takeaway) in the ideology lane, and treat "Technical notes" mode as opt-in only.
- If ideology intent is selected but concept anchoring is missing/weak, the alignment gate should push to clarify, not drift into generic conceptual output.

This is best enforced by combining:
- alignment gate (is evidence actually ideology-tree-aligned?), with
- output hygiene (no technical notes unless explicit), and
- strict fail reasons when violated. fileciteturn72file6L1-L1

### Patch completion checklists per phase

Each phase must end with:

- **Tests:** run the existing evidence gate + artifact stripping suites (they already encode "telemetry leak" and "claim-citation linkage" expectations). fileciteturn72file6L1-L1 fileciteturn48file16L1-L1
- **Regression:** extend and run the Helix Ask regression script, especially the ambiguity "cavity" and ideology narrative cases. fileciteturn56file2L1-L1
- **Adapter verify:** keep the Casimir discipline (verdict PASS + certificate hash + integrityOk) and treat failures as hard stops for promotion claims. fileciteturn70file1L1-L1 fileciteturn58file17L1-L1

## Test plan, scorecards, and rollout strategy

### Tests to add or extend

The repo already has "contract-shaped tests"; the new gate should follow the same style.

- **Unit tests**
  - AlignmentGate math invariants: margin calculation, stability computation, contradiction-rate computation.
  - Decision thresholds: PASS/BORDERLINE/FAIL paths deterministic, with explicit fixtures.

- **Integration tests**
  - Arbiter decision behavior when alignment gate fails:
    - repo-required -> clarify/fail-closed
    - open-world-allowed -> bypass explicitly enabled
  This mirrors how strict-ready arbiter behavior is already tested with deterministic fail reasons. fileciteturn72file6L1-L1

- **Regression prompts**
  - Add explicit regression cases that expose the "coincidence vs decoy" failure, e.g. ambiguous terms that exist in both physics and UI contexts.
  - Keep and expand the existing ambiguity "cavity" case (because it is already the named failure family). fileciteturn56file2L1-L1

- **Leak-focused tests**
  - Add explicit `Tree Walk:` and `Execution log:` test fixtures to `stripRunawayAnswerArtifacts` tests.
  - Add a strict-ready test that ensures `TELEMETRY_LEAK_IN_ANSWER` is emitted if forbidden markers persist after cleanup. fileciteturn49file0L1-L1 fileciteturn72file6L1-L1

### Readiness scorecard updates

Your existing artifacts already track pass rates, intent correctness issues in specific families, and narrative "worst examples" that show drift and leakage signatures. fileciteturn70file0L1-L1

Add the following alignment-gate metrics to the readiness reports (shadow first, then enforced):

- `alignment_real`, `alignment_decoy`, `coincidence_margin`
- `stability_3_rewrites`
- `contradiction_rate`
- `lower95_p_align`
- and derived:
  - `alignment_gate_pass_rate` by prompt family
  - `open_world_bypass_rate` (explicit new metric)
  - `fail_closed_rate` (repo-required failures)

Promotion thresholds should be stated the same way the proof-packet RFC states them: "must be green across consecutive runs," with explicit p95 latency guardrails and explicit leak ceilings. fileciteturn42file3L1-L1

### Rollout phases

The proof-packet RFC already encodes a sane staged rollout template; reuse that structure for the AlignmentGate. fileciteturn42file3L1-L1

- **Phase 1: Safe additive (shadow mode)**
  - Compute AlignmentGate, log values, do not block.
  - Emit "debug alignment_gate" artifact for auditability.
  - Measure baseline coincidence margins and rewrite stability on existing packs.

- **Phase 2: Gated enforcement**
  - Enforce FAIL/BORDERLINE behaviors:
    - PASS -> grounded reasoning path
    - BORDERLINE -> clarify
    - FAIL + repo-required -> fail-closed / missing-evidence response
    - FAIL + open-world allowed -> explicit bypass mode (`open_world_bypass=true`, no repo citations)

- **Phase 3: Default-on**
  - Default alignment gate enforcement for repo/hybrid domains.
  - Keep escape hatch flags for emergency rollback.

**Rollback conditions (explicit):**
- Any increase in telemetry/prompt leak rate above the current hard ceiling (should remain 0 in strict-ready contexts). fileciteturn72file6L1-L1
- Any regression in "ideology narrative contract" forbidden markers (e.g., "Technical notes:") in ideology regression prompts. fileciteturn56file2L1-L1
- Any measurable increase in decorative citations or source-line corruption under the deterministic citation linkage tests. fileciteturn48file16L1-L1

## Risk register and final go/no-go

### Risks introduced by this phase update

- **R1: Latency inflation from paraphrase stability checks.**
  Mitigation: compute rewrite stability only on ambiguous/borderline cases (and/or behind a budget gate), and keep Phase 1 shadow-mode telemetry to quantify cost before enforcement.

- **R2: Over-rejection causing "clarify spam."**
  Mitigation: treat BORDERLINE as clarify, FAIL as fail-closed only when repo evidence is required; otherwise route to explicit open-world bypass. This preserves the existing generic fallback behavior as a supported product lane.

- **R3: False confidence if alignment scoring is poorly calibrated.**
  Mitigation: treat initial thresholds as "promising," coupled to a calibration step over the existing readiness harness; only promote once the scorecard shows route accuracy improvement without leak regressions. fileciteturn70file0L1-L1

- **R4: Debug leakage persists via new variants.**
  Mitigation: defense-in-depth-(1) expanded stripping patterns, (2) prompt-side forbiddance, and (3) strict-ready typed fail reason `TELEMETRY_LEAK_IN_ANSWER` for anything that survives. fileciteturn49file0L1-L1 fileciteturn42file2L1-L1

### Go/no-go recommendation

**GO for the targeted phase update** (alignment coincidence gate + explicit open-world bypass + hygiene hardening), because the repository already contains the essential discipline primitives: typed fail reasons, strict fail-reason ledgering, proof packet contracts, artifact stripping, and runbook-grade verification loops (including Casimir verification and provider routing attribution). fileciteturn42file2L1-L1 fileciteturn70file1L1-L1 fileciteturn70file0L1-L1

**NO-GO for any broader re-architecture until after** you have enforced (not just logged) the alignment gate and measured whether it moves route accuracy and leak ceilings to target. If it does not, the correct next step is redesign-not more tuning.
