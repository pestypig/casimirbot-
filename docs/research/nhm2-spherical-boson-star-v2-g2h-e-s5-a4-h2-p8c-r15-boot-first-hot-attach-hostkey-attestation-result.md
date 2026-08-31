Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R15 boot-first/hot-attach host-key attestation result
Current maturity: executed once; exhausted; authenticated transport-identity mismatch; independent result audit required
Target maturity: separately bounded reconciliation of the stale/presented SSH identity before any archive retrieval
Required frozen inputs: R15 proposal, exact staged identities, retained source clone, guest-attribute receipt, and active charter
Required evidence: writable boot channel, read-only hot attach, offline key bytes/hash/fingerprint, comparison verdict, unmount, helper termination, action counts, and authority locks
Stop/fail criteria: R15 may not be retried; the mismatch is terminal under the charter; no archive retrieval may rely on the prior SSH identity
Explicit non-goals: candidate evaluation, P8C archive retrieval, known-hosts mutation, retuning, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: operator decision on a separately versioned identity-reconciliation path that treats the offline disk key as evidence, not automatic trust

# H2-P8C-R15 boot-first/hot-attach host-key attestation result

Status date: August 30, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / AUTHENTICATED MISMATCH**.

R15 repaired the duplicate-root-device failure from R14. It created exactly
one `e2-small` helper without the source clone, authenticated the helper's
writable boot and guest-attribute channel, and then hot-attached the retained
clone in `READ_ONLY` mode.

Inside the helper, the attestor authenticated the clone block device as
read-only, mounted its single `ext4` filesystem with `ro,noload`, measured the
offline Ed25519 public key, unmounted the source, and published a complete
guest receipt. The observed offline key is:

- public-key bytes: `123`;
- public-key SHA-256:
  `3ed0b57c0afd5013de29ea4202c6d47649f361da37a0a611b5452354b4472511`;
- observed fingerprint:
  `SHA256:+AxR3gjLhTLv3YqhYrJkfcTbsd1hvChsJ1T9UK5v7Ks`.

The fingerprint previously presented during the R8 SSH path was
`SHA256:ijX48Sh5o6lAfXmhYGrq+anJLuRA19XsvppsOcL3XFw`. These values differ, so
the authenticated R15 verdict is `MISMATCH`.

This does not by itself establish which earlier transport component supplied
the other key. It does establish that the prior SSH-presented identity cannot
be treated as the retained rescue boot disk's authenticated Ed25519 host key.
The charter requires a stop and operator direction at an evidence mismatch.

Post-execution state is:

- helper: `TERMINATED`;
- running `nhm2-h2-` VMs: `0`;
- retained source clone: still attached to the stopped helper, read-only;
- guest terminal: `COMPLETE`;
- source unmount: `PASS`;
- numerical and candidate actions: `0`;
- every authority lock: false.

No SSH, SCP, archive retrieval, candidate evaluation, numerical process,
resource deletion, retry, retune or authority promotion occurred. R15 is
consumed and may not be retried.

## Immutable identities

- proposal SHA-256:
  `4ad78a6fdac069422f3dd2144de156c46bbb87f09a6e65eda0880182862b5d30`;
- startup procedure SHA-256:
  `06b0fdd4d2df03d4135955f5de750efaa79ba755b0cdbbd617af980cc4bbb13d`;
- Cloud Shell procedure SHA-256:
  `df3f4aa4ea02fc67f176152f3e7e4c02c819802621a2d614daabee7892203249`;
- result SHA-256:
  `cd41d4f67bc92b704f478e0dc52e724cc7b20c79db058dc927afbc902815c24e`;
- independent result audit: **44/44 PASS**;
- result-audit source SHA-256:
  `8082db4b804b337f2d0b9c02a365eefa5be81626dd4e63c454c24688d890e881`.
