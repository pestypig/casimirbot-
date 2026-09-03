Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R18 Cloud Shell consent and read-only identity authentication
Current maturity: R17 reached an explicit Google credential-consent dialog before terminal availability
Target maturity: consent once and authenticate the retained standalone Cloud Shell transport without resource or file mutation
Required frozen inputs: R17 result SHA-256 2503c7c376faf0a42d2c7e14bafd28f684419004130fedb4d04f44aaa1e698b3 and the retained standalone Cloud Shell tab
Required evidence: exact dialog, exactly one Authorize activation, one terminal input, one read-only health command, exact project/account markers and returned prompt
Stop/fail criteria: wrong dialog, second consent, absent or nonempty terminal, wrong account/project, command ambiguity or first failure terminal; no retry or fallback
Explicit non-goals: upload, Compute Engine resource/API action, bulk request, SCP, SSH, Docker, build, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: one separately authorized R16-equivalent regional calibration execution through the authenticated standalone transport; P8Q remains stopped

# H2-P8P-R18 Cloud Shell consent and authentication

Status date: September 2, 2026.

Status: **FROZEN CONSENT-BOUND READ-ONLY TRANSPORT AUTHENTICATION / ZERO BILLABLE ACTION**.

The immutable R17 result is SHA-256
`2503c7c376faf0a42d2c7e14bafd28f684419004130fedb4d04f44aaa1e698b3`
and independently audits 11/11. It observed, in the sole retained standalone
Cloud Shell tab, exactly one dialog headed `Authorize Cloud Shell`. The dialog
states that Cloud Shell needs permission to use the signed-in credentials to
make Google Cloud API calls and exposes `Authorize` and `Reject` controls. R17
did not activate either control.

R18 may reuse only that retained tab. It must first reobserve the exact dialog
and exactly one enabled semantic `Authorize` control. It may click that control
exactly once. This is explicit authorization to grant Cloud Shell the consent
described by Google's dialog for the signed-in account; it is not permission
to mutate IAM, account membership, project configuration or a Compute Engine
resource.

After the click, wait passively for at most 60 seconds. Require exactly one
terminal input surface and require its current command line to be empty. Enter
exactly one read-only command:

```sh
printf '%s\n' R18_CONNECTION_READY; gcloud config get-value project 2>/dev/null; gcloud auth list --filter=status:ACTIVE --format='value(account)'
```

R18 passes only if output contains, in order, `R18_CONNECTION_READY`,
`dark-stratum-455714-h4`, and `pestypig@gmail.com`, followed by a returned
prompt. Preserve the observable dialog, activation, output and final status as
evidence.

First failure is terminal and consumes R18. Do not activate `Reject`, click a
second control, open or reload a tab, enter a blank, duplicate or additional
command, upload a file, invoke a Compute Engine API, create/start/stop a
resource, or use another transport or fallback.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
