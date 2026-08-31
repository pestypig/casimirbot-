Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 parent result disposition
Capability or component: H2-P7 stopped-disk evidence retrieval proposal
Current maturity: VM terminated before its scheduled ceiling; retained 30 GB disk READY; retrieval proposal frozen and independently audited 18/18; no restart performed
Target maturity: one immutable local capture of the already-written P7 result followed by the frozen independent result audit
Required frozen inputs: parent proposal `3f15f387...fdc3`, retrieval proposal `3c581eb9...ee25`, exact existing VM/disk, evidence directory and all pre-result audit locks
Required evidence: exact prestart/running/prestop/poststop resource metadata, inactive parent service, absent process and running container, deterministic non-clobber archive, SHA-256 capture inventory, local download, stopped VM and retained disk
Stop/fail criteria: any different resource, second restart, parent service/process/container activation, source mutation, missing evidence directory, preexisting archive, runtime/cost ceiling, copy/hash failure, evidence deletion, candidate ingress or authority promotion
Explicit non-goals: numerical execution, retry, retune, build, upload, frozen-candidate evaluation, positive sampling, scientific root or handler creation, Rust/G3/SI/metric/lane work, or any authority promotion
Downstream gate unlocked: real P7 result audit only; no derivative-ledger or scientific authority until that audit classifies the capture

# H2-P7 evidence-retrieval proposal

Status date: August 28, 2026.

Status: **EXECUTED ONCE / FAIL-CLOSED AT SSH READINESS / ORIGINAL VM STOPPED**.

The exact authorization was received and consumed on August 28, 2026. The
single restart completed at `2026-08-28T13:31:15Z`, but TCP port 22 refused the
first guarded SSH connection. The retrieval exited before the remote guard,
before reading the evidence directory and before creating any archive. Its
cleanup trap stopped the VM, and a read-only status check observed it
`TERMINATED`. A second restart is not authorized and was not attempted.

Cloud Shell retains nine partial chronology/resource files. The local
[fail-closed execution receipt](../../artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p7-evidence-retrieval-execution-v1-20260828/h2-p7-evidence-retrieval-execution-partial.v1.json)
records the bounded disposition. This is an infrastructure retrieval failure,
not an H2 parent PASS, FAIL or partial numerical result.

## Observed terminal resource state

Read-only Google Cloud inspection established:

- VM `nhm2-h2-p7-parent-c4-16-20260827`: `TERMINATED`;
- last stop: `2026-08-27T23:16:21.113-07:00`
  (`2026-08-28T06:16:21.113Z`);
- scheduled aggregate-ceiling shutdown: `2026-08-29T04:47:44Z`;
- retained 30 GB `hyperdisk-balanced` disk: `READY`;
- the observed stop preceded the scheduled ceiling by more than 22 hours.

This strongly indicates that the wrapper observed process termination and shut
the VM down, but it does not distinguish numerical PASS from FAIL. The result
files remain on the stopped disk and have not yet been read.

## Frozen retrieval boundary

- proposal SHA-256:
  `3c581eb9abb9205a520f75f0eb5196a63afd257786a5cc0a7528d6f8e451ee25`;
- independent proposal audit: **18/18 PASS**;
- audit receipt SHA-256:
  `75960782047d64a9ecb9f327c8c6ea5c2d7d8ed53df57eec5260f690a4c8f394`;
- audit source SHA-256:
  `e1f147da2f306793c217358d111ac3a1852fb2c604e33707f5010dd62b2deea4`;
- cloud actions during preparation: 0;
- numerical processes during preparation: 0.

The proposal permits one restart of the existing VM for at most 1,200 seconds
at a planning cost ceiling of `$0.30`. It forbids Docker, the parent service,
the numerical executable, builds and uploads. Retrieval must first prove that
the service is inactive and that the process and running container are absent.
It may then create one new deterministic, non-clobbering archive of the
existing evidence directory, copy it through Cloud Shell into the local
candidate-neutral capture directory, hash every captured file, and stop the
VM while retaining its disk and original evidence.

## Current-head verification

- math-stage validation: **323 entries, PASS**;
- required WARP battery: **18 files, 179/179 tests PASS**;
- Casimir adapter run: `2566`, **PASS / GREEN**;
- certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: **OK**.

These checks validate the repository gate and packet integration. They do not
classify the unread P7 numerical result or promote any scientific authority.

## Exact authorization text

> I authorize exactly one restart of the existing Google Compute Engine VM
> `nhm2-h2-p7-parent-c4-16-20260827` in `us-central1-a`, with its existing 30 GB
> `hyperdisk-balanced` disk, solely for stopped-disk P7 evidence retrieval
> under proposal SHA-256
> `3c581eb9abb9205a520f75f0eb5196a63afd257786a5cc0a7528d6f8e451ee25`.
> I authorize a 1,200-second aggregate restart ceiling and a `$0.30` total cost
> ceiling. Before copying, require the P7 parent service to be inactive and the
> parent process and running container to be absent. Create exactly one new,
> deterministic, non-clobbering archive
> `/home/pestypig/nhm2-h2-p7-terminal-evidence-export-v1.tgz` from the existing
> read-only evidence directory `/home/pestypig/nhm2-h2-p7-evidence-v1`; copy
> that archive to Cloud Shell and download it into the frozen local
> candidate-neutral capture directory; preserve complete resource, chronology
> and SHA-256 evidence; then stop the VM without deleting its disk, logs,
> source evidence or archive. I do not authorize starting Docker, the P7
> service or numerical executable; any numerical process, retry, retune,
> build, upload, resource substitution, second restart, source mutation,
> evidence deletion, frozen-candidate evaluation, positive sampling,
> candidate/scientific root or handler creation, Rust/G3/SI/metric/lane work,
> or any candidate, proof, geometry/state, lane, lamp, physical, propulsion or
> transport authority promotion.
