# Helix Ask Flow (Grounded)

This note summarizes how Helix Ask answers "how does the system work" questions
using repo-grounded context before the LLM writes.

## Core flow
1) The UI collects the question and opens a Helix Ask session so the exchange
   can be saved to the console. (desktop or HelixAskPill)
2) The client builds a context set:
   - In grounded mode, it requests resonance selections from plan().
   - If search fallback is enabled, it also queries the code lattice.
3) The client builds a grounded prompt that embeds the question and context and
   enforces answer format constraints. (buildGroundedPrompt)
4) The prompt is sent to /api/agi/ask, which invokes the local LLM handler.
5) The response is cleaned (echo removal + formatting) and returned.
6) The UI renders the answer and stores it in the Helix console session.

## Mission overwatch flow (Dot extension)
This extension turns Helix Ask from prompt-response only into a situational
awareness loop.

1) Event ingestion:
   - Consume Helix Ask live events (`askLiveEvents`) and final-answer payloads.
   - Accept external mission signals (timers, risk flags, panel status) when
     present.
2) Salience filter:
   - Classify events into `info|warn|critical|action`.
   - Dedupe repeated states and enforce cooldown windows per stage.
3) Callout generation:
   - Generate terse callouts that focus on mechanism, confidence posture, and
     next action.
   - Keep certainty in voice no stronger than the corresponding text output.
4) Operator acknowledgment:
   - Record optional operator acknowledgments and action selections.
5) Micro-debrief:
   - Persist a structured event trail (timestamp, stage, callout class,
     evidence refs, chosen action) for replay/audit.

## Go Board construction loop
The Mission Go Board is built from event-time updates, not only final answers.

1) Build or update mission entities (objective, threat, route, timer, resource).
2) Update mission phase (`observe|plan|retrieve|gate|synthesize|verify|execute`).
3) Attach confidence and evidence links to each state mutation.
4) Highlight unresolved critical items and aging timers.
5) Emit a board delta artifact for operator and replay surfaces.

## Format routing
Helix Ask routes the answer format based on the question:
- Steps: process/implementation questions get 6-9 numbered steps.
- Compare: comparisons use short paragraphs + a small bullet list.
- Brief: short paragraphs for definition/summary questions.
Stage tags (observe/hypothesis/experiment/analysis/explain) are only included
when the question explicitly mentions method/scientific method.

## Two-pass synthesis (optional)
When HELIX_ASK_TWO_PASS=1, the server can do a two-stage reply:
1) Distill context into evidence bullets or steps (small token budget).
2) Expand the scaffold into the chosen format plus a short "In practice"
   paragraph.


## Scientific-method trace contract
When planner execution runs through Chat B, task traces now include a
`scientific_method` block with hypothesis, anti-hypothesis, counterfactual
result, uncertainty interval, reproducibility metadata, and corrective-action
signals. This is emitted in trace artifacts for downstream eval/replay policy
loops.


## Context session contract (Wave-3A)

Wave-3A context operations are explicitly tiered:
- Tier 0: text-only context
- Tier 1: explicit screen session (user-started only)

Session states are deterministic: `idle -> requesting -> active -> stopping -> idle` with an `error` branch from `requesting` or `active`. Context events use a canonical envelope containing `tier`, `sessionState`, `eventType`, `traceId`, and mission linkage fields for replay safety.

Tier 1 callouts and ingestion are disabled unless the session is `active`.

## Communication discipline
- Event-driven over prompt-driven: callouts occur on meaningful state changes.
- Short, structured, actionable phrasing over narrative reading.
- Low-noise defaults: suppress repetitive and low-information updates.
- Fail loud on critical constraints, circuit-breakers, and missing evidence for
  high-stakes claims.

## Key files
- client/src/pages/desktop.tsx
- client/src/components/helix/HelixAskPill.tsx
- client/src/lib/audio-focus.ts
- client/src/lib/agi/api.ts
- server/routes/agi.plan.ts
- docs/architecture/voice-service-contract.md
- docs/architecture/mission-go-board-spec.md
