Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R8 fail-fast remote-guard diagnosis
Current maturity: frozen inert corrected read-only proposal; no cloud command executed
Target maturity: authenticated stopped-VM states, stage hashes, archive state, and bounded remote-guard cause
Required frozen inputs: R7 result `5e8261c9...adbc`, audit `631d1103...2298`, and R8 ledger `9129d67b...0c6d`
Required evidence: exact marker, project-bound VM reads, fail-fast guards, 11 bounded file identities, archive state, remote-guard excerpts, and independent audit
Stop/fail criteria: first connection, project, VM, file, bound, hash, or receipt mismatch terminal; no retry or fallback
Explicit non-goals: VM/resource mutation, file write/copy/download/delete, P8C audit, numerical/candidate execution, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: bounded terminal-cause classification and then a separately frozen archive/evidence decision

# H2-P8C-R8 fail-fast remote-guard diagnosis proposal

Status date: August 30, 2026.

Status: **FROZEN / INERT / AWAITING SEPARATE AUTHORIZATION**.

R8 corrects both defects exposed by R7. Its inspection begins with
`set -euo pipefail` and supplies `--project dark-stratum-455714-h4` to both
read-only VM descriptions. It then requires both VMs terminated, hashes each
of the exact 11 stage files under a 65,536-byte per-file cap, reports archive
presence, and reads at most 120 lines from each remote-guard receipt. It contains
no cloud or filesystem mutation.

## Frozen identities

- proposal SHA-256:
  `f4d1558a6219697e06628ff4c728d609a50b1073b22b34a5260cb053a1f8fa22`;
- independent proposal audit: **15/15 PASS**;
- audit receipt SHA-256:
  `1b4c4664c32bfa04ebf51d80d3f8173c539b1f71cb0750c0806882e12b5ba11c`;
- command ledger: 1,708 bytes, SHA-256
  `9129d67bcf78e284c5a16551156ff6c7de7d00c0be18b39081da3c07322e0c6d`;
- command 1: 35 characters, SHA-256
  `31993c55d18ae60fc3b5ff0a07b4052001aeb7a30f118c2f988c20fd8c37373a`;
- command 2: 1,671 characters, SHA-256
  `293a0caa5aaac059d7c922b248489ebf1151d2b79a6664d2591e9418d1bbbc39`;
- preparation cloud/resource/numerical actions: zero;
- every authority lock: false.

## Exact authorization text

> I authorize exactly one H2-P8C-R8 fail-fast remote-guard diagnosis execution under proposal SHA-256 `f4d1558a6219697e06628ff4c728d609a50b1073b22b34a5260cb053a1f8fa22` using the preserved authenticated Cloud Shell session for project `dark-stratum-455714-h4`. Enter exactly two commands in order from the frozen 1,708-byte command ledger SHA-256 `9129d67bcf78e284c5a16551156ff6c7de7d00c0be18b39081da3c07322e0c6d`. First enter the exact 35-character health command SHA-256 `31993c55d18ae60fc3b5ff0a07b4052001aeb7a30f118c2f988c20fd8c37373a` and require exact output `R8_CONNECTION_READY`. Only after that marker, enter the exact 1,671-character fail-fast read-only inspection command SHA-256 `293a0caa5aaac059d7c922b248489ebf1151d2b79a6664d2591e9418d1bbbc39`. It must bind project `dark-stratum-455714-h4` explicitly, require both P8C VMs `TERMINATED`, read and hash only the exact 11 existing R6 stage files under the 65,536-byte per-file cap, report archive state, and print at most 120 lines from each existing remote-guard receipt. First failure is terminal and consumes R8. I do not authorize retrying R7 or R8; blank, duplicate or additional commands; starting, stopping, restarting, creating, modifying, attaching, detaching, mounting or deleting any cloud resource; changing firewall or IAM; writing, moving, copying, downloading or deleting any file or evidence; Docker, build, diagnostic or numerical execution; P8C result audit; candidate evaluation, positive sampling, root or handler creation, Rust/G3/SI/metric/lane work, retuning, or any authority promotion.

No cloud action occurred while preparing this packet.

