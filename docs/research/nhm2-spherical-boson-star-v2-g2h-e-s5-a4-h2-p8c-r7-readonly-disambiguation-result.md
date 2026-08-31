Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R7 read-only disambiguation result
Current maturity: immutable read-only FAIL with partial stage evidence and a discovered fail-closed command defect
Target maturity: corrected project-bound fail-fast diagnosis of the bounded remote-guard receipts
Required frozen inputs: R7 proposal `5fbd0adc...88408`, ledger `9c6fc58b...4b9f4`, and observed Cloud Shell output
Required evidence: exact two-command chronology, project errors, nonterminal continuation defect, stage inventory, procedure exit, archive state, and independent audit
Stop/fail criteria: R7 is exhausted; no retry, extra command, evidence mutation, VM action, numerical work, or authority promotion
Explicit non-goals: treating partial output as retrieval success, archive download, P8C audit, candidate work, Rust/G3/SI/metric/lane work, or physical claims
Downstream gate unlocked: one corrected no-restart fail-fast remote-guard diagnosis proposal

# H2-P8C-R7 read-only disambiguation result

Status date: August 30, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / READ-ONLY FAIL WITH PARTIAL EVIDENCE**.

The exact health command returned `R7_CONNECTION_READY`, after which the exact
1,006-character inspection command ran once. Cloud Shell had reprovisioned and
lost its default project setting, so both `gcloud compute instances describe`
calls returned the required-project error and both VM-status fields were empty.

The command then exposed a frozen-definition defect: semicolon sequencing and
the absence of `set -e` allowed later read-only clauses to continue after the
failed status guards. R7 therefore did not satisfy its claimed first-failure
terminal policy. No mutation occurred.

The partial read-only output observed `procedure_exit=255`, the exact 11-file
stage inventory containing start, remote-guard and cleanup-stop receipts, and
`archive_state=ABSENT`. These observations narrow the likely failure boundary
to the remote guard/IAP stage but do not authenticate its cause because R7 did
not read the receipt contents.

## Immutable evidence

- result SHA-256:
  `5e8261c9a48457d6e6900956dc63f6bd5dc3a69905fee8da18def08f6df4adbc`;
- classification:
  `FAIL_PROJECT_UNSET_NONTERMINAL_GUARD_PROCEDURE_EXIT_255_ARCHIVE_ABSENT`;
- independent result audit: **18/18 PASS**;
- audit receipt SHA-256:
  `631d11039a06ce7953a7497eb27e27a0ae0514c1c7eeac2e74ca568461d62298`;
- procedure exit observed: 255;
- archive observed: absent;
- stage files observed: 11;
- R7 VM statuses authenticated: false;
- resource mutations, numerical actions and candidate evaluations: 0;
- proposal-audit false negative detected: true;
- every authority lock: false.

R7 is not eligible for retry. The only supported successor is a newly frozen
read-only packet with explicit per-command project binding, `set -euo pipefail`,
bounded file hashes, and bounded remote-guard stdout/stderr reads.

