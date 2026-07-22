import { describe, expect, it } from "vitest";
import { convertLossTableToImaginaryAxis } from "../shared/casimir-optical-response";

const logGrid = (minimum: number, maximum: number, count: number) => {
  const low = Math.log(minimum);
  const step = (Math.log(maximum) - low) / (count - 1);
  return Array.from({ length: count }, (_, index) => Math.exp(low + step * index));
};

describe("Casimir optical-response Kramers-Kronig pipeline", () => {
  it("recovers the analytic imaginary-axis single-Lorentz response", () => {
    const strength = 4e32;
    const resonance = 1e16;
    const damping = 2e14;
    const omega = logGrid(1e10, 1e22, 12_001);
    const xi = logGrid(1e12, 1e20, 21);
    const result = convertLossTableToImaginaryAxis({
      receipt: {
        schema_version: "casimir_optical_response_receipt/1",
        material_id: "lorentz-test",
        label: "Lorentz test",
        evidence_class: "synthetic_fixture",
        source_ref: "test-fixture",
        raw_artifact_path: "memory://lorentz-test",
        expected_sha256: "a".repeat(64),
        actual_sha256: "a".repeat(64),
        calibration_refs: ["analytic-model"],
        points: omega.map((frequency) => {
          const loss = strength * damping * frequency /
            ((resonance ** 2 - frequency ** 2) ** 2 + (damping * frequency) ** 2);
          return {
            omega_rad_s: frequency,
            epsilon_imag: loss,
            standard_uncertainty: loss * 0.01,
          };
        }),
        required_coverage: { min_omega_rad_s: 1e10, max_omega_rad_s: 1e22 * (1 - 1e-12) },
        tails: { low_frequency_model: "Lorentz", high_frequency_model: "Lorentz" },
      },
      xi_rad_s: xi,
    });

    const maximumError = Math.max(...result.points.map((point) => {
      const analytic = 1 + strength / (resonance ** 2 + point.xi_rad_s ** 2 + damping * point.xi_rad_s);
      return Math.abs(point.epsilon - analytic) / analytic;
    }));
    expect(maximumError).toBeLessThan(2e-2);
    expect(result.gates.artifact_integrity).toBe("pass");
    expect(result.gates.spectral_coverage).toBe("pass");
    expect(result.gates.measured_material).toBe("not_ready");
    expect(result.material.evidence_class).toBe("design_assumption");
  });

  it("fails closed when a measured receipt has a hash mismatch", () => {
    const omega = logGrid(1e12, 1e18, 20);
    const result = convertLossTableToImaginaryAxis({
      receipt: {
        schema_version: "casimir_optical_response_receipt/1",
        material_id: "tampered",
        label: "Tampered measured table",
        evidence_class: "measured",
        source_ref: "instrument-run",
        raw_artifact_path: "memory://tampered",
        expected_sha256: "a".repeat(64),
        actual_sha256: "b".repeat(64),
        calibration_refs: ["calibration"],
        points: omega.map((frequency) => ({
          omega_rad_s: frequency,
          epsilon_imag: 1 / (1 + frequency / 1e15),
          standard_uncertainty: 0.01,
        })),
        required_coverage: { min_omega_rad_s: 1e12, max_omega_rad_s: 1e18 * (1 - 1e-12) },
        tails: { low_frequency_model: "registered", high_frequency_model: "registered" },
      },
      xi_rad_s: [1e13, 1e14],
    });
    expect(result.gates.artifact_integrity).toBe("not_ready");
    expect(result.gates.measured_material).toBe("not_ready");
    expect(result.material.evidence_class).not.toBe("measured");
  });
});

