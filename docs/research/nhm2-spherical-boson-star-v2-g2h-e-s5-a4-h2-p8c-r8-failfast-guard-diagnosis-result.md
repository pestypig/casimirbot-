Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R8 fail-fast remote-guard diagnosis result
Current maturity: authenticated candidate-neutral transport diagnosis PASS; terminal P8C archive remains unretrieved
Target maturity: separately authorized, identity-safe SSH host-key reconciliation followed by authenticated archive retrieval
Required frozen inputs: R8 proposal `f4d1558a...8fa22`, ledger `9129d67b...e0c6d`, and bounded Cloud Shell observations
Required evidence: exact two-command chronology, authenticated stopped VMs, exact 11-file identities, archive state, bounded remote-guard receipts, and independent result audit
Stop/fail criteria: R8 is exhausted; no retry, host-key-store mutation, VM action, archive transfer, numerical work, or authority promotion
Explicit non-goals: treating transport diagnosis as a P8C scientific result, bypassing SSH identity checks, candidate work, Rust/G3/SI/metric/lane work, or physical claims
Downstream gate unlocked: one separately frozen authenticated SSH host-key reconciliation packet; retrieval remains separately gated

# H2-P8C-R8 fail-fast remote-guard diagnosis result

Status date: August 30, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / PASS AT READ-ONLY TRANSPORT-DIAGNOSIS BOUNDARY**.

The exact health command returned `R8_CONNECTION_READY`, after which the exact
1,671-character project-bound fail-fast inspection command ran once. It
authenticated both the original P8C VM and rescue VM as `TERMINATED`, read and
hashed the exact 11 existing R6 stage files, observed `procedure_exit=255` and
`archive_state=ABSENT`, and bounded the remote-guard receipts.

The remote guard never reached the rescue guest. Cloud Shell rejected the IAP
SSH connection because its stored key for instance
`compute.3332429239243725178` no longer matched the presented host key. The
receipt reports `REMOTE HOST IDENTIFICATION HAS CHANGED!`, identifies line 10
of `/home/pestypig/.ssh/google_compute_known_hosts`, records fingerprint
`SHA256:ijX48Sh5o6lAfXmhYGrq+anJLuRA19XsvppsOcL3XFw.`, then terminates with
`Host key verification failed.` and return code 255.

This is an authenticated transport-identity failure before the remote guest
guard, not an H2 or P8C scientific failure. No archive was copied, no
numerical process ran, no candidate was evaluated, and no authority changed.
The retained rescue archive is not modified by this diagnosis.

## Immutable evidence

- result SHA-256:
  `590c56d9faeaac51e3366a6f85a8b0b76a79ea35b3356f374d42dbdb84c8a9b1`;
- classification:
  `AUTHENTICATED_R6_TRANSPORT_FAIL_STALE_CLOUD_SHELL_SSH_HOST_KEY_EXIT_255`;
- independent result audit: **22/22 PASS**;
- audit receipt SHA-256:
  `95f96892c8e3b58e246310c6e7d931e1d56fbd0c6aacd59cdc23410b0bacffb5`;
- procedure exit observed: 255;
- remote-guard stderr: 1,696 bytes at
  `fef54d29...e893`;
- remote-guard stdout: empty;
- archive observed in Cloud Shell: absent;
- resource mutations, numerical actions and candidate evaluations: 0;
- every authority lock: false.

R8 is not eligible for retry. The next packet must authenticate the rescue
VM's current host key through a trusted Google Compute identity surface before
authorizing any exact stale-entry replacement. Disabling strict host-key
checking or blindly accepting a replacement key is not an admissible
successor. Archive retrieval and the frozen P8C scientific audit remain later,
separate actions.
