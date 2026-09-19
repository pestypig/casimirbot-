Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.ENTITLEMENTS / CFP-1.ACCOUNTS trial start proposal
Capability or component: Seven-day no-card hosted-trial clock and retry boundary
Lifecycle stage: account admission and presentation specification
Reaction timescale: one durable activation, then seven-day server clock
Authority owner: Product owner selects the trigger; verified account service records it; room/connector owners consume only current eligibility and separate grants
Current maturity: specified
Target maturity: specified with owner-selected trigger and frozen CFP-3 negative cases
Required evidence: owner decision, verified identity contract, database transaction/retry design, accepted hosted benefit availability and installed account/room tests
Explicit non-goals: no implementation, account mutation, payment, trial activation, rights clearance or stage promotion
Downstream gate unlocked: none automatically

# Hosted-trial start proposal — 2026-09-19

The owner selected a seven-day no-card trial, an action-inclusive benefit and [provisional limits](2026-09-19-provisional-hosted-trial-limits-owner-selection-48.md), but has **not selected its start trigger**. A question comparing explicit activation, first room creation and first verified shared action is pending. Use **explicit Start Trial activation** as a working design proposal only; do not record it as an owner selection or final customer term without an answer.

Before activation, the signed-in host should see the exact seven-day duration, proposed start/end time, provisional room/guest/program/effect limits, no-card/no-auto-charge rule, supported action and applicable readiness/rights status. Do not offer activation until at least one paid-benefit guest action is accepted and commercially cleared on the deployed connector/profile. Mere sign-in, Google linking, download, room creation, invitation or personal MCP use would not start this proposed clock. An activation attempt while the hosted service or authoritative trial store is unavailable would fail without consuming eligibility.

The proposed server operation authenticates a verified sponsor identity, checks one-time eligibility including approved provider links and deletion/re-enrollment history, then atomically creates one `started_at`, `ends_at = started_at + 7 × 24 hours`, trial revision and quota record. A repeated or concurrent request returns that same interval and revision; it cannot reset the clock or create a second allowance. If the response is lost after commit, account status reveals the committed trial instead of restarting it. Local timers and client redirects are presentation only. The trial state supplies hosted **eligibility** for selected operations; current room membership, each person's processing consent, the program owner's exact grant, connector lease and native-effect checks remain separate.

At the boundary, reject new trial-sponsored hosted admission; stop/revoke and identity-protected recovery remain available, and free personal MCP tools remain unaffected. The owner still must select outage pause/credit, in-flight action settlement, handoff counter semantics, conversion, retention and final limits. No trial expiry may create a charge. CFP-3 acceptance should include two concurrent activation calls, uncertain response/retry, same verified identity after deletion and linked-provider return, different same-email subject, unavailable store, expiry clock tamper, account switch and no-card/no-checkout assertions.
