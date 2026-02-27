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


## Evolution governance flow (additive)

A complementary governance loop now exists for patch lifecycle checks:
1) Ingest patch metadata via `/api/evolution/patches/ingest`.
2) Compute deterministic momentum/checklist artifacts.
3) Run congruence gate under `/api/evolution/gate/run` in report-only mode by default.
4) Persist additive governance records so `/api/agi/training-trace/export` remains replay-safe JSONL.
5) Query rolling trajectory with `/api/evolution/trajectory/:id`.

This loop does not replace Helix Ask answering flow and does not bypass Casimir verification requirements.


## Forward-facing alignment coincidence gate (phase update)
- Helix Ask now computes alignment gate metrics before final synthesis + arbiter finalization:
  `alignment_real`, `alignment_decoy`, `coincidence_margin`, `stability_3_rewrites`,
  `contradiction_rate`, `lower95_p_align`.
- Gate decision is deterministic: `PASS | BORDERLINE | FAIL`.
- `open_world_bypass_mode` policy is explicit:
  - repo-required + alignment FAIL => clarify/fail-closed.
  - open-world-allowed + alignment FAIL => bypass with explicit uncertainty and no fabricated repo citations.
- Output hygiene strips Tree Walk/Execution log/Ask debug variants before final answer text, while preserving valid `Sources:` lines.


## Needle Hull ↔ Natario family relation-proof gate (phase update)
- For prompts asserting family membership (e.g., “Needle Hull is Natario-family/solution”), Helix Ask now requires explicit relation evidence edges, not alias-only concept matches.
- Deterministic edge contract currently requires evidence spanning:
  - `client/src/components/needle-hull-preset.tsx` (`warpFieldType: "natario"`)
  - `docs/needle-hull-mainframe.md` (Needle Hull + Natário geometry linkage)
- If repo evidence is required and edges are missing, Helix Ask clarifies/fails closed with deterministic reason `RELATION_EDGE_MISSING_NEEDLE_HULL_NATARIO_FAMILY`.
- Open-world bypass is only allowed when policy permits non-repo fallback.
