import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SHA256,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_CLOSURE_ALGORITHM,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_ORDERING,
  collectNhm2SemiclassicalV2RawReplayOutputArrays,
  computeNhm2SemiclassicalV2RawReplayInputClosureSha256,
  isNhm2SemiclassicalV2RawReplayManifest,
  nhm2SemiclassicalV2RawReplayManifestPairViolations,
  nhm2SemiclassicalV2RawReplayManifestViolations,
  type Nhm2SemiclassicalV2RawReplayArrayV1,
  type Nhm2SemiclassicalV2RawReplayImplementationRole,
  type Nhm2SemiclassicalV2RawReplayInputEntryV1,
  type Nhm2SemiclassicalV2RawReplayManifestV1,
} from "../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS,
  NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
  NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
} from "../shared/contracts/nhm2-semiclassical-state-realizability.v2";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "../shared/contracts/nhm2-semiclassical-state-realizability.v1";

const hash = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const FROZEN_AT = "2026-08-09T12:00:00.000Z";
const STARTED_AT = "2026-08-09T12:01:00.000Z";
const COMPLETED_AT = "2026-08-09T12:01:02.000Z";
const GENERATED_AT = "2026-08-09T12:01:03.000Z";
const SAMPLE_COUNT = 64;

const inputEntries = (
  role: Nhm2SemiclassicalV2RawReplayImplementationRole,
): Nhm2SemiclassicalV2RawReplayInputEntryV1[] =>
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS.map((inputId) => {
    const implementationSpecific = [
      "implementation_source",
      "dependency_lock",
      "executable",
    ].includes(inputId);
    const identity = implementationSpecific ? `${role}-${inputId}` : inputId;
    const base = {
      inputId,
      path: implementationSpecific
        ? `inputs/${role}/${inputId}.bin`
        : `inputs/frozen/${inputId}.json`,
      sha256: hash(identity),
      sizeBytes: 100 + identity.length,
      mediaType: implementationSpecific
        ? "application/octet-stream"
        : "application/json",
      freshness: "preexisting_unchanged" as const,
      observedAt: FROZEN_AT,
    };
    if (inputId === "tolerance_policy") {
      return {
        ...base,
        inputId,
        sha256: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SHA256,
        sizeBytes: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SIZE_BYTES,
        mediaType: "application/json",
      };
    }
    return inputId === "metric_demand_tensor"
      ? {
          ...base,
          inputId,
          sizeBytes:
            SAMPLE_COUNT * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length * 8,
          mediaType: "application/octet-stream",
          dtype: "float64" as const,
          binaryEncoding: "raw_ieee754" as const,
          endianness: "little" as const,
          shape: [SAMPLE_COUNT, 10] as [number, 10],
          storageOrder: "row-major" as const,
          componentOrder: [...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS],
          unit: "J/m^3" as const,
        }
      : (base as Nhm2SemiclassicalV2RawReplayInputEntryV1);
  });

const completeManifest = (
  role: Nhm2SemiclassicalV2RawReplayImplementationRole = "primary",
): Nhm2SemiclassicalV2RawReplayManifestV1 => {
  const outputDirectory = `artifacts/semiclassical-v2/${role}`;
  const entries = inputEntries(role);
  let arrayOrdinal = 0;
  const array = (
    roleId: string,
    shape: number[],
    componentOrder: readonly string[],
    unit: string,
  ): Nhm2SemiclassicalV2RawReplayArrayV1 => {
    const ordinal = arrayOrdinal++;
    return {
      role: roleId,
      path: `${outputDirectory}/${ordinal.toString().padStart(2, "0")}-${roleId.replaceAll(".", "-")}.f64le`,
      sha256: hash(`${role}:${ordinal}:${roleId}`),
      sizeBytes: shape.reduce((product, axis) => product * axis, 1) * 8,
      freshness: "new",
      observedAt: GENERATED_AT,
      dtype: "float64",
      binaryEncoding: "raw_ieee754",
      endianness: "little",
      shape,
      storageOrder: "row-major",
      componentOrder: [...componentOrder],
      unit,
    };
  };
  const constraintArray = (roleId: string) =>
    array(
      roleId,
      [SAMPLE_COUNT, NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER.length],
      NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
      "dimensionless",
    );
  const implementationInput = (inputId: string) =>
    entries.find((entry) => entry.inputId === inputId)!;

  return {
    artifactId: NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
    manifestFrozenAt: FROZEN_AT,
    generatedAt: GENERATED_AT,
    candidate: {
      candidateId: "nhm2-semiclassical-v2-candidate-001",
      candidateManifestId: "nhm2-candidate-manifest-001",
      selectedProfileId: "nhm2-profile-nondegenerate-001",
      candidateKind: "frozen_nondegenerate_nhm2_semiclassical_candidate",
      geometryId: "nhm2-geometry-nondegenerate-001",
      quantumStateId: "hadamard-state-001",
      chartId: "nhm2-cartesian-chart-001",
      normalizationId: "nhm2-semiclassical-normalization-001",
      tolerancePolicyId: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
      smearingFunctionId: "compact-smearing-function-001",
      samplingBasisId: "bilocal-sampling-basis-001",
      nondegeneracyCriterionId: "positive-metric-demand-frobenius-001",
      metricDemandInputId: "metric_demand_tensor",
      minimumMetricDemandFrobeniusSI:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI,
      sampleCount: SAMPLE_COUNT,
      frozenAt: FROZEN_AT,
    },
    sourceProvenance: {
      sourceMode: "state_derived_not_declared_lever",
      meanRsetOrigin: "renormalized_quantum_state_expectation_value",
      noiseKernelOrigin:
        "connected_symmetrized_quantum_state_two_point_function",
      declaredLeverTensorUsed: false,
      inputClosureExcludesDeclaredLeverTensor: true,
    },
    numericalPolicy: {
      frozenAt: FROZEN_AT,
      formulas: { ...NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS },
      units: {
        noiseKernel: "(J/m^3)^2",
        meanRset: "J/m^3",
        smearingWeights: "dimensionless",
        normalizedConstraints: "dimensionless",
        regulatorScale: "dimensionless",
      },
      tolerances: { ...NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.tolerances },
    },
    implementation: {
      comparisonPairId: "nhm2-semiclassical-v2-pair-001",
      role,
      implementationId: `${role}-semiclassical-solver`,
      implementationVersion: "1.0.0",
      sourceIdentity: {
        identityId: `${role}-source-tree`,
        inputId: "implementation_source",
        sha256: implementationInput("implementation_source").sha256,
      },
      dependencyIdentity: {
        identityId: `${role}-dependency-lock`,
        inputId: "dependency_lock",
        sha256: implementationInput("dependency_lock").sha256,
      },
      executableIdentity: {
        identityId: `${role}-executable`,
        inputId: "executable",
        sha256: implementationInput("executable").sha256,
      },
      inputExposure: {
        scientificRoot: "read_only_exact_inventory",
        implementationRoot: "executor_owned_toolchain_not_data_input",
        counterpartOutputs: "not_mounted",
        ambientRepository: "not_mounted",
      },
    },
    execution: {
      commitSha: "a".repeat(40),
      command: role === "primary" ? "node" : "julia",
      argv:
        role === "primary"
          ? ["solver/primary.mjs", "--frozen-candidate"]
          : ["solver/independent.jl", "--frozen-candidate"],
      workingDirectory: ".",
      outputDirectory,
      startedAt: STARTED_AT,
      completedAt: COMPLETED_AT,
      durationMs: 2000,
      exitCode: 0,
      terminationSignal: null,
    },
    inputClosure: {
      frozenBeforeExecution: true,
      scientificRootDirectory: "inputs/frozen",
      implementationRootDirectory: `inputs/${role}`,
      algorithm:
        NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_CLOSURE_ALGORITHM,
      ordering: NHM2_SEMICLASSICAL_V2_RAW_REPLAY_INPUT_ORDERING,
      entries,
      excludedInputIds: [
        ...NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS,
      ],
      scientificClosureSha256:
        computeNhm2SemiclassicalV2RawReplayInputClosureSha256(
          entries,
          "scientific",
          {
            scientificRootDirectory: "inputs/frozen",
            implementationRootDirectory: `inputs/${role}`,
          },
        ),
      completeClosureSha256:
        computeNhm2SemiclassicalV2RawReplayInputClosureSha256(
          entries,
          "complete",
          {
            scientificRootDirectory: "inputs/frozen",
            implementationRootDirectory: `inputs/${role}`,
          },
        ),
    },
    arrays: {
      noiseKernel: array(
        "noise_kernel",
        [
          SAMPLE_COUNT,
          SAMPLE_COUNT,
          NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER.length,
        ],
        NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
        "(J/m^3)^2",
      ),
      noiseKernelAbsoluteUncertainty95: array(
        "noise_kernel_absolute_uncertainty95",
        [
          SAMPLE_COUNT,
          SAMPLE_COUNT,
          NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER.length,
        ],
        NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
        "(J/m^3)^2",
      ),
      meanRset: array(
        "mean_rset",
        [SAMPLE_COUNT, NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length],
        NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
        "J/m^3",
      ),
      smearingWeights: array(
        "smearing_weights",
        [SAMPLE_COUNT],
        ["weight"],
        "dimensionless",
      ),
      brackets: NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS.map(
        (bracketId) => ({
          bracketId,
          computed: constraintArray(`constraint_bracket.${bracketId}.computed`),
          target: constraintArray(`constraint_bracket.${bracketId}.target`),
          residual: constraintArray(`constraint_bracket.${bracketId}.residual`),
          absoluteUncertainty95: constraintArray(
            `constraint_bracket.${bracketId}.absolute_uncertainty95`,
          ),
        }),
      ),
      antisymmetry: {
        forward: constraintArray("antisymmetry.forward"),
        reverse: constraintArray("antisymmetry.reverse"),
        residual: constraintArray("antisymmetry.residual"),
        absoluteUncertainty95: constraintArray(
          "antisymmetry.absolute_uncertainty95",
        ),
      },
      jacobi: {
        term1: constraintArray("jacobi.term_1"),
        term2: constraintArray("jacobi.term_2"),
        term3: constraintArray("jacobi.term_3"),
        residual: constraintArray("jacobi.residual"),
        absoluteUncertainty95: constraintArray(
          "jacobi.absolute_uncertainty95",
        ),
      },
      regulatorLevels: [1, 0.5, 0.25].map((scale, ordinal) => ({
        ordinal,
        levelId: `regulator-level-${ordinal}`,
        scale,
        residual: constraintArray(`regulator_level.${ordinal}.residual`),
        absoluteUncertainty95: constraintArray(
          `regulator_level.${ordinal}.absolute_uncertainty95`,
        ),
      })),
    },
    claimLocks: {
      diagnosticOnly: true,
      replayAuthority: false,
      theoryGraphPromotion: false,
      theoryClosure: false,
      physicalViability: false,
      propulsion: false,
      transport: false,
      routeEta: false,
      certifiedSpeed: false,
      empiricalValidation: false,
    },
  };
};

const recomputeClosures = (
  manifest: Nhm2SemiclassicalV2RawReplayManifestV1,
): void => {
  manifest.inputClosure.scientificClosureSha256 =
    computeNhm2SemiclassicalV2RawReplayInputClosureSha256(
      manifest.inputClosure.entries,
      "scientific",
      {
        scientificRootDirectory: manifest.inputClosure.scientificRootDirectory,
        implementationRootDirectory:
          manifest.inputClosure.implementationRootDirectory,
      },
    );
  manifest.inputClosure.completeClosureSha256 =
    computeNhm2SemiclassicalV2RawReplayInputClosureSha256(
      manifest.inputClosure.entries,
      "complete",
      {
        scientificRootDirectory: manifest.inputClosure.scientificRootDirectory,
        implementationRootDirectory:
          manifest.inputClosure.implementationRootDirectory,
      },
    );
};

const rebaseInputRoot = (
  manifest: Nhm2SemiclassicalV2RawReplayManifestV1,
  scope: "scientific" | "implementation",
  nextRoot: string,
): void => {
  const priorRoot =
    scope === "scientific"
      ? manifest.inputClosure.scientificRootDirectory
      : manifest.inputClosure.implementationRootDirectory;
  const allowedIds =
    scope === "scientific"
      ? NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS.slice(
          0,
          NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS.length,
        )
      : NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS.slice(
          NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS.length,
        );
  for (const entry of manifest.inputClosure.entries) {
    if ((allowedIds as readonly string[]).includes(entry.inputId)) {
      entry.path = `${nextRoot}${entry.path.slice(priorRoot.length)}`;
    }
  }
  if (scope === "scientific") {
    manifest.inputClosure.scientificRootDirectory = nextRoot;
  } else {
    manifest.inputClosure.implementationRootDirectory = nextRoot;
  }
  recomputeClosures(manifest);
};

const rebaseOutputRoot = (
  manifest: Nhm2SemiclassicalV2RawReplayManifestV1,
  nextRoot: string,
): void => {
  const priorRoot = manifest.execution.outputDirectory;
  for (const array of collectNhm2SemiclassicalV2RawReplayOutputArrays(manifest)) {
    array.path = `${nextRoot}${array.path.slice(priorRoot.length)}`;
  }
  manifest.execution.outputDirectory = nextRoot;
};

describe("NHM2 semiclassical-v2 raw replay manifest", () => {
  it("accepts exact primary and independent raw manifests and their isolated pair", () => {
    const primary = completeManifest("primary");
    const independent = completeManifest("independent");

    expect(nhm2SemiclassicalV2RawReplayManifestViolations(primary)).toEqual([]);
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(independent)).toEqual(
      [],
    );
    expect(isNhm2SemiclassicalV2RawReplayManifest(primary)).toBe(true);
    expect(
      nhm2SemiclassicalV2RawReplayManifestPairViolations(primary, independent),
    ).toEqual([]);
    expect(collectNhm2SemiclassicalV2RawReplayOutputArrays(primary)).toHaveLength(
      31,
    );
    expect(Object.keys(primary)).not.toEqual(
      expect.arrayContaining(["status", "verdict", "replayPass"]),
    );
    const tolerancePolicyInput = primary.inputClosure.entries.find(
      (entry) => entry.inputId === "tolerance_policy",
    )!;
    expect(tolerancePolicyInput).toMatchObject({
      sha256: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SHA256,
      sizeBytes: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SIZE_BYTES,
      mediaType: "application/json",
    });
    expect(
      Buffer.byteLength(
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SIZE_BYTES);
    expect(hash(NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CANONICAL_JSON)).toBe(
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_SHA256,
    );
    expect(Object.isFrozen(NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY)).toBe(
      true,
    );
    expect(
      Object.isFrozen(NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.tolerances),
    ).toBe(true);
    expect(NHM2_SEMICLASSICAL_V2_RAW_REPLAY_REQUIRED_INPUT_IDS).toEqual(
      expect.arrayContaining([
        "field_model",
        "lagrangian",
        "field_equations",
        "boundary_conditions",
        "state_construction",
        "renormalization_prescription",
        "renormalization_counterterms",
        "finite_renormalization_freedom",
        "constraint_formulation",
        "regulator_definition",
        "operator_ordering",
        "classical_structure_functions",
        "metric_demand_tensor",
      ]),
    );
  });

  it("rejects unknown producer-authored replay dispositions at every exact envelope", () => {
    const root = completeManifest() as unknown as Record<string, unknown>;
    root.replayPass = true;
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(root)).toContain(
      "manifest_shape_invalid",
    );

    const nested = completeManifest() as unknown as {
      execution: Record<string, unknown>;
    };
    nested.execution.status = "pass";
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(nested)).toContain(
      "execution_shape_invalid",
    );

    const rawArray = completeManifest() as unknown as {
      arrays: { noiseKernel: Record<string, unknown> };
    };
    rawArray.arrays.noiseKernel.psdPass = true;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(rawArray),
    ).toContain("array_shape_invalid:/arrays/noiseKernel");
  });

  it("requires N>=64 and exact float64 raw byte layouts, axes, components, and units", () => {
    const tooSmall = completeManifest();
    tooSmall.candidate.sampleCount = 63;
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(tooSmall)).toContain(
      "candidate_freeze_invalid",
    );

    const encoding = completeManifest();
    (encoding.arrays.noiseKernel as { dtype: string }).dtype = "float32";
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(encoding)).toContain(
      "array_encoding_invalid:/arrays/noiseKernel",
    );

    const axes = completeManifest();
    axes.arrays.noiseKernel.shape = [SAMPLE_COUNT, SAMPLE_COUNT, 99];
    axes.arrays.noiseKernel.sizeBytes = SAMPLE_COUNT * SAMPLE_COUNT * 99 * 8;
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(axes)).toContain(
      "array_shape_axes_invalid:/arrays/noiseKernel",
    );

    const components = completeManifest();
    components.arrays.meanRset.componentOrder.reverse();
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(components)).toContain(
      "array_component_order_invalid:/arrays/meanRset",
    );

    const unit = completeManifest();
    unit.arrays.brackets[0].computed.unit = "constraint_density_SI";
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(unit)).toContain(
      "array_unit_invalid:/arrays/brackets/0/computed",
    );

    const bytes = completeManifest();
    bytes.arrays.jacobi.residual.sizeBytes -= 8;
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(bytes)).toContain(
      "array_file_binding_invalid:/arrays/jacobi/residual",
    );
  });

  it("requires all bracket operands, antisymmetry operands, Jacobi terms, and regulator levels", () => {
    const brackets = completeManifest();
    brackets.arrays.brackets.reverse();
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(brackets)).toContain(
      "bracket_id_order_invalid:/arrays/brackets/0",
    );

    const antisymmetry = completeManifest() as unknown as {
      arrays: { antisymmetry: Record<string, unknown> };
    };
    delete antisymmetry.arrays.antisymmetry.reverse;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(antisymmetry),
    ).toContain("antisymmetry_shape_invalid");

    const jacobi = completeManifest() as unknown as {
      arrays: { jacobi: Record<string, unknown> };
    };
    delete jacobi.arrays.jacobi.term3;
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(jacobi)).toContain(
      "jacobi_shape_invalid",
    );

    const levels = completeManifest();
    levels.arrays.regulatorLevels.pop();
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(levels)).toContain(
      "regulator_level_count_invalid",
    );

    const nonMonotone = completeManifest();
    nonMonotone.arrays.regulatorLevels[2].scale = 0.75;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(nonMonotone),
    ).toContain("regulator_level_binding_invalid:/arrays/regulatorLevels/2");
  });

  it("recomputes complete and scientific closure hashes and enforces file freshness", () => {
    const closure = completeManifest();
    closure.inputClosure.entries[1].sha256 = hash("mutated-geometry");
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(closure)).toEqual(
      expect.arrayContaining([
        "scientific_input_closure_sha256_mismatch",
        "complete_input_closure_sha256_mismatch",
      ]),
    );

    const inputFreshness = completeManifest();
    (
      inputFreshness.inputClosure.entries[0] as { freshness: string }
    ).freshness = "new";
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(inputFreshness),
    ).toContain("input_binding_invalid:/inputClosure/entries/0");

    const outputFreshness = completeManifest();
    (
      outputFreshness.arrays.meanRset as { freshness: string }
    ).freshness = "preexisting_unchanged";
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(outputFreshness),
    ).toContain("array_file_binding_invalid:/arrays/meanRset");

    const escapedOutput = completeManifest();
    escapedOutput.arrays.meanRset.path = "artifacts/elsewhere/mean.f64le";
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(escapedOutput),
    ).toContain("array_file_binding_invalid:/arrays/meanRset");

    const escapedScientificRoot = completeManifest();
    escapedScientificRoot.inputClosure.entries[1].path =
      "inputs/primary/geometry.json";
    recomputeClosures(escapedScientificRoot);
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(escapedScientificRoot),
    ).toContain("input_binding_invalid:/inputClosure/entries/1");

    const escapedImplementationRoot = completeManifest();
    escapedImplementationRoot.inputClosure.entries.at(-1)!.path =
      "inputs/frozen/executable.bin";
    recomputeClosures(escapedImplementationRoot);
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(
        escapedImplementationRoot,
      ),
    ).toContain("input_binding_invalid:/inputClosure/entries/23");

    const metricDemand = completeManifest();
    const descriptor = metricDemand.inputClosure.entries.find(
      (entry) => entry.inputId === "metric_demand_tensor",
    )! as Extract<
      Nhm2SemiclassicalV2RawReplayInputEntryV1,
      { inputId: "metric_demand_tensor" }
    >;
    descriptor.shape = [SAMPLE_COUNT, 9] as unknown as [number, 10];
    descriptor.sizeBytes = SAMPLE_COUNT * 9 * 8;
    recomputeClosures(metricDemand);
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(metricDemand),
    ).toContain(
      "metric_demand_input_descriptor_invalid:/inputClosure/entries/20",
    );

    const representationClosure = completeManifest();
    const representedMetric = representationClosure.inputClosure.entries.find(
      (entry) => entry.inputId === "metric_demand_tensor",
    )! as Extract<
      Nhm2SemiclassicalV2RawReplayInputEntryV1,
      { inputId: "metric_demand_tensor" }
    >;
    representedMetric.componentOrder.reverse();
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(representationClosure),
    ).toEqual(
      expect.arrayContaining([
        "metric_demand_input_descriptor_invalid:/inputClosure/entries/20",
        "scientific_input_closure_sha256_mismatch",
        "complete_input_closure_sha256_mismatch",
      ]),
    );
  });

  it("rejects equal or nested scientific, implementation, and output roots in both directions", () => {
    const implementationBelowScientific = completeManifest();
    rebaseInputRoot(
      implementationBelowScientific,
      "implementation",
      "inputs/frozen/toolchain",
    );
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(
        implementationBelowScientific,
      ),
    ).toContain("root_topology_invalid");

    const scientificBelowImplementation = completeManifest();
    rebaseInputRoot(
      scientificBelowImplementation,
      "scientific",
      "inputs/primary/science",
    );
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(
        scientificBelowImplementation,
      ),
    ).toContain("root_topology_invalid");

    const outputBelowImplementation = completeManifest();
    rebaseOutputRoot(outputBelowImplementation, "inputs/primary/output");
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(
        outputBelowImplementation,
      ),
    ).toContain("root_topology_invalid");

    const scientificBelowOutput = completeManifest();
    rebaseOutputRoot(scientificBelowOutput, "inputs");
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(scientificBelowOutput),
    ).toContain("root_topology_invalid");
  });

  it("freezes formulas and positive tolerances before a self-consistent run interval", () => {
    const formula = completeManifest();
    (
      formula.numericalPolicy.formulas as { bracketResidual: string }
    ).bracketResidual = "producer_decides";
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(formula)).toContain(
      "numerical_policy_formula_binding_invalid",
    );

    const tolerance = completeManifest();
    tolerance.numericalPolicy.tolerances.jacobiResidualUpper95 = 0;
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(tolerance)).toContain(
      "numerical_policy_tolerances_invalid",
    );

    const regulatorTolerance = completeManifest();
    regulatorTolerance.numericalPolicy.tolerances.regulatorResidualUpper95 = 0;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(regulatorTolerance),
    ).toContain("numerical_policy_tolerances_invalid");

    const regulatorMonotonicity = completeManifest();
    regulatorMonotonicity.numericalPolicy.tolerances.regulatorMonotonicityAbsolute =
      Number.NaN;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(regulatorMonotonicity),
    ).toContain("numerical_policy_tolerances_invalid");

    const hugeTolerance = completeManifest();
    hugeTolerance.numericalPolicy.tolerances.bracketResidualUpper95 = 1e12;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(hugeTolerance),
    ).toContain("numerical_policy_tolerances_invalid");

    const tinyMeanFloor = completeManifest();
    tinyMeanFloor.numericalPolicy.tolerances.meanNormalizationFloorSI = 1e-30;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(tinyMeanFloor),
    ).toContain("numerical_policy_tolerances_invalid");

    const tinyMetricFloor = completeManifest();
    tinyMetricFloor.candidate.minimumMetricDemandFrobeniusSI = 1e-30;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(tinyMetricFloor),
    ).toContain("candidate_freeze_invalid");

    const policyIdMismatch = completeManifest();
    (policyIdMismatch.candidate as { tolerancePolicyId: string }).tolerancePolicyId =
      "producer-policy/v999";
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(policyIdMismatch),
    ).toContain("candidate_freeze_invalid");

    const policyHashMismatch = completeManifest();
    policyHashMismatch.inputClosure.entries.find(
      (entry) => entry.inputId === "tolerance_policy",
    )!.sha256 = hash("producer-policy-bytes");
    recomputeClosures(policyHashMismatch);
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(policyHashMismatch),
    ).toContain("approved_tolerance_policy_input_binding_invalid");

    const policySizeMismatch = completeManifest();
    policySizeMismatch.inputClosure.entries.find(
      (entry) => entry.inputId === "tolerance_policy",
    )!.sizeBytes += 1;
    recomputeClosures(policySizeMismatch);
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(policySizeMismatch),
    ).toContain("approved_tolerance_policy_input_binding_invalid");

    const lateFreeze = completeManifest();
    lateFreeze.manifestFrozenAt = "2026-08-09T12:02:00.000Z";
    lateFreeze.candidate.frozenAt = lateFreeze.manifestFrozenAt;
    lateFreeze.numericalPolicy.frozenAt = lateFreeze.manifestFrozenAt;
    expect(nhm2SemiclassicalV2RawReplayManifestViolations(lateFreeze)).toContain(
      "execution_interval_invalid",
    );

    const falseDuration = completeManifest();
    falseDuration.execution.durationMs = 1999;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(falseDuration),
    ).toContain("execution_interval_invalid");
  });

  it("cross-binds implementation source, dependency lock, and executable identities", () => {
    const hashMismatch = completeManifest();
    hashMismatch.implementation.sourceIdentity.sha256 = hash("unbound-source");
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(hashMismatch),
    ).toContain(
      "implementation_identity_binding_invalid:/implementation/sourceIdentity",
    );

    const reusedIdentity = completeManifest();
    reusedIdentity.implementation.executableIdentity.identityId =
      reusedIdentity.implementation.sourceIdentity.identityId;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(reusedIdentity),
    ).toContain("implementation_internal_identities_not_distinct");

    const ambientAccess = completeManifest();
    (
      ambientAccess.implementation.inputExposure as {
        ambientRepository: string;
      }
    ).ambientRepository = "read_only";
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(ambientAccess),
    ).toContain("implementation_input_exposure_invalid");
  });

  it("forbids the declared lever source in provenance and in the complete closure", () => {
    const provenance = completeManifest();
    (
      provenance.sourceProvenance as { declaredLeverTensorUsed: boolean }
    ).declaredLeverTensorUsed = true;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(provenance),
    ).toContain("source_provenance_invalid");

    const exclusions = completeManifest();
    exclusions.inputClosure.excludedInputIds = [
      "declared_lever_tensor",
    ] as unknown as typeof exclusions.inputClosure.excludedInputIds;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(exclusions),
    ).toContain("declared_lever_input_exclusion_invalid");

    const regulatorUncertainty = completeManifest() as unknown as {
      arrays: { regulatorLevels: Array<Record<string, unknown>> };
    };
    delete regulatorUncertainty.arrays.regulatorLevels[0]
      .absoluteUncertainty95;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(regulatorUncertainty),
    ).toContain("regulator_level_shape_invalid:/arrays/regulatorLevels/0");
  });

  it("requires paired runs to share frozen science but differ in every implementation identity", () => {
    const primary = completeManifest("primary");
    const independent = completeManifest("independent");

    independent.inputClosure.entries[1].sha256 = hash(
      "independent-mutated-geometry",
    );
    recomputeClosures(independent);
    expect(
      nhm2SemiclassicalV2RawReplayManifestPairViolations(primary, independent),
    ).toEqual(
      expect.arrayContaining([
        "frozen_scientific_inputs_mismatch",
        "scientific_input_inventory_mismatch",
      ]),
    );

    const copiedImplementation = completeManifest("independent");
    copiedImplementation.implementation.implementationId =
      primary.implementation.implementationId;
    copiedImplementation.implementation.sourceIdentity = structuredClone(
      primary.implementation.sourceIdentity,
    );
    const sourceEntry = copiedImplementation.inputClosure.entries.find(
      (entry) => entry.inputId === "implementation_source",
    )!;
    sourceEntry.sha256 = primary.implementation.sourceIdentity.sha256;
    recomputeClosures(copiedImplementation);
    expect(
      nhm2SemiclassicalV2RawReplayManifestPairViolations(
        primary,
        copiedImplementation,
      ),
    ).toContain("implementations_not_genuinely_distinct");

    const reusedImplementationRoot = completeManifest("independent");
    reusedImplementationRoot.inputClosure.implementationRootDirectory =
      primary.inputClosure.implementationRootDirectory;
    for (const entry of reusedImplementationRoot.inputClosure.entries.slice(-3)) {
      entry.path = entry.path.replace("inputs/independent/", "inputs/primary/");
    }
    recomputeClosures(reusedImplementationRoot);
    expect(
      nhm2SemiclassicalV2RawReplayManifestPairViolations(
        primary,
        reusedImplementationRoot,
      ),
    ).toEqual(
      expect.arrayContaining([
        "implementation_root_directories_not_distinct",
        "implementations_not_genuinely_distinct",
        "pair_root_topology_invalid",
      ]),
    );

    const nestedImplementationRoot = completeManifest("independent");
    rebaseInputRoot(
      nestedImplementationRoot,
      "implementation",
      "inputs/primary/nested-independent",
    );
    expect(
      nhm2SemiclassicalV2RawReplayManifestPairViolations(
        primary,
        nestedImplementationRoot,
      ),
    ).toContain("pair_root_topology_invalid");
  });

  it("keeps every scientific, physical, propulsion, and transport claim locked", () => {
    for (const key of [
      "replayAuthority",
      "theoryGraphPromotion",
      "theoryClosure",
      "physicalViability",
      "propulsion",
      "transport",
      "routeEta",
      "certifiedSpeed",
      "empiricalValidation",
    ] as const) {
      const manifest = completeManifest();
      manifest.claimLocks[key] = true as never;
      expect(
        nhm2SemiclassicalV2RawReplayManifestViolations(manifest),
      ).toContain("claim_locks_invalid");
    }
    const nonDiagnostic = completeManifest();
    nonDiagnostic.claimLocks.diagnosticOnly = false as true;
    expect(
      nhm2SemiclassicalV2RawReplayManifestViolations(nonDiagnostic),
    ).toContain("claim_locks_invalid");
  });

  it("fails closed without throwing on malformed values", () => {
    for (const malformed of [null, [], { artifactId: "wrong" }]) {
      expect(() =>
        nhm2SemiclassicalV2RawReplayManifestViolations(malformed),
      ).not.toThrow();
      expect(
        nhm2SemiclassicalV2RawReplayManifestViolations(malformed),
      ).toContain("manifest_shape_invalid");
    }
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() =>
      nhm2SemiclassicalV2RawReplayManifestViolations(cyclic),
    ).not.toThrow();
  });
});
