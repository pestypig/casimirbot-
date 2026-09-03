Program gate: G2H-E-S5-A4 / H2 candidate-neutral representative attribution
Workstream: mini-boson-star H2 continuation benchmark
Capability or component: P8J controller handoff liveness guard
Current maturity: R11 stopped by a false-negative systemd handoff check; R12 audit 16/16 PASS
Target maturity: one uninterrupted candidate-neutral P8J terminal process
Required frozen inputs: unchanged R2 archives, controller v2, P8I/P8J definitions, result audit
Required evidence: activating service state, nonzero live MainPID, fixture/binary receipts, terminal evidence
Stop/fail criteria: first allocation, transfer, service-state, fixture, binary, numerical, timeout, retrieval, or audit failure is terminal
Explicit non-goals: candidate evaluation, positive sampling, retuning, scientific-definition changes, G3/SI/metric/lane work, authority promotion
Downstream gate unlocked: evidence-backed H2/P8J scientific attribution decision

# H2-P8J-R13 controller-handoff successor

R12 recovered the exhausted R11 disk as 4,325 bytes, SHA-256
`0a350e53b5a7b7720c6450e00a2cd371de0da5b470e862a5e972cacd18466f88`.
Independent audit
`334a4c7bcfc1a5e6d5fe7c97c57101b5ba830557f538e0286db7ea8c9b592306`
passes 16/16.

The evidence proves the offline binding repair succeeded: Docker authenticated
builder config `540d7039…`, crossed the formerly failing `FROM`, and reached
fixture-build step 4. No controller failure marker was emitted. The outer R11
launcher then sent SIGTERM eight seconds after service start because its
five-second `systemctl is-active --quiet` check did not admit a long-running
oneshot in `activating/start` state.

R13 changes only the launcher handoff check. After five seconds it requires:

- `ActiveState=activating`;
- `SubState=start`;
- a nonzero decimal `MainPID`;
- successful `kill -0` on that exact process.

The R13 orchestrator is 8,129 bytes with SHA-256
`12e5119794dc8fe39ce350a812499e800d95ad63d969e0a4c6401e8aba65a0b5`
and passes shell syntax validation. Controller v2 remains exactly
`867f4b20a9d81d00b9bab16d99865470b70ea22d8a02fd2735901b2ad7097a01`.
No Dockerfile, source equation, selector, threshold, precision, fixture,
expected binary, P=65,536 workload, 32-CPU bound, or timeout changes.

R13 may create exactly one regional `c2d-standard-32` VM under the unchanged
25-hour automatic-stop, `$40` per-run, and cumulative charter ceilings. It is
one terminal attempt with no retry. Candidate and all scientific/physical
authority remain false.
