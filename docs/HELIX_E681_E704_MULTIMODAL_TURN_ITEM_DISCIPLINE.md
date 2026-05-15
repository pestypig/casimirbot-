# HELIX E681-E704: Multimodal Turn Item Discipline + Prompt Poison Guard

## Purpose

Fix the failure discovered during Helix Ask image testing:

```txt
user attaches image + asks "describe this image"
  -> visual-frame evidence is created correctly
  -> client appends evidence summary into the prompt string
  -> workstation router sees document-summary wording
  -> docs-viewer route wins
  -> final answer becomes typed failure / wrong generic answer
```

The visual evidence path is working. The agentic loop is being poisoned by deterministic prompt-string grafting.

## Codex comparison

Codex app-server keeps multimodal input and turn artifacts itemized:

```txt
turn/start input:
  [{ type: "text", text: "Explain this" },
   { type: "image", url: "..." },
   { type: "localImage", path: "..." }]

ThreadItem userMessage:
  content = list of text / image / localImage inputs

Tool calls:
  item/started
  item/tool/call
  client response
  item/completed

Final answer:
  agentMessage item only
```

The relevant Codex clone references are:

```txt
external/openai-codex/codex-rs/app-server/README.md
  - turn/start accepts text, image, localImage input items.
  - ThreadItem.userMessage content is a list of typed user inputs.
  - item lifecycle is item/started -> deltas/request -> item/completed.
  - dynamic tool outputs can return inputText and inputImage content items.

external/openai-codex/codex-rs/docs/protocol_v1.md
  - Op::UserTurn content items include text, image, local_image, skill, mention.
```

Helix should copy that structural discipline. Do not serialize image/evidence/tool artifacts back into user text.

## Current Helix failure

The local source currently includes this anti-pattern:

```txt
client/src/components/helix/HelixAskPill.tsx
  requestQuestion = userPrompt + "\n\nAttached visual evidence summary ..."
```

That turns evidence into plain user prompt text. The router no longer sees:

```txt
user_text: "describe this image"
visual_evidence: visual_evidence:...
```

It sees:

```txt
"describe this image Attached visual evidence summary ..."
```

This can trigger existing docs/retrieval rules such as:

```txt
docs-viewer.search_docs
doc_evidence_location
Summarize this document from current docs viewer context...
```

Terminal authority then correctly preserves the wrong answer. That is not a terminal-authority bug. It is a pre-routing item-role bug.

## Core rule

```txt
User text stays user text.
Images stay image input items.
Visual summaries stay evidence items.
Tool results stay toolObservation items.
Live card lines stay ui_projection.
Only normal synthesis produces assistant answer.
```

Forbidden:

```txt
visual evidence -> appended user prompt string
tool receipt -> appended user prompt string
interpreted log -> appended user prompt string
live card line -> appended user prompt string
profile archive -> appended user prompt string
```

## New contracts

Add:

```txt
shared/helix-turn-input-item.ts
shared/helix-multimodal-turn-context.ts
shared/helix-prompt-poison-audit.ts
```

### Turn input item

```ts
export type HelixTurnInputItem =
  | {
      type: "text";
      text: string;
      source: "user";
    }
  | {
      type: "image";
      image_ref: string;
      mime_type: string;
      evidence_id?: string | null;
      raw_image_included: false;
    }
  | {
      type: "evidence_ref";
      evidence_id: string;
      evidence_kind:
        | "visual_frame_evidence"
        | "synthetic_evidence"
        | "subgoal_evaluation"
        | "interpreted_event"
        | "tool_observation";
      compact_summary?: string | null;
      assistant_answer: false;
      raw_content_included: false;
    };
```

### Multimodal turn context

```ts
export type HelixMultimodalTurnContext = {
  schema: "helix.multimodal_turn_context.v1";
  thread_id: string;
  turn_input_items: HelixTurnInputItem[];
  visual_evidence_refs: string[];
  selected_evidence_refs: string[];
  raw_image_included: false;
  assistant_answer: false;
  context_policy: "compact_context_pack_only";
};
```

### Prompt poison audit

```ts
export type HelixPromptPoisonAudit = {
  schema: "helix.prompt_poison_audit.v1";
  ok: boolean;
  violations: Array<{
    kind:
      | "evidence_summary_in_user_text"
      | "raw_image_in_user_text"
      | "tool_receipt_in_user_text"
      | "live_projection_in_user_text"
      | "archive_summary_in_user_text";
    summary: string;
  }>;
  user_text_hash: string;
  evidence_ref_count: number;
  image_input_count: number;
};
```

## Backend changes

### 1. Native input item normalization

Add:

```txt
server/services/helix-ask/turn-input-item-normalizer.ts
```

Responsibilities:

```txt
read request.question as text item
read attached image / visual evidence as image/evidence_ref item
read workspace_context_snapshot evidence as evidence_ref items
preserve roles before any intent classification
```

The normalized object should become the only input to:

```txt
intent classifier
workspace action planner
situation context selector
terminal authority
poison audit
debug export
```

### 2. Remove prompt-string grafting

In:

```txt
client/src/components/helix/HelixAskPill.tsx
```

Remove:

```txt
Attached visual evidence summary (compact context only...)
```

from the text sent as `question`.

Instead send:

```ts
question: trimmed,
turn_input_items: [
  { type: "text", text: trimmed, source: "user" },
  { type: "evidence_ref", evidence_id, evidence_kind: "visual_frame_evidence", ... }
],
workspace_context_snapshot: {
  attached_visual_evidence,
  multimodal_evidence_pack
}
```

### 3. Route visual questions before docs routing

Add a pre-router:

```txt
server/services/helix-ask/multimodal-intent-router.ts
```

Rules:

```txt
if user text asks about image / screenshot / what do you see
and visual evidence item exists:
  route = multimodal_visual_answer
  selected_evidence = visual_frame_evidence
  forbid docs-viewer routing unless user explicitly asks to compare image to a document
```

Explicit document compare still works:

```txt
"Compare this screenshot to the open whitepaper"
  -> visual evidence + docs-viewer lookup
```

But plain:

```txt
"describe this image"
```

must never become:

```txt
docs-viewer.search_docs
```

### 4. Remove early hardcoded visual shortcut after native route exists

The current emergency shortcut in:

```txt
server/routes/agi.plan.ts
```

is acceptable as a temporary guard, but the final architecture should not special-case image prompts by returning before the normal turn lifecycle. Replace it with:

```txt
normalized input items
  -> multimodal intent route
  -> selected evidence pack
  -> normal terminal-authoritative synthesis
```

### 5. Extend poison audit

Current poison audit can prove terminal authority, but it misses the earlier failure where evidence became prompt text.

Add:

```txt
prompt_poison_audit
```

Audit flags:

```txt
user prompt contains "Attached visual evidence summary"
user prompt contains "assistant_answer=false"
user prompt contains evidence schema text
user prompt contains raw base64 or data:image
user prompt contains tool receipt JSON
user prompt contains live-card projection labels
```

If any trigger is found:

```txt
prompt_poison_audit.ok=false
route must fail fast in debug/test
```

### 6. Debug export requirements

Every Ask turn debug export should include:

```txt
turn_input_items
prompt_poison_audit
multimodal_turn_context
selected_evidence_pack
route_reason_code
terminal_answer_authority
poison_audit
```

## Client changes

### Helix Ask composer

The UI may show:

```txt
attached as compact visual evidence
```

But the request payload must not place that phrase into `question`.

Send image/evidence metadata as structured fields only:

```txt
turn_input_items
workspace_context_snapshot.attached_visual_evidence
workspace_context_snapshot.multimodal_evidence_pack
```

### Rendering

Render final answer priority:

```txt
server terminal answer
request_user_input terminal
tool/workspace receipt
live projection
debug fallback
```

Never render:

```txt
client-generated image summary as final answer
```

unless the backend terminal authority says:

```txt
final_answer_source = artifact_synthesis
terminal_artifact_kind = visual_frame_evidence
```

## Tests

Add:

```txt
server/__tests__/helix.ask.turn.multimodal-input-items.test.ts
server/__tests__/helix.ask.turn.visual-evidence-routing.test.ts
server/__tests__/helix.ask.turn.prompt-poison-audit.test.ts
client/src/components/__tests__/helix-ask-image-attachment-turn-items.spec.tsx
```

### Required cases

```txt
1. "describe this image" + visual evidence routes to multimodal_visual_answer.
2. "describe this image" never selects docs-viewer.search_docs.
3. visual evidence summary is not appended to question text.
4. prompt_poison_audit fails if question contains "Attached visual evidence summary".
5. raw image bytes never enter normal Ask context.
6. selected evidence pack includes visual_evidence_refs.
7. terminal answer source is artifact_synthesis.
8. terminal artifact kind is visual_frame_evidence.
9. poison_audit.ok=true after native item routing.
10. "compare this image to the open document" may use both visual evidence and docs-viewer.
11. unrelated Ask question is not hijacked by attached visual evidence.
12. interpreted visual_observation remains assistant_answer=false.
```

## Browser acceptance

1. Restart server.
2. Attach Minecraft screenshot in Helix Ask.
3. Prompt: `describe this image`.
4. Expected:

```txt
answer describes the screenshot
route_reason_code = multimodal_visual_answer or visual_frame_evidence
terminal_artifact_kind = visual_frame_evidence
final_answer_source = artifact_synthesis
prompt_poison_audit.ok = true
poison_audit.ok = true
docs-viewer.search_docs not selected
question text does not contain visual evidence summary
```

5. Prompt:

```txt
compare this image to the current docs viewer document
```

Expected:

```txt
visual evidence + docs evidence are both selected
docs-viewer is allowed only because document comparison is explicit
```

## Acceptance line

```txt
Helix Ask treats multimodal input the way Codex treats turn input: text, image, evidence, tool calls, observations, and final answers are separate typed items. Visual evidence can inform an answer, but it is never appended into user prompt text. The router cannot confuse image evidence with document-summary instructions, and terminal authority proves the final answer was synthesized from the selected visual evidence, not from deterministic prompt contamination.
```

