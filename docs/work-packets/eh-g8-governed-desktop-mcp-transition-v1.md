Program gate: G8 — environment-harness release evaluation
Workstream: Installed multi-surface harness convergence and governed MCP bootstrap
Capability or component: Short-lived developer delegation for native read-only/full MCP tunnel transition
Lifecycle stage: Read-only client presence, user delegation, native revalidation, transport transition, reconnect, expiry, revocation, and read-only recovery
Reaction timescale: Human delegation plus bounded seconds-level transport transition; never environment tick control
Authority owner: Exact signed-in native developer profile, current desktop service epoch, and the strongest currently provable native-tunnel client presence binding
Current maturity: implemented
Target maturity: deterministically verified private pilot
Required evidence: exact active-presence binding; developer-only consent; 30–300 second revocable lease; account-session and service-epoch isolation; replay-safe request execution; native account revalidation; response-drained transition; immutable nonterminal receipts; no credential or private-endpoint projection; full-mode failure, lease expiry, revocation, restart, and Emergency Stop return to read-only; separate OAuth and environment grants after reconnect; adversarial deterministic tests; installed-node acceptance deferred to its explicit live packet
Explicit non-goals: no independent external-client cryptographic identity claim before managed bearer relay or client-bound proof exists; no self-grant; no ordinary-user delegation; no persistent full mode; no model-provider, connector, brokerage, trading, room, source, World Authority, Player Embodiment, shell, filesystem, browser, or terminal-answer authority; no port-based bootstrap; no G8 closure from deterministic tests
Downstream gate unlocked: Native broker/UI integration and later installed-node managed-client catalog refresh acceptance

# EH-G8 governed desktop MCP transition v1

## Classification

This packet is `tool admission` plus native lifecycle control. Helix owns the
identity, delegation, scope, receipt, and terminal-eligibility contracts. The
native desktop owns the tunnel process transition and safe fallback. Codex
continues to own tool-result re-entry, reconnect decisions, session lifecycle,
and terminal completion.

## Identity boundary

The current owner-private desktop tunnel authenticates one native desktop MCP
principal. A server-derived continuation and active presence can isolate tasks
within that principal, but the tunnel does not relay an independently
authenticated external Codex bearer to Helix. Therefore this packet deliberately
labels its binding
`native_tunnel_client_plus_server_derived_continuation` and reports
`independent_external_oauth_client_bound=false` on every request and receipt.

That is sufficient for a bounded single-owner private pilot only. It is not
evidence that two mutually untrusted external clients sharing the same native
tunnel are cryptographically isolated. Release acceptance of that stronger
claim requires managed bearer relay or another client-bound proof.

## Procedure

1. The read-only MCP client registers a current server-derived presence and
   requests a `full_helix_agent` transition for one declared task.
2. Helix records a pending, nonterminal request bound to the service epoch,
   native MCP client ref, derived client session, continuation, profile, and a
   hash of the native account session. The task summary is inert and unverified.
3. The first-party UI revalidates the signed-in native account as `developer`
   and grants a 30–300 second delegation. MCP cannot grant its own delegation.
4. The bound MCP client presents the exact request and an idempotency key.
   Helix admits only tunnel transport transition and emits a nonterminal receipt.
5. A bearer-protected native loopback broker revalidates the developer account,
   returns acceptance so the MCP response can drain, then transitions the native
   controller. No endpoint, token, tunnel ID, runtime key, or account-session ID
   appears in renderer/model/MCP output.
6. The external client reconnects and refreshes its catalog. Full `/mcp` still
   requires its own OAuth scopes, while every room, source, environment action,
   lease, approval, and brokerage boundary remains unchanged.
7. Expiry, revocation, restart, Emergency Stop, or full-start failure stops full
   mode and restores the read-only coordination/Device Check tunnel.

## Receipt authority

Transition requests and receipts are observations, never assistant answers.
They always report `answer_authority=false`, `assistant_answer=false`, and
`terminal_eligible=false`. A transition receipt cannot prove that a reconnect
succeeded, that a catalog refreshed, or that any downstream tool is authorized.

## 2026-08-29 deterministic implementation record

Implemented without starting a repository server, opening a port for acceptance,
controlling the installed EXE, or touching the live tunnel:

- The read-only MCP surface now exposes request, inspect, and execute tools only
  when the service-epoch transition store exists. Request and execute scopes are
  distinct; neither tool can grant its own delegation.
- The in-memory state machine binds the native account session, developer
  profile, native MCP client ref, server-derived client session, continuation,
  and service epoch. It enforces one open request per task identity, a bounded
  record capacity, 30–300 second leases, target-bound idempotency, expiry,
  revocation, and hash-linked append-only nonterminal receipts. Identical
  execute replays never resubmit the native transition; revoked, expired, and
  failed requests cannot replay a prior acceptance.
- The first-party Device Check surface lists only requests belonging to the
  exact active developer account session. Same-origin grant/revoke operations
  use a fixed 120-second UI lease and state all authority exclusions plus the
  current external-client identity limitation.
- Device Check is not in `HELIX_USER_WORKSTATION_PANEL_IDS`; it remains an
  installed developer service-management surface. These controls therefore do
  not enter or change the public-user 20-surface/398-control catalog. Direct
  route access still fails closed for a user account.
- The service receives a separate exact-loopback broker origin and 32-byte
  bearer through the child environment. It never reuses the provider credential
  broker, desktop session secret, tunnel runtime key, or process arguments.
- The native broker admits one strict transition envelope. Full-mode requests
  revalidate the active developer account through the signed-in Electron
  session, return a 202 acceptance before a 750 ms drain delay, stop the current
  tunnel, and start the requested mode. Failure and lease expiry attempt a
  read-only restart. Downgrade is admitted after expiry because it cannot
  escalate authority. Concurrent identical native requests coalesce to one
  scheduled transition, while request-ref reuse with a changed envelope fails.
- Developer revocation requests read-only through the native broker. Admitted
  environment action and command Emergency Stop paths revoke open leases and
  asynchronously request the same downgrade without delaying the environment
  stop itself.

Deterministic evidence:

- `server/services/local-supervisor/__tests__/desktop-mcp-tunnel-transition-store.test.ts`,
  `tests/desktop-mcp-tunnel-transition-broker.spec.ts`,
  `tests/desktop-mcp-tunnel-transition-route-boundary.spec.ts`, and
  `tests/desktop-mcp-tunnel-transition-executor.spec.ts`: 14/14 pass.
- `server/routes/__tests__/desktop-mcp-tunnel-transition.test.ts`: 2/2 pass
  for cookie/session, exact-origin, developer consent, grant, and revocation.
- `server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts`:
  11/11 pass, including absent presence, separate consent, exact binding,
  nonterminal receipt flags, and broker acceptance.
- `client/src/components/__tests__/DeviceCheckPanel.spec.tsx`: 5/5 pass,
  including no POST before the native user click and the exact grant payload.
- Existing command-authority and workstation action-control regression suites:
  6/6 pass after Emergency Stop downgrade integration.
- `npx tsc -p apps/desktop/tsconfig.json --noEmit`: pass.
- `npm run build:server` and `npm --prefix apps/desktop run build:host`: pass;
  the build reports pre-existing duplicate-key/case warnings outside this slice.
- `npm run helix:ask:discipline:quick`: static checks pass. Its warning concerns
  an unrelated pre-existing Ask presentation change in the dirty worktree.
- `npm run helix:environment-harness:docs-audit`: pass, active gate G8.
- `npm run helix:public-ui:audit`: pass with the unchanged public-user
  inventory of 20 surfaces, 398 controls, and 40 capability projections.

This record does not advance the packet to `deterministically verified`.
Remaining evidence includes durable signed receipt storage beyond the current
service-epoch hash chain, an actual native broker socket/process transition,
installed EXE execution, real response drain and reconnect, managed-client
catalog refresh, and the stronger independent external-client identity proof.

## 2026-08-29 alpha.11 installed read-only bootstrap evidence

- The desktop package advanced to `0.1.0-alpha.11` so the installed provenance
  does not silently replace the earlier alpha.9 evidence snapshot. The local
  unsigned installer SHA-256 is
  `adec06e9a6a32d26fd33c4bee31a1c1c1f8b49f4973d8ff9bc9f4a7691bdf396`.
- Production renderer construction completed after the installed alpha.10
  process tree was shut down gracefully to preserve the 95% host-memory hard
  stop. Runtime-tree verification passed with 611 renderer files, renderer
  SHA-256 `6b538ebe5ad90b86864fe11a02d45d0266894d07a06edf7d5ebae19407d878d3`,
  runtime-manifest SHA-256
  `7033bec09351f4c2825e56a4d1e1a91715a07bb3756780efb5aa0448359381c0`,
  and pinned tunnel-client 0.0.13 SHA-256
  `83f08fb39b1c154747debd31b81b65dd4ee834cacf5a073b6301b2688699bc76`.
- A startup gap was found live: restart reset the selected scope to read-only
  but left the configured tunnel stopped. The native host now auto-starts only
  an already-configured read-only tunnel after exact active developer-account
  revalidation. It never auto-starts full mode, grants a delegation, or admits
  a user account. Focused executor and host-security tests pass 14/14, and the
  desktop TypeScript gate passes.
- The installed EXE matches the packed EXE byte-for-byte, reports
  `0.1.0-alpha.11`, produced a fresh service-ready receipt, started exactly one
  pinned tunnel-client process, and returned HTTP 200 from the official tunnel
  health and readiness probes. No fixed port 1522 listener or ad hoc Node
  server was used; the native host retained its private ephemeral loopback
  child boundary.
- The read-only MCP catalog attached to the active Codex continuation and
  returned the public-user catalog live. Exact serialized comparison against
  `buildHelixPublicUiAgentCatalog()` matched all four projections: 20 surfaces
  (`3783` bytes, FNV-1a-64 `a953722eef883c9c`), 398 controls (`91564` bytes,
  `be2dea0a9080cf55`), 40 capabilities (`14961` bytes,
  `41a8be8bd7ca8b01`), and the complete core catalog (`110472` bytes,
  `43941b49ef5762ee`).

This evidence proves installed read-only bootstrap and public-catalog
convergence. It does not prove the governed full-mode broker transition: the
current Codex connector schema exposed the pre-existing read-only tools but not
the three newly registered transition tools. A connector cache refresh/new
thread and an actual leased request/delegate/execute/reconnect trace remain
required before promoting this transition packet beyond `implemented`.
