Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R26 authenticated local-gcloud execution result
Current maturity: one R26 regional allocation completed; first SCP transport failed before ingress; exact VM stopped; calibration unexecuted
Target maturity: immutable cause-bound terminal R26 evidence and successor input
Required frozen inputs: R26 proposal/controller, dedicated authenticated SDK, exact archive and single regional request
Required evidence: proposal/controller identities, chronology, allocation/resource receipts, native transport log, failure receipt, stop receipt and terminal status
Stop/fail criteria: R26 is consumed; no retry, restart, transport fallback, build or numerical action
Explicit non-goals: candidate evaluation, retuning, P=1024 or P=65,536 execution, evidence deletion, resource mutation, G3/SI/metric/lane work or authority promotion
Downstream gate unlocked: separately frozen SSH-transport correction only; P8Q remains stopped

# H2-P8P-R26 terminal transport result

Status date: September 3, 2026.

Status: **TERMINAL PREEXECUTION FAIL / VM TERMINATED / NO NUMERICAL EXECUTION**.

## Bound execution

The user authorized proposal SHA-256
`ec41efaf2de6c7384e71c3d13f3978f939409bd037288d168ea633a835c643e1`.
The exact 13,377-byte controller at SHA-256
`50c2743a6f2e61fc61a0e9df53b8806db8f1b41a26297cd647f1087517ae1a24`
was invoked once.

The immutable local evidence root is
`artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r26-local-gcloud-execution-v1-20260903`.
Its chronology is:

- start: `2026-09-04T01:36:22Z`;
- terminal failure receipt: `2026-09-04T01:40:35Z`;
- procedure exit: `1`.

Preexecution passed. The sole regional bulk request created exactly one
`c2d-standard-32` VM, `nhm2-h2-p8p-r26-c2d-32-20260903`, instance ID
`4290604153416687194`, in `us-east1-c`. The exact machine, Debian image and
30 GB `pd-standard` disk bindings passed authentication.

## First failure and preserved cause

The first `gcloud compute scp` call failed with native exit code 1. The frozen
SDK log is:

- path:
  `C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config\logs\2026.09.03\21.40.11.858407.log`;
- bytes: `9,804`;
- SHA-256:
  `e76eee365155d18601ee379726a19279666a47423282d373ecb16258947b71a9`.

It establishes that the local SDK had no prior gcloud SSH key, generated
`C:\Users\dan\.ssh\google_compute_engine`, and added its public key to project
SSH metadata. It then selected the Windows PuTTY transport and attempted one
`pscp.exe` transfer as local-derived guest identity `dan` to the frozen target
path `/home/pestypig/`; `pscp.exe` returned code 1 immediately. Because
PowerShell native-error promotion interrupted the wrapper at that point, the
generic controller failure receipt does not contain the child stderr. The
transport log is therefore the authoritative cause record. This is a
transport/user-binding defect, not a mathematical or computational result.

The archive was not transferred. The SSH handoff, guest ledger, Docker check,
offline build, executable verification, P=1024 process, serial export and P8Q
audit did not occur.

## Cleanup and decision

The bounded failure handler stopped the exact VM. Its stop receipt is SHA-256
`2ff8a3d87de06ff28e69e7a14c6d1c7f170ccfcdd41122f54653a169fc1da5c1`.
A subsequent read-only exact-instance observation reported `TERMINATED`.
R26 is consumed and cannot be retried.

The next eligible lead is a separately versioned transport correction that
prebinds one exact guest identity and noninteractive SSH host-key behavior,
captures child stderr without native-error truncation, and proves the transfer
fixture before permitting the unchanged scientific ledger. It must not change
the archive, guest ledger, executable, P=1024 parameters, resource ceilings or
P8Q rule.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. P8Q remains `P8Q_STOP_CALIBRATION_NOT_EXECUTED`.
