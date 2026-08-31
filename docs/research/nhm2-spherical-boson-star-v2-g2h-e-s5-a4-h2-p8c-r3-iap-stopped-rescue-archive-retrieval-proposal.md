Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R3 IAP stopped-rescue archive retrieval
Current maturity: executed once and exhausted after the authenticated IAP guard without SCP evidence
Target maturity: authenticated local capture of the existing P8C terminal archive and unchanged frozen result audit
Required frozen inputs: exhausted R2 result `c65d88c...7114`, stopped original/rescue VMs, read-only unmounted clone, and archive identity `9535ce13...bd4d`
Required evidence: initial stopped state, one bounded restart, exact guest guards, one IAP SSH guard, one IAP SCP, three-point archive identity, terminal stop, chronology, and unchanged result audit
Stop/fail criteria: first failure terminal; no fallback, retry, resource/firewall/IAM mutation, archive mutation, numerical action, or authority promotion
Explicit non-goals: external-SSH fallback, candidate evaluation, positive sampling, resource creation/repair, Rust/G3/SI/metric/lane work, or physical/propulsion/transport claims
Downstream gate unlocked: H2-P8D result-only causal classification after and only after an authenticated P8C terminal-result audit

# H2-P8C-R3 IAP stopped-rescue archive retrieval proposal

Status date: August 29, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / NO RETRY**.

The exact authorization was received and R3 ran once. Its IAP guest guard
authenticated the source archive and read-only unmounted clone, but no SCP or
Cloud Shell archive receipts were produced. The immutable
[R3 result](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8c-r3-iap-stopped-rescue-retrieval-result.md)
passes 19/19 independent checks and classifies the attempt as
`INCOMPLETE_AFTER_IAP_GUARD_BEFORE_SCP_EVIDENCE`. R3 cannot be retried.

R2 exhausted its one restart when external TCP/22 timed out before the remote
guard. R3 changes only the transport and startup wait: both the one SSH guard
and one SCP use `gcloud --tunnel-through-iap`, and the fixed wait is 180 seconds.
There is no external-SSH fallback. The exact `comm` process guard, inactive
service checks, read-only/unmounted clone checks, archive identity, runtime and
cost ceilings, cleanup, first-failure policy, and all scientific/authority
locks remain unchanged.

## Frozen identities

- proposal SHA-256: `ad21f1ca165da8f89cf48a97d35c95b70f3241a66ca7c1c3c1bbc7cbb5d0efe7`;
- independent proposal audit: **36/36 PASS**;
- audit receipt SHA-256: `3c4080e68a49a4f20a0f102dc28963c2d0148262dee0615f66fe5935c181f412`;
- audit source SHA-256: `02b6d63387140311fb7b9c83d916d7a87f792b26d30a7de8b8dfed14143f745f`;
- Cloud Shell procedure SHA-256: `d1a99fe792526efdefa7971b8c16ff30820b1209aea0c0f1aeac4a2181840e47`;
- existing archive: 16,443 bytes, SHA-256 `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`;
- rescue VM restart attempts: exactly one;
- IAP SSH guard attempts: exactly one;
- IAP SCP attempts: exactly one;
- aggregate rescue runtime ceiling: 1,200 seconds;
- planning compute-cost ceiling: `$0.10`;
- cloud and numerical actions during R3 preparation: 0.

Current-head verification after freezing is green: math validation **323/323**,
the required WARP battery **18/18 files and 179/179 tests**, and Casimir adapter
run **2580 PASS/GREEN** with `firstFail=null`, certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
and integrity true. These checks authenticate the inert packet and repository
gates only; they do not authenticate a P8C scientific result.

## Exact authorization text

> I authorize exactly one restart of the existing Google Compute Engine rescue VM `nhm2-h2-p8c-rescue-e2-small-20260829` in project `dark-stratum-455714-h4`, zone `us-central1-a`, solely to retrieve the already-created archive `/home/pestypig/nhm2-h2-p8c-terminal-evidence-export-v1.tgz` under H2-P8C-R3 proposal SHA-256 `ad21f1ca165da8f89cf48a97d35c95b70f3241a66ca7c1c3c1bbc7cbb5d0efe7`. I authorize a 1,200-second aggregate rescue-VM runtime ceiling and a `$0.10` compute-cost ceiling. Before copying, require the original P8C VM and rescue VM to be `TERMINATED`; after the one restart and a fixed 180-second startup wait, require Docker and containerd inactive or absent, require the exact process `comm` values `mini-boson-star`, `dockerd`, `containerd`, `docker`, `docker-proxy`, `containerd-shim`, and `runc` to be absent without searching full command arguments or evidence-path substrings, require the retained clone block device read-only and unmounted, and require `/mnt/nhm2-p8c-rescue` unmounted. Use exactly one `gcloud --tunnel-through-iap` SSH guard and, only if it passes, exactly one `gcloud --tunnel-through-iap` SCP, with no external-SSH fallback. Require the existing archive to be a regular 16,443-byte file with SHA-256 `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`; copy it exactly once to an initially absent Cloud Shell path, verify the same size and hash, download it into the frozen local P8C terminal capture, verify it again, stop the rescue VM, preserve complete or partial evidence, and run the unchanged frozen P8C result audit. I do not authorize restarting the original P8C VM; creating any resource; attaching or detaching any disk; mounting any filesystem; changing either VM's configuration; modifying firewall or IAM policy; modifying or deleting any retained snapshot, disk, archive, source log, or evidence; starting Docker, containerd, a diagnostic service, or any numerical process; retry, fallback, resource substitution, build, upload, retune, frozen-candidate evaluation, positive sampling, candidate/scientific root or handler creation, Rust/G3/SI/metric/lane work, or any candidate, proof, geometry/state, lane, lamp, physical, propulsion, or transport authority promotion.
