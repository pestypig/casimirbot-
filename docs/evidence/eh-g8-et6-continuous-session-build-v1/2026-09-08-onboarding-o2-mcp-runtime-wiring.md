# MCP durable binding restoration and steering

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission and evidence re-entry. Isolated handler evidence.

MCP acceptance and secret-free recovery now restore the current-service reasoning
binding when that store is available. The binding retains the original grant
deadline and exposes continuation availability from actual current presence.
Absent presence yields unavailable transport, not invented task activity.

The existing MCP Ready up/preparation and temporal-admission paths now use the
awaitable durable access layer. Prompt submission, steering pickup and acknowledgement
also use it. Every durable operation rechecks installed-device/account readiness,
current authenticated issuer/client/installation identity and the encrypted grant.
The access layer requires an explicit destination authorizer; no default consent
or identity bypass exists. Action authority and environment evidence checks remain
independent prerequisites in the existing services.

The joined real-handler test now restores a runtime binding from the accepted
browser-issued grant, registers fixture presence, submits one agent-origin prompt,
replays it without another event, picks it up and acknowledges it. It then rejects
pickup when device trust is denied, and rejects pickup/submission after browser
revocation. The grant exchange still uses fixture credentials, in-memory MCP
transport and an isolated encrypted pg-mem repository, not a supported real host
delivery bridge or live human consent.

Browser grant status reports runtime availability as null for an accepted grant
until the browser integration can verify it. It does not falsely report inactive
merely because the ledger read did not inspect the runtime projection. Pending and
revoked grant results retain false runtime eligibility.

```text
npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts server/services/local-supervisor/__tests__/durable-reasoning-binding-access.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
31 tests passed
npx vitest run server/routes/__tests__/agent-connections.test.ts server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
45 tests passed
```

The repeated MCP cases are not additional unique coverage. The earlier full
discipline result predates this wiring; the required broader check remains pending
for the completed runtime integration. Browser dispatch/display/Ready up, visual
binding consumers, replacement policy, renderer controls and packaged recovery
still need integration and verification. No EXE was rebuilt or launched.
CS1-CS4 and final CS5 remain incomplete, ET6 unpassed, and the independent NAV-EQ
lane is not dispatched by this goal.
