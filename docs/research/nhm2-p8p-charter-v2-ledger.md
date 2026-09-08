# P8P charter v2 append-only operating ledger

## 0001 — activation observed 2026-09-05T14:15:41Z

User explicitly approved charter SHA-256
8ba8456b165b7fbc3b7b76754aed272e749524cf039b19552058baaf4fb578d1.
Conservative execution expiry: 2026-09-12T14:00:00Z (earlier than this
activation observation). Do not modify the approved charter or historical runs.

Aggregate maximum: USD 12.00 incremental, 21,600 VM-running seconds.
Consumed under this charter: USD 0.00 cloud compute, 0 VM-running seconds;
retrieval restarts 0/2, build runs 0/2, calibration creation 0/1,
numerical processes 0/1. Prior attempts are not retried by activation.
Existing retained-storage charges continue separately and are not measured here.
Local staging free-space check: 14,519,451,648 bytes available on C:.

Next action: installed SDK argument generation and actual client bounded
local preflight, plus independent infrastructure review. No cloud dispatch.

## 0002 — local preflight import failure

The first local SDK fixture exited before client execution with
ModuleNotFoundError: apitools. The standalone fixture omitted the SDK's
lib/third_party import path. Added that local path; no dependency installation,
cloud action or VM allowance consumed. Original failure remains in task output.

## 0003 — actual SDK/client local preflight PASS; review blocks dispatch

Installed SDK constructed literal source/destination arguments with exactly
one -batch and -v. Actual PSCP 0.83 executable SHA-256
80d8f9581d934956b8960ffa3d14713bb9aba548425ba5cda9b964439de52d9f
connected only to a local loopback fixture which closed before SSH handshake;
the client returned exit 1 with verbose connection-abort evidence. No real
key, credentials, cloud connection, authentication or transfer was used.
Host-key rejection and live transfer remain untested. Full output is preserved
in the task tool result; this is a limited transport preflight, not build PASS.

Independent review of installed SDK/source found ordinary gcloud compute scp
can enter metadata/key-management paths, contrary to the charter's no-mutation
boundary. The inherited subprocess wrapper also waits indefinitely for child
close if process-tree termination fails, potentially preventing cleanup.
Both are local design blockers to fix before any paid restart. Do not execute
the unchanged R43 adapter or call live gcloud scp to test these findings.
Cloud budget consumed remains zero; all attempt allowances remain unused.

## 0004 — local process and direct-client boundary implementation

Added separately versioned charter process and transfer-argument modules;
historical R42/R43 runtime files remain unchanged. Twelve local tests pass:
three simulated kill failure/nonsettlement cases, real argument preservation,
real process timeout, exact direct PSCP argv and adversarial argument inputs.
An unconfirmed local process exit remains an explicit error with PID; return
to the caller permits independent VM stop, not a new attempt or success claim.

Direct PSCP arguments use batch, verbose and no-agent modes plus the existing
key path. They do not call gcloud SCP/OS Login/metadata helpers or accept keys.
The IPv4 must be bound later to an authenticated running helper response; the
pure argument module alone does not establish server identity. No transfer or
cloud call ran. Independent review of these new modules is pending; a complete
charter-aware controller, current startup/resource checks and budget reservation
are still required before dispatch. Cloud allowances remain unused.

## 0005 — reviewed termination race corrected

Reviewer found that parent close could precede a failed tree-kill callback.
The process module now waits for both on timeout/output-limit paths; an error
or grace expiry reports termination unconfirmed even if the parent has exited.
Added three ordering regressions (kill error, missing callback, success after
close). Combined local suite passes 15/15. This corrects an infrastructure
receipt/cleanup defect; it is not evidence of successful cloud retrieval.

Startup lineage review found R40 created the exact standard Debian helper
without startup metadata and its authenticated rescue introduced no services
or fstab entry, unmounting before success. Next preflight must bind current
boot/resource identity and instance/project metadata to that history. Metadata
alone cannot establish arbitrary guest cleanliness; unexplained changes must
stop dispatch. No cloud attempt, cost or runtime consumed in this entry.

## 0006 — read-only live inventory and integrated draft

Inventory at 2026-09-05T14:25:15.063Z confirms both exact VMs TERMINATED.
Helper instance metadata keys are empty; project common metadata has only
ssh-keys. Helper boot disk ID 1064813028101755842, creation
2026-09-04T13:42:21.741-07:00, exact Debian v20260817, 10 GB pd-standard,
READY, attached only to the helper. No metadata write occurred. This is a
startup-configuration/known-action-lineage check, not arbitrary guest proof.

Independent review confirmed the corrected timeout module and 15/15 tests.
An integrated first-attempt controller is drafted but NOT frozen or executed;
its review must resolve remaining cleanup/accounting concerns before dispatch.
Official general-purpose pricing page currently lists e2-small at
USD 0.016752855/hour:
https://cloud.google.com/products/compute/pricing/general-purpose
Proposed first retrieval reservation remains a conservative USD 0.10 and
1,200 seconds; neither reservation nor start has been consumed yet.

## 0007 — integrated cleanup/admission repair in progress

Safety cleanup now bypasses ordinary expiry admission and records receipts
best-effort with console fallback; receipt failures prohibit PASS. Operational
timeouts use a monotonic deadline and a complete 1,200-second window must fit
before authorization expiry. First-attempt ledger binding added; refresh its
hash only at final freeze after validating the complete zero-use history.

Transfer polling checks exact expected size and 1 GiB free-space reserve and
can cancel the client through the bounded process API. Polling is not an OS
write quota and may overshoot between samples; do not claim a hard staging
limit is proven by this check alone. Startup projection now requires the exact
project identity and expected metadata schema instead of defaulting missing
fields to empty. Twenty-two local tests pass, including real cancellation.

The integrated controller remains unexecuted/unfrozen. Final manifest/key
identity binding, composed cleanup tests and staging-limit review remain.
No cloud attempt or runtime consumed; previous evidence remains preserved.

## 0008 — composed failure tests and identity binding

Five composed controller tests pass with mocked cloud boundaries: success,
transfer failure, all receipt writes failing after start, one failed stop
followed by success, and all three allowed stop requests failing. Tests show
receipt failure does not suppress safety cleanup; unresolved stop cannot PASS.
Actual cloud behavior remains untested. Existing local .ppk identity is bound
by SHA-256 only; no private key material is printed or copied into evidence.

Runtime manifest verification added to explicit execution entry; manifest
generation/final review pending. Controller is still unexecuted. Aggregate
cloud cost/runtime/attempt usage remains zero as of this entry. This full
ledger is the prospective zero-use baseline for the first reservation.

## 0009 — capped read transport design selected before first attempt

Installed PSCP help confirms -l selects username, not a bandwidth cap; no
bandwidth argument was added. Independent review confirmed the charter permits
same-helper PuTTY SSH reading only the exact authorized archive using a local
command file, with no remote script upload/write, mount or trust acceptance.
This changes the local sink, not the scientific input or resource scope.

An inert capped raw-byte sink passes five tests: exact binary/digest,
oversized first chunk, oversized later chunk, incomplete stream, exclusive
destination. Excess bytes are rejected before disk write; bounded partial
evidence is preserved. Local test files contain only synthetic bytes.
The proposed command is exactly exec cat -- followed by the authorized archive
path. No remote invocation occurred. Actual PLINK local preflight, integration
and final manifest binding still precede the first charter restart.

## 0010 — PLINK integrated local preflight complete

Actual installed PLINK 0.83 loopback preflight accepted the frozen batch,
no-PTY, no-agent, no-sharing, raw-stdout and local-command-file options and
returned a bounded verbose connection-close error before SSH handshake. No
real credential was supplied or remote connection made. Remote trust and
archive access remain untested. Raw stdout now flows into the 12,122-byte
capped sink rather than a client-owned output file. Nine composed/stream
tests pass, including actual binary preservation and actual oversized-child
output rejection. Cleanup budgets are 40s stop/20s status per round, with
10s termination grace per command, at most 240s across three rounds.
Unconfirmed local termination remains a blocking result even after VM stop.

No charter cloud attempt, runtime or expenditure consumed. First-attempt
ledger baseline and complete runtime manifest remain to be frozen following
final source review. Local fixtures and receipts are small; no payload staging
or production download root has been created.

## 0011 — first controller dispatch failed before restart

Frozen manifest bc929a5840d1cc35cb378f95e59cbaa3b19c53999ea1ad6da5ea10a12a6804c3
and controller 7d6f6e6b755c71b4ea45a0e880ec0a2d2797945dad4e6279edc482751eff3bdb
were invoked once. Capture charter-v2-retrieval-1 is immutable. Result:
unexpected_startup_metadata, startAttempted false, zero runtime; no reservation
or VM start was dispatched. The project projection emitted only name and
omitted commonInstanceMetadata, so the strict guard correctly rejected it.

Required transport-design review: failure is local API projection handling,
not host trust, connectivity or changed startup data. Full read-only inventory
at 2026-09-05T14:44:14.097Z still shows empty helper metadata and project
ssh-keys only, both VMs TERMINATED, unchanged boot identity. A successor must
read full metadata and sanitize values locally, and test that actual API
shape before dispatch; no weakening of missing-field rejection. Preserve the
executed source/manifest; do not rerun it. This correction fits charter scope.

Charter helper restarts remain 0/2, build runs 0/2, calibration creation 0/1,
numerical processes 0/1, cloud compute USD 0 and VM runtime 0 seconds.

## 0012 — first helper restart; explicit host-trust failure

Successor controller 8ba3b42f23b8b785faf1d3cf0557b52e73cccaae545a38ca2550dd0bf583e50d
under manifest ff459475c84fb1d60b2ecc957de0caa7df38f58982b8fe54475e4b1d39315338
executed once. It reads complete project metadata and sanitizes values locally.
Immutable capture: charter-v2-retrieval-2. Metadata/resource guard passed;
one helper restart and one PLINK read attempt occurred. Result records
156,117 ms from start intent through confirmed helper stop; no unresolved
local process. Archive verified false; process_exit_1; no archive bytes read.

At 2026-09-05T14:50:42.489Z PLINK receipt 017-failure.json proves TCP/22,
SSH negotiation and key exchange succeeded, then batch mode rejected an
uncached host key. It presented ssh-ed25519 fingerprint
SHA256:KlL4OD6sh+jRXN+GNToJ+YcX1APp3sXaw4DZF2XinGA.
This matches the historical R40 presented fingerprint, but two observations
are not independent authentication. No key was accepted or cache modified.
Stop/status receipts 019–022 confirm helper TERMINATED after this failure.

Required design review: the earlier silent timeout is now narrowed by a direct
live failure to absent local host trust on this attempt, not compute capacity,
SDK projection or file-size handling. Do not claim R43's precise cause proved
retroactively. Next prerequisite is an independently authenticated host-key
binding and operator direction for its use. The charter explicitly makes
unresolved identity a user blocker; do not spend the second restart on the
same untrusted connection, auto-accept the key, or infer trust from IP equality.

Aggregate conservative reservation consumed: USD 0.10 and 1,200 seconds.
Remaining conservative allowance: USD 11.90 and 20,400 seconds. Actual
observed runtime: 156.117 seconds; exact billed cost not yet reconciled.
Helper restarts 1/2; build runs 0/2; calibration creation 0/1; numerical
processes 0/1. Both original and helper were observed stopped. Existing
storage charges continue separately. No build or scientific work ran.

## 0013 — operator-authorized read-only host-key investigation

On 2026-09-05 at 14:57–14:59 UTC, the authenticated SDK confirmed the exact
helper and original instance IDs and both TERMINATED states. The helper's
Google API hostkeys/ guest-attribute query returned HTTP 404 (not found).
A separate read-only serial-port query returned resource-not-ready; no boot
fingerprint could be recovered. These are unavailable attestation sources,
not evidence of a malicious key or a trusted key.

Receipts: candidate-neutral/charter-v2-hostkey-readonly-v1.json and
candidate-neutral/charter-v2-serial-hostkey-readonly-v1.json under
artifacts/nhm2/g2h-e-s5. No restart, SSH, key acceptance, trust-cache change,
resource mutation, build or numerical execution occurred. Counters and
conservative remaining allowances from entry 0012 are unchanged.

Host identity remains unresolved. The next step requires independent host-key
attestation (for example an authorized read-only inspection of the stopped
helper boot disk), not another transfer attempt. Such resource creation or
inspection must be reviewed against the charter before execution; this
read-only API authorization does not grant it. Preserve the remaining restart.

## 0014 — local public-key parser implementation and review correction

Implemented h2_p8p_hostkey_public.mjs and its local test suite under the g2h
tool directory. The component enforces the 16 KiB public-record cap, canonical
base64, exact ED25519 SSH wire shape and expected fingerprint equality. It
does not claim authenticated provenance or invoke a client/cloud operation.

Independent infrastructure review identified Node ASCII decoding masking
high-bit algorithm bytes. Replaced decoding comparison with exact Buffer
equality and added all eleven high-bit position regressions. The resulting
eight-test suite passes, including a synthetic public-key fingerprint check
against installed Windows OpenSSH ssh-keygen. Tiny synthetic temporary
public fixtures are retained. No real private keys or credentials are used.

The recovery controller, guest procedure, API/disk provenance validation,
cleanup tests and actual PLINK pin preflight remain unfinished; this parser
result is not recovery readiness or scientific evidence. No cloud resources
were changed and entry 0012 cloud attempt/budget counts remain unchanged.

## 0015 — local resource-chain predicate; review gaps retained

Added h2_p8p_hostkey_provenance.mjs and synthetic tests. Exact API URLs/IDs,
sourceDiskId/sourceSnapshotId, clone READ_ONLY/non-auto-delete attachment,
unique ownership and device binding are checked. Independent review found
that Date.parse accepted timezone-less and normalized impossible dates;
strict timezone-explicit calendar validation now rejects these. Local suite
passes 18/18 after repair (review originally examined the 16-test version).

This remains structural validation only. Before execution readiness, controller
checks must prove source stop continuity across snapshot, STANDARD snapshot
type, helper boot disk ID/image/size, boot-before-attachment chronology,
bounded authenticated API responses and immutable creation-assigned ID
bindings. Those obligations are not discharged by this predicate. No cloud
calls, restarts or costs were incurred by this local work. Recovery and the
broader scientific objective remain unfinished.

## 0016 — lifecycle and helper boot identity checks

Extended the provenance predicate to require a pre-snapshot stopped-source
receipt, unchanged last-start/last-stop timestamps and source attachments,
STANDARD snapshot type, pre-attachment RUNNING helper receipt with only its
boot disk, ordered attachment intent, and exact helper boot-disk ID, image,
size, type and ownership. Independent infrastructure review reran 29/29 tests
and found no critical scoped defect; its suggested pre-attachment boot-mode
check was added with another regression test (30/30 locally).

These receipts are still synthetic test inputs. Authenticated capture, response
bounds, immutable resource-ID enrollment, guest read-only enforcement and
cleanup remain controller implementation obligations. No new cloud authority
was used or inferred, no cloud calls occurred, and budgets remain unchanged.

## 0017 — orchestration core and failure-path tests

Implemented h2_p8p_hostkey_controller.mjs without a production adapter or CLI
entry point. Its injected-operation suite now passes 17/17 local tests.
Independent review of the initial 15-test version identified deadline expiry
suppressing emergency stop, a potentially hung evidence recorder, and missing
failure-safe guest unmount obligations. Added a bounded recorder and emergency
stop dispatch after deadline, with regression tests. Such overrun remains a
failure, not a budget extension or permission for new work.

Guest unmount is explicitly required to occur in the guest's own finally/trap
before any outcome export. That guest implementation remains unfinished;
comments do not establish this guarantee. Actual API binding, authenticated
stop confirmation and guest cleanup are not proved by these mocks. No cloud
call or resource change occurred. The recovery amendment is not ready to run.

## 0018 — guest cleanup core and bounded public-file reader

Added import-safe h2_p8p_hostkey_guest.py with mount/read/finally-unmount/export
ordering and a Linux descriptor-based public-key reader. Six local unittest
methods pass, including per-phase injected failures, bad bytes, private-header
rejection, path traversal rejection and export failure after unmount.

Review identified ASCII decoding outside the failure guard, insufficient
public-content validation and incomplete ancestor symlink protection. Moved
decoding into the guarded phase, required canonical ED25519 wire content before
export, and opened all components from the filesystem root with O_NOFOLLOW.
These latest repairs pass the local suite; Linux descriptor behavior itself
has not run here. Mount commands, block-device checks and guest-attribute
transport remain injected interfaces, not a production executor. No cloud
or filesystem mount operation was performed. Recovery readiness is unproved.

## 0019 — actual installed-client pin-option check

Read-only WSL inventory returned no running distributions. No Linux service
was started. The installed bundled Python lacks Paramiko, and no local ssh2
module or sshd command was found; no dependency was installed.

Ran h2_p8p_hostkey_plink_pin_preflight.py against SHA-bound PLINK 0.83
(7308e9d356f14aa1f08cab1af363f71a077bf35dcb49e50b363418044758cd1e).
It accepted the explicit -hostkey SHA256 option and connected to a synthetic
loopback peer, which closed before key exchange. Exit 1 was the expected
connection-abort result; stdout was empty. This proves option parsing and
dispatch only, NOT key mismatch rejection, production authentication or
archive retrieval. No private key or production credential was supplied.

Linux descriptor tests and an actual key-exchange mismatch test remain open.
Guest executor and production API adapter also remain unfinished. No cloud
call, resource mutation, numerical work or new cloud cost occurred.

## 0020 — resumed implementation; Linux executor remains unvalidated

Before the pause, added h2_p8p_hostkey_api_read.mjs and eight passing mocked
tests for bounded, read-only SDK queries. No actual query was dispatched by
those tests. On resume, added import-safe h2_p8p_hostkey_guest_linux.py with
partition selection, block RO ioctl checks, allowlisted internal mount/unmount,
kernel mountinfo checks and public receipt export. Six Windows pure/mocked
tests pass. Neither importing nor testing it mounts a disk or calls metadata.

Independent review flagged process-group cleanup when an exited parent leaves
inherited pipes open. Cleanup now attempts group termination on all failed
commands, regardless of parent status, and closes streams in nested finally.
Actual Linux execution still needs verification. The export HTTP socket timeout
is NOT an absolute wall-clock limit; a bounded export guard remains required.
No claim of execution readiness is made.

Google's guest-attribute documentation confirms any process inside the helper
can write guest attributes. API transport is therefore not proof of producer
identity by itself; frozen helper image/startup, resource provenance and exact
receipt binding remain necessary. Reference:
https://cloud.google.com/compute/docs/metadata/manage-guest-attributes

No cloud resource changes or numerical work occurred. The existing archive
remains unretrieved and all broader charter milestones remain open.

## 0021 — isolated export deadline; integration checklist corrected

Metadata export now runs in a private Python worker under the parent runner's
five-second operation deadline plus at most five seconds termination wait.
Receipt data is bounded and identity fields cannot be overridden by the guest
result dictionary. Eight Windows local/mock tests pass; independent review
reran them and found no new critical defect in this correction. No worker
network call ran. Actual Linux process-group termination remains unverified.

Updated the unfrozen amendment draft with the complete remaining integration
checklist: Linux/client verification, guest receipt/resource-chain integration,
mutation adapter and recorder, startup packaging and final bounded manifest
review. No claim that parser tests establish recovery readiness. No cloud
resources changed; budget and attempt counters remain unchanged.

## 0022 — guest receipt/resource-chain integration

Added h2_p8p_hostkey_receipt.mjs, composing resource/lifecycle checks with exact
guest-attribute inventory, compact JSON duplicate-field rejection, identity,
successful unmount state and expected key fingerprint. Independent review of
41 tests found no critical bypass. Added actual Python-exporter to JavaScript
validator interoperability without network or mounting; suite passes 42/42.
All identities and public keys in these tests are synthetic.

API wrapper identity and frozen inputs still require authenticated capture;
this pure validator cannot establish them. No live receipt, archive or key was
recovered. No cloud calls or budget consumption occurred.

## 0023 — actual authenticated read-only SDK adapter preflight

Bound the adapter explicitly to --account=pestypig@gmail.com. Eight local
adapter tests pass. Then dispatched one read-only instance describe through
the installed dedicated SDK. At 2026-09-05T18:12:52.015Z it confirmed exact
helper 7129462452423922626 TERMINATED with two disks and required lifecycle
fields. Preserved exclusive receipts in candidate-neutral/hostkey-api-preflight-v1.
Parsed data SHA-256: 42c668c8aa5c53a06f5dbf16020545707e8cf54a4e20d0bd332d56032e0eb423.

This proves the installed SDK projection and bounded local capture against
that resource, not full attestation, recovered key or archive. Free local
space checked above 1 GiB before staging. No SSH, startup, cloud mutation or
numerical operation occurred; VM runtime and cost allowances are unchanged.

## 0024 — proposed resource command inventory, no dispatch

Added h2_p8p_hostkey_resource_commands.mjs and four passing local tests.
Commands fix the proposed snapshot/clone/helper/boot names, source disk,
zone/image/machine, RO attachment, retained boot disk and 3,600-second
server-side STOP configuration. The new helper would have no service account
or scopes; this is a proposed configuration, not an IAM change performed.

Checked installed SDK source for snapshot type/source-zone and attachment
mode flags, plus runtime-stop flags. This is not a full SDK parse/execution
test. Module returns argument arrays only, with no dispatch capability.
No cloud command was run. Proposed names/settings still need final amendment
inclusion, complete integration/review and explicit execution approval.

## 0025 — installed SDK parses all five proposed resource commands

Added offline h2_p8p_hostkey_sdk_parse.py using the installed SDK's argument
parser directly, without CLI.Execute or command.Run. Its dedicated temporary
configuration contains no production credentials; an audit hook rejects
network connection/name resolution and subprocess execution. One local test
passed across all five generated commands: snapshot, clone, helper creation,
RO attachment and stop. No Google API request was dispatched.

This validates SDK argument syntax, not server-side resource admission,
capacity, permissions, startup-file contents or successful execution. The
temporary local parser configuration is retained. Cloud counters unchanged.

## 0026 — deterministic startup packaging and guest entrypoint

Added three-source startup packaging with per-file byte/hash checks, exclusive
guest staging root and outer 900-second TERM/60-second KILL bound. The guest
entrypoint reads its metadata identity, waits up to 600 seconds for the one
attachment, then invokes discovery and the single-mount cleanup flow.
Two local tests pass: deterministic payload plus actual Python AST/hash checks
for bootstrap and all embedded files. No bootstrap code was executed.

Review identified missing failure receipts before collect_key. Attachment-wait
and discovery failures now attempt one sanitized bounded export after instance
identity is known. Bootstrap/identity-read failures still require authenticated
serial evidence in the controller; that integration remains open. Actual Linux
startup and signal cleanup are unverified. No upload or cloud change occurred.

## 0027 — shorter direct archive route identified

Re-read R40 result and shell procedure: the expected archive is recorded on
the retained helper boot disk, outside the source-clone mount. The same
proposed snapshot can support direct archive extraction, eliminating SSH
trust recovery and another retained-helper restart. This is historical
evidence, not a new file-presence check. Recorded preferred direction in
nhm2-p8p-direct-archive-recovery-design-review.md. Existing evidence remains
preserved. New cloud scope still requires approval; no cloud action occurred.

## 0028 — fixed archive reader and cleanup core

Implemented h2_p8p_direct_archive.py: fixed no-follow file path, regular-file
check, exactly 12,122 bytes and unchanged SHA-256 before export. No expected
hash override parameter exists. Cleanup occurs before export and failure
receipts contain no archive bytes. Five local unittest methods pass, including
wrong-hash rejection and phase failures. Success sequencing uses explicitly
mocked authentication; no actual archive integrity PASS is claimed.

Linux descriptor/mount behavior remains untested. Direct archive transport,
consumer verification and final controller integration remain unfinished.
No cloud operation or source-file read occurred in these synthetic tests.

## 0029 — direct archive receiver integrity checks

Added h2_p8p_direct_archive_receipt.mjs. It composes resource/lifecycle
validation with helper/attempt identity, successful cleanup, exact compact
receipt schema, 24 KiB receipt cap, canonical base64 and independent decoded
12,122-byte/SHA-256 verification. No expected digest override or filesystem
write exists in this validator. Expanded local suite passes 50/50 (eight new
direct archive rejection tests). An asserted correct digest with wrong
content is rejected. No successful real-archive validation is claimed.

Independent review of the preceding Python reader reported no critical scoped
defect and 5/5 local tests. Linux execution, direct export integration and
complete authenticated recovery remain unproved. No cloud calls occurred.

## 0030 — bounded direct-archive export and API namespace

Implemented DirectArchiveOps with a separate nhm2-archive metadata receipt,
24 KiB cap and five-second isolated worker. Both parent and worker verify
the frozen archive content digest before success export. Failure receipts
cannot carry archive bytes; source identity cannot be overridden. Three
local exporter tests pass; independent review found no critical defect.
Pre-mount failure may intentionally report mount_attempted=false/unmounted=true;
this cannot pass success admission, which requires both true and no failures.

Extended read-only SDK adapter for the exact archive namespace; nine local
adapter tests pass. No worker network call, cloud query, or real archive
success was exercised. Startup/controller integration and Linux verification
remain prerequisites. No cloud budget or resource state changed.

## 0031 — direct startup package checkpoint

Rechecked the direct-archive startup package and preserved host-key package:
4/4 local Node tests PASS. The installed bundled Python parsed the generated
bootstrap and all six embedded direct-route modules; their sizes and SHA-256
values matched the generated inventory. The direct entrypoint binds
DirectArchiveOps and collect_archive to the shared bounded guest lifecycle.

These are packaging/parse checks only, not Linux execution, archive recovery,
build-fixture PASS or calibration evidence. No cloud action occurred. The
active goal remains incomplete. The real operation adapter, Linux behavior,
failure-evidence recovery and independent execution review remain open.
New snapshot/clone/helper execution requires an explicit charter amendment;
the existing charter's exclusions remain in force.

## 0032 — direct lifecycle and fixed SDK operation adapter

Connected the direct archive stages to the shared recovery lifecycle, without
host-key or SSH stages. Independent review identified that a missing validator
result could permit PASS without an archive. Fixed null/undefined results and
direct archive shape rejection; the production receipt validator still owns
the unchanged content hash check. Synthetic buffers are not real archive PASS.

Added an unbound fixed-command SDK operation adapter with one dispatch per
action, bounded process/output, startup-script authentication before helper
creation, preserved partial failures, and separately dispatchable stop. It has
no CLI entrypoint and was not connected to cloud execution. Combined local
controller/operation suite: 40/40 PASS, using injected operations/processes.
Independent review of the new SDK adapter is requested, not yet cleared.

The orchestration core itself cannot cancel an indefinitely hung injected
operation. Passing a deadline as data is not enforcement. Composed adapter
termination, independent safety stop, resource re-observation, durable capture,
Linux behavior and final amendment approval remain execution prerequisites.
No cloud resource or budget changed; R39 archive remains unrecovered.

## 0033 — SDK adapter cleanup-review corrections

Independent review found three concrete defects in the new unbound SDK
adapter: failed intent recording could prevent safety-stop dispatch; failure
recording could replace the original process exception; and a second record
attempt could exceed the reporting reserve after a result-record failure.

Stop intent recording is now best effort while incomplete evidence still
prevents success acceptance. Process exceptions retain their original partial
output, PID and termination state, with recorder failure attached separately.
A result-record attempt is not followed by another blocking record attempt.
Adapter regression tests pass 8/8 using injected processes. The corrections
have been sent for independent re-review. No cloud operation occurred.

This does not prove actual stop confirmation or make the controller ready:
composed resource observation/cleanup, durable recording and Linux execution
remain open, as does separate authority for new rescue resources.

## 0034 — stop/observation composition

Independent reviewer confirmed entry 0033's three corrections with no further
critical finding in that adapter's stated scope. Added an unbound cleanup
composition that attempts the independent helper describe even when stop fails.
It requires the expected instance ID, exact resource URL/name, fresh observation
and TERMINATED status. An unknown ID cannot prevent the safety-stop attempt,
but cannot establish identity. A confirmed stopped observation does not erase
the original stop/evidence failure. Eight injected cleanup tests pass.

Bound read-adapter recorder awaits to five seconds, reserve kill/report time,
and preserve original process failures without a second result-record attempt.
The nine existing read-adapter tests and eight cleanup tests pass (17/17).
Independent review of this composition is requested. These tests use no Google
API and do not prove actual shutdown. No cloud resource/budget change occurred.

## 0035 — cleanup observation survives recorder failure

Review found that failed intent recording still prevented the independent
describe subprocess. Added a narrowly scoped cleanup read for only the exact
proposed helper instance. It performs the read despite recorder failure but
returns an explicit receiptFailure. Ordinary observations remain fail-closed.
The stop composition distinguishes observed TERMINATED from complete cleanup
evidence: the former cannot erase missing receipts or make the result PASS.

Added a composed full-disk test using the actual read adapter with an injected
process, and a short-window observation-reserve regression. Read tests pass
12/12 and cleanup tests 10/10. Independent re-review requested. No actual
SDK subprocess, cloud query or resource mutation occurred in these fixtures.
Recovery execution remains unapproved and unperformed.

## 0036 — reviewed cleanup checkpoint and remaining acceptance gaps

Independent review confirmed entry 0035 with 22/22 local read/cleanup tests
and no remaining critical defect in that correction's scope. This does not
verify actual Google API behavior or shutdown. Consolidated the outstanding
acceptance gaps in the direct-archive design review: composed controller and
durable recording, controlled Linux behavior, exclusive authenticated local
publication, and the separately approved resource/budget amendment.

Read-only checks found C:/NHM2-R41/r40.tgz and C:/NHM2-R43/r40.tgz absent;
this is not an exhaustive local archive search. No cloud call was made.
No build or calibration success has been established by these preparations.

## 0037 — local exclusive evidence store

Implemented a local-only evidence store with a new exclusive capture directory,
ancestor symlink checks, a 1 GiB free-space floor, 128-record count limit,
256 KiB record cap and 4 MiB total cap. Serialized receipts contain sequence
and preceding-file SHA-256, are opened exclusively and flushed. Failure poisons
further receipt writes without deleting existing or partial evidence.

Archive publication allows one attempt, requires the unchanged 12,122-byte
content SHA-256 before writing r40.tgz, and rechecks the written content.
Four real local filesystem tests pass: receipt ordering/hash links, directory
reuse rejection, preservation after oversized receipt, and wrong-hash archive
rejection before publication. Small temporary fixture directories are retained.
Observed C: free space before tests: 9,521,868,800 bytes.

No successful real-archive publication is claimed. Independent review of this
store is requested. No cloud action, numerical process or resource change.

## 0038 — immutable ingress and stored-flow integration

Independent store review found deferred serialization could capture a caller's
later mutation. Receipts now serialize at invocation; archive bytes are copied
before queueing; publication shares the receipt queue. Six actual filesystem
tests pass, including caller mutation and failure ordering. File flushing is
not claimed to establish crash-durable Windows directory entries.

Connected the store to the direct recovery core. A transport-stage result is
explicitly distinct from final recovery success, which additionally requires
frozen-hash publication and the final receipt. Two composed tests pass using
real local files and mocked cloud operations: preflight failure preservation,
and rejection of a synthetic 12,122-byte payload despite mocked transport
success. No genuine archive PASS is claimed. Independent review requested.
No cloud action or scientific execution occurred.

## 0039 — Linux validation environment decision

Independent review confirmed the corrected store/composition with 8/8 local
tests and no remaining critical defect in that scope. Actual archive success
and Linux/cloud lifecycle behavior remain unverified.

Read-only WSL inventory reports no running distributions; the only installed
distribution is docker-desktop, Stopped, WSL version 2. No distribution or
Docker service was started. Existing Linux test requirements cannot be met
by additional Windows mocks. Before changing environment state, request the
operator's choice between bounded local Docker validation (with startup safety
checked first) and adding validation to the proposed cloud rescue amendment.
Neither choice grants a numerical run, existing-container restart, or new
cloud resource authority by implication. No cloud calls occurred.

## 0040 — operator selected cloud validation

Following clarification that Docker can run in the cloud and local Docker was
only a fixture option, the operator replied "yes you have permission" to the
cloud validation/recovery direction. Recorded that selection in
nhm2-p8p-cloud-validation-direct-recovery-amendment.md. Do not ask the same
environment-choice question again. Local Docker remains stopped by this work.

The amendment preserves the proposed small-helper envelope and existing
aggregate limits, adds synthetic Linux validation before evidence attachment,
and lists remaining controller/manifest/review prerequisites. Official public
price pages were inspected; account/region-specific final budget admission
remains required. No resource creation, restart or numerical run occurred.

## 0041 — cloud synthetic Linux fixture implementation

Added h2_p8p_cloud_linux_fixture.py and bound it before recovery device discovery.
It uses exclusive synthetic directories on the proposed new helper boot disk;
it does not mount, use Docker, read the evidence clone or run numerical code.
Checks cover wrong size/hash, leaf/parent symlinks, FIFO nonblocking rejection,
bounded child timeout/reaping and output cap. Fixture files are preserved.

The startup inventory now contains seven modules. Two local package tests pass
using actual Python parsing and embedded hash checks. They are not Linux
execution results. Independent review of fixture scope/runtime and startup
binding requested. No cloud operation occurred; the complete controller and
execution prerequisites remain unfinished.

## 0042 — Linux fixture review corrections

Independent review found a parent-symlink false positive: an incomplete target
could produce ENOENT rather than prove no-follow enforcement. The target now
contains a full synthetic archive path; parent and leaf cases accept only
ELOOP/ENOTDIR, not arbitrary OSError. Review also found fixture execution
preceded the shared SIGTERM handler. The fixture now installs ALRM/TERM/INT
handlers before its operations, so cancellation unwinds worker cleanup, and
has a 60-second alarm with handler restoration afterward.

The updated seven-module startup passes the two local package/hash/parse
tests. This is not Linux execution evidence or proof of descendant-process
termination. Independent re-review requested. No cloud operation occurred.

Follow-up review identified that the expected worker-timeout check could
swallow the fixture-wide cancellation TimeoutError. It now accepts only the
runner's exact command_deadline error and rethrows all other timeouts.

## 0043 — fixture gate before evidence attachment

Direct recovery now requires validateLinuxFixture to return explicit PASS
after helper-running observation and before any read-only attachment. Missing,
failed or throwing fixture validation triggers cleanup without attachment.
The historical host-key flow is unchanged. Direct lifecycle and stored-flow
tests pass 21/21 with synthetic operations, including failed fixture admission.

The actual authenticated fixture-receipt transport/validator still must be
bound to that operation; a boolean from an injected test is not authentication.
No cloud operation occurred. The new gate prevents an unfinished adapter from
silently skipping cloud validation, but does not establish execution readiness.

## 0044 — fixture receipt transport and receiver

Added a fixed nhm2-fixture/receipt export worker with a ten-second process
bound, metadata instance identity and pass/fail receipt validation. Direct
startup installs cancellation handling before fixture/export and stops before
evidence discovery if fixture or export fails. The startup package now binds
eight modules; two local hash/parse tests pass.

Added the SDK fixture query and a pure receiver requiring the exact helper,
attempt, API capture chronology, receipt schema and seven ordered checks.
Seven synthetic receiver tests plus twelve existing read-adapter tests pass
(19/19). No actual fixture, metadata worker or Google API call ran. Receiver
structural acceptance alone does not authenticate its input observations.
Independent review requested; full operation binding remains unfinished.

## 0045 — installed SDK response check and receipt operation binding

Read the installed SDK 583.0.0 get_guest_attributes.yaml: its response mapping
is queryValue.items, consistent with list-shaped namespace entries. This was
local source inspection, not a live API observation.

Connected the read adapter to fixture/archive receipt stages. The binding
requires the enrolled helper identity, permits at most twelve observations of
an empty pending namespace with five-second spacing, and honors the supplied
absolute deadline. API errors or malformed results are terminal, not retried.
Five injected-operation tests pass. Independent review requested.

The preceding fixture transport/receiver review found no critical defect in
its scope. Actual Linux transport and resource enrollment remain unverified.
No cloud call, resource mutation or numerical execution occurred.

## 0046 — receipt timing aligned with guest work

Review identified that twelve fast reads would expire after about55 seconds,
shorter than the guest fixture/export envelope. Replaced that arbitrary cutoff
with proposed observation windows of300 seconds for fixture and600 seconds
for archive, always capped by the caller's absolute deadline. Read-count
backstops are derived from five-second spacing; errors remain terminal.

Raised the local record-count cap from128 to512 to accommodate bounded pending
observations; the4 MiB total and256 KiB individual record caps remain unchanged.
These are not increases to VM runtime, compute attempts or cost authority.
Seven receipt-operation tests and six storage tests pass (13/13), including
late receipt arrival and phase-deadline enforcement. No cloud calls occurred.

## 0047 — creation/read identity enrollment

Added a pure enrollment check for the proposed snapshot, clone and helper.
It matches a single creation response against a separate observation using
exact resource name/URL and string ID, rejects pre-attempt or late chronology,
and returns immutable identity values. Eight synthetic tests pass. This does
not establish prior absence, authenticated API capture or configuration/source
provenance; those remain separate admission/chain obligations.

Independent review requested. No actual resource creation or cloud read ran.

## 0048 — strict enrollment time and proposed-name absence checks

Replaced permissive creation-time parsing with timezone-explicit calendar
validation after independent review. A preexisting-time test initially matched
the older error class because it used a pre-1970 date; changed that synthetic
case to a valid timestamp preceding its attempt, preserving the intended
chronology test. Enrollment/read suites now pass24/24.

Added read-only project-scoped exact-name inventory queries and a four-resource
absence check for proposed snapshot, clone, boot disk and helper. Existing
resources or API errors terminate admission rather than imply absence. Three
synthetic absence tests pass. This is not an atomic cloud name lock or evidence
of actual absence: no Google API call occurred. Installed-client parser and
composed preflight review remain required before dispatch.

## 0049 — installed SDK parser harness correction

The new inventory/guest-attribute parser test failed locally while loading a
YAML-defined SDK command: the isolated harness omitted the YAML translator
used by the installed SDK's normal loader. Added that same translator to the
test harness only; no SDK installation or scientific source was modified.
Both installed-SDK parser tests now pass (2/2), covering five resource commands
and four inventory/fixture read commands. The audit hook still blocks network
and subprocess dispatch, and the harness invokes parsing only, not command
execution. The earlier test failure is not a cloud execution or consumed
numerical attempt. No cloud API call, VM action, Docker start or calibration
occurred. Complete controller composition and independent review remain open.

## 0050 — source and absence preflight composition

Added a read-only preflight binding the retained original and rescue VM IDs,
stopped status, rescue boot-disk identity/ownership and read-only evidence
attachment before the four proposed-name absence checks. Seven synthetic
tests pass, including early termination on replacement identity, running
original, writable evidence attachment, shared boot disk or occupied name.
Independent review requested. This composes admission reads only: no cloud
observation or mutation occurred, and production lifecycle binding, final
manifest and budget admission remain incomplete.

## 0051 — lifecycle operation binding and review corrections

Moved exact source names and strict last-start/last-stop chronology into early
preflight after independent review; preflight/enrollment tests pass 22/22.
Added the operation binding from preflight through creation/read enrollment,
Linux fixture admission, read-only attachment, full provenance capture,
immutable archive validation and independently observed stop. Three composed
synthetic tests pass: invalid archive rejection after reaching its validator,
fixture failure preventing attachment, and changed source stopping before
archive access. None substitutes a synthetic digest for the frozen archive.

Added a store-owned operation factory path so real SDK receipts can share the
exclusive lifecycle evidence recorder. Complete binding review is requested;
no executable entry point, budget reservation, cloud dispatch or numerical
execution occurred. Final account/startup-policy and price/budget admission,
frozen source inventory and independent review remain prerequisites.

## 0052 — observed startup and stop-limit admission

Independent binding review identified missing observation of the created
helper's safety settings. The read projection now includes metadata,
service accounts and scheduling. Before fixture admission, the binding checks
the startup script against its supplied frozen digest, guest-attribute enablement,
absent service accounts, and 3,600-second STOP policy. Read/binding tests pass
16/16, including an incorrect STOP policy preventing fixture/attachment.
Cleanup now retains structured stop observation details when a confirmed
stopped VM nevertheless has incomplete evidence; this remains FAIL, not PASS.

Re-reading the exact charter confirms it excludes new rescue resources.
The subsequent cloud-direction permission is recorded, but final execution
admission must explicitly reconcile the proposed snapshot/clone/helper
amendment with that exclusion rather than imply authority from generic
continuation. No new resources, runtime or cost have been incurred here.

## 0053 — explicit recovery-resource exception approved

At 2026-09-05T20:09:01Z the operator's response "yes you may" was observed
in reply to the explicit request for one recovery snapshot, one 10 GB
read-only clone and one e2-small recovery helper, capped at USD 0.50 and
3,600 seconds within the existing USD 12/21,600-second aggregate.
This resolves the resource-exception blocker identified in 0052. It does not
renew the aggregate allowance or charter expiry, authorize numerical work in
this recovery step, or waive final manifest, review, identity, pricing and
safe-stop prerequisites. Use only the existing proposed resource inventory
and cloud-validation direct-recovery amendment; preserve evidence and stop
the helper afterward. No resource was created or started by recording this
approval. Source and scientific restrictions remain unchanged.

## 0054 — actual startup response-cap correction

Independent review measured the generated startup at 61,525 bytes, leaving
insufficient margin under the prior 65,536-byte helper response cap. Raised
only proposed-helper describe and helper/attach/stop mutation responses to
131,072 bytes; other response caps remain unchanged. Tests using the actual
startup and 16 KiB synthetic VM overhead pass through the read adapter and
fit the existing per-record bound. The composed lifecycle test with the actual
startup also fits its record and aggregate bounds. Combined suites pass26/26.
These tests use synthetic API data, not a live VM observation; raw and parsed
production receipts must still satisfy the store's 262,144-byte/4MiB limits.
No cloud action, runtime reservation or numerical execution occurred.

## 0055 — actual read-only admission stopped on metadata projection

Added dedicated account/configuration/project-key admission and wired it ahead
of source preflight. The actual installed SDK parses all three commands without
dispatch. One read-only diagnostic capture then ran in the dedicated SDK
configuration, preserved exclusively at C:/NHM2-CV2-Admission-20260905-v1.
Account and configured-project checks passed. Project-info returned only its
name under json(name,commonInstanceMetadata.items.key); metadata was absent
from that projection. Admission failed closed as account_admission_startup_policy.
This does not establish whether metadata is actually absent or whether the
projection omitted it. Diagnose that distinction before any resource creation;
do not rerun this one-shot probe. No VM, snapshot, clone, restart, numerical
process or billable runtime was initiated. The failed capture remains evidence.

## 0056 — SDK projection diagnosed; live admission PASS

The actual installed SDK formatter reproduced omission for items.key on a
synthetic metadata list. items[].key returned precisely the key inventory,
excluding values. A third exploratory map() expression was rejected by the
formatter; its error remains in task output. The retained local regression
now asserts the correct projection and absence of metadata values (PASS).

Corrected only the project metadata projection and performed a new read-only
capture at C:/NHM2-CV2-Admission-20260905-v2. Dedicated account, configured
project and expected project metadata key inventory all PASS. The v1 failed
capture is unchanged. This removes the projection ambiguity, not the remaining
manifest/budget/review requirements. No VM or other resource was created,
started or modified; no numerical process ran.

## 0057 — recovery storage/network pricing checkpoint

Rechecked official disk/image and network pricing pages. The displayed disk
table remains at USD0.000054795/GiB-hour for pd-standard and the regional
standard-snapshot table at USD0.000068493/GiB-hour. At those displayed rates,
20GiB of new disks plus a conservatively full10GiB snapshot retained168hours
cost USD0.29917944. Official documentation confirms same-region snapshot
creation/restoration has no inter-region transfer charge. Standard VM external
IPv4 is listed at USD0.005/hour. No free-tier credit is assumed.

These are pricing inputs, NOT final regional cost admission: the rendered
storage tables default to Iowa, and the general-purpose VM pricing page failed
to render through the web reader. Confirm us-east1 applicability and VM rate
before dispatch. The USD0.50 ceiling and seven-day retention remain unchanged.
Sources: https://cloud.google.com/compute/disks-image-pricing and
https://cloud.google.com/vpc/network-pricing . No resource/runtime reservation
or cloud mutation occurred in this checkpoint.

## 0058 — us-east1 rates verified in official pricing UI

Using the official pricing pages in the in-app browser, explicitly selected
South Carolina (us-east1). The selected E2 shared-core table shows e2-small
USD0.016752855/hour; the selected Persistent Disk table shows pd-standard
USD0.000054795/GiB-hour. The separate disk/image page, also explicitly selected
to South Carolina, shows regional STANDARD snapshots USD0.000068493/GiB-hour.
This resolves the default-region ambiguity from 0057. Only pricing selectors
were changed; no Compute Engine resource or account setting was changed.

One full helper hour, one IPv4 hour at USD0.005, twenty new disk GiB and ten
snapshot GiB for168hours total USD0.320932295 at those rates. Reserving the
approved USD0.50 leaves aboutUSD0.179 for incidental charges/rounding; no
free-tier benefit is assumed. Same-region snapshot handling avoids inter-region
fees as documented in0057. Stopped retained storage still incurs charges;
seven-day costing is not deletion authority or indefinite free retention.
No reservation was consumed and no resource was started. Final source/invocation
freeze, combined ledger admission and execution review remain outstanding.

## 0059 — single-use execution entrypoint drafted

Added h2_p8p_recovery_run.mjs to prepare a fixed local startup/source manifest
and execute only its supplied SHA-256 after checking charter and ledger hashes,
source/startup identities, expiry and fixed aggregate reservation. It connects
the real SDK operation adapter to the store-owned recorder and complete recovery
binding. Fixed local root is C:/NHM2-CV2-Recovery-v1; exclusive evidence-directory
creation prevents reuse. node --check passes. Independent complete-runner review
requested before preparation or dispatch. Neither mode has run, no manifest is
frozen yet, and no cloud resource/runtime allowance was consumed.

## 0060 — final local regression and runtime-bound check

Recovery/store suites pass51/51; package/composition checks pass7/7, including
actual Python parsing of the eight embedded source files. Added observed
snapshot storageLocations=[us-east1] checks to bind the regional pricing
assumption. The execution runner now shares an integer-millisecond monotonic
clock anchored to its start time across the lifecycle and SDK adapters, so a
host wall-clock adjustment cannot lengthen the running allowance. Current C:
free space observed6,153,994,240bytes, above the1GiB staging minimum.
Complete runner review is still in progress. No prepare, execute, resource
creation or budget reservation occurred in this entry.

## 0061 — source review cleared for package preparation

Independent reviewer examined the complete runner, operation binding, evidence
store, source inventory, expiry/reservation and response-cap changes and found
no remaining execution-critical source blocker. This is infrastructure source
review, not cloud success or scientific replay. Proceed to one package
preparation and independent manifest verification before dispatch. Do not
append to this bound ledger between manifest freeze and execution; the runtime
exclusive evidence store will preserve reservation and outcomes first.

## 0062 — single direct recovery attempt terminated before clone attachment

Prepared exactly once and independently verified manifest SHA-256
b197ced082b5b6d753b756d2811ea788b871cb2f96137b38b1970a3f5b8d4e51,
all27 source bindings, startup and charter/ledger bindings. Executed once.
Immutable local evidence: C:/NHM2-CV2-Recovery-v1/evidence, records000001
through000056. Account/source/absence checks, snapshot and clone creation,
helper creation and running-state authentication succeeded. First fixture
guest-attribute query at2026-09-05T20:34:31.458Z returned HTTP404 for
nhm2-fixture/. The attempt failed closed before clone attachment or archive
retrieval. No guest fixture result was recovered; absence does not establish
either fixture success or fixture failure. Startup delay is a hypothesis only.

Controller terminal result: pass=false, stopped=true, published=null.
Cleanup independently observed the exact helper TERMINATED. Retain snapshot,
detached clone, stopped helper and boot disk; original resources unchanged.
No numerical process was authorized or started by this controller. Reserve
the full0.50USD/3600seconds conservatively, leaving11.40USD/16800seconds
against the charter aggregate after prior reservation; this is not measured
billing. No retry or further resource dispatch. Mandatory transport-design
review requested from the independent reviewer before any successor proposal.

## 0063 — independent terminal-evidence and transport-design review

Reviewer verified all56 receipt hash links, final file SHA-256
fae10aa83389b1c801642950a7a29bec42e887639214c6e8395e8e7ed8ff1272.
Record54 independently identifies helper2570241336417567358 TERMINATED;
only snapshot/clone/helper/stop operation intents exist, with no attach.
Confirmed infrastructure defect: the poller accepts successful[] as pending,
but the installed SDK returned a namespace-not-found404, ending observation
before the300-second readiness window. Guest execution remains unknown.
Next local correction should narrowly classify only the exact bound missing
guest-attribute namespace as pending, preserve each observation, keep all
other errors terminal, and test the preserved stderr plus wrong-resource,
403 and malformed responses. This review authorizes no new cloud dispatch,
does not retry the consumed attempt, and changes no scientific definitions.

## 0064 — local pending-response correction independently cleared

Added narrow fixture/archive readiness adapter; preserved general API error
semantics and all phase deadlines. Independent review caught an initial
composition bypass; repaired it and added complete-operation regression.
Reviewer independently reran the four local suites:40/40PASS, with no further
critical correction defect identified. Exact preserved stderr replay passed
locally; exitCode1 reconstructed from recorded process_exit_1, not a new cloud
observation. See nhm2-p8p-namespace-readiness-correction.md. No cloud action,
restart, resource allocation or extra budget reservation this turn. Consumed
attempt evidence/manifest unchanged. New helper reuse is not authorized by
the remaining aggregate alone; startup/exclusive-path behavior and scoped
successor authority remain prerequisites before any dispatch.

## 0065 — stopped-helper startup diagnosis and reuse boundary

Read the current packaging source: bootstrap uses exclusive
os.mkdir('/var/lib/nhm2-direct-archive-v1') and exclusive source-file writes.
A blind restart is therefore not a proven resume path; if startup previously
created this directory, unchanged startup would reject it. Its existence is
unknown, not inferred from VM RUNNING.

One read-only installed-SDK serial-port query of the stopped new helper was
attempted and preserved at C:/NHM2-CV2-Startup-Diagnosis-v1. It returned
resource-not-ready and no serial contents. No VM start or resource mutation.
The existing56-record terminal evidence remains authoritative for shutdown.

Preferred successor design is reuse, not new resources: retain snapshot
4259767658325590729 and detached clone6517758864936518301, and use only helper
2570241336417567358. This needs new explicit authority for one restart and a
helper-only startup metadata replacement that preserves prior guest files and
uses a fresh exclusive recovery path/attempt identity. Independently verify
the repaired readiness protocol and new startup before dispatch; attach clone
read-only only after a fresh authenticated fixture PASS. No blind old-script
restart, old-root deletion, source disk mutation or numerical execution.
The prior one-shot resource exception does not authorize this successor.

## 0066 — user approves one same-helper successor

User replied "yes i approve" to the explicit request for one independently
reviewed same-helper/same-clone recovery, replacing only helper startup,
preserving old files, within0.50USD/3600seconds of the remaining charter
budget. No new resources or numerical execution included. This approval
resolves the boundary in0065; do not request the same permission again.
Prepare and independently review before dispatch. No allowance consumed by
this local entry; conservatively reserve the full amount before execution.

Added a retained-helper-v1 package variant with a distinct manifest-bound
attempt identity and fresh exclusive guest directory. Original default
packaging remains unchanged. Three package tests pass. Remaining successor
requirements include stale-receipt isolation, retained-resource provenance
and one-restart lifecycle/metadata binding. The new package is not yet an
execution-ready controller. No cloud operation this turn.

## 0067 — successor namespace transport implemented locally

Closed revision map adds nhm2-fixture-retained-v1 and
nhm2-archive-retained-v1. Python exporters select these only under the exact
retained-helper-v1 revision set by successor bootstrap. SDK queries bind the
same names to the exact helper; pending404 matching and fixture validation
use the selected namespace. Original default namespace semantics remain;
no old guest attributes are deleted or overwritten by the successor names.

Local namespace/package/fixture/pending suites28/28PASS, including installed
bundled-Python namespace-function parity. Existing API/operation/poller suites
25/25PASS. Independent patch review requested. Retained-resource chronology,
archive-validator binding and complete successor controller remain open.
No cloud action or additional reservation. No execution-readiness claim.

## 0068 — retained provenance and lifecycle core implemented

Separate retained validator binds historical creation identities/timestamps,
historical source-stop/snapshot relation, current stopped-source continuity,
detached clone, stopped boot-only helper and fresh restart/attachment window.
No input dates are rewritten. Separate retained archive entrypoint requires
the successor namespace/attempt and unchanged archive digest. Reviewer found
no critical defect and independently ran retained/poller checks26/26PASS.

Added retained lifecycle branch with explicit capture/replace/verify/restart
phases and no creation phase. Local retained lifecycle tests5/5PASS cover
startup-verification failure, ambiguous restart cleanup, fixture gating and
post-restart evidence-write failure. Actual SDK operations and authenticated
predecessor/current preflight composition remain to be implemented/reviewed.
No cloud operation, restart or budget reservation occurred this turn.

## 0069 — retained SDK and predecessor/current preflight bindings

Added exact retained startup/restart/RO-attach/stop command factory and bounded
SDK adapter branch. Actual installed SDK parsed all four commands offline;
three local command/adapter tests PASS. No cloud dispatch. Independent review
found no critical defect in these isolated additions.

Added fixed-root56-record predecessor loader, verifying hash links, pinned
tail, expected manifest, terminal failure/stopped state and no attachment.
Actual local history read authenticates helper2570241336417567358 and boot
6645759825344053886; no current cloud-state claim. Reviewer independently
confirmed the history read.

Current preflight implementation compares authenticated history with fresh
source, snapshot, clone, helper, boot and account observations before mutation.
Six local tests using preserved inputs and mock API observations PASS,
including substituted boot, changed startup, attached clone and source restart.
Independent preflight review requested. Full operation composition and frozen
execution runner remain open. No restart, metadata write or budget reservation.

## 0070 — complete retained runner source cleared

Full retained composition tested through strict archive validation/cleanup;
independent review4/4PASS. Combined local retained/SDK/namespace/store battery
57/57PASS. Complete runner source reviewed with no execution-critical defect
identified. It binds pinned history, source/startup hashes, charter/ledger,
monotonic deadline, fixed exclusive root and conservative remaining budget.
Proceed to one prepare and independent manifest verification. Keep source and
ledger unchanged between freeze and dispatch. This is source-review clearance,
not recovery success. No prepare, execution or reservation in this entry.

## 0071 — retained successor executed once; actual fixture failure recovered

Prepared once and independently verified manifest
4c5f78bbfa42e8262be34719007183ba62335dd6481d44f600a3c4d16b66d85f,
31source bindings,62695-byte startup, charter/ledger and56 historical receipts.
Executed once at2026-09-05T21:22:36.964Z. Fresh preflight, authorized startup
replacement, stopped-state startup authentication and one restart succeeded.
Successor fixture receipt returned pass=false,checks=[],failure=FileExistsError
for attempt d03c81266b864a0a00c67665a0287d138a44a0484cbf00ce7ac91051897fbed1.
No clone attachment or archive publication. Independent stop observation in
record000059 confirms helper2570241336417567358 TERMINATED at21:25:17Z.
Final result pass=false,stopped=true,published=null. Preserve all61 records at
C:/NHM2-CV2-Retained-v1/evidence; final SHA-256
703e08f6a8addc38a14bf1b16ab7357cddad7c5effcc54ced03f159bcc7db79f.

Charge conservative0.50USD/3600seconds reservation, leaving10.90USD/13200seconds
aggregate. No numerical allowance consumed. Retain all cloud resources/files.
The one approved restart is consumed; no retry authorized.

Source inspection identifies a missed reuse hazard: cloud_linux_fixture still
uses fixed /mnt/nhm2-fixture-{size,hash,leaf,parent,fifo} paths, even with the
fresh bootstrap root and namespaces. Exact colliding path is not in the
receipt and remains unproven. Mandatory independent terminal/design review
requested before successor work. Correct local fixture path isolation without
deleting preserved fixtures; tests must cover complete guest path isolation,
not only bootstrap roots and namespaces. This is infrastructure failure, not
a failed scientific solve or proof of simulation infeasibility.

## 0072 — fixture path-isolation correction tested locally

Cloud fixture now requires an exact64-hex attempt ID from its transport caller.
All five case roots derive from that ID and fixed case names; parent-symlink
and worker PID/output fixtures use the same path allocation. Direct /mnt
children retain the existing archive-reader path grammar without weakening it.
No old fixture directory is reused or deleted.

Actual bundled-Python local test allocated two disjoint attempt sets beside
preexisting predecessor-style synthetic directories and rejected same-attempt
reuse, invalid IDs and invalid case names. AST check prevents direct Path
allocation inside the fixture body from bypassing the allocator. Combined
package/path tests4/4PASS. This is Windows filesystem/path testing and Python
parsing, not full Linux fixture execution. Independent correction review
requested. Consumed cloud evidence and frozen packages remain unchanged.
No cloud operation or additional budget reservation this turn.

## 0073 — one corrected recovery approved, 2026-09-06

At2026-09-06T07:41Z the user answered "yes" to one corrected same-helper
recovery capped at0.50USD/3600seconds within the remaining charter, with fresh
startup/fixture/receipt paths, no new resources, no numerical calculation,
evidence preservation and automatic stop. This resolves the pending execution
authority boundary. It does not renew any consumed attempt or total budget.
Prepare a distinct retained-helper-v2 successor and independently review its
complete bindings before dispatch. Current remaining reservation allowance is
10.90USD/13200seconds; after reserving this attempt it will be10.40USD/9600seconds.
No restart or budget reservation has occurred in this entry.

## 0074 — corrected successor source review cleared, 2026-09-06

Retained-helper-v2 now authenticates both predecessor evidence chains and
uses the latest confirmed stopped helper as its unchanged preflight baseline.
Bootstrap root, receipt namespaces and all fixture paths are fresh and bound
to the new attempt. Original and consumed retained-v1 evidence remains intact.
All343 local infrastructure tests PASS, including installed-SDK offline parsing
of the exact v2 metadata-file path and Python parsing of the v2 bootstrap.
Independent reviewer authenticated both56/61-record chains, reran16 tests and
found no execution-critical blocker. This is infrastructure-only source review,
not independent scientific replay or actual Linux fixture execution.

Next: prepare exactly one C:/NHM2-CV2-Retained-v2 manifest, independently verify
it and invoke execute-v2 once. User authority is ledger0073. Reserve0.50USD and
3600seconds at execution, leaving10.40USD/9600seconds conservatively; retain
300seconds cleanup reserve. No new resource or numerical execution is allowed.
No cloud mutation has occurred in this entry. The execution receipts will bind
this ledger hash and record the reservation and exact manifest hash.

## 0075 — retained-v2 consumed; fixture PASS, pre-mount discovery FAIL

Single execution began2026-09-06T07:51:00.212Z under manifest
b1d8c88aaca068638fb496985812df860c2963ee6a184289f6f51579bf0d28f3.
All seven real Linux fixture checks passed. The exact clone was attached
read-only; the guest then reported ValueError before any mount attempt.
No archive was published. Helper2570241336417567358 was independently observed
TERMINATED at07:53:47.082Z. The clone remains attached read-only.
Independent reviewer verified88 linked receipts ending at
18b70b8a7cdadf62ef55f4dfc76a08258b674d66720ae7030122ffb88fc17716.
Mutations were only startup replacement, restart, attachment and stop.

Reserve0.50USD/3600seconds as recorded; remaining10.40USD/9600seconds is
conservative allowance, not actual billing. No retry or successor restart.
Mandatory design review is nhm2-p8p-retained-v2-result-and-discovery-review.md.
Missing explicit lsblk tree output is a supported format-risk hypothesis;
the exact failure is unproved because the guest omitted its raw inventory
and specific ValueError code. Archive_receipt_fields is the receiver rejecting
a failure receipt, not a demonstrated archive corruption. Scientific work,
candidate evaluation and authority remain untouched.

## 0076 — local discovery-diagnostic preparation, 2026-09-07

User requested the next useful steps as a goal. Created a local-only preparation
goal, not another cloud execution. Added pure h2_p8p_discovery_diagnostic.py
(SHA-256 ce659af939b61f73361262503765426f0dee7f1d4a876a0727f7bef16cb2e64e)
and tests (SHA-256 0d63b1f001fd3bbb25217ac3bd60122b5b5c786e163447b335f94b9d7b598cf7).
The module plans exact baseline/explicit-tree commands and preserves bounded
inventory bytes, hashes and specific failure codes using the unchanged parser.
It has no live executor or mount/recovery authority. Nine new tests and eight
existing Linux-parser tests PASS. A deep-JSON test initially expected one
specific rejection stage; its corrected assertion permits either bounded
rejection stage without changing parser acceptance, as documented in the plan.

Independent reviewer reauthenticated88 predecessor receipts, reran9 tests,
and cleared the local core/caps/plan only. The next-execution requirements and
remaining mount/export risks are in nhm2-p8p-discovery-diagnostic-preparation.md.
No cloud read/mutation, restart, payload upload, numerical run, new reservation
or frozen-source change occurred. Remaining conservative allowance stays
10.40USD/9600seconds. The live diagnostic binding still needs implementation,
verification and separate bounded restart authority; no execution-ready claim.

## 0077 — local diagnostic lifecycle and receiver implementation, 2026-09-07

Added the unbound discovery controller and pure receipt receiver. Controller
tests19/19PASS, receiver tests6/6PASS. Independent review found deadline/cleanup
and terminal-persistence edge cases; corrected them without changing frozen
scientific or recovery sources. The stored terminal event is provisional,
not acceptance. Live device/process/export/SDK adapters and durable acceptance
remain unfinished, so no execution-ready or live-run claim is made.

No cloud calls, mutation, restart, upload, numerical work or new reservation.
Remaining conservative allowance stays10.40USD/9600seconds. See the local
controller/receiver checkpoint in nhm2-p8p-discovery-diagnostic-preparation.md.

## 0078 — local guest diagnostic adapter, 2026-09-07

Implemented h2_p8p_discovery_guest.py with read-only kernel device checks,
three closed bounded command captures, partial failure output, and final
device verification even after command failure. Ten injected tests PASS.
Independent review identified the skipped post-failure probe and full-envelope
size issue; both were addressed. Full envelope has an explicit64KiB local cap;
its segmented export is not yet implemented. Native Linux behavior and outer
aggregate supervision remain unverified. No production execution-ready claim.

No cloud operation, local Docker/WSL start, VM restart, upload, numerical run,
new reservation or consumed-evidence change. Conservative allowance remains
10.40USD/9600seconds; separate live execution authority is still required.

## 0079 — bounded diagnostic transport selection, 2026-09-07

Implemented and tested a pure segmentation prototype7/7PASS, then verified
Google's documented256KiB value limit. Selected a simpler single-value
transport for the64KiB envelope, capped at90112 encoded bytes. This changes
only new unfrozen infrastructure planning; old24KiB contracts remain intact.
Selected transport tests7/7PASS, including injected end-to-end and partial
failure preservation. Independent review cleared its initial five-test core.
Prototype is preserved but no segmented publisher is selected.

The remaining live publisher/API binding must enforce response caps, rate
limits, identity/chronology, full envelope acceptance and safe stop. Transport
hash equality is not scientific authority. No cloud API call, resource change,
upload, calculation or cost reservation. Conservative allowance unchanged at
10.40USD/9600seconds. Public documentation lookup only, not a cloud-account query.

## 0080 — full-goal continuation: publication and envelope acceptance

User activated the full end-to-end diagnostic goal; it remains active, not
closed at a component milestone. Implemented single-use publisher6/6 injected
tests PASS, independently reviewed with no scoped critical defect. Added
full-envelope consistency acceptance7/7 local tests PASS. No actual HTTP or
cloud request was issued. Outer supervision, cloud binding, durable acceptance,
complete package review, authorization and live diagnostic remain unfinished.
See continuing full-goal requirements in the preparation document.

No restart, payload upload, mount, numerical work, new reservation or change to
consumed evidence/scientific definitions. Remaining conservative allowance is
unchanged10.40USD/9600seconds. Publication acknowledgment is not acceptance and
diagnostic completion is not a build or scientific PASS.

## 0081 — acceptance device-family cross-link repair

Independent review of0080 identified that accepted partition selections were
not yet bound to the guarded kernel family. Added path/device-number membership
checks excluding the whole disk, with valid/missing/substituted family cases.
Acceptance tests8/8PASS. Rejected inventories remain valid diagnostic data;
this does not loosen partition selection or promote authority. Full goal and
remaining execution bindings stay open. No cloud operation or new reservation.

## 0082 — bounded workers and observation/publication composition

Added explicit observation entrypoint, POSIX bounded worker engine and single-use
supervisor. Worker mock tests7/7PASS; supervisor injected tests5/5PASS. Worker
interface independently reviewed, with native Linux verification and whole-tree
containment expressly unresolved. Reviewed Debian systemd documentation for
control-group/runtime supervision; no service or cloud operation was created.
Process-group absence must not be promoted to whole-tree cleanup evidence.

Full goal stays active. Next bind containment, persistent/serial capture and
cloud lifecycle before complete-package review/authorization. No local Docker
or WSL start, no numerical execution, no new reservation and no evidence
deletion. Conservative allowance remains10.40USD/9600seconds.

## 0083 — supervisor admission timing correction

Independent review found that intent persistence could consume part of the
reserved worker window. Added the same duration-plus-cleanup check immediately
after intent persistence and before dispatch. Slow-intent regression confirms
no publisher dispatch when the remaining window is insufficient. Supervisor
tests6/6PASS. No cloud action, additional reservation or goal completion.

## 0084 — journal, session and containment preparation

Added bounded exclusive disk-backed journal and supervisor session binding.
Independent review prompted parent-directory fsync after root creation; its
failure preserves the new directory without retry. Added pure transient-service
plan and observed property/cgroup guard. All discovery test discovery82PASS
(includes six duplicated imported supervisor tests); native Linux durability
and cgroup behavior are not established. Complete startup, serial capture,
cloud lifecycle and execution-package review remain open. No cloud operation,
new reservation, numerical execution or authority promotion. Goal stays active.

## 0085 — guarded entry and restart-policy binding

Implemented bounded service-property/cgroup guard before session admission,
preserving guard failure output. Explicit Restart=no was added after independent
review. Local discovery suite79 unique tests PASS; duplicate imported test
collection removed. No native service verification or cloud execution occurred.
Outer capture/termination/shutdown and complete-package review remain open.

## 0086 — raw failure-export preparation

Guarded-entry scoped independent review passed. Added pure bounded raw journal
and report export with four tests PASS, including maximum-size round trip and
partial JSON preservation. No file collection or serial/cloud write occurred.
Startup, termination, export binding and independent stop remain open. No cost
reservation, numerical execution, evidence deletion or authority promotion.

## 0087 — collection, serial framing and outer lifecycle composition

Added unexecuted POSIX journal collector, pure numbered serial frames and
injected startup lifecycle with stop-before-collection and finally-poweroff.
Unfrozen export report cap increased64KiB/total800KiB for base64 overhead;
maximum framing test remains below1MiB. Discovery suite90PASS. Native bounded
adapters, cloud lifecycle and full-package review remain open. No cloud action,
cost reservation, numerical execution or authority promotion.

## 0088 — native adapter preparation and exception-path correction

Stop/collection exceptions now retain summary-export opportunity and poweroff.
Collector opens its attempt parent nofollow. Added unexecuted bounded native
service/serial/poweroff adapters, five injected tests; discovery suite97PASS.
Aggregate startup and serial-drain assurance remain open, as do cloud binding,
complete review and authorization. No cloud action or new reservation.

## 0089 — native stop/drain review corrections

Tightened systemctl-show absence status; preserved stop-command failure while
still checking state/cgroup. Added bounded transmit drain with signal cleanup,
seven injected native tests PASS. External aggregate supervision and stop-receipt
export wiring remain required. No native execution, cloud action or reservation.

## 0090 — explicit guest boot and stop-receipt export

Bound Python startup to native adapters; stop captures enter serial summary.
Added external330second timeout/10second grace and bounded EXIT poweroff shell.
Explicit Git Bash syntax-only check passed, startup tests7PASS. No script,
native adapter, cloud action or numerical process executed. Full package source
authentication, cloud binding/retrieval and final acceptance remain open.

## 0091 — deterministic diagnostic package construction

Added explicit source inventory/hash-bound local builder with exclusive/fsynced
extraction and pre-extraction shutdown protection. Two builder tests and generated
Python/Bash syntax checks PASS, with no execution or upload. Package remains
unfrozen pending independent review and remaining cloud/acceptance bindings.
No cloud action, cost reservation, numerical work or authority promotion.

## 0092 — consumed-v2 history and attached-clone preflight

Reauthenticated88-record chain and prior histories locally. Added fresh-read
preflight composition against attachedROclone/stoppedhelper baseline, two local
testsPASS. No actual cloud read or mutation. Guest package scoped review passed;
complete operations/retrieval/acceptance and consolidated authorization remain.

## 0093 — bounded discovery SDK read preparation

Added read-only adapter with larger helper/diagnostic/serial caps and bounded
chunk recording, two injected tests PASS. No SDK/API request executed. Storage
and polling aggregate limits remain part of unfinished full binding. No cloud
action, cost reservation or authority promotion.

## 0094 — one-shot commands and bounded receipt correction

Added fixed startup/restart/stop adapter; repaired read cleanup scope, original
exit preservation and total receipt budget. Six injected tests PASS. No SDK
operation executed. Full operations/storage/acceptance binding remains open.

## 0095 — full cloud lifecycle composition

Connected bounded preflight/startup/start/serial-poll/validation/stop sequence.
Two injected integration tests PASS, including incomplete evidence and stop.
No API operation executed. Real validation and durable store binding remain
open before whole-package authorization and live execution.

## 0096 — observation horizon and raw serial audit

Extended bounded polling to cover permitted startup duration. Added raw serial
audit with three failure/rejection tests PASS; positive integration/review and
process callback remain pending. No cloud execution or new cost reservation.

## 0097 — audit consistency repair and local execution store

Added full synthetic audit success/rehashed failure cases and checked worker/
guard/stop captures, six audit testsPASS. Added exclusive bounded local store,
two filesystem testsPASS; test evidence retained. No cloud action or numerical
execution. Bridge/frozen runner and independent review remain open.

## 0098 — installed-runtime audit bridge

Store rejects redirected ancestors. Added bounded one-use local Python audit
bridge, actual installed-runtime negative testPASS and two store testsPASS.
Temporary input/evidence retained. No cloud or numerical execution. Final
runner, full review/freeze and consolidated authorization remain pending.

## 0099 — complete runner assembly review

Assembled all adapters;35JS/106Python testsPASS. Whole-package review identified
monotonic timing, ledger/authorization budget binding and final-write deadline
repairs before freeze. No prepare/execute function invoked, cloud operation or
cost reservation. Full goal remains active.

## 0100 — runner admission corrections

Added shared monotonic clock, frozen ledger and separate authorization binding,
aggregate budget/expiry admission, and bounded initial/final writes. Four local
testsPASS. No authorization file, prepare/execute call or cloud action. Review
and consolidated user authorization still required before execution.

## 0101 — local freeze admission

Independent reviewer cleared the assembled source for local freeze/preparation
after runner repairs. Final local suites38JS/106Python PASS on2026-09-07.
Prepare exactly one local C:/NHM2-Discovery-v1 package; do not execute it.
The manifest will bind this ledger state. Proposed successor reservation is
0.10USD/1200seconds, against prior reserved1.60USD/12000seconds and aggregate
12USD/21600seconds. This is a proposal, not a consumed reservation or grant.
Separate user authorization must precede any startup replacement/restart.
Retain all original/helper disks, attached read-only clone and evidence.
No candidate/numerical execution, mount, recovery archive read or promotion.
