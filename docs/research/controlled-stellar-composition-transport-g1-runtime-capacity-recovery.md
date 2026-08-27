Program gate: Environment G8 parallel delivery lane; Solar G1 runtime-capacity recovery dependency
Workstream: controlled stellar composition transport / installed-node storage recovery
Capability or component: Google Drive archival connector and narrow Windows window-state broker
Lifecycle stage: capability specification; execution and verification remain future work
Reaction timescale: none for archival requests; monitor_only for window-state observations and receipts
Authority owner: signed-in workstation owner; Helix owns admission, provenance, receipts, and revocation
Current maturity: projected
Target maturity: specified
Required frozen inputs: G1 attempt-1 result; operator-approved archival candidate manifest; exact Google Drive profile and destination; frozen Docker capacity threshold
Required evidence: connector and authority contracts, resumable-upload receipts, local and remote SHA-256 agreement, destination/file-count closure, typed window-operation receipts, and post-release disk-capacity measurement
Stop/fail criteria: wrong profile or destination, credential exposure, quota failure, non-resumable or unverifiable transfer, hash/count mismatch, ambiguous local deletion scope, unauthorized window target, integrity-boundary failure, or secure-surface request
Explicit non-goals: closing solar G1, changing calibration criteria, deleting local files during upload, arbitrary desktop input, credential automation, privilege escalation, or claiming MESA execution
Downstream gate unlocked: a new versioned G1 attempt may start after verified capacity recovery; G2 remains blocked until G1 itself passes

# G1 runtime-capacity recovery plan

Status: planning-only cross-program dependency packet. It does not advance the
solar research maturity beyond `reduced_order_diagnostic`, and it does not
advance either environment capability beyond `projected` until its own
implementation and evidence exist.

G1 attempt 1 stopped at `INSUFFICIENT_DISK_FOR_MESA_IMAGE`. The primary recovery
path is verified archival to the workstation owner's Google Drive. A narrow
window-state broker is retained as a reusable secondary capability for cases in
which Windows window ownership or integrity prevents the existing client from
bringing an ordinary application window forward. Neither capability is
scientific evidence.

This packet is admitted only as a parallel G8 delivery-lane specification under
[`helix-environment-harness-work-program-v1.md`](../helix-environment-harness-work-program-v1.md).
It must reuse the canonical lifecycle and single effect authority; it must not
create a private model/tool loop or expose arbitrary filesystem, process, input,
or credential authority.

## Addition A — Google Drive archival connector

The archival connector is the required capability for the present G1 recovery.
It must be profile-owned and OAuth-bound, with credentials kept outside chat,
model context, renderer state, command lines, logs, receipts, and repository
files. The model-visible surface receives only sanitized connection identity,
scope, quota, progress, verification, and failure facts.

The first capability family is deliberately narrow:

- select an operator-approved frozen local manifest;
- preflight the exact Drive profile, destination folder, quota, source sizes,
  source readability, and local free-space target;
- create resumable uploads with stable transfer and idempotency identities;
- checkpoint, retry, cancel, and resume without duplicating remote objects;
- retain local size and SHA-256 plus remote object ID, size, checksum when the
  provider supplies one, and upload-completion receipt;
- verify destination identity, file count, byte count, and content integrity,
  including bounded download-and-rehash samples when provider metadata alone is
  insufficient; and
- revoke the connection or transfer lease without deleting either copy.

Upload and local capacity release are separate stages. A successful upload never
authorizes deletion. Local removal requires a later, explicit owner-confirmed
release manifest naming exact resolved paths whose verified remote objects are
already frozen. A mismatch, missing receipt, quota error, destination collision,
or ambiguous path stops before local mutation.

The connector should expose provider-neutral archival operations through the
environment harness and bind each request and receipt to the exact profile,
node, connection, destination, transfer, manifest, object, and policy revision.
Google Drive is the first provider expression, not a provider-specific authority
shortcut.

## Addition B — narrow Windows window-state broker

The window-state broker is optional for G1 capacity recovery and must not become
a dependency when the Drive connector can complete through its authenticated
API. Its purpose is to close the observed desktop-control gap without granting
general-purpose GUI automation.

Its allowlisted operations are only:

- list eligible top-level windows with sanitized process, executable, PID,
  HWND, title, visibility, minimized state, and integrity relationship;
- minimize one exact eligible window;
- restore one exact eligible window; and
- request focus for one exact eligible window.

Every mutation must bind the frozen window identity and return a typed receipt
containing the requested operation, pre-state, post-state, target identity,
authority decision, Windows result, and any integrity blocker. PID or title
alone is insufficient because processes and titles can be reused.

The broker must deny secure desktop, credential prompts, password managers,
security products, sign-in surfaces, elevation prompts, hidden/system windows,
and any target outside the installed owner's allowlist. It grants no arbitrary
keyboard or pointer input, text entry, browser form submission, process launch
or termination, filesystem access, security-setting change, token access, or
privilege escalation. If the target has a higher integrity level than the
caller, the ordinary capability returns a typed blocker. Any later elevated
helper must be separately installed, narrowly allowlisted, owner-mediated, and
audited; it cannot inherit broad desktop-control authority.

## Frozen recovery sequence

1. Freeze the exact operator-approved archival manifest with resolved paths,
   sizes, modification times, and SHA-256 hashes. Recently active and excluded
   paths remain out of scope unless the owner creates a new manifest version.
2. Establish the profile-owned Drive connection and freeze the destination
   folder identity, available quota, transfer policy, and collision behavior.
3. Upload the manifest with no local deletion permission, retaining resumable
   checkpoints and immutable per-object receipts.
4. Verify destination, object count, byte count, and hashes; perform bounded
   download-and-rehash sampling where needed. Any mismatch blocks the batch.
5. Present a separate exact local-release manifest for owner confirmation.
   Release only confirmed, remotely verified objects and retain the release
   receipt. Directory shells may remain when the owner wants active structure
   preserved.
6. Measure free capacity on the actual Docker data drive. The hard G1 threshold
   remains at least `25,000,000,000` free bytes; `35–40 GB` is an operational
   target for image expansion, solver work files, and retained evidence, not a
   new scientific acceptance criterion.
7. Only after capacity passes, freeze a new G1 attempt, verify the pinned MESA
   image digest, and continue the baseline packet's science sequence.

## Evidence and claim boundary

The capacity-recovery record must distinguish `UPLOAD_VERIFIED`,
`LOCAL_RELEASE_CONFIRMED`, and `G1_RUNTIME_CAPACITY_READY`. None of these means
`PASS_CALIBRATED_BASELINE`. Browser visibility, a completed OAuth consent page,
an upload-progress indicator, or a window-focus receipt is not proof that a
file is durable or that MESA ran.

Implementation must follow the environment harness reference-to-governed-parity
method: prove the narrow public operation directly, define provider-neutral
identity/admission/evidence contracts, then verify the same lifecycle through
the governed surface. The applicable existing boundaries are
[`helix-environment-adapter-registry-v1.md`](../architecture/helix-environment-adapter-registry-v1.md)
and `shared/helix-client-capability-action.ts`; neither currently implements
these two capability families.
