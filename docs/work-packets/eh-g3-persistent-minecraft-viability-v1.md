# EH-G3 persistent Minecraft viability v1

Program gate: G3 — Viability and unexpected events
Workstream: Deterministic Minecraft resident guardian acceptance
Capability or component: Minecraft-specific persistent viability invariant set, Fabric resident sensing/stabilization, causal evidence, and Codex re-entry
Lifecycle stage: execution → normalization → re-entry → follow-up reasoning → terminal authority
Reaction timescale: continuous control with tick-scale bounded reflexes and short semantic replanning
Authority owner: Runtime Codex owns strategy and replanning; Helix owns identity, consent, leases, effect admission, provenance, evidence quality, and terminal eligibility; the trusted Fabric arbiter owns local effect execution
Current maturity: live accepted
Target maturity: live accepted
Required evidence: deterministic sensor/arbiter/release tests; persistent protection during an intentional Codex delay; water/submersion, fall/landing risk, fire or comparable damage pressure, and one unexpected mid-execution event; manual override and Emergency Stop; compact exact causal evidence; current-turn Codex re-entry and materially revised next action; preserved player viability after response; retained G2 and `/helix ask` regressions
Explicit non-goals: no provider-neutral resident-controller extraction, learned policy, FlyWire work, live-mail reflex path, durable-goal runtime, concurrent Codex roles, companion embodiment, arbitrary commands, host access, private Helix reasoning loop, or changes to retired `server/routes/agi.plan.ts`
Downstream gate unlocked: G4 — Live-mail semantic wake bridge

## Objective

Close the gap exposed by the Attempt 39 drowning incident. An approved
Minecraft viability invariant set must remain active across individual action
boundaries and model-deliberation gaps. The local Fabric companion continuously
observes only the admitted Minecraft state, selects only the fixed bounded
stabilization repertoire, sends every proposed effect through the existing
trusted local arbiter, verifies the postcondition, releases controls, and emits
compact causal evidence. It does not choose the user's goal or write an answer.

## Required causal record

Every resident response must preserve the exact chain:

```text
fresh player observation revision
→ deterministic guardian decision
→ local arbiter outcome
→ bounded Fabric effect
→ measured postcondition
→ release / interruption / abstention
→ compact environment evidence
→ Codex re-entry and material replan
```

The initial Minecraft-specific observation set covers health, air, submersion
and swim state, vertical velocity and landing risk, fire/lava pressure,
collision/entrapment, food, nearby threats, critical inventory, and a bounded
recoverable position. Unsupported or stale state causes abstention or safe
release; it never causes an invented recovery.

## Acceptance journeys

1. **Water/submersion:** while semantic reasoning is intentionally delayed,
   detect declining air, stabilize locally, verify improving air or safe
   breathing state, release controls, and let Codex revise the route.
2. **Fall/landing risk:** predict or observe a bounded dangerous descent,
   activate only an admitted recovery, verify the landing/post-state, and clean
   up any temporary resource.
3. **Fire/damage pressure:** interrupt incompatible work, execute an admitted
   stabilization or abstain with an exact blocker, and verify continuing
   viability.
4. **Unexpected mid-execution event:** introduce changed geometry, a new
   hazard, target loss, or unavailable resource; require exact evidence and a
   materially revised Codex plan.
5. **Human authority:** ordinary manual input and Emergency Stop immediately
   override local control and every asserted resource is released.

## Development order

Use the capability-first differential method:

1. Establish the deterministic Fabric behavior directly from the same
   checkpointed starting state.
2. Preserve public calls, observations, postconditions, release facts, and
   bounded failures as a reference trace.
3. Run the same ordinary-language journey through keyed Helix Ask.
4. If the direct path succeeds and Helix fails, stop at the first lifecycle
   divergence; repair the shared adapter contract without encoding the prompt
   or gameplay solution.

## Closure rule

G3 closes only when representative live journeys prove all eight canonical G3
requirements. A deterministic unit pass, one successful rescue action, or a
terminally eligible answer is necessary evidence but is not sufficient by
itself. Failed attempts remain immutable provenance.

## Closure evidence (2026-08-21)

G3 is closed and the exact deterministic Minecraft resident-guardian acceptance
surface in this packet is live accepted. The full immutable verdict and evidence
mapping are recorded in
`docs/audits/helix-environment-harness-g3-closure-audit-2026-08-21.md`.

Direct and keyed live checks now cover water escape across a Helix deliberation
gap, fall/landing recovery, fire/lava recovery, blocked-movement release and
replanning, manual override, Emergency Stop, bounded failures, exact causal
evidence, current-turn re-entry, and preserved post-response viability.

The keyed blocked-movement journey now proves that a resident interruption is
normalized and re-entered, and that Runtime Codex can respond with hazard,
status, reachability, spatial-region, local-map, navigation, and alternate-walk
decisions. The adapter preserves grounded provider synthesis after a typed
resident semantic escalation and after later current-turn evidence satisfies
the corresponding compound rails. Permission, provenance, external-change,
unknown-outcome, connector-offline, and manual-override failures remain hard
boundaries.

Representative artifacts:

- `artifacts/g3-persistent-viability/b-blocked-replan-ask-debug-4.json` — real
  resident interruption followed by hazard and view checks; exposed the stale
  all-calls-must-succeed terminal projection.
- `artifacts/g3-persistent-viability/b-blocked-replan-ask-debug-6.json` — exact
  interruption and re-entry reached terminal authority; exposed a provider
  synthesis contradicting the observed blockage.
- `artifacts/g3-persistent-viability/b-blocked-replan-ask-debug-7.json` — Codex
  performed status, navigation, spatial inspection, and a verified alternate
  walk; exposed an intermediate operational failure incorrectly remaining
  terminal-blocking after compound rail satisfaction.
- `artifacts/g3-persistent-viability/b-blocked-replan-ask-debug-8.json` — the
  recovered evidence is compatible and the compound rails are satisfied, but
  the provider emitted no terminal candidate and Helix terminalized as
  `solver_continuation_pending` while the canonical continuation still allowed
  `retry` and its hard budget was not exhausted.

Bounded continuation parity and the `/helix ask` health regression are now
repaired and live verified. A resident semantic-replan observation can permit a
new Runtime Codex mutation decision without permitting immediate duplicate
replay, while successful later current-turn evidence can satisfy the applicable
compound rail without erasing failed-attempt provenance. Report-only freshness
language is preserved as a global constraint rather than manufactured as an
independent unanswered subgoal.

Additional representative evidence:

- `artifacts/g3-persistent-viability/g3-health-regression-after-constraint-fix.json`
  — fresh Fabric health/position evidence survived re-entry and terminal
  projection; unavailable air was reported accurately instead of invented.
- `artifacts/g3-persistent-viability/g3-emergency-stop-arm-final.json` — Runtime
  Codex armed `resident.minecraft.fabric-guardian.v1` for 6,000 ticks with the
  exact bounded response repertoire and measured released controls.
- `artifacts/g3-persistent-viability/g3-emergency-stop-final.json` — the natural
  keyed Player Embodiment request selected only
  `com.casimirbot.minecraft.player.emergency_stop`; measured authority
  suspension/no-running-workflow was normalized as the idempotent successful
  postcondition `emergency_stopped`, controls were released, the semantic action
  rail completed, and the single terminal writer preserved the grounded Codex
  answer.

Emergency Stop is therefore live accepted for the exact-workflow keyed route.

The final keyed fire/lava journey is
`artifacts/g3-persistent-viability/g3-keyed-fire-program-live-036.json`. The
resident program waited locally for 215 ticks without model invocation, reacted
only after lava was introduced, moved the player 4.014 blocks through native
Fabric control, verified `not_in_lava` and `not_on_fire`, released controls, and
returned a grounded model-synthesized answer through a contradiction-free
lifecycle projection. The player remained viable at 20 health.

Failed setup and calibration attempts remain provenance. In particular, the
earlier 600 ms lava locomotion moved only 0.435 blocks and failed to preserve
viability; the accepted run does not erase that result. The accepted keyed run
also used an entry health gate rather than a continuously evaluated health
interrupt, so the separate mid-execution health-interruption artifacts remain
the evidence for that capability.

Natural Emergency Stop discovery without exposing an internal workflow
reference remains a non-gating usability follow-up. Broader hazard coverage is
future capability work and does not inherit this acceptance.
