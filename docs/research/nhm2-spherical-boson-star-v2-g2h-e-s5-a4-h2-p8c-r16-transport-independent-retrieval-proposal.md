Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R16 transport-independent guest-attribute archive retrieval
Current maturity: frozen executable proposal; independent static audit 44/44 PASS
Target maturity: authenticated local capture and unchanged frozen P8C result audit
Required frozen inputs: R15 mismatch result, retained read-only clone, exact archive identity, R16 scripts, active charter, and explicit R16 operator direction
Required evidence: stopped topology, boot-first writable channel, read-only hot attach, exact archive bytes/hash, bounded guest chunks, unmount, helper termination, Cloud Shell reconstruction, local capture, and independent result audit
Stop/fail criteria: first failure terminal; one helper only; no retry, substitution, source write, SSH trust mutation, numerical execution, or missing terminal receipt
Explicit non-goals: candidate evaluation, positive sampling, retuning, Rust/G3/SI/metric/lane work, evidence deletion, or authority promotion
Downstream gate unlocked: H2-P8D result-only causal classification after and only after an authenticated P8C terminal-result audit

# H2-P8C-R16 transport-independent retrieval proposal

Status date: August 30, 2026.

Status: **FROZEN / AUTHORIZED / AUDITED 44/44 PASS**.

R15 authenticated that the retained rescue disk's offline Ed25519 host key is
not the key previously presented to the SSH client. R16 therefore does not
reconcile, replace or trust either SSH identity. It bypasses SSH entirely and
uses the Google Compute guest-attribute channel that R15 already authenticated
on a writable helper boot.

The bounded ordering is:

1. require every existing `nhm2-h2-` VM stopped;
2. detach the retained clone from the stopped R15 helper;
3. create one new `e2-small` with only its writable boot disk;
4. require `RUNNING` plus guest state `WAITING_FOR_SOURCE`;
5. hot-attach the retained clone once in `READ_ONLY` mode;
6. mount its one unambiguous filesystem read-only and authenticate only the
   existing 16,443-byte archive;
7. copy that archive into writable helper storage, unmount the clone, and then
   publish four bounded base64 chunks through namespace `nhm2-r16`;
8. reconstruct and rehash the archive in Cloud Shell;
9. require helper termination and detach the source clone again;
10. download the exact archive into the frozen local capture and run the
    unchanged P8C result audit.

The helper cannot execute the H2 binary and contains no candidate input. The
source clone is never mounted read-write. Guest attributes carry only the exact
hash-bound archive and small receipt fields.

## Frozen bounds and identities

- helper: `nhm2-h2-p8c-transport-r16-e2-small-20260830`;
- one `e2-small`, one 10 GB `pd-standard` boot disk;
- 1,800-second aggregate runtime and `$1.00` ceiling;
- at most one running VM and no resource deletion;
- expected archive: 16,443 bytes,
  `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`;
- startup procedure: 3,389 bytes,
  `2f2f89a7682c6bbb31ea5823698c980327867d28a87600764dda9c47a781e992`;
- Cloud Shell procedure: 9,178 bytes,
  `d5754639ed1e641c2c12c6dfddd9d41c19ceecfe2e2964691f5844bfea5f9eec`;
- proposal SHA-256:
  `e10689d583b122119007fa963958456c87b7251b9c965f8dadf7600efff866ad`;
- independent proposal audit: **44/44 PASS**;
- proposal-audit source SHA-256:
  `7dc752889aa574d0bbea830f03ff1cca60eada5638e6535eb5904777d67f91ec`;
- every authority lock remains false.

No VM or cloud resource is created by freezing this proposal. The user's
explicit R16 direction plus the active bounded-continuation charter authorize
one execution within these exact limits.
