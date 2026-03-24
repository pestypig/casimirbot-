# Helix Ask Objective-Loop Fallback Elimination Plan

## Goal
Reduce fallback-heavy behavior in Objective-loop assembly so definition/mechanism prompts converge to useful answers instead of generic unknown-template outputs.

## Baseline (Debug-Driven)

Probe command:

```bash
npm run helix:ask:prompt-quality:probe
```

Latest measured pattern (10-prompt mixed battery):

- `strong`: 2
- `partial`: 5
- `weak`: 3
- `avg_novelty`: 1.2
- `avg_sufficiency`: 2.5
- common weak-signature:
  - `objective_finalize_gate_mode = unknown_terminal`
  - `objective_assembly_mode = deterministic_fallback`
  - `objective_loop_primary_composer_guard = true`
  - `composer_family_degrade_suppressed = true`
  - text collapses to generic definition template

Focused 4-prompt check also showed chokepoint tags:

- `general_definition_trap`: 3
- `unknown_terminal_deterministic_fallback`: 3
- `generic_unknown_renderer`: 2
- `mini_critic_heuristic_fallback`: 1

Patch revision present in these runs:

- `objective_loop_patch_revision = 2026-03-23-objective-loop-final-resolution-v3`

## Chokepoints

### C1: General-definition trap

Symptoms:

- repo-relevant question routed as `intent_domain = general`
- `context_file_count = 0`
- objective loop still runs retrieval, but terminalizes as `unknown_terminal`
- output becomes generic unknown-template style

Primary impact:

- kills retrieval+LLM balance early; LLM never gets grounded synthesis inputs.

### C2: Unknown-terminal deterministic fallback dominance

Symptoms:

- `objective_finalize_gate_mode = unknown_terminal`
- `objective_assembly_mode = deterministic_fallback`
- unknown blocks exist, but final rendering is often low-information.

Primary impact:

- objective-loop is mechanically correct but quality is not constructive.

### C3: Generic unknown renderer leak

Symptoms:

- generic phrases (for example “core meaning of the concept in its domain context”)
- `open_world_objective_tail_scrub_applied = false` in affected cases.

Primary impact:

- user-visible answer looks like scaffold/fallback even when loop telemetry looks healthy.

### C4: Composer v2 fallback in hybrid asks

Symptoms:

- `composer_v2_fallback_reason = json_parse_failed` or `empty_output`
- `composer_v2_best_attempt_stage = deterministic_fallback`

Primary impact:

- stronger objective outputs degrade before final assembly.

### C5: Mini-critic heuristic fallback

Symptoms:

- `objective_mini_critic_mode = heuristic_fallback` for some repo/mechanism asks.

Primary impact:

- objective closure quality varies by path, reducing consistency.

## Remediation Ladder

## R1 (Immediate): Routing salvage before unknown-terminal

When a prompt is `definition_overview` and contains repo anchors (`warp`, `natario`, `hull`, `module`, explicit path-like tokens), do a forced repo/hybrid salvage step before terminalizing unknown.

Implementation intent:

- add a repo-anchor salvage gate in ask routing path
- if `context_file_count = 0` and repo-anchor detected, enforce one scoped retrieval expansion pass
- record:
  - `routing_salvage_applied`
  - `routing_salvage_reason`
  - `routing_salvage_retrieval_added_count`

Expected effect:

- fewer `general_definition_trap` cases.

## R2 (Immediate): Unknown renderer hardening

If `unknown_terminal`, render explicit objective-level unknown blocks only; ban generic-definition fallback phrases.

Implementation intent:

- deterministic output guard: reject known generic scaffold templates when `objective_unknown_block_count > 0`
- force structured unknown output:
  - `UNKNOWN`
  - `Why`
  - `What I checked`
  - `Next retrieval`
- set `open_world_objective_tail_scrub_applied = true` when scrub runs.

Expected effect:

- eliminate `generic_unknown_renderer`.

## R3 (Short-cycle): Objective assembly rescue call

For `unknown_terminal + deterministic_fallback + objective_loop_primary_composer_guard=true`, add one bounded LLM rescue assembly call from objective mini-answers (not raw prompt).

Implementation intent:

- single extra LLM attempt with strict schema
- if parse fails, then deterministic fallback
- track:
  - `objective_assembly_rescue_attempted`
  - `objective_assembly_rescue_success`
  - `objective_assembly_rescue_fail_reason`

Expected effect:

- reduce pure deterministic fallback on definition asks.

## R4 (Short-cycle): Composer parse robustness

Harden composer v2 parse-repair path to lower `json_parse_failed`/`empty_output`.

Implementation intent:

- stricter JSON framing + compact schema
- bounded retry with repair instruction that includes only objective mini-answer subset
- telemetry:
  - `composer_v2_parse_retry_count`
  - `composer_v2_parse_repair_success`

Expected effect:

- fewer hybrid-path degradations.

## R5 (Short-cycle): Mini-critic mode consistency

Prefer LLM mini-critic when transport is healthy; require explicit reason for heuristic fallback.

Implementation intent:

- add `objective_mini_critic_fallback_reason`
- avoid heuristic fallback unless transport failure or policy hard block.

Expected effect:

- more consistent objective closure decisions.

## R6 (Stabilization): Quantitative gate for promotion

Use `helix:ask:prompt-quality:probe` as daily gate with thresholds:

- `general_definition_trap <= 10%`
- `unknown_terminal_deterministic_fallback <= 25%`
- `generic_unknown_renderer = 0`
- `avg_novelty >= 1.8`
- `avg_sufficiency >= 3.0`
- patch revision must match expected objective-loop tag.

## Novel Control Strategies (Debug-First)

### N1: Dual-lane arbitration

For ambiguous definition prompts, run:

- lane A: repo-grounded objective loop
- lane B: open-world conceptual synthesis

Then deterministically pick/merge by evidence score and unknown coverage.

### N2: Counterfactual retrieval repair

When mini-critic says unresolved, generate one counterfactual retrieval query targeting missing slots and contradiction evidence before terminalization.

### N3: Template fingerprint veto

Maintain a small deterministic fingerprint list of known low-value scaffold outputs; block and force re-render from objective mini-answers.

## Execution Order

1. R1 + R2 (highest leverage on weak definition prompts)
2. R3 (rescue quality without large architecture change)
3. R4 + R5 (stability/consistency)
4. R6 thresholds for release-style gating

## Verification Loop

Per patch cycle:

1. `npm run helix:ask:prompt-quality:probe`
2. record chokepoint counts + averages
3. run Casimir adapter verify gate (PASS + certificate integrity/hash)
4. only promote if R6 thresholds pass

