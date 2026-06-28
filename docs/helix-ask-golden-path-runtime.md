# Helix Ask Golden-Path Runtime

## Purpose

The Helix Ask golden-path runtime is a gated execution spine beside the legacy
`server/routes/agi.plan.ts` flow. Its purpose is to prove a small, coherent
Helix Ask policy path can produce a terminal-authority-backed response without
continuing to extract thousands of route-local helpers before the new spine can
be reviewed.

This path is a scaffold, not a default replacement for the legacy route.

## Feature Gate

The runtime is disabled unless both conditions are true:

- `HELIX_ASK_GOLDEN_PATH_RUNTIME` is enabled.
- The request explicitly opts in with a golden-path marker, such as
  `goldenPathRuntime: true`, `golden_path_runtime: true`,
  `helixAskGoldenPathRuntime: true`, `helix_ask_golden_path_runtime`, or
  `helix ask golden path runtime`.

## Legacy Fallback Boundary

When the flag is disabled or the request does not explicitly opt in,
`runHelixAskGoldenPathRuntime` returns an unhandled decision and `/ask/turn`
continues through the legacy route. The golden path must not become the default
route without a later activation change and separate evidence.

## Minimum Request Contract

A minimum golden-path request is a normal Ask turn body plus one explicit
golden-path opt-in marker. The runtime accepts `turn_id`, `trace_id`,
`session_id`, `thread_id`, and prompt fields when present, but it does not
require live keys, external tools, or the legacy private runtime loop.

## Response Envelope Contract

The response envelope must identify a contract-only terminal result:

- `schema = "helix.ask_golden_path_runtime.v1"`
- `response_type = "final_answer"`
- `final_status = "final_answer"`
- `final_answer_source = "helix_ask_golden_path_runtime"`
- `terminal_artifact_kind = "golden_path_contract_answer"`
- `terminal_error_code = null`
- `terminal_results` contains one terminal result.

## Terminal Artifact Invariants

The golden path emits one terminal artifact and one terminal result. The selected
terminal result must agree with:

- `terminal_answer_authority`
- `terminal_authority_single_writer`
- top-level `answer`, `text`, and `selected_final_answer`
- debug mirror terminal fields

No receipt, route label, UI projection, stale panel text, or model draft is
allowed to override the selected terminal artifact.

## Artifact Ledger Invariants

The current-turn ledger records the golden route gate and the selected
`golden_path_contract_answer`. The terminal artifact is marked terminal-eligible
and carries support refs from the golden-path model packet and goal-satisfaction
artifact.

The route-gate artifact may include non-authoritative debug material, but it is
not terminal authority.

## Final-Answer Source Rules

The final answer source is stable:

`helix_ask_golden_path_runtime`

That source is valid only for the gated, explicit golden-path request. Legacy
turns must continue to use their existing final-answer source rules.

## Conflicting Legacy Paths Bypassed

The golden path bypasses the legacy private runtime loop and its late-stage
writers for opted-in turns. This avoids known conflict zones while keeping them
available as fallback:

- legacy route/classifier dominance
- post-tool terminal repair writers
- final-answer draft promotion paths
- route-local terminal/debug projection mirrors
- legacy private runtime loop sequencing

## Reused S275-S277 Modules

The runtime reuses extracted helper seams as dependencies rather than importing
the route:

- S275 goal-satisfaction artifact builder
- S276 Stage Play checkpoint receipt builder
- S277 composite handoff/follow-up debug builders

These helpers remain dependency-owned by the service. The service must never
import `server/routes/agi.plan.ts`.

## Activation Plan

Activation should remain staged:

1. Keep the golden path disabled by default.
2. Validate deterministic contract tests.
3. Run keyed localhost probes only after user-started server confirmation.
4. Expand explicit capability coverage behind the same gate.
5. Promote one proven capability family at a time.
6. Retire conflicting legacy writers only after equivalent golden-path evidence
   exists.

## Deferred Risks

- The golden path is contract-only and not yet a full tool-capability runtime.
- Legacy route fallback still contains conflicting writers.
- Keyed live validation remains separate.
- API parity matrix hangs should be investigated independently.
- Default-on promotion needs a separate change, review, and evidence trail.
