Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R32 fresh small-VM build-only fixture execution
Current maturity: immutable partial-ingress BLOCKED result; R32 exhausted
Target maturity: separately versioned no-space archive-transport successor reusing the stopped exact VM
Required frozen inputs: R32 proposal, exact VM/disk, local execution evidence, and unchanged three ingress identities
Required evidence: exact creation/resource identity, SCP terminal output, per-file transfer classification, automatic stop, absence of Docker/build/numerical execution, and independent audit
Stop/fail criteria: retrying R32, overwriting partial ingress, ambiguous archive transfer, VM state ambiguity, build claim without archive authentication, numerical/candidate execution, retune, evidence deletion, or authority promotion
Explicit non-goals: retry/fallback, second R32 request, P=1024 or P=65,536 execution, candidate work, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: one separately frozen retained-R32-VM no-space archive-ingress proposal; no execution authority

# H2-P8P-R32 upload result

Status date: September 4, 2026.

Status: **BLOCKED PREEXECUTION / R32 EXHAUSTED**.

R32 created the exact `e2-standard-4` VM
`nhm2-h2-p8p-r32-e2-4-20260904` in `us-east1-b`, instance ID
`1893159507643031574`, with its exact Debian image and 30 GB `pd-standard`
auto-delete boot disk. Preexecution passed.

The sole three-file SCP then failed. PuTTY `pscp` interpreted the large
space-containing Windows archive path incorrectly and reported `No such file or
directory`. The 236,640,768-byte archive transferred zero bytes. The same SCP
did transfer the two small scripts to their new VM paths: the 4,024-byte R31
fixture and 3,129-byte R32 guest wrapper. This partial ingress is preserved and
must not be overwritten or treated as a complete input set.

Google Cloud project SSH metadata was updated by gcloud's ordinary first-use key
propagation before SCP. No guest command was submitted. Docker was not installed
or started; no image load, source reconstruction, build, fixture, executable
inspection, panel calculation, P8Q audit, or candidate action occurred.

The cleanup path stopped the VM, which is authenticated `TERMINATED`. R32 is
exhausted under first-failure. Its immutable local evidence includes:

- controller SHA-256: `df3f4ef73cc96df30e54c5e4a8ee45e8a1cbfc56ac861060e3b2fad1f706d809`;
- create receipt SHA-256: `a3aa0e6272475f4e3919e4e6ddf7e54c018b280c79f36a3a68f2dbcc24bf56c4`;
- running-instance receipt SHA-256: `14754e53cbdab63c75608c4d6fec841c4a652f5bf50631068cb57e6becc3ebf0`;
- SCP failure receipt SHA-256: `bec6656723af894fc573b22f4cecc71b67084221ae17098bfe58d428f338befa`;
- cleanup-stop receipt SHA-256: `d3d985da9a345924fcaa652c6f5419ac64a49ff7c0f50e4462851de663079f36`.

This is transport/preexecution evidence only. P8Q remains
`P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED`; all authority remains false.

