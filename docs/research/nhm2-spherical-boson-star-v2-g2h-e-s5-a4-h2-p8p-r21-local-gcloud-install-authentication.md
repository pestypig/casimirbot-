Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R21 user-scoped Google Cloud CLI installation and read-only authentication
Current maturity: Cloud Shell consent succeeded but weekly quota blocks terminal creation; no local gcloud installation exists
Target maturity: hash-authenticated local gcloud transport with exact signed-in account/project identity and no Compute Engine mutation
Required frozen inputs: R20 result SHA-256 46ce3c07e03e174b4c54c3b4c10a9a94545da2bf4d81715b55e13e2d696d756c and official Google Cloud CLI 583.0.0 bundled-Python Windows archive
Required evidence: exact download URL, archive SHA-256, x64 host, bounded user-local extraction, executable version, explicit browser authentication, active account and read-only project identity
Stop/fail criteria: hash/version mismatch, unexpected installer behavior, wrong account/project, additional permission request or first failure terminal; no retry or fallback
Explicit non-goals: PATH/system-setting mutation, telemetry opt-in, extra component install, upload, Compute Engine resource action, VM, Docker, build, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: separately authorized R16-equivalent regional calibration execution through local gcloud; P8Q remains stopped

# H2-P8P-R21 local gcloud installation and authentication

Status date: September 2, 2026.

Status: **FROZEN USER-SCOPED TRANSPORT INSTALL/AUTH PREFLIGHT / ZERO BILLABLE ACTION**.

The immutable R20 result is SHA-256
`46ce3c07e03e174b4c54c3b4c10a9a94545da2bf4d81715b55e13e2d696d756c`
and independently audits 12/12. It establishes that the Cloud Shell quota
dialog did not reveal a reset timestamp. A read-only workstation inventory
established Windows x64, more than 21 GB free on C:, and no `gcloud` command or
standard Google Cloud CLI installation.

Google's versioned-archive documentation identifies this exact package:

- URL: `https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-583.0.0-windows-x86_64-bundled-python.zip`
- expected SHA-256: `2394aa3fe69697fda1aa418990f49139a3f01dcab7eaef68258abd3118b1a155`
- documented size: approximately 98.8 MB

Source: <https://docs.cloud.google.com/sdk/docs/downloads-versioned-archives>

R21 may download that archive exactly once to a dedicated initially absent
user-local NHM2 tooling directory, verify its SHA-256 before extraction, and
extract it exactly once beneath the same directory. It must not run the
interactive system installer, add or change PATH, install optional components,
enable telemetry, or alter another gcloud installation.

Require the extracted `gcloud.cmd` to report version 583.0.0. Use a dedicated
initially absent R21 configuration directory so existing Google Cloud CLI
credentials and settings cannot be overwritten. Run exactly one interactive
`gcloud auth login` flow for `pestypig@gmail.com`; browser-based login and the
standard Google Cloud SDK account-access consent are authorized only under a
separate action-time authorization. Do not create API/OAuth keys or service
accounts and do not modify IAM.

After authentication, run only read-only identity commands and require active
account `pestypig@gmail.com` and project `dark-stratum-455714-h4`. Setting that
project only in the dedicated R21 configuration is permitted. Do not invoke a
Compute Engine API or list/create/start/stop any cloud resource.

First failure is terminal and consumes R21. No retry, alternate package,
installer, account, project, configuration directory, transport or fallback.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
