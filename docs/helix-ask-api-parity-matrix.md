# Helix Ask API Parity Matrix

The API parity harness tests Helix Ask through the same top-level API surface used by the UI. It is not an answer route, not a private agent loop, and not a replacement for Codex-owned sampling, tool execution, approval, sandboxing, or terminal completion.

## Goal

Catch deterministic short-circuiting from normal Ask turns:

```txt
prompt -> source target -> route candidates -> admitted tools -> actual tools
-> observations -> finalizer -> route authority -> poison audit -> terminal authority
```

A probe passes only when:

```txt
debug_export_available = true
terminal_authority_ok = true
route_authority_ok = true
unexpected_tool_calls = []
short_circuit_risk_flags = []
poison_audit.ok = true does not mask route_authority_ok = false
```

For hard source-targeted prompts, a missing route product contract is a failure. Contextual tool verbs, screen text, historical tool mentions, negated commands, future commands, and status questions must not create mutating tool calls unless the prompt is an affirmative operator command.

## Matrix

The first parity pack is defined in `server/services/helix-ask/api-parity-matrix.ts`.

```txt
visual_content_active_source
visual_content_negated_cadence
procedure_epoch_interval_status
affirmative_cadence_control
contextual_click
```

Disabled follow-up scenarios:

```txt
screen_text_start_button
historical_tool_mention
```

`screen_text_start_button` currently needs an input-integrity policy split for screen text that names UI controls. `historical_tool_mention` needs a prior-debug-export seed.

## Running Against A Live Server

Start the normal development server with the test harness enabled:

```powershell
$env:ENABLE_HELIX_TEST_HARNESS="1"; npm run dev:agi:5050
```

Then run:

```bash
npm run helix:ask:api-parity
```

Useful environment variables:

```txt
HELIX_ASK_BASE_URL=http://127.0.0.1:5050
HELIX_ASK_API_PARITY_OUT=artifacts/helix-ask-api-parity
HELIX_ASK_API_PARITY_SCENARIOS=visual_content_negated_cadence,affirmative_cadence_control
HELIX_ASK_API_PARITY_INCLUDE_DISABLED=1
```

Each scenario writes:

```txt
seed.json
ask-response.json
debug-export.json
probe-result.json
```

The run writes `summary.json` and `summary.md`.

## Boundary

Codex owns the generic runtime loop. Helix Ask owns source-target admission, evidence normalization, route product contracts, proof gates, route authority, terminal eligibility, and presentation discipline.

The parity harness is only a debug observer over that contract.
