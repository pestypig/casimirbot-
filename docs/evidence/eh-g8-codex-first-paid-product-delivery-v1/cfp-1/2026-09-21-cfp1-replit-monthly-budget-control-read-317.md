Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.COMMERCE / CFP-1.OFFER D07 provider spend control
Capability or component: Replit account-level additional-usage alert and monthly budget control
Lifecycle stage: owner-authorized read-only account inspection before numerical selection or configuration
Reaction timescale: one provider billing interval and provider-triggered service suspension
Authority owner: Product owner selects final operator exposure; D07 specifies mapping; CFP-3 later configures and verifies only after admission
Current maturity: observed provider control path, unconfigured
Target maturity: selected amount mapped to the complete D07 cash envelope, configured in an admitted stage and independently verified with recovery evidence
Required evidence: authenticated Manage limits dialog, current budget state, provider-described exhaustion behavior and access-controlled private digest
Explicit non-goals: no budget/alert/account mutation, no provider suspension, no final amount, no public price, no D07/D11/D12 closure or stage promotion
Downstream gate unlocked: CFP-1 may specify the provider-budget mapping and CFP-3 acceptance fixture; current cash/hard-cap row remains open

# CFP-1 Replit monthly budget-control read — 317

Date: 2026-09-21  
Method: account-owner-authorized, read-only browser inspection. The dialog was
opened and closed without entering a value or activating Save.

## Observed account state

- Replit's Usage page exposes a **Manage limits** dialog for additional usage
  beyond the monthly credit included with the plan.
- The account has a usage alert, but its value is omitted from repository
  evidence because it is not a hard control or CFP-1 term.
- The current monthly usage budget is **not set**.
- The dialog states that after a configured usage budget is reached, services
  are suspended until the budget is increased or the next billing cycle begins;
  it presents this as protection against extra charges.
- No Replit account, billing, deployment, alert or budget setting changed.

## Product and accounting implication

This observation proves that an account-level provider budget path exists. It
does **not** prove a current hard cap because no amount is configured. It also
does not establish that every fixed, tax, plan, storage tail, delayed meter or
other charge is governed by that control. The dialog frames the budget around
**additional usage**, so the internal whole-project cash ceiling cannot be
copied directly into the provider field without a reviewed mapping.

The provider budget is a last-resort operator safeguard. Reaching it may suspend
the hosted service broadly, so it cannot serve as sponsor PBT, customer
entitlement, graceful per-request admission or the primary exhaustion
experience. CasimirBot must pause new trial/onboarding and hosted dispatch
before the provider threshold, preserve local stop/revoke/native release and
free personal operation where technically independent, display a truthful
outage state, and reconcile restoration without resetting trial/PBT/effect
counters.

## Evidence custody

The sanitized private record is stored outside the repository at
`~/.codex/private-evidence/cfp1/2026-09-21-cfp1-replit-monthly-budget-control-read.md`.
Its SHA-256 digest is
`055DE4C299461532D160CAE7501A220D315F41D9A4F934B426CB7543B3C531A0`.
No account identifier, payment instrument or detailed usage amount appears in
this public record.

## Required follow-through

1. D07 must select a total Replit cash-exposure ceiling and separately derive
   the provider **additional-usage budget** after fixed/unavoidable charges,
   included credit treatment, tax and any meters outside the control are known.
2. D11 financial review must confirm the customer and operator treatment of a
   provider suspension, pending work, refunds/remedies and restoration.
3. CFP-3 may configure the selected amount only after CFP-1/2 admission, then
   re-read the saved value and capture a safe simulated or non-production
   threshold/recovery fixture. It must not intentionally suspend the production
   service merely to prove the control.
4. The platform warning and internal admission thresholds must remain below the
   provider suspension threshold with a reviewed buffer for delayed usage.

Until those steps pass, `Replit variable cash / hard cap` remains `missing`,
the `$200` whole-project line remains a planning ceiling, and CFP-1 remains
active at `specified`.
