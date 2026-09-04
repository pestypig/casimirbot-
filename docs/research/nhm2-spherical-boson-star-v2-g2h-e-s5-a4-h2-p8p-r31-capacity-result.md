Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R31 retained-VM clean-daemon binding fixture execution
Current maturity: immutable preexecution BLOCKED result; R31 exhausted
Target maturity: separately versioned capacity successor for the unchanged build-only fixture
Required frozen inputs: R31 proposal `37f84cc8...55da9d`, exact retained VM/disk, and exact fixture/wrapper bytes
Required evidence: local preexecution capture, Google start-operation identity and terminal error, stopped post-state, absence of uploads/build/numerical execution, and independent audit
Stop/fail criteria: any retry of R31, VM state ambiguity, upload or build claim without evidence, candidate/numerical execution, retune, evidence deletion, or authority promotion
Explicit non-goals: retry, fallback, P=1024 or P=65,536 execution, frozen-candidate evaluation, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: one separately frozen capacity-aware R32 build-only fixture proposal; no execution authority

# H2-P8P-R31 capacity result

Status date: September 4, 2026.

Status: **BLOCKED PREEXECUTION / R31 EXHAUSTED**.

R31 reauthenticated the exact proposal and both upload files, active account and
project, stopped instance ID `4290604153416687194`, attached disk ID
`8031354852430290522`, 30 GB `pd-standard` shape, and `c2d-standard-32`
machine. The local preexecution marker passed.

The sole authorized restart request was then submitted. Google operation
`operation-1788532682610-65aa937375801-97851995-dccc69f6`, ID
`5613652379224729892`, reached `DONE` with HTTP 503 and
`ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS`. Its localized message states that
`c2d-standard-32` was unavailable in `us-east1-c`; the error metadata classifies
the cause as `stockout`.

The exact VM remains `TERMINATED`. No upload, SSH, Docker daemon, Docker
image load, build, binary fixture execution, executable inspection, panel
calculation, or P8Q audit occurred. The controller's native-command exception
is preserved locally; the Google operation supplies the missing terminal cause.

## Local evidence

- execution controller SHA-256: `a3d13d06e1a102df100dd198c37e48326e8927cd7212b87ff7b1e76cf4ae454e`;
- instance preflight SHA-256: `f60b7fc4aa95cdf60e8d147b1c029d0f2bee9d57c99f06e7d9443e37336ca1c1`;
- disk preflight SHA-256: `2bbe761d8a964b261d3c2f6aa6ca1d54d5bd5571d8fa1419c653985f009686e1`;
- preexecution marker SHA-256: `66e712e994d7ecf4830acf9155fb28eba14e20803a9f985d1b958b17a14d3168`;
- failure receipt SHA-256: `ff02f0ecd4a0ecfb0bcb4faff849b6f6c52aec171eb2a12e46a713c4276b3de6`;
- procedure exit SHA-256: `4355a46b19d348dc2f57c046f8ef63d4538ebb936000f3c9ee954a27460dd865`.

This is an infrastructure capacity result, not a fixture, numerical, scientific,
or candidate result. P8Q remains `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` and
all authority locks remain false.
