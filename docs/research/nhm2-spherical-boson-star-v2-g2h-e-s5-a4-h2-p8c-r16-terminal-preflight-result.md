Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R16 transport-independent retrieval execution result
Current maturity: immutable terminal pre-creation failure
Target maturity: separately versioned topology-repair successor
Required frozen inputs: R16 proposal `e10689d5...66ad`, exact staged procedures, active charter, and authenticated cloud topology
Required evidence: Cloud Shell health marker, exact script hashes, absent R16 helper/archive/evidence, stopped VM statuses, retained clone users, and zero running NHM2 VMs
Stop/fail criteria: first R16 controller failure terminal; no R16 retry or reinterpretation
Explicit non-goals: candidate evaluation, numerical execution, retuning, evidence deletion, SSH trust mutation, or authority promotion
Downstream gate unlocked: one separately versioned R17 topology-repair successor under the active charter

# H2-P8C-R16 terminal preflight result

Status date: August 30, 2026.

Status: **BLOCKED_PRECREATION_TOPOLOGY_GUARD / IMMUTABLE**.

The exact R16 startup and Cloud Shell procedures were staged and authenticated
at 3,389 bytes / `2f2f89a7...e992` and 9,178 bytes /
`d5754639...f9eec`. The one R16 controller invocation then stopped before its
evidence-directory creation, clone detach, helper creation, archive retrieval,
or any billed compute.

Read-only disambiguation established the precise guard mismatch:

- the original, rescue, R13, R14 and R15 VMs were all `TERMINATED`;
- zero `nhm2-h2-` VMs were running;
- the R16 helper did not exist;
- the R16 Cloud Shell archive and evidence path were absent;
- retained clone `nhm2-h2-p8c-rescue-hostkey-clone-r13-20260830` was `READY`,
  10 GB, `pd-standard`, and retained as a user of all three stopped R13, R14
  and R15 helpers;
- R16 had frozen the stricter expectation that R15 was the clone's sole user.

Therefore R16 correctly fails closed as a topology-precondition blocker. It is
exhausted and will not be retried. No VM, disk, numerical process, candidate,
scientific root, proof, geometry/state, lane, lamp, physical, propulsion or
transport authority was created or promoted.

The narrow successor is R17: authenticate the exact three stopped attachments,
detach only R13 and R14, require R15 as the sole stopped attachment, and then
execute the transport-independent logic under separately named R17 helper,
archive and evidence identities.
