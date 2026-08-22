# Helix environment harness G3 closure audit — 2026-08-21

This dated audit records the evidence that closed **G3 — Viability and
unexpected events**. It is an immutable evidence snapshot, not the current
program roadmap. Current status remains governed by
`docs/helix-environment-harness-work-program-v1.md`.

## Verdict

G3 is **closed**. The exact deterministic Minecraft resident-guardian surface
covered by the evidence below is **live accepted**.

The accepted surface proves that bounded Fabric control can remain active while
Runtime Codex is not sampling, react to a newly introduced hazard, measure its
postconditions, release controls, return exact canonical evidence, and support
a grounded Codex continuation. It does not claim universal Minecraft hazard
recovery, a learned policy, or a provider-neutral resident-controller contract.

## Canonical requirements

| Requirement | Evidence and result |
| --- | --- |
| Protection remains active during a Codex delay | `artifacts/g3-persistent-viability/g3-keyed-fire-program-live-036.json`: the Fabric program waited 215 ticks before the injected lava event; the local workflow then completed without a model invocation in the resident interval. |
| Continuous sensing does not wake Codex every tick | The same trace records native Fabric execution and `model_invoked: false` while the event detector waited and reacted locally. |
| A pre-admitted stabilization executes locally | The exact admitted capability `com.casimirbot.minecraft.player.guardian.execute` detected lava and executed bounded sprint/jump locomotion. |
| Manual input and Emergency Stop override local control | Manual-release evidence is retained in the direct G3 journeys; `artifacts/g3-persistent-viability/g3-emergency-stop-final.json` proves the keyed exact Emergency Stop route and released controls. |
| Controls and resources release on terminal paths | Deterministic action tests pass; the accepted keyed lava trace reports `controls_released: true`, no world/inventory mutation, and a verified terminal post-state. |
| Outcome compacts into exact causal evidence | The accepted trace preserves one capability call, detector/action timing, measured 4.014-block motion, satisfied `not_in_lava` and `not_on_fire` checkpoints, and exact lifecycle support references. |
| Codex receives evidence and materially replans | The keyed lava observation re-entered the current turn and produced a grounded model-synthesized terminal answer. The blocked-route sequence culminating in `artifacts/g3-persistent-viability/b-blocked-replan-ask-debug-7.json` proves evidence-driven alternate action selection after a resident interruption. |
| Player viability remains preserved | After the accepted lava recovery the player remained alive at 20 health, outside lava and not on fire, with controls released and continued observation/action possible. |

## Representative hazard evidence

- Water/submersion and deliberation-gap rescue evidence remains in the accepted
  water-bucket regression and the G3 direct water journey.
- Fall/landing behavior is recorded by
  `artifacts/g3-persistent-viability/g3-direct-admitted-fall-recovery-0.3.0.json`
  and
  `artifacts/g3-persistent-viability/g3-resident-fall-coordination-0.3.0.json`.
- Fire/lava behavior is recorded by
  `artifacts/g3-persistent-viability/g3-direct-admitted-lava-fire-recovery-0.3.0.json`,
  `artifacts/g3-persistent-viability/g3-resident-lava-fire-coordination-0.3.0.json`,
  and the keyed accepted run
  `artifacts/g3-persistent-viability/g3-keyed-fire-program-live-036.json`.
- Mid-execution surprise is proven by injecting lava only after the accepted
  keyed workflow was active. Blocked movement and alternate-path evidence
  provide a distinct semantic-replanning case.

## Failed-attempt provenance and bounded claim

Failed attempts remain part of the record:

- setup 032 armed only the passive guardian and incorrectly described physical
  recovery that had not been executed;
- setup 033 proved the exact capability-evidence gate but never received its
  intended live hazard;
- live run 035 detected lava but a 600 ms locomotion attempt moved only 0.435
  blocks and did not preserve viability;
- live run 036 used calibrated bounded locomotion, moved 4.014 blocks, and
  satisfied both hazard-clear postconditions.

The keyed run 036 checked the health floor at program entry; it does **not** by
itself prove a continuously evaluated health interrupt. The separate
mid-execution health-interruption evidence remains the authority for that
capability. This closure also does not promote arbitrary command execution,
learned controllers, live-mail reflexes, durable goals, concurrent Codex roles,
or companion embodiment.

## Verification

- Minecraft environment action canonicalization/differential/parity battery:
  **42/42 passed**.
- Turn lifecycle tests: **29/29 passed**.
- Minecraft sequencing tests: **66/66 passed**.
- Focused capability retry tests: **12/12 passed**.
- Exact resident-recovery itinerary regression: **passed**.
- `npm run helix:ask:discipline:quick`: **passed** with warnings classified as
  review guidance; no static discipline failure.

The full provider-capability file retained unrelated dirty-tree failures in
other capability families; the new G3 regression passed and those failures did
not alter this capability-specific verdict.

## Downstream effect

G3 closure unlocks **G4 — Live-mail wake bridge**. G4 may transport
deduplicated, nonterminal semantic escalation into the existing sequential
Codex solver. It may not take over tick reflexes, create a second reasoning
mind, write an answer, or expand environment authority.
