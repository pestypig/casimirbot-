Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R18 Cloud Shell consent preexecution result
Current maturity: R18 authorized but retained standalone Cloud Shell tab absent at initial inventory
Target maturity: immutable first-failure evidence with zero consent, command, file, API or resource action
Required frozen inputs: R18 packet SHA-256 ea4031ad351d0a1d3ab33a6cb117cc24422f0480412bb5a7cc48fda6f33f6243 and initial browser inventory
Required evidence: exact observed tab inventory, absent retained standalone tab, no UI activation and zero downstream action
Stop/fail criteria: retained standalone tab absent is terminal and consumes R18; no new tab, retry or fallback
Explicit non-goals: consent activation, command, upload, Compute Engine action, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: separately frozen fresh-tab consent successor only; P8Q remains stopped

# H2-P8P-R18 retained-tab-absent result

Status date: September 2, 2026.

Status: **BLOCKED_PREEXECUTION_RETAINED_CLOUD_SHELL_TAB_ABSENT / R18 EXHAUSTED**.

R18 was explicitly authorized under packet SHA-256
`ea4031ad351d0a1d3ab33a6cb117cc24422f0480412bb5a7cc48fda6f33f6243`.
Its initial browser inventory exposed exactly one in-app-browser tab: the
retained Compute Engine Details page for
`nhm2-h2-p8j-r9-c2d-32-20260831`. No standalone `shell.cloud.google.com`
tab was present.

R18 required reuse of only the retained standalone Cloud Shell tab and forbade
opening or reloading a tab. Its absence therefore triggered the frozen first-
failure rule before any consent action. No `Authorize` or `Reject` control was
clicked. No terminal command, upload, API request, VM/disk/resource action,
Docker action, build or numerical process occurred.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
