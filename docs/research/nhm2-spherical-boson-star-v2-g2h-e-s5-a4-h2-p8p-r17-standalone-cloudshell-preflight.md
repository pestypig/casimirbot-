Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R17 standalone Cloud Shell authentication preflight
Current maturity: R16 exhausted before upload because the embedded console panel did not appear
Target maturity: authenticate one standalone terminal surface without cloud-resource or file mutation
Required frozen inputs: R16 result and official standalone Cloud Shell URL
Required evidence: one fresh standalone in-app tab, one terminal render, one read-only account/project health command and exact markers
Stop/fail criteria: sign-in prompt, absent terminal, wrong account/project, command ambiguity or first failure terminal; no retry or fallback
Explicit non-goals: upload, VM/disk/resource action, bulk request, SCP, SSH, Docker, build, calculation, candidate evaluation, retuning, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: one separately authorized R16-equivalent regional execution using the authenticated standalone transport; P8Q remains stopped

# H2-P8P-R17 standalone Cloud Shell authentication preflight

Status date: September 2, 2026.

Status: **FROZEN READ-ONLY TRANSPORT PREFLIGHT / ZERO BILLABLE ACTION**.

R16 result SHA-256
`a4694fe2979c472602406ff7d79b6b38480a4ad0b8c2d51cf2177b8ab22d09e9`
independently audits 13/13. It establishes only that the embedded Cloud Shell
panel was not observable; it did not test the standalone Cloud Shell product.

Google documents `shell.cloud.google.com` as the standalone Cloud Shell entry
point and states that it automatically starts the terminal and authenticates
the signed-in Google credentials:

- <https://docs.cloud.google.com/shell/docs/launching-cloud-shell>

R17 may open exactly one fresh visible in-app browser tab at:

`https://shell.cloud.google.com/?show=terminal`

It may wait up to 60 passive seconds for rendering. If a terminal input is
unambiguously present and initially empty, enter exactly one read-only command:

```sh
printf '%s\n' R17_CONNECTION_READY; gcloud config get-value project 2>/dev/null; gcloud auth list --filter=status:ACTIVE --format='value(account)'
```

The preflight passes only if the output contains, in order,
`R17_CONNECTION_READY`, `dark-stratum-455714-h4`, and
`pestypig@gmail.com`, followed by a returned prompt. It changes no gcloud
configuration and performs no Compute Engine API operation.

First failure is terminal and consumes R17. Do not open a second tab, reload,
retry, upload, use the editor, enter another command, create/start/stop a
resource, or use another transport.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
