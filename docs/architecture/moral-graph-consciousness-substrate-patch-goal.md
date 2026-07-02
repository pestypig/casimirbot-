# Moral Graph Consciousness Substrate Patch Goal

Date: 2026-07-02

## Goal

Redress the Moral Badge Graph so its first layer does not begin from
human-observation ethics alone. Add a substrate layer that derives moral
relevance from living-system primitives: organism/environment boundary,
entropy-gradient exposure, sensing, perturbation response, homeostatic
maintenance, and cross-scale coordination from single-celled organisms through
multicellular organisms.

The patch should make the Moral Badge Graph more universal without making
human-only consciousness the root classification. The Theory Badge Graph should
own the scientific mechanism, equations, Fourier/frequency calculator bindings,
uncertainty, and source maturity. The Moral Badge Graph should consume those
theory badges as evidence-only inputs and derive procedural moral constraints
without embedding equations or promoting frontier consciousness claims into
settled facts.

This is also an agent-tooling patch. The substrate layer must be available to
Helix Ask as a read-only reflection capability, following the same working
pattern as `theory-badge-graph.reflect_discussion_context`: the agent may call
the tool to orient compound reasoning, receive badge matches, claim boundaries,
recommended next actions, and evidence refs, then re-enter the model for final
synthesis. The tool must not answer on its own.

## Scientific Frame

Use Stuart Hameroff and Roger Penrose's Orch-OR / objective reduction theory as
a frontier lens, not as a required truth condition. The useful architectural
overlap is that Orch-OR asks whether consciousness can emerge from physical
mechanisms below human cognition, especially microtubule organization,
anesthetic perturbation, and scale-linked biological dynamics. This supports a
lower graph root than human judgment, but the graph must remain valid even if
Orch-OR is later weakened or falsified.

The durable substrate primitives are:

- Living systems maintain a boundary against an environment.
- Boundaries sit inside entropy and energy gradients.
- Sensing is state discrimination across that boundary.
- Action is perturbation response toward viable ranges.
- Maintenance precedes optimization.
- Coordination increases across biological scale.
- Social and moral mandates are late-stage coordination products, not the
  first layer of moral relevance.

## Proposed Theory Badge Layer

Add or reserve Theory Badge Graph nodes for:

- `biophysics.organism_environment_boundary`
- `biophysics.open_system_entropy_flow`
- `biophysics.sensing_state_discrimination`
- `biophysics.homeostatic_regulation`
- `biophysics.perturbation_response`
- `consciousness.microtubule_orchestration_frontier`
- `consciousness.objective_reduction_frontier`
- `consciousness.anesthetic_microtubule_perturbation`
- `evolution.single_cell_to_multicellular_coordination`
- `frequency.fourier_action_mapping`

The theory side may expose equations, frequency-domain calculator payloads,
uncertainty fields, falsifiers, and claim-boundary notes. Calculator-ready
paths should remain in the Theory Badge Graph and Fourier/scientific calculator
contracts.

## Proposed Moral Badge Derivatives

Add a Moral Badge Graph substrate layer before the existing human-facing wisdom
principles:

- `boundary-before-obligation`
- `sensing-before-judgment`
- `maintenance-before-optimization`
- `perturbation-response-before-verdict`
- `coordination-before-mandate`
- `scale-continuity-from-cell-to-society`

These nodes should not claim that all organisms are conscious in the human
sense. They should classify moral relevance as a gradient of boundary,
sensing, maintenance, perturbation response, and coordination.

## Contract Boundaries

- Moral graph outputs remain procedural constraints, not final moral verdicts.
- Orch-OR nodes must be marked `frontier` or equivalent maturity.
- Microtubule/anesthetic evidence may motivate theory placement, but it must
  not become proof of consciousness, personhood, or moral status by itself.
- Equations and Fourier mappings belong to the Theory Badge Graph and
  calculator layer, not the Moral Badge Graph.
- Moral derivatives should reference `sourceTheoryBadgeIds` or equivalent
  evidence links instead of duplicating scientific mechanism claims.
- Helix Ask tool receipts remain evidence-only observations; synthesis belongs
  to the completed solver path after evidence re-entry.

## Agent Tool-Call Contract

The implementation should model the substrate reflection lane after the
existing Theory Badge Graph reflection and calculator handshake:

- Capability id: `moral-graph.reflect_living_substrate_context` or an
  equivalent Moral Graph reflection action name.
- Mode: read/observe.
- Permission profile: read.
- Required input: `prompt` or `text`.
- Optional inputs: `conversation_context`, `source_theory_badge_ids`,
  `requested_substrate_badge_ids`, `include_theory_bridge`,
  `include_recommended_actions`, and `include_admissions`.
- Required observation fields: schema, capability key, panel id, action id,
  reflection id, matched moral substrate badge ids, source theory badge ids,
  claim-boundary notes, recommended action ids, authority, and
  `terminal_eligible=false`.
- The observation must set `assistant_answer=false`,
  `raw_content_included=false`, `post_tool_model_step_required=true`, and
  evidence-only authority fields equivalent to the existing
  `MoralGraphReflectionToolResponseV1` contract.
- Recommended actions may point to Moral Graph inspection, Theory Badge Graph
  reflection, or calculator loadout, but must preserve the split:
  Moral Graph derives constraints; Theory Graph and calculator carry mechanism
  and equations.

Admission rule of thumb:

- Admit this tool when the user asks about moral relevance, organism-scale
  sensing, homeostasis, entropy pressure, consciousness substrate, non-human
  organisms, or how moral mandates emerge from living-system mechanisms.
- Prefer Theory Badge Graph reflection first when the prompt asks for equations,
  Fourier/frequency mapping, microtubule physics, objective reduction, or
  literature-level mechanism.
- Prefer the Moral substrate reflection when the prompt asks how those
  mechanisms translate into obligations, priorities, care, constraints, or
  moral classification.
- Do not admit the tool from quoted, negated, historical, future-only, or
  screen-visible mentions of the capability name.
- Do not let the tool validate personhood, consciousness, physical viability,
  or final moral status. It only gives structured reflection evidence.

The intended compound reasoning path is:

```text
User prompt
-> optional theory-badge-graph.reflect_discussion_context
-> optional calculator/theory loadout when mechanism or equations are needed
-> moral-graph substrate reflection
-> evidence re-entry
-> model synthesis with explicit claim boundaries
```

## Implementation Shape

Start with an additive substrate module or doc-backed badge set instead of
rewriting existing wisdom principles in place. The lowest-risk first patch is:

1. Add the substrate patch goal and claim boundaries.
2. Add typed substrate badge candidates with theory source links.
3. Add tests proving the current wisdom layer still loads.
4. Wire the Moral Badge Graph locator to surface substrate matches for prompts
   about organisms, sensing, homeostasis, entropy, consciousness substrates,
   and non-human moral relevance.
5. Add or extend the Moral Graph reflection tool contract so Helix Ask can call
   the substrate lane as read-only evidence, with tests for missing prompts,
   evidence-only authority, recommended action ids, and non-terminal tool
   observations.
6. Add agent admission tests covering direct substrate prompts, theory-first
   mechanism prompts, quoted/negated capability mentions, and compound
   theory-to-moral reasoning prompts.
7. Only after that, decide whether the current root principle
   `direct-observation-before-claim` should move under
   `sensing-before-judgment`.

## Clean-Code Constraints

Do not implement this patch by simply appending large blocks to already-large
files. Before editing, inspect the affected file sizes and dependency shape.
As of this patch goal, known hot files include:

- `server/services/helix-ask/workstation-tool-gateway/registry.ts`: large
  central gateway registry; keep only registration glue here.
- `server/services/helix-ask/workstation-tool-planner.ts`: large planner with
  existing Moral Graph cue logic; do not add another independent cue system.
- `server/services/helix-ask/evidence-target-arbitration.ts`: already has
  Moral Graph reflection cues; update shared policy helpers instead of
  duplicating regex branches.
- `shared/moral-graph/wisdom-principles.ts`: existing wisdom principle data;
  add substrate data in a separate module unless a small type extension is
  enough.
- `shared/contracts/moral-graph-reflection-tool.v1.ts`: moderate-size
  contract; prefer extending types in-place only when the change is small and
  cohesive.

Preferred extraction shape:

- Put substrate badge data in a new focused module, for example
  `shared/moral-graph/living-substrate-principles.ts`.
- Put substrate matching helpers in a new focused module rather than expanding
  `wisdom-principles.ts` or `locate-moral-badges.ts` with unrelated logic.
- Put gateway manifest/handler logic in a focused gateway module when possible,
  leaving `registry.ts` with import, manifest registration, and dispatch glue.
- Reuse or extend `shared/moral-graph/moral-graph-agent-invocation-policy.ts`
  for admission decisions instead of adding more planner/arbitration regexes.
- Replace narrowly where existing Moral Graph reflection behavior should change;
  add only where the new substrate lane is a genuinely separate concept.

Extraction trigger:

- If a patch would add more than roughly 80-120 lines to an already-large
  registry, planner, route, or arbitration file, create a constituent helper
  module and targeted tests for that module.
- If the same cue words or claim-boundary strings appear in more than one
  implementation file, centralize them in a shared policy/data module.
- If a file gains a second responsibility, split data, matching, admission, or
  gateway execution into separate modules before wiring the public surface.

## References

- Hameroff, S., and Penrose, R. "Consciousness in the universe: A review of the
  'Orch OR' theory." Physics of Life Reviews, 2014.
  https://pubmed.ncbi.nlm.nih.gov/24070914/
- Hameroff, S. "Orch OR" research overview, University of Arizona.
  https://hameroff.arizona.edu/research-overview/orch-or
- Yu, D., et al. "Microtubule-Stabilizer Epothilone B Delays
  Anesthetic-Induced Unconsciousness in Rats." eNeuro, 2024.
  https://www.eneuro.org/content/11/8/ENEURO.0291-24.2024
- Reimers, J. R., McKemmish, L. K., McKenzie, R. H., Mark, A. E., and Hush,
  N. S. "Weak, strong, and coherent regimes of Frohlich condensation and their
  applications to terahertz medicine and quantum consciousness." Proceedings of
  the National Academy of Sciences, 2009.
  https://www.pnas.org/doi/10.1073/pnas.0806273106
- Craddock, T. J. A., et al. "A quantum microtubule substrate of consciousness
  is experimentally tractable." Neuroscience of Consciousness, 2025.
  https://academic.oup.com/nc/article/2025/1/niaf011/8127081
