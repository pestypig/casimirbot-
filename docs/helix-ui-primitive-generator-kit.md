# Helix UI Primitive Generator Kit

This kit standardizes how to add UI actions that Helix Ask can execute reliably through workstation lanes.

## Goals
- Keep user input natural language first.
- Resolve high-confidence UI intents deterministically before classifier/reasoning fallback.
- Keep execution behavior contract-first via `run_panel_action`.
- Ensure every action has tests for parse, execution, and state mutation.

## Canonical Contract
All UI actions must resolve to:
- `action: "run_panel_action"`
- `panel_id`
- `action_id`
- `args` (validated in adapter)

## Implementation Checklist
1. Capability contract
- Add the action in `client/src/lib/workstation/panelCapabilities.ts`.
- Include `aliases`, `required_args`, `optional_args`.
- Set `requires_confirmation` for destructive actions.
- Set `returns_artifact` when action result should be machine-readable.

2. Deterministic lexicon lane
- Add synonym normalization in `normalizeWorkstationCommandText`.
- Add utterance mapping in deterministic lexicon resolver before classifier fallback.
- Ensure ambiguous phrasing does not map to mutating actions.

3. Adapter execution
- Implement handler in `client/src/lib/workstation/panelActionAdapters.ts`.
- Validate required args in adapter.
- Enforce confirmation gates (`args.confirmed=true`) for destructive actions.
- Return deterministic `artifact` payloads for success and contract errors.

4. Telemetry
- Preserve workstation router telemetry fields:
- `router_state`
- `router_outcome`
- `router_fail_id`
- Use specific failure IDs for unsupported/missing/ambiguous routing paths.

5. Test coverage
- Parser tests: utterance -> exact `run_panel_action` payload.
- Negative parser tests: ambiguous phrases produce null/no-op.
- Adapter tests: required arg errors, success artifacts, confirmation behavior.
- Store tests: state mutation outcomes and deterministic IDs.
- Regression tests: docs viewer and panel open behavior remain unchanged.

## Release Gate
Do not merge unless all are true:
- Capabilities, parser, adapter, and tests are updated in one PR.
- Destructive actions require explicit confirmation.
- Added actions are discoverable in panel capabilities and deterministic resolver.
- Test suite covering modified parser and adapters passes.

## Suggested Workflow
1. Copy templates from `templates/workstation-ui-primitives/`.
2. Fill action contract metadata first.
3. Implement deterministic parse mapping.
4. Implement adapter handler and artifacts.
5. Add tests and run scoped vitest.
6. Review router telemetry for no-match intents and expand aliases.
