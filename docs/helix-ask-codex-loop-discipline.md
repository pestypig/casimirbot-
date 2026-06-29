# Helix Ask / Codex Loop Discipline

Status: operational instruction.

This note compares the current Helix Ask backend posture against the bundled
Codex clone and sets the boundary for future work. It is intentionally a
procedure contract, not a claim that Helix Ask behavior is deterministic.

## Comparison Snapshot

- Helix Ask repo context: `pestypig/casimirbot-`, local worktree.
- Local Codex reference checkout: `external/openai-codex-compare` when present.
  It is intentionally ignored by git and sparse-checked to `codex-rs/core/src`,
  `codex-rs/mcp-server/src`, `docs`, and `README.md` for agent comparison work.
  Do not commit this local checkout.
- Existing tracked gitlink: `external/openai-codex` is a repo gitlink at
  `0b08d893042ba0c0d5c2f020b1c78b46af2ebe59`; do not use it as a mutable local
  scratch clone.
- Public `openai/codex` `main` observed during this comparison:
  `5a4202ad909c2918486bbdd911babf636f498990`.
- Compared files:
  - `codex-rs/core/src/session/turn.rs`
  - `codex-rs/mcp-server/src/codex_tool_runner.rs`
  - `codex-rs/core/src/exec.rs`

Codex and Helix Ask overlap in agent vocabulary, but they should not overlap in
ownership. Codex owns the generic agent runtime. Helix Ask owns the domain
evidence loop.

## Agent Runtime Adapter Boundary

Selectable runtimes such as Helix Ask Native, Codex Workstation Mode, and future
agent wrappers must meet Helix through a provider adapter boundary. Each runtime
speaks differently: one may be a CLI process, another an SDK, another an HTTP
agent, and another an MCP-capable runtime. Adapter-specific glue is therefore
expected for launch, streaming, tool-request translation, cancellation, and final
output normalization.

That glue must stay at the adapter edge. Do not spread runtime-specific protocol
handling through `server/routes/agi.plan.ts`, golden-path capability modules,
workstation panel code, or terminal-authority writers. A provider adapter may
translate between the runtime's native protocol and Helix's shared contracts,
but Helix remains the owner of:

```txt
capability manifests
permission profiles
tool/action admission
workstation gateway calls
action receipts
observation packets
evidence re-entry records
goal satisfaction
terminal authority
debug export mirrors
visible trace projection
```

Adding an agent should normally require a thin provider implementation, not a
repository-wide graft of the agent's source code or runtime internals. The
provider may expose `id`, `label`, `enabled`, `supports`, `runTurn`, and
`streamTurn` behavior, plus narrow protocol translation. It must not bypass
Helix source admission, mutate workstation state outside admitted actions, write
files, run shell commands, or promote receipts/panel projections/debug metadata
into answers.

The shared workstation view for every selected runtime is:

```txt
provider selected
-> capability/action manifest
-> requested capability/action
-> Helix admission or block
-> executed capability/action
-> observation or receipt
-> observation re-entry
-> runtime final candidate
-> Helix terminal authority
-> visible/debug projection
```

Future agent onboarding should improve this shared contract instead of adding
private side channels. If a new provider needs more workstation affordances,
extend the Helix gateway/action manifest and admission policy first, then teach
the adapter to translate the runtime's native request format into that contract.

The compared Codex files reinforce that split:

- `turn.rs` runs the sampling loop: prompt/history assembly, model response
  handling, tool-call follow-up, assistant-message completion, pending input,
  hooks, and compaction.
- `codex_tool_runner.rs` bridges MCP `tools/call` into Codex thread/session
  execution, streams events, handles exec/patch approval requests, and resolves
  the MCP call only on Codex `TurnComplete` or error.
- `exec.rs` owns command execution mechanics: sandbox transformation,
  permission profile application, network policy, Windows/Linux sandbox
  selection, cancellation, timeout, output caps, and exec result finalization.

None of those are Helix Ask route policy. Helix Ask may observe or wrap their
outputs, but it must not recreate them.

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
prompt interpretation
intent arbitration
source admission
tool admission
evidence normalization
evidence re-entry
follow-up reasoning
terminal authority
presentation
Codex-owned runtime behavior
```

If the patch manages sampling, generic tool execution, tool-result re-entry,
retries, approvals, sandboxing, compaction, session lifecycle, subagent
orchestration, or terminal completion, it belongs to Codex or to a thin
Codex-compatible adapter. Do not implement a parallel private loop in Helix Ask.

If the patch selects, normalizes, ranks, gates, proves, or rejects domain
evidence, it belongs in Helix Ask and must preserve equal-identity evidence:
observations are not assistant answers, receipts are not answers, classifiers
are not authority, and terminal authority requires the completed solver path
plus the route-product contract.

Reject or flag changes that implement:

```txt
private sampling loop
private tool execution runtime
sandbox/approval lifecycle
session compaction
subagent orchestration
terminal completion machinery
```

Every shortcut-like rule must include adversarial tests:

```txt
contextual cue
negated cue
future/conditional cue
historical cue
quoted/screen-visible cue
mixed intent prompt
```

Use the discipline checks as a routing aid, not as blanket ceremony. The cheap
static classifier remains useful during edit loops:

```bash
npm run helix:ask:discipline:quick
```

The quick guard verifies the ignored Codex runtime reference checkout when
needed, scans Helix Ask-sensitive changed files for poison/shortcut risks, and
prints inferred classifications. It is advisory unless it reports a hard static
failure.

Do not run the full discipline guard as a universal handoff gate. It runs a
fixed, expensive battery even when the changed files need a narrower check, and
its per-file `required_tests` report is informational. Select verification by
the contract changed.

For prompt interpretation, lexical/tool cue, shortcut-like rule,
mixed-intent, source admission, or tool-admission changes, run the adversarial
prompt-solving benchmark:

```bash
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
```

For Ask API, route-product, loop-parity, terminal-authority, or presentation
contract changes, run the API parity matrix:

```bash
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
```

For live-source identity or continuation changes, run the full live-source
discipline battery:

```bash
npm run helix:ask:discipline:full
```

When testing against a running local server, use the top-level API probe:

```bash
npm run helix:ask:api-parity
```

### Localhost Server And Secret Boundary

Live agent/LLM-path parity must use the operator's already-configured localhost
server. Do not start a new development server solely to validate agent behavior
unless the user explicitly asks for that process.

Reason: a server started from an agent shell may lack provider keys, tenant
headers, auth state, browser/workstation bindings, or the exact environment that
the operator uses when Helix Ask can reliably call model-backed steps. That
creates false confidence: the route may be tested under a non-representative
runtime, or the check may silently avoid the model path that the patch is meant
to validate.

Required behavior for future patches:

1. Run static/unit/build checks that do not require secrets from the agent shell.
2. For live agent parity, first check whether a suitable localhost server is
   already running at `HELIX_ASK_BASE_URL`.
3. If no suitable server is running, report that live agent parity is blocked and
   ask the user to start the normal keyed local server.
4. After the user-started server is available, run `npm run helix:ask:api-parity`
   or the relevant live probe against that server.
5. Do not treat a self-started, unkeyed, fallback, mock, or non-LLM server as
   proof of agent-path correctness.

Report disabled/frontier scenarios separately. Do not present a disabled
scenario as proof of the current contract.

## Model Commentary Owns Step Choice

For source-targeted and capability turns, Helix Ask must not let classifiers,
routes, planners, receipts, coverage gates, or terminal artifacts decide the next
step.

They may provide hints, constraints, observations, and validation.

The next-step authority is:

```txt
agent_step_decision produced from model-visible state.
```

Required loop:

1. Build runtime intent packet.
2. Show available capabilities.
3. Ask model for next step.
4. Execute selected capability, if any.
5. Record observation.
6. Run goal satisfaction.
7. Ask model again.
8. Repeat until answer, ask_user, fail_closed, or budget exhaustion.

A normal final answer requires:

- model selected `answer`
- `goal_satisfaction = satisfied`
- terminal artifact matches goal contract
- runtime authority audit passes

## Turn-Chain Fundamentals

This is the working rule of thumb for Helix Ask agent behavior:

```txt
Routes choose procedures.
Tools produce observations.
Observations re-enter reasoning.
Chosen steps are not progress until executed.
Drafts are not terminal authority until materialized with support refs.
Only the completed solver path may answer.
The visible answer must project the same terminal artifact selected by terminal authority.
```

The practical consequence is that a source-backed or tool-backed turn is not
complete when evidence exists. It is complete only when that evidence has
re-entered reasoning, produced a support-backed terminal artifact, passed route
and terminal authority, and then projected that same artifact as the single
visible answer.

The successful Docs evidence synthesis path is the reference pattern:

```txt
doc route selected
-> docs-viewer observations
-> post-tool model synthesis step
-> final_answer_draft with doc support refs
-> doc_evidence_synthesis_answer materialized
-> terminal authority selects doc_evidence_synthesis_answer
-> visible answer and debug mirrors show doc_evidence_synthesis_answer
```

The failure classes to watch for are:

```txt
route without admitted capability
tool receipt treated as answer
observation not re-entered into reasoning
chosen next step recorded but not executed
final_answer_draft missing support refs
terminal artifact materialized but not selected
terminal authority selected one artifact while UI/debug projected another
```

These failures are not fixed by weakening terminal authority. They are fixed by
completing the chain or failing closed with a typed reason. Codex parity here
means preserving item order and authority: tool output becomes structured input
to the next model step, and the turn completes only after the terminal item is
actually selected and projected.

## Shared Tool Family Boundary

Every source-backed, capability-backed, or multi-step tool family must expose
the same loop evidence before it can influence the visible answer. Tool-specific
evaluators, deterministic validators, and panel receipts may provide candidate
judgment, but they are not terminal authority.

Required fields for a tool-family patch:

```txt
source_target_intent
tool_call_admission_decision
agent_step_decision
runtime_tool_call
agent_step_observation_packet
goal_satisfaction_evaluation
final_answer_draft | request_user_input | typed_failure
route_product_contract
product_authority_guard
terminal_answer_authority
terminal_authority_single_writer
terminal_presentation
```

The shared loop boundary is:

```txt
tool result
-> observation packet
-> goal / coverage evaluation
-> next-step decision
-> answer, ask_user, repair, or fail_closed candidate
-> route authority and terminal authority
-> one visible answer, request_user_input, or typed_failure
```

Patch instructions for tool-family work:

1. Classify the tool as read-only evidence, observation-only action,
   control/status receipt, or mutating action.
2. Add or update `tool_call_admission_decision` so contextual, negated,
   historical, future, quoted, screen-visible, and mixed-intent prompts do not
   execute tools from lexical cues.
3. Convert the raw tool result into `agent_step_observation_packet` with
   `assistant_answer=false`, `terminal_eligible=false`, status, artifact refs,
   missing requirements, and suggested next steps.
4. Run goal satisfaction after the observation. A successful receipt is not the
   same thing as a satisfied user goal.
5. Require evidence re-entry before any content answer. Deterministic
   synthesizers may create `final_answer_draft` candidates only when the route
   contract allows that product; otherwise they must stay as observations or
   typed failures.
6. Let terminal authority select the only visible artifact. Do not write
   `payload.text`, `payload.answer`, `assistant_answer`,
   `selected_final_answer`, or `terminal_presentation.concise_text` from a
   receipt, panel projection, route branch, or fallback path before terminal
   authority.
7. Add tests for success, missing input, blocked/failed receipt, and partial
   multi-step recovery. For shortcut-like rules, include the adversarial cue
   classes listed in the patch-time checklist.

Receipt terminal products remain valid for admitted control/status/procedure
commands only when the primary intent and route product contract explicitly
allow that receipt kind. All other tool outputs must either continue the loop,
ask the user, repair, or fail closed.

### Tool Lifecycle And Follow-Up Decisions

Helix Ask should describe tool work with a shared lifecycle record instead of
letting each tool family invent its own retry or wrap-up vocabulary. This is a
policy/debug contract over existing tool execution; it is not a private Codex
runtime.

Every source-backed or multi-step tool family should expose:

```txt
tool_lifecycle_trace
tool_followup_decision
```

`tool_lifecycle_trace` uses schema `helix.tool_lifecycle_trace.v1` and must
summarize:

```txt
requested_capability
admitted_capability
executed_capability
lifecycle_stage
status
session_ref
process_ref
observation_refs
receipt_refs
evidence_refs
failure_reason
retry_recommendation
fallback_used
fallback_equivalent
terminal_eligible
assistant_answer=false
raw_content_included=false
```

`tool_followup_decision` uses schema `helix.tool_followup_decision.v1` and must
translate the lifecycle into the next solver action:

```txt
poll
retry
alternate_probe
continue_reasoning
ask_user
terminal_failure
terminal_answer
```

The follow-up decision must also expose:

```txt
external_change_required
terminal_blockers
required_surface_satisfied
evidence_reentered
assistant_answer=false
raw_content_included=false
```

The practical rule is:

```txt
running tool -> poll
failed but same tool is still valid -> retry
wrong surface or wrong probe shape -> alternate_probe
missing operator/user requirement -> ask_user
server/process/browser missing or unstable -> terminal_failure with external_change_required
result re-entered solver and gates allow terminal -> terminal_answer
otherwise -> continue_reasoning
```

This lets browser, calculator, docs, repo, workstation, live-source, adapter,
voice, and future tool families share the same loop boundary while preserving
their own domain validators. The trace can recommend what to do next, but only
terminal authority may publish the visible final answer.

### Artifact Query Index

Exact-turn debug export should expose one derived artifact lookup view:

```txt
artifact_query_index
```

`artifact_query_index` uses schema `helix.artifact_query_index.v1` and is built
from existing records:

```txt
current_turn_artifact_ledger
tool_lifecycle_trace
tool_followup_decision
tool_family_contract
```

The index is a read-only debug/query surface. Tool families should not write it
directly and it must not become answer authority. It summarizes:

```txt
artifact_refs
queryable_artifact_keys
tool_family
capability
tool_family_contract
required_observation_coverage
missing_required_observation_kinds
lifecycle_refs
reentry_status
assistant_answer=false
raw_content_included=false
```

Use it when UI, tests, or backend probes need to ask, "what did this exact turn
produce and can the required tool-family evidence be found?" Do not add broad
raw `copied_or_parsed_inputs` fields unless a specific product requirement
justifies the privacy and duplication cost. Prefer references, schema/kind
keys, and lifecycle refs over raw copied content.

### Operational Constraints And Surface Satisfaction

User constraints about tool families, browser surfaces, and local vocabulary are
turn artifacts. They are not optional commentary and they are not execution by
themselves.

Every turn that mentions a required operational surface, forbidden tool, or
local term binding should expose:

```txt
turn_operational_constraints
model_proposed_capability
policy_admitted_capability
executed_capability
rejected_capability
fallback_capability
fallback_authority_scope
operational_satisfaction_evaluation
```

Operational constraints cover:

- forbidden tools and tool families
- required surfaces such as a Chrome extension tab, in-app browser, backend API,
  Helix tab capture, or a localhost target
- local term bindings such as `visual capture = Helix tab capture`
- fallback surfaces and whether they are diagnostic-only or terminal-equivalent

The rule of thumb extends to operational paths:

```txt
Tool names in the prompt are constraints, not execution.
Required surfaces are part of the goal, not incidental metadata.
Fallbacks are diagnostic unless explicitly equivalent.
Only the completed solver path can answer from an admitted surface/tool path.
```

If the user requested a Chrome extension tab but the solver used backend API or
the in-app browser, the fallback may support diagnosis but must not be reported
as satisfying the requested path unless the operational satisfaction evaluation
marks it equivalent. A forbidden tool family must remain visible in
`tool_call_admission_decision` and must fail closed if it is proposed or
executed.

### Exact Source-Target Contracts

When a prompt names an exact source, the shared loop boundary must carry that
identity all the way to terminal authority. Retrieval, route scoring, and panel
receipts may find candidate material, but they do not by themselves prove that
the requested source was inspected.

Exact source-target prompts include requests naming a path, heading, line
range, symbol, note title, note id, panel id, live-source id, route artifact id,
or quoted source label. A patch that supports one of those prompts must expose
an exact-source contract before synthesis:

```txt
source_target_exact_contract
requested_source_kind
requested_source_identity
extraction_status
evidence_refs
evidence_hash
required_terms | required_claims
unsupported_terms | unsupported_claims
terminal_allowed
```

The exact-source contract should be represented in or linked from
`source_target_intent`, then normalized into `agent_step_observation_packet`
with `assistant_answer=false` and `terminal_eligible=false`. If the exact source
is missing, ambiguous, unsupported, or only weakly retrieved, the turn must ask
the user, run an admitted repair, or fail closed. It must not synthesize from a
neighboring source as though the requested identity had been satisfied.

The coverage gate for exact-source answers must check at least:

- requested identity preserved in the evidence packet
- evidence refs and hashes present
- required terms or claims present when the user asked for them
- unsupported or invented terms absent from the terminal draft
- terminal artifact kind allowed by the route product contract

Only a terminal candidate that consumes the exact-source contract and passes the
coverage gate may supersede stale continuations, typed failures, receipt text,
or panel projections.

## Codex-Owned Responsibilities

Do not recreate these in Helix Ask unless Codex cannot expose the capability:

- Model sampling: the turn loop that samples model output, detects function
  calls, records assistant messages, and decides whether the turn needs another
  sampling pass.
- Generic tool execution and tool-result re-entry: tool-call events, tool output
  recording, and returning results to the model for follow-up sampling.
- Turn/session lifecycle: one active task per session, interrupt/resume, thread
  context persistence, and compaction.
- Shell/file mutation safety: sandbox policy, permission requests, approval
  events, apply-patch interception, command process management, output caps, and
  cancellation/timeout behavior.
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

- Prompt interpretation policy: distinguish user task, requested output,
  explicit constraints, negative constraints, contextual tool mentions, and
  executable operator commands.
- Intent arbitration: convert classifiers into hypotheses, then choose primary
  and secondary intents before route/product arbitration.
- Source-target admission and tool admission policy: decide what source/tool
  families may be considered without executing them.
- Evidence normalization and re-entry: convert artifacts, receipts, tool
  results, source observations, repo hits, docs hits, process graph results,
  visual evidence, and typed failures into selected or rejected evidence before
  final arbitration.
- Follow-up reasoning: require post-evidence reasoning for visual content, repo
  evidence, procedure memory, debug diagnosis, implementation questions,
  conflicting hypotheses, and mixed-intent turns.
- Terminal authority: route authority, poison audit, terminal eligibility, and
  debug traces proving no deterministic shortcut took authority.
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
- Live source identity audit: visual-content, visual-delta, scene-epoch, and
  Live Answer cognition turns must reconcile the active environment, bound
  environment source, visual producer, freshest visual source, freshest
  observation, selected SituationRun, field evaluations, and interpretation
  availability before visual evidence can be terminal.
- Domain-specific actions: verification adapters, physics/warp policies,
  panel evidence summaries, and mission callouts.

## Turn Solver Authority Contract

Helix Ask routes are solver hypotheses, not terminal decisions.

```txt
Routes are proposed procedures, not conclusions.
Receipts are observations, not answers.
Classifiers generate hypotheses, not authority.
Only the completed solver path can answer.
```

The required solver path is:

```txt
prompt
-> prompt interpretation
-> intent hypotheses
-> primary / secondary intent arbitration
-> source and tool admission candidates
-> evidence requests
-> evidence results
-> evidence re-entry
-> follow-up reasoning / final arbitration
-> route authority
-> poison audit
-> terminal authority
-> final answer or typed failure
```

Debug Ask turns must expose `helix.ask_turn_solver_trace.v1` as
`ask_turn_solver_trace`. Hard source-targeted and complex turns must also pass
`helix.ask_turn_solver_hard_gate.v1`. Hard-gate failure codes are stable and
must agree with route authority when the failure concerns route/product
authority:

```txt
solver_trace_missing
intent_arbitration_missing
classifier_became_decision
route_selected_before_intent_arbitration
contextual_tool_mention_executed
receipt_terminal_without_reentry
missing_followup_reasoning
terminal_authority_before_solver_completion
poison_clean_but_authority_failed
route_contract_missing
hard_source_target_allowed_no_tool_direct
```

If a hard gate fails, Helix Ask must fail closed with `typed_failure` rather
than presenting a forbidden terminal artifact. Pure control/status receipt turns
are allowed only when the solver trace explicitly marks the receipt terminal as
allowed by the primary intent and route/product contract.

Visual/live-source turns may also expose `helix.live_source_identity_audit.v1`
as `live_source_identity_audit` and as a reference inside
`ask_turn_solver_trace`. A running screen capture is not sufficient answer
authority. If source identities do not reconcile, the audit must name the
diagnosis or repair candidate and the solver path must remain incomplete. That
repair candidate is evidence for the next step, not a terminal answer and not a
license to mutate bindings unless the user explicitly requested repair.

Identity diagnoses include:

```txt
active_environment_missing
active_environment_source_missing
producer_source_mismatch
fresh_source_unbound
fresh_source_wrong_environment
fresh_observation_not_in_situation_run
situation_run_missing
field_evaluations_missing
interpretations_missing
```

The standing visual-source frontier is:

```txt
screen capture running
but active Live Answer environment is bound to a missing/default source
while the real freshest visual source exists elsewhere
```

That case must not terminate as `live_pipeline_receipt`,
`process_graph_overview`, `model_only_concept`, `no_tool_direct`, or ambient
workspace context.

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

### Console Transcript Uniformity

The Helix console transcript is a turn-projection contract, not a separate
agent loop. Future patches must keep these surfaces uniform for the same turn:

```txt
SSE turn_transcript_event rows
final payload turn_transcript_events
debug turn_transcript_events
debug export transcript rows
client visible console rows
```

If a streamed route emits meaningful non-terminal transcript rows before
`turn_final`, those rows must re-enter the final payload and debug envelope.
If a non-streamed or fast route has enough turn metadata to project public
commentary, it must not collapse to only submitted question plus final answer.
Reconstructed rows must be marked as reconstructed/debug projection and must
carry `assistant_answer=false`; they are public progress observations, not
answer authority.

The console should treat submitted questions, public reasoning-progress rows,
tool/procedure rows, typed failures, pending-input rows, and final answers as
one chronological transcript. It should not prefer special rows in a way that
hides progress rows or resurrects stale rows from a previous turn. When these
surfaces disagree, classify it as `turn_stream_backend_mismatch`,
`turn_non_streamed_route_dropped`, or `turn_terminal_event_missing` before
debugging route correctness.

Workspace context attachment is turn input, not ambient authority. The UI may
offer an attach/isolated choice before a reasoning turn, but repo/code evidence
prompts should default the timer to isolated execution unless the user explicitly
attaches workspace context. Screen, document, visual, and deictic prompts may
default to attached context.

Focused panel state is an interaction target, not the only admissible source
target. Non-mutating workstation actions may focus a tool panel for visibility,
for example the scientific calculator after a solve. That focus change must not
erase a still-valid retained source context. If a turn input still carries a
safe active/open document path and the prompt is document-targeted (`this
document`, `current document`, `open whitepaper`, etc.), Helix may admit a
bounded docs observation from that retained document even when another panel is
focused. The retained path is only source admission: the final answer still
requires a materialized docs observation packet to re-enter reasoning. If no
observation packet is materialized, the turn must fail closed or refuse document
content rather than answering from the path alone.

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
prompt interpretation
intent arbitration
source admission
tool admission
evidence normalization
evidence re-entry
follow-up reasoning
terminal authority
presentation
Codex-owned runtime behavior
```

If the change manages sampling, tool execution, tool-result re-entry, session
lifecycle, retries, sandboxing, approvals, patches, compaction, subagents, or
terminal completion, it belongs to Codex or to a thin Codex-compatible adapter.

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
2. Is this model sampling, generic tool-result re-entry, or terminal completion?
   - If yes, use Codex-owned structure or expose a thin adapter.
3. Is this prompt interpretation, intent arbitration, source/tool admission,
   evidence normalization, evidence re-entry, follow-up reasoning, route
   authority, or terminal eligibility?
   - If yes, it belongs in Helix Ask.
4. Does this produce a user-visible claim?
   - If yes, it must cite proof pointers or emit an UNKNOWN/blocked result.
5. Does this consume a live source?
   - If yes, record consent/state/freshness and mark it as observation-only.
6. Does this trigger execution or verification?
   - If yes, bind the result to a proof packet or explicit fail reason.

If a proposed change fails this test, it is probably redundant methodology.

## Procedure For Backend Patches

Use this sequence for future Helix Ask agent-loop patches:

1. Classify the patch as `prompt interpretation`, `intent arbitration`,
   `source admission`, `tool admission`, `evidence normalization`,
   `evidence re-entry`, `follow-up reasoning`, `terminal authority`,
   `presentation`, or `Codex-owned runtime behavior`.
2. For `Codex-owned runtime behavior`, stop or keep the implementation as a thin
   adapter. Do not add private sampling loops, private tool execution runtimes,
   sandbox/approval lifecycles, session compaction, subagent orchestration, or
   terminal completion machinery.
3. For `prompt interpretation`, separate requested output from contextual,
   negated, historical, future, conditional, quoted, and screen-visible tool
   words.
4. For `intent arbitration`, demote route classifiers into hypotheses and record
   primary/secondary intent.
5. For `source admission` and `tool admission`, propose candidates and reasons;
   do not execute tools from lexical cues.
6. For `evidence normalization`, `evidence re-entry`, and `follow-up reasoning`,
   return observations and selected/rejected evidence before final arbitration.
7. For `terminal authority` and `presentation`, require route authority,
   terminal eligibility, poison audit, and solver hard gates before showing a
   final answer.

## Instruction Delta

Future instructions to Helix Ask should use this language:

> Treat Codex as the generic agent loop owner. Helix Ask must not duplicate
> Codex model sampling, generic tool execution, tool-result re-entry, retries,
> approvals, sandboxing, compaction, session lifecycle, subagent orchestration,
> or terminal completion. Helix Ask owns prompt interpretation policy, intent
> arbitration, source-target admission, evidence identity, provenance, proof
> gates, route/product contracts, route authority, terminal eligibility, and
> debug traces. Routes are proposed procedures, not conclusions. Receipts are
> observations, not answers. Classifiers generate hypotheses, not authority.
> Only the completed solver path can answer.

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
