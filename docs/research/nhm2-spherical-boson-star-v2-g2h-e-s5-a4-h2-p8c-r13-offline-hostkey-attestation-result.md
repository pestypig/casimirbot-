Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R13 offline rescue-boot-disk host-key attestation result
Current maturity: executed once; exhausted; blocked on empty serial evidence; independent result audit required
Target maturity: separately versioned stopped-disk evidence-channel repair that authenticates the rescue-disk host key
Required frozen inputs: R13 proposal, exact staged scripts, retained R13 resources, Cloud Shell chronology, and bounded post-stop diagnosis
Required evidence: resource identities/states, exact startup binding, serial byte counts, guest-attribute scope, action counts, chronology deviation, authority locks, and independent audit
Stop/fail criteria: R13 may not be retried; helper guest keys may not be reinterpreted as source-disk keys; no candidate or numerical work
Explicit non-goals: known-hosts mutation, P8C archive retrieval, candidate evaluation, retuning, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: candidate-neutral R14 evidence-channel design using retained stopped resources and no reinterpretation of R13

# H2-P8C-R13 offline host-key attestation result

Status date: August 30, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / BLOCKED ON EMPTY SERIAL EVIDENCE**.

R13 passed its connection and preflight guards, created exactly one standard
snapshot, one 10 GB `pd-standard` clone and one `e2-small` helper, and attached
the clone to the helper in `READ_ONLY` mode. The helper started once, entered
`STOPPING`, and reached `TERMINATED` after approximately two minutes. The
original P8C and rescue VMs remained stopped, and the post-stop inventory found
zero running `nhm2-h2-` VMs.

The frozen orchestration then retrieved a zero-byte serial-port-1 file. Its
first serial marker check therefore failed closed before post-state receipts or
`R13_ATTESTATION_COMPLETE`. A bounded read-only post-stop diagnosis confirmed:

- serial ports 1 and 2 remain zero bytes;
- the helper metadata contains the exact 2,073-byte startup script at SHA-256
  `ce28f18d...8b040`;
- the retained source clone was attached `READ_ONLY`;
- the snapshot and clone are `READY`; and
- the helper remains `TERMINATED`.

The helper's guest attributes contain its own generated ECDSA, Ed25519 and RSA
host keys. Those keys belong to the helper VM, not to the offline rescue boot
disk mounted by the startup procedure. Their mismatch with the expected rescue
fingerprint is therefore neither a source-key mismatch nor a trust result.
R13 did not produce the evidence needed to determine whether the retained
rescue-disk key matches the R8-presented fingerprint.

## Chronology note

While the R13 process was still active, the browser DOM rendered a prompt-like
surface and one additional read-only diagnostic command was submitted. It was
queued behind the active process, did not execute concurrently, performed no
mutation, and did not affect helper execution. The deviation is preserved as
evidence rather than omitted. Four later post-stop diagnostic commands were
read-only and did not restart or alter any VM or disk.

## Immutable result

- result SHA-256:
  `7fb529b9b356418acd6e4b214489eb35482a3a4e872666da44d37e6415e89872`;
- independent result audit: **34/34 PASS**;
- classification:
  `BLOCKED_EMPTY_SERIAL_EVIDENCE_AFTER_HELPER_TERMINATION`;
- R13 invocations: 1;
- retries: 0;
- resources created: 3; resources deleted: 0;
- helper starts: 1; explicit helper stop calls: 0;
- SSH/SCP, numerical and candidate actions: 0;
- original and rescue VMs: `TERMINATED`;
- helper VM: `TERMINATED`;
- every authority lock: false.

R13 is consumed and may not be retried. The next legitimate lead is a new
candidate-neutral evidence-channel packet that obtains the offline source-disk
result without relying on serial-console persistence. It must reuse or inspect
retained evidence without treating helper guest keys as rescue-disk evidence.
