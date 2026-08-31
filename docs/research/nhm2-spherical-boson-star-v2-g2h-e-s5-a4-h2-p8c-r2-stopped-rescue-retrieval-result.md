Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R2 stopped-rescue archive retrieval result
Current maturity: immutable transport failure; terminal P8C archive not retrieved
Target maturity: authenticated local capture of the existing P8C terminal archive and unchanged frozen result audit
Required frozen inputs: R2 proposal `adcb66ea...66f0`, exact stopped resources, and archive identity `9535ce13...bd4d`
Required evidence: one-start/one-stop chronology, failure boundary, partial capture identity, independent classification, and unchanged result-audit outcome
Stop/fail criteria: first failure terminal; no R2 retry, substitution, resource mutation, evidence deletion, numerical action, or authority promotion
Explicit non-goals: candidate evaluation, positive sampling, archive recreation, resource repair, Rust/G3/SI/metric/lane work, or physical/propulsion/transport claims
Downstream gate unlocked: one separately authorized candidate-neutral transport-only retrieval successor

# H2-P8C-R2 stopped-rescue retrieval result

Status date: August 29, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / BLOCKED BEFORE TRANSFER**.

The exact R2 procedure was submitted once. Initial stopped-resource guards
passed and the rescue VM started once. After the fixed startup wait, the sole
external SSH guard failed with exit `255` because TCP port 22 to
`104.197.232.249` timed out. The remote guest guard did not execute and SCP was
never attempted. The cleanup trap stopped the rescue VM; both the original P8C
VM and rescue VM were then `TERMINATED`.

No terminal archive was copied, no numerical process ran, no resource was
created or modified, and no authority changed. R2 cannot be retried.

## Immutable evidence

- R2 proposal SHA-256: `adcb66eaf6be3519bf6ae2208e542d2edae3d8dc408e8a8732bcc60cc70e66f0`;
- partial evidence archive: 2,184 bytes, SHA-256 `c7ac1ac43bf4aba04dd2e54a895affc44243625fa6bf3e2b2336c925d8727cfd`;
- independent result audit: **19/19 PASS**;
- result classification: `BLOCKED_PRETRANSFER_SSH_PORT_22_TIMEOUT`;
- result-audit receipt SHA-256: `c65d88c461a7c53c73dee4fcb16bf8f17f4ddba83b20a1b339af7b1f42427114`;
- result-audit source SHA-256: `35df2cfb8514e1a1be529b703fe8141845b3a3a61fc28052f702f6d635a08d6d`;
- procedure exit: `255`;
- rescue starts consumed: 1 of 1;
- SCP attempts executed: 0;
- terminal archive retrieved: false;
- numerical actions executed: 0;
- authority promoted: false.

The unchanged frozen P8C scientific result audit remains **1/25 FAIL / AUDIT_FAIL**
at SHA-256 `92ff8791b8e8b5d2d7c34a658e3238d74c451039a8d17bf0b78671e5618bc30b`
because its required terminal evidence was not retrieved. This is an expected
incompleteness result, not a scientific PASS or FAIL for the P8C computation.

Read-only diagnosis found the existing enabled `default-allow-ssh` ingress
rule for `tcp:22` from `0.0.0.0/0`. That observation does not prove the cause of
the external TCP timeout, but it supports a bounded IAP-transport successor
without changing firewall, IAM, VM, disk, or evidence state.
