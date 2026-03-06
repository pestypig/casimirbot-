import { beforeEach, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { helixReasoningTheaterRouter } from "../routes/helix/reasoning-theater";
import {
  buildContextCapsuleFromTrace,
  buildSessionMemoryPatchFromCapsules,
  saveContextCapsule,
} from "../services/helix-ask/context-capsule";

function createCapsule(args: {
  traceId: string;
  question: string;
  route: string;
  hasExact: boolean;
  claimTier: string;
  exactPaths?: string[];
}) {
  return buildContextCapsuleFromTrace({
    traceId: args.traceId,
    runId: args.traceId,
    question: args.question,
    answer: "answer",
    events: [
      {
        stage: "Retrieval channels",
        meta: {
          retrieval: {
            retrievalRoute: args.route,
            has_exact_provenance: args.hasExact,
            exact_paths: args.exactPaths ?? [],
            atlasHits: 0,
          },
          epistemic: {
            claim_tier: args.claimTier,
            arbiter_mode: "repo_grounded",
          },
          intent: {
            intent_domain: "repo",
            intent_id: "repo_lookup",
          },
        },
      },
    ],
    proof: {
      verdict: "UNKNOWN",
      certificateHash: null,
      certificateIntegrityOk: null,
    },
  });
}

function createApp() {
  const app = express();
  app.use("/api/helix", helixReasoningTheaterRouter);
  return app;
}

describe("context capsule endpoint and replay merge", () => {
  beforeEach(() => {
    // no-op: service keeps in-memory store and tests use unique ids/traces
  });

  it("returns capsule for same tenant across sessions and blocks other tenants", async () => {
    const capsule = saveContextCapsule({
      capsule: createCapsule({
        traceId: `trace-${Date.now()}-a`,
        question: "where is module",
        route: "retrieval:repo",
        hasExact: true,
        claimTier: "diagnostic",
        exactPaths: ["server/routes/agi.plan.ts"],
      }),
      tenantId: "tenant-a",
      sessionId: "session-a",
      traceId: "trace-a",
    });

    const app = createApp();

    const okResponse = await request(app)
      .get(`/api/helix/capsule/${capsule.capsuleId}?sessionId=session-other`)
      .set("x-tenant-id", "tenant-a")
      .expect(200);

    expect(okResponse.body?.capsule?.capsuleId).toBe(capsule.capsuleId);
    expect(okResponse.body?.capsule?.fingerprint).toBe(capsule.fingerprint);
    expect(okResponse.body?.capsule?.safety?.strict_core).toBe(true);

    const lookupByFingerprint = await request(app)
      .get(`/api/helix/capsule/${capsule.fingerprint}?sessionId=session-other`)
      .set("x-tenant-id", "tenant-a")
      .expect(200);

    expect(lookupByFingerprint.body?.capsule?.capsuleId).toBe(capsule.capsuleId);

    await request(app)
      .get(`/api/helix/capsule/${capsule.capsuleId}?sessionId=session-a`)
      .set("x-tenant-id", "tenant-b")
      .expect(404);
  });

  it("merges replay-active capsule context only", () => {
    const active = saveContextCapsule({
      capsule: createCapsule({
        traceId: `trace-${Date.now()}-active`,
        question: "active",
        route: "retrieval:repo",
        hasExact: true,
        claimTier: "diagnostic",
        exactPaths: ["client/src/components/helix/HelixAskPill.tsx"],
      }),
      tenantId: "tenant-merge",
      sessionId: "session-merge",
      traceId: "trace-active",
    });

    const inactive = saveContextCapsule({
      capsule: createCapsule({
        traceId: `trace-${Date.now()}-inactive`,
        question: "inactive",
        route: "retrieval:open_world",
        hasExact: false,
        claimTier: "exploratory",
      }),
      tenantId: "tenant-merge",
      sessionId: "session-merge",
      traceId: "trace-inactive",
    });

    const merged = buildSessionMemoryPatchFromCapsules({
      capsuleIds: [active.capsuleId, inactive.capsuleId],
      tenantId: "tenant-merge",
      sessionId: "session-merge",
    });

    expect(merged.requestedCapsuleIds).toEqual([active.capsuleId, inactive.capsuleId]);
    expect(merged.appliedCapsuleIds).toEqual([active.capsuleId]);
    expect(merged.inactiveCapsuleIds).toEqual([inactive.capsuleId]);
    expect(merged.pinnedFiles).toContain("client/src/components/helix/HelixAskPill.tsx");
  });

  it("applies replay-active capsule context across sessions for same tenant", () => {
    const capsule = saveContextCapsule({
      capsule: createCapsule({
        traceId: `trace-${Date.now()}-cross-session`,
        question: "cross session capsule",
        route: "retrieval:repo",
        hasExact: true,
        claimTier: "diagnostic",
        exactPaths: ["server/routes/helix/reasoning-theater.ts"],
      }),
      tenantId: "tenant-cross",
      sessionId: "seed-session",
      traceId: "trace-cross",
    });

    const merged = buildSessionMemoryPatchFromCapsules({
      capsuleIds: [capsule.fingerprint],
      tenantId: "tenant-cross",
      sessionId: "new-session",
    });

    expect(merged.appliedCapsuleIds).toEqual([capsule.fingerprint]);
    expect(merged.missingCapsuleIds).toEqual([]);
    expect(merged.pinnedFiles).toContain("server/routes/helix/reasoning-theater.ts");
  });
});
