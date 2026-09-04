Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R24 installed-SDK authentication with preserved consent-tab handoff
Current maturity: SDK 583.0.0 authenticated locally; R23 OAuth flow ended before permission grant and stored no credentials
Target maturity: one authenticated dedicated gcloud account/project identity with action-time consent and no Compute Engine mutation
Required frozen inputs: R23 result SHA-256 842a8e4d6aad3e28bd618e829b969a0cd05d274ff22d85101cf9f848406c5a4a, exact installed executable and credential-free configuration inventory
Required evidence: exact installed version, credential absence, one auth process/tab, exact account and scopes, preserved handoff before Allow, one action-time confirmation, authorization-code return and read-only account/project identity
Stop/fail criteria: installed/config state drift, wrong account/scopes, missing tab, code/process failure or first failure terminal; no retry or fallback
Explicit non-goals: download, extraction, PATH/system change, password automation, key/IAM creation, Compute Engine API/resource action, upload, VM, Docker, build, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: separately authorized R16-equivalent regional calibration through authenticated local gcloud; P8Q remains stopped

# H2-P8P-R24 auth-only preserved handoff

Status date: September 3, 2026.

Status: **FROZEN AUTH-ONLY SUCCESSOR / ACTION-TIME ALLOW CONFIRMATION REQUIRED**.

The immutable R23 result is SHA-256
`842a8e4d6aad3e28bd618e829b969a0cd05d274ff22d85101cf9f848406c5a4a`
and independently audits 13/13. It proves the SDK extraction and version while
also proving that no OAuth credential was stored.

Exact retained inputs:

- executable: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd`
- dedicated configuration: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config`
- expected top-level inventory: `configurations`, `logs`, `.last_survey_prompt.yaml`, `active_config`, `default_configs.db`, `gce`
- required absent files: `credentials.db`, `access_tokens.db`
- account: `pestypig@gmail.com`
- project: `dark-stratum-455714-h4`

Require the exact executable and Google Cloud SDK version 583.0.0. Require the
exact configuration inventory and credential files absent. With
`CLOUDSDK_CONFIG` bound only to that configuration, start exactly one `gcloud
auth login --account=pestypig@gmail.com --no-launch-browser` process and open
exactly one fresh in-app-browser tab at only its generated URL.

Select only the already signed-in `pestypig@gmail.com` account and activate the
Google `Continue` step once. Require the standard Google Cloud SDK consent page
to name the same account and display its App Engine, Cloud data, Cloud SQL and
Compute Engine scopes. Before activating `Allow`, mark that exact tab for
cross-turn handoff and pause for the mandatory action-time user confirmation.
Do not terminate the waiting gcloud process during that permitted pause.

Only after the user explicitly says to click `Allow` while that exact page and
process remain present may R24 activate `Allow` exactly once. Read only the
generated authorization code, send only that code to the one waiting gcloud
process, and require successful authentication. Set `core/project` to
`dark-stratum-455714-h4` only in the dedicated configuration, then run only
local/read-only identity queries and require active account
`pestypig@gmail.com` and exact project `dark-stratum-455714-h4`.

First failure is terminal and consumes R24. No second process, tab, account
selection, Continue, Allow activation, code submission, retry or fallback. Do
not invoke a Compute Engine API or list/create/start/stop a cloud resource.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
