Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R15 exact start-operation detail diagnosis
Current maturity: frozen read-only detail inspection; R14 bound exact start row DONE with success unproven
Target maturity: capture the exact operation's rendered success/error fields without cloud mutation
Required frozen inputs: R14 result, retained Operations tab and unique newest start row for exact R12 target
Required evidence: one semantic activation of exact start-operation link, one accessibility read, operation identity/status/error fields and zero resource action
Stop/fail criteria: ambiguity, wrong detail, absent fields or navigation failure terminal; no retry, back, refresh, API or fallback
Explicit non-goals: VM start/stop, operation retry, SSH, upload, Docker, build, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: one cause-specific successor proposal or explicit environment blocker; P8Q remains stopped

# H2-P8P-R15 exact start-operation detail diagnosis

Status date: September 2, 2026.

Status: **FROZEN READ-ONLY DETAIL INSPECTION / ZERO BILLABLE ACTION**.

R14 result SHA-256
`7ee62c6eac0ac84828f86e38de2e0a96a4e988ed1ab29ec883fe519f12aaeb89`
independently audits 10/10. R15 may reuse only the retained Operations tab and
activate exactly once the unique `start` link in the newest exact-target row:
VM `nhm2-h2-p8j-r9-c2d-32-20260831`, user `pestypig@gmail.com`, start
`Sep 2, 2026, 10:28:13 AM UTC-04:00`, end `10:28:14 AM`, status `DONE`,
zone `us-east1-c`.

After navigation it may perform exactly one accessibility read and report the
rendered operation identity, terminal status, error code and error message. It
may not click another control, go back, refresh, type, query an API, start or
stop a resource, retry or use a fallback.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
