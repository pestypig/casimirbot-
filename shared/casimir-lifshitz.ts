// math-stage: reduced-order
import { z } from "zod";
import { C, HBAR, PI } from "./physics-const";

const KB = 1.380_649e-23;

const EvidenceClass = z.enum(["measured", "literature_anchored", "design_assumption"]);

const MaterialEvidence = z.object({
  label: z.string().min(1),
  evidence_class: EvidenceClass,
  source_ref: z.string().min(1),
  artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable().default(null),
});

const IdealConductor = MaterialEvidence.extend({
  kind: z.literal("ideal_conductor"),
});

const DrudeMaterial = MaterialEvidence.extend({
  kind: z.literal("drude"),
  plasma_frequency_rad_s: z.number().positive(),
  damping_rad_s: z.number().positive(),
});

const TabulatedMaterial = MaterialEvidence.extend({
  kind: z.literal("tabulated_imaginary_axis"),
  static_epsilon: z.number().gt(1),
  points: z
    .array(
      z.object({
        xi_rad_s: z.number().positive(),
        epsilon: z.number().gt(1),
      }),
    )
    .min(2),
  interpolation: z.literal("log_linear"),
});

export const LifshitzMaterial = z
  .discriminatedUnion("kind", [IdealConductor, DrudeMaterial, TabulatedMaterial])
  .superRefine((material, context) => {
    if (material.evidence_class === "measured" && material.artifact_sha256 == null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["artifact_sha256"],
        message: "Measured material response requires an artifact SHA-256.",
      });
    }
    if (material.kind === "tabulated_imaginary_axis") {
      for (let index = 1; index < material.points.length; index += 1) {
        if (material.points[index].xi_rad_s <= material.points[index - 1].xi_rad_s) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["points", index, "xi_rad_s"],
            message: "Imaginary-axis frequencies must be strictly increasing.",
          });
        }
      }
    }
  });

const LifshitzGeometry = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("parallel_plates"),
    area_m2: z.number().positive(),
  }),
  z.object({
    kind: z.literal("sphere_plate_pfa"),
    sphere_radius_m: z.number().positive(),
  }),
]);

export const LifshitzSolverInput = z.object({
  schema_version: z.literal("casimir_lifshitz/1"),
  gap_m: z.number().positive(),
  temperature_K: z.number().positive(),
  material_1: LifshitzMaterial,
  material_2: LifshitzMaterial,
  geometry: LifshitzGeometry,
  numerics: z.object({
    max_matsubara_terms: z.number().int().min(8).max(16_384),
    integration_subdivisions: z.number().int().min(40).max(4_000),
    integration_tail_y: z.number().min(20).max(100),
    relative_term_tolerance: z.number().positive().max(1e-2),
    consecutive_small_terms: z.number().int().min(2).max(20).default(6),
  }),
});

export type LifshitzMaterial = z.infer<typeof LifshitzMaterial>;
export type LifshitzSolverInput = z.infer<typeof LifshitzSolverInput>;

export type LifshitzSolverResult = {
  schema_version: "casimir_lifshitz_result/1";
  model_authority: "reduced_order_equilibrium_planar_lifshitz";
  free_energy_per_area_J_m2: number;
  pressure_Pa: number;
  force_N: number;
  ideal_zero_temperature_reference: {
    energy_per_area_J_m2: number;
    pressure_Pa: number;
    pressure_ratio: number;
  };
  matsubara_terms_used: number;
  zero_mode: {
    material_1: "ideal" | "drude_te_zero" | "finite_dielectric";
    material_2: "ideal" | "drude_te_zero" | "finite_dielectric";
  };
  convergence: {
    status: "pass" | "not_ready";
    terminated_before_max: boolean;
    estimated_relative_tail: number;
    integration_subdivisions: number;
  };
  geometry: {
    authority: "parallel_plate_exact_for_registered_material_model" | "pfa_reference_only";
    gap_to_radius_ratio: number | null;
    finite_geometry_publication_gate: "not_ready";
  };
  material_gate: "measured_receipts_present" | "literature_or_assumption_only";
  publication_grade_gate: "not_ready";
  claim_boundary: string[];
};

type ReflectionPair = { te: number; tm: number };

function epsilonImaginary(material: LifshitzMaterial, xi: number): number {
  if (material.kind === "ideal_conductor") return Number.POSITIVE_INFINITY;
  if (material.kind === "drude") {
    return 1 +
      material.plasma_frequency_rad_s ** 2 /
        (xi * (xi + material.damping_rad_s));
  }
  if (xi <= 0) return material.static_epsilon;
  const points = material.points;
  if (xi <= points[0].xi_rad_s) {
    const fraction = Math.log(xi / points[0].xi_rad_s);
    const slope =
      Math.log(points[1].epsilon / points[0].epsilon) /
      Math.log(points[1].xi_rad_s / points[0].xi_rad_s);
    return Math.max(1 + Number.EPSILON, points[0].epsilon * Math.exp(slope * fraction));
  }
  const last = points[points.length - 1];
  if (xi >= last.xi_rad_s) {
    const prior = points[points.length - 2];
    const slope =
      Math.log(last.epsilon / prior.epsilon) /
      Math.log(last.xi_rad_s / prior.xi_rad_s);
    return Math.max(1 + Number.EPSILON, last.epsilon * (xi / last.xi_rad_s) ** slope);
  }
  let upperIndex = 1;
  while (points[upperIndex].xi_rad_s < xi) upperIndex += 1;
  const lower = points[upperIndex - 1];
  const upper = points[upperIndex];
  const fraction =
    Math.log(xi / lower.xi_rad_s) /
    Math.log(upper.xi_rad_s / lower.xi_rad_s);
  return Math.exp(
    Math.log(lower.epsilon) + fraction * Math.log(upper.epsilon / lower.epsilon),
  );
}

function reflectionCoefficients(
  material: LifshitzMaterial,
  xi: number,
  q: number,
  zeroMode: boolean,
): ReflectionPair {
  if (material.kind === "ideal_conductor") return { te: -1, tm: 1 };
  if (zeroMode) {
    if (material.kind === "drude") return { te: 0, tm: 1 };
    const epsilon = material.static_epsilon;
    return { te: 0, tm: (epsilon - 1) / (epsilon + 1) };
  }
  const epsilon = epsilonImaginary(material, xi);
  const materialWaveNumber = Math.sqrt(q * q + (epsilon - 1) * (xi / C) ** 2);
  return {
    te: (q - materialWaveNumber) / (q + materialWaveNumber),
    tm: (epsilon * q - materialWaveNumber) / (epsilon * q + materialWaveNumber),
  };
}

function integrateSimpson(
  fn: (value: number) => number,
  lower: number,
  upper: number,
  requestedSubdivisions: number,
): number {
  const subdivisions = requestedSubdivisions % 2 === 0
    ? requestedSubdivisions
    : requestedSubdivisions + 1;
  const step = (upper - lower) / subdivisions;
  let sum = fn(lower) + fn(upper);
  for (let index = 1; index < subdivisions; index += 1) {
    sum += (index % 2 === 0 ? 2 : 4) * fn(lower + index * step);
  }
  return (sum * step) / 3;
}

function zeroModeLabel(
  material: LifshitzMaterial,
): "ideal" | "drude_te_zero" | "finite_dielectric" {
  if (material.kind === "ideal_conductor") return "ideal";
  return material.kind === "drude" ? "drude_te_zero" : "finite_dielectric";
}

export function computeLifshitzEquilibrium(
  rawInput: LifshitzSolverInput,
): LifshitzSolverResult {
  const input = LifshitzSolverInput.parse(rawInput);
  const { gap_m: gap, temperature_K: temperature, numerics } = input;
  const matsubaraStep = (2 * PI * KB * temperature) / HBAR;
  let freeEnergySum = 0;
  let pressureSum = 0;
  let lastCombinedMagnitude = Number.POSITIVE_INFINITY;
  let smallTerms = 0;
  let termsUsed = 0;
  let terminatedBeforeMax = false;

  for (let index = 0; index < numerics.max_matsubara_terms; index += 1) {
    const xi = matsubaraStep * index;
    const lower = (2 * gap * xi) / C;
    const integrationLower = Math.max(lower, 1e-9);
    const upper = Math.max(integrationLower + numerics.integration_tail_y, numerics.integration_tail_y);
    const zeroMode = index === 0;
    const freeIntegrand = (y: number): number => {
      const q = y / (2 * gap);
      const left = reflectionCoefficients(input.material_1, xi, q, zeroMode);
      const right = reflectionCoefficients(input.material_2, xi, q, zeroMode);
      const attenuation = Math.exp(-y);
      const teArgument = Math.max(1e-300, 1 - left.te * right.te * attenuation);
      const tmArgument = Math.max(1e-300, 1 - left.tm * right.tm * attenuation);
      return y * (Math.log(teArgument) + Math.log(tmArgument));
    };
    const pressureIntegrand = (y: number): number => {
      const q = y / (2 * gap);
      const left = reflectionCoefficients(input.material_1, xi, q, zeroMode);
      const right = reflectionCoefficients(input.material_2, xi, q, zeroMode);
      const attenuation = Math.exp(-y);
      const mode = (product: number): number => {
        const numerator = product * attenuation;
        return numerator / Math.max(1e-300, 1 - numerator);
      };
      return y * y * (mode(left.te * right.te) + mode(left.tm * right.tm));
    };
    const weight = zeroMode ? 0.5 : 1;
    const freeTerm = weight * integrateSimpson(
      freeIntegrand,
      integrationLower,
      upper,
      numerics.integration_subdivisions,
    );
    const pressureTerm = weight * integrateSimpson(
      pressureIntegrand,
      integrationLower,
      upper,
      numerics.integration_subdivisions,
    );
    freeEnergySum += freeTerm;
    pressureSum += pressureTerm;
    termsUsed = index + 1;
    lastCombinedMagnitude = Math.max(Math.abs(freeTerm), Math.abs(pressureTerm));
    const scale = Math.max(1, Math.abs(freeEnergySum), Math.abs(pressureSum));
    if (index >= 3 && lastCombinedMagnitude / scale < numerics.relative_term_tolerance) {
      smallTerms += 1;
    } else {
      smallTerms = 0;
    }
    if (smallTerms >= numerics.consecutive_small_terms) {
      terminatedBeforeMax = true;
      break;
    }
  }

  const freeEnergyPerArea = (KB * temperature * freeEnergySum) / (8 * PI * gap ** 2);
  const pressure = -(KB * temperature * pressureSum) / (8 * PI * gap ** 3);
  const idealEnergy = -(PI ** 2 * HBAR * C) / (720 * gap ** 3);
  const idealPressure = -(PI ** 2 * HBAR * C) / (240 * gap ** 4);
  const estimatedRelativeTail =
    lastCombinedMagnitude /
    Math.max(1, Math.abs(freeEnergySum), Math.abs(pressureSum));
  const force = input.geometry.kind === "parallel_plates"
    ? pressure * input.geometry.area_m2
    : 2 * PI * input.geometry.sphere_radius_m * freeEnergyPerArea;
  const materialReceiptsPresent = [input.material_1, input.material_2].every(
    (material) => material.evidence_class === "measured" && material.artifact_sha256 != null,
  );
  const gapToRadius = input.geometry.kind === "sphere_plate_pfa"
    ? gap / input.geometry.sphere_radius_m
    : null;

  return {
    schema_version: "casimir_lifshitz_result/1",
    model_authority: "reduced_order_equilibrium_planar_lifshitz",
    free_energy_per_area_J_m2: freeEnergyPerArea,
    pressure_Pa: pressure,
    force_N: force,
    ideal_zero_temperature_reference: {
      energy_per_area_J_m2: idealEnergy,
      pressure_Pa: idealPressure,
      pressure_ratio: pressure / idealPressure,
    },
    matsubara_terms_used: termsUsed,
    zero_mode: {
      material_1: zeroModeLabel(input.material_1),
      material_2: zeroModeLabel(input.material_2),
    },
    convergence: {
      status: terminatedBeforeMax && estimatedRelativeTail < numerics.relative_term_tolerance
        ? "pass"
        : "not_ready",
      terminated_before_max: terminatedBeforeMax,
      estimated_relative_tail: estimatedRelativeTail,
      integration_subdivisions: numerics.integration_subdivisions,
    },
    geometry: {
      authority: input.geometry.kind === "parallel_plates"
        ? "parallel_plate_exact_for_registered_material_model"
        : "pfa_reference_only",
      gap_to_radius_ratio: gapToRadius,
      finite_geometry_publication_gate: "not_ready",
    },
    material_gate: materialReceiptsPresent
      ? "measured_receipts_present"
      : "literature_or_assumption_only",
    publication_grade_gate: "not_ready",
    claim_boundary: [
      "The solver evaluates equilibrium, local, isotropic, nonmagnetic half-spaces only.",
      "A Drude or tabulated literature model is not a measured dielectric receipt.",
      "PFA is a curved-geometry reference and does not close the finite-geometry publication gate.",
      "Gated 2D sheets, superconducting transitions, anisotropy, spatial dispersion, and nonequilibrium switching require separate reflection operators.",
    ],
  };
}
