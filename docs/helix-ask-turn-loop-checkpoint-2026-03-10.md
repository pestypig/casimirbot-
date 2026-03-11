# Helix Ask Voice/Reasoning Checkpoint (2026-03-10)

Status: active baseline checkpoint for agent context and regression triage.

## Baseline Identity
- Date: 2026-03-10
- Branch: `main`
- Commit: `1e1b1f84a86f`
- Client build observed: `dev-1773176606568`
- Server build observed: `1.0.0`

## Why This Checkpoint Matters
This checkpoint captures a known-good turn loop where briefs, reasoning, and
final playback behave as a single causal chain under interruptions. Use it as
the comparison baseline before and after Helix Ask orchestration changes.

## Known-Good Signals (Observed)
1. Brief source is consistently LLM:
   - `briefSource: "llm"` on brief/timeline events.
2. Suppression reasons are typed and no longer collapsed into stale-only labels:
   - Examples seen: `inactive_attempt`, `artifact_guard_restart`.
3. Authority rejection stage is explicit:
   - Examples seen: `authorityRejectStage: "stream"` and `"final"`.
4. Final answer source is explicit and correct:
   - `finalSource: "normal_reasoning"`.
5. Same-turn supersede is deterministic:
   - `signal_aborted:superseded_same_turn` and `barge_in_hard_cut:*`.
6. Turn-level authority fields are present on critical events:
   - `hlcMs`, `seq`, `revision`, `sealToken`.

## Behavior Contract To Preserve
1. One sealed turn revision yields one authoritative reasoning chain.
2. Brief is LLM-first and should appear before final unless interrupted.
3. Interruption must hard-cut playback and reseal deterministically.
4. Suppression must always emit typed cause and reject stage.
5. Final voice/text certainty must not exceed source certainty posture.
6. Mission/objective framing can be applied generatively when grounded by prompt context.

## Evidence Anchors From This Run
- Turn key examples:
  - `voice:ff7c0e98-7a41-48c8-afe8-37c9042cbdc8`
  - `voice:dadffbb5-4e84-4e1e-b879-2a8e81c985ce`
- Typed suppression examples:
  - `suppressionCause: "inactive_attempt"`
  - `suppressionCause: "artifact_guard_restart"`
- Explicit final source examples:
  - `finalSource: "normal_reasoning"`

## Residual Gaps (Still Open)
1. Late final chunk metadata drop:
   - Some later `final` chunk playback events still show null
     `hlcMs/seq/revision/sealToken/briefSource`.
2. Causal reference coverage:
   - Some suppress/drop events still show `causalRefId: null`.
3. Artifact guard sensitivity:
   - Occasional useful answer stream is flagged and restarted before succeeding.

## Regression Checklist (Quick)
Run before calling a new build stable:

```powershell
npm run test -- client/src/lib/helix/__tests__/turn-loop-harness.spec.ts
npm run test -- client/src/lib/helix/__tests__/turn-loop-timeline-reference.spec.ts
npm run test -- client/src/components/__tests__/helix-ask-pill-ui.spec.tsx
npm run test -- tests/helix-conversation-turn.routes.spec.ts
```

Required gate:

```powershell
npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://localhost:5050/api/agi/adapter/run --export-url http://localhost:5050/api/agi/training-trace/export
```

## Related References
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/architecture/voice-service-contract.md`
- `docs/helix-ask-turn-loop-debug-framework.md`

