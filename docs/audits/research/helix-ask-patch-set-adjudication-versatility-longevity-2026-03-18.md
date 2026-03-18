# Helix Ask Patch-Set Adjudication for Versatility and Longevity

## Executive Decision

**Primary recommendation: choose a combined strategy (4) — “Intent-typed routing + selector-lock continuity + runtime-budget discipline,” implemented as one coherent policy envelope.**  

This is the best next patch set because the observed failures span **broad routing**, **specific ambiguity handling**, and **budget/loop exhaustion**, and these three are already coupled in the code’s current “clarify/fail-closed” controller branches. The combined approach can fix broad + specific prompt classes **without weakening** the mid-equation wins (selector lock + anchor match + lock hash match), while preserving deterministic authority and a unified degrade path. citeturn1view2turn1view3

**Facts (from repo + your observations):**
- The current controller has explicit branches for **clarify (ambiguity gate)** and **fail-closed**, both of which can short-circuit synthesis and return a forced answer. citeturn1view3turn1view2
- The flow explicitly includes **format routing** (“Steps/Compare/Brief”) and an optional **two-pass synthesis** mode. citeturn3view0
- The agent policy already defines **deterministic next actions** for missing evidence/ambiguity and includes **per-action + global budgets**. citeturn3view1
- The equation benchmark currently shows **p95 latency ~60s** and multiple failures dominated by “missing required sections” and “no Sources line,” including a broad collapse-wave case timing out at ~60s. fileciteturn190file0L1-L1
- You observed: broad conceptual prompts failing with `fail_closed:stage0_code_floor_missing`, and specific prompts degrading into `clarify:ambiguity_gate` with selector lock not engaging (while mid equation prompts are strong).

**Inference (falsifiable):**
The broad and specific failures are not isolated bugs; they are symptoms of a single missing abstraction: **intent-typed policy that decides (a) which evidence floors are required, (b) when clarify is allowed, (c) when selector lock must engage, and (d) when to cut losses under budget**. The combined patch makes those policies explicit and testable.

## Why This Path Wins vs Alternatives

The key is **versatility + longevity**: you want to fix prompt-class behavior, not one benchmark case, while preserving deterministic authority and runtime targets.

| Strategy | What it fixes well | What it misses / risks | Why it loses to combined |
|---|---|---|---|
| Broad-mode routing/fallback only | Stops broad prompts from dying early; can improve UX quickly | Leaves specific prompts stuck in ambiguity gate; runtime can still exceed p95; may introduce new inconsistencies if clarify/fail-closed remain unchanged | Broad failures are downstream-coupled to clarify/fail-closed branches and budgets; you’ll still have “clarify” overriding useful partial answers. citeturn1view2turn1view3 |
| Specific-mode selector-lock only | Improves specific prompts; reduces clarify if lock engages | Broad conceptual still fails under code-floor / fail-closed; runtime still high; can risk degrading safety (overconfident selection) if not budget-aware | Lock changes alone won’t fix broad fail-closed floors or timeouts; also must align clarify gating with lock state. Āgi controller currently clarifies based on evidence/ambiguity predicates. citeturn1view3turn1view2 |
| Runtime budget/loop discipline only | Can bring p95 down and prevent 60s stalls | Doesn’t fix wrong-format fallbacks (“Where in repo”) or clarify mis-routing; can increase “fail-fast” clarifies unless degrade policy is improved | Faster failures are still failures if broad prompts get implementation fallback and specific prompts still clarify. fileciteturn190file0L1-L1 |
| **Combined: intent-typed envelope** (recommended) | Fixes broad routing, specific clarify/lock behavior, and budget overruns together | More invasive; requires careful rollout and telemetry | Only approach that addresses the coupled failure modes and preserves mid-equation lock integrity without adding open-ended repair loops. citeturn3view1turn3view0turn1view3 |

## Exact Failure Points in the Current Pipeline

**Facts (repo-grounded):**

1) **Ambiguity gate can force a clarify response and stop the controller.**  
In `server/routes/agi.plan.ts`, if `shouldClarifyNow` is true and `forcedAnswer` is not already set, the route can:
- build a clarify line (or a “scientific micro report” when enabled),
- append `answerPath.push("clarify:ambiguity")`,
- record an `ambiguity_gate` agent action,
- set `agentStopReason = "user_clarify_required"`, and stop. citeturn1view3turn1view4

This directly corresponds to your observation that many specific prompts degrade via `clarify:ambiguity_gate` and selector lock does not engage: the controller is *designed* to clarify early under certain evidence/ambiguity conditions. citeturn1view3turn1view4

2) **Fail-closed similarly forces a clarify/scientific fallback and sets a fail label.**  
In the fail-closed path, the route sets:
- `forcedAnswer` (scientific micro report if enabled, else clarify line),
- `answerPath.push(`failClosed:${failLabel}`)`,
- `debugPayload.fallback_reason = failClosedReason ?? "evidence_gate_failed"`,
- and stops with `agentStopReason = "user_clarify_required"`. citeturn1view2

This is the structural basis for the broad failure you observed (`fail_closed:stage0_code_floor_missing`): the **fail-closed reason string originates upstream** and is injected into fallback telemetry here. citeturn1view2

3) **Format routing exists, but broad conceptual prompts can still end in implementation-style fallback.**  
The flow doc states explicit format routing: “Steps” are for process/implementation, while “Brief” is for definition/summary questions. citeturn3view0  
If broad conceptual prompts are showing a “Where in repo” fallback, that’s a routing mismatch: the policy envelope is allowing an implementation-forward forced answer to escape on a non-implementation ask (your observation). citeturn3view0

4) **Two-pass synthesis and long wall times are explicitly part of the system and can regress p95.**  
The flow doc describes optional two-pass synthesis (distill → expand). citeturn3view0  
The readiness loop’s variety battery and equation benchmark loops include timeouts up to 60s per case. citeturn3view2  
The equation benchmark report shows p95 ≈ 60,017.8 ms and multiple cases at ~60,015–60,019 ms, consistent with timeout-bound behavior, plus widespread missing required sections and missing `Sources:` lines in failing cases. fileciteturn190file0L1-L1

5) **Budget discipline is already codified as a policy, but not enforced tightly enough to hit the p95 goal.**  
The agent policy defines per-action and global budgets (`HELIX_ASK_AGENT_ACTION_BUDGET_MS`, `HELIX_ASK_AGENT_LOOP_BUDGET_MS`) and explicitly says overruns can trigger early stop. citeturn3view1  
Your p95 target (≤ 30s for equation asks) is incompatible with a benchmark regime where failed cases regularly reach ~60s. fileciteturn190file0L1-L1

6) **The runtime regression fix is covered by explicit tests and reliability guards.**  
The runtime-errors test suite checks for missing-symbol runtime ReferenceErrors and includes guard logic that is intended to keep outputs clean and user-facing in non-report mode, preventing scaffold leakage while preserving sources. fileciteturn188file0L1-L1

**Inference (falsifiable, directly tied to fixes below):**  
The broad failure (`stage0_code_floor_missing`) is a *floor policy misapplied to broad conceptual prompts*, and the specific failure (`ambiguity_gate` with no lock) is a *clarify gate firing before the system attempts a “best-effort locked selection” for specific/symbol asks*. Both share a root: **intent-typed policy is not authoritative enough to override clarify/fail-closed early exits when the prompt family does not warrant them.**

## Patch Plan

**Goal: one minimal, high-impact patch set that improves broad + specific reliability without regressing mid-equation lock integrity, while driving equation p95 toward ≤ 30s.**

### Patch set overview (ordered)

**Patch 1: Introduce a single “Intent Policy Envelope” computed once and carried through the run.**  
**What changes:** in `server/routes/agi.plan.ts`, compute an immutable struct early (after normalization/intent routing) that includes:
- `prompt_family` (definition/summary vs mechanism/process vs implementation_code_path vs equation_formalism),
- `prompt_specificity` (broad/mid/specific),
- `requires_code_floor` (bool),
- `requires_doc_floor` (bool),
- `clarify_allowed_pre_lock` (bool),
- `lock_required_for_family` (bool),
- `budget_profile` (fast/standard/strict) with ms caps.

**Why it fixes broad conceptual failures:** Broad definition/summary family should set `requires_code_floor=false` and select the “Brief” format, aligning with format routing guidance. citeturn3view0

**Why it won’t break mid equation wins:** Mid equation prompts remain `equation_formalism` with lock required (as you observe they already succeed under lock), but now the rest of the pipeline is forced to respect that envelope.

**Patch 2: Make clarify/fail-closed branches respect the envelope and selector-lock state.**  
**What changes:** In the `shouldClarifyNow` / fail-closed logic, add two deterministic overrides:

- **Override A (broad-mode override):** if `prompt_family` is definition/summary (or hybrid_explain conceptual) and `doc evidence floor` is satisfied, do **not** fail-closed with a code-floor reason; instead finalize via “Brief” with grounded doc sources (and if repo evidence is required but only docs exist, state that limitation). This prevents “Where in repo” fallback escaping for conceptual broad asks. citeturn3view0turn1view2

- **Override B (post-lock continuity override):** if selector lock is engaged (mid-equation success path), **suppress `clarify:ambiguity` taxonomy and do not stop**; instead emit a unified degrade within the same family (tentative/verified downgrade, and “what’s missing” section), preserving post-lock non-mutation. This is aligned with the existence of lock-integrity and “verified→tentative downgrade when guard fails” patterns already asserted in reliability-guard tests. fileciteturn188file0L1-L1 citeturn1view3

**Patch 3: Specific-mode “best-effort lock” rule before ambiguity clarifies.**  
**What changes:** For `prompt_specificity=specific`, insert a deterministic attempt:
- If there is a single dominant candidate cluster (or a top candidate above threshold), **engage selector lock** and answer with a bounded response plus a narrow clarification only when necessary (“Two plausible definitions; pick A vs B”), rather than triggering the full ambiguity gate forced-stop path.  
This reduces `clarify:ambiguity_gate` for specific prompts while keeping disambiguation honest.

**Patch 4: Enforce budget discipline with one-loop maximum and family-aware two-pass gating.**  
**What changes:**
- If `budget_profile=fast` (for most non-equation or broad conceptual prompts), disable two-pass synthesis and cap retrieval/scaffold size.
- For equation prompts, keep two-pass optional but ensure the global loop budget aligns with p95 ≤ 30s; the current benchmark shows many failures at ~60s. fileciteturn190file0L1-L1
- When budget is near exhaustion, force the **scientific micro report** degrade (agent policy’s stop action) rather than attempting further synthesis. citeturn3view1turn1view2

### File-level change list (minimal core)

- `server/routes/agi.plan.ts`  
  - Add the Policy Envelope struct computation (deterministic).  
  - Thread envelope into clarify/fail-closed decisions and selection-lock handling.  
  - Add the specific-mode “best-effort lock before clarify” step.  
  - Enforce budget profile caps and two-pass gating. citeturn1view3turn1view2turn3view0turn3view1

- `docs/helix-ask-flow.md`  
  - Update the “Format routing” and two-pass guidance to explicitly reference the new envelope fields (so debugging matches runtime behavior). citeturn3view0

- `docs/helix-ask-agent-policy.md`  
  - Add explicit mention that budget exhaustion should degrade *within family* and that clarify is disallowed post-lock for lock-required families. citeturn3view1

- `docs/helix-ask-readiness-debug-loop.md`  
  - Add a “Broad conceptual gate” and a “Specific lock-engagement gate” to the scorecard so regressions are caught by contract/variety batteries. citeturn3view2

- `tests/helix-ask-runtime-errors.spec.ts`  
  - Add tests for:
    - “broad conceptual prompt does not require code floor” (prevents stage0 code-floor fail-closed regression),
    - “ambiguity gate suppressed after lock” (continuity),
    - “budget exhaustion yields family-consistent degrade (not generic clarify).” fileciteturn188file0L1-L1

- `tests/helix-ask-equation-benchmark.spec.ts` and the benchmark harness  
  - Add a benchmark case covering “broad conceptual definition with doc-only evidence” (so broad fails cannot regress silently). fileciteturn189file0L1-L1

### Telemetry fields to add/modify

Add to the debug payload/envelope (and ensure they are never leaked into user-visible text; output hygiene already exists in flow). citeturn3view0

- `policy_prompt_family`, `policy_prompt_specificity`
- `policy_requires_code_floor`, `policy_requires_doc_floor`
- `policy_lock_required`, `policy_clarify_allowed_pre_lock`
- `selector_lock_engaged` and `selector_lock_hash`
- `clarify_suppressed_due_to_lock` (bool)
- `fail_closed_reason_raw` (string) and `fallback_reason_taxonomy` (normalized)
- `budget_profile`, `budget_loop_ms_limit`, `budget_action_ms_limit`
- `budget_exhausted` (bool) and `degrade_selected` (enum: family_degrade/scientific_micro_report/clarify)

These make the recommendation falsifiable in logs: you can prove whether broad prompts are still failing because of floor policy, or because of later obligation gates.

## Falsification Plan

**Hypotheses (each has a clear falsifier):**

H1 (Broad robustness): Broad conceptual prompts no longer end in `fail_closed:stage0_code_floor_missing`; instead they either (a) produce a “Brief” conceptual grounded answer, or (b) degrade via a family-consistent scientific micro report that still answers partially.  
**Falsifier:** broad prompt suite still shows ≥ 5% `fail_closed:*code_floor*` within 500 runs.

H2 (Specific continuity): Specific prompts reduce `clarify:ambiguity_gate` frequency by engaging selector lock when a dominant candidate exists, while still asking for disambiguation when multiple candidates compete.  
**Falsifier:** `clarify:ambiguity_gate` rate does not improve, or lock engagement increases but wrong-anchor errors rise (measured by primary-anchor mismatch).

H3 (Mid-equation non-regression): Mid-equation prompts retain lock integrity and do not increase post-lock mutation incidents.  
**Falsifier:** any measurable rise in “rendered primary mismatches selection” or lock-hash mismatches; the reliability tests already include parity assertions and should be expanded. fileciteturn188file0L1-L1

H4 (Latency): Equation benchmark p95 drops from ~60s toward ≤ 30s without reducing pass rate.  
**Falsifier:** equation benchmark p95 remains > 35s after enforcing budgets, or pass_rate drops materially below current baseline. Current p95 ≈ 60,017.8 ms. fileciteturn190file0L1-L1

**Metrics and thresholds:**
- `broad_fail_closed_code_floor_rate` ≤ 1%
- `specific_clarify_ambiguity_rate` reduced by ≥ 30% vs baseline
- `equation_lock_integrity_fail_rate` ≤ 0.1%
- `equation_benchmark_p95_latency_ms` ≤ 30,000
- `equation_benchmark_pass_rate` ≥ baseline (currently 0.4286) fileciteturn190file0L1-L1

## Rollout Strategy

**Shadow → soft enforce → full enforce**, with kill-switches:

- **Shadow:** Compute and log Policy Envelope + would-have decisions (clarify suppression, code-floor requirement) but keep current behavior. Validate with readiness loop artifacts and the versatility + equation benchmark packs. citeturn3view2
- **Soft enforce:** Apply envelope overrides only for:
  - broad definition/summary prompts (disable code floor; enforce “Brief”),
  - post-lock clarify suppression (continuity-safe change),
  - fast budget profile (disable two-pass).  
  Keep old behavior behind a flag for rollback.
- **Full enforce:** Make envelope authoritative for all prompt families; clarify/fail-closed branches must consult it; budgets become hard caps for equation asks.

## Expected Impact

**Broad prompts (currently failing):**
- Expected: fewer fail-closed outcomes from code-floor overreach; fewer “Where in repo” implementation fallbacks on conceptual questions by enforcing the flow’s format routing (“Brief” for definition/summary). citeturn3view0turn1view2
- Expected degrade behavior: scientific micro report (policy-approved) if evidence is partial, rather than dead-end clarify. citeturn3view1turn1view2

**Mid equation prompts (currently strong):**
- Expected: remain strong; continuity improves because ambiguity clarification is suppressed after lock and validation downgrades “Verified” to “Tentative” rather than flipping into clarify. This aligns to existing reliability-guard patterns (verified-integrity checks and downgrade behavior). fileciteturn188file0L1-L1

**Specific prompts (often degrading):**
- Expected: fewer `clarify:ambiguity_gate` forced stops because the system makes a deterministic best-effort selection when a dominant candidate exists, and asks a *narrow* question only when multiple candidates remain plausible. citeturn1view3

**Latency:**
- Expected: p95 improves materially because:
  - budget profile disables two-pass for many prompts,
  - early exit uses policy-approved degrade,
  - equation benchmark currently shows 60s-scale timeouts dominating failures. fileciteturn190file0L1-L1

## Risks and Mitigations

**Risk: broad-mode fail-open could allow ungrounded conceptual answers.**  
Mitigation: the envelope must still respect `requiresRepoEvidence`; if repo evidence is required but only general text exists, degrade with explicit uncertainty and without fabricated citations, consistent with flow’s open-world bypass policy description. citeturn3view0turn1view2

**Risk: increasing lock engagement for specific prompts could produce wrong-anchor answers.**  
Mitigation: require a dominance threshold; otherwise produce the narrow clarify. Track “primary anchor mismatch” (already a concept in reliability guard tests for selection/render parity). fileciteturn188file0L1-L1

**Risk: strict budgets could reduce answer completeness.**  
Mitigation: enforce “family-consistent degrade” rather than truncation. Agent policy already specifies that on budget exhaustion the system should return the best grounded scaffold + next evidence. citeturn3view1turn1view2

**Risk: policy-envelope complexity increases maintenance cost.**  
Mitigation: keep it declarative (one struct + deterministic rules), and make it fully test-covered via readiness loop batteries and the equation benchmark harness, which already exists and reports failure buckets. citeturn3view2turn3view1turn190file0L1-L1
