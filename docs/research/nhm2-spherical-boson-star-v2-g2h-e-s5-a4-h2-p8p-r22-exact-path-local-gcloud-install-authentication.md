Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R22 exact-path user-local Google Cloud CLI installation and authentication
Current maturity: R21 exhausted before action because executable and credential paths were not exact
Target maturity: hash-authenticated local gcloud transport with exact account/project identity and no Compute Engine mutation
Required frozen inputs: R21 result SHA-256 d202ecf2e11ae15b219503ef0a3d4f449af27609ac77b9ecf68d7070797faf4f and official Google Cloud CLI 583.0.0 bundled-Python Windows archive
Required evidence: exact paths, archive SHA-256, x64 host, extraction inventory, executable version, one browser authentication, dedicated credential state and read-only identity
Stop/fail criteria: any target path initially present, hash/version mismatch, wrong account/project, additional permission request or first failure terminal; no retry or fallback
Explicit non-goals: PATH/system mutation, telemetry, extra components, Compute Engine API/resource action, upload, VM, Docker, build, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: separately authorized R16-equivalent regional calibration through exact local gcloud transport; P8Q remains stopped

# H2-P8P-R22 exact-path local gcloud installation and authentication

Status date: September 3, 2026.

Status: **FROZEN EXACT-PATH USER-LOCAL TRANSPORT INSTALL/AUTH / ZERO BILLABLE ACTION**.

The immutable R21 result is SHA-256
`d202ecf2e11ae15b219503ef0a3d4f449af27609ac77b9ecf68d7070797faf4f`
and independently audits 11/11. R22 corrects only the missing local path
bindings. The official package URL, version and SHA-256 remain unchanged.

## Exact local bindings

- tooling root: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0`
- archive: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\google-cloud-sdk-583.0.0-windows-x86_64-bundled-python.zip`
- extraction root: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk`
- executable: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd`
- dedicated configuration: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config`
- package URL: `https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-583.0.0-windows-x86_64-bundled-python.zip`
- package SHA-256: `2394aa3fe69697fda1aa418990f49139a3f01dcab7eaef68258abd3118b1a155`

Require the tooling root and dedicated configuration path both initially
absent. Creating their shared parent `C:\Users\dan\AppData\Local\NHM2` if
absent is permitted. Download the package exactly once to the exact archive
path, hash it before extraction, extract exactly once to the exact extraction
root and require the exact executable. Do not run an installer, modify PATH or
system settings, enable telemetry, or install an optional component.

With `CLOUDSDK_CONFIG` bound only to the exact dedicated configuration path,
require `gcloud.cmd version` to report Google Cloud SDK 583.0.0. Invoke exactly
one `gcloud auth login --account=pestypig@gmail.com --no-launch-browser` flow.
Open only its generated Google authentication URL in exactly one fresh
in-app-browser tab, select only the already signed-in `pestypig@gmail.com`
account, accept only the standard Google Cloud SDK account-access consent, and
return only the generated authorization code to the waiting local gcloud
process. Do not automate a password or password-manager surface.

After authentication, set `core/project` to `dark-stratum-455714-h4` only in
the dedicated R22 configuration. Run only local/read-only configuration and
account identity queries and require exactly active account
`pestypig@gmail.com` and exact project `dark-stratum-455714-h4`. Do not invoke
a Compute Engine API or list/create/start/stop a cloud resource.

First failure is terminal and consumes R22. Do not retry authentication,
download, extraction or any command; use no alternate package, path, account,
project, browser, transport or fallback.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
