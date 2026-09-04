Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R39 authenticated file-based transport boundary and retained-R32 build-only fixture
Current maturity: frozen inert proposal; R38 remains unexecuted and is superseded before execution
Target maturity: one authenticated complete archive ingress followed by the unchanged build-only R32 fixture
Required frozen inputs: R37 result, R35 hard link, exact stopped R32 VM/disk, authenticated remote R31 fixture/R32 wrapper, two exact R39 Bash files, and the exact parse-tested R39 controller
Required evidence: local and remote file identities, parser and command-surface audit, stopped resource identity, exactly one restart, three bounded SSH invocations, three bounded SCP transfers, unchanged wrapper evidence, terminal chronology, independent audit, and automatic stop
Stop/fail criteria: any identity mismatch, pre-existing R39 remote path, unexpected absence-probe exit, second restart or excess SSH/SCP, inline shell expansion, retry/fallback, resource substitution, Docker/build failure, numerical invocation, candidate ingress, retune, evidence deletion, or authority promotion
Explicit non-goals: executing R38, changing/copying the scientific archive payload, new VM/disk, P=1024 or P=65,536 execution, frozen-candidate evaluation, positive sampling, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: only an authenticated build-only fixture PASS may make one separately authorized P=1024 turnaround calibration eligible

# H2-P8P-R39 authenticated file-transport boundary proposal

Status date: September 4, 2026.

Status: **FROZEN INERT / SEPARATE BILLABLE AUTHORIZATION REQUIRED**.

## Evidence-driven correction

R36 and R37 prove that the build-only fixture did not fail. Windows command
interpretation altered the inline SSH payload before the guest could perform
its first authenticated file test. R38 narrows that syntax but retains the same
inline-command architecture and has not been executed. R39 supersedes R38
before execution because the higher-leverage correction is to remove shell
logic from the transport boundary altogether.

R39 transports two small, immutable Bash files. The Windows controller passes
only these three literal remote commands to `gcloud compute ssh`:

1. `test -e /home/pestypig/h2_p8p_r39_remote_guard_v1.sh`
2. `bash /home/pestypig/h2_p8p_r39_remote_guard_v1.sh`
3. `bash /home/pestypig/h2_p8p_r39_remote_launcher_v1.sh`

The first command must return exactly exit `1`, proving the remote guard path is
absent. It is not a failed cloud attempt. All quoting, hashing, pipelines and
file predicates thereafter execute from authenticated guest files, not from a
Windows command argument.

## Frozen local identities

- Controller:
  `tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r39_file_transport_controller_v1.ps1`,
  exactly 8,104 bytes, SHA-256
  `5fa0c13e3ca77e1862c9d487423e07c4e5638391edda289a7aa74fc22996b9bc`.
- Remote guard source and staged copy:
  `h2_p8p_r39_remote_guard_v1.sh`, exactly 770 bytes, SHA-256
  `cbd1cc51d9108f07f8741a175929a2742039aeb61c6f9997d69d293a836c9861`.
- Remote launcher source and staged copy:
  `h2_p8p_r39_remote_launcher_v1.sh`, exactly 590 bytes, SHA-256
  `802055c139ef32d462457f3576d0911272a496d7a27be7a972f961eb0899e3bb`.
- Existing archive hard link: `C:\NHM2-R35\p8p.tar`, exactly
  236,640,768 bytes, SHA-256
  `3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5`.

The two staged files under `C:\NHM2-R39` are byte-identical to their repository
sources. Both Bash files contain LF line endings, no NUL or carriage-return
bytes, and pass the installed Git Bash `bash -n` parser. The controller has zero
PowerShell parser errors.

## One-shot cloud boundary

R39 reuses only stopped VM `nhm2-h2-p8p-r32-e2-4-20260904`, instance ID
`1893159507643031574`, project `dark-stratum-455714-h4`, zone `us-east1-b`,
with its existing `e2-standard-4` machine and 30 GB `pd-standard` disk.

After exact local, account, project, instance and disk authentication, the
controller may perform exactly:

- one VM restart and one fixed 120-second wait;
- one read-only guard-path absence SSH probe;
- one SCP of the guard file and one `bash <guard-file>` SSH invocation;
- one SCP of the unchanged archive to its exact existing wrapper path;
- one SCP of the launcher and one `bash <launcher-file>` SSH invocation;
- bounded status observation, serial evidence retrieval, and an automatic stop
  after any earlier failure.

The guest guard authenticates the already-present R31 fixture and R32 wrapper,
then requires the archive and launcher paths absent. The launcher authenticates
the transferred archive and unchanged wrapper before invoking that wrapper once.
The wrapper remains the previously frozen build-only R32 procedure. It may load
and build candidate-neutral dependencies but contains no P=1024, P=65,536,
candidate, positive-sampling or scientific execution.

The VM has a 3,600-second aggregate restart ceiling and a `$1.00` total cost
ceiling. Complete, failed or partial evidence is immutable. First failure is
terminal; no retry or fallback is permitted.

## Authority boundary

R39 changes only transport representation. It changes no scientific source,
image, Dockerfile, fixture, binary, equation, threshold, schedule, precision,
selector or candidate data. P8Q remains
`P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED`. Candidate, proof, geometry/state,
lane, lamp, physical, propulsion and transport authority remain false.
