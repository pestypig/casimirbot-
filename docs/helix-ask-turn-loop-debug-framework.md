# Helix Ask Turn Loop And Non-Voice Debug Framework

Status: active debug guide (updated for current voice + command-lane runtime).

## Canonical Sources For This Guide
1. `docs/helix-ask-flow.md`
2. `docs/architecture/voice-service-contract.md`
3. `docs/helix-ask-readiness-debug-loop.md`
4. `client/src/components/helix/HelixAskPill.tsx`
5. `server/routes/voice.ts`
6. `server/services/voice-command/command-arbiter.ts`
7. `client/src/lib/helix/turn-loop-timeline-reference.ts`

## Latest Stable Checkpoint
- `docs/helix-ask-turn-loop-checkpoint-2026-03-11.md`

## Runtime Model (Current)
The voice turn loop now has three coupled lanes:

1. Capture lane:
- segment cut
- STT request
- STT response
- optional transcript confirm gate
- dispatch queued/suppressed/completed

2. Command lane overlay (Phase 1):
- parser/evaluator command arbitration on transcribe response
- accepted actions: `send | cancel | retry`
- deterministic 3s command confirm timer
- command execution or cancel

3. Reasoning lane:
- `prompt_recorded`
- `brief` (queued/running)
- `reasoning_attempt` / `reasoning_stream`
- `reasoning_final` or typed suppression

## Turn Loop (Authoritative Order)
1. User speech is segmented and merged while assembler phase is `draft`.
2. Seal occurs only when silence + hash stability + queue/in-flight gates all pass.
3. A sealed revision can emit brief/final.
4. Command-lane decisions from `/api/voice/transcribe` are authoritative for command actions.
5. If transcript-confirm is active, transcript-confirm commands take precedence over command-lane confirms.
6. Any new speech/interrupt can preempt playback and invalidate stale revision authority.
7. Stale attempts must be suppressed with typed cause/stage metadata.

## Current Deterministic Checkpoints
Voice capture checkpoint keys include:
1. `track_live`
2. `signal_detected`
3. `segment_cut`
4. `stt_request_started`
5. `stt_response_ok`
6. `stt_response_error`
7. `confirm_auto_started`
8. `confirm_auto_fired`
9. `confirm_auto_cancelled`
10. `confirm_blocked_reason`
11. `command_detected`
12. `command_suppressed`
13. `command_confirm_started`
14. `command_confirm_fired`
15. `command_executed`
16. `command_cancelled`
17. `dispatch_queued`
18. `dispatch_suppressed`
19. `dispatch_completed`

## Transcript Confirm Policy (Current)
Transcript confirm decisions are:
1. `auto_confirm`
2. `manual_confirm`
3. `blocked`

Reason labels:
1. `eligible`
2. `dispatch_blocked`
3. `pivot_low_confidence`
4. `translation_uncertain_without_pivot`
5. `dispatch_not_confirm`
6. `invalid_confidence`
7. `low_audio_quality`
8. `live_activity`

## Command Lane Contract (Server-First)
`/api/voice/transcribe` now returns additive `command_lane` metadata:
1. `version`
2. `decision`: `accepted | suppressed | none`
3. `action`: `send | cancel | retry | null`
4. `confidence`
5. `source`: `parser | evaluator | none`
6. `suppression_reason`
7. `strict_prefix_applied`
8. `confirm_required`
9. `utterance_id`

Phase-1 suppression reasons:
1. `disabled`
2. `kill_switch`
3. `rollout_inactive`
4. `audio_quality_low`
5. `strict_prefix_required`
6. `log_only`

## Suppression Taxonomy For Practical Debug
Use these first when triaging timeline failures:

1. `dispatch_suppressed` + `authorityRejectStage=preflight`
- meaning: request was blocked before reasoning execution.
- common causes: low-quality/low-confidence gating, policy suppress, command/log-only modes.

2. `artifact_guard_restart`
- meaning: generation drifted into disallowed output shape; restarted observe lane.

3. `phase_not_sealed`
- meaning: attempt rejected due revision/seal authority mismatch.

4. `inactive_attempt`
- meaning: stale attempt/chunk superseded by newer same-turn attempt.

5. `barge_in_hard_cut:*`
- meaning: playback interrupted by speech detection/barge logic.

## Practical Debug Workflow (In Practice)
Run this workflow for real incidents before changing logic:

1. Confirm server readiness:
```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:5050/health
```

2. Capture one failing turn bundle:
- `build_info`
- `segment:*` entries
- `timeline:*` entries for that `turnKey`
- checkpoint row showing `stt_response_error` and confirm/dispatch checkpoints

3. Classify the failure class:
- Class A: `dispatch_suppressed` preflight
- Class B: suppression loop (`artifact_guard_restart` or repeated `phase_not_sealed`)
- Class C: barge/noise interruption
- Class D: confirm timer/precedence regression
- Class E: command lane false positive/false negative

4. Apply class-specific checks:
- Class A:
  - verify `dispatch_state`, `needs_confirmation`, `pivot_confidence`, `confirm_block_reason`
  - verify command-lane `decision/action/suppression_reason`
- Class B:
  - verify seal token/revision monotonicity
  - verify stale attempts are suppressed with typed cause
- Class C:
  - check `speech_probability`, `snr_db`, noisy profile, barge thresholds
- Class D:
  - verify only one active confirm timer and transcript-confirm precedence behavior
- Class E:
  - verify strict-prefix mode, adaptive noise gate, keyword-in-sentence fallback to dictation

5. Require deterministic evidence in report:
- one prompt
- one brief/final/suppression chain
- one typed root-cause label
- one fix recommendation tied to a gate/reason

## Patch-Relevant Non-Voice Tests
Use targeted tests first for voice command/confirm behavior:
```powershell
npx vitest run tests/voice.command-arbiter.spec.ts
npx vitest run tests/voice.transcribe.routes.spec.ts
npx vitest run client/src/lib/agi/__tests__/api.voice-transcribe.spec.ts
npx vitest run client/src/components/__tests__/helix-ask-pill-ui.spec.tsx
```

Then optionally run broader readiness loops if the touched area requires it:
1. contract battery
2. variety battery
3. patch probe
4. multilingual gate (when multilingual routing/confirm changed)

## Timeline Reference Analyzer
Use:
- `client/src/lib/helix/turn-loop-timeline-reference.ts`
- `client/src/lib/helix/__tests__/turn-loop-timeline-reference.spec.ts`

It flags:
1. `missing_prompt_recorded`
2. `missing_brief_before_final`
3. `missing_typed_suppression_cause`
4. `soft_lock_candidate`

## Practical Root-Cause Examples (Current Incident Patterns)
1. "Reasoning suppressed for this turn" with `dispatch_suppressed`:
- this is usually a preflight dispatch gate block, not an LLM final-stage failure.

2. Command phrase heard but no action:
- expect `command_lane.decision=none|suppressed` and check `strict_prefix_applied` and `suppression_reason`.

3. Confirm countdown disappears:
- verify transcript-confirm vs command-confirm precedence and active-timer ownership.

4. Voice output cut in noisy environment:
- inspect barge thresholds with current `speech_probability` and `snr_db`.

## Completion Gate
For code/config patches affecting this area:
1. targeted voice/command tests pass
2. Casimir verify PASS with certificate hash and `integrityOk=true`
