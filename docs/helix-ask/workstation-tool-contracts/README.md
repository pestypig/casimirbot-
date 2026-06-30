# Helix Ask Workstation Tool Contracts

Status: working-draft contract index.

These contracts describe the shared workstation gateway lifecycle that both
Helix Native and Codex Workstation Mode must preserve when a tool or panel
capability participates in an Ask turn.

They are intentionally not runtime prompts. They are development contracts for
future tool, reflection, and panel patches.

## Maturity Labels

| Label | Meaning |
| --- | --- |
| `draft` | Matches the current intended gateway lifecycle, but still needs broader UI/API validation. |
| `candidate` | Covered by deterministic API tests and at least one live UI smoke for the named capability. |
| `stable` | Covered by API matrix, UI projection validation, negative admission tests, debug export parity, and panel projection tests where applicable. |

Do not promote a contract because the final prose looked good. Promotion
requires structured evidence: request, admission, execution, observation packet,
model re-entry, terminal authority, and visible/debug projection for the same
turn id.

## Shared Lifecycle

Every workstation tool contract follows this loop:

```txt
prompt + workstation context
-> requested capability intent
-> Helix admission or block
-> gateway capability execution
-> observation packet or action receipt
-> evidence re-entry
-> runtime/provider final candidate
-> Helix terminal authority
-> visible trace and debug export projection
```

The gateway output is never answer authority by itself. Receipts and
observations must carry:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Authority Rules

- Tool names in prompt text are constraints or requests, not execution.
- Contextual, negated, historical, future, quoted, and screen-visible tool names
  must not execute the capability unless the prompt is an affirmative operator
  request admitted by Helix.
- A provider may mention that a tool ran only when a matching observation packet
  exists for the same turn.
- UI projection metadata must come from structured tool outputs, not final prose
  scraping.
- Panel actions are host affordances beside the answer. They do not shape the
  provider's final prose and do not become answer authority.
- Missing providers, missing args, blocked queries, and empty results are
  observations or typed failures, not proof.

## Contract Template

Each capability contract should define:

- capability id
- maturity
- owner surface or panel
- permission profile
- admitted inputs
- blocked inputs
- observation schema and required fields
- host projection metadata, if any
- expected visible trace rows
- debug export fields
- negative admission cases
- tests required for `candidate` and `stable`
- implementation anchors

## Current Draft Contracts

| Capability | Contract | Maturity |
| --- | --- | --- |
| `workspace_os.status` | [workspace_os.status.md](workspace_os.status.md) | `draft` |
| `scientific-calculator.solve_expression` | [scientific-calculator.solve_expression.md](scientific-calculator.solve_expression.md) | `candidate` |
| `docs.search` | [docs.search.md](docs.search.md) | `draft` |
| `repo.search` | [repo.search.md](repo.search.md) | `draft` |
| `theory-badge-graph.reflect_discussion_context` | [theory-badge-graph.reflect_discussion_context.md](theory-badge-graph.reflect_discussion_context.md) | `candidate` |
| `civilization-bounds.reflect_system_bounds` | [civilization-bounds.reflect_system_bounds.md](civilization-bounds.reflect_system_bounds.md) | `candidate` |
| `scholarly-research.lookup_papers` | [scholarly-research.lookup_papers.md](scholarly-research.lookup_papers.md) | `draft` |
| `internet-search.search_web` | [internet-search.search_web.md](internet-search.search_web.md) | `draft` |

## Implementation Anchors

- Gateway registry:
  `server/services/helix-ask/workstation-tool-gateway/registry.ts`
- Explicit capability contracts:
  `server/services/helix-ask/explicit-capability-contract.ts`
- Codex adapter gateway path:
  `server/services/helix-ask/agent-providers/explicit-workstation-gateway.ts`
- Gateway tests:
  `server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts`
- Provider selection tests:
  `server/services/helix-ask/__tests__/agent-provider-selection.test.ts`
- API parity matrix:
  `server/__tests__/helix.ask.api-parity-matrix.test.ts`
- UI trace/projection surfaces:
  `client/src/components/helix/HelixAskPill.tsx`
  `client/src/lib/helix/ask-terminal-projection.ts`
  `client/src/lib/helix/ask-debug-event-display.ts`

## Required Validation Families

Use the narrowest meaningful tests for a patch, but contract promotion should
eventually include:

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/__tests__/agent-provider-selection.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```

Live UI/API validation must use the user-started keyed server. Do not start or
restart that server from an agent shell.
