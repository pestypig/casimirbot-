Program gate: G2H-E-S5-A4 / H2 candidate-neutral representative attribution
Workstream: mini-boson-star H2 continuation benchmark
Capability or component: P8J-R11 stopped-disk evidence recovery
Current maturity: R11 terminal fail-stop after allocation and remote setup
Target maturity: authenticated classification of the R11 terminal phase
Required frozen inputs: terminated R11 disk, exact rescue procedure and orchestrator
Required evidence: source-disk identity, read-only clone mount, recovered archive hash, helper stop
Stop/fail criteria: first snapshot, helper, clone, mount, copy, hash, or stop failure is terminal for R12
Explicit non-goals: numerical execution, VM restart, candidate evaluation, retuning, G3/SI/metric/lane work, authority promotion
Downstream gate unlocked: evidence-selected P8J successor or terminal benchmark classification

# H2-P8J-R12 stopped-disk rescue

R11 is exhausted with Cloud Shell procedure exit 3 and automatic fail-stop. The
original VM `nhm2-h2-p8j-r11-c2d-32-20260901` is `TERMINATED`; its numerical
service may not be restarted. R12 is a read-only evidence operation.

The rescue procedure is 2,682 bytes, SHA-256
`4e60f6c55bb68fc8da96036fe77aafeb9fcd9004443fe7f805834f8f2c38444c`.
The Cloud Shell orchestrator is 5,388 bytes, SHA-256
`f920baf5aa77d25f48c81a812763bb2bfb975fafd58bfbcaa6865be6026b2f41`.
Both pass shell syntax validation.

R12 may create one standard snapshot of the retained R11 disk, one 30 GB
`pd-standard` clone, and one temporary `e2-small` helper with a 10 GB
`pd-standard` boot disk. The helper must boot before the clone is attached in
read-only mode. The guest must require the block device read-only and mount the
single unambiguous filesystem only as `ext4 ro,noload` or `xfs ro,norecovery`.

It may copy only the existing P8J evidence, build logs, controller definition,
and service journal into one deterministic archive, verify the archive hash in
Cloud Shell, and stop the helper. R12 has a 3,600-second helper ceiling and is
within the standing `$40` per-run and `$120` cumulative charter bounds.

Candidate, proof, geometry/state, lane, replay, lamp, physical, propulsion, and
transport authority remain false.
