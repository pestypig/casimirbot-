Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral existing fixture-evidence recovery
Capability or component: independent host-key attestation and pinned retrieval
Current maturity: design draft; no execution authority or readiness claimed
Target maturity: authenticated public host-key binding and existing archive recovery
Required frozen inputs: charter v2, ledger entry 0013, retained helper/disk identities, expected archive digest
Required evidence: independently reviewed controller, API resource provenance, read-only mount checks, public-key fingerprint, immutable archive and stop receipts
Stop/fail criteria: ambiguous identity, writable mount, private-key exposure, fingerprint mismatch, budget exhaustion, failed cleanup
Explicit non-goals: science changes, numerical execution, trust-cache mutation, evidence deletion, rerunning exhausted attempts
Downstream gate unlocked: existing R39 fixture failure classification only

# Host-key recovery amendment — design draft, not execution-ready

## Evidence and authority gap

The charter-v2 retrieval-2 SSH exchange presented an uncached ED25519 key.
This proves connection/key exchange, not trusted host identity. The subsequent
authenticated API investigation confirmed both exact retained VMs stopped;
hostkeys/ guest attributes were absent, and serial output was unavailable.
These observations do not imply compromise. R39 build evidence remains unread.

Charter v2 explicitly forbids new snapshots, mounts, attachments and rescue
resources. Generic continuation permits preparation, not those operations.
Keep the charter and historical receipts immutable. This document supplies
no authority and must not be treated as an executable proposal seal.

## One consolidated proposed scope

Subject to user approval after local implementation and independent review:

1. Authenticate the retained stopped helper
   nhm2-h2-p8p-r39-rescue-e2-small-20260904, instance ID
   7129462452423922626, project dark-stratum-455714-h4, us-east1-b.
   Bind its boot disk ID 1064813028101755842, 10 GB pd-standard,
   and require the disk unchanged and the VM TERMINATED.
2. Create at most one snapshot of that boot disk, one 10 GB pd-standard
   snapshot-derived clone and one temporary e2-small attestation helper in
   us-east1-b with a 10 GB pd-standard boot disk. Freeze exact resource names,
   image identity and all source hashes before dispatch. No substitutions.
3. Bootstrap only the new helper with a reviewed finite startup procedure and
   guest-attribute export enabled at creation. No changes to existing metadata,
   IAM, firewall, SSH configuration, trust stores or original resources.
   Boot before attaching the clone in Compute Engine READ_ONLY mode.
4. Require guest block-device read-only status and exactly one unambiguous
   filesystem. Mount ext4 ro,noload or xfs ro,norecovery; otherwise stop.
   Read only the regular non-symlink public file /etc/ssh/ssh_host_ed25519_key.pub
   on the clone under a 16 KiB cap. Never read or export a private key.
5. Export the bounded public-key receipt through the new helper's guest
   attributes. Retrieve it through the authenticated Google API, with exact
   instance ID, disk/snapshot provenance and chronology bindings. Do not SSH
   to the new helper or bootstrap trust from an unverified SSH connection.
6. Unmount the clone and stop the new helper. Require confirmed stop before
   any retained-helper restart. If its public-key fingerprint differs from
   SHA256:KlL4OD6sh+jRXN+GNToJ+YcX1APp3sXaw4DZF2XinGA, stop for review;
   do not update an expected fingerprint to force acceptance.
7. Only after independent review of the authenticated public-key receipt,
   allow per-invocation explicit host-key pinning in the existing PLINK client.
   Do not write a trust cache. Use only the charter's remaining one retained
   helper restart, unchanged existing archive read and bounded exclusive sink.
   Require 12,122 bytes and SHA-256
   73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922.
   Stop the retained helper and authenticate its stopped state.

## Limits and pre-execution requirements

Proposed new attestation helper allowance: one creation/start, at most 3,600
seconds including at least 300 seconds cleanup reserve; at most USD 0.50
including seven-day newly created storage. This is a proposed ceiling, not a
verified price estimate. Official prices and conservative total feasibility
must be checked before execution; infeasibility blocks rather than raises it.
Charge all new costs/runtime against the existing charter aggregate and expiry,
not an added budget. The existing retained-helper retrieval allowance is not
renewed. No concurrent helper operation. Preserve all resources after stopping;
seek a separate retention/deletion decision before the priced retention ends.

The actual installed SDK/client must pass local tests for public-key pin syntax,
guest-attribute receipt parsing, exact key algorithm/base64 validation,
fingerprint calculation, wrong-key rejection, resource identity binding,
read-only mount enforcement, bounded export and automatic cleanup. Test with
synthetic inputs; do not use production credentials in fixtures. A mismatch
must never invoke retrieval. Independent review is infrastructure review, not
scientific replay. Freeze names, manifest, controller and remaining allowance
before requesting this amendment's execution approval.

## Preparation status (not execution readiness)

Implemented components: public-key parser; resource/lifecycle predicates;
injected orchestration core; read-only SDK query adapter; Linux guest executor
and isolated export worker. Local tests cover synthetic inputs and simulated
failures. Some components have received independent infrastructure review.
This is not a complete, independently approved cloud controller.

Remaining work before an execution authorization packet:

- Controlled Linux tests for descriptor traversal, RO mount/unmount and worker
  timeout/termination; actual SSH wrong-key rejection test.
- Guest-attribute receipt validation integrated with the API resource chain.
- Actual create/snapshot/attach/stop adapter and exclusive bounded recorder,
  with independent cleanup on partial API failures.
- Frozen startup packaging, exact resource names, image/rate checks, complete
  manifest, aggregate-budget admission and composed independent review.

Do not replace these checks with additional parser-test counts. If local
design review identifies an unresolvable bootstrap or export dependency,
revise locally before any paid creation attempt.

## After recovery

Return to the unchanged charter: validate archive paths/types/size, classify
R39 from its actual logs, correct demonstrated infrastructure defects, obtain
build-only PASS, then the one P=1024 calibration and frozen P8Q decision.
This amendment grants no additional numerical process and cannot establish a
boson-star solution, physical viability or warp capability.
