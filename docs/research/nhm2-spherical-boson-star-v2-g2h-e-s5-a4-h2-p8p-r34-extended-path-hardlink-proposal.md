Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R34 extended-length local archive representation and retained-R32 build-only fixture
Current maturity: inert successor proposal; R33 exhausted at the legacy 260-character Windows path boundary
Target maturity: one authenticated complete ingress followed by the unchanged build-only R32 fixture
Required frozen inputs: R33 result, exact stopped R32 VM/disk, unchanged source archive, authenticated remote R31 fixture and R32 wrapper, and fresh R34 staging path
Required evidence: extended-length source identity, exact local hard-link identity, stopped resource identity, remote partial-file hashes, remote archive absence, one archive SCP, post-transfer archive hash, one unchanged guest execution, deterministic fixture evidence, independent audit, and automatic stop
Stop/fail criteria: any identity/absence mismatch, legacy-path fallback, second hard-link/upload/command, overwrite, retry, resource substitution, Docker/build failure, numerical invocation, candidate ingress, retune, evidence deletion, or authority promotion
Explicit non-goals: retrying R33, changing the source archive, new VM/disk, P=1024 or P=65,536 execution, frozen-candidate evaluation, positive sampling, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: only an authenticated build-only fixture PASS may make a corrected P=1024 calibration proposal eligible

# H2-P8P-R34 extended-length path hard-link proposal

Status date: September 4, 2026.

Status: **FROZEN INERT / SEPARATE BILLABLE AUTHORIZATION REQUIRED**.

R33 isolated the failure to the source path's exact 260-character legacy
Windows boundary. R34 changes only the local filesystem spelling used by the
hard-link primitive. It binds the unchanged source through its absolute
extended-length `\\?\C:\...` representation and creates exactly one same-volume
hard link at the initially absent path `C:\NHM2-R34\p8p.tar`. The resulting
file must be exactly 236,640,768 bytes with SHA-256
`3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5`.
No copy fallback is permitted.

R34 reuses only stopped VM `nhm2-h2-p8p-r32-e2-4-20260904`, instance ID
`1893159507643031574`, in project `dark-stratum-455714-h4`, zone
`us-east1-b`, with its existing 30 GB `pd-standard` disk unchanged. After
exactly one restart and one 120-second wait, one read-only SSH guard must
authenticate the already transferred 4,024-byte fixture SHA-256
`97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79`
and 3,129-byte wrapper SHA-256
`f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19`,
and require the remote archive absent.

Exactly one SCP may copy only `C:\NHM2-R34\p8p.tar` to the wrapper's unchanged
archive path. One post-transfer SSH transaction must authenticate the remote
archive and invoke the unchanged R32 wrapper exactly once. The VM has a
3,600-second aggregate restart ceiling and `$1.00` total ceiling. Complete or
partial evidence is immutable and the VM must be stopped after PASS or first
failure.

R34 changes no scientific source, image, Dockerfile, fixture, binary, equation,
threshold, schedule, precision, selector, or candidate data. It permits no
numerical execution. P8Q remains `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` and
all scientific and physical authority remains false unless and until the
build-only fixture independently passes.
