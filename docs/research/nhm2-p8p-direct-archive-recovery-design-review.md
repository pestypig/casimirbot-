Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral existing R39 fixture evidence retrieval
Capability or component: direct archive recovery from retained helper boot disk
Current maturity: evidence-backed design revision; not authorized or executable
Target maturity: authenticated local copy of the existing 12,122-byte archive
Required frozen inputs: R40 result/procedure; exact helper boot disk; archive digest
Required evidence: read-only clone provenance, bounded export, byte/hash equality, unmount and stop
Stop/fail criteria: different archive, writable mount, missing provenance, exhausted bounds, failed cleanup
Explicit non-goals: SSH trust changes, source restarts, archive recreation, science execution, retuning, deletion, authority promotion
Downstream gate unlocked: R39 fixture failure classification only

# Direct archive route — preferred preparation direction

The immutable R40 long-local-path result and R40 shell procedure place the
existing archive on the retained helper boot disk, outside the source-clone
mount: /home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz.
Recorded size: 12,122 bytes. SHA-256:
73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922.
This supports planning, not a fresh observation of continued file presence.

Sources: the R40 long-local-path result in docs/research and
tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r40_stopped_disk_fixture_evidence_v1.sh.

The proposed host-key route already requires a snapshot and read-only clone
of this SAME boot disk. Reading the existing archive directly instead would
remove host-key attestation, a second retained-helper restart, PLINK pinning
and the second network transfer path. It does not recreate the archive or
relax its frozen hash. Preserve existing host-key code and evidence unchanged
as historical preparation; do not present it as direct-archive execution.

## Proposed route, subject to a new amendment

Keep the proposed one-snapshot/one-10-GB-clone/one-e2-small envelope. Never
restart the retained helper or original VM. Boot the new helper before RO
attachment, verify kernel block RO and unique supported partition, and mount
ro,noload or ro,norecovery. Read only the exact regular archive through
no-follow descriptors. Require its exact size and digest before export.

After unmount, export one guest-attribute receipt containing original archive
base64 (16,164 characters), with a 24 KiB total receipt cap. Bind instance,
attempt and authenticated snapshot/clone provenance. Decode into an exclusive
short local path and independently recheck size/digest. Stop the new helper
and preserve all outcomes. Guest attributes provide transport, not independent
proof of producer identity. No SSH or numerical process is required.

## Authority and remaining work

Charter v2 forbids new snapshots/rescue/mounts: this plan grants none. Revise
the unapproved amendment, implement/test direct-file/export bounds and Linux
behavior, finish operation adapter/cleanup/serial failure capture, verify
prices and aggregate ceilings, independently review, then request one
consolidated execution approval. Current archive presence remains unverified.

Do not keep host-key-only tests on the critical path. Reuse general lifecycle,
mount, deadline, packaging and provenance work where applicable, and validate
the direct archive protocol separately.

## Consolidated readiness checkpoint

This checklist is preparation subordinate to the work program, not a new
scientific gate or a replacement definition of success.

| Required result | Current evidence | Remaining acceptance check |
| --- | --- | --- |
| Direct archive reader/export/receiver | Local hash, schema and failure-path checks | Actual controlled Linux descriptor/mount/export behavior |
| Startup package | Six embedded modules hash-bound and parse-checked | Full guest startup and bounded failure capture |
| SDK operations and cleanup | Fixed operation adapter; independent review of recorder-failure corrections; 22 read/cleanup tests | Bind the complete controller to authenticated resource observations and durable recording |
| Authenticated local archive | No recovered archive established | Exclusive local publication of exact 12,122 bytes and frozen SHA-256 |
| Resource/cost authority | Existing charter expressly excludes this new rescue route | Revised consolidated amendment, priced retention, aggregate budget/expiry check, frozen manifest and user approval |

Next implementation work must close the composed controller and durable
evidence path, not add further host-key mechanisms. Any isolated test added
must close a named acceptance gap above or reproduce a concrete defect.
Do not call the route execution-ready while Linux behavior or the composed
failure/stop path remains unverified. Do not request approval of an unfinished
controller by presenting parser or mocked test counts as recovery evidence.

If these remaining prerequisites require a new environment or broader
authority, request that bounded scope explicitly instead of silently starting
it. Keep the retained resources and existing evidence unchanged.
