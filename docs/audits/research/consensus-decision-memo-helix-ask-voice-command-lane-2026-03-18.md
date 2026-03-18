# Consensus decision memo on the Helix Ask voice command lane LLM mechanic

## Executive decision

Your proposed mechanic—**a keyword-triggered intermediate LLM “situational verdict” step that differentiates “keyword-in-sentence” vs “abrupt command,” followed by command execution**—is directionally strong for *extensibility* and *social/noisy environments*, but it must be **bounded, fail-safe, and deterministic at the edges** to avoid recreating the reliability failures you called out (softlocks, suppression dead-ends, countdown inconsistencies, and noise-induced interruptions).

**Consensus recommendation:** **Prefer no second LLM call** for command execution *by default*, and adopt a **dynamic hybrid (Candidate C)** where a second LLM call is allowed **only in bounded, high-risk ambiguity cases** (primarily: *translation target resolution* and *multi-command disambiguation that cannot be resolved deterministically*). In all other cases: **single evaluator + deterministic registry execution**.

Why this is the best fit for *this* codebase:

- The current voice lane already emphasizes **deterministic gating + typed suppression reasons + replay-safe policy evaluation** (contracts for Dottie callouts and voice service), and you explicitly require deterministic suppression reasons and auditability. citeturn18view0turn20view0  
- The client already implements a **confirm lifecycle with an auto-confirm deadline that is extended/blocked deterministically by live activity and audio-quality gates**—this is exactly the kind of mechanism your command lane should reuse, not bypass. citeturn9view0  
- Introducing a broad “second LLM planner call” raises **softlock risk** (extra dependency, extra latency tail, more failure modes) in the same paths that already show fragility (confirm countdown paths, suppression outcomes, barge-in/interrupt behavior). citeturn9view0  

So: **your “intermediate evaluator” is a yes**—but **the “rubric retrieval + second planning call” should be conditional, not the common path**.

## Decision matrix across candidates

Below is the consensus evaluation of A/B/C against your success criteria (reliability, continuity, noise robustness, determinism, extensibility). Ratings are relative for this codebase.

| Dimension | A. Parser-first + 1 evaluator + deterministic registry | B. Parser-first + 2 LLM calls (verdict + planner) | C. Dynamic hybrid (default 1 call, allow bounded 2nd call) |
|---|---|---|---|
| Reliability / softlock risk | **Best** (fewest async dependencies) | **Worst** (more calls → more stalls/timeouts/retries) | **Near-best** (2nd call rare + bounded) |
| False-positive command risk in noise | Good if pre-gates are strict | Medium (planner can “overfit” into tools even when verdict is shaky) | **Best** (strict pre-gates + limited second call) |
| False-negative command miss risk | Medium (parser can be strict; evaluator helps) | Best (two chances to “recover”) | **Best overall** (evaluator handles nuance; 2nd call available for edge ambiguity) |
| Latency (P50 / P95 tail) | **Best** | **Worst** | **Good** (worst-case tail only on rare branches) |
| Determinism / replay auditability | **Best** (registry + stable reason enum) | Medium–poor (planner adds extra nondeterministic step) | **Good** (planner only when explicitly justified and always logged) |
| Extensibility for future commands | Good (registry scaling) | Very good (LLM can plan novel combos) | **Best practical** (registry first; LLM assists only when needed) |

**Decision:** **C** is the best architecture for *hands-free noisy environments* while preserving **pause-to-send default** and the **deterministic/replayable suppression contract** emphasized in existing voice/callout contracts. citeturn18view0turn20view0

## Detailed architecture spec

### Core arbiter design

The arbiter is a **parallel overlay lane** that consumes the same transcript stream but **never blocks the baseline dictation send path** unless a command is *high-confidence*, *audio-quality-gated*, and *confirmed* (3s passive confirm or explicit user action).

This aligns with the current client’s confirm approach, where confirm auto-deadlines are computed deterministically and can be blocked/extended by “live activity” and audio-quality gates. citeturn9view0

#### Deterministic pre-gates

Trigger the evaluator only when **all** are true:

- **Lexical trigger:** transcript contains at least one command keyword (send/cancel/retry/translate/stop translating/send raw), with simple “imperative likelihood” heuristics (very short utterance, command keyword near beginning, minimal filler).  
- **Audio quality gate:** pass thresholds on available signals like `speech_probability`, `snr_db`, and ASR confidence. Your system already uses these to compute “local audio gate” and apply confirm policies. citeturn9view0  
- **Cooldown/dedupe:** prevent repeated triggers on incremental partials (dedupe keyed by `(utterance_id, normalized_span, command_id)` with a short cooldown window).  
- **No-softlock fallback rule:** if any gate is uncertain → **treat as dictation**, do not suppress dispatch.

This is consistent with the broader “low-noise defaults” doctrine in Helix Ask flow and Dottie/voice contracts: suppress only when deterministically justified, and preserve replayability. citeturn21view0turn18view0turn20view0  

#### Evaluator LLM (single call)

If pre-gates pass, invoke a **fast evaluator model** with **schema-constrained output** selecting only from allowlisted commands. Structured/schema-constrained outputs are the correct mechanism for “bounded power” here: they reduce parsing failures and improve safety/reliability under retries. citeturn22search2turn22search3

Evaluator output must be **purely classificatory** (no planning, no arbitrary tool choice):

- `intent_type`: `command | dictation | mixed`
- `commands`: array of `{ command_id, span, confidence, slots }`
- `overall_confidence`
- `reasons`: short standardized reason codes (for telemetry)
- `recommended_confirmation`: `required | not_required` (but policy can override)

**Hard rule:** if evaluator confidence < threshold or output inconsistent → **route to dictation/queued reasoning**, do not suppress.

#### When a second LLM call is allowed

A second call is allowed only when all are true:

1. Evaluator returns `intent_type=command` and a command is selected from allowlist.
2. The command has `planning_policy = conditional_second_call`.
3. The ambiguity cannot be resolved deterministically.

This should be rare and bounded to:

- **Translation target disambiguation** (“translate to Chinese” → zh? zh-Hans? zh-Hant? Mandarin vs Cantonese).
- **Compound commands** whose ordering or scoping is non-trivial (“translate this to Spanish and send raw” is contradictory unless policy resolves “send raw” as overriding translation).

Even then, the second call must still be **schema-bound** and is effectively a “disambiguator,” not an open planner.

### Translation command semantics

You should treat translation as two separate command families:

- **One-shot:** “translate this to \<language\>” → translate the last captured dictation span (or last user message) and send as a single operation.
- **Mode:** “translate to \<language\>” → enable a per-session “translation mode” applied to subsequent dictation until “stop translating.”

Translation mode needs strong undo/bypass primitives to preserve flow continuity:

- `stop translating` → exit mode (confirm required).
- `send raw` / `send original` → bypass translation for **next send only** (or for current confirm window), without turning off mode.

This fits the deterministic “session state” discipline described in Helix Ask Flow (explicit states, replay-safe envelopes). citeturn21view0

#### Language resolution approach

- **Slot extraction:** The evaluator extracts the raw `language_name_span`.
- **Deterministic resolver:** Map the span to a **BCP 47** tag using a controlled synonym table. Use BCP 47 lookup/matching principles to handle specificity and fallback deterministically. citeturn22search0  
- **Display name support:** Use CLDR display-name guidance to present “English (United States)” style names when specificity matters, while keeping internal canonical tags stable. citeturn22search4  

If ambiguous:

- Enter confirm window showing top candidates (for UI), but the action remains deterministic:
  - If strict/noisy mode is on: require explicit “helix translate to zh-Hant” or “helix translate to Chinese traditional”.
  - Otherwise: pick a deterministic default (e.g., `zh` or user locale preference if available) but require confirm and allow voice “cancel/retry”.

### Noise robustness and strict prefix mode

You already have a concept of **local audio gating** and confirm policies driven by audio signals (`speech_probability`, `snr_db`) in the client confirm machinery. Use those signals as first-class inputs to the command lane and bias against command detection under poor audio. citeturn9view0

Recommended policy:

- **Normal mode:** commands enabled; evaluator only after pre-gates.
- **Noisy environment mode (optional strict mode):**
  - Require prefix “helix …” for **mode-changing** commands (translate mode, stop translating).  
  - For non-mode commands like `cancel`, allow either “cancel” or “helix cancel” *if* audio quality is excellent; otherwise require prefix.
  
Why this works: keyword spotting / wake-word research consistently frames the false accept / false reject tradeoff in noisy environments; adding an explicit prefix/wake-word is a standard mitigation when push-to-talk is not available. citeturn16search0turn16search1  

### Routing table

| Input condition | Route | Notes |
|---|---|---|
| Normal dictation (no command candidate) | Baseline queued reasoning flow | Must preserve pause-to-send behavior. |
| Candidate command but gates fail | Baseline flow | Never suppress; log suppression reason. |
| `send` confirmed | Normal ask dispatch | Equivalent to pause-to-send but explicit. |
| `cancel` confirmed | Clear pending confirm + optionally cancel current capture / current run (policy-based) | Must not break running reasoning unless explicitly scoped. |
| `retry` confirmed | Replay last user turn | Implement as deterministic “re-dispatch” of last stable payload. |
| `translate this to <lang>` confirmed | Translation pipeline then dispatch | Translation execution is separate from command planning. |
| `translate to <lang>` confirmed | Enable translation mode | Applies to subsequent sends; must be visible in UI state. |
| `stop translating` confirmed | Disable translation mode | Deterministic: mode off. |
| `send raw` confirmed | One-shot bypass | Overrides translation for next send only. |

This preserves the “overlay lane” requirement: standard dictation continues unless a confirmed command intercepts. citeturn21view0

## Arbiter pseudocode and state machine

### Authoritative state machine

Text-form diagram (deterministic states + transitions):

```
[LISTENING_DRAFTING]
  on ASR_PARTIAL/FINAL -> update draft transcript
  on PAUSE_EOS -> baseline auto-send path (unchanged)

  if COMMAND_CANDIDATE && pre_gates_pass:
      -> [COMMAND_EVALUATING]

[COMMAND_EVALUATING]
  invoke EvaluatorLLM (schema-bound)
  if evaluator says DICTATION or low_confidence:
      log suppression(reason=EVAL_UNCERTAIN)
      -> [LISTENING_DRAFTING] (no blocking)
  if evaluator says COMMAND with allowed command(s):
      -> [COMMAND_DETECTED]

[COMMAND_DETECTED]
  create ConfirmIntent {command_id(s), slots, span, nonce}
  -> [CONFIRM_COUNTDOWN_ACTIVE]

[CONFIRM_COUNTDOWN_ACTIVE] (3.0s passive confirm)
  start deadline = now + 3000ms (policy clock aware)
  show passive UI confirm
  if USER_TAPS_CANCEL or VOICE_SAYS("cancel"):
      log confirm_cancelled(by=user)
      -> [CANCELLED] -> [LISTENING_DRAFTING]
  if VOICE_SAYS("retry") during confirm:
      override intent to RETRY (policy allows)
      -> [COMMAND_EXECUTING]
  if deadline reached and not cancelled:
      -> [AUTO_CONFIRM_FIRED]

[AUTO_CONFIRM_FIRED]
  -> [COMMAND_EXECUTING]

[COMMAND_EXECUTING]
  if command requires second_call AND ambiguity_detected:
      -> [PLANNING_DISAMBIGUATOR] (bounded second call)
  else:
      execute registry action(s)

  on success:
      -> [EXECUTED]
  on failure:
      -> [FAILED] (with deterministic failure reason)
  
[EXECUTED]
  if command was mode-changing:
      -> [RESUMED_DICTATION] -> [LISTENING_DRAFTING]
  else if command implies dispatch:
      -> [LISTENING_DRAFTING] (after dispatch initiation)

[FAILED]
  show non-blocking toast + keep draft intact
  -> [LISTENING_DRAFTING]
```

Key anti-softlock rules baked in:

- **No path ends without returning to LISTENING_DRAFTING**.
- Evaluator uncertainty **never suppresses** baseline dictation send.
- Confirm countdown is a **single authoritative timer** with a nonce to prevent double-fire.
- Any “live activity” during confirm either cancels confirm or deterministically extends/blocks the auto-confirm (reuse the existing confirm policy pattern that blocks auto-confirm during live activity). citeturn9view0  

### Arbiter pseudocode

```ts
function onTranscriptUpdate(evt: TranscriptEvt) {
  updateDraft(evt);

  // Baseline: pause-to-send unchanged
  if (evt.isEndOfSpeech && baselineAutoSendEnabled && !hasActiveConfirm()) {
    dispatchAsk(draftText);
    return;
  }

  // Overlay: candidate detection
  const candidate = detectCommandCandidateDeterministic(evt.text);
  if (!candidate) return;

  const gates = evalCommandGates({
    transcript: evt.text,
    asrConfidence: evt.confidence,
    speechProb: evt.audio.speech_probability,
    snrDb: evt.audio.snr_db,
    strictMode: settings.strictPrefixMode,
  });

  emitTelemetry("voice.command.gates_evaluated", { candidate, gates });

  if (!gates.pass) return; // fallback-safe

  if (cooldownHit(candidate.dedupeKey)) return;

  startEvaluatorLLM(candidate, evt);
}

async function startEvaluatorLLM(candidate, evt) {
  enterState(COMMAND_EVALUATING);

  const verdict = await evaluatorLLM({
    transcript: evt.text,
    allowlist: registry.getAllowlistedCommands(),
    strictPrefixMode: settings.strictPrefixMode,
  }); // schema-bound

  emitTelemetry("voice.command.evaluator_result", { verdict });

  if (verdict.intent_type !== "command" || verdict.overall_confidence < THRESH) {
    exitToListening("eval_uncertain");
    return;
  }

  const chosen = registry.validate(verdict.commands);
  if (!chosen.ok) {
    exitToListening("invalid_command");
    return;
  }

  beginConfirmWindow(chosen.value); // 3 seconds passive confirm
}

function beginConfirmWindow(intent: ConfirmIntent) {
  if (confirmNonceActive(intent.nonce)) return; // anti-double-fire
  enterState(CONFIRM_COUNTDOWN_ACTIVE, intent);
  startConfirmTimer(3000, intent.nonce);
}

function onConfirmTimeout(nonce) {
  if (!isCurrentConfirmNonce(nonce)) return;
  enterState(COMMAND_EXECUTING);
  executeIntent(currentConfirmIntent);
}
```

Schema-bound evaluator guidance is consistent with best practice for tool/intent extraction: constrain outputs to developer-supplied schema/allowlist to improve reliability and safety. citeturn22search2turn22search3  

## Telemetry spec and suppression taxonomy

Your deterministic suppression and auditability requirements mirror the Dottie prompt-style contract’s insistence on stable suppression labels and replay determinism. citeturn18view0turn20view0  

### Event names (exact) and required fields

Non-exhaustive but sufficient for replay/debug of the lane:

1. `voice.command.gates_evaluated`  
   Required fields:
   - `ts_ms`, `trace_id`, `session_id`, `utterance_id`
   - `candidate_keywords[]`
   - `audio: { speech_probability, snr_db }`
   - `asr_confidence`
   - `strict_prefix_mode`
   - `gate_pass: boolean`
   - `suppression_reason?: enum`

2. `voice.command.evaluator_requested`  
   - `allowed_command_ids[]`
   - `prompt_version`
   - `model_id`
   - `deadline_ms`

3. `voice.command.evaluator_result`  
   - `intent_type`
   - `commands[]: { command_id, span, confidence, slots }`
   - `overall_confidence`
   - `decision_reason_codes[]`
   - `latency_ms`
   - `parse_ok`

4. `voice.command.confirm_started`  
   - `confirm_nonce`
   - `commands[]` (normalized)
   - `deadline_ts_ms`
   - `confirm_policy: { passive_ms: 3000, interruptible: true }`

5. `voice.command.confirm_interrupted`  
   - `confirm_nonce`
   - `interrupt_source: voice | ui`
   - `interrupt_command_id?: cancel | retry | ...`
   - `ts_ms`

6. `voice.command.confirm_auto_fired`  
   - `confirm_nonce`
   - `ts_ms`
   - `auto_confirm_delay_ms`

7. `voice.command.executed` / `voice.command.failed`  
   - `confirm_nonce`
   - `command_id`
   - `execution_target` (dispatch/translation/retry/etc.)
   - `result_ok`
   - `failure_reason?: enum`
   - `latency_ms`
   - `side_effects[]` (e.g., “translation_mode_on”)

### Stable suppression reason enum

Example (must be additive and stable):

- `GATE_NO_KEYWORD`
- `GATE_AUDIO_LOW_QUALITY`
- `GATE_STRICT_PREFIX_MISSING`
- `GATE_COOLDOWN_ACTIVE`
- `EVAL_UNCERTAIN`
- `EVAL_INVALID_COMMAND`
- `CONFIRM_CANCELLED_BY_USER`
- `CONFIRM_CANCELLED_BY_VOICE`
- `EXECUTION_POLICY_BLOCKED`
- `EXECUTION_FAILED`

This mirrors the existing emphasis on stable reason labels in voice contracts. citeturn18view0turn20view0  

## Test matrix and rollout gates

### Unit tests

Core matrix:

- **Deterministic pre-gates**
  - keyword at start vs in sentence
  - short imperative vs long dictation
  - strict prefix present/absent
  - audio gates pass/fail boundary values
- **Evaluator arbitration**
  - schema parse success/failure
  - allowlist rejection
  - low-confidence fallback to dictation (never suppress)
  - mixed intent (command + dictation)
- **State machine correctness**
  - confirm timer starts exactly once per nonce
  - cancel interrupts before auto confirm
  - retry overrides during confirm
  - dedupe/cooldown prevents double-fire on partial updates
  - failure always returns to LISTENING_DRAFTING

### Integration tests

- Voice capture → ASR partials → command candidate → evaluator → confirm → execute (send/cancel/retry).
- Translation one-shot: utterance triggers translate-this → translation pipeline → dispatch.
- Translation mode: translate-to → subsequent dictation auto-translated on send → stop translating ends mode.
- “Overlay, not replacement”: dictation pause-to-send still works even while command system is enabled.

### Noise scenario tests

- Simulated background speech that includes keywords (“…and then you send it…”) should not trigger commands under strict gates.
- High noise / low SNR should prevent evaluator invocation.
- Barge-in/ambient noise should not repeatedly pause playback unless speech_probability is high (avoid “noise barge-in” loops). The client already contains explicit barge-in handling for potential speech during playback; your command gating should leverage those signals to reduce false interruptions. citeturn9view0  

### Regression checks

- Confirm countdown consistency: confirm timer must not “disappear” when partials arrive; ensure one authoritative timer/nonce.
- Existing queued reasoning behavior and pause-to-send remain unchanged.
- Existing deterministic suppression reasons remain stable.

### Rollout plan and kill switch

Phased flags:

- `voice_command_lane_enabled`: `off | shadow | on`
- `voice_command_lane_strict_prefix`: `off | on`
- `voice_command_lane_second_call_policy`: `never | conditional | always` (target: **conditional**)

Stages:

- **Off:** code paths inert.
- **Shadow:** run gates + evaluator, emit telemetry only; never executes commands.
- **10% / 50% / 100%:** progressively enable execution with kill switch.

Kill switch behavior:

- If disabled at runtime, all command lane paths short-circuit to dictation; no suppression.

This is consistent with additive, backward-compatible contract evolution emphasized by existing docs. citeturn20view0turn21view0  

## Final recommendation and Go/No-Go criteria

### Final recommendation

**Recommend: “Use second call conditionally” (Candidate C), with a strong bias toward “prefer no second call.”**  
In practice this means:

- **Keep your intermediate evaluator LLM step** (your key idea) because it solves the “keyword-in-sentence vs abrupt command” problem better than deterministic parsing alone.
- **Do not make the second LLM call the default**. Replace “retrieve rubric of all possible actions” with a **deterministic command registry** and only permit a second call for **bounded disambiguation** when deterministic resolution would be brittle (translation language ambiguity, complex compounds).

This yields the best combined outcome on the failure patterns you listed: it minimizes the new ways the lane can stall while still enabling nuanced command detection in social/noisy settings. citeturn9view0turn18view0turn20view0  

### Go/No-Go (measurable)

Go only if all are true in shadow and 10%:

- **No increase** in “dead-end” outcomes (no progression after speech end) relative to baseline.
- False-positive command execution rate in noisy replay set: **≤ 0.1%** of sessions (and trending down).
- Confirm countdown consistency: **≥ 99.9%** of confirms show a complete 3s lifecycle (start → end/interrupt), with single-fire guarantee.
- Command lane evaluator failures: **≤ 0.5%** of evaluator calls (schema parse + allowlist validation), with 100% fallback to dictation and zero softlocks.
- Strict prefix mode, when enabled, reduces false positives by a statistically meaningful margin without unacceptable miss rate.

### Notes on repo grounding

- The prompt’s baseline doc `docs/audits/research/voice-command-intent-lane-architecture-2026-03-18.md` was **not present at the referenced path** (404 on repo fetch), so this memo grounds itself in the available Helix Ask Flow and voice/callout contracts plus the client’s existing confirm and audio-gating behavior. citeturn21view0turn18view0turn20view0
