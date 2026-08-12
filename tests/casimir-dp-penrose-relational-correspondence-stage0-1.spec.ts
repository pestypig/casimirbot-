import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateCasimirDpPenroseRelationalCorrespondenceStage01,
  PENROSE_RELATIONAL_CORRESPONDENCE_FIRST_FAILURE_ORDER,
  type PenroseRelationalCorrespondenceAuthorityIntegrity,
} from "../shared/casimir-dp-penrose-relational-correspondence-stage0-1";
import {
  CasimirDpPenroseRelationalCorrespondenceStage01Config,
  type CasimirDpPenroseRelationalCorrespondenceStage01Config as Stage01Config,
} from "../shared/contracts/casimir-dp-penrose-relational-correspondence-stage0-1.v1";

const configPath = path.resolve(
  process.cwd(),
  "configs/research/casimir-dp-penrose-relational-correspondence-stage0-1.v1.json",
);
const config = CasimirDpPenroseRelationalCorrespondenceStage01Config.parse(
  JSON.parse(readFileSync(configPath, "utf8")),
);

const sha256 = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

function authorities(
  input: Stage01Config,
): PenroseRelationalCorrespondenceAuthorityIntegrity[] {
  return input.upstream_authorities.map((authority) => {
    const base = {
      role: authority.role,
      path: authority.path,
      expected_sha256: authority.sha256,
      actual_sha256: sha256(readFileSync(authority.path)),
      gate: "pass" as const,
    };
    return authority.role === "stage0_candidate_receipt_authority"
      ? {
          ...base,
          semantic_candidate_status: "blocked" as const,
          semantic_first_failure_code:
            "PCT_BRANCH_CORRESPONDENCE_MISSING",
          semantic_nonpromotion_gate: "pass" as const,
        }
      : base;
  });
}

function cloneConfig(): Stage01Config {
  return structuredClone(config);
}

describe("Penrose relational correspondence Stage-0.1", () => {
  it("passes every synthetic fixture while remaining physically blocked", () => {
    const result = evaluateCasimirDpPenroseRelationalCorrespondenceStage01({
      config,
      authorityIntegrity: authorities(config),
    });

    expect(result.overall_status).toBe("blocked");
    expect(result.synthetic_benchmark_status).toBe("pass");
    expect(result.first_failure_code).toBe("PRC_REFERENCE_RECEIPTS_MISSING");
    expect(result.synthetic_first_failure_code).toBeNull();
    expect(result.physical_reference_authority).toEqual({
      ready_packets: 0,
      required_packets: 5,
      status: "not_ready",
    });
    expect(result.correspondence.primary_separation_m).toBeCloseTo(2.5e-7, 20);
    expect(result.correspondence.primary_map_jacobian_determinant).toBeCloseTo(1, 14);
    expect(result.correspondence.complete_density_support_covered).toBe(true);
    expect(result.weak_field_recovery.identity_E_G_J).toBe(0);
    expect(result.weak_field_recovery.branch_swap_relative_error).toBe(0);
    expect(result.weak_field_recovery.relative_error).toBeLessThanOrEqual(
      config.thresholds.weak_field_E_G_relative_max,
    );
    expect(result.weak_field_recovery.analytic_target_E_G_J).toBeCloseTo(
      1.2448783851964107e-35,
      12,
    );
    expect(result.gates.every((gate) => gate.status === "pass")).toBe(true);
    expect(result.proposed_collapse_rate_s).toBeNull();
    expect(result.proposed_lifetime_distribution).toBeNull();
    expect(result.proposed_coherence_prediction).toBeNull();
    expect(result.proposed_casimir_modifier).toBeNull();
    expect(result.model_comparison_admission).toBe(false);
    expect(result.empirically_validated).toBe(false);
    expect(result.stage0_candidate_first_failure_remains).toBe(
      "PCT_BRANCH_CORRESPONDENCE_MISSING",
    );
  });

  it("requires the exact content-addressed authority set", () => {
    const result = evaluateCasimirDpPenroseRelationalCorrespondenceStage01({
      config,
      authorityIntegrity: [],
    });
    expect(result.first_failure_code).toBe("PRC_AUTHORITY_INTEGRITY_FAILED");
    expect(result.synthetic_first_failure_code).toBe(
      "PRC_AUTHORITY_INTEGRITY_FAILED",
    );
  });

  it("rejects parent-receipt semantic drift even when the file hash row is present", () => {
    const driftedAuthorities = authorities(config);
    const parent = driftedAuthorities.find(
      (row) => row.role === "stage0_candidate_receipt_authority",
    );
    if (parent != null) parent.semantic_first_failure_code = "PCT_OTHER";
    const result = evaluateCasimirDpPenroseRelationalCorrespondenceStage01({
      config,
      authorityIntegrity: driftedAuthorities,
    });
    expect(result.synthetic_first_failure_code).toBe(
      "PRC_AUTHORITY_INTEGRITY_FAILED",
    );
  });

  it("rejects a degenerate landmark frame before map recovery", () => {
    const input = cloneConfig();
    input.primary_fixture.branch_a.y_axis_landmark_m =
      input.primary_fixture.branch_a.x_axis_landmark_m;
    const result = evaluateCasimirDpPenroseRelationalCorrespondenceStage01({
      config: input,
      authorityIntegrity: authorities(input),
    });
    expect(result.synthetic_first_failure_code).toBe(
      "PRC_REFERENCE_SUBSYSTEM_INVALID",
    );
    expect(result.synthetic_benchmark_status).toBe("not_ready");
  });

  it("blocks a local chart that does not cover both declared density supports", () => {
    const input = cloneConfig();
    input.primary_fixture.branch_a.domain_radius_m = 2e-7;
    const result = evaluateCasimirDpPenroseRelationalCorrespondenceStage01({
      config: input,
      authorityIntegrity: authorities(input),
    });
    expect(result.synthetic_first_failure_code).toBe(
      "PRC_DENSITY_SUPPORT_NOT_COVERED",
    );
  });

  it("rejects a skewed paired fiducial geometry instead of orthogonalizing it away", () => {
    const input = cloneConfig();
    input.primary_fixture.branch_b.y_axis_landmark_m = [
      3.660254037844386e-7,
      2e-6,
      -3e-7,
    ];
    const result = evaluateCasimirDpPenroseRelationalCorrespondenceStage01({
      config: input,
      authorityIntegrity: authorities(input),
    });
    expect(result.synthetic_first_failure_code).toBe(
      "PRC_REFERENCE_SUBSYSTEM_INVALID",
    );
  });

  it("blocks an alternate chart that does not cover the declared support proxy", () => {
    const input = cloneConfig();
    input.alternate_reference_fixture.branch_a.domain_radius_m = 1e-12;
    input.alternate_reference_fixture.branch_b.domain_radius_m = 1e-12;
    const result = evaluateCasimirDpPenroseRelationalCorrespondenceStage01({
      config: input,
      authorityIntegrity: authorities(input),
    });
    expect(result.synthetic_first_failure_code).toBe(
      "PRC_DENSITY_SUPPORT_NOT_COVERED",
    );
  });

  it("rejects a probe-centered alignment that erases the known branch displacement", () => {
    const input = cloneConfig();
    input.primary_fixture.branch_b_probe_center_coordinate_m = [
      -5e-7,
      1.375e-6,
      -3e-7,
    ];
    const result = evaluateCasimirDpPenroseRelationalCorrespondenceStage01({
      config: input,
      authorityIntegrity: authorities(input),
    });
    expect(result.synthetic_first_failure_code).toBe(
      "PRC_PHYSICAL_SENSITIVITY_FAILED",
    );
  });

  it("rejects excessive alternate-reference spread", () => {
    const input = cloneConfig();
    input.alternate_reference_fixture.branch_b_probe_center_coordinate_m = [
      -9e-7,
      -8.5e-7,
      2e-7,
    ];
    const result = evaluateCasimirDpPenroseRelationalCorrespondenceStage01({
      config: input,
      authorityIntegrity: authorities(input),
    });
    expect(result.synthetic_first_failure_code).toBe(
      "PRC_REFERENCE_CHOICE_SPREAD_EXCEEDED",
    );
  });

  it("freezes deterministic failure order and output nonpromotion", () => {
    expect(PENROSE_RELATIONAL_CORRESPONDENCE_FIRST_FAILURE_ORDER).toEqual([
      "PRC_AUTHORITY_INTEGRITY_FAILED",
      "PRC_IDENTITY_INVALID",
      "PRC_REFERENCE_RECEIPTS_MISSING",
      "PRC_REFERENCE_SUBSYSTEM_INVALID",
      "PRC_BRANCH_MAPS_MISSING",
      "PRC_DOMAIN_INVALID",
      "PRC_DENSITY_SUPPORT_NOT_COVERED",
      "PRC_JACOBIAN_DEGENERATE",
      "PRC_MAP_NOT_ONE_TO_ONE",
      "PRC_CAUSAL_ORDER_VIOLATION",
      "PRC_IDENTITY_RECOVERY_FAILED",
      "PRC_BRANCH_SWAP_RECOVERY_FAILED",
      "PRC_COORDINATE_RELABELING_FAILED",
      "PRC_PHYSICAL_SENSITIVITY_FAILED",
      "PRC_COMMON_ACCELERATION_NULL_FAILED",
      "PRC_ALTERNATE_REFERENCE_MAPS_MISSING",
      "PRC_REFERENCE_CHOICE_SPREAD_EXCEEDED",
      "PRC_WEAK_FIELD_EG_RECOVERY_FAILED",
      "PRC_OUTPUT_POLICY_VIOLATION",
    ]);

    const invalid = structuredClone(
      JSON.parse(readFileSync(configPath, "utf8")),
    );
    invalid.output_policy.collapse_rate = 1;
    invalid.physical_prediction_allowed = true;
    expect(
      CasimirDpPenroseRelationalCorrespondenceStage01Config.safeParse(invalid)
        .success,
    ).toBe(false);
  });
});
