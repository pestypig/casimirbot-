Program gate: G8.
Workstream: CS3 root admission latency; O2 durable pairing reads.
Capability or component: confirmation of already-persisted local pairing state.
Lifecycle stage: evidence normalization; source admission.
Reaction timescale: the frozen four-second root start allowance and five-second perception window remain unchanged.
Authority owner: existing authenticated exact task/chat/run pairing and finite player permission; every grant read remains authoritative.
Current maturity: specified for this repair.
Target maturity: deterministically verified snapshot coverage and separately measured packaged admission.
Required evidence: unchanged grant reads currently repeat full snapshot writes; successful atomic persistence coverage; mutation, failed save, concurrent save, restart and volatile-storage negatives; current grant/revocation/expiry checks; focused regressions and documentation audit; packaged fixed-budget timing.
Explicit non-goals: no cached permission verdict, skipped unpersisted mutation, widened deadline, automatic consent, replay of an admitted failed action, private execution loop, CS3/ET6/NAV1 qualification or power-loss guarantee.
Downstream gate unlocked: further bounded CS3 investigation only.

# Avoid rewriting unchanged durable pairing state

Follow the [work program](../helix-environment-harness-work-program-v1.md),
[continuous-session packet](eh-g8-et6-continuous-session-build-v1.md),
[onboarding packet](eh-g8-cs-onboarding-pairing-plan-v1.md), and frozen
[root-motion baseline](eh-g8-cs3-root-motion-baseline-v1.md).

The third root attempt reached the actual resident but missed its latest start
tick before motion. Its request returned after 4,054 ms; the resident clock was
about 5,507 ms beyond the planning observation. Native measurements show no
player motion or other effects. The immutable attempt-3 evidence does not
attribute this entire interval to a particular server operation.

Inspection found that each durable binding verification calls a strict full
snapshot confirmation before reading the current encrypted grant. Repeated
verification is required; repeating a write of unchanged acknowledged state
may not be. First reproduce the physical write count with the real migrated
fixture database and native vault. Keep mutation acknowledgements strict.

Track only successful local snapshot coverage, invalidated by table mutations,
failed collection or storage reset. An unchanged covered table may satisfy a
read confirmation without another write. An uncovered or changed table must
cross the existing strict barrier. Only successful atomic snapshot replacement
can establish coverage; concurrent changes remain uncovered. Never retain a
decoded grant, trust decision, deadline or identity verdict as authority.
PostgreSQL retains its own transaction durability, and volatile local storage
continues to reject authority confirmation.

Tests and source inspection are component evidence. Only a new packaged attempt
under the same frozen budgets can establish any live latency improvement. The
already admitted failed action must not be replayed; any later diagnostic needs
fresh evidence and a distinct request identity.
