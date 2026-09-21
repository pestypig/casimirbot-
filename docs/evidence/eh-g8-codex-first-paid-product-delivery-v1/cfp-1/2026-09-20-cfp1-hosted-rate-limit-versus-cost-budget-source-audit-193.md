Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.COMMERCE / CFP-1.OFFER D07 source boundary
Capability or component: Hosted-room request throttles versus durable sponsor-term PBT admission
Lifecycle stage: cost-reservation and request admission specification
Reaction timescale: before each hosted request, across process restart and concurrent instances
Authority owner: Product owner selects final capacity; commerce/hosting owner implements durable sponsor admission; financial/privacy reviewers check cost and retention
Current maturity: specified
Target maturity: specified with costed per-resource bounds and non-dispatchable CFP-3 fixtures
Required evidence: current room and limiter source, [PBT contract](../../../work-packets/eh-g8-cfp1-hosted-resource-budget-token-contract-v1.md), matched B/P/T or sourced conservative bounds, later multi-instance/restart fixtures
Explicit non-goals: no current quota claim, runtime or deployment change, numeric PBT allowance, price selection or stage promotion
Downstream gate unlocked: none automatically; D07/D11/D12 and CFP-3 remain controlling

# Hosted rate limits do not enforce a cost budget — 2026-09-20

At source HEAD `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93`, inspected worktree `server/routes/helix-shared-live-rooms.ts` (SHA-256 `548890e74c067136b5aab53c6f9861ca70c55a537c44144bb433b2bba1291b41`) creates a default 120-request/minute IP throttle, a default 240-request/minute principal throttle after authentication, and a default `256kb` JSON request-body limit. Environment variables can change these defaults; injected route dependencies can disable rate limiting for tests. `server/middleware/rate-limit.ts` (SHA-256 `c776f07656c60aeba48b037243a1d8b710fd1a1250020580d5ba932866dc2180`) stores counters in a closure-local `Map` and sweeps them in-process. It has no sponsor-term identity, monetary/unit conversion, durable remaining balance, shared multi-instance revision or reservation/settlement record. A restart or second process has a different map.

The current worktree `server/routes/environment-action-routes.ts` (SHA-256 `eb04093ad0d0a8d8f0a15c89da77c114a4abf491f2913b1274567cb1c75d8bd0`; **dirty from concurrent NAV work**) applies default 3,600-request/minute IP and authority throttles to its connector authority route and a `1mb` JSON body parser, with narrower `8kb` temporal successor routes. These are connector transport limits, not a sponsoring host's subscription budget. The worktree state and source hash are recorded so this observation does not assert that the dirty file equals HEAD or freeze its concurrent change.

**D07 consequence.** Request-count and body-size throttles constrain some traffic shapes but do not bound CPU work, responses, database active tails, storage, connection/idle cost, trial starts or paid/trial sponsor consumption in PBT. They cannot turn the historical mixed-workload Replit invoice into a per-host cost result. Do not price the proposed trial or subscription as if today's 120/240 or 3,600 rates were durable per-sponsor limits. The final D07 case still needs matched B/P/T usage or sourced conservative bounds for each material meter and cohort growth/peak-concurrency behavior.

**CFP-3 acceptance input.** Freeze a separate sponsor-term revision and short finite reservation/settlement path for each admitted hosted operation and connected-room lease, with durable shared state, source-tagged metering and independent hard CPU/deadline, request, egress, storage and concurrency bounds. Test two processes plus restart, room recreation, host handoff, burst/retry/denial work, a stalled provider meter, and exhaustion while owner stop/revoke and free personal use remain available. An IP/principal throttle may stay as an abuse guard; passing it must never substitute for sponsor budget admission. This is a planning fixture, not an implemented or tested quota.
