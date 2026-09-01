Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8F-C2-R1 stopped-disk terminal-evidence rescue
Current maturity: exact N2 controller executed once and automatically stopped; serial API unavailable; numerical/result state unread
Target maturity: authenticated read-only stopped-disk evidence archive and immutable C2-R1 classification
Required frozen inputs: stopped VM/disk `nhm2-h2-p8f-c2-r1-n2-32-20260831`, C2-R1 proposal `19c08f6d...1c2b`, controller `8c83cd47...2406`, binary `14140897...1bad6`, and frozen result-only P8F auditor
Required evidence: original VM terminated, source disk ready and untouched, derivative snapshot/clone identities, read-only guest device and mount, deterministic rescue archive, local hash agreement, independent result audit, and stopped helper
Stop/fail criteria: original restart or mutation, ambiguous partition/filesystem, writable clone/device/mount, evidence mutation, numerical or Docker start, retry, retune, candidate ingress, cost/storage bound, or authority promotion
Explicit non-goals: restarting C2-R1, repairing or repeating the run, creating another scientific VM, frozen-candidate evaluation, Rust/G3/SI/metric/lane work, evidence deletion, or authority promotion
Downstream gate unlocked: authenticated P8F result-only classification and the smallest separately versioned continuation lead justified by that result; no execution authority

# H2-P8F-C2-R1 stopped-disk rescue proposal

Status: **FROZEN PREPARATION / NO CLOUD RESOURCE CREATED**.

This packet changes planning, evidence transport and receipt semantics only. It
does not change mathematical semantics, runtime authority or any scientific or
physical claim.

## Frozen local identities

| Binding | Bytes | SHA-256 |
| --- | ---: | --- |
| rescue procedure `h2_p8f_c2_r1_stopped_disk_rescue_v1.sh` | 2,713 | `60461d0b062a5e439ce83420692f68573fefc4386e4b2ab2f35f2f408a7d686e` |
| independent proposal audit `nhm2_g2h_e_s5_c08_h2_p8f_c2_r1_stopped_disk_rescue_audit.py` | 4,041 | `10e594d245604a930ba55cff4fb9fdc96ac1a91efa7fbffdc1bbbb3a5d27559e` |

The independent proposal audit passes 14/14. The proposal's raw SHA-256 is
reported externally after these frozen identities are present; it is not
self-embedded.

## Observed terminal boundary

The exact C2-R1 controller started its single candidate-neutral representative
container at `2026-08-31T15:07:57.978406008Z`. Progress was monotone through at
least `35,840/65,536` panels, with one container and no retry. Google Compute
Engine reports the original VM `TERMINATED`, last started at
`2026-08-31T08:05:03.030-07:00` and stopped at
`2026-08-31T10:25:26.239-07:00`. Repeated read-only serial-port queries return
`resource ... is not ready`; therefore PASS, FAIL, timeout and partial output
remain unauthenticated.

The original VM and its 30 GB `pd-balanced` source disk must remain stopped,
attached and unchanged. The stopped disk is evidence, not a retry surface.

## Frozen recovery resources

- project `dark-stratum-455714-h4`;
- region/zone `us-central1` / `us-central1-a`;
- one standard snapshot
  `nhm2-h2-p8f-c2-r1-evidence-snapshot-20260831` from the retained source disk;
- one 30 GB `pd-standard` snapshot-derived disk
  `nhm2-h2-p8f-c2-r1-evidence-clone-20260831`;
- one temporary on-demand `e2-small` helper
  `nhm2-h2-p8f-c2-r1-rescue-e2-small-20260831`;
- exact helper image
  `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`;
- one 10 GB `pd-standard` helper boot disk;
- helper boot before clone attachment; clone attached as device
  `nhm2-h2-p8f-c2-r1-evidence-clone` in Compute Engine `READ_ONLY` mode;
- aggregate helper runtime ceiling 3,600 seconds;
- combined compute and prorated-storage ceiling `$0.50` through 24 hours after
  resource creation.

All three derivative resource names must be absent before creation. First
failure is terminal; there is no resource substitution or second creation
attempt.

## Frozen guest and evidence procedure

The exact rescue procedure is
`tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8f_c2_r1_stopped_disk_rescue_v1.sh`.
It requires the guest block device to be read-only, selects exactly one
unambiguous ext4 or xfs partition, and mounts only ext4 with `ro,noload` or xfs
with `ro,norecovery`. Filesystem check/repair, replay, Docker start, source
mutation and original-VM restart are forbidden.

The rescue reads only the stopped source filesystem and preserves the existing
C2-R1 evidence root/export, Docker load/build logs, controller identity,
persistent controller journal when available, and bounded filesystem metadata.
It creates exactly one deterministic archive
`/home/pestypig/nhm2-h2-p8f-c2-r1-stopped-disk-evidence-v1.tgz` on the helper
boot disk. That archive must be copied once through Cloud Shell into an
initially absent local candidate-neutral capture and verified by byte count and
SHA-256 at every hop. The clone is then unmounted and the helper stopped.

The snapshot, derivative clone, stopped helper, original stopped VM/disk and
all evidence remain retained pending a separate cleanup decision within 24
hours. No evidence or cloud resource is deleted by this proposal.

## Result boundary

Only the already-frozen P8F result auditor may classify the recovered terminal
evidence. An authenticated `PASS` may select exactly its preregistered
outer-accumulation, boundary, unique-slot or distributed P8G lead. Authenticated
timeout, explicit execution failure or audit failure selects no causal lead.

The rescue does not authorize numerical execution, candidate evaluation,
positive sampling, handler/root creation, retuning, threshold changes, Rust,
G3/SI/metric/lane work, or candidate, proof, geometry/state, lane, lamp,
physical, propulsion or transport authority promotion.
