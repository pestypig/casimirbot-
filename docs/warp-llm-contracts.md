# Warp LLM Contracts and Backends

This note locks in how the warp/physics LLM pieces are supposed to behave and how to switch the `physics.warp.ask` backend.

## Backend choice for `physics.warp.ask`

- `BACKEND_PHYSICS_ASK`: `ollama | openai | auto` (default to current OpenAI wiring).
- **`openai`**: keep the existing `gpt-4o(-mini)` path. Best language/format quality; external dependency + cost/latency.
- **`ollama`**: run a local model as the explainer. Requires a capable local model + disciplined prompting; cheaper and offline once the model is installed.
- **`auto`**: prefer local if reachable/healthy; fall back to OpenAI.
- Regardless of backend, `physics.warp.viability` stays local/deterministic and remains the authority on viability. `ask` is only the explainer/voice.

## Physics console pipeline shape (planner)

`buildPhysicsConsolePlan` builds the chain below (see `addWarpAskStep` / `addWarpViabilityStep` in `server/routes/agi.plan.ts`):

1) **SEARCH/SUMMARIZE**: fetch/collapse repo + resonance context for the warp goal.  
2) **`physics.warp.ask`**: LLM explainer (includeSnapshot=true, params forwarded if provided).  
3) **`physics.warp.viability`**: deterministic certificate issuer.  
4) **Final narrator (`llm.http.generate` or chosen final tool)**: consumes the ask + viability summaries via `appendSummaries`; runs with warp guardrails to produce the operator-facing answer.

## Step contracts (what each tool must do)

- `physics.warp.ask`
  - Inputs: `question`, `includeSnapshot` (bool), optional `params`, optional `model`.
  - Behavior: assemble repo physics context; optionally call the local physics pipeline for a snapshot; answer the question as an explainer only.
  - Must: cite repo/pipeline hints; if a snapshot is attached, label its fields as pipeline outputs; **never claim viability** or override certificates.
  - Outputs: `answer`, `citations`, `citationHints`, optional `pipelineSnapshot`, `pipelineCitations`, `model`, `supplement(kind="warp")`.

- `physics.warp.viability`
  - Inputs: warp config (`bubbleRadius_m`, `wallThickness_m`, `targetVelocity_c`, `tileConfigId`, `tileCount`, `dutyCycle`, `gammaGeoOverride`, passthrough extras).
  - Behavior: run the deterministic pipeline; emit a signed/hashable certificate.
  - Must: status in `{ADMISSIBLE, MARGINAL, INADMISSIBLE, NOT_CERTIFIED}`; constraints with ids/severity/margins; snapshot numbers; citations to physics sources.
  - Outputs: `status`, `constraints`, `snapshot`, `config`, `certificateHash/id`, `certificate`, `integrityOk`, `supplement(kind="warp")`.

- Final narrator (`llm.http.generate` via `buildWarpNarrationPrompt`)
  - Inputs: `appendSummaries` includes `physics.warp.ask` + `physics.warp.viability`; warp guardrail blocks include certificate status/hash and the first failing HARD constraint.
  - Must: treat certificate/snapshot as **sole authority** on viability; quote `certificateHash`; if status is MARGINAL/INADMISSIBLE, name the failing constraint and use pipeline numbers; if no certificate, say NOT CERTIFIED and direct to run `physics.warp.viability`.
  - Role: narrate implementation + verdict + consequences + next actions. Do not introduce new physics claims beyond provided evidence.

## Data/citation flow

- `addWarpAskStep`/`addWarpViabilityStep` inject ask/viability and add their summaries to later tool calls via `extra.appendSummaries`.
- Citation hints from `ask` (plus pipeline citations) and certificate citations flow into supplements; final narrator can reuse them.
- Grounding/guardrail blocks are assembled in `server/services/planner/chat-b.ts` (`buildWarpNarrationSystemPrompt`, `buildWarpGuardrailBlock`, `buildWarpCertificateMessage`); these enforce the “pipeline is truth” rule regardless of backend.

## Extending

- To add a local backend: implement an Ollama call inside `physics.warp.ask` gated by `BACKEND_PHYSICS_ASK`; keep the output schema identical.
- Any new final narrator should accept `appendSummaries` and honor the same guardrail blocks; do not loosen the viability rules.

## LLM Role Contracts

### Warp explainer — `physics.warp.ask`
- Purpose: explain the warp model using repo context; may include a lightweight snapshot; never a viability oracle.
- Must describe: metric (Alcubierre/Natário, ADM 3+1, shift), Casimir tile → energy pipeline (TS_ratio ladder, γ_geo³, d_eff, γ_VdB), stress–energy/guardrails.
- Must respect repo notation/units; may describe snapshot values if provided.
- Must NOT: assert viability/admissibility; invent numbers without snapshot; override a certificate.
- Backend is pluggable (Ollama/OpenAI/auto) but the above contract is backend-agnostic.

### Warp narrator — final `llm.http.generate` in `physics_console`
- Purpose: given `warp_grounding = ask + viability + snapshot + constraints + certHash`, produce operator answer.
- Required 4-section structure:
  1) How it’s solved on the site: metric; Casimir tile → energy pipeline (TS_ratio, γ_geo³, d_eff, γ_VdB); stress–energy layer (T_{μν}, T00, M_exotic); guardrails (FordRomanQI, ThetaAudit, TS_ratio_min, VdB bands).
  2) Certificate verdict: status (ADMISSIBLE/MARGINAL/INADMISSIBLE/NOT_CERTIFIED); 1–2 HARD constraints (id/pass/fail/margin) plus SOFT as needed; snapshot values (TS_ratio, γ_VdB, M_exotic, T00_min); certificate hash/id.
  3) What this means: plain language rationale; cite failing constraints if any.
  4) What to do next: concrete follow-ups (e.g., treat as non-viable, run parameter search, lower curvature).
- Must: use warp_grounding as sole numeric source; refuse viability claims unless status=ADMISSIBLE and all HARD pass; if no cert/snapshot, say NOT CERTIFIED and avoid claims.
- Must NOT: surface “no stored memories matched” noise; use coherence/dispersion meta in user text; invent numbers absent from snapshot.

### Debate roles — proponent / skeptic / referee
- Proponent: argue viability only if status=ADMISSIBLE and HARD constraints pass with margin; cite ≥1 HARD constraint + 2–3 snapshot numbers; if NOT_CERTIFIED/INADMISSIBLE, state you cannot claim viability.
- Skeptic: emphasize failing/thin evidence—HARD failures, near-zero margins, missing cert/snapshot; cite ≥1 constraint and relevant snapshot values.
- Referee: summarize certificate (status, failing key constraint, certificate hash); lean proponent only when cert solid (ADMISSIBLE, HARD pass); otherwise lean skeptic; never contradict certificate status.

## Tool contract: `physics.warp.sector_control.plan`

- Input: `mode` with optional timing/allocation overrides.
- Output: `sectorControlPlanSchema` packet with timing/allocation/duty/constraints/objective/maturity.
- Guardrail expectations: report deterministic `firstFail` categories (QI, TS_ratio, ThetaAudit, GR gate).
- Certification posture: planning outputs are non-certifying unless a separate viability certificate is admissible with integrity `true`.
