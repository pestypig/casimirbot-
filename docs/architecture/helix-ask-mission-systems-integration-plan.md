# Helix Ask Mission Systems Integration Plan: Auntie Dottie Voice, Dot Overwatch, Mission Go Board

## Section A: Executive recommendation

Build now (v1), with strict scope and kill criteria.
This repository already codifies the mission-overwatch direction, plus explicit contracts for voice and Go Board; the missing work is integration and enforcement, not invention.
Build now means implementing the operational substrate (event ingestion -> deterministic state engine -> low-noise callouts -> replayable micro-debrief), while keeping Dot as capabilities, not persona.
Defer only two items to v2: (1) predictive threat modeling and (2) LLM-written callouts; both increase overclaim risk and cost volatility. (assumption: current Helix Ask users value evidence posture over rich narration.)
Reject always-on chatty voice and voice-driven novel UI states because they violate low-noise, action-oriented voice posture and will drown operators.
Non-negotiable: ship with rate limits, dedupe, and evidence-linked provenance; if those fail, stop.

## Section B: Operational workflow mapped to Helix Ask stages

Helix Ask is already framed as a staged method (observe -> hypothesis -> experiment -> analysis -> explain). This plan treats Dot as the continuous loop that feeds and constrains those stages, not as an alternate assistant.

### Dot loop to Helix Ask stage mapping

Sense (Overwatch adjunct) -> Observe
Dot ingests multi-sensor signals (system telemetry, mission events, operator readiness, and Helix Ask tool/job stream signals) into a single normalized event envelope. In v1, multi-sensor means: (a) Helix Ask job and toollog stream, (b) operator online/offline plus audio focus, (c) mission timers plus risk deltas.

Interpret (Threat interpretation plus tactical synthesis) -> Hypothesis
Dot converts events into state plus consequence framed as: what changed, why it matters, what must be verified next, with an explicit confidence label (confirmed/reasoned/hypothesis/unknown). (assumption: mission-go-board-spec defines or permits these confidence states as first-class.)

Task (Command-and-control liaison) -> Experiment
Dot proposes operator-facing intents (acknowledge, navigate, verify, escalate, pause, deconflict) with minimal text and explicit evidence pointers. Dot does not invent new facts; it only routes or requests verification steps or attaches already-ingested evidence.

Fuse (Navigation/coordinate authority) -> Analysis
Dot updates the Go Board world model deterministically by applying events to state. This is the authoritative source for timers, risk rollups, and readiness gates. No LLM is required for state updates.

Brief (Micro-debrief loops) -> Explain
After each meaningful event cluster, Dot emits a structured micro-debrief record: facts, timestamps, operator action taken, and outcome (if known). These become replayable evidence-linked minutes for post-mission learning and audit.

Voice (Auntie Dottie voice layer) is an output channel, not the brain: it speaks only when salience policy says yes, and only in action-oriented, low-noise forms.

## Section C: Architecture and contracts

### Target architecture v1

Key principle: centralize truth (Go Board state engine plus event log), decentralize comfort (edge gating like audio focus, do-not-disturb, and local playback control).

### Sensor and event ingestion model

Ingestion unifies events into a canonical envelope:
- event_id, ts, source (sensor/system/operator), mission_id
- entity_refs[] (actors, assets, locations), evidence_refs[]
- delta (what changed), confidence, risk_hint, timer_hint (assumption: these fields fit within the Go Board event payload contract, or can be represented as typed meta.)

Event sources in v1 (deliberately limited to protect evidence posture):
- Helix Ask job lifecycle: queued/running/completed/failed plus partial text stream (for continuity, not for facts)
- Helix Ask tool log stream (SSE): primary system sensing for overwatch callouts such as verification failed or missing evidence
- Operator readiness signals: online/offline plus audio focus ownership so voice never fights other audio
- Mission timers plus board actions (created by operator and by deterministic rules)

### Edge vs central fusion model

Central (server): authoritative fusion and salience decisions; produces (a) Go Board state, (b) callout requests, (c) replay logs.
Edge (client): playback arbitration plus UX gating (audio focus, local mute, only-critical-while-typing) and lightweight buffering during offline periods.

### Dottie orchestration layer

Implement as a server-side module (new) that subscribes to ingested events and drives three deterministic outputs:
- State update: apply event -> Go Board state engine -> emit new snapshot
- Salience evaluation: event -> callout decision (priority plus cooldown plus dedupe key)
- Micro-debrief append: event cluster -> structured debrief events, always timestamped and source-linked

Tradeoff (accepted): v1 does not use an LLM to interpret threats; it uses rule-based mappings to avoid overclaiming certainty. (assumption: the agent policy favors deterministic safety over expressive synthesis.)

### Voice proxy plus external TTS contract

The repo voice contract anchors the HTTP surface at POST /api/voice/speak and emphasizes low-noise, rate-limited, action-oriented speech.

Contract compliance approach (v1):
- Implement /api/voice/speak wiring in server/routes.ts (new router), without changing existing Helix Ask endpoints
- Enforce dedupe, cooldown, and per-priority rate limits at the voice proxy boundary (server), not in UI
- Support replaceable backends behind a provider interface; default to local-first by allowing a self-hosted TTS base URL and explicit provider gates

Licensing and commercialization gates (implementation rule):
Voice provider selection must be an explicit config decision with a commercial_allowed flag and an audit log entry each time it is used. (assumption: BUSINESS_MODEL expects explicit gating/controls for commercialization.)
For COGS estimates and provider comparisons, use provider pricing pages as source of truth and treat all numbers as time-sensitive.

### Go Board state engine

The existing Go Board spec is the authoritative domain contract (entities, phases, events, actions, replay). v1 should implement it as written and avoid parallel shadow state.

State computation rule (determinism):
State = fold(event_log) + fold(actions) + derived_rollups(timers, risk). This keeps replay exact and makes debugging possible.

### API contracts and deterministic error envelopes

POST /api/voice/speak
Implement per docs/architecture/voice-service-contract.md; do not add breaking fields. If extra metadata is needed (mission id, event id, dedupe key), add as optional and propose a contract diff.

Go Board endpoints
Implement the spec endpoints under /api/mission-board/*.

Deterministic error envelope
Adopt one error shape across voice and Go Board endpoints. Align to the voice contract error envelope for uniform client handling.

### Contract revision diff proposals

These are only required if the current specs do not already carry these concepts. (assumption: current mission-go-board-spec does not include SSE streaming, and voice contract does not include explicit dedupe key.)

Proposed diff: voice-service-contract.md (non-breaking, optional fields)
Add optional request fields:
- dedupe_key?: string (server uses for cooldown plus idempotency)
- mission_id?: string, event_id?: string (for audit/replay linking)

Rationale: enables deterministic suppression of repeated callouts and explicit ledger links from voice to Go Board events.

Proposed diff: mission-go-board-spec.md (optional SSE endpoint)
Add:
- GET /api/mission-board/:missionId/stream (SSE) emitting board_event frames and periodic snapshot frames

Rationale: reduces polling load and makes overwatch feel live without changing event-log model.

## Section D: Go Board specification

### Domain model v1

This specifies the minimal decision-ready Go Board model required to support Dot operational capabilities and voice salience (not a full mission simulation).

Entities (mission-scoped canonical objects):
- Mission: mission_id, objective, constraints, phase, owner/operator ids, start/stop timestamps
- Actors: operator(s), field units, command roles (who can ack/escalate)
- Assets: vehicles/tools/systems under watch (can be virtual)
- Locations: named points plus coordinate authority fields; all navigation uses one canonical coordinate representation (assumption: spec supports location entities and coordinate schema.)
- Sensors: logical sensors producing events; multi-sensor awareness is satisfied by a common sensor abstraction even if v1 only wires a few sources

Relationships (graph edges):
- observes(sensor -> asset/location)
- assigned(actor -> task/intent)
- affects(event -> risk/timer/entity)
- supported_by(claim/risk -> evidence)
- acknowledged_by(event/risk -> actor)

Mission phases:
Implement phase enum exactly as in mission-go-board-spec.md. Dot uses phase to change salience thresholds (for example, during execute, warn becomes less chatty; during brief, info is allowed). (assumption: phases exist and are enumerable in spec.)

Confidence states:
Every material state element (risk, claim, location fix) carries:
- confidence: confirmed | reasoned | hypothesis | unknown
- confidence_basis: evidence_refs[] plus rationale (short, non-LLM or strictly template)

Timers:
- timer_id, label, t0, deadline, state, linked_entity_ids[]
- Derived: time_to_event_ms and threshold triggers (T-60s, T-10s, overdue)

Risk states:
Risks are first-class objects, not tags:
- severity (impact), likelihood (probability), time_horizon (immediate/near/far)
- state: open | mitigated | accepted | false_alarm
- consequence statement plus evidence refs plus confidence

### Command intents, operator actions, evidence links, replay provenance

Command intents (what Dot proposes):
- ACK_AND_CONTINUE
- VERIFY_WITH_SENSOR
- NAVIGATE_TO
- ESCALATE_TO_COMMAND
- PAUSE_MISSION / HOLD
- START_TIMER / CANCEL_TIMER
- MARK_RISK_MITIGATED / MARK_FALSE_ALARM

Operator actions:
Actions are what UI submits; they must be logged as events for replay:
- action_id, actor_id, ts, intent, payload, evidence_refs[], result
- Server returns updated snapshot and action receipt

Evidence links:
Evidence refs must point to inspectable artifacts:
- tool logs / trace ids, job ids, raw sensor packets, uploaded artifacts, or immutable URLs/hashes

Replay provenance:
Each event contains:
- source_type (operator/system/sensor), source_id, trace_id, job_id (when applicable)
- derived_from_event_ids[] for rollups (for example, micro-debrief derived from low-level events)

### Event ontology and salience policy

Priority tiers:
Use voice contract vocabulary: info | warn | critical | action.

Event classes that trigger callouts (v1):
A callout is allowed only when it maps to an operator decision:
- Action: do X now (for example, imminent timer, navigation correction, explicit safety stop)
- Critical: mission integrity breach, failed verification gate, risk moved to immediate high
- Warn: degradation, rising uncertainty, repeated transient failures
- Info: phase transitions, acknowledgements, completion of requested verification

(assumption: agent policy voice discipline requires callouts to be decision-relevant, short, and rate-limited.)

Debounce and cooldown rules (low-noise enforcement):
Implement deterministic salience gate:
- Per (mission_id, key) cooldown where key = event_type + primary_entity_id + risk_id/timer_id
- Default cooldowns: info 60s, warn 30s, critical 10s, action 5s
- Global cap: max 2 callouts / 15s per mission
- Escalation rule: higher priority can preempt cooldown of lower priority, never reverse

(assumption: defaults match repo low-noise posture and can be tuned by config.)

Operator telemetry awareness:
Before speaking, verify:
- audio focus is available (client can stop other audio or deny voice)
- operator is online and not in active typing-focus window unless priority is critical or action

(assumption: HelixAskPill already tracks offline and can be extended with focus state.)

Continuous micro-debrief loops:
For any critical or action event, write micro-debrief event within 30 seconds containing:
- triggering fact
- Dot advice
- operator action (if known)
- outcome status

## Section E: 30/60/90 delivery and staffing

(assumption: 1 principal systems architect/product strategist, 1 backend engineer, 1 frontend engineer, plus 0.25 QA/SRE support.)

### 30-day slice

Deliverable: Mission Overwatch Spine (end-to-end, minimal features, fully enforceable)

Backend:
- Implement /api/voice/speak route plus provider interface plus strict rate limiting plus deterministic error envelope
- Implement Go Board core endpoints per spec: create mission, append events, fetch snapshot, append actions
- Ingest Helix Ask tool logs as sensor events by subscribing to existing tool log stream infra and mapping tool stage to Go Board events
- Store mission events in replay-friendly structure (new migration; mirror job-store pattern for TTL and cleanup)

Frontend:
- Add Go Board panel placeholder in desktop UI and wire to snapshot plus event append endpoints
- Add voice playback component that requests audio focus and can be muted per mission

Kill criteria (30 days):
Stop or reset scope if any hold:
- Voice cannot be made low-noise (exceeds cap, repeats, or speaks without action)
- Go Board is not replayable/deterministic (same events produce different state)
- Helix Ask API behavior changes (regression in /api/agi/ask or job flow)

### 60-day slice

Deliverable: Operational-grade overwatch (salience policy, risk/timers, micro-debrief)

Backend:
- Implement full event ontology mapping: risk deltas, timer triggers, operator readiness events
- Implement micro-debrief auto-generation as deterministic templates plus evidence pointers; store as replay events
- Add mission-level rate/budget controls: per mission per day voice budget plus per provider quotas

Frontend:
- Implement operator action UI (ack/escalate/set timer) and evidence attachment UI

Kill criteria (60 days):
Stop or defer voice in production if:
- Operators routinely mute voice due to noise (target: less than 15 percent missions end with voice muted). (assumption: measurable in telemetry.)
- Evidence posture is compromised (callouts imply certainty without confidence/evidence links)

### 90-day slice

Deliverable: Commercializable v1 (licensing gates, enterprise controls, SLOs)

Backend:
- Add provider licensing gates plus audit logging; attach provider choice to each voice utterance receipt
- Add optional SSE for Go Board events if approved by spec diff
- Add environment hardening consistent with runtime limitations (timeouts, backpressure, graceful degradation)

Frontend:
- Go Board UX refinements: phase transitions, risk views, timer ladder, replay viewer

Kill criteria (90 days):
Do not sell externally if:
- Provider gating is not enforceable and auditable (licensing/commercial ambiguity)
- System cannot meet SLOs under realistic load

## Section F: Business model and unit economics

The repo business model doc should remain the primary packaging anchor; this section specifies executable packaging plus COGS approach consistent with explicit provider gates.

### Packaging tiers

Helix Ask Core (local-first)
Includes Helix Ask Q&A workflow and evidence posture; no voice and no Go Board persistence by default.

Mission Overwatch (Pro add-on)
Adds Go Board (replayable), timers/risks, and event-driven voice callouts with rate limits and mission budgets.

Enterprise Overwatch
Multi-tenant controls, provider allowlists, retention policies, audit exports, and on-prem deployment options.
(assumption: BUSINESS_MODEL anticipates enterprise controls and governance as a paid tier.)

### Pricing logic (decision-ready)

Seat plus usage hybrid:
- Per-operator seat (predictable value capture: mission oversight capacity)
- Voice usage pass-through or included quota plus overage (align costs with consumption)
- Optional compliance pack surcharge (audit plus retention plus gating)

(assumption: buyers are operations/security stakeholders preferring predictable seat pricing with transparent overages.)

### COGS drivers (voice-heavy)

Because voice cost varies strongly by provider, treat COGS as provider-dependent and keep default provider configurable and auditable.

Reference provider costs are time-sensitive and must be checked against current pricing pages at decision time.

COGS control mechanisms (must ship with v1 commercialization):
- Hard voice budgets: per mission, per day, per operator
- Text caps: max characters per callout; enforce short imperative template
- Caching: reuse audio for identical (voice_profile, text) tuples (assumption: contract allows caching metadata)
- Provider allowlists plus no-external-provider mode for sensitive deployments

### Margin risk

Primary margin risk is unbounded voice generation (especially verbose or frequent callouts). Voice must be event-driven and rate-limited at proxy boundary.
Secondary margin risk is LLM synthesis drift (using expensive models to narrate). This plan avoids that by making callouts deterministic templates in v1.

## Section G: Risk register and mitigations

Noise failure (voice becomes distracting)
- Mitigation: cooldown/dedupe, strict max callouts per time window, action-only templates, operator mute, critical-only modes

Evidence posture degradation (overclaiming certainty)
- Mitigation: required confidence labels for risks/claims; callouts include confidence keyword and/or verify-next instruction; link callouts to evidence refs

Contract drift (implementation diverges from specs)
- Mitigation: treat voice-service-contract.md and mission-go-board-spec.md as test contracts; generate fixtures and CI checks

API regressions in Helix Ask
- Mitigation: do not modify /api/agi/ask behavior; add new routes only; add regression tests around job flow and tool log stream

Provider licensing uncertainty
- Mitigation: provider gating with explicit commercial_allowed config and per-utterance audit; refuse provider enablement unless policy configured

Latency spikes (TTS stalls delay callouts)
- Mitigation: async queue plus timeout plus fallback text banner; never block Go Board state updates on voice success

Multi-sensor scope creep
- Mitigation: v1 wiring limited to tool logs, operator readiness, timers; added sensors require explicit sensor contract and threat model entry

## Section H: Open leadership decisions

What counts as mission for Helix Ask?
Is a mission always tied to a single Helix Ask session/trace, or can it span multiple sessions and external sensor feeds?

Which voice providers are allowed by default for commercial deployments?
Decide official default path (self-hosted first vs managed provider) and which providers can be enabled without legal review. Treat pricing/terms as time-sensitive.

Is SSE streaming a must-have for v1 Go Board?
If yes, approve the proposed spec diff; if no, accept polling until v1.1.

What is the Auntie Dottie voice policy boundary?
Decide whether Dottie may summarize uncertain events verbally, or only call out verified state changes and explicit operator prompts.

Operator control model
Define defaults: voice on/off, critical-only mode, and who can override in enterprise settings.
