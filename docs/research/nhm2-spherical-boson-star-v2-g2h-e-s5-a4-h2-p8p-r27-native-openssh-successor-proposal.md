Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R27 native-OpenSSH retained-VM transport successor
Current maturity: R26 terminal before ingress; retained exact VM stopped; native SSH key identity and corrected local ACL verified; calibration unexecuted
Target maturity: one authenticated candidate-neutral P=1024 turnaround result and frozen P8Q decision, or one immutable terminal R27 record
Required frozen inputs: R26 result, stopped R26 VM/disk, exact local SSH keypair, native OpenSSH executables, unchanged four-member archive, guest ledger, executable and auditor
Required evidence: retained-resource and key binding, one restart, one native SCP with isolated host-key receipt, one native SSH handoff, serial evidence, automatic/failure stop, independent audit and P8Q classification
Stop/fail criteria: first identity, start, IP, host-key, transfer, guest-user, build, execution, recovery or audit failure terminal; no retry or fallback
Explicit non-goals: new VM, project metadata/IAM mutation, user creation, candidate evaluation, retuning, P=65,536 execution, G3/SI/metric/lane work, deletion or authority promotion
Downstream gate unlocked: result-conditioned P8Q yes/no decision only; no full representative run or scientific authority

# H2-P8P-R27 native-OpenSSH retained-VM successor

Status date: September 3, 2026.

Status: **FROZEN PREEXECUTION PROPOSAL / RETAINED VM REMAINS TERMINATED**.

Change classification: transport identity and host-key handling only.
Mathematical semantics, scientific inputs and authority are unchanged.

## Evidence-selected correction

The immutable R26 result is SHA-256
`2342d09450b8bbb71b65de3a8d1af54d422b00a4789a58e3f6dee96a1b4e6dd7`
and independently audits 17/17. Its exact VM allocation and resource checks
passed. Its first gcloud/PuTTY SCP failed before ingress because the transport
selected guest identity `dan` while targeting `/home/pestypig/` and had no
preexisting PuTTY host-key state. The VM was stopped; no scientific input was
transferred and no numerical process ran.

R27 reuses only that stopped VM and its unchanged disk. It bypasses gcloud's
PuTTY selection and calls the installed Windows OpenSSH executables directly,
using explicit guest identity `dan`, the exact key that R26 already bound once
in project SSH metadata, and an initially absent R27-only `known_hosts` file.
It transfers to `/home/dan/`, then requires the preexisting `pestypig` guest
account before using `sudo install` to place the authenticated inputs at the
unchanged ledger paths. It cannot create or modify an account or cloud SSH
metadata.

The R26-created private key ACL was hardened locally to exactly one explicit
full-control ACE for `LAPTOP-FPCDI341\dan`, with inheritance disabled. Its
content did not change and OpenSSH public-key derivation now passes.

## Frozen local identities

| Item | Frozen identity |
| --- | --- |
| R27 controller | `tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r27_native_openssh_controller_v1.ps1`; 14,360 bytes; SHA-256 `4fdb40027927f8d0006cfcb6e604fe7dad44b8ed481c484161b215434af14911`; parser PASS |
| native SSH | `C:\Windows\System32\OpenSSH\ssh.exe`; 1,255,424 bytes; SHA-256 `6250fd52163fe99a0dc49403ed1b4bbef9b764bdb7bada017a93d057d9376a42` |
| native SCP | `C:\Windows\System32\OpenSSH\scp.exe`; 432,128 bytes; SHA-256 `63b7118d8e1a8a84398cf4ce1584dc6b146606092fe9c68bbaf110bbdcfb480a` |
| private key | `C:\Users\dan\.ssh\google_compute_engine`; 1,675 bytes; SHA-256 `37e1a9dab99f498aa6d01e335e5351088247cb307175b60ee71f9f37c88b2b95` |
| public key | `C:\Users\dan\.ssh\google_compute_engine.pub`; 417 bytes; SHA-256 `d5035122b18833ab736834cc388af852317573913804a32d233326afd2bb5bc7` |
| SSH fingerprint | RSA 2048 `SHA256:7dw0D3cLPiP0z+qoY/fjNzDv/vEzvhF6DnsDfaPWiiQ` |
| outer archive | 236,640,768 bytes; SHA-256 `3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5` |
| required executable | SHA-256 `7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718` |

The controller manually captures native stdout/stderr and exit status so a
child failure cannot be reduced to the generic PowerShell native exception
that truncated R26's failure receipt.

## Retained resource and bounded procedure

| Field | Frozen value |
| --- | --- |
| project / zone | `dark-stratum-455714-h4` / `us-east1-c` |
| VM / instance ID | `nhm2-h2-p8p-r26-c2d-32-20260903` / `4290604153416687194` |
| initial state | exactly `TERMINATED` |
| machine / image | `c2d-standard-32` / exact Debian `v20260817` |
| boot disk | existing 30 GB `pd-standard`; retained, not deleted |
| provider stop | existing 18,000-second maximum and `STOP` action |
| restart/runtime/cost | exactly one restart / 18,000 seconds / `$9.00` total ceiling |

Before restart the controller authenticates the account/project, exact `dan`
public-key metadata binding, stopped VM identity, machine, image, disk and
provider stop. It creates one initially absent local evidence root and no cloud
resource. It then restarts the exact VM once, waits 180 seconds and binds its
single authenticated external IP.

It performs exactly one native SCP as `dan`, with `BatchMode=yes`,
`IdentitiesOnly=yes`, the frozen private key and
`StrictHostKeyChecking=accept-new` limited to the initially absent evidence-root
`known_hosts.r27`. This single trust-on-first-use receipt is isolated from the
user's global SSH configuration. The subsequent single native SSH handoff uses
`StrictHostKeyChecking=yes` against only that receipt.

The guest handoff requires both `dan` and preexisting `pestypig`, authenticates
the outer archive and all four members, requires every ledger target initially
absent, and installs only the base archive, overlay and unchanged guest ledger
into `/home/pestypig` with `pestypig` ownership. It starts one systemd oneshot
as `pestypig`. The ledger conditionally installs Debian `docker.io` only if
absent, loads only the archived pinned images, builds with no pull and no
network, verifies the executable, and executes exactly one candidate-neutral
P=1024 calibration with 32 CPUs and a 14,400-second timeout.

The controller preserves all outcomes, enforces the aggregate ceiling, stops
the exact VM on any failure, reconstructs only the serial evidence archive and
runs the unchanged frozen P8Q auditor. Success also leaves the retained VM
stopped. The disk, logs and evidence remain retained.

First failure is terminal and consumes R27. No second restart, SCP, SSH,
known-host acceptance, ledger, build or numerical process is allowed. No new
VM, retry, fallback, metadata/IAM change, guest-user creation, alternate
identity, key, transport, machine, zone, disk, archive or evidence root is
allowed.

## Scientific and authority boundary

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. R27 cannot authorize P=65,536. It can only supply the frozen P8Q
resource-bounded yes/no decision.

## Exact authorization text

> I authorize exactly one H2-P8P-R27 native-OpenSSH retained-VM P=1024 turnaround attempt under proposal SHA-256 `PROPOSAL_SHA256`. Restart only the existing stopped VM `nhm2-h2-p8p-r26-c2d-32-20260903`, instance ID `4290604153416687194`, in project `dark-stratum-455714-h4`, zone `us-east1-c`, under the existing 18,000-second provider stop and a `$9.00` total cost ceiling. Execute only the frozen 14,360-byte R27 controller SHA-256 `4fdb40027927f8d0006cfcb6e604fe7dad44b8ed481c484161b215434af14911`. Use only the hash-bound native Windows OpenSSH executables and existing hash-bound `google_compute_engine` keypair, exact guest identity `dan`, one isolated initially absent R27 `known_hosts` file, exactly one SCP to `/home/dan/`, and exactly one SSH handoff. Require the preexisting `pestypig` guest account, authenticate the unchanged four-member candidate-neutral archive, stage only its frozen base, overlay and ledger to `/home/pestypig`, run one unchanged offline build, require executable SHA-256 `7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718`, and execute exactly one candidate-neutral P=1024 calibration with 32 CPUs and a 14,400-second timeout. Preserve every outcome, stop the exact VM automatically or on failure, recover and independently audit the serial evidence, and apply only the frozen P8Q rule. First failure is terminal. I do not authorize a retry, second restart, SCP, SSH, host-key acceptance, ledger, build or numerical process; a new resource; cloud SSH metadata, IAM or guest-user mutation; fallback, resource substitution, alternate identity, key, transport, zone, machine, disk or provisioning model; additional upload; retuning; frozen-candidate evaluation; positive sampling; P=65,536 execution; evidence deletion; G3/SI/metric/lane work; or any authority promotion.
