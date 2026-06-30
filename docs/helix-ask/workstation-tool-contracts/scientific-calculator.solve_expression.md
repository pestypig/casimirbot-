# scientific-calculator.solve_expression

Maturity: `candidate`

## Purpose

Evaluate a bounded calculator expression as read-only numeric evidence for the
turn. The result may support a final answer only after the observation packet
re-enters the provider/runtime and terminal authority selects the final answer.

## Owner

- Capability id: `scientific-calculator.solve_expression`
- Panel: `scientific-calculator`
- Action id: `solve_expression`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- `expression`: arithmetic expression text

Accepted aliases in adapter paths may include `latex`, `query`, or prompt text,
but normalization must produce a bounded expression before execution.

Blocked:

- empty expression
- prose with no bounded math expression
- quoted or historical mentions such as "the last answer said
  scientific-calculator.solve_expression"
- requests that ask about the capability as text only

## Observation

Required observation fields:

- `schema`: calculator solve observation schema from the gateway
- `capability_key`: `scientific-calculator.solve_expression`
- `panel_id`: `scientific-calculator`
- `action_id`: `solve_expression`
- `status`
- `expression`
- `result`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

The observation packet must be present before Codex or Helix claims the
calculator ran.

## Host Projection

Allowed host metadata:

```txt
workstation_actions.kind=fill_calculator_expression
expression_text
result
unit
tool_output_refs
support_refs
```

Projection may open/focus the calculator and show the observed solve result.
Projection must come from structured observation/action receipt fields, not from
final prose.

## Visible Trace

Latest-turn UI should show:

```txt
Runtime selected: Codex Workstation Mode
Tool request: scientific-calculator.solve_expression
Tool observation: scientific-calculator.solve_expression observed <expression> = <result>
Model re-entry: workstation observation packet available
Final answer
```

## Debug Fields

Expected debug surfaces:

- `workstation_gateway_call_results`
- `workstation_gateway_observation_packets`
- `ask_turn_solver_trace`
- `tool_lifecycle_trace`
- `tool_followup_decision`

## Tests

Candidate evidence currently includes API and UI smoke for expression `8*9`
returning `72`.

Required stable tests:

- explicit calculator call renders request, observation, re-entry, final answer
- no observation packet means no claim that the calculator ran
- final prose alone does not create a calculator row or panel action
- calculator panel projection stays synchronized with the observation packet
