# Theory Badge Graph Contract

The canonical theory architecture is the typed theory badge graph. Root-to-leaf
manifests remain compatibility scaffolding for older audit, preflight, and
maturity checks until they are generated from the badge graph.

## Canonical Source

- Schema and validator: `shared/contracts/theory-badge-graph.v1.ts`
- Graph builder: `shared/theory/helix-theory-badge-graph.ts`
- Backward-compatible export: `shared/theory/nhm2-theory-badges.ts`
- Calculator loadout: `shared/theory/theory-calculator-loadout.ts`
- Locator and connection tracing: `shared/theory/theory-badge-overlap-locator.ts`
- Explanation plan: `shared/theory/theory-context-explanation-plan.ts`
- Ask server adapter: `server/services/helix-ask/theory-context-reflection-tool.ts`
- Theory congruence solver: `server/services/helix-ask/theory-congruence/solver-adapter.ts`
- Workstation panel: `client/src/components/panels/TheoryBadgeGraphPanel.tsx`

## Batch Utility Contract

A theory batch is not just a collection of badges. It is a reusable utility
surface for Helix Ask and the workstation tools. Every batch must connect to the
following contracts when the underlying feature is relevant:

- Locator utility: `shared/contracts/theory-badge-locator.v1.ts` and
  `shared/theory/theory-badge-overlap-locator.ts`
- Reflection utility: `shared/contracts/theory-context-reflection.v1.ts` and
  `shared/theory/theory-context-reflector.ts`
- Reflection tool receipt:
  `shared/contracts/helix-theory-context-reflection-tool-receipt.v1.ts`
- Explanation route utility:
  `shared/contracts/theory-context-explanation-plan.v1.ts` and
  `shared/theory/theory-context-explanation-plan.ts`
- Tool admission and congruence trace:
  `shared/helix-theory-congruence-trace.ts`,
  `server/services/helix-ask/theory-congruence/tool-admission.ts`, and
  `server/services/helix-ask/theory-congruence/solver-adapter.ts`
- Calculator utility: `shared/contracts/theory-calculator-loadout.v1.ts` and
  `shared/theory/theory-calculator-loadout.ts`
- Compound run utility: `shared/contracts/theory-compound-run.v1.ts` and
  `shared/theory/theory-compound-run-builder.ts`
- Runtime utility, when artifact-derived values are involved:
  `shared/contracts/theory-runtime-*.v1.ts`,
  `shared/theory/nhm2-runtime-field-map.ts`, and the runtime-specific badge
  branch.

Minimum batch requirements:

- Each badge must be findable by the locator through subjects, symbols, unit
  signatures, equation families, simulation owners, repo paths, or atlas block
  context.
- Each batch must provide enough source refs and hint keys for Helix Ask to
  admit the correct utility tools instead of relying on prompt wording alone.
- Each batch must expose recommended next actions through reflection when it can
  load a compound run, load calculator payloads, or show runtime math traces.
- Each batch must preserve evidence-only authority. Reflection, explanation
  plans, locator overlays, congruence traces, and panel actions are observations,
  not assistant answers.

## Runtime And Preset Layer

The badge graph defines theory membership and graph reachability. Runtime
presets, full-solve rows, artifact readers, and calculator bindings are a second
typed layer that must remain congruent with the badge graph:

- Compound run contract: `shared/contracts/theory-compound-run.v1.ts`
- Compound run builder: `shared/theory/theory-compound-run-builder.ts`
- Runtime entrypoint contract: `shared/contracts/theory-runtime-entrypoint.v1.ts`
- Runtime run request contract: `shared/contracts/theory-runtime-run-request.v1.ts`
- Runtime receipt contract: `shared/contracts/theory-runtime-receipt.v1.ts`
- Runtime math trace contract: `shared/contracts/theory-runtime-math-trace.v1.ts`
- NHM2 runtime field bindings: `shared/theory/nhm2-runtime-field-map.ts`
- Full-solve badges: `shared/theory/nhm2-full-solve-theory-badges.ts`
- Runtime/compound contract tests:
  `shared/contracts/__tests__/theory-runtime-compound-contracts.v1.spec.ts`

Runtime presets are consistent with the theory badge graph only when each
runtime-bound badge has:

- A badge id present in the canonical graph.
- Source refs or artifact refs that identify the runtime or evidence source.
- Equation operator kinds that map into compound-run row kinds:
  `scalar`, `tensor`, `runtime`, `sweep`, `evidence`, `gate`, `boundary`, or
  `reference`.
- Claim-boundary notes from both the badge and the runtime binding.
- Runtime field bindings when values must come from artifacts instead of static
  equations.
- Required evidence and gate names for any full-solve, QEI, source-closure,
  observer-audit, tensor-authority, or certificate-sensitive interpretation.

The compound-run builder follows the badge graph's executable edges, then emits
rows for calculator payloads, tensor/reference equations, gate equations,
evidence refs, and claim boundaries. A preset is not complete merely because a
badge exists; it is complete when the corresponding compound run can expose the
needed row type, solver, evidence refs, runtime receipt or static trace, and
claim-boundary notes.

## Reflection And Uncertainty Contract

The reflection tool is the conceptual understanding layer for prompts. It maps a
prompt into graph space, estimates uncertainty over that placement, and proposes
non-terminal next actions.

Every batch that should be usable by Helix Ask must support:

- Exact and likely badge matches with scored reasons.
- Inferred atlas domains when the batch belongs to a physics atlas block.
- Overlay fields for center badges, highlighted badges, highlighted edges, and
  heat by badge id.
- Uncertainty fields when soft location is available:
  `badgeProbabilityById`, `renderChunkProbabilityById`,
  `semanticChunkProbabilityById`, `priorEntropyBits`,
  `posteriorEntropyBits`, `informationGainBits`, `normalizedMass`, and
  `uncertaintyMode`.
- Suggested biome chunks, semantic chunks, and scale bands when a batch spans
  multiple physical scales.
- A soft discussion region whose meaning remains
  `discussion_context_not_proof`.
- Claim-boundary notes that travel with every match, reflection, explanation
  step, and recommended action.

Uncertainty is not decorative. It is the locator surface Helix Ask uses when a
prompt could land between batches. A broad or ambiguous uncertainty mode should
favor reflection, atlas, repo/source, scholarly, or benchmark utilities before
claim synthesis. A focused mode can admit calculator or compound-run actions
when the selected badges expose scalar payloads or runtime rows.

## Tool-Call Contract

Helix Ask admits theory graph utilities through the congruence trace. A batch is
complete only if its badges can drive the relevant tool lanes:

- `theory_badge_graph`: required orientation for theory prompts.
- `physics_atlas`: domain and coverage narrowing for graph batches.
- `calculator_loadout`: admitted when retrieved badges include scalar payloads
  or the prompt asks for calculation.
- `repo_search`: admitted when badges carry repo/doc source refs or the prompt
  asks for source grounding.
- `docs_viewer`: admitted only for attached or open-document prompts.
- `scholarly_probe`: admitted for DOI, arXiv, paper, literature, or scholarly
  evidence prompts.
- `web_current`: blocked in the shadow trace unless current web evidence is
  explicitly implemented for the route.
- `benchmark_runner`: audit-depth utility for regression, adversarial, or
  validation prompts when execution is enabled.
- `forbidden_claim_scan`: required for all theory depths.

Tool calls from the theory badge graph must produce receipts or observations
that remain evidence-only. The tool lane can orient, locate, load, compute,
resolve, or scan; it does not become terminal answer authority. The completed
Ask solver path owns synthesis after evidence re-entry.

Recommended action ids used by batches must stay aligned with existing
workstation actions:

- `theory-badge-graph.build_compound_theory_run`
- `theory-badge-graph.load_compound_theory_run`
- `theory-badge-graph.load_payloads_to_calculator`
- `theory-badge-graph.get_runtime_math_trace`

If a batch needs a new utility, add the contract, receipt shape, admission rule,
and tests before exposing a new recommended action.

## Membership Contract

A node is part of the theory badge graph only when it satisfies the
`TheoryBadgeV1` contract:

- It has a stable `id`, `title`, `plainMeaning`, and `whyItMatters`.
- It declares a `level`: `first_principle`, `law`, `derived_relation`,
  `model`, `simulation_specific`, `diagnostic_gate`, or `claim_boundary`.
- It declares a `status`: `canonical_reference`, `project_derived`,
  `diagnostic`, `review`, or `blocked`.
- It lists `subjects`, `simulationOwners`, `equationFamilies`, `tags`, units,
  assumptions, source refs, and locator `hintKeys`.
- It binds equations with explicit roles and operator kinds. Calculator-ready
  equations must also expose `calculatorPayloads` and setup context.
- It carries claim-boundary metadata. Current graph policy keeps validation,
  physical-mechanism, and promotion claims disallowed inside the badge graph.

An edge is part of the theory badge graph only when it satisfies
`TheoryBadgeEdgeV1`:

- `from` and `to` must reference existing badge ids.
- `relation` must be one of the schema relations.
- `label` and `claimBoundaryNote` must state what the edge means and what it
  does not prove.

Executable dependency paths are constrained by
`shared/theory/theory-calculator-loadout.ts`. The calculator path follows only:

- `derives`
- `requires`
- `specializes`
- `approximates`
- `bounds`
- `uses_constant`
- `numerically_solves`
- `diagnostic_checks`

`shares_units`, `documents`, and `blocks` are graph context edges, not calculator
dependency edges.

## Prompt Contract

When adding or revising theory content, use this prompt rule:

```text
Integrate the content into the canonical theory badge graph contract:
define first-principle or law roots, equations, units, assumptions, source refs,
claim boundaries, executable edges, calculator payloads when appropriate, and
runtime/evidence references. Do not hand-author new root-to-leaf behavior unless
the patch is explicitly maintaining compatibility or parity with the derived
legacy manifest.
```

For astrochemistry and stellar inheritance work, this means the graph must carry:

- First-principle or law roots for stellar nucleosynthesis, stellar yields, and
  chemical inheritance.
- Derived relations for molecular inventory, carbon chemistry, and prebiotic
  constraints.
- Literature refs and repo docs as source refs, including DOI or arXiv ids when
  available.
- Noncomputable reference equations for population-level inheritance claims, and
  scalar calculator payloads only where the expression is actually solvable.
- Diagnostic claim boundaries for life, consciousness, or physical mechanism
  claims that exceed the available evidence.

For artifact runtime, full-solve, and calculator-binding work, the prompt must
also ask for:

- The target compound-run row kind and solver.
- Runtime field bindings when the values are artifact-derived.
- Runtime run request or receipt expectations when a backend runtime is needed.
- Output artifact globs and required evidence names.
- Gate status semantics for pass, fail, not-ready, not-applicable, and unknown.
- Calculator payload setup context when a row is scalar-solvable.
- A claim boundary that blocks promotion when runtime receipts, gates, or
  required evidence are absent.

For Helix Ask utility work, the prompt must also ask for:

- Locator hints and uncertainty behavior between adjacent batches.
- Reflection/explanation behavior for conceptual prompt understanding.
- Tool-admission behavior for calculator, runtime, repo/source, scholarly, and
  benchmark utilities.
- Receipt or observation authority fields proving the tool output is evidence
  only.

For periodic-table coverage, use
`docs/architecture/periodic-element-origin-badge-graph-patch-plan.md`. Element
badges must be generated from structured registry metadata, connected to
nucleosynthesis origin-family anchors, and bounded by observable/evidence routes
before they are used in explanations.

## Legacy Scaffolding

The root-to-leaf system is still active in these compatibility surfaces:

- `configs/physics-root-leaf-manifest.v1.json`
- `scripts/validate-physics-root-leaf-manifest.ts`
- `tests/physics-root-leaf-manifest.spec.ts`
- `tests/physics-root-lane-tree-parity.spec.ts`
- `scripts/build-math-congruence-matrix.ts`
- `scripts/validate-math-congruence-matrix.ts`
- `configs/math-congruence-matrix.v1.json`
- `scripts/toe-agent-preflight.ts`
- `server/services/helix-ask/relation-assembly.ts`

Do not delete these files until their required checks are backed by generated
badge-graph artifacts. They currently enforce audit coverage, deterministic
math-congruence rows, runtime safety thresholds, uncertainty metadata, and
maturity ceilings.

## Transfer Plan

1. Keep `TheoryBadgeGraphV1` as the only hand-authored theory architecture.
2. Add a badge-graph contract validator that checks branch ownership, source
   refs, claim boundaries, calculator payload setup, and executable edge usage.
3. Add a deterministic generator that emits the root-to-leaf compatibility
   manifest from the badge graph.
4. Update the math-congruence builder to read the generated compatibility
   manifest or derive rows directly from badge equations and executable edges.
5. Update `toe-agent-preflight` so the required stage validates the badge graph
   first, then validates generated compatibility artifacts.
6. Update relation assembly to read runtime, uncertainty, and maturity policy
   from badge-graph-derived artifacts instead of parsing the hand-authored
   root-to-leaf manifest.
7. Once parity tests prove the derived artifacts preserve current behavior,
   freeze hand edits to `configs/physics-root-leaf-manifest.v1.json` and treat
   it as generated compatibility output.

## Definition Of Done

A theory patch is complete only when:

- The badge graph validates with `validateTheoryBadgeGraphV1`.
- New roots and claims are reachable through executable or documented graph
  edges.
- The batch can be located by `locateTheoryBadges` and reflected by
  `buildTheoryContextReflection` when Helix Ask should use it.
- Reflection receipts, explanation plans, and congruence traces remain
  non-terminal evidence artifacts.
- Tool-admission behavior is explicit for calculator, runtime, repo/source,
  scholarly, benchmark, and forbidden-claim lanes.
- Calculator-ready theory has loadable payloads and setup bindings.
- Runtime presets validate through the compound-run/runtime contracts when the
  patch touches artifact runtime, full-solve, gate, sweep, or receipt behavior.
- Runtime or evidence claims point at source refs or artifacts.
- Claim boundaries are explicit and prevent promotion beyond evidence.
- Legacy parity tests still pass until the compatibility manifest is fully
  generated from the badge graph.
