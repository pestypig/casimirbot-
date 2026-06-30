# Workstation Dynamic Panel Action Boundaries

Maturity: `draft`

Owner surface: workstation dynamic panel catalog

Provider status: panel-owned, not shared provider gateway

## Purpose

Define how dynamic panel actions relate to provider-agent capability contracts.
Dynamic panel actions can appear in panel manifests, but that does not make them
Codex Workstation Mode tools. Provider access requires an explicit capability
contract, structured observation or receipt, model re-entry, and terminal
authority review.

## Owner

The panel that declares a dynamic action owns its local UI behavior. Helix Ask
owns provider admission policy and route authority. Codex Workstation Mode and
future provider runtimes must not execute dynamic panel action ids directly
unless a shared gateway manifest entry exists for the exact capability.

## Inputs

Dynamic panel action ids must fail closed in provider-mode prompts unless an
explicit provider gateway contract has graduated the action.

Blocked prompt shapes include:

- quoted tool/action names
- UI labels or screen-visible names
- documentation or historical mentions
- negated instructions
- future or conditional plans
- broad requests that only imply nearby panel controls

Graduation requires explicit affirmative operator-command admission for the
specific action id or a clearly defined provider alias.

## Observation

Dynamic action execution, if graduated later, must return a bounded observation
or receipt with:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

The receipt must include the panel id, action id, resolved args, permission
decision, no-op or blocked reason when applicable, and safe host projection refs.

## Host Projection

Panel effects are host projections, not provider answer authority. UI state
changes must come from structured action receipts or route products, not from
provider final prose. A final answer must remain readable if the host ignores
the projection metadata.

## Visible Trace

If a dynamic panel action is graduated later, the latest-turn stream must show:

```txt
runtime selected
panel action request
permission/confirmation decision
action receipt or blocked/no-op receipt
model re-entry
final answer
```

Debug export and visible trace must agree for the same turn id.

## Tests

Current behavior:

```txt
surface=dynamic_panel
provider_availability.codex_workstation=false
provider_availability.future_provider=false
gateway_manifest=absent
```

Classification rules:

- retired panel actions: `legacy_dynamic_panel_only`
- actions requiring confirmation or medium/high risk: `requires_confirmation_contract`
- other active panel actions: `blocked_pending_contract`

Required before provider graduation:

- explicit action-specific contract
- positive affirmative admission case
- quoted/negated/historical/future/screen-visible negative cases
- structured receipt or observation packet
- blocked/no-op receipt behavior
- model re-entry after receipt
- terminal authority test proving receipt is not final answer
- latest-turn/debug-export projection parity
- no final-prose scraping

Implementation anchors:

- Dynamic action catalog:
  `shared/workstation-dynamic-tools.ts`
- Classification:
  `server/services/helix-ask/provider-agent-capability-contract.ts`
- Provider capability tests:
  `server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts`
- Provider audit list:
  `docs/helix-ask-provider-capability-contracts.md`

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```
