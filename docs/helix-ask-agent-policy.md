# Helix Ask Agent Action Policy (D18)

This document defines the minimal controller mapping from gate outcomes to the next
best action in the Helix Ask agent loop. The policy is intentionally conservative:
no repo-attributed claim is emitted without proof pointers.

## Action selection (gate outcome -> next action)

| Gate outcome / signal | Next action | Notes |
| --- | --- | --- |
| Missing slot evidence (slot/doc coverage failed) | expand_heading_aliases | Seed slots from doc headings; improves lexical overlap. |
| Missing slot evidence persists | slot_local_retry | Retry retrieval with slot-local hints and must-include files. |
| Missing slot evidence persists + repo expected | retrieve_code_first | Switch allowlist to code surfaces for symbol-heavy slots. |
| Multi-slot prompt detected | switch_report_mode | Decompose into per-slot blocks with global intent header. |
| Ambiguity high (no dominant cluster) | ask_slot_clarify | Ask a slot-local clarification with proof targets. |
| Evidence sufficient + coverage ok | render_scientific_micro_report | Render grounded summary + grounded-only connections. |
| Budget exhausted or max steps | render_scientific_micro_report | Stop loop; return best grounded scaffold + next evidence. |

## Stop conditions

Stop the loop when any condition is met:
- proof_density_sufficient
- only_missing_slots_need_user
- budget_exhausted
- max_steps
- action_budget_exhausted

## Per-action budgets

- Each action has a soft time budget (HELIX_ASK_AGENT_ACTION_BUDGET_MS).
- The agent loop also has a global budget (HELIX_ASK_AGENT_LOOP_BUDGET_MS).
- Budget overruns are recorded in debug payloads and can trigger early stop.

## Required output contract

When evidence is partial or missing, responses must still be scientific:
- Confirmed (grounded claims only)
- Reasoned connections (grounded-only)
- Hypotheses (only if enabled)
- Next evidence (concrete file/section/symbol targets)
