Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R1 stopped-rescue archive retrieval
Current maturity: one authorized attempt exhausted; blocked before SCP by a self-matching process guard; partial evidence authenticated 21/21
Target maturity: immutable failed-closed result and corrected versioned successor
Required frozen inputs: P8C proposal `7e8f28d7...a2ace`, executed rescue proposal `ea2f7265...1dedb`, stopped existing rescue VM, retained boot disk/archive, archive size 16,443 bytes and SHA-256 `9535ce13...bd4d`, and result-audit source `e733350c...5a227`
Required evidence: initial stopped-resource state, one bounded restart, absent numerical/container runtime, read-only unmounted clone, exact source/cloud/local archive size and hash, stopped terminal state, complete or partial chronology, and unchanged result audit
Stop/fail criteria: resource drift, missing/mutated archive, active service or numerical process, mounted or writable clone, SSH/SCP failure, retry, runtime/cost ceiling, evidence mutation, or authority promotion
Explicit non-goals: restarting the original P8C VM; creating, attaching, detaching, mounting, modifying, or deleting any resource; numerical execution; build/upload; candidate ingress; positive sampling; handler/root creation; Rust/G3/SI/metric/lane work; or any authority promotion
Downstream gate unlocked: H2-P8D result-only causal classification after and only after a 25/25 authenticated P8C terminal-result audit

# H2-P8C-R1 stopped-rescue archive retrieval proposal

Status date: August 29, 2026.

Status: **EXECUTED ONCE / BLOCKED_PRETRANSFER_SELF_MATCHING_PROCESS_GUARD / NO RETRY**.

## Execution result

The one authorized restart was consumed. The guest `pgrep -af` predicate
matched its own SSH guard shell because the inspected archive and device paths
contained the forbidden `nhm2-h2-p8c` substring. Execution stopped before SCP;
cleanup stopped the rescue VM; both original and rescue VMs were then observed
`TERMINATED`. Partial capture `a618dbe9...cd7d` is preserved and the independent
result audit passes 21/21 at receipt `d879f2a7...ba0f`. R1 cannot be retried.
The corrected inert successor is the
[P8C-R2 retrieval proposal](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8c-r2-stopped-rescue-archive-retrieval-proposal.md).

## Decision

The prior recovery already completed the sensitive filesystem operation and
created a deterministic terminal archive on the rescue VM's retained boot disk.
The only missing action is transport. This successor therefore authorizes no
snapshot, clone, mount, archive creation, numerical process, or new resource.

The proposed operation may restart the existing rescue VM exactly once, prove
the retained clone remains read-only and unmounted, prove Docker/containerd and
the P8C numerical process are absent, bind the existing archive by exact path,
size and SHA-256, and copy it once to Cloud Shell. It must then stop the rescue
VM, download the byte-identical archive into the frozen local capture, and run
the unchanged result audit.

## Frozen boundaries

- proposal SHA-256:
  `41f227b7aaa31616abfe4d8361635f3f8082a7481f1b97284fc3f0c320fef186`;
- independent proposal audit: **32/32 PASS**;
- audit receipt SHA-256:
  `1e16a0867f0265ecb830f2429dac91bbf8d3ca1732ecd86bc62f261c94c69510`;
- audit source SHA-256:
  `b97c6d8937f023ea01705a8e92ab20306937254de4ba3d57ef6b985dad0fe794`;
- Cloud Shell procedure SHA-256:
  `e86ffd607410cf7515c10c8c80bbe872cb0954a49a08a1351c3054390e9eebc0`;
- cloud and numerical actions during preparation: 0;
- existing rescue VM: `nhm2-h2-p8c-rescue-e2-small-20260829`;
- required initial and terminal rescue status: `TERMINATED`;
- original P8C VM: `nhm2-h2-p8c-diagnostic-c4-16-20260828`, required to
  remain `TERMINATED` and untouched;
- existing archive:
  `/home/pestypig/nhm2-h2-p8c-terminal-evidence-export-v1.tgz`;
- exact archive size: 16,443 bytes;
- exact archive SHA-256:
  `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`;
- restart attempts: exactly one;
- SSH guard attempts: exactly one;
- SCP attempts: exactly one;
- aggregate rescue runtime ceiling: 1,200 seconds;
- planning compute cost ceiling: `$0.10`;
- new resources, uploads, builds, mounts, numerical processes and deletions: 0.

First failure is terminal. Cleanup may stop the rescue VM and preserve partial
evidence, but may not retry or substitute any resource. All retained storage
continues to exist pending a separate deletion decision.

## Exact authorization text

> I authorize exactly one restart of the existing Google Compute Engine rescue
> VM `nhm2-h2-p8c-rescue-e2-small-20260829` in project
> `dark-stratum-455714-h4`, zone `us-central1-a`, solely to retrieve the
> already-created archive
> `/home/pestypig/nhm2-h2-p8c-terminal-evidence-export-v1.tgz` under proposal
> SHA-256 `41f227b7aaa31616abfe4d8361635f3f8082a7481f1b97284fc3f0c320fef186`.
> I authorize a 1,200-second aggregate rescue-VM
> runtime ceiling and a `$0.10` compute-cost ceiling. Before copying, require
> the original P8C VM and rescue VM to be `TERMINATED`; after the one restart,
> require Docker and containerd inactive or absent, all numerical and container
> processes absent, the retained clone block device read-only and unmounted,
> and `/mnt/nhm2-p8c-rescue` unmounted. Require the existing archive to be a
> regular 16,443-byte file with SHA-256
> `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`;
> copy it exactly once to an initially absent Cloud Shell path, verify the same
> size and hash, download it into the frozen local P8C terminal capture, verify
> it again, stop the rescue VM, preserve complete or partial evidence, and run
> the unchanged frozen P8C result audit. I do not authorize restarting the
> original P8C VM; creating any resource; attaching or detaching any disk;
> mounting any filesystem; changing either VM's configuration; or modifying or
> deleting any retained snapshot, disk, archive, source log, or evidence;
> starting Docker, containerd, a diagnostic service, or any numerical process;
> retry, resource substitution, build, upload, retune, frozen-candidate
> evaluation, positive sampling, candidate/scientific root or handler creation,
> Rust/G3/SI/metric/lane work, or any candidate, proof, geometry/state, lane,
> lamp, physical, propulsion, or transport authority promotion.
