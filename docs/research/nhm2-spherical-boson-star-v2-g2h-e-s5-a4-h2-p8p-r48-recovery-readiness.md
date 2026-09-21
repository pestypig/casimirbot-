Program gate: G2H-E-S5-A4 / P8P; P8Q STOP
Workstream: Candidate-neutral R39 build-fixture evidence recovery and classification
Capability or component: R48 stopped-disk recovery readiness
Current maturity: Superseded by consumed R48 terminal result
Target maturity: Preserved historical readiness evidence only
Required frozen inputs: R47 terminal evidence; retained R46 snapshot/clone; R48 v3 proposal and ledger; replay and archive-audit identities
Required evidence: Fresh approval of final hashes; one bounded attempt; workload/safety replay; exact archive and content audit; verified STOP
Stop/fail criteria: Drift, missing grant, first failure, failed replay/classification, ambiguous STOP, retry, or resource substitution
Explicit non-goals: Docker/build/P=1024/P=65,536, candidate evaluation, retuning, evidence deletion, G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: None; see the additive R48 terminal-result document

# P8P R48 recovery readiness — September 21, 2026

> Superseded later on September 21 by the additive
> [R48 terminal result](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r48-terminal-result.md).
> R48 was consumed as a pre-effect failure and may not be retried. The text
> below preserves the exact preexecution readiness state.

R47 was executed exactly once under its direct grant and is consumed as
`R47_FAILED`. It reached the guest and preserved bounded serial evidence, then
failed at the frozen `lsblk` disk-count guard before export. Its exact helper
was independently observed `TERMINATED`; the retained sources and evidence were
not deleted. The 12,122-byte R40 archive remains unrecovered. A separate
post-run duplicate-audit adapter defect was identified but did not cause the
earlier guest layout failure. R47 may not be retried.

The candidate-neutral R48 successor addresses both gaps without changing the
archive, build, calibration or scientific definitions. Its guest emits bounded
hash-bound raw layout evidence before applying a tree-aware fail-closed parser.
Its controller removes the duplicate post-run audit, uses one fresh read-only
snapshot clone and one temporary `e2-small` helper, binds an independent STOP
owner, and preserves separate hash-chained workload and safety journals.

The final external execution packet is frozen at:

- proposal SHA-256
  `28227b57b31d02fe2868e305cb7182f5c7bb06695f4e5a274a2576ae4402157e`;
- exact command-ledger SHA-256
  `38bf6b022b1585aa06f9266c87b9b7de353280043d2a7ade58c7b1ab8b9ec78c`;
- execution-packet auditor SHA-256
  `07ca875b942ce919eb185ca6c424d13a8dc6f01e135b1aea4401708a0871e317`.

The independent packet audit passes 44/44 with `proposalReady:true`,
`cloudExecutionAuthorized:false`, and `scientificAuthority:false`. The focused
workload/safety replay fixtures pass 11/11. The bounded no-extraction R40/R39
archive inspector and diagnostic suites pass 17/17. The frozen P8Q exact-
integer replay passes 10/10 with a separate 18/18 source/arithmetic audit, but
no calibration receipt exists, so only
`P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.

Architecture remains stage-specific: R48 is only the stopped-disk recovery
bridge. Google Cloud Batch remains the selected scheduler for a future
unchanged P=1024 calibration after authenticated R39 classification and an
independently verified build-only PASS. No R48 grant, cloud request, Docker or
build process, numerical execution, candidate evaluation, evidence deletion,
or scientific/physical authority promotion is recorded by this readiness
packet.
