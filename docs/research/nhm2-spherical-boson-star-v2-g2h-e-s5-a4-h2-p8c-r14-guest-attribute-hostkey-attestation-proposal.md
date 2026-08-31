Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R14 guest-attribute rescue-disk host-key attestation
Current maturity: frozen inert proposal; independent static audit 31/31 PASS
Target maturity: authenticated MATCH or MISMATCH decision for the retained rescue boot disk's Ed25519 key
Required frozen inputs: R13 result, retained R13 read-only clone, expected R8 fingerprint, exact R14 scripts, active charter, and stopped topology
Required evidence: exact startup identity, read-only device and filesystem guards, bounded public-key receipt, guest-attribute verdict, unmount, helper termination, immutable Cloud Shell evidence, and independent audit
Stop/fail criteria: first failure terminal; one helper creation/start; no retry, resource substitution, source write, second live VM, or missing terminal receipt
Explicit non-goals: serial-console reliance, known-hosts mutation, P8C archive retrieval, candidate evaluation, retuning, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: MATCH permits a separately bounded stale-known-hosts reconciliation; MISMATCH preserves a transport-identity blocker for review

# H2-P8C-R14 guest-attribute host-key attestation proposal

Status date: August 30, 2026.

Status: **FROZEN / INERT / AUDITED 31/31 PASS**.

R13 proved the exact startup script and read-only clone attachment were bound,
but its sole serial evidence channel returned zero bytes. R14 changes only the
evidence channel and helper identity. It reuses the retained R13 clone, mounts
it read-only, derives the offline rescue disk's Ed25519 fingerprint, and writes
bounded receipt fields to both the helper boot disk and Compute guest
attributes before powering off. Serial output is not used for acceptance.

The result is observational: `MATCH` or `MISMATCH`. Either value is evidence,
not a retry trigger. A match would authenticate the stale R8-presented key and
make a separately bounded known-hosts reconciliation eligible. A mismatch
would preserve the transport blocker. Neither result is a P8C numerical or
boson-star scientific verdict.

## Frozen bounds

- project/zone: `dark-stratum-455714-h4` / `us-central1-a`;
- helper: one `e2-small` with one 10 GB `pd-standard` boot disk;
- source: retained `nhm2-h2-p8c-rescue-hostkey-clone-r13-20260830`, attached
  `READ_ONLY`;
- at most one running VM;
- 1,800-second aggregate runtime and `$1.00` ceiling;
- no retry, substitution, deletion, SSH/SCP, candidate or numerical action;
- every authority lock remains false.

## Frozen script identities

- startup procedure: 2,675 bytes,
  `e76e4104934cd3d16a1cc8de53e0ec5dbd2fb0dfce069ec1a8dc12ef8b27c86f`;
- Cloud Shell orchestration: 5,696 bytes,
  `518edbe9bf8ae4ede18f7a943ae82034aaea9aaf3d9e1e4798c93fa740a7d3ca`.

## Frozen proposal identity

- proposal SHA-256:
  `e1261d7351b12c806d2aadeea940dcdc7a61c24dc8f68ac10bdb24d187e01fa2`;
- independent proposal audit: **31/31 PASS**;
- audit source SHA-256:
  `031e644c34ca1e8389de62de817d36a1a544e67aeabb2079fd23a235906c9d3e`.

No cloud resource is created by this proposal alone.
