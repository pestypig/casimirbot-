Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P5A C4 boot-storage compatibility correction
Current maturity: storage correction executed successfully; corrected attempt then blocked before build on an incomplete frozen upload inventory; zero numerical runs
Target maturity: immutable stopped-VM blocker evidence and a separately versioned upload-inventory repair handoff
Required frozen inputs: original proposal `1eaea632...5a50`, source manifest `7c56923d...a907`, blocked receipt `376a5539...b4b7`, upload archive `5a4f6f98...c321d`, and correction proposal `8a995bd0...1410`
Required evidence: supported storage class, absent original instance/disk, unchanged machine/source/binary/run/decision identities, aggregate runtime/cost ceiling, immutable output, independent audit, and stopped VM
Stop/fail criteria: any storage change beyond `pd-balanced` to `hyperdisk-balanced`, any new upload, identity mismatch, numerical mismatch, timeout/partial output, nonempty stderr, aggregate runtime or cost ceiling, retry/retune, or authority promotion
Explicit non-goals: smaller-width or full-selector execution, frozen-candidate evaluation, positive sampling, roots, handler linkage, H2 proof execution, G3, SI/metric, lanes, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: candidate-neutral upload-inventory repair definition only; this corrected attempt is exhausted

# H2-P5A C4 storage compatibility correction

Status date: August 27, 2026.

Status: **CORRECTION EXECUTED / H2-P5A BLOCKED PREEXECUTION / VM STOPPED**.

The storage-only amendment was authorized and the exact corrected VM was
created successfully. The archive rehashed exactly on the VM and both pinned
base images loaded. The frozen 36-entry archive omitted the required P5A
Dockerfile, so the build stopped before producing a binary or executing any
calibration. The immutable
[corrected execution result](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p5a-execution-blocked-result.md)
passes 25/25 independent checks. The VM is `TERMINATED`; this attempt cannot be
retried.

## Immutable blocked attempt

The authorized Google Compute Engine command was issued exactly as frozen with
`c4-standard-16`, 30 GB and `pd-balanced`. Google rejected it before creating
an instance:

`pd-balanced disk type cannot be used by c4-standard-16 machine type.`

Post-failure inventory found neither the named instance nor an orphaned disk.
Consequently:

- billable VM runtime: zero;
- numerical runs: zero;
- candidate evaluations and positive samples: zero;
- candidate and output roots: absent;
- every scientific and physical authority: false.

The blocked receipt SHA-256 is
`376a55393b2d3c5121a76dfa39790351d7cff995e7cc2ab978bf84cda02db4b7`.

## Exact correction

Google's C4 documentation states that C4 does not support Persistent Disk and
supports Hyperdisk Balanced under reference name `hyperdisk-balanced`. The
zone's live disk inventory independently exposed that same type. A 30 GB
Hyperdisk Balanced volume is above its documented 4 GiB minimum.

The correction changes only:

`--boot-disk-type=pd-balanced`

to:

`--boot-disk-type=hyperdisk-balanced`.

The VM name, zone, `c4-standard-16` machine, 30 GB capacity, Debian 12 image,
standard provisioning, source manifest, binary identity, exact five-run
sequence, semantic equality rule and 337502 ms turnaround boundary remain
unchanged. An aggregate VM wall-clock ceiling of 7,200 seconds is added to
enforce the unchanged `$2.00` total ceiling.

Official references:

- https://docs.cloud.google.com/compute/docs/general-purpose-machines#c4_series
- https://docs.cloud.google.com/compute/docs/disks/add-hyperdisk
- https://cloud.google.com/products/block-storage

## Preserved upload

The already authorized archive completed upload to
`/home/pestypig/h2-p5a-upload-v1.tar`. Cloud-side SHA-256 exactly matched local:

`5a4f6f983fed9b51fb444b115df77001062f24a6d5540f96fae0dc2d101c321d`.

It contains 36 entries. The correction permits reusing those exact bytes and
permits no additional upload.

## Correction seal

- correction proposal SHA-256:
  `8a995bd0c7e0569aaa5ca28d3bf262b0efd294ead48f642cbeb2c69389a61410`;
- correction audit: 26/26 PASS;
- numerical runs: 0;
- instance/disk created: false;
- authority promoted: false.

Current-head verification passes: math registry `323/323`, required WARP
battery `179/179`, and Casimir adapter run `2545` `PASS/GREEN` with certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true.

## Exact amendment authorization text

> I authorize amending only the H2-P5A boot-disk type from `pd-balanced` to `hyperdisk-balanced` under storage-correction proposal SHA-256 `8a995bd0c7e0569aaa5ca28d3bf262b0efd294ead48f642cbeb2c69389a61410`. I authorize exactly one corrected creation attempt for the unchanged `c4-standard-16` VM `nhm2-h2-p5a-c4-16-20260827` in `us-central1-a` with 30 GB storage, the unchanged approximate compute rate of `$0.79068/hour`, a 7,200-second aggregate VM runtime ceiling, and the unchanged `$2.00` total cost ceiling. Reuse only the already uploaded and cloud-verified candidate-neutral archive SHA-256 `5a4f6f983fed9b51fb444b115df77001062f24a6d5540f96fae0dc2d101c321d`; upload no additional files. Preserve all original source, binary, build, five-run, timeout, immutable-evidence, stop and authority restrictions. I understand the rejected `pd-balanced` request created no VM or disk and ran no numerical calibration. I do not authorize any other machine, zone, disk type or capacity, numerical retry, retuning, frozen-candidate evaluation, full selector, positive sampling, root or handler creation, G3/SI/metric/lane work, or authority promotion.
