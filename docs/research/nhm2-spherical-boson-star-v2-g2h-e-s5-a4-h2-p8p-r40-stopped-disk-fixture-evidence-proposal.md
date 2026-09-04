Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R40 stopped-disk recovery of the R39 build-fixture evidence
Current maturity: frozen inert recovery proposal; R39 is consumed at fixture exit 101
Target maturity: authenticated read-only classification of the exact R39 fixture failure
Required frozen inputs: immutable R39 result, exact stopped R32 VM/source disk, exact R40 rescue procedure/controller, and initially absent derivative resources/local archive
Required evidence: protected source identities, derivative resource identities, read-only block device/mount, exact 5,155-byte source export identity, bounded source evidence manifest, local archive agreement, helper stop, chronology, and independent audit
Stop/fail criteria: original restart/mutation, pre-existing derivative, ambiguous or writable filesystem, source evidence mutation, export identity mismatch, retry/fallback, numerical/Docker start, candidate ingress, retune, evidence deletion, or authority promotion
Explicit non-goals: retrying R39, changing or rerunning the fixture, P=1024/P=65,536 execution, frozen-candidate evaluation, positive sampling, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: one evidence-selected minimal build-fixture correction or, only if the recovered evidence proves the fixture passed despite transport reporting, direct build closure

# H2-P8P-R40 stopped-disk fixture-evidence proposal

Status date: September 4, 2026.

Status: **FROZEN INERT / SEPARATE CLOUD AUTHORIZATION REQUIRED**.

## Protected source

R39 is immutable and may not be retried. Its retained source is:

- VM `nhm2-h2-p8p-r32-e2-4-20260904`;
- instance ID `1893159507643031574`;
- project `dark-stratum-455714-h4`, zone `us-east1-b`;
- authenticated status `TERMINATED`;
- attached source disk `nhm2-h2-p8p-r32-e2-4-20260904`;
- disk ID `1129594698432208918`;
- 30 GB `pd-standard`, status `READY`;
- source image `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`.

The original VM may not restart. Its disk may not detach, resize, change mode,
mount, or otherwise mutate.

## Frozen procedures

- Rescue procedure
  `tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r40_stopped_disk_fixture_evidence_v1.sh`:
  exactly 3,553 bytes, SHA-256
  `696a99570a4c213940f0580d3d654ca6414386e8daf7d780a24c97fc23d380ba`.
- Local controller
  `tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r40_stopped_disk_fixture_evidence_controller_v1.ps1`:
  exactly 8,564 bytes, SHA-256
  `cce6aa2daed863b8da396eede35658c4e56f9e4ff78478db9a84f92ca18cc41c`.

The Bash procedure passes `bash -n`; the PowerShell controller has zero parser
errors. Neither contains a numerical invocation or candidate input.

## Bounded derivative resources

All three names are currently absent:

- standard snapshot `nhm2-h2-p8p-r39-evidence-snapshot-20260904`;
- 30 GB `pd-standard` snapshot-derived disk
  `nhm2-h2-p8p-r39-evidence-clone-20260904` in `us-east1-b`;
- temporary on-demand `e2-small` helper
  `nhm2-h2-p8p-r39-rescue-e2-small-20260904` in `us-east1-b`, with exact
  Debian image `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`
  and 10 GB `pd-standard` auto-delete boot disk.

The helper must boot before the clone is attached as device
`nhm2-h2-p8p-r39-evidence-clone` in Compute Engine `READ_ONLY` mode. Aggregate
helper runtime is capped at 3,600 seconds and combined compute plus prorated
storage through 24 hours is capped at `$0.50`. Complete or partial evidence is
preserved; the helper is stopped after success or failure. Derivative resources
remain retained pending a separate cleanup decision.

## Read-only recovery

The rescue procedure requires the guest block device read-only and selects one
unambiguous ext4 or xfs filesystem. Ext4 mounts only with `ro,noload`; xfs only
with `ro,norecovery`. It fails closed on any writable, ambiguous, symlinked,
unsupported, oversized, missing, or identity-mismatched source.

It reads only the exact R32 evidence directory and export plus bounded identity
metadata for the R39 transport inputs and Docker directory. It requires the
existing source export to be exactly 5,155 bytes with SHA-256
`de12d097b90def46b8d94a8426d8398f7596feb013806d9d8427d4a615c55dcd`.
The evidence directory is capped at 16 MiB total and 8 MiB per file. It creates
one deterministic archive on the helper boot disk, copies it once into the
initially absent local R40 evidence root, and verifies byte/hash agreement.

R40 starts no Docker daemon, build, fixture, diagnostic, numerical executable,
or candidate process. First failure is terminal. No retry, fallback, resource
substitution, evidence deletion, retuning, frozen-candidate evaluation,
positive sampling, P=1024/P=65,536 execution, G3/SI/metric/lane work, or
authority promotion is authorized.
