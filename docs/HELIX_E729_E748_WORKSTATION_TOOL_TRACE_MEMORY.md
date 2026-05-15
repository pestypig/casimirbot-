# HELIX E729-E748: Workstation Tool Trace Memory + Reasoning Log Recall

## Purpose

Make tool-backed Helix Ask conclusions durable, inspectable, and recallable from Situation Room / Helix Ask without turning tool traces into assistant history.

E681-E704 fixed prompt poisoning by keeping multimodal input itemized.

E705-E728 added compound multimodal tool-chain turns:

```txt
typed user input
  -> visual extraction evidence
  -> derived equation
  -> workstation calculator plan
  -> tool receipt / observation
  -> workstation tool evaluation
  -> terminal-authoritative final answer
```

The remaining gap is memory. The E705 chain returns a good response/debug payload, but the proof trail is not yet consistently persisted as a durable reasoning log item. When a user later asks:

```txt
Why did you say that?
How did you find that number?
What tool verified this?
What evidence changed the summary?
```

Helix should be able to query a compact reasoning log instead of reconstructing the answer from raw debug payloads or raw event logs.

## Codex Comparison

The local Codex clone shows the structural target:

- `external/openai-codex/codex-rs/app-server/README.md`
  - `turn/start` begins a turn and emits `turn/started`, `item/*`, and `turn/completed`.
  - `ThreadItem.userMessage` stores content as typed items, not a merged prompt string.
  - The per-item lifecycle is `item/started -> deltas/request -> item/completed`.
  - Dynamic tools emit `dynamicToolCall`, request `item/tool/call`, then complete with returned content items.
  - `thread/read` can read stored thread state.
  - `persistExtendedHistory` exists to preserve a richer subset of ThreadItems for later read/resume/fork.

- `external/openai-codex/codex-rs/docs/protocol_v1.md`
  - `Op::UserTurn` is the typed turn entrypoint.

Helix now matches Codex on typed inputs and itemized chain shape, but still needs a durable equivalent of "readable completed items" for workstation reasoning:

```txt
Codex:
  turn items persist enough to inspect what happened.

Helix now:
  response/debug contains tool-chain proof,
  interpreted log exists,
  profile archives exist,
  but multimodal/tool-chain proof is not yet written as a first-class reasoning memory record.
```

## Current Helix Evidence

Relevant local files:

```txt
shared/helix-turn-input-item.ts
shared/helix-multimodal-subgoal-plan.ts
shared/helix-visual-extraction-evidence.ts
shared/helix-derived-equation.ts
shared/helix-turn-item-lifecycle.ts

server/services/helix-ask/multimodal-workstation-chain-runner.ts
server/services/helix-ask/workstation-tool-chain-runner.ts
server/services/situation-room/interpreted-event-log-store.ts
server/services/situation-room/profile-situation-archive-store.ts
server/routes/agi.plan.ts
```

What works:

```txt
multimodal_subgoal_plan
visual_extraction_evidence
derived_equation
workstation_tool_plan
workstation_tool_evaluation
turn_item_lifecycle_events
terminal_answer_authority
poison_audit
```

Latest browser test:

```txt
Prompt:
  From this image, use the calculator to add up the clearly readable item counts in my inventory.

Observed:
  route_reason_code = multimodal_tool_chain
  final_answer_source = workstation_tool_evaluation
  terminal_artifact_kind = workstation_tool_evaluation
  prompt_poison_audit.ok = true
  poison_audit.ok = true
  selected_evidence_pack.raw_image_included = false
  lifecycle = visualAnalysis -> visualExtraction -> derivedEquation -> dynamicToolCall -> toolObservation -> workstationToolEvaluation -> agentMessage
```

This means the turn/item runtime is now close to the Codex shape. The remaining issue is not terminal authority or prompt poisoning. The remaining issue is durable proof memory plus semantic precision of extraction goals. In the test, a user asked for `inventory`, while the visible answer and evidence described `hotbar` counts. That mismatch should be preserved in the trace as a possible extraction-scope caveat, not silently normalized away.

What is incomplete:

```txt
reasoning traces are not consistently persisted
tool-chain proof is not queryable by turn/thread after the response
final answer snapshots do not always link to tool evaluations
profile archives do not yet preserve compact tool trace summaries
"why did you think that?" cannot reliably cite a stored reasoning trace
visual extraction scope is not always distinct enough (inventory vs hotbar vs chest/container)
```

## Core Rule

```txt
Tool trace memory is evidence, not assistant history.
```

Allowed:

```txt
tool trace -> interpreted event
tool trace -> reasoning log entry
tool trace -> profile archive summary
tool trace -> Ask compact context
```

Forbidden:

```txt
tool trace -> appended user prompt
tool trace -> assistant answer history
tool receipt JSON -> normal Ask context
debug payload -> final answer
```

## Add Contracts

Add:

```txt
shared/helix-workstation-reasoning-trace.ts
shared/helix-proof-recall-query.ts
shared/helix-tool-trace-archive.ts
```

### Workstation Reasoning Trace

```ts
export type HelixWorkstationReasoningTrace = {
  schema: "helix.workstation_reasoning_trace.v1";
  trace_id: string;
  thread_id: string;
  turn_id: string;
  source_family:
    | "multimodal"
    | "minecraft_events"
    | "calculator"
    | "docs"
    | "notes"
    | "situation_room"
    | "custom";
  user_goal: string;
  route_reason_code: string;
  input_item_refs: string[];
  evidence_refs: string[];
  tool_receipt_ids: string[];
  lifecycle_event_refs: string[];
  artifacts: {
    multimodal_subgoal_plan_id?: string | null;
    visual_extraction_id?: string | null;
    derived_equation_id?: string | null;
    workstation_tool_plan_id?: string | null;
    workstation_tool_evaluation_id?: string | null;
    terminal_authority_hash?: string | null;
    poison_audit_id?: string | null;
  };
  compact_steps: Array<{
    label: string;
    summary: string;
    artifact_ref?: string | null;
    status: "completed" | "partial" | "failed" | "skipped";
  }>;
  caveats: string[];
  final_answer_snapshot: string;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
```

### Proof Recall Query

```ts
export type HelixProofRecallQuery = {
  schema: "helix.proof_recall_query.v1";
  thread_id: string;
  turn_id?: string | null;
  question: string;
  target_answer_ref?: string | null;
  target_trace_id?: string | null;
  include_raw_debug?: false;
};
```

### Tool Trace Archive

```ts
export type HelixToolTraceArchive = {
  schema: "helix.tool_trace_archive.v1";
  archive_id: string;
  profile_id: string;
  thread_id: string;
  trace_ids: string[];
  summaries: Array<{
    trace_id: string;
    user_goal: string;
    final_answer_snapshot: string;
    key_evidence_refs: string[];
    tool_receipt_ids: string[];
  }>;
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
```

## Backend Services

Add:

```txt
server/services/helix-ask/workstation-reasoning-trace-store.ts
server/services/helix-ask/workstation-reasoning-trace-builder.ts
server/services/helix-ask/proof-recall-context-selector.ts
server/services/situation-room/tool-trace-archive-store.ts
```

### Workstation Reasoning Trace Store

Responsibilities:

```txt
record trace by thread_id and turn_id
list traces by thread_id
get trace by trace_id
get latest trace for a terminal answer
dedupe repeated identical traces
```

Keep traces compact. Store artifact refs and summaries, not raw image bytes or raw tool JSON.

### Trace Builder

Create traces from:

```txt
multimodal_subgoal_plan
visual_extraction_evidence
derived_equation
workstation_tool_plan
workstation_tool_evaluation
turn_item_lifecycle_events
terminal_answer_authority
poison_audit
selected_evidence_pack
```

For the hotbar example, compact steps should look like:

```txt
1. Visual extraction: read visible hotbar counts 64, 12, 3.
2. Equation builder: derived 64 + 12 + 3.
3. Calculator: evaluated expression and got 79.
4. Final synthesis: answered from calculator-backed evidence.
```

If the user asked for inventory or chest/container but the extraction only covered the hotbar, the trace must include:

```txt
caveat:
  User asked for inventory counts; extraction scope was hotbar-only.

proof_status:
  partial
```

Do not hide scope mismatch inside a clean proof trace.

### Proof Recall Context Selector

When the user asks:

```txt
Why did you say 79?
How did you add that?
What evidence did you use?
Show the proof.
```

select:

```txt
latest relevant workstation_reasoning_trace
terminal authority hash
compact evidence refs
tool receipt ids
final answer snapshot
```

Do not include raw debug payloads by default.

## API Routes

Add:

```txt
GET  /api/agi/ask/reasoning-traces?thread_id=...&limit=...
GET  /api/agi/ask/reasoning-traces/:traceId
POST /api/agi/ask/reasoning-traces/recall
POST /api/agi/situation/tool-traces/archive
GET  /api/agi/situation/tool-traces/archive?profile_id=...
```

Response invariant:

```txt
assistant_answer=false
raw_content_included=false
context_policy=compact_context_pack_only
```

## Ask Route Changes

In `server/routes/agi.plan.ts`:

1. After any successful `workstation_tool_evaluation` terminal answer, build a `HelixWorkstationReasoningTrace`.
2. Include extraction scope metadata:

```txt
requested_extraction_scope:
  hotbar | inventory | chest | container | visible_items | scene | text | custom

actual_extraction_scope:
  hotbar | inventory | chest | container | visible_items | scene | text | custom

scope_match:
  exact | partial | mismatch | unknown
```

3. Append an interpreted event:

```txt
kind = "agentic_review" or new kind "tool_trace"
title = "Workstation proof trace"
summary = compact trace summary
evidence_refs = trace.evidence_refs + trace.tool_receipt_ids
related_artifact_ids = [trace_id, evaluation_id, terminal_authority_hash]
assistant_answer = false
```

4. For final answer snapshots, include `related_artifact_ids` pointing to the trace.
5. Add trace ids to debug:

```txt
reasoning_trace_id
workstation_reasoning_trace
proof_recall_available=true
proof_status=complete|partial|failed
extraction_scope_match=exact|partial|mismatch|unknown
```

## Interpreted Event Log Changes

Extend `HelixInterpretedEventKind`:

```ts
| "tool_trace"
| "proof_recall"
```

Interpreted log row example:

```txt
tool_trace
  "Hotbar count was verified by visual extraction and calculator."
  evidence_refs: visual_extraction, derived_equation, calculator_receipt
  related_artifact_ids: trace_id, workstation_tool_evaluation_id
```

## Profile Archive Integration

When archiving a categorization/session/profile run, include compact tool traces:

```txt
trace summaries
final answer snapshots
tool receipt ids
evidence refs
confidence/proof status
```

Do not include:

```txt
raw images
raw event firehose
raw debug payload
full tool JSON
```

## UI Changes

### Helix Ask

For tool-backed answers, show:

```txt
[Proof trace]
```

Clicking it opens:

```txt
Visual extraction: completed
Derived equation: 64 + 12 + 3
Calculator: completed, result 79
Terminal answer: server authoritative
Poison audit: clean
```

### Situation Room

Add to Interpreted Log filters:

```txt
Tool traces
Proof recall
Final answer snapshots
```

Add a compact row:

```txt
time | tool_trace | user goal | result | evidence refs | terminal hash
```

## Tests

Add:

```txt
server/__tests__/helix.ask.turn.workstation-reasoning-trace.test.ts
server/__tests__/helix.ask.turn.proof-recall.test.ts
server/__tests__/situation-room.tool-trace-archive.test.ts
client/src/components/__tests__/helix-ask-proof-trace.spec.tsx
```

Required cases:

1. Visual-to-calculator chain records a reasoning trace.
2. Trace contains visual extraction id, derived equation id, calculator receipt id, evaluation id, terminal hash.
3. Trace has `assistant_answer=false`.
4. Trace has `raw_content_included=false`.
5. Interpreted log records a `tool_trace` event.
6. Final answer snapshot links to the trace.
7. `why did you say 79?` selects the latest trace.
8. Proof recall answer cites compact steps, not raw debug.
9. Profile archive includes compact tool trace summary.
10. Raw image bytes are not persisted in trace/archive.
11. Poison audit remains clean.
12. Client proof trace view renders server trace, not client-generated fallback.
13. Inventory prompt with hotbar-only extraction records `scope_match=partial` and a caveat.
14. Chest/container prompt does not label the proof as hotbar unless the requested scope was hotbar.
15. Proof recall includes caveats when proof status is partial.

## Browser Acceptance

1. Restart server.
2. Attach a Minecraft screenshot with visible hotbar counts.
3. Ask:

```txt
From the image, use the calculator to add up how many items I have in my hotbar.
```

Expected:

```txt
final_answer_source = workstation_tool_evaluation
reasoning_trace_id exists
interpreted log has tool_trace
Proof trace button appears
```

4. Ask:

```txt
Why did you say that total?
```

Expected:

```txt
Helix answers from workstation_reasoning_trace:
  visual extraction read counts
  derived equation
  calculator receipt/evaluation
  terminal authority
```

No raw image, raw debug payload, or tool JSON appears in normal Ask context.

## Non-Goals

Do not:

```txt
make reasoning traces assistant history
store raw images by default
store raw tool JSON in profile archives
serialize reasoning traces into user prompt text
replace terminal authority with interpreted log text
```

## Acceptance Line

Every workstation-backed conclusion produces a compact, durable reasoning trace linked to interpreted log and profile archive memory. Helix Ask can later answer "why did you say that?" from trace refs, tool receipts, and terminal authority without raw debug injection or assistant-history poisoning.
