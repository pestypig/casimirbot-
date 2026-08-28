Program gate: G8 — Environment-harness release evaluation
Workstream: EXE-first subscriptions, provider connections, and user-authorized agent capability
Capability or component: SPB-4 Stripe sandbox payment, entitlement, and credit ledger
Lifecycle stage: hosted sandbox checkout intent → signed webhook → idempotent event admission → immutable ledger posting → entitlement projection → revoke/refund/adjustment
Reaction timescale: owner-attended checkout and management only; webhook reconciliation is event-driven; no provider execution or autonomous purchase
Authority owner: Stripe sandbox owns hosted payment instruments and signed payment events; the Casimir billing service owns event admission, immutable integer-minor-unit ledger entries, balances, and entitlement state; the profile owner starts checkout and confirms high-risk changes; the installed native UI receives only sanitized status; Runtime Codex may inspect status but cannot purchase, refund, adjust, raise limits, or arm spend
Current maturity: deterministically verified
Target maturity: live accepted with one owner-attended sandbox purchase/cancel/refund trace
Required evidence: sandbox-only configuration; hosted Checkout and customer-portal URLs; raw-body Stripe signature verification with bounded timestamp tolerance; duplicate and crossed-profile denial; exact event/object idempotency; ordered immutable integer-minor-unit ledger entries; plan, included-credit, prepaid-credit, refund/adjustment, payment-failure, cancel, and expiry state; nonnegative available balance; exact hard account ceiling; restart persistence; private native profile projection; no card, bank, client secret, webhook secret, checkout token, or full Stripe object in renderer, MCP, model, logs, process arguments, debug export, or room state; deterministic migration/store/webhook/route/UI tests; and owner-attended sandbox receipts
Explicit non-goals: no production Stripe key or live-mode object; no raw card or bank field in CasimirBot; no Casimir custody of payment instruments; no provider credential enrollment; no managed or user-owned provider traffic; no usage reservation or billable session lease; no agent purchase, refund, adjustment, plan change, top-up, budget raise, or checkout authority; no public MCP grant; no signed-pilot or G8-closure claim
Downstream gate unlocked: SPB-5 may resolve one Casimir-managed provider operation only after a separate bounded reservation/meter/reconciliation contract consumes an active entitlement without receiving payment credentials

# EH-G8 SPB-4 Stripe sandbox entitlement ledger v1

## Active stage

SPB-4 is the sole active stage in the canonical EXE-first subscription and
provider-access broker packet. SPB-3 is live accepted. SPB-4 is
deterministically verified but not live accepted. SPB-5 through SPB-9 remain
blocked.

## Frozen processor boundary

- Stripe is admitted only when the configured secret key is test/sandbox mode
  and the webhook secret is supplied outside renderer- and model-visible state.
- CasimirBot creates hosted Checkout and Billing Portal sessions server-side
  and returns only an exact HTTPS `checkout.stripe.com` or
  `billing.stripe.com` URL to the native host. The native host opens that URL
  without returning it to renderer state. It renders no card or bank fields.
  Portal creation resolves the opaque customer reference only inside the
  billing service after fresh exact-purpose MFA and active-device validation.
- Webhooks are mounted before ordinary JSON parsing. Admission verifies the
  exact raw UTF-8 body, `Stripe-Signature`, timestamp tolerance, event ID,
  object ID, event type, livemode false, currency, and profile metadata.
- Duplicate delivery returns success without reposting. Two distinct Stripe
  events for the same semantic object transition are also idempotent.
- Unknown events are acknowledged as ignored and grant no entitlement.

## Frozen ledger contract

- All monetary values are signed integers in the currency's minor unit. The
  initial slice admits USD only and never uses floating-point currency math.
- Payment events append ledger entries; they do not mutate historical entries.
- Credits are positive, debits and reversals are negative, and the derived
  available balance may never fall below zero.
- Refunds and administrative adjustments reference an earlier immutable entry.
  Adjustments require an internal operator authority not exposed in the native
  panel or MCP.
- Plan entitlement and prepaid credit are separate classifications. A plan can
  become inactive without deleting already settled prepaid credit.
- Failed or past-due payment blocks new managed reservations but does not erase
  audit history, revoke the local application, or imply provider authority.
- The account hard ceiling is stored independently from balance. Zero is a
  locked ceiling, never unlimited. The exact `starter_monthly` plan establishes
  a server-derived USD 2,500-minor-unit ceiling; an existing lower positive
  ceiling remains lower. Prepaid credit requires an active plan. Stripe
  metadata, a large balance, an agent, and a generic successful webhook cannot
  raise the ceiling.

## First implementation slice

1. Add normalized shared schemas for plans, entitlement, balances, ledger
   entries, webhook outcomes, and sanitized native projection.
2. Add migration `073` for Stripe sandbox customer/subscription references,
   admitted events, immutable ledger entries, and profile entitlement state.
3. Add a transactional store with event/object idempotency and balance/cap
   invariants.
4. Add a raw-body signed webhook route before `express.json()` and private
   account-session read routes.
5. Replace the SPB-4 placeholder with sanitized plan, balance, ceiling, payment
   state, and recent-ledger UI. Plan and prepaid Checkout controls become
   available only when the full sandbox adapter is configured and the native
   owner supplies a fresh exact-purpose `payment_change` MFA receipt on an
   active installed device. Refund/adjustment and ceiling controls remain
   unavailable to the renderer and agent.

## Deterministic evidence — 2026-08-28

The first SPB-4 implementation slice is complete at deterministic maturity:

- migration `073` stores finite sandbox entitlement state, signed-event
  admission receipts, and append-only integer-minor-unit ledger entries;
- the transactional store rejects crossed profiles, duplicate event IDs,
  semantic replays, stale state regression, unknown plans, inactive-plan
  top-ups, balance underflow, positive credit above a finite ceiling, and
  positive adjustments while the ceiling is locked. Subscription semantic
  keys retain distinct ordered status/period updates for one Stripe object;
  cumulative partial-refund events post only the new delta and may never exceed
  their referenced immutable credit entry;
- the Stripe adapter rejects production keys, creates only hosted test-mode
  Checkout sessions, binds exact profile/target metadata and idempotency, and
  discards the returned Stripe session object after validating its hosted URL;
- the raw-body webhook verifies HMAC signatures and timestamp tolerance before
  normalization, admits `livemode: false` only, hashes rather than persists the
  raw payload, and returns only a stable credential-free receipt;
- Checkout requires the private developer session, an active installed device,
  a fresh one-purpose Auth0 MFA receipt, and exact target binding. The receipt
  is consumed once. The same boundary opens hosted subscription management only
  after resolving a stored opaque Stripe customer reference server-side.
  Runtime Codex retains inspect-only entitlement authority;
  and
- the native panel shows only plan state, finite balances/ceiling, and stable
  ledger references. It contains no card form, Stripe customer/subscription ID,
  secret, raw event, Checkout token, or agent payment control.

Verification recorded:

- the focused migration, ledger, Stripe client, signed webhook, MFA route,
  installed projection, native panel, and Electron-host battery passed 8 files
  and 45 tests. The combined parallel run made two unrelated persistence cases
  exceed their five-second test timeout under concurrent snapshot load; the
  complete persistence file then passed alone, 9/9 tests, including billing
  restart/idempotency. The integrated signed-webhook acceptance journey then
  passed plan purchase, exact replay, prepaid credit, cap rollback,
  delta-settled partial refunds, cancellation, adjustment, restart, and
  disclosure assertions. Aggregate deterministic coverage is 10 files and 55
  passing tests;
- machine-readable deterministic evidence is frozen at
  `docs/evidence/eh-g8-spb4-stripe-sandbox-entitlement-ledger-v1/2026-08-28-deterministic-acceptance.json` with source hashes and explicit remaining
  live evidence;
- `npm run build:server` — passed with four unrelated existing duplicate-key or
  duplicate-case warnings;
- `npm run build:client` — passed with the existing browser-externalization,
  dependency `eval`, mixed-import, and large-chunk warnings;
- `npx tsc -p apps/desktop/tsconfig.json --noEmit` — passed;
- `npm --prefix apps/desktop run build:host` — passed with the same four
  unrelated server-bundle warnings; and
- `npm --prefix apps/desktop run release:audit-slice` — passed with outside
  worktree changes reported but not staged;
- `npm --prefix apps/desktop run smoke:service-boundary` — passed with missing
  and wrong private sessions rejected, authorized readiness accepted, public
  release closed, local state isolated, and Device Check policy closed;
- `npm --prefix apps/desktop run dist:win` — produced the local developer NSIS
  installer `CasimirBot-0.1.0-alpha.9-x64-setup.exe`, SHA-256
  `6C1E2758C6998776D8D2740C5714143DE53D3E568D7E56C11F18582D96724F5E`;
- the pre-Portal deterministic package passed `smoke:packaged-launch` full
  readiness, service-listener, provider-vault, protocol-registration,
  loopback, and isolated-user-data checks. Two attempts against the Portal
  successor package were correctly refused by the unchanged 4 GiB physical
  headroom preflight at 3.95–3.98 GiB after the heavy build; that result is a
  host-resource deferral, not a passing successor-package smoke;
- `npm --prefix apps/desktop run smoke:service-boundary` passed against the
  current bundled service after packaging; and
- the exact registered current-user installer target was updated successfully
  at `C:\Users\dan\AppData\Local\Programs\CasimirBot\CasimirBot.exe`.

The local installer and installed executable are unsigned developer artifacts.
They are not a signed-pilot or public-release claim; signing remains SPB-9 work.

The repository-wide TypeScript check was attempted at its default heap and at
6,144 MB. It produced no diagnostics before exhausting the default heap or
continuing beyond nine minutes near host memory pressure; it is not counted as
passing evidence. Focused desktop TypeScript and all three production builds
passed.

Live acceptance remains open because this checkout has no configured Stripe
test key, webhook signing secret, sandbox plan/prepaid Price IDs, or deployed
HTTPS Checkout, Portal-return, and webhook endpoints. Those values must be
installed in the hosted Casimir billing service or an owner-controlled
developer server; the Casimir-managed Stripe secret must not be distributed
through the EXE child environment. One owner-attended purchase, Portal
cancellation, partial refund, replay, and restart trace remains required.

## Stop/fail criteria

- Any live-mode Stripe object or production key is admitted.
- Parsed or reconstructed JSON is used for signature verification.
- One event or object transition can credit twice, cross profiles, reorder an
  older state over a newer state, or make the available balance negative.
- Card/bank data, Stripe secrets, raw event bodies, Checkout tokens, or full
  provider objects reach an account event, renderer, MCP, model, log, process
  argument, debug export, or room state.
- A balance, plan, account login, Codex connection, or MFA receipt is treated as
  provider capability or permission to spend.
- Production charging, provider traffic, or SPB-5 implementation is required
  to make the deterministic SPB-4 tests pass.

## Verification plan

- migration contract test and local snapshot/restart persistence;
- ledger unit/integration tests for purchase, duplicate delivery, semantic
  duplicate, crossed profile, stale ordering, cancel, failure, refund,
  adjustment, cap, nonnegative balance, and transaction rollback;
- raw-body webhook signature/timestamp/body-mutation tests;
- installed private-route, account-policy, projection, accessibility, and
  no-secret UI tests;
- server, desktop-host, and production-client builds;
- desktop release-slice audit and environment-harness documentation audit; and
- one owner-attended Stripe sandbox purchase/cancel/refund trace before live
  acceptance. Deterministic completion alone must not be promoted.
