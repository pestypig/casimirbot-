Program gate: G2H-E-S5-A4 / H2 candidate-neutral representative attribution
Workstream: mini-boson-star H2 continuation benchmark
Capability or component: P8J-R13 stopped-disk evidence recovery
Current maturity: R13 automatically stopped after the full representative attribution process reached its terminal phase
Target maturity: immutable recovery and independent classification of the R13 benchmark result
Required frozen inputs: terminated R13 boot disk, exact R14 rescue procedure and Cloud Shell orchestrator
Required evidence: source-disk identity, read-only clone mount, recovered archive hash, helper stop, independent result audit
Stop/fail criteria: first snapshot, helper, clone, mount, copy, hash, or stop failure is terminal for R14
Explicit non-goals: original-VM restart, numerical execution, candidate evaluation, retuning, G3/SI/metric/lane work, authority promotion
Downstream gate unlocked: evidence-backed P8J terminal classification and next-gate decision

# H2-P8J-R14 stopped-disk rescue

R13 is exhausted after one candidate-neutral `P=65,536` representative
attribution process and automatic shutdown. The original VM
`nhm2-h2-p8j-r13-c2d-32-20260901` is `TERMINATED`; neither it nor its source
disk may be restarted or modified.

The R14 rescue procedure is 2,682 bytes with SHA-256
`c68a29d0645c6c5400ea0b31c144499711ee7d63784933e11681cc94a89f97f2`.
The Cloud Shell orchestrator is 5,388 bytes with SHA-256
`a51925a4d046d526d452079c15a7450ca36c48c93ee04b6636b989a5b97058b3`.

R14 may create exactly one standard snapshot
`nhm2-h2-p8j-r13-evidence-snapshot-20260901`, one 30 GB `pd-standard`
snapshot-derived disk `nhm2-h2-p8j-r13-evidence-clone-20260901`, and one
temporary `e2-small` helper `nhm2-h2-p8j-r14-rescue-e2-small-20260901` with
a 10 GB `pd-standard` boot disk. The helper has a 3,600-second ceiling and is
within the standing cloud charter.

The helper must boot before clone attachment. The clone is attached in
`READ_ONLY` mode; the guest must verify the block device is read-only and mount
the single unambiguous filesystem only as ext4 with `ro,noload` or xfs with
`ro,norecovery`. It reads only the existing P8J evidence directory, evidence
export, build logs, controller definition, persistent controller journal, and
bounded relevant filesystem metadata.

The helper creates one deterministic archive, Cloud Shell verifies its byte
count and SHA-256, and the helper is stopped. The snapshot, clone, stopped
helper, original VM, source disk, and all evidence remain retained pending a
separate cleanup decision. R14 authorizes no deletion, original-VM restart,
Docker or numerical execution, candidate evaluation, retuning, or scientific,
physical, propulsion, or transport authority promotion.
