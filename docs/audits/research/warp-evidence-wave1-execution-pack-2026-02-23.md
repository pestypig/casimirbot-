# Warp Evidence Wave 1 Execution Pack (2026-02-23)

## Objective
Execute the highest-ROI evidence hardening items from the Evidence Build Dossier without overclaiming propulsion readiness.

Maturity posture:
- diagnostic -> reduced-order -> certified-as-governance-only

## Wave 1 Scope (7 days)

### P-001 Deterministic Evidence Bundle
- Goal: produce a single stakeholder/audit bundle with deterministic bytes.
- Required contents:
  - commit hash
  - proof pack reference/export
  - viability snapshot
  - first-fail report
  - claim-tier snapshot
  - checksum
  - required public disclaimer block
- Primary files:
  - `scripts/warp-evidence-pack.ts`
  - `tests/warp-evidence-pack.spec.ts`
  - `docs/public-claims-boundary-sheet.md`

Acceptance:
- same inputs generate identical output bytes
- CI fails if disclaimer missing from public-facing artifacts

### P-002 QI Applicability Enforcement
- Goal: prevent over-promotion when QI applicability is unknown/non-applicable.
- Required behavior:
  - export explicit applicability status (`PASS|FAIL|NOT_APPLICABLE|UNKNOWN`)
  - cap promotion above diagnostic/reduced-order when applicability != PASS
  - surface status in proof-visible runtime outputs
- Primary files:
  - `server/energy-pipeline.ts`
  - `tools/warpViability.ts`
  - `tests/qi-guardrail.spec.ts`
  - `tests/pipeline-ts-qi-guard.spec.ts`
  - `tests/warp-viability.spec.ts`

Acceptance:
- tests prove UNKNOWN blocks promotion
- `NOT_APPLICABLE` is never rendered as pass

### P-003 TS Semantic Split
- Goal: remove ambiguity between TS gate minimum and TS regime display heuristics.
- Required behavior:
  - maintain one canonical gate minimum source
  - label UI/telemetry regime thresholds as operational proxy semantics
  - keep docs/spec/code aligned
- Primary files:
  - `shared/clocking.ts`
  - `WARP_AGENTS.md`
  - `tests/threshold-canon.spec.ts`

Acceptance:
- threshold-canon tests fail on divergence
- presentation text cannot imply TS alone proves stability

### P-004 Proxy-Masquerade Lock
- Goal: prevent proxy-derived values from reading geometry-derived in public surfaces.
- Required behavior:
  - explicit derivation labels on proof-facing UI paths
  - public mode must suppress speculative/internal proxy phrasing
  - strict mode fail-close on metric contract absence for metric claims
- Primary files:
  - `client/src/components/live-energy-pipeline.tsx`
  - `client/src/lib/audience-mode.ts`
  - `client/src/components/__tests__/energy-pipeline-claim-tier.spec.tsx`
  - `client/src/lib/__tests__/audience-mode.spec.ts`

Acceptance:
- UI tests verify label switching and public-safe wording
- strict-mode tests reject proxy masquerade

## Required Verification Gate For Every Patch
Use adapter-backed verify and report exact fields:

```bash
npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl
```

If FAIL:
1. fix first failing HARD constraint
2. rerun until PASS

## Required Report Fields (every PR)
- verdict
- firstFail
- certificateHash
- integrityOk
- traceId
- runId

## PR Exit Criteria (Wave 1)
- all touched tests pass
- Casimir verify PASS with integrity OK
- no prohibited claim language in public artifacts
- claim tiering remains governance-only for certified language

## Presentation Gate After Wave 1
Presentation can expand only if all above exit criteria pass.

Still prohibited:
- “physically viable warp propulsion”
- near-term FTL roadmap framing
- “strobing/pulsing loophole” language
