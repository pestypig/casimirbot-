Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.SCOPE / CFP-1.CLAIMS D03 independent technical review
Capability or component: Conditional one-block Minecraft shared action and stationary successor identity
Lifecycle stage: specification review before CFP-2/3 implementation and installed qualification
Reaction timescale: once for this D03 freeze and after any action, version or movement-policy change
Authority owner: Coordinator freezes planned inputs; independent reviewer checks source/stage consistency; product owner and qualified rights reviewer retain D12/R-MC-01 authority
Current maturity: specified
Target maturity: independently reviewed conditional technical input
Required evidence: D03 packet, compatibility and package-identity contracts, current native mine source, positive/denial matrix and docs audit
Explicit non-goals: no JAR/runtime implementation, installed result, Minecraft commercial permission, signed identity, customer claim or stage promotion
Downstream gate unlocked: none automatically; D11/D12 and canonical CFP-1 exit remain controlling

# CFP-1 conditional Minecraft shared-action freeze review — 2026-09-21

The first independent read-only review found one material conflict. The current
player mod `0.4.12` / action adapter `0.4.11` mine path calls
`navigateToward(...)` when the selected block is outside interaction range
(`NativeFabricWorkflowEngine.java` lines 880–923) and can call the same helper
after an in-range target remains unfocused (lines 927–966). Those current bytes
cannot support the proposed stationary/no-approach action claim.

The corrected [D03 technical freeze](../../../work-packets/eh-g8-cfp1-conditional-minecraft-shared-action-freeze-v1.md)
now keeps `0.4.12`/`0.4.11` as the inspected negative baseline and reserves
player mod `0.4.13` plus action adapter `0.4.12` as planned successor identities.
It requires a rebuilt and re-versioned path that returns
`stationary_target_not_ready` before locomotion when the exact target is not
already in range and focusable. Success and denial fixtures require no call to
approach/reposition helpers, no asserted locomotion controls, unchanged actor
block position and at most `0.01` block measured position delta absent a
separately observed external impulse. The [compatibility target](../../../work-packets/eh-g8-cfp1-first-cohort-compatibility-target-v1.md),
[bounded personal proposal](../../../work-packets/eh-g8-cfp1-bounded-assistance-acceptance-v1.md),
[package identity contract](../../../work-packets/eh-g8-cfp1-fabric-package-runtime-identity-contract-v1.md)
and decision queue now preserve the same current-versus-successor distinction.

The second independent review returned **PASS** on the resolved technical
blocker and required one stage-wording correction. The compatibility target now
assigns personal P03 implementation/qualification to CFP-2 and D03 shared-action
binding/repetition to CFP-3, matching the queue. The reviewer found no remaining
implementation or installed-support overclaim.

The environment-harness documentation audit returned `ok: true`; `git diff
--check` returned no whitespace errors for the reviewed set. This review freezes
a conditional technical input only. The planned successor artifacts do not yet
exist, R-MC-01 and C07 remain unresolved, D11/D12 remain open, CFP-1 remains
active (`specified`), CFP-2/3 remain blocked and G8 remains active.
