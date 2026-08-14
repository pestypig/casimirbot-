# Robinhood live-trading acceptance

Status: required before enabling live execution in production

This runbook accepts the CasimirBot Robinhood environment against one dedicated
Robinhood Agentic account. It is not a profitability test and does not assert
that a strategy can prevent losses.

## Preconditions

- Use a signed-in CasimirBot `developer` account and an owner-only Shared Live
  Room. A second participant must suspend the brokerage binding.
- Supply `HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY` through deployment secret
  management. Never paste Robinhood passwords, OAuth tokens, account numbers,
  or provider review tokens into chat, logs, screenshots, or test artifacts.
- Keep `ENABLE_ROBINHOOD_LIVE_EQUITY_EXECUTION=0` and
  `ENABLE_ROBINHOOD_LIVE_SUPERVISOR=0` through read/review acceptance.
- Use Robinhood's hosted OAuth flow. Do not use browser automation.
- Keep the Robinhood app available as the out-of-band emergency control.
- Confirm the process refuses to start if only one live flag is enabled or the
  provider credential key is not exactly 32 random bytes encoded as base64url.

## Read and schema acceptance

1. Connect the Agentic account and attach the exact read capabilities to the
   private room.
2. Read portfolio, equity positions, equity quotes, equity order history, and
   realized/daily P&L. Verify that public receipts contain no raw account
   number, credential, or provider payload.
3. Confirm that exactly one account is labelled Agentic. Ambiguous or missing
   account identity is a failure.
4. In the private-room trading panel, run **Check provider contracts** while
   both live flags remain off. Confirm the stored receipt reports `PASS`, is
   fresh, contains seven passing gates, and reports
   `provider_order_tool_calls_made=0`.
   A PASS expires after 24 hours; arming and placement both reject an expired,
   missing, or failed receipt.
5. Create a tiny accepted paper decision and request an entry review. Confirm
   the live MCP descriptor admits only the intended long-equity buy limit,
   fractional quantity, GFD, and no extended hours.
6. Confirm `place_equity_order` is explicitly marked destructive and exposes a
   provider client-order/idempotency field. Absence is a failure.
7. Confirm the review and placement schemas admit a separate full-position
   equity `sell` stop order and a full-position equity `sell` market close.
8. Confirm `cancel_equity_order` is explicitly marked destructive and accepts
   one provider order identity. Unknown required fields, schema ambiguity, or
   unsupported enum values are failures.

Record only sanitized contract hashes and pass/fail reason codes. Do not record
raw descriptors if they contain account or provider identity.

The private-room **Live acceptance evidence** report must show
`read_acceptance_complete=true` and `safe_to_enable_live_flags=true` before the
flags are enabled. This read-only report aggregates sanitized DB receipts and
performs zero Robinhood order-tool calls; it does not approve or execute work.

## Attended live canary

1. Enable both live flags and restart one production instance. Confirm the
   control reports `supervisor_status=healthy`, a fresh supervisor heartbeat,
   `protective_exit_ready=true`, and a still-fresh provider-contract PASS.
   Confirm the evidence report advances to
   `ready_to_start_attended_canary=true`.
2. Start the attended live session from the visible private-room UI. Confirm
   the operator heartbeat becomes fresh and expires when the tab is hidden,
   closed, or the attended session is ended.
   Confirm the evidence report advances to `ready_to_arm=true` only while that
   visible heartbeat is fresh.
   Deliberately let the heartbeat expire before an order is approved: within
   the next supervisor cycle the durable control must disarm, activate its kill
   switch, clear presence, record `operator_presence_expired_relocked`, and
   make zero provider order calls.
3. Use the smallest provider-supported notional, never more than the hard $25
   cap. Confirm the current live account has no position and no open order.
4. Request a fresh entry review, type its exact approval phrase, type the exact
   placement phrase, and place once. Confirm the control relocks before the
   provider call and the approval cannot be replayed.
5. Reconcile from order history. Treat `submitted` as not filled and any lost
   response as ambiguous; never retry an ambiguous placement.
6. If the entry fills, confirm the supervisor raises the unprotected-position
   alert and keeps new entry placement locked.
7. Immediately request the separate sell-stop review, type its exact approval
   and placement phrases, then reconcile the stop as open. If the stop cannot
   be reviewed/placed promptly, use the Robinhood app to close the position.
8. Exercise one risk-reducing finish:
   - let the stop trigger and reconcile it filled; or
   - explicitly cancel and reconcile the stop, then review, approve, place, and
     reconcile the full-position market close.
9. Confirm the supervisor clears attention only after the risk-reducing exit is
   reconciled filled. Confirm a cancelled/rejected stop leaves attention active.
10. End attended mode and set both deployment flags back to `0` until the
    acceptance evidence is reviewed.
11. Confirm the final evidence report records one reconciled-filled tiny entry,
    one reconciled-filled risk-reducing exit, zero unresolved live exposure,
    and `acceptance_complete=true` before archiving the canary evidence.

## Pass evidence

Acceptance requires all of the following:

- sanitized successful read receipts for portfolio, positions, quotes, orders,
  and P&L;
- one immutable, fresh provider-contract PASS receipt proving the catalog was
  inspected with zero provider order calls;
- exact provider contract hashes for entry review/placement, exit
  review/placement, and cancellation;
- one entry reservation, provider result, and reconciliation chain;
- one separate protective-exit approval and reconciliation chain;
- proof that replay, stale approval, stale operator presence, stale supervisor,
  guest-room privacy, unknown schema fields, and ambiguous provider outcomes
  fail closed;
- one immutable `operator_presence_expired_relocked` event proving the
  attended-session dead-man path durably relocks without provider mutation;
- proof that the supervisor itself placed, cancelled, and reconciled zero
  orders.

Any missing evidence is a failed or incomplete acceptance, not implied success.
