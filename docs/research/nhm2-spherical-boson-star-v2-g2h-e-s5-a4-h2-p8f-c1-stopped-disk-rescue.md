Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8F-C1 stopped-disk terminal-evidence rescue
Current maturity: exact N2 controller launched once and automatically stopped; serial console empty; numerical/result state unread
Target maturity: authenticated read-only stopped-disk evidence archive and immutable C1 classification
Required frozen inputs: stopped VM/disk `nhm2-h2-p8f-c1-n2-32-20260831`, archive `c40fda6b...24640`, controller `940ee74a...db8b2`, binary `14140897...1bad6`, and bounded-continuation charter `5dda0a1a...ff945`
Required evidence: original VM terminated, source disk ready and untouched, derivative snapshot/clone identities, read-only guest device and mount, deterministic rescue archive, local hash agreement, independent result audit, and stopped helper
Stop/fail criteria: original restart or mutation, ambiguous partition/filesystem, writable clone/device/mount, evidence mutation, numerical or Docker start, retry, retune, candidate ingress, cost/storage bound, or authority promotion
Explicit non-goals: restarting C1, repairing the run, creating another scientific VM, frozen-candidate evaluation, Rust/G3/SI/metric/lane work, evidence deletion, or authority promotion
Downstream gate unlocked: smallest separately versioned C1 transport/build/numerical successor justified by authenticated evidence; no execution authority

# H2-P8F-C1 stopped-disk rescue

The exact corrected N2 VM launched the frozen controller once. The controller
was initially `active/running` with PID 3123 and then automatically stopped the
VM at `2026-08-31T06:17:06.403-07:00`. The VM is `TERMINATED`; its 30 GB
`pd-balanced` source disk is `READY`. Google serial-port output is empty, so the
controller's terminal phase cannot be classified from remote console evidence.

The source VM and disk must remain stopped and unchanged. Recovery uses the
already proven snapshot-to-read-only-clone pattern:

- snapshot `nhm2-h2-p8f-c1-evidence-snapshot-20260831`;
- 30 GB `pd-standard` derivative disk
  `nhm2-h2-p8f-c1-evidence-clone-20260831`;
- one temporary `e2-small` helper
  `nhm2-h2-p8f-c1-rescue-e2-small-20260831` in `us-central1-a`;
- exact Debian image
  `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`;
- 10 GB `pd-standard` helper boot disk;
- helper boot before clone attachment; clone attached in Compute Engine
  `READ_ONLY` mode.

The guest must independently require the clone block device read-only and
identify exactly one unambiguous Linux partition. Only ext4 with `ro,noload` or
xfs with `ro,norecovery` is admissible. No filesystem check, recovery, replay,
Docker start, source mutation or original-VM restart is allowed.

The rescue may read only the stopped source filesystem and preserve available
C1 evidence: the exact evidence root/export if present, controller load/build
logs under `/tmp`, persistent unit journal if present, source/controller
identity, and bounded filesystem metadata needed to classify the first terminal
phase. It creates one deterministic archive on the helper boot disk, copies it
through Cloud Shell into the local candidate-neutral capture, verifies size and
SHA-256 at every hop, unmounts the clone and stops the helper.

The snapshot, derivative clone, stopped helper, original stopped VM/disk and
all evidence remain retained pending a separate cleanup decision. This rescue
does not authorize a numerical retry or imply candidate, proof, geometry/state,
lane, lamp, physical, propulsion or transport authority.
