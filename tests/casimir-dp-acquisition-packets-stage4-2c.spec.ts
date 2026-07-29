import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CasimirDpIdentifiabilityRedesignStage4_2CConfig,
} from "../shared/contracts/casimir-dp-identifiability-redesign-stage4-2c.v1";
import {
  generateCasimirDpAcquisitionPacketsStage4_2C,
} from "../shared/casimir-dp-acquisition-packets-stage4-2c";

const config =
  CasimirDpIdentifiabilityRedesignStage4_2CConfig.parse(
    JSON.parse(
      readFileSync(
        "configs/research/casimir-dp-identifiability-redesign-stage4-2c.v1.json",
        "utf8",
      ),
    ),
  );
const stage4_2B = JSON.parse(
  readFileSync(
    "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-report.json",
    "utf8",
  ),
);
const selectedCandidate = config.apparatus_search.candidates.find(
  (candidate) =>
    candidate.candidate_id === "silica_high_mass_identifiable",
)!;
const fakeHash = "a".repeat(64);

function input(confirmatoryDataAvailable = false, freezeCompleted = true) {
  return {
    schema_version:
      "casimir_dp_acquisition_packets_stage4_2c/1" as const,
    evidence_class: "synthetic_fixture" as const,
    selected_candidate: selectedCandidate,
    selected_candidate_receipt_sha256: fakeHash,
    control_response_receipt_sha256: fakeHash,
    control_covariance_receipt_sha256: fakeHash,
    stage4_2b_report_sha256:
      config.immutable_stage4_2b.campaign_report_sha256,
    baseline_primary_cell_ids:
      stage4_2B.runtime_outputs.D.named_dp_prediction.rows.map(
        (row: { cell_id: string }) => row.cell_id,
      ),
    control_cell_ids:
      stage4_2B.coupling_adapters.design_registry.control_cells.map(
        (row: { cell_id: string }) => row.cell_id,
      ),
    required_paired_windows: 542,
    packet_policy: {
      ...config.packet_policy,
      confirmatory_data_available: confirmatoryDataAvailable,
    },
    freeze_completed: freezeCompleted,
    custodian_authorization_present: false as const,
  };
}

describe("Casimir-DP Stage-4.2C acquisition packet compiler", () => {
  it("generates four ordered blinded packet schemas", () => {
    const result =
      generateCasimirDpAcquisitionPacketsStage4_2C(input());
    expect(result.gate).toBe("pass");
    expect(result.packets.map((packet) => packet.partition_id)).toEqual([
      "calibration",
      "pilot",
      "confirmatory",
      "independent_replication",
    ]);
    expect(
      result.packets.every(
        (packet) =>
          packet.blind_boundary_labels_required &&
          !packet.automatic_unblinding_allowed &&
          !packet.data_available,
      ),
    ).toBe(true);
  });

  it("forbids response and covariance refitting in held-out packets", () => {
    const result =
      generateCasimirDpAcquisitionPacketsStage4_2C(input());
    const heldOut = result.packets.filter((packet) =>
      ["confirmatory", "independent_replication"].includes(
        packet.partition_id,
      )
    );
    expect(
      heldOut.every(
        (packet) =>
          !packet.response_fitting_allowed &&
          !packet.covariance_fitting_allowed &&
          !packet.candidate_selection_allowed,
      ),
    ).toBe(true);
  });

  it("fails closed on confirmatory ingestion before freeze", () => {
    const result =
      generateCasimirDpAcquisitionPacketsStage4_2C(
        input(true, false),
      );
    expect(result.gate).toBe("blocked");
    expect(result.status).toBe(
      "confirmatory_ingestion_before_freeze_rejected",
    );
  });

  it("keeps every generated packet at not-ready evidence", () => {
    const result =
      generateCasimirDpAcquisitionPacketsStage4_2C(input());
    expect(result.physical_pilot_readiness).toBe("not_ready");
    expect(result.measured_evidence).toBe("not_ready");
    expect(
      result.packets.every(
        (packet) => packet.measured_evidence === "not_ready",
      ),
    ).toBe(true);
  });
});
