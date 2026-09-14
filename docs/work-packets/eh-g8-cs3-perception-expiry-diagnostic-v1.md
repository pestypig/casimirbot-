Program gate: G8.
Workstream: CS3 first real temporal admission refusal.
Capability or component: exact perception expiry diagnosis.
Lifecycle stage: evidence normalization; evidence re-entry.
Reaction timescale: unchanged five-second observation admission window.
Authority owner: authenticated exact task, durable pairing and finite player authority; existing server and resident checks remain authoritative.
Current maturity: specified.
Target maturity: deterministically verified refusal diagnosis and separately evidenced packaged rehearsal.
Required evidence: retained real root candidate and refusals; boundary tests for expiry, wrong identity, future observation and diagnostic failure; focused regressions and documentation audit; packaged observation before attributing live refusal to expiry.
Explicit non-goals: no enlarged freshness or execution budget, cached grant, authority renewal, new execution loop, automatic replay, three-successor claim, ET6 or NAV1 qualification.
Downstream gate unlocked: measured diagnosis of CS3 admission latency only.

# Perception expiry diagnosis

Follow the [work program](../helix-environment-harness-work-program-v1.md)
and preserve every [continuous-session exit](eh-g8-et6-continuous-session-build-v1.md).
The [root baseline](eh-g8-cs3-root-motion-baseline-v1.md) remains frozen.

The first real submission was refused after this task's presence expired.
An explicit presence refresh preserved the existing consent and enabled a
second submission. Its perception was observed at 11:51:20.906Z, submission
began at 11:51:23.419Z and the refusal returned at 11:51:27.063Z on
2026-09-14. The returned code was `durable_goal_evidence_identity_mismatch`;
neither workflow-status query found a created workflow. These observations
do not prove the exact server rejection time or which prerequisite consumed
the latency, and do not constitute zero-effect execution measurements.

The exact evidence reader currently returns null for both identity failure
and expiry. Preserve that default contract. Permit an internal diagnostic
callback only after identity, schema and provenance checks have passed, then
report verified expiry distinctly to temporal callers. No rejected evidence
may become admissible, and diagnostic failure must not affect the decision.
Keep future timestamps and mismatched records separate from verified expiry.
Do not remove authority checks or tune the frozen budget without measuring
the first failing stage.
