import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import {
  validateCasimirArtifactGenerationReceiptAgainstRequestV1,
  validateCasimirArtifactGenerationReceiptIntegrityV1,
  validateCasimirArtifactGenerationRequestIntegrityV1,
  type CasimirArtifactGenerationReceiptV1,
  type CasimirArtifactGenerationRequestV1,
} from "../../../shared/contracts/casimir-artifact-generation.v1";
import {
  buildCasimirIndependentNumericalVerificationCertificateV1,
  validateCasimirIndependentNumericalCertificateAgainstRequestV1,
  validateCasimirIndependentNumericalVerificationCertificateIntegrityV1,
  validateCasimirIndependentNumericalVerificationRequestIntegrityV1,
  validateCasimirNumericalImplementationAgainstProducerReceiptV1,
  type CasimirIndependentNumericalVerificationCertificateV1,
  type CasimirIndependentNumericalVerificationRequestV1,
} from "../../../shared/contracts/casimir-independent-numerical-verification.v1";
import {
  validateCasimirIndependentNumericalReplayPolicyIntegrityV1,
  type CasimirIndependentNumericalReplayPolicyV1,
} from "../../../shared/contracts/casimir-independent-numerical-replay-policy.v1";
import { computeCasimirSpecValueSha256V1 } from "../../../shared/contracts/casimir-spec-scientific-claim-ir.v1";
import {
  runCasimirFormalLeanProcessV1,
  type CasimirFormalLeanProcessObservationV1,
  type CasimirFormalLeanProcessRunnerV1,
} from "./casimir-formal-lean-replay";

export const CASIMIR_INDEPENDENT_NUMERICAL_REPLAY_BACKEND_ID =
  "casimir_independent_numerical_replay_backend/v1" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_HARNESS_OUTPUT_SCHEMA =
  "casimir.independent_numerical_harness.output.v1" as const;

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const replaySchema = z
  .object({
    outputManifestSha256: sha256Schema,
    transcriptSha256: sha256Schema,
    refinementLevels: z.number().int().min(1).max(32),
  })
  .strict();
const laneOutputSchema = z
  .object({
    implementationId: z.string().trim().min(1),
    replays: z.array(replaySchema).length(2),
  })
  .strict();
const harnessOutputSchema = z
  .object({
    schema: z.literal(CASIMIR_INDEPENDENT_NUMERICAL_HARNESS_OUTPUT_SCHEMA),
    requestArtifactSha256: sha256Schema,
    policyArtifactSha256: sha256Schema,
    runs: z
      .object({
        primary: laneOutputSchema,
        independent: laneOutputSchema,
      })
      .strict(),
    comparisons: z.array(
      z
        .object({
          observableId: z.string().trim().min(1),
          unit: z.string().trim().min(1),
          maximumAbsoluteError: z.number().finite().nonnegative(),
          maximumRelativeError: z.number().finite().nonnegative(),
          observedConvergenceOrder: z.number().finite().nonnegative(),
        })
        .strict(),
    ),
    blockers: z.array(
      z
        .object({
          code: z.string().trim().min(1),
          message: z.string().trim().min(1),
          evidenceRefs: z.array(z.string().trim().min(1)),
        })
        .strict(),
    ),
  })
  .strict();

export type CasimirIndependentNumericalHarnessOutputV1 = z.infer<
  typeof harnessOutputSchema
>;

export type ReplayCasimirIndependentNumericalRequestV1Input = {
  request: CasimirIndependentNumericalVerificationRequestV1;
  policy: CasimirIndependentNumericalReplayPolicyV1;
  primaryGenerationRequest: CasimirArtifactGenerationRequestV1;
  primaryProducerReceipt: CasimirArtifactGenerationReceiptV1;
  independentGenerationRequest: CasimirArtifactGenerationRequestV1;
  independentProducerReceipt: CasimirArtifactGenerationReceiptV1;
  harnessSourcePath: string;
  harnessExecutablePath: string;
  primarySourcePath: string;
  primaryBuildManifestPath: string;
  primaryExecutablePath: string;
  independentSourcePath: string;
  independentBuildManifestPath: string;
  independentExecutablePath: string;
  outputRoot: string;
  runner?: CasimirFormalLeanProcessRunnerV1;
  generatedAt?: () => string;
};

export class CasimirIndependentNumericalReplayAdmissionError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(
      `independent numerical replay admission failed: ${issues.join("; ")}`,
    );
    this.name = "CasimirIndependentNumericalReplayAdmissionError";
    this.issues = issues;
  }
}

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

async function requireRegularNonAliasedFile(
  inputPath: string,
  label: string,
): Promise<{ absolutePath: string; bytes: Buffer }> {
  if (!path.isAbsolute(inputPath))
    throw new Error(`${label}_path_not_absolute`);
  const absolutePath = path.resolve(inputPath);
  const stat = await fs.lstat(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${label}_not_regular_file`);
  }
  const realPath = await fs.realpath(absolutePath);
  const same =
    process.platform === "win32"
      ? realPath.toLowerCase() === absolutePath.toLowerCase()
      : realPath === absolutePath;
  if (!same) throw new Error(`${label}_path_alias_forbidden`);
  return { absolutePath, bytes: await fs.readFile(absolutePath) };
}

async function requireFreshOutputRoot(outputRoot: string): Promise<string> {
  if (!path.isAbsolute(outputRoot)) throw new Error("output_root_not_absolute");
  const absolutePath = path.resolve(outputRoot);
  try {
    await fs.lstat(absolutePath);
    throw new Error("output_root_must_not_exist");
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      await fs.mkdir(absolutePath);
      return absolutePath;
    }
    throw error;
  }
}

function policyLinkageIssues(
  request: CasimirIndependentNumericalVerificationRequestV1,
  policy: CasimirIndependentNumericalReplayPolicyV1,
): string[] {
  const issues: string[] = [];
  for (const lane of ["primary", "independent"] as const) {
    const requested =
      lane === "primary"
        ? request.primaryImplementation
        : request.independentImplementation;
    const bound = policy.lanes[lane];
    if (bound.implementationId !== requested.implementationId)
      issues.push(`${lane}_implementation_id_mismatch`);
    if (bound.lineageId !== requested.lineageId)
      issues.push(`${lane}_lineage_id_mismatch`);
    if (bound.sourceSha256 !== requested.sourceSha256)
      issues.push(`${lane}_source_hash_mismatch`);
    if (bound.buildManifestSha256 !== requested.buildManifestSha256)
      issues.push(`${lane}_build_manifest_hash_mismatch`);
    const requestedEnvironment = request.environments[lane];
    for (const key of [
      "environmentId",
      "toolchainSha256",
      "runtimeSha256",
      "platformSha256",
    ] as const) {
      if (bound.environment[key] !== requestedEnvironment[key]) {
        issues.push(`${lane}_environment_${key}_mismatch`);
      }
    }
  }
  if (
    request.comparisonPolicy.minimumRefinementLevels >
    policy.execution.maximumRefinementLevels
  ) {
    issues.push("requested_refinement_levels_exceed_policy");
  }
  if (
    request.executionPolicy.replayCount !== policy.execution.replayCount ||
    request.executionPolicy.networkAllowed !==
      policy.execution.networkAllowed ||
    request.executionPolicy.arbitraryCommandAllowed !==
      policy.execution.arbitraryCommandAllowed ||
    request.executionPolicy.outerObservedProcessRequired !==
      policy.execution.outerObservedProcessRequired
  ) {
    issues.push("request_execution_policy_mismatch");
  }
  return issues;
}

export async function validateCasimirIndependentNumericalEvidenceChainV1(input: {
  request: CasimirIndependentNumericalVerificationRequestV1;
  policy: CasimirIndependentNumericalReplayPolicyV1;
  primaryGenerationRequest: CasimirArtifactGenerationRequestV1;
  primaryProducerReceipt: CasimirArtifactGenerationReceiptV1;
  independentGenerationRequest: CasimirArtifactGenerationRequestV1;
  independentProducerReceipt: CasimirArtifactGenerationReceiptV1;
}): Promise<string[]> {
  const requestIssues =
    await validateCasimirIndependentNumericalVerificationRequestIntegrityV1(
      input.request,
    );
  const policyIssues =
    await validateCasimirIndependentNumericalReplayPolicyIntegrityV1(
      input.policy,
    );
  const issues = [
    ...requestIssues.map((issue) => `request:${issue}`),
    ...policyIssues.map((issue) => `policy:${issue}`),
  ];
  if (requestIssues.length === 0 && policyIssues.length === 0) {
    issues.push(...policyLinkageIssues(input.request, input.policy));
  }
  for (const lane of ["primary", "independent"] as const) {
    const generationRequest =
      lane === "primary"
        ? input.primaryGenerationRequest
        : input.independentGenerationRequest;
    const receipt =
      lane === "primary"
        ? input.primaryProducerReceipt
        : input.independentProducerReceipt;
    const implementation =
      lane === "primary"
        ? input.request.primaryImplementation
        : input.request.independentImplementation;
    const generationRequestIssues =
      await validateCasimirArtifactGenerationRequestIntegrityV1(
        generationRequest,
      );
    const receiptIssues =
      await validateCasimirArtifactGenerationReceiptIntegrityV1(receipt);
    issues.push(
      ...generationRequestIssues.map(
        (issue) => `${lane}_generation_request:${issue}`,
      ),
      ...receiptIssues.map((issue) => `${lane}_producer_receipt:${issue}`),
    );
    if (generationRequestIssues.length === 0 && receiptIssues.length === 0) {
      issues.push(
        ...validateCasimirArtifactGenerationReceiptAgainstRequestV1(
          receipt,
          generationRequest,
        ).map((issue) => `${lane}_producer_chain:${issue}`),
        ...validateCasimirNumericalImplementationAgainstProducerReceiptV1(
          implementation,
          receipt,
        ).map((issue) => `${lane}_implementation_binding:${issue}`),
      );
      if (
        generationRequest.casimirSpec.specId !==
        input.request.casimirSpec.specId
      )
        issues.push(`${lane}_generation_casimir_spec_id_mismatch`);
      if (
        generationRequest.casimirSpec.semanticSha256 !==
        input.request.casimirSpec.semanticSha256
      )
        issues.push(`${lane}_generation_semantic_hash_mismatch`);
      if (
        generationRequest.casimirSpec.artifactSha256 !==
        input.request.casimirSpec.artifactSha256
      )
        issues.push(`${lane}_generation_spec_artifact_hash_mismatch`);
      if (generationRequest.claim.claimId !== input.request.claim.claimId)
        issues.push(`${lane}_generation_claim_id_mismatch`);
      if (
        generationRequest.claim.propositionSha256 !==
        input.request.claim.propositionSha256
      )
        issues.push(`${lane}_generation_proposition_hash_mismatch`);
    }
  }
  return [...new Set(issues)].sort();
}

const processBlockers = (
  observation: CasimirFormalLeanProcessObservationV1,
): CasimirIndependentNumericalVerificationCertificateV1["blockers"] => {
  const blockers: CasimirIndependentNumericalVerificationCertificateV1["blockers"] =
    [];
  const add = (code: string, message: string) =>
    blockers.push({ code, message, evidenceRefs: [] });
  if (observation.spawnError)
    add("harness_spawn_failed", "The pinned numerical harness did not start.");
  if (observation.timedOut)
    add(
      "harness_timed_out",
      "The pinned numerical harness exceeded its timeout.",
    );
  if (observation.outputLimitExceeded)
    add(
      "harness_output_limit_exceeded",
      "The pinned numerical harness exceeded its output limit.",
    );
  if (observation.exitCode !== 0)
    add(
      "harness_nonzero_exit",
      "The pinned numerical harness did not exit successfully.",
    );
  return blockers;
};

export async function replayCasimirIndependentNumericalRequestV1(
  input: ReplayCasimirIndependentNumericalRequestV1Input,
): Promise<CasimirIndependentNumericalVerificationCertificateV1> {
  const admissionIssues =
    await validateCasimirIndependentNumericalEvidenceChainV1(input);
  if (admissionIssues.length > 0) {
    throw new CasimirIndependentNumericalReplayAdmissionError(
      [...new Set(admissionIssues)].sort(),
    );
  }

  const [
    harnessSource,
    harness,
    primarySource,
    primaryBuildManifest,
    primary,
    independentSource,
    independentBuildManifest,
    independent,
  ] = await Promise.all([
    requireRegularNonAliasedFile(input.harnessSourcePath, "harness_source"),
    requireRegularNonAliasedFile(input.harnessExecutablePath, "harness"),
    requireRegularNonAliasedFile(input.primarySourcePath, "primary_source"),
    requireRegularNonAliasedFile(
      input.primaryBuildManifestPath,
      "primary_build_manifest",
    ),
    requireRegularNonAliasedFile(input.primaryExecutablePath, "primary"),
    requireRegularNonAliasedFile(
      input.independentSourcePath,
      "independent_source",
    ),
    requireRegularNonAliasedFile(
      input.independentBuildManifestPath,
      "independent_build_manifest",
    ),
    requireRegularNonAliasedFile(
      input.independentExecutablePath,
      "independent",
    ),
  ]);
  const executableIssues: string[] = [];
  if (sha256(harnessSource.bytes) !== input.policy.harness.sourceSha256)
    executableIssues.push("harness_source_hash_mismatch");
  if (sha256(harness.bytes) !== input.policy.harness.executableSha256)
    executableIssues.push("harness_executable_hash_mismatch");
  if (sha256(primarySource.bytes) !== input.policy.lanes.primary.sourceSha256) {
    executableIssues.push("primary_source_hash_mismatch");
  }
  if (
    sha256(primaryBuildManifest.bytes) !==
    input.policy.lanes.primary.buildManifestSha256
  ) {
    executableIssues.push("primary_build_manifest_hash_mismatch");
  }
  if (sha256(primary.bytes) !== input.policy.lanes.primary.executableSha256)
    executableIssues.push("primary_executable_hash_mismatch");
  if (
    sha256(independentSource.bytes) !==
    input.policy.lanes.independent.sourceSha256
  ) {
    executableIssues.push("independent_source_hash_mismatch");
  }
  if (
    sha256(independentBuildManifest.bytes) !==
    input.policy.lanes.independent.buildManifestSha256
  ) {
    executableIssues.push("independent_build_manifest_hash_mismatch");
  }
  if (
    sha256(independent.bytes) !==
    input.policy.lanes.independent.executableSha256
  ) {
    executableIssues.push("independent_executable_hash_mismatch");
  }
  if (executableIssues.length > 0) {
    throw new CasimirIndependentNumericalReplayAdmissionError(executableIssues);
  }

  const outputRoot = await requireFreshOutputRoot(input.outputRoot);
  const harnessInputPath = path.join(outputRoot, "sealed-input.json");
  const harnessOutputPath = path.join(outputRoot, "harness-output.json");
  await fs.writeFile(
    harnessInputPath,
    JSON.stringify({
      schema: "casimir.independent_numerical_harness.input.v1",
      request: input.request,
      policy: input.policy,
    }),
    { encoding: "utf8", flag: "wx" },
  );
  const runner = input.runner ?? runCasimirFormalLeanProcessV1;
  const observation = await runner({
    command: harness.absolutePath,
    args: [
      ...(input.policy.harness.launchMode === "node_script"
        ? [harnessSource.absolutePath]
        : []),
      "--casimir-input",
      harnessInputPath,
      "--casimir-output",
      harnessOutputPath,
      "--primary-executable",
      primary.absolutePath,
      "--independent-executable",
      independent.absolutePath,
    ],
    cwd: outputRoot,
    environment: {},
    timeoutMs: input.policy.execution.timeoutMs,
    maxOutputBytes: input.policy.execution.maxOutputBytes,
  });

  const blockers = processBlockers(observation);
  let output: CasimirIndependentNumericalHarnessOutputV1 | null = null;
  try {
    const outputBytes = await fs.readFile(harnessOutputPath);
    if (outputBytes.byteLength > input.policy.execution.maxOutputBytes) {
      blockers.push({
        code: "harness_result_size_limit_exceeded",
        message: "The harness result exceeded the pinned byte limit.",
        evidenceRefs: [],
      });
    } else {
      const parsed = harnessOutputSchema.safeParse(
        JSON.parse(
          new TextDecoder("utf-8", { fatal: true }).decode(outputBytes),
        ),
      );
      if (parsed.success) output = parsed.data;
      else
        blockers.push({
          code: "harness_result_schema_invalid",
          message: "The harness result did not satisfy the sealed protocol.",
          evidenceRefs: [],
        });
    }
  } catch {
    blockers.push({
      code: "harness_result_unreadable",
      message: "The harness did not produce a readable result.",
      evidenceRefs: [],
    });
  }

  if (
    output &&
    (output.requestArtifactSha256 !== input.request.artifactSha256 ||
      output.policyArtifactSha256 !== input.policy.artifactSha256)
  ) {
    blockers.push({
      code: "harness_result_binding_mismatch",
      message:
        "The harness result was not bound to the sealed request and policy.",
      evidenceRefs: [],
    });
  }

  const transcriptObservationSha256 = await computeCasimirSpecValueSha256V1({
    domain: "casimir-independent-numerical-outer-observation/v1",
    value: observation,
  });
  const emptySha = sha256("");
  const buildRun = (lane: "primary" | "independent") => {
    const expected = input.policy.lanes[lane];
    const observed = output?.runs[lane];
    if (observed && observed.implementationId !== expected.implementationId) {
      blockers.push({
        code: `${lane}_implementation_binding_mismatch`,
        message: `The ${lane} harness result named an unexpected implementation.`,
        evidenceRefs: [],
      });
    }
    const replays = observed?.replays ?? [];
    const manifestHashes = replays.map((replay) => replay.outputManifestSha256);
    return {
      implementationId: expected.implementationId,
      completedReplayCount: replays.length,
      byteIdentical:
        replays.length === 2 && manifestHashes[0] === manifestHashes[1],
      aggregateOutputManifestSha256:
        replays.length > 0 ? sha256(JSON.stringify(manifestHashes)) : emptySha,
      aggregateTranscriptSha256: sha256(
        JSON.stringify({
          outerObservationSha256: transcriptObservationSha256,
          replayTranscriptSha256: replays.map(
            (replay) => replay.transcriptSha256,
          ),
        }),
      ),
      refinementLevels:
        replays.length > 0
          ? Math.min(...replays.map((replay) => replay.refinementLevels))
          : 1,
    };
  };
  const runs = {
    primary: buildRun("primary"),
    independent: buildRun("independent"),
  };
  for (const lane of ["primary", "independent"] as const) {
    if (runs[lane].completedReplayCount !== 2)
      blockers.push({
        code: `${lane}_replay_count_incomplete`,
        message: `The ${lane} implementation did not complete two replays.`,
        evidenceRefs: [],
      });
    if (!runs[lane].byteIdentical)
      blockers.push({
        code: `${lane}_replay_not_byte_identical`,
        message: `The ${lane} implementation replays were not byte-identical.`,
        evidenceRefs: [],
      });
    if (
      runs[lane].refinementLevels <
      input.request.comparisonPolicy.minimumRefinementLevels
    ) {
      blockers.push({
        code: `${lane}_refinement_levels_insufficient`,
        message: `The ${lane} implementation did not satisfy refinement policy.`,
        evidenceRefs: [],
      });
    }
  }

  const measured = new Map(
    (output?.comparisons ?? []).map((entry) => [entry.observableId, entry]),
  );
  if (measured.size !== (output?.comparisons.length ?? 0)) {
    blockers.push({
      code: "comparison_observable_duplicate",
      message: "The harness repeated an observable comparison.",
      evidenceRefs: [],
    });
  }
  const tolerances = new Map(
    input.request.comparisonPolicy.tolerances.map((entry) => [
      entry.observableId,
      entry,
    ]),
  );
  const comparisons = [...input.request.frozenCase.observables]
    .sort((left, right) => left.observableId.localeCompare(right.observableId))
    .map((observable) => {
      const entry = measured.get(observable.observableId);
      const tolerance = tolerances.get(observable.observableId)!;
      if (!entry || entry.unit !== observable.unit) {
        blockers.push({
          code: `comparison_missing_or_unit_mismatch:${observable.observableId}`,
          message: `The requested ${observable.observableId} comparison is missing or has the wrong unit.`,
          evidenceRefs: [],
        });
      }
      const absoluteError = entry?.maximumAbsoluteError ?? 0;
      const relativeError = entry?.maximumRelativeError ?? 0;
      const order = entry?.observedConvergenceOrder ?? 0;
      return {
        observableId: observable.observableId,
        unit: observable.unit,
        maximumAbsoluteError: absoluteError,
        maximumRelativeError: relativeError,
        observedConvergenceOrder: order,
        absoluteTolerance: tolerance.absoluteTolerance,
        relativeTolerance: tolerance.relativeTolerance,
        withinTolerance:
          absoluteError <= tolerance.absoluteTolerance ||
          relativeError <= tolerance.relativeTolerance,
        convergenceSatisfied:
          order >= input.request.comparisonPolicy.minimumObservedOrder,
      };
    });
  for (const observableId of measured.keys()) {
    if (!tolerances.has(observableId))
      blockers.push({
        code: `comparison_observable_unrequested:${observableId}`,
        message: "The harness reported an unrequested observable.",
        evidenceRefs: [],
      });
  }
  blockers.push(...(output?.blockers ?? []));
  const sortedBlockers = [
    ...new Map(blockers.map((item) => [item.code, item])).values(),
  ]
    .map((item) => ({
      ...item,
      evidenceRefs: [...new Set(item.evidenceRefs)].sort(),
    }))
    .sort((left, right) => left.code.localeCompare(right.code));
  const passing =
    sortedBlockers.length === 0 &&
    comparisons.every(
      (entry) => entry.withinTolerance && entry.convergenceSatisfied,
    );
  if (!passing && sortedBlockers.length === 0) {
    sortedBlockers.push({
      code: "numerical_comparison_policy_failed",
      message:
        "At least one numerical comparison failed tolerance or convergence.",
      evidenceRefs: [],
    });
  }

  const certificate =
    await buildCasimirIndependentNumericalVerificationCertificateV1({
      generatedAt: input.generatedAt?.(),
      certificateId: `casimir-independent-numerical:${input.request.requestId}`,
      request: {
        schemaVersion: input.request.schemaVersion,
        requestId: input.request.requestId,
        artifactSha256: input.request.artifactSha256,
        casimirSpec: {
          semanticSha256: input.request.casimirSpec.semanticSha256,
          artifactSha256: input.request.casimirSpec.artifactSha256,
        },
        claimId: input.request.claim.claimId,
        propositionSha256: input.request.claim.propositionSha256,
        frozenCase: {
          caseId: input.request.frozenCase.caseId,
          inputsSha256: input.request.frozenCase.inputsSha256,
          meshSha256: input.request.frozenCase.meshSha256,
          initialConditionsSha256:
            input.request.frozenCase.initialConditionsSha256,
          boundaryConditionsSha256:
            input.request.frozenCase.boundaryConditionsSha256,
          observableIds: input.request.frozenCase.observables.map(
            (observable) => observable.observableId,
          ),
        },
      },
      status: passing ? "passed" : "failed",
      lineageAudit: {
        primaryLineageId: input.request.primaryImplementation.lineageId,
        independentLineageId: input.request.independentImplementation.lineageId,
        sourceDistinct:
          input.request.primaryImplementation.sourceSha256 !==
          input.request.independentImplementation.sourceSha256,
        buildManifestDistinct:
          input.request.primaryImplementation.buildManifestSha256 !==
          input.request.independentImplementation.buildManifestSha256,
        independenceEstablished:
          input.request.primaryImplementation.lineageId !==
            input.request.independentImplementation.lineageId &&
          input.request.primaryImplementation.sourceSha256 !==
            input.request.independentImplementation.sourceSha256 &&
          input.request.primaryImplementation.buildManifestSha256 !==
            input.request.independentImplementation.buildManifestSha256,
      },
      runs,
      comparisons,
      blockers: sortedBlockers,
    });
  const certificateIssues = [
    ...(await validateCasimirIndependentNumericalVerificationCertificateIntegrityV1(
      certificate,
    )),
    ...validateCasimirIndependentNumericalCertificateAgainstRequestV1(
      certificate,
      input.request,
    ),
  ];
  if (certificateIssues.length > 0) {
    throw new Error(
      `independent_numerical_certificate_invalid:${certificateIssues.join(";")}`,
    );
  }
  return certificate;
}
