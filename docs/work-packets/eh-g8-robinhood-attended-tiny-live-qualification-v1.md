Program gate: G8 — environment-harness release evaluation
Workstream: Robinhood attended tiny-live cash-equity qualification
Capability or component: `helix:live-equity:tiny-v1` production-gated entry, reconciliation and protective-exit plane
Lifecycle stage: read acceptance → provider-contract preflight → attended arming → explicit review/approval → at-most-once placement → reconciliation → protective exit → attended closeout
Reaction timescale: operator-attended placement; bounded supervisor safety response; no autonomous strategy execution
Authority owner: the signed-in developer owns every financial approval; Helix owns admission, single-use authority, reconciliation and safety locks; the supervisor owns only fail-closed safety transitions
Current maturity: implemented
Target maturity: live accepted
Required evidence: sanitized real-account reads; one unambiguous Agentic account; zero-call provider-contract PASS; exact $25 entry cap; fresh attended presence; healthy supervisor; protective-exit readiness; one-time explicit entry and exit approvals; at-most-once provider identities; reconciliation of all ambiguous outcomes; kill-switch and dead-man relock; one tiny entry/exit canary with no unresolved exposure
Explicit non-goals: no profitability claim, no unattended entry, no approval inference, no order from Codex or this packet, no options, margin, extended hours, cap increase, repeated ambiguous placement, or use of the approximately $200 buying-power allocation as per-order authority
Downstream gate unlocked: after live acceptance, the existing path may be considered for exact per-order user-approved attended use under the frozen tiny policy

# EH-G8 Robinhood attended tiny-live qualification v1

## Frozen authority boundary

The user's approximately $200 Robinhood buying-power allocation is an
account-level ceiling only. It does not change the frozen policy and is not an
approval. Every entry remains capped at $25, with no more than one new entry,
one open position and zero pre-existing open orders under the accepted
preflight. No live order may occur until the installed OAuth/read acceptance,
provider-contract acceptance, attended-presence and protective-exit gates pass
and the user enters the exact approval and placement phrases for that order.

The frozen implementation is `helix:live-equity:tiny-v1`:

- long cash equities only;
- limit entries only;
- no options, margin or extended hours;
- $25 maximum entry notional;
- $1 maximum estimated entry risk;
- $3 daily-loss lock;
- one new entry and one open position maximum;
- explicit, session-bound, one-time approval;
- relock before the provider placement call;
- provider client-order idempotency plus mandatory reconciliation;
- separate explicitly approved full-position protective stop or market close;
- fresh attended presence, healthy supervisor and kill-switch enforcement.

## Deterministic qualification checkpoint — 2026-08-27

The current code-level battery passed without a real provider mutation:

```text
npx vitest run \
  server/services/trading/__tests__/robinhood-read-acceptance.test.ts \
  server/services/trading/__tests__/live-trading-supervisor.test.ts \
  server/services/trading/__tests__/live-account-preflight.test.ts \
  server/services/brokerage/__tests__/robinhood-protective-exit-adapter.test.ts \
  server/services/brokerage/__tests__/robinhood-order-preview-adapter.test.ts \
  server/services/brokerage/__tests__/robinhood-live-order-adapter.test.ts \
  server/services/brokerage/__tests__/robinhood-live-contract-preflight.test.ts \
  server/services/brokerage/__tests__/robinhood-live-cancel-adapter.test.ts \
  server/routes/__tests__/brokerage-connections.test.ts \
  --pool=forks --maxWorkers=1

28/28 tests passed.

npx vitest run tests/startup-config.spec.ts \
  shared/__tests__/helix-brokerage-environment.spec.ts \
  --pool=forks --maxWorkers=1

14/14 tests passed.
```

The evidence covers encrypted OAuth storage, owner-private room failure on a
guest, single Agentic-account selection, sanitized read receipts, zero-call
provider-contract inspection, exact provider review/placement/cancellation
schema fencing, provider idempotency, explicit one-time approvals, mandatory
reconciliation, protective stop and market-close contracts, operator-presence
dead-man relock, supervisor non-mutation and startup refusal when the two live
flags disagree or the provider encryption key is invalid.

This proves `implemented`, not `live accepted`. Mock/provider-fixture tests do
not prove the installed user's real account, current Robinhood tool catalog,
real supervisor heartbeat, attended tab presence, provider-supported minimum
notional or a reconciled canary.

The visible attended-session close path is also fail closed: selecting **End
attended live session** stops the browser heartbeat first and sends a
generation-scoped server `end`, which clears operator presence, disarms
placement, engages the live kill switch and retires that attendance generation.
Every start creates a fresh opaque attendance ID; heartbeats and end requests
must match its stored hash. A late in-flight heartbeat from an ended or
dead-man-expired generation therefore fails closed instead of restoring
presence. Migration `066_live_attendance_generation` relocks any inherited
presence during upgrade. If the explicit end request fails, heartbeat cessation
still reaches the supervisor's ten-second dead-man boundary. Focused migration,
UI and integrated regressions prove explicit-end retirement, dead-man
retirement, late-heartbeat rejection and the returned not-present locked state;
they do not call a provider order tool or substitute for the installed-runtime
dead-man evidence required below.

The provider-mutation boundary now revalidates the approval's authenticated
session both before credential access and again while reserving an entry or
protective exit. Protective-exit placement additionally requires the live
deployment gate, a fresh seven-contract PASS, an active healthy supervisor and
fresh attended presence immediately before reservation. It intentionally does
not require the entry kill switch to be off or entry placement to be armed,
because a filled position must retain a risk-reducing exit path while new risk
is locked. Cancelling an open protective stop can increase exposure, so that
path also requires the live deployment gate, fresh provider-contract PASS,
healthy supervisor and attended presence. Deterministic regressions prove that
cross-session entry/exit attempts, stale-presence exit placement and
stale-presence stop cancellation make zero provider order/cancellation calls
and leave the one-time authority available for a valid attended retry.

The authenticated MCP surface now also exposes
`helix_brokerage_live_acceptance_readiness`. It projects the existing eleven
qualification gates for the exact profile-owned private room using only the
already-required room-read and environment-read scopes. The tool is local,
read-only and idempotent: it cannot enable either production flag, arm a
control, confirm operator presence, approve or place an order, or call a
provider order tool. Its typed result retains the explicit zero-call,
credential-exclusion, account-number-exclusion, raw-payload-exclusion and
non-answer-authority proofs. This closes Codex visibility of the qualification
state; it does not satisfy any pending gate or confer live authority.

## Offline final-archive checkpoint — 2026-08-27

The post-canary archive path is now implemented without enabling either live
flag or calling Robinhood. Migration `067_live_acceptance_archives` adds an
owner-, connection-, room- and control-scoped immutable evidence row and the
local workstation snapshot restores that table after its parent live ledgers.
The developer-only route and room UI require the exact phrase
`ARCHIVE ROBINHOOD LIVE ACCEPTANCE <connection_id> <room_id>` and fail closed
while either live flag is enabled.

Before insert, the store requires fresh completed readiness, at least one
reconciled-filled entry, at least one reconciled-filled exit and zero unresolved
exposure. It then locks the active control and rechecks the final counts in the
same transaction. The stable evidence hash excludes the volatile generation
time and contains only sanitized gate identities, hashes and counts; an exact
retry returns the original archive instead of creating a second acceptance.
The public projection declares zero provider calls and excludes credentials,
account numbers, raw provider payloads and answer authority.

The focused offline battery passed 8/8 across migration constraints, the
developer route, idempotent archive replay, flag-off enforcement, zero provider
calls and the UI exact-confirmation flow:

```text
npx vitest run \
  server/db/migrations/__tests__/067_live_acceptance_archives.spec.ts \
  client/src/components/helix/ask-console/shared-live-room/__tests__/SharedLiveRoomPaperTradingPanel.spec.tsx \
  server/routes/__tests__/brokerage-connections.test.ts \
  --pool=forks

3 files passed; 8 tests passed.
```

This completes the offline archive mechanism only. Migration 067 and its UI
must still be loaded by the coordinated keyed acceptance instance, and no live
entry/exit evidence exists to archive yet.

## Installed-runtime checkpoint — 2026-08-27

The profile-owned local installation now has live-acceptance evidence for the
read-only and managed-recovery portion of this packet. No order or
money-moving tool was called:

- a fresh Codex process created durable run
  `run_f93d3e1e-eecf-4c06-8ba8-502cf0a35035`, bound it to the exact private
  room and bootstrapped the existing $200 paper account;
- durable goal `environment_durable_goal:6d66bc5c-c10e-40c6-9e98-7f45e7f78184`
  binds both `world_id` and `subject_binding_id` to
  `paper_account:5987d75e-299d-4226-806e-d999f5ba381e`, while retaining the
  private Robinhood room binding and producer epoch;
- monitor `environment_monitor:7e97f0c8-dc96-432d-9a35-cf2e07d53e46`
  accepted the five brokerage event families with zero initial wakes and
  cursors;
- a fresh SPY observation produced deterministic disposition
  `no_material_paper_change`, `semantic_wake_eligible=false`, no delivery and
  no cursor advance. The receipt proves simulation-only processing,
  `provider_mutation_attempted=false` and
  `live_order_execution_enabled=false`;
- after a complete keyed-server restart, a separate Codex process reconnected
  to the same monitor ID, original expiry, zero cursors and zero wakes. The
  store now permits an exact-identity reconnect to reuse but never extend the
  original lease; the integrated monitor-store battery passes 6/6;
- the v3 lease was then explicitly revoked at cursor zero. A post-revocation
  read returned typed disposition `lease_inactive`, cursor `0 → 0`, no items
  and `wake_requested=false`, proving that the continuation cannot silently
  resume after revocation;
- the authenticated room acceptance control recorded fresh sanitized receipts
  for `get_portfolio`, `get_realized_pnl`, `get_equity_positions`,
  `get_equity_quotes` and `get_equity_orders`;
- the provider-contract preflight recorded PASS for all seven reviewed schema
  contracts with catalog hash
  `sha256:3ec58e67e82ec9f1631a610201f72ba19b47abd54022d34743fd710dd1dfcab2`
  and `provider_order_tool_calls_made=0`;
- the Codex MCP allowlist now advertises both read-only G8 report tools. A fresh
  process successfully called `helix_brokerage_live_acceptance_readiness` and
  observed six PASS gates, five pending gates, `live_entry_count=0`,
  `unresolved_live_exposure_count=0`, and no credentials, account numbers or
  raw provider payloads.

The resulting readiness projection was
`read_acceptance_complete=true`, `safe_to_enable_live_flags=true`,
`ready_to_start_attended_canary=false`, `ready_to_arm=false`, and
`acceptance_complete=false`. “Safe to enable” means only that the frozen
read/contract prerequisites no longer block the paired deployment flags; it is
not permission to enable them, arm, approve or place an order. The material
paper wake/acknowledgement/revocation acceptance was completed by the later
checkpoint below. The attended live canary remains pending.

The later installed paired-flag and attendance checkpoint closed the
deployment-safety portion without arming or calling a provider order tool:

- a one-flag launch refused startup with
  `robinhood_live_flags_must_be_enabled_together` and left port 1522 unbound;
- a paired-flag launch without a valid stable provider key refused startup with
  `robinhood_live_provider_encryption_key_invalid`;
- a new 32-byte random key was stored under Windows current-user DPAPI and
  loaded only into the launched process. The room-bound connection's explicit
  `dev-local` record was read through the non-production-only rotation path and
  immediately persisted under the stable key; the production fallback remains
  forbidden;
- the paired live flags then booted successfully, the installed supervisor was
  healthy and fresh, and the protective-exit plane was ready;
- five refreshed sanitized reads produced `READY FOR ATTENDED CANARY` with
  zero unresolved exposure and zero provider order-tool calls;
- a visible generation-scoped attended session produced `READY TO ARM`. It was
  deliberately not armed;
- closing the room panel stopped its heartbeat without sending `end`. After
  expiry, the installed supervisor cleared presence and relocked placement with
  `Attended operator presence expired; live placement relocked.` The persisted
  journal contains one `operator_presence_expired_relocked` event, and the
  readiness report still recorded zero provider order-tool calls and zero
  unresolved exposure.

The room UI now recomputes live-acceptance readiness immediately after both
attendance start and explicit end, so `READY TO ARM` and the relocked state no
longer depend on an unrelated second read-verification action. Focused vault
and UI regressions pass 7/7. The connector-contract verification gate also
returned PASS with certificate integrity OK and certificate hash
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.

## Material paper-observer checkpoint — 2026-08-27

The installed resident observer completed the paper-only prerequisite using
monitor `environment_monitor:9b046d52-86a4-4659-84ee-ff0693b16f52`:

- one real read-only SPY quote drove a deterministic local $20 paper canary;
- the simulated entry fill and position open produced one semantic delivery,
  cursor `0 → 1`, followed by acknowledgement at cursor `1`;
- an exact replay after source freshness elapsed was deduplicated to the same
  observer-cycle ID with no second cursor or wake;
- restart/reconnect preserved monitor ID, cursor `1/1`, one wake and the
  original expiry;
- the simulated position was closed through the authenticated room UI, leaving
  zero open paper positions and live orders locked;
- explicit revocation was followed by `lease_inactive`, zero items and no wake.

After the paper cleanup, the five sanitized reads and seven-schema provider
contract receipt were refreshed. A fresh read-only MCP readiness report showed
`read_acceptance_complete=true`, `provider_contract_pass=true`,
`safe_to_enable_live_flags=true`, six PASS gates, five pending gates,
`live_entry_count=0`, `unresolved_live_exposure_count=0` and
`live_order_tool_calls_made=0`. The remaining gates are exactly the paired live
deployment flags, fresh supervisor/exit plane, fresh attended presence, one
reconciled tiny entry and one reconciled risk-reducing exit. No live flag was
enabled and no provider order call was made.

## Remaining live-acceptance sequence

1. **Passed 2026-08-27:** installed profile-owned OAuth and read-only acceptance
   has fresh sanitized portfolio, position, quote, order-history and P&L
   receipts.
2. **Passed 2026-08-27:** while both live flags remained off, the seven-contract
   provider preflight recorded PASS with `provider_order_tool_calls_made=0`.
3. Confirm the selected Agentic account has no position and no open order and
   determine the smallest provider-supported notional no greater than $25.
4. **Passed 2026-08-27:** the paired gates booted only with the stable key; the
   installed supervisor and protective-exit plane were fresh, attended
   presence reached `READY TO ARM`, and heartbeat expiry produced the persisted
   zero-call dead-man relock.
5. Stop before placement and present the exact entry review, notional, limit,
   estimated risk and approval phrases to the user.
6. Only after the user's exact per-order approval, place once, reconcile, add
   and reconcile the separately approved protective exit, remove all exposure,
   disable both live flags and archive the sanitized acceptance report with the
   exact connection- and room-bound confirmation phrase.

Any missing item leaves this packet incomplete. No test or paper observation
substitutes for the real installed live-acceptance trace.
