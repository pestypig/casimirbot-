# Objective-First Situational Awareness for Helix Ask

Date: 2026-02-24  
Status: Decision-ready (scoped GO)

## Executive verdict

Decision: **GO (scoped)**.

Objective-first situational awareness is a stronger operator model than event-only triggering, if implemented with:
- deterministic objective and gap state transitions,
- evidence-linked callouts,
- text/voice certainty parity,
- explicit suppression explainability.

This keeps current low-noise event salience as the transport control layer, while objective gap logic becomes the semantic layer for relevance and action.

## Why this is decision-ready now

The repo already contains most hard runtime primitives:
- mission-board routes and persistence with ack/debrief closure semantics: `server/routes/mission-board.ts`, `server/services/mission-overwatch/mission-board-store.ts`
- voice gating, suppression, and parity contracts: `server/routes/voice.ts`, `shared/helix-dottie-callout-contract.ts`
- Helix Ask UI with Dot-context controls and read-aloud integration surfaces: `client/src/components/helix/HelixAskPill.tsx`, `client/src/lib/mission-overwatch/index.ts`

## Why it is close but incomplete

Remaining gap is mainly integration and UI projection:
1. No first-class objective-plus-gap card in Helix Ask UI.
2. Mission-board event stream is not yet clearly projected into the same UI loop as answer generation.
3. Objective relevance and speak eligibility are still spread across multiple layers.

Estimated completion: **2 focused batches**, plus 1 conditional hardening batch.

## Current-state checkpoints

### Confirmed in runtime
- `/api/mission-board/:missionId` supports snapshot/events/actions/ack/context-events route family.
- `/api/voice/speak` enforces policy and deterministic suppression envelopes.
- Replay-safe policy clock support exists with trusted replay gate controls.

### Confirmed in policy/docs/tests
- Voice certainty must not exceed text certainty.
- Low-noise salience behavior is intentional and tested.
- Deterministic fail/suppression reasons are part of the operating model.

### Needs explicit runtime wiring verification
- Whether live Helix Ask answer flow emits objective-driven context events in production path for all modes.
- Whether `DottieOrchestrator` is in the live route call chain versus library-only usage.

## Minimal objective-first contract (v1)

### 1) objective_init
Inputs:
- `missionId`
- `prompt`
- `clientTs`
- optional `traceId`

Outputs:
- `objectiveId` (deterministic)
- `objectiveStatement`
- `objectiveState` (`objective_init`, `objective_active`, `debrief_ready`, `closed`)
- initial `gapTop[]`

### 2) gap state
Each open gap:
- `gapId`
- `kind`
- `severity`
- `openedTs`
- `resolvedTs`
- `linkedEventId`
- `evidenceRefs[]`
- `suppressionReason` (if actionable output was suppressed)

### 3) relevance scoring
Deterministic and explainable:
- `relevanceScore` (bucketed)
- `relevanceExplanation` (single sentence)
- `gapDelta` (`opened`, `narrowed`, `unchanged`, `closed`)

### 4) speak eligibility
Single-source policy result:
- `emitText`
- `emitVoice`
- `suppressionReason`
- `cooldownMs`
- `policyClock` (`wall` or `replay`)

### 5) closure and debrief
- operator ack/action closes gaps,
- mission transitions to `debrief_ready`,
- closure metrics persisted on board events.

## UX-first contract

Operator must be able to do this in one view:
1. Ask question.
2. Immediately see objective and top unresolved gaps.
3. See why a callout was spoken or suppressed.
4. Take action from objective/gap context.
5. Observe deterministic progress to closure.

UI must treat voice as an action channel, not narration.

## Risks and invariants

### Risks
- certainty drift between text and voice,
- missing evidence on repo-attributed claims,
- replay drift from wall-clock fallback paths,
- policy drift when logic exists in multiple layers.

### Invariants
- `voice_certainty <= text_certainty`
- suppression always has deterministic reason code
- no silent suppression for operator-relevant transitions
- objective gap state must be reconstructable from persisted events

## Shortest path

### Batch 1: objective and policy foundation
- add objective-session and gap schema/contracts,
- consolidate speak-eligibility to one policy evaluator,
- expose objective/gap state through mission-board reads.

### Batch 2: Helix Ask UI projection
- objective card in `HelixAskPill`,
- top gap list with action affordances,
- callout stream with suppression inspector,
- mission-board projection panel in same flow.

### Batch 3 (conditional): hardening
- replay/adversarial scenario suite,
- transcript + debug correlation reports,
- SLO gates for objective-card latency and suppression consistency.

## Acceptance gates

GO to rollout only if:
- parity violations remain zero,
- suppression reason distribution remains stable in replay,
- objective card and gap tracker update within UI SLO,
- closure metrics are emitted on ack/debrief path.

## Evidence anchors (repo)

- `docs/BUSINESS_MODEL.md`
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/architecture/voice-service-contract.md`
- `docs/architecture/mission-go-board-spec.md`
- `server/routes/voice.ts`
- `shared/helix-dottie-callout-contract.ts`
- `server/routes/mission-board.ts`
- `server/services/mission-overwatch/mission-board-store.ts`
- `client/src/components/helix/HelixAskPill.tsx`
- `client/src/lib/mission-overwatch/index.ts`
