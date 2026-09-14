Program gate: G8.
Workstream: CS1/CS4 finite run expiry and durable goal continuation.
Capability or component: existing owner-authorized goal checkpoint across run contexts.
Lifecycle stage: evidence re-entry.
Reaction timescale: explicit bounded setup after run expiry; no resident execution.
Authority owner: authenticated room owner and goal steering grant; a new exact-run pairing still requires human consent before task-bound execution.
Current maturity: implemented.
Target maturity: deterministically verified existing ledger behavior and separately recorded MCP preparation.
Required evidence: exact old run expiry and new finite run inspection; current owner/player/authority and fresh perception; canonical checkpoint hash; revision-checked append preserving the same goal, objective, milestones and zero completed postconditions; conflict/identity negatives; ordinary UI pairing review and documentation audit.
Explicit non-goals: no forged recovery reason, new durable goal, milestone completion, run-budget extension, automatic pairing consent, gameplay, authority renewal, or completed CS1-CS4/ET6/NAV1 claim.
Downstream gate unlocked: human review of the prepared exact new-run pairing only.

# Continue the existing goal after a finite run ends

Follow the [work program](../helix-environment-harness-work-program-v1.md)
and preserve [all continuous-session exits](eh-g8-et6-continuous-session-build-v1.md).

The original run expired at 2026-09-14T12:08:07.647Z. Owner-scoped run
inspection reports `run_expired`, and candidate discovery returned none.
The ordinary EXE preparation control requested an eight-hour development
budget. Authenticated `prepare_run` created one new run ending
2026-09-14T20:14:10.898Z, without pairing or gameplay authority.

Ready up's restart recovery requires the goal's current run ID to match and
cannot itself select an old-run goal for the new session. Before adding a
second recovery mechanism, verify the existing goal ledger's explicit owner
checkpoint operation. Run and turn IDs are event context, while stable owner,
environment and actor identity, current authority, evidence and revision checks
remain enforced. A fresh checkpoint may carry the same goal into the verified
new run without claiming any completed postcondition. Do not invent a connector
restart or permission expiry to force a recovery event.

Use the supported MCP checkpoint-hash and goal-append tools only after inspecting
both runs and fresh same-player evidence. Retain the exact request and receipt;
on uncertain response or revision conflict, inspect rather than replay blindly.
This explicit owner preparation is not proof of automatic EXE-only run-expiry
recovery. The new run remains unpaired until the human approves its displayed
exact task/chat/run destination.
