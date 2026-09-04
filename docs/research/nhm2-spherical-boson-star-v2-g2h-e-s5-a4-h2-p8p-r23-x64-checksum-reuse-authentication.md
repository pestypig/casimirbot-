Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R23 authenticated x64 archive reuse, extraction and local gcloud login
Current maturity: R22 preserved one official x64 archive matching Google's current x64 row; extraction and authentication absent
Target maturity: exact local gcloud transport with dedicated account/project identity and no Compute Engine mutation
Required frozen inputs: R22 result SHA-256 4fdbfdbe32c7c94408fa3a6fc5b867a80cf90ea850f72a8648bf5cfaad093afc and preserved 101597540-byte archive SHA-256 25fe2511abdf05d514bbb67859475e7e76acc1f36c0bcac37232e1e34892d768
Required evidence: exact reuse-only archive authentication, absent extraction/config roots, exact extraction, executable version, one browser authentication and read-only account/project identity
Stop/fail criteria: archive/path/hash/version mismatch, wrong account/project, unexpected permission request or first failure terminal; no retry, download or fallback
Explicit non-goals: second download, PATH/system mutation, telemetry, extra components, Compute Engine API/resource action, upload, VM, Docker, build, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: separately authorized R16-equivalent regional calibration through local gcloud; P8Q remains stopped

# H2-P8P-R23 x64 checksum correction and reuse

Status date: September 3, 2026.

Status: **FROZEN REUSE-ONLY X64 EXTRACTION/AUTHENTICATION / ZERO BILLABLE ACTION**.

The immutable R22 result is SHA-256
`4fdbfdbe32c7c94408fa3a6fc5b867a80cf90ea850f72a8648bf5cfaad093afc`
and independently audits 14/14. Google's current authoritative Windows x64
bundled-Python row exactly matches the preserved archive's byte count and
SHA-256. R23 changes only the corrected expected hash and reuse state; it
authorizes no second download.

Exact bindings:

- preserved archive: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\google-cloud-sdk-583.0.0-windows-x86_64-bundled-python.zip`
- required bytes: `101597540`
- required SHA-256: `25fe2511abdf05d514bbb67859475e7e76acc1f36c0bcac37232e1e34892d768`
- extraction root: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk`
- executable: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd`
- dedicated configuration: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config`

Require the archive to be a regular file with exact bytes, ZIP signature and
SHA-256. Require extraction and configuration paths initially absent. Extract
exactly once to the exact extraction root and require the executable to report
Google Cloud SDK 583.0.0. Do not run an installer, modify PATH or system
settings, enable telemetry, or install optional components.

With `CLOUDSDK_CONFIG` bound only to the exact dedicated configuration path,
invoke exactly one `gcloud auth login --account=pestypig@gmail.com
--no-launch-browser` flow. Open only its generated Google authentication URL in
exactly one fresh in-app-browser tab, select only the already signed-in
`pestypig@gmail.com` account, accept only standard Google Cloud SDK account
access, and return only its generated authorization code to the waiting local
gcloud process. Do not automate a password or password-manager surface.

After authentication, set `core/project` to `dark-stratum-455714-h4` only in
the dedicated configuration. Run only local/read-only configuration and
account identity queries and require active account `pestypig@gmail.com` and
project `dark-stratum-455714-h4`. Do not invoke a Compute Engine API or
list/create/start/stop a cloud resource.

First failure is terminal and consumes R23. No retry, download, alternate
package, path, account, project, browser, transport or fallback.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
