Program gate: G8
Workstream: O2/O5 durable replacement within CS1-CS4 prerequisite onboarding
Capability or component: explicit consented predecessor replacement and durable non-resurrection
Lifecycle stage: source admission; evidence re-entry; presentation
Reaction timescale: human-reviewed issuance and atomic acceptance
Authority owner: human names replacement scope; authenticated destination accepts; Helix persists and enforces the transition
Current maturity: specified
Target maturity: deterministically verified replacement contract plus later packaged rehearsal
Required evidence: explicit reviewed predecessor, atomic commit/replay matrix, restart and concurrent replacement negatives
Explicit non-goals: no implicit revoke-all, latest-task selection, consent bypass, private provider loop, ET6 substitution or NAV1 unlock
Downstream gate unlocked: none

# Durable pairing replacement implementation contract

This bounded subpacket implements an unmet requirement of
[the onboarding plan](eh-g8-cs-onboarding-pairing-plan-v1.md), under
[the canonical environment work program](../helix-environment-harness-work-program-v1.md).
It changes no current maturity or active-gate claim. It does not authorize live
human-only controls or replace any CS1-CS4 exit.

## Inspected boundary

As inspected September 12, PairingInvitationService's strict request schema
contains request ID, registration, chat, optional environment, and two durations.
PairingApproval similarly contains destination, chat/environment, scope, policy
revision and durations. Neither identifies a predecessor to replace. Two human
approvals therefore cannot safely be interpreted as permission to revoke every
other grant in a chat. Distinguish independent grants from explicit replacement.

PairingLedgerRepository atomically updates one encrypted ledger row per CAS and
flushes afterward. It does not provide a transaction spanning predecessor and
replacement. DurableReasoningBindingAccess re-reads the accepted grant on access;
that is the existing enforcement point to reuse. A transient binding epoch alone
cannot establish durable supersession after service restart.

Do not insert a sequential `revoke(old); accept(new)` shortcut: failure between
those writes would violate preservation of the healthy predecessor. Reversing
the two calls would expose two current grants and leave ambiguous recovery.

## Required reviewed scope

1. Replacement review names the exact predecessor pairing ID and its observed
   revision, the exact new registered destination, chat, optional room/run,
   communication scope and finite deadlines. The UI explains when the old grant
   will stop working. No latest-task fallback or silently inferred predecessor.
2. Only the existing authenticated human issuance route can approve replacement.
   Include the predecessor in the encrypted approval, request-id conflict checks,
   consent provenance and public review projection. Reject changed predecessor
   or destination on retry; possession of an invitation is not new consent.
3. Initial replacement issuance validates predecessor owner, installation and
   chat plus current destination registration and environment eligibility.
   Issuance itself leaves the old grant usable. Invalid, pending, denied or
   expired new invitations do not invalidate it.
4. Preserve the existing independent invitation path. Do not impose a new
   singleton-per-chat policy by inference from this replacement feature.

## Atomic transition and recovery requirements

On acceptance, reauthenticate the exact destination, validate secret and finite
approval, and revalidate the reviewed predecessor. Commit acceptance and an
irreversible supersession record as one atomic durable operation. Bind that
record to both exact IDs/revisions and the reviewed owner/chat relation. The
storage design must work with the actual embedded and PostgreSQL backends;
in-memory locks alone cannot prove durable atomicity or multi-process safety.

Only one concurrent replacement may consume a given predecessor revision.
Competing acceptance fails with a stable conflict and does not weaken either
grant. An independently revoked/expired predecessor cannot be silently revived
or overwritten. Reconcile a lost commit reply from committed state before
reporting acceptance; never mint another invitation or extend its deadline.

All restore, Ready up, prompt, read and acknowledgement admission must reject
superseded grants through the existing durable access layer. Replaying an old
acceptance must not restore its authority. Revoking or expiring the replacement
must not bring its predecessor back. Preserve historical records for diagnostics
without treating them as current authority or exposing invitation secrets.

## Required deterministic proof, before production rollout

| Case | Required invariant |
| --- | --- |
| Wrong owner/chat/installation/predecessor revision | Reject before any durable change |
| New target invalid, registration changed, or scope retry conflict | Healthy predecessor remains byte-identical |
| New invitation pending/denied/expired | No predecessor supersession |
| Valid acceptance | Exactly one accepted replacement and one durable predecessor supersession |
| Two concurrent replacements | Exactly one wins; loser cannot become current after restart |
| Concurrent predecessor revoke | No old resurrection; no response claims authority from an invalidated predecessor |
| Failure before encryption/write | Neither grant changes |
| Failure within commit or persistence barrier | Atomic outcome or typed unknown result; reconcile by same request/IDs |
| Lost successful response | Replay reports the same committed relation and original deadlines |
| Restart/new service epoch/native store restore | Superseded predecessor rejected; valid replacement recoverable |
| Replacement revoke/expiry | Neither predecessor nor replacement supplies active authority |
| Stale old acceptance/read/prompt/Ready up | Exact typed rejection, zero dispatched effects |
| UI pointer/keyboard and late response | Reviewed predecessor visible; failed replacement preserves old display; successful replacement changes only the affected identity |

Exercise public HTTP/MCP handlers and real encrypted persistence, not only policy
functions. Use injected fixture human/provider identities and isolated keys;
production handlers gain no bypass flag. Native storage and real PostgreSQL
atomicity need evidence matching their actual transaction behavior; pg-mem passing
tests alone cannot establish PostgreSQL concurrency guarantees.

Stop before enabling replacement if the persistence primitive cannot prove the
atomic invariant on the supported embedded backend. Do not weaken the invariant
to two best-effort writes. Record unavailable live measurements as null and
retain every original CS and O6 acceptance requirement.
