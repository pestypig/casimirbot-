Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R19 fresh standalone Cloud Shell consent and read-only identity authentication
Current maturity: R18 exhausted because its required retained standalone tab was absent
Target maturity: open one fresh standalone Cloud Shell tab, consent once and authenticate transport without resource or file mutation
Required frozen inputs: R18 result SHA-256 d732adeb53c92d054ac5e36674743aa130d77e5269c1b883da3630ba5f77f6f0 and official standalone Cloud Shell URL
Required evidence: exactly one fresh tab, exact consent dialog, exactly one Authorize activation, one terminal input, one read-only health command, exact project/account markers and returned prompt
Stop/fail criteria: wrong page/dialog, second tab or consent, absent or nonempty terminal, wrong account/project, command ambiguity or first failure terminal; no retry or fallback
Explicit non-goals: upload, Compute Engine resource/API action, bulk request, SCP, SSH, Docker, build, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: one separately authorized R16-equivalent regional calibration execution through authenticated standalone transport; P8Q remains stopped

# H2-P8P-R19 fresh Cloud Shell consent and authentication

Status date: September 2, 2026.

Status: **FROZEN FRESH-TAB CONSENT-BOUND READ-ONLY AUTHENTICATION / ZERO BILLABLE ACTION**.

The immutable R18 result is SHA-256
`d732adeb53c92d054ac5e36674743aa130d77e5269c1b883da3630ba5f77f6f0`
and independently audits 10/10. It proves only that the formerly retained
standalone tab was absent; no consent or cloud action occurred.

R19 may open exactly one fresh visible in-app-browser tab at:

`https://shell.cloud.google.com/?show=terminal`

After at most 60 seconds of passive rendering, require exactly one dialog
headed `Authorize Cloud Shell` and exactly one enabled semantic `Authorize`
control. Click that control exactly once. This grants only the Cloud Shell
credential permission described by Google's dialog for the signed-in account;
it does not authorize mutation of IAM, account membership, project
configuration or any Compute Engine resource.

Wait passively for at most 60 additional seconds. Require exactly one terminal
input surface with an empty current command line. Enter exactly one read-only
command:

```sh
printf '%s\n' R19_CONNECTION_READY; gcloud config get-value project 2>/dev/null; gcloud auth list --filter=status:ACTIVE --format='value(account)'
```

R19 passes only if output contains, in order, `R19_CONNECTION_READY`,
`dark-stratum-455714-h4`, and `pestypig@gmail.com`, followed by a returned
prompt. Preserve the observable dialog, activation, output and status as
evidence.

First failure is terminal and consumes R19. Do not activate `Reject`, open or
reload a second tab, click a second control, enter a blank, duplicate or
additional command, upload a file, invoke a Compute Engine API,
create/start/stop a resource, or use another transport or fallback.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
