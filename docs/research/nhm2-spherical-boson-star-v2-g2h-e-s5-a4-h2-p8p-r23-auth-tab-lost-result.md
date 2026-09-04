Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R23 local gcloud extraction and authentication result
Current maturity: archive/executable authenticated; OAuth consent not granted because the sole auth tab disappeared before action-time confirmation
Target maturity: immutable partial result with zero credentials and separately frozen auth-only successor
Required frozen inputs: R23 packet SHA-256 03e46647ca3e05e373bac3d8bc511cb424e13671f6c557500e1c0e1bbd0eacb1 and preserved local SDK/configuration state
Required evidence: extraction/version success, one auth process and tab, consent page reached, no Allow activation, terminated process, absent credential databases and zero cloud-resource action
Stop/fail criteria: missing sole auth tab is terminal and consumes R23; no second tab, authentication retry or fallback
Explicit non-goals: permission grant, credential creation, Compute Engine action, upload, VM, calculation, candidate evaluation, retuning, deletion or authority promotion
Downstream gate unlocked: separately frozen auth-only successor using the installed SDK; P8Q remains stopped

# H2-P8P-R23 authentication-tab-lost result

Status date: September 3, 2026.

Status: **PARTIAL_EXTRACTION_PASS / BLOCKED_AUTH_TAB_LOST / R23 EXHAUSTED**.

R23 was explicitly authorized under packet SHA-256
`03e46647ca3e05e373bac3d8bc511cb424e13671f6c557500e1c0e1bbd0eacb1`.
Its unchanged audit passed 18/18 immediately before action.

The preserved x64 archive authenticated at exactly 101,597,540 bytes, ZIP
signature `504b0304`, and SHA-256
`25fe2511abdf05d514bbb67859475e7e76acc1f36c0bcac37232e1e34892d768`.
It was extracted exactly once to the frozen extraction root. The exact
`gcloud.cmd` executable reported Google Cloud SDK `583.0.0`.

Exactly one `gcloud auth login --account=pestypig@gmail.com
--no-launch-browser` process was started and exactly one fresh in-app-browser
authentication tab was opened. The already signed-in `pestypig@gmail.com`
account was selected and Google's `Continue` step was activated. The final
Google Cloud SDK `Allow` page rendered its standard App Engine, Cloud data,
Cloud SQL and Compute Engine scopes. It was not activated before the required
action-time confirmation.

After the user supplied `click allow`, a fresh browser inventory showed that
the sole authentication tab no longer existed. R23 prohibited a second tab or
authentication retry. No `Allow` activation occurred. The waiting local auth
process was terminated by keyboard interrupt and its batch termination was
confirmed; it exited nonzero.

The dedicated configuration root contains only configuration/log scaffolding:
`configurations`, `logs`, `.last_survey_prompt.yaml`, `active_config`,
`default_configs.db`, and `gce`. No credential or access-token database is
present. No account was authenticated and no project was set. No Compute
Engine API call, upload, VM/disk/resource action, Docker action, build or
numerical process occurred.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
