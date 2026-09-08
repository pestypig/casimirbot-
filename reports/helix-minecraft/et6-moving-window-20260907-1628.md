# ET6 live moving-window diagnostic

Exact request `action_request:et6-window-20260907-1626-root`, workflow `workflow:et6-window-20260907-1626-root`, plan `plan:et6-window-20260907-1626-root`; existing reasoning binding epoch 2 and run `run_9a38524a-e0f7-4c94-bee8-d214da937161` retained.

Caller errors were rejected before admission: missing action completion conditions, then reuse of the preceding root's tool-call identity. Completion conditions and explicit intermediate checkpoints were added; the tool-call identity was made unique. No validation or identity gate was weakened.

The corrected finite back/forward timing course was admitted. It started at 16:27:44.524260900Z and reached `workflow.failed` at 16:27:55.537512400Z with controls released. Native measurements show 222 scheduler/active-control ticks, 11013 ms sequence wall time, zero stalled ticks, zero successor polls and zero reconciliation polls. Walks 0 through 10 completed; `walk11.execute` timed out. Twelve required checkpoints were satisfied. The first checkpoint occurred at plan-relative tick 150; final elapsed plan time was 372 ticks, beyond the caller's 360 latest-start bound for the last action. Thus the caller failed to budget the measured clock-to-start delay into its schedule.

The immediate post-admission frontier returned `no_current_verified_checkpoint`. No successor was submitted against absent evidence. This does not by itself establish why the checkpoint publication/poll path remained unavailable. Retained workflow progress events showed repeated explicit checkpoints, but zero temporal polls throughout the approximately eleven-second execution: inspect delivery fences and projection timing next, separately from the caller's late-start failure.

At snapshot 16:28:26.935Z the canonical request status was failed, with no action-result row yet. This is not grounds to restart the service; inspect subsequent retained delivery state. Connector readiness was fresh, active workflow count zero and controls asserted false. Fresh post-action perception re-entered this task at position (-5.79, 65, -0.19), grounded, health 20, with evidence `environment_probe_evidence:e8a2a63a4a7e307e50cdf9e771562745a326bdb5`.

Rolling successors proven: zero. No ET6 promotion or NAV1 unlock. This diagnostic produced real sustained execution evidence and a caller timing failure, not capacity acceptance.
