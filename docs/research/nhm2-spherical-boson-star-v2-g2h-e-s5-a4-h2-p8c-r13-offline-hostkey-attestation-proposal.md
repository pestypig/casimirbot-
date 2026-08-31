Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R13 offline rescue-boot-disk host-key attestation
Current maturity: executed once; exhausted; immutable result recorded separately
Target maturity: source-disk host-key attestation through a read-only derivative
Required frozen inputs: R12 result, active charter, exact R13 scripts and ledger, retained rescue boot disk, and R8-presented fingerprint
Required evidence: exact staged identities, stopped topology, snapshot/clone/helper chronology, read-only mount, source-key fingerprint, helper stop, and immutable receipts
Stop/fail criteria: first failure terminal; one helper start; no retry, source mutation, second live VM, SSH/SCP, or scientific execution
Explicit non-goals: known-hosts mutation, P8C archive retrieval, candidate evaluation, positive sampling, retuning, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: authenticated transport-identity decision before any stale-known-hosts reconciliation

# H2-P8C-R13 offline host-key attestation proposal

Status date: August 30, 2026.

Status: **EXECUTED ONCE / EXHAUSTED**.

R13 froze a candidate-neutral offline attestation path under the active bounded
continuation charter. It bound one standard snapshot of the retained stopped
rescue boot disk, one 10 GB `pd-standard` derivative, and one `e2-small` helper
with the derivative attached read-only. The exact startup procedure was to
mount one unambiguous filesystem read-only, derive the Ed25519 public-key
fingerprint from `/etc/ssh/ssh_host_ed25519_key.pub`, compare it with the
R8-presented fingerprint, unmount, and power off. Serial-console output was the
sole frozen result channel.

## Frozen identities

- proposal SHA-256:
  `87df2de9fdd0c5a23a5bbcafd534f90a9a0f72837f8273bc60175f54944c547f`;
- independent proposal audit: **32/32 PASS**;
- audit receipt SHA-256:
  `e9f0d11868299406cc04ec09638be9c5fab83e916995b921434a6cabc1e785ff`;
- startup script: 2,073 bytes,
  `ce28f18db5f4e8acc2a5a288c23975abae05f169343ef308df8731e3c8a8b040`;
- Cloud Shell orchestration: 5,716 bytes,
  `3368d6332e1340a1622fc490e5da7ca72c452fcd3536682f82c0f224aef08723`;
- command ledger: 964 bytes,
  `2fe3e2e87aa5cc9347a90779d556427e99837db2867304f6764f136811a5d231`;
- expected rescue fingerprint:
  `SHA256:ijX48Sh5o6lAfXmhYGrq+anJLuRA19XsvppsOcL3XFw`.

The one execution is classified in the separate
[R13 result](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8c-r13-offline-hostkey-attestation-result.md).
