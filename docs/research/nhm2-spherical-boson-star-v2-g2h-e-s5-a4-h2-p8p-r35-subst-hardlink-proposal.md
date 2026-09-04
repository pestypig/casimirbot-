Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R35 temporary drive-letter source view and retained-R32 build-only fixture
Current maturity: inert successor proposal; R34 exhausted before cloud execution
Target maturity: one authenticated no-copy archive ingress followed by the unchanged build-only R32 fixture
Required frozen inputs: R34 result, unchanged source directory/archive, absent temporary drive mapping and R35 target, exact stopped R32 VM/disk, and authenticated remote R31 fixture/R32 wrapper
Required evidence: source identity through original and temporary views, one mapping and removal, exact hard-link identity, stopped resource identity, remote partial-file hashes, remote archive absence, one SCP, post-transfer archive hash, one unchanged guest execution, deterministic fixture evidence, independent audit, and automatic stop
Stop/fail criteria: any identity/absence mismatch, mapping collision, second mapping/hard-link/upload, copy fallback, retry, resource substitution, Docker/build failure, numerical invocation, candidate ingress, retune, evidence deletion, or authority promotion
Explicit non-goals: retrying R34, changing or copying the source archive, new VM/disk, P=1024 or P=65,536 execution, frozen-candidate evaluation, positive sampling, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: only an authenticated build-only fixture PASS may make a corrected P=1024 calibration proposal eligible

# H2-P8P-R35 temporary-drive hard-link proposal

Status date: September 4, 2026.

Status: **FROZEN INERT / SEPARATE BILLABLE AUTHORIZATION REQUIRED**.

R33 and R34 demonstrate that ordinary and extended-length source spellings both
fail at the exact 260-character archive path before cloud execution. R35 changes
only the local filesystem view used to address the unchanged file.

The source directory is exactly:

`C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r16-regional-bulk-ingress-v1-20260902`

R35 must require drive `R:` to be initially unmapped, create exactly one
temporary `subst` mapping from `R:` to that directory, and authenticate
`R:\h2-p8p-r16-regional-bulk-upload-v1.tar` as exactly 236,640,768 bytes with
SHA-256
`3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5`.
It may then create exactly one same-volume hard link at initially absent
`C:\NHM2-R35\p8p.tar`, require the same bytes and SHA-256, and remove the `R:`
mapping. The hard link remains; no payload copy or fallback is permitted. If
any local step fails, removal of the temporary mapping is still mandatory and
no cloud action is eligible.

Only after those local gates pass may R35 reuse stopped VM
`nhm2-h2-p8p-r32-e2-4-20260904`, instance ID `1893159507643031574`, in
project `dark-stratum-455714-h4`, zone `us-east1-b`, with its existing 30 GB
`pd-standard` disk unchanged. After exactly one restart and one 120-second
wait, one read-only SSH guard must authenticate the already transferred
4,024-byte fixture SHA-256
`97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79`
and 3,129-byte wrapper SHA-256
`f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19`,
and require the remote archive absent.

Exactly one SCP may copy only `C:\NHM2-R35\p8p.tar` to the unchanged remote
archive path. One post-transfer SSH transaction must authenticate it and invoke
the unchanged R32 build-only wrapper exactly once. The VM has a 3,600-second
aggregate restart ceiling and `$1.00` total ceiling. Complete or partial
evidence is immutable and the VM must be stopped after PASS or first failure.

R35 permits no numerical execution and changes no scientific source, image,
Dockerfile, fixture, binary, equation, threshold, schedule, precision,
selector, or candidate data. P8Q remains
`P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED`; all scientific and physical authority
remains false unless and until the build-only fixture independently passes.
