Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding and binding repair
Capability or component: O2 validate replacement before invalidating a healthy binding
Lifecycle stage: source admission
Reaction timescale: synchronous claim preparation
Authority owner: human reviews pairing; Helix validates exact replacement and current binding
Current maturity: implemented
Target maturity: deterministically verified for rejected replacement preservation
Required evidence: failing preservation fixture, repaired store and route regressions
Explicit non-goals: no durable supersession claim, production consent automation, private runtime loop or ET6 substitution
Downstream gate unlocked: none

# Rejected replacement must preserve the current binding

The previous goal increment was progress: it repaired acceptance versus
revocation during the durability barrier. Inspection for the next O2 recovery
boundary found that the legacy `issueClaim` path superseded existing bindings
before validating the complete replacement projection. It also consumed a
binding epoch before validation. These operations are synchronous, but a thrown
validation error left partial state changes behind.

The new fixture first creates and claims a healthy binding. Replacement attempts
with an invalid mission reference, multiline run reference and invalid numeric
expiry must throw while preserving the exact prior binding. Existing steering
must remain usable, and the next valid claim must advance the epoch only once.

An initial test authoring error read `.binding` from `inspect`, which already
returns the projection; that error was corrected before recording the product
reproduction. The corrected red run had 12 passed and 1 failed: the prior binding
changed from active to superseded and gained a revocation timestamp.

The repair constructs and validates the full new projection first. Only then
does it supersede prior rows and commit the new epoch/binding/handle. Valid
replacement behavior and the successful claim protocol remain unchanged.
The running EXE has not been rebuilt or changed by this source patch.

Verification command:

```powershell
npx vitest run server/services/local-supervisor/__tests__/reasoning-task-binding-store.test.ts server/routes/__tests__/agent-connections.test.ts server/services/local-supervisor/__tests__/pairing-runtime-binding.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Result: 32 passed (13 store, 16 route, 3 durable-runtime component tests), exit 0.
The new invalid-input race/order assertion is store-level. Route regressions
exercise existing public behavior; they do not establish that a production
browser request can bypass its earlier validation and trigger this exact defect.
This is not a reproduction or resolution of the user's native checkbox report.

Quick discipline passed and inferred no sensitive files for these paths; that
static classifier is not proof of identity/authority correctness. Successful
identity formats, live-source identity and continuation behavior did not change.
Full discipline is not used as a universal gate for this rejected-draft repair.
Casimir verification is outside this non-physics patch's scope.

## Outstanding replacement design and goal scope

The durable ledger still permits independently accepted grants for the same
owner/chat. Transient binding epochs are not a durable replacement order.
The outstanding O2 implementation needs an explicit, consented replacement
relation or equivalent atomic durable selection, validation before retirement,
and rejection of old-grant restoration after restart. Merely choosing the latest
in-memory binding, revoking all old grants before validating a new target, or
silently treating all grants as interchangeable does not meet the requirement.

Pending, expired or rejected replacement invitations must preserve a healthy
accepted pairing. Concurrent replacements, lost commit replies, account/device
changes and revocation of the replacement must not resurrect the old grant.
This document records the gap; it does not claim a replacement policy exists.

All CS1-CS4 exits, O1-O6 deterministic/browser/packaged requirements and the CS5
handoff remain required. Original ET6 remains unpassed. No navigation lane is
dispatched or unlocked. The September 12 setup/race evidence and September 8
CS5 reconciliation remain scoped prior snapshots, not a completed handoff.
