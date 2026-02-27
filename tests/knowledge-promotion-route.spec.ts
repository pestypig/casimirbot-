import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { knowledgeRouter } from "../server/routes/knowledge";
import {
  __resetTrainingTraceStore,
  recordTrainingTrace,
} from "../server/services/observability/training-trace-store";

describe("knowledge promotion route", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/knowledge", knowledgeRouter);

  beforeEach(() => {
    __resetTrainingTraceStore();
  });

  it("rejects forged client PASS payload without evidenceRef", async () => {
    const res = await request(app).post("/api/knowledge/projects/promote").send({
      claimTier: "certified",
      casimirVerdict: "PASS",
      certificateHash: "forged",
      certificateIntegrityOk: true,
      enforceCertifiedOnly: true,
    });

    expect(res.status).toBe(409);
    expect(res.body?.rejection?.code).toBe("KNOWLEDGE_PROMOTION_MISSING_EVIDENCE_REF");
  });

  it("rejects unknown evidenceRef with typed code", async () => {
    const res = await request(app).post("/api/knowledge/projects/promote").send({
      claimTier: "certified",
      evidenceRef: "unknown-trace-id",
      enforceCertifiedOnly: true,
    });

    expect(res.status).toBe(409);
    expect(res.body?.rejection?.code).toBe("KNOWLEDGE_PROMOTION_UNRESOLVED_EVIDENCE_REF");
  });

  it("accepts only when resolved server evidence satisfies gate conditions", async () => {
    const trace = recordTrainingTrace({
      traceId: "knowledge-promotion-pass",
      pass: true,
      deltas: [],
      certificate: {
        certificateHash: "cert:ok",
        certificateId: "cert:ok:id",
        integrityOk: true,
      },
    });

    const res = await request(app).post("/api/knowledge/projects/promote").send({
      claimTier: "certified",
      evidenceRef: trace.id,
      casimirVerdict: "FAIL",
      certificateHash: "forged",
      certificateIntegrityOk: false,
      enforceCertifiedOnly: true,
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      promotion: {
        status: "promoted",
        claimTier: "certified",
        evidenceRef: trace.id,
      },
    });
  });

  it("returns report-only non-promoted response when gate fails", async () => {
    const trace = recordTrainingTrace({
      traceId: "knowledge-promotion-fail",
      pass: false,
      deltas: [],
      certificate: {
        certificateHash: "cert:bad",
        certificateId: "cert:bad:id",
        integrityOk: true,
      },
    });

    const res = await request(app).post("/api/knowledge/projects/promote").send({
      claimTier: "certified",
      evidenceRef: trace.id,
      enforceCertifiedOnly: false,
    });

    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({
      ok: false,
      mode: "report-only",
      promotion: {
        status: "not-promoted",
      },
    });
    expect(res.body?.rejection?.code).toBe("KNOWLEDGE_PROMOTION_MISSING_CASIMIR_VERIFICATION");
  });
});
