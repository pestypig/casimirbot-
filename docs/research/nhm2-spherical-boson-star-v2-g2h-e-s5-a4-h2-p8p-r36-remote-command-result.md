Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R36 static multiline guard controller
Current maturity: immutable remote-guard BLOCKED result; R36 exhausted
Target maturity: separately versioned single-line literal-command successor
Required frozen inputs: R36 proposal/controller, authenticated R35 hard link, exact retained VM identity, controller evidence, and cleanup chronology
Required evidence: controller/input identity, one restart/wait/guard, exact remote guard output/exit, absence of SCP/build/numerical execution, automatic stop, and independent audit
Stop/fail criteria: retrying R36, another R36 SSH/upload/build action, changing evidence or the hard link, leaving the VM running, numerical invocation, candidate ingress, retune, evidence deletion, or authority promotion
Explicit non-goals: retry/fallback, second restart, SCP, Docker/build work, P=1024 or P=65,536 execution, frozen-candidate evaluation, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: one separately frozen single-line literal-command successor; no execution authority

# H2-P8P-R36 remote-command result

Status date: September 4, 2026.

Status: **BLOCKED AT READ-ONLY REMOTE GUARD / R36 EXHAUSTED**.

R36 authenticated proposal SHA-256
`19cd0f6933c8672eb6273c5ae6b900dd487b9b0e7b02965a259c0b2c0bf1789f`,
the exact 7,542-byte controller SHA-256
`e02a7c1ff8023402802c949f82a57826cad7e9227b69b6e27545c20a0ebd93dc`,
the unchanged R35 hard link, its absent fresh evidence root, and the exact
stopped retained VM.

The controller restarted the VM exactly once and completed its exact 120-second
wait. It then issued its one authorized read-only SSH guard. The remote process
returned exit 127 and exact output:

```text
bash: line 1: C:WINDOWSsystem32cmd.exe: command not found
```

The multiline literal was therefore transformed by the Windows gcloud/PuTTY
transport before reaching the remote shell. The guard did not reach any remote
file test. First failure was terminal. No SCP, archive upload, post-transfer
SSH, guest wrapper, Docker action, build, fixture, or numerical process
occurred.

The controller's cleanup stop completed. The exact VM is authenticated
`TERMINATED`, with last-stop timestamp `2026-09-04T10:12:32.184-07:00`.
The R35 hard link remains intact and authentic. R36's complete partial evidence
is preserved under its frozen local evidence root.

This result narrows the remaining fault to multiline `--command` transport. A
separately versioned successor may use only newline-free literal command
arguments; it may not retry R36.

This is transport/preexecution evidence only. P8Q remains
`P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED`; all scientific and physical authority
remains false.
