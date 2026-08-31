Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C pre-result independent terminal/partial-evidence audit definition
Current maturity: candidate-neutral audit definition complete; synthetic 4/4 and independent definition audit 19/19 PASS; real P8C result unread
Target maturity: one immutable terminal P8C capture classified independently as diagnostic PASS, numerical FAIL, timeout/partial, or audit failure
Required frozen inputs: proposal `7e8f28d7...a2ace`, correction `aade7e5d...6c32b`, archive `f0a0fabf...3c4c`, manifest `78fdff46...d868`, binary `7e7d7839...deb25`, exact C4 resource/process ceilings and every authority lock
Required evidence: safe capture-manifest replay, exact resource/build/process identity, one-process chronology, stopped VM, retained disk, no retry/retune, bounded diagnostic payload or partial disposition, and distinct audit/numerical statuses
Stop/fail criteria: missing or mutated binding, unsafe/duplicate capture path, second process, retry, retune, runtime/cost overrun, malformed chronology, candidate ingress, protected-root creation, evidence deletion, or authority promotion
Explicit non-goals: reading or predicting the stopped process result, restarting P8C, frozen-candidate evaluation, positive sampling, handler linkage, Rust/G3/SI/metric/lane work, or any authority promotion
Downstream gate unlocked: none until the real stopped-disk capture passes this independent audit

# H2-P8C result-audit definition

Status date: August 29, 2026.

Status: **PASS / INERT PRE-RESULT AUDIT DEFINITION**.

This packet changes receipt-definition maturity only. It does not change
mathematical semantics, runtime authority, candidate identity, proof maturity,
or any claim authority.

The result rules were frozen after the VM was observed `Stopped` but before its
retained evidence directory was read. This prevents a numerical outcome from
choosing its own integrity criteria.

## Definition evidence

- result-audit source SHA-256:
  `e733350cdb6fa8ccd8c17eee8b7a73cae84820fd6e81564b7ef937cd8935a227`;
- independent definition-audit source SHA-256:
  `6ba6329a46eeb76d1a93c9f50f190b90e490318dbf35eeb4c23c331edbc7aa89`;
- synthetic classifications: **4/4 PASS**;
- independent definition audit: **19/19 PASS**;
- independent audit receipt SHA-256:
  `05fa4ee8bed941eeb9b011d5d891cb92f04353e4e46fd3d18523f517c705d91d`.

The four synthetic cases distinguish an authentic diagnostic `PASS`, an
authentic numerical `FAIL`, an authentic timeout/partial result, and corrupted
evidence. Audit `PASS` authenticates evidence; it does not imply
`diagnostic_h2_pass=true`. Missing or malformed capture files produce a written
`AUDIT_FAIL` rather than an exception.

## Bound audit surface

The real capture must bind the exact P8C proposal, boot-image correction,
47-entry archive, source manifest, binary, C4 VM, 30 GB retained disk and one
process identity. It replays a safe SHA-256 inventory, checks chronology and
the 50,400/54,000-second ceilings, confirms the original VM is terminated and
the disk retained, and requires all authority locks false.

For a terminal payload it binds schema
`nhm2.g2h_e_s5.c08_h2_p8c_diagnostic_run.v1`, the fixed phase vocabulary,
the candidate-neutral locks and the 65,536-byte diagnostic cap. A valid
numerical failure or partial result can pass evidence audit without becoming a
successful diagnostic.

The definition performs no network or cloud action and cannot restart, inspect
or modify the stopped disk. No real result audit exists until the retained
evidence is recovered through the separately frozen read-only rescue packet.

Current-head verification passes math validation at 323 entries, the required
WARP battery at 18/18 files and 179/179 tests, and the Casimir adapter gate is
`PASS/GREEN` with `firstFail=null`, certificate SHA-256
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. These checks certify the inert audit definition only.
