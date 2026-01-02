# Casimir SDK

Thin client for the Casimir verification API (adapter runs, traces, and
constraint packs). Requires Node 18+ or a runtime that provides `fetch`.

Install (once published)
```
npm install casimir-sdk
```

Basic usage
```ts
import { createCasimirClient } from "casimir-sdk";

const client = createCasimirClient({
  baseUrl: "https://casimirbot.com",
  tenantId: "acme",
});

const result = await client.runAdapter({
  traceId: "client-run-001",
  actions: [
    { id: "a1", label: "reduce duty", params: { dutyEffectiveFR: 0.0025 } },
  ],
  budget: { maxIterations: 1, maxTotalMs: 60000 },
});

if (!result.pass) {
  console.error("First failing constraint:", result.firstFail);
}

const traces = await client.exportTrainingTraces({ limit: 50 });
console.log(traces.length);
```

Defaults
- If `baseUrl` is omitted, the client targets `https://casimirbot.com`.

Constraint packs
```ts
const packs = await client.listConstraintPacks();
const evaluation = await client.evaluateConstraintPack("repo-convergence", {
  traceId: "ci:run-1",
  telemetry: {
    build: { status: "pass", durationMs: 420000 },
    tests: { failed: 0, total: 128 },
    schema: { contracts: true },
    deps: { coherence: true },
    timeToGreenMs: 480000,
    lint: { status: true },
    typecheck: { status: true },
  },
});
```

Auth + tenant isolation
- Provide `token` and `tenantId` in the client options.
- The SDK sets `Authorization: Bearer ...` and `X-Tenant-Id` headers.

Build
```
cd sdk
npm install
npm run build
```
