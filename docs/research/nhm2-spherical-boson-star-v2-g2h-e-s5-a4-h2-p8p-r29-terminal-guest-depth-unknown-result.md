Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R29 no-space receipt and SSH handoff result
Current maturity: receipt/SCP passed; SSH remote transaction returned 3 after service-start sequence; VM stopped; guest execution depth unknown
Target maturity: immutable conservative R29 result and stopped-disk evidence-inspection input
Required frozen inputs: R29 proposal/controller, retained VM/disk, key receipt and execution evidence
Required evidence: chronology, receipt equality, SCP, SSH exit, stop, serial-unavailable observation and no overclaim
Stop/fail criteria: R29 consumed; no restart, rerun, retune or inference of unobserved guest state
Explicit non-goals: candidate evaluation, new numerical execution, evidence deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: separately frozen stopped-disk read-only inspection only; P8Q remains stopped

# H2-P8P-R29 terminal guest-depth-unknown result

Status date: September 3, 2026.

Status: **TERMINAL HANDOFF FAIL / VM TERMINATED / GUEST EXECUTION DEPTH UNKNOWN / NO COMPLETE P8Q EVIDENCE**.

The user authorized proposal SHA-256
`b2690012739429b5e59c8a9d1f62fcf49c4d8c13ff9f0ad2bc488e6cab2fbf2b`.
The exact 14,891-byte controller SHA-256
`e7163c720f6850fae9dd4a42499e0ee9f9d880823fd575d80384dec27de88e8e`
executed once.

The immutable local evidence root is
`artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r29-native-openssh-execution-v1-20260903`.
It records start `2026-09-04T03:30:45Z`, terminal receipt
`2026-09-04T03:35:30Z` and exit `1`.

Preexecution and the one restart passed. The no-space receipt was created at
`C:\Users\dan\AppData\Local\NHM2\p8p-r29-known-hosts`, exactly 96 bytes,
SHA-256 `7bf4a0c1174f11dc62783f5af0534f6161dd8240d5cbef5dbd907aafaf68c6e8`.
Its immutable evidence copy has the same size and hash. The single native SCP
returned success and transferred the R29 archive to its new remote filename.

The one SSH transaction then returned remote exit code `3` with no captured
stdout/stderr. Its frozen remote script authenticates and stages the inputs,
writes and starts the R29 systemd oneshot, sleeps five seconds, and finally
calls `systemctl is-active --quiet`. Exit 3 is consistent with that final guard
observing a non-active or still-activating oneshot, but the receipt does not
prove which remote command returned it. The service may have begun guest work.

The failure handler stopped the VM. Its stop receipt is SHA-256
`7934695aeb683743cc8facb07974d20cc2dbf591d20bd868dd7e08feea8c9fdd`;
the exact-instance status is `TERMINATED`. Two subsequent read-only serial
console requests returned `resource ... is not ready`, so no serial evidence
was available to resolve guest depth.

Therefore this result does **not** claim that Docker, build or P=1024 execution
was absent. It also does not claim any completed result. No serial evidence
archive or P8Q audit exists locally. The only legitimate classification is
partial guest execution with depth unknown.

R29 is consumed. The next eligible lead is a separately frozen stopped-disk
read-only inspection: snapshot the retained disk, attach one clone read-only to
one bounded helper, inspect only the R29 systemd journal/status and exact
`/home/pestypig` source/evidence paths, export an immutable diagnostic archive,
then stop the helper. No service, Docker or numerical process may be started.

Candidate authority and positive sampling remain zero. No candidate,
proof, geometry/state, lane, lamp, physical, propulsion or transport authority
is promoted. P8Q remains `P8Q_STOP_GUEST_EXECUTION_DEPTH_UNKNOWN`.
