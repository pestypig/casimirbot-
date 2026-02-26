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
