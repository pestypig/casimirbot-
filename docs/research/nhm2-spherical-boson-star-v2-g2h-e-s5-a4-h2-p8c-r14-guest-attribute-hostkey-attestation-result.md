Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R14 guest-attribute rescue-disk host-key attestation result
Current maturity: executed once; exhausted; blocked before startup-script execution; independent result audit required
Target maturity: separately versioned boot-first/hot-attach attestation that prevents root-device ambiguity
Required frozen inputs: R14 proposal, exact staged identities, retained helper/evidence, live serial diagnosis, stopped topology, and active charter
Required evidence: disk topology, kernel root identity, remount/startup-runner failure, empty guest channel, timeout cleanup, action counts, and authority locks
Stop/fail criteria: R14 may not be retried; no source-key verdict may be inferred; helper and all predecessors remain stopped
Explicit non-goals: candidate evaluation, P8C archive retrieval, known-hosts mutation, retuning, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: candidate-neutral R15 helper boot without source clone, followed by one read-only hot attach after writable-root attestation

# H2-P8C-R14 guest-attribute host-key attestation result

Status date: August 30, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / BLOCKED BEFORE STARTUP EXECUTION**.

R14 passed its connection, staged-file and cloud preflight guards and created
exactly one `e2-small` helper. Compute configuration shows the helper boot disk
as `READ_WRITE`, `boot=true`, and the retained evidence clone as `READ_ONLY`,
`boot=false`. The helper nevertheless selected `sdb1` as its kernel root via
`PARTUUID=e0c3e0fa-424a-438b-98e0-d8b92dbdfc3a`.

The live serial stream then showed `systemd-remount-fs` fail and repeated
read-only-root errors. Most decisively, Google's metadata startup runner
reported that it could not create its temporary script directory because the
filesystem was read-only. The R14 startup procedure therefore never ran, never
mounted the source through its own guards, and never evaluated the rescue-disk
fingerprint.

This is consistent with a duplicate-root-`PARTUUID` collision: both the fresh
helper boot disk and retained rescue clone derive from the same exact Debian
image, and the read-only clone was present during boot. This is a technical
inference from the authenticated topology and boot log; it is not a source-key
or P8C result.

The 900-second poll reached its terminal failure boundary with no `nhm2-r14`
guest attributes. The cleanup trap stopped the helper. Post-stop state is:

- helper: `TERMINATED`;
- running `nhm2-h2-` VMs: 0;
- `guest-attributes.json`: 3 bytes (`[]` plus newline);
- R14 guest-attribute records: 0;
- terminal marker: absent;
- numerical and candidate actions: 0;
- every authority lock: false.

One read-only diagnostic command was again queued behind the active process
after the terminal DOM rendered a false prompt-like surface. It did not execute
concurrently, mutate resources, or affect the helper. The deviation is
preserved in the result.

R14 is consumed and may not be retried. The minimal repair is now clear: create
the next helper without the clone, authenticate that its writable boot and
guest channel are live, and only then hot-attach the retained clone read-only.

## Immutable identities

- result SHA-256:
  `52d685963208bdf2d1f39771e14108797a52ddea1b6fdbf601a79e13e55aaed0`;
- independent result audit: **35/35 PASS**;
- result-audit source SHA-256:
  `fc1330fe637d1aa8441da860cb7218f82d018732a9d0a9d03cc10a6d5eb25d8e`.
