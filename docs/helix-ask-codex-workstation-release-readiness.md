# Codex Workstation Release Readiness Matrix

Status: working draft for Helix Ask provider parity.

This matrix tracks which Workstation Mode surfaces are wired for provider agents
and which gates remain before release. It is a contract checklist, not a runtime
smoke script.

## Boundary Rules

- Helix owns prompt interpretation, source admission, evidence identity,
  provenance, route authority, debug traces, and terminal authority.
- Codex owns model sampling, generic tool execution, retries, approvals,
  sandboxing, compaction, subagents, and terminal completion.
- Receipts and observations are never answers.
- Gateway and capability-lane outputs must re-enter the solver before any final
  answer.
- Quoted, negated, historical, future, conditional, or screen-visible tool words
  must not admit mutating or source-targeted tools.

## Current Matrix

| Area | Status | Provider surface | Evidence gate | Verification |
| --- | --- | --- | --- | --- |
| Dynamic panel action graduation | Wired | `workstation-notes.list_notes` via shared gateway | Body-redacted note index only; no note body in provider evidence | `registry.test.ts`, `provider-capability-contract.test.ts` |
| Workstation Notes create/append/open | Held back | Contracted side-effect actions only | Requires affirmative command, host receipt, confirmation/projection policy | contract docs; no gateway manifest entry |
| Safe live-env loop controls | Held back | Contracted pause/resume/set state family only | Mutating control; requires permission and structured no-op/block receipts | contract docs; no gateway manifest entry |
| Artifact query index | Wired | Notes list, create/append/open receipt keys recognized | Index is query/evidence metadata, not answer authority | `helix.ask.tool-lifecycle-trace.test.ts` |
| Tool lifecycle/follow-up parity | Wired | Gateway call packets promote top-level debug trace | Forces non-terminal gateway records, `post_tool_model_step_required`, and `terminal_authority_not_evaluated` | `helix.ask.tool-lifecycle-trace.test.ts` |
| Live translation | Wired | `live_translation.translate_text` shared capability lane | Observation/projection receipt only; backend selection and terminal authority stay Helix-owned | `live-translation.test.ts`, `provider-capability-contract.test.ts` |
| Visual analysis / Image Lens | Wired | `visual_analysis.inspect_image_region`, `visual_analysis.inspect_frame` shared capability lanes | Requires admitted visual source; region/frame receipts remain non-terminal evidence | `one-shot-runner.test.ts`, `provider-capability-contract.test.ts` |
| Theory -> scholar/docs -> calculator rail | Hardened | Shared gateway typed affordance chain | Calculator binding accepts numeric evidence, not expression templates masquerading as values | `registry.test.ts` |
| Runtime terminal-authority/debug parity | Static wired; live gate pending | Ask debug payloads, gateway packets, lifecycle/follow-up records | Needs user-started keyed localhost parity run; do not run unkeyed or all-in-one smoke locally | `npm run helix:ask:discipline:quick`; live gate below |
| Release decision | Pending operator gate | Codex Workstation Mode | Release only after keyed parity captures representative pass/fail cases | this matrix plus live parity evidence |

## Live Parity Gate

Do not use an all-in-one Node smoke test for this gate. Use a user-started keyed
local server and the narrow parity probe only. On memory-sensitive workstations,
run filtered batches instead of the full scenario set:

```txt
$env:HELIX_ASK_BASE_URL="http://127.0.0.1:5050"
$env:HELIX_ASK_API_PARITY_SCENARIOS="visual_content_active_source,visual_content_negated_cadence,visual_content_original_interval_regression,procedure_epoch_interval_status"
npm run helix:ask:api-parity

$env:HELIX_ASK_API_PARITY_SCENARIOS="affirmative_cadence_control,contextual_click,capability_catalog_runtime,screen_text_start_button,historical_tool_mention"
npm run helix:ask:api-parity

$env:HELIX_ASK_API_PARITY_SCENARIOS="live_source_identity_active_bound,live_source_identity_fresh_unbound,live_source_identity_wrong_environment,live_source_identity_missing_environment_source,live_source_identity_no_situation_run,live_source_identity_no_field_evaluations,live_source_identity_stale_interpretation"
npm run helix:ask:api-parity
```

The probe stops early after repeated transport failures so a dropped or
memory-exhausted server does not continue receiving every remaining scenario.

Required representative cases:

```txt
pass: workstation-notes.list_notes returns body-redacted note index and then re-enters solver
pass: live_translation.translate_text returns non-terminal translation observation
pass: visual_analysis.inspect_image_region returns non-terminal visual crop evidence
pass: theory/scholarly/calculator chain binds only cited numeric_value_evidence
fail: quoted workstation-notes.append_to_note does not mutate notes
fail: calculator binding rejects calculator_expression_template as numeric evidence
fail: missing visual source_id blocks image-lens inspection
fail: gateway receipt without re-entry cannot become final answer
```

Capture for each case:

```txt
prompt
selected route/capability
observation packet refs
tool_lifecycle_trace
tool_followup_decision
terminal authority verdict
visible answer or typed failure
```
