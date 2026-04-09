# Helix Ask Route Extraction Ledger

## Purpose
This ledger is the source of truth for decomposing [server/routes/agi.plan.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/routes/agi.plan.ts) into stable service boundaries without relying on recollection or drifting line references.

The route file is too large to manage safely by memory alone. Every future extraction slice must leave behind:
- a git-visible diff
- a ledger row update
- a local gate result
- a checkpoint commit on a feature branch

## Safety Model
This extraction effort uses three rules:

1. Wrapper first, logic second.
Move route shells into handler modules before moving deeper engine logic.

2. One seam per slice.
A slice may move one helper cluster or one wrapper boundary only. Do not combine `/ask` preflight, `/ask` lifecycle, retrieval, and surface logic in one patch.

3. Roll back red slices immediately.
If a slice fails its local gate, remove that wiring before starting the next slice. Do not leave half-delegated route code in place just because the file still compiles.

## Current Stable Slices
- `S1 request-context` is stable in [server/services/helix-ask/runtime/request-context.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/services/helix-ask/runtime/request-context.ts).
- `S2 conversation-turn-handler` is stable in [server/services/helix-ask/runtime/conversation-turn-handler.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/services/helix-ask/runtime/conversation-turn-handler.ts) and currently wired in the route.
- `S3 ask-entry-preflight` is now stable in [server/services/helix-ask/runtime/ask-handler.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/services/helix-ask/runtime/ask-handler.ts) for request preparation and route-context resolution.
- `S4 ask-lifecycle-wrapper` is now stable in [server/services/helix-ask/runtime/ask-handler.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/services/helix-ask/runtime/ask-handler.ts) for begin/finalize flow, safe-send normalization, and thread-history finalization.
- `S5 answer-surface` is now stable in [server/services/helix-ask/surface/ask-answer-surface.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/services/helix-ask/surface/ask-answer-surface.ts) for successful payload enrichment, citation injection, and multilang/debug surface shaping.
- `S6 objectives` is now stable in [server/services/helix-ask/objectives/objective-assembly.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/services/helix-ask/objectives/objective-assembly.ts) for deterministic objective assembly, UNKNOWN-block sanitization, and generic scaffold stripping.
- `S7 retrieval` is now stable in [server/services/helix-ask/retrieval/objective-scoped-recovery.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/services/helix-ask/retrieval/objective-scoped-recovery.ts) for objective-scoped retrieval recovery targeting, query diversification, escalation hints, and missing-retrieval enforcement.
- `S8 policy` is now stable in [server/services/helix-ask/policy/pre-intent-clarify.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/services/helix-ask/policy/pre-intent-clarify.ts) for pre-intent clarify bypass rules, repo-technical cue detection, concrete definition targeting, and the general ambiguity answer floor.

## Pending Slices
- No additional Phase 1.7 route-boundary slices are pending. Remaining work should be treated as follow-on engine cleanup or behavior patches rather than transport-boundary extraction.

## Follow-on Cleanup Slices
- `S9 execution-policy` is now stable in [server/services/helix-ask/policy/execution-policy.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/services/helix-ask/policy/execution-policy.ts) for fast-mode planner preference, two-pass triggers, and retrieval-retry override policy.
- `S10 forced-answer-policy` is now stable in [server/services/helix-ask/policy/forced-answer.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/services/helix-ask/policy/forced-answer.ts) for simple composition rendering and forced-answer preservation/finalization rules.
- `S11 repo-runtime-fallback-policy` is now stable in [server/services/helix-ask/policy/repo-runtime-fallback.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/services/helix-ask/policy/repo-runtime-fallback.ts) for deterministic repo-runtime fallback candidate selection, direct-use gating, and fallback-shape acceptance checks.

## Validation Tiers
### Micro-slice
Use this for one helper cluster or one wrapper move.

Required:
- focused non-LLM tests only
- no live smoke
- no readiness loop
- commit on green

Example current stable gate:
```bash
npx vitest run tests/helix-thread-ledger.spec.ts tests/helix-thread-item-protocol.spec.ts tests/helix-thread-request-input.spec.ts tests/helix-thread-forking.spec.ts tests/helix-conversation-turn.routes.spec.ts
```

### Macro-slice
Use this only after a meaningful route boundary is extracted.

Required after the user restarts `5050`:
- one `/api/agi/ask/conversation-turn` smoke
- one `/api/agi/ask` smoke
- Casimir verify

### Behavior-slice
Use this when a patch changes answer shaping, routing policy, fallback behavior, or visible output.

Required:
- macro gate
- readiness loop if the behavior surface changed rather than just structure

## Checkpoint Policy
- Work on a feature branch only.
- Commit every stable micro-slice.
- Do not push partial route decomposition directly to `main`.
- Recommended commit naming:
  - `helix-route-slice-01-request-context`
  - `helix-route-slice-02-conversation-turn-handler`
  - `helix-route-slice-03-ask-entry-preflight`
  - `helix-route-slice-04-ask-lifecycle-wrapper`

Current recommendation:
- commit the current stable checkpoint before retrying `S3`
- use git commits as the slice ledger, not line-number notes

## Done Criteria
This extraction phase is done when [server/routes/agi.plan.ts](/c:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/routes/agi.plan.ts) is primarily:
- request schema parsing
- auth and tenant checks
- feature checks
- handler dispatch
- HTTP response wiring

This phase is not done while the route still primarily owns:
- `/ask` entry preflight and interpreter gate
- `/ask` lifecycle begin/finalize shell
- answer surface completion/finalization
- objective finalize/gate logic
- retrieval orchestration
- policy routing

## Slice Table
| Slice ID | Boundary | Target Module | Status | Local Gate | Macro Gate | Last Commit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | request-context | `server/services/helix-ask/runtime/request-context.ts` | stable | `helix-thread-ledger`, `helix-thread-item-protocol`, `helix-thread-request-input`, `helix-thread-forking` | restart `5050` + smoke + Casimir | working-tree checkpoint | extracted helpers for thread context, dual history, item lifecycle, and request state |
| S2 | conversation-turn-handler | `server/services/helix-ask/runtime/conversation-turn-handler.ts` | stable | `S1` gate + `helix-conversation-turn.routes` | restart `5050` + smoke + Casimir | working-tree checkpoint | route currently delegates `/ask/conversation-turn` here |
| S3 | ask-entry-preflight | `server/services/helix-ask/runtime/ask-handler.ts` | stable | `helix-ask-runtime-ask-handler` + `helix-ask-interpreter-gate.routes` | restart `5050` + smoke + Casimir | working-tree checkpoint | route now delegates request preparation and route-context resolution here; lifecycle wrapper remains inline |
| S4 | ask-lifecycle-wrapper | `server/services/helix-ask/runtime/ask-handler.ts` | stable | `helix-ask-runtime-ask-handler` + `helix-ask-interpreter-gate.routes` + stable thread gate | restart `5050` + smoke + Casimir | working-tree checkpoint | route now delegates begin/finalize wrapper and safe-send normalization here; deep engine still enters via `executeHelixAsk` callback |
| S5 | answer-surface | `server/services/helix-ask/surface/*` | stable | `helix-ask-answer-surface` + `helix-ask-runtime-ask-handler` + stable thread gate | restart `5050` + smoke + Casimir + readiness spot-check | working-tree checkpoint | successful payload enrichment now lives in `surface/ask-answer-surface.ts`; strict-ledger/error normalization remains in the runtime wrapper |
| S6 | objectives | `server/services/helix-ask/objectives/*` | stable | `helix-ask-objective-assembly` + `helix-ask-runtime-errors` targeted objective assembly assertions + stable thread gate | restart `5050` + smoke + Casimir | working-tree checkpoint | deterministic objective assembly and UNKNOWN-block sanitation now live in `objectives/objective-assembly.ts`; deeper objective loop state/gating still remains inline |
| S7 | retrieval | `server/services/helix-ask/retrieval/*` | stable | `helix-ask-objective-retrieval` + `helix-ask-runtime-errors` targeted recovery assertions + stable thread gate | restart `5050` + smoke + Casimir | working-tree checkpoint | objective-scoped retrieval recovery and missing-retrieval enforcement now live in `retrieval/objective-scoped-recovery.ts`; broader repo-runtime/stage orchestration still remains inline |
| S8 | policy | `server/services/helix-ask/policy/*` | stable | `helix-ask-pre-intent-policy` + `helix-ask-runtime-errors` targeted policy assertions + stable thread gate | restart `5050` + smoke + Casimir | working-tree checkpoint | pre-intent clarify bypass rules and general ambiguity answer floor now live in `policy/pre-intent-clarify.ts`; deeper intent routing and open-world execution policy still remain inline |
| S9 | execution-policy | `server/services/helix-ask/policy/execution-policy.ts` | stable | `helix-ask-execution-policy` + `helix-ask-runtime-errors` targeted fast-mode policy assertions + stable thread gate | restart `5050` + smoke + Casimir | working-tree checkpoint | fast-mode planner preference, risk-triggered two-pass, and retrieval-retry override logic are now off the route; broader execution heuristics still remain inline |
| S10 | forced-answer-policy | `server/services/helix-ask/policy/forced-answer.ts` | stable | `helix-ask-forced-answer-policy` + `helix-ask-runtime-errors` targeted forced-answer assertions + stable thread gate | restart `5050` + smoke + Casimir | working-tree checkpoint | simple composition rendering plus forced-answer short-circuit, preservation, and fast-path finalization rules are now off the route |
| S11 | repo-runtime-fallback-policy | `server/services/helix-ask/policy/repo-runtime-fallback.ts` | stable | `helix-ask-runtime-errors` deterministic fallback assertions (`deterministic repo runtime fallback`) + `helix-conversation-turn.routes`; full stable thread gate currently blocked by baseline red in `helix-thread-ledger` parity replay spec | restart `5050` + smoke + Casimir | working-tree checkpoint | deterministic repo-runtime fallback candidate selection, direct-use gating, and accepted fallback-shape checks are now imported from a dedicated policy module |

## Operating Commands
Generate a fresh route inventory:
```bash
npx tsx scripts/helix-ask-route-inventory.ts
```

Generate and write the inventory artifact:
```bash
npx tsx scripts/helix-ask-route-inventory.ts --write
```

Recommended stable micro-gate:
```bash
npx vitest run tests/helix-thread-ledger.spec.ts tests/helix-thread-item-protocol.spec.ts tests/helix-thread-request-input.spec.ts tests/helix-thread-forking.spec.ts tests/helix-conversation-turn.routes.spec.ts
```

## Current Stable Route Extraction Status
- Route file integrity has been recovered after a NUL-byte corruption event.
- The current kept extractions are `/ask/conversation-turn` plus `/ask` request preparation, route-context resolution, and lifecycle wrapper delegation.
- Successful `/ask` payload shaping is now off the runtime wrapper and lives in `surface/ask-answer-surface.ts`.
- Deterministic objective assembly and UNKNOWN-block cleanup are now off the route and live in `objectives/objective-assembly.ts`.
- Objective-scoped retrieval recovery targeting, escalation hints, query diversification, and missing-retrieval enforcement are now off the route and live in `retrieval/objective-scoped-recovery.ts`.
- Pre-intent clarify bypass rules, concrete definition targeting, repo-technical cue detection, and the general ambiguity answer floor are now off the route and live in `policy/pre-intent-clarify.ts`.
- Fast-mode planner preference, risk-triggered two-pass, and retrieval-retry override decisions are now off the route and live in `policy/execution-policy.ts`.
- Simple composition rendering and forced-answer short-circuit / preservation / fast-path finalization rules are now off the route and live in `policy/forced-answer.ts`.
- Deterministic repo-runtime fallback candidate selection, direct-use gating, and accepted fallback-shape checks are now off the route and live in `policy/repo-runtime-fallback.ts`.
- The remaining large `/ask` ownership in the route is the deep engine body entered through `executeHelixAsk`, plus deeper objective/retrieval/policy execution logic outside the transport shell.
- Casimir is still required before final completion claims once the latest bundle is restarted on `5050`.
