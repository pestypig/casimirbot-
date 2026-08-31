Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R15 boot-first/read-only-hot-attach rescue-disk host-key attestation
Current maturity: frozen inert proposal; independent static audit 37/37 PASS
Target maturity: authenticated MATCH or MISMATCH decision without duplicate-root-PARTUUID ambiguity
Required frozen inputs: R14 result, retained R13 clone, expected R8 fingerprint, exact R15 scripts, active charter, and stopped topology
Required evidence: helper boot without clone, writable guest-channel marker, one read-only hot attach, source device/mount guards, bounded key receipt, verdict, unmount, stop, and independent audit
Stop/fail criteria: first failure terminal; one helper creation/start and one attach; no retry, substitution, source write, second live VM, or missing terminal receipt
Explicit non-goals: serial-console acceptance, known-hosts mutation, P8C archive retrieval, candidate evaluation, retuning, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: MATCH permits separately bounded known-hosts reconciliation and archive retrieval; MISMATCH preserves a transport-identity blocker

# H2-P8C-R15 boot-first/hot-attach host-key attestation proposal

Status date: August 30, 2026.

Status: **FROZEN / INERT / AUDITED 37/37 PASS**.

R14 authenticated the failure mechanism: the fresh helper boot disk and the
retained rescue clone expose the same image-derived root `PARTUUID`, and
attaching both at create time allowed the read-only clone to satisfy the
kernel's root selector. R15 removes that ambiguity by sequencing the same
candidate-neutral operation differently:

1. create the helper with only its writable boot disk;
2. require `RUNNING` plus guest state `WAITING_FOR_SOURCE`;
3. attach the retained clone once in `READ_ONLY` mode;
4. let the already-running startup procedure mount, inspect and unmount it;
5. preserve an authenticated `MATCH` or `MISMATCH` guest receipt and require
   the helper to terminate.

The startup procedure adds finite metadata request timeouts. It retains the
same bounded Ed25519 public-key read, expected fingerprint, read-only device and
filesystem guards, redundant helper-boot receipt and no-retune decision rule.

## Frozen bounds and identities

- one `e2-small`, one 10 GB `pd-standard` boot disk, one read-only hot attach;
- 1,800-second aggregate runtime and `$1.00` ceiling;
- cumulative charter storage remains below 60 GB;
- no retry, deletion, SSH/SCP, numerical or candidate action;
- startup procedure: 2,764 bytes,
  `06b0fdd4d2df03d4135955f5de750efaa79ba755b0cdbbd617af980cc4bbb13d`;
- Cloud Shell orchestration: 6,977 bytes,
  `df3f4aa4ea02fc67f176152f3e7e4c02c819802621a2d614daabee7892203249`;
- proposal SHA-256:
  `4ad78a6fdac069422f3dd2144de156c46bbb87f09a6e65eda0880182862b5d30`;
- independent proposal audit: **37/37 PASS** at source
  `67f4e8ef64a9b113066e406ad5bb8cc665084fb7e8180a44c6ccf6e961ca6c20`;
- every authority lock remains false.

No cloud resource is created by this proposal alone.
