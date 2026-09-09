Program gate: G8
Workstream: CS1/CS4 ordinary session recovery
Capability or component: finite private player transport recovery
Lifecycle stage: source admission
Reaction timescale: bounded setup
Authority owner: existing human player permission and authenticated MCP owner
Current maturity: specified
Target maturity: deterministically verified
Required evidence: live connector admission and unchanged permission after private handoff
Explicit non-goals: no permission renewal, gameplay, binding consent automation or ET6 promotion
Downstream gate unlocked: none

After the profile-recovery restart, the live Minecraft process remained PID
46268. Its native runtime status updated at 20:05:56.639Z, reported controls
released, and retained a last accepted heartbeat of 19:53:29.268Z. This aligns
with the prior one-hour pairing credential lifetime, while the human action
permission remained active until 20:52:15.349Z. Server inspection still reported
no manifest or heartbeat in the new service. No process restart was attempted.

One supported `helix_environment_player_pair_local` call at 20:06:36.299Z staged
an action-only credential with a 2,400,000 ms lifetime, shorter than the remaining
human permission. Idempotency key: `cs4-expired-player-transport-20260908-1`.
Pairing reference: `connector_pairing:5578f419-4ee3-4278-b5c4-0fc6229a6e1d`.
No pairing code or credential entered model context.

Subsequent authenticated inspection admitted the manifest at 20:06:37.853Z and
an active heartbeat at 20:06:47.927Z. It reported 21 capabilities, zero active
workflows, controls not asserted and ready for actions. Authority ID
`environment_action_authority:05934fca-87f1-4510-a8da-4be1d650f1cf`, policy 10,
manual-input cancellation and the original expiry were unchanged.

Ready up discovery returned the original run
`run_4dcfd185-c553-420c-b653-d343aed95aa9`, version 2, with its original room
binding and 02:17:42.635Z deadline. A same-task presence refresh then verified
that retained run. Native Agent Access displayed this exact run and room for
the restored local chat “Continuous session recovery”. Its include-run checkbox
and Bind current Helix chat button were left untouched for human review.
No old binding claim was reused. The earlier binding did not survive service
restart, and the current restored chat has not yet received human binding consent.

These are live setup observations, not an integrated movement trial. Remaining
work includes bound goal epoch recovery, full CS1/CS2 recovery and ingress cases,
three useful linked successors, interruption/revocation/stale/duplicate cases,
ordinary recovery limits and a complete CS5 reconciliation. ET6 remains unpassed
and NAV1 remains gated.
