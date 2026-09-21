Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.ACCOUNTS / CFP-1.COMMERCE / CFP-1.OFFER D07 retained-population and mandatory-remedy audit
Capability or component: Ordinary and protected retained state, deletion/restore fences, billing evidence and operator remedy process
Lifecycle stage: read-only source audit before owner guard, qualified D11 terms and CFP-3 implementation
Reaction timescale: account/session expiry, trial reuse, room/action close, deletion, refund/dispute, security/rights incident and backup restore
Authority owner: CFP-1 coordinator reconciles two delegated audits; product owner later selects cost/admission guards; qualified D11 reviewers determine retention/remedy duties; CFP-3/4 implement and prove
Current maturity: specified gaps / `missing` and `D11_dependent` D07 rows
Target maturity: sourced ordinary/protected population guard and remedy case process with qualified retention and cost conditions
Required evidence: current schema/store/deletion behavior, existing T10/P50 and D04–D07 reserves, provider backup terms, qualified D11 return, numeric storage/row/cash bounds and independent review
Explicit non-goals: no data deletion, purge, migration, retention period, refund, customer remedy, provider setting, runtime edit, legal conclusion, final cost, stage promotion or D07 closure
Downstream gate unlocked: exact next owner-freeze inputs and CFP-3/4 fixtures; CFP-2/3 remain blocked

# CFP-1 D07 retained-population and mandatory-remedy audit v1

## Result

**The current code has validity and live-use limits, but no complete retained-
population bound or coordinated mandatory-remedy process.** Keep both D07 rows
open. Expiry is not deletion, a display query limit is not retention, and a
per-room or per-identity limit does not bound lifetime global population.

Two delegated read-only audits reached the same result. One inspected accounts,
identity links, billing, rooms, action evidence, local snapshots, deletion and
backups. The other inspected stop/revoke/status, deletion, refund, security/
rights repair, privacy preservation and existing support/cash reserves. No
runtime, database, provider or production state changed.

## Current source boundary

| Population or duty | Current source-backed behavior | Missing boundary |
| --- | --- | --- |
| Accounts and sessions | Session reads reject an expired row when `expires_at` exists. Guest room sessions use a 24-hour TTL. Other session creation paths may store `expires_at = NULL`. | No global account/session population cap, ordinary expiry purge or provider backup/deletion bound was found. |
| Credentials and identity links | Verification, reset and link intents have finite validity and are rejected after expiry. | Expired, consumed or revoked rows and distinct-key abuse remain unbounded populations without a cleanup/global creation guard. |
| Trial reuse | Product policy says a used trial stays used for the same verified identity after deletion/return. | No implemented consumed-trial ledger, finite privacy disposition, population cap or restore proof exists. Evicting the marker to free storage could silently re-enable a trial. |
| Billing/refund evidence | Sandbox webhook events are idempotently deduplicated; cumulative refund reversals are checked. Entitlement output returns only 25 recent rows. | The query display limit does not purge events or ledger rows. Current tables are sandbox credit infrastructure, not the selected subscription/trial process. |
| Rooms, invites and events | Rooms have two members; invites have finite expiry and redemption checks. | No lifetime row/byte/age cap or scheduled retention process was found for closed rooms, expired invites or room events. |
| Action and replay evidence | Authority, grant, request, result and replay structures preserve exact identity and reject stale/duplicate authority. | No global production row/byte/age bound was found. Independent eviction can lose deduplication, uncertain-effect or revocation evidence. |
| MCP observations | Each observation has `retained_until`. | The schema supplies a per-row date, not a demonstrated purge, global capacity or backup-deletion rule. |
| Local snapshots | Local compaction defaults bound several per-binding/per-subject arrays. | Snapshot limits are not production SQL quotas; per-identity limits do not bound identity count, and account/billing/room/action tables remain part of snapshot/restore scope. |
| Account deletion | `deleteAccountProfile` signs out sessions, soft-deletes profile storage, documents and account, and revokes credentials through sequential updates. | It reports deletion immediately without one durable case coordinating processor cancellation/refund, rooms/program grants, native release, required records and backups. A linked-provider upsert can clear account `deleted_at`, so return rules must be explicit. |
| Hard deletion | Billing tables use `ON DELETE CASCADE` from the account. | A future hard deletion could erase required payment deduplication/evidence; indefinite retention and indiscriminate cascade deletion are both unacceptable implicit policies. |
| Immediate control | Existing MCP operations expose workflow cancel/Emergency Stop, consent revoke and owner binding withdrawal. | They require installed/exhaustion/outage/deleted-session acceptance; they do not implement incident response, money return, deletion completion or evidence preservation. |

## Source fingerprints

| Input | SHA-256 |
| --- | --- |
| `server/services/helix-account/account-session-store.ts` | `29FC227AAB9E46F95C89BB2D12EA3D1E96C190C5328A625270D863DD7C1BB7A2` |
| `server/services/helix-account/billing-entitlement-store.ts` | `82ECD2751826E9F0F5FB4CE457D9E0608AB8EC205BA0F6EC955C7CCA3886E9DB` |
| `server/services/helix-account/profile-storage-store.ts` | `6DDEC3D3A907F426BBD511150BC867FF23F39547BF70668075146F12B7231225` |
| `server/db/client.ts` | `1F451ACD65A4E2AB7B5CC43C38CCF93CDFE9512E9F6B16D88A1CB6FF8B2860E3` |
| `server/mcp/helix-mcp-server.ts` | `3EF75F150C797888A7B3984CD6B85289823ABAAEFDDE632AD68D6CA02658965E` |
| `server/db/migrations/026_helix_accounts.ts` | `6CE49113ACC1D1FEC99304CCB0D7C4556690C7F8CF8573827FF14A6B9817AD35` |
| `server/db/migrations/030_shared_realtime_rooms.ts` | `DBE57DFF2D156E9CC1BA0C20EA3311B44A42C90708A464A041C8DB001DB324C7` |
| `server/db/migrations/046_environment_action_plane.ts` | `C9CADA5D8CA7A1F49690F99986D5C5FB4A71E842B24A019F0412587B9749735C` |
| `server/db/migrations/064_room_environment_capability_grants.ts` | `ABE3E9A2FDBBBCDE588162289FFE7243B0A34E8E9378B44A2129FC32AC53CE64` |
| `server/db/migrations/073_billing_entitlement_ledger.ts` | `3F12ABA072960D74D2844FF2B2AF7D058E6A4258A81C65DCBCBCC9047B2519BA` |
| `server/db/migrations/074_mcp_evidence_observations.ts` | `FB57671931D9429947FEA76EF5358A12EE78363A80B1E0D2788FE99316E785A8` |

These are mutable source fingerprints, not installed or production database
evidence. The absence of a trial table in the inspected account/billing/migration
scope is a source finding, not proof that no unrelated file contains the word
`trial`.

## Ordinary versus protected policy to freeze next

The next owner packet should freeze a **two-pool** policy:

1. **Ordinary retained state** covers regenerable presentation/history,
   expired sessions/intents/invites and settled operational data after its
   reviewed customer-use period. Give each class a qualified TTL plus per-
   account and global row, byte and creation-rate limits. Reserve its database,
   index, replica and backup upper bound before admitting work. At capacity,
   deny new ordinary enrollment, trial, room or effect creation with a typed
   reason; do not evict protected evidence to make room.
2. **Protected retained state** is narrowly limited to revocation/fence
   generations, consumed-trial denial evidence, payment/refund/dispute
   reconciliation, uncertain-effect/idempotency evidence, deletion progress and
   required security/privacy/rights preservation. It needs a separate numeric
   row/byte/backup/cash reserve and D11 retention/hold/release rules. Protected
   status is not an unlimited exemption and must have authenticated,
   idempotent creation controls.
3. When the protected reserve approaches exhaustion, pause every new admission
   that creates another obligation. Preserve local stop/native release and the
   bounded authenticated stop/revoke/status/reconciliation path. Escalate the
   incident and return D07; never drop an accepted duty or quietly increase a
   provider limit.
4. Restore admission remains closed until revocation, deletion, used-trial,
   payment and uncertain-effect watermarks reconcile. A stale backup may not
   revive a session, grant, trial or paid term.

The existing 5 MiB personal/live and 5/25 MiB sponsor-attributable retained-
data guards do not cover dormant identities, backups or excluded protected
records. Before a numeric freeze, measure serialized row/index bytes for the
selected schemas, declare maximum ordinary/protected populations, obtain
provider database/backup/replica rates and tax, and reconcile the result to the
existing `$200` Replit cash guard and D11 terms.

## Mandatory-remedy process

Use one durable, operator-owned case record rather than another reasoning or
agent runtime:

```text
received
  -> authenticated/triaged
  -> contained
  -> executing/reconciling
  -> pending_external_decision
  -> verified_closed
```

These are permitted states, not a requirement that every case visit every
state. A case may move from reconciliation to verified closure when no external
decision is needed; every skipped state and closure still needs a typed reason.

Record a case ID, protected account reference, category, owner, affected
service/charge/grant revisions, deadline source, performed operations and
evidence references, unresolved dependencies, next review time and customer-
visible status. Security containment, payment reconciliation, native release,
deletion and retention each need separate substates. A refund receipt or stop
receipt cannot close the whole case. Intake may precede identity proof;
disclosure and account mutation still require the appropriate verified route.

Current numeric planning inputs are **not a complete remedy bound**:

- 240 minutes / `$120` monthly routine support is separate.
- 120 minutes / `$60` monthly incident/manual-repair is a planning reserve.
- Two ordinary attended repairs already use 60 minutes / `$30` inside that
  incident reserve, leaving only 60 minutes / `$30` unallocated.
- 200 protected signing signatures are an earmarked release-repair reserve.
- The `$25` band between the `$75` internal pause and `$100` provider shutdown
  protects reporting/reconciliation headroom; it is neither guaranteed service
  availability nor professional/processor remedy cash.

Mandatory security, privacy, refund, deletion, rights and preservation work
continues or escalates when those planning reserves are exceeded. Exhaustion
pauses new admission and reopens D07. It never creates a paywall for a remedy,
weakens a stop/revoke path or authorizes unsigned/downgrade repair.

## Required CFP-3/4 fixtures

1. Ordinary support, sponsor PBT and internal provider admission are exhausted;
   stop/revoke/status and remedy intake remain available.
2. Deletion is interrupted after each subsystem operation; one fence and case
   revision resume without false completion or restored authority.
3. Reordered/duplicate refund and dispute events plus an operator action produce
   one money outcome and reconciled ledger/processor state.
4. An uncertain native effect remains unresolved beyond seven days without
   blind replay; held capacity and evidence remain visible.
5. Handoff/deletion filters private history and keeps former grants revoked
   across restore.
6. A security/rights repair uses the protected signing allocation after routine
   capacity is exhausted; exhausted protected capacity escalates instead of
   allowing unsigned publication.
7. A qualified preservation hold overrides ordinary expiry only for its exact
   scope; later release and deletion are auditable.
8. Backup restore preserves deletion/revocation/used-trial fences and does not
   recreate sessions, grants or paid eligibility.
9. Two simultaneous mandatory cases receive an explicit capacity/escalation
   decision; neither is paywalled or silently abandoned.
10. During an actual hosted-provider outage, or after the normal account session
    is revoked/deleted, local native release remains available. Remedy intake
    and status use an independently verified recovery route without reviving
    the account, session, room, grant or paid eligibility; no hosted-availability
    guarantee is inferred from the recovery route.

## Exit and status

This audit supplies the exact source gaps and next policy shape. It does not
select retention periods, population counts, storage bytes, backup factors,
professional response terms or a complete remedy cost. Those require owner
selection after measured/source-bounded inputs and qualified D11 conditions.
The retained-population and mandatory-remedy D07 rows remain `missing` and
`D11_dependent`. D07, D11 and final D12 remain open; CFP-1 remains active at
`specified`; CFP-2/3 remain blocked.
