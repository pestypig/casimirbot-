Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R10 in-app-browser authentication and semantic-control preflight
Current maturity: frozen read-only transport preflight; R9 exhausted before page creation
Target maturity: determine whether one exact in-app-browser Details page is already authenticated and exposes the exact stopped resource and semantic Start control
Required frozen inputs: R9 terminal result, exact Google Cloud Details URL, exact retained stopped P8J-R9 identity and available in-app-browser provider
Required evidence: one fresh visible in-app-browser tab, rendered authentication state, exact resource/state fields if present and Start-control count/state without activation
Stop/fail criteria: login, consent, account chooser, challenge, page error, identity mismatch or absent/ambiguous control terminal; no input, click, refresh, retry or alternate transport
Explicit non-goals: authentication, VM start, confirmation, SSH, upload, Docker, build, calibration, candidate evaluation, retuning, P=65,536, deletion, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: one result-conditioned separately frozen IAB start successor, or an explicit operator-authentication blocker; P8Q remains stopped

# H2-P8P-R10 in-app-browser authentication preflight

Status date: September 2, 2026.

Status: **FROZEN READ-ONLY PREFLIGHT / ZERO BILLABLE ACTION**.

## Basis and exact scope

R9 exhausted before page creation because the requested Chrome provider was
unavailable. Its immutable result is SHA-256
`72494474900e0f99cbfec9c21d9d6c9ab3b3b85d2336ddb22d84c9bfeaeb547d`
and independently audits 15/15. The controller inventory did expose exactly one
Codex in-app-browser provider with zero tabs.

R10 may create exactly one visible in-app-browser tab at:

```text
https://console.cloud.google.com/compute/instancesDetail/zones/us-east1-c/instances/nhm2-h2-p8j-r9-c2d-32-20260831?project=dark-stratum-455714-h4
```

After the initial page load, R10 may perform exactly one accessibility read.
It may not click, type, paste, refresh, navigate, select an account, accept a
consent, answer a challenge, activate `Start / Resume` or use another browser.

If the page is already authenticated, the observation must bind the exact VM
`nhm2-h2-p8j-r9-c2d-32-20260831`, project `dark-stratum-455714-h4`, zone
`us-east1-c`, instance ID `1920090043510946854`, stopped state,
`c2d-standard-32`, Debian `v20260817`, 30 GB Standard persistent disk and
exactly one enabled semantic `Start / Resume` control. The control remains
unactivated. A future billable successor still requires separate frozen scope
and action-time authorization.

Any login, account chooser, consent, challenge, error, identity mismatch or
absent/duplicate/disabled control yields only a terminal read-only preflight
result. No cloud resource changes and no Google Compute request are authorized.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
