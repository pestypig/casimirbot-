# Helix Dot Build Ledger

## Milestone M1 — Operator Contract v1 Validator
- milestone_id: `M1-operator-contract-v1-validator`
- files_changed:
  - `server/services/helix-ask/operator-contract-v1.ts`
  - `server/__tests__/operator-contract-v1.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run server/__tests__/operator-contract-v1.spec.ts tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts`
  - `npm run helix:ask:dot:debug-loop -- --base-url http://127.0.0.1:5050`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Added strict, reusable typed validator for `helix.operator_callout.v1` with deterministic error ordering.
  - Added certainty rank enforcement to keep voice certainty at or below text certainty.
  - Added suppression reason validation that requires a stable deterministic reason when suppressed.
  - Added focused validator unit tests for success and deterministic failure paths.
  - Validation execution: vitest command passed, debug loop classifications were A=`A_short_circuit`, B=`B_invoked_or_config_fail`, C=`B_invoked_or_config_fail`, and Casimir verify returned PASS with certificate integrity OK.
- known_risks_next_step:
  - Validator is introduced without changing lane routing behavior; integration wiring into additional pipelines can be done in a follow-up milestone.

## Milestone M2 — Operator Contract v1 Strictness Tightening
- milestone_id: `M2-operator-contract-v1-strictness`
- files_changed:
  - `server/services/helix-ask/operator-contract-v1.ts`
  - `server/__tests__/operator-contract-v1.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run server/__tests__/operator-contract-v1.spec.ts tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts`
  - `npm run helix:ask:dot:debug-loop -- --base-url http://127.0.0.1:5050`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Tightened suppression rule to reject `suppression_reason` when `suppressed` is false while keeping required stable reason enforcement when true.
  - Replaced generic object checks with plain-object checks to reject arrays at payload/text/voice boundaries.
  - Added regression tests for suppression mismatch and array payload/text/voice invalid cases.
  - Lane routing logic remains unchanged.
- known_risks_next_step:
  - Contract strictness increases may reject previously accepted malformed payloads, requiring any non-conformant emitters to be updated.

## Milestone M3 — Operator Contract v1 Output Shape Tightening
- milestone_id: `M3-operator-contract-v1-output-shape`
- files_changed:
  - `server/services/helix-ask/operator-contract-v1.ts`
  - `server/__tests__/operator-contract-v1.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run server/__tests__/operator-contract-v1.spec.ts tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts`
  - `npm run helix:ask:dot:debug-loop -- --base-url http://127.0.0.1:5050`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Updated successful validator output construction to include `suppression_reason` only when defined.
  - Added regression coverage confirming `suppression_reason` is absent from successful unsuppressed payloads.
  - Preserved M2 validation rules and deterministic error behavior.
- known_risks_next_step:
  - Downstream consumers that assumed `suppression_reason` key presence with `undefined` value must read by key existence semantics.

## Milestone M4 — Operator Contract v1 Integration at Voice Emission Boundary
- milestone_id: `M4-operator-contract-v1-voice-boundary`
- files_changed:
  - `server/routes/voice.ts`
  - `tests/voice.operator-contract-boundary.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run server/__tests__/operator-contract-v1.spec.ts tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts tests/voice.operator-contract-boundary.spec.ts`
  - `PORT=5050 NODE_ENV=development ENABLE_AGI=1 npm run dev`
  - `npm run helix:ask:dot:debug-loop -- --base-url http://127.0.0.1:5050`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Integrated `validateOperatorCalloutV1(payload)` at a concrete production callout emission boundary in `voiceRouter.post("/speak")` before dry-run/transport emission.
  - Added deterministic suppression fallback for contract violations with `suppressed=true`, `suppression_reason="contract_violation"`, and stable validator debug metadata.
  - Preserved lane routing and OpenAI transport logic unchanged; helix debug loop classifications remained A=`A_short_circuit`, B=`B_invoked_or_config_fail`, C=`B_invoked_or_config_fail` in this environment.
  - Casimir verification returned PASS with certificate hash and integrity OK.
- known_risks_next_step:
  - Boundary candidate currently mirrors voice message from text payload; future wiring to richer voice templates should retain validator gate before emission.

## Milestone M4.1 — Voice Suppression Contract Key Normalization
- milestone_id: `M4.1-voice-suppression-key-normalization`
- files_changed:
  - `server/routes/voice.ts`
  - `tests/voice.operator-contract-boundary.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run server/__tests__/operator-contract-v1.spec.ts tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts tests/voice.operator-contract-boundary.spec.ts`
  - `PORT=5050 NODE_ENV=development ENABLE_AGI=1 npm run dev`
  - `npm run helix:ask:dot:debug-loop -- --base-url http://127.0.0.1:5050`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Normalized `/api/voice/speak` suppression responses to always include canonical `suppression_reason` while preserving `reason` and deterministic values/status codes.
  - Added one-milestone legacy alias `suppressionReason` across suppression branches with explicit `TODO(M5)` removal note.
  - Expanded boundary coverage for context ineligible, parity disallow, operator contract validation failure, and dedupe suppression key-shape consistency.
- known_risks_next_step:
  - Legacy `suppressionReason` alias should be removed in M5 after downstream consumers migrate to `suppression_reason`.

## Milestone M5 — Voice Suppression Contract Finalization
- milestone_id: `M5-voice-suppression-contract-finalization`
- files_changed:
  - `server/routes/voice.ts`
  - `tests/voice.operator-contract-boundary.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run server/__tests__/operator-contract-v1.spec.ts tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts tests/voice.operator-contract-boundary.spec.ts`
  - `PORT=5050 NODE_ENV=development ENABLE_AGI=1 npm run dev`
  - `npm run helix:ask:dot:debug-loop -- --base-url http://127.0.0.1:5050`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Finalized `/api/voice/speak` suppression response shape to canonical keys `reason` and `suppression_reason` only.
  - Removed temporary legacy alias `suppressionReason` and corresponding M5 TODO note.
  - Updated boundary assertions to require canonical parity and absence of the legacy alias across context ineligible, parity disallow, contract validation failure, and dedupe suppression branches.
  - Preserved lane routing behavior, suppression reasons, and status-code determinism.
- known_risks_next_step:
  - Any client still reading `suppressionReason` must migrate to `suppression_reason`.

## Milestone M6 - Explicit Repo Mapping Doc-Slot Fail-Close Bypass
- milestone_id: `M6-explicit-repo-mapping-doc-slot-bypass`
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-jobs-regression.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run tests/helix-ask-jobs-regression.spec.ts tests/helix-ask-llm-debug-skip.spec.ts`
  - `npx vitest run server/__tests__/operator-contract-v1.spec.ts tests/voice.operator-contract-boundary.spec.ts`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Added explicit bypass for `doc_slot_missing` fail-closed state when explicit repo mapping is in LLM-first mode.
  - Prevented doc-slot fail-close from forcing deterministic scaffold fallback for direct file-path repo mapping prompts.
  - Added regression coverage for `server/routes/voice.ts` explicit path prompts to ensure HTTP invocation remains active and fallback is not tagged `fail_closed:doc_slot_missing`.
- known_risks_next_step:
  - This bypass is intentionally scoped to `doc_slot_missing`; other fail-closed reasons still apply and should remain deterministic.

## Milestone M7 - Bounded Answer Rescue Second Pass
- milestone_id: `M7-bounded-answer-rescue-second-pass`
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-jobs-regression.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run tests/helix-ask-jobs-regression.spec.ts tests/helix-ask-llm-debug-skip.spec.ts`
  - `npx vitest run server/__tests__/operator-contract-v1.spec.ts tests/voice.operator-contract-boundary.spec.ts`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Added `buildHelixAskAnswerRescuePrompt(...)` and a bounded second LLM pass (`answer_rescue`) before deterministic fallback.
  - Rescue is gated to weak-evidence scenarios and only for safe lanes (`intentDomain=general` or explicit repo-mapping LLM-first mode), while keeping deterministic fallback as backup.
  - Added deterministic debug fields (`answer_rescue_eligible`, `answer_rescue_attempted`, `answer_rescue_applied`, `answer_rescue_reason`) and a path token (`answer_rescue:llm_second_pass`).
  - Added regression coverage that forces a placeholder first response and verifies the rescue pass is applied instead of `RenderPlatonicFallback`.
- known_risks_next_step:
  - Rescue pass is intentionally narrow; if quality remains constrained for additional intent lanes, expand gating with explicit policy tests rather than broadening globally.

## Milestone M8 - Open-World Auto-Promotion Guard
- milestone_id: `M8-open-world-auto-promotion-guard`
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-llm-debug-skip.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run tests/helix-ask-llm-debug-skip.spec.ts`
  - `npx vitest run tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts server/__tests__/operator-contract-v1.spec.ts tests/voice.operator-contract-boundary.spec.ts`
  - `npm run helix:ask:dot:debug-loop -- --base-url http://127.0.0.1:5050 --out artifacts/helix-dot-loop.latest.json`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Blocked implicit repo/hybrid promotion for open-world explainer prompts unless explicit repo signals are present (`file hints`, endpoint references, explicit repo expectation, or high repo expectation level).
  - Scoped preflight retrieval upgrade to the same explicit-signal rule so incidental code hits no longer hijack open-world prompts.
  - Added ambiguity-gate bypass (`open_world_explainer_mode`) for open-world prompts when repo signals are absent, preventing clarify scaffolds from overriding direct explanation attempts.
  - Added regression coverage to assert open-world prompts remain out of repo auto-promotion in the LLM debug skip suite.
- known_risks_next_step:
  - Security prompts without explicit repo hints can still resolve to hybrid via intent/profile heuristics; next step is to decouple security user-intent utility from repo-evidence defaults in a dedicated intent policy pass.

## Milestone M9 - Security Prompt Repo-Guardrail Decoupling
- milestone_id: `M9-security-open-world-guardrail-decoupling`
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-llm-debug-skip.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run tests/helix-ask-llm-debug-skip.spec.ts`
  - `npx vitest run tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts server/__tests__/operator-contract-v1.spec.ts tests/voice.operator-contract-boundary.spec.ts`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Security prompts no longer force repo evidence/retrieval unless explicit repo signals are present.
  - Added security-specific ambiguity bypass (`security_open_world_query`) for open-world self-protection prompts without repo cues.
  - Preserved explicit repo behavior for security prompts that include endpoint/file/repo hints.
  - Added regression coverage to ensure security self-protection prompts remain out of forced repo retrieval in debug telemetry.
- known_risks_next_step:
  - Security prompts may still pick hybrid at initial intent-match stage in some contexts; next step is explicit intent-profile split between `security_open_world` and `security_repo_mapping`.

## Milestone M10 - Adaptive Rescue for Quality-Risk Outputs
- milestone_id: `M10-adaptive-rescue-quality-risk`
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-jobs-regression.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts server/__tests__/operator-contract-v1.spec.ts tests/voice.operator-contract-boundary.spec.ts`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File artifacts/retry-loop.ps1`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl.exe -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Extended existing `answer_rescue` second pass with adaptive quality-risk triggers (not only weak-evidence fallback), while preserving deterministic lane-A short-circuit behavior.
  - Added `HELIX_ASK_ADAPTIVE_RESCUE_PASS` feature flag (default enabled) and deterministic debug fields: `answer_rescue_trigger` and `answer_rescue_quality_reasons`.
  - Added safety trigger for open-world/security answers that cite only generic fallback files (`server/routes/agi.plan.ts`, `docs/helix-ask-flow.md`) so rescue can attempt a direct answer.
  - Fixed security prompt runtime error by moving `hasExplicitRepoSignals` initialization before security guardrail checks.
  - Added regression coverage that forces a security low-quality first response and verifies rescue pass activation and application.
  - Expanded quality-floor bypass to include successful security open-world answers in general domain (same policy class as open-world provider-success bypass).
- known_risks_next_step:
  - Source relevance can still drift for repo-grounded summaries (for example path mismatch in P4); next step is a citation relevance gate that scores answer claims against retrieved anchor paths before allowing final source injection.

## Milestone M11 - Open-World Citation Enforcement Scope Guard
- milestone_id: `M11-open-world-citation-scope-guard`
- files_changed:
  - `server/routes/agi.plan.ts`
  - `tests/helix-ask-jobs-regression.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run tests/helix-ask-jobs-regression.spec.ts tests/helix-ask-llm-debug-skip.spec.ts`
  - `npx vitest run tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts server/__tests__/operator-contract-v1.spec.ts tests/voice.operator-contract-boundary.spec.ts`
  - `powershell -ExecutionPolicy Bypass -File artifacts/retry-loop.ps1`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl.exe -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Added `citationLinkingRequired` guard so citation persistence/linking logic only runs for repo/hybrid/relation/strict-provenance flows instead of all open-world answers.
  - Preserved deterministic citation behavior for repo-required prompts while preventing unconditional source injection in general-domain post-processing paths.
  - Added adaptive rescue trigger reason `requested_path_citation_missing` and fed explicit requested repo paths into rescue evidence snippet for file-path prompts.
  - Added regression assertion ensuring open-world HTTP bypass path does not force fallback sources like `server/routes/agi.plan.ts` / `docs/helix-ask-flow.md`.
  - Focused and full targeted vitest suites passed (29/29).
- known_risks_next_step:
  - Live local quality verification in this shell is currently infra-blocked by `llm_http_401` / circuit-open responses, so runtime answer-quality validation must be rerun from the user’s valid-key server session.

## Milestone M12 - HTTP Breaker Robustness (Transient-Only Trip)
- milestone_id: `M12-http-breaker-transient-only`
- files_changed:
  - `server/skills/llm.http.ts`
  - `server/__tests__/llm.http.safeguards.test.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run server/__tests__/llm.http.safeguards.test.ts server/__tests__/llm.local.bridge.test.ts tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl.exe -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
  - `powershell -ExecutionPolicy Bypass -File artifacts/retry-loop.ps1`
- result_summary:
  - Changed `llm.http.generate` circuit behavior so only transient upstream failures (`timeout`, `transport`, `429`, `5xx`) increment/open the breaker.
  - Non-transient auth/config errors (`401/403/4xx`) no longer poison the breaker state; breaker is reset on those terminal classes.
  - Added regression test proving repeated `401` responses do not produce `llm_http_circuit_open`.
  - Runtime probe confirms consecutive calls remain on HTTP invoke path without breaker escalation; full retry-loop returned lane classifications A=`A_short_circuit`, P2/P3/P4/P5/J1=`C_http_success`.
- known_risks_next_step:
  - This patch hardens uptime behavior but does not independently solve source-relevance drift for repo-specific prompts; retain planned citation relevance gating for repo lanes.

## Milestone M13 - Open-World Source Append Guard + Breaker Observability
- milestone_id: `M13-open-world-source-guard-breaker-observability`
- files_changed:
  - `server/routes/agi.plan.ts`
  - `server/skills/llm.http.ts`
  - `server/routes/hull.status.ts`
  - `server/__tests__/llm.http.safeguards.test.ts`
  - `tests/hull-status.spec.ts`
  - `tests/helix-ask-jobs-regression.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run server/__tests__/llm.http.safeguards.test.ts tests/hull-status.spec.ts tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts`
  - `npm run helix:ask:dot:debug-loop -- --base-url http://127.0.0.1:5050`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl.exe -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Added a repo-style citation append guard in `agi.plan` quality-floor post-processing so open-world/security prompts without repo expectation do not get forced `Sources:` injection from fallback anchors.
  - Added deterministic debug breadcrumbs for suppressed source append decisions (`qualityFloor:append_sources_skipped_non_repo`, `citation_append_suppressed_reason`).
  - Added `getLlmHttpBreakerSnapshot()` in `llm.http` with cooldown-aware state refresh for deterministic observability (`open`, `consecutive_failures`, `threshold`, `cooldown_ms`, `opened_at`, `remaining_ms`).
  - Exposed breaker state through `/api/hull/status` via `llm_http_breaker`.
  - Extended regressions to validate breaker snapshot behavior, hull status payload shape, and security open-world source-append suppression.
- known_risks_next_step:
  - Open-world suppression now avoids repo-style source padding, but output quality still depends on rescue prompt quality and intent routing; continue with answer-quality harnessing per prompt family.

## Milestone M14 - HTTP Runtime Lock + Local Artifact Hydration Guard
- milestone_id: `M14-http-runtime-lock-local-hydration-guard`
- files_changed:
  - `server/services/llm/local-runtime.ts`
  - `server/skills/llm.local.ts`
  - `server/services/llm/runtime-artifacts.ts`
  - `server/__tests__/llm.local-runtime.test.ts`
  - `server/__tests__/llm.local.bridge.test.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run --pool=forks --maxWorkers=1 server/__tests__/llm.local-runtime.test.ts server/__tests__/llm.local.bridge.test.ts tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts`
  - `npm run helix:ask:dot:debug-loop -- --base-url http://127.0.0.1:5050`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl.exe -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Added an explicit HTTP lock (`LLM_POLICY=http` or `LLM_RUNTIME=http|openai`) so local runtime mode is disabled even when `ENABLE_LLM_LOCAL_SPAWN=1`.
  - Updated `resolveLlmLocalBackend()` to fail closed in explicit HTTP mode when `LLM_HTTP_BASE` is missing (`none`), instead of silently falling back to spawn.
  - Added runtime artifact guard: in explicit HTTP mode, local LLM artifacts (model/llama-cli/lora) are skipped unless `LLM_HYDRATE_LOCAL_ARTIFACTS_IN_HTTP_MODE=1`.
  - Added regression coverage for runtime lock behavior and backend resolution (`spawn` fallback blocked under explicit HTTP mode).
- known_risks_next_step:
  - The debug-loop preflight script still reads shell env values, which can differ from active server env; keep using lane debug fields and hull status as runtime truth when this mismatch appears.
