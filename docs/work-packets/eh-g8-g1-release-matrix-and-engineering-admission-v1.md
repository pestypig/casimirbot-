Program gate: G8 — Environment-harness release evaluation
Workstream: launch-ledger G1 / CFP-1 release freeze and bounded engineering admission
Capability or component: selected first offer, conditional action targets, release matrix and isolated contract-fixture development
Lifecycle stage: specification and test-fixture preparation before customer acceptance
Reaction timescale: one reviewed engineering baseline; per-operation clocks below
Authority owner: owner selects offer; canonical work program admits lanes; program owner grants effects; independent reviewer checks this freeze
Current maturity: specified
Target maturity: specified with a reviewed engineering baseline and explicit unresolved commercial/installed holds
Required evidence: current source hashes, owner decision, matrix, exact fixtures, independent review and documentation audit
Explicit non-goals: no CFP-1 commercial closure, signed acceptance, public package, production route, account-policy change, billing activation, native effect or provider purchase
Downstream gate unlocked: only the explicitly named G1-T1 local contract-fixture lane after canonical admission; CFP-2/3 remain blocked

# G1 release matrix and engineering admission v1

This is the consolidated G1 decision artifact linked from the
[launch guide](eh-g8-casimirbot-platform-market-launch-execution-v1.md).
The [work program](../helix-environment-harness-work-program-v1.md) retains
stage/maturity authority; this packet adds no independent roadmap. Read the
matrix first, then only the linked specialist packet needed for a task.

## Owner decision and scope freeze

On 2026-09-21 the owner answered the first-launch question:
**“Retain paid no-model collaboration; evaluate assisted rooms separately
(Recommended).”** This resolves the launch-guide service-mode amendment for
this wave. Free personal MCP remains free. One eligible host sponsors the
selected hosted room; payment never conveys provider credentials or another
person's model subscription. Human-only hosted collaboration remains within
the selected paid offer. Free human-only rooms and paid assisted reasoning are
future proposals, not silently selected benefits. AR-1–3 remain required
separate product-development evaluations; they are not removed from scope.

The selected offer must work with zero seller-funded model calls. An invited
guest needs their own verified account, membership and owner-issued program
grant, but no GPT account for the first-party browser request. Optional external
reasoning clients keep their own costs and authority.

## G1.1 — conditional operations and fallback engineering freeze

**Minecraft:** retain the exact
[D03 stationary one-stone contract](eh-g8-cfp1-conditional-minecraft-shared-action-freeze-v1.md).
One `com.casimirbot.minecraft.player.mine@1`, exact `minecraft:stone` coordinate,
`count=1`, `search_radius=3`, already reachable and focusable; no locomotion.
Observation age at offer and native release is at most 1,000 ms. Invite 15 min,
local share confirmation 10 min, one-use grant 60 s, idempotency retention 24 h,
native result deadline 120 s, deliberate room lease 5 min. The healthy local
stop target is at most two Fabric ticks; delivery/stalled-tick evidence is
separate. Wrong identity, stale observation, altered target, missing grant,
expiry/revoke, cross-room request and uncertain retry must not release a new
effect. Current mod 0.4.12/adapter 0.4.11 cannot satisfy stationary acceptance;
0.4.13/0.4.12 are planned successors, not qualified bytes.

**Non-game fallback:** retain the owner's Path A development selection from
the [fallback packet](eh-g8-cfp1-non-game-shared-action-fallback-decision-v1.md).
Freeze these additional values for isolated tests only:

| Field | Engineering target; absent from the runtime until separately implemented |
| --- | --- |
| Program/profile | First-party reference canvas; planned package `com.casimirbot.reference_canvas:0.1.0-dev.1`; manifest schema `helix.reference_canvas.profile.v1` |
| Operation | `com.casimirbot.reference_canvas.marker.place.v1` |
| Document | Opaque owner-scoped document ID, monotonic integer revision, blank normalized 2D canvas, no imported assets |
| Effect | Exactly one marker, fixed `blue`, at the pre-approved finite normalized coordinates `0 <= x,y <= 1`; no path/script/upload input |
| Offer | Server-owned owner/requester/room/sponsor revision/node/document/revision/connector epoch/operation/coordinate tuple; one unpredictable grant nonce; 60-second expiry, one use, no renewal |
| Observation | Document revision and owner-side snapshot age <=1,000 ms at offer and commit; revision mismatch invalidates the offer |
| Request | Guest supplies opaque offer ID and expected revision; unpredictable idempotency key scoped to actor/room/method; same body returns same durable identity, changed body conflicts; replay record 24 h |
| Deadline | 5 seconds from durable admission through atomic document commit or typed timeout; an independent 5-second HTTP receipt bound must not be treated as proof of completion |
| Cancellation | Before document commit, revoke/expiry/stale epoch cancels with zero marker within a 1-second controlled-fixture bound; after commit, preserve the owner's content and report committed state, never claim rollback or a new effect |
| Postcondition | Native document revision advanced exactly once; one stable effect ID/marker ID exists at the granted coordinate/style; fresh owner read verifies it; unrelated document content unchanged |
| Accounting | Only verified success counts once; denial/duplicate/failure/unknown does not count as success, while actual resource work remains metered; unknown holds the reservation |

All deadlines use server/native authoritative time with controllable clocks in
tests; no client timestamp may extend a grant. Canvas's 1-second cancellation
bound is a test target, not a demonstrated UI/native guarantee. Browser/native
deployment has no implied compatibility or rights approval from a schema.
Use the same authority axes as the
[first-party API](eh-g8-cfp1-first-party-guest-action-api-contract-v1.md), but
document revision and marker evidence replace the Minecraft target evidence.
Do not copy the stationary Minecraft usefulness result to this fallback.
Customer usefulness, actual package/component rights, new source inclusion and
two-device installed acceptance remain open. No rights-cleared commercial
shared action is established by this engineering freeze; G1.1's commercial
condition remains BLOCKED.

## G1.2 — capacity candidate and measurement freeze

Use the [revised $60/month validation candidate](eh-g8-cfp1-revised-hosted-term-validation-candidate-v1.md),
not a public price, existing Stripe Price or viable-margin finding. Retain
[T10/P50](eh-g8-cfp1-d07-t10-p50-usefulness-and-hard-budget-freeze-v1.md):

| Bound | Trial | Paid validation candidate |
| --- | --- | --- |
| Term | 7 days, no card, one-time identity rule | Monthly |
| Host room / invited guest / connected program | 1 / 1 / 1 | 1 / 1 / 1 |
| Verified effects | 10 | 50 |
| Internal PBT / modeled variable-cost ceiling | 1,000 / $1 | 4,000 / $4 |
| Deliberate 5-minute leases | 12 | 60 |
| Ordinary / protected requests | 100 / 20 | 300 / 30 |
| Ordinary / protected egress | 25 / 5 MiB | 100 / 10 MiB |
| Retained application data | 5 MiB | 25 MiB |
| Concurrent mutations / unresolved effects | 1 / 1 | 1 / 1 |

Body/response limits remain 32/128 KiB. The full hard-budget packet controls CPU,
memory, database-union bounds and protected stop/reconciliation reservations.
Resource units and successful effects are separate; these are not customer
credits, model tokens or overage charges. Preserve free personal eligibility.

Measure matched B/P/T scenarios using the
[provider-unit assay](eh-g8-cfp1-d07-provider-unit-allocation-and-assay-v1.md):
B is baseline/free activity; P is paid workload; T is trial workload. Freeze
source/deployment/UTC interval, gross meter units and rates, offsets, account
costs, request/effect identities and sponsor revision. Measure database active
interval union including idle tails, rejected/retried work, support and
mandatory remedies; retain unattributed units. Reconcile total project units
to background + sponsor-attributed + unattributed units before claiming costs.
Run canvas usefulness separately with its own deadline and native postcondition.

Cost statuses remain `bounded_policy`, `bounded_assumption`, `rate_only`,
`missing` and `D11_dependent` as applicable. The old $20 candidate failed; the
$60 low-cohort case still exceeds its $75 subsidy cap. The intended cohort's
$40.40 remainder is unallocated exposure, not profit. D07 remains open pending
complete costs, actual controls, qualified returns and validated usefulness.

## G1.3 — external review and signing holds

D11 has no appointed qualified reviewer evidenced by this wave. The owner is
the developer/seller; an AI/source review is not a qualified legal, privacy or
financial opinion. Existing reviewer packets remain the inputs; the Legal
Moves inquiry remains held. Required returns cover R-MC-01's full paid/trial
guest-to-owner-player relationship, component distribution rights, account and
room data retention/deletion, one-time trial identity retention, seller/merchant
responsibility, subscription/refund/tax treatment and mandatory remedy costs.
Record reviewer identity/scope/date/conditions before clearing any such hold.

Microsoft security-information access is owner-reported unavailable until
**October 1, 2026**. Defer signing-dashboard checks until then or restored
access. Neither existing-account assertion nor elapsed time proves a usable
signer. Recheck >=4 GiB free RAM and >=15 GiB free storage before packaged
qualification. Do not provision signing, send inquiries or activate billing
under this documentation assignment.

## G1.4 — consolidated release and evidence matrix

Source identities and actual post-G0 drift are recorded in
[source-manifest.json](../evidence/eh-g8-codex-first-paid-product-delivery-v1/g1/2026-09-21-release-freeze/source-manifest.json).
References below identify implementation leads, not passing tests. Existing
tests were inspected as fixture leads; this wave runs documentation/source
checks only. Planned artifacts have no invented hash. FC-01–09 retain their
full criteria in the [claim worksheet](eh-g8-cfp1-first-customer-claim-freeze-worksheet-v1.md).

| Claim/capability | Actual source anchors | Frozen target and acceptance fixture | Missing evidence / launch hold |
| --- | --- | --- | --- |
| FC-01 signed Windows download | `apps/desktop/package.json`; `.github/workflows/desktop-release.yml`; `tests/desktop-release-signing.spec.ts` | Planned `0.2.0-beta.1` x64 NSIS, same signed cohort, publisher/hash/notices, repair/update/withdrawal/uninstall | Current package 0.1.0-alpha.11 is not that artifact; signing/access, distribution channel, C01–C15 bytes and DOM-01–07 remain open |
| FC-02 same-host Codex connection | `apps/desktop/src/main.ts`; `server/mcp/helix-mcp-server.ts`; `server/routes/helix-mcp.ts` | Signed `--mcp-stdio-personal` to authenticated local IPC; P1S-01–07; exact Codex 26.915.4065.0 and Windows 25H2/26200 target from compatibility packet | Ordinary-user installed bridge, observed current client version, IPC/owner checks, reconnect and result re-entry missing; auto-update requires refreeze |
| FC-03 free personal catalog | `shared/helix-account-session.ts`; `server/routes/agi.workstation-tool-gateway.ts`; `server/services/environment-connectors/catalog/index.ts` | Every selected operation/context on never-subscribed and expired-hosted accounts; wrong owner/target denial and stop/revoke | Full selected-operation acceptance register and ordinary-user tests not complete; broad 105-name catalog is not a support promise |
| FC-04 personal Minecraft proof | `shared/helix-minecraft-player-capabilities.ts`; `server/services/environment-connectors/actions/action-broker.ts` | P03 two exact stones, conditional successor 0.4.13/0.4.12, retained obstruction/retry trace; no third effect | Stationary successor, loaded artifact identity, native measurements and rights missing; ongoing NAV work retains separate authority |
| FC-05 trial | `shared/helix-billing-entitlement.ts`; `server/services/helix-account/billing-entitlement-store.ts` | Explicit no-card start, T10, same verified identity after deletion, no automatic paid conversion; effect exactly once | Full eligible-host/trial service integration, retention review, installed action and measured cost missing |
| FC-06 paid room/action | `server/routes/agi.realtime-room/index.ts`; `server/services/environment-connectors/actions/action-broker.ts`; `server/services/environment-connectors/actions/authority-store.ts` | New `/api/agi/hosted/v1` schema family, two accounts, separate signed-local share confirmation, 60s pre-grant, 120s Minecraft action, zero provider calls | Existing experimental model room and self-player broker are not this API; guest delegation, rights and native acceptance missing |
| FC-07 handoff/recovery | `shared/contracts/helix-shared-live-room-agent.v1.ts`; billing/account stores | Explicit eligible successor, 24h suspended recovery; first-cohort shared action remains suspended on sponsor change; no transferred grants | Durable two-account handoff/remedy/retention evidence missing; sponsor != program owner requires separate acceptance |
| FC-08 developer starter | `server/services/situation-room/environment-adapter-registry.ts`; `server/__tests__/environment-adapter-registry.test.ts` | C10 selected 43/28 symbol boundary, separately versioned read-only system-clock kit, clean external import/build/probe | Final artifact version/hash/notices, clean-room build and DIR-01–06 remain open; not generic action SDK / DEV-01–06 acceptance |
| FC-09 recurring billing | `server/routes/stripe-sandbox-webhook.ts`; `server/routes/__tests__/stripe-sandbox-webhook.test.ts`; `server/services/helix-account/stripe-sandbox-client.ts` | Selected $60 candidate pending validation; signed webhook/reconciliation; retry/out-of-order/cancel/refund/delete; no entitlement from redirect alone | Final price/fees, real merchant arrangement, account step-up, qualified terms and full sandbox journey missing; $5/$10 presets excluded |
| Google/web/native identity | `shared/desktop-auth0-account-link.ts`; `server/services/helix-account/auth0-step-up.ts`; `tests/desktop-auth0-account-link.spec.ts` | D02 GP-01–11, 7-day absolute web session, distinct 30-day install connection grant; post-intent factor proof | Provider-configured and installed acceptance missing; connection grant is never an action lease |
| Environment Home/Store | `client/src/components/workstation/WorkstationPanelTabs.tsx`; `server/services/environment-connectors/directory/index.ts` | Permanent first panel, built-in tiles then admitted packages; install != connect != grant; wrong version/hash/withdrawn package rejection | Current static panels/built-in directory do not implement generic GitHub installation; artifact schemas, rollback and UI acceptance missing |
| Credential/execution profiles | `apps/desktop/src/main.ts`; account/connector profiles | Owner-protected credential references; exact package/provider/role admission; isolated supervised process; stop/restart/no-secret-leak | Existing developer opaque launcher is not a customer broker/profile surface; public implementation and sandbox evidence missing |
| Canvas fallback | Action registry: `server/services/situation-room/environment-action-adapter-registry.ts` | Prospective 0.1.0-dev.1 + marker.place.v1, exact tuple above, CF-01–08 below | Absent registered canvas action; only a development target; usefulness, component rights and signed native two-device evidence missing |
| Replit/domain | `.replit`; `docs/replit-parity-contract.md` | Same source/build across local, Replit origin and domain; login/download/pairing; parity gates | Deployment parity and integrated ordinary-user journey on final artifact missing; do not treat reachable page as acceptance |
| AR shared AI room | `server/routes/agi.realtime-room/index.ts`; `shared/contracts/helix-shared-live-room-agent.v1.ts` | AR-1–3 Dan/Sam/Alex, attributed correction/disagreement, one principal, worker result re-entry, cross-room denial, separate API cost | Three-member supported capacity, controlled API evaluation, consent, quality and economics missing; no first-offer benefit |

**D12 disposition:** matrix is frozen for engineering planning; customer wording
and full selected per-operation proof remain BLOCKED. C10/package hashes and
unbuilt artifact versions must be supplied by their owning build, not invented
to make the matrix appear complete.

## G1.6 — package/profile boundary

The owner's 2026-09-21 clarification extends the specified connection affordance
to Helix Ask/Helix Chat: the same three-dot **Configure connection** flow as
Environment Home, with owner-scoped credentials and visible provider/payer.
Qualified personal use with a user's own supported provider requires no
CasimirBot subscription; provider charges and hosted-room eligibility remain
separate. This is a target clarification, not evidence of a customer credential
surface or admission of managed inference in the first offer. Follow the
[shared connection menu contract](eh-g8-casimirbot-platform-market-launch-execution-v1.md#shared-connection-menu-helix-ask-and-environment-home)
and its acceptance conditions when the implementation slice is admitted.

Freeze the [launch guide's Environment Home contract](eh-g8-casimirbot-platform-market-launch-execution-v1.md#environment-home-package-source-and-execution-profiles):
permanent first Home panel; Store as a default entry; tile overflow opens
configuration, not a raw secret in renderer state. A listing identifies
publisher, immutable version, source revision, release artifact hash/signature,
license/notices, permissions and compatibility. GitHub hosts reviewed public
source/artifact bytes; the domain owns catalog/admission/withdrawal metadata.
No arbitrary clone-and-run, mutable branch, package installation hook with
undeclared authority, or change to the signed EXE to add an environment.

Package, execution profile, credential reference and program grant are distinct
records. Providers/runtimes remain interchangeable where qualified; selecting
one does not grant model access or bypass program-owner authority. Native
supervision must enforce filesystem/network/command/resource policy, secret
custody, stop and recovery. Preserve developer as the superset and keep public
user gates server-enforced. C10 begins read-only; future action SDK, third-party
self-publication, paid connectors and arbitrary provider profiles require
separate admission and proof. No unique procedural tool is claimed to improve
reasoning without task-level evaluation.

## G1.7 — proposed narrow engineering lane G1-T1

After the work program explicitly admits this lane, develop **local, pure
contract schemas and adversarial fixtures for the reference-canvas fallback**.
This lane does not depend on paid eligibility, Minecraft permission, signing,
provider access or a public package because it exposes no route, native action,
account entitlement, installation or customer benefit. It exists to turn the
specified fallback into an executable contract before those integrations.

Allowed new files only:

- `tests/fixtures/cfp1-reference-canvas-contract.v1.json`
- `tests/helpers/cfp1-reference-canvas-contract.ts`
- `tests/cfp1-reference-canvas-contract.spec.ts`
- new evidence under `docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/g1/`

Use existing schema/test libraries and types where applicable. No package or
lockfile change, production import, route registration, database migration,
account-policy change, runtime loop, connector execution, provider call or
native document write is authorized. A pure test oracle validates specified
preconditions/transitions; it is not a second production authorization service
and cannot prove end-to-end enforcement. Persisted/native behavior must later
be tested against the actual implementation, rather than trusting this oracle.

Fixtures CF-01–08: valid exact tuple/postcondition; wrong owner/requester/room/
node/epoch; stale revision/observation and invalid coordinates; 60-second
expiry boundaries; same-key replay versus altered-body conflict; two requests
for one grant and unknown-result reservation; revoke before commit versus
committed-content preservation; distinct trial-success and resource accounting.
Test all 1s/5s/60s boundaries with an injected clock. Tests need meaningful
negative cases and hand-authored expected results, not assertions copied from
the validator. Run `npx vitest run tests/cfp1-reference-canvas-contract.spec.ts`.
Stop if implementation needs any file outside the allowlist or production
authority: return to this packet for a scoped amendment, not a bypass.

**Next implementation assignment:** G1-T1 as above, `gpt-5.6-terra` medium,
initial 80-credit review ceiling funded only after the current G1 run's balance
is checked; do not add it to G1's 250-credit ceiling implicitly. Use a separate
`codex/g1-t1-canvas-contract` worktree from an explicitly reviewed source tuple
including this packet and the canonical admission amendment. G0's checkpoint
alone predates them. One implementer; independent read-only review of the
result before any claim that these fixtures pass. Public code remains untouched.

## G1 disposition after independent review

| Item | State | Meaning |
| --- | --- | --- |
| G1.1 | BLOCKED | Both engineering targets fixed above; commercially rights-cleared action absent |
| G1.2 | PASS | Candidate and measurement method frozen; D07 economics remains open |
| G1.3 | PASS | Required qualified returns, reviewer absence and public holds explicit |
| G1.4 | BLOCKED | Consolidated engineering matrix prepared; full D12 per-operation/customer acceptance not closed |
| G1.5 | PASS | Owner explicitly retained paid no-model baseline |
| G1.6 | PASS | Home/package/profile/C10 boundaries fixed without claiming implementation |
| G1.7 | PASS | Canonical work program admits only G1-T1 under the exact file/scope restrictions above |
| G1.8 | PASS | Independent source/scope review retained; stale offer wording corrected; documentation audit passes |

Review and validation are retained in the
[G1 review record](../evidence/eh-g8-codex-first-paid-product-delivery-v1/g1/2026-09-21-release-freeze/review.md).

G1 is not CFP-1 closure. Any accepted bounded lane advances only its own
engineering evidence; D03/D07/D11/D12 commercial and signed-install conditions
still govern the public release.
