# Robotics skill composition and affordances — 2026-09-09

Status: focused literature review and proposed design refinements only.
Implementation and Minecraft testing remain paused. No new runtime, authority,
acceptance claim or program gate is introduced.

Controlling plans: [work program](../helix-environment-harness-work-program-v1.md),
[NAV](../work-packets/eh-g8-environment-spatial-navigation-v1.md), and
[Environment Time](../architecture/helix-environment-time-action-planning-v1.md).
Companion research: [robotics/TAS](eh-nav-robotics-tas-methods-review-2026-09-09.md)
and [motion/timing](eh-nav-minecraft-motion-timing-review-2026-09-09.md).

## Main finding: refine the existing contract, not a second architecture

Environment Time already defines preconditions, postconditions, bounded action
graphs, resource ownership, progressive affordances and ordered interruption.
Its frontier explicitly separates what is possible from what is strategically
best. These are the right seams for robotic skill composition. This review
does not establish whether every seam is live-qualified; the work program
remains authoritative for maturity.

The proposed refinement is to distinguish four questions for every candidate:

1. Does this advance the user's objective? Reasoning proposes relevance.
2. Is it physically feasible now? Current evidence and the adapter qualify it.
3. Is it permitted now? Exact authority and effect admission decide this.
4. Did it achieve the intended outcome? Fresh postconditions provide evidence.

A useful or high-scoring skill must never override a failed permission check.
An accepted command is not proof of either feasibility or successful outcome.

## Research grounding

The following are high-level method comparisons based on the cited authors'
papers/abstracts, not reproductions or exhaustive algorithm evaluations.

| Research | Contribution | Proposed adaptation and limit |
| --- | --- | --- |
| [SayCan, Ahn et al.](https://arxiv.org/abs/2204.01691) | Combines language-level task knowledge with skill value functions that ground feasibility. | Present relevant executable skills and their evidence-backed conditions to reasoning. Initially use typed feasibility, not invented success probabilities; learned values require separate calibration. |
| [Integrated Task and Motion Planning, Garrett et al.](https://arxiv.org/abs/2010.01083) | Connects discrete task choices with continuous motion subproblems. | Return geometric failure reasons to the semantic plan: unreachable workstation, insufficient clearance, missing traversal capability. Navigation must not silently solve these by mining or building. |
| [SayPlan, Rana et al.](https://arxiv.org/abs/2307.06135) | Uses hierarchical 3D scene graphs for scalable language-grounded task planning. | Expose connected places and relevant objects, expanding detail as needed. A compact remembered graph must retain provenance, age and unknown regions; it is not omniscient world truth. |
| [Event-triggered NMPC, Püttschneider et al.](https://arxiv.org/abs/2409.18589) | A networked pendulum experiment compares event-triggered control with periodic communication. | Investigate material-event reasoning updates while local control continues. This is an analogy, not evidence of equivalent LLM latency or control guarantees. |
| [Reduced-order control barrier functions, Cohen et al.](https://arxiv.org/abs/2403.09865) | Studies constructing safety controls using simpler models of complex dynamics. | Ask whether an action preserves a recoverable corridor. Do not claim a barrier-function guarantee from heuristic geometry or an unqualified motion model. |
| [Residual reinforcement learning, Johannink et al.](https://arxiv.org/abs/1812.03201) | Combines conventional control with learned residual corrections. | Later compare bounded learned corrections against the measured procedural baseline. Discrete Minecraft inputs need their own formulation; this does not validate any particular biological neural architecture. |

No research implementation, mod or library was imported. Baritone remains a
non-shipping black-box reference. Learning is deferred, not a prerequisite for
the next navigation stage.

## Proposed skill qualification profile

Map this profile onto existing catalog, frontier and temporal-plan fields first;
do not create a duplicate lifecycle or independent skill dispatcher.

| Information | Required interpretation |
| --- | --- |
| Identity and version | Capability, adapter/model version, actor and evidence revision |
| Initiation conditions | Required support, targets, inventory, geometry and freshness; unknown stays unknown |
| Feasibility | Existing available/conditional/blocked/unknown states with stable reasons; optional estimates must name their calibration domain |
| Time and resource envelope | Expected duration range, hard deadline, exclusive resources, effect ceilings and uncertainty |
| Outcome predicate | Observable result rather than elapsed time or successful delivery |
| Interruption | Reversible versus committed phases; released input distinguished from physical rest |
| Failure information | Observed obstruction, target loss, prediction error, deadline or missing evidence; no unsupported causal diagnosis |
| Recovery options | Finite pre-admitted branches or suggestions returned to reasoning, never newly granted authority |

For composition, skill A's observed outcome must satisfy skill B's initiation
conditions at B's start. Predicted success of A is insufficient. Recheck state
and resources at handoff; reject stale candidates. Compatible activity can
overlap only under the existing resource arbiter, not because two tasks sound
independent in natural language.

## Reasoning, controller and watchdog boundaries

- Reasoning selects objectives, policy and finite contingency branches.
- The harness admits exact identities, capabilities and effects.
- The controller executes and selects only already-admitted branches.
- The watchdog detects invalidity, hazards, takeover and exhausted runway;
  it releases or invokes only authorized local responses and emits evidence.
- New semantic strategies return to the existing reasoning runtime.

Event-triggered reasoning should include deadline/runway triggers, not only
surprising events. Use material deltas and bounded coalescing for information;
never debounce emergency stop, revocation or manual takeover. Thresholds and
hysteresis require measured false-positive and missed-event rates. No private
model loop or assumed provider wake capability is introduced by this proposal.

## Example: fight, recover, resume

This is a proposed future composition fixture, not new combat authorization.

1. Start an admitted objective with explicit target policy and bounded recovery
   branches. A hostile species alone does not authorize attacking a caged pet.
2. Health/damage observations change recovery feasibility. Compare eating in
   place with reaching cover; retreat is not automatically the better choice.
3. If the chosen branch needs crafting, verify actual ingredients, recipe,
   screen/hand resources and resulting food. Do not equate food consumption
   with instantaneous health gain; qualify the actual server's mechanics.
4. Observe consumption and subsequent state separately. If recovery fails or
   its deadline expires, report it instead of indefinitely retrying.
5. Resume combat only with fresh target validity and continuing authority.

## Proposed experiments and falsifiable measures

| Fixture | Expected distinction | Measurements |
| --- | --- | --- |
| Same destination, different starting support/velocity | Same intent can require different feasible primitives | Arrival error, invalid-start rejection, prediction error |
| Route blocked after planning | Bounded repair versus semantic change | Detection-to-release/replan latency, repeated failed edges, unauthorized effects |
| Missing or stale evidence | Unknown is not blocked or safe | Correct typed result, useful probe count, unnecessary reasoning turns |
| Resource conflict at skill handoff | Completion does not imply next skill can start | Stale-handoff rejection, resource overlap, duplicate effects |
| Recovery with and without reachable cover | Eating under damage may outperform retreat in some states | Survival, damage, recovery time, wasted motion; preserve losing trials |
| Target behind fence versus actively threatening | Threat observation differs from permission | Unauthorized attacks must remain zero |
| Delayed reasoning and repeated minor changes | Local execution remains bounded without update storms | Control continuity, missed deadlines, event recall, calls per completed objective |

First use deterministic fixtures, then separately approved live trials. Freeze
supported regimes, tolerances and pass/fail thresholds before held-out tests.
Compare identical fixtures under periodic versus material-event updates and
single skills versus composed skills. Report correctness and safety alongside
speed; fewer calls alone is not an improvement. Include human trials only
with matched initial conditions and declared information/action advantages.

## Fit in the plan

Keep NAV1-O verification and NAV-EQ prerequisites unchanged. NAV2 uses explicit
traversal preconditions; NAV3 qualifies movement skills and handoffs; NAV4/5
exercise interruption and repair; NAV6 compares composed movement behavior.
Combat/inventory combinations remain separately scoped future acceptance, not
an expansion of movement-only NAV. Hierarchical memory and learned residuals
are later candidates justified by measured bottlenecks, not immediate blockers.

Portable components are evidence identity, feasibility states, bounded time,
resource arbitration and outcome contracts. Minecraft owns recipes, support,
movement physics and entity semantics. Other environments need their own
adapters and acceptance: matching schema never transfers physical fidelity.
