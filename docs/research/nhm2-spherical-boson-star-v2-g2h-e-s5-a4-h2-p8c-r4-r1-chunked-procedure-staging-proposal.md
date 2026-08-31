Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R4-R1 short-chunk Cloud Shell procedure staging
Current maturity: closed authenticated staging PASS; executed once and exhausted; no procedure execution
Target maturity: exact 4,115-byte retrieval procedure present and hash-verified at the frozen Cloud Shell path without VM activity
Required frozen inputs: exhausted R4 result `eec24a3f...4b136`, source `a4104d49...ed79b`, and chunk manifest `3477c768...6570f`
Required evidence: all three paths initially absent, 15 ordered chunk writes, base64 length/hash, decoded byte/hash equality, non-clobbering final move, final identity, complete chronology, and independent audit
Stop/fail criteria: first path/chunk/length/hash/decode/move mismatch terminal; no duplicate command, retry, fallback, deletion, execution, VM action, or authority promotion
Explicit non-goals: browser file upload, executing the staged procedure, VM restart, SSH/SCP, archive retrieval, candidate evaluation, positive sampling, Rust/G3/SI/metric/lane work, or physical/propulsion/transport claims
Downstream gate unlocked: a separately frozen short-command R4 retrieval execution proposal only after authenticated staging PASS

# H2-P8C-R4-R1 chunked procedure-staging proposal

Status date: August 29, 2026.

Status: **AUTHENTICATED PASS / EXECUTED ONCE / EXHAUSTED**.

R4 failed before file selection because the hidden browser file input did not
open a chooser. R4-R1 changes only the staging transport. It preserves the
same 4,115 source bytes and replaces browser file upload with 15 short,
pre-hashed RFC4648 base64 chunks entered through the already authenticated Cloud
Shell terminal.

The protocol contains exactly 19 commands:

1. prove the destination, base64-partial and decoded-temporary paths are absent;
2. write chunks 1 through 15 in exact order using `printf '%s'`, one exclusive
   first write followed by 14 appends;
3. verify the 5,488-character aggregate and its ASCII SHA-256;
4. decode into the initially absent temporary path and verify 4,115 bytes plus
   the source SHA-256;
5. move the temporary non-clobberingly to the destination and verify it again.

The longest derived command is 573 characters, below the frozen 640-character
limit. The partial base64 file is preserved on either PASS or first failure;
no cleanup or deletion is authorized.

## Frozen identities

- proposal: 4,024 bytes, SHA-256 `44d655c6824da8a3f96878b59e8129900acdfa8c00c356235569bcc9bf2b6968`;
- chunk manifest: 7,780 bytes, SHA-256 `3477c768f088c2cc71c302a137fb05275cfdadde8ca7169e1388636cdf46570f`;
- original procedure: 4,115 bytes, SHA-256 `a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b`;
- aggregate base64: 5,488 characters, ASCII SHA-256 `8a17a8609a3d9bd43b5e64a7ca03350990183b32eb23167a3a2af9f874bc6bf0`;
- chunks: exactly 15, maximum 384 characters;
- terminal commands: exactly 19, observed maximum 573 characters;
- independent audit: **30/30 PASS**;
- audit receipt SHA-256: `23c6b39e841e17d67c979e4ba5ce94cd690f68124b2dc60110d5e3ae0ba96f1c`;
- audit source SHA-256: `2a206553c490e3e5d3ec344b0eae91fb213daf5bde41f3660f43305b2b76e65b`;
- cloud, VM, SSH/SCP, archive, Docker, numerical and candidate actions during
  preparation: zero.

This packet changes staging transport and receipt semantics only. It changes no
mathematical definition, selector, threshold, runtime authority, candidate
identity, scientific handler, or claim status.

## Current-head verification

- math registry validation: **323/323 PASS**;
- required WARP battery: **18/18 files and 179/179 tests PASS**;
- Casimir adapter run: **2584 PASS/GREEN**, `firstFail=null`;
- certificate SHA-256: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: **true**.

These checks authenticate the current repository and the inert proposal. They
do not authorize staging, retrieval, numerical execution, candidate evaluation,
or any authority promotion.

## Exact authorization text

> I authorize exactly one H2-P8C-R4-R1 chunked Cloud Shell staging protocol under proposal SHA-256 `44d655c6824da8a3f96878b59e8129900acdfa8c00c356235569bcc9bf2b6968` using the exact 15-chunk manifest SHA-256 `3477c768f088c2cc71c302a137fb05275cfdadde8ca7169e1388636cdf46570f`. Require the destination `/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh`, base64 partial `/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh.b64.r4r1`, and decoded temporary `/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh.tmp.r4r1` all to be initially absent. Enter exactly the 19 manifest-derived commands in order, with no duplicate or blank command: one absence guard; 15 ordered `printf '%s'` chunk writes using one exclusive first write and 14 appends; one exact 5,488-character/base64 SHA-256 verification; one decode-to-temporary and exact 4,115-byte/SHA-256 verification; and one non-clobbering move plus final SHA-256 verification. Preserve complete or partial staging evidence and preserve all intermediate files. First failure is terminal, with no retry or fallback. Do not execute, source, edit, chmod, replace, retry, or delete the staged procedure or intermediate files. I do not authorize browser file upload; starting or restarting either VM; creating, modifying, attaching, detaching, mounting, or deleting any cloud resource; SSH, SCP, archive copy or download; Docker, containerd, build, diagnostic or numerical execution; additional file or command transmission; resource substitution, retune, frozen-candidate evaluation, positive sampling, candidate/scientific root or handler creation, Rust/G3/SI/metric/lane work, evidence deletion, or any candidate, proof, geometry/state, lane, lamp, physical, propulsion, or transport authority promotion.

No Cloud Shell or cloud-resource action occurred while preparing this packet.

## Execution closure

The separately authorized protocol completed once. All 19 command hashes
matched the frozen ledger; the observed markers were `R4R1_PATHS_ABSENT`,
`R4R1_BASE64_PASS`, `R4R1_TEMP_PASS` and `R4R1_STAGE_PASS`. The immutable
[R4-R1 staging result](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8c-r4-r1-chunked-procedure-staging-result.md)
passes 19/19 at receipt `6d60f0f9...c4bc7b`. The final 4,115-byte procedure
matches SHA-256 `a4104d49...ed79b`. It was not executed or sourced; VM,
numerical and candidate actions remained zero. This authorization is exhausted
and must not be reused.
