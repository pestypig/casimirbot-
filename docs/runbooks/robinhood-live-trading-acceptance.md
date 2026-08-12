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

## Read and schema acceptance

1. Connect the Agentic account and attach the exact read capabilities to the
   private room.
2. Read portfolio, equity positions, equity quotes, equity order history, and
   realized/daily P&L. Verify that public receipts contain no raw account
   number, credential, or provider payload.
3. Confirm that exactly one account is labelled Agentic. Ambiguous or missing
   account identity is a failure.
4. Create a tiny accepted paper decision and request an entry review. Confirm
   the live MCP descriptor admits only the intended long-equity buy limit,
   fractional quantity, GFD, and no extended hours.
5. Confirm `place_equity_order` is explicitly marked destructive and exposes a
   provider client-order/idempotency field. Absence is a failure.
6. Confirm the review and placement schemas admit a separate full-position
   equity `sell` stop order and a full-position equity `sell` market close.
7. Confirm `cancel_equity_order` is explicitly marked destructive and accepts
   one provider order identity. Unknown required fields, schema ambiguity, or
   unsupported enum values are failures.

Record only sanitized contract hashes and pass/fail reason codes. Do not record
raw descriptors if they contain account or provider identity.

## Attended live canary

1. Enable both live flags and restart one production instance. Confirm the
   control reports `supervisor_status=healthy`, a fresh supervisor heartbeat,
   and `protective_exit_ready=true`.
2. Start the attended live session from the visible private-room UI. Confirm
   the operator heartbeat becomes fresh and expires when the tab is hidden,
   closed, or the attended session is ended.
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

## Pass evidence

Acceptance requires all of the following:

- sanitized successful read receipts for portfolio, positions, quotes, orders,
  and P&L;
- exact provider contract hashes for entry review/placement, exit
  review/placement, and cancellation;
- one entry reservation, provider result, and reconciliation chain;
- one separate protective-exit approval and reconciliation chain;
- proof that replay, stale approval, stale operator presence, stale supervisor,
  guest-room privacy, unknown schema fields, and ambiguous provider outcomes
  fail closed;
- proof that the supervisor itself placed, cancelled, and reconciled zero
  orders.

Any missing evidence is a failed or incomplete acceptance, not implied success.
