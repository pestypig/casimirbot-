# Timing budget boundary clarification

This supplements the earlier timing-measurement design; no execution boundary is changed.

Source inspection of TemporalPlanWindow distinguishes two obligations:

1. Reservation: canReserve requires the current tick strictly before stopTick,
   and both current and successor monotonic deadlines must remain valid.
2. Activation: after reservation, handoffAllowed requires the tick exactly equal
   to committedTick, with the current monotonic deadline still valid. The engine
   also enforces successor node deadlines during execution.

Consequently checkpoint-to-activation elapsed time includes intentional waiting
for the committed boundary. It must not be compared against the earlier stop
boundary as though it were delivery latency. Measure checkpoint-to-acceptance
and acceptance-to-activation separately, with the complete interval retained as
diagnostic context. The former measures the pipeline's delivery budget; the
latter checks the scheduled handoff, not a second provider latency allowance.

Existing temporal_successor_acceptance records accepted_client_tick,
accepted_monotonic_elapsed_ms and committed_client_tick, but lead_ticks means
committed minus accepted, not remaining pre-reservation stop runway. A full trace
must retain the exact source window to calculate the appropriate margin.

An accepted successor is still not executed evidence. No margin, model latency
estimate, heartbeat or successful HTTP response may override the native gates.
This clarification does not prove measured capacity or unlock ET6/NAV1.
