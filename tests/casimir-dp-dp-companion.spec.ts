import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateCasimirDpDpCompanion,
  evaluateCasimirDpDpRegisteredPoint,
  sha256CasimirDpDpParameterManifest,
  type CasimirDpDpCompanionInput,
} from "../shared/casimir-dp-dp-companion";
import { HBAR } from "../shared/physics-const";

const fixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-stage3-dp-companion.synthetic.v1.json",
);
const fixture = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as CasimirDpDpCompanionInput;

const cloneFixture = (): CasimirDpDpCompanionInput =>
  JSON.parse(JSON.stringify(fixture)) as CasimirDpDpCompanionInput;

function rehash(input: CasimirDpDpCompanionInput): void {
  input.parameter_manifest_sha256 =
    sha256CasimirDpDpParameterManifest(input.parameter_manifest);
}

describe("Casimir-DP Stage-3 regularized dynamical-DP companion runtime", () => {
  it("replays the frozen named model and independently cross-checks E_G", () => {
    const result = evaluateCasimirDpDpCompanion(fixture);

    expect(result.status).toBe("diagnostic");
    expect(result.evidence_class).toBe("synthetic");
    expect(result.parameter_manifest_sha256).toBe(
      fixture.parameter_manifest_sha256,
    );
    expect(
      result.named_dynamical_dp.rows.every(
        (row) =>
          row.E_G_analytic_J >= 0 &&
          row.E_G_fourier_crosscheck_J >= 0 &&
          row.E_G_crosscheck_gate === "pass",
      ),
    ).toBe(true);
    expect(
      Math.max(
        ...result.named_dynamical_dp.rows.map(
          (row) => row.E_G_crosscheck_relative_error,
        ),
      ),
    ).toBeLessThan(1e-10);
    expect(result.penrose_or_heuristic.generative_master_equation_supplied)
      .toBe(false);
    expect(result.penrose_or_heuristic.claim_ceiling)
      .toBe("lifetime_compatibility_or_exclusion_only");
  });

  it("has the required zero-mass and zero-separation limits", () => {
    const result = evaluateCasimirDpDpCompanion(fixture);
    const zeroMassRows = result.named_dynamical_dp.rows.filter(
      (row) => row.mass_kg === 0,
    );
    expect(zeroMassRows.length).toBeGreaterThan(0);
    for (const row of zeroMassRows) {
      expect(row.E_G_analytic_J).toBe(0);
      expect(row.Gamma_DP_s).toBe(0);
      expect(row.tau_DP_s).toBeNull();
      expect(row.master_equation_D_pp_kg2_m2_s3).toBe(0);
      expect(row.heating_W).toBe(0);
    }

    const zeroSeparation = result.named_dynamical_dp.rows.find(
      (row) => row.mass_kg === 1e-17 && row.branch_separation_m === 0,
    )!;
    expect(zeroSeparation.E_G_analytic_J).toBe(0);
    expect(zeroSeparation.Gamma_DP_s).toBe(0);
    expect(
      zeroSeparation.coherence.every(
        (sample) => sample.visibility_ratio === 1,
      ),
    ).toBe(true);
    expect(zeroSeparation.master_equation_D_pp_kg2_m2_s3).toBeGreaterThan(0);
    expect(zeroSeparation.heating_W).toBeGreaterThan(0);
  });

  it("approaches the registered Gaussian large-separation saturation", () => {
    const result = evaluateCasimirDpDpCompanion(fixture);
    const row = result.named_dynamical_dp.rows.find(
      (candidate) =>
        candidate.mass_kg === 2e-17 &&
        candidate.branch_separation_m === 1e-5,
    )!;

    expect(row.saturation_fraction).toBeGreaterThan(0.98);
    expect(row.saturation_fraction).toBeLessThanOrEqual(1);
    expect(row.E_G_analytic_J).toBeLessThanOrEqual(row.saturation_E_G_J);
  });

  it("keeps numerical softening separate from the physical DP cutoff", () => {
    const baseline = evaluateCasimirDpDpCompanion(fixture);
    const changed = cloneFixture();
    changed.parameter_manifest.numerical_regularization.softening_m = 5e-9;
    rehash(changed);
    const replay = evaluateCasimirDpDpCompanion(changed);

    expect(baseline.parameter_roles.roles_are_distinct).toBe(true);
    expect(baseline.parameter_roles.physical_cutoff.enters_DP_dynamics)
      .toBe(true);
    expect(baseline.parameter_roles.numerical_softening.enters_DP_dynamics)
      .toBe(false);
    expect(
      replay.named_dynamical_dp.rows.map((row) => ({
        E_G_J: row.E_G_analytic_J,
        rate_s: row.Gamma_DP_s,
        diffusion: row.master_equation_D_pp_kg2_m2_s3,
        heating_W: row.heating_W,
      })),
    ).toEqual(
      baseline.named_dynamical_dp.rows.map((row) => ({
        E_G_J: row.E_G_analytic_J,
        rate_s: row.Gamma_DP_s,
        diffusion: row.master_equation_D_pp_kg2_m2_s3,
        heating_W: row.heating_W,
      })),
    );
    expect(replay.parameter_manifest_sha256).not.toBe(
      baseline.parameter_manifest_sha256,
    );
  });

  it("uses the same immutable parameter hash for every companion channel", () => {
    const result = evaluateCasimirDpDpCompanion(fixture);
    const hashes = new Set([
      result.parameter_manifest_sha256,
      result.penrose_or_heuristic.parameter_manifest_sha256,
      result.named_dynamical_dp.parameter_manifest_sha256,
      result.named_dynamical_dp.radiation.parameter_manifest_sha256,
      ...result.named_dynamical_dp.rows.map(
        (row) => row.parameter_manifest_sha256,
      ),
      ...result.named_dynamical_dp.external_bound_comparisons.map(
        (comparison) => comparison.parameter_manifest_sha256,
      ),
    ]);
    expect(hashes).toEqual(new Set([fixture.parameter_manifest_sha256]));

    const tampered = cloneFixture();
    tampered.parameter_manifest.physical_regularization.R0_m *= 2;
    expect(() => evaluateCasimirDpDpCompanion(tampered))
      .toThrow(/parameter_manifest_hash_mismatch/);
  });

  it("enforces the fixed-delta-rho boundary null without inventing a bridge", () => {
    const result = evaluateCasimirDpDpCompanion(fixture);
    expect(result.fixed_branch_boundary_null.gate).toBe("pass");
    expect(result.fixed_branch_boundary_null.rate_difference_s).toBe(0);
    expect(result.fixed_branch_boundary_null.bridge_inferred).toBe(false);

    const changedBranch = cloneFixture();
    changedBranch.fixed_branch_boundary_cells[1].delta_rho_receipt_sha256 =
      "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
    const notFixed = evaluateCasimirDpDpCompanion(changedBranch);
    expect(notFixed.status).toBe("not_ready");
    expect(notFixed.fixed_branch_boundary_null.gate).toBe("not_ready");
    expect(notFixed.fixed_branch_boundary_null.rate_difference_s).toBeNull();
  });

  it("exercises a companion-bound exclusion without promoting synthetic evidence", () => {
    const result = evaluateCasimirDpDpCompanion(fixture);
    const bound = result.named_dynamical_dp.external_bound_comparisons[0];

    expect(bound.comparison).toBe("exceeds");
    expect(bound.ratio_to_upper_limit).toBeGreaterThan(1);
    expect(result.named_dynamical_dp.parameter_region_comparison)
      .toBe("not_ready_synthetic_only");
    expect(result.maximum_claim).toBe("software_validation_only");
    expect(result.measured_evidence_gate).toBe("not_ready");
    expect(result.collapse_identification).toBe("blocked");
    expect(result.manifold_dynamics).toBe("blocked");
  });

  it("blocks radiation when the apparatus mapping is absent", () => {
    const result = evaluateCasimirDpDpCompanion(fixture);
    expect(result.named_dynamical_dp.radiation.status).toBe("blocked");
    expect(result.named_dynamical_dp.radiation.predicted_spectrum).toBeNull();
    expect(result.named_dynamical_dp.radiation.analysis_band_Hz).toBeNull();
    expect(result.named_dynamical_dp.radiation.missing_fields).toContain(
      "charged_constituent_composition",
    );
  });

  it("preserves source-backed mass scaling and nonnegative diffusion", () => {
    const result = evaluateCasimirDpDpCompanion(fixture);
    const rowFor = (mass: number) =>
      result.named_dynamical_dp.rows.find(
        (row) =>
          row.mass_kg === mass && row.branch_separation_m === 1e-7,
      )!;
    const light = rowFor(1e-17);
    const heavy = rowFor(2e-17);

    expect(heavy.E_G_analytic_J / light.E_G_analytic_J).toBeCloseTo(4, 12);
    expect(
      heavy.master_equation_D_pp_kg2_m2_s3 /
      light.master_equation_D_pp_kg2_m2_s3,
    ).toBeCloseTo(4, 12);
    expect(heavy.heating_W / light.heating_W).toBeCloseTo(2, 12);
    expect(
      result.named_dynamical_dp.rows.every(
        (row) =>
          row.Gamma_DP_s >= 0 &&
          row.master_equation_D_pp_kg2_m2_s3 >= 0,
      ),
    ).toBe(true);
  });

  it("evaluates an off-grid campaign point without mutating the frozen manifest", () => {
    const point = evaluateCasimirDpDpRegisteredPoint({
      mass_kg: 3.8877e-18,
      branch_separation_m: 2e-8,
      parameter_manifest: fixture.parameter_manifest,
      parameter_manifest_sha256: fixture.parameter_manifest_sha256,
    });

    expect(point.mass_kg).toBe(3.8877e-18);
    expect(point.branch_separation_m).toBe(2e-8);
    expect(point.Gamma_DP_s).toBe(point.E_G_analytic_J / HBAR);
    expect(point.E_G_crosscheck_gate).toBe("pass");
    expect(point.parameter_manifest_sha256).toBe(
      fixture.parameter_manifest_sha256,
    );

    const tampered = cloneFixture();
    tampered.parameter_manifest.physical_regularization.R0_m *= 2;
    expect(() => evaluateCasimirDpDpRegisteredPoint({
      mass_kg: 3.8877e-18,
      branch_separation_m: 2e-8,
      parameter_manifest: tampered.parameter_manifest,
      parameter_manifest_sha256: fixture.parameter_manifest_sha256,
    })).toThrow(/parameter_manifest_hash_mismatch/);
  });

  it("rejects non-finite physical and scan parameters before evaluation", () => {
    const invalidCutoff = cloneFixture();
    invalidCutoff.parameter_manifest.physical_regularization.R0_m =
      Number.POSITIVE_INFINITY;
    expect(() => evaluateCasimirDpDpCompanion(invalidCutoff))
      .toThrow(/finite/i);

    const invalidHoldTime = cloneFixture();
    invalidHoldTime.parameter_manifest.scan.hold_times_s[0] =
      Number.POSITIVE_INFINITY;
    expect(() => evaluateCasimirDpDpCompanion(invalidHoldTime))
      .toThrow(/finite/i);
  });
});
