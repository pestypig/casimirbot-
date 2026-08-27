Program gate: G0 — Authority inventory and trapdoor disposition
Workstream: Helix Ask / Codex parity and legacy detachment
Capability or component: Ask execution, transport, fallback, terminal, and presentation authority inventory
Change classification: Codex-owned runtime behavior
Runtime owner: Runtime Codex for model turns; Helix for policy, evidence, and terminal eligibility; client presentation for UI-only projections
Current closure state: inventoried
Target closure state: inventoried
Required frozen inputs: `docs/helix-ask-codex-parity-work-program-v1.md`; canonical turn lifecycle; current repository symbols; existing ReCrown inventory
Required evidence: typed inventory; stable-symbol drift test; zero unknown trapdoor slices; deterministic discipline checks
Stop/fail criteria: any executable path lacks an activation predicate, owner, runtime class, limits, terminal writer/disposition, or stable source anchor
Explicit non-goals: runtime refactor; limit changes; legacy deletion; hidden reasoning export; keyed acceptance; environment maturity promotion
Downstream gate unlocked: G1 — Truthful runtime identity and complete public trace

# G0 Authority Inventory

Status: deterministic closure packet.

The machine-readable inventory is
`server/services/helix-ask/runtime/codex-parity-g0-authority-inventory.ts`.
This packet explains the conclusions that determine the next gate.

## Result

The Ask system is not fully detached from either legacy monolith:

- `server/routes/agi.plan.ts` remains the mounted owner of `/ask`, `/ask/turn`,
  `/ask/turn/stream`, conversation preflight, jobs, the native-Helix loop, and
  several terminal materialization call sites.
- `HelixAskConsoleRuntimeShell` still defaults to `legacy_bridge`, which lazily
  mounts `HelixAskPill`. The minimal runtime shell is opt-in.
- Codex is the default selected provider, but its provider has two materially
  different transports: native app-server and isolated compatibility
  `codex exec`.
- The client still contains known non-solver shortcuts for workstation command
  execution, process-graph answer projection, and conversation clarification.
  They are feature-predicate constrained, but they are executable code and
  therefore cannot be treated as dead.

No code was deleted in G0. Each path now has a downstream disposition.

## Runtime and transport authority

| Path | Activation | Actual owner | Terminal path | Disposition |
| --- | --- | --- | --- | --- |
| Authenticated Codex through `/mcp` | External client authorization and admitted scopes | External Codex owns its turn; Helix owns capability admission and receipts | External Codex task | Retain for G2 differential baseline |
| Client SSE `/ask/turn/stream` | Default manual canary or hard backend-entrypoint prompt | Helix route selects provider; selected runtime owns model turn | Helix terminal single writer, then `turn_final` | Retain; expose complete identity in G1 |
| Client JSON `/ask/turn` retry | SSE throws or yields a retryable model-only terminal failure | Same backend route without SSE | Helix terminal single writer | Quarantine until G1 proves idempotent continuity |
| Client `askLocal` | Non-canary or direct legacy caller | Client chooses `/ask/turn`, jobs, or `/ask` | Chosen backend path | Replace in G6 |
| Server legacy `/ask` | Legacy route selected | `agi.plan.ts` legacy runtime and special terminal builders | Legacy materialization reconciled into response | Retire through G5 |
| Server jobs | Lane-parity flag disabled or direct job caller | `runHelixAskJob` in `agi.plan.ts` | Stored result polled by client | Retire through G5 |
| Native Codex app-server | Codex selected; non-model-only; enabled; keyed; no cooldown | Runtime Codex with dynamic Helix tools | Helix provider projection and terminal single writer | Retain as parity-bearing target in G4 |
| Compatibility `codex exec` | Native unavailable/ineligible/failed or compatibility recovery required | Codex model process plus Helix bounded continuation admission | Helix provider projection and terminal single writer | Quarantine as degraded compatibility in G4 |
| Native Helix monolith | `agent_runtime=helix` from body/header/environment | `agi.plan.ts` owns sampling, loop, tools, and re-entry | Helix terminal single writer | Retire Codex-duplicating authority in G5 |
| Future provider stub | Enabled and selected explicitly | Read-only adapter stub | Typed failure or observation projection | Quarantine in G4 |

## Known client trapdoors and dispositions

The former single `legacy_fallbacks_and_dev_branches` unknown classification is
replaced with concrete entries:

| Trapdoor | Activation predicate | Why it matters | Disposition |
| --- | --- | --- | --- |
| Transport selection and legacy `askLocal` | Stream error, disabled manual canary, disabled lane-parity flag, or another direct caller | Can move a turn among SSE, JSON, jobs, and `/ask` | Preserve identity in G1; replace in G6 |
| Multilang and preflight-scope retry | Confidence gate or preflight scope error | Can retry after adding confirmation or removing requested scope fields | Emit explicit downgrade identity in G1 |
| Client workstation execution/answer fast path | Manual canary disabled and client classifier/parser selects an action | Executes and may answer without completed backend solver authority | Remove after governed parity in G6 |
| Process-graph overview shortcut | Client prompt policy selects local overview and backend is not forced | Projects local store text as the answer | Remove after governed parity in G6 |
| Conversation preflight classifier | Manual canary disabled and workstation intent is ambiguous | May clarify before Ask; failures silently fall through | Remove after backend intent parity in G6 |

The ReCrown inventory now reports zero `unknown_trap_door_quarantined` slices.
This does not mean the bridge is replacement-ready: the identified branches
remain behavior-sensitive quarantines.

## Limit separation

The apparent “15-step cap” is not one limit:

| Surface | Actual limit |
| --- | --- |
| Native Codex app-server | 120-second turn timeout; 45-second bootstrap timeout; 2 MB protocol output; 64k-character tool-result projection; no Helix continuation-step wrapper around a successful native cycle |
| Compatibility `codex exec` | 120 seconds per model step; 256 KB collected process output; 12 continuation steps by default and never more than 32 |
| Legacy native-Helix loop | Default 5 iterations; large-mixed starts at 12; progress-based extensions; large-mixed hard default 28; absolute configured caps 40 iterations, 20 tools, 40 model decisions |
| Procedural timeline presentation | Reads only the first 12 runtime iterations and renders only the first 18 assembled rows |
| Client live event presentation | Keeps 28 live events; each defaults to 560 characters, configurable from 160 to 2400 |
| Client requested answer tokens | Defaults to 1024 from a 2048-token context/output configuration and is capped at 8192 |

Therefore, increasing a UI row limit would not increase runtime capability, and
increasing the compatibility continuation cap would not make that path native
Codex parity.

## Public reasoning transparency boundary

Reasoning Theater and the procedural timeline are categorized presentations.
They can truthfully show public lifecycle facts—requested/admitted/executed
capabilities, observations, re-entry references, retries, budgets, candidate
support, terminal selection, and visible hashes. They cannot truthfully claim
to show private chain of thought.

G1 must make the public trace complete and pageable and must label the actual
runtime transport. Presentation truncation must be explicit rather than looking
like turn completion.

## G0 closure evidence

- Typed inventory:
  `server/services/helix-ask/runtime/codex-parity-g0-authority-inventory.ts`
- Drift guard:
  `server/__tests__/helix.ask.codex-parity-g0-authority-inventory.test.ts`
- Frontend trapdoor classification:
  `client/src/components/helix/ask-console/HelixAskLegacyConsoleInventory.ts`
- Required deterministic commands:

```text
npx vitest run server/__tests__/helix.ask.codex-parity-g0-authority-inventory.test.ts --pool=forks
npm run helix:ask:discipline:quick
```

No keyed run is required to close an inventory-only gate. Keyed same-state A/B
evidence begins after G1 makes runtime identity and the complete public trace
observable.

