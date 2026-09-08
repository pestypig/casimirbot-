Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral evidence retrieval
Capability or component: R42 capacity-checked retrieval of retained R40 archive
Current maturity: implementation tested locally; no R42 cloud execution
Target maturity: authenticated local fixture evidence and independently observed stopped helper
Required frozen inputs: R40 receipt and archive identity, exact retained helper/original identities, five-file R42 runtime manifest
Required evidence: local capacity, account/resource identity, bounded command receipts, archive byte/hash agreement, exclusive publication, cleanup status
Stop/fail criteria: first failed identity/capacity/command/hash/publication; no numerical retry or alternate resources; unresolved stop remains a failure
Explicit non-goals: original VM restart, new resources, upload, mount, rescue rerun, build/numerical execution, candidate evaluation, evidence deletion, authority promotion
Downstream gate unlocked: local inspection of the recovered R39 fixture logs to identify the next supported correction

# R42 bounded retrieval proposal

September 5, 2026. Prepared for separate user authorization; not executed.

## Resource and cost boundary

Project dark-stratum-455714-h4; zone us-east1-b. Require original VM
nhm2-h2-p8p-r32-e2-4-20260904 (1893159507643031574) and retained helper
nhm2-h2-p8p-r39-rescue-e2-small-20260904 (7129462452423922626) stopped before
any start. Require the helper e2-small and its 10 GB boot disk, plus retained
nhm2-h2-p8p-r39-evidence-clone-20260904 attachment in READ_ONLY mode.

Authorize at most one helper start and one SCP. The original VM is never
started. The helper restart window is 1,200 seconds with a $0.10 compute
ceiling. R42 creates no cloud resource and changes no disk attachment.
Existing storage remains retained and continues to incur storage charges;
deletion is outside this proposal.

## Exact payload and local destinations

Read only /home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz from
the helper. Require 12,122 bytes and SHA-256
73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922.
Authenticate the existing 107-byte R40 rescue receipt before starting.

Require fresh C:\NHM2-R42 and fresh repository capture directory
artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r42-retrieval-v1-20260905.
Within C:\NHM2-R42, create one unique download-* directory for r40.tgz. After
verification, publish r40.tgz exclusively into the new R42 repository capture.
Do not add to or overwrite R41/R40 captures. Preserve partial downloads.

## Frozen implementation

Run exactly once:

```text
node tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r42_execute.mjs --execute-once
```

Entrypoint: 1,281 bytes, SHA-256
7b5803fa2e7cfdc67972018387e35b4b7e0794300680ec9c3ae6b6c7d7511443.
Authenticate h2_p8p_r42_manifest.json before invoking it; manifest SHA-256
401d8174c65d642782a2fca7f1039eb388191553a0e5544f8813983ddb781bab.
The entrypoint authenticates all five runtime files against that manifest
before importing the adapter. Prior controllers remain immutable.

Use only the retained SDK 583.0.0 bundled Python and gcloud.py with the existing
dedicated configuration/account pestypig@gmail.com. No installation, login,
PATH change, IAM or project configuration change is included.

## Execution and failure handling

Require 256 MiB free before creating receipts, immediately before start, and
again before download. Record start intent before dispatch, so an ambiguous
start response enters cleanup. Use a fixed 120-second startup wait. Bound
operational cloud subprocesses to at most 120 seconds; reserve 300 seconds of
the restart window for cleanup. Terminate local subprocess trees on timeout.
Stop the helper on success or failure and separately read its identity/status.
Do not treat a transport exit code as a guest predicate result.

Write receipts and publish the archive with exclusive file creation. Emit the
terminal result to the calling console as well as the local capture, so disk
exhaustion cannot silently erase the model-visible outcome. A failed stop,
failed status observation or failed result persistence is unresolved and must
not be reported as completion. Local command deadlines cannot guarantee remote
shutdown during an API outage; such an outcome requires immediate operator
attention, with no success claim or automatic retry.

## Verification and continuation

Twenty-six local tests pass across retrieval flow, cloud-adapter composition,
exclusive filesystem writes, and real subprocess termination (including a
descendant). The injected test cloud interface performs no external action.
The actual installed SDK version command returned 583.0.0 through bundled
Python. These are operational tests, not a scientific or Casimir certificate.

After verified recovery and helper stop, inspect the archive locally under
bounded extraction/path validation to classify the existing fixture failure.
Do not rerun the fixture or infer its cause from exit 101 alone. First failure
is terminal for R42. Any later billable execution needs its own authorized
scope. All scientific, physical, propulsion and transport authority remains
unchanged.
