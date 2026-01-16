# GR Tool-Augmented Assistant (Local) - Task Spec

## Goal
Build a local, tool-augmented assistant that helps derive and validate GR tensor
pipelines (metric -> connection -> curvature -> field equations -> invariants),
with correctness enforced by deterministic CAS + verification gates. The LLM
acts as planner + code generator + debugger, not as the source of truth.

## Non-Goals
- Training a foundation model from scratch.
- Trusting the LLM for mathematical truth without tool verification.
- Building a full theorem prover.

---

## Fixed Decisions (v1)
### CAS / Math backend
- Primary: Python stack: SymPy + EinsteinPy.
- Optional (v2): Cadabra adapter for advanced canonicalization/symmetry handling.
- No Sage requirement in v1.

### Conventions
- Metric signature: (-,+,+,+).
- Internal units: geometrized (G=c=1).
- Optional boundary conversion: SI inputs/outputs with unit checks at boundaries.

### Local model runtime
- llama.cpp spawn runtime (GGUF).
- Default quantization: Q4_K_M.
- Default context length: 8k (tune later).

### Integration architecture
- Python client orchestrator drives the agent loop.
- Local FastAPI tool server exposes physics.* functions.
- The LLM may only output:
  1) tool calls (structured),
  2) code patches (structured),
  3) final narrative report referencing verified artifacts.

### Dataset scope
- Create custom JSONL dataset (200-500 items initial).
- Gold outputs are verification outcomes + stable canonical artifacts.
- Include tool traces for supervised tool-use training (optional LoRA).

### Acceptance gates (must pass)
- Symmetry/identity checks relevant to computed tensors.
- Contracted Bianchi identity residual simplifies to 0 (when applicable).
- Unit/dimension checks pass at boundaries.
- Regression suite on canonical metrics passes.
- Reproducible outputs with pinned dependency versions.

---

## System Overview

### Components
1) Orchestrator (Python)
- Responsible for: planning, calling tools, collecting artifacts, running gates,
  and generating a final report.
- Maintains a run DAG: each node stores inputs, operation, outputs, and checks.

2) physics tool server (FastAPI)
- Deterministic tensor operations and checks.
- All results must be returned in machine-readable form plus optional
  pretty-print.

3) Local LLM runtime (llama.cpp)
- Used for planning, code generation, and diagnosing failures.
- Never treated as authoritative for math.

---

## Repo Integration (maximize codebase reuse)
1) GR brick adapter
- Build an adapter that converts `server/gr-evolve-brick.ts` outputs into
  `MetricSpec` + spotcheck payloads, then runs the tool server for invariants
  and identity checks.

2) Agent loop tool
- Add `physics.gr.assistant` in `server/skills` to proxy the FastAPI endpoints,
  returning check-carrying artifacts for the planner.

3) Constraint gate + certificates
- After each GR tool run, call `server/gr/gr-evaluation.ts` or
  `server/skills/physics.gr.grounding.ts` to attach constraint-gate status and
  certificate hash.

4) Training trace linkage
- Record GR tool runs and gate results via `server/routes/training-trace.ts` so
  verifier traces include physics outputs.

5) Tests and fixtures as dataset
- Convert existing GR fixtures/tests (for example `tests/gr-constraints.spec.ts`)
  into JSONL dataset rows to unify CI and model eval.

6) Unit metadata reuse
- Map unit metadata in `shared/math-stage.ts` (and physics constants) into
  `symbol_units` for automated `/physics/unit-check`.

7) Retrieval anchors
- Extend `tools/physicsContext.ts` and `codex/anchors` with the GR tool contracts
  so the LLM sees correct API shapes and conventions.

---

## physics.* Tool API (v1)

### Data types
- MetricSpec:
  - coords: [t, r, theta, phi] (or arbitrary)
  - g_dd: matrix expression (sympy-compatible)
  - assumptions: dict (e.g., r>0)
  - signature: fixed (-,+,+,+)

- TensorArtifact:
  - name: string
  - indices: e.g. "dd", "udd", "dddd"
  - components: dict or matrix/array
  - meta: {coords, assumptions, simplification_level}

- CheckResult:
  - check_name
  - passed: bool
  - residual: expression or numeric witness
  - notes

### Endpoints (minimum)
- physics.metric_validate(MetricSpec) -> CheckResult[]
- physics.christoffel(MetricSpec) -> TensorArtifact (Gamma^a_{bc})
- physics.riemann(MetricSpec, Gamma) -> TensorArtifact (R^a_{bcd})
- physics.ricci(MetricSpec, Riemann) -> TensorArtifact (R_bd)
- physics.ricci_scalar(MetricSpec, Ricci) -> scalar artifact
- physics.einstein_tensor(MetricSpec, Ricci, R) -> TensorArtifact (G_bd)
- physics.invariants(MetricSpec, Riemann, Ricci, R) -> dict of scalars

### Checks
- physics.check_metric_symmetry(g_dd) -> CheckResult
- physics.check_christoffel_symmetry(Gamma) -> CheckResult
- physics.check_riemann_symmetries(Riemann) -> CheckResult[]
- physics.check_contracted_bianchi(MetricSpec, EinsteinTensor) -> CheckResult
- physics.check_vacuum(EinsteinTensor) -> CheckResult (G_ab == 0 simplified)
- physics.unit_check(expression_or_equation, unit_system="SI|geometrized")
  -> CheckResult

### Utility
- physics.simplify(expr_or_tensor, level=0..3) -> simplified artifact
- physics.substitute(expr_or_tensor, substitutions) -> artifact
- physics.numeric_spotcheck(expr_or_tensor, sample_points) -> CheckResult

---

## Orchestrator Behavior

### Run DAG
Each node:
- inputs: artifact IDs
- op: tool call name + args
- outputs: artifact IDs
- checks: list of CheckResults
- status: pass/fail

### Agent loop
1) Parse user intent into a plan (structured)
2) Execute plan via tool calls
3) Run gates after each stage
4) If failure:
   - summarize failing residuals
   - propose minimal fixes (assumptions, sign conventions, simplification, etc.)
   - re-run affected DAG nodes only
5) Produce final report:
   - assumptions
   - verified artifacts
   - checks summary
   - narrative interpretation tied to artifacts

---

## Dataset Format (JSONL)

Each line:
- id: string
- prompt: string
- conventions: {signature, units_internal}
- expected_tools: [tool_call_signatures...]
- expected_checks:
  - {check_name, passed=true/false, notes_contains?}
- optional_expected_artifacts:
  - name + canonicalized expression (only if stable)
- tags: [metric, vacuum, frw, schwarzschild, units, debug, ...]

Gold outputs prioritize checks over exact symbolic forms.

---

## Evaluation

### Automated regression
- Run all dataset items.
- Report: pass rate per tag, mean tool calls, failure reasons.

### Correctness gates
A run is successful if:
- All required checks pass.
- No unresolved unit inconsistencies (if SI boundary used).
- Artifacts are produced and referenced in the final report.

---

## Milestones

M1: Tool server skeleton + metric validation + Christoffels
M2: Riemann/Ricci/Einstein + simplification + invariants
M3: Check suite (symmetries + Bianchi + vacuum)
M4: Orchestrator DAG + incremental re-run + final report generator
M5: Dataset v0 (200 tasks) + regression harness
M6 (optional): LoRA fine-tune on tool traces for better planning + code writing

---

## Integration Prompts (completed)

Prompt I1 (GR brick adapter) - Status: complete
- Goal: connect solver outputs to tool verification.
- Do: add an adapter that converts GR brick outputs into `MetricSpec` and
  spotcheck payloads; run invariants + identity checks; return a merged report.
- Do not: alter solver numerics or brick formats.
- Acceptance: adapter produces tool checks for at least one existing GR brick.

Prompt I2 (Agent loop tool) - Status: complete
- Goal: expose `physics.gr.assistant` to the planner.
- Do: implement `server/skills/physics.gr.assistant.ts` that proxies FastAPI
  endpoints, with a stable response schema and citations.
- Do not: bypass constraint gates or claim viability.
- Acceptance: tool is registered in `server/routes/agi.plan.ts` and usable.

Prompt I3 (Constraint gate linkage) - Status: complete
- Goal: attach gate status and certificate hash to each GR tool run.
- Do: call `physics.gr.grounding` (or `gr-evaluation.ts`) after tool outputs and
  merge status into the response.
- Do not: report ADMISSIBLE without a valid certificate + integrity ok.
- Acceptance: tool response includes gate status + certificate hash.

Prompt I4 (Training trace linkage) - Status: complete
- Goal: capture tool runs in training traces.
- Do: record each GR tool run and gate result via training trace API, with
  references to artifacts and constraints.
- Do not: drop provenance fields required by trace export.
- Acceptance: exported training trace shows GR tool steps.

Prompt I5 (Tests -> dataset) - Status: complete
- Goal: unify GR tests and dataset evaluation.
- Do: convert GR fixture inputs into JSONL rows with expected checks.
- Do not: duplicate metrics that already exist in unit tests.
- Acceptance: dataset rows reflect existing test cases and pass eval.

Prompt I6 (Unit metadata reuse) - Status: complete
- Goal: automate unit checks using repo metadata.
- Do: map unit signatures from `shared/math-stage.ts` and physics constants into
  `symbol_units` for `/physics/unit-check`.
- Do not: hardcode unit mappings in multiple places.
- Acceptance: unit checks run from a single metadata source.

Prompt I7 (Retrieval anchors) - Status: complete
- Goal: improve LLM accuracy on tool APIs.
- Do: add GR tool contract snippets to `tools/physicsContext.ts` anchors or
  `codex/anchors`.
- Do not: exceed context budgets or include unrelated files.
- Acceptance: tool contract snippets appear in assembled prompts.

---

## Usability Hardening Steps (priority order)

Step 1: Golden path examples + smoke dataset
- Add example metrics:
  - `tools/gr_assistant/examples/minkowski.json`
  - `tools/gr_assistant/examples/schwarzschild.json`
  - `tools/gr_assistant/examples/frw_flat.json`
- Add a one-command run path to show usage:
  `python tools/gr_assistant/orchestrator.py --metric-json tools/gr_assistant/examples/schwarzschild.json --out out/schwarzschild_report.json`
- Add a fixed smoke dataset (not random) for CI:
  `datasets/gr_assistant/gr_dataset_smoke.jsonl` (about 25 cases).

Example `tools/gr_assistant/examples/schwarzschild.json`:
```json
{
  "coords": ["t", "r", "theta", "phi"],
  "g_dd": [
    ["-(1 - 2*M/r)", 0, 0, 0],
    [0, "1/(1 - 2*M/r)", 0, 0],
    [0, 0, "r**2", 0],
    [0, 0, 0, "r**2*sin(theta)**2"]
  ],
  "signature": "-+++",
  "assumptions": ["r>0", "M>0"]
}
```

Example dataset JSONL line (check-based, numeric spotcheck friendly):
```json
{
  "id": "schwarzschild_vacuum_spotcheck_v1",
  "prompt": "Compute Einstein tensor for Schwarzschild metric and verify vacuum + Bianchi; compute Kretschmann scalar spotcheck.",
  "conventions": { "signature": "-+++", "units_internal": "G=c=1" },
  "metric_json_path": "tools/gr_assistant/examples/schwarzschild.json",
  "substitutions": { "M": 1.0 },
  "sample_points": [{ "t": 0.0, "r": 10.0, "theta": 1.0, "phi": 0.5 }],
  "tolerances": { "vacuum": 1e-10, "bianchi": 1e-10, "invariants": 1e-8 },
  "expected_checks": [
    { "check_name": "check_metric_symmetry", "passed": true },
    { "check_name": "check_contracted_bianchi", "passed": true },
    { "check_name": "check_vacuum", "passed": true }
  ],
  "expected_numeric": {
    "kretschmann_at_sample0": 0.000048
  },
  "tags": ["metric", "schwarzschild", "vacuum", "invariants", "spotcheck"]
}
```

Step 2: Default gates should be lean
- Default gate set (v1):
  - metric symmetry
  - Riemann symmetries (only if computed)
  - contracted Bianchi (Einstein tensor divergence)
  - vacuum check only when requested or tagged as vacuum
  - numeric spotcheck for non-trivial metrics
- Make expensive or noisy checks opt-in.

Step 3: Unit checking as a boundary contract
- Add a units mode flag: `--units=off|boundary|all` (default `boundary`).
- Use unit checks primarily at SI <-> geometrized boundaries and for user-supplied constants.
- Keep unit mappings centralized via `shared/math-stage.ts` signatures + constants.

Step 4: CI regression gate
- Add CI jobs:
  - `pytest tools/gr_assistant/tests`
  - `python tools/gr_assistant/eval.py --dataset datasets/gr_assistant/gr_dataset_smoke.jsonl --base-url http://127.0.0.1:8000`
- Fail build if pass rate drops below a defined threshold.

Step 5: Actionable failure reporting
- Every failed gate should answer:
  - what failed
  - where in the pipeline
  - residual or witness
  - likely causes
  - suggested next tool call

Step 6: Defer LoRA until the tool stack is stable
- Only fine-tune after:
  - tool contracts are stable
  - real usage traces exist
  - a target metric is defined (example: reduce invalid calls by 80 percent)

---

## Time Dilation Lattice Panel Integration (GR correctness interpretation)

Goal: connect the GR assistant report to the time dilation lattice panel so each
solve is interpreted for GR correctness and tied to lattice geometry.

Reuse map (existing components)
- `server/gr/gr-assistant-adapter.ts` for MetricSpec + sample point extraction.
- `server/skills/physics.gr.assistant.ts` for CAS checks/invariants + gate/cert.
- `server/gr/gr-evaluation.ts` for constraint gate policy and status.
- `client/src/hooks/useGrBrick.ts` and `client/src/hooks/useHullPreviewPayload.ts`
  for lattice inputs.
- `client/src/components/TimeDilationLatticePanel.tsx` for UI rendering.

Data flow (default)
1) Panel collects the latest GR brick, hull geometry, and pipeline metadata.
2) Client sends a request to a new server route (see prompts below) with:
   - brick summary or id (avoid full voxel payloads),
   - hull bounds and axes,
   - conventions (signature, units_internal),
   - sampling mode (center, wall, exterior).
3) Server builds MetricSpec + sample_points via the adapter, attaches diagnostics,
   calls `physics.gr.assistant`, and merges gate status.
4) Server returns `GrAssistantReport` with checks, invariants, gate, and notes.
5) Panel renders a GR correctness summary plus invariants with source tags.

Interpretation rules (panel copy)
- Gate HARD fail or failed contracted Bianchi => mark geometry "GR inconsistent".
- Vacuum check fail => mark "non-vacuum" unless the run is tagged as vacuum.
- Use `brick_invariants` to show solver-reported curvature bands; use CAS
  invariants for correctness checks.
- Derive time dilation from `g_tt` only when signature is -+++ and `g_tt < 0`.

### Panel Integration Prompts (pending)

Prompt P1 (Server route: gr-assistant report) - Status: complete
- Goal: expose a GR correctness report to the UI for a pipeline snapshot.
- Do: add `POST /api/helix/gr-assistant-report` that accepts a snapshot id or
  lightweight brick summary, uses `gr-assistant-adapter`, calls
  `physics.gr.assistant`, and returns report + gate + certificate hash.
- Do not: return ADMISSIBLE without a valid certificate + integrity ok.
- Acceptance: route returns a stable report shape with checks, invariants, and
  gate status for a live pipeline run.

Prompt P2 (Client hook: useGrAssistantReport) - Status: complete
- Goal: fetch GR assistant reports from the lattice panel with caching.
- Do: add a hook that derives request inputs from `useGrBrick`,
  `useHullPreviewPayload`, and pipeline state; throttle refetch to avoid spam.
- Do not: auto-run on every render tick or ship full voxel buffers.
- Acceptance: a single hook call returns report data + loading state for the
  panel.

Prompt P3 (Panel UI: correctness summary) - Status: complete
- Goal: render GR correctness and invariants next to the lattice view.
- Do: add a "GR correctness" block with pass/fail badge, first failing check,
  invariants table (min/mean/p98), and conventions echo.
- Do not: claim physical viability when gate status is not ADMISSIBLE.
- Acceptance: panel shows report fields and updates when the pipeline changes.

Prompt P4 (Sampling policy) - Status: complete
- Goal: ensure sample points represent the center, wall, and exterior geometry.
- Do: derive sample points from hull bounds + lattice grid; clamp to bounds,
  skip masked hull regions, and pass to `vacuum_sample_points`.
- Do not: sample at singularities or outside the valid hull region.
- Acceptance: report includes sample points aligned with hull geometry.

Prompt P5 (Contract test) - Status: complete
- Goal: prevent API drift between UI and server.
- Do: add a server test that posts a fixture payload and asserts response shape,
  including `report.checks`, `report.invariants`, and `gate.certificate`.
- Do not: rely on random data or non-deterministic metrics.
- Acceptance: test fails if the report schema changes.

---

## Safety / Robustness Notes
- Never trust LLM algebra without tool confirmation.
- Always record conventions and assumptions in artifacts.
- Prefer numeric spotchecks as additional sanity where symbolic simplify is hard.

---

## Zen Society Alignment (Draft)
Status key: [ ] pending | [x] policy brief drafted (implementation pending).
Policy brief: docs/zen-society-alignment.md.
- [x] Protect civilian dignity and prevent predation. Safety is a prerequisite.
  - [x] Align conduct with international humanitarian and human-rights norms,
    enforce discipline consistently, and give civilians trusted reporting
    channels with rapid, independent follow-up.
- [x] Stabilize essential services (power, water, fuel, transport, telecom).
  Without these every promise is fragile.
  - [x] Keep hospitals, water treatment, fuel distribution, ports, and telecom
    functioning first, then publish a restoration schedule.
- [x] Establish legible, durable authority for contracts.
  - [x] Publish the legal basis, mandate limits, authorized signatories, and
    dispute-resolution path so agreements have provenance and survive political
    shifts.
- [x] Reopen lawful finance/insurance rails.
  - [x] Reduce coercion and corruption risk by issuing clear sanctions and
    compliance guidance and restoring monitored pathways for payments,
    insurance, and shipping that keep capital lawful and transparent.
- [x] Earn local buy-in for a legitimate transition.
  - [x] Convert "order" into consent through inclusive local governance,
    protected civic space, and transparent timelines.
- [x] Keep verification and accountability loops active.
  - [x] Run continuous integrity loops with public indicators, independent
    monitoring, and correction triggers so abuses are investigated.

### Reusable Artifact Pack (Plan)
- [x] Treat each pillar as a template and wire templates to ideology node IDs
  so future instances trace back to `docs/ethos/ideology.json`.
- [x] Build a template set under `docs/zen-society/` with fields for purpose,
  scope, nodeRefs, minimum checks, evidence links, and review cadence.
- [x] Add a crosswalk registry (md or json) that maps `artifactId` ->
  `ideology node ids` -> required checks as the canonical ethos index.
- [x] Standardize gates with `two-key-approval` for legal + ethos signoff, and
  `verification-checklist` + `feedback-loop-hygiene` for recurring audits and
  public indicators.
- [x] Treat provenance and continuity as first-class artifacts via a signatory
  registry and decision log tied to `provenance-protocol` +
  `civic-memory-continuity`.
- [x] Package minimal artifacts per node (charter, protocol, ledger, dashboard)
  so each pillar produces the same reusable set across deployments.

---

## NoiseGen Development Notes (from patch trail)

Got it. Based on the patch notes you pasted (the "1...6...todo...1...6" trail), you've already built most of the plumbing and a surprising amount of the execution layer. What's still missing is mainly the "brains" layer (a real model + real feature extraction feeding it), plus some tooling that turns your raw materials (stems/MIDI/Ableton exports) into a curated, indexable library the planner can reliably pull from.

Here's the clean "what exists" vs "what's left" map.

---

What you have so far

1) RenderPlan exists end-to-end (plumbing is basically done)

You now have:
- RenderPlan type defined (global + per-window intent).
- renderPlan?: RenderPlan added to CoverJobRequest in noise-gens.ts.
- Zod schema updated so it's optional and backward compatible.
- cover-runner.ts forwards renderPlan into the worker payload.
- CoverCreator.tsx has a plan editor panel that:
- stores a draft,
- can enable/disable "Use plan,"
- injects the plan into the request only when enabled.

Meaning: You can carry a plan through the whole pipeline without breaking existing covers. [done]

---

2) The worker executes plans per window (the engine now has "gears")

In cover-worker.ts you've moved from "one texture per job" to "texture per window when a plan exists":
- Builds a plan window map and computes textureFrom(...) per window.
- Per-window impulse/IR loading (or reuse when same IR).
- When no plan: it preserves old behavior (single texture, same impulse path).

Meaning: The renderer can now follow a timeline of decisions, not just a single static recipe. [done]

---

3) Plan-provided EQ/FX overrides are wired into the texture pipeline

You've connected:
- renderPlan.texture.eqPeaks and renderPlan.texture.fx through texture-map.ts (sanitized, scaled, merged).
- Worker uses plan FX fields (including optional reverbSend / comp), while preserving defaults if missing.

Meaning: RenderPlan isn't just a label, it can actually steer sound. [done]

---

4) Knowledge files are usable locally (no more forced remote)

You fixed the earlier "knowledgeFileIds -> remote-only" trap:
- cover-runner.ts resolves knowledgeFileIds into knowledgeAudio blob URLs and passes them to the worker.
- Cleanup revokes object URLs after render.
- CoverCreator.tsx no longer forces remote just because knowledgeFileIds exist.

Meaning: Ableton exports, atoms, motifs stored as knowledge files can feed the local renderer. [done]

---

5) Material scheduling exists (audio atoms are real)

You've implemented a first "material layer":
- renderPlan.material.audioAtomIds can be resolved from knowledgeAudio.
- Worker can inject atom buffers into windows.
- Optional transposeSemitones / timeStretch maps to playbackRate.
- Looping/staggering behavior if atom too short.

Meaning: Your plan can place actual audio ingredients on the timeline. [done]

---

6) MIDI motif engine exists (symbolic can become audible)

You've gone beyond IDs:
- Motif JSON format parsed and normalized.
- Deterministic quantize + arp.
- Basic synth in the worker (oscillator + ADSR).
- Motifs resolve from Knowledge JSON/text files via midiMotifIds.

Meaning: "Symbolic atoms" are now a real render source, not just a placeholder. [done]
(Still early sound design wise, but the loop is closed.)

---

7) Groove templates + macro curves exist (more "Ableton-like intent")

You added:
- Groove offsets (timing + velocity shaping).
- Macro curves that modulate synth parameters over time (currently limited targets, but it's a start).

Meaning: You've started modeling "performance feel" and "automation intent," not just note grids. [done]

---

8) /api/ai/plan exists and can generate usable plans (but it's still not ML)

This endpoint evolved from stub -> heuristic planner with optional analysis inputs:
- Accepts analysis.energyByBar and per-window feature hints.
- Converts that into per-window sampleInfluence/styleInfluence/weirdness and FX.
- Can pass through material decisions.

Meaning: You can already generate executable plans, especially if analysis is supplied. [done]
But it's still mostly rule-based logic.

---

9) Closed-loop ranking exists (plans can "audition")

You built a loop that:
- generates multiple candidate plans,
- scores them with immersion/IDI,
- auto-applies the best plan in the UI.

Meaning: The system can do "try 4, keep 1," which is a huge practical unlock. [done]

---

10) Atom library curation exists (manual + some automatic)

You have:
- Tag editing UI + Atom Library panel.
- Auto analysis + auto tags + index stats.
- "Auto-fill atoms" button that injects selections into a plan.

Meaning: You can curate and reuse ingredients, not just render from raw stems. [done]

---

11) A baseline training pipeline exists (offline scripts)

You have scripts to:
- build a dataset from stems,
- fit lightweight regressors to predict knob targets,
- output a RenderPlan from analysis.

Meaning: You have a first stepping stone toward "real ML planner," but it's not wired into runtime yet. [done]/[warning]

---

What's left to build

Think of what's missing as three big "missing organs":
1. Real track understanding inputs (feature extraction + Ableton ingestion that's reliable)
2. A real planner brain (model inference in /api/ai/plan, not just heuristics)
3. Better materials and sound realism (atoms and motifs that sound like you, not a test synth)

Here's the backlog, grouped by impact.

---

Highest impact next

A) Make /api/ai/plan truly model-backed (keep heuristics as fallback)

Right now you have:
- heuristic planner [done]
- offline training scripts [done]
- but no runtime inference hookup [todo]

What to build:
- A "planner backend" module that:
- loads a model artifact (versioned),
- runs inference from extracted features,
- outputs RenderPlan,
- falls back to heuristic if model missing or confidence low.

Add:
- plannerVersion, modelConfidence, featureSourcesUsed into plan response meta.
- A small "golden test set" of 20-50 tracks/windows to detect regressions.

Outcome:
- "Generate plan" becomes genuinely learned behavior, not a ruleset wearing a trench coat.

---

B) Solidify feature extraction (audio-derived and metadata-derived)

You started this with plan-analysis.ts and ableton-analysis.ts. The missing piece is reliability and coverage.

What to build next:
- Bar alignment that survives reality
- tempo maps
- offsets
- non-grid intros
- silence sections
- Better musical features
- onset density (rhythmic activity)
- spectral centroid/rolloff (brightness)
- chroma/key confidence (optional)
- dynamic range / crest factor (mix intensity proxy)

And: store analysis artifacts alongside knowledge files so ranking does not recompute constantly.

Outcome:
- The planner sees consistent "truth" instead of guessy summaries.

---

C) RenderPlan global fields should control arrangement, not just metadata

You said you wired bpm and energyCurve and sections labeling into the worker. Great.

What's still missing is "global constraints" that prevent mid-song amnesia:
- enforce section grammar (intro -> build -> drop -> ...)
- enforce motif reuse schedule ("bring back theme A at bar 33")
- enforce energy continuity (no random cliff drops unless intended)

This is how you get the Eno-style "it keeps making sense" feeling.

Outcome:
- Longer renders stay coherent past 30 seconds.

---

Next tier

D) Atom extraction pipeline (not just tagging)

You have tagging and analysis, but you still need the "atom factory."

What to build:
- Automatic slicing from stems into atoms:
- transient-based for one-shots
- loop detection for rhythmic phrases
- phrase segmentation for pads/textures
- Normalization and trimming:
- tight loop endpoints
- fade handling
- loudness normalization
- Dedupe and clustering:
- avoid 50 near-identical hats
- Auto labels:
- "kick", "hat", "snare-like", "pad", "drone", "riser"
- key + bpm estimates where relevant

Outcome:
- You stop hand-curating everything and the library becomes "alive."

---

E) MIDI motif realism: the synth needs to sound like your world

Your current worker synth is enough to prove the pipe, but it won't sound like your Ableton patches.

Options that scale:
- Sample-based motif synth
- export a short "patch fingerprint" sample per instrument (or multi-samples)
- worker plays motifs through that sampler with envelopes + filters
- Macro mapping
- map Ableton macros to synth parameters that exist in the worker (filter cutoff, resonance, env amount)
- .mid ingestion
- accept real MIDI files from Ableton exports (not only JSON notes)

Outcome:
- Symbolic generation stops sounding like a diagnostic beep and starts sounding like you.

---

F) UI: move from JSON editing to timeline editing

The plan editor exists, but it's still a "JSON cockpit." The next upgrade is a timeline view:
- window grid (bars on x-axis)
- section blocks
- curves for energy/sampleInfluence/styleInfluence/weirdness
- per-window material chips (atoms/motifs)
- quick audition: click a window -> render 4 bars preview

Outcome:
- You iterate like a producer, not like a schema engineer.

---

Closed-loop improvements

G) Ranking speed and selection strategy

You've got plan ranking, which is huge. Next improve:
- "Rank on preview" mode (8-16 bars) before full render
- caching analysis + intermediate renders
- multi-objective scoring:
- maximize IDI/immersion
- penalize repetition
- penalize too-close similarity to the original (if you add similarity checks)

Outcome:
- The system becomes a fast creative assistant instead of a slow lottery.

---

What I would do next, in your shoes

If your goal is "generative soundscapes that stay good for minutes," the next build should be:
1. Model-backed planner integration into /api/ai/plan
2. Robust feature extraction + caching
3. Arrangement constraints using sections + energy curve
4. Preview-first ranking loop

That combo attacks the exact thing you complained about with Suno: long-horizon drift.

Atoms and MIDI realism are also important, but they're "timbre wins." The above is "structure wins." Structure is what keeps minute 2 from collapsing.

---

A crisp "state of the project" summary

Right now you've built:
- A plan-shaped nervous system (RenderPlan plumbing)
- A renderer that can follow per-window intent (worker execution)
- A first brainstem (heuristic planner + ranking loop)
- A pantry (atom library + analysis)
- A prototype symbolic instrument (motif synth + groove + macros)
- A training sketchpad (dataset + regressors)

What's left is:
- a real learned planner (runtime inference + evaluation),
- a dependable feature extractor pipeline (audio + Ableton metadata),
- a grown-up atom factory (auto extraction + dedupe + labeling),
- a producer-friendly plan UI (timeline and audition),
- and better motif sound authenticity (sample-based or macro-mapped synthesis).

If you want, I can turn this into a "next 10 PRs" checklist with acceptance criteria per PR (what files change, what success looks like, and how you test each piece).

---

## NoiseGen Workflow Prompts

Prompt NG1 (Listener mode macros) - Status: complete
- Goal: add a listener-level UI with 3-5 macro knobs (energy, space, brightness, weirdness, drive) plus A/B (artist vs your version), undo, and reset.
- Do: implement a simple one-screen panel and map macros to CoverJobRequest base knobs or RenderPlan global controls; wire A/B to plan on/off.
- Do not: expose the full RenderPlan JSON in listener mode.
- Acceptance: macros update renders, A/B toggles artist vs user plan, undo/reset are always visible.

Prompt NG2 (Explorer mode groups + locks) - Status: pending
- Goal: add a mid-level UI with 4-8 stem groups and lock toggles.
- Do: add group macros and lock switches; map to RenderPlan material or new global locks.
- Do not: require DAW-level routing or 30+ tracks.
- Acceptance: locked groups stay unchanged when plans are generated or ranked.

Prompt NG3 (Creator mode timeline editor) - Status: pending
- Goal: build a timeline editor for RenderPlan windows, sections, energy curve, textures, and materials.
- Do: add a bar-grid timeline UI that serializes to RenderPlan and drives local renders.
- Do not: require JSON editing for core tasks.
- Acceptance: timeline edits produce valid RenderPlan JSON and update previews.

Prompt NG4 (Model-backed planner) - Status: complete
- Goal: add runtime inference to /api/ai/plan with a real model.
- Do: implement a planner backend that loads model artifacts, runs inference, and falls back to heuristics with meta fields.
- Do not: remove heuristic fallback.
- Acceptance: response includes model version, confidence, and feature sources used.

Prompt NG5 (Feature extraction hardening + cache) - Status: complete
- Goal: expand plan features and cache analysis per original.
- Do: extend plan-analysis and ableton-analysis with tempo maps, silence, onset density, spectral centroid/rolloff, optional chroma, and dynamic range; store artifacts.
- Do not: recompute full analysis for every ranking run.
- Acceptance: cached analysis is reused for plan generation and ranking.

Prompt NG6 (Arrangement constraints) - Status: pending
- Goal: enforce global arrangement constraints for long-form coherence.
- Do: add section grammar, motif reuse scheduling, and energy continuity; enforce in the worker.
- Do not: allow random plan drift across windows.
- Acceptance: long renders follow section and motif rules.

Prompt NG7 (Atom extraction pipeline) - Status: pending
- Goal: automate atom extraction from stems with dedupe and labeling.
- Do: add slicing (transient, loop, phrase), normalization, trimming, clustering/dedupe, and auto labels with key/bpm where relevant.
- Do not: rely only on manual tagging.
- Acceptance: extracted atoms appear in the Atom Library with tags and metadata.

Prompt NG8 (Motif realism) - Status: pending
- Goal: make MIDI motifs sound like real instruments.
- Do: add sample-based motif playback (single or multi-sample), macro mapping, and MIDI file ingestion from Ableton exports.
- Do not: keep only the diagnostic oscillator synth.
- Acceptance: motifs render with sample timbre and accept MIDI files.

Prompt NG9 (Preview-first ranking loop) - Status: complete
- Goal: rank plans on short previews with caching.
- Do: implement 8-16 bar previews, cache intermediate renders, and add multi-objective scoring (IDI + repetition penalties).
- Do not: force full renders for every candidate.
- Acceptance: ranking is faster and selects better candidates reliably.

Prompt NG10 (Recipe export and sharing) - Status: complete
- Goal: persist and share recipes (assets + constraints + RenderPlan + seed).
- Do: add storage and UI to save/load recipes; enable deterministic re-render.
- Do not: export only WAV files.
- Acceptance: saved recipes can be reloaded and reproduce the same output.

Prompt NG11 (Latency-safe playback) - Status: pending
- Goal: support near-real-time macro changes.
- Do: add chunked pre-rendering or a realtime playback path with low-latency updates.
- Do not: block on full offline renders for simple macro tweaks.
- Acceptance: macro changes feel immediate in listener and explorer modes.

Prompt NG12 (Progressive disclosure UI modes) - Status: pending
- Goal: implement a layered UI model so the player is simple by default and advanced tools are opt-in.
- Do: add noisegenUiMode (listener | remix | studio | labs) plus optional showAdvanced; persist via preferences; gate panels in helix-noise-gens.tsx; add a layer router that selects which components render based on mode, device, and whether the user has opened advanced tools.
- Do not: show DAW or diagnostic panels on first load.
- Acceptance: each mode shows the intended panel set and can be switched without losing playback state.

Prompt NG13 (Listener player skin) - Status: pending
- Goal: deliver a simple, complete listener experience.
- Do: skin CoverCreator as a player surface with play/pause, scrub, next/prev, a single Vary button, 3-7 mood chips, Customize, Save/Share recipe, and Undo/Reset; keep DualTopLists visible and compress MoodLegend into chips.
- Do not: expose RenderPlan JSON, AtomLibraryPanel, TrainingPlan, StemDaw, or NoiseFieldPanel in listener mode.
- Acceptance: a listener can pick a track, generate variations, save/share, and reset without seeing creator tooling.

Prompt NG14 (Customize drawer macros) - Status: pending
- Goal: add a curiosity door that exposes only macro controls.
- Do: implement a drawer/sheet with Energy, Space, and Texture sliders (plus optional Locks: groove, harmony, drums); map macros to RenderPlan overrides (texture.fx, eqPeaks, comp, reverbSend, energy curve).
- Do not: show stems or atom pickers in this drawer.
- Acceptance: macro changes visibly alter render output and persist per session.

Prompt NG15 (Remix layer) - Status: pending
- Goal: unlock mid-level control without full DAW complexity.
- Do: reveal Ingredients (atoms), a lightweight Structure view, and Auto-pick best variation (plan ranking) in Remix mode; allow entry after 3+ renders or explicit toggle.
- Do not: expose full DAW lanes or training diagnostics here.
- Acceptance: remix users can pick atoms/motifs, tweak structure, and auto-rank variations.

Prompt NG16 (Studio mode gating) - Status: pending
- Goal: make creator tooling explicit and intentional.
- Do: show ProjectAlbumPanel, StemDaw, UploadOriginalsModal, OriginalsLibraryModal, AtomLibraryPanel, and TrainingPlan only in Studio mode.
- Do not: auto-open Studio on first visit or when in Listener/Remix.
- Acceptance: Studio tools are available on demand without leaking into listener flow.

Prompt NG17 (Labs diagnostics) - Status: pending
- Goal: isolate diagnostic panels for builders.
- Do: place NoiseFieldPanel and other scope-like diagnostics behind a Labs tab or deep link.
- Do not: show Labs content in Listener/Remix/Studio by default.
- Acceptance: Labs is accessible but not on the primary path.

Prompt NG18 (Lyrics storage and edit flow) - Status: pending
- Goal: support manual lyric paste per original.
- Do: add lyricsText to Original storage; add endpoints to save/get lyrics; expose "Add/Edit lyrics" only in Studio/Creator surfaces.
- Do not: require DAW uploads or auto-transcription in v1.
- Acceptance: lyrics can be saved and reloaded for an original.

Prompt NG19 (Lyrics + meaning split view) - Status: pending
- Goal: reveal lyrics and ideology parallels without breaking the player.
- Do: add a Lyrics button in CoverCreator that opens a split view: lyrics on the right, ideology parallels on the left, player stays centered; on mobile use a bottom sheet with Lyrics and Meaning tabs.
- Do not: move this into a separate full-page panel.
- Acceptance: the split view opens and closes smoothly, keeping playback controls visible.

Prompt NG20 (Ideology parallels generation) - Status: pending
- Goal: generate lay-friendly ideology parallels from lyrics, anchored to the ideology tree.
- Do: implement a lyrics-to-ideology pipeline anchored at rootId mission-ethos; segment lyrics, score nodes (keywords + semantic similarity), select top nodes from a coherent branch; return nodePath, lyric snippet, parallel text, confidence; cache by lyricsHash + ideology tree version.
- Do not: claim author intent or output ungrounded conclusions.
- Acceptance: Meaning cards render with node title/path, lyric quote, and a 1-2 sentence parallel.

Prompt NG21 (Playback-synced lyric highlights) - Status: pending
- Goal: add a subtle "living liner notes" effect.
- Do: highlight the current lyric line during playback and softly glow the matching Meaning card.
- Do not: introduce distracting auto-scroll or flashing UI.
- Acceptance: highlight sync is present and does not disrupt listening.

Principle NG-P1 (Fairness baseline for expressive truth) - Status: pending
- Goal: ground lyric interpretation in a fairness baseline with checkable reasoning.
- Do: anchor parallels to mission-ethos; surface a reason path (worldview-integrity, integrity-protocols, verification-checklist, right-speech-infrastructure, interbeing-systems, jurisdictional-floor, stewardship-ledger); show evidence, meaning, and certainty layers for each parallel.
- Do not: treat vibes as proof or claim author intent.
- Acceptance: every meaning card includes a lyric snippet, a node path, a short parallel, and a confidence/why field that reflects evidence.

Prompt NG22 (Player-as-a-lens framing) - Status: pending
- Goal: treat playback as a lens that adds context, values, and provenance without turning listening into mixing.
- Do: build toward a "player-as-a-lens" where playback plus context (lyrics), values (ideology tree), and provenance (time/place/sky) make the track a living artifact with liner notes that can update, branch, and stay grounded.
- Do: keep the focus on meaningful steering and meaningful reference (not mixing), aligned to the fairness baseline + checkable spine principle.
- Do not: collapse the player into a DAW surface.
- Acceptance: listener mode stays simple while still offering context, values, and provenance as opt-in reveals.

Prompt NG23 (Provenance vs security key) - Status: pending
- Goal: clarify the difference between public provenance and secret cryptographic keys for sky/time inputs.
- Do: document the two goals that sound similar: (1) a public, historical anchor ("This version was generated under these sky conditions, at this time.") that is public and reproducible; (2) a secret, cryptographic key ("Only I can reproduce this value; no one can predict it.").
- Do: state that the product goal is #1 with a sprinkle of "unpredictability" for artistic freshness, not security.
- Do not: position telescope/sky data as a secrecy foundation.
- Acceptance: product copy and technical docs consistently treat this as provenance, not secrecy.

Prompt NG24 (Public randomness beacon pulse) - Status: pending
- Goal: add a fairness-friendly external randomness pulse for provenance/versioning.
- Do: support public randomness beacons as a "cosmic pulse", including NIST Randomness Beacon (public pulses, time-stamped, designed as a public utility concept) [ref], and drand (distributed randomness beacon, publicly verifiable randomness at fixed intervals; Cloudflare documents a beacon service built on drand) [ref].
- Do: use the beacon as a public salt, not secrecy; seed = hash(trackId + publishedAt + location + beaconRound + beaconValueHash).
- Do: preserve the benefits explicitly: historical anchoring (time), external "unowned" randomness (fairness vibe), reproducibility (store the round to regenerate later).
- Do not: treat beacon output as private or secret.
- Acceptance: a render can reference the beacon round/value hash and be reproduced later.

Prompt NG25 (Cosmic photon pulse) - Status: pending
- Goal: support a studio-only "local sky sensor" ritual mode.
- Do: add a mode that derives randomness from cosmic photon arrival timing, acknowledging that photon arrivals are fundamentally noisy and not practically predictable at detection level [ref].
- Do: record the derived seed for reproducibility (store the pulse you used).
- Do: document tradeoffs: awesome concept, hardware/sensor heavy, reproducibility requires storing derived seed.
- Do not: require this for standard listener workflows.
- Acceptance: creators can generate a seed from "tonight's sky" and persist it as metadata.

Prompt NG26 (Entanglement-based randomness pulse) - Status: pending
- Goal: support a public entanglement-backed pulse when available.
- Do: include an entanglement-based randomness source such as CURBy (public beacon using quantum entanglement to generate verifiable random numbers) [ref].
- Do: treat it like drand/NIST as a public salt with strong "checkable spine" vibes.
- Do: note tradeoffs: likely consumed as a public service, not run locally.
- Do not: position it as a private key.
- Acceptance: pulse source can be selected and stored like other beacon inputs.

Prompt NG27 (Deterministic + indeterminacy + accountability layers) - Status: pending
- Goal: formalize the philosophy into engineering layers.
- Do: describe and implement the three layers: deterministic layer (track, ideology tree, published/composed timeline, ephemeris-like sky context), indeterminacy layer (external pulse or sensor noise), accountability layer (store inputs so anyone can reproduce the exact RenderPlan).
- Do: present the framing: context + pulse + replayability.
- Do not: introduce metaphysical claims beyond these layers.
- Acceptance: documentation and implementation reflect the three-layer model.

Prompt NG28 (Time & Sky micro-surface in split view) - Status: pending
- Goal: add Time & Sky as a compact, optional sub-surface in the lyrics/meaning split view.
- Do: in listener view, keep split view header with right tab "Lyrics", left tab "Meaning", and a tiny "Time & Sky" info button.
- Do: when tapped, show a compact card (not a panel explosion) with: Published (YYYY-MM-DD), Made (YYYY-MM -> YYYY-MM), Place ("City (approx)"), Sky signature (HALO-XXXX... with copy), Variation pulse (beacon round with copy), and an "Explore timeline" deep link to Halobank.
- Do not: expose a full dashboard from the main player.
- Acceptance: Time & Sky reads like liner notes and stays optional.

Prompt NG29 (Creator pulse controls + privacy) - Status: pending
- Goal: let creators opt into cosmic pulse seeding and control place privacy.
- Do: add a Studio mode toggle "Use cosmic pulse for seeding" with source selection (drand / NIST beacon / local sensor) and record to metadata.
- Do: allow place privacy settings: exact, approximate, or hidden.
- Do not: force creators into a public location disclosure.
- Acceptance: creators can select pulse source and place precision per track.

Prompt NG30 (Context + pulse data model) - Status: pending
- Goal: store reproducible context and pulse metadata separately.
- Do: implement Context with publishedAt, composedStart, composedEnd, timezone, location (optional/coarse), halobankSpanId or timestamps.
- Do: implement Pulse with pulseSource ("drand" | "nist-beacon" | "curby" | "local-sky-photons"), pulseTime or round, pulseValueHash, seedSalt (derived salt for reproduction).
- Do: apply in RenderPlan generation: deterministic plan from analysis + ideology context, then apply pulse to choose among candidates or perturb parameters in a bounded way.
- Do not: allow pulse to introduce chaotic changes; bounded freshness only.
- Acceptance: stored context + pulse can reproduce the same RenderPlan output.

Prompt NG31 (Safety note: not encryption) - Status: pending
- Goal: prevent misclassification of the pulse as security key material.
- Do: keep language explicitly in the lane of provenance, versioning, fairness anchoring, and artistic ritual.
- Do not: market this as secure secret key material.
- Acceptance: UI and docs include a plain safety note that this is verifiable context, not secrecy.

Prompt NG32 (V1 pulse source choice) - Status: pending
- Goal: pick a practical v1 pulse source and defer hardware rituals.
- Do: select drand or NIST beacon as the v1 pulse source because it is easy, publicly verifiable, and maps cleanly to the fairness baseline idea [ref].
- Do: plan a later Studio-only "local sky photons" ritual mode [ref].
- Do not: block v1 on hardware or entanglement sources.
- Acceptance: v1 ships with a public beacon pulse and a roadmap note for local sky sensor mode.

Prompt NG33 (Intent Contract v1) - Status: pending
- Goal: add a creator-authored "intent contract" that defines the laws of motion for each track.
- Do: store invariants (tempo/key/groove/motif identity/stem locks), allowed variation ranges (sampleInfluence/styleInfluence/weirdness/reverb/chorus/arrangement moves), meaning anchors (ideology root + allowed subtrees), and provenance policy (what gets stored, pulse usage, place precision) on the Original.
- Do: provide a simple Studio UI to capture the contract at upload/edit time.
- Do not: require a full DAW or complex JSON editing to define the contract.
- Acceptance: each Original can carry an intent contract that is editable in Studio mode and readable in Listener mode as a summary.

Prompt NG34 (Intent Contract enforcement) - Status: pending
- Goal: ensure all plans, renders, and variations stay inside the creator's contract.
- Do: clamp plan parameters to allowed ranges; reject or repair illegal plans; enforce stem/group locks; prevent disallowed arrangement moves.
- Do: surface "intent violations" in logs and attach an intentSimilarity score to each edition.
- Do not: allow ranking or rendering to bypass contract checks.
- Acceptance: every generated edition is contract-compliant or explicitly rejected with a reason.

Prompt NG35 (Edition receipts in recipes) - Status: pending
- Goal: make each render a reproducible, inspectable edition.
- Do: extend recipes to include contract hash/version, ideology mapping hash + tree version, time/place/sky context reference, pulse metadata, and model/tool versions.
- Do: expose a "receipts" panel in the edition view so listeners can see why this version exists.
- Do not: store only audio without the receipt payload.
- Acceptance: every saved edition can be reproduced and audited from its receipt.

Prompt NG36 (Creator official editions) - Status: pending
- Goal: let creators publish canonical editions (e.g., Original, Night Mix, Live Room, Ambient Drift).
- Do: allow creators to save named, featured recipes that appear first for listeners.
- Do: keep these editions within the intent contract and provenance policy.
- Do not: let featured editions bypass locks or ranges.
- Acceptance: listeners can select a creator-featured edition and see its receipts.

Prompt NG37 (Edition lineage graph) - Status: pending
- Goal: show edition history as a branching tree, not just a flat list.
- Do: record parent/child relationships for each render; allow "fork from edition" and show plan deltas, mood changes, IDI, and intentSimilarity.
- Do: let creators feature or annotate branches.
- Do not: lose lineage when a recipe is shared or reloaded.
- Acceptance: the edition graph is navigable and makes provenance/lineage clear.

Prompt NG38 (Upload processing pipeline: normalize + analyze stems) - Status: complete
- Goal: make uploads slow-but-safe for creators and zero-friction for listeners.
- Do: on upload/publish, normalize all stem WAVs to PCM16 (44.1k or 48k), verify duration, and compute waveform peaks + loudness + alignment metadata; store analysis artifacts alongside the masters in object storage.
- Do: expose processing state (queued/processing/ready/error) so creators can wait while jobs run.
- Do not: rely on client-side decoding for later UI waveforms or stem readiness.
- Acceptance: once processing finishes, stems and waveforms are ready without re-decoding in the browser.

Prompt NG39 (Playback derivatives: mixdown + browser-safe codecs) - Status: complete
- Goal: make listener playback universal and instant.
- Do: generate a mixdown if the creator does not supply one; encode a playback set (arguably Opus + AAC, optional MP3 fallback); upload to object storage with codec metadata.
- Do: keep masters/stems separate from playback derivatives (masters for studio/render, playback for listener).
- Do not: stream stems for the listener UI.
- Acceptance: every published song has at least one browser-safe playback asset.

Prompt NG40 (Manifest + readiness gating) - Status: complete
- Goal: prevent half-processed originals from appearing as ready.
- Do: extend the original manifest to include playback assets, master assets, analysis artifacts, and processing status.
- Do: update API responses to return readiness and playback asset list; keep items in "pending" until playback derivatives exist.
- Do not: mark an original as "ranked/ready" without playback assets.
- Acceptance: new uploads surface immediately in pending, then auto-move to ready when processing completes.

Prompt NG41 (Listener playback routing) - Status: complete
- Goal: ensure the listener always uses the playback lane, not stems.
- Do: update the listener player to prefer playback assets and provide multiple <source> codecs; only fall back to stems in Studio/Remix contexts.
- Do: display a clear error when playback assets are missing or inaccessible.
- Do not: initialize multi-stem decoding in Listener mode.
- Acceptance: listener playback always streams a single mix via playback assets.

Prompt NG42 (Noise Gen capabilities probe + API) - Status: complete
- Goal: make codec readiness explicit and reliable.
- Do: run `ffmpeg -version` at boot, cache the result, and expose `/api/noise-gens/capabilities` with `{ ffmpeg: boolean, codecs: string[] }`.
- Do: use this flag to gate transcode and UI messaging.
- Do not: assume ffmpeg exists in production environments.
- Acceptance: the capabilities endpoint reports ffmpeg availability and supported codec list.

Prompt NG43 (Codec readiness UI badge) - Status: complete
- Goal: make playback readiness visible during upload/publish.
- Do: show "Codec pack ready" in Studio/Upload when ffmpeg is available.
- Do: show "WAV-only playback (ffmpeg missing)" when it is not.
- Do not: hide missing codec status from creators.
- Acceptance: creators can see codec readiness without digging in logs.

Prompt NG44 (Fail-safe transcode pipeline) - Status: complete
- Goal: never block publish on transcode failures.
- Do: when ffmpeg is missing or transcode fails, keep WAV mix and mark processing detail "playback ready (wav-only)".
- Do: continue publishing even if derivatives fail.
- Do not: mark the upload as error when the WAV mix is usable.
- Acceptance: WAV-only playback still promotes to ready.

Prompt NG45 (Remix prefetch + mix-first playback) - Status: complete
- Goal: instant playback with optional interactivity.
- Do: keep listener playback on the single mix; when Remix is tapped, start background fetch of stems or grouped stems.
- Do not: interrupt playback while stems download.
- Acceptance: playback starts instantly, stems fetch in the background.

Prompt NG46 (Seamless mix-to-stem upgrade) - Status: complete
- Goal: upgrade to interactive stems without jarring the listener.
- Do: when enough stems are decoded, crossfade from mix playback to stem mix at the same playhead time.
- Do: align all stems to a single audio clock and preserve current bar position.
- Do not: restart the song or jump time on upgrade.
- Acceptance: the transition feels like a smooth, inaudible handoff.

Prompt NG47 (Grouped stems derivation) - Status: complete
- Goal: make Remix mode practical for listeners.
- Do: derive 4-6 grouped stems (drums, bass, music, textures, fx, optional lead) on upload.
- Do: encode grouped stems as AAC/Opus for fast streaming.
- Do not: require 15 separate stems for basic Remix controls.
- Acceptance: Remix mode can mute or boost groups without heavy loading.

Prompt NG48 (Full stem pack for Studio) - Status: complete
- Goal: preserve creator-grade control.
- Do: generate a stem pack manifest with name, offset, duration, sample rate, default gain, channel layout, and URLs.
- Do: keep WAV masters for analysis/render.
- Do not: make listener flow depend on full stem packs.
- Acceptance: Studio mode can load a full stem pack from a manifest.

Prompt NG49 (Stem pack manifest API) - Status: complete
- Goal: provide a single entrypoint for stem packs.
- Do: add `/api/noise-gens/originals/:id/stem-pack` returning manifest + grouped stem URLs.
- Do: include processing state and readiness flags.
- Do not: expose raw filesystem paths.
- Acceptance: the API returns a usable manifest for Remix/Studio.

Prompt NG50 (Remix UI controls) - Status: complete
- Goal: make grouped stems interactive.
- Do: add per-group mute/level sliders wired to Web Audio GainNodes.
- Do: keep UI simple and readable for listeners.
- Do not: expose full DAW controls in Listener mode.
- Acceptance: listeners can mute/boost grouped stems after upgrade.

Prompt NG51 (Ableton intent import) - Status: pending
- Goal: treat Ableton Live sets (.als/.xml) as an optional creator intent snapshot that guides RenderPlan defaults and Intent Contract bounds, without attempting full DAW recreation.
- Do: accept .als or .xml during Studio upload; decompress .als (gzip) server-side; parse XML; extract BPM, time signature, locators/markers (if present), track list with Audio/MIDI types, and device inventory.
- Do: map a small whitelist of stock devices (Eq8, Glue/Compressor, Reverb, Delay, Chorus, Drum Buss) into RenderPlan textures/FX (eqPeaks, reverbSend, comp, delay intent), leaving unknown devices as metadata hints.
- Do: optionally extract automation envelopes into macro curves or energy curves (behind a Studio toggle; default off).
- Do: store a normalized, versioned "intent snapshot" JSON alongside the original, stripping absolute file paths and any user-machine identifiers.
- Do: show a one-screen summary after import (tempo, time sig, track counts, device counts, locator count) with toggles for which intent layers to apply (tempo/time sig, mix intent, automation).
- Do not: claim third-party plugins are recreated; treat them as opaque hints only.
- Do not: rely on .als for audio media; stems/mix remain required for sound.
- Acceptance: creators can attach a Live set, see a clean intent summary, and generate plans that inherit the extracted intent while staying bounded by the contract.
- Plan-1: define an `AbletonIntentSnapshot` schema (versioned JSON) with global tempo/timeSig, locators, tracks, devices, and optional automation summaries; store sanitized values only (no absolute paths).
- Plan-2: add server import path for `.als` and `.xml` (gzip decompress for `.als`, XML parse, extract fields) and persist snapshot alongside the Original record.
- Plan-3: add a device mapping layer for Ableton stock devices (Eq8, Glue/Compressor, Reverb, Delay, Chorus, Drum Buss) that emits RenderPlan `eqPeaks` and `fx` defaults plus intent bounds; unrecognized devices become metadata hints.
- Plan-4: extend Studio upload UI with an optional Ableton file picker and show a one-screen summary (tempo/timeSig/track counts/devices/locators) plus toggles for applying tempo/timeSig, mix intent, and automation.
- Plan-5: wire snapshot defaults into RenderPlan generation and Intent Contract bounds (clamp overrides, preserve intent).
- Plan-6: add tests with a small fixture `.als`/`.xml` to validate extraction, sanitization, and device mapping coverage.
