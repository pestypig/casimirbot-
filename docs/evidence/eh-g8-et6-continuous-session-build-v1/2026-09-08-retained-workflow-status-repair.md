Program gate: G8
Workstream: CS3/CS4 ordinary result observation
Capability or component: Exact workflow status and retained terminal evidence
Lifecycle stage: evidence normalization
Reaction timescale: post-action read
Authority owner: authenticated room participant and active player authority
Current maturity: implemented
Target maturity: deterministically verified component and packaged rehearsal
Required evidence: preserved native observation, historical provenance, target/revoke/queue negatives and MCP transport
Explicit non-goals: no gameplay, private execution loop, authority widening, timestamp refresh or acceptance promotion
Downstream gate unlocked: none

The live calibration in `2026-09-08-cs3-live-calibration.json` completed, but
the supported workflow-status tool returned only the native client's
`not_running` observation. Reading the local durable snapshot separately was
necessary to recover the succeeded result, its measurements and control-release
record. That diagnostic filesystem read is not an ordinary packaged workflow.

The status gateway now consults retained evidence only after an authenticated,
eligible native `not_running` observation for a status request. It returns
`retained_result` separately, preserving the original timestamp, provenance,
release measurement and evidence references. The native observation is unchanged.
The summary explicitly says recorded release is historical and does not prove
current control state. Neither observation has answer or terminal authority.

The reader verifies the exact room, participant, environment and active authority
before and after the result read. Invalid provenance, wrong workflow/request,
mismatched outcome and a concurrent request reject. Multiple requests under one
workflow remain ambiguous; caller timestamps are not trusted to order a rolling
chain. The fallback returns no result in that case. A future exact chain-terminal
locator is still required for complete rolling-workflow inspection. Cancel,
Resume and Emergency Stop retain their existing paths.

Verification: 34/34 tests passed across retained-workflow-status (10), workstation
environment-action-control (8) and MCP Minecraft action boundary (16). The reader
tests use a real pg-mem request table with injected identity/result readers;
they are not full production-database integration. Static quick discipline and
scoped whitespace checks passed. The MCP fixture verifies both observations
survive the output schema. No native adapter or authority contract changed.

This source repair is not in the running session-recovery EXE. No package was
restarted or re-paired for it. CS1–CS4 remain incomplete and CS5 remains an
incomplete handoff reconciliation. ET6 is unpassed and NAV1 gated.

The same turn's bounded spatial inspection found 225 complete columns around
(0,65,2), with walls at z=8, partial walls at z=-4 and z=4, and no support at
z=9 inside the inspected bounds. These historical observations constrain future
course planning; they are not permission to traverse unobserved space. No new
movement or linked successor was submitted during this source repair.
