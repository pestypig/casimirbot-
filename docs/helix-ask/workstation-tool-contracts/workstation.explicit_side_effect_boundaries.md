# Explicit Workstation Side-Effect Boundaries

Maturity: `draft`

Owner surface: Helix Ask explicit route contracts and workstation panels

Provider status: blocked from Codex/provider gateway

## Purpose

Define the provider-agent boundary for explicit workstation route contracts that
create, open, append, or start panel/live-source state. These are not shared
gateway tools until each side effect has a permission, receipt, re-entry, and
host-projection contract.

## Owner

Helix Ask owns route admission and panel dispatch for these explicit route
contracts. Codex Workstation Mode and future provider runtimes must not execute
these capability ids directly through the shared provider gateway.

## Capability IDs

```txt
scientific-calculator.open
scientific-calculator.start_equation_live_source
workstation-notes.append_to_note
workstation-notes.create_note
workstation-notes.create
workstation-notes.open
```

## Inputs

Provider-mode input must fail closed for these capabilities until a
capability-specific side-effect contract exists. A valid future contract must
require:

- explicit affirmative operator command admission
- bounded capability-owned arguments
- confirmation or permission policy where a panel/live-source/note side effect
  is user-visible or persistent
- no execution for quoted, negated, historical, future/conditional, or
  screen-visible mentions

## Observation

If graduated later, each execution must produce a structured receipt or
observation packet with:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

The receipt must identify the requested capability, resolved args, permission
decision, side-effect target, blocked/no-op reason when blocked, and safe
projection refs.

## Host Projection

Panel opening, note creation, note append, and equation live-source startup are
host-side effects. They must come from structured receipts or route products,
not provider final prose. Provider text must remain readable if the host ignores
projection metadata.

## Visible Trace

If graduated later, the latest-turn stream must show:

```txt
runtime selected
tool/action request
permission or confirmation decision
receipt or blocked/no-op receipt
model re-entry
final answer
```

Debug export and visible UI rows must agree for the same turn id.

## Tests

Current held-back behavior:

```txt
availability=blocked_pending_contract
permission_class=user_confirmed_side_effect
codex_workstation=false
future_provider=false
gateway_manifest=absent
```

Required before provider graduation:

- affirmative command admission for the exact capability
- negative quoted/negated/historical/future/screen-visible prompt coverage
- structured receipt/observation test
- blocked/no-op receipt test for missing permission or missing target state
- terminal authority test proving the receipt is not the final answer
- UI latest-turn/debug export trace parity
- no final-prose scraping for panel or note projection

Implementation anchors:

- Classification:
  `server/services/helix-ask/provider-agent-capability-contract.ts`
- Explicit contracts:
  `server/services/helix-ask/explicit-capability-contract.ts`
- Gateway registry:
  `server/services/helix-ask/workstation-tool-gateway/registry.ts`
- Provider capability tests:
  `server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts`

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/agent-providers/__tests__/explicit-workstation-gateway.test.ts --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```
