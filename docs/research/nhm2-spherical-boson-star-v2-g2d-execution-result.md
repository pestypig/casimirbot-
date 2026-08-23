Program gate: G2D-R1 — terminal primary-evaluator failure review
Workstream: authenticated classical control branch
Capability or component: sole G2D execution result and immutable-prefix audit
Current maturity: one immutable terminal `FAIL`; internal primary cause unobserved
Target maturity: bounded no-execution cause classification and successor decision
Required frozen inputs: G2D manifests, exact authorization and immutable output root
Required evidence: receipt self-hashes, exact prefix, chronology and source-only review
Stop/fail criteria: any retry, evaluator re-entry, retune, deletion or alternate root
Explicit non-goals: candidate admission, G3, lanes, lamp or physical claims
Downstream gate unlocked: source-only G2D-R1 review; G3 remains blocked

# G2D sole execution result

## Terminal verdict

The exact authorized command ran once and returned exit code `1`:

```json
{"firstFail":"primary_evaluator_failed:1","status":"FAIL"}
```

This is the immutable result of the sole G2D attempt. It is not eligible for a
retry, retune, deletion, reuse, alternate output root or reinterpretation as a
classical proof.

## Immutable evidence prefix

The exclusive root is now occupied. Its complete inventory is:

```text g2d-execution-inventory
dfde4d74b7fbe6b73216cf0b263fc165c127820411b6f8ab61ffedd38acbf76c  artifacts/nhm2-spherical-boson-star-v2-g2d/fluid-star-chi-1-over-4-v1/preexecution-binding.json
25bc26daa110d7de50b2657325bb9d5c6c767482887ba79211c97c7f514ccc83  artifacts/nhm2-spherical-boson-star-v2-g2d/fluid-star-chi-1-over-4-v1/terminal-receipt.json
```

The root also contains one empty ordinary directory, `primary/`. There is no
independent directory and no duty receipt.

The preexecution receipt self-hash is
`367c7474a80d5e8338745bbcdab74c1dd0886932f415a6080b37c83e46a0f9bb`.
It binds implementation manifest
`21e20f53f33f7517322a1a9d3c2e4290e8cf000617efe445cbebf349bacf81e5`
and records `PASS` before evaluator entry.

The terminal receipt self-hash is
`37bfd4d02308329943f6e921a1e160744ebd0c2eeb1e27512099e9cf5d3f671e`.
It records `FAIL`, `primary_evaluator_failed:1`, null runtime identity, false
candidate admission and false classical-proof establishment.

The producer-independent audit source is
`4d396070b94c9b1662a3881167ddd4b00e20108db8df11cbc248a903f59451ff`
for
`tools/nhm2-spherical-boson-star-v2-branch-proof/test_g2d_fluid_star_execution_result_audit.py`.
It passes `5/5` without importing or executing either evaluator.

## Exact chronology established

1. Preexecution binding passed and was persisted.
2. The orchestrator created the empty primary lane.
3. The primary subprocess returned code `1`.
4. The orchestrator persisted the terminal failure receipt.
5. The independent evaluator never started.

No proof duty completed. No independent agreement exists.

## Evidence limitation and classification

The orchestrator captured primary stdout/stderr in memory but its terminal
receipt persisted only the subprocess return code. The immutable evidence does
not contain the primary exception text, failing grid/node, or failing residual.
Rerunning the evaluator to recover that detail is forbidden.

Therefore the authenticated conclusion is limited to:

```text
IMMUTABLE_G2D_EXECUTION_FAIL_PRIMARY_EXIT_1_INTERNAL_CAUSE_UNOBSERVED
```

The receipt does not establish that the analytic fluid-star candidate is
mathematically false. It establishes that this frozen implementation did not
produce the required classical proof. Any causal diagnosis must now be static,
source-only and explicitly identified as inference rather than run evidence.

## Authority boundary

Candidate admission, classical proof, joint geometry/state, quantum state, SI,
metric, lane, replay, pair agreement, diagnostic lamp, physical viability,
propulsion and transport authority all remain false. G3 is not unlocked.
