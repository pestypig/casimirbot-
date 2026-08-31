Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8F local representative attempt termination record
Current maturity: one local process stopped by operator before a terminal numerical result
Target maturity: immutable partial evidence that cannot be mistaken for PASS, FAIL, timeout or a causal lead
Required frozen inputs: P8F proposal `17994ed3e9ec443deaaccf44bb36eae5e39adeac2355c41bb7d2b45fa93ccf86`, container `8cacecb98e7855f05af70d2d89c15f20f3df8fb865a69255ad1aab76d1252ec1`, image `ec6ab2ad...2defd` and executable `12aa0158...90d20`
Required evidence: exact start/finish state, exit code, retained container, retained initial evidence and absent scientific output
Stop/fail criteria: deletion, relabeling as a numerical timeout/result, causal classification, retry under the same identity or authority promotion
Explicit non-goals: evaluating the frozen candidate, selecting a causal lead, accepting H2, or promoting candidate, proof, geometry/state, lane, lamp, physical, propulsion or transport authority
Downstream gate unlocked: a separately versioned cloud-observable successor; no scientific execution authority

# H2-P8F local interruption result

The local P8F container began at `2026-08-30T20:43:39.241009247Z` and was
operator-stopped at `2026-08-31T03:41:48.381808535Z`. Docker records:

- state: `exited`;
- exit code: `137`;
- OOM killed: `false`;
- stdout/stderr at inspection: empty;
- retained container: `nhm2-h2-p8f-local-representative-20260830`;
- retained container ID:
  `8cacecb98e7855f05af70d2d89c15f20f3df8fb865a69255ad1aab76d1252ec1`.

This is `P8F_OPERATOR_INTERRUPTED_PARTIAL_NO_CAUSAL_SELECTION`. It is not a
numerical timeout and says nothing about whether the representative
decomposition would pass or fail. The container and the four initial evidence
bindings remain preserved. No frozen candidate was evaluated, no positive
sample was taken, no candidate or scientific root was created, and no
authority was promoted.
