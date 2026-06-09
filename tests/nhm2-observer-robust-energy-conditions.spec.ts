import { describe, expect, it } from "vitest";

import {
  buildNhm2ObserverRobustEnergyConditionArtifact,
  buildNhm2ObserverRobustEnergyConditionFromTensor,
  isNhm2ObserverRobustEnergyConditionArtifact,
} from "../shared/contracts/nhm2-observer-robust-energy-conditions.v1";

const algebraicCondition = (value: number) => ({
  eulerianMin: value + 0.1,
  robustMin: value,
  worstCase: {
    index: 0,
    value,
    direction: [1, 0, 0] as [number, number, number],
    rapidity: null,
    source: "algebraic_type_i",
  },
});

const cappedGridCondition = (value: number) => ({
  eulerianMin: value + 0.1,
  robustMin: value,
  worstCase: {
    index: 0,
    value,
    direction: [1, 0, 0] as [number, number, number],
    rapidity: 0.4,
    source: "capped_search",
  },
});

describe("nhm2 observer-robust energy-condition artifact", () => {
  it("labels eulerian-only evidence as restricted and leaves optimizer not_run", () => {
    const artifact = buildNhm2ObserverRobustEnergyConditionArtifact({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1",
      tensorRef: "artifact://tensor",
      observerFamilies: [
        {
          familyId: "eulerian",
          status: "pass",
          sampleCount: 1,
          worstCase: { condition: "WEC", value: 0.4 },
        },
      ],
    });

    expect(artifact.summary.eulerianOnly).toBe(true);
    expect(artifact.summary.robustCheckComplete).toBe(false);
    expect(artifact.summary.missedViolationRisk).toBe("high");
    expect(
      artifact.observerFamilies.find(
        (family) => family.familyId === "continuous_optimizer",
      )?.status,
    ).toBe("not_run");
    expect(isNhm2ObserverRobustEnergyConditionArtifact(artifact)).toBe(true);
  });

  it("maps legacy capped observer searches to bounded timelike-grid evidence", () => {
    const artifact = buildNhm2ObserverRobustEnergyConditionFromTensor({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1",
      tensor: {
        tensorRef: "artifact://tensor",
        sampleCount: 4,
        typeI: { count: 4, fraction: 1, tolerance: 0 },
        conditions: {
          wec: cappedGridCondition(0.4),
          nec: cappedGridCondition(0.3),
          dec: cappedGridCondition(0.2),
          sec: cappedGridCondition(0.1),
        },
      },
    });

    const boostedGrid = artifact.observerFamilies.find(
      (family) => family.familyId === "boosted_timelike_grid",
    );
    const typeI = artifact.observerFamilies.find(
      (family) => family.familyId === "algebraic_type_i",
    );
    expect(boostedGrid?.status).toBe("pass");
    expect(typeI?.status).toBe("missing");
    expect(artifact.summary.eulerianOnly).toBe(false);
    expect(artifact.summary.robustCheckComplete).toBe(true);
  });

  it("treats complete algebraic Type I coverage as a robust observer-family pass", () => {
    const artifact = buildNhm2ObserverRobustEnergyConditionFromTensor({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1",
      tensor: {
        tensorRef: "artifact://tensor",
        sampleCount: 4,
        typeI: { count: 4, fraction: 1, tolerance: 0 },
        conditions: {
          wec: algebraicCondition(0.4),
          nec: algebraicCondition(0.3),
          dec: algebraicCondition(0.2),
          sec: algebraicCondition(0.1),
        },
      },
    });

    const typeI = artifact.observerFamilies.find(
      (family) => family.familyId === "algebraic_type_i",
    );
    expect(typeI?.status).toBe("pass");
    expect(typeI?.worstCase?.condition).toBe("SEC");
    expect(artifact.summary.eulerianOnly).toBe(false);
    expect(artifact.summary.robustCheckComplete).toBe(true);
    expect(artifact.summary.anyViolation).toBe(false);
    expect(
      artifact.observerFamilies.find(
        (family) => family.familyId === "continuous_optimizer",
      )?.optimizerUsed,
    ).toBe(false);
  });

  it("surfaces any observer-family violation as a robust artifact violation", () => {
    const artifact = buildNhm2ObserverRobustEnergyConditionFromTensor({
      tensor: {
        tensorRef: "artifact://tensor",
        sampleCount: 4,
        typeI: { count: 4, fraction: 1, tolerance: 0 },
        conditions: {
          wec: algebraicCondition(0.2),
          nec: algebraicCondition(-0.1),
          dec: algebraicCondition(0.3),
          sec: algebraicCondition(0.4),
        },
      },
    });

    expect(artifact.summary.anyViolation).toBe(true);
    expect(artifact.summary.robustCheckComplete).toBe(false);
    expect(
      artifact.observerFamilies.find(
        (family) => family.familyId === "algebraic_type_i",
      )?.status,
    ).toBe("fail");
  });
});
