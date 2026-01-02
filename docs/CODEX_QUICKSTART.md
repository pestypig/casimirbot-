# Codex quickstart (GR agent loop)

This note captures the shortest path for Codex (or operators) to run GR agent
loops headlessly and to understand the acceptance gate.

## Loop flow
1) Start from the current energy pipeline state.
2) Apply a proposal (baseline or strategy) to update duty, gamma, etc.
3) Build the GR request payload from the updated state.
4) Solve initial data (buildGrInitialBrick) and evolve N steps (buildGrEvolveBrick).
5) Evaluate constraints and guardrails (runGrEvaluation).
6) Accept if constraints pass and initial data is CERTIFIED; optionally commit.

## Endpoints
- POST /api/helix/gr-agent-loop
  - Body: GrAgentLoopOptions (see server/gr/gr-agent-loop-schema.ts).
  - Response: { run, result }
- GET /api/helix/gr-agent-loop?limit=12
  - List recent runs from the audit log.
- GET /api/helix/gr-agent-loop/:id
  - Fetch a single run record.

Example:
```bash
curl -s -X POST http://localhost:5173/api/helix/gr-agent-loop \
  -H "Content-Type: application/json" \
  -d '{"maxIterations":4,"commitAccepted":false,"gr":{"dims":[32,32,32]}}'
```

## Headless CLI
Direct (no server required):
```bash
tsx cli/gr-agent-loop.ts --max-iterations 4
```

NPM scripts:
```bash
npm run gr:loop -- --max-iterations 4
npm run gr:loop:ci -- --params '{"maxIterations":4}'
```

Inline options:
```bash
tsx cli/gr-agent-loop.ts --params '{"maxIterations":4,"gr":{"dims":[32,32,32]}}'
```

Via API (records to the audit log and shows up in the UI):
```bash
tsx cli/gr-agent-loop.ts \
  --url http://localhost:5173/api/helix/gr-agent-loop \
  --params '{"maxIterations":4}'
```

Notes:
- Use `--json path/to/options.json` to load a JSON options object from disk.
- Use `--commit` to keep the accepted state in the pipeline.
- Use `--use-live-snapshot` to evaluate against live pipeline snapshots.
- Use `--ci` (or `--require-accept`) to exit non-zero when no configuration is accepted.
- Set `GR_AGENT_LOOP_URL` to a full endpoint or `HELIX_API_BASE`/`API_BASE` to a base origin so the CLI targets the API without `--url`.
