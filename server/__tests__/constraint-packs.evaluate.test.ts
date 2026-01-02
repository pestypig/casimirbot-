import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import path from "node:path";

type ConstraintPackRouterModule = typeof import("../routes/agi.constraint-packs");
type TrainingTraceStoreModule = typeof import("../services/observability/training-trace-store");
type ConstraintPackPolicyStoreModule = typeof import("../services/constraint-packs/constraint-pack-policy-store");

let app: express.Express;
let resetStore: (() => void) | undefined;
let resetPolicyStore: (() => void) | undefined;

const loadModules = async (): Promise<{
  routes: ConstraintPackRouterModule;
  store: TrainingTraceStoreModule;
  policyStore: ConstraintPackPolicyStoreModule;
}> => {
  process.env.TRAINING_TRACE_PERSIST = "0";
  process.env.CASIMIR_AUTO_TELEMETRY = "0";
  process.env.TRAINING_TRACE_AUDIT_PATH = path.resolve(
    process.cwd(),
    ".cal",
    `constraint-pack-test-${process.pid}.jsonl`,
  );
  process.env.CONSTRAINT_PACK_POLICY_PERSIST = "0";
  process.env.CONSTRAINT_PACK_POLICY_AUDIT_PATH = path.resolve(
    process.cwd(),
    ".cal",
    `constraint-pack-policy-test-${process.pid}.jsonl`,
  );
  await vi.resetModules();
  const routes = await import("../routes/agi.constraint-packs");
  const store = await import("../services/observability/training-trace-store");
  const policyStore = await import("../services/constraint-packs/constraint-pack-policy-store");
  return { routes, store, policyStore };
};

beforeAll(async () => {
  const { routes, store, policyStore } = await loadModules();
  resetStore = store.__resetTrainingTraceStore;
  resetPolicyStore = policyStore.__resetConstraintPackPolicyStore;
  app = express();
  app.use(express.json());
  app.use("/api/agi", routes.constraintPacksRouter);
});

beforeEach(() => {
  resetStore?.();
  resetPolicyStore?.();
});

describe("constraint pack evaluation", () => {
  it("evaluates repo convergence telemetry", async () => {
    const response = await request(app)
      .post("/api/agi/constraint-packs/repo-convergence/evaluate")
      .send({
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
      })
      .expect(200);

    expect(response.body?.evaluation?.pass).toBe(true);
    expect(response.body?.trace?.signal?.kind).toBe("repo-diagnostic");
    expect(response.body?.trace?.signal?.ladder?.tier).toBe("diagnostic");      
  });

  it("auto-ingests repo telemetry from env when enabled", async () => {
    const envBackup = { ...process.env };
    process.env.CASIMIR_AUTO_TELEMETRY = "1";
    process.env.CASIMIR_BUILD_STATUS = "pass";
    process.env.CASIMIR_TEST_FAILED = "0";
    process.env.CASIMIR_TEST_TOTAL = "5";
    process.env.CASIMIR_SCHEMA_CONTRACTS = "true";
    process.env.CASIMIR_DEPS_COHERENCE = "true";
    try {
      const response = await request(app)
        .post("/api/agi/constraint-packs/repo-convergence/evaluate")
        .send({ traceId: "ci:auto-1" })
        .expect(200);

      expect(response.body?.evaluation?.pass).toBe(true);
      expect(response.body?.evaluation?.notes).toEqual(
        expect.arrayContaining(["telemetry_source=env"]),
      );
    } finally {
      process.env.CASIMIR_AUTO_TELEMETRY =
        envBackup.CASIMIR_AUTO_TELEMETRY;
      process.env.CASIMIR_BUILD_STATUS = envBackup.CASIMIR_BUILD_STATUS;
      process.env.CASIMIR_TEST_FAILED = envBackup.CASIMIR_TEST_FAILED;
      process.env.CASIMIR_TEST_TOTAL = envBackup.CASIMIR_TEST_TOTAL;
      process.env.CASIMIR_SCHEMA_CONTRACTS =
        envBackup.CASIMIR_SCHEMA_CONTRACTS;
      process.env.CASIMIR_DEPS_COHERENCE = envBackup.CASIMIR_DEPS_COHERENCE;
      if (envBackup.CASIMIR_AUTO_TELEMETRY === undefined) {
        delete process.env.CASIMIR_AUTO_TELEMETRY;
      }
      if (envBackup.CASIMIR_BUILD_STATUS === undefined) {
        delete process.env.CASIMIR_BUILD_STATUS;
      }
      if (envBackup.CASIMIR_TEST_FAILED === undefined) {
        delete process.env.CASIMIR_TEST_FAILED;
      }
      if (envBackup.CASIMIR_TEST_TOTAL === undefined) {
        delete process.env.CASIMIR_TEST_TOTAL;
      }
      if (envBackup.CASIMIR_SCHEMA_CONTRACTS === undefined) {
        delete process.env.CASIMIR_SCHEMA_CONTRACTS;
      }
      if (envBackup.CASIMIR_DEPS_COHERENCE === undefined) {
        delete process.env.CASIMIR_DEPS_COHERENCE;
      }
    }
  });

  it("flags tool-use budget violations", async () => {
    const response = await request(app)
      .post("/api/agi/constraint-packs/tool-use-budget/evaluate")
      .send({
        telemetry: {
          steps: { used: 50 },
          cost: { usd: 1.6 },
          ops: { forbidden: 0, approvalMissing: 0 },
          provenance: { missing: 0 },
          runtime: { ms: 42000 },
          tools: { calls: 6 },
        },
      })
      .expect(200);

    expect(response.body?.evaluation?.pass).toBe(false);
    expect(response.body?.evaluation?.firstFail?.id).toBe("step_limit");
    expect(response.body?.trace?.signal?.kind).toBe("tool-budget-diagnostic");
  });

  it("applies policy profile overrides", async () => {
    const created = await request(app)
      .post("/api/agi/constraint-packs/policies")
      .send({
        customerId: "acme",
        name: "tight-budgets",
        packs: [
          {
            packId: "tool-use-budget",
            constraints: [{ id: "step_limit", max: 8 }],
          },
        ],
      })
      .expect(200);

    const profileId = created.body?.profile?.id;
    expect(profileId).toBeTruthy();

    const response = await request(app)
      .post("/api/agi/constraint-packs/tool-use-budget/evaluate")
      .send({
        policyProfileId: profileId,
        customerId: "acme",
        telemetry: {
          steps: { used: 10 },
          cost: { usd: 1.6 },
          ops: { forbidden: 0, approvalMissing: 0 },
          provenance: { missing: 0 },
          runtime: { ms: 42000 },
          tools: { calls: 6 },
        },
      })
      .expect(200);

    expect(response.body?.policyProfile?.id).toBe(profileId);
    expect(response.body?.evaluation?.firstFail?.id).toBe("step_limit");
  });

  it("enforces minimum ladder tier", async () => {
    const response = await request(app)
      .post("/api/agi/constraint-packs/repo-convergence/evaluate")
      .send({
        telemetry: {
          build: { status: "pass", durationMs: 420000 },
          tests: { failed: 0, total: 128 },
          schema: { contracts: true },
          deps: { coherence: true },
          timeToGreenMs: 480000,
          lint: { status: true },
          typecheck: { status: true },
        },
        policyOverride: {
          policy: { minLadderTier: "certified" },
        },
      })
      .expect(200);

    expect(response.body?.evaluation?.pass).toBe(false);
    expect(response.body?.evaluation?.ladderTier).toBe("diagnostic");
    expect(response.body?.evaluation?.notes).toEqual(
      expect.arrayContaining([
        "ladder_min_tier=certified",
        "ladder_actual=diagnostic",
      ]),
    );
    expect(response.body?.trace?.signal?.ladder?.tier).toBe("diagnostic");
  });
});
