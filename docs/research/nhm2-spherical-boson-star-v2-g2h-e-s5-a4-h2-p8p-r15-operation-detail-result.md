Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R15 exact start-operation detail result
Current maturity: immutable operation-detail evidence; R12 failed before guest boot on zonal resource-pool exhaustion
Target maturity: preserve the exact capacity failure and select one capacity-aware successor without changing science
Required frozen inputs: R15 packet SHA-256 26d4709a924854d6e2c69547c3527c402148ddb331e5ab4ac0fe0b844105ae9e and exact R12 operation
Required evidence: operation identity, target ID, operation type, terminal status, exact error code/message and chronology
Stop/fail criteria: R15 is consumed after the one detail-link activation and one accessibility read; no retry or resource action
Explicit non-goals: VM start/stop, SSH, upload, Docker, build, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: one separately frozen capacity-aware P8P successor proposal; P8Q remains stopped

# H2-P8P-R15 exact start-operation detail result

Status date: September 2, 2026.

Status: **BLOCKED_PREEXECUTION_ZONE_RESOURCE_POOL_EXHAUSTED / R15 CLOSED**.

The R15 read-only diagnosis packet is SHA-256
`26d4709a924854d6e2c69547c3527c402148ddb331e5ab4ac0fe0b844105ae9e`
and its static audit passed 9/9.

R15 reused the rendered Compute Operations table and activated exactly once
the `start` link in the newest exact-target row. The resulting detail page was
read exactly once and authenticated:

- operation name: `operation-1788359293191-65a80d866c37d-36470319-82f52727`;
- operation ID: `4031327796779650194`;
- operation type: `start`;
- target ID: `1920090043510946854`;
- target: `nhm2-h2-p8j-r9-c2d-32-20260831` in `us-east1-c`;
- user: `pestypig@gmail.com`;
- status: `Done`, progress `100%`;
- insert/start time: `Sep 2, 2026, 10:28:13 AM`;
- end time: `Sep 2, 2026, 10:28:14 AM`;
- error code: `ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS`;
- error message: `A c2d-standard-32 VM instance is currently unavailable in the us-east1-c zone. Try requesting the VM in another zone.`

The terminal cause is therefore Google Compute Engine zonal capacity. It is
not a P8P executable, retained disk, Docker, ingress or scientific failure.
The VM never reached an authenticated running state, so no SSH, upload, Docker
action, build or P=1024 calibration occurred.

R15 performed no start, stop, retry, API query, resource change or fallback.
The R12 start attempt and R15 diagnosis are consumed. A successor must be
separately frozen and capacity-aware; it may not reinterpret this failed start
as scientific evidence.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
