Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R10 observable Google-API host-key preflight
Current maturity: frozen inert read-only proposal; no cloud command executed
Target maturity: authenticated key match or an observable exact first-failure boundary without terminal loss
Required frozen inputs: R9 result `c658f96f...7fdc`, R9 audit `ae5fa6fc...4f92e`, rescue instance ID `3332429239243725178`, and exact R10 command ledger
Required evidence: connection marker, ordered child-process step markers, stopped VM states, instance identity, bounded known-hosts and guest-attribute identities, derived fingerprints, and independent result audit
Stop/fail criteria: any missing marker or guard, child failure, terminal loss, extra command, retry, mutation, SSH/SCP, VM action, or authority promotion
Explicit non-goals: changing `known_hosts`, starting a VM, archive transfer, numerical work, P8C audit, candidate work, Rust/G3/SI/metric/lane work, or physical claims
Downstream gate unlocked: only an authenticated fingerprint match may permit a separately frozen exact stale-entry reconciliation proposal

# H2-P8C-R10 observable host-key preflight proposal

Status date: August 30, 2026.

Status: **FROZEN / INERT / AWAITING SEPARATE AUTHORIZATION**.

## Corrective design

R9 lost observability because its fail-fast controls were installed in the
interactive operator shell. R10 keeps the same read-only trust predicates but
executes them inside one `python3` child process. The child prints a bounded
`BEGIN` and `PASS` marker around every step and flushes each marker immediately.
If a guard fails, only the child exits and the terminal remains available with
the last passed boundary and the Python failure evidence.

The child performs exactly four Google API reads: original status, rescue
status, rescue instance ID, and rescue `hostkeys/` guest attributes. It reads
the existing known-hosts file only after checking regular-file, non-symlink and
65,536-byte bounds. It neither invokes SSH/SCP nor writes any file.

Because the prior terminal input disappeared, the execution policy permits
opening one fresh Cloud Shell terminal UI surface only if no terminal input is
available. Opening that UI surface is not a GCE VM start and transmits no shell
command by itself.

## Frozen identities

- proposal SHA-256:
  `4926fa95508c5542c57fed175fdd7b7b65a22e0e5c3906eb439e2b5ff102851a`;
- command ledger: 3,435 bytes at
  `f767ace7960c4354da725e5509bd010e7a3afc495bc0d84510e0b06ce420294f`;
- command 1: 31 characters at
  `fb142941dc9ae3cabfef5104673552e99bd5c347cf960994d45291d4d5309b19`;
- command 2: 3,402 characters at
  `98f1a0f2e6567655cef38a130d18d8c9cb64aea3a8d09f1f081d9f7a52fb7091`;
- independent proposal audit: **23/23 PASS**;
- audit receipt SHA-256:
  `e57c1be62a2a5b07960e511ee7406483517876f8ca428c8c18fe393931b1e47d`.

Preparation performed zero cloud actions, VM starts, SSH/SCP operations, file
mutations, numerical actions, candidate evaluations, or authority promotions.

## Exact authorization text

> I authorize exactly one H2-P8C-R10 observable read-only Google-API SSH host-key preflight under proposal SHA-256 `4926fa95508c5542c57fed175fdd7b7b65a22e0e5c3906eb439e2b5ff102851a` using the authenticated Cloud Shell page for project `dark-stratum-455714-h4`. If and only if no terminal input exists, I authorize opening exactly one fresh Cloud Shell terminal UI surface before command entry; this does not authorize a Google Compute Engine VM start or any preliminary shell command. Enter exactly two commands in order from the frozen 3,435-byte command ledger SHA-256 `f767ace7960c4354da725e5509bd010e7a3afc495bc0d84510e0b06ce420294f`. First enter the exact 31-character health command SHA-256 `fb142941dc9ae3cabfef5104673552e99bd5c347cf960994d45291d4d5309b19` and require exact output `R10_CONNECTION_READY`. Only after that marker, enter the exact 3,402-character observable child-process command SHA-256 `98f1a0f2e6567655cef38a130d18d8c9cb64aea3a8d09f1f081d9f7a52fb7091`. It must read only the two P8C VM statuses, rescue instance ID `3332429239243725178`, the regular non-symlink `/home/pestypig/.ssh/google_compute_known_hosts` under a 65,536-byte cap including exact line 10, and the rescue VM's Google Compute API `hostkeys/` guest attributes under a 65,536-byte cap; emit the frozen ordered step markers; derive SHA-256 host-key fingerprints; and require the R8-presented fingerprint `SHA256:ijX48Sh5o6lAfXmhYGrq+anJLuRA19XsvppsOcL3XFw` before printing `R10_READONLY_COMPLETE`. Preserve PASS, FAIL, traceback, or partial output as immutable evidence. First execution is terminal and consumes R10; no retry or fallback. I do not authorize retrying R9 or R10; blank, duplicate or additional commands; starting, stopping, restarting, creating, modifying, attaching, detaching, mounting or deleting any cloud resource; modifying firewall, IAM, metadata, guest attributes, SSH configuration or `known_hosts`; SSH, SCP, archive copy or download; writing, moving, copying or deleting any file or evidence; Docker, build, diagnostic or numerical execution; P8C result audit; candidate evaluation, positive sampling, root or handler creation, Rust/G3/SI/metric/lane work, retuning, or any authority promotion.
