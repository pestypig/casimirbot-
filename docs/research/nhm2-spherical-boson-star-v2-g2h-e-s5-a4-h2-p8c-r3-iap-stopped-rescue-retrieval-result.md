Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R3 IAP stopped-rescue retrieval result
Current maturity: immutable incomplete retrieval after authenticated IAP guest guard
Target maturity: authenticated local capture of the existing P8C terminal archive and unchanged frozen result audit
Required frozen inputs: R3 proposal `ad21f1ca...efe7`, stopped original/rescue VMs, exact source archive identity, and read-only clone
Required evidence: one restart, IAP guard result, SCP receipts, archive identity at Cloud Shell and locally, terminal stop, and unchanged result audit
Stop/fail criteria: first incomplete or failed boundary terminal; no R3 retry, fallback, resource mutation, numerical action, or authority promotion
Explicit non-goals: candidate evaluation, positive sampling, archive recreation, resource repair, Rust/G3/SI/metric/lane work, or physical/propulsion/transport claims
Downstream gate unlocked: one separately frozen candidate-neutral retrieval successor, if justified and separately authorized

# H2-P8C-R3 IAP stopped-rescue retrieval result

Status date: August 29, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / INCOMPLETE AFTER IAP GUARD**.

The R3 command was submitted once. Its initial stopped-state checks passed, the
rescue VM started once, and the exact IAP guest guard authenticated:

- archive size: 16,443 bytes;
- archive SHA-256: `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`;
- clone device: `/dev/sda`;
- clone read-only: true;
- clone mounted: false.

The stage contains no SCP stdout/stderr, no Cloud Shell archive hash/stat, and
no post-stop instance receipt. Therefore the observed shell exit `0` is not an
authenticated retrieval success. A later read-only check found both VMs
`TERMINATED` and the expected Cloud Shell archive absent. The browser download
dialog then interpreted the missing path as the broader `pestypig` home item;
that zero-progress transfer was cancelled immediately and produced no local
file. No second copy, restart, fallback, or numerical action was attempted.

The most likely explanation is that the long inline terminal payload ended at
the successful IAP guard boundary before reaching its SCP section. This is an
inference from the exact stage inventory, not a promoted fact. R3 is exhausted
regardless of that diagnosis.

## Immutable evidence

- proposal SHA-256: `ad21f1ca165da8f89cf48a97d35c95b70f3241a66ca7c1c3c1bbc7cbb5d0efe7`;
- partial evidence archive: 2,191 bytes, SHA-256 `4281bf467d6dc2067f3260b511014d0eddedb2285868ccee43cf39080c2707c9`;
- independent result audit: **19/19 PASS**;
- result classification: `INCOMPLETE_AFTER_IAP_GUARD_BEFORE_SCP_EVIDENCE`;
- result-audit receipt SHA-256: `91e647cabb7a16eff49d84b4c75a4ef41cdc7cf25e26b8b905e908ecc23428c4`;
- result-audit source SHA-256: `ec390a27cd88cc3d974210b0386d5b2e7eb86419632a24277897ade97a8a8b08`;
- restart attempts consumed: 1 of 1;
- IAP guard authenticated: true;
- SCP execution authenticated: false;
- terminal archive retrieved locally: false;
- numerical actions executed: 0;
- authority promoted: false.

The unchanged frozen P8C scientific result audit remains **1/25 FAIL / AUDIT_FAIL**
at SHA-256 `8c7131a28b7072a40dfc519b4b999c3b01174d05c76b59dad5acd1375a8fc952`
because the terminal archive is absent locally. This is an evidence-incomplete
result, not a scientific PASS or FAIL for P8C.

Current-head verification is green: math validation **323/323**, the required
WARP battery **18/18 files and 179/179 tests**, and Casimir adapter run
**2581 PASS/GREEN** with `firstFail=null`, certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
and integrity true. These checks authenticate the fail-closed record and
repository gates only; they do not authenticate a P8C scientific result.
