# Helix Ask Equation Ask Architecture Adjudication

## Executive Conclusion

**Recommendation (unambiguous):** Adopt **Deterministic-First Selector Authority with a hard state lock and a single unified degrade path** ("Selector-Authoritative, Non-Mutating Post-Lock"). This means: once an equation primary anchor is selected *in-family* with high confidence and the selector lock is committed, **no downstream gate is allowed to change content** (only formatting/hygiene), and any remaining uncertainty must route through **one** degrade behavior that **preserves the selected anchor** while asking the minimal clarifying question. 

**Why this is the best fit to the Helix Ask ladder:** it aligns with the ladder's explicit staged model (intent -> retrieval -> arbiter -> synthesis -> gates) and removes the currently observed contradiction where retrieval/slot coverage and selector confidence can both be "good" yet a late ambiguity gate forces a low-utility clarify fallback. 

**Key falsifiable prediction:** enforcing selector authority + non-mutating post-lock will **reduce "clarify:ambiguity_gate after selector lock"** events materially while increasing **primary_anchor_accuracy** and keeping **p95 <= 30s** for equation asks.

## System Overview and Failure Analysis

### System Overview

**Facts (repo-grounded):**
Helix Ask's documented ladder is an end-to-end staged pipeline with (among other steps) intent routing, retrieval (multi-channel), evidence/slot coverage gates, an arbiter decision, synthesis, and final obligation + "platonic" gates before packaging the final answer.

The ladder explicitly calls out:
- Multi-channel retrieval using channels like lexical, symbol, fuzzy, path, and a tracked-file scan lane, followed by fusion/selection.
- Downstream gating after synthesis, including an obligation gate (repo evidence/citations enforcement) and additional "platonic gates" (definition lint, physics lint, coverage/belief/rattling).

The flow doc describes an operational path where a client builds a grounded prompt from question + context, sends it to `/api/agi/ask`, then response cleanup occurs and UI persists state. It also documents optional two-pass synthesis controlled by `HELIX_ASK_TWO_PASS`.

The agent action policy maps gate outcomes to next actions (e.g., if "ambiguity high," the next action is `ask_slot_clarify`; if evidence is sufficient, render a scientific micro-report; if budgets are exhausted, stop and return best scaffold).

**Inferences (architecture interpretation):**
- The "equation ask" behavior is a specialized sub-path within (or layered across) ladder steps 7-12: it depends on retrieval/slot coverage but also introduces an equation selection step that behaves like a deterministic arbiter inside the broader arbiter/synthesis stages.
- Since the flow supports optional two-pass synthesis, and the ladder supports "repair" and multiple gates, the equation pipeline likely experiences multiple post-selection transformations, creating room for conflicts unless state authority rules are enforced.

### Failure Analysis

**Facts (from the 2026-03-17 falsifiability brief):**
The decision brief documents a repeated failure signature: **retrieval and slot coverage can succeed** (example: slot coverage ratio reaching 1), yet the end result still collapses to clarify/fallback behavior.

It also records a representative job where the selector found a strong in-family anchor and committed the lock:
- `equation_selector_primary_confidence = 86.32`
- `equation_selector_primary_family_match = true`
- `equation_selector_state_lock_committed = true`
yet the terminal outcome still became `fallback_reason_taxonomy = clarify:ambiguity_gate`.

The same brief highlights *explicitly conflicting signals* downstream of selection:
- `equation_quote_contract.reason = equation_relevance_missing`
- `equation_relevance_reason = weak_domain_signal`
despite high selector confidence and family match.

It also flags latency/loop pressure as a contributor (example: long elapsed time, stage timing hotspots).

**Facts (runtime constraints relevant to the p95 <= 30s requirement):**
The runtime constraints doc explains that on Replit CPU-only inference, observed throughput is about 3-4 tokens/sec, concurrency is effectively serialized, and long generations can consume minutes, meaning tail latency is strongly driven by token budgets and multi-stage loops.

**Facts (limitations in this adjudication's code visibility):**
The ladder and flow docs both name `server/routes/agi.plan.ts` as a key implementation file, but the connector fetch returns empty content for that file in this environment, preventing line-level validation of current selector/gate wiring from code.

**Inferences (root cause):**
- The decisive failure mode is **post-selection gate conflict**: a late ambiguity/relevance gate can override (directly or indirectly via fallback routing) a committed primary equation selection-even when the selector is confident and in-family-creating "utility collapse" without retrieval failure.
- The presence of both a selector lock and a later "equation relevance missing / weak domain signal" indicates at least **two partially independent scoring systems** (selector confidence vs ambiguity/relevance) that lack a clear authority hierarchy.
- This is structurally consistent with a system that lacks a "single source of truth" contract: state is produced (selector), then interpreted or re-decided (gates / renderer), and final routing can contradict earlier decisions.

## Methodology Options and Comparative Evaluation

### Option Comparison Table

| Option | What it changes | Strengths | Weaknesses | Fit to constraints (summary) | Most important falsifier |
|---|---|---|---|---|---|
| Deterministic-First Selector Authority (hard lock) | Make deterministic selector the source of truth; post-lock stages are non-mutating; ambiguity checks move pre-lock or become non-overriding | Directly addresses the documented "selector lock committed yet clarify fallback" conflict; improves explainability (one authority); supports "prevent cross-topic substitution" via family constraints | Risk: if selector is wrong, fewer chances to "correct" via late gates; requires careful pre-lock ambiguity handling | Strong: meets **state continuity**, **post-selector style-only**, **single degrade path**, **cross-topic substitution prevention** | If clarify-after-lock does *not* drop materially, or primary accuracy doesn't improve vs baseline |
| Dual-Path Arbiter (parallel outputs) | Run two pipelines (current vs selector-authoritative) and pick winner by rubric | Can reduce risk of "hard lock wrong selection"; offers safety net while transitioning | Higher latency + complexity; risks p95 <= 30s; can introduce non-determinism in arbitration if rubric incomplete | Medium: risks **p95**, risks **single degrade path** unless carefully designed | If p95 rises above target or arbitration disagreement rate is high |
| Learned Calibration Layer | Keep deterministic selector but calibrate ambiguity/relevance thresholds using trace outcomes | Can reduce false downgrades by aligning gate thresholds with real outcomes; scales over time | Requires training data/labels; can be brittle under distribution shift; harder to explain than deterministic rules | Medium-strong long-term, but not the fastest "stop the bleed" fix | If calibrated gate still downgrades high-confidence in-family anchors at similar rates |
| Minimal threshold tuning only | Adjust ambiguity/relevance gate thresholds without architectural authority changes | Lowest engineering cost | Least likely to address structural contradiction; may oscillate as prompts diversify | Weak: does not ensure **state continuity** or post-selector non-mutation | If failures recur as prompt distribution shifts |

**Conclusion from comparison:** Option A is the only one that *directly* eliminates the structurally documented failure signature (selector lock committed yet ambiguity fallback) while satisfying the non-hardcoding and continuity constraints.

## Recommended Architecture

### Summary of the Architecture

**Name:** Selector-Authoritative, Non-Mutating Post-Lock (with Single Degrade Path)

**Core rule:** For equation asks, the system must establish a **single authoritative state object** ("EquationAskState") that is produced by the selector and becomes immutable once committed. After commit, downstream stages may change **presentation only** (formatting, trimming debug text, citation formatting), but **must not**:
- change the primary equation,
- replace the primary family,
- substitute another topic as primary,
- or route to a clarify fallback that omits the selected anchor.

This directly targets the mismatch documented in the brief (high selector confidence + family match + committed lock, yet clarify fallback).

### Where to Put Ambiguity and Relevance Decisions

**Design decision:** Ambiguity/relevance is allowed to prevent *commit*, not to override *after commit*.

Concretely:
- If ambiguity is high, invoke the policy action `ask_slot_clarify` (agent policy) and do not commit the lock.
- If selector confidence is high and family match is true, commit the lock and skip content-changing ambiguity downgrade routing.

### Single Unified Degrade Path

**Single degrade path requirement:** Once the system decides it must degrade, it must do so via *one* deterministic "degrade renderer" that:
- preserves the best available anchor (even if incomplete),
- states exactly what is missing,
- asks the minimal clarifying question to unblock,
- and provides "next evidence" targets if repo evidence is required.

This matches the agent policy's scientific micro report contract for partial evidence or exhausted budgets and removes cascading repairs that increase latency and drift risk.

### Runtime and p95 <= 30s Implications

Given documented CPU throughput and serialized concurrency in Replit, hitting p95 <= 30s requires strict control over token budgets and avoidance of multi-pass and cascading repairs for equation asks.

Therefore, in the equation ask path:
- Default to **single-pass** synthesis (disable two-pass unless explicitly enabled and still within strict time budget).
- Enforce a hard SLA clock: if remaining time < threshold, skip optional reranks/repairs and degrade deterministically with the committed anchor (or pre-commit clarify). This aligns with the agent policy stop conditions and budget exhausted behavior.

## Why This Fits the Helix Ask Ladder

This section maps the recommendation to the requested ladder stages while staying coherent with the repo's ladder document.

### Intent contract

**Facts:** The ladder begins with obligations (repo evidence required, citations required) and intent routing (domain/tier/topic tags).

**Implementation mapping:** Add an equation ask intent contract sub-decision at intent time:
- Determine whether the user is asking for an equation, a mechanism+equation, or a symbol/path ask.
- Set `answerModeCandidate = equation` and attach a strict budget (max tokens/time) early to support p95 target.

### Retrieve

**Facts:** Retrieval is multi-channel and fused; docs-first phases exist for certain repo-required topics.

**Implementation mapping:** Keep broad retrieval coverage by not narrowing channels, but collect retrieval into a typed candidate set used by the selector.

### Candidate typing

**Facts:** The ladder includes evidence eligibility and slot coverage checks; slot coverage can pass while utility still fails, implying slot coverage is not sufficient for equation quality.

**Implementation mapping:** Introduce explicit equation-candidate typing:
- `equation_anchor` candidates (contains explicit equation form / derivation anchor)
- `mechanism_explanation` candidates
- `symbol_definition` candidates
- `off_topic` candidates

This reduces the chance that broad retrieval yields cross-topic substitution as primary by making the selector operate on typed candidates, not raw snippets.

### Deterministic selection

**Facts:** The failure signature is specifically that selector finds a strong in-family anchor but gates override.

**Implementation mapping:** Make deterministic selection authoritative:
- The selector outputs: `primary_key`, `family_id`, `confidence`, `family_match`, `supporting_refs`, and a minimal `symbol_map` if relevant.
- Commit immutably: `equation_selector_state_lock_committed=true`.

### Renderer

**Facts:** Flow describes grounded prompt building and response cleanup after `/api/agi/ask`; optional two-pass exists.

**Implementation mapping:**
- Renderer must consume only the committed EquationAskState for content.
- Post-processing is limited to: echo removal, formatting normalization, and debug-hygiene stripping (style-only).

### Gates

**Facts:** Ladder includes final obligation gate and platonic gates; agent policy includes action mapping for ambiguity-high and evidence-sufficient.

**Implementation mapping:**
- Gates may *validate* invariants (citations exist if required; no debug leak; output adheres to format).
- Gates must not override the locked primary selection with a different content plan.
- Ambiguity gate becomes a **pre-commit gate**; after commit, it may at most trigger the unified degrade renderer without unselecting the anchor.

### Degrade

**Facts:** A one-degrade path and no cascading repairs after selector lock is a key stabilizer for p95 and drift.

**Implementation mapping:** One deterministic degrade renderer:
- If pre-commit ambiguity: clarify (ask one slot-local question) + show candidate anchors.
- If post-commit budget exceeded: answer minimally using committed anchor + ask one follow-up + list next evidence targets.

## Falsification Plan

This plan is aligned to the repo's registered metrics approach for equation tuning and readiness loops.

### Hypotheses

**H1 (authority fixes gate conflict):** Enforcing selector-authoritative policy for equation asks reduces clarify fallback after lock and increases primary anchor accuracy.

**H2 (gate calibration respects selector signals):** If ambiguity/relevance gates are made non-overriding post-lock, false downgrades for high-confidence in-family anchors drop.

**H3 (time-bounded single degrade path improves p95):** Hard-bounding equation ask runtime and preventing cascading repairs after lock yields p95 <= 30s and reduces drift.

### Metrics

Use core metrics:
- `primary_anchor_accuracy`
- `primary_family_match_rate`
- `symbol_target_hit_rate` (specific prompts)
- `clarify_fallback_rate`
- `anchor_drift_rate` (renderer primary != selector primary)
- `artifact_leak_rate`
- `p95_latency` (equation asks)

Add:
- `post_lock_gate_override_rate`: fraction of runs where a post-lock gate changes answerMode to clarify/fallback.
- `single_degrade_path_compliance`: fraction of degraded runs that used the unified renderer.

### Thresholds and promotion criteria

- `primary_anchor_accuracy`: >= +10% vs baseline.
- `clarify_fallback_rate`: >= 40% reduction vs baseline.
- `artifact_leak_rate`: no regression.
- `p95_latency`: <= 30s for equation asks.

Augment with:
- `post_lock_gate_override_rate <= 1%` (target 0%).
- `anchor_drift_rate <= 1%` for committed selections.

### Explicit falsifiers

A hypothesis is falsified if any of the following holds on the same prompt ladder pack and seeds:

- **Falsifier for H1:** `clarify_fallback_rate` does not drop meaningfully (for example, <10% reduction) or `primary_anchor_accuracy` does not improve.
- **Falsifier for H2:** high-confidence + family-match + lock still produces equation relevance missing / ambiguity gate at similar rates.
- **Falsifier for H3:** `p95_latency > 30s` after enforcing time budgets and single-pass behavior.

### Experiment harness

Run the equation benchmark suite and matrix harnesses already defined in the readiness loop (Loop B5/B6), comparing baseline (V0) vs selector-authoritative (V1).

## Implementation Blueprint

### Patch-level changes

**Important constraint:** because `server/routes/agi.plan.ts` content could not be retrieved (empty content returned), the below is a patch-level blueprint by *module intent* and *observable ladder contracts*, not line-level edits. This uncertainty can be resolved by making `agi.plan.ts` accessible to the connector or providing a smaller extracted subset.

#### Likely modules/functions to change

1) **Plan/arbiter stage in `server/routes/agi.plan.ts`**
- Add a dedicated equation ask sub-pipeline that creates `EquationAskState` and enforces the authority hierarchy:
  - `preCommitAmbiguityCheck(state) -> (commitAllowed | clarifyNeeded)`
  - `commitEquationLock(state)` sets `equation_selector_state_lock_committed=true`
- Ensure that any later gating uses `EquationAskState` as read-only input, not a trigger for rerouting content.

2) **Equation selector module**
- Produce explicit fields already referenced in telemetry (primary key, confidence, family match, lock committed), and add:
  - `selector_decision_id` (stable hash of decision inputs)
  - `selector_support_set_hash` (hash of supporting evidence IDs)
- Guarantee prevent cross-topic substitution by requiring the primary is within the allowed family when `family_match=true`; else it can only be secondary mention, not primary.

3) **Renderer**
- Implement a renderer that takes `EquationAskState` and a render profile (broad/mid/specific) and emits:
  - equation statement
  - symbol map (when requested)
  - mechanism paragraph (mid)
  - required citations/proof pointers (repo-required)
- Post-render cleanup must be style-only.

4) **Gates**
- Convert ambiguity gate to:
  - **pre-commit gate** (may block lock)
  - **post-commit invariant gate only** (may not reroute to clarify that discards committed content)
- Add deterministic gate that checks: `renderer_primary_key == selector_primary_key` whenever lock is committed (anchor drift detector).

5) **Unified degrade**
- One function: `renderEquationDegrade(state, reason)` used by all equation-ask degrade exits.
- It must respect policy contracts: if ambiguity high, ask a slot-local clarify; if budget exhausted, return best scaffold.

### Rollout plan

**Shadow (V1-shadow):**
- Run new selector-authoritative pipeline in parallel but do not affect user answer.
- Log would-have output metrics: drift, gate overrides, predicted latency.

**Soft enforce (V1-soft):**
- Enforce post-lock non-mutation but allow one emergency fallback if obligation gate fails.
- Keep old path as fallback only when invariant violation occurs.

**Full enforce (V1):**
- Remove content-changing post-lock gates for equation asks.
- Require unified degrade path for all degradation.

These rollout phases align with contract batteries, variety batteries, and benchmark sweeps before promotion.

### Telemetry additions

Add fields to make failures explainable and falsifiable:

- `equation_state_version`
- `equation_lock_commit_ms` (time to commit)
- `post_lock_gate_override_attempted` (bool)
- `post_lock_gate_override_blocked` (bool)
- `degrade_path_id` (must be single value for equation asks)
- `time_budget_remaining_ms_at_commit`
- `render_profile` = broad|mid|specific
- `cross_topic_primary_blocked_count`

These directly measure the problem class documented: lock committed but overridden.

## Risks, Mitigations, and Example Outputs

### Risks and mitigations

**Risk: selector chooses the wrong primary anchor and lock prevents correction.**
Mitigation: shift ambiguity checks pre-commit; if confidence/family match is not high enough, do not commit-use `ask_slot_clarify`.

**Risk: p95 latency regression due to extra machinery.**
Mitigation: remove cascading post-lock loops and enforce strict single-pass budgets.

**Risk: broad prompts remain under-specified and produce brittle anchors.**
Mitigation: broad prompts should default to best family-level anchor + mechanism explanation + one clarification question, not full fallback that discards anchor value.

**Risk: obligation gate (repo citations) forces clarify even after lock.**
Mitigation: treat missing citations as an invariant failure that triggers unified degrade preserving anchor while explicitly naming missing evidence and next targets.

### Example expected outputs

These are illustrative format behaviors, not prompt-specific hardcoding.

#### Broad conceptual prompt

**User ask:** "What is the idea behind the DP collapse equation family?"

**Expected output shape (selector-authoritative):**
- One-paragraph conceptual summary of what the family models (mechanism-level).
- One canonical equation anchor (family-level, not over-specific).
- One counterfactual sentence (falsifiability posture).
- One clarification question if family has multiple sub-forms.
- Sources with repo pointers when repo evidence is required.

#### Mid mechanism + equation prompt

**User ask:** "Explain the mechanism and give the equation; show how each term maps to the mechanism."

**Expected output shape:**
- Mechanism first (2-3 short paragraphs).
- Equation block (single primary).
- Term-by-term mapping.
- One falsifiable check sentence.
- Secondary equations may be variants, never primary substitution.

#### Specific path/symbol ask

**User ask:** "In the selected DP collapse derivation, what does symbol lambda mean on the primary line?"

**Expected output shape:**
- One-sentence answer for symbol meaning.
- One sentence tying symbol to equation meaning.
- One pointer to definition path/section if available; if missing, unified degrade with likely interpretation and exact next evidence targets.

## Decision Scorecard

**Go / No-Go decision:** **GO** for implementing **Deterministic-First Selector Authority with hard lock + single degrade path** as the system's equation ask architecture.

**Go criteria (must all pass):**
- `p95_latency <= 30s` for equation asks.
- `primary_anchor_accuracy >= +10%` vs baseline.
- `clarify_fallback_rate >= 40% reduction` vs baseline.
- `anchor_drift_rate <= 1%` when lock committed.
- `post_lock_gate_override_rate <= 1%` (target 0%).
- No regression in `artifact_leak_rate`.

**No-Go criteria (any triggers rollback):**
- `p95_latency > 30s` after full enforce.
- `primary_anchor_accuracy` does not improve meaningfully (for example, <+5%) or declines.
- Clarify-after-lock persists (post-lock override rate remains >5%), indicating authority rules were not truly enforced.

**Final, unambiguous recommendation:** Implement **Selector-Authoritative, Non-Mutating Post-Lock with a Single Unified Degrade Path** (Option A) as the best reasoning methodology for the Helix Ask reasoning ladder and the equation ask reliability objective.
