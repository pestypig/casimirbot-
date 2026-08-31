Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R9 Google-API guest-attribute SSH host-key preflight result
Current maturity: exhausted indeterminate read-only attempt; no host-key trust decision
Target maturity: observable fail-fast Google-API trust-source diagnosis in a child shell that cannot close the operator terminal
Required frozen inputs: R9 proposal `186447b2...a4df`, ledger `0e5994ae...6673`, and browser-observed command/session chronology
Required evidence: exact health marker, single inspection submission, presence or absence of result markers, terminal state, and independent result audit
Stop/fail criteria: R9 is exhausted; no retry, extra command, known-hosts mutation, SSH/SCP, VM action, numerical work, or authority promotion
Explicit non-goals: inferring a key match from missing output, repairing SSH trust, retrieving the archive, P8C audit, candidate work, or downstream authority
Downstream gate unlocked: one separately frozen observable-subprocess read-only successor

# H2-P8C-R9 guest-attribute host-key preflight result

Status date: August 30, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / INDETERMINATE WITHOUT TRUST DECISION**.

The exact health command ran once and returned `R9_CONNECTION_READY`. The exact
2,058-character read-only inspection command was then submitted once. After
submission, the Cloud Shell terminal input disappeared while the terminal panel
remained open. Neither `r8_presented_fingerprint_match=PASS` nor
`R9_READONLY_COMPLETE` became observable.

R9 used `set -euo pipefail` in the operator's interactive shell and delayed all
diagnostic output until after its guarded API and file reads. A first failed
predicate could therefore terminate the shell surface before preserving which
predicate failed. The observed behavior is compatible with that definition
defect, but it does not authenticate a specific failed predicate. In
particular, R9 does not establish whether guest attributes were absent,
malformed, mismatched, or inaccessible.

No retry or additional terminal command was issued. The frozen command contains
only read operations, and no SSH, SCP, known-hosts mutation, VM action,
numerical action, candidate evaluation, or authority promotion occurred.

## Immutable evidence

- result SHA-256:
  `c658f96f00751100d51de3053424af23638fe1449733ea3b5d9be4022bfe7fdc`;
- classification:
  `INDETERMINATE_FAILFAST_TERMINAL_INPUT_DISAPPEARED_BEFORE_RESULT_MARKERS`;
- independent result audit: **15/15 PASS**;
- audit receipt SHA-256:
  `ae5fa6fcad92d365dfb9e190f241d96c60eaea99a6caac91ccd3921f7464f92e`;
- health commands: 1;
- inspection commands: 1;
- additional commands: 0;
- trust decision reached: false;
- mutations, SSH/SCP, numerical and candidate actions: 0;
- every authority lock: false.

R9 may not be retried. A correct successor must execute the fail-fast body in a
child shell, emit a bounded marker after every passed guard, and preserve the
child exit in a non-`errexit` parent shell. That structure makes first failure
observable without weakening any trust predicate.
