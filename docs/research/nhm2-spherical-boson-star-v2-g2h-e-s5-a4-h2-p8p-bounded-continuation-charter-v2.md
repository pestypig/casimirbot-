Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral evidence recovery, build correction and turnaround decision
Capability or component: bounded autonomous operating authority, version 2
Current maturity: proposal only; not authorized or executed
Target maturity: authenticated fixture PASS followed by one P=1024 calibration and frozen P8Q decision
Required frozen inputs: retained archive and VM identities, P8P scientific implementation, P8Q rule, per-attempt manifests
Required evidence: real-client preflight, independent review, immutable execution ledger, archive/binary authentication, verified stops
Stop/fail criteria: trust ambiguity, scientific mismatch, exhausted budget or attempts, unsafe cleanup, missing frozen inputs
Explicit non-goals: frozen-candidate evaluation, retuning, P=65,536, evidence deletion, G3/SI/metric/lane work, authority promotion
Downstream gate unlocked: P8Q yes/no proposal-readiness decision only

# Bounded continuation charter v2 — proposed

This document is a request for one operating authorization, not an execution
receipt. User approval of its exact SHA-256 is required. Preparation, hashing
and a generic continuation message do not activate it. It does not unconsume
R1–R43 or authorize rerunning their exhausted controllers.

It is subordinate to the canonical work program and the
[transport exit plan](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-transport-exit-plan.md).
It preserves the active scientific gate and objective. On approval, the charter
supplies the separate operating authority required for the bounded future
attempts below; a new user prompt is not required for every implementation
revision, hash, reviewed attempt or stage transition within these bounds.
Historical proposal restrictions still govern historical attempts.

## Objective and success criteria

Recover and authenticate existing R39 fixture evidence; classify its failure;
correct only demonstrated candidate-neutral infrastructure defects; obtain
an authenticated passing build fixture; then execute one unchanged P=1024
turnaround calibration and apply the frozen P8Q decision rule.

Success is evidence for these milestones, not a quota of proposals or tests.
P8Q NO is a legitimate decision and must not trigger numerical retuning.
Transport completion is not simulation completion. Scientific, physical,
propulsion and transport authority stays unchanged throughout.

## Account and resource envelope

Use only existing dedicated SDK 583.0.0 configuration for pestypig@gmail.com,
project dark-stratum-455714-h4. No account switch, new credential, login consent,
IAM, firewall, metadata, trust-cache, project or quota modification is granted.
Read-only resource/cost/status queries needed to enforce this charter are allowed.

Retained resources eligible for scoped restarts:

| Purpose | VM / identity | Location and fixed configuration |
| --- | --- | --- |
| Existing archive retrieval | nhm2-h2-p8p-r39-rescue-e2-small-20260904 / 7129462452423922626 | us-east1-b; e2-small; existing 10 GB boot disk and existing 30 GB clone attached READ_ONLY |
| Build-only fixture | nhm2-h2-p8p-r32-e2-4-20260904 / 1893159507643031574 | us-east1-b; e2-standard-4; existing 30 GB pd-standard boot disk |

The helper may read only the existing
/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz:
12,122 bytes, SHA-256
73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922.
No new mount, attachment, rescue, snapshot or archive recreation is allowed.

After authenticated build PASS and calibration preflight, allow at most one
creation request for one temporary on-demand VM
nhm2-h2-p8p-charter-v2-c2d-32 in us-east1-c: c2d-standard-32, exact image
projects/debian-cloud/global/images/debian-12-bookworm-v20260817,
30 GB pd-standard boot disk with auto-delete disabled. Check the image and
machine availability read-only before proposing readiness. No alternative
image, zone, machine, provisioning model, resize or second creation request.
This is a proposed resource, not a claim that capacity currently exists.

No other VM may be started or created. No concurrent VM operation under this
charter. Previously retained scientific disks, snapshots, evidence and other
VMs remain untouched. Verify identities and startup behavior before restart;
if old startup services could launch numerical work or mutate evidence, stop
and request direction rather than disabling them under this charter.

## Aggregate limits — not renewed per attempt

Proposed incremental total cost ceiling: USD 12.00. Proposed total summed
VM-running ceiling: 21,600 seconds (six hours) across all eligible resources
and all attempts. Never replenish either allowance automatically.
Do not start if a conservative current-price estimate of the entire remaining
attempt, cleanup reserve and newly created disk retention exceeds the remainder.
Verify official rates at execution planning time; this document asserts no
current hourly price. If rates or runtime cannot be bounded, do not start.

The $12 includes activated compute and prorated storage of any newly created
disk for seven days. Existing retained-storage charges are not new charges
authorized here and continue independently. Report them separately when known.
Cloud billing may lag; maintain a conservative local ledger rather than treating
an unchanged bill as unused budget. Approval expires seven days after approval;
in-flight work must stop before that expiry. Retain resources afterward and
request a separate retention/deletion decision; do not silently delete or
promise storage charges cease when a VM stops.

| Stage | Maximum attempts | Per-attempt running ceiling |
| --- | --- | --- |
| Retrieval/diagnosis | 2 helper restarts total | 1,200 seconds each |
| Build-only | 2 starts/runs total | 3,600 seconds each |
| Calibration environment | 1 VM creation/start | 18,000 seconds |

These are upper bounds, not additive entitlements. The six-hour/$12 aggregate
limits dominate the table. Reserve at least 300 seconds inside each active
runtime window for cleanup. The numerical process timeout is at most 14,400
seconds and must also fit the remaining aggregate allowance and cleanup reserve.
Stop idle VMs promptly after each attempt; preparation/review happens locally.

## Autonomous local work and review

Allow read-only diagnosis, candidate-neutral source/document/test edits,
small local synthetic fixtures, installed-SDK/client tests, manifest creation,
bounded archive inspection and isolated local build checks. No local full
selector or representative numerical workload may substitute for cloud limits.
Use fresh attempt directories, short transport paths and exclusive writes.
Require at least 1 GiB free before new local staging; cap new local staging
under this charter at 2 GiB. Do not delete prior artifacts to satisfy the cap.

Independent reviewer work on the bounded infrastructure patch is permitted.
The reviewer must examine actual SDK/client behavior, captured inputs and
failure cleanup, not merely repeat a producer's assertions. Identify shared
runtime limitations; do not call such review independent scientific replay.
Review does not grant authority to broaden this charter.

Freeze each new attempt's source inventory, command, file sizes/hashes,
resource identity, remaining allowance and stop conditions before dispatch.
Local revision and review may continue without a user prompt; exhausted
attempt artifacts must never be edited into a new success.

## Stage conditions and permitted self-correction

1. Test the actual installed SDK argument construction and client batch/error
   behavior locally before the first helper restart. Keep force-connect off;
   no acceptance of unknown/mismatched host keys or credential prompts.
2. First retrieval attempt either authenticates the archive or preserves a
   bounded explicit diagnostic and stops. If it fails, a documented transport
   design review is mandatory before the second attempt. A second attempt is
   allowed without another user prompt only when local tests demonstrate a
   correction within the same resource/transport/trust scope. Unresolved host
   identity is an immediate user blocker, not permission to accept a key.
3. Inspect the recovered archive with type/path/size validation, authenticate
   nested evidence and classify the actual build failure. No guess from exit
   101 alone. Two build-only attempts may upload only a reviewed, hash-manifested
   candidate-neutral inventory: existing pinned build dependencies plus the
   minimal infrastructure repair. At most 300 MB per build upload; preserve
   prior remote sources/evidence, use isolated new build locations and no-pull,
   no-network compilation. Existing Docker only on the retained build VM.
4. A non-scientific packaging/transport/build failure may justify the second
   build attempt after local reproduction and review. Numerical mismatch,
   changed scientific outputs or failure to reproduce executable SHA-256
   7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718
   blocks calibration; never replace the expected hash to make it pass.
5. On build PASS, authenticate the complete existing P8P calibration definition
   and P8Q rule, including precision, schedule, output equivalence, chronology
   and all thresholds. Missing or inconsistent definitions are a blocker, not
   discretion to choose new values. Upload only the reviewed candidate-neutral
   calibration inventory, at most 300 MB, to the one proposed calibration VM.
   Conditional Debian docker.io installation is allowed there only if absent;
   load pinned archived bases and build offline. Verify the unchanged executable
   hash before one P=1024 process with 32 CPUs. Authenticate progress/evidence
   export and automatic shutdown before launching the numerical process.
6. There is exactly one numerical process allowance. PASS, FAIL, timeout or
   partial output consumes it. No numerical retry, precision/schedule/threshold
   change, alternate root to hide failure, or tuning toward GO. Independently
   audit recovered outputs and apply only frozen P8Q. Missing evidence yields
   the frozen blocked/stop classification, not a guessed YES or NO.

## Stops, recovery and user interruptions

Routine diagnosis, infrastructure edits, review and stage transitions within
the envelope require no further approval after charter approval. Ask only for
new authority or a genuinely missing decision: trust/credential ambiguity,
resource substitution, costs/limits exhausted, scientific changes, destructive
cleanup, or unresolved evidence integrity.

Stop authority includes read-only status checks and up to two additional stop
requests to the same charter-started VM if the initial cleanup request times
out or fails. These are safety cleanup, not numerical/transport retries; all
time/cost counts against the aggregate ceiling. Make stop status independently
observable. A failed local subprocess kill or API outage is not a shutdown
guarantee: monitor the active handle, report immediately and request operator
action if stop cannot be confirmed. No new work may proceed while that remains
unresolved. This charter does not grant automated Google consent or passwords.

## Evidence and reporting

Maintain one append-only attempt/budget ledger with UTC start/finish, resource
ID, invocation count, hashes, raw outcomes, remaining allowance and stop
status. Preserve complete and partial results without deletion. Keep secrets,
OAuth codes, private keys and access tokens out of logs/reports.

Report milestone changes, actionable failure or necessary operator input;
avoid repeated unchanged checks. Do not claim an unattended process is live
without a current process/job handle or authoritative status. No scheduling
or background monitor is created by this document alone.

## Approval wording

After the document's SHA-256 is supplied, the user may approve:

> I authorize the NHM2 P8P bounded continuation charter v2 at the stated SHA-256,
> including its aggregate $12.00/six-hour limits, seven-day validity, exact
> resource and attempt bounds, candidate-neutral infrastructure self-correction,
> one P=1024 process allowance, evidence protection and safety-stop authority.
> I accept its scientific restrictions and required escalation conditions.

Approval of this charter is the operating authorization; it is not a guarantee
of retrieval, a passing fixture, calibration completion or a legitimate GO.
