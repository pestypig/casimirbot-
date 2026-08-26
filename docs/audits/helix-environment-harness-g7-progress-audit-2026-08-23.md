# Helix environment harness G7 progress audit — 2026-08-23

Status: **deterministically verified; G7 remains active**

This audit records the first second-domain transfer increment. It is a dated
evidence snapshot, not the current roadmap. The canonical current status remains
`docs/helix-environment-harness-work-program-v1.md`.

## Scope and authority

The contrasting domain is the existing Robinhood private-room read plane. The
new northbound capability is `environment.brokerage.robinhood.read` through the
normal workstation gateway and `helix_brokerage_robinhood_read` through MCP.

The transfer remains deliberately narrow:

- active signed-in developer account and exact private-room turn required;
- owner profile and room derived from trusted server context;
- exactly one active owner-private binding resolved or selected by sanitized ID;
- only the existing reviewed read-tool allowlist is reachable;
- capability, producer epoch, connection, room, tool, schema, and freshness are
  rechecked after execution;
- normalized observations are credential-free, account-number-free,
  raw-payload-free, nonterminal evidence; and
- no review, approval, placement, cancellation, reconciliation, paper mutation,
  live-control arming, recommendation, scheduler, or resident controller was
  added.

Runtime Codex still selects the read capability and interprets current evidence.
Helix admits identity, permission, provenance, freshness, and terminal
eligibility. The observation and any G6 support-role artifact remain nonterminal.

## Implemented surfaces

- Shared capability and typed error identities in
  `shared/helix-brokerage-environment.ts`.
- Developer-only gateway manifest and executor in
  `server/services/helix-ask/workstation-tool-gateway/brokerage-read.ts`.
- Normal workstation catalog, gateway observation packet, lifecycle trace, and
  required post-tool model-step integration in
  `server/services/helix-ask/workstation-tool-gateway/registry.ts`.
- Provider-neutral MCP facade and generic room/environment-read OAuth scopes in
  `server/mcp/helix-mcp-server.ts`.
- Observer-only tripath audit in
  `server/services/environment-connectors/brokerage/g7-transfer-audit.ts`; it
  preserves canonical facts when a downstream projection claims “not executed”
  or substitutes terminal text, while exposing the contradiction for repair.
- Credential-free live receipt runner in
  `scripts/audit-g7-brokerage-transfer.ts`, which consumes three already-
  normalized route observations and emits the bounded differential audit.
- Deterministic account, room, binding, capability, producer-epoch, stale/future,
  mutation-denial, catalog, MCP, and lifecycle regressions.

The exact server-derived private-room binding now travels in the gateway/MCP
execution envelope and is required by the differential audit. The market-session
contract is deliberately `not_asserted` / `provider_observation_only` with
`execution_eligibility: false`; observation time alone never becomes a market
session or trading-authority claim.

The provider credential remains inside the existing brokerage adapter boundary.
Neither the model-facing manifest nor MCP accepts credentials, profile identity,
room-owner identity, producer epoch, account number, or mutation authority.

## Verification

| Check | Result |
| --- | --- |
| G7 gateway, registry, MCP, route, shared contract, differential audit, and retained G6 role tests | 42/42 passed |
| Terminal single-writer and evidence-reentry suites | 116/116 passed |
| Natural prompt-solving benchmark | 36/36 passed |
| Ask API parity matrix | 31/31 passed |
| Environment-harness documentation audit | passed |
| Helix Ask discipline quick check | passed |
| Production client/server build | passed with four unrelated existing duplicate-key/case warnings |

The production build's existing warnings are in `agi.demonstration.ts`,
`halobank-solar/derived.ts`, and two Starsim lanes. None is part of this G7
surface.

The deterministic receipt is
`artifacts/g7-second-domain-transfer/deterministic-verification-2026-08-23.json`.

## Keyed acceptance boundary

The keyed server was started only through the opaque
`start-myapp-for-codex` action, became ready at `http://127.0.0.1:1522`, and
returned healthy account-session, pipeline, and agent-provider responses with
Runtime Codex available. It was stopped when keyed testing ended.

The available in-app browser session was anonymous and not inside a private
room; Chrome's signed-in session was not exposed to the automation bridge. A
natural Robinhood prompt therefore received no brokerage capability, created no
provider observation, and failed closed with typed terminal output after Helix
blocked authority for missing current-turn observation. This is useful admission
evidence, but it is **not** live Robinhood acceptance. The visible typed failure
was generic rather than the executor's more actionable
`brokerage_auth_required`, which remains a presentation-quality follow-up and
must not be solved by exposing developer tools to anonymous users.

No account was created, no OAuth flow was changed, no Robinhood page was opened,
no credential was inspected, and no external provider read or mutation was
attempted.

A second keyed preflight used the existing authenticated CasimirBot MCP
connection after restarting the server through the opaque launcher. Its
sanitized device projection proved that the MCP principal and one private-room
identity remain usable. However, the Codex task's callable MCP catalog was
created before `helix_brokerage_robinhood_read` was added, so that connection
could not invoke the new tool without an MCP client reconnect. No token was
extracted and no arbitrary HTTP call bypassed the catalog. This narrows the
remaining setup to reconnecting the MCP client and verifying that the selected
room also has exactly one active owner-private Robinhood binding.

## Remaining work to close G7

With an already-authorized developer account, active owner-private room binding,
and current Robinhood connection:

1. Run one bounded factual read through the reference adapter.
2. Run the equivalent authenticated MCP read.
3. Run the same natural request through keyed Helix Ask.
4. Compare connection, room, capability, tool, producer epoch, observation ID,
   input/output hashes, observation time/freshness, evidence re-entry, supported
   Codex candidate, single-writer terminal selection, and presentation.
5. Confirm revocation/privacy invalidation still fails closed and that no
   mutation alias appears anywhere in the admitted catalog or trace.

Only that current live tripath evidence can promote this capability to `live
accepted` or `integrated accepted` and close G7. Deterministic verification does
not authorize a release-ready brokerage claim.

## Casimir verification applicability

Casimir verification was not applicable. This increment did not change warp/GR
physics, constraint packs, certificate semantics, training-trace export, or
physical proof maturity.
