# Pairing prerequisite diagnostic repair

Classification: evidence normalization. Authority requirements are unchanged.

The restored MCP attempt returned pairing_registration_device_trust_required.
Inspection found that this error also represented missing installation identity,
an unavailable readiness reader, a missing delegated account session, or missing
account-link readiness. It could therefore misdirect an operator to repeat device
consent when another prerequisite was absent.

The shared authenticated pairing-destination validator now distinguishes those
five boundaries in prerequisite order. Installation, device trust, account session
and account-link failures remain 403; unavailable readiness returns 503. The actual
readiness conditions are unchanged, and a failed condition never opens registration
storage. No principal, credentials, scope, consent or deadline is changed.

Five new isolated real-MCP-handler cases assert the precise first failure, no
storage factory invocation and no installation identifier in the returned error.
The focused six cases (including successful durable registration) passed. The
complete local-supervisor coordination suite then passed 35/35 in 32.23 seconds:

`npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

`npm run helix:ask:discipline:quick` passed static checks on the dirty checkout;
its broad changed-file classification is not integrated acceptance.

This repair is source-only; the running status-recovery package still has the
generic error. The exact live failing prerequisite remains unproved until the
new diagnostic runs in that environment. It does not fix the Chrome handoff,
provide missing OAuth scope or grant trusted-device approval. All CS1–CS4/O1–O6
exits remain incomplete; the requirement-level CS5 handoff remains mandatory.
ET6 remains unpassed and NAV1 unqualified.
