# Helix Objective-First UI Risk Register

Date: 2026-02-24  
Status: active

| Risk ID | Risk | Trigger | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- |
| R-001 | Voice certainty exceeds text certainty | Alternate emit path bypasses shared parity checks | Operator trust break | Enforce shared parity contract in all emit paths and add replay tests | Voice + Server |
| R-002 | Silent suppression | UI does not surface suppression reason | Perceived randomness and confusion | Render suppression row with stable reason and cooldown | UI |
| R-003 | Objective drift from user intent | Objective not refreshed/edited when prompt intent changes | Wrong actions prioritized | Add explicit objective edit and re-baseline flow | UI + Product |
| R-004 | Policy drift across client/server | Eligibility logic diverges by layer | Inconsistent behavior in real-time vs replay | Single-source evaluator and parity matrix tests | Server |
| R-005 | Replay nondeterminism | Wall-clock fallback in policy paths | Debug reports disagree across reruns | Use trusted replay clock mode and mark degraded clock state | Server |
| R-006 | Evidence-free action callouts | Missing evidence refs on repo-attributed claims | Unsafe recommendations | Suppress with deterministic reason and require evidence anchor | Server + UI |
| R-007 | Noise regression | Objective-first emits every event instead of gap-changing events | Alert fatigue | Gate callouts on gap delta + salience budget | Mission Overwatch |
| R-008 | UI complexity overload | Too many panels and controls in pill | Slower operator reactions | Progressive disclosure and compact defaults | UI |

## Kill criteria

- Any observed parity violation in production replay sample.
- Any callout suppression without reason code.
- Objective card stale while mission events continue updating.
- Significant increase in low-information callout volume.

## Weekly review fields

- parity_violations_count
- suppression_reason_distribution
- objective_to_action_median_ms
- unresolved_gap_age_p95_ms
- false_positive_callout_rate
