# Helix Ask x Dottie Method Reactification Codex Cloud Autorun Batch Prompt Pack (2026-02-24)

Purpose:
- Convert the method benchmark proposals into concrete, additive implementation prompts.
- Keep current mission/voice contracts.
- Raise replay trust and operator confidence by removing nondeterministic behavior and policy drift.

Baseline:
- Lock to latest main before each prompt.
- Print `HEAD=<sha>` and include it in each prompt result.

Global constraints for every prompt:
1. Preserve backward compatibility on `/api/voice/speak` and `/api/mission-board/*`.
2. Keep deterministic failure envelopes with stable reason labels.
3. Keep voice certainty/evidence posture no stronger than text posture.
4. Run targeted tests for touched surfaces.
5. Run Casimir gate and report PASS/certificate hash/integrity.

Casimir command:
```bash
npm run casimir:verify -- \
  --url http://127.0.0.1:5173/api/agi/adapter/run \
  --export-url http://127.0.0.1:5173/api/agi/training-trace/export \
  --trace-out artifacts/training-trace.jsonl \
  --trace-limit 200 \
  --ci
```

---

## Prompt 0 - Baseline lock and inventory

Implement:
- Pull main and print head.
- Confirm benchmark artifacts exist:
  - `docs/audits/research/helix-dottie-method-benchmark-2026-02-24.md`
  - `reports/helix-dottie-method-gap-backlog-2026-02-24.md`
  - `reports/helix-dottie-method-decision-matrix-2026-02-24.json`
- Produce a short inventory markdown:
  - `reports/helix-dottie-reactification-inventory-2026-02-24.md`

Run:
```bash
npx vitest run tests/voice.routes.spec.ts tests/mission-board.routes.spec.ts
```

---

## Prompt 1 - Require deterministic Tier1 timestamps

Implement:
- In `server/routes/mission-board.ts`, require `ts` for Tier1 active context events.
- If missing, return deterministic `mission_board_invalid_request` with typed details.
- Do not change Tier0 behavior.

Tests:
- Add/extend tests to assert deterministic 400 for missing Tier1 `ts`.
- Ensure existing Tier1 valid payloads still pass.

Run:
```bash
npx vitest run tests/mission-board.routes.spec.ts tests/mission-context-session.spec.ts
```

Commit:
- `feat(mission-board): require tier1 deterministic context timestamps`

---

## Prompt 2 - Default mission callouts to repo-attributed evidence parity

Implement:
- In `server/routes/voice.ts`, set effective repo attribution:
  - `repoAttributedEffective = payload.repoAttributed ?? Boolean(payload.missionId && payload.mode === "callout")`
- Use `repoAttributedEffective` for parity/evidence gating.
- Preserve existing request compatibility.

Tests:
- Extend `tests/voice.routes.spec.ts` with:
  - mission callout without evidence defaults to suppression (`missing_evidence`)
  - explicit `repoAttributed: false` keeps existing non-repo behavior

Run:
```bash
npx vitest run tests/voice.routes.spec.ts tests/helix-dottie-certainty-parity.spec.ts
```

Commit:
- `feat(voice): default mission callouts to repo-attributed parity enforcement`

---

## Prompt 3 - Replay-safe policy clock for voice eligibility

Implement:
- Add optional `policyTsMs` (or `tsMs`) to voice request schema.
- For cooldown/rate/budget checks, use provided replay timestamp when present; otherwise use wall clock.
- Preserve current runtime behavior when field absent.

Tests:
- Add deterministic replay tests proving identical suppress/emit results across reruns with same `policyTsMs`.

Run:
```bash
npx vitest run tests/voice.routes.spec.ts tests/helix-dottie-replay-integration.spec.ts
```

Commit:
- `feat(voice): add replay-safe policy clock for deterministic suppression`

---

## Prompt 4 - Persist trace/context linkage in mission-board events

Implement:
- Extend mission-board store/event payload to persist and return:
  - `traceId`
  - `contextTier`
  - `sessionState`
- Update route write/read mapping in:
  - `server/routes/mission-board.ts`
  - `server/services/mission-overwatch/mission-board-store.ts`

Tests:
- Add assertions that context event metadata is present in event list responses and persists through DB mode tests.

Run:
```bash
npx vitest run tests/mission-board.routes.spec.ts tests/mission-board.persistence.spec.ts
```

Commit:
- `feat(mission-board): persist trace and context linkage fields for replay`

---

## Prompt 5 - Strict mission-board persistence mode

Implement:
- Add `MISSION_BOARD_STORE_STRICT=1` behavior:
  - if DB store cannot initialize, fail fast with deterministic error instead of memory fallback.
- Keep default backward-compatible fallback behavior when strict mode is off.

Tests:
- Add strict-mode tests for initialization failure behavior.
- Keep current fallback tests passing for non-strict mode.

Run:
```bash
npx vitest run tests/mission-board.persistence.spec.ts tests/mission-board.routes.spec.ts
```

Commit:
- `feat(mission-board): add strict persistence mode for production trust`

---

## Prompt 6 - Policy drift parity matrix across client/server

Implement:
- Create a shared eligibility matrix source (or a deterministic contract test harness) covering:
  - tier0/tier1
  - sessionState
  - voiceMode
  - priority/classification
- Validate equivalence across:
  - client helper (`client/src/lib/mission-overwatch/index.ts`)
  - server salience (`server/services/mission-overwatch/salience.ts`)
  - voice router eligibility (`server/routes/voice.ts`)

Tests:
- Add `tests/helix-dottie-policy-parity-matrix.spec.ts`.

Run:
```bash
npx vitest run tests/helix-dottie-policy-parity-matrix.spec.ts tests/mission-overwatch-salience.spec.ts tests/voice.routes.spec.ts
```

Commit:
- `test(helix): add client-server policy parity matrix guard`

---

## Prompt 7 - Upgrade situational report script for policy-trace correlation

Implement:
- Extend `scripts/helix-dottie-situational-report.ts` to add a correlation section:
  - `(missionId, eventId, traceId, suppressionReason, replayMeta, ackRefId, trigger_to_debrief_closed_ms)`
- Write this to:
  - transcript md
  - debug md
  - machine json artifact
- Keep current report structure stable.

Tests:
- Add script-level output assertions (snapshot or schema checks) in a new test file.

Run:
```bash
npx vitest run tests/generated/helix-dottie-situational.generated.spec.ts tests/helix-dottie-replay-integration.spec.ts
npm run helix:dottie:situational:report
```

Commit:
- `feat(helix): add policy-trace correlation reporting to situational runner`

---

## Prompt 8 - Final hardening pass, docs alignment, and handoff

Implement:
- Update docs for new strictness fields and replay clock:
  - `docs/architecture/voice-service-contract.md`
  - `docs/architecture/mission-go-board-spec.md`
- Add final readiness and residual-risk report:
  - `reports/helix-dottie-reactification-readiness-2026-02-24.md`

Run:
```bash
npx vitest run \
  tests/generated/helix-dottie-situational.generated.spec.ts \
  tests/helix-dottie-replay-integration.spec.ts \
  tests/voice.routes.spec.ts \
  tests/mission-board.routes.spec.ts \
  tests/mission-board.persistence.spec.ts \
  tests/mission-overwatch-salience.spec.ts
npm run validate:helix-dottie-docs-schema
```

Gate:
- Run Casimir verify and include:
  - verdict
  - firstFail
  - certificate hash
  - integrity status

Commit:
- `chore(helix): finalize dottie method reactification hardening and docs`

---

## One-shot operator command template for Codex Cloud

Use this template when sending each prompt:

```text
Run Prompt <N> from:
docs/audits/research/helix-dottie-method-reactification-codex-cloud-autorun-batch-prompt-pack-2026-02-24.md

Requirements:
- pull latest main first
- apply only additive/backward-compatible changes
- run listed tests
- run Casimir verify
- report PASS/FAIL with certificate hash/integrity
- commit and push
```
