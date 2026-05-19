# Helix Ask / Codex Loop Discipline

Status: operational instruction.

This note compares the current Helix Ask backend posture against the bundled
Codex clone and sets the boundary for future work. It is intentionally a
procedure contract, not a claim that Helix Ask behavior is deterministic.

## Comparison Snapshot

- Helix Ask repo context: `pestypig/casimirbot-`, local worktree.
- Codex comparison target: `external/openai-codex` at
  `0b08d893042ba0c0d5c2f020b1c78b46af2ebe59`.
- Public `openai/codex` `main` observed during this comparison:
  `4ca60ef9fffe76fb4f86d606f7d4a2f727f6cd25`.

Codex and Helix Ask overlap in agent vocabulary, but they should not overlap in
ownership. Codex owns the generic agent runtime. Helix Ask owns the domain
evidence loop.

## Patch-Time Contract

Every Helix Ask patch that touches routing, source-target admission,
tool-admission, live-source handling, workstation actions, route-product
contracts, terminal authority, loop-parity traces, debug exports, or Ask API
behavior must start from this boundary check:

```txt
What part of this change is Codex-owned runtime mechanics?
What part is Helix-owned evidence/admission/proof policy?
What test proves a lexical cue did not become execution or answer authority?
```

Classify the patch before editing:

```txt
runtime-adapter
evidence-lane
retrieval-gate
proof-policy
live-source
presentation
Codex-owned runtime behavior
```

If the patch manages sampling, generic tool execution, retries, approvals,
sandboxing, compaction, session lifecycle, subagent orchestration, or terminal
turn completion, it belongs to Codex or to a thin Codex-compatible adapter. Do
not implement a parallel private loop in Helix Ask.

If the patch selects, normalizes, ranks, gates, proves, or rejects domain
evidence, it belongs in Helix Ask and must preserve equal-identity evidence:
observations are not assistant answers, receipts are not cognition, and
terminal authority requires the route-product contract.

For applicable patches, run the API parity matrix:

```bash
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
```

When testing against a running local server, use the top-level API probe:

```bash
npm run helix:ask:api-parity
```

Report disabled/frontier scenarios separately. Do not present a disabled
scenario as proof of the current contract.

## Codex-Owned Responsibilities

Do not recreate these in Helix Ask unless Codex cannot expose the capability:

- Turn/session lifecycle: one active task per session, interrupt/resume, thread
  context persistence, and compaction.
- Tool execution semantics: tool registry, tool-call readiness gates,
  mutating-tool serialization, and tool result events.
- Shell/file mutation safety: sandbox policy, permission requests, approval
  events, apply-patch interception, and command process management.
- Planning UI primitives: generic checklist/update-plan state.
- Subagent orchestration: spawn/wait/send/close mechanics and shared turn config.
- Generic realtime transport: conversation start/audio/text/close plumbing.

Helix Ask may call or mirror status from these surfaces, but it should not build
a parallel general-purpose agent loop around them.

Live visual capture is a domain evidence producer inside that same boundary:

```txt
source identity
  -> live source observation
  -> SituationRun epoch
  -> field worker run
  -> field evaluation
  -> interpretation / prediction / probe artifacts
  -> arbitration candidate
  -> terminal answer only through terminal authority
```

Live visual capture may create source items, observation items, validation
items, interpretation items, probe items, and arbitration candidates. It may not
create an independent assistant loop. It may not execute tools outside the
shared Ask/runtime adapter. It may not emit terminal text outside terminal
authority.

For hard visual/live/procedure-memory source-target intents, the preflight and
terminal guard must fail closed if the route tries to terminate as
`live_pipeline_receipt`, `client_projection`, `model_only_concept`,
`no_tool_direct`, or `panel_generated_answer`. Those artifacts are receipts or
views, not answer authority.

## Helix-Ask-Owned Responsibilities

Keep these first-class in Helix Ask because they are repo/domain policy, not
generic agent runtime:

- Evidence lanes: repo grep/git-tracked scan, Atlas/code lattice, Stage0/Stage05,
  concept cards, docs, artifacts, telemetry, and live source observations.
- Retrieval contracts: must-read paths, precedence paths, topic must-includes,
  missing/unreadable path checks, and precedence conflict handling.
- Objective coverage: required slots, objective-scoped retrieval recovery,
  mini-answer validation, unknown blocks, and final assembly gates.
- Proof and maturity policy: no repo-attributed claim without proof pointers;
  no proof/viability/certification language without the right gate packet.
- Live source identity: screen/audio/browser/workstation sources are observations
  with provenance, freshness, consent, and state. They are never assistant
  answers and never deterministic truth by themselves.
- Domain-specific actions: verification adapters, physics/warp policies,
  panel evidence summaries, and mission callouts.

## Equal-Identity Evidence Rule

Every input lane must enter the Helix Ask loop as an evidence candidate with the
same envelope shape:

```ts
type HelixEvidenceObservation = {
  id: string;
  lane: "repo_search" | "git_tracked" | "stage0" | "atlas" | "manual_contract";
  source_kind:
    | "repo_code"
    | "repo_doc"
    | "artifact"
    | "telemetry"
    | "live_screen"
    | "live_audio"
    | "browser"
    | "operator_text";
  source_id: string;
  observed_at: string;
  freshness_ms?: number;
  provenance: "measured" | "retrieved" | "declared" | "inferred";
  confidence: number;
  refs: string[];
  content_role: "evidence_not_assistant_answer" | "observation_not_assistant_answer";
  consent_state?: "not_required" | "requested" | "granted" | "revoked";
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  snippet?: string;
  term?: string;
  query?: string;
  score?: number;
  sourceStage?: "preflight" | "fallback_repo_search" | "stage0_code_floor" | "objective_recovery";
};
```

The shared TypeScript contract lives in `shared/helix-evidence-observation.ts`.
Repo-search formatting must emit these observations alongside text snippets so
debug traces preserve source identity even when the answer composer still reads
the legacy `Repo search hits:` block.
Retrieval context attempts must merge and carry observations forward; debug
payloads are only a visibility surface, not the source of proof authority.

Final repo-grounded answers then pass through a repo-claim observation gate.
The gate is controlled by `HELIX_ASK_REPO_CLAIM_OBSERVATION_GATE` with
`off`, `shadow`, `repair`, and `fail` modes. In `shadow` mode it records
unsupported implementation claims without mutating the answer. In `repair`
mode unsupported implementation claims are downgraded into `Next evidence
needed`. In `fail` mode unsupported repo implementation claims fail closed with
`REPO_CLAIM_OBSERVATION_SUPPORT_MISSING`.
Gate debug must include a compact support trace: claim ids, support status,
matched observation ids, match reasons, and matched observation file/line
locations. Visible repo sources are rendered from matched observations only;
legacy file lists remain retrieval metadata, not proof.

The loop can rank evidence, but it cannot promote one lane to answer authority
without passing the same proof/coverage gates. A live source is equal in
identity to repo grep or telemetry: useful evidence, not final truth.

## UI Turn Discipline

Live UI tests are source-identity tests, not demos. Treat the browser-visible
turn, streaming transport, non-streamed backend route, debug export, and evidence
observations as equal live sources that must reconcile to the same terminal
turn.

A Helix Ask UI turn has not passed until all of these are true:

1. The UI emits exactly one terminal visible result: final answer, typed failure,
   or fail-closed result.
2. The terminal visible result matches the backend terminal payload for the same
   turn.
3. The stream closes after the terminal event; it must not leave the user in an
   indefinite `Thinking` state.
4. The visible turn id or trace id can retrieve the debug/export payload.
5. Repo-grounded turns include `repo_claim_observation_gate`,
   `repo_claim_support`, and observation-backed sources when implementation
   claims are present.

Streaming and non-streamed routes are two presentations of the same turn
contract. `/api/agi/ask/turn/stream` may expose progress events, but only the
gated terminal payload is answer authority. `/api/agi/ask/turn` must return an
equivalent terminal payload for the same request class and must not crash or
drop the dev server when the streamed route would emit a typed failure.

Workspace context attachment is turn input, not ambient authority. The UI may
offer an attach/isolated choice before a reasoning turn, but repo/code evidence
prompts should default the timer to isolated execution unless the user explicitly
attaches workspace context. Screen, document, visual, and deictic prompts may
default to attached context.

Model timeouts, missing terminal events, lost debug exports, and connection
drops are runtime failures. Do not classify them as retrieval, observation, or
repo-claim gate failures unless the terminal debug payload proves that the
retrieval/gate stage actually ran.

## Repo/Code Intent Precedence

Explicit repo/code evidence requests have precedence over live Situation Room
and model-only routes.

If the prompt asks for repo/code evidence, source files, file paths,
line-backed sources, implementation location, contracts, schemas, routes,
modules, or where behavior is enforced in code, Helix Ask must route the turn as
a repo evidence question before evaluating deictic screen context.

Words such as `file` and `path` are ambiguous. They are Situation Room cues only
when paired with current-screen language such as `clicking`, `selected`,
`looking at right now`, `my screen`, or `current window`. They are repo evidence
cues when paired with `repo`, `repository`, `code`, `source`, `implementation`,
`line-backed`, `contract`, `module`, `route`, or `where enforced`.

A hard repo/code evidence turn may not terminate as:

- `situation_context_question`
- `artifact_synthesis`
- `no_tool_direct`

It must either:

1. produce evidence observations,
2. answer through the repo-claim observation gate, or
3. fail closed with a typed repo evidence reason.

Project-local entity definition prompts such as `What is StarSim?`, `What is
NHM2?`, or `What is Helix Ask?` should use repo evidence unless the user
explicitly asks for background-only or general-concept-only reasoning.

## Live Source Control Admission

Live source control is a tool action, not a lexical side effect. A number,
cadence, interval, or rate mention is not enough to admit `live_pipeline_control`
or `situation-room.live-source.set_rate`.

Codex's turn loop samples the model over the full current prompt/history,
records model-requested tool calls, executes those tool calls, records tool
outputs back into the turn, and only then samples again or closes the turn. That
shape means a phrase inside user context cannot silently become a tool action
unless the turn path admits it as a tool request.

Helix Ask must preserve the same discipline:

1. A visual-content request wins over a cadence mention when the prompt asks to
   review, explain, describe, or summarize the current screen/capture/frame.
2. Negated, historical, future, or conditional cadence mentions are context, not
   commands. Examples: `I haven't started the interval 10 seconds yet`,
   `without starting the interval`, `not running every 10 seconds yet`.
3. `live_pipeline_control` requires an affirmative control act such as `set`,
   `change`, `update`, `start`, `enable`, `turn on`, or a continuation command
   like `keep checking my screen every 10 seconds`.
4. If the prompt is a visual question and no answerable evidence exists, fail
   through the visual/SituationRun evidence contract. Do not switch to a pipeline
   receipt just because a cadence token appears.
5. Debug export must expose the admission decision:
   `source_target_intent`, route candidate, terminal artifact kind, selected
   source refs, rejected source refs, and whether any control tool was actually
   admitted.

Regression prompt:

```txt
all right cool can you review what is happening right now in the screen capture I haven't started the interval 10 seconds yet
```

Required behavior:

- route: `situation_context_question`
- source target: `visual_capture`
- terminal artifact: visual/SituationRun context or typed visual evidence
  failure
- forbidden: `live_pipeline_control`, `live_pipeline_receipt`,
  `situation-room.live-source.set_rate`, and cadence adoption requests

Control/status contrast prompt:

```txt
keep checking my screen as a live answer every 10 seconds
```

Required behavior:

- route: `live_pipeline_control`
- terminal artifact: `live_pipeline_receipt`
- answer authority: control/status receipt only
- forbidden: visual scene answer text

Contextual cadence prompts:

```txt
review the current screen before I start the 10 second interval
what changed since the previous visual capture, and was the 10 second interval running?
```

Required behavior:

- route: visual/SituationRun evidence or procedure-memory evidence
- `requested_rate_ms = null`
- `control_tool_admitted = false`
- forbidden: `live_pipeline_receipt` as final answer

## Receipt Boundary

`live_pipeline_receipt` is valid only for control/status operations. It is not a
valid terminal answer for visual-content, procedure-memory, scene-epoch,
visual-delta, repo-evidence, or project-local implementation questions.

A visual-content question may terminate as visual/SituationRun evidence,
procedure epoch evidence, scene comparison evidence, or a typed visual/procedure
failure. It must not terminate as `live_pipeline_control`,
`live_pipeline_receipt`, `client_projection`, `process_graph_overview`,
`model_only_concept`, `no_tool_direct`, or `panel_generated_answer`.

If no answerable visual/SituationRun evidence exists, fail closed with a typed
visual evidence reason. Do not substitute a capture/cadence/pipeline receipt.

## Debug Admission Trace

Every source-targeted turn must expose a compact admission trace through the
existing debug surfaces:

- `turn_id`
- `source_target_intent`
- route candidate and selected route
- suppressed routes
- terminal artifact kind
- selected and rejected source refs
- whether a control tool was admitted
- control tool name and call id when present
- proof gate status
- typed failure reason when present

For cadence decisions, debug must make these facts inferable or explicit:
cadence mention detected, contextual/negated cadence detected, affirmative
control act detected, requested rate, visual-content request detected, and final
control admission.

## Route Authority Audit

Helix Ask must distinguish content correctness from route authority correctness.

A terminal answer is valid only when both are true:

1. the terminal text is server-authoritative and not projection/fabrication
   poison;
2. the terminal artifact kind is allowed for the prompt, source-target intent,
   route product contract, and available evidence state.

A clean poison audit does not imply a correct route. A route may be invalid even
when selected text is stable, server-authored, and visible-client-matched.

Every source-targeted turn must emit or make available
`helix.route_authority_audit.v1` with:

```txt
turn_id
prompt_hash
source_target
target_kind
selected_route
terminal_artifact_kind
final_answer_source
route_product_precedence_reason
allowed_terminal_artifact_kinds
forbidden_terminal_artifact_kinds
terminal_artifact_allowed
route_authority_ok
route_authority_violation_code
```

Stable violation codes:

```txt
terminal_product_authority_mismatch
receipt_used_as_content_answer
client_projection_used_as_answer
process_graph_used_as_visual_evidence
pipeline_status_used_as_live_cognition
model_only_used_for_source_targeted_turn
no_tool_direct_used_for_hard_source_target
procedure_memory_bypassed
repo_evidence_bypassed
visual_evidence_bypassed
```

If `route_authority_ok = false`, the turn must fail closed with a typed failure
or be rejected before presentation. It must not present the forbidden artifact as
the final answer.

## Contextual Tool-Verb Admission

Tool verbs inside user text are not tool calls by default.

Words such as `open`, `click`, `run`, `start`, `stop`, `capture`, `search`,
`inspect`, `repair`, `attach`, `adopt`, `refresh`, and `verify` may create route
candidates, but they may not admit execution unless the prompt is an affirmative
operator command.

Treat these as context, not commands:

```txt
I haven't clicked it yet
before I open that panel
after we run the verification
if we later refresh the source
was the capture running?
why did it inspect the pipeline?
the previous answer said to run repair
the screen shows a button labeled Start
```

Treat these as possible commands only after source-target admission:

```txt
click that button
open the current document
run the verification path
start the live source
refresh the capture
inspect the pipeline status
repair the live answer binding
```

For mixed prompts, content questions beat control verbs unless the user clearly
asks for the control action as the requested output.

Examples:

```txt
review the current screen before I click Start
```

Required: `visual_capture / situation_context_question`, no click action
admitted.

```txt
what changed since the last scene after the capture refreshed?
```

Required: `procedure_memory / situation_epoch`, no refresh action admitted.

```txt
click Start, then tell me whether the click was accepted
```

Required: workstation/control receipt only; no visual-scene answer unless a
second admitted evidence turn runs.

## Non-Redundancy Gate

Before adding backend logic, classify it as one of:

```txt
runtime-adapter
evidence-lane
retrieval-gate
proof-policy
live-source
presentation
```

If the change manages sampling, tool execution, session lifecycle, retries,
sandboxing, approvals, patches, compaction, or subagents, it belongs to Codex or
to a thin Codex-compatible adapter.

If the change selects, normalizes, ranks, gates, proves, or rejects domain
evidence, it belongs in Helix Ask.

If the change emits user-visible claims, it must cite proof pointers or return a
typed unknown/fail-closed result. If the change consumes a live source, it must
record source id, consent, freshness, provenance, observation role, and terminal
eligibility. If the change triggers execution or verification, the result must
attach to a proof packet or explicit fail reason.

## Project-Local Agent Loop Questions

Questions about Helix Ask, Codex discipline, the agentic turn loop, route
planning, source-target intent, terminal authority, tool eligibility, repo grep
behavior, process-graph shortcuts, SituationRun, field workers, interpretation
workers, or Live Answer environment binding are project-local implementation
questions unless explicitly scoped as background-only.

They must not terminate as `model_only_concept / no_tool_direct`.

They must enter either:

- repo/runtime evidence diagnosis,
- route/tool eligibility diagnosis,
- or typed failure.

For hard project-local implementation turns, Helix Ask must set:

```txt
retrieval_required_signal.required = true
retrieval_required_signal.strength = hard
source_target_intent.target_source = repo_code
source_target_intent.allow_client_shortcut = false
source_target_intent.allow_no_tool_direct = false
```

The terminal answer must include enough debug evidence to explain whether a
tool path was allowed or blocked: route classification, retrieval requirement,
source-target intent, route product contract, and terminal authority.

Codex owns the generic runtime loop: model sampling, tool execution,
observations, follow-up sampling, cancellation, and terminal turn completion.
Helix owns source-target admission, evidence identity, live SituationRun
procedure memory, repo/code proof gates, and terminal eligibility.

Therefore Helix may decide that repo/runtime evidence is required, but it must
not execute tools through private worker loops. Tool execution must still pass
through the shared runtime/tool adapter path.

## Source Target Admission

Every source-targeted turn must bind a `helix.ask_source_target_intent.v1`
record before route execution. The record is admission control, not answer
content. It must state the target source, target kind, strength, requested
outputs, and whether the turn must enter backend Ask.

Hard source-targeted prompts must set:

```txt
must_enter_backend_ask = true
allow_client_shortcut = false
allow_no_tool_direct = false
```

This applies to visual capture/current screen prompts, procedure memory and
situation-epoch prompts, docs-viewer evidence prompts, world-event prompts, and
hard repo/code evidence prompts. These prompts may not be answered by a client
process-graph shortcut, legacy projection, no-tool direct answer, or ambient
workspace context.

Client process-graph overview is allowed only for explicit workstation/process
overview prompts. It must decline procedure-memory and source-target prompts
such as:

```txt
What changed in the last situation epoch?
What changed since last seen epoch?
What changed since the previous visual?
Compare current scene to last capture.
What is the difference between the last scene and what I am looking at now?
Show the evidence.
Why did you say that?
Replay that.
Explain what is in the visual capture.
What is happening in the live source?
What is on the current screen?
```

Procedure-memory prompts must terminate as `procedure_epoch_replay`,
`procedure_memory_recall`, `situation_context_pack` with selected epoch
evidence, or a typed procedure-memory failure. A process-graph overview is not
a valid terminal product for those turns.

The process graph can answer explicit workstation questions such as "what
panels are open" or "what changed in the process graph." It cannot answer
scene, epoch, visual-delta, live-source, evidence, or procedure-memory prompts.
Those prompts must enter backend Ask and produce an `ask:` turn, canonical goal,
artifact ledger, route reason, and terminal authority.

## Live Capture Is Not Live Cognition

A browser-adopted visual producer is only a capture source. It is not, by
itself, an active Live Answer situation.

For visual live answers, Helix must distinguish:

1. capture pipeline status,
2. client adoption status,
3. source freshness,
4. live environment binding,
5. active SituationRun,
6. field-worker evaluation availability,
7. interpretation availability,
8. live-card projection freshness,
9. terminal answer authority.

A route that asks about scene epochs, visual deltas, worker lanes,
interpretations, or Live Answer panel readiness must not terminate as a generic
`live_pipeline_receipt`.

It must either:

- select current SituationRun evidence,
- produce a live environment binding diagnosis,
- create a repair candidate,
- or fail closed with a typed visual situation reason.

This preserves Codex discipline: capture, observations, evaluations,
diagnoses, repair candidates, and terminal answers are separate items. No
client shortcut or pipeline receipt may collapse them into one deterministic
answer.

Use these stable labels when a UI turn cannot be reconciled:

```txt
turn_terminal_event_missing
turn_stream_backend_mismatch
turn_debug_export_missing
turn_non_streamed_route_dropped
turn_model_direct_answer_timeout
repo_claim_gate_trace_missing
```

## Non-Redundancy Test

Before adding Helix Ask backend logic, answer these questions:

1. Is this generic session, turn, tool, sandbox, approval, patch, compaction, or
   subagent orchestration?
   - If yes, use Codex-owned structure or expose a thin adapter.
2. Is this selecting, normalizing, ranking, or gating domain evidence?
   - If yes, it belongs in Helix Ask.
3. Does this produce a user-visible claim?
   - If yes, it must cite proof pointers or emit an UNKNOWN/blocked result.
4. Does this consume a live source?
   - If yes, record consent/state/freshness and mark it as observation-only.
5. Does this trigger execution or verification?
   - If yes, bind the result to a proof packet or explicit fail reason.

If a proposed change fails this test, it is probably redundant methodology.

## Procedure For Backend Patches

Use this sequence for future Helix Ask agent-loop patches:

1. Classify the patch as `runtime-adapter`, `evidence-lane`, `retrieval-gate`,
   `proof-policy`, `live-source`, or `presentation`.
2. For `runtime-adapter`, keep the implementation thin and delegate lifecycle,
   tool execution, and permissions to Codex-compatible primitives.
3. For `evidence-lane`, return proof shards only. Do not let the lane write the
   answer.
4. For `retrieval-gate`, update objective slots, selected files, and debug
   transcripts so replay can explain why a source was trusted or rejected.
5. For `proof-policy`, fail closed when required evidence is missing, stale, or
   outside the allowed source class.
6. For `live-source`, require explicit source state and preserve
   observation-only semantics.
7. For `presentation`, show maturity/gate status without hiding required proof
   packet fields.

## Instruction Delta

Future instructions to Helix Ask should use this language:

> Treat Codex as the generic agent loop owner. Helix Ask must not duplicate
> Codex session, turn, tool, sandbox, approval, patch, compaction, or subagent
> orchestration. Helix Ask owns evidence retrieval, live-source provenance,
> objective coverage, proof gates, and domain-specific answer policy. All live
> sources, repo hits, artifacts, telemetry, and operator text enter as equal
> evidence observations with provenance and freshness. No observation is an
> assistant answer. No repo/system claim is emitted without proof pointers or a
> typed UNKNOWN/fail-closed reason.

## Regression Prompts

Use these prompts when checking that the boundary holds:

```txt
What evidence source is Helix Ask using right now, and why is it allowed to answer?
```

Expected: lists evidence observations and gate status, not raw tool logs.

```txt
Read the current live source and explain whether it changes the repo-grounded answer.
```

Expected: live source is treated as observation-only and compared against repo
evidence with freshness/provenance.

```txt
Find the StarSim backend lanes and explain where the answer is grounded.
```

Expected: repo evidence lane produces paths/snippets; final answer remains
gate-validated.

```txt
Run the verification path and tell me what passed.
```

Expected: answer cites proof packet fields or fails closed with a stable reason.
