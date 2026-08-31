Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P7 candidate-neutral parent cloud execution launch
Current maturity: sole parent process terminated and VM stopped before the scheduled ceiling; retained disk READY; result retrieval and audit pending
Target maturity: one immutable candidate-neutral H2 parent result binding the origin and first positive-panel H2 ledgers
Required frozen inputs: proposal `3f15f387...fdc3`, archive `9c2a6af7...f1f5`, manifest `d20e0f8e...f9d5f`, guard `2e7a2cb9...305c`, Dockerfile `26c8f0fb...1949` and binary `e6dfc340...8f56`
Required evidence: complete/FAIL/timeout/partial stdout, stderr, exit status and timestamps; exact resource/build/binary identity; independent result audit; stopped VM; preserved disk and false authority locks
Stop/fail criteria: a second process or retry, timeout beyond 100,800 seconds, aggregate runtime or cost ceiling, evidence deletion, candidate ingress, protected root creation or authority promotion
Explicit non-goals: frozen-candidate evaluation, positive sampling, scientific output root, authorization-token creation, handler linkage, Rust/G3/SI/metric/lane work, lamp, physical viability, propulsion or transport
Downstream gate unlocked: only after process termination and independent result audit, either H2 parent `PASS`, immutable `FAIL`, or bounded infrastructure disposition

# H2-P7 parent cloud launch

Status date: August 28, 2026.

Status: **TERMINATED / RESULT PRESERVED ON STOPPED DISK**.

The exact authorization for proposal SHA-256
`3f15f387c95079d2049f346e260cd8b31e51732ea903b06ae11f8feb0eabfdc3`
was supplied on August 27, 2026. This record reports launch state only. It is
not a scientific result or an independent result audit.

## Bound launch state

- project: `dark-stratum-455714-h4`;
- VM: `nhm2-h2-p7-parent-c4-16-20260827`;
- zone: `us-central1-a`;
- machine: on-demand `c4-standard-16`;
- disk: 30 GB `hyperdisk-balanced`;
- boot family: Debian 12;
- archive on Cloud Shell and VM:
  `9c2a6af7f470e15329741ed0a0210f1519ce12b8fe8ec808f02001a21a18f1f5`;
- archive size and inventory: 236,318,720 bytes and 44 entries;
- clean-daemon offline build exit: `0`;
- clean-daemon build stderr bytes: `0`;
- required binary reproduced:
  `e6dfc3409a83504143b12cfdf023aa42318d89579d33275fd59643cc69788f56`;
- container: `nhm2-h2-p7-parent-process-r1`;
- entrypoint: `/usr/local/bin/mini-boson-star-primary-c08-h2-parent-p7-r1`;
- network: `none`;
- process start: `2026-08-28T00:05:17Z`;
- external timeout: 100,800 seconds;
- first active check: systemd `active/running`, exactly one running parent
  container;
- aggregate-ceiling shutdown: scheduled for `2026-08-29T04:47:44Z`, inside
  the 108,000-second ceiling.

The process wrapper creates new, non-clobbering candidate-neutral evidence
files for stdout, stderr, exit status and UTC timestamps. On complete, failure
or timeout it syncs the disk and shuts down the VM. The VM, container, disk,
logs and evidence are not deleted.

## Authority locks

- frozen candidate evaluated: false;
- positive parameter samples: 0;
- candidate/scientific output roots created: false;
- scientific handler linked: false;
- Rust/G3/SI/metric/lane work begun: false;
- candidate, proof, geometry/state, lane or lamp authority: false;
- physical, propulsion and transport authority: false.

No H2 parent verdict exists until the process terminates and its preserved
evidence passes the separately required independent audit.

Read-only follow-up inspection found the VM `TERMINATED` at
`2026-08-28T06:16:21.113Z`, more than 22 hours before its scheduled aggregate
ceiling, with the retained 30 GB disk `READY`. The stopped-disk
[evidence-retrieval proposal](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p7-evidence-retrieval-proposal.md)
is frozen and independently audited 18/18. No restart or evidence read has
occurred, so PASS versus FAIL remains unknown.

The [pre-result audit definition](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p7-result-audit-definition.md)
was frozen while the process remained active. Its synthetic cases pass 4/4
and its independent definition audit passes 17/17. This prepares the terminal
evidence check without reading, changing or predicting the active result.

## Current-head repository verification

- math report and validation: `323/323`;
- required WARP battery: 18/18 files and 179/179 tests;
- latest audit-definition verification run: `2564`, `PASS/GREEN`, `firstFail=null`;
- certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: true.

This verifies the launch-state documentation and repository guardrails. It does
not certify the still-running parent result or promote any authority.
