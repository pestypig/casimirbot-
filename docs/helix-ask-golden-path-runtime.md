# Helix Ask Golden-Path Runtime

## Purpose

The Helix Ask golden-path runtime is a gated execution spine beside the legacy
`server/routes/agi.plan.ts` flow. Its purpose is to prove a small, coherent
Helix Ask policy path can produce a terminal-authority-backed response without
continuing to extract thousands of route-local helpers before the new spine can
be reviewed.

This path is the default first-refusal runtime for normal Ask turns that match a
golden-path capability or compound module. It now covers the contract-only
fallback, explicit capability families, and representative compound workflows
through owned modules under `server/services/helix-ask/golden-path/`.

## Activation

The runtime is enabled by default. Operators can explicitly opt out with:

- `HELIX_ASK_GOLDEN_PATH_RUNTIME=0`
- `HELIX_ASK_GOLDEN_PATH_RUNTIME=false`
- `HELIX_ASK_GOLDEN_PATH_RUNTIME=disabled`
- `HELIX_ASK_GOLDEN_PATH_RUNTIME=off`

The repository's README-supported development commands (`npm run dev`,
`npm run dev:agi`, `npm run dev:agi:5050`, and `npm run dev:agi:5173`)
explicitly opt out so normal keyed development reaches the live model/tool
route. `npm run dev:golden-path` is the explicit local scaffold command.

When enabled, a request enters golden path if an ordered capability or compound
module matches the prompt/body. Unmatched prompts fall through to the legacy
route unless the request explicitly opts into the contract-only scaffold with a
golden-path marker, such as `goldenPathRuntime: true`,
`golden_path_runtime: true`, `helixAskGoldenPathRuntime: true`,
`helix_ask_golden_path_runtime`, or `helix ask golden path runtime`.

## Legacy Fallback Boundary

When the runtime is explicitly disabled or no capability/compound module
matches, `runHelixAskGoldenPathRuntime` returns an unhandled decision and
`/ask/turn` continues through the legacy route. Contract-only golden-path
responses still require an explicit marker so ordinary unmatched prompts are
not swallowed by the scaffold.

## Minimum Request Contract

A minimum golden-path capability request is a normal Ask turn body whose prompt
or request fields match a golden-path capability or compound module. A
contract-only scaffold request requires an explicit golden-path marker. The
runtime accepts `turn_id`, `trace_id`, `session_id`, `thread_id`, and prompt
fields when present, but it does not require live keys, external tools, or the
legacy private runtime loop.

## Response Envelope Contract

For the contract-only fallback, the response envelope must identify a
contract-only terminal result:

- `schema = "helix.ask_golden_path_runtime.v1"`
- `response_type = "final_answer"`
- `final_status = "final_answer"`
- `final_answer_source = "helix_ask_golden_path_runtime"`
- `terminal_artifact_kind = "golden_path_contract_answer"`
- `terminal_error_code = null`
- `terminal_results` contains one terminal result.

For explicit capabilities and compound workflows, the same envelope invariants
apply, but the terminal artifact kind is owned by the selected capability or
compound module. Examples include:

- `workstation_tool_evaluation`
- `capability_help_summary`
- `doc_location_matches`
- `repo_code_evidence_answer`
- `workspace_status_answer`
- `internet_search_answer`
- `scholarly_research_answer`
- `theory_context_reflection_answer`
- `situation_context_pack`
- `compound_evidence_synthesis_answer`

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

The current-turn ledger records the golden route gate, each required
observation artifact, and the selected terminal artifact. The terminal artifact
is marked terminal-eligible and carries support refs from the relevant
observation or compound subgoal artifacts.

The route-gate artifact may include non-authoritative debug material, but it is
not terminal authority.

## Final-Answer Source Rules

For the contract-only fallback, the final answer source is stable:

`helix_ask_golden_path_runtime`

That source is valid only for the gated, explicit golden-path contract request.
For explicit capability and compound turns, `final_answer_source` must match the
selected terminal artifact kind. Legacy turns must continue to use their
existing final-answer source rules.

## Current Owned Capability Coverage

Golden-path explicit capability modules currently cover:

- calculator
- capability catalog
- docs locate / docs viewer alias
- repo search / repo code alias
- workspace status
- workspace directory resolution
- processed live-source mail read-only packet summaries
- Stage Play reflection summaries
- theory/context reflection
- civilization-bounds reflection
- Moral graph / ideology reflection
- visual capture / image lens inspection
- scholarly research lookup
- internet/web research lookup

Each capability module exposes:

- `requiredObservationKinds`
- `requiredTerminalKinds`
- `isRequested(body)`
- `buildPayload({ body, deps })`

## Current Owned Compound Coverage

Golden-path compound modules currently cover:

- docs + calculator
- capability catalog + workspace status
- repo search + docs locate
- internet/web research + theory reflection
- visual capture + calculator
- civilization bounds + Moral graph reflection

Each compound module owns ordered subgoals, required observation kinds,
required terminal kind, request detection, payload construction, and support
refs covering all mandatory subgoals.

## HTTP Route-Gate Evidence

Deterministic route-gate tests prove golden-path delegation for:

- `/api/agi/ask/turn` explicit capability turns
- `/api/agi/ask/turn` compound turns
- `/api/agi/ask/turn/stream` explicit capability turns
- `/api/agi/ask/turn/stream` compound turns

Both route surfaces preserve legacy fallback when the flag is disabled or the
explicit golden-path marker is absent.

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

1. Keep normal README development entrypoints explicitly opted out.
2. Validate deterministic contract tests.
3. Run keyed localhost probes only after user-started server confirmation.
4. Expand explicit capability coverage behind the same gate.
5. Promote one proven capability family at a time.
6. Retire conflicting legacy writers only after equivalent golden-path evidence
   exists.

## Deferred Risks

- The golden path is still gated and not default-on.
- The golden path consumes compact deterministic evidence; keyed provider/tool
  execution remains a later activation phase.
- Legacy route fallback still contains conflicting writers.
- Keyed live validation remains separate.
- API parity matrix hangs should be investigated independently.
- Default-on promotion needs a separate change, review, and evidence trail.
