# Helix Ask Future Implementation Roadmap (Planning Draft)

Status: planning-only, intended for staged adoption after retrieval reaches stability targets.

## Why this doc exists
This roadmap organizes projected Helix Ask features into concrete implementation tracks that map directly to current code surfaces. It is optimized for future execution sequencing, not immediate rollout.

## Planning principles
- Retrieval stability first: no feature track should bypass current grounding/evidence gates.
- Additive architecture: extend existing contracts (`/api/agi/*`, `/api/voice/*`, mission board, panel manifests) instead of replacing them.
- Certainty discipline: optimistic language can improve tone, but must not overstate evidence certainty.
- Tiered rollout: shadow mode -> gated beta -> default, with deterministic fail reasons preserved.

## Existing foundations already in repo
- Helix Ask runtime and surface contracts: `server/services/helix-ask/*`.
- Voice + STT + command lane primitives: `client/src/components/helix/HelixAskPill.tsx`, `server/routes/voice.ts`.
- Mission events + board schema: `server/routes/mission-board.ts`, `server/services/mission-overwatch/*`, migration `server/db/migrations/025_mission_board.ts`.
- Profile/auth tenant controls: `server/routes/agi.profile.ts`, `server/auth/tenant.ts`, AGI auth wiring in `server/routes.ts`.
- Desktop/mobile panel shell docs: `docs/helix-desktop-panels.md`, `docs/mobile-helix-start-roadmap.md`.

## Track A: Optimistic response language contract
Goal: bias phrasing toward constructive continuation while preserving scientific honesty.

### A1. Tone-policy layer (server)
- Add `optimistic_language_mode` policy in Helix answer finalization path.
- Candidate touchpoints:
  - `server/services/helix-ask/surface/response-finalize.ts`
  - `server/services/helix-ask/surface/final-answer-surface.ts`
  - optional style helpers in `server/services/helix-ask/novelty-phrasing.ts`
- Add deterministic lexical rewrite map (example class):
  - restrictive phrasing -> agency-positive phrasing
  - dead-end phrasing -> continuation framing
- Guardrail: never upgrade certainty labels (`unknown/hypothesis/reasoned/confirmed`).

### A2. Tests + eval
- Add unit tests for rewrite behavior and "no certainty inflation" guarantees.
- Add readiness-loop cases in:
  - `scripts/helix-ask-regression.ts`
  - `scripts/helix-ask-versatility-record.ts`
- Accept only if intent correctness and evidence posture do not regress.

## Track B: Public Helix Ask API from casimirbot.com
Goal: provide authenticated API access and install docs retrievable by Helix Ask.

### B1. API productization
- Harden public contract around `/api/agi/ask` + job endpoints.
- Add key-scoped rate limits and audit logging.
- Candidate server surfaces:
  - `server/routes.ts` (middleware composition)
  - `server/routes/agi.chat.ts`, `server/routes/agi.plan.ts`
  - `server/routes/agi.profile.ts` (profile linking)

### B2. Auth, tenant, key lifecycle
- Build user profiles with API key issuance + rotate/revoke endpoints.
- Reuse/extend tenant guards in `server/auth/tenant.ts`.
- Data model additions (new migrations expected):
  - users
  - api_keys (hashed)
  - key_events (issue/rotate/revoke)
  - plan/subscription ledger

### B3. Paywall + anti-spam
- Introduce token/minute quotas by plan tier.
- Integrate with API admission and global rate limit middleware.
- Deterministic errors for overage and quota states.

### B4. Installation docs retrieval
- Publish a canonical markdown guide (SDK + curl + auth + tenant headers).
- Register guide under `docs/` and validate it appears in retrieval index.
- Add Helix Ask regression prompt asserting install docs are discoverable.

## Track C: Voice fast-reaction lane (pre-brief acknowledgments)
Goal: very low-latency acknowledgments ("yes/ok/oh") before full brief/final chunks.

### C1. Reactive micro-utterance planner
- Add pre-brief lane decision function (mood + intent + timing window).
- Leverage existing voice timeline/command-lane primitives in:
  - `client/src/components/helix/HelixAskPill.tsx`
  - `client/src/lib/helix/voice-playback.ts`
- Keep payload tiny and cancellable when user continues speaking.

### C2. Mood classifier (lightweight)
- Run lightweight classification from partial transcription chunks.
- Start with deterministic class buckets (neutral/affirm/concern/urgent).
- Promote to LLM classifier only when confidence is low.

### C3. Silence-window dispatch
- Dispatch reaction only during short silence windows.
- Drop queued reaction when superseded by speech or command detection.

## Track D: Noisy-environment and speaker-aware voice lane
Goal: robust command recognition in social/noisy spaces and mixed audio sources.

### D1. Speaker identity and diarization evolution
- Extend existing `speaker_id` + confidence fields in `POST /api/voice/transcribe`.
- Add enrollment flow for known users and profile-linked voice signatures.
- Keep unknown speakers observable but non-authoritative by default.

### D2. Device-audio + mic dual source
- Add a browser/media panel that can ingest tab/device audio for live transcription.
- Separate source lanes: `mic_user`, `device_audio`, `ambient_other`.
- Use color-coded transcript overlays by source/speaker.

### D3. Command authority model
- Reasoning should not auto-run for every transcript.
- Introduce explicit command modes (examples):
  - `command_only`
  - `transcribe_only`
  - `translate_live`
  - `reason_on_confirm`
- Continue supporting manual prompt entry while voice lane is active.

## Track E: Multilingual mediation and translation workflows
Goal: two-way real-time translation among users, media streams, and Helix outputs.

### E1. Interpreter pipeline
- Reuse `server/services/helix-ask/interpreter.ts` + multilang utilities.
- Enrich transcribe response metadata with:
  - source language
  - target language
  - speaker mapping
  - translation confidence

### E2. Voice output strategy
- Route translated output through voice profiles with language-aware TTS selection.
- Keep certainty parity with source text.

### E3. Use-case templates
- "Translate this video <url>".
- "Translate user A to user B language".
- "Transcribe all" vs "transcribe commander only".

## Track F: Profiles, context capsules, and persistent chains
Goal: user-centric memory continuity with secure profile boundaries.

### F1. Profile model expansion
- Extend current profile summarizer route set into full profile service:
  - identity + preferences
  - native language(s)
  - voice enrollment metadata
  - credits/rank
- Add secure storage and data-retention policy controls.

### F2. Conversation chain persistence
- Persist context capsules per profile with tenant isolation.
- Attach capsule lineage IDs to Helix Ask sessions and mission events.
- Add profile-visible history surfaces (desktop + mobile).

## Track G: UI convergence (desktop/mobile/panels)
Goal: uniform compact answer UI, profile-first entry, and panel launch unification.

### G1. Start button repurpose + profile-first entry
- Desktop/mobile shell updates:
  - hide legacy start CTA in primary surface
  - surface profile access first
  - move panel launcher to settings/debug or answer-driven links
- Reuse existing panel manifest architecture (`helix-core.panels.ts`).

### G2. Mobile pull-up profile bar
- Implement bottom-sheet profile controls for `/mobile`.
- New-user flow: sign-in overlay (password + OAuth proxy + remember-me).
- Returning-user flow: quick account resume.

### G3. Universal answer-panel embedding
- New panels should open from final-answer links or auto-launch triggers.
- Require panel instances to be movable/closable while anchored to answer context.

### G4. Scroll + compact spacing standardization
- Create one Helix Answer Layout contract for spacing, overflow, and modular sections.
- Apply to both desktop and mobile renderers.

## Track H: Credits, ranks, and operator persona cues
Goal: optional rank system tied to contribution/usage metrics.

### H1. Credit ledger
- Earn credits from useful interactions (bounded and abuse-resistant).
- Track spend/earn events with auditability.

### H2. Rank titles + voice prompts
- Map credit tiers to titles (example: Private, Commander).
- Allow rank-aware acknowledgment phrases in reaction lane.
- Keep this optional and user-configurable.

## Track I: Fresh-data delegated reasoning channels
Goal: keep volatile topic contexts continuously refreshed and ready for reasoning.

### I1. Topic feed workers
- Add source-specific ingestion jobs for fast-changing domains.
- Normalize and store as context capsules per topic.

### I2. Pre-reasoned subject channels
- Maintain dedicated subject chains that regularly reason over refreshed inputs.
- Route user prompts to best-fit channel when intent matches.

### I3. Validity gates
- Mark stale context explicitly and force refresh when thresholds are exceeded.

## Suggested execution order (high confidence)
1. Track A (optimistic language policy, low-risk additive).
2. Track B baseline (auth/key/rate-limit/public docs).
3. Track C and D core (reaction lane + robust speaker/noise handling).
4. Track G UI convergence (profile-first + panel launch model).
5. Track E multilingual mediation.
6. Track F persistence expansion.
7. Track H rank/credits layer.
8. Track I continuous fresh-data channels.

## Definition of done per track
- Contract tests added.
- Readiness loop evidence recorded (contract + variety batteries).
- Casimir verification gate PASS on patch.
- Deterministic fail reasons preserved for replay.
- Rollout flag and rollback path documented.

## Open design decisions to settle before implementation
- Profile identity provider mix and password policy.
- Billing system boundaries (in-house vs provider-managed).
- Voiceprint governance and consent UX depth.
- Translation lane default privacy policy (store vs ephemeral).
- Rank system scope (cosmetic only vs behavior-affecting).

## Minimal first ticket set (when retrieval is stable)
1. Add optimistic-language rewrite policy and tests.
2. Publish Helix Ask API install guide and retrieval check test.
3. Add API key issue/rotate/revoke endpoints with hashed storage.
4. Add reaction-lane micro-utterance prototype behind feature flag.
5. Add mobile profile bottom-sheet skeleton and sign-in overlay shell.
