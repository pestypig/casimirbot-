import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_STAGE4_2C_REQUIRED_CONTROL_AXES,
  CASIMIR_DP_STAGE4_2C_REQUIRED_FIXTURE_CASE_IDS,
  CASIMIR_DP_STAGE4_2C_RUN_ORDER,
  CasimirDpIdentifiabilityRedesignStage4_2CConfig,
  CasimirDpStage4_2CSyntheticFixture,
} from "../shared/contracts/casimir-dp-identifiability-redesign-stage4-2c.v1";

const configPath =
  "configs/research/casimir-dp-identifiability-redesign-stage4-2c.v1.json";
const fixturePath =
  "configs/research/fixtures/casimir-dp-stage4-2c-campaign.synthetic.v1.json";

function load(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sha256(path: string): string {
  return createHash("sha256")
    .update(readFileSync(path))
    .digest("hex");
}

describe("Casimir-DP Stage-4.2C strict campaign contract", () => {
  it("parses the frozen config and fixture in exact order", () => {
    const config =
      CasimirDpIdentifiabilityRedesignStage4_2CConfig.parse(
        load(configPath),
      );
    const fixture = CasimirDpStage4_2CSyntheticFixture.parse(
      load(fixturePath),
    );
    expect(config.run_order).toEqual(CASIMIR_DP_STAGE4_2C_RUN_ORDER);
    expect(config.control_response_authority.control_axes.map(
      (axis) => axis.axis_id,
    )).toEqual(CASIMIR_DP_STAGE4_2C_REQUIRED_CONTROL_AXES);
    expect(fixture.cases.map((row) => row.case_id)).toEqual(
      CASIMIR_DP_STAGE4_2C_REQUIRED_FIXTURE_CASE_IDS,
    );
    expect(config.fixture.sha256).toBe(sha256(fixturePath));
  });

  it("binds every immutable Stage-4.2B authority tuple", () => {
    const config =
      CasimirDpIdentifiabilityRedesignStage4_2CConfig.parse(
        load(configPath),
      );
    const manifest = load(config.authority_manifest.path);
    expect(sha256(config.authority_manifest.path)).toBe(
      config.authority_manifest.sha256,
    );
    expect(config.upstream_authorities).toEqual(
      manifest.upstream_authorities,
    );
    for (const authority of config.upstream_authorities) {
      expect(sha256(authority.path), authority.role).toBe(
        authority.sha256,
      );
    }
  });

  it("freezes the numerical gates and scientific non-bridges", () => {
    const config =
      CasimirDpIdentifiabilityRedesignStage4_2CConfig.parse(
        load(configPath),
      );
    expect(config.thresholds).toMatchObject({
      maximum_abs_whitened_signature_cosine: 0.97,
      augmented_design_condition_number_max: 100,
      minimum_power: 0.8,
      maximum_false_positive_rate: 0.05,
      minimum_companion_snr: 5,
    });
    expect(config.hypothesis_policy.transfer_kernel_registered).toBe(
      false,
    );
    expect(
      config.hypothesis_policy
        .compton_higgs_qed_blackbody_as_transfer_kernel,
    ).toBe(false);
    expect(config.observable_bridge_edges_allowed).toBe(false);
    expect(config.promotion_allowed).toBe(false);
  });

  it("keeps every synthetic scientific status below measurement", () => {
    const config =
      CasimirDpIdentifiabilityRedesignStage4_2CConfig.parse(
        load(configPath),
      );
    expect(config.final_status_policy).toMatchObject({
      physical_pilot_readiness: "not_ready",
      measured_evidence: "not_ready",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      physical_viability: "not_evaluated",
    });
    expect(
      config.control_response_authority.values_are_measured,
    ).toBe(false);
    expect(
      config.apparatus_search.candidates.every(
        (candidate) =>
          candidate.state_preparation_evidence_class ===
            "design_assumption" &&
          !candidate.authentic_state_preparation_receipt_available,
      ),
    ).toBe(true);
  });
});
