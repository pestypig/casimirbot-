Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R12 offline rescue-boot-disk host-key attestation
Current maturity: frozen proposal; independently audited 30/30 PASS; no R12 cloud resource created
Target maturity: one serial-console-authenticated offline host-key decision with every helper resource stopped and retained
Required frozen inputs: active bounded-continuation charter, R11 PASS result, exact rescue boot disk, R8-presented fingerprint, two authenticated scripts, and exact two-command ledger
Required evidence: source snapshot/clone identities, read-only guest block and mount state, exact public-key hash and OpenSSH fingerprint, serial chronology, helper stop state, and independent result audit
Stop/fail criteria: first mismatch or timeout is terminal; no retry, substitution, read-write mount, SSH/SCP, numerical execution, deletion, or authority promotion
Explicit non-goals: P8C archive retrieval, candidate evaluation, positive sampling, retuning, Rust/G3/SI/metric/lane work, or physical, propulsion, and transport claims
Downstream gate unlocked: reconciliation of the stale Cloud Shell host-key entry and authenticated retrieval/audit of the retained P8C archive

# H2-P8C-R12 offline host-key attestation proposal

Status date: August 30, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / BLOCKED BEFORE CLOUD ACTION**.

R11 authenticated the stopped rescue topology without mutating it. R12 is the
smallest offline successor: snapshot the stopped rescue boot disk, derive one
read-only clone, attach it read-only to one temporary `e2-small` helper, and
obtain the rescue SSH host-key fingerprint from the helper's serial console.
It does not use SSH or SCP and cannot run the P8C diagnostic or any numerical
executable.

## Frozen identities

- proposal SHA-256:
  `e9ee7ed7d8b77f8f144c7d97f9162ae301dba761a44174562c894f7001e2ef45`;
- independent proposal audit: **30/30 PASS**;
- audit receipt SHA-256:
  `83a530ba20f2d3b596b28cb4739f99f685366a7c04dc5561707b360564827f71`;
- startup procedure: 2,069 bytes,
  `f28efc172d7db843e328368fa03e2c5d48c6eea9346cbd3a96cc9a5dbcf7dc6f`;
- Cloud Shell orchestration procedure: 5,627 bytes,
  `58bd563f643b45310f9c6a8a04d088922ec4538ea9427dc6e48fd5e86b8e65c4`;
- two-command ledger: 964 bytes,
  `bb76e55a1fb598570366047a1e6d979066e10cea51b8471820668ff423d8a723`;
- expected fingerprint:
  `SHA256:ijX48Sh5o6lAfXmhYGrq+anJLuRA19XsvppsOcL3XFw`.

## Bounded execution

- project `dark-stratum-455714-h4`, zone `us-central1-a`;
- one standard snapshot of the stopped rescue boot disk;
- one 10 GB `pd-standard` snapshot clone;
- one temporary `e2-small` helper with a 10 GB `pd-standard` boot disk and
  exact Debian image `debian-12-bookworm-v20260817`;
- at most one running VM;
- 1,800-second aggregate helper runtime ceiling;
- `$1.00` immediate cost ceiling;
- 20 GB maximum new persistent disk capacity;
- no resource deletion and no second creation attempt.

The startup procedure accepts only one unambiguous ext4 or xfs partition. It
requires the attached clone block device to be read-only and mounts it only
with `ro,noload` or `ro,norecovery`. It reads only the rescue public host key,
derives the OpenSSH SHA-256 fingerprint, requires the exact R8-presented value,
unmounts, emits its terminal markers, and powers the helper off. The Cloud
Shell orchestration has a cleanup trap that stops the helper on PASS, FAIL, or
partial output.

The active charter authorization is recorded at
`4f28231a74f2919aab597dda754acce7f8d43e5ac2f60c110bb3a2b4e47680dc`
with 7/7 authorization audit
`10d2966c339e8bfd6a84addbcd97850cb3f316758e9a7e3d9a675c04a9c13a6d`.
No further scientific packet authorization is required. A short action-time
confirmation remains required immediately before the browser creates billed
resources.

Preparation and staging do not consume R12. The first authenticated invocation
does. Every candidate, proof, geometry/state, lane, lamp, physical, propulsion,
and transport authority lock remains false.

## Terminal execution update

The procedures were staged and hash-verified, and the connection marker passed.
The first authenticated invocation then stopped on its first read-only Google
Cloud query because Cloud Shell had no selected active account. It created no
resource and ran no numerical process. R12 result `f7e404f8...7fc5c` passes
independent audit 23/23 at `b4eb0f53...b431c`; R12 is exhausted and may not be
retried.
