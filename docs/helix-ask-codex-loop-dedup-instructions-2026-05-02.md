# Helix Ask Codex Loop Dedup Instructions

Last updated: 2026-05-02

## Purpose

Use these instructions for the next Helix Ask backend pass. The goal is to keep Helix Ask aligned with the Codex agentic loop without rebuilding Codex-style loop mechanics inside Helix Ask.

Helix Ask should own domain routing, evidence policy, artifact shaping, and workstation capability selection. Codex-style infrastructure should own the generic loop shape: turn intake, tool-call visibility, tool execution, observations, follow-up sampling, pending-input lifecycle, cancellation, and terminal turn closure.

## Comparison Result

The current Launch panel and workstation dynamic tool checks show a split source of truth:

- Launch-active job-ready panels are defined by `client/src/lib/workstation/launchPanelPolicy.ts`.
- Client dynamic tools are capability-derived in `client/src/lib/workstation/workstationDynamicTools.ts` via `buildWorkstationDynamicToolsFromCapabilities(WORKSTATION_V1_PANEL_CAPABILITIES)`.
- The shared static registry in `shared/workstation-dynamic-tools.ts` only includes five of the nine active Launch job-ready panels.
- The backend turn planner in `server/routes/agi.plan.ts` still builds `HELIX_ASK_TURN_CAPABILITY_ACTIONS` from `WORKSTATION_DYNAMIC_TOOL_ACTIONS`, so the backend sees the stale static subset.

Missing from the shared static default list:

- `workstation-workflow-timeline`
- `agi-essence-console`
- `agi-task-history`
- `scientific-calculator`

Also missing at action level:

- `docs-viewer.open_directory`

## Codex Baseline To Preserve

Codex does not hard-code a second planner-specific capability universe. Its turn path builds a per-turn tool router, exposes model-visible specs from that router, executes model-emitted tool calls through one dispatcher, records tool outputs back into conversation history, and repeats the model loop only when observations or pending input require follow-up.

Reference points in the local Codex clone:

- `external/openai-codex/codex-rs/core/src/codex.rs`
  - `Codex::submit` wraps operations as submissions with unique IDs.
  - `TurnContext` carries turn-scoped cwd, policies, dynamic tools, metadata, and tool configuration.
  - `run_sampling_request` builds tools once per sampling request and creates the `ToolCallRuntime`.
  - `try_run_sampling_request` streams response items, queues tool calls, drains tool outputs, and sets `needs_follow_up`.
- `external/openai-codex/codex-rs/core/src/stream_events_utils.rs`
  - `handle_output_item_done` records model items, detects tool calls, queues tool futures, and marks follow-up required.
- `external/openai-codex/codex-rs/core/src/tools/router.rs`
  - `ToolRouter::from_config` builds one registry from configured MCP, app, discoverable, and dynamic tools.
  - `ToolRouter::dispatch_tool_call_with_code_mode_result` sends all tool calls through the registry.
- `external/openai-codex/codex-rs/core/src/tools/parallel.rs`
  - `ToolCallRuntime` controls dispatch, cancellation, parallel/non-parallel locking, and failure responses.

Helix Ask should mirror these boundaries, not duplicate their internals.

## New Backend Instructions

1. Treat the dynamic tool/capability registry as the only workstation action source.
   - Do not build backend planner candidates from `WORKSTATION_DYNAMIC_TOOL_ACTIONS` unless that list is generated from the same capability source used by the client.
   - Move `WORKSTATION_V1_PANEL_CAPABILITIES` or an equivalent serializable capability manifest into `shared/`, or generate the shared static list from that manifest.
   - Keep `WORKSTATION_DYNAMIC_TOOL_ACTIONS` only as a compatibility export after it covers every active job-ready panel and action.

2. Make the backend planner a policy layer, not a second agent loop.
   - Backend planner output should be a bounded plan contract: `panel_id`, `action_id`, `args`, `reasoning_required`, `evidence_need`, and terminal expectations.
   - It should not own repeated model/tool/observe/model loops.
   - If a plan requires multiple steps, emit ordered plan items and let the single turn runtime execute the steps and record observations.

3. Use Codex-style loop invariants for Helix Ask turns.
   - One turn ID per user turn.
   - One capability registry snapshot per turn.
   - Tool/action request recorded before execution.
   - Tool/action result recorded as an observation artifact.
   - Follow-up reasoning admitted only when the recorded observation or plan contract requires it.
   - Exactly one terminal success or typed terminal failure.

4. Keep deterministic workstation actions out of free-form methodology.
   - If an action can be represented as `panel_id + action_id + args`, it must be selected from the capability registry and executed through the workstation action adapter path.
   - Do not add a separate heuristic method, objective mini-loop, or route-specific fallback for that same action.
   - Missing args must produce a pending-input artifact, not a speculative alternate action.

5. Scope the objective mini-loop to answer quality only.
   - `server/services/helix-ask/objectives/*` may critique, synthesize, validate evidence sufficiency, and produce final answer text.
   - It must not choose workstation tools from a private list.
   - It must not execute tools.
   - It must not invent hidden subgoals that bypass the typed plan item lifecycle.

6. Make Launch panel parity an invariant.
   - Every `isUserLaunchPanel(panelId) === true` panel with `workstationCapabilities.v1_job_ready === true` must expose at least an `open` dynamic tool.
   - Every capability action marked `can_run_action` must have a dynamic tool spec, input schema, terminal artifact policy, and adapter handler or an explicit `not_implemented` suppression reason.
   - Client and backend tests must assert the same panel/action set.

7. Add a regression test for stale registry drift.
   - Compare Launch-active job-ready panels against generated dynamic tool specs.
   - Compare `WORKSTATION_V1_PANEL_CAPABILITIES` action IDs against `getWorkstationDynamicTools()` and backend planner candidates.
   - Fail if the backend static candidate list is missing any client job-ready action.

## Patch Order

1. Move or mirror workstation panel capabilities into `shared/`.
2. Change server turn planner candidates to use the generated dynamic tool specs instead of `WORKSTATION_DYNAMIC_TOOL_ACTIONS`.
3. Add missing dynamic actions:
   - `workstation-workflow-timeline.open`
   - `agi-essence-console.open`
   - `agi-task-history.open`
   - `scientific-calculator.open`
   - `scientific-calculator.ingest_latex`
   - `scientific-calculator.solve_expression`
   - `scientific-calculator.solve_with_steps`
   - `scientific-calculator.copy_result`
   - `scientific-calculator.copy_debug_log`
   - `scientific-calculator.clear_workspace`
   - `docs-viewer.open_directory`
4. Add adapter coverage or explicit suppression for each action above.
5. Add parity tests on client and backend.
6. Only after parity passes, revisit multi-step reasoning composition.

## Non-Goals

- Do not add another backend-only router.
- Do not add a second dynamic tool naming convention.
- Do not make the objective loop responsible for tool execution.
- Do not use final-answer prose as proof that a workspace action ran.
- Do not treat Launch visibility and tool availability as separate truths.

## Acceptance Criteria

- Backend planner candidate count and client dynamic tool count agree for all Launch-active job-ready panels.
- A prompt such as `open scientific calculator` maps to `scientific-calculator.open` in the backend planner.
- A prompt such as `show docs directory` maps to `docs-viewer.open_directory`.
- A prompt with missing required args emits a pending-input artifact instead of selecting another tool.
- A hybrid prompt records workspace action observations before any reasoning finalization.
- No Helix Ask backend module executes a workstation action outside the typed workstation action adapter contract.
