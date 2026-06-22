import { describe, expect, it } from "vitest";
import {
  buildNhm2ExperimentResearchGapLedger,
  isNhm2ExperimentResearchGapLedger,
} from "../shared/contracts/nhm2-experiment-research-gap-ledger.v1";
import { buildNhm2ExperimentParameterTargets } from "../shared/contracts/nhm2-experiment-parameter-targets.v1";

describe("NHM2 experiment research gap ledger", () => {
  const generatedAt = "2026-06-21T00:00:00.000Z";

  it("builds and validates a diagnostic research-gap ledger", () => {
    const ledger = buildNhm2ExperimentResearchGapLedger({ generatedAt });

    expect(isNhm2ExperimentResearchGapLedger(ledger)).toBe(true);
    expect(ledger.contractVersion).toBe("nhm2_experiment_research_gap_ledger/v1");
    expect(ledger.generatedAt).toBe(generatedAt);
    expect(ledger.claimBoundary.diagnosticOnly).toBe(true);
    expect(ledger.claimBoundary.literaturePrecedentsAreContextNotValidation).toBe(true);
    expect(ledger.claimBoundary.noDirectPrecedentIsNotNoveltyClaim).toBe(true);
    expect(ledger.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
    expect(ledger.claimBoundary.transportClaimAllowed).toBe(false);
  });

  it("maps every parameter target to a research gap row", () => {
    const targets = buildNhm2ExperimentParameterTargets({ generatedAt });
    const ledger = buildNhm2ExperimentResearchGapLedger({ generatedAt });

    expect(new Set(ledger.rows.map((row) => row.targetId))).toEqual(
      new Set(targets.rows.map((row) => row.parameterId)),
    );
    expect(ledger.summary.mappedTargetCount).toBe(targets.rows.length);
  });

  it("contains the P0 rows for the current high-leverage campaign questions", () => {
    const ledger = buildNhm2ExperimentResearchGapLedger({ generatedAt });
    const p0Rows = ledger.rows.filter((row) => row.priority === "P0");
    const p0Ids = p0Rows.map((row) => row.targetId);

    expect(p0Ids).toContain("full_apparatus_tensor.required_components");
    expect(p0Ids).toContain("array_scaling.layer_count");
    expect(p0Ids).toContain("metric_response.weak_field_h00_proxy");
    expect(p0Ids).toContain("qei_observer_admissibility.worldline_and_observer_receipts");
    expect(JSON.stringify(p0Rows)).toMatch(/observer-robust|WarpAX|observer/i);
  });

  it("uses independent precedents without absolute-absence wording", () => {
    const ledger = buildNhm2ExperimentResearchGapLedger({ generatedAt });
    const text = JSON.stringify(ledger);
    const citationIds = new Set(
      ledger.rows.flatMap((row) => row.nearestPrecedents.map((precedent) => precedent.citationId)),
    );

    expect(text).not.toMatch(new RegExp(["never", "done"].join("\\s+"), "i"));
    expect(ledger.summary.noDirectPrecedentTargetIds).toContain(
      "full_apparatus_tensor.required_components",
    );
    expect([...citationIds]).toEqual(
      expect.arrayContaining([
        "arxiv_1401_0784_regularized_casimir_gravity",
        "arxiv_1505_04169_conductive_plane_stack_casimir",
        "epjconf_2025_archimedes_vacuum_gravity",
        "physrevd_93_112004_advanced_ligo_sensitivity",
        "arxiv_2301_01698_stationary_worldline_qei",
        "arxiv_2602_18023_warpax_observer_robust",
        "arxiv_2105_03079_generic_warp_nec",
      ]),
    );
  });

  it("requires null-result meaning for each high-information row", () => {
    const ledger = buildNhm2ExperimentResearchGapLedger({ generatedAt });
    const highInformationRows = ledger.rows.filter(
      (row) => row.expectedInformationGain === "high",
    );

    expect(highInformationRows.length).toBeGreaterThanOrEqual(5);
    for (const row of highInformationRows) {
      expect(row.earliestFalsifier.trim().length).toBeGreaterThan(24);
      expect(row.nullResultMeaning.trim().length).toBeGreaterThan(24);
      expect(row.claimBoundary.nullResultsAreFalsificationEvidence).toBe(true);
    }
  });

  it("does not let claim impacts unlock physical viability or transport claims", () => {
    const ledger = buildNhm2ExperimentResearchGapLedger({ generatedAt });

    expect(
      ledger.rows.some((row) => row.claimImpact.physicalViability === "decisive"),
    ).toBe(true);
    expect(
      ledger.rows.some((row) => row.claimImpact.transport === "necessary"),
    ).toBe(true);

    for (const row of ledger.rows) {
      expect(row.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
      expect(row.claimBoundary.transportClaimAllowed).toBe(false);
      expect(row.claimBoundary.routeEtaClaimAllowed).toBe(false);
      expect(row.claimBoundary.propulsionClaimAllowed).toBe(false);
      expect(row.claimBoundary.speedAuthorityClaimAllowed).toBe(false);
    }
    expect(ledger.summary.physicalViabilityClaimAllowed).toBe(false);
    expect(ledger.summary.transportClaimAllowed).toBe(false);
  });
});
