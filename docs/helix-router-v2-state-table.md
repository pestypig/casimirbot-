# Helix Router v2 (State Machine + Lane Contracts + Failure Contracts)

Status: Draft
Owner: Helix Ask routing
Primary target file: `client/src/components/helix/HelixAskPill.tsx`

## Scope
This spec defines a deterministic-first router for Ask turns, with command handling prioritized over reasoning dispatch. It is designed to map directly to existing code paths and telemetry while reducing `workstation_intent_stage` stalls.

## Objectives
1. Preserve command reliability for workstation/document actions.
2. Keep classifier advisory, never mandatory for command execution.
3. Make every branch emit a stable, replay-safe contract label.
4. Separate workspace command lane from reasoning lane.

## Router Inputs
- `question` (raw turn text)
- `source` (`voice_auto | manual | external_prompt | submit`)
- `answerContract` (optional docs-viewer contract)
- `bypassWorkstationDispatch`, `forceReasoningDispatch`
- `currentDocPath` (from doc viewer store)

## State Machine

| State ID | Name | Purpose | Current code anchor |
| --- | --- | --- | --- |
| `S0` | `TURN_ACCEPTED` | Normalize incoming turn and source context. | `runAsk` entry and sibling paths at ~`18928`, `19546`, `19868`, `15266` |
| `S1` | `WORKSTATION_GATING` | Decide if workstation lane should be attempted. | `shouldStageWorkstationIntent` checks at ~`15268`, `18948`, `19552`, `19872` |
| `S2` | `WORKSTATION_PARSE` | Deterministic parse (`parseWorkstationActionCommand`). | parser at ~`7570` |
| `S3` | `WORKSTATION_CLASSIFY_ADVISORY` | Optional classifier probe with timeout fallback. | `classifyWorkstationActionIntent` at ~`10079` |
| `S4` | `WORKSTATION_RESOLVE` | Resolve action or no-action with typed outcome label. | `formatWorkstationIntentStageDetail` at ~`238` |
| `S5` | `WORKSTATION_EXECUTE` | Dispatch workstation action and emit fast-path receipt. | dispatch blocks at ~`15291`, `18970`, `19585`, `19905` |
| `S6` | `LANE_SELECT_POST_WORKSTATION` | Choose direct prompt vs queued reasoning for non-command turns. | lane selection at ~`19036-19054` |
| `S7A` | `DIRECT_REPLY_EXECUTE` | Execute ask directly (no queued manual reasoning). | `manualDispatchHint=false` branch around ~`19080-19123`, ask call at ~`19185` |
| `S7B` | `REASONING_QUEUE_EXECUTE` | Create manual/background attempt and queue reasoning as needed. | attempt creation at ~`19080-19117` |
| `S8` | `ASK_EXECUTION` | Run `askLocalWithPreflightScopeFallback` / stream / finalize. | ask call at ~`19185`; fallback helper at ~`3804` |
| `S9` | `FINALIZE` | Persist reply, timeline final, clear busy state. | finalize blocks around ~`19254+`, `19424+`, `19455` |
| `SF` | `FAIL_SAFE_TERMINAL` | Emit deterministic fail contract and user-safe status. | existing failure/suppressed timeline patterns in run/reasoning flows |

## Transitions and Guards

| From | To | Guard | Action |
| --- | --- | --- | --- |
| `S0` | `S1` | always | Build normalized turn + source metadata. |
| `S1` | `S2` | `!explicitPanelCommand && !bypassWorkstationDispatch && (parsedCandidate || shouldProbeClassifier)` | Start `workstation_intent_stage` receipt with `status=running`. |
| `S1` | `S6` | otherwise | Skip workstation lane. |
| `S2` | `S4` | deterministic parse matched | Set outcome `command_parse`. |
| `S2` | `S3` | no deterministic parse and probe allowed | Launch advisory classifier. |
| `S3` | `S4` | classifier returned/timeout/error | Map outcome to typed label (`classifier_match`, `timeout_fallback`, `low_confidence`, `classifier_error`, `not_probed`). |
| `S4` | `S5` | `resolvedAction != null` | Patch timeline `done`, execute workstation action. |
| `S4` | `S6` | `resolvedAction == null` | Patch timeline `suppressed` with typed no-match reason. |
| `S5` | `S9` | always | Fast-path assistant acknowledgement reply. |
| `S6` | `S7A` | `simpleDirectPromptLane=true` | Direct lane status and optional background queue. |
| `S6` | `S7B` | `simpleDirectPromptLane=false` | Manual reasoning attempt queued/running. |
| `S7A` | `S8` | always | Invoke ask directly. |
| `S7B` | `S8` | always | Invoke ask with queued attempt semantics. |
| `S8` | `S9` | success | Emit reasoning final + response payload. |
| `S8` | `SF` | failure/abort/suppression | Emit deterministic failure contract, then finalize safely. |

## Lane Contracts

### Contract LC1: Workstation command lane (strict)
- Entry: `S1 -> S2`
- Priority: higher than reasoning lane.
- Classifier role: advisory only (`S3`), timeout bounded.
- Required telemetry:
  - timeline `kind=workstation_intent_stage`
  - detail format: `workstation_intent_stage | <action_resolved|no_action_match> | <outcome_label>`

### Contract LC2: Direct docs/read lane
- Entry: `S6` when `docsViewerWorkstationLane` or `isSimpleDirectPromptLaneCandidate`.
- Required context behavior:
  - resolve anchor using `resolveDocsViewerAnchorPathForQuestion`.
  - include `contextFiles=[anchorPath]` when available.
- Reasoning behavior:
  - no mandatory queued reasoning for immediate response.
  - optional background reasoning allowed only by explicit workspace heuristics.

### Contract LC3: Reasoning lane
- Entry: `S6 -> S7B` when not direct lane.
- Must create/update reasoning attempt records and timeline entries.
- Must preserve preflight fallback (`askLocalWithPreflightScopeFallback`).

## Guard Contracts (Normative)

| ID | Guard | Definition | Current mapping |
| --- | --- | --- | --- |
| `GC1` | `is_explicit_panel_command` | `^/open` command bypasses workstation classifier lane. | checks near `explicitPanelCommand` in all entry paths |
| `GC2` | `is_workstation_candidate` | parsed command exists OR probe heuristic true. | `shouldStageWorkstationIntent` |
| `GC3` | `classifier_timeout_bounded` | classifier must complete within fixed timeout and fall back deterministically. | timeout at `HELIX_WORKSTATION_INTENT_CLASSIFIER_TIMEOUT_MS` |
| `GC4` | `docs_anchor_resolution` | docs deictic prompts resolve explicit path, else active doc path. | `resolveDocsViewerAnchorPathForQuestion` |
| `GC5` | `direct_lane_eligibility` | docs/direct-read/simple prompt routes to direct lane unless force reasoning. | `simpleDirectPromptLane` logic |
| `GC6` | `background_queue_gate` | background reasoning only when direct lane and workspace reasoning cue exists. | `shouldQueueWorkspaceBackgroundReasoning` |

## Failure Contracts (Deterministic Labels)

All failures should resolve to a stable `router_fail_id` in timeline/debug metadata.

| ID | Condition | Required user-facing behavior | Required telemetry |
| --- | --- | --- | --- |
| `RF_NO_ACTION_NOT_PROBED` | workstation lane skipped by policy | continue to lane selection without stall | `no_action_match | not_probed` |
| `RF_CLASSIFIER_TIMEOUT` | advisory classifier timed out | fall back to deterministic action or clean no-match | `timeout_fallback` |
| `RF_CLASSIFIER_ERROR` | advisory classifier error | fall back to deterministic action or clean no-match | `classifier_error` or `classifier_error_fallback` |
| `RF_LOW_CONFIDENCE` | classifier output below confidence floor | deterministic fallback/no-match; no stall | `low_confidence` or `low_confidence_fallback` |
| `RF_DUPLICATE_EXTERNAL_PROMPT` | external prompt single-flight collision | suppress duplicate; preserve first run | `turnTransition_duplicate_prompt` |
| `RF_ASK_ABORTED` | user/system abort | deterministic stop status and safe finalize | existing stop/finalize timeline entries |
| `RF_PRECHECK_FALLBACK` | preflight scope error downgraded | continue with downgraded mode; keep trace | `askLocalWithPreflightScopeFallback` downgraded metadata |

## High-Impact Improvements (Delta from current)

1. Add explicit `router_state` and `router_fail_id` into `meta` for every `workstation_intent_stage` entry.
2. Add `S2B` deterministic synonym expander table (phrase normalization before parse).
3. Add `S4 fail-open docs` guard:
   - if docs cue is true and no action match, force `open_panel docs-viewer` instead of silent no-match.
4. Add per-source stall watchdog:
   - if `workstation_intent_stage` remains `running` over threshold, auto-transition to `suppressed` with `RF_CLASSIFIER_TIMEOUT`.
5. Add metrics counter family:
   - `router_transitions_total{from,to,source}`
   - `router_failures_total{router_fail_id,source}`

## Minimal Implementation Plan

1. Instrumentation pass
   - Attach `router_state` and `router_fail_id` to existing timeline `meta` patches in all four workstation entry paths.
2. Deterministic normalization pass
   - Add phrase normalization map before `parseWorkstationActionCommand`.
3. Docs fail-open pass
   - In `S4`, if docs cue/anchor exists and `action=null`, emit `open_panel docs-viewer`.
4. Watchdog pass
   - Add timeout guard for any `workstation_intent_stage` still in `running`.
5. Regression suite pass
   - Add utterance variants from real logs to `helix-ask-pill-ui.spec.tsx` and assert outcome labels.

## Acceptance Criteria

1. No `workstation_intent_stage` entry remains `running` without terminal patch.
2. Command-like doc prompts resolve via workstation lane without reasoning stall.
3. All workstation no-match outcomes include stable reason labels.
4. Direct docs prompts remain low-latency and preserve workspace context anchoring.
5. Existing ask/reasoning success paths remain behavior-compatible.
