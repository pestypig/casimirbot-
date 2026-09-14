Program gate: G8 — environment-harness release evaluation.
Workstream: CS1/CS4 packaged readiness under the existing continuous-session prerequisite.
Capability or component: durable binding repository initialization during readiness revalidation.
Lifecycle stage: evidence re-entry.
Reaction timescale: one explicit Ready up request within the unchanged five-second observation window.
Authority owner: authenticated browser owner or exact MCP task requests preparation; the durable grant, trust, identity and current authority checks remain server-owned.
Current maturity: specified.
Target maturity: deterministically verified initialization reuse and separately evidenced packaged readiness.
Required evidence: native success and expiry response pair, isolated real-ledger initialization-count regression, fresh revocation/trust/storage checks after reuse, failed initialization recovery, focused route/access checks, documentation audit, package content verification and ordinary native repeat.
Explicit non-goals: no cached grant or consent verdict, no reduced durability barrier at admission, no enlarged freshness window, no permission renewal, no private retry/execution loop, no gameplay or ET6/NAV1 qualification.
Downstream gate unlocked: further CS1-CS4 development rehearsal only.

# Ready up durability initialization cost

The [work program](../helix-environment-harness-work-program-v1.md) remains the
sole roadmap. Preserve every [continuous-session](eh-g8-et6-continuous-session-build-v1.md)
and [onboarding](eh-g8-cs-onboarding-pairing-plan-v1.md) exit.

The broker-revision package recovered the original goal and passed three
delayed MCP checks. Its native UI subsequently displayed a successful check
with HTTP 200 after 8.91 seconds and 1,246 ms of validity remaining. The next
native request returned `environment_session_readiness_expired`, no repairs,
and `partial_effects_unknown: false`. That typed failure locates expiry after
readiness collection, during the final association check. Earlier native
perception failures remain evidence; their exact substage was not captured.

Source inspection finds that each durable access read creates a repository,
whose factory confirms a strict snapshot, then immediately confirms durability
again before reading the current grant. Reuse only the initialized repository
handle within the access object's existing service/database lifetime. Every
operation must still reauthorize the destination, confirm durability and read
the current encrypted ledger row. Never cache an accepted row, expiry, trust,
identity or policy decision. Failed initialization must reject that caller;
a later explicit operation may initialize again without a private retry.

The repeated initialization is a concrete redundant operation, not yet a
measured attribution of the full live latency. Deterministic tests must prove
that only initialization is reused and that every later admission remains
fresh. Live package measurements determine whether this repair resolves the
observed readiness expiry. If it does not, retain the failure and measure the
next boundary without weakening freshness or durability.
