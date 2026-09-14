# Packaged profile invalidation and receipt settlement checkpoint

Evidence classes: build/content comparison, isolated packaged launch smoke,
ordinary signed-out native navigation. Not authenticated pairing acceptance.

Package: `apps/desktop/release-profile-settlement-20260913/win-unpacked/CasimirBot.exe`.
EXE SHA256: `66e9ed1c12c7ea66593e59f1f4c88deeb27b9929c74243c23c91eea239d4f276`.
Service SHA256: `871fd1ceacda2381cca3f083c1658c79a2a3950e0b81fbf8aa332cf6ba2d2de7`.

This packages the [account-event invalidation](2026-09-13-profile-account-event-invalidation.md)
and [stale upload receipt repair](2026-09-13-profile-stale-upload-receipt.md),
in addition to the previous [owner recovery package](2026-09-13-owner-recovery-package.md).
The two linked source-only package limitations are superseded by this checkpoint.
Unchanged EXE/service hashes do not establish renderer identity: these repairs
are in separately packaged client assets.

`npm run build:client` passed with 3334 modules in 1m34s. From `apps/desktop`,
`npm run pack:dir -- --config.directories.output=release-profile-settlement-20260913`
passed. Existing browser externalization/eval/chunk and four service duplicate
key/case warnings remain. The [content comparison](2026-09-13-profile-settlement-package.json)
matched 645 runtime files, 635 renderer files and eight host artifacts without
mismatches or extras. It records the dirty canonical checkout and source commit.

The previous owner-recovery package was observed signed out with no active
categorization jobs, closed normally, and its exact process-path absence
verified. Its files and ordinary profile were retained. The
[isolated launch smoke](2026-09-13-profile-settlement-smoke.json) passed with
five processes, four loopback listeners, full readiness and service receipts,
native credential key vault and preserved protocol registration. Minimum free
physical memory was 5.19 GiB and maximum commit 44.1%; the 4 GiB guard was
unchanged. Friends coordination was NOT_CONFIGURED. The smoke cleaned its owned
test process tree.

The new ordinary-profile launch produced window 6359832 and startup `app ready`
at `2026-09-13T10:36:14.507Z`. After an interrupted tool output and the user's
crash report, fresh process inspection found five CasimirBot processes, all
from this new package. Fresh native observation found the same responsive
window. No restart was performed for the observation interruption. This does
not exclude an earlier unobserved crash.

Ordinary pointer navigation reached Activity & setup → External agent setup →
Open Agent Access → Codex App preference → Open account sign-in. The account
panel loaded with empty Email/Password controls, Auth0 sign-in, no linked
accounts and no active categorization jobs. Agent Access identified sign-in
as step 2 of 6. It remains open beside Account & Sessions.

The native input helper initially rejected stale observation state and then
reported unavailable coordinate geometry. Fresh window selection, activation
and screenshot observation recovered input; the subsequent setup clicks
succeeded. These were observation/input-helper failures, not evidence of a
binding checkbox defect. No credentials, sign-in submission, trust, transport
renewal, pairing consent or environment action was automated.

This proves that the two repairs are packaged and basic native setup navigation
works. The linked component and isolated browser tests retain their original
scope; native authenticated account-event recovery, exact pairing, prompt
delivery/pickup/acknowledgement, Ready up and live successor execution remain
unverified. Server upload ordering and full account partitioning also remain
open as documented in the source evidence.

The [full CS5 inventory](2026-09-13-owner-recovery-cs5-reconciliation.md) retains
all requirements; this supplement updates only packaging and native navigation
evidence. CS1–CS4 and O1–O6 remain incomplete, ET6 is unpassed and NAV1 is not
qualified. The [work program](../../helix-environment-harness-work-program-v1.md)
remains the sole status authority. No physical, adapter or certificate integrity
claim is made by these application packaging checks.
