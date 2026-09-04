Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R25 confirmation-stable installed-SDK authentication
Current maturity: SDK and OAuth path authenticated; R24 exhausted after its sole consent tab disappeared across the mandatory confirmation boundary
Target maturity: one authenticated dedicated gcloud account/project identity without Compute Engine mutation
Required frozen inputs: R24 terminal result SHA-256 2987c67419c717f027719ea0d49badf9f107f3cb3834ed82f098b7edd8327c6c, exact SDK 583.0.0 executable and credential-free dedicated configuration
Required evidence: exact installed state, one auth process, one initial browser tab, exact account/scopes, volatile exact consent URL, action-time confirmation, at most one conditional same-transaction reattachment, one Allow, code-only return and read-only account/project identity
Stop/fail criteria: state drift, wrong account/scopes, missing consent URL, failed same-transaction reattachment, code/process failure or any first failure terminal; no authentication retry or fallback
Explicit non-goals: download, extraction, PATH/system change, password automation, key/IAM creation, Compute Engine API/resource action, upload, VM, Docker, build, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: separately authorized R16-equivalent regional P=1024 calibration through authenticated local gcloud; P8Q remains stopped until that calibration

# H2-P8P-R25 confirmation-stable authentication successor

Status date: September 3, 2026.

Status: **FROZEN AUTH-ONLY SUCCESSOR / SEPARATE AUTHORIZATION AND ACTION-TIME ALLOW CONFIRMATION REQUIRED**.

## Preserved evidence and exact local state

R24 is terminal at result SHA-256
`2987c67419c717f027719ea0d49badf9f107f3cb3834ed82f098b7edd8327c6c`.
It reached the exact Google Cloud SDK consent page and received the mandatory
action-time confirmation, but the sole tab disappeared before `Allow` could be
activated. No credential or access-token database was created and no cloud
action occurred.

R25 reuses only:

- executable: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd`
- dedicated configuration: `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config`
- expected top-level inventory: `configurations`, `logs`, `.last_survey_prompt.yaml`, `active_config`, `default_configs.db`, `gce`
- required absent files: `credentials.db`, `access_tokens.db`
- account: `pestypig@gmail.com`
- project: `dark-stratum-455714-h4`

## Exact one-transaction procedure

Require Google Cloud SDK version 583.0.0, the exact configuration inventory,
and both credential files absent. Bind `CLOUDSDK_CONFIG` only to the dedicated
configuration. Start exactly one
`gcloud auth login --account=pestypig@gmail.com --no-launch-browser` process
and open exactly one initial in-app-browser tab at only its generated URL.

Select only the already signed-in `pestypig@gmail.com` account and activate
Google's `Continue` step once. Require the standard Google Cloud SDK consent
page to name the same account and display its App Engine, Cloud data, Cloud SQL
and Compute Engine scopes. Capture the exact final consent URL only in volatile
tool state; do not write it to the repository, logs or user-visible response.
Pause at that exact page for the mandatory action-time user confirmation.

After explicit confirmation to activate `Allow`, first inventory the original
tab. If it still exists at the captured consent URL, activate its one enabled
`Allow` control. If and only if that original tab is absent, open exactly one
replacement in-app-browser tab at the exact volatile captured consent URL,
require the same account, client, scope page and one enabled `Allow` control,
and activate it exactly once. This conditional reattachment resumes the same
OAuth transaction; it is not a second authentication process or a newly
generated authorization URL. If the reconstructed tab does not render the
same consent transaction, stop terminally without another tab or process.

Read only the generated authorization code and send only that code to the one
waiting gcloud process. Require successful authentication. Set `core/project`
to `dark-stratum-455714-h4` only in the dedicated configuration, then run only
local/read-only identity queries and require active account
`pestypig@gmail.com` and exact project `dark-stratum-455714-h4`.

First failure is terminal and consumes R25. No second authentication process,
newly generated authorization URL, second replacement tab, second account
selection, second Continue, second Allow, code resubmission, retry or fallback
is permitted. Do not invoke a Compute Engine API or list, create, start, stop,
modify or delete a cloud resource.

## Scientific and authority boundary

This packet changes only authentication transport planning. It changes no
mathematical semantics, runtime authority, scientific receipt semantics,
candidate identity, selector, threshold, precision, schedule or P8Q rule.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies until a later
separately authorized P=1024 calibration produces authenticated evidence.
