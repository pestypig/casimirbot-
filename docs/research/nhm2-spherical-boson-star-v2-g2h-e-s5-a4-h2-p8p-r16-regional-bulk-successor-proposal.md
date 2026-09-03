Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R16 regional single-VM bulk-capacity successor
Current maturity: P8P implementation/equality proof complete; R12 start failed on one-zone C2D capacity and R15 authenticated the exact provider error
Target maturity: one authenticated candidate-neutral P=1024 turnaround result and P8Q decision, or one immutable terminal R16 record
Required frozen inputs: R15 result, exact one-file R16 ingress archive, unchanged P8P manifest/controller/ledger/executable/auditor and regional C2D allocation grammar
Required evidence: archive/orchestrator identity, one Cloud Shell upload, one regional bulk request, exactly one VM, exact selected-zone/resource bindings, one handoff, one ledger invocation, serial evidence, automatic stop, independent audit and P8Q classification
Stop/fail criteria: first connection, hash, allocation, count, identity, upload, SCP, SSH handoff, Docker, build, execution or evidence failure terminal; no second request, retry, fallback or scientific change
Explicit non-goals: retained-VM restart, candidate evaluation, positive sampling, retuning, P=65,536 execution, G3/SI/metric/lane work, deletion or authority promotion
Downstream gate unlocked: result-conditioned P8Q yes/no decision only; no full representative run or scientific authority

# H2-P8P-R16 regional single-VM bulk-capacity successor

Status date: September 2, 2026.

Status: **FROZEN PREEXECUTION PROPOSAL / NO R16 CLOUD ACTION**.

Change classification: provider-capacity allocation and transport packaging
only. Mathematical semantics and runtime authority are unchanged.

## Evidence-selected cause and response

The immutable R15 result is SHA-256
`cd554add41e7b2932cf76bb546992246a27fdacc94d96feb513cc2982826be1d`
and independently audits 10/10. It proves that R12's exact start operation
failed with `ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS` because
`c2d-standard-32` was unavailable in `us-east1-c`. The VM never booted; no
P8P scientific step ran.

R16 does not retry that zonal start. It uses one regional bulk insertion with
one predefined name, `count=1`, `min-count=1` and `ANY_SINGLE_ZONE`, allowing
Compute Engine to choose among `us-east1-b`, `us-east1-c` and `us-east1-d`
according to available capacity. Google documents that regional bulk creation
selects a zone using available hardware capacity and that failure to meet
`minCount` creates no VM:

- <https://docs.cloud.google.com/compute/docs/instances/multiple/create-in-bulk>
- <https://docs.cloud.google.com/compute/docs/instances/multiple/about-bulk-creation>

This is the smallest cause-specific correction. It changes no equation,
precision, selector, threshold, reduction order, observer event or P8Q rule.

## Frozen one-file ingress

The R16 upload archive is:

| Field | Frozen value |
| --- | --- |
| path | `artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r16-regional-bulk-ingress-v1-20260902/h2-p8p-r16-regional-bulk-upload-v1.tar` |
| bytes | `236,640,768` |
| SHA-256 | `3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5` |
| members | exactly `h2-p8f-c2-r1-cloud-upload-v1.tar`, `h2-p8p-overlay-upload-v1.tar`, `h2_p8p_r2_browser_guest_sequence_v1.sh`, `h2_p8p_r16_cloudshell_orchestrator_v1.sh`, in that order |

The nested identities remain:

- base archive: 236,492,800 bytes, SHA-256
  `fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978`;
- P8P overlay: 134,656 bytes, SHA-256
  `4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e`;
- guest ledger: 2,845 bytes, SHA-256
  `d7f98f542ee776eec9f6d24173031f2b671bb54e59fd74d44d5b637990f536a6`.
- R16 Cloud Shell orchestrator: 6,874 bytes, SHA-256
  `74d2b8ffe2f4501d22fbdb6a88449c5f00a127215e1b8e17aa7da2938c8e2938`;
  Git Bash syntax check PASS.

The wrapper archive changes no nested byte. It exists only to reduce browser
ingress to one authenticated file transfer.

## Exact allocation and execution boundary

R16 may create exactly one temporary on-demand VM:

| Field | Frozen value |
| --- | --- |
| project / region | `dark-stratum-455714-h4` / `us-east1` |
| predefined name | `nhm2-h2-p8p-r16-c2d-32-20260902` |
| count / minimum | `1` / `1` |
| distribution / zones | `ANY_SINGLE_ZONE` / `us-east1-b,c,d` allow |
| machine | exactly `c2d-standard-32`, 32 vCPUs, 128 GB |
| provisioning | `STANDARD` on-demand |
| image | `projects/debian-cloud/global/images/debian-12-bookworm-v20260817` |
| boot disk | exactly 30 GB `pd-standard`, auto-delete |
| provider stop | five hours, termination action `STOP`, no restart on failure |
| aggregate runtime / cost | 18,000 seconds / `$9.00` total ceiling |

Use exactly one authenticated Cloud Shell surface. Require its prompt empty,
then use one browser file chooser to upload only the R16 archive to the
initially absent path
`/home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar`. Authenticate its
regular-file, non-symlink, byte-count and SHA-256 identity. Extract only the
embedded orchestrator to an initially absent temporary path, require its exact
6,874-byte/SHA-256 identity and invoke it exactly once through Bash with the
frozen outer-archive and orchestrator identities as arguments.

The orchestrator requires the exact VM name absent project-wide, no
non-terminated `nhm2-h2-` VM and at least 32 unused regional C2D vCPUs before
the sole synchronous bulk request. It must yield exactly one running
exact-name VM in one allowed zone with every frozen machine, image and disk
binding. Zero or multiple VMs, or any mismatched binding, is terminal.

After one fixed 180-second boot wait, the orchestrator performs exactly one
`gcloud compute scp` of the outer archive and exactly one `gcloud compute ssh`
handoff. The guest reauthenticates the archive, extracts exactly its four
members into an initially absent stage, authenticates all four nested
identities and starts exactly one systemd oneshot as `pestypig` which invokes
the unchanged guest ledger once. This removes interactive browser SSH and a
second file chooser from the critical path.

The ledger conditionally installs Debian `docker.io` only if absent, validates
the 11-entry candidate-neutral manifest, loads only the archived pinned base
images, builds with no pull and no network, requires executable SHA-256
`7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718`,
and invokes exactly one candidate-neutral P=1024 controller with 32 CPUs and a
14,400-second external timeout. Preserve PASS, FAIL, timeout, preexecution
failure or partial output as immutable evidence. The controller automatically
stops the VM. Recover the one serial evidence archive, run the unchanged
independent auditor, and apply only the frozen P8Q trinary rule.

First failure is terminal and consumes R16. There is no retry, second bulk
request, second VM, alternate machine/region/zone/storage/provisioning model,
fallback transport, additional upload, retune or alternate evidence root.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. No result authorizes P=65,536.

## Exact authorization text

> I authorize exactly one H2-P8P-R16 regional single-VM bulk-capacity P=1024 turnaround attempt under proposal SHA-256 `PROPOSAL_SHA256`. Use exactly one authenticated Cloud Shell surface and one browser file chooser to upload only the 236,640,768-byte candidate-neutral archive SHA-256 `3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5`; authenticate its exact four-member inventory and invoke the embedded 6,874-byte orchestrator SHA-256 `74d2b8ffe2f4501d22fbdb6a88449c5f00a127215e1b8e17aa7da2938c8e2938` exactly once. Create exactly one temporary on-demand `c2d-standard-32` Google Compute Engine VM named `nhm2-h2-p8p-r16-c2d-32-20260902` in project `dark-stratum-455714-h4`, region `us-east1`, using one regional bulk request with `count=1`, `min-count=1`, `ANY_SINGLE_ZONE` across `us-east1-b`, `us-east1-c` and `us-east1-d`, exact Debian image `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`, and exactly 30 GB `pd-standard` auto-delete storage, under an 18,000-second aggregate runtime ceiling and a `$9.00` total ceiling. Perform exactly one SCP and one SSH controller handoff; authenticate every nested input; conditionally install Debian `docker.io` only if absent; run the unchanged offline build; require executable SHA-256 `7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718`; and execute exactly one candidate-neutral P=1024 calibration with 32 CPUs and a 14,400-second timeout. Preserve all outcomes as immutable evidence, automatically stop the VM, recover and independently audit the serial evidence, and apply only the frozen P8Q rule. First failure is terminal. I do not authorize retrying R12-R16; a second request, VM, Cloud Shell surface, upload, SCP, SSH handoff, build or numerical process; fallback, resource substitution, alternate region, machine, disk or provisioning model; retuning; frozen-candidate evaluation; positive sampling; P=65,536 execution; evidence deletion; G3/SI/metric/lane work; or any authority promotion.
