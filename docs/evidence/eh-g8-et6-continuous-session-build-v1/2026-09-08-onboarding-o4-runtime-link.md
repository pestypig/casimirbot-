# O4 accepted pairing to runtime binding — partial evidence

Classification: evidence normalization and presentation. Durable runtime binding
projections now include an optional public `pairing_id`, derived exclusively from
the admitted durable row. Legacy bindings omit it. The private destination and
claim hash remain excluded. Service replacement changes the transient binding ID
but preserves this pairing reference and the original finite consent deadline.

The browser reads the current runtime binding without publishing it first. It
requires strict projection validation and matching accepted pairing ID, owner,
chat, run, active status and expiry. Only then does Agent Access receive it for
the existing Ready up surface. Missing/mismatched runtime state leaves pairing
acceptance intact and reports the unavailable runtime separately. Confirmed
revocation/expiry clears controls only for that pairing. Service-change guidance
now distinguishes durable recovery from a legacy show-once claim replacement.

Verification on 2026-09-08, approximately 21:32–21:34 local:

- `npx vitest run client/src/lib/agent-access/__tests__/durablePairing.spec.ts client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx server/services/local-supervisor/__tests__/pairing-runtime-binding.test.ts server/services/local-supervisor/__tests__/reasoning-task-binding-store.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`: 69 passed.
- After the terminal-control clearing change,
  `npx vitest run client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`: 36 passed.

New checks cover stable pairing reference across runtime replacement; exact
binding acceptance and mismatched pairing/owner/chat/run/status/deadline rejection;
and clearing the matching runtime controls on server-confirmed expiry. The MCP
suite exercises real encrypted-fixture transitions and runtime restoration, but
the rendered tests still intercept HTTP independently. This does not close the
joined O5 matrix or establish real native/host/EXE operation.

Remaining includes unified legacy/durable guidance, persisted binding consumers,
replacement/event recovery, other guarded binding consumers, full discipline
and package verification, automatic host delivery, O5/O6, original CS1–CS4 exits
and final CS5 handoff. No original ET6 acceptance or NAV promotion is claimed.
