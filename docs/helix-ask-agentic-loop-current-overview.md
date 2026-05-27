# Helix Ask Agentic Loop: Current Overview

Last updated: 2026-04-27

## Purpose
This document is the current implementation map for the Helix Ask agentic loop and workstation orchestration. Use it as the source-of-truth context before generating new code for routing, events, or UI action primitives.

Companion execution handoff:
- `docs/helix-ask-next-pass-instructions.md`
- `docs/helix-ask-codex-loop-dedup-instructions-2026-05-02.md`

2026-05-02 registry dedup finding:
- Client dynamic tools are generated from `WORKSTATION_V1_PANEL_CAPABILITIES`, but backend turn planner candidates still use the static `WORKSTATION_DYNAMIC_TOOL_ACTIONS` list.
- The static shared list does not cover every active Launch-panel job-ready surface (`workstation-workflow-timeline`, `agi-essence-console`, `agi-task-history`, `scientific-calculator`) and omits `docs-viewer.open_directory`.
- Next backend work should unify the capability source before adding more agent-loop methodology.

## Codex-Clone Grounding (Methodology Baseline)
The Helix loop is aligned to the proven codex app-server patterns:

- Plan/lifecycle artifact pattern: `external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs`
  - `item/started`, `item/completed`, `item/plan/delta`, and `turn/completed` are consumed as distinct lifecycle notifications at lines 189-215.
- Request-user-input roundtrip pattern: `external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs`
  - `ToolRequestUserInput` is asserted before resolution at lines 83-90.
  - `serverRequest/resolved` is required before `turn/completed` at lines 109-121.
- Explicit request/turn error typing: `external/openai-codex/codex-rs/app-server/src/server_request_error.rs`
  - pending-request supersession is typed with `reason = "turnTransition"` at lines 3-11.
- Deterministic bespoke event lifecycle: `external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs`

Helix parity principle: prefer typed, streamed lifecycle artifacts over prose-only status text.
Do not treat a planning/subgoal statement as a terminal answer unless the required action artifact has actually been produced.

## Repo Concept Evidence Lane
Internal product/workstation concept questions such as "What is the Situation Room?", "What is Auntie Dottie in this app?", "How does terminal authority work in Helix Ask?", "What is Route Evidence supposed to be?", and "How does the docs panel work?" are repo-backed turns, not generic background answers.

Current contract:
- `server/services/helix-ask/repo-concept-detector.ts` detects known internal concepts.
- `repo-code.search_concept` is the model-visible retrieval capability.
- `server/services/helix-ask/retrieval/repo-code-evidence-search.ts` runs the repo search and emits `helix.repo_code_evidence_observation.v1`.
- `server/services/helix-ask/retrieval/repo-code-evidence-ranker.ts` ranks implementation/docs/shared hits and filters index-only paths.
- `server/services/helix-ask/repo-code-evidence-answer-contract.ts` requires the repo observation before `repo_entity_definition` or `repo_code_evidence_answer` can be terminal.

The repo search result is evidence only. It must be re-entered into the runtime loop, followed by model synthesis, and only then terminal authority may write the visible answer. The forbidden terminal shapes for this lane are `direct_answer_text`, `no_tool_direct`, `model_only_concept`, and `panel_generated_answer`.

## Runtime Lanes
1. Workspace lane: deterministic action routing and execution first.
2. Reasoning lane: queued deep reasoning for synthesize/compare/verify and forced reasoning dispatch.
3. Observer lane: typed plan, completion, and handoff artifacts for control-plane visibility.
4. Conversation lane: user-facing brief/final response rendering.

Primary implementation file:
- `client/src/components/helix/HelixAskPill.tsx`

## Router State Model (Current)
Current router state telemetry uses:

| State | Meaning | Typical next state |
|---|---|---|
| `S1_WORKSTATION_GATING` | Evaluate workstation intent/action match | `S3`, `S4`, or `S5` |
| `S2_PLANNING` | Explicit observer plan emission before reasoning execute | reasoning execute |
| `S3_WORKSTATION_REQUEST_USER_INPUT` | Missing args or confirmation needed | `S5` or `S4` |
| `S4_WORKSTATION_RESOLVE` | Intent resolved without executable action | reasoning or conversational finalize |
| `S5_WORKSTATION_EXECUTE` | Deterministic workstation action execution | observer completion + optional reasoning |

Current router fail IDs include:
- `RF_MISSING_REQUIRED_ARGS`
- `RF_USER_CANCELLED`
- `RF_DUPLICATE_EXTERNAL_PROMPT`
- plus resolver-derived fail IDs from workstation intent outcomes

## Event Contracts (Observer + Reasoning)
Implemented in `client/src/components/helix/HelixAskPill.tsx`.

Plan/lifecycle events:
- `observer_plan_delta`
- `observer_plan_item_completed`
- `workstation_procedural_step`

Pending-request events:
- workstation request-user-input gating emits pending request metadata with `pending_server_requests`.

Evidence gate and retrieval events:
- `needs_retrieval` via observer plan delta when hard claims are not evidence-grounded.

Pass E completion/handoff artifacts:
- `observer_finalization`
- `observer_handoff`

Key exported builders and evaluators:
- `deriveObserverDispatchPlan`
- `buildObserverPlanDeltaEvent`
- `buildObserverPlanItemCompletedEvent`
- `buildWorkstationProceduralStepEvent`
- `buildWorkstationUserInputRequest`
- `resolvePendingWorkstationUserInput`
- `evaluateEvidenceFinalizationGate`
- `buildNeedsRetrievalPlanEvent`
- `buildObserverFinalizationEvent`
- `buildObserverHandoffEvent`
- `deriveHelixPlannerContract` (strict planner contract gate used before workstation execution)
- `ensureExplicitReasoningPlan` (internal gate enforcing explicit planning before reasoning execution)

## Workstation Lexicon and Capability Contract
Capability source-of-truth:
- `client/src/lib/workstation/panelCapabilities.ts`

Action execution adapters:
- `client/src/lib/workstation/panelActionAdapters.ts`

Current v1 deterministic lexicon scope includes:
- `docs-viewer` actions (`open_doc`, `open_doc_and_read`, `summarize_doc`, `summarize_section`, `explain_paper`)
- `workstation-notes` actions (`create_note`, `append_to_note`, `set_active_note`, `rename_note`, `delete_note`, `list_notes`)
- `workstation-clipboard-history` actions (`read_clipboard`, `write_clipboard`, `clear_history`, `copy_receipt_to_clipboard`, `copy_receipt_to_note`, `copy_selection_to_note`)

Capability metadata currently enforced:
- `aliases`
- `required_args`
- `optional_args`
- `requires_confirmation`
- `returns_artifact`

## Workstation Integration Points
Panel launch visibility policy:
- `client/src/lib/workstation/launchPanelPolicy.ts`

Job/workflow orchestration:
- `client/src/lib/workstation/jobExecutor.ts`

Clipboard utilities:
- `client/src/lib/workstation/workstationClipboard.ts`

Notes state store:
- `client/src/store/useWorkstationNotesStore.ts`

Desktop surface and panel wiring:
- `client/src/pages/desktop.tsx`
- `client/src/components/DocViewerPanel.tsx`

## End-to-End Flow (Current)
1. Utterance enters `runAsk` or voice auto path.
2. Deterministic parse attempts workstation action or action chain.
3. If required args missing or action is destructive without confirm, pending request is emitted and execution pauses.
4. Workspace actions dispatch through adapters and return deterministic artifacts.
5. Reasoning queue is dispatched for reasoning-heavy turns or explicit hybrid plans.
6. Every reasoning turn must emit an explicit observer plan artifact (`S2_PLANNING`) before execution.
7. Finalization runs evidence gate:
   - hard claim without sufficient grounding -> `needs_retrieval`
   - grounded claim -> normal finalization
8. Observer lane emits final typed artifacts:
   - `observer_finalization` (what completed and with what certainty/evidence)
   - `observer_handoff` (recommended workspace next actions and reasoning follow-ups)

## Pass Status
Implemented:
- Pass A: plan/event protocol
- Pass B: request-user-input protocol + pending request state
- Pass C: deterministic multi-action composition
- Pass D: evidence-gated finalization
- Pass E: observer completion + handoff artifacts
- Pass F: strict planner contract gate (plan-before-execute, workstation actionization guard for pasted-text explain turns)
  - Applied uniformly across `runAsk`, `voice_dispatch`, `external_prompt`, and submit-entry workstation gating paths.
- Pass G: reasoning admission and terminal quality hardening
  - planner contract now emits `reasoning_required: none|soft|hard`
  - docs explain/summarize actions default to workspace-owned execution unless hard reasoning cues are present
  - background reasoning queue admission now requires hard reasoning cues (or explicit background phrasing)
  - empty reasoning terminal responses now fail with `RF_EMPTY_TERMINAL` instead of appearing as successful finals
- UI turn stream pass:
  - latest turn renders as question, line-by-line agent work log, and final answer
  - older turns collapse behind expandable summaries
  - `/api/agi/ask/turn/stream` emits backend transcript events consumed by the UI
  - Unified Debug Copy includes backend runtime, transcript events, turn truth table, workspace state, voice timeline, visible answer state, and job-ready links
  - workspace actions now surface procedural steps and job-ready links instead of only canned receipts

Partially implemented:
- The line-by-line work log exists, but many rows are deterministic/runtime-generated instead of repeated LLM deliberation after each observation.
- The async executor records per-step duration, but local capability decisions still complete quickly because no model re-evaluation is required for simple commands.
- Final answer assembly uses terminal artifacts and runtime observations better than before, but it is not yet a universal composer for every task family.
- Reasoning Theater remains visible, but it is not fully unified as the collapsible "thinking" layer for the main answer stream.
- Job-ready links are now artifact-grounded, but final-answer link/action labels still depend on correct artifact identity resolution.

Open gaps found in UI testing on 2026-04-27:
- `what is this doc about?` routes through the current doc context, but the final answer degrades to document identity/path instead of a summary. Summary/explain intents must not be satisfied by `identify_current_doc` artifacts.
- `that note` works as a follow-up target in some flows, but the visible note label and job-ready link can remain `that` instead of resolving to the last created/active note title.
- `compare the current doc with my notes...` can produce shallow comparisons when note identity/body artifacts are not fully resolved.
- `put the centerline alpha location into quick NHM2 test note` currently clarifies instead of composing `docs-viewer.locate_in_doc -> workstation-notes.append_to_note`.
- Browser/UI tests must target `textarea[aria-label="Ask Helix"]`; after opening notes, the first textarea belongs to the note editor.

Not yet implemented:
- Full Codex-style loop where each step can decide model vs tool, execute, observe, then ask the model what to do next.
- True step-by-step LLM self-dialogue generation per subgoal.
- Automatic continuation until all required artifacts are satisfied for every task family.
- Collapsing the live thinking block automatically after completion while preserving it as a dropdown.
- A generalized final-answer synthesizer that always consumes all observations/artifacts rather than relying on action-specific answer shaping.

## Immediate Patch Priority
1. Summary terminal contract:
   - For summarize/explain/doc-about intents, active doc identity is context only.
   - Terminal success requires a summary/explanation artifact or a typed `summary_unavailable` failure.
   - Regression: `what is this doc about?` must not return only `You are currently on: <path>`.
2. Pronoun/note resolution:
   - Resolve `that note`, `this note`, and `my note` against the last created note, active note, or explicit note title.
   - Job-ready links must display the resolved note title/id, never the raw pronoun.
3. Two-step locate-to-note composition:
   - Support prompts such as `put the centerline alpha location into quick NHM2 test note`.
   - Plan shape: `docs-viewer.locate_in_doc` then `workstation-notes.append_to_note`.
   - Final answer must report both the location artifact and the note update artifact.

## Test Coverage
Primary regression and behavior tests:
- `client/src/components/__tests__/helix-ask-pill-ui.spec.tsx`
- `client/src/lib/workstation/__tests__/panelActionAdapters.spec.ts`

## Extension Rules For Future UI Tools
1. Add panel actions and metadata to `panelCapabilities.ts` first.
2. Implement adapter handlers in `panelActionAdapters.ts` with deterministic artifact payloads.
3. Add lexicon parsing in `HelixAskPill.tsx` before classifier fallback.
4. Enforce required-arg and confirmation gating through pending request protocol.
5. Emit typed observer lifecycle events for plan, completion, and handoff.
6. Add positive and negative tests for mapping, adapter behavior, and regression safety.

## Operational Note
If a new capability cannot be represented as a deterministic `panel_id + action_id + args` contract, treat it as a design gap and add a primitive first. Do not push ambiguity into free-form reasoning when the workflow should be executable.
