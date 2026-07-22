// math-stage: reduced-order
import { z } from "zod";
import type { LifshitzMaterial } from "./casimir-lifshitz";

const SHA256 = /^[a-f0-9]{64}$/;

export const OpticalLossPoint = z.object({
  omega_rad_s: z.number().positive(),
  epsilon_imag: z.number().nonnegative(),
  standard_uncertainty: z.number().nonnegative().nullable().default(null),
});

export const OpticalResponseReceipt = z.object({
  schema_version: z.literal("casimir_optical_response_receipt/1"),
  material_id: z.string().min(1),
  label: z.string().min(1),
  evidence_class: z.enum(["measured", "literature_anchored", "synthetic_fixture"]),
  source_ref: z.string().min(1),
  raw_artifact_path: z.string().min(1),
  expected_sha256: z.string().regex(SHA256),
  actual_sha256: z.string().regex(SHA256),
  calibration_refs: z.array(z.string().min(1)),
  points: z.array(OpticalLossPoint).min(8),
  required_coverage: z.object({
    min_omega_rad_s: z.number().positive(),
    max_omega_rad_s: z.number().positive(),
  }),
  tails: z.object({
    low_frequency_model: z.string().min(1).nullable(),
    high_frequency_model: z.string().min(1).nullable(),
  }),
}).superRefine((receipt, context) => {
  for (let index = 1; index < receipt.points.length; index += 1) {
    if (receipt.points[index].omega_rad_s <= receipt.points[index - 1].omega_rad_s) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["points", index, "omega_rad_s"],
        message: "Real-axis angular frequencies must be strictly increasing.",
      });
    }
  }
  if (receipt.required_coverage.max_omega_rad_s <= receipt.required_coverage.min_omega_rad_s) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["required_coverage", "max_omega_rad_s"],
      message: "Coverage maximum must exceed coverage minimum.",
    });
  }
});

export type OpticalResponseReceipt = z.infer<typeof OpticalResponseReceipt>;

export type KramersKronigResult = {
  schema_version: "casimir_kramers_kronig_result/1";
  material: LifshitzMaterial;
  points: Array<{
    xi_rad_s: number;
    epsilon: number;
    standard_uncertainty: number | null;
  }>;
  static_epsilon: number;
  gates: {
    artifact_integrity: "pass" | "not_ready";
    spectral_coverage: "pass" | "not_ready";
    tail_registration: "pass" | "not_ready";
    calibration: "pass" | "not_ready";
    uncertainty: "diagonal_propagated" | "not_ready";
    measured_material: "pass" | "not_ready";
  };
  claim_boundary: string[];
};

function trapezoidWeights(x: readonly number[]): number[] {
  const weights = new Array<number>(x.length).fill(0);
  for (let index = 0; index < x.length - 1; index += 1) {
    const width = x[index + 1] - x[index];
    weights[index] += width / 2;
    weights[index + 1] += width / 2;
  }
  return weights;
}

/**
 * Converts a passive real-axis loss table to epsilon(i xi):
 * epsilon(i xi) = 1 + (2/pi) integral_0^infinity omega epsilon''(omega)/(omega^2+xi^2) d omega.
 * The integral is evaluated only over the registered table. Tail models are evidence gates,
 * not silently evaluated extrapolations.
 */
export function convertLossTableToImaginaryAxis(args: {
  receipt: OpticalResponseReceipt;
  xi_rad_s: number[];
}): KramersKronigResult {
  const receipt = OpticalResponseReceipt.parse(args.receipt);
  if (args.xi_rad_s.length < 2 || args.xi_rad_s.some((value) => value <= 0)) {
    throw new Error("At least two positive imaginary-axis frequencies are required.");
  }
  for (let index = 1; index < args.xi_rad_s.length; index += 1) {
    if (args.xi_rad_s[index] <= args.xi_rad_s[index - 1]) {
      throw new Error("Imaginary-axis frequencies must be strictly increasing.");
    }
  }

  const omega = receipt.points.map((point) => point.omega_rad_s);
  const integrationWeights = trapezoidWeights(omega);
  const prefactor = 2 / Math.PI;
  const evaluate = (xi: number) => {
    let integral = 0;
    let variance = 0;
    let allUncertaintiesPresent = true;
    for (let index = 0; index < receipt.points.length; index += 1) {
      const point = receipt.points[index];
      const kernelWeight =
        prefactor * integrationWeights[index] * point.omega_rad_s /
        (point.omega_rad_s ** 2 + xi ** 2);
      integral += kernelWeight * point.epsilon_imag;
      if (point.standard_uncertainty == null) {
        allUncertaintiesPresent = false;
      } else {
        variance += (kernelWeight * point.standard_uncertainty) ** 2;
      }
    }
    return {
      epsilon: 1 + integral,
      standard_uncertainty: allUncertaintiesPresent ? Math.sqrt(variance) : null,
    };
  };

  const staticResponse = evaluate(0);
  const points = args.xi_rad_s.map((xi) => ({ xi_rad_s: xi, ...evaluate(xi) }));
  const artifactIntegrity = receipt.expected_sha256 === receipt.actual_sha256;
  const spectralCoverage =
    omega[0] <= receipt.required_coverage.min_omega_rad_s * (1 + 1e-12) &&
    omega[omega.length - 1] >= receipt.required_coverage.max_omega_rad_s * (1 - 1e-12);
  const tailRegistration =
    receipt.tails.low_frequency_model != null && receipt.tails.high_frequency_model != null;
  const calibration = receipt.calibration_refs.length > 0;
  const uncertaintyReady = receipt.points.every((point) => point.standard_uncertainty != null);
  const measuredReady =
    receipt.evidence_class === "measured" &&
    artifactIntegrity && spectralCoverage && tailRegistration && calibration && uncertaintyReady;

  const materialEvidenceClass = receipt.evidence_class === "measured" && measuredReady
    ? "measured" as const
    : receipt.evidence_class === "synthetic_fixture"
      ? "design_assumption" as const
      : "literature_anchored" as const;

  return {
    schema_version: "casimir_kramers_kronig_result/1",
    points,
    static_epsilon: staticResponse.epsilon,
    material: {
      kind: "tabulated_imaginary_axis",
      label: receipt.label,
      evidence_class: materialEvidenceClass,
      source_ref: receipt.source_ref,
      artifact_sha256: measuredReady ? receipt.actual_sha256 : null,
      static_epsilon: staticResponse.epsilon,
      points: points.map(({ xi_rad_s, epsilon }) => ({ xi_rad_s, epsilon })),
      interpolation: "log_linear",
    },
    gates: {
      artifact_integrity: artifactIntegrity ? "pass" : "not_ready",
      spectral_coverage: spectralCoverage ? "pass" : "not_ready",
      tail_registration: tailRegistration ? "pass" : "not_ready",
      calibration: calibration ? "pass" : "not_ready",
      uncertainty: uncertaintyReady ? "diagonal_propagated" : "not_ready",
      measured_material: measuredReady ? "pass" : "not_ready",
    },
    claim_boundary: [
      "Diagonal uncertainty propagation assumes independent real-axis loss samples.",
      "Registered tail models are audited but are not silently integrated beyond the supplied table.",
      "A synthetic or literature-anchored conversion cannot satisfy the measured-material gate.",
      "Optical-response integrity does not establish a collapse or spacetime-manifold mechanism.",
    ],
  };
}
