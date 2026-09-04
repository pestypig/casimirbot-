Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R36 static guard controller and retained-R32 build-only fixture
Current maturity: inert successor proposal; R35 preserved the authenticated no-space hard link and exhausted before SSH
Target maturity: one authenticated complete archive ingress followed by the unchanged build-only R32 fixture
Required frozen inputs: R35 result/hard link, exact stopped R32 VM/disk, authenticated remote R31 fixture/R32 wrapper, and exact parse-tested R36 controller
Required evidence: controller identity and parse audit, hard-link identity, stopped resource identity, exactly one restart/guard/SCP/handoff, remote hashes, unchanged wrapper evidence, terminal chronology, independent audit, and automatic stop
Stop/fail criteria: any identity mismatch, controller drift, second restart/guard/SCP/handoff, retry/fallback, archive overwrite, resource substitution, Docker/build failure, numerical invocation, candidate ingress, retune, evidence deletion, or authority promotion
Explicit non-goals: retrying R35, changing or copying the source archive, another link, new VM/disk, P=1024 or P=65,536 execution, frozen-candidate evaluation, positive sampling, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: only an authenticated build-only fixture PASS may make a corrected P=1024 calibration proposal eligible

# H2-P8P-R36 static guard controller proposal

Status date: September 4, 2026.

Status: **FROZEN INERT / SEPARATE BILLABLE AUTHORIZATION REQUIRED**.

R35 solved the no-space archive representation and preserved
`C:\NHM2-R35\p8p.tar` as a second NTFS name for the unchanged source payload.
It then stopped before SSH because an interactively constructed PowerShell
expression did not parse. R36 changes only that local controller surface.

The exact 7,542-byte controller
`tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r36_static_guard_controller_v1.ps1`
has SHA-256
`e02a7c1ff8023402802c949f82a57826cad7e9227b69b6e27545c20a0ebd93dc`
and zero PowerShell parse errors. It stores both remote commands as literal
here-strings and supplies each to gcloud as one argument. Static inspection
binds one start call, two SSH calls with distinct guard and handoff roles, one
SCP call, and one cleanup stop path. No controller execution has occurred.

R36 must require the exact hard link to remain a regular 236,640,768-byte file
with SHA-256
`3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5`.
It reuses only stopped VM `nhm2-h2-p8p-r32-e2-4-20260904`, instance ID
`1893159507643031574`, project `dark-stratum-455714-h4`, zone
`us-east1-b`, with its existing 30 GB `pd-standard` disk unchanged.

After exactly one restart and one 120-second wait, exactly one read-only SSH
guard must authenticate the existing 4,024-byte R31 fixture SHA-256
`97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79`,
the 3,129-byte R32 wrapper SHA-256
`f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19`,
and the absence of the remote archive. Exactly one SCP may transfer only the
R35 hard link to the unchanged remote archive path. Exactly one post-transfer
SSH handoff must authenticate that archive and invoke the unchanged R32
build-only wrapper once.

The VM has a 3,600-second aggregate restart ceiling and `$1.00` total ceiling.
The controller preserves complete or partial local evidence, waits for the
guest's automatic shutdown, reads immutable serial evidence, and stops the VM
in cleanup after any earlier failure. First failure is terminal.

R36 permits no numerical execution and changes no scientific source, image,
Dockerfile, fixture, binary, equation, threshold, schedule, precision,
selector, or candidate data. P8Q remains
`P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED`; all scientific and physical authority
remains false unless and until the build-only fixture independently passes.
