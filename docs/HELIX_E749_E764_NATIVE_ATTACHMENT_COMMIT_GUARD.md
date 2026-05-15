# HELIX E749-E764: Native Attachment Commit Guard + Turn Input Integrity

## Purpose

Fix the failure discovered during post-E729 Helix Ask UI testing:

```txt
UI displayed:
  image attached

User asked:
  Use calculator to add readable inventory item counts.

Observed result:
  source: no tool direct
  generic instruction answer
  no visualAnalysis item
  no visualExtraction item
  no derivedEquation item
  no calculator dynamicToolCall
  no workstation reasoning trace
```

The backend agentic loop is not the main failure here. The backend can already run:

```txt
typed image input
  -> visualAnalysis
  -> visualExtraction
  -> derivedEquation
  -> calculator dynamicToolCall
  -> workstationToolEvaluation
  -> proof trace
```

The failure is that the client allowed a visually attached image state to submit as a text-only turn. The attachment shown to the user was stale or metadata-only after restart, and the turn did not contain a valid native image item.

## Codex Comparison

The local Codex clone keeps multimodal turn input explicit and itemized:

```txt
external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs
  UserInput = Text | Image | LocalImage | Skill | Mention
  ThreadItem::UserMessage { content: Vec<UserInput> }
  ThreadItem::DynamicToolCall
  DynamicToolCallOutputContentItem = InputText | InputImage
```

```txt
external/openai-codex/codex-rs/app-server-protocol/src/protocol/thread_history.rs
  build_user_inputs preserves text, image, and local_image as typed UserInput items.
  handle_dynamic_tool_call_request records DynamicToolCall as a turn item.
  handle_dynamic_tool_call_response completes the same dynamic tool item.
```

```txt
external/openai-codex/codex-rs/docs/protocol_v1.md
  Op::UserTurn is the turn entrypoint.
  UserInput items include text, image, local_image, skill, mention.
```

Codex does not rely on a UI badge saying “image attached.” The turn either contains an image/localImage input item or it does not. Helix needs the same commit discipline.

## Current Helix State

Working:

```txt
shared/helix-turn-input-item.ts
  supports type=image and type=evidence_ref

server/services/helix-ask/turn-input-item-normalizer.ts
  preserves typed input items

server/services/helix-ask/in-turn-visual-analysis-runner.ts
  runs visual analysis inside the Ask turn

server/services/helix-ask/multimodal-workstation-chain-runner.ts
  continues visual extraction into derived equation and calculator

server/services/helix-ask/workstation-reasoning-trace-builder.ts
  records proof trace for successful workstation-backed answers
```

Fragile:

```txt
client/src/components/helix/HelixAskPill.tsx
  can render "image attached" from local attachment state
  can submit a turn where the actual turnInputItems do not contain usable image bytes/evidence
  does not currently block stale attachment previews before /api/agi/ask/turn
```

## Core Rule

```txt
UI attachment preview is not evidence.
Only committed turn_input_items are evidence.
```

Allowed:

```txt
fresh image attachment -> typed image turn item
valid visual evidence ref -> typed evidence_ref item
stale image preview -> blocked submit / reattach request
```

Forbidden:

```txt
stale preview -> text-only Ask turn
image badge -> assumed visual evidence
missing image bytes -> generic text answer to visual prompt
attachment metadata -> assistant history
```

## Add Contract

Create:

```txt
shared/helix-attachment-commit.ts
```

```ts
export type HelixAttachmentCommitStatus =
  | "ready"
  | "missing_payload"
  | "stale_after_restart"
  | "too_large"
  | "unsupported_type"
  | "removed";

export type HelixAttachmentCommitCheck = {
  schema: "helix.attachment_commit_check.v1";
  attachment_id: string;
  file_name?: string | null;
  mime_type?: string | null;
  status: HelixAttachmentCommitStatus;
  can_submit: boolean;
  turn_input_item_preview?: {
    type: "image" | "evidence_ref";
    has_image_base64: boolean;
    has_image_ref: boolean;
    has_evidence_ref: boolean;
    raw_image_scope?: "turn_input_only" | null;
  } | null;
  reason?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
```

## Client Changes

### 1. Separate preview state from committed payload state

In `client/src/components/helix/HelixAskPill.tsx`, the attachment object should distinguish:

```ts
preview:
  fileName
  mimeType
  localObjectUrl
  visible badge

payload:
  imageBase64 or imageRef/evidenceRef
  createdAt
  validForSubmit
```

The UI can show a preview only if payload state is checked separately.

### 2. Add submit-time attachment validation

Before `runAsk()` posts to `/api/agi/ask/turn`, run:

```txt
validateAttachmentCommit(imageAttachment)
```

If the prompt is visual/multimodal and the UI shows an attachment, require at least one:

```txt
imageBase64
imageRef
evidenceRef
```

If absent, block submit and show:

```txt
Image attachment is stale. Reattach the image before sending.
```

Do not send a text-only turn.

### 3. Mark stale attachment after restart/hydration

If attachment state is restored from UI/session memory without raw image bytes or a backend image/evidence ref, mark:

```txt
status = "stale_after_restart"
can_submit = false
```

Render badge:

```txt
image needs reattach
```

not:

```txt
image attached
```

### 4. Keep native image turn item construction strict

For valid attachments, submit:

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

If `image_base64` is missing, do not construct a fake image item.

## Backend Changes

### 1. Add turn-input integrity audit

Create:

```txt
server/services/helix-ask/turn-input-integrity-audit.ts
```

Audit:

```txt
visual prompt + no image/evidence item -> fail
image item without image_base64/image_ref/evidence_id -> fail
image item with raw_image_included=true outside turn_input_only -> fail
evidence_ref without evidence_id -> fail
```

Output:

```ts
type HelixTurnInputIntegrityAudit = {
  schema: "helix.turn_input_integrity_audit.v1";
  ok: boolean;
  violations: Array<{
    kind:
      | "visual_prompt_without_visual_input"
      | "stale_image_item"
      | "invalid_raw_image_scope"
      | "missing_evidence_ref";
    summary: string;
  }>;
  text_input_count: number;
  image_input_count: number;
  evidence_ref_count: number;
  assistant_answer: false;
};
```

### 2. Fail fast for visual prompts without visual input

In `/api/agi/ask/turn`, after `normalizeHelixTurnInputItems()` and before routing:

```txt
if visual prompt and no valid image/evidence item:
  terminal_kind = request_user_input or failure
  answer = "I do not have the image for this turn. Reattach it and resend."
```

This is not a model answer. It is a typed turn integrity failure.

### 3. Include audit in debug export

Every Ask turn should expose:

```txt
turn_input_integrity_audit
turn_input_items
prompt_poison_audit
poison_audit
```

## UI Behavior

### Valid state

```txt
2025-08-20_00.52.37.png
image ready
```

Submit allowed.

### Stale state

```txt
2025-08-20_00.52.37.png
image needs reattach
```

Submit blocked for visual prompts.

### Failed turn state

If backend receives a visual prompt without visual input anyway:

```txt
I do not have the image for this turn. Reattach it and resend.
```

Debug:

```txt
route_reason_code = turn_input_integrity_failed
turn_input_integrity_audit.ok = false
violation = visual_prompt_without_visual_input
```

## Tests

Add:

```txt
server/__tests__/helix.ask.turn.input-integrity-audit.test.ts
client/src/components/__tests__/helix-ask-attachment-commit-guard.spec.tsx
```

Required cases:

```txt
1. UI preview without imageBase64/imageRef/evidenceRef renders "image needs reattach".
2. Submit is blocked when visual prompt depends on stale attachment.
3. Valid imageBase64 attachment submits type=image turn item.
4. Removed image does not submit stale turn item.
5. Backend rejects visual prompt with no visual input using turn_input_integrity_failed.
6. Backend rejects image item with no image_base64/image_ref/evidence_id.
7. Debug includes turn_input_integrity_audit.
8. Text-only nonvisual prompt still works with no image.
9. Prompt poison audit remains clean.
10. No stale attachment metadata is serialized into user text.
```

## Browser Acceptance

1. Restart server.
2. Confirm any old attachment badge is either gone or says:

```txt
image needs reattach
```

3. Attach a fresh Minecraft screenshot.
4. Badge says:

```txt
image ready
```

5. Ask:

```txt
From this image, use the calculator to add up the clearly readable item counts in my inventory.
```

Expected:

```txt
route_reason_code = multimodal_tool_chain
turn_input_integrity_audit.ok = true
turn_input_items includes text + image
visualAnalysis completed
visualExtraction completed
derivedEquation completed
dynamicToolCall completed
workstationToolEvaluation completed
reasoning_trace_id exists
Proof trace appears
```

6. Restart server without reattaching the image.
7. Try the same prompt.

Expected:

```txt
submit blocked client-side
or backend returns turn_input_integrity_failed
no generic no-tool answer
```

## Non-Goals

Do not:

```txt
store raw image bytes in profile archives
keep stale base64 in local storage
turn attachment previews into evidence
append attachment summaries into user prompt text
run visual analysis before the Ask turn
```

## Acceptance Line

Helix Ask starts multimodal turns only when the submitted turn contains valid typed image/evidence input items. A stale UI attachment badge cannot produce a text-only visual turn, cannot route to generic no-tool answers, and cannot poison assistant history. The client blocks stale attachments, the backend audits turn-input integrity, and valid image turns continue through visual analysis, workstation tools, terminal authority, and proof trace memory.
