Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R7 read-only stage/archive disambiguation
Current maturity: frozen inert no-restart inspection proposal; no cloud command executed
Target maturity: authenticated R6 procedure exit, stage inventory, and Cloud Shell archive presence/identity
Required frozen inputs: R6 result `377b66e2...54b6e`, audit `372c490d...5170`, two-command ledger `9c6fc58b...4b9f4`, and archive `9535ce13...bd4d`
Required evidence: exact connection marker, both VM statuses terminated, exact stage/exit inventory, archive state/bytes/hash, and independent result audit
Stop/fail criteria: first connection, command, VM status, stage, exit, inventory, or identity mismatch terminal; no retry or fallback
Explicit non-goals: VM restart/stop, cloud mutation, evidence write/delete, archive download, P8C audit, numerical/candidate work, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: archive capture if exact archive is present, or bounded causal classification if absent/nonzero

# H2-P8C-R7 read-only disambiguation proposal

Status date: August 30, 2026.

Status: **FROZEN / INERT / AWAITING SEPARATE AUTHORIZATION**.

R7 reads only the already-existing R6 boundaries. After a short connection
marker, one exact inspection command reads both VM statuses, the R6 stage
directory, `procedure.exit`, its deterministic file inventory, and whether the
Cloud Shell archive is absent or present with exact bytes/hash. It contains no
start, stop, copy, move, delete, mount, Docker, or numerical command.

## Frozen identities

- proposal SHA-256:
  `5fbd0adc2946a2bc8cb3b82e5169034e8f46b765c44dee4125ac1285bfa88408`;
- independent proposal audit: **15/15 PASS**;
- audit receipt SHA-256:
  `bf7ff7e39ccb9a0564efbe0b78bcbd0a9770457a7b3b93fedcb2c5d6c5f9db3f`;
- command ledger: 1,043 bytes, SHA-256
  `9c6fc58b0acf1ac9d46d7b81d04cd4a7e3a6ffa6d516a86b3e9fe2c6a304b9f4`;
- command 1: 35 characters, SHA-256
  `525ffa887cebaeb2856d94e4ba3376290d0f1d35e111fe55d789a9bc4eef260e`;
- command 2: 1,006 characters, SHA-256
  `350de3aa7650232eb78b2132008f556536ba0f76d9b470683ee6057c1e68215c`;
- preparation cloud/resource/numerical actions: zero;
- every authority lock: false.

## Exact authorization text

> I authorize exactly one H2-P8C-R7 read-only disambiguation execution under proposal SHA-256 `5fbd0adc2946a2bc8cb3b82e5169034e8f46b765c44dee4125ac1285bfa88408` using the preserved authenticated Cloud Shell session for project `dark-stratum-455714-h4`. Enter exactly two commands in order from the frozen 1,043-byte command ledger SHA-256 `9c6fc58b0acf1ac9d46d7b81d04cd4a7e3a6ffa6d516a86b3e9fe2c6a304b9f4`. First enter the exact 35-character health command SHA-256 `525ffa887cebaeb2856d94e4ba3376290d0f1d35e111fe55d789a9bc4eef260e` and require exact output `R7_CONNECTION_READY`. Only after that marker, enter the exact 1,006-character read-only inspection command SHA-256 `350de3aa7650232eb78b2132008f556536ba0f76d9b470683ee6057c1e68215c`. It may only read both VM statuses, require both `TERMINATED`, read the existing R6 stage directory and `procedure.exit`, list its files, and report whether the existing Cloud Shell archive is absent or present with its byte count and SHA-256. First failure is terminal and consumes R7. I do not authorize retrying R6 or R7; blank, duplicate or additional commands; starting, stopping, restarting, creating, modifying, attaching, detaching, mounting or deleting any cloud resource; changing firewall or IAM; writing, moving, copying, downloading or deleting any file or evidence; Docker, build, diagnostic or numerical execution; P8C result audit; candidate evaluation, positive sampling, root or handler creation, Rust/G3/SI/metric/lane work, retuning, or any authority promotion.

No cloud action occurred while preparing this packet.

