Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.COMMERCE / CFP-1.OFFER D07 source-boundary audit
Capability or component: Proposed hosted room-hour and verified-effect cost ceilings
Lifecycle stage: offer specification before price/limit selection
Reaction timescale: one monthly sponsor interval and one seven-day no-card trial
Authority owner: Product owner selects terms; CFP-3 commerce/room/action owners implement limits; financial reviewer validates cost case
Current maturity: specified
Target maturity: specified with costable, versioned limit and denial fixtures
Required evidence: actual current room, billing and action source; proposed counters and B/P/T cost inputs
Explicit non-goals: no production meter, customer entitlement, payment, room/action mutation or stage promotion
Downstream gate unlocked: none

# D07 hosted-cap source boundary — 2026-09-20

A read-only source audit at HEAD `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93` found that the working **20 paid / two trial active room-hours** and **100 paid / ten trial verified effects** are neither current entitlement fields nor enforced quotas. They remain measurement envelopes in the [pilot assay](../../../work-packets/eh-g8-cfp1-hosted-pilot-price-and-capacity-assay-v1.md), not limits an ordinary host can buy or start today.

| Current source | What it establishes and does not establish |
| --- | --- |
| `server/services/helix-ask/realtime-room/room-store/rooms.ts` and `server/db/migrations/030_shared_realtime_rooms.ts` | A room is created under an owner profile with maximum two participants, creation/update/close timestamps and membership. There is no sponsoring term, summed active/pause interval or sponsor usage counter. Two participants do not imply one room per paying host. |
| `server/services/shared-live-room-control/service.ts` | A temporary **guest** host is restricted to one nonclosed room; ordinary authenticated room creation does not check the proposed sponsored one-room cap or paid/trial term. |
| `server/services/helix-ask/realtime-room/runtime-registry/state.ts` and related transport/runtime state | Active runtime state and `started_at` exist in process memory; they are not a durable sponsor-term active-hour ledger across restart or handoff. |
| `server/services/helix-account/billing-entitlement-store.ts` and migration `073_billing_entitlement_ledger.ts` | Current sandbox plans, periods and credit balances support the older credit experiment. They do not represent a seven-day no-card hosted trial, a sponsoring host term, room-hour use or verified-effect capacity. |
| `server/services/environment-connectors/actions/action-broker.ts` | Durable action request/result identities and row-locked canonical result handling can help distinguish duplicates. The broker does not atomically reserve sponsor effect capacity before dispatch or settle verified successful effects against a hosted term; action-authority effect budgets are a separate native safety boundary. |

Other seven-day duration, run-budget and invite-token fields in the source govern setup or separate sessions; they are not Shared Live Room trial or paid room-hour caps. [Replit's publishing billing guide](https://docs.replit.com/billing/about-usage-based-billing) meters Autoscale CPU, memory and requests, and production database active hours/storage. Its database remains active five minutes after a request. [Replit's publishing-cost guide](https://docs.replit.com/billing/deployment-pricing) describes request-based Autoscale activity. Therefore an advertised room-hour/effect cap alone cannot bound CPU time, request volume, egress, storage, idle tails or support effort. The previously observed private database rate supports only a database sensitivity, not a whole-offer upper bound.

For a **CFP-1 conditional cost case**, declare a finite per-sponsor-term room interval and effect ceiling plus separately bounded request, runtime, data-retention, egress and support assumptions, with one source/rate and sensitivity for each cost input. Price selection may be provisional against those specified future controls; it must not imply today's system enforces them. The CFP-3 acceptance handoff must durably associate every room with a sponsor term/revision, reserve capacity atomically before a guest effect, hold uncertain outcomes, settle only one verified native postcondition, account active/pause intervals across crash/reconnect and explicit host handoff, and deny over-limit actions at all hosted entrypoints before dispatch. Per-action safety authority and two-person room capacity remain independent checks. An installed trial/paid claim awaits those tests and the rights-cleared guest action.

This audit identifies an enforceability dependency, not a new amount or financial verdict. D07 still lacks matched B/P/T marginal resource data or sourced upper bounds for all missing inputs, an owner-selected price/final limits and qualified financial review. D11/D12 and CFP-1 exit remain open; CFP-1 stays active (`specified`), CFP-2/3 blocked and G8 active.
