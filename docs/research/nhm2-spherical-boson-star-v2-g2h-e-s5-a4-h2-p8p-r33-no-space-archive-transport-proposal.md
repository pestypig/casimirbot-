Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R33 retained-R32-VM no-space archive transport repair
Current maturity: inert transport-only successor proposal; R32 VM stopped with two authenticated partial script transfers
Target maturity: one authenticated complete ingress followed by the unchanged build-only R32 fixture
Required frozen inputs: R32 result, exact stopped R32 VM/disk, unchanged outer archive, R31 fixture, R32 wrapper, and fresh no-space local staging path
Required evidence: exact local hard-link identity, stopped resource identity, remote partial-file hashes, remote archive absence, one archive SCP, post-transfer archive hash, one unchanged guest execution, deterministic fixture evidence, independent audit, and automatic stop
Stop/fail criteria: any identity/absence mismatch, second upload or command, archive overwrite, retry/fallback, resource substitution, Docker/build failure, numerical invocation, candidate ingress, retune, evidence deletion, or authority promotion
Explicit non-goals: retrying R32, new VM/disk, P=1024 or P=65,536 execution, frozen-candidate evaluation, positive sampling, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: only an authenticated build-only fixture PASS may make a corrected P=1024 calibration proposal eligible

# H2-P8P-R33 no-space archive transport proposal

Status date: September 4, 2026.

Status: **FROZEN INERT / SEPARATE BILLABLE AUTHORIZATION REQUIRED**.

R32 proved the fresh small VM is available and correctly shaped. Its only
failure was local PuTTY parsing of the large archive's space-containing Windows
path. R33 changes only that transport representation.

R33 may create one same-volume hard link at the initially absent no-space path
`C:\NHM2-R33\p8p.tar`. It must retain the original 236,640,768-byte archive and
require the hard link to have SHA-256
`3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5`.
The hard link is a second directory entry for the same NTFS data, not a second
236 MB payload allocation.

The successor reuses only stopped VM `nhm2-h2-p8p-r32-e2-4-20260904`, instance
ID `1893159507643031574`, in `us-east1-b`, with its existing 30 GB
`pd-standard` disk unchanged. After exactly one restart and one 120-second wait,
one read-only SSH guard must authenticate the already transferred 4,024-byte
fixture and 3,129-byte wrapper and require the target archive absent. Exactly
one SCP may then copy only `C:\NHM2-R33\p8p.tar` to the wrapper's unchanged
archive path. One post-transfer SSH transaction must authenticate the archive
and invoke the unchanged wrapper exactly once.

The VM has a 3,600-second aggregate restart ceiling and `$1.00` total ceiling.
The wrapper preserves deterministic evidence and powers the VM off. First
failure is terminal. No R33 resource or cloud action exists; P8Q remains
`P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` and all authority remains false.

