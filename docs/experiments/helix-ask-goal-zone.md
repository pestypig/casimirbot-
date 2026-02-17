# Helix Ask Goal Zone (Cloud Codex)

## Objective
Create a repeatable test zone where Cloud Codex can run Helix Ask relation prompts, detect failures, patch routing/assembly/format logic, and re-run until the response quality meets target.

Primary target class:
- warp bubble <-> mission ethos / ideology relation prompts.

## Files
- Harness: `scripts/helix-ask-goal-zone.ts`
- Goal pack: `bench/helix_ask_goal_zone_pack.json`
- Artifacts: `artifacts/helix-ask-goal-zone/`
- Latest report: `reports/helix-ask-goal-zone-latest.md`

## Run
Start server first (or set `HELIX_ASK_GOAL_START_SERVER=1`):

```bash
npm run dev:agi:5173
```

Then run the goal zone:

```bash
npx tsx scripts/helix-ask-goal-zone.ts
```

Optional flags:
- `HELIX_ASK_GOAL_BASE_URL` is inherited from `HELIX_ASK_BASE_URL`.
- `HELIX_ASK_GOAL_PACK=bench/helix_ask_goal_zone_pack.json`
- `HELIX_ASK_GOAL_ITERATIONS=3`
- `HELIX_ASK_GOAL_MIN_CASE_PASS_RATE=1`
- `HELIX_ASK_GOAL_ALLOW_STUB=1` (only for stub environments)
- `HELIX_ASK_GOAL_START_SERVER=1`

## Pass Criteria
For each case (all seeds), target:
- `debug.intent_id = hybrid.warp_ethos_relation`
- `debug.intent_strategy = hybrid_explain`
- `debug.report_mode = false`
- `debug.relation_packet_built = true`
- `debug.relation_dual_domain_ok = true`
- bridge and evidence counts meet minimums
- no report-scaffold response shape (`Executive summary`, `Point-by-point`, etc.)
- response includes relation narrative terms and minimum length (unless stub mode is allowed)

## Loop Protocol
1. Run `scripts/helix-ask-goal-zone.ts`.
2. Read `artifacts/helix-ask-goal-zone/latest.json` and `reports/helix-ask-goal-zone-latest.md`.
3. Patch only the top failure category.
4. Re-run until pass.
5. Run Casimir verification gate and trace export:
   - `POST /api/agi/adapter/run`
   - `GET /api/agi/training-trace/export`

## Cloud Codex Runnable Prompt
```md
Run the Helix Ask Goal Zone loop for warp<->ethos relation quality.

Branch: main
Goal docs: docs/experiments/helix-ask-goal-zone.md

Steps:
1) Start Helix Ask server on :5173.
2) Run: npx tsx scripts/helix-ask-goal-zone.ts
3) Inspect failures in:
   - artifacts/helix-ask-goal-zone/latest.json
   - reports/helix-ask-goal-zone-latest.md
4) Patch only the highest-impact failure category.
5) Re-run goal zone.
6) Repeat until pass.
7) Run required verification:
   - POST /api/agi/adapter/run (constraint-pack)
   - GET /api/agi/training-trace/export
8) Commit with summary + metrics + verification proof.

Constraints:
- Do not broaden behavior with unrelated routing changes.
- Keep retrieval latency impact <= +10% p95.
- Preserve deterministic debug diagnostics for relation packet checks.
```

