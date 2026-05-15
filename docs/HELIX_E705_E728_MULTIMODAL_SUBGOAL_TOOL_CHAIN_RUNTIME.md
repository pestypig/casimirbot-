# HELIX E705-E728: Multimodal Subgoal Tool-Chain Runtime

## Purpose

Fix the next limitation exposed by Helix Ask image testing.

E681-E704 fixed prompt poisoning by keeping user text, image inputs, visual evidence, and deterministic artifacts as separate typed turn items. The remaining gap is that Helix can still terminate too early on a visual route:

```txt
user asks: "From the image, use the calculator to add up how many items I have in my hotbar."

current likely behavior:
  typed visual evidence exists
  multimodal_visual_answer route fires
  visual answer returns early
  calculator planner never receives a derived equation
```

The desired behavior is:

```txt
user text item + image/evidence item
  -> multimodal intent route
  -> subgoal plan
  -> visual extraction item
  -> structured count evidence
  -> equation builder item
  -> calculator dynamic tool call
  -> calculator receipt/toolObservation
  -> tool evaluation
  -> terminal-authoritative final answer
```

The rule remains:

```txt
Everything can become evidence.
Only one item becomes the authoritative assistant answer.
```

## Codex Comparison

The local Codex clone shows the structural target:

- `external/openai-codex/codex-rs/app-server/README.md`
  - `turn/start` begins a turn and emits `turn/started`, `item/*`, and `turn/completed`.
  - `ThreadItem.userMessage` stores `content` as a list of typed inputs: `text`, `image`, or `localImage`.
  - The per-item lifecycle is `item/started -> deltas/request -> item/completed`.
  - Dynamic tools emit a `dynamicToolCall` item, send `item/tool/call`, receive client content items, and complete the item.
  - Dynamic tool outputs may include `inputText` and `inputImage` content items.

- `external/openai-codex/codex-rs/docs/protocol_v1.md`
  - `Op::UserTurn` content items include `text`, `image`, `local_image`, `skill`, and `mention`.

Helix E681 copied the correct typed-input discipline:

```txt
text stays text
image stays image
visual evidence stays evidence_ref
prompt_poison_audit guards user text
```

But Helix still diverges from Codex in one important way: a visual route can return before the rest of the turn gets a chance to continue through additional itemized work. Codex does not model this as "image route versus calculator route." It keeps the turn alive and lets the runtime add more items.

## Current Helix State

Relevant local files:

```txt
shared/helix-turn-input-item.ts
shared/helix-multimodal-turn-context.ts
shared/helix-prompt-poison-audit.ts

server/services/helix-ask/turn-input-item-normalizer.ts
server/services/helix-ask/prompt-poison-audit.ts
server/services/helix-ask/multimodal-intent-router.ts
server/services/helix-ask/workstation-tool-planner.ts
server/routes/agi.plan.ts
```

What is working:

```txt
typed multimodal input
prompt poison audit
visual evidence routing
terminal authority
workstation tool planning for explicit calculator prompts
workstation tool evaluation/receipt framing
```

What is missing:

```txt
visual extraction subgoals
derived structured evidence
derived equation construction
handoff from visual route to calculator route
single-turn continuation across multimodal + workstation items
```

## Anti-Pattern To Remove

Avoid this pattern:

```txt
if visual route:
  return final image answer immediately
```

That is acceptable only for a pure direct visual prompt:

```txt
"describe this image"
```

It is not acceptable for compound prompts:

```txt
"use the calculator"
"add up"
"count and compute"
"extract then solve"
"compare image to document"
"store this visual evidence in notes"
```

For compound prompts, visual routing should produce intermediate evidence and continue the turn.

## New Contracts

Add:

```txt
shared/helix-multimodal-subgoal-plan.ts
shared/helix-visual-extraction-evidence.ts
shared/helix-derived-equation.ts
shared/helix-turn-item-lifecycle.ts
```

### Multimodal Subgoal Plan

```ts
export type HelixMultimodalSubgoalPlan = {
  schema: "helix.multimodal_subgoal_plan.v1";
  plan_id: string;
  thread_id: string;
  turn_id: string;
  user_goal: string;
  required_items: Array<
    | "visual_extraction"
    | "semantic_lookup"
    | "equation_builder"
    | "calculator_tool"
    | "docs_lookup"
    | "notes_storage"
    | "final_synthesis"
  >;
  visual_evidence_refs: string[];
  workstation_tools: string[];
  missing_requirements: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
```

### Visual Extraction Evidence

```ts
export type HelixVisualExtractionEvidence = {
  schema: "helix.visual_extraction_evidence.v1";
  extraction_id: string;
  thread_id: string;
  turn_id: string;
  source_evidence_refs: string[];
  extraction_goal:
    | "hotbar_item_counts"
    | "inventory_counts"
    | "visible_objects"
    | "scene_relations"
    | "text_in_image"
    | "custom";
  structured_result: Record<string, unknown>;
  confidence: number;
  uncertainty: string[];
  model_invoked: boolean;
  assistant_answer: false;
  raw_image_included: false;
  context_policy: "compact_context_pack_only";
};
```

Example for Minecraft hotbar:

```json
{
  "schema": "helix.visual_extraction_evidence.v1",
  "extraction_goal": "hotbar_item_counts",
  "structured_result": {
    "hotbar_slots": [
      { "slot": 1, "item_hint": "stone", "count": 64 },
      { "slot": 2, "item_hint": "dirt", "count": 12 }
    ],
    "counts": [64, 12]
  },
  "confidence": 0.74,
  "uncertainty": ["slot 3 count is visually unclear"]
}
```

### Derived Equation

```ts
export type HelixDerivedEquation = {
  schema: "helix.derived_equation.v1";
  equation_id: string;
  thread_id: string;
  turn_id: string;
  derived_from_refs: string[];
  expression: string;
  expression_language: "plain_math" | "latex";
  purpose: "calculator_input" | "validation" | "explanation";
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
```

Example:

```json
{
  "schema": "helix.derived_equation.v1",
  "expression": "64 + 12",
  "purpose": "calculator_input"
}
```

### Turn Item Lifecycle

```ts
export type HelixTurnItemLifecycleEvent = {
  schema: "helix.turn_item_lifecycle_event.v1";
  thread_id: string;
  turn_id: string;
  item_id: string;
  item_type:
    | "userMessage"
    | "visualExtraction"
    | "derivedEquation"
    | "dynamicToolCall"
    | "toolObservation"
    | "workstationToolEvaluation"
    | "agentMessage";
  event_type: "item_started" | "item_delta" | "item_completed" | "item_failed";
  status?: "inProgress" | "completed" | "failed" | "declined";
  assistant_answer: boolean;
  created_at: string;
};
```

## Backend Services

Add:

```txt
server/services/helix-ask/multimodal-subgoal-planner.ts
server/services/helix-ask/visual-extraction-evidence-builder.ts
server/services/helix-ask/derived-equation-builder.ts
server/services/helix-ask/multimodal-workstation-chain-runner.ts
server/services/helix-ask/turn-item-lifecycle-ledger.ts
```

### Multimodal Subgoal Planner

Input:

```txt
turn_input_items
user text
multimodal_turn_context
workspace_context_snapshot
```

Detect compound goals:

```txt
image + count
image + add/sum/total
image + calculator
image + compare document
image + store in notes
image + explain with evidence
```

Output:

```txt
HelixMultimodalSubgoalPlan
```

Routing examples:

```txt
"describe this image"
  required_items = ["final_synthesis"]

"From the image, use the calculator to add up how many items I have in my hotbar"
  required_items = ["visual_extraction", "equation_builder", "calculator_tool", "final_synthesis"]

"Compare this screenshot to the current docs viewer document"
  required_items = ["visual_extraction", "docs_lookup", "final_synthesis"]
```

### Visual Extraction Evidence Builder

Do not rely on generic visual summaries when the user asks for countable fields.

For hotbar/inventory requests, ask the image model for structured JSON:

```json
{
  "hotbar_slots": [
    { "slot": 1, "visible": true, "item_hint": "...", "count": 64, "confidence": 0.8 }
  ],
  "counts": [64],
  "unclear_slots": []
}
```

If the image is not clear enough:

```txt
produce visual_extraction_evidence with uncertainty
route to request_user_input or answer with caveat
do not fabricate counts
```

### Derived Equation Builder

Given structured visual extraction:

```txt
counts = [64, 12, 3]
```

Create:

```txt
expression = "64 + 12 + 3"
```

If no reliable numeric list exists:

```txt
missing_requirements = ["reliable_hotbar_counts"]
request_user_input or answer uncertainty
```

### Multimodal Workstation Chain Runner

Drive itemized lifecycle:

```txt
item_started: visualExtraction
item_completed: visualExtraction
item_started: derivedEquation
item_completed: derivedEquation
item_started: dynamicToolCall(scientific-calculator.solve_with_steps)
toolObservation: calculator receipt
item_completed: dynamicToolCall
item_started: workstationToolEvaluation
item_completed: workstationToolEvaluation
item_started: agentMessage
item_completed: agentMessage
```

The runner must not create assistant text until final synthesis.

## Ask Route Changes

In `server/routes/agi.plan.ts`:

1. Keep E681 typed input normalization at the start of the turn.
2. Run `multimodal-subgoal-planner` before the early `multimodal_visual_answer` return.
3. If the plan has only `final_synthesis`, direct visual answer may continue.
4. If the plan requires tools, do not return from visual route.
5. Run `multimodal-workstation-chain-runner`.
6. Set terminal authority according to the final item:

```txt
final_answer_source = "workstation_tool_evaluation"
terminal_artifact_kind = "workstation_tool_evaluation"
```

for calculator-backed multimodal answers.

## Workstation Tool Planner Changes

`workstation-tool-planner.ts` currently extracts calculator expressions from prompt text. Add a second entrypoint:

```ts
export function planWorkstationToolUseFromDerivedEquation(input: {
  equation: HelixDerivedEquation;
  threadId: string;
  turnId: string;
}): WorkstationToolPlannerResult;
```

This avoids the anti-pattern of serializing the derived equation back into user text just so the existing prompt parser can find it.

## UI Requirements

The Helix Ask UI should show trace items for compound multimodal turns:

```txt
Visual extraction: completed
Derived equation: 64 + 12 + 3
Calculator: completed
Final answer: completed
```

Do not show internal evidence as chat unless the user opens debug/trace.

## Poison Guard Requirements

Extend `prompt_poison_audit` to fail if:

```txt
visual_extraction_evidence JSON is appended into user text
derived equation receipt is appended into user text
calculator receipt JSON is appended into user text
```

Extend turn poison audit to count:

```txt
visual_extraction_evidence
derived_equation
dynamic_tool_call
workstation_tool_evaluation
```

None of these may be `assistant_answer=true`.

## Tests

Add:

```txt
server/__tests__/helix.ask.turn.multimodal-subgoal-planner.test.ts
server/__tests__/helix.ask.turn.visual-to-calculator-chain.test.ts
server/__tests__/helix.ask.turn.derived-equation-builder.test.ts
server/__tests__/helix.ask.turn.multimodal-lifecycle-ledger.test.ts
client/src/components/__tests__/helix-ask-multimodal-tool-chain.spec.tsx
```

Required cases:

1. `describe this image` remains a direct visual answer.
2. `From the image, use the calculator to add up how many items I have in my hotbar` creates a multimodal subgoal plan.
3. The plan includes `visual_extraction`, `equation_builder`, `calculator_tool`, and `final_synthesis`.
4. Visual extraction produces structured hotbar count evidence.
5. Derived equation is created from visual extraction evidence, not from user prompt text.
6. Calculator planner accepts `HelixDerivedEquation`.
7. Calculator receipt is required before confidence/final answer.
8. Final answer source is `workstation_tool_evaluation`.
9. `prompt_poison_audit.ok=true`.
10. `poison_audit.ok=true`.
11. No visual extraction JSON appears inside `question`.
12. No calculator receipt JSON appears inside `question`.
13. If hotbar counts are uncertain, Helix asks for clarification or answers with caveat; it does not fabricate a sum.
14. `compare this image to the current docs viewer document` uses visual extraction plus docs lookup, not calculator.
15. Unrelated calculator prompt with attached image is not hijacked by visual evidence.

## Browser Acceptance

1. Restart the server.
2. Attach a Minecraft screenshot showing hotbar counts.
3. Ask:

```txt
From the image, use the calculator to add up how many items I have in my hotbar.
```

Expected debug:

```txt
route_reason_code = multimodal_tool_chain
multimodal_subgoal_plan.required_items includes visual_extraction/equation_builder/calculator_tool/final_synthesis
visual_extraction_evidence.extraction_goal = hotbar_item_counts
derived_equation.expression exists
workstation_tool_plan.intent = calculator_verify or calculator_solve
workspace_action_receipt or calculator_receipt exists
workstation_tool_evaluation exists
final_answer_source = workstation_tool_evaluation
terminal_artifact_kind = workstation_tool_evaluation
prompt_poison_audit.ok = true
poison_audit.ok = true
```

Expected UI:

```txt
The answer gives the total and shows the extracted counts.
The tool trace shows visual extraction -> equation -> calculator -> final answer.
```

## Non-Goals

Do not:

```txt
append extracted counts to the user prompt
append derived equation to the user prompt
append calculator receipts to the user prompt
make visual extraction an assistant answer
make calculator receipt the final answer without synthesis
special-case Minecraft hotbar in the generic router only
```

Minecraft hotbar counting is the first test case. The runtime must generalize to:

```txt
image -> count objects -> calculate
image -> extract text -> search docs
image -> identify scene -> store notes
image -> compare against event log
image -> request clarification
```

## Acceptance Line

Helix Ask follows the Codex-style turn/item lifecycle for compound multimodal tasks: typed user input starts the turn, visual extraction and derived equations become non-answer items, workstation tools run through receipt-backed dynamic calls, and only the final synthesized agent message becomes the authoritative answer. No evidence, extraction, equation, receipt, live-card line, or deterministic artifact is serialized back into user prompt text.
