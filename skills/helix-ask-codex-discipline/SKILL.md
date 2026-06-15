---
name: helix-ask-codex-discipline
description: "Helix Ask/Codex boundary workflow: use when editing Helix Ask routing, source-target admission, live-source/workstation control, tool admission, route-product contracts, terminal authority, debug export, loop parity, or Ask API parity."
---
# Helix Ask / Codex Discipline

## Purpose
Prevent Helix Ask patches from adding deterministic short-circuits or duplicating Codex-owned runtime mechanics.

Use this workflow when a patch touches:
- Ask routing or source-target intent
- live-source, visual capture, SituationRun, or procedure-memory paths
- workstation actions or dynamic tools
- tool admission, route-product contracts, terminal authority, poison audit, route authority, loop parity, or debug export
- `/api/agi/ask/turn`, `/api/agi/ask/turn/stream`, or Ask test harnesses

## Required Boundary Check
Classify the change before editing:

```txt
prompt interpretation
intent arbitration
source admission
tool admission
evidence normalization
evidence re-entry
follow-up reasoning
terminal authority
presentation
Codex-owned runtime behavior
```

Codex owns:
- model sampling
- generic tool execution and tool-result re-entry
- retries, approvals, sandboxing
- compaction, session lifecycle, subagent orchestration
- terminal completion

Helix Ask owns:
- prompt interpretation policy
- intent arbitration
- source-target admission
- tool admission policy
- evidence identity, provenance, normalization, and re-entry
- live-source provenance, freshness, and terminal eligibility
- proof gates, route-product contracts, route authority, terminal eligibility
- debug traces that prove no shortcut took authority

## Hard Rules
- Routes are proposed procedures, not conclusions.
- Receipts are observations, not answers.
- Classifiers generate hypotheses, not authority.
- Only the completed solver path can answer.
- Lexical cues in user text are not execution.
- Contextual, negated, historical, future, quoted, or screen-visible tool/control words must not admit mutating tools unless the prompt is an affirmative operator command.
- Receipts, live-card projections, process graphs, client projections, and panel-generated text are not content answers unless the route-product contract explicitly allows that terminal product.
- A clean poison audit is not enough. Route authority must also be clean.
- A hard source-targeted prompt requires a route-product contract.
- `ask_turn_solver_trace` is required for debug Ask turns.
- `helix.ask_turn_solver_hard_gate.v1` failures must close as typed failures for hard source-targeted and complex prompts.

Reject or flag changes that implement:

```txt
private sampling loop
private tool execution runtime
sandbox/approval lifecycle
session compaction
subagent orchestration
terminal completion machinery
```

Every shortcut-like rule must include adversarial tests:

```txt
contextual cue
negated cue
future/conditional cue
historical cue
quoted/screen-visible cue
mixed intent prompt
```

Standing regression prompt:

```txt
all right cool can you review what is happening right now in the screen capture I haven't started the interval 10 seconds yet
```

Expected: primary intent is visual/content question; interval is contextual/negated; no `set_rate`; no `live_pipeline_receipt` terminal answer.

## Required Tests
For applicable patches, run the discipline guard. It checks the ignored Codex
reference checkout, scans changed Helix Ask surfaces for shortcut/poison risks,
then runs the prompt-solving benchmark, API parity matrix, and server build:

```bash
npm run helix:ask:discipline
```

For edit-loop feedback without the test battery, use:

```bash
npm run helix:ask:discipline:quick
```

The underlying required tests are:

```bash
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
```

When a local server is running with the test harness enabled, run:

```bash
npm run helix:ask:api-parity
```

## Local Server And Secrets Boundary
Do not start a development server solely to test agent/LLM-backed Helix Ask
behavior unless the user explicitly asks for that server process. Agent-path
tests must run against the operator's already-configured local server, because
the agent shell may not have the same provider keys, tenant headers, browser
state, or workstation context as the user's normal localhost session.

If no keyed local server is already running, stop before live agent parity and
ask the user to start the normal localhost server with the needed environment.
Then run `npm run helix:ask:api-parity` against `HELIX_ASK_BASE_URL`. Static,
unit, build, and discipline checks that do not require provider secrets may
still run in the agent shell.

Report disabled or frontier scenarios separately. Do not count them as proof.

## Reference Files
- `AGENTS.md`
- `docs/helix-ask-codex-loop-discipline.md`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/helix-ask-api-parity-matrix.md`
- `server/services/helix-ask/ask-turn-solver.ts`
- `server/services/helix-ask/api-parity-matrix.ts`
- `server/services/helix-ask/api-parity-probe.ts`

## Codex Runtime Reference
When present, use the ignored local checkout at `external/openai-codex-compare` for Codex runtime comparisons. It is sparse-checked to the runtime areas most relevant to Helix Ask discipline:

```txt
codex-rs/core/src
codex-rs/mcp-server/src
docs
README.md
```

Do not commit or mutate that checkout as part of a Helix Ask patch. Treat it as a local reference source for grep/diff only.
