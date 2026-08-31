Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R6 connection-gated staged-procedure retrieval
Current maturity: frozen inert successor proposal; no cloud command or resource action
Target maturity: exact existing terminal archive authenticated in Cloud Shell with rescue VM returned to `TERMINATED`
Required frozen inputs: R5 result `0a9d11e...cdc24e`, R5 audit `6137cf13...edee1`, staged procedure `a4104d49...ed79b`, and archive `9535ce13...bd4d`
Required evidence: exact connection marker, exact one-time procedure invocation, one restart/guard/SCP chronology, archive identity, cleanup stop, and independent result audit
Stop/fail criteria: first connection, marker, file, status, deadline, guard, SCP, hash, or cleanup mismatch terminal; no retry or fallback
Explicit non-goals: R5 retry, numerical or candidate execution, local download, P8C result audit, new/modified resources, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: separately authorized Cloud-Shell-to-local archive capture and unchanged P8C result audit after authenticated retrieval PASS

# H2-P8C-R6 connection-gated retrieval proposal

Status date: August 29, 2026.

Status: **FROZEN / INERT / AWAITING SEPARATE AUTHORIZATION**.

R5 consumed its authorization when the interactive Cloud Shell connection was
lost before any command was transmitted. It did not invoke the staged
procedure. R6 changes that failed boundary by requiring a 35-character
round-trip marker before the 497-character authenticated invocation command is
eligible. A missing marker is terminal and prevents the second command.

If separately authorized and if the marker passes, the unchanged staged
procedure may be invoked exactly once. It retains the R5 resource, guest,
archive, 1,200-second runtime, `$0.10` cost, cleanup and no-science bounds. R6
is a successor transport packet, not an R5 retry and not a numerical retry.

## Frozen identities

- proposal SHA-256:
  `1b78a6d79761fcc9bea581a95b465fdc0a7e337656ca864e4f3938e863c0d3c6`;
- proposal independent audit: **15/15 PASS**;
- audit receipt SHA-256:
  `c719df73bae68e15be4a549184c7ac6ab9e45a70602e4ecadbc81bbe661ba235`;
- command 1: 35 characters, SHA-256
  `822b4e17d8345537be4d44b0c1e0af92129fbe6518a13e3f8b37b644db2d838b`;
- command 2: 497 characters, SHA-256
  `78eda80c8f9c129c081f07203217e8f53189568ac00243a239d513f1eda7eda4`;
- staged procedure: 4,115 bytes, SHA-256
  `a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b`;
- expected archive: 16,443 bytes, SHA-256
  `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`;
- cloud, VM, SSH/SCP, archive, Docker, numerical and candidate actions during
  preparation: zero;
- every authority lock: false.

## Current-head verification

- math report and validation: **323/323 PASS**;
- complete required WARP battery: **18/18 files and 179/179 tests PASS**;
- fresh adapter response: **PASS/GREEN**, `firstFail=null`;
- certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: **true**.

These checks authenticate the inert candidate-neutral proposal and repository
gates only. They do not authenticate retrieval, classify P8C, prove a boson
star, or promote any physical authority.

## Exact authorization text

> I authorize exactly one H2-P8C-R6 connection-gated retrieval execution under proposal SHA-256 `1b78a6d79761fcc9bea581a95b465fdc0a7e337656ca864e4f3938e863c0d3c6` in the existing Cloud Shell session for project `dark-stratum-455714-h4`. Enter exactly two commands in order. First enter the exact 35-character connection-health command with SHA-256 `822b4e17d8345537be4d44b0c1e0af92129fbe6518a13e3f8b37b644db2d838b` and require exact output `R6_CONNECTION_READY`. Only after that exact marker, enter the exact 497-character staged-procedure authentication and invocation command with SHA-256 `78eda80c8f9c129c081f07203217e8f53189568ac00243a239d513f1eda7eda4`, invoking `/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh` exactly once. Preserve the existing R5 bounds: both original and rescue VMs initially `TERMINATED`; exactly one rescue restart, one fixed 180-second wait, one IAP SSH guest guard, one IAP SCP, a 1,200-second aggregate rescue runtime ceiling and `$0.10` compute-cost ceiling; exact 16,443-byte archive SHA-256 `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`; cleanup stop after PASS, FAIL or partial output. First failure is terminal and consumes R6. I do not authorize retrying R5 or R6; blank, duplicate or additional terminal commands; fallback; restarting the original VM; creating, modifying, attaching, detaching, mounting or deleting any resource; modifying firewall or IAM; Docker, build, diagnostic or numerical execution; downloading the archive locally; running the P8C result audit; candidate evaluation, positive sampling, root or handler creation, Rust/G3/SI/metric/lane work, evidence deletion, retuning, or any authority promotion.

## Exact commands

Command 1:

```bash
printf '%s\n' 'R6_CONNECTION_READY'
```

Command 2:

```bash
test -f '/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh' && test ! -L '/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh' && test "$(stat -c %s '/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh')" = '4115' && test "$(sha256sum '/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh' | awk '{print $1}')" = 'a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b' && bash '/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh'
```

No cloud action occurred while preparing this packet.
