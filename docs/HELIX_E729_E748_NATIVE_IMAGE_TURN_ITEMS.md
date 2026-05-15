# HELIX E729-E748: Native Image Turn Items + In-Turn Visual Extraction

## Purpose

Fix the remaining mismatch between Helix Ask multimodal behavior and the Codex-style turn/item lifecycle.

Recent testing showed:

```txt
attach image
  -> UI starts pre-Ask visual analysis
  -> visual analysis can hang at "analyzing image..."
  -> no Ask turn exists yet
  -> no item lifecycle / terminal authority / tool trace can explain the stall
```

The image attachment should instead enter the Ask turn as a typed input item. Visual analysis should be an in-turn item, just like calculator calls, docs lookup, notes storage, and final answer synthesis.

## Codex comparison

The local `openai/codex` clone uses a clear Thread -> Turn -> Item model:

```txt
turn/start
  userMessage content = [text, image/localImage, skill, mention]
  item/started
  dynamicToolCall / tool result items
  item/completed
  final agentMessage
  turn/completed
```

Relevant local references:

```txt
external/openai-codex/codex-rs/app-server/README.md
  Core primitives: Thread, Turn, Item
  turn/start streams turn/started, item/*, turn/completed
  turn input supports text/images as typed input

external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs
  UserInput = Text | Image | LocalImage | Skill | Mention
  ThreadItem::UserMessage { content: Vec<UserInput> }
  ThreadItem::DynamicToolCall
  ItemStartedNotification / ItemCompletedNotification
  DynamicToolCallOutputContentItem = InputText | InputImage

external/openai-codex/codex-rs/app-server-protocol/src/protocol/thread_history.rs
  build_user_inputs preserves images/local_images as UserInput items
```

Helix now has the right typed contracts, but the UI still performs visual analysis before `/api/agi/ask/turn`.

## Current Helix state

Working:

```txt
user text is separated from evidence
prompt_poison_audit prevents evidence-summary prompt grafting
turn_input_items can carry visual evidence refs
multimodal_tool_chain can do visual extraction -> derived equation -> calculator -> final answer
terminal authority and poison audits remain clean in backend tests
```

Still fragile:

```txt
client/src/components/helix/HelixAskPill.tsx
  analyzeAskImageAttachment() calls /api/agi/situation/visual-frame/analyze before runAsk()

server/routes/agi.plan.ts
  /situation/visual-frame/analyze creates visual evidence outside the Ask turn

Result:
  image analysis can stall before the Codex-style turn/item lifecycle exists
```

## Core rule

```txt
User text stays a text item.
Attached images stay image input items.
Visual extraction becomes an in-turn validation item.
Calculator/docs/notes become dynamic tool items.
Only final synthesis becomes assistant answer.
```

Forbidden:

```txt
image -> pre-turn hanging analysis
image summary -> appended user prompt text
visual extraction JSON -> assistant answer
calculator receipt -> assistant answer without synthesis
live card / interpreted log / profile archive -> assistant history
```

## New or updated contracts

Extend `shared/helix-turn-input-item.ts`:

```ts
export type HelixTurnInputItem =
  | {
      type: "text";
      text: string;
      source: "user";
    }
  | {
      type: "image";
      image_ref?: string | null;
      image_base64?: string | null;
      mime_type: string;
      file_name?: string | null;
      raw_image_included: true;
      raw_image_scope: "turn_input_only";
    }
  | {
      type: "evidence_ref";
      evidence_id: string;
      evidence_kind:
        | "visual_frame_evidence"
        | "visual_extraction_evidence"
        | "synthetic_evidence"
        | "subgoal_evaluation"
        | "interpreted_event"
        | "tool_observation";
      compact_summary?: string | null;
      assistant_answer: false;
      raw_content_included: false;
    };
```

Add:

```txt
shared/helix-native-image-turn.ts
shared/helix-visual-analysis-turn-item.ts
```

Suggested type:

```ts
export type HelixVisualAnalysisTurnItem = {
  schema: "helix.visual_analysis_turn_item.v1";
  item_id: string;
  thread_id: string;
  turn_id: string;
  status: "inProgress" | "completed" | "failed";
  source_input_item_index: number;
  frame_id?: string | null;
  evidence_id?: string | null;
  summary?: string | null;
  error_code?: "vision_timeout" | "vision_provider_unavailable" | "vision_parse_error" | null;
  model_invoked: boolean;
  assistant_answer: false;
  raw_image_included: false;
  context_policy: "compact_context_pack_only";
};
```

## Backend services

Add:

```txt
server/services/helix-ask/native-image-turn-normalizer.ts
server/services/helix-ask/in-turn-visual-analysis-runner.ts
server/services/helix-ask/visual-analysis-turn-item-store.ts
```

Update:

```txt
server/services/helix-ask/turn-input-item-normalizer.ts
server/services/helix-ask/multimodal-subgoal-planner.ts
server/services/helix-ask/multimodal-workstation-chain-runner.ts
server/routes/agi.plan.ts
```

## Route behavior

### Current anti-pattern

```txt
client:
  POST /api/agi/situation/visual-frame/analyze
  wait for evidence
  POST /api/agi/ask/turn
```

### Required behavior

```txt
client:
  POST /api/agi/ask/turn
    turn_input_items = [
      { type: "text", text: userPrompt },
      { type: "image", image_base64, mime_type, raw_image_scope: "turn_input_only" }
    ]

server:
  turn_started
  item_started: visualAnalysis
  run vision provider with timeout
  item_completed or item_failed: visualAnalysis
  if needed:
    item_started: visualExtraction
    item_completed: visualExtraction
    item_started: derivedEquation
    item_completed: derivedEquation
    item_started: dynamicToolCall(scientific-calculator.solve_with_steps)
    item_completed: dynamicToolCall
  item_started: agentMessage
  item_completed: agentMessage
  turn_completed
```

## UI changes

In `client/src/components/helix/HelixAskPill.tsx`:

```txt
Do not call /situation/visual-frame/analyze before runAsk().
Do not block the turn on "analyzing image..." before a turn exists.
Keep the attachment preview local.
On submit, include image as a typed turn input item.
Show "image attached" instead of "analyzing image..." before submit.
Show visual analysis progress only as turn work-log item after turn starts.
```

Submit payload:

```ts
turnInputItems: [
  { type: "text", text: trimmed, source: "user" },
  {
    type: "image",
    image_base64: attachment.imageBase64,
    mime_type: attachment.mimeType,
    file_name: attachment.fileName,
    raw_image_included: true,
    raw_image_scope: "turn_input_only"
  }
]
```

Normal Ask context must still expose:

```txt
raw_image_included=false
context_policy=compact_context_pack_only
```

after visual analysis completes. Raw image bytes are only allowed in the immediate turn input and must not enter assistant history, interpreted logs, profile archives, or selected compact context.

## Prompt poison audit additions

Extend `server/services/helix-ask/prompt-poison-audit.ts`:

Fail if user text contains:

```txt
image_base64
data:image
visual_frame_evidence JSON
visual_extraction_evidence JSON
Attached visual evidence summary
assistant_answer=false
```

Pass when:

```txt
user text is plain text
image bytes are in a typed image item
visual evidence is in evidence_ref or visualAnalysis item
```

## Poison guard additions

Extend `ask-context-poison-audit`:

```txt
raw image allowed only in turn_input_items[type=image]
raw image forbidden in selected_evidence_pack
raw image forbidden in assistant history
visualAnalysis item assistant_answer=false
visualExtraction item assistant_answer=false
derivedEquation item assistant_answer=false
dynamicToolCall receipt assistant_answer=false
only agentMessage/final synthesis assistant_answer=true
```

## Tool chain rules

Direct visual prompt:

```txt
"describe this image"
  -> image input item
  -> visualAnalysis item
  -> final_synthesis
```

Compound visual calculation:

```txt
"From the image, use the calculator to add up how many items I have in my hotbar"
  -> image input item
  -> visualAnalysis item
  -> visualExtraction item
  -> derivedEquation item
  -> calculator dynamicToolCall item
  -> workstationToolEvaluation item
  -> final_synthesis
```

Unclear image:

```txt
visualAnalysis completed but counts unclear
  -> request_user_input terminal or final answer with caveat
  -> no fabricated count
```

Vision timeout:

```txt
visualAnalysis item_failed: vision_timeout
  -> final answer explains image analysis timed out
  -> no generic model-only answer
```

## Tests

Add:

```txt
server/__tests__/helix.ask.turn.native-image-input.test.ts
server/__tests__/helix.ask.turn.in-turn-visual-analysis.test.ts
server/__tests__/helix.ask.turn.image-timeout-lifecycle.test.ts
client/src/components/__tests__/helix-ask-native-image-turn.spec.tsx
```

Required cases:

```txt
1. Image attachment is sent as turn_input_items[type=image], not pre-analyzed.
2. "describe this image" creates visualAnalysis item then final answer.
3. image+calculator creates visualAnalysis -> visualExtraction -> derivedEquation -> dynamicToolCall -> final answer.
4. Vision timeout creates item_failed and visible final explanation, not stuck UI.
5. No raw image bytes appear in selected_evidence_pack.
6. No image/evidence JSON appears inside user text.
7. prompt_poison_audit.ok=true for native image item.
8. prompt_poison_audit fails if base64/data:image appears in user text.
9. poison_audit fails if visualAnalysis is assistant_answer=true.
10. Unrelated text prompt with stale image preview does not hijack route after image removed.
11. Text-only image prompt without attached image produces request-input/failure, not generic model-only answer.
12. Terminal authority remains server-owned with matching client/server hashes.
```

## Browser acceptance

1. Reload Helix Ask.
2. Attach a Minecraft screenshot.
3. Verify preview says image attached, not pre-turn analyzing.
4. Ask:

```txt
From the image, use the calculator to add up how many items I have in my hotbar.
```

Expected:

```txt
work log:
  visualAnalysis started/completed
  visualExtraction started/completed
  derivedEquation completed
  scientific-calculator dynamicToolCall completed
  final answer completed

debug:
  turn_input_items includes text + image
  prompt_poison_audit.ok=true
  poison_audit.ok=true
  selected_evidence_pack.raw_image_included=false
  route_reason_code=multimodal_tool_chain
  terminal_artifact_kind=workstation_tool_evaluation
```

5. Temporarily force the vision provider to timeout.

Expected:

```txt
visualAnalysis item_failed
visible answer explains vision timeout
UI does not hang
no generic model-only answer
```

## Non-goals

Do not:

```txt
append visual summaries into user text
store raw image bytes in profile archives
store raw image bytes in interpreted event logs
turn visualAnalysis into assistant history
let calculator receipt be the final answer without synthesis
special-case Minecraft hotbars in the generic router only
```

## Acceptance line

Helix Ask treats images like Codex treats multimodal user input: a single Ask turn starts with typed text and image items, visual analysis runs as an item inside that turn, workstation tools run as receipt-backed dynamic items, and only final synthesis becomes the authoritative assistant answer. No image bytes, visual summaries, extraction JSON, equations, receipts, live-card lines, or deterministic artifacts are serialized back into user prompt text or assistant history.
