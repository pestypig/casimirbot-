Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R2 exact-process-identity stopped-rescue archive retrieval
Current maturity: executed once and exhausted at pre-transfer external SSH timeout
Target maturity: authenticated local capture of the existing P8C terminal archive and unchanged frozen result audit
Required frozen inputs: P8C proposal `7e8f28d7...a2ace`, rescue proposal `ea2f7265...1dedb`, exhausted R1 result `d879f2a7...ba0f`, stopped rescue VM, exact archive identity, and frozen result-audit source `e733350c...5a227`
Required evidence: initial stopped-resource state, one bounded restart, exact-`comm` runtime absence, read-only unmounted clone, exact source/cloud/local archive identity, stopped terminal state, chronology, and unchanged result audit
Stop/fail criteria: resource drift, forbidden exact executable, missing/mutated archive, mounted or writable clone, SSH/SCP failure, retry, ceiling breach, evidence mutation, or authority promotion
Explicit non-goals: restarting the original P8C VM; creating, attaching, detaching, mounting, modifying, or deleting resources; numerical execution; build/upload; candidate ingress; positive sampling; Rust/G3/SI/metric/lane work; or authority promotion
Downstream gate unlocked: H2-P8D result-only causal classification after and only after an authenticated P8C terminal-result audit

# H2-P8C-R2 stopped-rescue archive retrieval proposal

Status date: August 29, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / NO RETRY**.

The exact authorization was received and the procedure ran once. Its sole SSH
guard timed out on external TCP port 22 before the guest guard or SCP. Cleanup
stopped the rescue VM. The immutable
[R2 result](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8c-r2-stopped-rescue-retrieval-result.md)
passes 19/19 independent checks and classifies the attempt as
`BLOCKED_PRETRANSFER_SSH_PORT_22_TIMEOUT`. The separately frozen
[R3 IAP proposal](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8c-r3-iap-stopped-rescue-archive-retrieval-proposal.md)
is the only eligible retrieval successor and authorizes no action by itself.

## Correction and boundary

R1 is exhausted and cannot be retried. R2 changes only its defective guest
process predicate. Instead of searching full process arguments—which contain
the evidence paths under inspection—R2 reads only the kernel process `comm`
field and rejects these exact executable identities: `mini-boson-star`,
`dockerd`, `containerd`, `docker`, `docker-proxy`, `containerd-shim`, and
`runc`. Docker and containerd also retain their independent inactive-service
checks.

All archive, resource, cost, chronology, first-failure, stop, no-retry,
scientific and authority boundaries otherwise remain unchanged. R2 creates no
resource and authorizes no filesystem mount, numerical process, archive
creation or mutation.

## Frozen identities

- proposal SHA-256:
  `adcb66eaf6be3519bf6ae2208e542d2edae3d8dc408e8a8732bcc60cc70e66f0`;
- independent proposal audit: **32/32 PASS**;
- audit receipt SHA-256:
  `33b1c6be3c119de1d8a0abe3b3a24e8366fdf30a82646c3a4211d2a37d668e78`;
- audit source SHA-256:
  `4681c0d4f89eee10bac08b171578bc16c576fbebae8c324561fabc412b80b303`;
- Cloud Shell procedure SHA-256:
  `941c858a8eba2fbcf2f635f846a81a313e726c89507283470d7d3f877abab3f8`;
- existing archive: 16,443 bytes, SHA-256
  `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`;
- rescue VM restart attempts: exactly one;
- aggregate rescue runtime ceiling: 1,200 seconds;
- planning compute-cost ceiling: `$0.10`;
- cloud and numerical actions during R2 preparation: 0.

Current-head verification after freezing remains green: math validation
**323/323**, the required WARP battery **18/18 files and 179/179 tests**, and
Casimir adapter run **2579 PASS/GREEN** with `firstFail=null`, certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
and integrity true. These checks authenticate the inert packet only.

First failure is terminal. Cleanup may stop the rescue VM and preserve partial
evidence, but it may not retry or substitute a resource.

## Exact authorization text

> I authorize exactly one restart of the existing Google Compute Engine rescue
> VM `nhm2-h2-p8c-rescue-e2-small-20260829` in project
> `dark-stratum-455714-h4`, zone `us-central1-a`, solely to retrieve the
> already-created archive
> `/home/pestypig/nhm2-h2-p8c-terminal-evidence-export-v1.tgz` under H2-P8C-R2
> proposal SHA-256
> `adcb66eaf6be3519bf6ae2208e542d2edae3d8dc408e8a8732bcc60cc70e66f0`.
> I authorize a 1,200-second aggregate rescue-VM runtime ceiling and a `$0.10`
> compute-cost ceiling. Before copying, require the original P8C VM and rescue
> VM to be `TERMINATED`; after the one restart, require Docker and containerd
> inactive or absent, require the exact process `comm` values
> `mini-boson-star`, `dockerd`, `containerd`, `docker`, `docker-proxy`,
> `containerd-shim`, and `runc` to be absent without searching full command
> arguments or evidence-path substrings, require the retained clone block
> device read-only and unmounted, and require `/mnt/nhm2-p8c-rescue` unmounted.
> Require the existing archive to be a regular 16,443-byte file with SHA-256
> `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`;
> copy it exactly once to an initially absent Cloud Shell path, verify the same
> size and hash, download it into the frozen local P8C terminal capture, verify
> it again, stop the rescue VM, preserve complete or partial evidence, and run
> the unchanged frozen P8C result audit. I do not authorize restarting the
> original P8C VM; creating any resource; attaching or detaching any disk;
> mounting any filesystem; changing either VM's configuration; modifying or
> deleting any retained snapshot, disk, archive, source log, or evidence;
> starting Docker, containerd, a diagnostic service, or any numerical process;
> retry, resource substitution, build, upload, retune, frozen-candidate
> evaluation, positive sampling, candidate/scientific root or handler creation,
> Rust/G3/SI/metric/lane work, or any candidate, proof, geometry/state, lane,
> lamp, physical, propulsion, or transport authority promotion.
