# Codex Goal: Moral Graph Consciousness Substrate Reflection Lane

Date: 2026-07-02

## Objective

Implement the big-picture patch described in
`docs/architecture/moral-graph-consciousness-substrate-patch-goal.md`.

The goal is to redress the Moral Badge Graph so it can reason from
living-system substrate primitives before human-facing wisdom principles:
organism/environment boundary, entropy-gradient exposure, sensing, perturbation
response, homeostatic maintenance, and cross-scale coordination. The work must
also make this substrate available to Helix Ask as a read-only agent reflection
tool, modeled after the existing Theory Badge Graph reflection and calculator
handshake.

## Required Reading

Read these before editing:

- `AGENTS.md`
- `docs/architecture/moral-graph-consciousness-substrate-patch-goal.md`
- `docs/architecture/theory-badge-graph-contract.md`
- `docs/helix-ask/workstation-tool-contracts/theory-badge-graph.reflect_discussion_context.md`
- `docs/helix-ask-codex-loop-discipline.md`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/helix-ask-api-parity-matrix.md`

Useful implementation references:

- `shared/contracts/moral-graph-reflection-tool.v1.ts`
- `shared/contracts/theory-context-reflection.v1.ts`
- `shared/contracts/helix-theory-context-reflection-tool-receipt.v1.ts`
- `shared/moral-graph/moral-graph-agent-invocation-policy.ts`
- `shared/moral-graph/wisdom-principles.ts`
- `shared/moral-graph/locate-moral-badges.ts`
- `shared/moral-badge-locator.ts`
- `server/services/helix-ask/workstation-tool-gateway/registry.ts`
- `server/services/helix-ask/workstation-tool-planner.ts`
- `server/services/helix-ask/evidence-target-arbitration.ts`
- `docs/helix-ask/workstation-tool-contracts/civilization-bounds.reflect_system_bounds.md`

## Clean-Code Constraint

Do not implement this by appending more logic to already-large files unless the
change is only registration glue. Inspect file size and responsibility before
editing.

Known hot files from the planning pass:

- `server/services/helix-ask/workstation-tool-gateway/registry.ts` is a large
  central gateway file. Add only import, manifest registration, and minimal
  dispatch glue here. Put the substrate manifest/handler in a focused module if
  the implementation is more than a small adapter.
- `server/services/helix-ask/workstation-tool-planner.ts` is already large and
  already contains Moral Graph cue handling. Do not add another parallel cue
  system. Prefer extracting or reusing shared policy helpers.
- `server/services/helix-ask/evidence-target-arbitration.ts` already has Moral
  Graph reflection cues. Update shared admission policy rather than duplicating
  regex branches there and in the planner.
- `shared/moral-graph/wisdom-principles.ts` should not become a mixed data
  dump. Put living-substrate badge data in a separate module unless a tiny type
  extension is enough.

Preferred extraction targets:

- `shared/moral-graph/living-substrate-principles.ts` for substrate badge data.
- A focused substrate locator/matcher helper rather than expanding
  `locate-moral-badges.ts` with unrelated matching code.
- A focused gateway capability module for
  `moral-graph.reflect_living_substrate_context`, leaving `registry.ts` as
  wiring.
- Reuse or extend
  `shared/moral-graph/moral-graph-agent-invocation-policy.ts` so planner and
  arbitration do not drift.

Extraction triggers:

- If a change adds more than roughly 80-120 lines to an already-large registry,
  planner, route, or arbitration file, extract a helper module.
- If cue words, claim-boundary strings, or admission rules appear in more than
  one implementation file, centralize them in a shared policy/data module.
- If a file gains a second responsibility, split data, matching, admission, or
  gateway execution before wiring the public surface.

## Patch Classification

Classify this work as:

- `tool admission`
- `evidence normalization`
- `evidence re-entry`
- `presentation`

Do not recreate Codex-owned runtime behavior. Helix Ask owns route authority,
tool admission, provenance, evidence identity, receipts, and reflection
contracts. Codex owns model sampling, generic tool execution, retries,
approvals, sandboxing, compaction, and terminal completion.

## Implementation Passes

### Pass 1: Substrate Badge Data

Add an additive Moral Graph substrate layer without deleting or rewriting the
current wisdom principles. Prefer a new focused module such as
`shared/moral-graph/living-substrate-principles.ts` over expanding
`wisdom-principles.ts`.

Suggested derivative badge ids:

- `boundary-before-obligation`
- `sensing-before-judgment`
- `maintenance-before-optimization`
- `perturbation-response-before-verdict`
- `coordination-before-mandate`
- `scale-continuity-from-cell-to-society`

Each badge should include:

- stable id and title
- plain meaning
- why it matters
- tags / locator hint keys
- source theory badge ids where applicable
- claim-boundary notes
- maturity tier that does not overstate Orch-OR or consciousness evidence

### Pass 2: Theory Bridge Hooks

Reserve or add typed references for the theory side described in the patch goal:

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

Keep equations and Fourier/frequency calculator payloads on the Theory Badge
Graph side. The Moral Graph should reference the theory badges as evidence,
not duplicate equations.

### Pass 3: Moral Substrate Reflection Contract

Add or extend the Moral Graph reflection contract so Helix Ask can call the
substrate lane as read-only evidence.

Target capability:

```text
moral-graph.reflect_living_substrate_context
```

The tool observation must remain non-terminal:

```text
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
ask_context_policy=evidence_only
```

The response should expose:

- reflection id
- matched substrate moral badge ids
- source theory badge ids
- claim-boundary notes
- recommended action ids
- admissions, when requested
- evidence-only authority fields

### Pass 4: Agent Admission And Compound Reasoning

Wire the tool into the existing Helix Ask gateway/admission pattern.
Consolidate admission cue logic through the shared Moral Graph invocation
policy where possible; do not duplicate new regex branches across planner,
arbitration, and gateway code.

Admission rule of thumb:

- Admit Moral substrate reflection for prompts about moral relevance,
  organism-scale sensing, homeostasis, entropy pressure, consciousness
  substrate, non-human organisms, or how moral mandates emerge from
  living-system mechanisms.
- Prefer Theory Badge Graph reflection first for prompts asking about
  equations, Fourier/frequency mapping, microtubule physics, objective
  reduction, or literature-level mechanism.
- Prefer Moral substrate reflection when the user asks how mechanisms translate
  into obligations, priorities, care, constraints, or moral classification.
- Block quoted, negated, historical, future-only, and screen-visible mentions
  of the capability name.

Expected compound path:

```text
User prompt
-> optional theory-badge-graph.reflect_discussion_context
-> optional calculator/theory loadout when mechanism or equations are needed
-> moral-graph.reflect_living_substrate_context
-> evidence re-entry
-> model synthesis with explicit claim boundaries
```

### Pass 5: Tests And Guardrails

Add focused tests for:

- substrate badges load and do not break existing wisdom principles
- extracted substrate data/matching helpers behave independently of gateway
  wiring
- locator/reflection can match organism, sensing, homeostasis, entropy,
  consciousness substrate, and non-human moral relevance prompts
- missing prompt blocks the tool
- tool output is evidence-only and non-terminal
- recommended action ids are stable
- quoted/negated/future-only capability mentions do not admit the tool
- theory-first prompts prefer Theory Badge Graph reflection
- moral-translation prompts admit Moral substrate reflection

Run the narrowest meaningful checks. At minimum, run targeted Moral Graph,
gateway, and Helix Ask discipline checks touched by the patch. Use:

```text
npm run helix:ask:discipline:quick
```

Run targeted `vitest` files for edited contracts, graph utilities, gateway
registry, and admission behavior.

## Claim Boundaries

Do not claim:

- Orch-OR is proven
- all organisms are conscious in the human sense
- microtubule/anesthetic evidence proves personhood or moral status
- the Moral Graph can produce final moral verdicts
- the reflection tool is terminal answer authority

Do claim only:

- the substrate lane gives structured evidence for reflection
- theory badges carry mechanism, equations, maturity, and calculator payloads
- moral substrate badges derive procedural constraints from living-system
  primitives
- final synthesis requires evidence re-entry through the Ask solver path

## Completion Criteria

The patch is complete when:

- the substrate layer exists as additive Moral Graph content
- Helix Ask can call the substrate reflection lane as read-only evidence
- theory/mechanism and moral/procedural responsibilities remain separated
- tests prove evidence-only authority and admission boundaries
- documentation points back to
  `docs/architecture/moral-graph-consciousness-substrate-patch-goal.md`

Casimir verification is not required unless the patch touches warp/GR,
adapter contracts, constraint packs, training-trace export, certificate
semantics, CI/release verification, or proof-maturity surfaces.
