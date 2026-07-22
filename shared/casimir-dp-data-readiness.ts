// math-stage: diagnostic
import { z } from "zod";

const SHA256 = /^[a-f0-9]{64}$/;

export const AcquisitionDatum = z.object({
  value: z.number(),
  standard_uncertainty: z.number().nonnegative(),
  unit: z.string().min(1),
});

export const AcquisitionSidecarArtifact = z.object({
  schema_version: z.literal("casimir_dp_acquisition_sidecar/1"),
  sidecar_id: z.string().min(1),
  candidate_id: z.string().min(1),
  evidence_class: z.enum(["measured", "literature_anchored", "synthetic_fixture"]),
  acquisition_window_s: z.number().positive(),
  blinded_boundary_label: z.string().min(1),
  calibration_refs: z.array(z.string().min(1)),
  observable_order: z.array(z.string().min(1)).min(2),
  observables: z.record(z.string(), AcquisitionDatum),
  covariance: z.array(z.array(z.number())),
});

export type AcquisitionSidecarArtifact = z.infer<typeof AcquisitionSidecarArtifact>;

function covarianceStatus(matrix: number[][], expectedStandardUncertainties: number[]): {
  dimensions: "pass" | "not_ready";
  symmetric: "pass" | "not_ready";
  diagonal_consistency: "pass" | "not_ready";
  positive_semidefinite: "pass" | "not_ready";
} {
  const dimension = expectedStandardUncertainties.length;
  const dimensions = matrix.length === dimension && matrix.every((row) => row.length === dimension);
  if (!dimensions) {
    return {
      dimensions: "not_ready",
      symmetric: "not_ready",
      diagonal_consistency: "not_ready",
      positive_semidefinite: "not_ready",
    };
  }
  const diagonalConsistency = matrix.every((row, index) => {
    const expectedVariance = expectedStandardUncertainties[index] ** 2;
    const scale = Math.max(expectedVariance, Number.MIN_VALUE);
    return row[index] >= 0 && Math.abs(row[index] - expectedVariance) <= 1e-8 * scale;
  });
  const normalized = matrix.map((row, rowIndex) => row.map((value, columnIndex) => {
    const scale = Math.sqrt(Math.max(0, matrix[rowIndex][rowIndex] * matrix[columnIndex][columnIndex]));
    if (scale === 0) return value === 0 ? 0 : Number.NaN;
    return value / scale;
  }));
  const tolerance = 1e-12;
  let symmetric = true;
  for (let row = 0; row < dimension; row += 1) {
    for (let column = 0; column < dimension; column += 1) {
      if (!Number.isFinite(normalized[row][column]) ||
        Math.abs(normalized[row][column] - normalized[column][row]) > tolerance) symmetric = false;
    }
  }
  if (!symmetric) {
    return {
      dimensions: "pass",
      symmetric: "not_ready",
      diagonal_consistency: diagonalConsistency ? "pass" : "not_ready",
      positive_semidefinite: "not_ready",
    };
  }

  // Tolerant Cholesky factorization. Zero pivots are allowed for semidefinite matrices.
  const lower = Array.from({ length: dimension }, () => new Array<number>(dimension).fill(0));
  let psd = true;
  for (let row = 0; row < dimension; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let residual = normalized[row][column];
      for (let inner = 0; inner < column; inner += 1) {
        residual -= lower[row][inner] * lower[column][inner];
      }
      if (row === column) {
        if (residual < -tolerance) psd = false;
        lower[row][column] = Math.sqrt(Math.max(0, residual));
      } else if (lower[column][column] > tolerance) {
        lower[row][column] = residual / lower[column][column];
      } else if (Math.abs(residual) > tolerance) {
        psd = false;
      }
    }
  }
  return {
    dimensions: "pass",
    symmetric: "pass",
    diagonal_consistency: diagonalConsistency ? "pass" : "not_ready",
    positive_semidefinite: psd ? "pass" : "not_ready",
  };
}

export function validateAcquisitionSidecar(args: {
  artifact: AcquisitionSidecarArtifact;
  expected_sha256: string;
  actual_sha256: string;
}) {
  const artifact = AcquisitionSidecarArtifact.parse(args.artifact);
  if (!SHA256.test(args.expected_sha256) || !SHA256.test(args.actual_sha256)) {
    throw new Error("Sidecar hashes must be lowercase SHA-256 values.");
  }
  const observableKeysMatch =
    artifact.observable_order.length === Object.keys(artifact.observables).length &&
    artifact.observable_order.every((id) => artifact.observables[id] != null);
  const covariance = covarianceStatus(
    artifact.covariance,
    artifact.observable_order.map((id) => artifact.observables[id]?.standard_uncertainty ?? Number.NaN),
  );
  const artifactIntegrity = args.expected_sha256 === args.actual_sha256;
  const calibration = artifact.calibration_refs.length > 0;
  const covariancePass = Object.values(covariance).every((status) => status === "pass");
  const structuralPass = observableKeysMatch && artifactIntegrity && calibration && covariancePass;
  const measuredReady = structuralPass && artifact.evidence_class === "measured";
  return {
    schema_version: "casimir_dp_sidecar_validation/1" as const,
    sidecar_id: artifact.sidecar_id,
    evidence_class: artifact.evidence_class,
    gates: {
      artifact_integrity: artifactIntegrity ? "pass" as const : "not_ready" as const,
      calibration: calibration ? "pass" as const : "not_ready" as const,
      observable_identity: observableKeysMatch ? "pass" as const : "not_ready" as const,
      covariance,
      measured_evidence: measuredReady ? "pass" as const : "not_ready" as const,
    },
    structurally_runnable: structuralPass,
    promotion_allowed: false,
    blockers: measuredReady
      ? ["collapse_dynamics_signature_not_registered"]
      : ["authentic_measured_acquisition_sidecar_not_supplied", "collapse_dynamics_signature_not_registered"],
  };
}

export const CorrelationPowerInput = z.object({
  schema_version: z.literal("casimir_dp_correlation_power/1"),
  null_correlation: z.number().gt(-0.999).lt(0.999),
  alternative_correlation: z.number().gt(-0.999).lt(0.999),
  type_i_error: z.number().gt(0).lt(0.5),
  target_power: z.number().gt(0.5).lt(1),
  multiplicity: z.number().int().positive().default(1),
});

// Peter J. Acklam rational approximation for design-level normal quantiles.
function inverseStandardNormal(probability: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  if (probability < low) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (probability > 1 - low) {
    const q = Math.sqrt(-2 * Math.log(1 - probability));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = probability - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function estimateCorrelationPower(rawInput: z.infer<typeof CorrelationPowerInput>) {
  const input = CorrelationPowerInput.parse(rawInput);
  const adjustedAlpha = input.type_i_error / input.multiplicity;
  const zAlpha = inverseStandardNormal(1 - adjustedAlpha / 2);
  const zPower = inverseStandardNormal(input.target_power);
  const fisherDifference = Math.abs(
    Math.atanh(input.alternative_correlation) - Math.atanh(input.null_correlation),
  );
  if (fisherDifference === 0) throw new Error("Null and alternative correlations must differ.");
  const pairedWindows = Math.ceil(3 + ((zAlpha + zPower) / fisherDifference) ** 2);
  return {
    schema_version: "casimir_dp_correlation_power_result/1" as const,
    paired_windows: pairedWindows,
    adjusted_type_i_error: adjustedAlpha,
    fisher_z_difference: fisherDifference,
    status: "diagnostic_only" as const,
    claim_boundary: [
      "Fisher-z power assumes independent approximately bivariate-normal paired windows.",
      "A switching cross-correlation can identify contamination or coupling; it cannot identify objective collapse by itself.",
      "A DP-specific secondary-observable signature remains source-gated.",
    ],
  };
}
