# Voice Command Intent Lane Architecture for Helix Ask

## Repository-grounded baseline and invariants

Helix Ask already has a fairly sophisticated client voice surface, with explicit environment-driven rollout controls and diagnostics hooks, which is a strong foundation for layering a command lane without destabilizing the default “pause/end-of-speech auto-send” behavior. In particular, the Helix Ask pill imports voice transcription and job-control primitives (for dispatch, replay/resume, and tooling/log subscriptions) and already carries voice-confirm rollout flags and local audio gate toggles that can be extended rather than replaced. citeturn2view0

The current architecture documentation also emphasizes that Helix Ask is a sessioned and replayable system (UI creates a session, builds context, builds a grounded prompt, sends it to `/api/agi/ask`, then stores output), and that mission/voice extensions must preserve deterministic trace/eligibility behavior rather than “best effort” side effects. citeturn4view1turn4view0turn5view0

A key constraint for this work is that voice outputs and eligibility gates are expected to be deterministic and replay-auditable: the Dottie prompt-style contract explicitly requires stable typed suppression labels and deterministic speak/no-speak decisions from context/session/voice mode and event class, with replay tests as minimum coverage. citeturn5view0turn4view0

Those principles map directly to the command-lane problem: we need (a) deterministic suppression reasons, (b) an explicit confidence+quality gate, and (c) a replayable lifecycle that never breaks the existing ask queue/streaming (“queued/running reasoning flow”) semantics described in Helix Ask flow notes. citeturn4view1turn5view0

## Decision record and rationale

### Executive decision

**Chosen architecture:** **Hybrid parser-first + interpreter fallback with explicit confidence arbitration** (Decision A), with a **dedicated translation execution lane** (Decision B) and a **deterministic, explicitly instrumented state machine** (Decision C) bound to a **command registry/plugin contract** (Decision D). This design is compatible with Helix Ask’s existing rollout-flag culture on the client and deterministic suppression/eligibility requirements in the voice/callout contracts. citeturn2view0turn4view0turn5view0

**Why this is the best fit for the constraints:**

- It preserves the **default pause-to-send behavior** by making the command lane an **arbitration overlay**: it only “wins” when gates pass and confidence is high; otherwise the utterance routes as ordinary dictation. (Hard constraint 1.)
- It adds a lane **in parallel** to existing job/dispatch flows: command actions become separate, explicit events that can target the same dispatch functions already used by the UI (send), or affect the job controller (retry/cancel), without rewriting the core ask pipeline described in the flow doc. citeturn4view1turn2view0
- It provides an explicit place to enforce **confidence + audio quality gates** and to record deterministic suppression reasons, matching the system’s broader determinism discipline. citeturn5view0turn4view0
- It supports “noisy environment” operation by optionally requiring a **prefix keyword** (strict mode), which is conceptually aligned with wake-word/keyword-spotting approaches used to reduce unintended activation in noise. citeturn6view2
- It is extensible: adding new commands becomes “register new command definition” rather than refactoring the flow.

### Alternatives considered and rejected

**Deterministic parser only (rejected):**
- Pros: maximally deterministic; easy to audit.
- Cons: brittle for real speech variation (“send it”, “okay send”, “translate this into Spanish please”), language name ambiguity, and noisy transcripts. You either overfit (false negatives) or broaden patterns (false positives), and you don’t get robust slot extraction for complex commands like translation.

**Interpreter only (rejected):**
- Pros: strong coverage of paraphrases and slot extraction.
- Cons: weaker determinism guarantees, harder replay (model drift), and higher risk of false positives in noisy environments unless you set thresholds so high that it becomes unusable. The Dottie/Helix contracts are explicitly oriented toward deterministic eligibility and stable typed suppression reasons; interpreter-only conflicts with that philosophy unless heavily wrapped. citeturn5view0turn4view0

**Hybrid parser-first + interpreter fallback (selected):**
- Parser supplies the “deterministic backbone” and stable suppression reasons.
- Interpreter is invoked only when needed (ambiguous, low coverage, or translation slot extraction) and is still bounded by the same explicit audio-quality gates and confidence thresholds, with its outputs captured in telemetry for replay/triage.

## Core architecture and translation semantics

This section covers decisions A, B, D, F, and the extensibility/back-compat constraints.

### Command understanding architecture

**Pipeline (high level):**

1. **ASR finalization** produces `(transcript_text, asr_confidence, audio_quality_signals, utterance_id, timestamps)`.
2. **Normalization**: lowercase, trim, punctuation normalization, collapse whitespace, optionally strip polite fillers (“please”, “hey”, “ok”) deterministically.
3. **Parser-first pass**:
   - Attempts exact/near-exact matches against registered command phrase patterns.
   - Performs deterministic slot extraction when applicable (especially translation language phrases).
4. **Interpreter fallback pass (optional)**:
   - Only if parser result is *not decisive* and the utterance is short/command-like.
   - Returns structured JSON: `{ intent: <command|none>, slots, confidence }`.
5. **Arbitration** chooses:
   - **Command path** if `audio_quality_gate == PASS` **and** `command_confidence >= threshold` **and** `anti-false-positive policy == PASS` (more below).
   - Otherwise, **dictation path**.

This structure preserves the default behavior because **dictation remains the fallback** whenever anything is uncertain.

### Translate command architecture

**Interpretation (semantics you can implement without breaking users):**

- **“translate this to <language>”** ⇒ one-shot translation of the *current draft utterance* (the utterance that triggered the command lane) into `<language>`, then present the translated result *for passive confirmation*, then dispatch (send) using the translated text.
- **“translate to <language>”** ⇒ “mode set” command:
  - Sets a **voice session preference** `translationTarget = <language>`.
  - Subsequent dictation utterances route through translation before send (unless user turns it off or uses “cancel translation” in the future).

This distinction makes both phrases useful and predictable.

**Intent + slot extraction approach:** use hybrid:
- Deterministic slot extraction first (language-name mapping table), because it’s stable and auditable.
- Interpreter fallback second for:
  - Ambiguous language names (“Chinese”, “Punjabi” with script/region ambiguity),
  - Multiword targets (“Brazilian Portuguese” → `pt-BR`),
  - User says “translate to the language we used earlier”.

**Actual translation execution:** use a **dedicated translation lane** that is separate from the command detection lane:
- The command lane’s job is only: recognize the command, determine target language, determine source span, and manage confirm lifecycle.
- The translation lane’s job is: produce a translation result with:
  - `source_text`, `source_language` (detected if unknown), `target_language`, `translated_text`,
  - confidence/quality metadata if available.
- Keep the translation lane callable from both:
  - voice command path, and
  - future UI actions (e.g., click-to-translate).

**Language identifiers:** store targets as **BCP 47 language tags** rather than free-form strings. BCP 47 tags are the standard mechanism for expressing language + optional script/region (e.g., `en`, `en-US`, `zh-Hans`). citeturn6view0turn6view1

**Handling ambiguous names and low confidence:**
- If mapping yields multiple plausible tags:
  - Do not execute immediately.
  - Present confirm UI with explicit choice (“Chinese (Simplified)” vs “Chinese (Traditional)”), and default to “cancel after 3 seconds” if unresolved (because ambiguity is high-risk).
- If interpreter confidence is below threshold, route as dictation and optionally show a subtle “command not recognized” debug marker only in dev/shadow mode.

### Additive API/schema changes

To remain additive/backward compatible, implement changes as:
- **New optional fields** on existing client telemetry events (safe).
- **New optional response fields** on translation endpoint responses (safe).
- **New endpoint(s)** (safe).

Do **not** remove or retype existing request/response shapes; follow the same “additive contract” stance described in the voice service and Dottie prompt-style contracts. citeturn4view0turn5view0

## Deterministic state machine and routing

This section delivers required items: state machine (C) and routing (F), plus confirms/cooldowns/anti-double-fire.

### State machine diagram

Text-form diagram (single-utterance lifecycle), where **dictation lane** continues to exist and the **command lane** can preempt only when it wins arbitration:

```text
GLOBAL (voice session)
  mic_off
    -> mic_on

DICTATION LANE (existing)
  drafting/listening
    --(end_of_speech, asr_final)--> dictation_finalized
      --(command_arbiter=NO)--> auto_send_pending
        --(auto_send fires)--> ask_dispatched
        --(ask_enqueued/streaming)--> ask_running
        --(ask_done)--> drafting/listening

COMMAND LANE (new, parallel overlay)
  idle
    --(asr_final received)--> candidate_eval
      --(gates fail OR confidence low)--> idle [suppressed(reason=...)]
      --(candidate accepted)--> confirm_window_active (T=3s)
          --(UI confirm click)--> executed
          --(UI cancel click)--> cancelled
          --(voice interrupt="cancel")--> cancelled
          --(voice interrupt="retry")--> executed(action=retry)
          --(any non-command speech activity)--> cancelled(resume_dictation=true)
          --(T expires, untouched)--> auto_confirm_fired --> executed
        executed
          --(cooldown)--> idle
        cancelled
          --(cooldown)--> idle
```

**Anti-double-fire rules (deterministic):**
- Each ASR-final utterance must have an `utterance_id` (hash of `(audio_chunk_id, start_ms, end_ms)` or equivalent). Only process each `utterance_id` once for command execution.
- Confirm window ties to `command_instance_id = hash(utterance_id + command_id + slots_json)`.
- If the same `command_instance_id` is seen again within a cooldown window, suppress with reason `dedupe_cooldown`-style labeling (mirroring the broader system pattern). citeturn5view0

**Timeout/cooldown behavior:**
- Confirm window duration: **3,000 ms fixed** (hard constraint 4).
- Cooldown after execute/cancel: recommend **750–1,500 ms** to avoid re-trigger from echo/overlapping ASR finalization.
- If a user says “cancel” in normal dictation mode while a confirm is active, it applies to the confirm state first (local policy), then falls back to dictation if no confirm is active.

### Routing table

| Input / situation | Arbitration result | Output route | Side effects |
|---|---|---|---|
| Normal speech (not a command) | Command lane suppresses | **Queued reasoning flow** (existing) | Maintains pause-to-send behavior and current job lifecycle. citeturn4view1 |
| “send” | Command accepted | **Ask dispatch** | Converts current draft into an ask dispatch via existing client ask/run primitives. citeturn2view0 |
| “cancel” | Command accepted | **Cancel confirm / cancel pending action** | Cancels active confirm window; if no confirm active, can optionally clear draft (configurable). |
| “retry” | Command accepted | **Last-turn replay** | Calls existing resume/retry mechanisms if present; does not mutate core queue model. citeturn2view0turn4view1 |
| “translate this to <language>” | Accepted + slots valid | **Translation pipeline → confirm → ask dispatch** | Performs one-shot translation, shows confirm, then dispatches translated text. |
| “translate to <language>” | Accepted + slots valid | **Set translation mode** | Sets session preference; subsequent dictation is translated then sent. |
| Any voice while confirm active (non-command) | Interrupt | **Resume dictation** | Cancels pending confirm so normal speech flow continues. |
| Low confidence / low audio quality | Suppress | **Normal speech flow** | Records deterministic suppression reason (no user-visible disruption unless in debug). citeturn5view0 |

## Extensible command registry and noise robustness

This section provides required items: command registry interface (D) and noise robustness policies (E), including strict mode.

### Command registry interface

Typed pseudo-schema (TypeScript-like), designed for extensibility without refactoring the core lane:

```ts
// Stable identifiers
type VoiceCommandId =
  | "send"
  | "cancel"
  | "retry"
  | "translate_set_target"
  | "translate_one_shot";

// Execution context available to commands (read-only + controlled mutators)
interface VoiceCommandContext {
  // Voice / ASR
  utteranceId: string;
  transcriptRaw: string;
  transcriptNormalized: string;
  asrConfidence: number | null;

  // Audio quality signals (from server + optional local gate)
  speechProbability: number | null;
  snrDb: number | null;
  speakerConfidence: number | null;
  localAudioGate: "pass" | "fail" | "unknown";

  // UI + session state
  micMode: "off" | "on";
  confirmState: "none" | "active";
  pendingAskJobId: string | null;
  lastAskJobId: string | null;

  // Draft/selection
  currentDraftText: string;
  lastAssistantText: string | null;
  selectionText: string | null;

  // Policy snapshot (for replay determinism)
  policy: VoiceCommandPolicySnapshot;

  // Telemetry hook
  emitEvent: (event: VoiceCommandTelemetryEvent) => void;
}

// Command-specific slot types
type TranslateSlots = {
  targetLanguageTag: string;          // BCP 47, e.g. "es", "pt-BR"
  sourceSpan: "draft" | "selection" | "last_assistant";
};

// Match result from parser or interpreter
interface VoiceCommandMatch<Slots> {
  commandId: VoiceCommandId;
  source: "parser" | "interpreter";
  confidence: number;                 // 0..1
  matchKind: "exact" | "prefix" | "fuzzy" | "semantic";
  slots: Slots | null;

  // Deterministic suppression metadata
  suppressible: boolean;
  suppressionReason?: VoiceCommandSuppressionReason;
}

// Deterministic policy contract
type VoiceCommandSuppressionReason =
  | "audio_quality_low"
  | "asr_confidence_low"
  | "speaker_confidence_low"
  | "strict_prefix_missing"
  | "ambiguous_language"
  | "slots_invalid"
  | "dedupe_cooldown"
  | "conflict_with_running_state"
  | "unknown";

interface VoiceCommandDefinition<Slots> {
  id: VoiceCommandId;

  // Phrase patterns (deterministic parser)
  patterns: Array<{
    // Canonical phrase forms (normalized)
    phrases: string[];                // e.g., ["send", "send it"]
    requiresHelixPrefix?: boolean;    // enforced when strict mode is on
    maxTokenLength?: number;          // anti-false-positive guard
  }>;

  // Slot extraction (deterministic)
  slotSchema: unknown;                // JSON Schema or zod-like shape
  extractSlots: (normalizedText: string) => { ok: true; slots: Slots } | { ok: false; reason: VoiceCommandSuppressionReason };

  // Confidence / gating policy (command-specific override)
  confidencePolicy: {
    minAsrConfidence: number;
    minSpeechProbability: number;
    minSnrDb: number;
    minSpeakerConfidence?: number;
    minCommandConfidence: number;     // parser=1.0 often, interpreter varies
  };

  // Confirmation policy (fixed window, but extensible)
  confirmPolicy: {
    mode: "passive_3s";               // required today
    allowVoiceInterrupt: boolean;     // required today
  };

  // Dispatch
  dispatch: (ctx: VoiceCommandContext, match: VoiceCommandMatch<Slots>) => Promise<void>;
}

// Registry (single source of truth)
interface VoiceCommandRegistry {
  version: "v1";
  commands: Array<VoiceCommandDefinition<any>>;
}
```

**How a new command is added safely:**
- Add one new `VoiceCommandDefinition` entry.
- Provide deterministic phrase patterns and slot extractor.
- Set command-specific threshold overrides if needed.
- No changes to state machine core (it processes `VoiceCommandMatch` generically).
- Add tests for the new definition (pattern, slot extraction, gating expectations).

### Noise robustness and strict mode policy

**Available policy levers already align with the codebase’s general approach to deterministic gates and rollout controls** (the Helix Ask pill uses env-based enablement and local audio gating toggles). citeturn2view0turn5view0

**Recommended gating signals (normal mode):**
- `speech_probability`: must indicate a real speech segment, not noise.
- `snr_db`: must exceed a minimum quality threshold.
- `asr_confidence`: must exceed a minimum for command acceptance.
- `speaker_confidence` (if available): must exceed minimum when multi-speaker UI is enabled / when ambient speech is likely. citeturn2view0

Because ASR errors rise sharply in noisy conditions, command acceptance should be **stricter than dictation** (dictation can tolerate errors; commands cannot). Noisy-speech recognition research and wake-word/keyword systems emphasize robust detection and controlling false activations in noise. citeturn6view2turn7view0

**Strict mode (“helix …” prefix)**
- When enabled, the parser requires a `helix` prefix (or `helix,` / `helix:`) for all command patterns.
- Interpreter fallback is either disabled or requires that the transcript begins with `helix` before it can return a command.
- This uses the same conceptual defense as wake-word/keyword-spotting systems: requiring a distinctive prefix materially reduces unintended triggers in noisy environments. citeturn6view2

**Deterministic thresholds proposal (starting point):**
- Normal mode:
  - `snr_db >= 10`
  - `speech_probability >= 0.55`
  - `asr_confidence >= 0.75` for `send/cancel/retry`, and `>= 0.80` for `translate*` (slot sensitivity)
- Strict mode:
  - require `helix` prefix
  - lower ASR threshold slightly (prefix itself is the guard), e.g. `asr_confidence >= 0.70`, but keep `snr_db` and `speech_probability` requirements.

All thresholds must be stored in a **policy snapshot** and emitted in telemetry to maintain replay/debug determinism (mirroring the general “replay-safe policy clock / deterministic suppression” posture). citeturn4view0turn5view0

## Telemetry, suppression reasons, and replay/debug auditability

This section provides required telemetry spec (G) and ties it explicitly to determinism requirements.

The system already treats deterministic suppression reasons as a first-class contract concept (for mission callouts/voice). The command lane must adopt the same approach: every non-executed command candidate should be suppressible with a stable typed reason, not “silently ignored,” so that false positives/false negatives can be triaged. citeturn5view0turn4view0

### Telemetry event/checkpoint names and required fields

Below is an exact event spec (names + required fields) designed for **replayability** and **issue triage**.

**Event: `helix.voice.command_lane.candidate_evaluated`**
- Required fields:
  - `ts_ms`
  - `session_id`
  - `utterance_id`
  - `transcript_raw`
  - `transcript_normalized`
  - `audio`: `{ snr_db, speech_probability, speaker_confidence, local_audio_gate }`
  - `asr_confidence`
  - `mode`: `{ strict_prefix_required: boolean }`
  - `parser_candidates`: array of `{ command_id, confidence, match_kind, slots_json, suppressible }`
  - `interpreter_used`: boolean
  - `interpreter_result` (optional): `{ command_id|null, confidence, slots_json|null }`
  - `arbiter_decision`: `{ route: "dictation" | "command", winning_command_id?: string }`
  - `suppression`: `{ suppressed: boolean, reason?: VoiceCommandSuppressionReason }`
  - `policy_snapshot_id` and `policy_snapshot_json` (thresholds + feature flags)

**Event: `helix.voice.command_lane.confirm_started`**
- Required fields:
  - `ts_ms`
  - `command_instance_id`
  - `utterance_id`
  - `command_id`
  - `slots_json`
  - `confirm_window_ms` (must be 3000)
  - `auto_confirm_deadline_ts_ms`
  - `policy_snapshot_id`

**Event: `helix.voice.command_lane.confirm_interrupted`**
- Required fields:
  - `ts_ms`
  - `command_instance_id`
  - `interrupt_source`: `"voice" | "ui" | "new_speech_activity"`
  - `interrupt_action`: `"cancel" | "retry" | "resume_dictation" | "confirm"`
  - `interrupt_utterance_id` (if voice-triggered)

**Event: `helix.voice.command_lane.executed`**
- Required fields:
  - `ts_ms`
  - `command_instance_id`
  - `command_id`
  - `slots_json`
  - `execution_target`: `"ask_dispatch" | "translation_pipeline" | "job_controller" | "ui_state"`
  - `result`: `{ ok: boolean, error_code?: string }`
  - `linked_trace_id` (if it triggers an ask)
  - `linked_job_id` (if it affects retry/resume)

**Event: `helix.voice.command_lane.suppressed`**
- Required fields:
  - `ts_ms`
  - `utterance_id`
  - `reason` (stable typed label)
  - `route_fallback`: `"dictation" | "noop"`
  - `debug`: include `top_candidate` and gate values

**Additional requirement: deterministic suppression reason taxonomy**
- Publish the enum in `shared/*` as a stable contract, similar in spirit to how suppression reasons are treated in the Dottie prompt-style contract. citeturn5view0

## Verification, rollout, implementation plan, risks, and recommendation

This section provides required test matrix (H), rollout (I), incremental plan, risks/mitigations, and go/no-go.

### Test matrix

**Unit tests**
- Parser:
  - Exact matches: `send`, `cancel`, `retry`.
  - Prefix strict mode: only `helix send` accepted.
  - Negative tests: “send me that link” should **not** match `send`.
  - Translation slot extraction:
    - “translate this to Spanish” ⇒ `es`
    - “translate to Brazilian Portuguese” ⇒ `pt-BR`
    - Ambiguity: “translate to Chinese” ⇒ ambiguous → suppression `ambiguous_language`
- Interpreter arbitration:
  - Parser wins over interpreter when both present.
  - Interpreter only invoked on short/command-like utterances.
  - Interpreter high confidence but audio gate fail ⇒ suppress (fallback dictation).
- State machine:
  - Confirm timer triggers auto-confirm at 3,000 ms.
  - UI cancel interrupts and prevents auto-confirm.
  - Voice “cancel” during confirm interrupts.
  - Non-command speech during confirm cancels confirm and resumes dictation.
  - Dedupe: same `command_instance_id` cannot execute twice within cooldown.

**Integration tests**
- Voice capture → ASR → command candidate → confirm → dispatch:
  - “send” produces ask dispatch; confirm window visible; auto-confirm fires when untouched.
  - “cancel” during confirm cancels and leaves mic in listening state.
  - “retry” triggers last-turn replay through existing job control primitives imported by the pill. citeturn2view0turn4view1
- Translation pipeline integration:
  - translate-one-shot returns translated draft, then dispatches.
  - translate-set-target flips mode; next utterance translated before send.
- Backward compat regression:
  - With command lane disabled via kill switch, behavior matches baseline.

**Noise scenario tests**
- False positives:
  - Background speech “cancel that” near mic should not cancel in normal mode if speaker confidence low (when available).
  - Strict mode must reject commands without prefix.
- False negatives:
  - In moderate noise, “helix send” should still execute because prefix reduces ambiguity.
- Audio-quality gating:
  - Simulate low `snr_db` and confirm suppression path records correct reason.

### Rollout plan and kill switch

Use the same “enable/shadow/percent/kill” pattern already present in the Helix Ask pill for voice confirm v2 rollouts. citeturn2view0

**Flags (client env)**
- `VITE_HELIX_VOICE_COMMAND_LANE_ENABLED` (default false)
- `VITE_HELIX_VOICE_COMMAND_LANE_SHADOW` (default true in early rollout)
- `VITE_HELIX_VOICE_COMMAND_LANE_ACTIVE_PERCENT` (0→10→50→100)
- `VITE_HELIX_VOICE_COMMAND_LANE_KILL_SWITCH` (immediate hard off)
- `VITE_HELIX_VOICE_COMMAND_LANE_STRICT_PREFIX` (off by default; enable for noisy environments)
- `VITE_HELIX_VOICE_COMMAND_LANE_INTERPRETER_FALLBACK` (off in phase 1; on later)

**Staging**
- Off: no detection, no telemetry.
- Shadow: detect and emit telemetry events, but never execute; always route as dictation.
- 10%: execute low-risk commands only (`send`), keep others in shadow.
- 50%: enable `cancel` and `retry`.
- 100%: enable `translate*` after slot/ambiguity handling is proven.

**Kill switch behavior**
- Must revert instantly to default dictation/pause-to-send behavior (no UI artifacts, no arbitration delays).
- Must still allow telemetry for postmortem if a separate `*_LOG_ONLY` flag is enabled.

### Incremental implementation plan

**Phase 1: Deterministic command lane skeleton (send/cancel/retry)**
- Implement command registry + deterministic parser + arbiter.
- Implement confirm window UI (3 seconds passive confirm) and interruption handling (voice + UI).
- Implement telemetry events and deterministic suppression reasons.
- Run in **shadow** first.

**Phase 2: Interpreter fallback + translation intent**
- Add interpreter fallback only for:
  - ambiguous command phrasing,
  - translate slot extraction.
- Add translation lane (prefer new endpoint or a dedicated AGI translation call) with structured response fields.
- Add ambiguity UI for language selection (only when needed).

**Phase 3: Hardening for noisy environments**
- Introduce strict mode and per-environment policy presets.
- Integrate speaker confidence / multi-speaker UI gating if available (the pill already has multi-speaker toggles). citeturn2view0
- Expand test coverage for noise scenarios and dedupe edge cases.
- Graduate rollout to 100% after metrics confirm low false-positive rates.

### Risks and mitigations

**Risk: Accidental command triggers in noisy settings (false positives).**
- Mitigation: audio quality gate + elevated confidence threshold; strict prefix mode; confirm window with voice/UI interruption; dedupe cooldown. citeturn5view0turn6view2

**Risk: Command lane disrupts dictation pacing (latency or “stolen” utterances).**
- Mitigation: arbitration defaults to dictation; interpreter fallback only on short/command-like utterances; shadow rollout to ensure minimal overhead.

**Risk: Non-deterministic behavior harms replay/debug.**
- Mitigation: stable suppression reason enum, policy snapshotting in telemetry, and recording both parser and interpreter outputs at the time of decision—mirroring the deterministic suppression and replay posture in the Dottie prompt-style contract. citeturn5view0turn4view0

**Risk: Translation language ambiguity leads to wrong output.**
- Mitigation: store target as BCP 47; enforce ambiguity detection; require explicit choice when ambiguous; treat low confidence as dictation fallback. citeturn6view0turn6view1

### Go/No-Go recommendation

**Go**, gated by objective acceptance criteria:

- **Correctness:** zero regressions in baseline pause-to-send and ask queue/stream lifecycle when command lane is disabled or suppressed. citeturn4view1
- **Safety:** no uncontrolled side effects—every command execution must pass confidence+quality gates and a 3-second passive confirm window with interruptions honored. citeturn5view0
- **Auditability:** telemetry must support deterministic replay of: candidate evaluation, gating inputs, confirm lifecycle, execution, and suppression reasons, consistent with the system’s existing deterministic suppression contract philosophy. citeturn5view0turn4view0
- **Noise readiness:** strict prefix mode demonstrably reduces false activations in noisy scenario testing before being recommended as a user-facing option. citeturn6view2
