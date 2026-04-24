# Helix Ask Agentic Loop: Current Overview

Last updated: 2026-04-23

## Purpose
This document is the current implementation map for the Helix Ask agentic loop and workstation orchestration. Use it as the source-of-truth context before generating new code for routing, events, or UI action primitives.

Companion execution handoff:
- `docs/helix-ask-next-pass-instructions.md`

## Codex-Clone Grounding (Methodology Baseline)
The Helix loop is aligned to the proven codex app-server patterns:

- Plan/lifecycle artifact pattern: `external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs`
- Request-user-input roundtrip pattern: `external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs`
- Explicit request/turn error typing: `external/openai-codex/codex-rs/app-server/src/server_request_error.rs`
- Deterministic bespoke event lifecycle: `external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs`

Helix parity principle: prefer typed, streamed lifecycle artifacts over prose-only status text.

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
