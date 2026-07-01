# scholarly-research.extract_numeric_parameters

Maturity: `draft`

## Purpose

Extract cited numeric parameters with units from bounded scholarly text evidence.
This capability produces typed `numeric_value_evidence` for compound formula
binding. It must reject missing, ambiguous, uncited, or unit-incompatible values
instead of inventing substitutions.

## Owner

- Capability id: `scholarly-research.extract_numeric_parameters`
- Panel: `scholarly-research`
- Action id: `extract_numeric_parameters`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- `full_text_observation` or `text_evidence`

Optional:

- `requested_variables`
- `variables`
- `extraction_mode`
- `source_ref`
- `paper`
- `source_target_intent`

Blocked:

- no text evidence
- all requested values missing when `extraction_mode` is
  `requested_variables`
- no supported numeric values found when `extraction_mode` is
  `open_supported_parameters`
- value has no unit, ambiguous unit, unsupported unit, or no citation/source cue

Modes:

- `requested_variables`: bind only requested formula variables and fail closed
  if any requested variable is missing.
- `open_supported_parameters`: extract any supported cited numeric parameters
  from the bounded paper evidence without treating absent `n_m3`, `T_eV`, or
  `B_T` as a failure. This mode is for exploratory paper inspection, not
  calculator binding.

## Observation

Required observation fields:

- `schema`: `helix.scholarly_numeric_parameter_observation.v1`
- `capability_key`: `scholarly-research.extract_numeric_parameters`
- `source_ref`
- `paper`
- `requested_variables`
- `parameters`
- `missing_variables`
- `rejected_candidates`
- `missing_requirements`
- `selected_for_answer`
- `extraction_mode`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

Each parameter must include:

- `variable`
- `value`
- `unit`
- `normalized_value`
- `normalized_unit`
- `source_snippet`
- `page`
- `table`
- `confidence`
- `evidence_ref`

## Typed Affordances

Consumes:

- `text_evidence`
- `citation_evidence`

Produces:

- `numeric_value_evidence`
- `source_ref`
- `citation_evidence`

## Host Projection

Allowed metadata:

```txt
support_refs
tool_output_refs
parameters
missing_variables
rejected_candidates
```

Projection remains diagnostic. Numeric values can bind calculator templates only
through the typed handoff and post-tool model step.

## Visible Trace

```txt
Tool request: scholarly-research.extract_numeric_parameters
Tool observation: cited numeric values or typed missing/ambiguous diagnostics
Model re-entry
Typed binder emits bound_calculator_expression or blocks calculator solve
```

## Tests

- extracts values and normalizes units from text/table fixtures
- rejects missing, ambiguous, uncited, or incompatible candidates
- calculator is blocked until all required variables have cited numeric evidence
- bare `B` from B-meson or branching-fraction prose is not accepted as `B_T`;
  magnetic-field extraction requires magnetic-field context and compatible units
- open extraction reports supported cited paper parameters without requiring a
  fixed variable set
