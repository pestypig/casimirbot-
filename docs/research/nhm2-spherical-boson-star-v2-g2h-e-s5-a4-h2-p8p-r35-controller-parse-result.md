Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R35 temporary-drive hard link and retained-VM guard handoff
Current maturity: immutable partial-preexecution BLOCKED result; R35 exhausted
Target maturity: separately versioned parse-tested retained-VM build-only successor
Required frozen inputs: R35 proposal, authenticated local hard link, exact retained VM identity, start/stop chronology, and local parser failure
Required evidence: hard-link identity, mapping cleanup, one VM restart, exact 120-second wait, pre-SSH parser failure, zero upload/build/numerical execution, automatic stop, and independent audit
Stop/fail criteria: retrying R35, another R35 SSH/upload/build action, changing the hard link, leaving the VM running, numerical invocation, candidate ingress, retune, evidence deletion, or authority promotion
Explicit non-goals: retry/fallback, second restart, SCP, Docker/build work, P=1024 or P=65,536 execution, frozen-candidate evaluation, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: one separately frozen parse-tested controller proposal reusing the authenticated R35 hard link; no execution authority

# H2-P8P-R35 controller parse result

Status date: September 4, 2026.

Status: **BLOCKED PRE-SSH / R35 EXHAUSTED**.

R35 authenticated its proposal, unchanged source archive, absent local target,
unmapped `R:` drive, and exact stopped R32 VM. It created exactly one temporary
`subst` mapping, authenticated the short source view, created exactly one
same-volume hard link at `C:\NHM2-R35\p8p.tar`, authenticated the link as
236,640,768 bytes with SHA-256
`3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5`,
and removed the mapping. `fsutil hardlink list` showed the original and R35
names as the two names of the same NTFS payload.

The exact retained VM was then restarted once. Its authenticated running state
retained instance ID `1893159507643031574`, `e2-standard-4`, the existing 30 GB
`pd-standard` disk, and automatic 3,600-second stop ceiling. The exact
120-second startup wait completed.

Before the authorized read-only SSH guard could be submitted, PowerShell
rejected the local dynamically quoted command with `ParserError` and
`Unexpected token`. No `gcloud compute ssh` process was invoked. Under the
first-failure rule, R35 issued no retry, SCP, upload, post-transfer SSH, guest
command, Docker action, build, fixture, or numerical process. The VM was
explicitly stopped and is authenticated `TERMINATED`, with last-stop timestamp
`2026-09-04T09:57:39.183-07:00`.

The R35 hard link remains valid and immutable for a separately authorized
successor. That successor must use a statically parse-tested controller rather
than reconstructing the guard through an interactive PowerShell expression.

This is transport/preexecution evidence only. P8Q remains
`P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED`; all scientific and physical authority
remains false.
