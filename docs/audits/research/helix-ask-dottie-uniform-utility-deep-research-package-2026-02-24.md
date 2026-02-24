# Helix Ask x Dottie Uniform Utility Deep Research Package

## Executive decision summary

This research pass audited the mandatory corpus plus the currently visible mission-overwatch/voice/board implementations, with a focus on aligning Helix Ask prompt styles to an Auntie-Dot-style situational-awareness model without breaking the repo's evidence posture, deterministic failure reasons, or voice/text certainty parity requirements. The repo already encodes these constraints as agent-facing policy, including the explicit requirement that voice certainty never exceed text certainty and that voice defaults to low-noise, event-driven callouts rather than narration. Repo anchor: `AGENTS.md:L24-L33`.

### GO/NO-GO by capability area

**Overwatch sensing -- GO (Tier 0/Tier 1 "Dot reality now"), NO-GO (full sensor fusion)**
The repo already supports a Tier 0/Tier 1 "context session" posture and event ingestion surfaces (client context controls + server mission-board context-events), which matches the no covert monitoring constraint and explicit user action requirement described in the Wave-3A prompt pack. Repo anchor: `docs/audits/research/helix-ask-mission-overwatch-v1-wave3a-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md:L17-L41`.
However, end-to-end overwatch sensing as a unified pipeline (Helix Ask tool logs -> normalized mission events -> board state -> callout synthesis) is present as parts, not as a single contract-verified pipeline. The repo contains an event normalizer that deterministically hashes event IDs and a salience policy, but the integration wiring from Helix Ask internal gate outputs into Dottie's mission event stream is not evidenced as complete in the audited minimum route files. Repo anchors: `server/services/mission-overwatch/event-normalizer.ts:L1-L93`, `server/services/mission-overwatch/salience.ts:L1-L112`.

**Command liaison -- GO (basic), NO-GO (uniform action semantics across surfaces)**
The system already has:
- A mission-board action endpoint shape that creates an `action_required` event (server-side). Repo anchor: `server/routes/mission-board.ts:L87-L218`.
- A voice endpoint that supports deterministic suppression, rate limiting, provider governance (local-first), budget enforcement, and circuit breaker behavior. Repo anchor: `server/routes/voice.ts:L1-L310`.
This is enough to ship basic command liaison (receive, decide speak/no-speak, post action cues). But a unified, machine-checkable contract that guarantees the same action recommendation appears consistently in (a) Helix Ask text, (b) voice callout, and (c) Go Board action objects is not yet demonstrated as a single spec + parity test suite.

**Tactical synthesis -- NO-GO (missing deterministic templates contract + tests)**
The system has a micro-debrief builder and a Dottie orchestrator that can generate a debrief artifact, but it currently emits a very thin advice string (insufficient for production tactical synthesis). Repo anchors: `server/services/mission-overwatch/dottie-orchestrator.ts:L1-L36`, `server/services/mission-overwatch/micro-debrief.ts:L14-L55`.
There is no repo-evidenced deterministic "what changed / why it matters / next action / evidence anchor" template contract applied uniformly to text + voice + board.

**Threat interpretation -- NO-GO (only heuristic keyword classification is implemented)**
Threat interpretation exists as a simple classification inference based on regex keyword matches in the event text. Repo anchor: `server/services/mission-overwatch/event-normalizer.ts:L29-L41`.
This is acceptable as a stopgap but not sufficient for a production threat interpretation capability (no explicit threat objects, no confidence model, no contradiction handling, no time-to-event reasoning).

**Time-to-event / cadence -- GO (cadence), NO-GO (time-to-event as first-class)**
Cadence exists: salience defines cooldowns by priority and a mission-level rate limit window, and voice adds deterministic budget enforcement and dedupe. Repo anchors: `server/services/mission-overwatch/salience.ts:L23-L111`, `server/routes/voice.ts:L61-L216`.
But time-to-event (timers with explicit deadlines, computed time remaining, escalation policies) is not implemented as a first-class mission model in the audited surfaces, though the mission board spec and Wave-3A scope explicitly name timer updates. Repo anchors: `client/src/lib/mission-overwatch/index.ts:L8-L22`, `server/routes/mission-board.ts:L25-L46`, `docs/audits/research/helix-ask-mission-overwatch-v1-wave3a-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md:L210-L254`.

**Micro-debrief loops -- NO-GO (not yet integrated as an operating loop)**
Micro-debrief objects can be generated, but the code path evidenced here does not show a persisted loop that links trigger event -> operator acknowledgement/action -> outcome logging -> debrief closure on the board. Current debrief text defaults to placeholder statuses, which signals scaffold-only maturity. Repo anchor: `server/services/mission-overwatch/micro-debrief.ts:L27-L55`.

### Helix Ask reasoning pipeline bottleneck headline

The dominant, repo-documented bottleneck today is not RPM, it is CPU-only generation throughput with serialized inference (concurrency=1), causing long-tail latencies and queue buildup when outputs are large. Repo anchor: `docs/helix-ask-runtime-limitations.md:L31-L74`.
This bottleneck interacts directly with situational-awareness goals: slow synthesis undermines time-to-event messaging unless the system can degrade deterministically into smaller formats and/or short callouts while a long answer is still running.

## Alignment matrix and top gaps

### Alignment matrix (top ten gaps)

| Auntie utility function | Current repo component | Maturity (0-3) | Gap | Proposed contract | Proposed test |
|---|---|---:|---|---|---|
| Overwatch sensing | Mission context events + deterministic event ID normalization (`server/routes/mission-board.ts`, `server/services/mission-overwatch/event-normalizer.ts`) | 2 | Missing single end-to-end ingestion contract bridging Helix Ask signals -> board events -> voice callouts | `dottie.mission_event_envelope.v1` | Golden replay test: same input events -> identical board snapshot + same speak/no-speak outcomes |
| Command liaison | Mission-board `actions` endpoint + voice `/speak` governance/budget (`server/routes/mission-board.ts`, `server/routes/voice.ts`) | 2 | Actions are not yet uniformly typed across text/voice/board | `dottie.action_receipt.v1` | Contract test: `action_required` events map to allowed action enums + deterministic IDs |
| Tactical synthesis | DottieOrchestrator + MicroDebrief builder | 1 | Missing deterministic templates for what changed / why it matters / next action / evidence anchor | `dottie.callout_template.v1` | Snapshot tests for templates; property test: no template emits stronger certainty than input certainty |
| Threat interpretation | Keyword-based classification inference | 1 | No explicit threat model; no contradiction/corroboration handling | `dottie.threat_update.v1` | Unit tests for classification + contradiction detection with deterministic fail reasons |
| Time-to-event | Salience cooldown + rate windows | 2 | No timer entity contract (deadline, T-minus, escalation runbook link) | `dottie.timer_update.v1` | Timer tests: insert timer -> emit timer_update -> verify computed time remaining formatting |
| Micro-debrief loop | MicroDebrief artifact type | 1 | Not wired into board + lacks closure loop semantics | `dottie.micro_debrief.v1` | E2E: critical event -> action ack -> debrief with `derivedFrom` + `outcomeStatus` |
| Voice/text certainty parity | Policy exists; voice router gating exists | 2 | No machine-checkable parity enforcement bridging Helix Ask tiers -> voice priority/mode | `dottie.certainty_parity.v1` | Parity test: for each voice line, assert `voice_certainty <= text_certainty` |
| Evidence posture | Helix Ask proof + strict fail reasons; mission events accept evidenceRefs | 2-3 | Voice does not require evidence refs for repo-attributed claims | `dottie.evidence_anchor_rules.v1` | Contract test: repo-attributed callouts require evidenceRefs or suppress |
| Deterministic fail reasons | Voice errors deterministic; salience has reasons; Helix Ask has strict ledgers | 2 | Missing unified reason enum across text/voice/board | `dottie.fail_reason_ledger.v1` | Reason parity test: same failure class -> same reason label across surfaces |
| Low-noise/event-driven behavior | Salience + voice budgets + mission caps | 2 | No spec-level mapping of event class x tier x certainty to speak eligibility | `dottie.prompt_style_contract.v1` | Matrix tests for deterministic behavior and no chatty defaults |

### Required pipeline map

| Stage | Owner files | Inputs -> Outputs | Deterministic contract | Failure modes |
|---|---|---|---|---|
| Request entry + arbiter path | `server/routes.ts` imports `./routes/agi.plan` | Question + session/trace metadata -> Helix Ask response envelope/job | `phase6.ask.v1` envelope asserted in tests | `missing_evidence`: connector could not retrieve `server/routes/agi.plan.ts` in prior audit |
| Retrieval/context assembly | `server/services/helix-ask/*` + client context assembly | Question -> repo context/evidence cards | Must respect context/file caps | Under-load truncation, missing context, overlong prompts |
| Gate stack | Helix Ask gate services + strict ledgers | Candidate answer + evidence -> pass/fail w/ stable reason labels | Deterministic fail reasons expected | Gate drift, nondeterministic retries, missing reason enums |
| Synthesis/formatting | `server/services/helix-ask/format.ts`, `server/services/helix-ask/envelope.ts`, `shared/helix-ask-envelope.ts` | Structured answer -> envelope | Typed envelope + deterministic sections | Missing sections, citation repair drift |
| Mission-overwatch/callout integration | Mission board routes + mission-overwatch services + voice routes | Mission/context events -> board snapshot + optional voice | Deterministic IDs + salience reasons | Context ineligible suppression, dedupe/rate, provider governance blocks |
| Trace/export surfaces | Training trace export endpoint | Runs -> JSONL artifacts | Replay/audit stable + attributable | Missing trace linkage/metadata |

### Current bottleneck register

| bottleneck_id | Symptom | Root cause | Affected features | Severity | Unblock action |
|---|---|---|---|---|---|
| BOT-LLM-001 | Long-tail latency, backlog, operator tempo loss | CPU-only inference ~3-4 tok/s + concurrency=1 | Helix Ask synthesis | Critical | Deterministic degradation modes + queue caps; move inference to dedicated service |
| BOT-QUEUE-002 | Queued requests feel stuck | No hard HTTP-level cap on `/api/agi/*` | Multi-user usage | High | Add queue caps + deterministic 429 envelopes |
| BOT-CONTRACT-003 | Text/voice/board drift risk | No unified prompt-style contract tying certainty+event class to output form | Dottie uniform utility | High | Ship `helix-ask-dottie-prompt-style-contract.v1` + parity tests |
| BOT-INSTR-004 | Cannot prove production safety beyond demos | Missing per-stage instrumentation and gate-fail rollups | SLO gates/audits | High | Emit structured telemetry for latency, gate outcomes, queue pressure, suppression reasons |
| BOT-INTEG-005 | Micro-debrief loop incomplete | Micro-debrief defaults to placeholders; weak persistence linkage | Learning loop + AAR | Medium | Add action->outcome linkage + deterministic debrief append |

## Proposed v1 contract highlights

### Auntie-Dot-style operating model mapping

External lore anchors:
- Auntie Dot provides observation/intelligence via networked sensors and supports directing units during engagements [1].
- She acts as command liaison by framing constraints, receiving coordinates, and issuing directives [2].

This maps cleanly to the repo's Dot reality now Wave-3A scope: Tier 0 (text-only) and Tier 1 (explicit screen session), deterministic low-noise callouts, and preserved certainty parity. Repo anchor: `docs/audits/research/helix-ask-mission-overwatch-v1-wave3a-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md:L17-L41`.

### Unified "uniform utility behavior" contract for text + voice + Go Board

Core rule: A Dottie output is an event-driven utility, not a chat persona. The same normalized event must be representable across all surfaces:
1) Text (Helix Ask output envelope or mission event detail panel)
2) Voice (callout / briefing / debrief)
3) Go Board (mission board event and optionally an action object)

#### Machine-checkable contract fields (v1)

Recommended schema fragments:
- `contract_version`: `dottie.utility.v1`
- `mission_id`: string
- `event_id`: deterministic, stable
- `event_type`: `state_change | threat_update | timer_update | action_required | debrief`
- `classification`: `info | warn | critical | action`
- `certainty_class`: `confirmed | reasoned | hypothesis | unknown`
- `evidence_refs`: string[]
- `text_payload`: `what_changed`, `why_it_matters`, `next_action`, `evidence_anchor`
- `voice_payload` (optional): `mode`, `text`
- `suppression`: `suppressed`, `reason`, `cooldown_ms`

Certainty parity invariant: `voice_payload.certainty_class <= text_payload.certainty_class` by order `confirmed > reasoned > hypothesis > unknown`.

### Prompt-style matrix

| context/tier | event class | certainty class | response format | max length | speak eligibility | suppression rules |
|---|---|---|---|---:|---|---|
| Tier 0 | any | any | Text-only utility block (4 fields) | 900 | Never speak | `context_ineligible` |
| Tier 1, session inactive | any | any | Text-only utility block | 900 | Never speak | `context_ineligible` |
| Tier 1, active, voiceMode=normal | info | confirmed/reasoned | callout | 140 | Only if salience emits | dedupe + mission rate cap + mute-while-typing |
| Tier 1, active, voiceMode=normal | warn | confirmed/reasoned/hypothesis | callout | 160 | Only if salience emits | dedupe + mission rate cap |
| Tier 1, active, voiceMode=critical_only | critical/action | any | callout | 220 | Allowed | dedupe + budget + mission cap bypass |
| Tier 1, active | action_required | confirmed/reasoned | briefing | 420 | Allowed | requires imperative next_action |
| Tier 1, active | debrief | any | debrief | 420 | Optional | suppress if no operator action/outcome |
| Tier 1, active, voiceMode=dnd/off | any | any | Text-only utility block | 900 | Never speak | `context_ineligible` |

### Deterministic communication templates

Text template:
- CHANGE: `<event_type>/<classification> -- <one-sentence delta>`
- IMPACT: `<mission impact>, <risk/constraint>, <time sensitivity if known>`
- NEXT: `<imperative action>`
- EVIDENCE: `<evidence refs>`

Voice template (derived, never stronger certainty):
- `<priority> -- <what changed>. <next action>.` (optional suffix: `Evidence logged.`)

### Failure taxonomy + stable reason labels

Required shared reasons:
- `context_ineligible`
- `dedupe_cooldown`
- `mission_rate_limited`
- `voice_budget_exceeded`
- `voice_backend_error`
- `missing_evidence` (new)
- `contract_violation` (new)

## Contradictions and unresolved assumptions

- Wave-3A baseline lock in old prompt packs may not match current main head.
- Full `server/routes/agi.plan.ts` behavior can be partially `missing_evidence` in connector-constrained audits.
- Threat model depth in runtime code remains heuristic; higher-order claims stay hypothesis until tested.

## Kill criteria

Stop deployment if any occur:
- Voice certainty inflation over text certainty.
- Non-deterministic suppression outcomes for identical event replays.
- Repo-attributed callouts emitted without evidence refs (without downgrade/suppress).
- Any covert monitoring regression in Tier 1 session handling.
- Under-load failures return untyped/freeform errors instead of stable reasoned envelopes.

## Priority implementation plan (30/60/90)

### 30 days (P0)
- Publish `helix-ask-dottie-prompt-style-contract.v1` + schema fixtures.
- Add certainty parity tests across text/voice.
- Add suppression reason parity replay tests.
- Add deterministic overload envelopes for `/api/agi/*`.

### 60 days (P1)
- Wire Dottie orchestrator outputs into board append loop + evidence anchors.
- Require evidence refs for repo-attributed voice callouts or suppress with `missing_evidence`.
- Add per-stage instrumentation (latency, gate outcomes, queue pressure, suppression reason counts).

### 90 days (P2)
- Implement first-class timer/time-to-event model with escalation semantics.
- Move heavy inference to dedicated service path for stable SLOs.
- Add mission dashboards for parity violations, suppression trends, and gate histograms.

## Citation index

### Repo anchors
- `AGENTS.md:L24-L33`
- `docs/BUSINESS_MODEL.md:L1-L27`
- `docs/helix-ask-flow.md:L18-L59`
- `docs/helix-ask-agent-policy.md:L45-L75`
- `docs/helix-ask-runtime-limitations.md:L31-L101`
- `server/services/mission-overwatch/event-normalizer.ts:L1-L93`
- `server/services/mission-overwatch/salience.ts:L1-L112`
- `server/routes/voice.ts:L1-L310`
- `server/routes/mission-board.ts:L25-L218`
- `docs/audits/research/helix-ask-mission-overwatch-v1-wave3a-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md:L17-L41`

### External lore anchors
- [1] https://www.halopedia.org/Auntie_Dot
- [2] https://www.halopedia.org/ONI%3A_Sword_Base
- [3] https://www.halopedia.org/Auntie_Dot/Quotes
