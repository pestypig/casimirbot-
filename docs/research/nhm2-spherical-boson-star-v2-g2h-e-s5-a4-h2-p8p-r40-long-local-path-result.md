Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R40 stopped-disk R39 fixture-evidence recovery
Current maturity: immutable one-shot result; read-only recovery archive created and authenticated remotely; final long-path local SCP failed
Target maturity: exact short-path retrieval and local classification of the already-created archive
Required frozen inputs: R40 proposal/controller, immutable local receipts, exact stopped source/helper and derivative resources, and exact remote archive identity
Required evidence: source/helper/resource identities, read-only mount receipt, remote archive marker, one short-path copy, byte/hash agreement, helper stop, and independent audit
Stop/fail criteria: R40 retry, source VM restart, archive recreation/mutation, second helper, writable mount, numerical/Docker start, candidate ingress, retune, evidence deletion, or authority promotion
Explicit non-goals: repeating rescue computation, changing the fixture, P=1024/P=65,536 execution, frozen-candidate evaluation, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: only a separately authorized short-path retrieval of the existing archive

# H2-P8P-R40 long-local-path result

Status date: September 4, 2026.

Status: **R40 CONSUMED / READ-ONLY RECOVERY PASS / LOCAL LONG-PATH SCP FAIL**.

R40 executed once. It preserved the original R39 VM and source disk, created
the one authorized snapshot, 30 GB `pd-standard` clone and `e2-small` helper,
attached the clone `READ_ONLY`, and invoked the rescue procedure once. The
rescue procedure completed and printed:

```text
P8P_R40_EVIDENCE_READY bytes=12122 sha256=73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922
```

That marker is preserved in the 107-byte local `rescue.stdout.txt` at SHA-256
`6c61247fe3422324d832d9006ae2e084c3340286cc7435054045b4d99f4d4c18`.
It proves the exact 5,155-byte R39 guest export and bounded source evidence were
read through the derivative read-only filesystem and packaged into one
deterministic 12,122-byte archive on the helper boot disk.

The final SCP failed because Windows PSCP could not create the long repository
destination containing spaces and nested components. It did not modify the
remote archive. Cleanup stopped the helper. Current resource evidence binds:

- original VM `1893159507643031574`: `TERMINATED`, with no R40 restart;
- helper `7129462452423922626`: `TERMINATED`;
- evidence clone `1644965210306810875`: `READY`, attached `READ_ONLY`;
- snapshot `8812636912838152712`: `READY`.

R40 is consumed and may not be retried. Its sole supported successor is one
restart of the existing stopped helper solely to SCP the existing remote
archive to an initially absent short local path, verify its exact bytes/hash,
copy it into the preserved local evidence root, and stop the helper.

No Docker daemon, build, fixture, numerical executable, candidate, P=1024 or
P=65,536 process ran under R40. All scientific and physical authority remains
false.
