# workstation panel actions

Maturity: `draft`

## Purpose

Represent safe host-side panel affordances requested through the shared
workstation gateway. These capabilities may open or focus known panels, or
project a calculator gateway solve into the calculator panel, but they are
receipts/actions beside the answer rather than answer authority.

## Covered Capabilities

```txt
scientific-calculator.open_panel
scientific-calculator.focus_panel
scientific-calculator.show_gateway_solve
workstation.open_panel
workstation.focus_panel
```

## Owner

- Panel: workstation shell and `scientific-calculator`
- Permission profile: `act`
- Mode: act

## Inputs

For `workstation.open_panel` and `workstation.focus_panel`:

- `panel_id`

For calculator-specific open/focus:

- optional `reason`

For `scientific-calculator.show_gateway_solve`:

- `expression`
- `result`
- optional `trace_id`

Blocked:

- panel ids outside the safe allowlist
- requests to close, delete, write, execute shell, or mutate files
- quoted, negated, historical, or explanatory mentions of panel action names
- projection inferred from final prose instead of a structured receipt

## Observation

Required receipt fields:

- `schema`: `helix.workstation_ui_action_receipt.v1`
- `capability_key`
- `panel_id`
- `action_id`
- `status`
- action-specific bounded payload
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

Panel receipts are observations. They may update host UI affordances, but the
provider must still re-enter with the receipt before producing a final answer.

## Host Projection

Allowed metadata:

```txt
workstation_actions.kind=open_panel
workstation_actions.kind=focus_panel
workstation_actions.kind=fill_calculator_expression
tool_output_refs
support_refs
```

Projection must come from the structured receipt or observation packet. Final
answer text must remain readable if the host ignores these actions.

## Visible Trace

```txt
Action request: <capability>
Action observation: <capability> observed host-side panel receipt
Model re-entry
Final answer or typed failure
```

## Tests

Required stable tests:

- safe panel open/focus receipts are non-terminal
- unsafe panel ids are blocked
- calculator projection follows `show_gateway_solve` receipt data
- final prose alone cannot open/focus panels or fill calculator fields
