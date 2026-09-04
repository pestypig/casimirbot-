# Helix public UI agent-affordance contract v1

## Purpose

Every control reachable from the public `user` workstation must be
deterministically discoverable without making the DOM an execution authority.
The same contract covers public panels, Helix Ask, Shared Live Rooms when the
feature is enabled, workstation shell controls, and the mobile launcher.
Developer-only panel roots are outside this catalog.

## Required control metadata

Every rendered control owned by a public surface declares:

```text
data-helix-control-id
data-helix-interaction-kind
data-helix-authority-state
```

`data-helix-control-id` is unique in the canonical source inventory. The
interaction kind is exactly one of `observe`, `navigate`, `configure`, `act`,
or `human_only`. Authority is classified independently:

```text
client_local
blocked_pending_contract
shared_gateway
route_owned
not_applicable
```

Interaction metadata describes what the visible control does. It never grants
permission or tool admission. `client_local` means the control has no agent
execution contract. Room controls remain `blocked_pending_contract` until an
explicit room/participant/source/subject/lease/confirmation contract exists;
each control graduates individually only after the full binding checklist
passes. The first graduated room controls are shared-handler
`room.floor.acquire`, exact-epoch `room.floor.release`, and the owner-exact,
authority-reducing `environment.action_authority.revoke` emergency stop; the
room feature gate remains unchanged. MCP acquisition additionally requires its
signed delegation artifact. Revocation requires the exact owning profile,
room, environment binding, and action-authority identity. These route bindings
do not transfer browser-session authority to an MCP caller.

## Source ownership and delegated components

The canonical public surface catalog owns the 15 public panel roots plus Ask,
room, shell, and mobile roots. The inventory follows component imports from
each public panel so that wrapper panels cannot hide controls in delegated
components. A source file reserved by another public root keeps that canonical
owner, preventing reused Ask components from becoming duplicate panel-owned
controls. Generic UI primitive implementations are excluded; `Button`,
`Input`, `Textarea`, selection, switch, and related instances are inventoried
at their owning component.

## Capability projection is separate from DOM discovery

Public capability discovery joins account policy to the shared workstation
gateway and the typed route-owned exception list. A capability row identifies
its command surface, projected UI surface, permission, confirmation posture,
mutation posture, terminal ineligibility, and required model re-entry.

A visible control may declare `data-helix-capability-id` only after all of the
following are true:

1. The control invokes the same operation described by the registered
   capability, rather than a merely similar panel-local handler.
2. The capability is allowed by public account policy and projects to the same
   public or feature-gated surface.
3. Permission and confirmation behavior match the manifest.
4. Mutating or consequential execution returns a typed receipt and bounded
   post-state observation.
5. The observation remains nonterminal and re-enters the model when the action
   participates in an Ask turn.

Route-owned controls use `data-helix-route-contract-id` and must meet the same
identity, policy, receipt, and terminal-authority requirements. Text, labels,
handlers, prompt cues, and screen-visible capability names never satisfy this
promotion checklist.

## Runtime-safe agent catalog

`shared/helix-public-ui-control-catalog.generated.ts` is the machine-readable
public control catalog. It is generated from the canonical source inventory and
contains only:

```text
control_id
surface_id
account_scope
interaction_kind
authority_state
capability_id (only when explicitly bound)
route_contract_id (only when explicitly bound)
```

It deliberately excludes source paths, line numbers, handler expressions,
arbitrary DOM state, credentials, pairing material, and hidden reasoning.
`buildHelixPublicUiAgentCatalog()` combines those controls with public surfaces
and the policy-audited capability projection as a nonterminal observation
document. `helix_public_ui_catalog` exposes that document through the composed
MCP server under `HELIX_AGENT_RUN_READ_SCOPE`. It supports exact surface,
interaction, and authority filters and is declared read-only, idempotent,
non-destructive, and closed-world. The tool returns policy metadata only: it
does not control the DOM, invoke handlers, or turn `client_local` and
`blocked_pending_contract` rows into executable capabilities.

The MCP result remains a nonterminal observation with `assistant_answer=false`,
`answer_authority=false`, and `terminal_eligible=false`. Live installed-client
catalog convergence, reconnect behavior, and browser-visible parity still
require the operator-started keyed environment.

## Deterministic development procedure

For every public UI change:

1. Add the control beneath a cataloged public root or its delegated component.
2. Give it a stable semantic control ID and explicit interaction/authority
   metadata. The annotation and classification scripts can generate a safe
   starting point; review consequential controls before handoff.
3. Run `npm run helix:public-ui:audit`. The command fails for missing or
   duplicate IDs, implicit classifications, generated-catalog drift, policy
   orphans, or uncataloged route-owned exceptions. Static imports and
   statically analyzable dynamic component imports are both traversed.
4. Run focused component tests for changed Ask, room, mobile, or panel behavior.
5. Run `npm run helix:ask:discipline:quick` for Ask-sensitive changes and
   `npm run helix:environment-harness:docs-audit` for harness acceptance or
   maturity documentation.
6. Reserve keyed MCP catalog convergence and browser-visible parity for the
   operator-started authenticated local server.

The repair helpers are intentionally separate from runtime behavior:

```text
npx tsx scripts/annotate-helix-public-ui-control-ids.ts --write
npx tsx scripts/classify-helix-public-ui-controls.ts --write
```

They only insert or update metadata. They do not add handlers, grant account
permissions, register tools, bypass confirmation, or execute UI actions.
