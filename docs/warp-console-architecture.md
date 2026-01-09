# Warp Console & Physics LLM Spec

> Living document tracking how the Essence console, warp physics pipeline, and LLMs are supposed to work together.

---

## 0. Goals & invariants

**Primary goal:**  
The warp console is a **physics-first instrument**, not generic chat.

- The **physics pipeline** (Casimir tiles, energy pipeline, warp metric, stressâ€“energy, constraints) is the source of truth.
- LLMs are **interfaces and planners**; they never override the pipeline or its certificates.
- Every serious warp answer is **downstream of a pipeline run**.

**Invariants:**

- `physics.warp.viability` is deterministic and local.
- Certificates and constraints rule; debate and narration interpret them.
- Numeric values in answers must come from the pipeline (snapshot or cert), never from LLM imagination.
- Physics truths are assembled from specific, pre-approved sources (pipeline outputs, constraint specs, repo anchors, and telemetry), not arbitrary web text.

Operational posture (default): single workstation / small server, low-volume but high-value warp runs. The physics pipeline stays local; `physics.warp.ask` + narration default to cloud reasoning (OpenAI GPT-4.1-mini / o4-mini) with a switchable local or auto (local-first, cloud-fallback) backend.

---

## 1. Components

### 1.1 Physics engine

Core implementation lives in:

- Casimir tiles: `docs/casimir-tile-mechanism.md`, `modules/sim_core/static-casimir.ts`, etc.
- Energy pipeline: `server/energy-pipeline.ts` and related modules.
- Warp metric: Natario/Alcubierre implementations (`modules/warp/*`).
- Stressâ€“energy: `stress-energy-brick`, dynamic equations.
- Guardrails: Fordâ€“Roman QI, Theta audit, TS_ratio bounds, VdB bands, encoded as tests and constraint specs.

This layer **does the math**.

### 1.2 Tools

- `physics.warp.ask`  
  LLM-backed warp explainer. Reads repo context and optionally attaches a pipeline snapshot.

- `physics.warp.viability`  
  Local viability oracle. Runs the energy + warp pipeline, evaluates constraints, and issues a warp certificate.

Both tools emit supplements that are merged into a `warp_grounding` object.

### 1.3 Physics truth sources (backend + panels)

These are the concrete sources the backend uses for â€œphysics truthâ€ before any LLM narration:

- **Warp certificate (authoritative viability)**  
  - Computed by `tools/warpViability.ts` using `server/energy-pipeline.ts` + `modules/dynamic/stress-energy-equations.ts`.  
  - Constraint definitions + severities from `WARP_AGENTS.md` / `docs/physics/WARP_AGENTS.md` via `modules/physics/warpAgents.ts`.  
  - Citations emitted: `docs/alcubierre-alignment.md`, `server/energy-pipeline.ts`, `modules/dynamic/stress-energy-equations.ts`, `tests/theory-checks.spec.ts`.

- **Pipeline snapshot (lightweight, for explainer)**  
  - Produced by `tools/physicsValidation.ts` (`runPhysicsValidation`) calling `calculateEnergyPipeline`.  
  - Snapshot fields: `U_static, TS_ratio, gamma_geo_cubed, d_eff, gamma_VdB, M_exotic, thetaCal, T00`.  
  - Citations: `docs/casimir-tile-mechanism.md`, `modules/sim_core/static-casimir.ts`, `server/energy-pipeline.ts` (TS_ratio, gamma ladders), `modules/warp/warp-module.ts`, `modules/dynamic/stress-energy-equations.ts`, `tests/test_static.py`, `tests/theory-checks.spec.ts`, `tests/test_stress_energy_equations.py`, `warp-web/js/physics-core.js`.

- **Repo anchor context for `physics.warp.ask`** (`tools/physicsContext.ts`)  
  Anchors loaded and sliced into prompt blocks:  
  - Casimir: `docs/casimir-tile-mechanism.md`, `modules/core/physics-constants.ts`, `modules/sim_core/static-casimir.ts`, `server/energy-pipeline.ts`  
  - Warp/metric: `docs/alcubierre-alignment.md`, `modules/dynamic/natario-metric.ts`, `modules/warp/natario-warp.ts`, `modules/warp/warp-module.ts`  
  - Stressâ€“energy: `modules/dynamic/stress-energy-equations.ts`, `server/stress-energy-brick.ts`  
  - Web API: `warp-web/js/physics-core.js`  
  - Tests: `tests/stress-energy-brick.spec.ts`, `tests/york-time.spec.ts`, `tests/theory-checks.spec.ts`, `tests/test_static.py`, `tests/test_stress_energy_equations.py`, `tests/test_dynamic.py`, `tests/test_target_validation.py`

- **Telemetry panels (runtime signals)**  
  - Panel `casimir-tiles` (see `server/services/planner/chat-b.ts`): tiles_active/total, avg_q_factor, coherence, last_event, band metrics (seed, coherence, q, occupancy, event_rate, sourceIds), activated nodes.  
  - Badge telemetry and panel snapshots are ingested via `/console/telemetry` and summarized for prompts; source IDs flow into knowledge hints.

- **Resonance / repo graph (only when not in pure physics_console)**  
  - Code-lattice resonance bundles filtered for warp paths (`modules/warp/*`, `energy-pipeline.ts`, `natario-metric`, `casimir` docs).  
  - `repo.graph.search` seeds can add file/symbol paths; these become hints or citations when present.

### 1.3 Planner (Chat B)

Planner lives in `server/services/planner/chat-b.ts`.

- Detects warp intent (`classifyIntent`, `isWarpConsoleIntent`).
- Chooses `physics_console` strategy for warp console runs.
- Builds a minimal plan:
  - `CALL physics.warp.ask`
  - `CALL physics.warp.viability`
  - `CALL llm.http.generate` (warp narrator)
- Skips memory/search and generic resonance in `physics_console` mode.
  - Still accepts telemetry snapshots and any attached resonance/knowledge hints if provided in the request.

### 1.4 Warp grounding

We aggregate warp evidence into a single object:

```ts
interface WarpGrounding {
  status: "ADMISSIBLE" | "MARGINAL" | "INADMISSIBLE" | "NOT_CERTIFIED";
  summary: string;        // short text from warp.ask
  config?: WarpConfig;

  snapshot: WarpSnapshot; // TS_ratio, gamma_VdB, etc.
  constraints: WarpConstraintEvidence[];

  certificateHash?: string;
  certificateId?: string;
  citations?: string[];

  askAnswer?: string;     // full warp.ask answer
}
```

This is what debate and final narration see.

### 1.5 Debate

When enabled, `debate.run` orchestrates:

- Proponent
- Skeptic
- Referee

For warp debates, each role receives a formatted `WarpGrounding` evidence block plus warp-specific guardrails.

### 1.6 Essence console UI

The console shows:

- Plan selection (`physics_console` vs others).
- Tool calls and logs (ask, viability, debate, narration).
- Lattice/telemetry snapshots.

**TODO:** Surface a **Physics Certificate card** inline with status, constraints, snapshot, and cert hash.

---

## 2. LLM backends

### 2.1 Backend choices

Practical posture (single workstation / low QPS, physics-first):

- **Default:** cloud reasoning for `physics.warp.ask` and narration via OpenAI GPT-4.1-mini / o4-mini (fast, low cost, strong long-context reasoning).  
- **Local / offline:** force Ollama/local (`llm.local.*`) by setting the backend.  
- **Auto:** try local first, then fall back to OpenAI if the local call fails.

The backend used for `physics.warp.ask` is configurable:

```text
BACKEND_PHYSICS_ASK = "ollama" | "openai" | "auto"
```

`physics.warp.viability` stays local and deterministic.

### 2.2 LLM roles

There are three primary LLM roles:

1. **Warp explainer** â€“ `physics.warp.ask`
2. **Warp narrator** â€“ final `llm.http.generate` in `physics_console`
3. **Debate agents** â€“ proponent, skeptic, referee (when enabled)

The **contracts** for each are defined below.

---

## 3. LLM role contracts

### 3.1 Warp explainer (`physics.warp.ask`)

**Purpose:** Explain *how* the warp bubble is modeled and computed in this repo, using repo context, without deciding viability.

**Backend:** configurable (Ollama / GPT-4o). Prompt contract is the same.

**Must:**

- Describe the implementation:
  - Metric: Alcubierre/Natario, ADM 3+1, shift `beta^x = -v_s f(r_s)`.
  - Casimir tiles â†’ energy pipeline (TS_ratio ladder, gamma_geo^3, d_eff, gamma_VdB).
  - Stressâ€“energy and guardrails conceptually.
- Use the repoâ€™s notation and units.
- If a snapshot is included from the pipeline, may describe those values.

**Must NOT:**

- Claim the configuration is viable/admissible/physically realized.
- Invent numeric values if no snapshot was provided.
- Contradict or override any existing certificate.

### 3.2 Warp narrator (`llm.http.generate` in `physics_console`)

**Purpose:** Given `warp_grounding`, produce the final user answer in a fixed four-part structure.

**Structure:**

1. **How itâ€™s solved on the site**  
   Short explanation of the metric, energy pipeline, stressâ€“energy, guardrails.

2. **Certificate verdict for this run**
   - Status (ADMISSIBLE/MARGINAL/INADMISSIBLE/NOT_CERTIFIED)
   - Key HARD/SOFT constraints (id, pass/fail, margin)
   - Snapshot values (TS_ratio, gamma_VdB, M_exotic, T00_min, â€¦)
   - Certificate hash

3. **What this means**  
   Plain-language interpretation of the certificate and constraints.

4. **What to do next**  
   Operator guidance (parameter search, adjust assumptions, etc.).

**Must:**

- Treat `warp_grounding` as the **only source of numbers**.
- Refuse to claim viability unless status = ADMISSIBLE and all HARD constraints pass.
- Explicitly state â€œNOT CERTIFIEDâ€ when no certificate/snapshot is available.

**Must NOT:**

- Use â€œno stored memories matchedâ€ summaries in the user-facing answer.
- Show coherence/dispersion meta by default.
- Invent any numeric values not present in `warp_grounding.snapshot`.

### 3.3 Debate agents (when used)

**Proponent:**

- May argue for viability only if status = ADMISSIBLE and all HARD constraints pass.
- Must cite at least one HARD constraint and 2â€“3 snapshot values.
- If NOT_CERTIFIED / INADMISSIBLE, must not claim viability.

**Skeptic:**

- Emphasizes failing constraints, poor margins, or missing evidence.
- Must cite at least one constraint and relevant snapshot values.

**Referee:**

- States certificate status, failing key constraint(s), and certificate hash.
- Leans proponent only for strong ADMISSIBLE cases; otherwise leans skeptic.
- Never contradicts the certificateâ€™s status.

---

## 4. Guardrail prompt blocks (what the narrator sees)

The narrator prompt includes structured blocks to enforce physics-first answers:

- `[Warp Evidence]`: status, certificate hash, config fields (bubbleRadius_m, wallThickness_m, targetVelocity_c, tileCount, dutyCycle, gammaGeoOverride), constraints (PASS/FAIL, severity, margin), pipeline snapshot line (TS_ratio, gamma_VdB, T00_min, M_exotic, massMode, massSource, massDatasetId when measured, invariantMass_kg, massSigma_kg), and a clipped summary from `warp.ask`.
- `[Warp Viability Guardrails]`: policy rules â€” only claim viability when status=ADMISSIBLE (or MARGINAL if policy allows) and all HARD constraints pass; if missing certificate, say NOT CERTIFIED.
- `[Warp Certificate Context]`: JSON payload with `question`, `certificate` (status/hash/constraints/snapshot/config), and policy flags, rendered for transparency.

## 5. Knobs and env vars

- `BACKEND_PHYSICS_ASK = "ollama" | "openai" | "auto"` â€” backend selector for `physics.warp.ask` (`openai` default; `auto` = local first, then OpenAI fallback).
- `PHYSICS_ASK_OPENAI_MODEL` â€” default `gpt-4.1-mini` (or `o4-mini`) for warp.ask / narration when using OpenAI.
- `PHYSICS_ASK_LOCAL_MODEL` â€” local/Ollama model hint (e.g., `llama3.1-70b-instruct`).
- `OPENAI_API_KEY` â€” required when using the OpenAI backend.
- Local backend wiring can use `OLLAMA_ENDPOINT` or `LLM_LOCAL_*`/`llm.local.spawn` settings; keep the output schema identical.
- `ENABLE_LLM_LOCAL_SPAWN`, `LLM_HTTP_MODEL` (fallback model for narrator) â€” existing knobs reused.

## 6. Example warp_grounding payload

```json
{
  "status": "MARGINAL",
  "summary": "Warp Q&A text here...",
  "config": { "bubbleRadius_m": 12, "wallThickness_m": 1.8, "targetVelocity_c": 0.2 },
  "snapshot": { "TS_ratio": 140.2, "gamma_VdB": 1.6e4, "T00_min": -2.1e8, "M_exotic": -3.2e-3 },
  "constraints": [
    { "id": "FordRomanQI", "severity": "HARD", "passed": false, "margin": 0.12 },
    { "id": "TS_ratio_min", "severity": "SOFT", "passed": true, "lhs": 140.2, "rhs": 100 }
  ],
  "certificateHash": "ab12cdef...",
  "certificateId": "warp-cert-001",
  "citations": ["docs/alcubierre-alignment.md", "server/energy-pipeline.ts"],
  "askAnswer": "Full warp.ask answer..."
}
```

## 7. Telemetry UI scope (for the TODO card)

When surfacing a â€œPhysics Certificateâ€ card, include:
- Status, certificate hash/id, first failing HARD constraint, snapshot key numbers (TS_ratio, gamma_VdB, M_exotic, T00_min).
- Casimir panel fields (from `casimir-tiles`): tiles_active/total, avg_q_factor, coherence, last_event, bands (seed, coherence, q, occupancy, event_rate, sourceIds), activated nodes.
- Link to the underlying plan trace/tool logs for reproducibility.

## 8. Failure modes (expected behavior)

- Missing certificate/snapshot: say **NOT CERTIFIED**; do not invent numbers; ask to run `physics.warp.viability`.
- HARD constraint failing: name the first failing HARD; refuse viability claims.
- Only SOFT failing: status=MARGINAL; describe the failing soft constraints; avoid â€œfully viableâ€ language.
- Backend down (ask): fall back to local-only evidence; still narrate guardrails; no invented numbers.
- Missing context blocks: state the gap rather than hallucinating (already in `physicsContext` system prompt).

---


---



---

## Appendix: QI-guard consolidation (read-only, no patches)

Single, clean consolidation of what the QI-guard is reporting: why it fails, the knobs (physics vs policy), where they live, and a runbook to measure headroom. Purely descriptive; no code edits applied.

### 1) Executive snapshot (from the log)

- Status: HARD fail on the Ford-Roman guardrail -> INADMISSIBLE
- Log line: `[QI-guard]`
  - `lhs_Jm3 ~ -2.257e6` J/m^3 (sampled negative-energy integral)
  - `bound_Jm3 ~ -18` J/m^3 (Ford-Roman bound used by guard)
  - Raw margin: `|lhs|/|bound| ~ 1.254e5` (about 125,413x over)
  - Capped margin: `margin = 1` (policy clamps at 1)
  - Sampler: `gaussian`
  - Window: `tau ~ 40 ms`
  - Duty and pattern: `duty = 0.4`, `patternDuty ~ 0.4`, `maskSum = 6400`
  - Effective density source: `effectiveRho ~ -5.64` (tile telemetry)
  - TS indicator: `TS ~ 5.038e4`

Implication: with current settings there is no guardrail headroom until the raw ratio drops below 1.

### 2) Why the guard fails (what the code does)

- Computation: `marginRaw = |lhs_Jm3| / |bound_Jm3|`; fail if `marginRaw >= 1`.
- Policy clamp: `margin = min(marginRaw, QI_POLICY_MAX_ZETA)` for reporting; clamp does not change the HARD fail criterion.
- Inputs:
  - `lhs_Jm3` is the time-weighted integral of an "on" density `rhoOn = effectiveRho / duty`, multiplied by the sector mask (negative-sector occupancy, possibly >1 if multiple concurrent sectors) and a normalized window for the sampler.
  - `bound_Jm3` is the Ford-Roman lower bound for the chosen field type and kernel over window `tau`, with safety sigma and the policy floor applied.
- Result: sampled negative energy overshoots the bound by ~1.25e5x, so the HARD constraint fails.

### 3) The knobs already available

Physics levers (change the stress-energy / negative-energy exposure)
- Duty and negative fraction: `dutyCycle`, `negativeFraction` (default seen 0.4). Lower both to lower `lhs_Jm3`.
- Sector patterning: `sectorCount`, `concurrentSectors`, phase offsets -> changes `patternDuty` and mask weights; fewer concurrent negatives lowers `lhs_Jm3`.
- Area, radius, tile census: `tileArea_cm2`, `tileCount`, `bubbleRadius_m`, `shipRadius_m` feed effective area and rho proxies; lowering them cuts `effectiveRho` and `lhs_Jm3`.
- Amplification ladders: `gammaGeo`/override, `gammaVanDenBroeck`, Q/L and spoiling ladder; lowering reduces stress-energy demand and rho.
- Spectral/pump pattern: pulse/tone depth and gating map into `effectiveRho`; flattening or suppressing lowers `lhs_Jm3`.

Guardrail (policy) levers (change the bound or caps, not the physics)
- QI time window and kernel: `QI_TAU_MS` and `QI_KERNEL_TYPE`/`QI_SAMPLER` (gaussian/lorentzian/compact). Bound scales -K/tau^4 (then minus safety sigma and floored by policy); smaller tau makes the bound more permissive (larger |bound|), larger tau makes it stricter.
- Policy clamps/floors: `QI_POLICY_MAX_ZETA`, `QI_POLICY_ENFORCE`, `QI_BOUND_FLOOR_ABS`, and any `DEFAULT_QI_BOUND_SCALAR`. Affect the reported margin and the minimum magnitude of the bound considered.

Guidance: work physics-first (dial down the source so `marginRaw < 1`), and only then consider any guardrail policy change with justification; policy only raises/reshapes the limit, not the underlying physics.

### 4) Where the pieces live (high-value map)

- Guard computation and logs (server): `evaluateQiGuardrail(...)` builds mask/window, computes `rhoOn`, integrates `lhs`, builds `bound`, computes `margins`, sets compliance, and emits `[QI-guard] ...`. Defaults for QI window/kernel, policy clamp, and the guard call site are in the same module.
- Pipeline state builders: `initializePipelineState` and `calculateEnergyPipeline` wire up geometry, tile census, sectoring, duty, gain ladders, TS estimates, and the `effectiveRho` source cascade (telemetry -> pulses -> tones -> fallback).
- Viability/CLI: `tools/warpViability.ts` assembles inputs (radius, wall, tiles, duty, gamma overrides) and returns a snapshot (TS, gammas, d_eff, M_exotic, T00, zeta, etc.).
- UI/read-only: hooks/panels show zeta, TS, gamma_VdB, sectoring, Q, and display green-zone badges; they mirror terms from the server but do not drive the pipeline.

### 5) What to measure every run (headroom vs guard)

- From QI-guard logs: `marginRaw` (needs <1; target <0.9), `lhs_Jm3`, `bound_Jm3`, `window_ms`, `sampler`, `duty`, `patternDuty`, `maskSum`, `effectiveRho`, `TS`, `rhoSource`.
- From pipeline snapshot: `TS_ratio`, `d_eff`, `gammaGeo`, `gamma_VdB`, `gamma_geo^3`, `thetaCal`, `M_exotic`, `bubbleRadius_m`, `tileCount`, `tileArea_cm2`, `T00_min/avg`, `zeta`.

### 6) Runbook (read-only, fast feedback)

1. Light snapshot: `npm run physics:validate -- --params '{...}'` -> prints `U_static`, `TS_ratio`, `gamma_geo^3`, `d_eff`, `gamma_VdB`, `M_exotic`, `thetaCal`, `T00`.
2. With guardrails and logs: `DEBUG_PIPE=1 npm run physics:validate -- --params '{...}'` -> includes `[QI-guard]` lines with the fields above.
3. Programmatic viability: call `evaluateWarpViability({...})` (Node one-liner) to return status, constraints, and snapshot.
4. Quick sweeps (physics knobs only): adjust in the `--params` JSON: `dutyCycle`, `negativeFraction`, `bubbleRadius_m`, `tileCount`, `gammaGeoOverride`, `wallThickness_m`. Watch `marginRaw` fall below 1 (preferably <0.9).

Policy knobs (only with justification): `QI_TAU_MS`, `QI_KERNEL_TYPE`/`QI_SAMPLER`, `QI_POLICY_MAX_ZETA`, `QI_BOUND_FLOOR_ABS`.

### 7) Quantitative headroom (order-of-magnitude check)

- Current overage: `marginRaw ~ 1.254e5`.
- Goal: `marginRaw < 1` (preferably <0.9).
- If the bound stays ~18 J/m^3, `lhs` must drop by ~125,000x.
- Physics-first decomposition:
  - Duty reduction from 0.4 -> 3e-5 (green-zone cap) gives ~13,333x reduction.
  - Still need ~9.4x more, not yet counting sector mask/concurrency and negative-fraction effects.
  - Additional factors: reduce sector concurrency/phase overlap (mask weighting and `patternDuty`), lower `negativeFraction` (e.g., 0.4 -> 0.1 ~4x), and shrink area/radius/tiles or gains to reduce `effectiveRho`.
- Guardrail-change context (not a recommendation): because `|bound| ~ 1/tau^4`, shrinking `tau` by 10x (40 ms -> 4 ms) boosts the allowed bound by ~10,000x, which together with duty to green could cover the required 125,000x. Policy is to avoid leaning on this unless physics levers are exhausted and the sampling change is justified.

### 8) Physics vs policy - clear separation

- Physics levers (good first): `dutyCycle`, `negativeFraction`, sectoring/concurrency, `tileCount`/area/radius, `gammaGeo`, `gammaVdB`, Q/L, pump depth/patterns.
- Policy levers (guard settings): `QI_TAU_MS`, `QI_SAMPLER`, `QI_POLICY_MAX_ZETA`, `QI_BOUND_FLOOR_ABS`, enforcement switch. These do not fix physics; they only reshape the limit measured against.

### 9) Common pitfalls already caught

- Stale duty telemetry -> pipeline falls back to scheduled duty; verify duty provenance in the guard log.
- Bound flooring or safety sigma subtraction can dominate; check whether policy floor or sigma sets `bound_Jm3`.
- `effectiveRho` source: confirm live tile telemetry (and units), not synthesized pulses/tones or the duty fallback.
- Tau intuition: explicit `-K/tau^4` means smaller `tau` makes the bound more permissive (larger |bound|).

### 10) Minimal checklist to get green (descriptive)

- [ ] Measure: capture `marginRaw`, `lhs_Jm3`, `bound_Jm3`, `duty`, `patternDuty`, `maskSum`, `effectiveRho`, `TS`.
- [ ] Duty to green: ensure ship-wide `d_eff <= 3e-5`.
- [ ] Confirm sectoring: reduce negative-sector concurrency; verify `patternDuty` and `maskSum` fall.
- [ ] Lower rho drivers: if needed, reduce area/tile census/gamma ladders so `effectiveRho` drops.
- [ ] Re-check: `marginRaw < 1` (aim <0.9) with policy clamps unchanged.
- [ ] Document any later `tau`/kernel changes and why (only if still needed).

### One-page dependency sketch (inputs -> guard)

```
Inputs (duty, negFraction, sectors, concurrent, tileCount/area/radius,
        gammaGeo, gammaVdB, Q/L, pulses/tones, tau, sampler, policy floors)
   -> buildPipelineState
Geometry/tiles/area -> census and U_static -> gain ladders (gamma_geo, Q, gamma_VdB) -> rho proxies
Sectoring/phase schedule -> neg-sector mask, patternDuty, mask weights
Duty provenance -> d_eff (ship-wide), duty for guard
EffectiveRho source -> tile telemetry | pulses | tones | fallback
   -> evaluateQiGuardrail
Window (tau, kernel) + mask -> integrate lhs_Jm3
Ford-Roman bound (field, tau, kernel, sigma, floors) -> bound_Jm3
   -> margin calculation
marginRaw = |lhs| / |bound| -> fordRomanCompliance, zeta (policy clamp for reporting)
   -> log output
[QI-guard] log (window_ms, sampler, duty, patternDuty, maskSum, effectiveRho, TS, ...)
```

If a ready-to-paste investigative prompt that only inventories factors is needed, the existing "Whole-System QI/Curvature Audit" template remains fit for purpose. A compact parameter sweep grid (JSON snippets for `--params`) focused on physics-first levers can be added on request to see how `marginRaw` responds run-to-run.
