import { describe, expect, it } from "vitest";
import {
  buildTheoryRuntimeRunRequestV1,
  isTheoryRuntimeRunRequestV1,
  validateTheoryRuntimeRunRequestV1,
  type TheoryRuntimeRunRequestV1,
} from "../theory-runtime-run-request.v1";

const now = "2026-05-29T00:00:00.000Z";

function fixture(): TheoryRuntimeRunRequestV1 {
  return buildTheoryRuntimeRunRequestV1({
    generatedAt: now,
    requestId: "theory-runtime-request:test",
    runtimeId: "warp.full_solve.campaign",
    graphId: "nhm2-theory-badge-graph",
    badgeIds: ["nhm2.closure.source_residual"],
    args: {
      preset: "manifest_only",
    },
    requestedScope: "full",
    status: "created",
    createdAt: now,
    updatedAt: now,
    heartbeat: {
      updatedAt: now,
      stage: "manifest_created",
      message: "Manifest created; no backend runtime executed.",
      progress: 0,
    },
    outputArtifactGlobs: ["artifacts/research/full-solve/**/*.json"],
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: "reduced_order",
      promotionAllowed: false,
      promotionRequires: ["source closure artifact", "certificate integrity receipt"],
    },
  });
}

describe("theory_runtime_run_request/v1 contract", () => {
  it("accepts a valid fixture", () => {
    const request = fixture();

    expect(validateTheoryRuntimeRunRequestV1(request)).toEqual([]);
    expect(isTheoryRuntimeRunRequestV1(request)).toBe(true);
  });

  it("rejects a missing artifactId", () => {
    const request = { ...fixture(), artifactId: undefined };

    expect(validateTheoryRuntimeRunRequestV1(request).join(" ")).toMatch(/artifactId/);
  });

  it("rejects an invalid scope", () => {
    const request = { ...fixture(), requestedScope: "forever" };

    expect(validateTheoryRuntimeRunRequestV1(request).join(" ")).toMatch(/requestedScope/);
  });

  it("rejects an invalid status", () => {
    const request = { ...fixture(), status: "validated" };

    expect(validateTheoryRuntimeRunRequestV1(request).join(" ")).toMatch(/status/);
  });

  it("requires a bounded heartbeat progress value", () => {
    const request = {
      ...fixture(),
      heartbeat: {
        ...fixture().heartbeat,
        progress: 2,
      },
    };

    expect(validateTheoryRuntimeRunRequestV1(request).join(" ")).toMatch(/heartbeat\.progress/);
  });

  it("requires claim boundary fields", () => {
    const request = {
      ...fixture(),
      claimBoundary: {
        currentTier: "diagnostic",
        maximumTier: "reduced_order",
        promotionAllowed: true,
      },
    };

    expect(validateTheoryRuntimeRunRequestV1(request).join(" ")).toMatch(/promotionRequires/);
  });
});
