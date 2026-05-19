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
runtime-adapter
evidence-lane
retrieval-gate
proof-policy
live-source
presentation
Codex-owned runtime behavior
```

Codex owns:
- model sampling and generic turn loop mechanics
- generic tool execution, tool-result re-entry, retries, approvals, sandboxing
- compaction, session lifecycle, subagent orchestration, terminal completion

Helix Ask owns:
- source-target admission
- equal-identity evidence observations
- live-source provenance and freshness
- proof gates, route-product contracts, route authority, terminal eligibility
- debug traces that prove no shortcut took authority

## Hard Rules
- Lexical cues in user text are not execution.
- Contextual, negated, historical, future, quoted, or screen-visible tool/control words must not admit mutating tools unless the prompt is an affirmative operator command.
- Receipts, live-card projections, process graphs, client projections, and panel-generated text are not content answers unless the route-product contract explicitly allows that terminal product.
- A clean poison audit is not enough. Route authority must also be clean.
- A hard source-targeted prompt requires a route-product contract.

## Required Tests
For applicable patches, run:

```bash
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
```

When a local server is running with the test harness enabled, run:

```bash
npm run helix:ask:api-parity
```

Report disabled or frontier scenarios separately. Do not count them as proof.

## Reference Files
- `AGENTS.md`
- `docs/helix-ask-codex-loop-discipline.md`
- `docs/helix-ask-api-parity-matrix.md`
- `server/services/helix-ask/api-parity-matrix.ts`
- `server/services/helix-ask/api-parity-probe.ts`
