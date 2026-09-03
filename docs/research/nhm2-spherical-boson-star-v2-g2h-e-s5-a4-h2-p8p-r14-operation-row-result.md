Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R14 delayed read-only Compute Operations result
Current maturity: immutable exact operation-row observation; R12 start operation terminated DONE but error detail not exposed
Target maturity: preserve row evidence and select at most one separately frozen exact operation-detail inspection
Required frozen inputs: R14 packet, retained exact Operations tab and R12 target/start chronology
Required evidence: exact target, operation type, user, start/end times, terminal list status and absence of rendered error detail
Stop/fail criteria: list-level DONE is not success authority; no operation link activation without a separate packet
Explicit non-goals: VM start/stop, operation retry, SSH, upload, Docker, build, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: one separately frozen read-only exact operation-detail inspection only; P8Q remains stopped

# H2-P8P-R14 exact start-operation row result

Status date: September 2, 2026.

Status: **EXACT_START_OPERATION_DONE / SUCCESS_UNPROVEN / R14 CLOSED**.

R14 was frozen at SHA-256
`07e4233d09b7f74347d0fb3062d8c1a02165919e4c17b238ee175122d24f7041`
and its static audit passed 8/8.

After the passive render interval, the one authorized read exposed the Compute
Operations table. Its newest row was unambiguously:

- operation summary: `start`;
- target: `nhm2-h2-p8j-r9-c2d-32-20260831`;
- user: `pestypig@gmail.com`;
- local start time: `Sep 2, 2026, 10:28:13 AM UTC-04:00`;
- local end time: `Sep 2, 2026, 10:28:14 AM UTC-04:00`;
- list status: `DONE`;
- accessibility description: `Available. This operation has finished`.

The row links to one zonal operation detail in `us-east1-c`, but the rendered
list contains no success flag, error code or error message. Because the exact
VM remained stopped and SSH-disabled after this operation, list-level `DONE`
cannot be treated as successful VM start.

No link, filter, refresh, API, start, stop or other control was activated. No
SSH, upload, Docker action, build or calculation occurred.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.

The sole next lead is one separately frozen read-only activation of this exact
operation-detail link followed by one accessibility read, with no resource
action.
