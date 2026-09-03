# EH-G8 PNA3.5 finite agent onboarding and recovery v1

Program gate: G8 — environment-harness release evaluation
Workstream: provider-neutral external-agent onboarding and recovery
Capability or component: PNA3.5 — one-start Codex/CasimirBot harness onboarding, finite diagnosis, and truthful recovery guidance
Lifecycle stage: account admission → native transport start → authenticated client readiness → exact task attachment → optional reasoning binding → recovery or release
Reaction timescale: immediate UI diagnosis; bounded native recovery with the existing three-attempt policy; one explicit host-owned catalog refresh when required
Authority owner: the signed-in developer starts full harness scope for the current desktop session; the native desktop owns tunnel process recovery; Codex owns its MCP catalog and task lifecycle; CasimirBot owns readiness projection, exact binding identity, diagnostics, and fail-closed guidance
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: one Start Harness entry point shared by desktop and browser/node surfaces; native full-scope start only after explicit operator activation; automatic safe readiness refresh; restoration of an existing exact binding; finite phase/reason/action projection; no replacement-task loop; no automatic Codex UI operation or OAuth approval; sanitized diagnostic export; focused component/state tests; desktop typecheck; client build; Helix Ask discipline quick guard; environment-harness documentation audit
Explicit non-goals: no Codex UI puppeteering; no automatic provider-task creation; no credential projection; no hidden reasoning; no automatic OAuth consent; no environment, Minecraft, brokerage, answer, or terminal authority; no claim that restarting a native tunnel refreshes a loaded Codex catalog
Downstream gate unlocked: one installed-node usability acceptance measuring time-to-ready and exact recovery instructions from signed-in launch through a bound external task

## Decision

PNA3.4 proved the lifecycle but exposed avoidable onboarding friction. Existing
authority and recovery primitives are retained. This packet adds one finite
orchestrator and presentation surface that composes those primitives without
gaining their authority.

The initial Start Harness activation means:

- select the supported Codex client profile;
- on a native desktop, request the existing `full_helix_agent` session scope;
- on browser/node surfaces, perform read-only readiness diagnosis only;
- re-read authenticated readiness and any current exact reasoning binding;
- stop at a typed actionable phase; and
- never repeat a host-owned MCP reload or create a replacement task.

The orchestrator may retry only readiness reads that are side-effect free. It
must not retry OAuth, provider-task creation, environment effects, or Codex
catalog operations. Native tunnel recovery remains owned by the existing
desktop recovery supervisor and its three-attempt ceiling.

## Patch classification

```text
source admission
evidence normalization
presentation
Codex-owned runtime behavior only at a host/catalog boundary that remains external
```

## Acceptance matrix

| Starting state | Harness action | Required projection |
| --- | --- | --- |
| native desktop, configured tunnel stopped | explicit Start Harness invokes the existing full-scope native start once | starting → checking; no second consent prompt |
| native desktop, read-only tunnel ready | explicit Start Harness upgrades once to current-session full scope | checking; existing OAuth and capability gates remain unchanged |
| native desktop, full tunnel ready | start is idempotent | readiness refresh only |
| browser/node surface | no native tunnel mutation | readiness diagnosis and exact next action |
| signed out | no tunnel or binding claim is treated as readiness | sign-in action |
| OAuth inactive | no implicit consent | authorize action |
| catalog stale after authorization | no restart loop | one host-owned same-task MCP reload instruction |
| client absent or unattached | no invented client/task | connect-current-task instruction |
| current exact binding exists | restore it from server state | binding status and revoke/check controls remain available |
| native recovery exhausted | no unbounded retry | manual-intervention reason plus sanitized diagnostic export |

## Verification plan

1. Add a pure finite onboarding diagnosis contract with exhaustive fixtures.
2. Integrate Start Harness into Agent Access using the existing native bridge.
3. Add a sanitized, credential-free diagnostic export.
4. Verify desktop and browser/node paths independently.
5. Run focused tests, desktop typecheck, client build, discipline quick guard,
   and the environment-harness documentation audit.

## Stop/fail criteria

Stop without promotion if the flow starts full scope without an explicit user
activation, retries beyond existing bounds, claims Codex catalog adoption from
a tunnel receipt, hides a required host action, exposes credentials or provider
content, mutates an environment, or turns diagnostics into answer or terminal
authority.

## 2026-09-03 implementation checkpoint

Agent Access now exposes `Start Harness` before the six-step fallback. On the
native desktop bridge, that explicit click calls the existing
`full_helix_agent` start exactly once and then performs an authenticated
readiness read. In a browser/node surface, the same button performs diagnosis
without native mutation. Existing exact reasoning binding state is still
rehydrated from the server after readiness, so reload does not hide Check or
Revoke controls.

The Codex profile's catalog-recovery contract now names
`client_restart_or_reconnect`, matching the supported same-task recovery and
removing the stale `new_chat_required` signal. Visible instructions remain
bounded to one in-place server reload or at most one Codex restart while the
same task and keyed service are retained; CasimirBot does not perform or claim
the host-owned catalog action.

`Copy diagnostics` exports only finite phase, readiness axes, sanitized native
tunnel/recovery state, and binding status/epoch/transport. Opaque profile,
client, thread, conversation, and binding references are omitted. The export
asserts no provider-task creation, Codex UI automation, credential, provider
content, hidden reasoning, answer authority, or terminal eligibility.

Focused onboarding/profile tests pass 15/15. Existing Device Check, tunnel,
transition-executor, and desktop-host security tests pass 31/31 after repairing
one stale assertion that still expected two loopback listeners instead of the
current fail-closed three-or-four-listener packaged contract. The Helix Ask
discipline quick guard, desktop TypeScript check, production client build,
unpacked EXE build, and packaged service-boundary smoke pass. The real
browser/node surface loaded the rebuilt client, displayed Start Harness, stopped
at the exact current-task connection step with no native mutation, and copied
sanitized diagnostics.

The workstation was brought above the unchanged 4 GiB physical-headroom guard
by closing only the verified Minecraft client, launcher and idle loopback
server, then trimming (not terminating) verified Codex and keyed-server working
sets. The rebuilt unpacked EXE passed its isolated packaged-launch smoke with a
full service-ready receipt, three expected loopback listeners, protected
provider-key vault, isolated state and unchanged protocol registration.

A new packaged Agent Access smoke then drove the real Electron renderer through
its native preload bridge. `Start Harness` settled in 11.527 seconds and the
copied diagnostic passed all sanitization and authority checks. Its disposable
profile was intentionally unconfigured, so `TunnelStatus=unconfigured` and the
local-supervisor scope are truthful fail-closed evidence, not a full-tunnel
success claim. Configured stopped/read-only/full transitions and the
three-attempt exhaustion boundary are covered by the deterministic native and
component suites. The combined focused onboarding, profile, tunnel,
transition-executor and recovery-supervisor battery passes 36/36.

PNA3.5 is therefore `deterministically verified`. A signed-in installed-node
time-to-ready measurement remains the downstream integrated usability
acceptance; it is not inferred from the isolated packaged smoke.
