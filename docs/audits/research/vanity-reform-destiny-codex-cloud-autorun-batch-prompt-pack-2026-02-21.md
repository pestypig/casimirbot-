# Vanity, Reform, and Destiny Codex Cloud Autorun Batch Prompt Pack (2026-02-21)

Derived from:
- `docs/audits/research/vanity-reform-destiny-evidence-ledger-2026-02-21.md`

Use this to implement the proposal structures for ideology-pressure guidance with deterministic gates and reproducible delivery.

## Shared guardrails (apply to every prompt)

```text
Hard constraints:
1) Keep maturity honest: this wave is diagnostic/reduced-order unless stronger evidence is produced.
2) Runtime may recommend; it must not remove user agency ("system advises, user decides").
3) High-pressure financial patterns must fail closed into verification-first guidance, never direct execution.
4) Keep patch scope path-bounded to the prompt's allowed paths.
5) Do not claim physical viability/certification from ideology or documentation work.

Mandatory verification gate after each patch:
npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

If verdict is FAIL:
- fix the first failing HARD constraint
- rerun verification until PASS

Always report:
- files changed
- behavior delta
- tests/checks run
- verdict
- firstFail
- certificateHash
- integrityOk
- traceId
- runId
```

## Single autorun launcher prompt (paste into Codex Cloud)

```text
Execution mode:
AUTORUN. Execute the full batch end-to-end without pause unless a hard blocker prevents continuation.

Primary source of truth:
- docs/audits/research/vanity-reform-destiny-codex-cloud-autorun-batch-prompt-pack-2026-02-21.md
- docs/audits/research/vanity-reform-destiny-evidence-ledger-2026-02-21.md

Objective:
Run Prompt 0 through Prompt 9 in strict order, one prompt scope per commit, including required checks and Casimir verification after each prompt.

Global rules:
1) Execute exactly in order: 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9.
2) Respect allowed paths; do not broaden scope.
3) If blocked, ship maximum safe additive subset, record deterministic TODOs, continue.
4) After each prompt, run prompt-specific checks and:
   npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
5) On FAIL, fix first failing HARD constraint and rerun until PASS.
6) Do not claim completion without final PASS and certificate integrity OK.

Per-prompt report block:
- prompt_id
- files_changed
- behavior_delta
- tests_or_checks_run
- casimir_verdict
- casimir_firstFail
- casimir_certificateHash
- casimir_integrityOk
- casimir_traceId
- casimir_runId
- commit_sha
- status (done|partial-blocked|blocked)
```

## Prompt 0: Coordinator and execution ledger

```text
Objective:
Initialize execution tracking for this batch and lock deterministic sequencing.

Allowed paths:
- docs/audits/research/vanity-reform-destiny-codex-cloud-autorun-batch-prompt-pack-2026-02-21.md
- reports/vanity-reform-destiny-execution-ledger-2026-02-21.md (new)

Requirements:
1) Create ledger rows for Prompt 0..9 with status, commit hash, artifacts, Casimir fields.
2) Define lane labels:
   - lane_ideology_tree
   - lane_pressure_resolver
   - lane_action_gates
   - lane_artifacts_ui
   - lane_proposal_integration
3) Add deterministic done checklist per prompt.

Checks:
- casimir verify command

Done criteria:
- Execution ledger exists and is ready for end-to-end run tracking.
```

## Prompt 1: Ideology subtree encoding (Vanity Leverage Protocol)

```text
Objective:
Encode "vanity as medium, not identity" and reform-loop commitments into ideology source-of-truth.

Allowed paths:
- docs/ethos/ideology.json
- docs/knowledge/ethos/values-over-images.md
- docs/knowledge/ethos/voice-integrity.md
- docs/knowledge/ethos/capture-resistance.md
- docs/knowledge/ethos/vanity-leverage-protocol.md (new)
- docs/audits/research/vanity-reform-destiny-evidence-ledger-2026-02-21.md

Requirements:
1) Add/attach nodes for:
   - vanity-as-medium
   - vanity-hazard
   - reform-loop
   - flattery-laundering-detection
   - financial-fog-warning
2) Keep node language nonviolent and verification-first.
3) Add cross-links to existing values-over-images / voice-integrity / capture-resistance branches.

Checks:
- npm run check
- npm run test -- tests/ideology-dag.spec.ts
- casimir verify command

Done criteria:
- Ideology tree contains deterministic node IDs and valid links for this protocol.
```

## Prompt 2: External pressure taxonomy contract (shared)

```text
Objective:
Add a first-class, typed external-pressure taxonomy used by both server and client.

Allowed paths:
- shared/ideology/external-pressures.ts (new)
- client/src/lib/ideology-types.ts
- docs/audits/research/vanity-reform-destiny-evidence-ledger-2026-02-21.md

Requirements:
1) Define pressure enums including:
   - flattery_grooming
   - urgency_scarcity
   - authority_claim
   - isolation_secrecy
   - financial_ask
   - sexualized_attention
   - status_competition
   - platform_amplification
2) Define pressure bundle schema with truth hints (`trueIds`, `falseIds`) and optional edge boosts.
3) Keep type contract stable and importable in server/client layers.

Checks:
- npm run check
- casimir verify command

Done criteria:
- Shared pressure model compiles and is usable by ideology guidance routing.
```

## Prompt 3: Guidance resolver endpoint (pressure -> ideology recommendations)

```text
Objective:
Implement a guidance resolver API that translates pressure signals into ranked ideology guidance.

Allowed paths:
- server/services/ideology/guidance.ts (new)
- server/routes/ethos.ts
- modules/analysis/belief-graph-loop.ts
- shared/ideology/external-pressures.ts
- tests/ideology-dag.spec.ts
- tests/ideology-telemetry.spec.ts

Requirements:
1) Add POST endpoint:
   - /api/ethos/ideology/guidance
2) Input:
   - active pressures
   - optional observed signals
3) Output:
   - detectedBundles
   - recommendedNodeIds (top-k)
   - warnings
   - recommendedArtifacts
   - suggestedVerificationSteps
4) Enforce invariant text in behavior/docs: "system advises, user decides."
5) Reuse belief-graph loop; do not fork contradictory scoring logic.

Checks:
- npm run check
- npm run test -- tests/ideology-dag.spec.ts tests/ideology-telemetry.spec.ts
- casimir verify command

Done criteria:
- Endpoint returns deterministic guidance payload shape for the same input.
```

## Prompt 4: Action-gate tightening under pressure bundles

```text
Objective:
Bind high-risk pressure bundles to stricter action-gate behavior.

Allowed paths:
- server/services/ideology/action-gates.ts
- server/routes/ethos.ts
- tests/ideology-dag.spec.ts

Requirements:
1) Add policy hooks so combined pressure patterns (e.g., romance + investment + urgency) trigger stronger gate requirements.
2) Return deterministic block/warn reason codes.
3) Preserve existing gate behavior for non-pressure paths.

Checks:
- npm run check
- npm run test -- tests/ideology-dag.spec.ts
- casimir verify command

Done criteria:
- High-risk pressure bundles can no longer pass through default-lax gate behavior.
```

## Prompt 5: Artifact and whisper surfacing for protocol teaching

```text
Objective:
Ship ideology artifacts and contextual whispers for pressure-aware coaching.

Allowed paths:
- shared/ideology/ideology-artifacts.ts
- server/services/ideology/artifacts.ts
- client/src/lib/luma-ideology-whispers.ts
- tests/helix-ask-answer-artifacts.spec.ts

Requirements:
1) Add at least:
   - one compact pill artifact
   - one explanatory node-card artifact
2) Tag artifacts for guidance endpoint retrieval.
3) Add whisper entries that reinforce "use surface, anchor vow" on vanity-adjacent panels.

Checks:
- npm run check
- npm run test -- tests/helix-ask-answer-artifacts.spec.ts
- casimir verify command

Done criteria:
- Artifacts are retrievable/renderable and whispers route to relevant node IDs.
```

## Prompt 6: Ideology panel pressure controls and loop-break UX

```text
Objective:
Add external-pressure controls and guidance rendering to ideology UI surfaces.

Allowed paths:
- client/src/components/IdeologyPanel.tsx
- client/src/hooks/use-ideology-belief-graph.ts
- client/src/hooks/use-ideology-artifacts.ts
- client/src/lib/ideology-types.ts

Requirements:
1) Add pressure toggles for common bundles:
   - flattery
   - urgency
   - secrecy/isolation
   - financial ask
   - authority claim
2) Show sections:
   - anchor now
   - avoid/escalate later
   - verification steps
   - exportable artifacts
3) Keep copy non-alarmist and nonviolent.

Checks:
- npm run check
- casimir verify command

Done criteria:
- UI can query and render guidance payload consistently.
```

## Prompt 7: Proposal-structure integration for repeatable execution

```text
Objective:
Integrate this ideology protocol into proposal generation and proposal prompt presets.

Allowed paths:
- shared/proposals.ts
- server/services/proposals/prompt-presets.ts
- server/routes/proposals.ts
- client/src/lib/agi/proposals.ts
- tests/proposal-job-runner.spec.ts
- tests/nightly-proposals.spec.ts

Requirements:
1) Add proposal metadata hooks for ideology-pressure context when kind is knowledge/policy-oriented.
2) Extend prompt preset logic so ideology-related proposals can generate context-specific prompts instead of only warp/physics framing.
3) Preserve backward compatibility for existing proposal records and APIs.

Checks:
- npm run check
- npm run test -- tests/proposal-job-runner.spec.ts tests/nightly-proposals.spec.ts
- casimir verify command

Done criteria:
- Proposal flow can represent and generate this protocol work without breaking existing lanes.
```

## Prompt 8: Vanity-facing route alignment (fashion/public identity surfaces)

```text
Objective:
Add integrity-aware reminders and guardrails on vanity-facing generation routes.

Allowed paths:
- server/routes/fashion.ts
- client/src/lib/luma-ideology-whispers.ts
- docs/audits/research/vanity-reform-destiny-evidence-ledger-2026-02-21.md

Requirements:
1) Add route-level hooks to surface values-over-images and consent/integrity reminders.
2) Prevent "attention-only" optimization language in high-risk contexts.
3) Keep this as advisory/guardrail behavior, not user-choice override.

Checks:
- npm run check
- casimir verify command

Done criteria:
- Fashion route surfaces ideology guardrails predictably in relevant flows.
```

## Prompt 9: Final readiness report

```text
Objective:
Publish a decision-grade summary of what is implemented, what remains blocked, and evidence maturity.

Allowed paths:
- reports/vanity-reform-destiny-readiness-report-2026-02-21.md (new)
- reports/vanity-reform-destiny-execution-ledger-2026-02-21.md
- docs/audits/research/vanity-reform-destiny-evidence-ledger-2026-02-21.md
- docs/audits/research/vanity-reform-destiny-codex-cloud-autorun-batch-prompt-pack-2026-02-21.md

Requirements:
1) Summarize Prompt 0..9 completion + commit hashes.
2) List blockers and unknown evidence items still open.
3) Include final Casimir block with required fields.
4) State GO/NO-GO for next wave and why.

Checks:
- casimir verify command

Done criteria:
- Report is replay-auditable and usable for execution handoff.
```

## Suggested run order

1. `Prompt 0`
2. `Prompt 1`
3. `Prompt 2`
4. `Prompt 3`
5. `Prompt 4`
6. `Prompt 5`
7. `Prompt 6`
8. `Prompt 7`
9. `Prompt 8`
10. `Prompt 9`
