Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 parent result disposition
Capability or component: H2-P7 terminal parent result and stopped-disk recovery
Current maturity: immutable candidate-neutral numerical `FAIL`; independent result audit `24/24 PASS`
Target maturity: terminal evidence closure and a no-execution exhaustion-diagnosis handoff
Required frozen inputs: P7 proposal `3f15f387...fdc3`, exact archive/binary bindings, one preserved parent process, rescue proposal `b6ac7496...4406`, recovered read-only evidence archive
Required evidence: raw build/run files, resource chronology, deterministic archive hash, terminal disposition, independent result audit and retained-resource state
Stop/fail criteria: any identity mismatch, missing chronology, more than one process, retry/retune, candidate evaluation, resource deletion or authority promotion
Explicit non-goals: rerunning H2, changing its schedule/width rule, evaluating the selected member, linking a handler, beginning G3/SI/metric/lane work, or promoting any scientific/physical authority
Downstream gate unlocked: candidate-neutral H2-P8 no-execution exhaustion-data sufficiency review only

# H2-P7 parent result

Status date: August 28, 2026.

Status: **TERMINAL NUMERICAL FAIL / INDEPENDENT AUDIT PASS**.

This packet changes receipt maturity and the active planning handoff only. It
does not change mathematical semantics, runtime authority, candidate identity,
or any physical, propulsion or transport claim.

## Recovered immutable result

The one authorized H2-P7 parent process completed without an infrastructure
timeout. The recovered evidence records:

- build exit: `0`;
- run start: `2026-08-28T00:05:17Z`;
- run finish: `2026-08-28T06:15:08Z`;
- elapsed process time: `22,191` seconds;
- run exit: `1`;
- payload status: `FAIL`;
- phase: `h2_extend`;
- checks: `4/5`;
- terminal detail:
  `C08-010_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION`;
- selector calls: `1`;
- refinement candidates visited: `17`;
- accumulated subpanels: `131,071`;
- jet calls: `131,071`;
- elementary convolutions: `5,636,053`;
- numerical width checks: `5,746`.

The `131,071 = 2^17 - 1` accumulated-subpanel count and 17 visited candidates
show that the complete frozen power-of-two refinement schedule was consumed.
They do not identify which individual width predicate dominated the failure.
That distinction was not persisted and must not be invented after the fact.

The payload also records zero candidate evaluations, zero positive parameter
samples, no candidate root, no scientific handler linkage, and no authority
promotion.

## Snapshot-rescue execution

Proposal `b6ac74961252765e78c0f918338e394859d0a4a9b1e3233bea1cc7c543e04406`
was consumed exactly once. The original VM remained `TERMINATED`. One standard
snapshot, one 30 GB `pd-standard` clone and one `e2-small` rescue VM were
created under the frozen names. The clone was attached Compute Engine
read-only, verified read-only in the guest, mounted without journal recovery,
read, unmounted, and the rescue VM was stopped.

The deterministic recovered archive is 1,550 bytes with SHA-256
`fa50e5c6002d86139567cb1b8f6b0b3be458e47c71fe041a9d8e84814095a831`.
It is preserved in
`artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p7-terminal-capture-v2-20260828/`.
The snapshot, clone, stopped rescue VM, original stopped VM, disks and cloud
evidence remain retained pending a separate deletion decision.

## Independent audit

The first local audit preserved a `23/24 FAIL` caused solely by a two-character
transcription omission in the local manifest binding. No numerical evidence
was changed or rerun. The corrected binding replay then passed `24/24` and
classified the result `H2_PARENT_FAIL`:

- passing audit receipt SHA-256:
  `c827c1d2c6e2f20dcc6f27064733d5c8fe1768218d7bb1b75d853ae6bfc44c22`;
- scientific H2 pass: `false`;
- exit code: `1`;
- stderr bytes: `0`;
- estimated planning cost for the conservative creation-to-capture interval:
  `$10.8684777498`, within the original P7 `$25` ceiling.

Audit `PASS` authenticates the terminal `FAIL`; it does not turn that result
into an H2 pass.

## Next bounded lead

The next proper step is H2-P8, a no-execution exhaustion-data sufficiency
review. It must determine, from frozen source and persisted evidence only,
whether the existing record can distinguish Volterra enclosure width from the
U-panel refinement ceiling. If it cannot, it may freeze at most one additive
diagnostic proposal that records per-candidate/per-width failure data without
changing the selector schedule, thresholds, reduction order, input or output
root. Any numerical execution would require separate exact authorization.

That review is now recorded in
[`nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8-exhaustion-data-sufficiency-review.md`](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8-exhaustion-data-sufficiency-review.md).
Its decision is `INSUFFICIENT_PERSISTED_DATA_FOR_CAUSAL_SEPARATION`; the only
eligible successor is one additive candidate-neutral P8A diagnostic-definition
proposal, not a retry or retune.

Current-head integrity checks pass: math report/validation at 323 entries,
required WARP tests 179/179, and post-packet Casimir adapter run 2569 PASS/GREEN with
certificate `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. This certifies gate integrity, not scientific H2 success.

H2-P7 may not be retried, retuned, extended, deleted or reinterpreted. Candidate,
proof, geometry/state, lane, lamp, physical, propulsion and transport authority
remain false.
