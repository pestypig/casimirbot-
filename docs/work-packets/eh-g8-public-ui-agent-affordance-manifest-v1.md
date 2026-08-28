Program gate: G8 — environment-harness release evaluation
Workstream: Public-user UI capability discovery and cross-surface parity
Capability or component: Canonical public UI surface and affordance manifest for workstation panels, Helix Ask, Shared Live Rooms, account/session, mobile launch, and panel-internal controls
Lifecycle stage: tool admission; secondary stages are observation normalization, evidence re-entry, and presentation
Reaction timescale: none for static discovery and classification; monitor_only for UI state observation
Authority owner: the signed-in user owns interaction and consent; shared account policy owns public reachability; Helix owns capability admission, receipts, and terminal eligibility; each UI component owns only its local projection
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: exact public surface inventory; component-level interactive-control inventory; one classification for every public affordance; account-policy/gateway/route parity; no-orphan control audit; confirmation and receipt classification; focused deterministic tests; Helix Ask discipline quick check; environment-harness docs audit; compiled client or type/build verification
Explicit non-goals: developer-only panels or controls; new mutation authority; arbitrary DOM control; credential, pairing-material, hidden-state, or hidden-reasoning projection; private model/tool loops; prompt-specific action sequences; live-provider, keyed Ask, installed-node, browser-session, or MCP reconnect acceptance in this deterministic tranche
Downstream gate unlocked: the G8 public profile can expose one coherent agent-discoverable UI catalog and later prove installed MCP/UI catalog convergence without inventing per-component control paths

# EH-G8 public UI agent affordance manifest v1

## Scope and active-gate fit

This packet is a parallel G8 release-evaluation lane. It classifies the UI that
an ordinary `user` account can reach, including feature-gated room surfaces,
without perturbing open environment, connector, or installed-node prerequisites.
Developer-only panels and controls remain outside this packet.

The inventory includes:

- every panel in `HELIX_USER_WORKSTATION_PANEL_IDS`;
- workstation shell, tabs, panel host, launch, and mobile navigation controls;
- Helix Ask composer, action toolbar, runtime/model selectors, turn controls,
  approvals, pending-input controls, attachments, slash commands, history,
  debug-copy/export presentation, and voice controls available to users;
- Shared Live Room create/join/open/leave, participant, consent, capability
  grant, source binding, World Authority, Player Embodiment, pairing, media,
  runtime, visual-lane, and Emergency Stop controls that a user can reach when
  the room feature is explicitly enabled; and
- interactive controls inside public panels.

Room controls remain `user_feature_gated` while `shared_realtime_rooms` is
locked in the default user policy. Classification does not grant the feature or
weaken its account, room, source, subject, consent, lease, or confirmation
checks.

Patch classification: `tool admission` plus `presentation/discovery`. This work
does not own sampling, generic tool execution, retries, approvals, compaction,
session lifecycle, subagents, or terminal completion.

## Canonical classification

Every public affordance must be classified as exactly one primary interaction:

| Classification | Meaning |
| --- | --- |
| `observe` | Read bounded registered state or evidence without changing UI or external state. |
| `navigate` | Open, close, focus, select, expand, scroll, or otherwise change presentation only. |
| `configure` | Change a reversible preference, binding, scope, or operating setting. |
| `act` | Request an effect beyond presentation; admission, permission, and a typed receipt are required. |
| `human_only` | Deliberately unavailable to an agent; the manifest must name the stable reason. |

Each classified control also declares availability separately:

```text
shared_gateway
route_owned
client_local
user_feature_gated
blocked_pending_contract
not_applicable
```

`client_local` is not agent authority. `user_feature_gated` is not default user
availability. A capability or route name is not execution unless the current
account policy, source/room identity, permission class, affirmative intent, and
confirmation requirements all admit it.

## Delivery stages

| Stage | Status | Deterministic acceptance |
| --- | --- | --- |
| UI-0 packet and scope | complete | Packet freezes public surfaces, authority split, non-goals, and stop conditions. |
| UI-1 surface manifest | complete | All 15 public panels plus Ask, feature-gated room, shell, and mobile families have stable surface IDs and source ownership. |
| UI-2 control inventory | complete | The deterministic TSX inventory currently finds 396 controls across public roots and their static or statically analyzable dynamic delegated component imports. |
| UI-3 classification | complete | All 396 controls have unique canonical IDs plus explicit interaction and authority metadata. The distribution is 186 `act`, 150 `configure`, 42 `navigate`, 17 `observe`, and one disabled status indicator `human_only`. |
| UI-4 parity audits | partial | All 40 public policy capabilities classify as 36 shared-gateway plus 4 route-owned capabilities with zero policy orphans. `helix_public_ui_catalog` now projects all 396 controls through the OAuth-scoped composed MCP server without source/handler leakage; in-memory MCP tests cover listing, user-principal access, filters, scope denial, and nonterminal flags. Direct button-to-capability bindings and handler/receipt parity remain separately gated promotions. |
| UI-5 deterministic closure | complete | Generated-catalog drift checks, public UI audits, focused contracts, Ask discipline quick, environment docs audit, and the production client build pass. One pre-existing room-dialog fixture mismatch and the checkout-wide TypeScript error baseline remain separate from this packet; no keyed/live checks have run. |
| UI-6 live convergence | blocked by operator-started keyed server | Natural Ask/UI and authenticated MCP traces prove exact catalog, admission, re-entry, and presentation parity. |

## Stop/fail criteria

- A classification silently promotes a panel-local button into provider or MCP
  authority.
- A room control becomes public merely because it was inventoried.
- A capability appears agent-available without an executable same-turn path.
- A mutating or consequential control lacks explicit affirmative admission,
  permission/confirmation policy, typed receipt, or post-state verification.
- Credentials, pairing material, arbitrary DOM, raw hidden state, or hidden
  reasoning enter the manifest or an observation.
- A receipt, navigation result, or component projection becomes answer
  authority without the completed solver path.
- Deterministic work reaches a test that needs keyed localhost, browser session,
  live MCP catalog refresh, or installed-node state. At that boundary, stop and
  request the operator-started server rather than launching an unkeyed server.

## Deterministic verification

The narrow verification order is:

1. shared manifest schema and exact-scope unit tests;
2. TSX public-control inventory and no-orphan audit;
3. account-policy, gateway/route, permission, confirmation, and handler parity;
4. existing workstation affordance and provider contract tests;
5. `npm run helix:ask:discipline:quick`;
6. `npm run helix:environment-harness:docs-audit`;
7. the narrowest relevant client/server build or type check.

Live API parity, live-spine smoke, tool-chain matrix, installed MCP catalog
refresh, and browser-visible acceptance are reserved for UI-6 and require the
normal keyed server or another explicitly authorized live environment.

Current deterministic entry point:

```text
npm run helix:public-ui:audit
```

The control audit scans the public source scopes named by the shared surface
catalog and follows their static and statically analyzable dynamic component
imports while reserving Ask, room, shell,
mobile, and panel roots to one canonical owner. UI primitive implementations
are excluded; their rendered instances are classified at the owning surface.
Controls default to `client_local`; Shared Live Room controls default to
`blocked_pending_contract`. An explicit
`data-helix-capability-id` or `data-helix-route-contract-id` is required before
a control is reported as bound to agent authority. Labels, button text,
handlers, and lexical action cues never grant execution.

The capability audit independently joins the public account policy to the
registered workstation gateway and the typed route-owned exception list. Its
current 40 rows project agent commands from `helix.ask` onto public panel or
feature-gated room surfaces while preserving nonterminal observation and
model-reentry requirements.

`shared/helix-public-ui-control-catalog.generated.ts` is the corresponding
runtime-safe control artifact. `buildHelixPublicUiAgentCatalog()` combines it
with the surface and capability rows without source paths, line numbers,
handlers, credentials, pairing material, DOM state, or answer authority. The
audit fails when the generated artifact differs from the source inventory.

The composed MCP server exposes this observation as
`helix_public_ui_catalog`, requiring the ordinary agent-run read scope. Agents
may filter by public surface, interaction kind, and authority state. The room
filter therefore reports all 103 controls as `blocked_pending_contract`, while
Ask and panel-local controls remain `client_local` unless a future explicit
binding passes the control-to-policy audit. The tool cannot click, configure,
or execute a UI handler merely because it can describe that handler's public
control identity.

The durable implementation contract is
`docs/architecture/helix-public-ui-agent-affordance-contract-v1.md`.
