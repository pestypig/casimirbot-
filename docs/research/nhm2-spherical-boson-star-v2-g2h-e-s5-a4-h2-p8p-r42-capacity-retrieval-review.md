Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral evidence retrieval
Capability or component: R41 disk-full adjudication and R42 retrieval-controller review
Current maturity: local engineering review; R41 consumed before helper restart
Target maturity: bounded, tested retrieval successor ready for separate execution authorization
Required frozen inputs: unchanged R40 archive identity, R41 partial receipts, R41 controller, exact retained helper and original VM identities
Required evidence: capacity checks before mutations, bounded command execution, cleanup on timeout, exclusive local publication, authenticated archive, stopped helper
Stop/fail criteria: insufficient capacity, unbounded command or cleanup, overwritten receipt, unsupported runtime claim, second retrieval or unauthorized restart
Explicit non-goals: cloud execution in this review, R41 retry, new resources, rescue/build/numerical execution, candidate evaluation, evidence deletion, authority promotion
Downstream gate unlocked: a separately authorized retrieval successor only after local behavioral verification

# R41 outcome and R42 engineering review

As of September 5, 2026, R41 is consumed. The one controller invocation
reported disk exhaustion while writing its failure receipt. Its partial local
capture contains four files: start.utc.txt and finish.utc.txt (21 bytes each),
failure.txt and source-vm.before.json (zero bytes each). These files remain
untouched. A zero-byte failure receipt is not a successful result.

The helper instance 7129462452423922626 was independently observed TERMINATED
after the failure and again during this review. Its last start and stop remain
2026-09-04T13:42:29.635-07:00 and 2026-09-04T13:45:50.465-07:00. Thus R41 did
not restart the helper. No local archive was recovered. The user subsequently
freed capacity; this review observed 15,676,899,328 available bytes on C:.

The desired recovery remains the existing 12,122-byte R40 archive at
/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz, SHA-256
73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922.
The remote bytes have not been re-read in this review. Their identity remains
the previously observed R40 receipt, to be verified against a future download.

## Corrections required before freezing R42

1. Use fresh local paths and preserve R41's partial capture. Check at least
   256 MiB free on the destination volume before creating receipts and again
   immediately before requesting a helper start. This is an operational
   reserve, not a prediction of the archive size or a scientific threshold.
2. Bound each cloud subprocess and the whole restart window. R41 calls gcloud
   synchronously without a subprocess timeout; its stated 1,200-second ceiling
   is not enforced by the code. A stalled start, SCP, or stop must not bypass
   the controller's deadline. Reserve time for cleanup within that window.
3. Record that a start was attempted before dispatching it. R41 sets its cleanup
   flag only after the start call returns successfully. An uncertain response
   may leave a running helper without invoking the stop path.
4. Validate read-only account/resource identities and the existing R40 receipt.
   A transport error must never serve as evidence for an expected guest result.
5. Download once to a fresh short path and verify exact length and SHA-256.
   Publish the preserved local copy using exclusive creation, not a separate
   existence test followed by a potentially overwriting Copy-Item.
6. Verify cleanup state independently. A stop request alone does not establish
   TERMINATED. Preserve any stop failure prominently and do not claim closure.

## Required behavioral checks

Test locally with a fake cloud command adapter that cannot contact Google:
insufficient space before start; space lost after preflight; timed-out or
ambiguous start; failed/timed-out SCP; incorrect archive size/hash; occupied
destination; stop failure; successful download, exclusive publication and stop.
Assert that each case issues at most one start and one transfer and that a
start attempt always enters cleanup. Parser checks and source-string counts
alone are insufficient evidence for these behaviors.

R42 is deliberately not frozen or authorized by this document. The prior
R41 proposal, controller and receipts must remain immutable. No cloud restart,
transfer, resource creation, deletion, or scientific execution occurred during
this review. This document changes operational planning only and makes no new
proof-maturity or certificate claim.

## Local implementation checkpoint

The inert R42 retrieval flow and bounded-process utility now have executable
behavioral tests under tools/nhm2-spherical-boson-star-v2-branch-proof/g2h.
The flow tests use a fake cloud interface and exercise capacity failures,
uncertain starts, transfer failure, bad archive identities, occupied output
paths, and cleanup failure. The subprocess tests execute only local Node
processes: argument preservation, nonzero exit capture, output limits, and
termination of both a parent and its descendant on timeout.

These tests verify local orchestration and process handling, not a completed
cloud adapter or retrieval. Production account/resource checks, exclusive
filesystem writes, receipt persistence, and SDK binding still need integration
and tests before R42 can be frozen. A failed stop request or unavailable status
must remain an explicit unresolved cleanup outcome; no local timeout can
guarantee that the remote VM stopped during a Google API outage.

The adapter and exclusive file publication are now implemented and the local
suite passes 26 tests. The integrated successor is specified in
[R42 bounded retrieval proposal](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r42-bounded-retrieval-proposal.md).
The proposal binds the entrypoint and five-file runtime manifest. This
checkpoint supersedes the earlier incomplete-implementation note above; it
does not authorize execution. No R42 cloud start or download has occurred.
