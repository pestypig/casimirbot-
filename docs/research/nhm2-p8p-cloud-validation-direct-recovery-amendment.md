Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral R39 evidence recovery
Capability or component: cloud Linux validation and direct archive recovery
Current maturity: operator-selected cloud route; implementation prerequisites open
Target maturity: authenticated local R40 archive and confirmed helper shutdown
Required frozen inputs: charter v2, retained source identities, exact archive digest, reviewed controller/source manifest
Required evidence: Linux fixture results, read-only provenance, immutable export/publication, independent stop observation
Stop/fail criteria: failed validation, mismatched identity, writable evidence mount, exhausted limits, incomplete cleanup
Explicit non-goals: local Docker startup, SSH trust mutation, numerical execution, retuning, deletion, authority promotion
Downstream gate unlocked: actual R39 build-failure classification only

# Cloud validation and direct recovery amendment

The operator selected cloud validation and gave permission to proceed after
the environment-choice blocker. Continue preparation on this route without
asking the same cloud-versus-local question again. Do not start local Docker.
This document is not a claim that the incomplete controller has been frozen,
reviewed end-to-end or executed. Preserve the original charter and prior
attempts unchanged. This supersedes the host-key-only design direction, not
historical evidence.

## Bounded route

Use the previously proposed envelope: one e2-small helper with a 10 GB
pd-standard boot disk in us-east1-b, one STANDARD snapshot of the stopped
retained rescue helper's 10 GB boot disk, and one 10 GB pd-standard clone.
Keep all new resource names bound to the existing proposedResources inventory
until the final manifest; do not make silent resource substitutions.

Source helper: nhm2-h2-p8p-r39-rescue-e2-small-20260904,
ID 7129462452423922626. Source boot disk ID: 1064813028101755842.
Project: dark-stratum-455714-h4. Exact image:
projects/debian-cloud/global/images/debian-12-bookworm-v20260817.

Boot the new helper before clone attachment. Run bounded candidate-neutral
Linux validation using only synthetic files on its own boot disk first.
It must exercise descriptor traversal rejection, regular-file/size checks,
bounded worker termination and failure export. Freeze this fixture inventory
and its maximum runtime before dispatch. No Docker installation is needed for
these Python/Linux recovery checks.

After fixture PASS, permit one read-only clone attachment and one supported
filesystem mount (ext4 ro,noload or xfs ro,norecovery). The actual kernel
read-only checks and mount evidence must pass before reading the fixed archive.
No filesystem repair, write mount, source restart, private-key read or SSH.
First failure terminates recovery and proceeds to evidence capture/shutdown.

Read only the existing archive:
/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz
12,122 bytes; SHA-256:
73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922.
Unmount before guest-attribute export. Retrieve through the authenticated SDK,
validate resource/attempt provenance and content, publish exclusively locally,
and independently confirm the exact helper TERMINATED. Preserve failures.

## Limits and price checkpoint

Do not exceed the previously proposed 3,600-second helper runtime or $0.50
incremental recovery ceiling, including seven-day new-storage retention.
Reserve at least 300 seconds for cleanup. Debit the existing $12/21,600-second
aggregate; do not replenish it or extend charter expiry. Existing retained
storage continues to cost money independently. No automatic deletion granted.

Official pricing pages were checked during preparation:
[VM pricing](https://cloud.google.com/products/compute/pricing/general-purpose)
and [disk/snapshot pricing](https://cloud.google.com/compute/disks-image-pricing?hl=en).
Their displayed tables include e2-small $0.016752855/hour, standard disk
$0.000054795/GiB-hour and regional standard snapshot $0.000068493/GiB-hour.
Do not mistake a page's default regional table for a verified account quote:
confirm us-east1 applicability, IP/network costs, retention and remaining
aggregate admission before creation. Do not assume free-tier credits.

## Remaining execution prerequisites

1. Finish the cloud Linux fixture and integrate it with startup/recovery.
2. Bind the composed controller to authenticated preflight observations,
   dynamic resource IDs, bounded recording, polling and safety shutdown.
3. Independently review the complete inventory, not only component mocks.
4. Freeze source hashes, exact invocation, budget reservation and local root;
   confirm these stay within the operator's permission and charter limits.

After authenticated archive recovery, return to the unchanged build-only
fixture and one P=1024 calibration requirements. This recovery amendment does
not itself authorize a second numerical process or establish a boson star.
