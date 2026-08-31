Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R5 staged-procedure stopped-rescue retrieval execution
Current maturity: frozen inert one-command execution proposal; no VM or cloud execution
Target maturity: exact existing 16,443-byte archive authenticated in Cloud Shell with rescue returned to `TERMINATED`
Required frozen inputs: R4-R1 result `78214acd...20b8`, audit `6d60f0f9...c4bc7b`, staged procedure `a4104d49...ed79b`, and archive `9535ce13...bd4d`
Required evidence: one exact command, both VMs initially stopped, one rescue restart, one IAP guard, one IAP SCP, archive identity, cleanup stop, complete chronology, and independent audit
Stop/fail criteria: first file/status/stage/archive/deadline/guard/SCP/hash/cleanup mismatch terminal; no retry, fallback, resource substitution, deletion, numerical action, or authority promotion
Explicit non-goals: original-VM restart, new or modified resources, filesystem mount, local download, P8C result audit, candidate evaluation, Rust/G3/SI/metric/lane work, or physical/propulsion/transport claims
Downstream gate unlocked: separately frozen Cloud-Shell-to-local archive capture and unchanged P8C result audit only after authenticated retrieval PASS

# H2-P8C-R5 staged-procedure retrieval execution proposal

Status date: August 29, 2026.

Status: **FROZEN / INERT / AWAITING SEPARATE AUTHORIZATION**.

R4-R1 authenticated the exact procedure in Cloud Shell without executing it.
R5 freezes the one short command that rechecks that file as a regular
non-symlink with the exact 4,115-byte identity and then invokes it once through
`bash`. The procedure itself is unchanged at SHA-256
`a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b`.

If authorized, the procedure requires the original and rescue VMs to be
`TERMINATED`, and requires both its Cloud Shell stage directory and destination
archive to be absent before the restart. It then permits exactly one rescue-VM
restart, one fixed 180-second wait, one IAP guest guard and one IAP SCP. Its
cleanup trap stops the rescue VM after PASS, FAIL or partial execution. The
aggregate runtime ceiling is 1,200 seconds and the planning compute-cost ceiling
is `$0.10`.

This packet ends with the authenticated archive in Cloud Shell. It does not
authorize downloading that archive into the repository or running the P8C
scientific result audit.

## Frozen identities

- proposal: 5,697 bytes, SHA-256 `a3353a7cb712365268c0a8aa9a59a3834467c4066a32d1858936ca35bb6e6e15`;
- staged procedure: 4,115 bytes, SHA-256 `a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b`;
- execution command: 497 characters, SHA-256 `78eda80c8f9c129c081f07203217e8f53189568ac00243a239d513f1eda7eda4`;
- expected archive: 16,443 bytes, SHA-256 `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`;
- R4-R1 result: `78214acdde840d46031956656d591355c579661866a3ae6c9aba4a82f59620b8`;
- R4-R1 result audit: `6d60f0f9459b788f360d3fe0d6d249a71a610891e51bc67c62ecfc8582c4bc7b`;
- independent proposal audit: **35/35 PASS**;
- audit receipt SHA-256: `dc71da1beff99694bb910a979e3b93569fccf8a13770e394e0cd865d0880171d`;
- audit source SHA-256: `3bbfb9ec2da2429c8ea1269fc94deb3f5d062e2cdcc0d99710f96f3698cfe287`;
- cloud, VM, SSH/SCP, archive, Docker, numerical and candidate actions during
  preparation: zero.

## Current-head verification

- math registry report and validation: **323/323 PASS**;
- complete required WARP battery: **18/18 files and 179/179 tests PASS**;
- Casimir adapter run: **2585 PASS/GREEN**, `firstFail=null`;
- certificate SHA-256: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: **true**.

These checks authenticate the repository and inert proposal only. They do not
authorize R5, authenticate the unread P8C result, or promote authority.

## Exact authorization text

> I authorize exactly one execution of the already-staged candidate-neutral procedure `/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh`, exactly 4,115 bytes with SHA-256 `a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b`, under H2-P8C-R5 proposal SHA-256 `a3353a7cb712365268c0a8aa9a59a3834467c4066a32d1858936ca35bb6e6e15`. Enter exactly one 497-character Cloud Shell command with SHA-256 `78eda80c8f9c129c081f07203217e8f53189568ac00243a239d513f1eda7eda4`, which must require the staged path to be a regular non-symlink with the exact bytes and SHA-256 before invoking it once through `bash`. Require the original VM `nhm2-h2-p8c-diagnostic-c4-16-20260828` and rescue VM `nhm2-h2-p8c-rescue-e2-small-20260829` in project `dark-stratum-455714-h4`, zone `us-central1-a`, both to be initially `TERMINATED`; require `/home/pestypig/nhm2-h2-p8c-r4-staged-iap-retrieval-stage-v1` and `/home/pestypig/nhm2-h2-p8c-terminal-evidence-export-v1.tgz` initially absent in Cloud Shell; authorize exactly one rescue-VM restart, one fixed 180-second startup wait, one IAP SSH guest guard and one IAP SCP, under a 1,200-second aggregate rescue runtime ceiling and a `$0.10` compute-cost ceiling. Require the guest services and exact forbidden process identities to be absent, the retained clone device read-only and unmounted, `/mnt/nhm2-p8c-rescue` unmounted, and the existing source archive to be exactly 16,443 bytes with SHA-256 `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d` before copying. Preserve PASS, FAIL or partial evidence and stop the rescue VM afterward. First failure is terminal and consumes R5; no blank, duplicate or additional terminal command, retry or fallback is authorized. I do not authorize restarting the original VM; creating, modifying, attaching, detaching, mounting or deleting any resource; modifying firewall or IAM; editing, replacing, chmodding or deleting the staged procedure; starting Docker, containerd, a diagnostic service or numerical process; archive recreation or source mutation; downloading the archive to the local workspace; running the P8C result audit; additional upload; retry, retune, resource substitution, frozen-candidate evaluation, positive sampling, candidate/scientific root or handler creation, Rust/G3/SI/metric/lane work, evidence deletion, or any candidate, proof, geometry/state, lane, lamp, physical, propulsion or transport authority promotion.

## Exact future command

```bash
test -f '/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh' && test ! -L '/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh' && test "$(stat -c %s '/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh')" = '4115' && test "$(sha256sum '/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh' | awk '{print $1}')" = 'a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b' && bash '/home/pestypig/h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh'
```

No cloud action occurred while preparing this packet.
