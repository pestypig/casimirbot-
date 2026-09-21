# CFP-1 Replit account-wide budget scope — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.OFFER / CFP-1.ENTITLEMENTS**
Capability or component: **D07 whole-platform cash guard and provider-budget scope**
Lifecycle stage: **Read-only account evidence before numeric selection or CFP-3 configuration**
Reaction timescale: **Monthly provider billing cycle and pre-dispatch admission**
Authority owner: **Product owner chooses total exposure; D07 specifies the bound; CFP-3 configures and verifies only after admission**
Current maturity: **specified**
Target maturity: **specified with an isolated provider scope or a complete shared-account reconciliation**
Required evidence: **Current provider scope, included credit and fixed/variable/tax mapping, all-workspace usage, delayed-charge buffer, internal admission threshold and safe recovery proof**
Explicit non-goals: **No account, budget, alert, payment, workspace, deployment, runtime or production change; no customer price or PBT allowance selection**
Downstream gate unlocked: **None automatically; D07, D11 and D12 remain open**

## Read-only account observation

The signed-in Replit **Settings → Account → Usage** surface showed an
`All workspaces` scope and an `Account usage` heading. It described credits
across subscription, credit-pack, promotional and additional balances and
showed both `Resource` and `AI` usage categories. The monthly-spending dialog
said that alerts and budgets control additional usage beyond included monthly
credit, showed the budget as `Not set`, and said reaching the limit suspends
services until the budget is increased or the next billing cycle begins. No
project or application selector was visible in that dialog.

The dialog was closed without pressing Save. Private sanitized evidence is at
`C:\Users\dan\.codex\private-evidence\cfp1\2026-09-21-cfp1-replit-budget-scope-read.md`,
SHA-256
`805C177C244D79F28FD24A0C695DCD58C0EBFD03CD3C187F1F87EF9CF41F9332`.
Account identity, balances, usage quantities, project inventory, domains,
credentials and payment details are excluded from this public record.

Replit's [production-database documentation](https://docs.replit.com/references/data-and-storage/production-databases)
also describes **Account usage** as the place to view every Replit App and its
per-app database detail. That supports using per-app breakdowns for allocation;
it does not establish an app-specific budget control.

## D07 decision boundary

The currently exposed provider budget must be treated as an
**account-wide/all-workspaces last-resort safeguard**. It is not a
CasimirBot-only limit. Unrelated Agent/AI work, publishing, databases or other
workspace activity can consume the same account allowance, and account-level
suspension can interrupt CasimirBot and other services together.

Therefore D07 may close the variable-cash/hard-cap row only through one of two
reviewed branches:

1. **Isolated provider scope.** Use a separately controlled provider account or
   billing scope whose observed budget and usage contain the paid CasimirBot
   deployment and its admitted support traffic, with no unrelated development
   or AI activity. Prove the isolation, effective budget, included credit,
   fixed charges, taxes and delayed/out-of-control buffer.
2. **Shared-account reconciliation.** Treat the Replit budget as a total
   all-workspaces ceiling. Reconcile every account-level category, reserve for
   unrelated use, allocate attributable CasimirBot units from per-app detail,
   and calculate admission from fresh remaining headroom. Unrelated Replit AI
   use is operator expense and suspension risk; it is not sponsor PBT and may
   not be represented as customer usage.

In either branch, the internal CasimirBot warning and admission-stop thresholds
must sit below the provider budget by the complete delayed-usage and recovery
buffer. Stale or unavailable account/headroom evidence fails closed for new
hosted work while preserving owner stop/revoke, native safe release and the
free personal path. The provider control remains too broad to implement
customer exhaustion or graceful per-room denial.

## CFP-3 acceptance handoff

After CFP-1 closes and CFP-2 succeeds, CFP-3 must:

- record which branch is selected and re-read its actual scope before setting a
  numeric budget;
- verify that no unmodeled workspace or AI use can silently consume customer
  admission headroom, or include that use in the shared-account guard;
- reconcile account total to per-app CasimirBot detail without double counting
  included/pre-purchased credit;
- simulate pre-threshold pause and provider exhaustion in a safe
  nonproduction/test scope without intentionally suspending production; and
- prove recovery does not reset trial, sponsor-term PBT, room lineage or
  verified-effect counters.

This observation strengthens the scope evidence but does not select a numeric
provider budget. The current value is unset and the complete all-input mapping
is absent, so D07's variable-cash/hard-cap row remains `missing`. D07, D11 and
D12 remain open; CFP-1 remains active at `specified`.
