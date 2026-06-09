import { describe, expect, it } from "vitest";

import {
  buildNhm2SameChartFullTensorArtifact,
  isNhm2SameChartFullTensorArtifact,
  type Nhm2SameChartFullTensorComponentId,
} from "../shared/contracts/nhm2-same-chart-full-tensor.v1";

const component = (
  artifact: ReturnType<typeof buildNhm2SameChartFullTensorArtifact>,
  componentId: Nhm2SameChartFullTensorComponentId,
) => artifact.components.find((entry) => entry.componentId === componentId);

describe("nhm2 same-chart full tensor artifact", () => {
  it("emits all components and marks missing T0i/off-diagonal Tij without zero fill", () => {
    const artifact = buildNhm2SameChartFullTensorArtifact({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      metricFamily: "nhm2_shift_lapse",
      routeId: "adm_quasi_stationary_recovery_v1",
      tensor: {
        T00: -1,
        T11: 2,
        T22: 3,
        T33: 4,
      },
      adm: {
        alphaStatus: "computed",
        betaStatus: "computed",
        gammaStatus: "computed",
        extrinsicCurvatureStatus: "computed",
      },
    });

    expect(isNhm2SameChartFullTensorArtifact(artifact)).toBe(true);
    expect(artifact.components).toHaveLength(10);
    expect(artifact.completeness.hasT00).toBe(true);
    expect(artifact.completeness.hasDiagonalTij).toBe(true);
    expect(artifact.completeness.hasT0i).toBe(false);
    expect(artifact.completeness.hasOffDiagonalTij).toBe(false);
    expect(artifact.completeness.fullTensorComplete).toBe(false);
    expect(artifact.completeness.missingComponentIds).toEqual(
      expect.arrayContaining(["T0x", "T0y", "T0z", "Txy", "Txz", "Tyz"]),
    );
    expect(component(artifact, "T0x")).toMatchObject({
      valueSI: null,
      unit: "J/m^3",
      status: "missing",
      provenance: {
        routeId: "adm_quasi_stationary_recovery_v1",
        chartId: "comoving_cartesian",
        source: "adm_projection",
      },
    });
    expect(component(artifact, "Txy")?.assumptions).toContain(
      "missing or blocked components are not zero-filled",
    );
  });

  it("reports a complete admitted Einstein-route tensor as derived in the same chart", () => {
    const artifact = buildNhm2SameChartFullTensorArtifact({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      metricFamily: "nhm2_shift_lapse",
      routeId: "einstein_tensor_geometry_fd4_v1",
      source: "einstein_tensor_geometry_fd4_v1",
      tensor: {
        T00: 1,
        T01: 2,
        T02: 3,
        T03: 4,
        T11: 5,
        T12: 6,
        T13: 7,
        T22: 8,
        T23: 9,
        T33: 10,
      },
      componentStatuses: {
        T00: "derived_same_chart",
        T0x: "derived_same_chart",
        T0y: "derived_same_chart",
        T0z: "derived_same_chart",
        Txx: "derived_same_chart",
        Txy: "derived_same_chart",
        Txz: "derived_same_chart",
        Tyy: "derived_same_chart",
        Tyz: "derived_same_chart",
        Tzz: "derived_same_chart",
      },
      adm: {
        alphaStatus: "computed",
        betaStatus: "computed",
        gammaStatus: "computed",
        extrinsicCurvatureStatus: "computed",
      },
    });

    expect(isNhm2SameChartFullTensorArtifact(artifact)).toBe(true);
    expect(artifact.completeness).toMatchObject({
      hasT00: true,
      hasT0i: true,
      hasDiagonalTij: true,
      hasOffDiagonalTij: true,
      fullTensorComplete: true,
      missingComponentIds: [],
    });
    expect(
      artifact.components.every(
        (entry) =>
          entry.status === "derived_same_chart" &&
          entry.provenance.source === "einstein_tensor_geometry_fd4_v1",
      ),
    ).toBe(true);
  });

  it("keeps finite but non-admitted same-chart channels out of completeness", () => {
    const artifact = buildNhm2SameChartFullTensorArtifact({
      generatedAt: "2026-06-09T00:00:00.000Z",
      chartId: "comoving_cartesian",
      routeId: "einstein_tensor_geometry_fd4_v1",
      source: "einstein_tensor_geometry_fd4_v1",
      tensor: {
        T00: 1,
        T01: 2,
        T02: 3,
        T03: 4,
        T11: 5,
        T12: 6,
        T13: 7,
        T22: 8,
        T23: 9,
        T33: 10,
      },
      componentStatuses: {
        T0x: "blocked",
      },
      componentBlockers: {
        T0x: ["metric_T0i_route_not_admitted"],
      },
    });

    expect(component(artifact, "T0x")).toMatchObject({
      valueSI: 2,
      status: "blocked",
      blockers: ["metric_T0i_route_not_admitted", "same_chart_T0i_not_computed"],
    });
    expect(artifact.completeness.hasT0i).toBe(false);
    expect(artifact.completeness.fullTensorComplete).toBe(false);
    expect(artifact.completeness.missingComponentIds).toContain("T0x");
    expect(isNhm2SameChartFullTensorArtifact(artifact)).toBe(true);
  });
});
