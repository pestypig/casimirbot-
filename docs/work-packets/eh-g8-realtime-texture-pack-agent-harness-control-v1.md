Program gate: G8 — product closure, packaged desktop, and operator evidence
Workstream: Parallel packaged-desktop visual projection control lane
Capability or component: Realtime Texture Pack agent harness control
Lifecycle stage: tool admission and presentation
Reaction timescale: monitor_only
Authority owner: authenticated developer user; Image Lens owns capture and the active control lease
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: shared command contract; expiring profile-scoped lease; workstation-gateway manifests and receipts; OAuth MCP inspect/control tools; Image Lens enable/revoke UI; focused tests; Helix discipline quick check; environment-harness docs audit
Explicit non-goals: agent-selected capture sources; agent-started capture; raw pixel or prompt disclosure through control receipts; generated pixels as evidence; provider/API integration; environment action authority; private sampling or tool loops
Downstream gate unlocked: attended provider integration may reuse the control plane after RTP-5 selects an image provider

# Realtime Texture Pack agent harness control v1

## Why this is a parallel G8 lane

The active environment-harness program permits packaged-desktop closure work that
does not perturb open environment prerequisites. This packet governs an already
local, non-authoritative Image Lens projection. It does not change environment
adapters, World Authority, Player Embodiment, evidence admission, or the RTP-5
provider boundary.

Patch classification: `tool admission` plus `workstation-action presentation`.
Codex remains the sampling, tool execution, retry, and terminal-completion owner.
Helix only publishes typed capability admission, queues a bounded command, and
returns an observation receipt for model re-entry.

## Authority model

1. A developer manually chooses a game/window and starts local capture.
2. The developer explicitly enables **Agent harness control** in Image Lens.
3. Image Lens maintains a short-lived, profile-scoped lease while the control is
   mounted and capture remains active.
4. Helix workstation-gateway or authenticated MCP callers may inspect the lease
   or request `show_overlay`, `reveal_original`, or `stop`.
5. Image Lens polls, executes, and acknowledges the command. A queued receipt is
   never proof that the renderer changed.
6. Unmount, capture stop, account-policy loss, lease expiry, or user toggle-off
   revokes control. Capture start and source selection are never agent actions.

## Stages

| Stage | Status | Acceptance |
| --- | --- | --- |
| HC-0 packet and contract | completed | Packet and shared bounded types exist |
| HC-1 lease and Image Lens control | completed | Default-off UI issues heartbeat, executes commands, and fails closed |
| HC-2 workstation gateway | completed | Developer-only inspect/control capabilities return non-terminal receipts |
| HC-3 OAuth MCP | completed | Read/write-scoped tools use the same mailbox and expose no pixels or credentials |
| HC-4 verification | completed | Focused tests, discipline quick check, docs audit, and packaged desktop build pass |

## Verification evidence — 2026-08-27

- `12/12` focused UI, route, gateway-store, and MCP tests passed.
- The existing RTP contract/controller/overlay battery passed `15/15` with no
  unhandled asynchronous errors after the lease cleanup correction.
- Capability plan contract passed `75/75`; capability lifecycle ledger passed
  `8/8`.
- `npm run helix:ask:discipline:quick` passed. Classification was recorded in
  this packet as required by the guard.
- `npm run helix:environment-harness:docs-audit` returned `ok: true`.
- `apps/desktop npm run build:host` passed and emitted the main, preload,
  Realtime Texture Pack overlay preload, and bundled service artifacts. Four
  pre-existing duplicate-key/case warnings remain outside this packet.
- Targeted esbuild compilation passed for the MCP server, workstation gateway,
  and Image Lens control component.
- The repository-wide TypeScript check exceeded the default Node heap. An 8 GB
  rerun completed and reported the repository's broad pre-existing TypeScript
  backlog across unrelated CLI, document-viewer, physics, and test surfaces;
  it is not represented as a pass. Targeted compilation and tests for this
  packet remain green.
- The API parity matrix runner remained in collection/run without a verdict and
  was stopped after an extended wait; it is not represented as a pass.

## Stop/fail conditions

- Any path can start capture, select a source, or enable its own lease.
- A user/no-session account can access the experimental control capability.
- Commands remain executable after expiry, unmount, capture stop, or revocation.
- A queued command is represented as an observed renderer result.
- Raw captured/generated pixels, prompts, credentials, or hidden reasoning enter
  MCP or workstation observations.
