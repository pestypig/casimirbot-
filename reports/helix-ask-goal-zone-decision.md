# Helix Ask Goal Zone Decision

- infra_pass: yes
- quality_pass: no

## Basis
- Strict goal-zone run (`HELIX_ASK_GOAL_ALLOW_STUB=0`) failed all 5/5 cases with 0% pass rate.
- Failure profile is dominated by stub output (`stub_text_detected`, `text_too_short`, `text_missing`) rather than routing/intent mismatches.
- Relation diagnostics remain correct for relation prompts:
  - `intent_id = hybrid.warp_ethos_relation`
  - `intent_strategy = hybrid_explain`
  - `report_mode = false`
  - `relation_packet_built = true`
  - `relation_dual_domain_ok = true`
- Stub diagnostic (`HELIX_ASK_GOAL_ALLOW_STUB=1`) reaches 100% case pass, confirming harness/routing path works when stub responses are permitted.

## Ordered blockers
1. Runtime currently returns `llm.local stub result` for relation asks in strict mode, which fails narrative/length/content checks.
2. Because output is stub text, bridge/evidence narrative minimums cannot be validated for non-stub quality targets.
3. Strict quality gate remains red until real model output replaces stub behavior for these prompts.

## Next patch recommendation (max 3)
1. Disable/fix stub fallback in the local answer path for relation prompts so real generated text is returned in strict mode.
2. Add/adjust a strict-mode guard that rejects `llm.local stub result` for `hybrid.warp_ethos_relation` before final response emission.
3. Re-run strict goal-zone and confirm relation bridge/evidence minimums with `relation_packet_*` diagnostics unchanged.
