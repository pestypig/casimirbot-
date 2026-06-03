# Stage Play Live Interpretation Boundary

Stage Play uses the existing Live Answer environment machinery as a display sink, but the product model is Live Interpretation.

Terms:

- Live Interpretation: deterministic projection from current observations.
- Checkpoint Request: a bounded request for model reasoning.
- Helix Ask Checkpoint: the visible Ask turn that reasons over the Stage Play graph.
- Answer Snapshot: the model-reviewed answer for one checkpoint only.
- Perturbation: a new observation or state change that may stale a snapshot.

Stage Play projection may update these Live Interpretation lanes:

- situation
- actor_state
- resources
- affordances
- risk
- possibilities
- rehearsal
- unknowns
- next_check
- debug_basis

Stage Play projection must not update these checkpoint or final-output lanes:

- recommendation
- answer_snapshot
- voice_output
- final_answer

Those lanes require a completed Helix Ask checkpoint and model-reviewed answer snapshot. Projection receipts remain tool evidence and are not assistant answers.

Projection responses should report checkpoint-only lanes separately as `checkpointOnlySkipped`. They should not count those lanes as projected, and they should not mix them into schema-mismatch `skippedLineKeys`.
