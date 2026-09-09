Program gate: G8
Workstream: O2 under CS1-CS4 onboarding repair
Capability or component: finite pairing ledger state policy
Lifecycle stage: source admission
Reaction timescale: deterministic state transitions with injected clock
Authority owner: future authenticated admission and server-owned persistence; this policy grants neither
Current maturity: specified
Target maturity: deterministically verified prerequisite
Required evidence: finite independent deadlines, exact identity, idempotency and revocation tests
Explicit non-goals: no authentication proof, durable storage claim, live route change, production consent automation or integrated acceptance
Downstream gate unlocked: none

Added `pairing-ledger-contract.ts` as the server-internal record/transition
contract for the planned durable ledger. It separates invitation expiry from
pairing expiry and omits ephemeral presence/service session IDs from durable
destination identity. The destination includes issuer, profile, installation,
client and exact task. Approval includes exact chat, optional room/run, steering
scope, policy revision and explicit finite durations. Deadlines are fixed at
approval time and cannot be extended through acceptance, replay or reads.

Fifteen ordinary tests pass for accepting after 301 seconds, invitation boundary
instants, accepted-pairing lifetime, unchanged idempotent replay, every destination
substitution, owner isolation, revocation before/after acceptance, sanitized
projection, tampered deadlines/scopes and clock rollback across transitions.
The policy does not prove the actor, verify an acceptance secret, persist a row
or perform an atomic commit. Those responsibilities remain mandatory in the
authenticated ledger service and durable repository before any live exposure.
No API accepts a caller's self-asserted human consent through this module.

The combined command passes 22 cases: 15 new policy cases plus the O1 baseline's
three isolation passes and four expected legacy failures. The legacy store is
unchanged by this increment, so those expected failures are deliberately not
converted to ordinary passing tests yet.

```text
npx vitest run server/services/local-supervisor/__tests__/pairing-ledger-contract.test.ts server/services/local-supervisor/__tests__/pairing-onboarding-contract.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Next: server-owned encrypted persistence and transactional acceptance with fresh
authenticated stable-destination admission; then integrate routes/MCP and UI.
No EXE rebuild/restart is justified by this unwired prerequisite alone. O2 and
all CS1-CS4 exits remain incomplete. ET6 remains unpassed and NAV1 gated.
