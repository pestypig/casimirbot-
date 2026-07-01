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

- `requested_variables`
- `full_text_observation` or `text_evidence`

Optional:

- `source_ref`
- `paper`
- `source_target_intent`

Blocked:

- no requested variables
- no text evidence
- all requested values missing
- value has no unit, ambiguous unit, unsupported unit, or no citation/source cue

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
