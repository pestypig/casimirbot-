# Helix Ask Panel QA Audit — 2026-02-15

## Executive summary (top 5 highest-impact errors)

1. **HA-001 (High, CONFIRMED_BUG): ideology-answer lead-in is not deterministic** — `tests/helix-ask-platonic-gates.spec.ts` fails because the answer sometimes omits the required `In plain language` lead-in while still adding technical notes. This breaks panel UX consistency and test stability.
2. **HA-002 (High, SPEC_MISALIGNMENT): explicit hypothesis + anti-hypothesis are missing** — the scientific-method gap doc explicitly lists this as missing, so Helix Ask cannot satisfy full scientific-method expectations for falsifiability.
3. **HA-003 (High, SPEC_MISALIGNMENT): controlled counterfactual/negative probes are missing** — no bounded refutation branch is active by default, so panel outputs can appear complete without active disconfirmation attempts.
4. **HA-004 (High, SPEC_MISALIGNMENT): calibrated uncertainty intervals are missing** — confidence bands tied to retrieval/synthesis are not yet first-class outputs, reducing reliability for risk-sensitive decisions.
5. **HA-007 (High, INTEGRATION_GAP): local small-LLM route is env-gated on `SMALL_LLM_URL`** — local fallback capabilities exist in services, but the dedicated small-LLM API routes are not mounted unless a remote URL env var exists, creating runtime 404 risk for UI integrations.

## Panel Error Inventory

| Error ID | Panel path | Severity | Repro steps | Expected vs actual | Evidence (file/route/log/trace) | Test status | Suggested fix |
|---|---|---|---|---|---|---|---|
| HA-001 | Helix Ask → ideology concept answer formatting | High | `npm run -s test -- tests/helix-ask-platonic-gates.spec.ts` | **Expected:** answer starts with `In plain language` + technical notes. **Actual:** received answer starts with `highlighting the importance...` and fails regex. | Failing assertion and test fixture in `tests/helix-ask-platonic-gates.spec.ts`; concept lead-in enforcement logic in `server/services/helix-ask/platonic-gates.ts`. | **Fail** | Normalize lead-in at final post-clean stage so regex contract is always preserved. |
| HA-002 | Helix Ask scientific method gate: hypothesis layer | High | `rg -n "hypothesis|anti-hypothesis" docs/helix-ask-scientific-method-gap.md` | **Expected:** hypothesis + anti-hypothesis fields implemented in default flow. **Actual:** documented as missing. | Scientific gap doc explicitly lists missing explicit hypothesis and falsifiable alternatives. | **Fail (spec gap confirmed)** | Add structured `hypothesis` / `anti_hypothesis` fields in concept evidence cards and response diagnostics. |
| HA-003 | Helix Ask scientific method gate: controlled refutation | High | `rg -n "counterfactual|refute" docs/helix-ask-scientific-method-gap.md` | **Expected:** controlled negative probe branch executes in-run. **Actual:** documented as missing/not yet defaulted. | Scientific gap doc lists controlled counterfactual testing and proposed bounded `refute` branch as future work. | **Fail (spec gap confirmed)** | Add bounded counterfactual branch per request class; store outcome in debug trace. |
| HA-004 | Helix Ask uncertainty/certainty communication | High | `rg -n "uncertainty intervals|confidence band" docs/helix-ask-scientific-method-gap.md` | **Expected:** calibrated uncertainty interval/band in responses and trace. **Actual:** still missing. | Scientific gap doc calls for calibrated priors/uncertainty intervals and confidence band addition. | **Fail (spec gap confirmed)** | Add calibrated confidence band and tie to retrieval quality + synthesis gates. |
| HA-005 | Helix Ask reproducibility metadata envelope | Medium | `rg -n "Replication metadata|seed|versioned prompt" docs/helix-ask-scientific-method-gap.md` | **Expected:** reproducibility envelope default (seed, snapshot, prompt version). **Actual:** documented as not default today. | Scientific gap doc indicates reproducibility metadata exists only partially via debug artifacts. | **Fail (spec gap confirmed)** | Add default reproducibility payload to all Helix Ask responses (seed, retrieval snapshot hash, prompt template version). |
| HA-006 | Helix Ask closed-loop repair from refutations | Medium | `rg -n "Closed-loop corrective action" docs/helix-ask-scientific-method-gap.md` | **Expected:** refutations trigger explicit repair loop. **Actual:** only stricter answer templates are mentioned. | Scientific gap doc explicitly states closed-loop corrective action is missing. | **Fail (spec gap confirmed)** | Add automatic repair branch when refute/counterfactual invalidates top claim. |
| HA-007 | LLM local runtime fallback (`/api/small-llm/*`) | High | Static check: `sed -n '250,260p' server/routes.ts`; runtime check: start server without `SMALL_LLM_URL`, POST `/api/small-llm/call-spec-triage`. | **Expected:** local-runtime fallback routes available when local runtime mode is active. **Actual:** route mount is gated by `SMALL_LLM_URL`, risking 404 in local-only mode. | `server/routes.ts` mounts `smallLlmRouter` only when `process.env.SMALL_LLM_URL` is set; local runtime detection is independent in `server/services/llm/local-runtime.ts`. | **Not run (runtime check sequence provided)** | Mount router on capability check (`isLocalRuntime() || SMALL_LLM_URL`) and return explicit capability error when unavailable. |
| HA-008 | AGI trace/memory route availability vs default AGI enable | Medium | `sed -n '238,246p' server/routes.ts` | **Expected:** when AGI is enabled (including default-true path), optional trace API behavior should be predictable. **Actual:** trace router requires strict string check `ENABLE_AGI === "1"` even when AGI is enabled by default. | Inconsistent gating logic in `server/routes.ts` (`flagEnabled` for AGI, exact literal check for trace mount). | **Not run (static analysis)** | Replace strict equality with the same `flagEnabled` helper to avoid hidden route availability drift. |
| HA-009 | SunPy coherence single-frame runtime path | Low | `npm run -s test -- tests/information-boundary.sunpy-leakage.spec.ts` | **Expected:** single-frame observables path completes without error-severity logs. **Actual:** path passes but logs `timing calibration skipped Error: Need at least two frames`. | Test output logs from `tests/information-boundary.sunpy-leakage.spec.ts`; calibration behavior in `server/services/essence/solar-video-coherence.ts`. | **Pass with warning** | Demote expected single-frame calibration message to structured warning (not Error object) to reduce false alarm noise. |

## Minimal test cases (Given / When / Then)

### HA-001 — CONFIRMED_BUG
- **Given** an ideology concept query requiring friendly narrative formatting.
- **When** Helix Ask platonic gates process an answer seeded with junk fragments.
- **Then** output should begin with `In plain language` and include `Technical notes`, but test currently fails.
- **Execution:** `npm run -s test -- tests/helix-ask-platonic-gates.spec.ts`
- **Result:** **Fail**.

### HA-002 — SPEC_MISALIGNMENT
- **Given** scientific-method compliant output requirements.
- **When** checking Helix Ask scientific-method gap document.
- **Then** hypothesis/anti-hypothesis should be implemented, but document states they are missing.
- **Execution:** `rg -n "hypothesis|anti-hypothesis" docs/helix-ask-scientific-method-gap.md`
- **Result:** **Fail (gap confirmed)**.

### HA-003 — SPEC_MISALIGNMENT
- **Given** scientific requirement for controlled refutation.
- **When** checking Helix Ask scientific-method gap document for counterfactual/refute support.
- **Then** controlled negative probes should be defaulted, but document marks missing.
- **Execution:** `rg -n "counterfactual|refute" docs/helix-ask-scientific-method-gap.md`
- **Result:** **Fail (gap confirmed)**.

### HA-004 — SPEC_MISALIGNMENT
- **Given** uncertainty quantification requirement.
- **When** checking scientific-method gap doc.
- **Then** calibrated uncertainty intervals should exist, but are listed as missing.
- **Execution:** `rg -n "uncertainty intervals|confidence band" docs/helix-ask-scientific-method-gap.md`
- **Result:** **Fail (gap confirmed)**.

### HA-005 — SPEC_MISALIGNMENT
- **Given** reproducibility requirements for scientific claims.
- **When** checking doc for seed/snapshot/versioned prompts default behavior.
- **Then** envelope should be default, but doc says not default yet.
- **Execution:** `rg -n "Replication metadata|seed|versioned prompt" docs/helix-ask-scientific-method-gap.md`
- **Result:** **Fail (gap confirmed)**.

### HA-006 — SPEC_MISALIGNMENT
- **Given** refutation-driven repair requirement.
- **When** checking doc for closed-loop corrective action.
- **Then** repair loop should be present, but doc says missing.
- **Execution:** `rg -n "Closed-loop corrective action" docs/helix-ask-scientific-method-gap.md`
- **Result:** **Fail (gap confirmed)**.

### HA-007 — INTEGRATION_GAP
- **Given** local runtime fallback expectation.
- **When** server boots without `SMALL_LLM_URL` and client invokes `/api/small-llm/call-spec-triage`.
- **Then** endpoint should still expose local fallback or explicit capability response; current mount logic can 404.
- **Execution sequence (local):**
  1. `ENABLE_AGI=1 ENABLE_ESSENCE=1 npm run dev`
  2. `curl -i -X POST http://127.0.0.1:8787/api/small-llm/call-spec-triage -H 'content-type: application/json' -d '{"currentChat":"hi"}'`
- **Result:** **Not run in this audit window** (static evidence confirms gate condition).

### HA-008 — INTEGRATION_GAP
- **Given** AGI is enabled through `flagEnabled` defaults.
- **When** trace API gate checks for exact `ENABLE_AGI === "1"`.
- **Then** trace route behavior can diverge from actual AGI enablement state.
- **Execution:** `sed -n '204,246p' server/routes.ts`
- **Result:** **Fail (logic inconsistency confirmed via static read)**.

### HA-009 — INTEGRATION_GAP (low)
- **Given** single-frame solar observables input.
- **When** SunPy coherence job runs in observables mode.
- **Then** job should pass without error-severity logs; currently passes with an `Error`-style calibration skip log.
- **Execution:** `npm run -s test -- tests/information-boundary.sunpy-leakage.spec.ts`
- **Result:** **Pass with warning**.

## Evidence chain validation (end-to-end)

Validated from Helix Ask live events + routing tests:
- **Input intent/task:** request body `question` sent to `/api/agi/ask`.
- **Route chosen:** `planRouter` mounted under `/api/agi` and POST `/ask` path.
- **Modules invoked:** intent, topic tags/profile, plan, evidence gate, arbiter, synthesis, platonic gates, citations.
- **Artifacts produced:** debug payload (`answer_path`, `live_events`, graph framework metadata) and cited source paths.
- **Uncertainty/trace status:** traceability is strong for engineering gates, but scientific-method uncertainty/reproducibility defaults remain partial (HA-004/005).

## Feature flags and safe default enablement

- `ENABLE_AGI`: defaults enabled when unset (recommended: keep enabled in non-prod, explicit in prod).
- `ENABLE_AGI_AUTH`: optional auth gate for `/api/agi/*` (recommended: default **on** in shared/staging/prod with tenant headers).
- `ENABLE_TRACE_API`: currently additionally requires `ENABLE_AGI === "1"` (recommended: align with `flagEnabled` AGI logic).
- `ENABLE_ESSENCE`: defaults enabled (recommended: keep enabled where SunPy/solar panels are user-facing).
- `ENABLE_DEBATE`: defaults disabled (recommended: keep off by default unless governance workflows are validated).
- `SMALL_LLM_URL`: currently required to mount `/api/small-llm` router (recommended: decouple from local runtime capability so local fallback remains available).

## Ordered fix plan per issue

1. **HA-001**
   - Root cause: format normalization race/inconsistency in ideology answer finalization.
   - One-line fix: enforce `In plain language` prefix in final answer post-processing before return.
   - Risk: low (presentation layer only).
   - Regression test: stabilize `tests/helix-ask-platonic-gates.spec.ts` and add a second fixture with noisy prefix tokens.
2. **HA-002**
   - Root cause: hypothesis schema absent in response contract.
   - One-line fix: add `hypothesis` + `antiHypothesis` fields to concept evidence cards and response diagnostics.
   - Risk: medium (response schema expansion).
   - Regression test: add contract test requiring both fields for high-stakes ask intents.
3. **HA-003**
   - Root cause: no default counterfactual branch in ask pipeline.
   - One-line fix: execute bounded negative-probe pass for targeted intent classes.
   - Risk: medium/high (latency + token cost).
   - Regression test: assert `debug.counterfactual` artifact existence for enabled intents.
4. **HA-004**
   - Root cause: no calibrated uncertainty interval computation attached to synthesis.
   - One-line fix: compute confidence band from retrieval quality + gate outputs and append to diagnostics.
   - Risk: medium (calibration quality).
   - Regression test: deterministic fixture asserting uncertainty band presence and bounds.
5. **HA-005**
   - Root cause: reproducibility metadata not defaulted.
   - One-line fix: always attach seed, retrieval snapshot hash, prompt template version in debug metadata.
   - Risk: medium (storage + payload size).
   - Regression test: snapshot test validates required reproducibility fields.
6. **HA-006**
   - Root cause: refutations do not trigger repair branch.
   - One-line fix: on failed refute check, reroute to repair synthesis with explicit contradiction handling.
   - Risk: medium/high (branch complexity).
   - Regression test: synthetic contradiction case must emit `repair_applied=true` and updated claim ledger.
7. **HA-007**
   - Root cause: route mount tied to remote URL env.
   - One-line fix: mount small-LLM router whenever local runtime or remote URL capability is present.
   - Risk: low/medium (capability signaling).
   - Regression test: integration test for `/api/small-llm/call-spec-triage` with local-runtime env and no `SMALL_LLM_URL`.
8. **HA-008**
   - Root cause: mixed gating semantics (`flagEnabled` vs literal string check).
   - One-line fix: use `flagEnabled` consistently for trace API guard.
   - Risk: low.
   - Regression test: matrix test for env combinations asserts route availability.
9. **HA-009**
   - Root cause: expected single-frame condition logs `Error` object severity.
   - One-line fix: emit structured warning code instead of error stack for expected skip.
   - Risk: low.
   - Regression test: verify no error-level logs for one-frame observables pass case.

## Must-fix before production (Critical + High)

1. **HA-001** — Helix Ask ideology lead-in format regression.
2. **HA-002** — missing hypothesis/anti-hypothesis framing.
3. **HA-003** — missing controlled counterfactual branch.
4. **HA-004** — missing calibrated uncertainty intervals.
5. **HA-007** — small-LLM local fallback routing gap.

## Casimir verification gate (required)

- Adapter endpoint run: `POST /api/agi/adapter/run`
- Verdict: **PASS**
- Certificate hash: **qa-cert**
- Integrity: **OK (`integrityOk: true`)**
